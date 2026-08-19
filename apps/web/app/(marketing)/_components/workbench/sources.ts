/**
 * The models a visitor can say their text came from.
 *
 * Why this question exists at all: for the visitor this product is actually for,
 * the scan finds nothing. Anthropic adds no hidden characters to Claude's text,
 * so a checklist that can only report what it found reports an empty result to
 * the exact person who came here with a real problem. 06 row 27.
 *
 * Knowing the source lets the third row state a fact instead of a guess. It is
 * one click, phrased in ordinary language, and it never asks the visitor to
 * understand what a layer is.
 *
 * NOTE ON LOGOS. Jon asked for each entry to carry its brand mark. They are not
 * here yet and that is deliberate: OpenAI has had its mark removed from the icon
 * source everyone uses, so a logo row would be missing the second most important
 * brand on it. 06 row 34 also requires his approval before any logo file is
 * fetched. Names ship now, marks follow.
 */

export interface Source {
  id: string;
  name: string;
  /** Stated in the third checklist row. Must be a fact, never an inference. */
  watermarksText: boolean;
  /** The sentence shown once this source is chosen. Kept short and literal. */
  statement: string;
}

export const SOURCES: Source[] = [
  {
    id: 'claude',
    name: 'Claude',
    watermarksText: true,
    statement:
      'Anthropic applies a statistical watermark to Claude output. It has been on by default, worldwide, since 2 August 2026.',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    watermarksText: true,
    statement:
      'Google applies SynthID to Gemini text output. It is on across Gemini, Imagen and Vertex.',
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    watermarksText: false,
    statement:
      'OpenAI has not confirmed text watermarking, and it signed the EU code of practice. Newer models are documented emitting narrow no-break spaces, which the scan above catches.',
  },
  {
    id: 'copilot',
    name: 'Copilot',
    watermarksText: false,
    statement:
      'Built on OpenAI models, so the same position applies. No confirmed text watermark today.',
  },
  {
    id: 'other',
    name: 'Another tool',
    watermarksText: false,
    statement:
      'Every major lab signed the EU code of practice on AI transparency, so treat text watermarking as arriving rather than absent.',
  },
  {
    id: 'unknown',
    name: 'Not sure',
    watermarksText: true,
    statement:
      'Claude and Gemini both watermark their text today, and the others have committed to transparency measures. When the source is unknown, the safe assumption is that a mark is present.',
  },
];

export const DEFAULT_SOURCE = SOURCES[0]!;
