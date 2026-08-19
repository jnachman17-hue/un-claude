/**
 * The paragraph the hero arrives holding.
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
  'Following the review, the committee agreed that the rollout should proceed in ' +
  'three stages rather than two. The first stage covers' + NNBSP + 'the northern ' +
  'sites and is expected to complete within eleven weeks. Costs are held at ' +
  '4.2 million, unchanged from the' + ZWSP + ' February estimate, and the ' +
  'reporting line stays with the operations group' + NBSP + 'until the transfer ' +
  'is signed.';

/** Shown under the box so nobody mistakes the demonstration for their own work. */
export const SAMPLE_CAPTION =
  'An example, loaded so you can see what a scan looks like. Replace it with your own.';
