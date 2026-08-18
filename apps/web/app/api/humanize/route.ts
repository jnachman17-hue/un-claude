/**
 * MOCK. This is not the rewriting engine and contains no model call.
 *
 * It exists so the interface can be built and verified against a realistic
 * response before the real engine lands. The engine is a separate workstream.
 * When it arrives, replace `mockRewrite` below and delete this notice. Nothing
 * else in this file should need to change, because the contract it speaks lives
 * in `~/lib/humanize-contract`.
 *
 * Two deliberate choices worth keeping when the real engine replaces this:
 *
 * It streams. A real rewrite takes tens of seconds, and a client written to
 * await one complete JSON object has to be rebuilt to consume a stream later.
 *
 * It is slow and can be made to fail on demand. A fast, always successful mock
 * produces an interface that only works on the happy path.
 */

import {
  ERROR_MESSAGES,
  type HumanizeErrorCode,
  type HumanizeFrame,
  HumanizeRequestSchema,
  MAX_WORDS_PER_REQUEST,
  type SentenceChange,
} from '~/lib/humanize-contract';
import { analyze, countWords, splitSentences } from '~/lib/text-analysis';

/**
 * Ceiling for a single rewrite. The mock never approaches this, but a real
 * engine on a long document will, and the limit belongs with the route rather
 * than being discovered in production.
 */
export const maxDuration = 60;

/** Total time the mock spends pretending to think, unless overridden. */
const DEFAULT_DELAY_MS = 8_000;

/** Openers and filler that read as machine written. Removed wholesale. */
const ROBOTIC_OPENERS = [
  'It is important to note that',
  'It is worth noting that',
  'It should be noted that',
  'It is essential to understand that',
  'Furthermore,',
  'Moreover,',
  'Additionally,',
  'In conclusion,',
  'Ultimately,',
  'In summary,',
  'Notably,',
  'Importantly,',
  'That being said,',
  'In today’s fast-paced world,',
  "In today's fast-paced world,",
  'In the realm of',
  'When it comes to',
];

/** Inflated phrasing, paired with what a person would actually write. */
const PLAINER: Array<[RegExp, string]> = [
  [/\bdelve into\b/gi, 'look at'],
  [/\bleverage\b/gi, 'use'],
  [/\butilize\b/gi, 'use'],
  [/\bfacilitate\b/gi, 'help'],
  [/\bnavigate the complexities of\b/gi, 'handle'],
  [/\ba testament to\b/gi, 'proof of'],
  [/\bplays a (?:crucial|vital|key|pivotal) role in\b/gi, 'matters for'],
  [/\bin order to\b/gi, 'to'],
  [/\bdue to the fact that\b/gi, 'because'],
  [/\bat this point in time\b/gi, 'now'],
  [/\ba wide range of\b/gi, 'many'],
  [/\bseamlessly\b/gi, ''],
  [/\brobust\b/gi, 'solid'],
  [/\bcutting-edge\b/gi, 'new'],
  [/\bever-evolving\b/gi, 'changing'],
];

