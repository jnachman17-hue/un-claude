/**
 * THE PRICE AND THE WORK MUST AGREE ABOUT WHAT A FILE IS.
 *
 * Added 21 August 2026, session 11, after the payment audit found they did not.
 *
 * WHY THIS EXISTS AS A SCRIPT RATHER THAN A COMMENT. Two lists in two languages
 * in two directories have to stay identical, and nothing about editing one makes
 * you look at the other. They had already drifted, in both directions at once:
 *
 *   - `/api/tool/clean` knew `.txt .md .markdown .text`.
 *   - The engine's TEXT_EXTS is `.txt .text .css .js .py .rs .go .json .yaml
 *     .yml .toml .csv`, and it classes `.md .markdown .mdx` as CONTAINERS.
 *
 * So a 100,000-word essay saved as `essay.csv` was priced as one flat credit
 * while the engine ran the full paid rewrite on it — a 100x undercharge on the
 * only operation that costs real money. And `.md` was charged per 1,000 words
 * for a rewrite the container path never performs, which is a customer paying
 * and not receiving.
 *
 * Neither is visible by reading either file alone. This compares them.
 *
 *   cd apps/web && node scripts/verify-pricing-matches-engine.mjs
 *
 * READ ONLY: parses two source files. Exits non-zero on any drift.
 */
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);

const ENGINE = path.resolve(HERE, '../engine/format_dispatch.py');
const ROUTE = path.resolve(HERE, '../app/api/tool/clean/route.ts');

function pythonSet(source, name) {
  const match = new RegExp(`${name}\\s*=\\s*\\{([\\s\\S]*?)\\}`).exec(source);

  if (!match) throw new Error(`could not find ${name} in ${ENGINE}`);

  return new Set([...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]));
}

function jsArray(source, name) {
  const match = new RegExp(`const ${name}\\s*=\\s*\\[([\\s\\S]*?)\\]`).exec(source);

  if (!match) throw new Error(`could not find ${name} in ${ROUTE}`);

  return new Set([...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]));
}

const engineSource = fs.readFileSync(ENGINE, 'utf8');
const routeSource = fs.readFileSync(ROUTE, 'utf8');

const engineText = pythonSet(engineSource, 'TEXT_EXTS');
const engineContainer = pythonSet(engineSource, 'CONTAINER_EXTS');
const routeText = jsArray(routeSource, 'ENGINE_TEXT_EXTS');

const sorted = (s) => [...s].sort().join(' ');

console.log('\nDoes the PRICE agree with the WORK about what a file is?');
console.log('='.repeat(66));
console.log('\nengine TEXT_EXTS      ', sorted(engineText));
console.log('route ENGINE_TEXT_EXTS', sorted(routeText));
console.log('\nengine CONTAINER_EXTS ', sorted(engineContainer));

let failures = 0;

function report(name, ok, detail) {
  if (!ok) failures += 1;
  console.log(`\n${ok ? '  PASS' : '  FAIL'}  ${name}`);
  if (detail) console.log(`        ${detail}`);
}

/*
 * 1. Anything the ENGINE treats as text but the ROUTE does not: the rewrite
 *    runs and is charged as a flat file credit. UNDERCHARGE, unbounded.
 */
const undercharged = [...engineText].filter((ext) => !routeText.has(ext));

report(
  'nothing the engine rewrites is priced as a flat file',
  undercharged.length === 0,
  undercharged.length
    ? `UNDERCHARGE: ${undercharged.join(' ')} — the engine runs the paid rewrite on these ` +
      `and the route charges 1 flat credit. Rename a paste to essay${undercharged[0]} to exploit.`
    : undefined,
);

/*
 * 2. Anything the ROUTE prices by words that the engine does NOT treat as text:
 *    charged per 1,000 words for a rewrite that never runs. OVERCHARGE, and the
 *    customer receives nothing for it.
 */
const overcharged = [...routeText].filter((ext) => !engineText.has(ext));

report(
  'nothing priced by the word is refused a rewrite by the engine',
  overcharged.length === 0,
  overcharged.length
    ? `OVERCHARGE: ${overcharged.join(' ')} — priced per 1,000 words, but the engine does not ` +
      `class these as text so layer B never runs. The customer pays and receives nothing.`
    : undefined,
);

/*
 * 3. The specific overlap that caused the original bug: an extension in BOTH
 *    the route's text list and the engine's container list. `.md` was exactly
 *    this.
 */
const bothTextAndContainer = [...routeText].filter((ext) => engineContainer.has(ext));

report(
  'nothing priced as text is a CONTAINER to the engine',
  bothTextAndContainer.length === 0,
  bothTextAndContainer.length
    ? `${bothTextAndContainer.join(' ')} are containers — the container path ignores layer_b entirely.`
    : undefined,
);

console.log('\n' + '='.repeat(66));

if (failures) {
  console.log(`\n${failures} DRIFT(S) FOUND. The price and the work disagree.\n`);
  process.exit(1);
}

console.log('\nThe price and the work agree on every extension.\n');
