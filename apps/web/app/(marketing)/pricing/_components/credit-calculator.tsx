'use client';

import { useState } from 'react';

import { ArrowRightIcon } from 'lucide-react';

import { CreditCoin } from '../../_components/workbench/credit-chip';
import { FREE_CREDITS, PACKS, WORDS_PER_CREDIT } from './pricing-data';

/**
 * "What does five dollars actually get me?" answered by dragging a handle.
 *
 * Jon's brief for this page: "we know exactly what this price correlates to,
 * $5 gets me equals X." A credit is an abstraction, and no amount of prose
 * turns an abstraction into a decision. A visitor moves the handle to the
 * size of the thing sitting in their downloads folder and reads the answer
 * in dollars.
 *
 * THE ARITHMETIC IS THE SERVER'S ARITHMETIC. `costFor` in
 * `_components/workbench/credits.ts` prices pasted text as
 * `max(1, ceil(words / 1000))`, and the server recomputes the same thing from
 * the payload. This mirrors it exactly rather than approximating it, so the
 * number here is the number the ledger will charge.
 *
 * THE SCALE IS A STEPPED INDEX, NOT A LINEAR WORD COUNT. Linear from zero to
 * a hundred thousand crushes the range almost everybody lives in (one to ten
 * thousand words) into the first tenth of the track. Stepping through round
 * numbers gives the useful range most of the handle's travel and keeps every
 * label a number a person would actually say out loud.
 */
const STEPS = [
  500, 1_000, 1_500, 2_000, 2_500, 3_000, 4_000, 5_000, 6_500, 8_000, 10_000,
  15_000, 20_000, 30_000, 50_000, 75_000, 100_000,
];

const PRESETS = [
  { label: 'A short essay', words: 1_000 },
  { label: 'A term paper', words: 2_500 },
  { label: 'A thesis chapter', words: 8_000 },
];

/** The default sits on a term paper, which is the job most visitors arrive with. */
const DEFAULT_INDEX = STEPS.indexOf(2_500);

function creditsFor(words: number) {
  return Math.max(1, Math.ceil(words / WORDS_PER_CREDIT));
}