function tidy(text: string): string {
  return text
    .replace(/\s+([,.!?;:])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function capitalise(text: string): string {
  if (text.length === 0) {
    return text;
  }

  return text[0]!.toUpperCase() + text.slice(1);
}

/**
 * Stand in for the engine.
 *
 * Does three things that a humanizer genuinely should, chosen so the metrics
 * panel and the highlight toggle can be verified against real movement rather
 * than invented numbers: it strips machine sounding openers and inflated
 * phrasing, it removes em and en dashes, and it varies sentence length by
 * splitting some sentences and clipping others.
 *
 * Deterministic by sentence index rather than random, so the same input always
 * produces the same output and a failure can be reproduced.
 */
function mockRewrite(text: string): {
  rewritten: string;
  changes: SentenceChange[];
} {
  const sentences = splitSentences(text);
  const changes: SentenceChange[] = [];
  const output: string[] = [];

  sentences.forEach((original, index) => {
    let working = original;

    for (const opener of ROBOTIC_OPENERS) {
      if (working.toLowerCase().startsWith(opener.toLowerCase())) {
        working = capitalise(working.slice(opener.length).trim());
        break;
      }
    }

    // Compress alternate sentences only.
    //
    // Measured, not guessed. Applying these to every sentence pulls them all
    // toward the same short length, which drops sentence variation from 30.5%
    // to 20.8% on the test passage: the rhythm gets more uniform, which is the
    // opposite of humanizing. Leaving every other sentence long preserves the
    // contrast and lifts variation to 32.9% instead.
    if (index % 2 === 0) {
      for (const [pattern, replacement] of PLAINER) {
        working = working.replace(pattern, replacement);
      }
    }

    // Em and en dashes are among the most reliable machine tells, and this
    // project bans them in its own writing for the same reason.
    working = working.replace(/\s*[—–]\s*/g, ', ');

    working = tidy(working);

    // Break genuinely long sentences at a joining clause. The 40 character
    // floor keeps this off short sentences, where splitting would flatten the
    // rhythm rather than vary it.
    const joint = working.match(
      /^(.{40,}?),\s+(?:and|but|which|while|although)\s+(.+)$/i,
    );

    if (joint?.[1] && joint[2]) {
      working = `${tidy(joint[1])}. ${capitalise(tidy(joint[2]))}`;
    }

    if (working !== original) {
      changes.push({ original, rewritten: working });
    }

    output.push(working);
  });

  return { rewritten: output.join(' '), changes };
}

function frame(value: HumanizeFrame): string {
  return `${JSON.stringify(value)}\n`;
}

function errorResponse(code: HumanizeErrorCode, status: number): Response {
  return new Response(
    frame({ type: 'error', code, message: ERROR_MESSAGES[code] }),
    {
      status,
      headers: { 'content-type': 'application/x-ndjson' },
    },
  );
}

export async function POST(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // Test hooks. Harmless in production, and the reason the error states could
  // be designed against something real rather than imagined.
  const simulate = url.searchParams.get('simulate') as HumanizeErrorCode | null;
  const delayMs = Number(url.searchParams.get('delay') ?? DEFAULT_DELAY_MS);

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse('empty_input', 400);
  }

  const parsed = HumanizeRequestSchema.safeParse(body);

  if (!parsed.success) {
    const isTone = parsed.error.issues.some(
      (issue) => issue.path[0] === 'tone',
    );

    return errorResponse(isTone ? 'invalid_tone' : 'empty_input', 400);
  }

  const { text } = parsed.data;
  const wordsBilled = countWords(text);

  if (wordsBilled === 0) {
    return errorResponse('empty_input', 400);
  }

  if (wordsBilled > MAX_WORDS_PER_REQUEST) {
    return errorResponse('too_long', 413);
  }

  if (simulate === 'rate_limited') {
    return errorResponse('rate_limited', 429);
  }

  const { rewritten, changes } = mockRewrite(text);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (value: HumanizeFrame) =>
        controller.enqueue(encoder.encode(frame(value)));

      const pieces = rewritten.match(/\S+\s*/g) ?? [];
      const perPiece = pieces.length > 0 ? delayMs / pieces.length : 0;

      try {
        for (let index = 0; index < pieces.length; index++) {
          // Fail partway through, so the interface is exercised against a
          // stream that dies mid flight rather than one that fails cleanly
          // before any output arrives.
          if (
            (simulate === 'engine_failed' || simulate === 'engine_timeout') &&
            index > pieces.length / 3
          ) {
            send({
              type: 'error',
              code: simulate,
              message: ERROR_MESSAGES[simulate],
            });

            // Return, do not close here. The `finally` below is the single
            // closer; closing twice throws "Controller is already closed" and
            // the error frame never reaches the client.
            return;
          }

          if (perPiece > 0) {
            await new Promise((resolve) => setTimeout(resolve, perPiece));
          }

          send({ type: 'chunk', text: pieces[index]! });
        }

        send({
          type: 'result',
          before: analyze(text),
          after: analyze(rewritten),
          changes,
          wordsBilled,
        });
      } catch {
        send({
          type: 'error',
          code: 'engine_failed',
          message: ERROR_MESSAGES.engine_failed,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'application/x-ndjson',
      'cache-control': 'no-store',
    },
  });
}
