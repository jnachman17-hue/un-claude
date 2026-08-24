import Link from 'next/link';

import {
  ArrowRightIcon,
  CheckIcon,
  ClipboardPasteIcon,
  EyeOffIcon,
  FileTextIcon,
  FingerprintIcon,
  ImageIcon,
  MinusIcon,
  PaperclipIcon,
  TypeIcon,
} from 'lucide-react';

import { CtaBand } from '../_components/cta-band';
import { MobileDisclosure } from '../_components/mobile-disclosure';
import { PageHeader } from '../_components/prose';

import { shareTags } from '~/lib/share-tags';

/**
 * Written once and used twice: the browser tab and the share preview must
 * not be able to drift apart.
 */
const DESCRIPTION =
  'Give Un-Claude pasted text, a Word document or an image, and see exactly what happens: which marks come off, what comes back, and what we stand behind.';

export const metadata = {
  title: 'What we do',
  description: DESCRIPTION,
  alternates: { canonical: '/capabilities' },
  ...shareTags({
    title: 'What we do',
    description: DESCRIPTION,
    path: '/capabilities',
  }),
};

/**
 * Rebuilt from scratch, 20 August 2026, on Jon's order. The old page was a
 * single claims list that mixed capability, proof, teaching and terms-of-service
 * material in one column, so "we support PDFs: no" sat next to "your text is
 * stored: no" and neither answered the visitor's actual question.
 *
 * The question is: does it work on my thing? So the page now opens on an
 * input-by-mark matrix in the landing page's own table grammar, follows with
 * what each removal claims, and closes on the commitments. The teaching about
 * which mark is Claude's lives at /how-it-works, where it belongs, and the
 * pages point at each other.
 *
 * The claims boundary throughout is .claude/skills/unclaude-messaging: the
 * shared cell label is "sanitised", the one verb true of all three marks
 * (04 entry 78 ruling 3), and proof language is layer-specific below.
 */

type Cell = 'yes' | 'na' | 'paste';

const CELL: Record<Cell, { icon: typeof CheckIcon; className: string; label: string }> = {
  yes: {
    icon: CheckIcon,
    className: 'bg-emerald-600 text-white',
    label: 'Sanitised on this input',
  },
  na: {
    icon: MinusIcon,
    className: 'bg-foreground/12 text-foreground/40',
    label: 'Nothing there to remove',
  },
  paste: {
    icon: ClipboardPasteIcon,
    className: 'bg-amber-500 text-white',
    label: 'Paste the text instead',
  },
};

/**
 * THE CELLS CARRY THE ANSWER NOW. Rewritten 21 August 2026, session 10.
 *
 * Jon: "the text can't carry over... it expands all the way over into the
 * right columns where no text should be... on mobile the text hangs over so
 * much worse and obscures the icons for everything else. This literally needs
 * to be done in like five words or something."
 *
 * Each row used to end in a three-line grey paragraph that answered all three
 * columns at once, running the full width of the table underneath the dots.
 * So the reader had to hold three questions in their head and then unpick one
 * sentence to answer them, and the answer was nowhere near the column it
 * belonged to.
 *
 * Now every intersection says its own answer in three or four words, sitting
 * beside its own dot. The paragraph is gone.
 *
 * THE REGISTER IS NOT DECORATION, IT IS THE CLAIMS BOUNDARY IN SHORTHAND, and
 * this is the thing to protect if these words are ever edited. The two
 * provable layers say "with a receipt"; the statistical rewrite says
 * "measured". Same table, two different strengths of claim, exactly as
 * `.claude/skills/unclaude-messaging` requires, and short enough that the
 * distinction is legible rather than buried in a caveat at the end of a
 * sentence. Do not give the rewrite a receipt word.
 *
 * Jon also asked for the "scan it in under a second" line to go. It has.
 */
