/**
 * DOES THE PAID REWRITE REFUSE A SPACELESS SCRIPT, WITHOUT REFUSING AN ENGLISH
 * ESSAY THAT QUOTES ONE? Route session, 24 August 2026. Jon's ruling.
 *
 *   cd apps/web && node scripts/verify-cjk-refusal.mjs
 *
 * THE HOLE. Chinese, Japanese and Thai are written without spaces between the
 * words, and every price on this site comes from a word count that counts
 * spaces. So a 200,000 character Chinese document counts as roughly one word:
 * one credit, straight through the 10,000 word ceiling, and around 170 chunks
 * of model calls on our bill. The ruling is to refuse those scripts plainly
 * rather than try to price them.
 *
 * THE THREE THINGS THAT HAVE TO BE TRUE TOGETHER, and any one alone is easy:
 *
 *   1. a Chinese, Japanese or Thai document is refused, and refused BEFORE a
 *      single credit is checked or taken. Nobody is asked to pay for a job that
 *      will not run
 *   2. an English essay quoting Chinese goes straight through and is charged
 *   3. the FREE SCAN still works on all of them, because layer A and metadata
 *      do not care what language the writing is in
 *
 * Korean is in here on purpose as the control: it is an Asian script that DOES
 * put spaces between its words, so it counts correctly, prices correctly, and
 * must not be refused.
 */
import {
  b64,
  ledgerRows,
  postClean,
  postScan,
  signedIn,
  SITE,
} from './_route-session-harness.mjs';
import { balanceOf, destroy, forgetAllLaneClaims } from './_lane-b-throwaway.mjs';

const CHINESE = `人工智能与写作的未来

近年来，大型语言模型的发展速度超出了几乎所有人的预期。写作这件事，曾经被认为是人类最难以被机器取代的能力之一，如今却成了这些模型最擅长的领域。本文试图讨论的问题很简单：当机器可以写出流畅的文章时，写作教育应该做什么。

首先要承认一个事实。学生使用这些工具，不是因为他们懒惰，而是因为工具就在那里，而且好用。任何一项技术，只要显著降低了完成某件事的成本，就一定会被广泛使用。指责学生没有意义，禁止使用也几乎不可能执行。

最后，我想说的是，写作的价值从来不在于产出文字。写作是一种思考方式。机器可以替我们写出句子，但不能替我们思考。教育要保护的，是后者。`;

const JAPANESE = `日本語の文章と機械翻訳について

ここ数年で機械翻訳の精度は大きく向上した。かつては不自然な直訳しか出てこなかったものが、今では専門的な文章でもそれなりに読める日本語になる。しかし、翻訳という作業が本当に自動化されたのかというと、そうとは言い切れない。

たとえば「よろしくお願いします」という一文を考えてみたい。この表現は場面によって意味がまったく変わる。機械はこの違いを文脈から推測しようとするが、日本語の文章はしばしば主語を省略するため、その手がかりが足りない。`;

const THAI = `การอ่านและการเขียนในยุคปัญญาประดิษฐ์

ในช่วงไม่กี่ปีที่ผ่านมา เครื่องมือปัญญาประดิษฐ์ได้เข้ามามีบทบาทในการเขียนอย่างมาก นักเรียนและนักศึกษาจำนวนมากใช้เครื่องมือเหล่านี้ในการร่างงานเขียน ตรวจไวยากรณ์ และเรียบเรียงความคิด คำถามที่สำคัญคือ การศึกษาควรตอบสนองต่อสิ่งนี้อย่างไร

ประการแรก เราควรยอมรับว่าเครื่องมือเหล่านี้จะไม่หายไป การห้ามใช้แทบจะเป็นไปไม่ได้ในทางปฏิบัติ`;

const KOREAN = `인공지능과 글쓰기의 미래에 대하여

최근 몇 년 사이 대규모 언어 모델의 발전 속도는 거의 모든 사람의 예상을 뛰어넘었다. 글쓰기는 오랫동안 기계가 대체하기 가장 어려운 능력으로 여겨졌지만, 이제는 이 모델들이 가장 잘하는 일이 되었다. 이 글에서 다루려는 질문은 간단하다. 기계가 유창한 글을 쓸 수 있게 된 지금, 글쓰기 교육은 무엇을 해야 하는가.

먼저 한 가지 사실을 인정해야 한다. 학생들이 이 도구를 쓰는 것은 게으르기 때문이 아니라 도구가 거기에 있고 쓸 만하기 때문이다.`;

const ENGLISH_QUOTING_CHINESE = `The Analects and the Problem of Translation

Confucius opens the Analects with a line every Chinese schoolchild can recite: 學而時習之，不亦說乎. Legge renders it "Is it not pleasant to learn with a constant perseverance and application?", which is accurate and completely dead on the page. Waley gives us "To learn and at due times to repeat what one has learnt, is that not after all a pleasure?", and the difference between the two is the whole argument of this essay.

The trouble is the character 習. It is usually glossed as "to practise", but the graph shows feathers over a sun, and the oldest commentaries read it as a bird trying its wings again and again. Legge's "application" loses the bird entirely. Waley keeps the repetition but not the flight.

A second example makes the point sharper. In Book Two, Confucius says 溫故而知新，可以為師矣. Every translator agrees this means something like "review the old and know the new, and you may become a teacher." Nobody agrees on 溫, which literally means to warm something up. The teacher in this sentence is not consulting the past. He is reheating it.

The conclusion I want to draw is modest. A reader with no Chinese should be given more than one translation, and should be told, plainly, where they disagree and why. That is a lot to ask of a paperback. It is not very much to ask of a seminar.`;

