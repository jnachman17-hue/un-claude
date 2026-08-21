/**
 * GET /api/credits
 *
 * The one place the interface learns what an account holds. 04 entry 97.
 *
 * Three jobs on every call, all idempotent, so the client never has to
 * sequence anything:
 *
 *   1. Grants. Whoever is asking gets whatever they are entitled to and do
 *      not yet hold: the welcome for anyone, the signup grant for a real
 *      account. Self-healing by design: however an account came to exist
 *      (password form, Google, a conversion), its first balance check makes
 *      it whole.
 *   2. The guest merge. If a real account asks while the browser still holds
 *      the guest cookie from its signed-out life, the guest's remaining
 *      credits move over and the cookie is cleared. This is what makes
 *      "your credits follow you" true without touching any auth flow.
 *      It runs BEFORE the grants, and its idempotency is enforced by the
 *      database, not by this route: guest-merge-double-runs.md.
 *   3. The answer: balance and whether the session is anonymous.
 *
 * No session is not an error. A fresh visitor has no account until their
 * first sanitise, and the interface shows the static welcome figure; this
 * route just says so.
 */
import { cookies } from 'next/headers';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import {
  WELCOME_CREDITS,
  ensureGrants,
  getBalance,
  hasConverted,
  mergeGuestInto,
} from '~/lib/server/credits';
import { clientIp } from '~/lib/server/rate-limit';

/** Where the signed-out browser remembers which guest account is its. */
const GUEST_COOKIE = 'uc-guest';

export async function GET(request: Request) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({
      ok: true,
      balance: null,
      isAnonymous: true,
      welcome: WELCOME_CREDITS,
    });
  }

  const isAnonymous = user.is_anonymous === true;

  const cookieStore = await cookies();
  const guestId = cookieStore.get(GUEST_COOKIE)?.value;
  const hasGuest =
    !!guestId && /^[0-9a-f-]{36}$/.test(guestId) && guestId !== user.id;

  /*
   * THE MERGE RUNS FIRST, AND THAT ORDER IS THE FIX. 21 August 2026.
   *
   * It used to run second, after the grants, because the grants needed to know
   * whether this was a conversion and the only thing that knew was the guest
   * cookie — which this route then deleted. So the fact survived exactly one
   * request. Every later balance check saw no cookie, concluded "not a
   * conversion", and paid the welcome grant that had just been correctly
   * withheld. An account reached 7 credits against a ratified 5.
   *
   * Merging first writes a permanent conversion record, so the grant decision
   * below can read a fact instead of a disappearing one.
   *
   * guest-merge-double-runs.md, defect 2.
   */
  let cookieSaysConversion = false;

  if (!isAnonymous && hasGuest) {
    const moved = await mergeGuestInto(guestId!, user.id);

    if (moved === null) {
      // The migration has not been run, so nothing moved and no record was
      // written. Keep the cookie — it is the only evidence left, both for the
      // grant decision on this request and for the merge on a later one.
      cookieSaysConversion = true;
    } else {
      // Cleared only on a merge that actually completed. A stale cookie
      // pointing at a guest that no longer exists returns 0 and is cleared
      // here, which correctly lets a genuine cold signup keep its welcome
      // grant instead of being mistaken for a conversion for ever.
      cookieStore.delete(GUEST_COOKIE);
    }
  }

  const isConversion =
    !isAnonymous && (cookieSaysConversion || (await hasConverted(user.id)));

  await ensureGrants({
    id: user.id,
    isAnonymous,
    email: user.email,
    isConversion,
    ip: clientIp(request),
  });

  const balance = await getBalance(user.id);

  return Response.json({ ok: true, balance, isAnonymous });
}
