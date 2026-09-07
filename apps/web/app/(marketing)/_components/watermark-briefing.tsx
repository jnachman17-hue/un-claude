'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { ClockIcon, InfinityIcon, XIcon } from 'lucide-react';

import { briefingDismissed, briefingShown } from '~/lib/analytics/events';

import { isSearchReferrer } from './search-referrer';

/**
 * THE ARRIVAL BRIEFING. Jon's instruction, 6 September 2026.
 *
 * "When you arrive at the landing page I want you to understand this more, so
 * you have more of a sense of urgency. You need to understand what the
 * Anthropic watermark announcement is, how it affects you, universities, and
 * everybody will be able to see how your text is impacted. It should pop up as
 * soon as you get to the website so you understand the issue. It should be
 * really informational, you should be forced to see it, you should be able to
 * click out if you want."
 *
 * ────────────────────────────────────────────────────────────────────────────
 * ★ WHAT THIS IS NOT: NEW ARGUMENT.
 *
 * `claude-band.tsx` already makes all three of these points, three sections
 * down the page. Marked invisibly · a detector is coming · marks do not expire.
 * **The problem was never that the argument was missing. It was buried under
 * the tool, and a visitor who arrives from TikTok with no context scrolls past
 * it or never reaches it.** This promotes the same argument to the first thing
 * a stranger reads, and the band stays where it is for anyone who dismisses.
 *
 * So if the copy here and the copy in `claude-band.tsx` ever disagree, that is
 * a defect in one of them, not two positions.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * ★ THE SEO CONSTRAINT, AND IT IS THE SAME SHAPE AS THE ONE THAT COST THIS SITE
 *   ITS GOOGLE INDEXING IN AUGUST.
 *
 * Google treats an interstitial that covers the main content on a phone,
 * immediately after somebody arrives FROM SEARCH, as an intrusive interstitial,
 * and it is a documented ranking signal. This site clawed its indexing back
 * three weeks ago and must not hand it away.
 *
 * TWO THINGS KEEP IT SAFE, and both are load-bearing.
 *
 *   1. **It never renders for a visitor who arrived from a search engine.**
 *      `cameFromSearch()` below. Search traffic sees the page it was promised;
 *      there is no interstitial for anyone to penalise. The traffic this is
 *      actually for is TikTok, which arrives with a blank referrer or a
 *      social one, and is exactly the audience with no context.
 *   2. **It renders NOTHING on the server.** The first render returns null, so
 *      the prerendered HTML a crawler reads is byte for byte the page without
 *      it, and the homepage's crawlable word count cannot move.
 *
 * A HAPPY SIDE EFFECT WORTH KEEPING: the suppressed search group is a free
 * control group. `briefing_shown` against `scan_completed` for both populations
 * answers whether this helps or hurts, which nobody can tell by looking.
 *
 * ★ ONCE PER VISITOR, NOT ONCE PER VISIT. A wall that reappears on every visit
 * trains people to dismiss it unread and enrages anybody who comes back. The
 * key is versioned so a materially different briefing can be shown again on
 * purpose rather than by accident.
 */

/** Bumping this shows the briefing again to everyone who has already seen it. */
const SEEN_KEY = 'unclaude.briefing.v1';

/**
 * The search-engine rule lives in its own importable file so it can be RUN.
 * `search-referrer.ts` says why, and it is not a style preference: this rule is
 * the whole defence against Google's intrusive-interstitial signal, and inside
 * this component it could only ever be tested by arranging a real navigation
 * from Google.
 */
function cameFromSearch(): boolean {
  return isSearchReferrer(document.referrer, window.location.hostname);
}

function alreadySeen(): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    // A private window, or storage switched off. Showing it once per visit to
    // somebody in that state is better than never showing it at all.
    return false;
  }
}

function markSeen(): void {
  try {
    window.localStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* Nothing to do, and nothing that should break the page. */
  }
}

/* ────────────────────────────────────────────────────────────────────────── */

/**
 * THE SENTENCE THE VISUAL HAS TO CARRY, and the one it must not.
 *
 * It shows the mark GOING IN as Claude writes, which is what actually happens:
 * at each word where several options read equally well, a secret key makes the
 * pick, and the pattern of picks is the mark.
 *
 * ★ IT DELIBERATELY DOES NOT DRAW A DETECTOR FINDING ANYTHING. Scene 3 of Jon's
 * motion canvas shows boxed signals and a count of "13 signals", and that is
 * Anthropic's asset showing Anthropic's own detector. Drawing it here would
 * imply two things this product must never claim: that we know which words
 * carry the mark, and that a readout like that exists for us to run. `04` entry
 * 78 ruling 2, and the claims boundary in
 * .claude/skills/unclaude-messaging. **The detector is a sentence below, not a
 * dashboard.**
 */
