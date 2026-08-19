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

const VENDORS: Array<[RegExp, string]> = [
  [/anthropic|claude/i, 'Anthropic'],
  [/openai|dall[\s-]?e|gpt/i, 'OpenAI'],
  [/google|gemini|imagen|synthid|vertex/i, 'Google'],
  [/adobe|firefly/i, 'Adobe Firefly'],
  [/midjourney/i, 'Midjourney'],
  [/stability|stable[\s-]?diffusion/i, 'Stability AI'],
  [/black[\s-]?forest|flux/i, 'Black Forest Labs'],
  [/microsoft|designer|copilot/i, 'Microsoft'],
  [/canva/i, 'Canva'],
  [/grok|xai/i, 'xAI'],
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

  if (report.has_c2pa === true) {
    items.push({
      key: 'c2pa',
      head: 'Content credentials',
      body:
        'A signed record of what made this file, attached by the tool that generated it. This is the industry standard and it is removable by design.',
    });
  }

  if (report.has_ai_metadata === true) {
    items.push({
      key: 'ai-meta',
      head: 'Generator tags',
      body: 'Fields inside the file naming the software that produced it.',
    });
  }

  const findings = Array.isArray(report.findings) ? (report.findings as unknown[]) : [];
  findings.slice(0, 4).forEach((finding, index) => {
    if (typeof finding !== 'string') return;
    items.push({ key: `finding-${index}`, head: 'Found', body: finding });
  });

  return items;
}