export function CreditCalculator() {
  const [index, setIndex] = useState(DEFAULT_INDEX);

  const words = STEPS[index] ?? 2_500;
  const credits = creditsFor(words);

  const covered = FREE_CREDITS >= credits;
  const pack = PACKS.find((entry) => entry.credits >= credits) ?? PACKS[2]!;

  /** How far along the track the handle sits, used to paint the filled part. */
  const progress = (index / (STEPS.length - 1)) * 100;

  return (
    <div
      className={
        'bg-card ring-border/70 overflow-hidden rounded-[20px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1'
      }
    >
      <div className={'grid lg:grid-cols-2'}>
        {/* The control. */}
        <div className={'p-6 sm:p-8'}>
          <p
            className={
              'text-muted-foreground text-[12px] font-semibold tracking-[0.06em] uppercase'
            }
          >
            I need to sanitise
          </p>

          <p
            className={
              'text-foreground mt-3 text-[36px] leading-none font-semibold tracking-[-0.035em] tabular-nums sm:text-[44px]'
            }
          >
            {words.toLocaleString('en-US')}
            <span
              className={
                'text-muted-foreground ml-2 text-[15px] font-medium tracking-normal sm:text-[16px]'
              }
            >
              words
            </span>
          </p>

          <label className={'mt-7 block'}>
            <span className={'sr-only'}>How many words are you sanitising</span>
            <input
              type={'range'}
              min={0}
              max={STEPS.length - 1}
              step={1}
              value={index}
              onChange={(event) => setIndex(Number(event.target.value))}
              style={{
                background: `linear-gradient(to right, var(--mark) 0%, var(--mark) ${progress}%, color-mix(in oklab, var(--foreground) 12%, transparent) ${progress}%, color-mix(in oklab, var(--foreground) 12%, transparent) 100%)`,
              }}
              className={
                'h-[6px] w-full cursor-pointer appearance-none rounded-full outline-none ' +
                'focus-visible:ring-mark/45 focus-visible:ring-4 ' +
                '[&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:bg-mark-strong [&::-webkit-slider-thumb]:size-[24px] [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(0,0,0,0.22)] [&::-webkit-slider-thumb]:transition-transform ' +
                '[&::-webkit-slider-thumb]:active:scale-[1.12] [&::-webkit-slider-thumb]:active:cursor-grabbing ' +
                '[&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:bg-mark-strong [&::-moz-range-thumb]:size-[24px] [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:shadow-[0_2px_8px_rgba(0,0,0,0.22)]'
              }
            />
          </label>

          <div
            className={
              'text-muted-foreground mt-2.5 flex justify-between text-[11.5px] tabular-nums'
            }
          >
            <span>500</span>
            <span>10,000</span>
            <span>100,000</span>
          </div>

          <div className={'mt-6 flex flex-wrap gap-2'}>
            {PRESETS.map((preset) => {
              const active = words === preset.words;

              return (
                <button
                  key={preset.label}
                  type={'button'}
                  onClick={() => setIndex(STEPS.indexOf(preset.words))}
                  className={[
                    'min-h-[40px] rounded-full px-4 py-2 text-[13px] font-medium transition-colors',
                    active
                      ? 'bg-foreground text-background'
                      : 'border-border/80 text-muted-foreground hover:border-foreground/30 hover:text-foreground border',
                  ].join(' ')}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* The answer. */}
        <div
          className={
            'border-border/70 bg-mark/[0.05] flex flex-col justify-center border-t p-6 sm:p-8 lg:border-t-0 lg:border-l'
          }
        >
          <p
            className={
              'text-muted-foreground text-[12px] font-semibold tracking-[0.06em] uppercase'
            }
          >
            That costs
          </p>

          <p className={'mt-3 flex items-center gap-2.5'}>
            <CreditCoin className={'size-[30px] shrink-0 sm:size-[34px]'} />
            <span
              className={
                'text-foreground text-[36px] leading-none font-semibold tracking-[-0.035em] tabular-nums sm:text-[44px]'
              }
            >
              {credits}
            </span>
            <span
              className={
                'text-muted-foreground text-[15px] font-medium sm:text-[16px]'
              }
            >
              {credits === 1 ? 'credit' : 'credits'}
            </span>
          </p>

          {covered ? (
            <p
              className={
                'text-foreground mt-5 text-[14.5px] leading-[1.6] font-medium'
              }
            >
              Your five free credits already cover this. You do not need to buy
              anything to run it.
            </p>
          ) : (
            <div className={'mt-5'}>
              <p className={'text-muted-foreground text-[14px] leading-[1.6]'}>
                The smallest pack that covers it is{' '}
                <span className={'text-foreground font-semibold'}>
                  {pack.name}
                </span>{' '}
                at{' '}
                <span className={'text-foreground font-semibold'}>
                  ${pack.dollars}.{pack.cents}
                </span>
                {pack.credits === credits
                  ? ', and it covers it exactly.'
                  : `, which leaves ${pack.credits - credits} ${pack.credits - credits === 1 ? 'credit' : 'credits'} for the next one.`}
              </p>
            </div>
          )}

          <p
            className={
              'border-border/70 text-muted-foreground mt-6 border-t pt-5 text-[13px] leading-[1.6]'
            }
          >
            Files are one credit each whatever their size, so a folder of
            twelve images is twelve credits. Scanning stays free either way.
          </p>

          <a
            href={'#packs'}
            className={
              'text-foreground mt-4 inline-flex items-center gap-1.5 self-start text-[13.5px] font-semibold'
            }
          >
            See the packs
            <ArrowRightIcon className={'size-[14px]'} strokeWidth={2.2} aria-hidden />
          </a>
        </div>
      </div>
    </div>
  );
}
