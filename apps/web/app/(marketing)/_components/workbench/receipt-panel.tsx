'use client';

import { AlertTriangleIcon } from 'lucide-react';

import type { Receipt } from '~/lib/engine/receipt';

/**
 * What the rewrite did, shown as measurement rather than as a verdict.
 *
 * The heading matters as much as the numbers. This is NOT a watermark score and
 * must never be presented as one: no detector exists, so nobody can produce such
 * a score, and an earlier version of this idea was killed in review precisely
 * because it read like one. 06 row 28.
 *
 * The run profile is the honest centre of it. The mark rides on runs of
 * consecutive words, so showing how much survives at three, four, five and more
 * words is a direct description of the attack. One number at one length is what
 * made the old version misleading.
 */
export function ReceiptPanel({ receipt }: { receipt: Receipt }) {
  const figuresLost = receipt.figuresIn - receipt.figuresKept;

  return (
    <div className={'animate-rise'}>
      <div className={'mb-3 flex items-baseline justify-between gap-3'}>
        <h3 className={'text-foreground text-[12px] font-semibold tracking-wide uppercase'}>
          What the rewrite changed
        </h3>
        <span className={'text-muted-foreground text-[11.5px]'}>Measured, not estimated</span>
      </div>

      <div className={'grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4'}>
        <Figure
          value={`${receipt.wordingChanged}%`}
          label={'of your wording replaced'}
          lit
        />
        <Figure
          value={`${receipt.longestRun}`}
          label={'longest run of original words left'}
          lit
        />
        <Figure
          value={`${receipt.figuresKept}/${receipt.figuresIn}`}
          label={'figures carried through intact'}
        />
        <Figure value={`${receipt.lengthKept}%`} label={'of the original length kept'} />
      </div>

      {/* The run profile. This is the measurement that actually describes the
          mechanism, and the reason a single number was not enough. */}
      <div className={'mt-5'}>
        <p className={'text-muted-foreground mb-2 text-[12px]'}>
          How much of your original wording survives, by run length
        </p>

        <ul className={'space-y-1.5'}>
          {receipt.runs.map((run) => (
            <li key={run.length} className={'flex items-center gap-3'}>
              <span
                className={'text-muted-foreground w-[58px] shrink-0 font-mono text-[11.5px] tabular-nums'}
              >
                {run.length} words
              </span>
              <span className={'bg-foreground/[0.06] h-[6px] flex-1 overflow-hidden rounded-full'}>
                <span
                  className={'bg-mark-strong block h-full rounded-full transition-[width] duration-700'}
                  style={{ width: `${Math.max(run.survivingPercent, run.survivingPercent > 0 ? 1.5 : 0)}%` }}
                />
              </span>
              <span
                className={'text-foreground w-[46px] shrink-0 text-right font-mono text-[11.5px] tabular-nums'}
              >
                {run.survivingPercent}%
              </span>
            </li>
          ))}
        </ul>
      </div>

      {figuresLost > 0 || receipt.figuresToCheck.length > 0 ? (
        <div
          className={
            'mt-4 flex gap-2.5 rounded-[10px] bg-amber-500/10 px-3 py-2.5 text-[12.5px] leading-snug'
          }
        >
          <AlertTriangleIcon
            className={'mt-[1px] size-[14px] shrink-0 text-amber-600'}
            strokeWidth={2.2}
            aria-hidden
          />
          <p className={'text-foreground/85'}>
            {receipt.figuresToCheck.length > 0 ? (
              <>
                Check these figures against your original before you use this:{' '}
                <span className={'font-mono font-medium'}>
                  {receipt.figuresToCheck.join(', ')}
                </span>
                .
              </>
            ) : (
              <>
                {figuresLost} {figuresLost === 1 ? 'figure' : 'figures'} could not be
                matched between the two versions. Read it through before you use it.
              </>
            )}
          </p>
        </div>
      ) : null}

      <p className={'text-muted-foreground mt-4 text-[12px] leading-relaxed'}>
        These numbers describe what changed. They are not a measure of whether the
        watermark is gone, and nothing can be: no public detector exists for any
        vendor’s text watermark, so no tool can honestly claim that number.
      </p>
    </div>
  );
}

function Figure({ value, label, lit }: { value: string; label: string; lit?: boolean }) {
  return (
    <div>
      <span
        className={[
          'block font-mono text-[26px] leading-none font-medium tracking-[-0.02em] tabular-nums',
          lit ? 'text-foreground' : 'text-foreground/70',
        ].join(' ')}
      >
        {value}
      </span>
      <span className={'text-muted-foreground mt-1.5 block text-[12px] leading-snug'}>
        {label}
      </span>
    </div>
  );
}
