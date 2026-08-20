/**
 * The paragraph the hero arrives holding.
 *
 * DELIBERATELY ABSURD, on Jon's instruction, 19 August 2026: "make it a funny
 * paragraph about some bullshit". The previous one was a corporate memo about a
 * committee approving a rollout, which is nobody's world and least of all a
 * student's. The bureaucratic deadpan is kept because the contrast is the joke;
 * only the subject changed.
 *
 * It still carries a figure, a date and a written-out number, because the
 * facts-survive guarantee needs something to prove itself on.
 *
 * EVERY invisible character below is written as a \u escape, never as a literal.
 * 07-runbook: invisible characters typed or piped through a shell are destroyed
 * silently, and the result looks like a broken detector rather than a broken
 * test. This whole product is about characters you cannot see, so the rule is
 * absolute: build them from their code numbers.
 *
 * This file was written wrong once, in the session that created it, by exactly
 * the mechanism the runbook describes. It is worth leaving the note.
 *
 * What is planted, and why each one is realistic:
 *   U+202F  NARROW NO-BREAK SPACE  the documented ChatGPT tell, 04 entry 35
 *   U+200B  ZERO WIDTH SPACE       arrives constantly via copy and paste
 *   U+00A0  NO-BREAK SPACE         survives almost every export pipeline
 */

const NNBSP = '\u202F';
const ZWSP = '\u200B';
const NBSP = '\u00A0';

export const SAMPLE_TEXT =
  'The committee has reviewed the incident and agreed that Gary from' + NNBSP +
  ' accounts will not be organising the Christmas party again. Costs are held ' +
  'at 4.2 million, unchanged from the' + ZWSP + ' February estimate. Gary ' +
  'maintains that the alpacas were a gift,' + NBSP + ' and that eleven of them ' +
  'was a reasonable number for a venue of that size.';

/**
 * The line that connects the marks in the text to the row underneath.
 *
 * Without it the three bars read as cursor artefacts or a rendering fault. Jon,
 * 19 August 2026: "I see these three vertical lines that are supposed to
 * symbolize hidden characters and like this is all there... but I don't even
 * know what's going on." The connection between those bars and "3 found" is the
 * whole payoff of the arrival screen and it was left to be inferred.
 */
export const SAMPLE_HINT =
  'Three characters are hiding in this paragraph. You are looking straight at them.';

/** Shown under the box so nobody mistakes the demonstration for their own work. */
export const SAMPLE_CAPTION =
  'An example, loaded so you can see what a scan looks like. Replace it with your own.';
