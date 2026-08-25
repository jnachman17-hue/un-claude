/**
 * The shapes the Un-Claude engine returns.
 *
 * Written from real responses, not from the documentation. See
 * apps/web/engine/API.md for the reference and ENGINE.md section 2 for what
 * each layer may and may not claim.
 */

/** One class of hidden character found in the text, with its exact positions. */
export interface ScanHit {
  /** e.g. "U+200B" */
  codepoint: string;
  /** Already human readable. Do not invent our own names. API.md section 3. */
  label: string;
  count: number;
  /** One of the engine's check classes: zwj_family, space, bidi, tag_chars ... */
  kind: string;
  /** "probable" | "informational". Not everything found is certainly a mark. */
  confidence: string;
  /** Exact character positions. This is what lets us highlight in place. */
  sample_offsets: number[];
}

export interface ScanReport {
  length?: number;
  suspicious_total?: number;
  hits?: ScanHit[];
  /** Undocumented in API.md but present. Carries the catalogue of check kinds. */
  notes?: string[];
  [key: string]: unknown;
}

/**
 * THE D4 PRE-FLIGHT: how much of this document the rewrite will hand back
 * untouched, known before anybody pays for it.
 *
 * Protected spans — quotations, headings, block quotes and reference entries —
 * are swapped for placeholders before the model sees them and put back
 * afterwards, so they come back character for character. That is the point of
 * the freeze, and it is also a thing a customer would want to know they were
 * buying.
 *
 * The engine computes this on the FREE scan, with no model call, using the same
 * plan the rewrite itself runs (`uc_policy.billing_estimate` calls
 * `uc_freeze.freeze_fraction`, which calls the same `plan_freeze` the rewrite
 * uses). One implementation, so the number shown is the number delivered.
 *
 * ABSENT on anything that is not text, and absent when the freeze is switched
 * off. Never assume it is here.
 */
export interface FreezeEstimate {
  /** 0 to 1. The share of the document's words that come back exactly as sent. */
  fraction: number;
  frozen_words: number;
  words: number;
  /** Count per kind: quote, heading, block_quote, reference. */
  spans: Record<string, number>;
}

/**
 * What this job will cost, worked out by the server on the FREE scan.
 *
 * 04 entry 16: the price must be knowable before somebody commits to paying it.
 * The browser holds only base64 for an uploaded file, so it cannot count the
 * words itself — this is the only place the count exists before the paid run.
 * `limit` and `over_limit` ride along so the interface can refuse an
 * over-length document before the button rather than after a two minute wait.
 */
export interface BillingEstimate {
  credits: number;
  words: number | null;
  basis: 'words' | 'flat';
  limit: number | null;
  over_limit: boolean;
  /** Text only, and only while the freeze is on. See FreezeEstimate. */
  freeze?: FreezeEstimate;
}

export interface ScanResult {
  ok: true;
  /** "text" | "image" | "container" */
  kind: string;
  suspicious?: boolean;
  report: ScanReport;
  billing?: BillingEstimate;
  usage?: UsageSummary;
}

/**
 * What a layer B run consumed. Added 19 August 2026 for 06 row 48, which had
 * been losing this permanently on every run since the engine was written.
 *
 * `attempts` and `model_calls` are deliberately separate. An attempt that never
 * reaches the model, because the connection failed or the gateway rate limited
 * us, is an attempt and is not a call. Measured live: a run showing 7 attempts
 * and 5 calls had two attempts that never got an answer.
 *
 * `cost_usd` is the AI Gateway's own figure in US dollars, not our arithmetic
 * on a token count.
 */
export interface LayerBUsage {
  chunks: number;
  /** Times a chunk was sent, including retries and attempts that never landed. */
  attempts: number;
  /** Attempts beyond the first for each chunk, summed. */
  retries: number;
  /*
   * EVERYTHING BELOW THIS LINE IS OURS AND NEVER REACHES A BROWSER. It is our
   * unit economics on a public site: what a run cost us, in tokens and in
   * dollars. `app/api/tool/clean/route.ts` strips the whole group out of the
   * reply after the run-cost writer has read it and before the response goes
   * out, so a browser sees `chunks`, `attempts` and `retries` and nothing else.
   *
   * They are optional here because that stripped reply is a real value of this
   * type. Server-side callers still get them: they read the engine's answer
   * before the route narrows it.
   */

  /** Requests the model actually answered. Every one of them was billed. */
  model_calls?: number;
  /** Answers that arrived with no usage block, so a zero can be told from a gap. */
  calls_without_usage?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  cost_usd?: number;
}

/**
 * Layer B never reports a verified removal. No detector exists.
 *
 * `words_in` and `words_out` USED TO BE absent on single-chunk documents, which
 * is anything under about 350 words and therefore most pastes. API.md section 12
 * recorded that as a fact. They are now returned on both paths, because the
 * usage record needs them on exactly the short pastes that were missing them.
 * The receipt still computes its own word counts and does not depend on these.
 */
export interface LayerBReport {
  model: string;
  chunks: number;
  words_in?: number;
  words_out?: number;
  usage?: LayerBUsage;
  /** Numbers the engine could not prove survived the rewrite. Usually empty. */
  figures_to_check: string[];
  verified: false;
  note: string;
}

/**
 * The usage block returned to the browser. A DELIBERATELY SMALL SUBSET.
 *
 * Token counts and cost are our own unit economics and this is a public site,
 * so they go to the server log and not into a response anybody can read. The
 * full record, including cost, is written server side by usage_record() in
 * apps/web/api/_shared.py. 06 row 48.
 */
export interface UsageSummary {
  endpoint: 'scan' | 'clean';
  kind?: string;
  extension?: string;
  bytes_in?: number;
  /** Null on anything that is not text. A PNG has bytes, not words. */
  words_in?: number | null;
  words_out?: number | null;
  seconds?: number;
  ok?: boolean;
  layer_b_used?: boolean;
  layer_b_model?: string | null;
}

export interface CleanResult {
  ok: true;
  kind: string;
  /** The cleaned file's bytes, base64 encoded. */
  cleaned: string;
  report: {
    stats?: {
      input_length?: number;
      output_length?: number;
      removed?: Record<string, number>;
      replaced?: Record<string, number>;
      removed_count?: number;
      replaced_count?: number;
    };
    layer_b?: LayerBReport;
    [key: string]: unknown;
  };
  usage?: UsageSummary;
}

/**
 * A failure the interface may show.
 *
 * `code` is the only thing to branch on. `message` is always one of our own
 * written sentences and never raw upstream text. API.md section 5, 04 entry 15.
 */
export interface EngineFailure {
  ok: false;
  code: string;
  message: string;
}

export type EngineResult<T> = T | EngineFailure;
