/**
 * The contract between the user interface and the rewriting engine.
 *
 * The engine is a separate workstream. This file is the agreed boundary between
 * the two, and it is the only place the shape lives. Both sides import from
 * here, so the interface cannot drift without the type check failing.
 *
 * Transport is newline delimited JSON over a streaming response. The client
 * reads frames as they arrive rather than waiting for a whole document, because
 * a real rewrite of a long text takes tens of seconds and a user staring at a
 * spinner for that long assumes the page has hung.
 */

import { z } from 'zod';

import type { TextMetrics } from './text-analysis';

/** Longest text accepted in a single rewrite. */
export const MAX_WORDS_PER_REQUEST = 5_000;

/**
 * Words a signed out visitor may spend before being asked to register.
 *
 * Deliberately a plain constant so it can be tuned after launch by editing one
 * number. Not yet enforced: enforcement needs per visitor accounting, which
 * arrives with credits.
 */
export const FREE_WORD_ALLOWANCE = 500;

export const TONES = ['neutral', 'casual', 'professional', 'academic'] as const;

export type Tone = (typeof TONES)[number];

export const HumanizeRequestSchema = z.object({
  text: z.string().min(1, 'Enter some text to rewrite.'),
  tone: z.enum(TONES).default('neutral'),
});

export type HumanizeRequest = z.infer<typeof HumanizeRequestSchema>;

/**
 * Every failure the client knows how to render.
 *
 * An open ended error string would put raw upstream text in front of a user,
 * which is the defect already found and logged in the kit's auth alert. A fixed
 * set means the interface can always say something a person understands.
 */
export type HumanizeErrorCode =
  | 'empty_input'
  | 'too_long'
  | 'invalid_tone'
  | 'rate_limited'
  | 'engine_failed'
  | 'engine_timeout';

/** One sentence that was rewritten, paired with what it replaced. */
export interface SentenceChange {
  original: string;
  rewritten: string;
}

/**
 * A frame in the response stream.
 *
 * Order is: any number of `chunk` frames, then exactly one terminal frame,
 * either `result` or `error`. The client should treat the arrival of a terminal
 * frame as the end of the exchange.
 */
export type HumanizeFrame =
  | { type: 'chunk'; text: string }
  | {
      type: 'result';
      /** Measurements of what came in and what went out, for the panel. */
      before: TextMetrics;
      after: TextMetrics;
      /** Sentence pairs powering the highlight toggle. */
      changes: SentenceChange[];
      /** Words billed for this rewrite. Always the input count. */
      wordsBilled: number;
    }
  | { type: 'error'; code: HumanizeErrorCode; message: string };

/** Messages shown to users. Kept here so the wording is reviewed in one place. */
export const ERROR_MESSAGES: Record<HumanizeErrorCode, string> = {
  empty_input: 'Enter some text to rewrite.',
  too_long: `That is longer than ${MAX_WORDS_PER_REQUEST.toLocaleString()} words. Split it into smaller pieces and run them separately.`,
  invalid_tone: 'That tone is not available. Pick another and try again.',
  rate_limited:
    'Too many rewrites in a short time. Wait a moment and try again.',
  engine_failed:
    'The rewrite could not be completed. Nothing was charged. Try again.',
  engine_timeout:
    'The rewrite took too long and was stopped. Nothing was charged. Try a shorter piece of text.',
};
