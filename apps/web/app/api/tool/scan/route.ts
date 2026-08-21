/**
 * POST /api/tool/scan
 *
 * The browser's only way to reach the engine's scan. This handler adds the
 * shared key server side, so the key never exists in anything sent to a browser.
 *
 * Deliberately NOT at /api/scan: that path belongs to the Python function in
 * apps/web/api/scan.py, which is the thing this proxies to.
 */
import { scan } from '~/lib/engine/client';
import { clientIp, rateLimit } from '~/lib/server/rate-limit';

/**
 * Free, no-login scan: ~20 requests per minute per IP. security-audit.md
 * finding 4. This is the endpoint the (now-capped) PNG bomb travelled through,
 * so a volume limit here matters even though the scan itself is free and calls
 * no paid model.
 *
 * SHARED-IP CAVEAT, stated plainly (security-fixes.md): scan is sessionless, so
 * the only key available is the IP, and a whole campus or office is one IP. 20
 * a minute comfortably covers one real person scanning a handful of documents,
 * but a large lecture hall all scanning at once could brush this ceiling. It is
 * a deliberately generous DoS backstop, not a tight quota; the number is this
 * one constant so it is easy to raise if real shared-IP traffic hits it.
 */
const SCAN_PER_MINUTE = 20;

export async function POST(request: Request) {
  if (!(await rateLimit(`scan:ip:${clientIp(request)}`, SCAN_PER_MINUTE, 60))) {
    return Response.json(
      {
        ok: false,
        code: 'rate_limited',
        message: 'You are going a little fast. Wait a moment and try again.',
      },
      { status: 429 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, code: 'bad_json', message: 'That request could not be read. Please try again.' },
      { status: 400 },
    );
  }

  const { file, name } = (body ?? {}) as { file?: string; name?: string };

  if (typeof file !== 'string' || file.length === 0) {
    return Response.json(
      { ok: false, code: 'no_file', message: 'Nothing was sent. Paste some text or choose a file.' },
      { status: 400 },
    );
  }

  // The engine caps uploads at 5 MB; refuse anything over the cap before it
  // costs a round trip. Base64 inflates by 4/3, so 7.5M chars is ~5.5 MB.
  if (file.length > 7_500_000) {
    return Response.json(
      { ok: false, code: 'too_large', message: 'That file is over the 5 MB limit. Try a smaller one.' },
      { status: 413 },
    );
  }

  const result = await scan({ file, name: typeof name === 'string' ? name : 'paste.txt' });

  return Response.json(result, { status: result.ok ? 200 : 400 });
}