const LINE = [
  { text: 'The results', marked: false },
  { text: 'were', marked: false },
  { text: 'striking', marked: true },
  { text: 'and', marked: false },
  { text: 'the effect', marked: false },
  { text: 'held', marked: true },
  { text: 'across', marked: false },
  { text: 'every', marked: false },
  { text: 'trial', marked: true },
] as const;

const WORD_MS = 190;
/** Words, then a beat, then the picks light up. */
const STEPS = LINE.length + 3;

const BEATS = [
  {
    icon: ClockIcon,
    head: 'The detector is close',
    body: 'Anthropic’s checker for files is already live and free. The one for text is in private preview.',
  },
  {
    icon: InfinityIcon,
    head: 'Marks don’t expire',
    body: 'What you have already handed in stays marked. The day the detector opens, it can be checked.',
  },
] as const;

export function WatermarkBriefing() {
  /*
   * `open` starts false and NOTHING renders until an effect turns it on. That
   * is what keeps the briefing out of the server-rendered HTML, which is the
   * whole SEO protection. Do not seed it true.
   */
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const openedAt = useRef(0);
  const timers = useRef<number[]>([]);
  const panel = useRef<HTMLDivElement | null>(null);
  const restoreFocusTo = useRef<Element | null>(null);

  const clearTimers = useCallback(() => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  }, []);

  const close = useCallback(
    (via: 'cta' | 'close' | 'backdrop' | 'escape') => {
      clearTimers();
      setOpen(false);
      markSeen();
      briefingDismissed({
        via,
        seconds: (Date.now() - openedAt.current) / 1000,
      });

      if (restoreFocusTo.current instanceof HTMLElement) {
        restoreFocusTo.current.focus();
      }

      if (via === 'cta') {
        // Hand them to the tool with intent rather than just getting out of
        // the way. The paste box is the top of the ladder and the whole reason
        // this thing exists is to send somebody to it.
        document
          .getElementById('workbench')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
    [clearTimers],
  );

  // Decide whether to appear at all. Runs once, after mount, in the browser.
  useEffect(() => {
    if (alreadySeen() || cameFromSearch()) return;

    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    // A short beat so the page paints first. Arriving on top of a blank screen
    // reads as a redirect to somewhere else rather than as this site talking.
    const id = window.setTimeout(() => {
      openedAt.current = Date.now();
      restoreFocusTo.current = document.activeElement;
      setOpen(true);
      briefingShown();

      // A visitor who asked for less motion gets the settled picture, never a
      // blank stage or a half-built one.
      if (reduced) {
        setStep(STEPS - 1);
        return;
      }

      for (let i = 1; i < STEPS; i += 1) {
        timers.current.push(window.setTimeout(() => setStep(i), i * WORD_MS));
      }
    }, 550);

    timers.current.push(id);

    return () => {
      for (const t of timers.current) window.clearTimeout(t);
      timers.current = [];
    };
  }, []);

  // Escape closes it, the page underneath does not scroll behind it, and Tab
  // stays inside. A wall a keyboard user cannot get out of is not "informational".
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close('escape');
        return;
      }

      if (event.key !== 'Tab' || !panel.current) return;

      const focusable = panel.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      if (focusable.length === 0) return;

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [close, open]);

  if (!open) return null;

  const settled = step >= STEPS - 1;

  return (
    <div
      className={
        'fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4'
      }
      onClick={(event) => {
        if (event.target === event.currentTarget) close('backdrop');
      }}
    >
      <div
        ref={panel}
        role={'dialog'}
        aria-modal={'true'}
        aria-labelledby={'briefing-title'}
        tabIndex={-1}
        className={
          'bg-card ring-border/70 animate-rise relative flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-[20px] shadow-2xl ring-1 outline-none sm:max-w-[560px] sm:rounded-[20px]'
        }
      >
        <button
          type={'button'}
          onClick={() => close('close')}
          aria-label={'Close'}
          className={
            'text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground absolute top-4 right-4 grid size-[30px] place-items-center rounded-full transition-colors'
          }
        >
          <XIcon className={'size-[15px]'} strokeWidth={2.2} aria-hidden />
        </button>

        {/*
          ★ THE CTA IS PINNED TO THE SHEET, NOT PUSHED DOWN BY THE COPY.

          Measured at 500x660, which is a short phone window: the content
          needs 661px and the panel gets 620px, so whichever of the button and
          its "free, no account" line came last fell below the fold. Moving one
          above the other just swapped which one was lost.

          So the argument scrolls and the button does not. On a tall phone
          nothing scrolls at all and this is invisible; on a short one the
          visitor always has the button and always has the three words that
          make it safe to press.
        */}
        <div
          className={'flex-1 overflow-y-auto px-6 pt-6 pb-4 sm:px-9 sm:pt-7'}
        >
          <p
            className={
              'text-mark-strong text-[11.5px] font-semibold tracking-wide uppercase'
            }
          >
            Since 2 August 2026
          </p>

          <h2
            id={'briefing-title'}
            className={
              'text-foreground mt-2 text-[25px] leading-[1.12] font-semibold tracking-[-0.026em] text-balance sm:text-[29px]'
            }
          >
            Claude marks the text it writes.
          </h2>

          <p
            className={
              'text-muted-foreground mt-2.5 text-[15px] leading-[1.55]'
            }
          >
            Every model Anthropic has released since then puts a hidden mark in
            its output. Nothing is added to the page. The mark is in{' '}
            <span className={'text-foreground font-medium'}>
              which words the model chose
            </span>
            .
          </p>

          {/* The mark going in, as it is written. */}
          <div
            className={
              'border-border/70 bg-foreground/[0.016] mt-4 rounded-[13px] border px-4 py-3.5'
            }
          >
            <p className={'text-[15px] leading-[1.9]'}>
              {LINE.map((token, index) => {
                const arrived = step > index;
                const lit = token.marked && step >= LINE.length + 2;

                return (
                  <span
                    key={index}
                    className={[
                      // `motion-reduce` is a SECOND guarantee, not decoration.
                      // The effect above already skips the sequence for a
                      // visitor who asked for less motion, but that is a
                      // JavaScript branch and this is a media query. If
                      // either one fails, the settled sentence is still what
                      // they read.
                      'transition-all duration-300 motion-reduce:opacity-100',
                      arrived ? 'opacity-100' : 'opacity-0',
                      lit
                        ? 'text-mark-strong bg-mark/[0.13] rounded-[4px] px-1 font-medium'
                        : 'text-foreground/80',
                    ].join(' ')}
                  >
                    {index === 0 ? '' : ' '}
                    {token.text}
                  </span>
                );
              })}
            </p>

            <p
              className={[
                'text-muted-foreground mt-2.5 text-[12px] leading-snug transition-opacity duration-500 motion-reduce:opacity-100',
                settled ? 'opacity-100' : 'opacity-0',
              ].join(' ')}
            >
              A secret key makes the pick between words that read equally well.
              The pattern of picks is the mark.
            </p>
          </div>

          {/*
          ★ THE EMOTIONAL CENTRE, AND IT IS TRUE. The claims file names this as
          the sentence to say plainly and without adjectives: a detected mark
          means Claude PROCESSED the content, not that Claude wrote it. It is
          the line that turns this from somebody else's problem into the
          reader's, and it does that by being accurate rather than by being
          frightening.
        */}
          <p
            className={
              'border-mark-strong/40 text-foreground mt-4 border-l-2 pl-3.5 text-[15px] leading-[1.55] font-medium'
            }
          >
            A mark does not mean Claude wrote it. It means Claude touched it.
            Ask it to tidy a paragraph you wrote yourself, and the mark goes in
            with the tidy.
          </p>

          <ul className={'mt-4 space-y-3'}>
            {BEATS.map((beat) => (
              <li key={beat.head} className={'flex gap-3'}>
                <beat.icon
                  className={'text-mark-strong mt-[3px] size-[17px] shrink-0'}
                  strokeWidth={2}
                  aria-hidden
                />
                <div className={'min-w-0'}>
                  <h3
                    className={
                      'text-foreground text-[14px] font-semibold tracking-[-0.012em]'
                    }
                  >
                    {beat.head}
                  </h3>
                  <p
                    className={
                      'text-muted-foreground mt-0.5 text-[13.5px] leading-[1.5]'
                    }
                  >
                    {beat.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div
          className={
            'border-border/70 bg-card shrink-0 border-t px-6 pt-3.5 pb-5 sm:px-9'
          }
        >
          {/*
          THE REASSURANCE SITS ABOVE THE BUTTON, NOT UNDER IT, and that is a
          measurement rather than a preference. Underneath, on a 660px tall
          window, it fell 11px below the fold: the visitor saw a black button
          and none of the three words that make it safe to press. Above it, the
          button is the last element in the sheet and "free, no account" is
          read before the press on every screen size measured.
        */}
          <p className={'text-muted-foreground mt-5 text-center text-[12.5px]'}>
            Free, takes seconds, and needs no account.
          </p>

          <button
            type={'button'}
            onClick={() => close('cta')}
            className={
              'bg-foreground text-background hover:bg-foreground/90 mt-2 w-full rounded-[11px] px-5 py-3 text-[15px] font-semibold transition-colors'
            }
          >
            See what your own text is carrying
          </button>
        </div>
      </div>
    </div>
  );
}
