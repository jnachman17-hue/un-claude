'use client';

import { CheckIcon, MinusIcon, ScanLineIcon } from 'lucide-react';

/**
 * What was checked, every time, whatever came back.
 *
 * This is Jon's design and it is not a toss up. 06 row 27. A panel that lists
 * only what it FOUND teaches the visitor that finding things means the product
 * works, and there are several correct cases with nothing to show: text that was
 * never AI written, pasted text which has no file wrapper to inspect, and the
 * statistical watermark, which leaves no visible trace at all. In every one of
 * those a working product would look broken.
 *
 * So the rows are fixed. Three of them, always present, each resolving to a
 * state. Nothing is hidden because it came back empty.
 */

export type RowState = 'clean' | 'found' | 'skipped' | 'present' | 'pending';

export interface ChecklistRow {
  id: string;
  label: string;
  state: RowState;
  status: string;
  detail: string;
}

const TONE: Record<RowState, { icon: typeof CheckIcon; className: string }> = {
  clean: { icon: CheckIcon, className: 'text-foreground/45' },
  found: { icon: ScanLineIcon, className: 'text-mark-foreground bg-mark' },
  present: { icon: ScanLineIcon, className: 'text-mark-foreground bg-mark' },
  skipped: { icon: MinusIcon, className: 'text-foreground/25' },
  pending: { icon: ScanLineIcon, className: 'text-foreground/25' },
};

export function Checklist({ rows }: { rows: ChecklistRow[] }) {
  return (
    <ul className={'divide-border/70 divide-y'}>
      {rows.map((row, index) => {
        const tone = TONE[row.state];
        const Icon = tone.icon;
        const lit = row.state === 'found' || row.state === 'present';

        return (
          <li
            key={row.id}
            className={'animate-rise py-2.5 first:pt-0 last:pb-0'}
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <div className={'flex items-start gap-3'}>
              <span
                className={[
                  'mt-[1px] grid size-[18px] shrink-0 place-items-center rounded-full',
                  lit ? tone.className : `${tone.className} bg-foreground/[0.055]`,
                ].join(' ')}
              >
                <Icon className={'size-[11px]'} strokeWidth={2.5} aria-hidden />
              </span>

              <div className={'min-w-0 flex-1'}>
                <div className={'flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5'}>
                  <span className={'text-foreground text-[13.5px] font-medium'}>{row.label}</span>
                  <span
                    className={[
                      'font-mono text-[12px] tabular-nums',
                      lit ? 'text-foreground' : 'text-muted-foreground',
                    ].join(' ')}
                  >
                    {row.status}
                  </span>
                </div>

                <p className={'text-muted-foreground mt-0.5 text-[12.5px] leading-snug'}>
                  {row.detail}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
