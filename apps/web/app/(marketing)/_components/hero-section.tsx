import {
  EraserIcon,
  FileTextIcon,
  GiftIcon,
  ImageIcon,
  LayersIcon,
  TypeIcon,
} from 'lucide-react';

import { Suspense } from 'react';

import { LiveCounter } from './live-counter';
import { Workbench } from './workbench/workbench';

/**
 * The hero, and it is the product rather than a picture of one.
 *
 * 04 entry 20: the landing page IS the tool. REBUILT 19 August 2026 under
 * entries 80 to 84 and the research in docs/09.
 *
 * THE HEADLINE CHANGED, and the old one broke Jon's own ruling. "Remove the
 * watermark Claude puts in your writing" is the exact claim entry 70 forbids:
 * for layer B nobody can say the watermark was removed, which is why the
 * product verb is "sanitise". The replacement is the line Jon ratified for the
 * statistical row, promoted to the top of the page: it asserts the visitor's
 * problem rather than our outcome, it is true of 100% of Claude output since
 * 2 August 2026, and it survives the day Anthropic's detector opens. It is
 * also five words, which matters on a phone.
 *
 * THE THREE STATISTICS ARE DEAD, replaced by the live counter. Jon's verdict
 * on the stats was that they made no sense on sight, and his fix was his own:
 * "maybe we scrap these and move the words cleaned with un-claude up into
 * that spot." The counter is the one number a stranger parses in under a
 * second, and it reads as evidence the product is used.
 *
 * MOBILE DROPS THE EXTRAS. 04 entry 84 ruling 3: most visitors convert on a
 * phone, the box must be on the first phone screen, and desktop-only material
 * simply disappears below lg the way GPTZero collapses its hero. On a phone
 * this section is: headline, one line, the tool. Nothing else.
 */
const HANDLES = [
  { icon: TypeIcon, label: 'Pasted text' },
  { icon: FileTextIcon, label: 'Word documents' },
  { icon: ImageIcon, label: 'PNG and JPG' },
];