const INPUTS: Array<{
  input: string;
  icon: typeof TypeIcon;
  cells: [Cell, Cell, Cell];
  says: [string, string, string];
}> = [
  {
    input: 'Pasted text',
    icon: TypeIcon,
    cells: ['yes', 'na', 'yes'],
    says: ['Removed, with a receipt', 'No file, no metadata', 'Rewritten, and measured'],
  },
  {
    input: 'Word documents',
    icon: FileTextIcon,
    cells: ['yes', 'yes', 'paste'],
    says: [
      'Removed, with a receipt',
      'Removed, with a receipt',
      'Paste the text instead',
    ],
  },
  {
    input: 'PNG and JPG images',
    icon: ImageIcon,
    cells: ['na', 'yes', 'na'],
    says: ['No text to check', 'Removed, with a receipt', 'No text to rewrite'],
  },
];

const COLUMNS = ['Hidden characters', 'Metadata', 'Statistical watermark'] as const;

/**
 * What each removal claims, in the three real names, Claude forward. The
 * heads share one grammar: the mark, then the verb we stand behind for it.
 */
const CLAIMS = [
  {
    icon: EyeOffIcon,
    anchor: '/how-it-works#hidden-characters',
    head: 'Hidden characters: removed and shown',
    body: 'Nine classes of invisible character checked on every scan. Each one is named, given its exact position, and the text is read back afterwards to confirm none remain. You see the count.',
  },
  {
    icon: PaperclipIcon,
    anchor: '/how-it-works#metadata',
    head: 'Metadata: removed and proven',
    body: 'C2PA credentials, EXIF, XMP and generator tags come off, verified against the raw bytes of the file. On a file Claude made, this is Claude’s mark coming off, with proof.',
  },
  {
    icon: FingerprintIcon,
    anchor: '/how-it-works#statistical-watermark',
    head: 'Statistical watermark: sanitised and measured',
    body: 'If Claude wrote your text, this mark is in the words themselves. A rewrite engineered for that one mark breaks the word sequences it rides on, holds your facts and length, and hands you the measurements from every run.',
  },
] as const;

/**
 * The commitments. Each one is a line we hold because breaking it would make
 * the confident claims above worthless.
 */
const LINES = [
  {
    head: 'Nothing is stored.',
    body: 'Text and files are processed, returned and deleted. Uploads are held only for the length of the request, and nothing you paste is kept.',
  },
  {
    head: 'No verified-removal claims for the rewrite.',
    body: 'Anthropic’s public detector is not open yet, so today nobody can check a text watermark, us included. Until it opens, we hand you measurements and say exactly what they are.',
  },
  {
    head: 'The day the detector opens, we check every run.',
    body: 'Anthropic has committed to a detection API anyone can use. From the day it opens we run our own output against it, and if the rewrite ever fails that check, this page says so and that part stops being sold.',
  },
] as const;

