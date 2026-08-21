import 'server-only';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

/**
 * Rate limiting for the API routes. security-audit.md finding 4.
 *
 * proxy.ts excludes /api/* from the middleware, so there is no site-wide place
 * a limit can live; each route asks for one here. The counting happens in
 * Postgres (migration 20260821120200_rate_limits.sql) via the rate_limit_hit
 * function — no new service and no new dependency, which CLAUDE.md §5 requires.
 *
 * FAILS OPEN ON PURPOSE. If the limiter itself errors (the service key is
 * missing, the database is briefly unreachable), a request is ALLOWED rather
 * than refused. A rate limiter is a backstop against abuse; it must never be the
 * thing that takes the free tool down for everyone. The error is logged so a
 * broken limiter is visible, not silent.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function admin() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getSupabaseServerAdminClient<any>();
}

/**
 * Record one call against `key` and return whether it is allowed.
 *
 * @param key   a stable bucket, e.g. `scan:ip:1.2.3.4` or `clean:acct:<uuid>`
 * @param limit max calls permitted within the window
 * @param windowSeconds length of the fixed window
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  try {
    const { data, error } = await admin().rpc('rate_limit_hit', {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      console.error(`rate_limit_hit failed for ${key}: ${error.message}`);
      return true; // fail open
    }

    return data === true;
  } catch (err) {
    console.error(
      `rate_limit_hit threw for ${key}: ${err instanceof Error ? err.message : String(err)}`,
    );
    return true; // fail open
  }
}

/**
 * The caller's IP, for per-IP limits. On Vercel the real client address is the
 * first entry of `x-forwarded-for`; the others are proxies. Falls back through
 * the platform's own headers, then to a constant so a missing header buckets
 * everyone together rather than throwing.
 *
 * NOTE ON SHARED IPs: a whole campus or office is one IP. Per-IP limits are a
 * blunt instrument for this product's student audience — see security-fixes.md.
 * Keep per-IP limits generous; prefer per-account limits where an account
 * exists.
 */
export function clientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  return (
    request.headers.get('x-real-ip')?.trim() ||
    request.headers.get('x-vercel-forwarded-for')?.trim() ||
    'unknown'
  );
}
