import type { NextRequest } from 'next/server';
import { NextResponse, URLPattern } from 'next/server';

import { checkRequiresMultiFactorAuthentication } from '@kit/supabase/check-requires-mfa';
import { createMiddlewareClient } from '@kit/supabase/middleware-client';

import pathsConfig from '~/config/paths.config';

const NEXT_ACTION_HEADER = 'next-action';

/**
 * `favicon.ico` was added to this list on 23 August 2026, Lane E item S-4.
 *
 * The root `/favicon.ico` returned 404 and **97 of every 100 lines in the
 * production log were that one request**, which is why nothing else in the log
 * could be read. The file now exists in `public/`, but a file existing is only
 * half of it: without this exclusion the proxy still runs on every request for
 * it, so every browser asking for an icon wakes a server function, is logged,
 * and is charged for. Excluded here, it is served straight off the static
 * layer and never appears in the function log at all.
 *
 * Nothing in the proxy ever wanted to see an icon request: neither URL pattern
 * below matches it, so this changes no behaviour beyond where it is served
 * from.
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|images|locales|assets|favicon.ico|api/*).*)',
  ],
};

const getUser = (request: NextRequest, response: NextResponse) => {
  const supabase = createMiddlewareClient(request, response);

  return supabase.auth.getClaims();
};

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // set a unique request ID for each request
  // this helps us log and trace requests
  setRequestId(request);

  // handle patterns for specific routes
  const handlePattern = matchUrlPattern(request.url);

  // if a pattern handler exists, call it
  if (handlePattern) {
    const patternHandlerResponse = await handlePattern(request, response);

    // if a pattern handler returns a response, return it
    if (patternHandlerResponse) {
      return patternHandlerResponse;
    }
  }

  // append the action path to the request headers
  // which is useful for knowing the action path in server actions
  if (isServerAction(request)) {
    response.headers.set('x-action-path', request.nextUrl.pathname);
  }

  // if no pattern handler returned a response,
  // return the session response
  return response;
}

function isServerAction(request: NextRequest) {
  const headers = new Headers(request.headers);

  return headers.has(NEXT_ACTION_HEADER);
}
/**
 * Define URL patterns and their corresponding handlers.
 */
function getPatterns() {
  return [
    {
      pattern: new URLPattern({ pathname: '/auth/*?' }),
      handler: async (req: NextRequest, res: NextResponse) => {
        const { data } = await getUser(req, res);

        // A guest is not a signed-in user for the purposes of these pages.
        //
        // Every visitor who uses the tool is given an anonymous Supabase
        // session, because the free credits have to be held somewhere. That
        // session carries claims, so the original check counted it as logged
        // in and redirected it to /home -- which refuses anonymous users and
        // renders "sign in to see your credit balance".
        //
        // The result was a closed loop: the moment someone tried the product,
        // they could never reach the sign-up form again. That is exactly the
        // moment they are most likely to want an account, so this was costing
        // every conversion the free credits were meant to earn.
        const isGuest = data?.claims?.is_anonymous === true;

        // the user is logged out, or is only a guest, so let them through
        if (!data?.claims || isGuest) {
          return;
        }

        // check if we need to verify MFA (user is authenticated but needs to verify MFA)
        const isVerifyMfa = req.nextUrl.pathname === pathsConfig.auth.verifyMfa;

        // If user is logged in and does not need to verify MFA, send them
        // where signing in sends everybody: the tool, not the wallet.
        // See `afterAuth` in config/paths.config.ts.
        if (!isVerifyMfa) {
          return NextResponse.redirect(
            new URL(pathsConfig.app.afterAuth, req.nextUrl.origin).href,
          );
        }
      },
    },
    {
      pattern: new URLPattern({ pathname: '/home/*?' }),
      handler: async (req: NextRequest, res: NextResponse) => {
        const { data } = await getUser(req, res);

        const origin = req.nextUrl.origin;
        const next = req.nextUrl.pathname;

        // If the visitor is signed out, or is only an anonymous guest, send
        // them to sign in. A guest who reached the wallet used to be shown a
        // dead "sign in to see your credit balance" line with nothing to
        // click; the same answer, made usable.
        if (!data?.claims || data.claims.is_anonymous === true) {
          const signIn = pathsConfig.auth.signIn;
          const redirectPath = `${signIn}?next=${next}`;

          return NextResponse.redirect(new URL(redirectPath, origin).href);
        }

        const supabase = createMiddlewareClient(req, res);

        const requiresMultiFactorAuthentication =
          await checkRequiresMultiFactorAuthentication(supabase);

        // If user requires multi-factor authentication, redirect to MFA page.
        if (requiresMultiFactorAuthentication) {
          return NextResponse.redirect(
            new URL(pathsConfig.auth.verifyMfa, origin).href,
          );
        }
      },
    },
  ];
}

/**
 * Match URL patterns to specific handlers.
 * @param url
 */
function matchUrlPattern(url: string) {
  const patterns = getPatterns();
  const input = url.split('?')[0];

  for (const pattern of patterns) {
    const patternResult = pattern.pattern.exec(input);

    if (patternResult !== null && 'pathname' in patternResult) {
      return pattern.handler;
    }
  }
}

/**
 * Set a unique request ID for each request.
 * @param request
 */
function setRequestId(request: Request) {
  request.headers.set('x-correlation-id', crypto.randomUUID());
}
