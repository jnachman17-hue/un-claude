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

/**
 * ★ THE REVIEW SWITCH: `?briefing=loop`.
 *
 * Added 7 September 2026 because reviewing this thing was close to impossible.
 * It plays once, then never again on that device, so Jon got one pass at a 9.6
 * second sequence and then had to clear site data to see it a second time. That
 * is correct product behaviour and wrong review behaviour.
 *
 * With the parameter on: the once-per-visitor check is skipped, nothing is
 * written to storage, and the sequence restarts after holding its final frame.
 * **Everything else is the real component in its real place**, which is the
 * point: a separate demo page would be a different thing from the one shipping.
 *
 * ★ IT CANNOT AFFECT PRERENDERING, AND THAT IS NOT AN ACCIDENT. It is read from
 * `window.location.search` inside an effect, never with `useSearchParams`.
 * Reading search params during render is exactly the shape of the `Date.now()`
 * that cost this site its Google indexing (`04` entry 71): it would pull the
 * homepage out of its static prerender. This runs after mount, in the browser,
 * in a component that already renders nothing on the server.
 *
 * It ships. A visitor would have to guess the string, it changes nothing for
 * anybody who does not, and a review tool that only exists on a branch is a
 * review tool nobody has when they need it.
 */
const REVIEW_PARAM = 'briefing=loop';

/** How long the final frame is held before a looping review run starts over. */
const LOOP_HOLD = 2000;

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
 * ★ THE VIDEO. THREE SCENES, IN A BOX, MEANT TO BE WATCHED RATHER THAN READ.
 *
 * Jon, 7 September, on the version before this one: *"I almost think it's
 * better if the top half is contained in a box itself and it plays more as a
 * video of things you visually digest as opposed to a bunch of text you read...
 * it's so much to read, and it looks unprofessional."*
 *
 * So the rules this is built to, and each one came from a specific complaint:
 *
 *   1. **It sits in its own bordered box** inside the dialog. It reads as a
 *      thing that is playing rather than as more of the page.
 *   2. **As few words per scene as the idea allows.** Every scene is one
 *      statement and one picture.
 *   3. **The news snippets are the picture in scene 1**, not decoration. They
 *      used to be blank white bars streaking past, which is why Jon said they
 *      "don't appear anywhere. I think you failed to add them in but I see
 *      where you intended to."
 *   4. **The date is not the point.** "Since 2 August 2026" was set enormous
 *      and the sentence that matters was set small. Jon: *"I hate Aug 2nd being
 *      so big. Really weird... not logical to make an emphasis on Aug 2nd
 *      because the date doesn't really matter here."* Reversed.
 *   5. **No Claude chat card and no essay in scene 1.** Jon: *"that industrial
 *      revolution thing shows us or teaches us nothing and just adds to the
 *      complexity of what is digested."* The snippets take its place.
 *   6. **"A mark does not mean Claude wrote it" is gone.** Jon: *"that's too
 *      much nuance. We don't need that."* It is a good sentence and it is not
 *      this dialog's job.
 *
 * WHAT THE THREE SCENES ARE:
 *
 *   1  AI models watermark the text they write. INVISIBLY.
 *   2  the real news screenshots, popping in scattered, hero landing last
 *   3  The model is nudged at every pick.                   + words swapping
 *   4  Not hidden code. Not metadata. The watermark is the words.  + the scan
 *
 * The Claude Design artifact remains the directional reference and NOT a thing
 * to copy wholesale. Jon: *"it was to take inspiration from, pull directly from
 * in some instances, but you really just copied this and sort of changed the
 * formatting, and that's exactly what I didn't want."*
 * ════════════════════════════════════════════════════════════════════════════
 */

