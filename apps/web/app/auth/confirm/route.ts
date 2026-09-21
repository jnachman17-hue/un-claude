import { NextRequest, NextResponse } from 'next/server';

import { createAuthCallbackService } from '@kit/supabase/auth';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import pathsConfig from '~/config/paths.config';
import { withWelcome } from '../welcome';

/**
 * Where the confirmation link in a sign-up email comes back to.
 *
 * The destination is the tool rather than the wallet since 21 August 2026;
 * see `afterAuth` in config/paths.config.ts. A `next` carried on the link
 * (the buyer's return to /pricing, 04 entry 166) wins over it, and only the
 * plain tool arrival is marked with the welcome flag.
 */
export async function GET(request: NextRequest) {
  const service = createAuthCallbackService(getSupabaseServerClient());

  const url = await service.verifyTokenHash(request, {
    redirectPath: pathsConfig.app.afterAuth,
  });

  return NextResponse.redirect(withWelcome(url));
}
