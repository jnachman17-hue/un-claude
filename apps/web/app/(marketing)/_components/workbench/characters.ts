/**
 * Plain English for every hidden character the scan can find.
 *
 * The engine returns names like "U+00A0 NO-BREAK SPACE (Zs)". That is precise
 * and it is meaningless to the person reading it. API.md says not to invent our
 * own names for these, and we do not: the official name is still shown. What is
 * added is a sentence saying what the thing actually is.
 *
 * Two levels. `BY_CODEPOINT` covers the characters that turn up constantly and
 * deserve a specific answer. `BY_KIND` covers the engine's nine check classes
 * and catches everything else.
 */

export const BY_CODEPOINT: Record<string, string> = {
  'U+200B': 'An invisible gap with no width at all. Nothing appears on the page.',
  'U+200C':
    'An invisible mark that stops two letters joining up. Used in some scripts, and used to hide data in others.',
  'U+200D':
    'An invisible mark that glues characters together. It is what makes emoji combine, and it can carry hidden data.',
  'U+202F':
    'A narrow space that looks identical to an ordinary one. Newer ChatGPT models are documented emitting these.',
  'U+00A0':
    'A space that stops a line breaking. Looks ordinary, and arrives constantly in text copied from web pages.',
  'U+FEFF':
    'An invisible marker left at the start of a file by some editors and export tools.',
  'U+00AD':
    'An invisible hyphen that only appears if the word happens to break across a line.',
  'U+2009': 'A space thinner than a normal one. Almost impossible to spot by eye.',
  'U+2028': 'An invisible line separator, distinct from a normal line break.',
  'U+180E': 'An invisible separator that most software renders as nothing at all.',
};

export const BY_KIND: Record<string, string> = {
  zwj_family:
    'Zero width characters. They occupy a position in the text but take up no space, so nothing shows on the page.',
  space:
    'An unusual space. It looks exactly like an ordinary space and is a different character underneath.',
  bidi: 'A direction mark. It controls which way the text runs and is never drawn.',
  tag_chars:
    'A tag character. These form an invisible alphabet that can spell out a hidden message inside ordinary text.',
  variation_selector:
    'A variation selector. An invisible modifier that changes how the character before it is drawn.',
  private_use:
    'A private use character. An undefined slot that shows as nothing, or as an empty box.',
  confusable:
    'A lookalike letter. A character from another alphabet drawn identically to the Latin one it replaces.',
  strip: 'A control character. A formatting instruction that is never shown on the page.',
  other_cf: 'An invisible instruction to whatever is drawing the text.',
};

/** The nine classes the scan runs, in the engine's own words. Shown when nothing
 *  is found, so an empty result still says what was actually done. */
export const CHECK_CLASSES = [
  'Zero width',
  'Unusual spaces',
  'Direction marks',
  'Tag characters',
  'Variation selectors',
  'Private use',
  'Lookalike letters',
  'Control characters',
  'Other invisibles',
];

export function explain(codepoint: string, kind: string): string {
  return (
    BY_CODEPOINT[codepoint] ??
    BY_KIND[kind] ??
    'An invisible character that does not show on the page.'
  );
}

/** "U+00A0 NO-BREAK SPACE (Zs)" becomes "No-break space". */
export function prettyName(label: string, codepoint: string): string {
  const stripped = label
    .replace(`${codepoint} `, '')
    .replace(/\s*\([A-Za-z]{2}\)\s*$/, '')
    .trim();
  return stripped.charAt(0) + stripped.slice(1).toLowerCase();
}