/**
 * ★ THE PRESS SHOTS. THE REAL SCREENSHOTS FROM JON'S DESIGN HANDOFF.
 *
 * Handed over 7 September 2026 as `design_handoff_pin1_watermark_video`, which
 * is the source for the pinned campaign video. Its README calls the headline
 * scene "11 news-screenshot cutouts... pop in one-by-one, 0.22s apart, each
 * rotated -8 to +7 degrees, drop shadows, scattered to fill the frame".
 *
 * ★ THIS IS THE THING THE EARLIER VERSIONS GOT WRONG. They composed cards out
 * of an outlet logo and a line of headline text, which is not what the design
 * is: **the snippets are photographs of real articles.** Jon: "those news
 * headline snippets don't appear anywhere... that contains the exact visual
 * assets of all the headline snippets popping up. You could literally copy that
 * directly."
 *
 * ★ EVERY ONE WAS OPENED AND READ BEFORE IT WENT ON THE HOME PAGE, because
 * these are screenshots and a screenshot cannot be checked by reading a
 * filename. The `alt` on each is what the headline actually says.
 *
 * ★ AND EVERY ONE WAS RESIZED. The originals are phone screenshots totalling
 * 1,816KB, which is an absurd thing to put in front of somebody arriving from
 * TikTok before they have seen the tool. At 560px wide and JPEG quality 62 the
 * seven together are 288KB, and a card renders about 260px wide, so 560 is
 * still 2x on a retina screen.
 */
type PressShot = {
  src: string;
  /** What the headline actually says. Read off the image, not the filename. */
  alt: string;
  /** Placed as a percentage of the box, so the scatter survives any width. */
  left: number;
  top: number;
  width: number;
  rotate: number;
};

const PRESS_SHOTS: PressShot[] = [
  {
    src: '/images/press-shots/IMG_3580.jpg',
    alt: 'Forbes: Claude Is Now Putting Invisible Watermarks In AI-Generated Text',
    left: 1,
    top: 4,
    width: 36,
    rotate: -6,
  },
  {
    src: '/images/press-shots/IMG_3578.jpg',
    alt: 'Anthropic: How Claude’s text watermark works',
    left: 33,
    top: -8,
    width: 35,
    rotate: 4,
  },
  {
    src: '/images/press-shots/IMG_3583.jpg',
    alt: 'New Atlas: Claude will now watermark all content generated using its tools',
    left: 66,
    top: 2,
    width: 34,
    rotate: 6,
  },
  {
    src: '/images/press-shots/IMG_3585.jpg',
    alt: 'The Guardian: Claude to start watermarking AI-generated text, but will it make quality worse?',
    left: 4,
    top: 48,
    width: 35,
    rotate: 5,
  },
  {
    src: '/images/press-shots/IMG_3577.jpg',
    alt: 'Business Insider: Why Anthropic’s AI watermark is going further than its rivals',
    left: 63,
    top: 52,
    width: 35,
    rotate: -5,
  },
  {
    src: '/images/press-shots/IMG_3581.jpg',
    alt: 'Mashable: What Claude’s AI text watermark actually does',
    left: 34,
    top: 58,
    width: 33,
    rotate: 3,
  },
];

/**
 * The hero, landing last and over the top, exactly as the handoff does it:
 * "at +2.75s the hero card lands with a pop".
 *
 * It is the California Post story and it is the single best headline in the set
 * for the person this dialog is for: **"Sorry, students."**
 */
const HERO_SHOT = {
  src: '/images/press-shots/IMG_3479.jpg',
  alt: 'California Post: Sorry, students: Anthropic adding watermarks to AI-generated content, potentially making cheating harder',
};

/**
 * The sentence scenes 2 and 3 work on. **Short on purpose.** The version before
 * this used a 25 word paragraph out of a Claude chat card, and the complaint
 * was that it is a wall to read rather than something to watch.
 *
 * Three words carry alternatives that would have read just as well. Rust for
 * the one showing, and they land on what was written.
 */
const PROSE = [
  { text: 'The results were' },
  { text: 'striking', alts: ['notable', 'marked'] },
  { text: 'and the effect' },
  { text: 'held', alts: ['lasted', 'stuck'] },
  { text: 'across every' },
  { text: 'trial', alts: ['test', 'run'] },
] as const;

/**
 * The prompt above Claude's answer, so scene 3 reads as a thing Claude wrote
 * rather than as a sentence on a page. It is the handoff's own prompt, shortened
 * to fit a 490px box.
 */
const PROMPT = 'Write my final essay';

