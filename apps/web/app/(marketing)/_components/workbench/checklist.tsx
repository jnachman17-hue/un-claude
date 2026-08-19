'use client';

import { useState } from 'react';

import {
  CheckIcon,
  EyeOffIcon,
  FingerprintIcon,
  MinusIcon,
  PaperclipIcon,
  PlusIcon,
  XIcon,
} from 'lucide-react';

/**
 * The three kinds of mark, checked every time, whatever came back.
 *
 * Jon's design, 06 row 27, and not a toss up. A panel listing only what it FOUND
 * teaches the visitor that finding things means the product works, and several
 * correct results have nothing to show. In each of those a working product would
 * look broken.
 *
 * Rewritten after his review: the detail is behind an expander rather than always
 * open, so the panel can be read at a glance and still rewards a click.
 *
 * Each row carries its own symbol so the three are told apart by shape:
 *   an eye with a line through it   present, and impossible to see
 *   a paperclip                     something attached to the file, not in it
 *   a fingerprint                   an identity left in the pattern of choices
 */

export type RowState = 'found' | 'absent' | 'skipped' | 'pending' | 'removed';

export interface ChecklistRow {
  id: 'characters' | 'provenance' | 'statistical';
  label: string;
  state: RowState;
  status: string;
  detail: string;
  items?: Array<{ key: string; head: string; body: string }>;
}

const SYMBOL = {
  characters: EyeOffIcon,
  provenance: PaperclipIcon,
  statistical: FingerprintIcon,
} as const;

const BADGE: Record<RowState, { icon: typeof CheckIcon; className: string; label: string }> = {
  found: { icon: CheckIcon, className: 'bg-emerald-600 text-white', label: 'found' },
  removed: { icon: CheckIcon, className: 'bg-emerald-600 text-white', label: 'removed' },
  absent: { icon: XIcon, className: 'bg-rose-500 text-white', label: 'not found' },
  skipped: { icon: MinusIcon, className: 'bg-foreground/25 text-white', label: 'not checked' },
  pending: { icon: MinusIcon, className: 'bg-foreground/12 text-transparent', label: 'checking' },
};

export function Checklist({ rows }: { rows: ChecklistRow[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <ul className={'space-y-1.5'}>
      {rows.map((row, index) => {
        const Symbol = SYMBOL[row.id];
        const badge = BADGE[row.state];
        const Badge = badge.icon;
        const lit = row.state === 'found' || row.state === 'removed';
        const hasItems = Boolean(row.items && row.items.length > 0);
        const isOpen = open === row.id;

        return (
          <li
            key={row.id}
            className={[
              'animate-rise rounded-[11px] transition-colors',
              lit ? 'bg-mark/[0.13]' : 'bg-foreground/[0.028]',
            ].join(' ')}
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <div className={'flex items-center gap-3 px-3 py-2.5'}>
              <span className={'relative shrink-0'}>
                <span
                  className={[
                    'grid size-[28px] place-items-center rounded-[8px] transition-colors',
                    lit ? 'bg-mark text-mark-foreground' : 'bg-foreground/[0.07] text-foreground/50',
                  ].join(' ')}
                >
                  <Symbol className={'size-[14px]'} strokeWidth={2} aria-hidden />
                </span>

                <span
                  className={[
                    'absolute -right-[3px] -bottom-[3px] grid size-[13px] place-items-center rounded-full ring-2',
                    'ring-card transition-colors',
                    badge.className,
                  ].join(' ')}
                  aria-label={badge.label}
                >
                  <Badge className={'size-[8px]'} strokeWidth={3.4} aria-hidden />
                </span>
              </span>

              <span className={'text-foreground min-w-0 flex-1 text-[13px] font-medium'}>
                {row.label}
              </span>

              <span
                className={[
                  'shrink-0 font-mono text-[10.5px] tracking-wide uppercase tabular-nums',
                  lit ? 'text-foreground' : 'text-muted-foreground',
                ].join(' ')}
              >
                {row.status}
              </span>

              <button
                type={'button'}
                onClick={() => setOpen(isOpen ? null : row.id)}
                aria-expanded={isOpen}
                aria-label={isOpen ? `Hide detail for ${row.label}` : `Show detail for ${row.label}`}
                className={[
                  'grid size-[20px] shrink-0 place-items-center rounded-full transition-all duration-300',
                  isOpen
                    ? 'bg-foreground text-background rotate-45'
                    : 'bg-foreground/[0.07] text-foreground/45 hover:bg-foreground/[0.12]',
                ].join(' ')}
              >
                <PlusIcon className={'size-[11px]'} strokeWidth={2.8} aria-hidden />
              </button>
            </div>

            <div
              className={[
                'grid transition-[grid-template-rows] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]',
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
              ].join(' ')}
            >
              <div className={'overflow-hidden'}>
                <div className={'px-3 pt-0.5 pb-3 pl-[52px]'}>
                  <p className={'text-muted-foreground text-[12.5px] leading-[1.55]'}>
                    {row.detail}
                  </p>

                  {hasItems ? (
                    <ul className={'border-border mt-2.5 space-y-2 border-l pl-3'}>
                      {row.items!.map((item) => (
                        <li key={item.key}>
                          <span className={'text-foreground block text-[12px] font-medium'}>
                            {item.head}
                          </span>
                          <span className={'text-muted-foreground text-[12px] leading-snug'}>
                            {item.body}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
