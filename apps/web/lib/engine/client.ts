/**
 * The only place in the site that talks to the engine.
 *
 * SERVER ONLY. This module reads UC_ENGINE_KEY, the shared password the engine
 * refuses to work without. The variable is deliberately NOT prefixed with
 * NEXT_PUBLIC_, which is what guarantees Next.js never ships it to a browser.
 *
 * The rule this exists to enforce: the browser NEVER calls the engine directly.
 * Browser -> our own route handler -> engine. If a component ever fetches
 * /api/scan or /api/clean from the client, the key has to travel with it and the
 * whole lock is undone.
 */
import type { CleanResult, EngineFailure, EngineResult, ScanResult } from './types';

/**
 * Where the engine lives. Defaults to production, which is where it actually
 * runs. Local Next development therefore talks to the live engine: scanning is
 * free and instant, so this costs nothing and needs no local Python.
 */
const ENGINE_URL = process.env.UC_ENGINE_URL ?? 'https://un-claude.com';

/**
 * Read at request time, never at module load.
 *
 * A value read once when this file is first evaluated can be frozen in at build
 * time, and a variable marked Sensitive on Vercel is not necessarily readable
 * during a build at all. Either way the deployment would come up holding an empty
 * key and refuse every request, while the dashboard showed the setting present
 * and correct. This project has already learned three times that a correct
 * setting is not a loaded one.
 */
function engineKey(): string {
  // Trimmed for the same reason the engine trims: a secret pasted with a
  // trailing newline is invisible in a dashboard and fatal over HTTP.
  return (process.env.UC_ENGINE_KEY ?? '').trim();
}

/**
 * The two deployments answer on different paths and this has already misled one
 * session. Production is /api/scan and /api/clean, the Vercel functions in
 * apps/web/api. The engine's own standalone server, used for local development,
 * is /inspect and /clean. API.md documents only the second and calls it the
 * production contract, which is wrong. Both are configurable so neither is
 * hardcoded into a component.
 */
const SCAN_PATH = process.env.UC_ENGINE_SCAN_PATH ?? '/api/scan';
const CLEAN_PATH = process.env.UC_ENGINE_CLEAN_PATH ?? '/api/clean';

/**
 * Our own messages, a closed set. Raw upstream error text is never shown to a
 * user, which is the practice from 04 entry 15 and the fix for the defect open
 * as 06 row 13.
 */
const MESSAGES: Record<string, string> = {
  bad_json: 'That request could not be read. Please try again.',
  no_file: 'Nothing was sent. Paste some text or choose a file.',
  bad_base64: 'That file could not be read.',
  too_large: 'That file is larger than 5 MB. Try a smaller one.',
  bad_format: 'That file type is not supported. Use text, a Word document, PNG or JPG.',
  layer_b_failed: 'The rewrite could not be completed. Nothing was charged. Please try again.',
  engine_error: 'Something went wrong. Nothing was charged.',
  unauthorised: 'Something went wrong. Nothing was charged.',
  unreachable: 'We could not reach the service. Please try again in a moment.',
  misconfigured: 'The service is not available right now.',
};

function failure(code: string): EngineFailure {
  return {
    ok: false,
    code,
    message: MESSAGES[code] ?? 'Something went wrong. Nothing was charged.',
  };
}

/** Turn any text or file into the shape the engine takes. API.md section 2. */
export function toPayload(bytes: Uint8Array, name: string) {
  return { file: Buffer.from(bytes).toString('base64'), name };
}

export function textToPayload(text: string) {
  return toPayload(new TextEncoder().encode(text), 'paste.txt');
}

async function call<T>(path: string, body: unknown, timeoutMs: number): Promise<EngineResult<T>> {
  // Fail loudly rather than silently calling an unlocked endpoint. A missing key
  // in production is a configuration failure, not something to work around.
  const key = engineKey();

  if (!key && process.env.VERCEL_ENV === 'production') {
    console.error('UC_ENGINE_KEY is not readable by the site. The engine cannot be called.');
    return failure('misconfigured');
  }

  if (process.env.VERCEL_ENV === 'production') {
    // Length only, never the value. If the engine reports a different number the
    // two halves are reading different things.
    console.log(`engine call: key length ${key.length}`);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${ENGINE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-uc-key': key },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    });

    const data = (await response.json()) as Record<string, unknown>;

    if (data?.ok === true) {
      return data as T;
    }

    // The engine sends its own code. Map it to our sentence, never pass its text.
    return failure(typeof data?.code === 'string' ? data.code : 'engine_error');
  } catch {
    return failure('unreachable');
  } finally {
    clearTimeout(timer);
  }
}

/** What is hidden in this. Read only, free, about 40ms. */
export function scan(payload: { file: string; name: string }) {
  return call<ScanResult>(SCAN_PATH, payload, 20_000);
}

/**
 * Take it out.
 *
 * Without options this is layer A plus metadata: instant, no model call, free.
 * With layer_b it also rewrites, which costs money and takes 6 to 22 seconds.
 */
export function clean(
  payload: { file: string; name: string },
  options: { layer_b?: boolean } = {},
) {
  const slow = options.layer_b === true;
  return call<CleanResult>(CLEAN_PATH, { ...payload, options }, slow ? 120_000 : 20_000);
}
