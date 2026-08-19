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

export async function POST(request: Request) {
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

  const result = await scan({ file, name: typeof name === 'string' ? name : 'paste.txt' });

  return Response.json(result, { status: result.ok ? 200 : 400 });
}
