import type { Metadata } from 'next';
import { Lora, Poppins } from 'next/font/google';

import { Workbench } from '../../_components/workbench/workbench';

/**
 * AN EXPERIMENT, NOT A DIRECTION. Jon, 19 August 2026: "I'm not saying we're
 * going to use it. I'm just asking you to do it."
 *
 * The landing page rebuilt to `.claude/skills/brand-guidelines` — Anthropic's
 * own kit — taken literally rather than selectively. Poppins headings, Lora
 * body, their five colours, white on orange.
 *
 * Folded in with it, Jon's three standing notes about the real page: the boxes
 * are too thick, too glaring and too demanding; things like the counter can just
 * sit on the page without a container; and white on orange is the Anthropic way
 * round.
 *
 * Deliberately standalone rather than a token override of the real components.
 * The point here is to remove the boxes, and the boxes are baked into those
 * components — fighting them through CSS would have taken longer and shown less.
 * The one real component included is the Workbench, because judging a landing
 * page without the product on it would be judging nothing.
 *
 * 04 entry 74 records what may and may not be taken from this kit if any of it
 * survives. The short version: the neutrals are already where we are, and the
 * identity and typography are Anthropic's own and are not ours to wear.
 */
export const metadata: Metadata = {
  title: 'Anthropic-kit rebuild',
  robots: { index: false, follow: false },
};

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-lora',
});

/** Straight from the skill. No adjustments. */
const BRAND = {
  dark: '#141413',
  light: '#faf9f5',
  midGray: '#b0aea5',
  lightGray: '#e8e6dc',
  orange: '#d97757',
  blue: '#6a9bcc',
  green: '#788c5d',
};

const MARKS = [
  {
    name: 'Hidden characters',
    body: 'Characters with no width, sitting between the words. They never appear on the page, they survive copy and paste, and we can show you exactly where each one was.',
    applies: 'Text and documents',
    accent: BRAND.orange,
  },
  {
    name: 'File provenance',
    body: 'A signed record inside the file saying which tool made it. Claude signs the files it generates, and anyone with a free C2PA reader can check. We strip it and show the file before and after.',
    applies: 'Images and documents',
    accent: BRAND.blue,
  },
  {
    name: 'Statistical watermark',
    body: 'Not a character. A pattern in which words the model chose, spread across long runs. Nothing can point at it, so it is removed by rewriting rather than found. Best effort, and we say so.',
    applies: 'Anything Claude wrote',
    accent: BRAND.green,
  },
];