function Capabilities() {
  return (
    <div className={'flex flex-col'}>
      <PageHeader
        title={'What we do, exactly.'}
        standfirst={
          'Give us pasted text, a Word document or an image, and this page says precisely what happens: which marks come off, what comes back, and what we will put our name to.'
        }
      />

      {/* The matrix. Find your input, read your row. */}
      <section className={'border-border/70 border-b'}>
        <div className={'mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14'}>
          <div className={'grid gap-8 lg:grid-cols-12 lg:gap-14'}>
            <div className={'lg:col-span-4'}>
              <h2
                className={
                  'text-foreground text-[24px] leading-[1.15] font-semibold tracking-[-0.024em] text-balance sm:text-[28px]'
                }
              >
                Find your input. Read your row.
              </h2>
              <p className={'text-muted-foreground mt-3 max-w-[40ch] text-[15px] leading-[1.6]'}>
                Three kinds of input, three kinds of mark. The columns are the
                marks, explained mark by mark on{' '}
                <Link
                  href={'/how-it-works'}
                  className={'text-foreground underline decoration-1 underline-offset-2'}
                >
                  how it works
                </Link>
                .
              </p>
            </div>

            <div className={'lg:col-span-8'}>
              {/*
                TWO LAYOUTS, ONE SET OF FACTS. A three-column matrix with
                readable words in it cannot fit across 375px, and the version
                that tried is what Jon reported: "on mobile the text hangs
                over so much worse and obscures the icons for everything
                else."

                So the phone gets the same table turned on its side, one card
                per input with its three marks listed under it, and the wide
                screen keeps the matrix. Same rows, same columns, same words.
                The breakdown by input type is unchanged; only how it is
                folded is.
              */}
              <div className={'border-border/70 overflow-hidden rounded-[14px] border'}>
                {/* Phones. One card per input. */}
                <ul className={'divide-border/70 divide-y sm:hidden'}>
                  {INPUTS.map((row) => (
                    <li key={row.input} className={'px-4 py-3.5'}>
                      <div className={'flex items-center gap-2.5'}>
                        <row.icon
                          className={'text-muted-foreground size-[15px] shrink-0'}
                          strokeWidth={1.9}
                          aria-hidden
                        />
                        <span
                          className={
                            'text-foreground text-[14px] font-medium tracking-[-0.012em]'
                          }
                        >
                          {row.input}
                        </span>
                      </div>

                      <dl className={'mt-2.5 flex flex-col gap-2'}>
                        {COLUMNS.map((column, index) => (
                          <div key={column} className={'flex items-center gap-2.5'}>
                            <CellDot cell={row.cells[index]!} />
                            <dt
                              className={
                                'text-muted-foreground w-[104px] shrink-0 text-[11.5px] leading-tight'
                              }
                            >
                              {column}
                            </dt>
                            <dd
                              className={
                                'text-foreground min-w-0 flex-1 text-[12.5px] leading-tight font-medium'
                              }
                            >
                              {row.says[index]}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </li>
                  ))}
                </ul>

                {/* Everything wider. The matrix. */}
                <div className={'hidden sm:block'}>
                  <div
                    className={
                      'text-muted-foreground bg-foreground/[0.022] grid grid-cols-[minmax(0,0.9fr)_repeat(3,minmax(0,1fr))] items-end gap-x-4 px-5 py-2.5 text-[11px] font-medium tracking-wide uppercase'
                    }
                  >
                    <span>Input</span>
                    {COLUMNS.map((column) => (
                      <span key={column} className={'leading-tight'}>
                        {column}
                      </span>
                    ))}
                  </div>

                  <ul className={'divide-border/70 divide-y'}>
                    {INPUTS.map((row) => (
                      <li
                        key={row.input}
                        className={
                          'grid grid-cols-[minmax(0,0.9fr)_repeat(3,minmax(0,1fr))] items-center gap-x-4 px-5 py-3.5'
                        }
                      >
                        <div className={'flex min-w-0 items-center gap-2.5'}>
                          <row.icon
                            className={'text-muted-foreground size-[15px] shrink-0'}
                            strokeWidth={1.9}
                            aria-hidden
                          />
                          <span
                            className={
                              'text-foreground text-[14px] font-medium tracking-[-0.012em]'
                            }
                          >
                            {row.input}
                          </span>
                        </div>

                        {row.cells.map((cell, index) => (
                          <div
                            key={index}
                            className={'flex min-w-0 items-center gap-2'}
                          >
                            <CellDot cell={cell} />
                            <span
                              className={
                                'text-foreground min-w-0 text-[12px] leading-tight font-medium'
                              }
                            >
                              {row.says[index]}
                            </span>
                          </div>
                        ))}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className={'text-muted-foreground mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[12px]'}>
                {(Object.keys(CELL) as Cell[]).map((cell) => (
                  <span key={cell} className={'inline-flex items-center gap-1.5'}>
                    <CellDot cell={cell} /> {CELL[cell].label}
                  </span>
                ))}
              </div>

              <p className={'text-muted-foreground/60 mt-4 text-[11px] leading-relaxed'}>
                More file types are coming soon.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What each removal claims, in one grammar. */}
      <section className={'border-border/70 border-b'}>
        <div className={'mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14'}>
          <div className={'grid gap-8 sm:grid-cols-3 sm:gap-10'}>
            {CLAIMS.map((claim) => (
              <div key={claim.head} className={'flex flex-col items-start'}>
                <claim.icon
                  className={'text-mark-strong size-[20px]'}
                  strokeWidth={2}
                  aria-hidden
                />
                <h2
                  className={
                    'text-foreground mt-3 text-[18px] leading-[1.25] font-semibold tracking-[-0.02em] text-balance'
                  }
                >
                  {claim.head}
                </h2>
                {/*
                  THE HEAD IS THE CLAIM, THE BODY IS THE EXPLANATION.
                  21 August 2026.

                  "Hidden characters: removed and shown", "Metadata: removed
                  and proven", "Statistical watermark: sanitised and
                  measured": each head already carries its own strength of
                  claim, which is what makes it safe to put the four lines
                  under it behind a plus on a phone. Read the three heads in a
                  row and the boundary between what is proven and what is
                  measured is still legible without opening anything.
                */}
                <div className={'mt-1.5 w-full sm:contents'}>
                  <MobileDisclosure label={'What this means'}>
                    <p className={'text-muted-foreground max-w-[38ch] text-[14px] leading-[1.6] sm:mt-1.5'}>
                      {claim.body}
                    </p>
                  </MobileDisclosure>
                </div>
                <Link
                  href={claim.anchor}
                  className={
                    'text-foreground hover:bg-foreground/[0.045] mt-3 inline-flex items-center gap-1.5 rounded-[8px] py-1 pr-2 text-[12.5px] font-semibold transition-colors'
                  }
                >
                  How this mark works
                  <ArrowRightIcon className={'size-[13px]'} strokeWidth={2.2} aria-hidden />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The commitments. */}
      <section className={'border-border/70 border-b'}>
        <div className={'mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14'}>
          <div className={'grid gap-8 lg:grid-cols-12 lg:gap-14'}>
            <div className={'lg:col-span-4'}>
              <h2
                className={
                  'text-foreground text-[24px] leading-[1.15] font-semibold tracking-[-0.024em] text-balance sm:text-[28px]'
                }
              >
                The lines we hold.
              </h2>
              <p className={'text-muted-foreground mt-3 max-w-[40ch] text-[15px] leading-[1.6]'}>
                The confident claims above are only worth something because of
                these.
              </p>
            </div>

            <div className={'lg:col-span-8'}>
              <ul className={'divide-border/70 divide-y'}>
                {LINES.map((line) => (
                  <li key={line.head} className={'py-4 first:pt-0 last:pb-0'}>
                    <h3 className={'text-foreground text-[15px] font-semibold tracking-[-0.012em]'}>
                      {line.head}
                    </h3>
                    <p className={'text-muted-foreground mt-1 max-w-[68ch] text-[13.5px] leading-[1.6]'}>
                      {line.body}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <CtaBand
        heading={'Start with the free scan.'}
        sub={'Paste text or drop a file, and see what it is carrying. No account needed.'}
        secondary={{ href: '/how-it-works', label: 'How it works' }}
      />
    </div>
  );
}

function CellDot({ cell }: { cell: Cell }) {
  const config = CELL[cell];
  const Icon = config.icon;

  return (
    <span
      title={config.label}
      className={`grid size-[18px] place-items-center rounded-full ${config.className}`}
    >
      <Icon className={'size-[11px]'} strokeWidth={2.6} aria-hidden />
      <span className={'sr-only'}>{config.label}</span>
    </span>
  );
}

export default Capabilities;
