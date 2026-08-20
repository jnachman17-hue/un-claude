'use client';

import { useState } from 'react';

import {
  AlertTriangleIcon,
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

export type RowState =
  | 'found'
  | 'absent'
  | 'skipped'
  | 'pending'
  | 'removed'
  | 'certain';

export interface ChecklistRow {
  id: 'characters' | 'provenance' | 'statistical';
  label: string;
  /** Where this mark lives. The same grammar on all three rows, always. */
  where: string;
  state: RowState;
  /** How many are in your document. A count, or a dash. Never a claim. */
  status: string;
  /** Sits under the count at the same size when the count is a dash. */
  note?: string;
  detail: string;
  items?: Array<{ key: string; head: string; body: string }>;
}

const SYMBOL = {
  characters: EyeOffIcon,
  provenance: PaperclipIcon,
  statistical: FingerprintIcon,
} as const;

/**
 * WHAT EACH BADGE MEANS, AND WHY THE OLD ONES WERE BACKWARDS.
 *
 * Until 19 August 2026 `found` and `removed` were the SAME green tick, and
 * `absent` was a red cross. Read as a stranger, that said: finding a watermark
 * in your document is a success, a clean document is a failure, and sanitising
 * changes nothing on screen. Jon hit all three:
 *
 *   "once it sanitizes those are still checked green and highlighted which
 *    makes it look like those are there even though it removed them"
 *
 * The rule now: THE BADGE ANSWERS "IS THERE STILL SOMETHING IN MY DOCUMENT?"
 *
 *   found    yes, right now, and it is why you are here    -> the accent, alert
 *   removed  it was, it is gone                            -> green, and quiet
 *   absent   no, and we looked                             -> calm tick
 *   skipped  cannot apply to what you gave us              -> grey dash
 *   pending  nothing read yet                              -> almost invisible
 */
const BADGE: Record<
  RowState,
  { icon: typeof CheckIcon; className: string; label: string }
> = {
  found: {
    icon: AlertTriangleIcon,
    className: 'bg-mark-strong text-white',
    label: 'present',
  },
  removed: {
    icon: CheckIcon,
    className: 'bg-emerald-600 text-white',
    label: 'removed',
  },
  absent: {
    icon: CheckIcon,
    className: 'bg-emerald-600/45 text-white',
    label: 'none found',
  },
  skipped: {
    icon: MinusIcon,
    className: 'bg-foreground/20 text-white',
    label: 'does not apply',
  },
  pending: {
    icon: MinusIcon,
    className: 'bg-foreground/12 text-transparent',
    label: 'not scanned',
  },
  /**
   * TRUE, BUT NOT FOUND, AND THE DIFFERENCE IS THE WHOLE POINT.
   *
   * The statistical row used to say PRESENT off the back of a single check:
   * does the input contain words. Nothing was examined. 04 entry 81.
   *
   * `certain` is the honest state for a mark we can neither see nor doubt: if
   * Claude wrote it, it is marked, and no tool can point at where. It is
   * DELIBERATELY NOT LIT. Lit means "we found this in your document", and we
   * did not. It also keeps Jon's one-loud-thing rule: on arrival only the
   * characters row is lit, because it is the only claim the example can prove.
   */
  certain: {
    icon: AlertTriangleIcon,
    className: 'bg-foreground/45 text-white',
    label: 'marked if Claude wrote it',
  },
};

export function Checklist({ rows }: { rows: ChecklistRow[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <ul className={'space-y-1.5'}>
      {rows.map((row, index) => {
        const Symbol = SYMBOL[row.id];
        const badge = BADGE[row.state];
        const Badge = badge.icon;
        // Lit means "this is still in your document". A removed mark is
        // deliberately NOT lit: going quiet is how the panel shows it worked.
        const lit = row.state === 'found';
        const done = row.state === 'removed';
        const faded = row.state === 'skipped' || row.state === 'pending';
        const hasItems = Boolean(row.items && row.items.length > 0);
        const isOpen = open === row.id;

        return (
          <li
            key={row.id}
            className={[
              'animate-rise rounded-[11px] transition-colors',
              lit
                ? 'bg-mark/[0.15]'
                : done
                  ? 'bg-emerald-600/[0.07]'
                  : faded
                    ? 'bg-foreground/[0.018]'
                    : 'bg-foreground/[0.028]',
            ].join(' ')}
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <div className={'flex items-center gap-3 px-3 py-2.5'}>
              <span className={'relative shrink-0'}>
                <span
                  className={[
                    'grid size-[28px] place-items-center rounded-[8px] transition-colors',
                    lit
                      ? 'bg-mark text-mark-foreground'
                      : faded
                        ? 'bg-foreground/[0.05] text-foreground/30'
                        : 'bg-foreground/[0.07] text-foreground/50',
                  ].join(' ')}
                >
                  <Symbol
                    className={'size-[14px]'}
                    strokeWidth={2}
                    aria-hidden
                  />
                </span>

                <span
                  className={[
                    'absolute -right-[3px] -bottom-[3px] grid size-[13px] place-items-center rounded-full ring-2',
                    'ring-card transition-colors',
                    badge.className,
                  ].join(' ')}
                  aria-label={badge.label}
                >
                  <Badge
                    className={'size-[8px]'}
                    strokeWidth={3.4}
                    aria-hidden
                  />
                </span>
              </span>

              {/*
                LABEL AND STATUS STACK ON A PHONE.

                They were side by side at every width, with the status set to
                shrink-0. That held while every status was two words. The
                statistical row now reads "If Claude wrote this, it is marked",
                04 entry 81, which measures 223px of a 375px screen: the label
                wrapped to two lines and the status printed straight through it.

                Below sm they stack, label over status. From sm they are the
                original row, unchanged.
              */}
              {/*
                ONE TEMPLATE, EVERY ROW, EVERY STATE: name, where it lives,
                how many.

                The rows used to run three different grammars at once. "3 FOUND"
                was a count, "NO FILE" was a missing input, and the third row
                carried a claim. The eye had to start over on every row and
                never built a pattern, which is why Jon read them as blabber.

                Now the third column always answers exactly one question: how
                many of these are in your document. A number, or a dash. On the
                statistical row it is a dash FOREVER, and that is the design
                rather than a gap in it. Turnitin prints an asterisk instead of
                a figure it knows is noise; every competitor prints the figure
                anyway. docs/09 section 4.
              */}
              <div className={'flex min-w-0 flex-1 items-center gap-3'}>
                <span className={'min-w-0 flex-1'}>
                  <span
                    className={
                      'text-foreground block text-[13px] font-medium'
                    }
                  >
                    {row.label}
                  </span>
                  <span
                    className={
                      'text-muted-foreground block text-[11.5px] leading-tight'
                    }
                  >
                    {row.where}
                  </span>
                </span>

                <span className={'shrink-0 text-right'}>
                  <span
                    className={[
                      'block font-mono text-[10.5px] tracking-wide uppercase tabular-nums',
                      lit
                        ? 'text-foreground font-semibold'
                        : faded
                          ? 'text-muted-foreground/55'
                          : 'text-muted-foreground',
                    ].join(' ')}
                  >
                    {row.status}
                  </span>
                  {/* The reason for a dash sits WITH the dash, same size, never
                      hidden behind the +. Have I Been Pwned puts its caveat in
                      the same breath as the good news. docs/09 section 5. */}
                  {row.note ? (
                    <span
                      className={
                        'text-muted-foreground/80 block max-w-[19ch] text-[10.5px] leading-tight sm:max-w-none'
                      }
                    >
                      {row.note}
                    </span>
                  ) : null}
                </span>
              </div>

              <button
                type={'button'}
                onClick={() => setOpen(isOpen ? null : row.id)}
                aria-expanded={isOpen}
                aria-label={
                  isOpen
                    ? `Hide detail for ${row.label}`
                    : `Show detail for ${row.label}`
                }
                className={[
                  'grid size-[20px] shrink-0 place-items-center rounded-full transition-all duration-300',
                  isOpen
                    ? 'bg-foreground text-background rotate-45'
                    : 'bg-foreground/[0.07] text-foreground/45 hover:bg-foreground/[0.12]',
                ].join(' ')}
              >
                <PlusIcon
                  className={'size-[11px]'}
                  strokeWidth={2.8}
                  aria-hidden
                />
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
                  <p
                    className={
                      'text-muted-foreground text-[12.5px] leading-[1.55]'
                    }
                  >
                    {row.detail}
                  </p>

                  {hasItems ? (
                    <ul
                      className={'border-border mt-2.5 space-y-2 border-l pl-3'}
                    >
                      {row.items!.map((item) => (
                        <li key={item.key}>
                          <span
                            className={
                              'text-foreground block text-[12px] font-medium'
                            }
                          >
                            {item.head}
                          </span>
                          <span
                            className={
                              'text-muted-foreground text-[12px] leading-snug'
                            }
                          >
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