function AnthropicKitPage() {
  return (
    <div
      className={`${poppins.variable} ${lora.variable}`}
      style={
        {
          // The kit's colours mapped onto the tokens the Workbench reads, so the
          // one real component on this page follows the experiment too.
          '--color-background': BRAND.light,
          '--color-card': BRAND.light,
          '--color-foreground': BRAND.dark,
          '--color-card-foreground': BRAND.dark,
          '--color-muted-foreground': '#6f6d65',
          '--color-border': BRAND.lightGray,
          '--color-mark': BRAND.orange,
          '--color-mark-strong': '#c4603f',
          '--color-mark-foreground': '#ffffff',
          backgroundColor: BRAND.light,
          color: BRAND.dark,
          fontFamily: 'var(--font-lora), Georgia, serif',
        } as React.CSSProperties
      }
    >
      <div className={'mx-auto max-w-[1080px] px-6 pt-8 pb-24 sm:px-10'}>
        {/* Header. No bar, no border, no card. */}
        <header className={'flex items-center justify-between'}>
          <span
            className={'text-[19px] font-semibold tracking-[-0.02em]'}
            style={{ fontFamily: 'var(--font-poppins), Arial, sans-serif' }}
          >
            <span style={{ color: BRAND.orange }}>■</span> Un-Claude
          </span>
          <nav
            className={'hidden gap-8 text-[14px] sm:flex'}
            style={{ color: '#6f6d65' }}
          >
            <span>How it works</span>
            <span>What we can do</span>
            <span>Why we built this</span>
          </nav>
          <span
            className={'rounded-full px-5 py-2 text-[14px] font-medium'}
            style={{
              backgroundColor: BRAND.orange,
              color: '#ffffff',
              fontFamily: 'var(--font-poppins), Arial, sans-serif',
            }}
          >
            Sign up
          </span>
        </header>

        {/* Hero. Nothing is in a box. */}
        <section className={'pt-16 sm:pt-24'}>
          <p
            className={'text-[13px] tracking-[0.14em] uppercase'}
            style={{
              color: BRAND.midGray,
              fontFamily: 'var(--font-poppins), Arial, sans-serif',
            }}
          >
            Claude marks what it writes
          </p>

          <h1
            className={
              'mt-5 max-w-[16ch] text-[44px] leading-[1.06] font-semibold tracking-[-0.03em] sm:text-[64px]'
            }
            style={{ fontFamily: 'var(--font-poppins), Arial, sans-serif' }}
          >
            Take the watermark
            <span style={{ color: BRAND.orange }}> out</span> of your writing.
          </h1>

          <p
            className={'mt-6 max-w-[54ch] text-[18px] leading-[1.7]'}
            style={{ color: '#4a4842' }}
          >
            Paste your text or drop a file. We find every mark that identifies
            it as AI written, show you where each one was, and take it out.
          </p>
        </section>

        {/* The tool. Still the subject of the page, just no longer shouting. */}
        <section className={'pt-12'}>
          <Workbench />
        </section>

        {/* The counter, with no container at all. Jon's example. */}
        <section
          className={'border-t pt-16 sm:pt-20'}
          style={{ borderColor: BRAND.lightGray, marginTop: '5rem' }}
        >
          <p
            className={'text-[13px] tracking-[0.14em] uppercase'}
            style={{
              color: BRAND.midGray,
              fontFamily: 'var(--font-poppins), Arial, sans-serif',
            }}
          >
            Words cleaned with Un-Claude
          </p>
          <p
            className={
              'mt-4 text-[56px] leading-none font-semibold tracking-[-0.035em] tabular-nums sm:text-[84px]'
            }
            style={{
              fontFamily: 'var(--font-poppins), Arial, sans-serif',
              color: BRAND.dark,
            }}
          >
            2,412,388
          </p>
          <p
            className={'mt-4 max-w-[52ch] text-[16px] leading-[1.7]'}
            style={{ color: '#6f6d65' }}
          >
            Hidden characters stripped, provenance removed and wording
            rewritten, across everything run through this page.
          </p>
        </section>

        {/* The three marks, as prose in columns rather than as cards. */}
        <section className={'pt-20 sm:pt-28'}>
          <h2
            className={
              'text-[30px] font-semibold tracking-[-0.02em] sm:text-[38px]'
            }
            style={{ fontFamily: 'var(--font-poppins), Arial, sans-serif' }}
          >
            Three kinds of mark, and only one needs rewriting.
          </h2>

          <div className={'mt-12 grid gap-x-12 gap-y-12 sm:grid-cols-3'}>
            {MARKS.map((mark) => (
              <div key={mark.name}>
                <span
                  className={'inline-block h-[3px] w-[34px] rounded-full'}
                  style={{ backgroundColor: mark.accent }}
                  aria-hidden
                />
                <h3
                  className={
                    'mt-5 text-[19px] font-semibold tracking-[-0.015em]'
                  }
                  style={{
                    fontFamily: 'var(--font-poppins), Arial, sans-serif',
                  }}
                >
                  {mark.name}
                </h3>
                <p
                  className={'mt-1.5 text-[12.5px] tracking-[0.1em] uppercase'}
                  style={{
                    color: BRAND.midGray,
                    fontFamily: 'var(--font-poppins), Arial, sans-serif',
                  }}
                >
                  {mark.applies}
                </p>
                <p
                  className={'mt-4 text-[16px] leading-[1.75]'}
                  style={{ color: '#4a4842' }}
                >
                  {mark.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* One orange band, so white-on-orange can be judged at size. */}
        <section
          className={'mt-24 rounded-[20px] px-8 py-14 sm:px-14 sm:py-20'}
          style={{ backgroundColor: BRAND.orange, color: '#ffffff' }}
        >
          <h2
            className={
              'max-w-[22ch] text-[30px] leading-[1.15] font-semibold tracking-[-0.02em] sm:text-[40px]'
            }
            style={{ fontFamily: 'var(--font-poppins), Arial, sans-serif' }}
          >
            Two of the three are provable. We show you the proof.
          </h2>
          <p
            className={'mt-5 max-w-[58ch] text-[17px] leading-[1.75]'}
            style={{ opacity: 0.92 }}
          >
            Hidden characters and file provenance are countable: the mark was
            there, now it is not, and you can see both. The third is best effort
            and no tool on earth can verify it, including ours. We would rather
            say that than sell you a number nobody can stand behind.
          </p>
          <span
            className={
              'mt-9 inline-block rounded-full px-7 py-3 text-[15px] font-semibold'
            }
            style={{
              backgroundColor: '#ffffff',
              color: BRAND.orange,
              fontFamily: 'var(--font-poppins), Arial, sans-serif',
            }}
          >
            Scan something free
          </span>
        </section>
      </div>
    </div>
  );
}

export default AnthropicKitPage;