/** The same arithmetic the route does, printed so the threshold is visible. */
const SPACELESS = /(?=\p{L})[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}]/gu;
const ANY_LETTER = /\p{L}/gu;
const count = (t, re) => t.length - t.replace(re, '').length;
const share = (t) => {
  const letters = count(t, ANY_LETTER);
  return letters ? count(t, SPACELESS) / letters : 0;
};

let failures = 0;

function report(name, ok, detail) {
  if (!ok) failures += 1;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (detail) console.log(`        ${detail}`);
}

const CASES = [
  ['Chinese document', CHINESE, 'refuse'],
  ['Japanese document', JAPANESE, 'refuse'],
  ['Thai document', THAI, 'refuse'],
  ['Korean document (spaces between words)', KOREAN, 'accept'],
  ['English essay quoting Chinese', ENGLISH_QUOTING_CHINESE, 'accept'],
];

console.log('\nIS THE REWRITE REFUSED FOR SCRIPTS WE CANNOT PRICE?');
console.log('='.repeat(78));
console.log(`  site   ${SITE}`);

console.log('\n--- what the route measures, before it decides ---');
console.log(
  '  ' + 'document'.padEnd(40) + 'letters'.padStart(8) + 'spaceless'.padStart(11) + 'share'.padStart(9),
);
for (const [name, text] of CASES) {
  console.log(
    '  ' +
      name.padEnd(40) +
      String(count(text, ANY_LETTER)).padStart(8) +
      String(count(text, SPACELESS)).padStart(11) +
      (share(text) * 100).toFixed(1).padStart(8) + '%',
  );
}

const account = await signedIn('cjk', 50);

console.log(`\n  account ${account.id.slice(0, 8)}`);

try {
  const opening = await balanceOf(account.id);
  console.log(`  balance before anything runs: ${opening}`);

  for (const [name, text, expected] of CASES) {
    const { status, body } = await postClean(account.cookies, {
      file: b64(text),
      name: 'paste.txt',
      layer_b: true,
    });

    console.log(`\n--- ${name} ---`);
    console.log(`  POST /api/tool/clean {layer_b: true} -> HTTP ${status}`);

    if (expected === 'refuse') {
      console.log(`  code    ${body.code}`);
      console.log(`  message ${body.message}`);
      report(
        `${name}: refused`,
        status === 400 && body.code === 'unsupported_script',
        status === 400 && body.code === 'unsupported_script'
          ? undefined
          : `got HTTP ${status} ${body.code ?? ''}`,
      );
    } else {
      console.log(`  charged ${body.credits?.charged}  balance ${body.credits?.balance}`);
      report(
        `${name}: went through and was charged`,
        body.ok === true && body.credits?.charged >= 1,
        body.ok === true ? undefined : `HTTP ${status} ${body.code ?? ''} ${body.message ?? ''}`,
      );
    }
  }

  const rows = await ledgerRows(account.id);
  const spends = rows.filter((r) => r.reason === 'spend');

  console.log('\n--- the ledger after all five ---');
  for (const r of rows) {
    console.log(
      '   ',
      String(r.delta > 0 ? '+' + r.delta : r.delta).padStart(5),
      String(r.reason).padEnd(18),
      String(r.endpoint ?? '-').padEnd(8),
      String(r.words_in ?? '-').padStart(6),
      'words',
    );
  }
  console.log(`    SUM = ${rows.reduce((s, r) => s + r.delta, 0)}`);

  report(
    'NOTHING was charged for the three refused documents',
    spends.length === 2,
    `${spends.length} spend row(s); two accepted documents means exactly two`,
  );

  console.log('\n--- the FREE SCAN, on the documents the rewrite refused ---');
  for (const [name, text] of CASES.slice(0, 3)) {
    const { status, body } = await postScan({ file: b64(text), name: 'paste.txt' });
    const hits = body.report?.suspicious_total;
    console.log(
      `  ${name.padEnd(40)} HTTP ${status}  ok=${body.ok}  characters checked=${body.report?.length}  hidden found=${hits}`,
    );
    report(`${name}: the free scan still runs`, status === 200 && body.ok === true);
  }
} finally {
  await destroy(account);
  const cleared = await forgetAllLaneClaims();
  console.log(`\n  throwaway account deleted; ${cleared} grant-claim row(s) cleared.`);
}

console.log('\n' + '='.repeat(78));
console.log(failures === 0 ? '  ALL PASS\n' : `  ${failures} FAILED\n`);
process.exit(failures === 0 ? 0 : 1);
