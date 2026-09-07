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
 * ════════════════════════════════════════════════════════════════════════════
 * ★ THE SEQUENCE IS A REBUILD OF JON'S CLAUDE DESIGN VIDEO, WATCHED FRAME BY
 *   FRAME. IT IS NOT A LAYOUT THAT FADES IN.
 *
 * The first attempt at this was built from a written description of the video
 * instead of the video, and it was wrong in the one way that mattered: it put
 * everything on screen at once and faded the pieces up. **The video is a
 * sequence of full scenes that REPLACE each other**, each built around a single
 * piece of display type, with a Claude chat card as the recurring object.
 *
 * The frame by frame inventory is in
 * `docs/session-notes/briefing-top-half-animated.md` section 1. Read it before
 * changing any of this, because the video is a rendered file with no code to
 * lift and re-watching it means driving a cross-origin player by hand.
 *
 * WHAT THE VIDEO DOES IN 27 SECONDS AND THIS DOES IN 9.6:
 *
 *   video 0:00  "Since August 2nd," + the Claude card typing an essay   -> SCENE A
 *   video 0:06  cards streaking past diagonally at speed                -> the transition
 *   video 0:15  "The model is nudged at every pick." + rust words
 *               swapping in running prose                               -> SCENE B
 *   video 0:11  the scan line, the rust highlights, "14 signals",
 *               "The watermark is the words."                           -> SCENE C
 *   video 0:18  a single line held over the marked card                 -> SCENE D
 *
 * Cut, and why, in the note: "No.", "Your essay sounds Fine/Normal/Human"
 * (a second word-cycling scene when there is already one), and the closing
 * "Your writing already carries it." scene, because this modal has a permanent
 * CTA pinned to its own footer and does not need to build to one.
 * ════════════════════════════════════════════════════════════════════════════
 */

/** Jon's essay sample, from the video's own Claude card. */
const PROMPT = 'Write my final essay on the Industrial Revolution';

const ESSAY =
  'The Industrial Revolution fundamentally transformed the rhythm of everyday life. Cities expanded as workers pursued new opportunities, and the pace of innovation accelerated across every sector of society.';

/**
 * The running prose of scenes B and C, which is the same sentence as the essay
 * above, set larger and out of the card. Six words carry alternatives that
 * would have read just as well; the video swaps them in place, rust for the
 * word showing.
 *
 * `sector` and `part` are the pair the video was caught mid-swap on.
 */
const PROSE = [
  { text: 'The Industrial Revolution' },
  { text: 'fundamentally', alts: ['profoundly', 'utterly'] },
  { text: 'transformed', alts: ['reshaped', 'changed'] },
  { text: 'daily life. Cities' },
  { text: 'expanded', alts: ['grew', 'swelled'] },
  { text: 'as workers' },
  { text: 'pursued', alts: ['chased', 'sought'] },
  { text: 'new opportunities, and innovation' },
  { text: 'accelerated', alts: ['quickened', 'sped up'] },
  { text: 'across every' },
  { text: 'sector', alts: ['part', 'corner'] },
  { text: 'of society.' },
] as const;

/** How many words the scan lights, which is what the badge counts up to. */
const SIGNALS = 14;

/**
 * ★ THE TEN SECOND CEILING IS JON'S NUMBER AND THIS TABLE IS HOW IT IS KEPT.
 *
 * The sequence is driven by one counter that ticks in fixed steps, so every
 * moment below is an arithmetic offset rather than an estimate and the note can
 * state the total as a fact. **The ceiling is asserted, so a future session that
 * stretches a beat gets a build error instead of a briefing people close.**
 */
const STEP = 100;

const T = {
  TYPE_FROM: 400,
  TYPE_TO: 2200,
  STREAK_FROM: 2100,
  STREAK_TO: 3000,
  B_FROM: 2900,
  SWAP_EVERY: 260,
  B_LANDS: 5900,
  SCAN_FROM: 6100,
  SCAN_TO: 7700,
  D_FROM: 8000,
  TOTAL: 9600,
} as const;

if (T.TOTAL > 10_000)
  throw new Error('The briefing must not exceed 10 seconds.');

const ANTHROPIC_ANNOUNCEMENT =
  'https://www.anthropic.com/news/claude-text-watermark';

