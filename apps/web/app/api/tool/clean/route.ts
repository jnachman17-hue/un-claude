/**
 * POST /api/tool/clean
 *
 * The browser's only way to reach the engine's clean. Adds the shared key
 * server side. See the scan route for why this is not at /api/clean.
 *
 * Layer B takes 6 to 22 seconds and costs money per run, so it is the one call
 * in the product that has to be gated. That gate is not built yet.
 */
import { clean } from '~/lib/engine/client';

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

  const { file, name, layer_b } = (body ?? {}) as {
    file?: string;
    name?: string;
    layer_b?: boolean;
  };

  if (typeof file !== 'string' || file.length === 0) {
    return Response.json(
      { ok: false, code: 'no_file', message: 'Nothing was sent. Paste some text or choose a file.' },
      { status: 400 },
    );
  }

  const result = await clean(
    { file, name: typeof name === 'string' ? name : 'paste.txt' },
    { layer_b: layer_b === true },
  );

  return Response.json(result, { status: result.ok ? 200 : 400 });
}
