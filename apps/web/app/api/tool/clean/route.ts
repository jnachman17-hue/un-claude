/**
 * POST /api/tool/clean
 *
 * The browser's only way to reach the engine's clean. Adds the shared key
 * server side. See the scan route for why this is not at /api/clean.
 */
import { clean } from '~/lib/engine/client';
import { buildReceipt } from '~/lib/engine/receipt';

/**
 * Layer B costs real money on every single run and the credit gate that has to
 * sit in front of it does not exist yet. 06 rows 37 and 38.
 *
 * So it is OFF in production unless somebody deliberately turns it on, and on
 * everywhere else. Deploying this file cannot start a bill on its own.
 */
function layerBAllowed(): boolean {
  // Trimmed and lowercased. A value set from a shell without care arrives as
  // "true\n", which does not equal "true", and the flag would silently do the
  // opposite of what was intended with nothing to show why. Same failure that
  // broke the engine key, so it is closed here before it happens.
  const flag = (process.env.UC_ENABLE_LAYER_B ?? '').trim().toLowerCase();
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return process.env.VERCEL_ENV !== 'production';
}

function fail(code: string, message: string, status = 400) {
  return Response.json({ ok: false, code, message }, { status });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return fail('bad_json', 'That request could not be read. Please try again.');
  }

  const { file, name, layer_b } = (body ?? {}) as {
    file?: string;
    name?: string;
    layer_b?: boolean;
  };

  if (typeof file !== 'string' || file.length === 0) {
    return fail('no_file', 'Nothing was sent. Paste some text or choose a file.');
  }

  const wantsRewrite = layer_b === true;

  if (wantsRewrite && !layerBAllowed()) {
    return fail(
      'layer_b_unavailable',
      'The rewrite is not switched on yet. Everything else ran.',
      503,
    );
  }

  const result = await clean(
    { file, name: typeof name === 'string' ? name : 'paste.txt' },
    { layer_b: wantsRewrite },
  );

  if (!result.ok) {
    return Response.json(result, { status: 400 });
  }

  /**
   * The receipt is computed here rather than in the engine, because it is a
   * comparison of two texts we already hold and it needs no model call, no
   * network and no cost. It describes what the rewrite DID. It is never a
   * measure of whether the watermark went, because nobody can measure that.
   */
  if (wantsRewrite && result.report?.layer_b) {
    try {
      const before = Buffer.from(file, 'base64').toString('utf8');
      const after = Buffer.from(result.cleaned, 'base64').toString('utf8');

      (result.report as Record<string, unknown>).receipt = buildReceipt(
        before,
        after,
        result.report.layer_b.figures_to_check ?? [],
      );
    } catch {
      // A missing receipt is a missing receipt. It must never fail the request
      // for work the engine already did and the user is waiting on.
    }
  }

  return Response.json(result, { status: 200 });
}
