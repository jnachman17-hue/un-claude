'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { CheckIcon, RotateCcwIcon } from 'lucide-react';

/**
 * THE TWO MOVING PARTS OF "HOW THE REWRITE WORKS", 6 September 2026.
 *
 * Both of them exist because the same idea was previously a spec sheet: four
 * named rules sitting in a band under the third panel, telling a reader what
 * the engine IS and never what happens to their document. These two stages
 * are the same information as a sequence.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * ★ THE INDEXING CONSTRAINT, BECAUSE THIS IS THE EXACT SHAPE OF CHANGE THAT
 *   COST THIS SITE ITS GOOGLE INDEXING IN AUGUST.
 *
 * One `Date.now()` read during render abandoned prerendering for the whole
 * homepage body: 75 crawlable words instead of 1,234, and no `<h1>`.
 * `hero-section.tsx:255` has the full account.
 *
 * NOTHING IN THIS FILE IS READ DURING RENDER THAT NEXT CANNOT KNOW AHEAD OF
 * TIME. No clock, no random, no search params, no cookies. Every piece of
 * state starts at a CONSTANT, so the server renders this component into the
 * static HTML exactly as the browser first renders it, and every word inside
 * it is in the file a crawler reads.
 *
 * The constant it starts at is the SETTLED FINAL STATE, which is doing three
 * jobs at once:
 *
 *   1. A visitor with `prefers-reduced-motion` never leaves it. The observer
 *      below returns early for them, so they get the finished picture rather
 *      than a blank or half-built frame.
 *   2. A visitor with no JavaScript gets the same finished picture.
 *   3. A crawler reads the finished labels, not the opening ones.
 *
 * The rewind to step 0 happens in an effect, after mount. Both stages sit far
 * below the fold, so it is never on screen when it happens.
 *
 * NO ANIMATION LIBRARY, and none may be added. CSS transitions and React
 * state only. `styles/globals.css` already collapses every transition on the
 * site to 0.001ms under `prefers-reduced-motion`, globally, so a reduced
 * motion visitor who presses Replay gets discrete states with no tweening
 * rather than nothing at all.
 * ────────────────────────────────────────────────────────────────────────────
 */

/** One word the model chose, and the words it could have chosen instead. */
export type EntropyToken = {
  /** The word or run of words as the model actually wrote them. */
  text: string;
  /** Alternatives that would have read equally well. Absent means no choice. */
  alts?: string[];
  /** True where the wording was fixed and the model had no freedom at all. */
  locked?: boolean;
  /** Set on punctuation so it does not get a space in front of it. */
  glue?: boolean;
};

const CYCLE_STEPS = 11;
const CYCLE_MS = 340;

/**
 * Autoplay on entry, once, then stop. Jon's ruling: a permanently looping
 * paragraph competes with reading.
 *
 * `step` starts at the last step, which every stage below draws as its settled
 * state. Playing rewinds to 0 and walks forward on a timer.
 */
function usePlayOnEntry(steps: number, msPerStep: number) {
  const ref = useRef<HTMLDivElement | null>(null);
  const timers = useRef<number[]>([]);
  const [step, setStep] = useState(steps - 1);
  /** True for one frame while the stage is snapped back to the start, so the
   *  rewind does not play the whole transition backwards. */
  const [rewinding, setRewinding] = useState(false);

  const clear = useCallback(() => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  }, []);

  const play = useCallback(() => {
    clear();
    setRewinding(true);
    setStep(0);

    window.requestAnimationFrame(() => {
      setRewinding(false);
      for (let i = 1; i < steps; i += 1) {
        timers.current.push(window.setTimeout(() => setStep(i), i * msPerStep));
      }
    });
  }, [clear, msPerStep, steps]);

  useEffect(() => {
    const node = ref.current;

    if (!node) return;

    // The visitor asked for less motion. They keep the settled state, which is
    // what this component already renders, and nothing starts.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            observer.disconnect();
            play();
          }
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      clear();
    };
  }, [clear, play]);

  return { ref, step, play, rewinding };
}

function ReplayButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type={'button'}
      onClick={onClick}
      className={
        'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05] border-border/70 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors'
      }
    >
      <RotateCcwIcon className={'size-[11px]'} strokeWidth={2.2} aria-hidden />
      {label}
    </button>
  );
}

/**
 * BEAT 0, AND IT IS THE BEST IDEA IN THE PRODUCT MADE VISIBLE.
 *
 * Rebuilt from scene 2 of Jon's Claude Design canvas ("The model is nudged at
 * every pick"): running prose in which individual words cycle between
 * alternatives in place, the chosen word in rust and the alternatives passing
 * through in grey. Those are rendered videos, so this is the effect rebuilt
 * rather than the component lifted.
 *
 * What it has to teach, and the whole rewrite depends on it: a watermark
 * nudges a choice, so it can only sit where there WAS a choice. The locked
 * span is the other half of that sentence. It never moves, because there was
 * only ever one thing it could say.
 *
 * Every open word reserves the width of its longest alternative, so the line
 * shimmers in place instead of reflowing the paragraph on every tick.
 */
export function EntropyProse({ tokens }: { tokens: readonly EntropyToken[] }) {
  const { ref, step, play } = usePlayOnEntry(CYCLE_STEPS, CYCLE_MS);
  const settled = step === CYCLE_STEPS - 1;

  return (
    <div ref={ref} className={'flex h-full flex-col'}>
      <div className={'flex flex-1 items-center px-5 py-6 sm:px-7 sm:py-7'}>
        <p
          className={
            'text-[15px] leading-[1.95] sm:text-[15.5px] sm:leading-[2.1]'
          }
        >
          {tokens.map((token, index) => {
            const space = token.glue || index === 0 ? '' : ' ';

            if (!token.alts) {
              return (
                <span
                  key={index}
                  className={token.locked ? '' : 'text-muted-foreground'}
                >
                  {space}
                  {token.locked ? (
                    <span
                      className={
                        'bg-foreground/[0.06] text-foreground ring-border/70 rounded-[5px] px-1.5 py-0.5 font-medium ring-1'
                      }
                    >
                      {token.text}
                    </span>
                  ) : (
                    token.text
                  )}
                </span>
              );
            }

            // The word actually written comes first, so the settled state is
            // always the real sentence.
            const pool = [token.text, ...token.alts];
            const shown = settled
              ? token.text
              : pool[(step + index) % pool.length]!;
            const widest = Math.max(...pool.map((word) => word.length));

            return (
              <span key={index} className={'text-muted-foreground'}>
                {space}
                <span
                  className={[
                    'inline-block text-left transition-colors duration-200',
                    shown === token.text
                      ? 'text-mark-strong font-medium'
                      : 'text-foreground/35',
                  ].join(' ')}
                  style={{ minWidth: `${widest}ch` }}
                >
                  {shown}
                </span>
              </span>
            );
          })}
        </p>
      </div>

      <div
        className={
          'border-border/70 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-t px-5 py-3'
        }
      >
        <ul
          className={
            'text-muted-foreground flex flex-wrap gap-x-5 gap-y-1 text-[12px]'
          }
        >
          <li className={'flex items-center gap-1.5'}>
            <span
              className={'bg-mark-strong size-[7px] shrink-0 rounded-full'}
              aria-hidden
            />
            The model had a choice here
          </li>
          <li className={'flex items-center gap-1.5'}>
            <span
              className={
                'bg-foreground/[0.12] ring-border/70 size-[7px] shrink-0 rounded-[2px] ring-1'
              }
              aria-hidden
            />
            No choice, so nothing to nudge
          </li>
        </ul>

        <ReplayButton onClick={play} label={'Replay'} />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

/**
 * BEATS 2 TO 5, AS ONE CONTINUING TRANSFORMATION RATHER THAN FOUR DIAGRAMS.
 *
 * The same document is on screen the whole way through: it is cut into
 * pieces, the protected spans turn into numbered placeholders, everything
 * else is rebuilt, and the protected spans come back. Each step lights the
 * beat that describes it, so the words and the picture cannot drift apart.
 *
 * Chip widths are percentages of their row, so the strip fits any width from
 * 375px up without a single media query, and the rewrite step animates a real
 * width change rather than a fade.
 */

/** Percentage width of each chip, before and after the rewrite. A frozen chip
 *  keeps its width in both, because protected text comes back byte for byte. */
type Chip = { before: number; after: number; frozen?: number };

const PIECES: readonly (readonly (readonly Chip[])[])[] = [
  [
    [
      { before: 14, after: 20 },
      { before: 22, after: 15 },
      { before: 11, after: 16 },
      { before: 26, after: 22 },
      { before: 19, after: 19 },
    ],
    [
      { before: 17, after: 13 },
      { before: 25, after: 30 },
      { before: 30, after: 30, frozen: 17 },
      { before: 14, after: 20 },
    ],
  ],
  [
    [
      { before: 21, after: 15 },
      { before: 13, after: 19 },
      { before: 28, after: 24 },
      { before: 16, after: 21 },
      { before: 14, after: 13 },
    ],
    [
      { before: 30, after: 30, frozen: 24 },
      { before: 19, after: 24 },
      { before: 24, after: 18 },
      { before: 18, after: 19 },
    ],
  ],
  [
    [
      { before: 16, after: 22 },
      { before: 27, after: 19 },
      { before: 12, after: 17 },
      { before: 21, after: 25 },
      { before: 16, after: 9 },
    ],
    [
      { before: 23, after: 17 },
      { before: 15, after: 23 },
      { before: 20, after: 16 },
      { before: 26, after: 28 },
    ],
  ],
] as const;

const PIPELINE_STEPS = 5;
const PIPELINE_MS = 1250;

const CHECKS = ['Quotes exact', 'Figures held', 'Length held'] as const;

export type PipelineStep = { head: string; body: string };

export function RewritePipeline({ steps }: { steps: readonly PipelineStep[] }) {
  const { ref, step, play, rewinding } = usePlayOnEntry(
    PIPELINE_STEPS,
    PIPELINE_MS,
  );

  const split = step >= 1;
  const frozen = step >= 2;
  const rewritten = step >= 3;
  const restored = step >= 4;

  const move = rewinding
    ? 'transition-none'
    : 'transition-all duration-[620ms] ease-[cubic-bezier(0.4,0,0.2,1)]';

  return (
    <div className={'grid lg:grid-cols-2'}>
      {/* The four beats. Each lights when the strip reaches it, so a reader
          never has to work out which sentence the picture is illustrating.
          Two by two rather than a single column: four stacked beats made this
          card 715px against a 330px drawing beside it, and a numbered badge
          read in the ordinary reading order keeps the sequence legible at a
          third of the height. Below `sm` it is one column and the order is
          the same. */}
      <ol className={'grid gap-x-7 gap-y-5 p-5 sm:grid-cols-2 sm:p-8'}>
        {steps.map((entry, index) => {
          const active = step >= index + 1;

          return (
            <li key={entry.head} className={'flex gap-3'}>
              <span
                className={[
                  'mt-[1px] grid size-[21px] shrink-0 place-items-center rounded-full text-[11px] font-semibold transition-colors duration-500',
                  active
                    ? 'bg-mark text-mark-foreground'
                    : 'bg-foreground/[0.06] text-muted-foreground',
                ].join(' ')}
                aria-hidden
              >
                {index + 1}
              </span>

              <div className={'min-w-0'}>
                <h3
                  className={
                    'text-foreground text-[14.5px] font-semibold tracking-[-0.012em]'
                  }
                >
                  {entry.head}
                </h3>
                <p
                  className={
                    'text-muted-foreground mt-1 text-[13.5px] leading-[1.6]'
                  }
                >
                  {entry.body}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {/* The document itself. */}
      {/* ★ THE OBSERVER IS ON THIS COLUMN AND NOT ON THE CARD. Below `lg`
          the four beats stack above the drawing, so a card-level observer
          fired while the drawing was still most of a screen below the fold:
          it played its whole sequence and settled before anybody saw it. */}
      <div
        ref={ref}
        className={
          'border-border/70 bg-foreground/[0.016] flex flex-col border-t lg:border-t-0 lg:border-l'
        }
      >
        <div className={'flex flex-1 flex-col justify-center gap-0 p-5 sm:p-6'}>
          <div
            className={['flex flex-col', move, split ? 'gap-3' : 'gap-0'].join(
              ' ',
            )}
          >
            {PIECES.map((rows, pieceIndex) => (
              <div
                key={pieceIndex}
                className={[
                  'rounded-[7px] px-2.5 py-2',
                  move,
                  split
                    ? 'bg-card ring-border/70 ring-1'
                    : 'bg-transparent ring-0 ring-transparent',
                ].join(' ')}
              >
                <div
                  className={[
                    'flex items-center gap-1.5 overflow-hidden',
                    move,
                    split
                      ? 'mb-1.5 max-h-4 opacity-100'
                      : 'mb-0 max-h-0 opacity-0',
                  ].join(' ')}
                >
                  <span
                    className={
                      'text-muted-foreground text-[9.5px] font-semibold tracking-wide uppercase'
                    }
                  >
                    Piece {pieceIndex + 1}
                  </span>
                  <span className={'text-muted-foreground/70 text-[9.5px]'}>
                    about 350 words
                  </span>
                </div>

                <div className={'flex flex-col gap-[5px]'}>
                  {rows.map((row, rowIndex) => (
                    <div
                      key={rowIndex}
                      className={'flex items-center gap-[4px]'}
                    >
                      {row.map((chip, chipIndex) => {
                        const isFrozen = chip.frozen !== undefined;
                        const showsPlaceholder =
                          isFrozen && frozen && !restored;
                        const width =
                          rewritten && !isFrozen ? chip.after : chip.before;

                        return (
                          <span
                            key={chipIndex}
                            style={{ width: `${width}%` }}
                            className={[
                              'grid h-[13px] place-items-center overflow-hidden rounded-[3px]',
                              move,
                              showsPlaceholder
                                ? 'ring-mark-strong text-mark-strong bg-transparent ring-1'
                                : isFrozen && restored
                                  ? 'bg-foreground/[0.55]'
                                  : rewritten
                                    ? 'bg-mark/45'
                                    : 'bg-foreground/[0.11]',
                            ].join(' ')}
                          >
                            {showsPlaceholder ? (
                              <span
                                className={
                                  'font-mono text-[8.5px] leading-none'
                                }
                              >
                                [[{chip.frozen}]]
                              </span>
                            ) : null}
                          </span>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* The two captions the strip cannot draw for itself. They occupy
              the same reserved box so nothing below them moves when the
              sequence swaps one for the other. */}
          <div className={'relative mt-3 h-[34px]'}>
            <p
              className={[
                'text-muted-foreground absolute inset-x-0 top-0 text-[11.5px] leading-snug',
                move,
                rewritten && !restored ? 'opacity-100' : 'opacity-0',
              ].join(' ')}
            >
              Rewritten by a model that does not watermark its own output. The
              placeholders are all it can see of the protected text.
            </p>

            <ul
              className={[
                'absolute inset-x-0 top-0 flex flex-wrap gap-x-3.5 gap-y-1',
                move,
                restored ? 'opacity-100' : 'opacity-0',
              ].join(' ')}
            >
              {CHECKS.map((check) => (
                <li
                  key={check}
                  className={
                    'text-foreground/85 flex items-center gap-1.5 text-[11.5px] font-medium'
                  }
                >
                  <CheckIcon
                    className={'text-mark-strong size-[12px] shrink-0'}
                    strokeWidth={2.6}
                    aria-hidden
                  />
                  {check}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className={
            'border-border/70 flex items-center justify-between gap-4 border-t px-5 py-3'
          }
        >
          <p className={'text-muted-foreground text-[12px]'}>
            Your document, from paste to receipt
          </p>
          <ReplayButton onClick={play} label={'Replay'} />
        </div>
      </div>
    </div>
  );
}
