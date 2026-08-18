/**
 * Text measurement used by both the humanize API route and the editor's live
 * word counter. Kept dependency free and deterministic so the same numbers come
 * out on the server and in the browser.
 *
 * These metrics exist to back the product's three claims: natural rhythm
 * restoration, removal of robotic syntax, and sentence structure variation.
 * `variation` is the load bearing one. Machine written prose tends to produce
 * sentences of very similar length, so a low variation score is the most
 * recognisable tell, and raising it is what "natural rhythm" actually means.
 */

export interface TextMetrics {
  /** Words, counted the way the user is billed. */
  words: number;
  /** Sentences detected. */
  sentences: number;
  /** Mean words per sentence, one decimal place. */
  avgSentenceLength: number;
  /**
   * Sentence length variation as a percentage: the standard deviation of
   * sentence lengths over their mean, also called the coefficient of variation.
   * Uniform sentences score near 0. Human prose typically lands well above it.
   * Higher is better, which is why it is the headline number.
   */
  variation: number;
  /** Flesch Kincaid grade level, clamped to a sane range. */
  readingGrade: number;
}

const WORD_PATTERN = /[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g;

/**
 * Counts words the same way the word counter and the credit meter do.
 * A single definition avoids the situation where the number shown to the user
 * and the number they are charged for disagree.
 */
export function countWords(text: string): number {
  return text.match(WORD_PATTERN)?.length ?? 0;
}

/**
 * Splits prose into sentences.
 *
 * Deliberately simple. It breaks on `.`, `!` and `?` followed by whitespace,
 * and protects a short list of common abbreviations so that "Dr. Smith" does
 * not become two sentences. It is not a parser and does not need to be: it
 * feeds a rhythm statistic, where the occasional miscount moves the number by a
 * fraction and changes nothing a reader would notice.
 */
export function splitSentences(text: string): string[] {
  // A sentinel that cannot occur in pasted prose. It hides the periods inside
  // abbreviations from the splitter so they can be restored afterwards.
  //
  // Using a space as the placeholder would be silently destructive: restoring
  // it turns every space in the sentence into a period. That bug was written
  // and caught here before it shipped, which is why this comment exists.
  const DOT = '\u0000';

  const protectedText = text.replace(
    /\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|vs|etc|approx|Inc|Ltd|Co)\./gi,
    (match) => match.replaceAll('.', DOT),
  );

  return protectedText
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.replaceAll(DOT, '.').trim())
    .filter((sentence) => countWords(sentence) > 0);
}

/**
 * Syllable estimate for a single English word.
 *
 * A heuristic, not a dictionary. Counts vowel groups, drops a silent trailing
 * "e", and adds one back for the "-le" ending as in "table". Wrong on some
 * words, close enough in aggregate for a reading grade.
 */
function countSyllables(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');

  if (clean.length === 0) {
    return 0;
  }

  if (clean.length <= 3) {
    return 1;
  }

  const trimmed = clean
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
    .replace(/^y/, '');

  const groups = trimmed.match(/[aeiouy]{1,2}/g);
  const count = groups?.length ?? 0;

  // "table", "little": the trailing consonant + le carries its own syllable.
  const hasConsonantLe = /[^aeiouy]le$/.test(clean);

  return Math.max(1, count + (hasConsonantLe ? 1 : 0));
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) {
    return 0;
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;

  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;

  return Math.sqrt(variance);
}

function round(value: number, places = 1): number {
  const factor = 10 ** places;

  return Math.round(value * factor) / factor;
}

/**
 * Measures a block of prose. Returns zeroes for empty input rather than
 * throwing, because the live word counter calls this on every keystroke,
 * including when the box is empty.
 */
export function analyze(text: string): TextMetrics {
  const words = countWords(text);
  const sentences = splitSentences(text);

  if (words === 0 || sentences.length === 0) {
    return {
      words: 0,
      sentences: 0,
      avgSentenceLength: 0,
      variation: 0,
      readingGrade: 0,
    };
  }

  const lengths = sentences.map((sentence) => countWords(sentence));
  const mean =
    lengths.reduce((sum, length) => sum + length, 0) / lengths.length;

  const syllables = (text.match(WORD_PATTERN) ?? []).reduce(
    (sum, word) => sum + countSyllables(word),
    0,
  );

  // Flesch Kincaid grade level.
  const grade =
    0.39 * (words / sentences.length) + 11.8 * (syllables / words) - 15.59;

  return {
    words,
    sentences: sentences.length,
    avgSentenceLength: round(mean),
    variation: mean > 0 ? round((standardDeviation(lengths) / mean) * 100) : 0,
    readingGrade: round(Math.min(Math.max(grade, 1), 18)),
  };
}