/**
 * THE BOTTOM HALF, AND IT IS THE POINT OF THE BRIEFING.
 *
 * ★ THE FIRST BLOCK CHANGED FROM A FORECAST TO A FACT, AND THE FACT IS WORSE.
 *
 * It used to read "Anthropic has committed to releasing a public watermark
 * detector imminently. Universities, corporations, and individuals will be able
 * to use this." True, and a promise about the future.
 *
 * **Detection is not a promise any more.** Verified 6 September 2026 against
 * Anthropic's own two pages:
 *
 *   - "Watermark detection is currently in private preview"
 *   - eligible today: "regulators, law enforcement, media, fact-checkers,
 *     independent researchers, educational organizations, and EU civil society
 *     groups"
 *   - "We plan to expand access to the detection API over time."
 *
 * **"educational organizations" is quoted rather than paraphrased, in
 * Anthropic's own spelling, because it is the single most alarming word in this
 * dialog and it is theirs, not ours.**
 *
 * ★ WHY JON'S OWN PHRASE COULD NOT COME WITH IT. "Universities, corporations,
 * and individuals will be able to use this" was true as a forecast. Moved into
 * the present tense it becomes false: corporations and individuals are not on
 * the eligibility list. So the block is present tense for what is running and
 * future tense for the widening.
 *
 * ★ AND THE PRECISION GUARD. There are TWO detectors. The public one,
 * `claude.com/check-content`, reads C2PA credentials in FILES and **cannot see
 * text at all**. The one this dialog is about is the TEXT detector, in private
 * preview. Nothing here may imply the file checker can verify a rewrite.
 */
const BEATS = [
  {
    icon: ClockIcon,
    head: 'Detection is already running',
    body: (
      <>
        The text detector is in{' '}
        <span className={'text-foreground font-medium'}>private preview</span>{' '}
        now, not a promise for later. Anthropic names{' '}
        <span
          className={
            'text-mark-strong bg-mark/[0.13] rounded-[4px] px-1 font-semibold'
          }
        >
          &ldquo;educational organizations&rdquo;
        </span>{' '}
        among those who can request access, and says it plans to widen that
        access over time.
      </>
    ),
  },
  {
    icon: InfinityIcon,
    /* Jon: "that's good." The head is his and stays. The body moved off "the
       day the detector opens", which was written when the detector had not
       opened for anybody. It has, for some. */
    head: 'Marks don’t expire',
    body: (
      <>
        What you have already handed in stays marked. It does not fade, and it
        can be checked long after you handed it in.
      </>
    ),
  },
] as const;

