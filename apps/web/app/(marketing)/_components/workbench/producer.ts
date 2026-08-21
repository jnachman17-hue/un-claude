/**
 * Reading who made a file out of what the scan found in it.
 *
 * This is the one place the product can honestly say "produced by X", and it is
 * Jon's idea. It works only on files, because it reads C2PA provenance and
 * generator tags out of the file's wrapper, which is real recorded data rather
 * than an inference.
 *
 * It deliberately does NOT exist for pasted text. Nobody can identify which
 * model wrote a paragraph, ourselves included, and guessing would be exactly the
 * kind of claim this product is built not to make.
 */

/**
 * PRODUCT NAMES FIRST, ordered most specific to least.
 *
 * Jon, 20 August 2026, testing with a ChatGPT-generated image: it should say
 * ChatGPT, because that is the thing he used and the name he recognises.
 * Nobody thinks "I made this in OpenAI". The coverage table already leads with
 * the product for the same reason, `04` entry 50.
 *
 * Specific patterns run first so the name stays TRUE rather than merely
 * recognisable: a file whose metadata says DALL-E is reported as DALL-E, and
 * only a file that names the company and no product falls back to the company.
 * Claiming "ChatGPT" over a raw API image would be a guess, and this is the one
 * place the product speaks with certainty about somebody's own file.
 */
const VENDORS: Array<[RegExp, string]> = [
  [/claude/i, 'Claude'],
  [/anthropic/i, 'Anthropic'],
  [/chat[\s-]?gpt/i, 'ChatGPT'],
  [/dall[\s-]?e/i, 'DALL-E'],
  [/gpt|openai/i, 'ChatGPT'],
  [/gemini/i, 'Gemini'],
  [/imagen/i, 'Imagen'],
  [/google|synthid|vertex/i, 'Google'],
  [/firefly/i, 'Adobe Firefly'],
  [/adobe/i, 'Adobe'],
  [/midjourney/i, 'Midjourney'],
  [/stable[\s-]?diffusion/i, 'Stable Diffusion'],
  [/stability/i, 'Stability AI'],
  [/flux/i, 'FLUX'],
  [/black[\s-]?forest/i, 'Black Forest Labs'],
  [/copilot|designer/i, 'Microsoft Designer'],
  [/microsoft/i, 'Microsoft'],
  [/canva/i, 'Canva'],
  [/grok/i, 'Grok'],
  [/xai/i, 'xAI'],
];

/**
 * Every string VALUE the file report carries.
 *
 * Field names are deliberately excluded, and that is not a detail. An earlier
 * version harvested keys too, and the report always contains a field called
 * `synthid` whether or not anything was found in it. Every file uploaded was
 * therefore reported as "made by Google", which is a false claim about a named
 * company printed in the interface. Only values are read now.
 */
function harvest(value: unknown, into: string[] = []): string[] {
  if (typeof value === 'string') into.push(value);
  else if (Array.isArray(value)) value.forEach((item) => harvest(item, into));
  else if (value && typeof value === 'object') {
    Object.values(value).forEach((inner) => harvest(inner, into));
  }
  return into;
}

export function detectProducer(report: unknown): string | null {
  const haystack = harvest(report).join(' ');
  for (const [pattern, name] of VENDORS) {
    if (pattern.test(haystack)) return name;
  }
  return null;
}

/** The individual marks found inside a file, named in plain language. */
export function provenanceItems(
  report: Record<string, unknown> | undefined,
): Array<{ key: string; head: string; body: string }> {
  if (!report) return [];

  const items: Array<{ key: string; head: string; body: string }> = [];

  /*
   * ONE LINE EACH, SCANNABLE AT A GLANCE. Jon, 20 August 2026, opening this on
   * a ChatGPT image: "I need to read this in one glance and easily. I don't
   * want a blobber of words." Each entry is now a label and a short phrase
   * rather than a label and a sentence, and the checklist renders them as a
   * tight list. The teaching about what C2PA is lives on /how-it-works, where
   * somebody who wants it has room for it.
   */
  if (report.has_c2pa === true) {
    items.push({
      key: 'c2pa',
      head: 'Content credentials',
      body: 'A signed record naming the tool that made this file',
    });
  }

  if (report.has_ai_metadata === true) {
    items.push({
      key: 'ai-meta',
      head: 'Generator tags',
      body: 'Fields naming the software that produced it',
    });
  }

  const findings = Array.isArray(report.findings) ? (report.findings as unknown[]) : [];
  findings.slice(0, 4).forEach((finding, index) => {
    if (typeof finding !== 'string') return;
    items.push({ key: `finding-${index}`, head: 'Also found', body: finding });
  });

  return items;
}
