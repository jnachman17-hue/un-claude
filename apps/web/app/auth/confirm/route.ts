import { NextRequest, NextResponse } from 'next/server';

import { createAuthCallbackService } from '@kit/supabase/auth';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import pathsConfig from '~/config/paths.config';
import { withWelcome } from '../welcome';

/**
 * Where the confirmation link in a sign-up email comes back to.
 *
 * For most new accounts this is the arrival that matters: it is the first
 * moment the signup grant exists and the first moment there is anything to
 * show them. The destination is the tool rather than the wallet since
 * 21 August 2026; see `afterAuth` in config/paths.config.ts.
 */
export async function GET(request: NextRequest) {
  const service = createAuthCallbackService(getSupabaseServerClient());

  const url = await service.verifyTokenHash(request, {
    redirectPath: pathsConfig.app.afterAuth,
  });

  return NextResponse.redirect(withWelcome(url));
}