export function WatermarkBriefing() {
  /*
   * `open` starts false and NOTHING renders until an effect turns it on. That
   * is what keeps the briefing out of the server-rendered HTML, which is the
   * whole SEO protection. Do not seed it true.
   */
  const [open, setOpen] = useState(false);
  /**
   * Milliseconds into the sequence, counted in fixed `STEP` ticks rather than
   * read off the clock. Every scene below is derived from it, so the whole
   * sequence is one number and its order cannot drift even if a throttled tab
   * slows the ticks down.
   */
  const [ms, setMs] = useState(0);

  const openedAt = useRef(0);
  const timers = useRef<number[]>([]);
  const intervals = useRef<number[]>([]);
  const panel = useRef<HTMLDivElement | null>(null);
  const restoreFocusTo = useRef<Element | null>(null);

  const clearTimers = useCallback(() => {
    for (const id of timers.current) window.clearTimeout(id);
    for (const id of intervals.current) window.clearInterval(id);
    timers.current = [];
    intervals.current = [];
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

      // A visitor who asked for less motion is put at the end of the sequence,
      // which is scene D held: the sentence that does the work, over the marked
      // card. Never a blank stage and never a half-built one.
      if (reduced) {
        setMs(T.TOTAL);
        return;
      }

      const tick = window.setInterval(() => {
        setMs((at) => {
          if (at >= T.TOTAL) {
            window.clearInterval(tick);
            return at;
          }
          return at + STEP;
        });
      }, STEP);

      intervals.current.push(tick);
    }, 550);

    timers.current.push(id);

    return () => {
      for (const t of timers.current) window.clearTimeout(t);
      for (const i of intervals.current) window.clearInterval(i);
      timers.current = [];
      intervals.current = [];
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

  /* ── Everything the stage draws, derived from the one counter. ────────── */

  const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

  /** Scene A: the essay types itself into the Claude card, word by word. */
  const essayWords = ESSAY.split(' ');
  const typed = Math.round(
    clamp01((ms - T.TYPE_FROM) / (T.TYPE_TO - T.TYPE_FROM)) * essayWords.length,
  );

  /** The cards that streak past between scene A and scene B. */
  const streaking = ms >= T.STREAK_FROM && ms < T.STREAK_TO;

  const sceneA = ms < T.B_FROM;
  const sceneD = ms >= T.D_FROM;
  const sceneBC = !sceneA && !sceneD;

  /** Scene B: which alternative each open word is showing right now. */
  const swap = Math.floor((ms - T.B_FROM) / T.SWAP_EVERY);
  /** They stop cycling and settle on what was actually written. */
  const landed = ms >= T.B_LANDS;

  /** Scene C: the scan line's progress down the prose, 0 to 1. */
  const scan = clamp01((ms - T.SCAN_FROM) / (T.SCAN_TO - T.SCAN_FROM));
  const scanning = ms >= T.SCAN_FROM;
  const found = Math.round(scan * SIGNALS);

  /** The headline over the prose swaps once, the way the video's does. */
  const headline = scanning
    ? 'The watermark is the words.'
    : 'The model is nudged at every pick.';

  return (
    <div
      className={
        'fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4'
      }
      onClick={(event) => {
        if (event.target === event.currentTarget) close('backdrop');
      }}
    >
      {/* ★ `aria-label`, NOT `aria-labelledby`. The heading it used to point at
          is inside scene A, and scene A is removed from the layout the moment
          the sequence cuts to scene B. A dialog whose accessible name
          disappears two seconds in is worse than one that never had it. */}
      <div
        ref={panel}
        role={'dialog'}
        aria-modal={'true'}
        aria-label={'Claude marks the text it writes'}
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
          {/*
            ★ THE STAGE. Fixed height, scenes stacked on top of one another, so
            nothing below it ever moves. A modal that grows re-centres itself
            and throws the line a reader is in the middle of.

            ★ THE SCENES CUT. THEY DO NOT CROSS-FADE, and that was a real defect
            rather than a preference. Two absolutely positioned scenes fading
            through each other draw both blocks of text at once: "The model is
            nudged at every pick." was rendering straight over "August 2nd,"
            and its Claude card. It reads as a rendering fault, and it is what
            Jon saw. **The video cuts between scenes, so this cuts.** Only one
            scene is ever in the layout; motion lives INSIDE a scene, never
            between two.
          */}
          <div className={'relative h-[300px] sm:h-[316px]'}>
            {/* ── SCENE A. "Since August 2nd," over a Claude card typing. ── */}
            <div className={['absolute inset-0'].join(' ')} hidden={!sceneA}>
              <p className={'text-muted-foreground text-[14px] font-medium'}>
                Since
              </p>
              <h2
                className={
                  'text-foreground text-[34px] leading-[1.02] font-semibold tracking-[-0.03em] sm:text-[38px]'
                }
              >
                August 2nd,
              </h2>
              <p
                className={
                  'text-foreground mt-1.5 text-[15.5px] leading-[1.35] font-medium'
                }
              >
                AI models watermark the text they write.{' '}
                <span className={'text-mark-strong'}>Invisibly.</span>
              </p>

              {/* The Claude card, with the prompt and the essay typing in. */}
              <div
                className={
                  'border-border/70 bg-card mt-3.5 rounded-[12px] border p-3 shadow-sm'
                }
              >
                <p
                  className={
                    'text-muted-foreground text-[10.5px] font-semibold tracking-wide'
                  }
                >
                  Claude
                </p>
                <p
                  className={
                    'bg-mark/[0.09] text-foreground/80 mt-1.5 ml-auto w-fit max-w-[80%] rounded-[9px] px-2.5 py-1.5 text-[11.5px] leading-snug'
                  }
                >
                  {PROMPT}
                </p>
                <p
                  className={
                    'text-foreground/70 mt-2 min-h-[52px] text-[11.5px] leading-[1.5]'
                  }
                >
                  {essayWords.slice(0, typed).join(' ')}
                  <span className={'motion-reduce:hidden'}>
                    {typed < essayWords.length ? ' |' : ''}
                  </span>
                </p>
              </div>
            </div>

            {/*
              ── THE TRANSITION. Cards streaking past from both sides.
              In the video this is about fourteen white cards motion blurred
              into diagonal lines, and it is texture rather than something to
              read: it says "this is everywhere" and then it clears.
            */}
            <div
              hidden={!streaking}
              className={
                'pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden'
              }
            >
              {Array.from({ length: 12 }).map((_, index) => {
                const fromLeft = index % 2 === 0;
                const top = 6 + index * 8;
                return (
                  <span
                    key={index}
                    className={[
                      'bg-card ring-border/70 absolute h-[16px] w-[150px] rounded-[5px] shadow-sm ring-1 transition-transform duration-500 ease-out',
                      streaking
                        ? 'translate-x-0'
                        : fromLeft
                          ? '-translate-x-[420px]'
                          : 'translate-x-[420px]',
                    ].join(' ')}
                    style={{
                      top: `${top}%`,
                      left: fromLeft ? '2%' : 'auto',
                      right: fromLeft ? 'auto' : '2%',
                      transitionDelay: `${index * 35}ms`,
                      rotate: fromLeft ? '-2deg' : '2deg',
                    }}
                  />
                );
              })}
            </div>

            {/* ── SCENES B AND C. One prose block, two headlines. ────────── */}
            <div className={['absolute inset-0'].join(' ')} hidden={!sceneBC}>
              <h3
                className={
                  'text-foreground text-[23px] leading-[1.08] font-semibold tracking-[-0.024em] text-balance sm:text-[25px]'
                }
              >
                {headline}
              </h3>

              <div className={'relative mt-3.5'}>
                <p className={'text-[16px] leading-[1.62] sm:text-[16.5px]'}>
                  {PROSE.map((token, index) => {
                    if (!('alts' in token)) {
                      return (
                        <span key={index} className={'text-foreground/80'}>
                          {index === 0 ? '' : ' '}
                          {token.text}
                        </span>
                      );
                    }

                    /*
                     * ★ NO WIDTH IS RESERVED AND THAT IS DELIBERATE. Holding
                     * each open word at the width of its longest alternative
                     * stops the line reflowing, and it leaves a ragged hole
                     * beside every short word: "Revolution utterly<gap>
                     * transformed". It read as broken text rather than as a
                     * word being chosen. **The video lets the prose reflow**,
                     * so this does too.
                     */
                    const pool = [token.text, ...token.alts];
                    const shown = landed
                      ? token.text
                      : pool[Math.abs(swap + index) % pool.length]!;
                    /* The scan lights the marked words as it passes them. */
                    const lit = scanning && scan > (index + 1) / PROSE.length;

                    return (
                      <span key={index}>
                        {' '}
                        <span
                          className={[
                            'inline-block text-left transition-colors duration-200 motion-reduce:transition-none',
                            lit
                              ? 'bg-mark-strong rounded-[3px] px-1 font-medium text-white'
                              : 'text-mark-strong font-medium',
                          ].join(' ')}
                        >
                          {shown}
                        </span>
                      </span>
                    );
                  })}
                </p>

                {/* The scan line itself, a single rust rule travelling down. */}
                <span
                  className={[
                    'bg-mark-strong pointer-events-none absolute inset-x-0 h-[2px] motion-reduce:hidden',
                    scanning && scan < 1 ? 'opacity-90' : 'opacity-0',
                  ].join(' ')}
                  style={{ top: `${scan * 100}%` }}
                  aria-hidden
                />
              </div>

              <div className={'mt-3 flex items-center gap-2.5'}>
                <span
                  className={[
                    'bg-foreground text-background rounded-full px-2.5 py-1 text-[11px] font-semibold transition-opacity duration-300',
                    scanning ? 'opacity-100' : 'opacity-0',
                  ].join(' ')}
                >
                  {found} signals
                </span>
                <p
                  className={'text-muted-foreground text-[12.5px] leading-snug'}
                >
                  Enough picks make a pattern a detector can test.
                </p>
              </div>
            </div>

            {/*
              ── SCENE D. The sentence that does the work, held.

              The brief is explicit that this is the most persuasive line in the
              briefing, because it turns the audience from people who cheated
              into anyone who has ever used Claude at all. It is also the thing
              most easily lost to motion, so it arrives last, alone, and nothing
              moves again after it. The marked card underneath is the video's
              own ending shape: one statement over the evidence.
            */}
            <div
              className={['absolute inset-0 flex flex-col justify-center'].join(
                ' ',
              )}
              hidden={!sceneD}
            >
              <p
                className={
                  'text-foreground text-[20px] leading-[1.2] font-semibold tracking-[-0.02em] text-balance sm:text-[22px]'
                }
              >
                A mark does not mean Claude wrote it.{' '}
                <span className={'text-mark-strong'}>
                  It means Claude touched it.
                </span>
              </p>
              <p
                className={
                  'text-muted-foreground mt-2.5 text-[14.5px] leading-[1.45]'
                }
              >
                Ask it to tidy a paragraph you wrote yourself, and the mark goes
                in with the tidy.
              </p>

              <div
                className={
                  'border-border/70 bg-card mt-4 rounded-[12px] border p-3 shadow-sm'
                }
              >
                <div className={'flex items-center justify-between'}>
                  <p
                    className={
                      'text-muted-foreground text-[10.5px] font-semibold tracking-wide'
                    }
                  >
                    Claude
                  </p>
                  <span
                    className={
                      'bg-foreground text-background rounded-full px-2 py-[3px] text-[10px] font-semibold'
                    }
                  >
                    {SIGNALS} signals
                  </span>
                </div>
                <p className={'mt-2 text-[11.5px] leading-[1.55]'}>
                  {PROSE.map((token, index) => (
                    <span
                      key={index}
                      className={
                        'alts' in token
                          ? 'bg-mark-strong rounded-[2px] px-[3px] font-medium text-white'
                          : 'text-foreground/70'
                      }
                    >
                      {index === 0 ? '' : ' '}
                      {token.text}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </div>

          {/*
            ★ THE BOTTOM HALF CARRIES THE ARGUMENT, SO IT STOPS LOOKING LIKE
            SMALL PRINT. Two lines of 13.5px grey under an animation is the
            shape of a footnote. The animation teaches; this is the part that is
            meant to make somebody act.

            ONE emphasised phrase, not three. A modal with several red
            highlights stops reading as a warning and starts reading as a cookie
            banner, so the rust is spent on the single most alarming true thing
            in the dialog and nothing else competes with it.
          */}
          <div
            className={
              'border-border/70 bg-foreground/[0.022] mt-4 space-y-4 rounded-[13px] border p-4'
            }
          >
            {BEATS.map((beat) => (
              <div key={beat.head} className={'flex gap-3'}>
                <beat.icon
                  className={'text-mark-strong mt-[2px] size-[18px] shrink-0'}
                  strokeWidth={2.2}
                  aria-hidden
                />
                <div className={'min-w-0'}>
                  <h3
                    className={
                      'text-foreground text-[15px] font-semibold tracking-[-0.014em]'
                    }
                  >
                    {beat.head}
                  </h3>
                  <p
                    className={
                      'text-muted-foreground mt-1 text-[14px] leading-[1.55]'
                    }
                  >
                    {beat.body}
                  </p>
                </div>
              </div>
            ))}

            <p className={'text-muted-foreground/80 pt-0.5 text-[11.5px]'}>
              Both from{' '}
              <a
                href={ANTHROPIC_ANNOUNCEMENT}
                target={'_blank'}
                rel={'noreferrer'}
                className={
                  'text-muted-foreground underline decoration-1 underline-offset-2'
                }
              >
                Anthropic&rsquo;s own announcement
              </a>
              .
            </p>
          </div>
        </div>

        <div
          className={
            'border-border/70 bg-card shrink-0 border-t px-6 pt-3.5 pb-5 sm:px-9'
          }
        >
          {/*
            ★ THE VERB CHANGED AND IT CROSSES A RULING. SURFACED, NOT HIDDEN.

            Jon asked for this button and `CLAUDE.md` section 2 makes his
            instruction in a session the highest authority there is, so it is
            built as asked. What follows is what section 2 also requires:
            naming the document it overrides rather than resolving the conflict
            quietly.

            **`04` entry 70 ruled the opposite, and the reasoning was Jon's
            own:** *"'Sanitise' stays. 'Remove watermark' would be untrue,
            because for layer B nobody can say the watermark was removed.
            Sanitise claims the work, not the outcome."*

            The conflict is sharper here than anywhere else on the site because
            this dialog is ABOUT layer B: ten seconds teach the mark in the
            words, and then the button offers to remove it. `04` entry 78 ruling
            3 says a claim in a whole-service slot must be true of the whole
            service, and removal is provable for hidden characters and metadata
            and is NOT provable for the rewrite.

            What keeps it defensible: the site already sells itself as an AI
            watermark remover in its own title tag, the tool really does remove
            two of the three layers provably, and no sentence in this dialog
            claims the rewrite is verified.

            **The one-word fix if Jon wants entry 70 back: "Sanitise" for
            "Remove".** His call, and it is in `06`.

            The wording and the sub-line are the video's own ending frame.
          */}
          <button
            type={'button'}
            onClick={() => close('cta')}
            className={
              'bg-foreground text-background hover:bg-foreground/90 w-full rounded-[11px] px-5 py-3.5 text-[15.5px] font-semibold transition-colors'
            }
          >
            Remove AI Watermarks Free
          </button>

          <p className={'text-muted-foreground mt-2 text-center text-[12.5px]'}>
            No account needed.
          </p>
        </div>
      </div>
    </div>
  );
}
