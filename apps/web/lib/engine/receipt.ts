/**
 * What the rewrite actually did, measured rather than asserted.
 *
 * Layer B cannot be verified. No public detector exists for any vendor's text
 * watermark, so nobody can confirm a removal, ourselves included. What CAN be
 * measured, exactly, is how much of the original wording survived, and that is
 * not a proxy for the watermark being gone. It is a description of the work.
 *
 * 06 row 28 sets three conditions on any user facing version of this, and all
 * three are met here:
 *
 *   1. It must never be labelled a watermark score. It is not one.
 *   2. It must measure SEVERAL run lengths, not one. An adversarial review in
 *      session 4 killed an earlier version that reported 0.0% on a rewrite with
 *      26.4% carried over, because it looked at a single length.
 *   3. It must be paired with a fact survival check, so the number cannot be
 *      improved by damaging the document. A rewrite that drops your figures
 *      would otherwise score better than one that keeps them.
 *
 * Why runs and not vocabulary: the watermark rides on runs of consecutive
 * words. Similar meaning does not carry it. Overlapping vocabulary does not
 * carry it. Only verbatim sequences do. ENGINE.md section 2.
 */

export interface Receipt {
  wordsIn: number;
  wordsOut: number;
  /** Words out as a percentage of words in. Guards against silent shortening. */
  lengthKept: number;
  /** Percentage of the original wording that did NOT survive verbatim. */
  wordingChanged: number;
  /** The longest unbroken sequence of original words still present. */
  longestRun: number;
  /** Per run length: how much of the original survives at that length. */
  runs: Array<{ length: number; survivingPercent: number }>;
  figuresIn: number;
  figuresKept: number;
  /** Figures the engine could not prove survived. Usually empty. */
  figuresToCheck: string[];
}

const RUN_LENGTHS = [3, 4, 5, 6, 8, 10];

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function ngrams(tokens: string[], size: number): string[] {
  if (tokens.length < size) return [];
  const out: string[] = [];
  for (let index = 0; index + size <= tokens.length; index += 1) {
    out.push(tokens.slice(index, index + size).join(' '));
  }
  return out;
}

/**
 * Numbers, compared by VALUE rather than by spelling.
 *
 * "thirty-four percent" and "34 percent" are the same fact. A previous version
 * of this comparison flagged them as a mismatch, and a number extractor reading
 * "thirty-four" as thirty and four rejected six chunks in eight on entirely
 * false grounds and nearly got the engine declared broken. 07-runbook.
 */
const NUMBER_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60,
  seventy: 70, eighty: 80, ninety: 90, hundred: 100, thousand: 1000,
  million: 1_000_000, billion: 1_000_000_000,
};

function figures(text: string): number[] {
  const found: number[] = [];

  for (const match of text.matchAll(/\d[\d,]*(?:\.\d+)?/g)) {
    const value = Number(match[0].replace(/,/g, ''));
    if (Number.isFinite(value)) found.push(value);
  }

  /*
   * Hyphenated compounds first, so "thirty-four" is 34 rather than 30 and 4.
   *
   * Each compound is then blanked out of the copy the single-word pass reads.
   * Without that the two passes both see the same words and "thirty-four
   * percent" lands as THREE figures, 34 plus 30 plus 4, so a document with
   * four facts in it reports six and the receipt invents two failures that
   * never happened. That is the same phantom-figure fault Jon caught in the
   * panel originally, arriving by a different route.
   */
  let singles = text.toLowerCase();

  for (const match of singles.matchAll(/\b([a-z]+)-([a-z]+)\b/g)) {
    const tens = NUMBER_WORDS[match[1] ?? ''];
    const units = NUMBER_WORDS[match[2] ?? ''];
    if (tens !== undefined && units !== undefined && tens >= 20 && units < 10) {
      found.push(tens + units);
    }
  }

  singles = singles.replace(/\b([a-z]+)-([a-z]+)\b/g, (whole, left, right) => {
    const tens = NUMBER_WORDS[left];
    const units = NUMBER_WORDS[right];
    const isCompound =
      tens !== undefined && units !== undefined && tens >= 20 && units < 10;

    return isCompound ? ' '.repeat(whole.length) : whole;
  });

  /*
   * SPELLED-OUT NUMBERS ARE FACTS AND ARE GUARDED. "Seven percent of people"
   * is data whether it is written 7 or seven, and losing it in a rewrite is
   * exactly what the fact guard exists to catch.
   *
   * "One" is the single exclusion, because it is overwhelmingly a pronoun or
   * an article rather than a quantity: one of these days, one participant,
   * the one thing. Jon pasted ordinary prose containing several and the panel
   * announced "3 of 7 figures carried through" about a text with no data in
   * it, because the rewrite had swapped those for synonyms, which is what a
   * rewrite should do.
   *
   * An earlier attempt at this cut everything below thirteen. That was an
   * arbitrary line with no reasoning behind it and it threw away real
   * research figures; Jon called it and he was right.
   *
   * The trade-off, recorded: a genuine "one in five" loses its one and keeps
   * its five, so the fact still has a guard on it. Plural forms (millions,
   * hundreds) never matched here in the first place, so vague quantities
   * stay out on their own.
   */
  for (const match of singles.matchAll(/\b[a-z]+\b/g)) {
    const word = match[0];
    if (word === 'one') continue;
    const value = NUMBER_WORDS[word];
    if (value !== undefined) found.push(value);
  }

  return found;
}

export function buildReceipt(
  input: string,
  output: string,
  figuresToCheck: string[] = [],
): Receipt {
  const before = words(input);
  const after = words(output);
  const afterSet = new Set<string>();

  RUN_LENGTHS.forEach((size) => ngrams(after, size).forEach((gram) => afterSet.add(gram)));

  const runs = RUN_LENGTHS.map((length) => {
    const original = ngrams(before, length);
    if (original.length === 0) return { length, survivingPercent: 0 };
    const survived = original.filter((gram) => afterSet.has(gram)).length;
    return {
      length,
      survivingPercent: Math.round((survived / original.length) * 1000) / 10,
    };
  });

  const longestRun = [...runs].reverse().find((run) => run.survivingPercent > 0)?.length ?? 0;

  // The headline figure comes from the shortest run length we measure, which is
  // three, because three is the cap the rewrite prompt itself enforces.
  const threeWord = runs.find((run) => run.length === 3)?.survivingPercent ?? 0;

  const figuresBefore = figures(input);
  const remaining = [...figures(output)];
  let kept = 0;

  figuresBefore.forEach((value) => {
    const at = remaining.indexOf(value);
    if (at !== -1) {
      remaining.splice(at, 1);
      kept += 1;
    }
  });

  return {
    wordsIn: before.length,
    wordsOut: after.length,
    lengthKept: before.length === 0 ? 0 : Math.round((after.length / before.length) * 100),
    wordingChanged: Math.round((100 - threeWord) * 10) / 10,
    longestRun,
    runs,
    figuresIn: figuresBefore.length,
    figuresKept: kept,
    figuresToCheck,
  };
}
