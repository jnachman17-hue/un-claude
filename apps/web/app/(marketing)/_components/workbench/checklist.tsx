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
  /** The state of your input, in one grammar across all three rows. */
  status: string;
  /** Kept for live findings under the +. Unused at rest. */
  note?: string;
  detail: string;
  /** True at rest: items render as the three-column teach table. */
  teach?: boolean;
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
  /*
   * OPAQUE, NOT TRANSLUCENT. This was `bg-emerald-600/45`, and 45% green over
   * an orange row tint mixed into a muddy half-and-half that Jon read as a
   * badge only half filled in. A badge states a fact and must look the same
   * on every background, so the softness now comes from a lighter green
   * rather than from letting the row show through. Same rule applies to every
   * badge here: all of them are solid.
   */
  absent: {
    icon: CheckIcon,
    className: 'bg-emerald-500 text-white',
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
  /*
   * `certain` now lights like `found`. 04 entry 81 renamed the state
   * "presumed present" and kept it deliberately grey; Jon's framework ruling
   * of 20 August 2026 (04 entry 95) overrides the colour: on pasted text this
   * mark is the one the visitor came about, and a grey badge read as "not a
   * concern" when the honest message is the opposite. The LABEL still says
   * presumed, and the row's own text still explains why nobody can point at
   * it, so the finding-versus-presumption distinction survives in words.
   */
  certain: {
    icon: AlertTriangleIcon,
    className: 'bg-mark-strong text-white',
    label: 'presumed present',
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
        /*
          THE STATE FRAMEWORK. Jon's ruling, 20 August 2026, 04 entry 95, and
          it is one rule per surface so every input type reads the same way:

            THE ICON TILE answers: did this check apply to your input?
              grey and faded   it cannot apply (metadata on pasted text,
                               characters or the rewrite on an image)
              neutral          nothing loaded yet
              Claude orange    it applies, and this row is in play
              green            it applied, and sanitising handled it

            THE BADGE answers: what is the state of this mark right now?
              invisible dash   not scanned yet
              grey dash        does not apply here
              alert, orange    in your document now (found, or presumed for
                               the statistical mark on text)
              soft green tick  we looked, none found
              solid green tick it was there, it is gone

            THE ROW TINT answers: is something still in your document?
              orange           yes (found or presumed)
              green            it was, and it is handled
              faint            this row is out of play
              neutral          in play, nothing found

          So on pasted text the eye and fingerprint tiles burn orange and the
          paperclip stays grey; on an image only the paperclip lights; and
          after sanitising, whatever was in play turns green. Relevance in
          the tile, finding in the badge, urgency in the tint.
        */
        const alert = row.state === 'found' || row.state === 'certain';
        const done = row.state === 'removed';
        const faded = row.state === 'skipped' || row.state === 'pending';
        const inPlay = alert || row.state === 'absent';
        const hasItems = Boolean(row.items && row.items.length > 0);
        const isOpen = open === row.id;

        return (
          <li
            key={row.id}
            className={[
              'animate-rise rounded-[11px] transition-colors',
              alert
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
                    done
                      ? 'bg-emerald-600 text-white'
                      : inPlay
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
              {/*
                LABEL OVER STATUS ON A PHONE, 21 August 2026.

                Side by side at 390px the status was taking a third of the
                row, so "Hidden characters" and "Statistical watermark" both
                broke across two lines and the row read as rubble. Stacked,
                the label gets the full width, never wraps, and the status
                sits under it where it reads as the answer to the label
                rather than as competition for it. The row is the same
                height either way. From `sm` this is the original layout.
              */}
              <div
                className={
                  'flex min-w-0 flex-1 flex-col items-start gap-0.5 sm:flex-row sm:items-center sm:gap-3'
                }
              >
                <span className={'min-w-0 flex-1'}>
                  <span
                    className={
                      'text-foreground block text-[13px] font-medium'
                    }
                  >
                    {row.label}
                  </span>
                  {/*
                    WHERE THE MARK LIVES IS A PHONE CASUALTY, 21 August 2026.

                    At 390px the label, this line and the status were three
                    pieces of text competing for one row, so "Statistical
                    watermark" wrapped to three lines and the status printed
                    beside the wreckage. Jon: "on mobile the text hangs over
                    so much worse and obscures the icons for everything else."

                    It is hidden below `sm` rather than shortened, because it
                    is teaching rather than status and the teaching already
                    has a home on this row: the + opens the three-column
                    table that explains this mark properly. That is exactly
                    the trade Jon asked for: "really utilise plus icons to
                    expand sections if you actually want to look at them."

                    So a phone gets one clean line per mark, and the detail is
                    one tap away. Nothing is lost and nothing is weakened.
                  */}
                  <span
                    className={
                      'text-muted-foreground hidden text-[11.5px] leading-tight sm:block'
                    }
                  >
                    {row.where}
                  </span>
                </span>

                <span className={'shrink-0 text-left sm:text-right'}>
                  <span
                    className={[
                      'block font-mono text-[10.5px] tracking-wide uppercase tabular-nums',
                      alert
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
                  {/* In teach mode the sentence duplicated the first card, so
                      the cards stand alone. Jon's note, 20 August 2026. Live
                      findings keep the sentence: there it reports the result
                      rather than re-describing the mark. */}
                  {hasItems && row.teach ? null : (
                    <p
                      className={
                        'text-muted-foreground text-[12.5px] leading-[1.55]'
                      }
                    >
                      {row.detail}
                    </p>
                  )}

                  {hasItems && row.teach ? (
                    /*
                      THE TEACH TABLE. Jon's design, 19 August 2026: "three
                      columns. What it is... Who puts it there... What we do...
                      built like a table, easy to read... a little orange
                      gradient that gets a little deeper with each column."
                      One template on all three rows, so the eye learns it
                      once. Columns stack on a phone, headers keep the tint.
                    */
                    /*
                      EQUAL HEIGHTS, ROUNDED ALL ROUND. Jon's note, 20 August
                      2026: the three cards ended at their own text, so a short
                      card had square lower corners where the tint ran out
                      while the grid cell kept going. Each card is now a
                      column and the body tint stretches to fill it, so all
                      three share one bottom edge and the container's rounding
                      shows at every corner. Shorter text just gets quiet
                      space inside its own tint.
                    */
                    <div
                      className={'mt-3 grid gap-2 sm:grid-cols-3 sm:gap-2.5'}
                    >
                      {row.items!.map((item, itemIndex) => (
                        <div
                          key={item.key}
                          className={'flex flex-col overflow-hidden rounded-[9px]'}
                        >
                          <p
                            className={[
                              'px-3 py-1.5 text-[10.5px] font-semibold tracking-[0.05em] uppercase',
                              itemIndex === 0
                                ? 'bg-mark/[0.10] text-mark-strong'
                                : itemIndex === 1
                                  ? 'bg-mark/[0.20] text-mark-strong'
                                  : 'bg-mark/[0.30] text-mark-strong',
                            ].join(' ')}
                          >
                            {item.head}
                          </p>
                          <p
                            className={[
                              'text-foreground/85 flex-1 px-3 py-2 text-[12.5px] leading-[1.55]',
                              itemIndex === 0
                                ? 'bg-mark/[0.03]'
                                : itemIndex === 1
                                  ? 'bg-mark/[0.06]'
                                  : 'bg-mark/[0.09]',
                            ].join(' ')}
                          >
                            {item.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : hasItems ? (
                    /*
                      ONE LINE PER FINDING. Jon, 20 August 2026, on opening a
                      scanned image: "I need to read this in one glance. I
                      don't want a blobber of words." The head used to be a
                      block above a full sentence, so three findings became six
                      stacked lines of prose. Now each finding is a dot, its
                      name, and a short phrase on the same line, and the
                      section is roughly half the height it was.
                    */
                    <ul className={'mt-2.5 space-y-1'}>
                      {row.items!.map((item) => (
                        <li key={item.key} className={'flex gap-2'}>
                          <span
                            aria-hidden
                            className={
                              'bg-mark-strong mt-[6px] size-[4px] shrink-0 rounded-full'
                            }
                          />
                          <span className={'text-[12px] leading-[1.5]'}>
                            <span className={'text-foreground font-medium'}>
                              {item.head}
                            </span>
                            {item.body ? (
                              <span className={'text-muted-foreground'}>
                                {' · '}
                                {item.body}
                              </span>
                            ) : null}
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