export function HeroSection() {
  return (
    /*
      overflow-CLIP, not overflow-hidden. 21 August 2026.

      The decorative glow below is 820px wide and offset off the right edge, so
      it made this section 128px wider than the viewport at desktop. With
      `overflow-hidden` that surplus is invisible but the section is still
      SCROLLABLE, and any `scrollIntoView` on a child — the tool calls .focus()
      inside here — shifted the whole hero sideways with no way back. Captured
      twice: the headline read "Claude wrote / it's marked." with the "If" cut
      off and the counter read "692,6".

      `overflow-clip` hides the same overflow without creating a scroll
      container, so there is nothing to scroll and nothing to shift.
    */
    <section className={'relative overflow-clip'}>
      {/* A last touch of warmth directly behind the tool. The page-level
          gradient in globals.css carries most of it. */}
      <div
        aria-hidden
        className={
          'pointer-events-none absolute top-[-18%] right-[-10%] h-[560px] w-[820px] rounded-full bg-[radial-gradient(closest-side,var(--mark),transparent)] opacity-[0.07] blur-[90px]'
        }
      />

      <div
        className={
          'relative mx-auto max-w-[1180px] px-5 pt-6 pb-8 sm:px-8 sm:pb-14 lg:pt-12'
        }
      >
        {/*
          THE TOOL COMES FIRST ON A PHONE. 06 row 75, hardened by 04 entry 84.
          Narrow: headline, BOX, then the desktop extras are simply absent.
          Wide: two columns, argument left, tool right, both above the fold.
        */}
        <div
          className={
            /*
             * `lg:grid-rows-[auto_1fr]` IS FIX 2 AND IT IS THE WHOLE OF IT.
             * Jon's instruction, 25 August 2026, six-ui-fixes: after a run,
             * "WORDS CLEANED WITH UN-CLAUDE" was pushed down out of view.
             *
             * MEASURED BEFORE CHANGING ANYTHING, because the brief rightly
             * said the class list is the facts and not the cause. At 1280x760,
             * scanning and then sanitising a 55-word paste grew the workbench
             * from 511px to 868px, and the counter went from top 464 / bottom
             * 613, fully visible, to top 642 / bottom 791 — 31px below the
             * fold on a normal laptop.
             *
             * THE CAUSE. The workbench is `lg:row-span-2`. Both rows were
             * `auto`, so the grid met the spanning item's height by growing
             * BOTH of them, splitting the 357px of new workbench evenly: row 1
             * took about 178px it had no content for, and the counter, which
             * starts at the top of row 2, was carried down by exactly that.
             * The counter was never the thing that changed. It was pushed by a
             * row that grew underneath the headline.
             *
             * THE FIX. Row 1 is pinned to `auto`, which is the headline and
             * nothing else, and row 2 takes `1fr`, so every pixel the
             * workbench gains is absorbed by the row BELOW the counter's
             * starting edge rather than shared with the row above it. With
             * `lg:items-start` already in place the counter stays welded to
             * the headline's baseline gap and does not move when a result
             * arrives.
             *
             * Nothing about the DOM moved, which matters: the `<Suspense>`
             * boundary around `LiveCounter` is the reason this page is in
             * Google's index at all, and it is untouched. See the note at that
             * boundary below.
             */
            'flex flex-col gap-7 lg:grid lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-12 lg:gap-y-7'
          }
        >
          <div
            className={
              'animate-rise order-1 lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:pt-6'
            }
          >
            {/*
              REWORKED 20 August 2026, Jon's styling pass. Three changes:
              smaller (he read the old size as "glaringly loud"), "Claude" in
              the brand's own orange so the product it targets is named in its
              own colour, and "it's marked" carries a translucent red
              highlight, the GPTZero pattern of marking the finding in colour
              rather than in weight.

              CORRECTED TWICE same session. First pass: the highlight span
              had no line-height of its own, so its background painted the
              full line box the h1 set, not the glyphs inside it.
              `leading-none` narrowed that but did not fix it, because even
              at line-height 1 an inline element's background still follows
              the FONT's internal ascent and descent metrics, not the ink
              of the letters — there is no line-height value that crops to
              glyph bounds, because that is not what line-height means.

              The actual fix: a bar sized in fixed em units and centred by
              percentage, positioned absolutely BEHIND the text rather than
              painted as the text's own background. Its height answers to
              nothing but the number given to it, so it can be tuned to sit
              just outside the cap-height-to-baseline box of this specific
              phrase (no descenders in "it's marked") rather than to
              whatever headroom the font ships with.
            */}
            <h1
              className={
                'text-foreground text-[28px] leading-[1.2] font-semibold tracking-[-0.028em] text-balance sm:text-[36px] lg:text-[44px] lg:leading-[1.18] lg:tracking-[-0.03em]'
              }
            >
              If <span className={'text-mark-strong'}>Claude</span> wrote it,{' '}
              <span className={'relative inline-block leading-none'}>
                <span
                  aria-hidden
                  className={
                    'bg-destructive/[0.16] absolute inset-x-[-4px] rounded-[4px]'
                  }
                  style={{
                    top: '50%',
                    height: '0.78em',
                    transform: 'translateY(-50%)',
                  }}
                />
                {/* The period lives INSIDE the highlighted span so the
                    bar runs past it and stops, matching the way it already
                    overhangs the "i" at the start. Outside the span it cut
                    off mid-sentence and looked clipped. */}
                <span className={'relative'}>it&rsquo;s marked.</span>
              </span>
            </h1>

            <p
              className={
                'text-muted-foreground mt-3.5 max-w-[42ch] text-[15px] leading-[1.55] tracking-[-0.006em] lg:mt-5 lg:text-[16px] lg:leading-[1.6]'
              }
            >
              We sanitise every kind of AI watermark in seconds.
            </p>

            {/*
              THE AUTHORITY STRIP, REDONE TWICE. Round one used a three-icon
              cluster for the first line and generic checkmarks for the
              other two, which was two symbol systems doing two jobs. Round
              two fixed the icons but turned all three into pill chips,
              which Jon read as horizontally stretched and unnecessary:
              "just have that text with the logos right there."

              This pass: no pills, no border, no fill. Plain icon-then-text
              lines, stacked, so nothing runs wide. The three-icon cluster
              is retired for a single `LayersIcon` — the codebase's own word
              for what the three marks are (`ENGINE.md`, `04` entries
              throughout, all call them layers), so the glyph now names the
              same concept the product's own vocabulary uses, rather than
              improvising three unrelated icons stacked together.
            */}
            {/* Desktop only, Jon's ruling 20 August 2026: on a phone these
                three lines cost vertical space the tool needs, same logic as
                the counter and validity block (04 entry 84 ruling 3). */}
            <ul className={'hidden space-y-2 lg:mt-6 lg:block'}>
              <li
                className={
                  'text-foreground flex items-center gap-2 text-[13px] font-semibold tracking-[-0.005em]'
                }
              >
                <LayersIcon
                  className={'text-mark-strong size-[15px] shrink-0'}
                  strokeWidth={2}
                  aria-hidden
                />
                Every kind of watermark
              </li>
              <li
                className={
                  'text-foreground flex items-center gap-2 text-[13px] font-semibold tracking-[-0.005em]'
                }
              >
                <EraserIcon
                  className={'text-mark-strong size-[15px] shrink-0'}
                  strokeWidth={2}
                  aria-hidden
                />
                100% of detectable marks removed
              </li>
              <li
                className={
                  'text-foreground flex items-center gap-2 text-[13px] font-semibold tracking-[-0.005em]'
                }
              >
                <GiftIcon
                  className={'text-mark-strong size-[15px] shrink-0'}
                  strokeWidth={2}
                  aria-hidden
                />
                Free. No account needed.
              </li>
            </ul>
          </div>

          {/* Desktop-only validity block. Drops off entirely on a phone,
              where its pixels belong to the tool. 04 entry 84 ruling 3. */}
          <div
            className={
              'animate-rise order-3 hidden lg:order-none lg:col-span-5 lg:col-start-1 lg:row-start-2 lg:block'
            }
          >
            <div className={'max-w-[46ch]'}>
              {/*
                THE BOUNDARY THAT PUT THIS PAGE BACK IN GOOGLE'S INDEX.
                Added 24 August 2026.

                What was wrong. The homepage served a crawler 75 words — the
                navigation menu, the footer's sentence and the footer's links —
                and no `<h1>` at all, while every other marketing page served
                its full content. Google ranked `/capabilities` above the
                homepage for the brand name because `/capabilities` was the
                only one of the two it could read.

                The cause was one line inside `LiveCounter`: the counter reads
                the clock while it renders, because the figure it shows is
                derived from a fixed anchor and the current time (04 entry 71).

                `cacheComponents` in `next.config.mjs` builds every page ahead
                of time into a plain HTML file, and that file is what a crawler
                reads. Reading the clock is one of the few things Next cannot
                know ahead of time, so the moment it happens Next abandons
                prerendering — not of the component that read the clock, but of
                everything up to the nearest `<Suspense>` boundary. There was
                no boundary anywhere inside this page, so the abandonment ran
                all the way up to the automatic route boundary that
                `(marketing)/loading.tsx` creates, which wraps the entire page.
                The whole body was replaced by that file's empty placeholder.

                This boundary is the fix and it is the whole fix. It stops the
                abandonment here, at the one component that genuinely cannot be
                known ahead of time. Everything else on the page — the
                headline, the promise line, the authority strip, the marquee,
                the coverage table, the FAQ — is identical for every visitor,
                and now prerenders into the HTML where a crawler finds it.

                WHAT THIS COSTS, STATED PLAINLY. The counter is now the only
                thing on the page that is not in the prerendered HTML: the
                whole route still builds as one static file, so the counter is
                drawn by the browser after the page arrives rather than being
                in the file. Two consequences, both checked.

                Its three lines of text — the caption, the figure and
                "Hidden characters stripped..." — are no longer readable by a
                crawler. That is three lines out of 1,234 words, and none of
                them is a claim the page needs to rank. Before this change the
                crawler read 75 words and none of the other 1,231.

                And the figure now fades in instead of being there on arrival,
                which is the one thing the docblock at `live-counter.tsx:145`
                was avoiding. The fallback below reserves its height so nothing
                moves when it lands. Undoing that properly means seeding the
                counter from a constant and reading the clock in its effect
                instead, which changes behaviour Jon ratified (04 entry 71),
                so it is written up for him rather than done here.

                NOT ONE WORD OF COPY CHANGED. The brief was explicit that the
                job was to make the existing words visible, not to write
                different ones.

                The fallback is deliberately empty. It reserves the counter's
                height so the column does not jump when the figure lands, and
                it says nothing, because a placeholder that says something is a
                claim nobody ratified.
              */}
              <Suspense fallback={<div className={'min-h-[150px]'} />}>
                <LiveCounter />
              </Suspense>
            </div>
          </div>

          {/* `id` is the arrival briefing's scroll target. Its CTA closes the
              dialog and brings the visitor here rather than just getting out
              of the way, because the paste box is the top of the ladder and
              sending somebody to it is the whole reason that dialog exists.
              See watermark-briefing.tsx. */}
          <div
            id={'workbench'}
            className={
              'animate-rise order-2 scroll-mt-24 lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:order-none'
            }
            style={{ animationDelay: '110ms' }}
          >
            <Workbench />

            <ul
              className={
                'mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 px-1'
              }
            >
              {HANDLES.map((handle) => (
                <li
                  key={handle.label}
                  className={
                    'text-muted-foreground inline-flex items-center gap-1.5 text-[12px]'
                  }
                >
                  <handle.icon
                    className={'size-[13px]'}
                    strokeWidth={1.9}
                    aria-hidden
                  />
                  {handle.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
