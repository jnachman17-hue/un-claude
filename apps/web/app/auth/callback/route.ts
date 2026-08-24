import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';

import { safeNextPath } from '@kit/auth/safe-next';
import { createAuthCallbackService } from '@kit/supabase/auth';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import pathsConfig from '~/config/paths.config';
import { withWelcome } from '../welcome';

/**
 * Where an OAuth provider and a magic link come back to.
 *
 * The destination is the tool rather than the wallet since 21 August 2026;
 * see `afterAuth` in config/paths.config.ts. `withWelcome` marks the arrival
 * so the tool can confirm the balance that is now sitting in the account,
 * which is the whole reason for sending them here rather than to a ledger.
 *
 * `safeNextPath` is the close on the open redirect (Lane E, S-1): the
 * destination that comes back out of the service is attacker-controllable
 * through the `next` query parameter, so it is only allowed to be a path on
 * this site. See `packages/features/auth/src/safe-next.ts` for what was reproduced
 * and why.
 */
export async function GET(request: NextRequest) {
  const service = createAuthCallbackService(getSupabaseServerClient());

  const { nextPath } = await service.exchangeCodeForSession(request, {
    redirectPath: pathsConfig.app.afterAuth,
  });

  const destination = safeNextPath(nextPath, pathsConfig.app.afterAuth);

  return redirect(withWelcome(destination));
}
