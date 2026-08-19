/**
 * The shapes the un-claude engine returns.
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
  usage?: Record<string, unknown>;
}

/**
 * Layer B never reports a verified removal. No detector exists.
 *
 * `words_in` and `words_out` are OPTIONAL despite what API.md says. They are
 * returned only when a document splits into several chunks; a single chunk, which
 * is anything under about 350 words and therefore most pastes, omits them
 * entirely. Verified against the live engine. The receipt computes its own word
 * counts and does not depend on these.
 */
export interface LayerBReport {
  model: string;
  chunks: number;
  words_in?: number;
  words_out?: number;
  /** Numbers the engine could not prove survived the rewrite. Usually empty. */
  figures_to_check: string[];
  verified: false;
  note: string;
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
  usage?: Record<string, unknown>;
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