/** How many picks the scan lights, which is what the badge counts to. */
const SIGNALS = 11;

/**
 * ★ THE TEN SECOND CEILING IS JON'S NUMBER AND THIS TABLE IS HOW IT IS KEPT.
 * The sequence runs off one counter ticking in fixed steps, so every moment is
 * arithmetic. The ceiling is asserted rather than remembered.
 */
const STEP = 100;

const T = {
  LINE_TWO: 500,
  INVISIBLY: 1100,
  SHOTS_FROM: 2200,
  SHOT_GAP: 170,
  HERO_AT: 3600,
  NUDGE_FROM: 4800,
  SWAP_EVERY: 250,
  NUDGE_LANDS: 6700,
  SCAN_FROM: 7000,
  SCAN_TO: 8600,
  END_FROM: 8900,
  TOTAL: 9900,
} as const;

if (T.TOTAL > 10_000)
  throw new Error('The briefing must not exceed 10 seconds.');

const ANTHROPIC_ANNOUNCEMENT =
  'https://www.anthropic.com/news/claude-text-watermark';

/**
 * THE TEXT UNDER THE VIDEO. Two blocks, and they carry the argument.
 *
 * ★ THE FIRST BLOCK IS JON'S OWN WORDING, 7 September 2026, and it is stronger
 * than what it replaced. One thing about it is worth writing down so nobody
 * "corrects" it later, and one thing is worth watching.
 *
 * **It is true.** Anthropic HAS publicly released a watermark detector:
 * `claude.com/check-content`, free, no account. And its text detector exists
 * too, running in private preview, with "educational organizations" named among
 * those who can request access and a stated plan to widen that access.
 *
 * **The thing to watch: those are TWO DIFFERENT DETECTORS.** The public one
 * reads C2PA credentials in FILES and cannot see text at all. The one this
 * dialog is about is the text detector, which is not public yet. **"Soon
 * universities, companies and individuals will have access to it" is what keeps
 * the sentence honest**, because it puts general access in the future where it
 * belongs. Do not change that clause to the present tense.
 *
 * Sourced from Anthropic's own announcement, linked under the blocks.
 *
 * ★ THE HIGHLIGHT IS THE HOMEPAGE'S, IN THE SAME COLOUR, BUILT DIFFERENTLY.
 * Jon asked for it to be marked "just like 'it's marked' is highlighted on the
 * homepage". That one is a bar positioned absolutely behind a single phrase,
 * sized in `em`, because an inline background follows the font's ascent and
 * descent rather than the ink (`hero-section.tsx` has the whole account).
 *
 * **That technique cannot cross a line break, and this phrase wraps to two
 * lines.** So this one is a real inline background with `box-decoration-clone`
 * so it paints once per line, and its own `leading` so the box hugs the text
 * instead of the line box. Same `bg-destructive/[0.16]`, so the two read as one
 * treatment.
 */
