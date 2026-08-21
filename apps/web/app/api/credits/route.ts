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

  // Read the guest cookie BEFORE granting, so a real account that is continuing
  // a guest session (a conversion) can be told not to pay the welcome grant a
  // second time. security-audit.md finding 2.
  const cookieStore = await cookies();
  const guestId = cookieStore.get(GUEST_COOKIE)?.value;
  const hasGuest =
    !!guestId && /^[0-9a-f-]{36}$/.test(guestId) && guestId !== user.id;
  const isConversion = !isAnonymous && hasGuest;

  await ensureGrants({
    id: user.id,
    isAnonymous,
    email: user.email,
    isConversion,
    ip: clientIp(request),
  });

  if (!isAnonymous && hasGuest) {
    await mergeGuestInto(guestId!, user.id);
    cookieStore.delete(GUEST_COOKIE);
  }

  const balance = await getBalance(user.id);

  return Response.json({ ok: true, balance, isAnonymous });
}
