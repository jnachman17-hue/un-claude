'use client';

import { AlertTriangleIcon, CheckIcon } from 'lucide-react';

import type { Receipt } from '~/lib/engine/receipt';

/**
 * What the rewrite did, shown as measurement.
 *
 * REBUILT 20 August 2026 to Jon's review of the first version, which he could
 * barely parse after building the product ("I can barely understand what that
 * is"). His brief: keep real metrics, make them readable by an average
 * person, drop the rows that are always empty, drop the disclaimer paragraph,
 * and let the panel read like the job got done. 04 entry 95.
 *
 * What changed and why:
 *
 *   THE FOUR TILES SPEAK PLAINLY. Each one is a claim a stranger can parse:
 *   how much wording was replaced, the longest piece of the original left,
 *   how much length was kept, and the facts accounted for. The facts tile
 *   only appears when the text HAS facts; prose with no figures gets the
 *   word count instead of a meaningless 0/0.
 *
 *   THE BARS ONLY SHOW WHAT EXISTS. The old chart printed six run lengths
 *   with four permanently at 0%, which read as filler. Zero rows are gone;
 *   what remains is only the stretch lengths that actually survived, and if
 *   nothing three words or longer survived at all, the chart is replaced by
 *   the sentence that says so, which is the best result the engine can
 *   produce and deserves to be said in words.
 *
 *   THE DISCLAIMER PARAGRAPH IS GONE at Jon's instruction. The layer B
 *   honesty lives where it is placed deliberately: /how-it-works,
 *   /capabilities, the FAQ. It does not need to be stapled under every run.
 *
 * Still never called a watermark score, 06 row 28: every number here
 * measures the rewrite, and the headline word is "broken up", not "removed".
 */
export function ReceiptPanel({ receipt }: { receipt: Receipt }) {
  const figuresLost = receipt.figuresIn - receipt.figuresKept;
  const survivingRuns = receipt.runs.filter((run) => run.survivingPercent > 0);
  const hasFigures = receipt.figuresIn > 0;

  return (
    <div className={'animate-rise'}>
      <div className={'mb-3 flex items-baseline justify-between gap-3'}>
        <h3 className={'text-foreground text-[12px] font-semibold tracking-wide uppercase'}>
          What the rewrite changed
        </h3>
        <span className={'text-muted-foreground text-[11.5px]'}>Measured, not estimated</span>
      </div>

      {/*
        FOUR TILES ON ONE GRID, ALL BUILT THE SAME WAY. Jon, 20 August 2026:
        "formatted so ugly... the sizing, the text, the spacing isn't
        coherent." It was four bare numbers with sentence fragments hanging
        under them at a size nothing else used, and long labels wrapped to
        three lines while short ones sat on one, so no two tiles were the same
        height or shape.

        Now every tile is a bordered cell with the same three parts in the same
        places: a small uppercase name, the figure, and a short line under it.
        The grid has a border and the cells sit inside it, so they read as one
        instrument rather than four measurements that landed nearby.
      */}
      <div
        className={
          'border-border/70 grid grid-cols-2 overflow-hidden rounded-[12px] border sm:grid-cols-4'
        }
      >
        <Figure
          name={'Replaced'}
          value={`${Math.round(receipt.wordingChanged)}%`}
          label={'of your wording'}
          lit
        />
        <Figure
          name={'Longest run'}
          value={receipt.longestRun > 0 ? String(receipt.longestRun) : '0'}
          unit={receipt.longestRun > 0 ? 'words' : undefined}
          label={'of your original left in a row'}
          lit
        />
        <Figure
          name={'Length'}
          value={`${receipt.lengthKept}%`}
          label={'of the original kept'}
        />
        {hasFigures ? (
          <Figure
            name={'Facts'}
            value={`${receipt.figuresKept}/${receipt.figuresIn}`}
            label={'figures carried through'}
          />
        ) : (
          <Figure
            name={'Returned'}
            value={receipt.wordsOut.toLocaleString('en-US')}
            label={'words handed back'}
          />
        )}
      </div>

      {/* The stretch chart, or the sentence that beats it. */}
      <div className={'mt-5'}>
        {survivingRuns.length > 0 ? (
          <>
            <p className={'text-foreground mb-0.5 text-[12.5px] font-medium'}>
              Pieces of your original wording still in a row
            </p>
            <p className={'text-muted-foreground mb-2 text-[11.5px] leading-snug'}>
              The mark can only travel in unbroken stretches of the original
              words. This is all that is left of them.
            </p>

            <ul className={'space-y-1.5'}>
              {survivingRuns.map((run) => (
                <li key={run.length} className={'flex items-center gap-3'}>
                  <span
                    className={
                      'text-muted-foreground w-[92px] shrink-0 font-mono text-[11.5px] tabular-nums'
                    }
                  >
                    {run.length} in a row
                  </span>
                  <span className={'bg-foreground/[0.06] h-[6px] flex-1 overflow-hidden rounded-full'}>
                    <span
                      className={'bg-mark-strong block h-full rounded-full transition-[width] duration-700'}
                      style={{ width: `${Math.max(run.survivingPercent, 1.5)}%` }}
                    />
                  </span>
                  <span
                    className={
                      'text-foreground w-[46px] shrink-0 text-right font-mono text-[11.5px] tabular-nums'
                    }
                  >
                    {run.survivingPercent}%
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className={'text-foreground flex items-start gap-2 text-[12.5px] leading-[1.55] font-medium'}>
            <CheckIcon
              className={'text-emerald-600 mt-[1px] size-[14px] shrink-0'}
              strokeWidth={2.6}
              aria-hidden
            />
            No stretch of even three original words survived. The sequences
            the mark travels in are broken up completely.
          </p>
        )}
      </div>

      {hasFigures && (figuresLost > 0 || receipt.figuresToCheck.length > 0) ? (
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
    </div>
  );
}

/**
 * One cell of the grid. Every tile is this shape, so the row scans across
 * rather than being read four times: name, figure, one short line.
 *
 * `unit` is separate from `value` so "4 words" sets the number at figure size
 * and the word at label size, instead of shrinking the whole thing to fit.
 */
function Figure({
  name,
  value,
  unit,
  label,
  lit,
}: {
  name: string;
  value: string;
  unit?: string;
  label: string;
  lit?: boolean;
}) {
  return (
    <div
      className={
        'border-border/70 flex flex-col gap-1 border-r border-b p-3 last:border-r-0 sm:border-b-0 [&:nth-child(2)]:border-r-0 sm:[&:nth-child(2)]:border-r'
      }
    >
      <span
        className={
          'text-muted-foreground text-[10px] font-semibold tracking-[0.07em] uppercase'
        }
      >
        {name}
      </span>

      <span className={'flex items-baseline gap-1'}>
        <span
          className={[
            'font-mono text-[22px] leading-none font-medium tracking-[-0.02em] tabular-nums',
            lit ? 'text-foreground' : 'text-foreground/70',
          ].join(' ')}
        >
          {value}
        </span>
        {unit ? (
          <span className={'text-muted-foreground text-[12px]'}>{unit}</span>
        ) : null}
      </span>

      <span className={'text-muted-foreground text-[11.5px] leading-snug text-balance'}>
        {label}
      </span>
    </div>
  );
}
