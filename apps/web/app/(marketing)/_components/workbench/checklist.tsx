'use client';

import {
  CheckIcon,
  EyeOffIcon,
  FingerprintIcon,
  MinusIcon,
  StampIcon,
  XIcon,
} from 'lucide-react';

/**
 * The three kinds of mark, checked every time, whatever came back.
 *
 * Jon's design, 06 row 27, and not a toss up. A panel listing only what it FOUND
 * teaches the visitor that finding things means the product works, and several
 * correct results have nothing to show: text that was never AI written, pasted
 * text which has no file wrapper to inspect, and an image, which has no prose
 * for a statistical watermark to hide in. In each case a working product would
 * look broken.
 *
 * Each row carries its own symbol so the three are distinguishable at a glance
 * rather than by reading:
 *   an eye with a line through it   something present that cannot be seen
 *   a stamp                         a mark pressed into the file itself
 *   a fingerprint                   an identity left in the pattern of choices
 */

export type RowState = 'found' | 'absent' | 'skipped' | 'pending' | 'removed';

export interface ChecklistRow {
  id: 'characters' | 'provenance' | 'statistical';
  label: string;
  state: RowState;
  status: string;
  detail: string;
  /** Shown as a tucked-in list under the row: the individual things found. */
  items?: Array<{ key: string; head: string; body: string }>;
}

const SYMBOL = {
  characters: EyeOffIcon,
  provenance: StampIcon,
  statistical: FingerprintIcon,
} as const;

const BADGE: Record<RowState, { icon: typeof CheckIcon; className: string; label: string }> = {
  found: { icon: CheckIcon, className: 'bg-emerald-600 text-white', label: 'found' },
  removed: { icon: CheckIcon, className: 'bg-emerald-600 text-white', label: 'removed' },
  absent: { icon: XIcon, className: 'bg-rose-500 text-white', label: 'not found' },
  skipped: { icon: MinusIcon, className: 'bg-foreground/20 text-white', label: 'not checked' },
  pending: { icon: MinusIcon, className: 'bg-foreground/12 text-transparent', label: 'checking' },
};

export function Checklist({ rows }: { rows: ChecklistRow[] }) {
  return (
    <ul className={'space-y-1'}>
      {rows.map((row, index) => {
        const Symbol = SYMBOL[row.id];
        const badge = BADGE[row.state];
        const Badge = badge.icon;
        const lit = row.state === 'found' || row.state === 'removed';

        return (
          <li
            key={row.id}
            className={'animate-rise'}
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <div className={'flex items-start gap-3 py-2'}>
              <span className={'relative mt-[1px] shrink-0'}>
                <span
                  className={[
                    'grid size-[30px] place-items-center rounded-[9px] transition-colors',
                    lit ? 'bg-mark text-mark-foreground' : 'bg-foreground/[0.055] text-foreground/45',
                  ].join(' ')}
                >
                  <Symbol className={'size-[15px]'} strokeWidth={1.9} aria-hidden />
                </span>

                <span
                  className={[
                    'absolute -right-[3px] -bottom-[3px] grid size-[14px] place-items-center rounded-full ring-2',
                    'ring-card transition-colors',
                    badge.className,
                  ].join(' ')}
                  aria-label={badge.label}
                >
                  <Badge className={'size-[9px]'} strokeWidth={3.2} aria-hidden />
                </span>
              </span>

              <div className={'min-w-0 flex-1'}>
                <div className={'flex flex-wrap items-baseline justify-between gap-x-4'}>
                  <span className={'text-foreground text-[13.5px] font-medium'}>{row.label}</span>
                  <span
                    className={[
                      'font-mono text-[11.5px] tabular-nums',
                      lit ? 'text-foreground' : 'text-muted-foreground',
                    ].join(' ')}
                  >
                    {row.status}
                  </span>
                </div>

                <p className={'text-muted-foreground mt-0.5 text-[12.5px] leading-snug'}>
                  {row.detail}
                </p>

                {row.items && row.items.length > 0 ? (
                  <ul className={'border-border/70 mt-2 space-y-1.5 border-l pl-3'}>
                    {row.items.map((item) => (
                      <li key={item.key}>
                        <span className={'text-foreground text-[12px] font-medium'}>
                          {item.head}
                        </span>
                        <span className={'text-muted-foreground text-[12px]'}> {item.body}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