const BEATS = [
  {
    icon: ClockIcon,
    head: 'A watermark detector already exists',
    body: (
      <>
        Anthropic has publicly released a watermark detector.{' '}
        <span
          className={
            'bg-destructive/[0.16] text-foreground box-decoration-clone rounded-[4px] px-1 py-[3px] leading-[1.35] font-medium'
          }
        >
          Soon universities, companies and individuals will have access to it.
        </span>
      </>
    ),
  },
  {
    icon: InfinityIcon,
    /* Jon: "Marks don't expire is good." Untouched. */
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

      // A review run leaves no trace, so the page can just be reloaded.
      if (!window.location.search.includes(REVIEW_PARAM)) markSeen();
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
    const review = window.location.search.includes(REVIEW_PARAM);

    if (!review && (alreadySeen() || cameFromSearch())) return;

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
          if (at < T.TOTAL) return at + STEP;

          // Normally the sequence stops on its final frame and stays there.
          if (!review) {
            window.clearInterval(tick);
            return at;
          }

          // Under review it holds that frame, then runs again.
          return at >= T.TOTAL + LOOP_HOLD ? 0 : at + STEP;
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

  /* ── Everything the video draws, derived from the one counter. ────────── */

  const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

  const scene1 = ms < T.SHOTS_FROM;
  const scene2 = !scene1 && ms < T.NUDGE_FROM;
  const scene5 = ms >= T.END_FROM;
  const scene4 = !scene5 && ms >= T.SCAN_FROM;
  const scene3 = !scene1 && !scene2 && !scene4 && !scene5;

  /** Scene 1 arrives a line at a time. */
  const showsLineTwo = ms >= T.LINE_TWO;
  const showsInvisibly = ms >= T.INVISIBLY;

  /** Scene 2: the shots pop in one after another, then the hero lands on top. */
  const shotsIn = Math.max(0, Math.floor((ms - T.SHOTS_FROM) / T.SHOT_GAP) + 1);
  const heroIn = ms >= T.HERO_AT;

  /** Scene 3: which alternative each open word is showing. */
  const swap = Math.floor((ms - T.NUDGE_FROM) / T.SWAP_EVERY);
  const landed = ms >= T.NUDGE_LANDS;

  /** Scene 4: the scan's progress, and what it has found so far. */
  const scan = clamp01((ms - T.SCAN_FROM) / (T.SCAN_TO - T.SCAN_FROM));
  const found = Math.round(scan * SIGNALS);

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
            ★ THE VIDEO BOX. Jon asked for the animation to be contained and to
            read as something playing rather than as more of the page, so it has
            its own border, its own ground and a fixed height. Nothing below it
            moves while it plays: the scenes are stacked and only one is ever in
            the layout, because two scenes fading through each other draw both
            blocks of text at once and that reads as a rendering fault.
          */}
          <div
            className={
              'border-border/70 bg-foreground/[0.022] relative h-[304px] overflow-hidden rounded-[14px] border sm:h-[276px]'
            }
          >
            {/* ── 1. What happened, and the news that carried it. ─────────── */}
            <div className={'absolute inset-0 p-5 sm:p-6'} hidden={!scene1}>
              <p
                className={
                  'text-muted-foreground text-[12px] font-medium tracking-wide'
                }
              >
                Since 2 August 2026
              </p>

              {/*
                ★ THE EMPHASIS IS ON THE SENTENCE, NOT THE DATE. The date used
                to be set at 38px and the thing that matters at 15px, which Jon
                called weird and was right about: nobody is frightened by a
                date. It is now a label, and the claim is the display type.
              */}
              <p
                className={[
                  'text-foreground mt-1.5 text-[19.5px] leading-[1.15] font-semibold tracking-[-0.022em] text-balance transition-opacity duration-300 motion-reduce:opacity-100 sm:text-[23px]',
                  showsLineTwo ? 'opacity-100' : 'opacity-0',
                ].join(' ')}
              >
                AI models watermark the text they write.{' '}
                <span
                  className={[
                    'text-mark-strong decoration-mark-strong/40 underline decoration-2 underline-offset-4 transition-opacity duration-300 motion-reduce:opacity-100',
                    showsInvisibly ? 'opacity-100' : 'opacity-0',
                  ].join(' ')}
                >
                  Invisibly.
                </span>
              </p>
            </div>

            {/*
              ── 2. THE NEWS. Real screenshots, popping in scattered, the hero
                 landing on top last.

              Straight from the handoff's headline scene: "pop in one-by-one,
              0.22s apart, each rotated -8 to +7 degrees, drop shadows,
              scattered to fill the frame", then "the hero card lands with a
              pop". Positions are percentages rather than the handoff's pixels
              because that frame is 1080 wide and portrait and this box is 520
              and landscape, so the scatter is re-laid rather than copied.
            */}
            <div className={'absolute inset-0'} hidden={!scene2}>
              {PRESS_SHOTS.map((shot, index) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={shot.src}
                  src={shot.src}
                  alt={shot.alt}
                  loading={'lazy'}
                  decoding={'async'}
                  className={[
                    'ring-border/70 absolute rounded-[7px] object-cover shadow-[0_10px_26px_rgba(33,31,28,0.20)] ring-1',
                    'transition-all duration-300 ease-out motion-reduce:scale-100 motion-reduce:opacity-100',
                    shotsIn > index
                      ? 'scale-100 opacity-100'
                      : 'scale-[0.82] opacity-0',
                  ].join(' ')}
                  style={{
                    left: `${shot.left}%`,
                    top: `${shot.top}%`,
                    width: `${shot.width}%`,
                    rotate: `${shot.rotate}deg`,
                  }}
                />
              ))}

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={HERO_SHOT.src}
                alt={HERO_SHOT.alt}
                loading={'lazy'}
                decoding={'async'}
                className={[
                  'ring-border/70 absolute top-1/2 left-1/2 w-[46%] -translate-x-1/2 -translate-y-1/2 rounded-[8px] object-cover shadow-[0_18px_40px_rgba(33,31,28,0.30)] ring-1',
                  'transition-all duration-300 ease-out motion-reduce:scale-100 motion-reduce:opacity-100',
                  heroIn ? 'scale-100 opacity-100' : 'scale-[0.7] opacity-0',
                ].join(' ')}
                style={{ rotate: '-2deg' }}
              />
            </div>

            {/*
              ── 3. HOW IT GETS IN, INSIDE THE CLAUDE WINDOW.

              Jon: "can that look like it's in the Claude chat textbox UI, like
              Claude wrote it and nudged it." **That is the right instinct and it
              is what the handoff does**: the essay lives in a Claude window for
              the whole video, so the swapping words are visibly Claude's own
              choices rather than a sentence sitting on a page.

              The chrome is the handoff's: white card, hairline border, soft
              shadow, a header with the Claude mark and the word "Claude", and a
              right-aligned prompt bubble. Scaled down from a 1080px frame.

              The Claude mark is Anthropic's, used here to depict Claude's own
              interface. Supplied by Jon in the handoff bundle.
            */}
            <div
              className={
                'absolute inset-0 flex flex-col justify-center p-5 sm:p-6'
              }
              hidden={!scene3}
            >
              <h3
                className={
                  'text-foreground text-[19px] leading-[1.12] font-semibold tracking-[-0.022em] text-balance sm:text-[21px]'
                }
              >
                The model is nudged at every pick.
              </h3>

              <div
                className={
                  'border-border/70 bg-card mt-3 rounded-[12px] border p-3 shadow-[0_10px_28px_rgba(33,31,28,0.10)]'
                }
              >
                <div className={'flex items-center gap-1.5'}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={'/images/briefing/claude-mark.svg'}
                    alt={''}
                    aria-hidden
                    className={'size-[13px] dark:invert'}
                  />
                  <span
                    className={
                      'text-foreground/70 text-[11px] font-semibold tracking-wide'
                    }
                  >
                    Claude
                  </span>
                </div>

                <p
                  className={
                    'bg-mark/[0.10] text-foreground/75 mt-2 ml-auto w-fit rounded-[9px] px-2.5 py-1 text-[11.5px]'
                  }
                >
                  {PROMPT}
                </p>

                <p
                  className={
                    'mt-2.5 text-[16px] leading-[1.7] font-medium sm:text-[17px]'
                  }
                >
                  {PROSE.map((token, index) => {
                    if (!('alts' in token)) {
                      return (
                        <span key={index} className={'text-foreground/75'}>
                          {index === 0 ? '' : ' '}
                          {token.text}
                        </span>
                      );
                    }

                    const pool = [token.text, ...token.alts];
                    const shown = landed
                      ? token.text
                      : pool[Math.abs(swap + index) % pool.length]!;

                    return (
                      <span key={index}>
                        {' '}
                        <span
                          className={
                            'text-mark-strong transition-colors duration-200 motion-reduce:transition-none'
                          }
                        >
                          {shown}
                        </span>
                      </span>
                    );
                  })}
                </p>
              </div>

              <p className={'text-muted-foreground mt-2.5 text-[12px]'}>
                Every pick reads perfectly well. A key chooses which one.
              </p>
            </div>

            {/* ── 4. What that adds up to. ────────────────────────────────── */}
            <div
              className={
                'absolute inset-0 flex flex-col justify-center p-5 sm:p-6'
              }
              hidden={!scene4}
            >
              {/*
                ★ THE TWO RULE-OUTS ARE FROM THE HANDOFF AND THEY EARN THEIR
                LINE. Its scan scene asks "Is it hidden code?" then "Is it
                metadata?" and answers "No." to both before the reveal.

                They cost about a dozen words and they do the hardest teaching
                job this site has: a visitor cannot tell the three layers apart,
                and this dialog is about the one that is NEITHER of the two they
                would guess. `CLAUDE.md` section 7.
              */}
              <p
                className={
                  'text-muted-foreground text-[13px] leading-[1.5] font-medium'
                }
              >
                Not hidden code. Not metadata.
              </p>

              <h3
                className={
                  'text-foreground mt-1 text-[21px] leading-[1.12] font-semibold tracking-[-0.022em] text-balance sm:text-[23px]'
                }
              >
                The watermark{' '}
                <span className={'text-mark-strong'}>is the words.</span>
              </h3>

              {/*
                ★ THE HIGHLIGHTS SIT ON THE WORDS AND DO NOT COLLIDE, WHICH IS A
                FIX RATHER THAN A STYLE. Jon: "the orange highlights overlap,
                and they don't actually place against the words."

                Three things cause that and all three are handled here. The
                boxes are `inline-block` so a background cannot bleed across a
                line break. The line-height is 1.9 so two boxes on consecutive
                lines cannot touch. And the padding is vertical as well as
                horizontal, so the box is centred on the glyphs instead of
                hugging them.
              */}
              <p
                className={
                  'relative mt-4 text-[19px] leading-[2.15] font-medium sm:text-[20px]'
                }
              >
                {PROSE.map((token, index) => {
                  const open = 'alts' in token;
                  /* The scan lights each pick as it passes it. */
                  const lit = open && scan > (index + 0.5) / PROSE.length;

                  return (
                    <span key={index} className={'text-foreground/75'}>
                      {index === 0 ? '' : ' '}
                      {open ? (
                        <span
                          className={[
                            'inline-block rounded-[4px] px-1.5 py-[3px] leading-[1.25] transition-colors duration-200 motion-reduce:transition-none',
                            lit
                              ? 'bg-mark-strong text-white'
                              : 'text-mark-strong',
                          ].join(' ')}
                        >
                          {token.text}
                        </span>
                      ) : (
                        token.text
                      )}
                    </span>
                  );
                })}

                {/* The scan itself: a single rust rule travelling across. */}
                <span
                  className={[
                    'bg-mark-strong pointer-events-none absolute inset-y-0 w-[2px] motion-reduce:hidden',
                    scan > 0 && scan < 1 ? 'opacity-90' : 'opacity-0',
                  ].join(' ')}
                  style={{ left: `${scan * 100}%` }}
                  aria-hidden
                />
              </p>

              <div className={'mt-4 flex items-center gap-2.5'}>
                <span
                  className={
                    'bg-foreground text-background rounded-full px-2.5 py-1 text-[11.5px] font-semibold tabular-nums'
                  }
                >
                  {found} signals
                </span>
                <p className={'text-muted-foreground text-[12.5px]'}>
                  Enough picks make a pattern a detector can test.
                </p>
              </div>
            </div>

            {/*
              ── 5. THE END CARD, AND IT HOLDS.

              Jon: "at end of visual finish with an Un-Claude screen and have it
              pause there." It is the handoff's own closing frame, minus its
              button and sub-line, because this dialog already has a permanent
              CTA pinned to its own footer and does not need two.

              Nothing moves after this. It is also where a reduced-motion
              visitor lands, and where the loop rests before starting over.
            */}
            <div
              className={
                'absolute inset-0 flex flex-col items-center justify-center gap-4 p-5 sm:p-6'
              }
              hidden={!scene5}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={'/images/briefing/unclaude-logo.png'}
                alt={'Un-Claude'}
                className={'h-auto w-[224px] max-w-[64%] dark:invert'}
              />
              <p
                className={
                  'text-foreground text-center text-[19px] leading-[1.25] font-semibold tracking-[-0.02em] text-balance sm:text-[21px]'
                }
              >
                Your writing already carries it.
              </p>
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
