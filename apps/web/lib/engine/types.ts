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

export interface ScanResult {
  ok: true;
  /** "text" | "image" | "container" */
  kind: string;
  suspicious?: boolean;
  report: ScanReport;
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
  /** Requests the model actually answered. Every one of them was billed. */
  model_calls: number;
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
