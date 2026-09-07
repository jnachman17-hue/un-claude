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
    left: -8,
    top: -14,
    width: 48,
    rotate: -6,
  },
  {
    src: '/images/press-shots/IMG_3578.jpg',
    alt: 'Anthropic: How Claude’s text watermark works',
    left: 30,
    top: -18,
    width: 46,
    rotate: 4,
  },
  {
    src: '/images/press-shots/IMG_3583.jpg',
    alt: 'New Atlas: Claude will now watermark all content generated using its tools',
    left: 64,
    top: -10,
    width: 48,
    rotate: 7,
  },
  {
    src: '/images/press-shots/IMG_3585.jpg',
    alt: 'The Guardian: Claude to start watermarking AI-generated text, but will it make quality worse?',
    left: -10,
    top: 30,
    width: 48,
    rotate: 5,
  },
  {
    src: '/images/press-shots/IMG_3577.jpg',
    alt: 'Business Insider: Why Anthropic’s AI watermark is going further than its rivals',
    left: 60,
    top: 34,
    width: 48,
    rotate: -5,
  },
  {
    src: '/images/press-shots/IMG_3581.jpg',
    alt: 'Mashable: What Claude’s AI text watermark actually does',
    left: 26,
    top: 46,
    width: 46,
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
 * The prompt above Claude's answer, so the window reads as a thing Claude wrote
 * rather than as a sentence on a page. The handoff's own prompt, shortened to
 * fit a box a fifth of its frame's width.
 */
const PROMPT = 'Write my final essay';

/**
 * The sentence Claude "wrote", used by every scene after the news.
 *
 * `mark` is a pick the watermark could sit on. `alts` are the words that would
 * have read just as well, and only some picks carry them, because the nudge
 * scene only needs a few words moving to make its point.
 *
 * ★ THE SIGNAL COUNT IS DERIVED FROM THIS ARRAY AND NEVER TYPED. Jon: "I don't
 * know why there's eleven signals when you highlight three words." He was
 * right: `SIGNALS` was a hand-written 11 sitting next to three highlighted
 * words. **Counting the marks means the badge and the highlights cannot
 * disagree again, whatever anybody does to this sentence.**
 */
const PROSE = [
  { text: 'The' },
  { text: 'results', mark: true },
  { text: 'were', mark: true },
  { text: 'striking', mark: true, alts: ['notable', 'marked'] },
  { text: 'and the' },
  { text: 'effect', mark: true },
  { text: 'held', mark: true, alts: ['lasted', 'stuck'] },
  { text: 'across', mark: true },
  { text: 'every' },
  { text: 'trial', mark: true, alts: ['test', 'run'] },
  { text: 'that' },
  { text: 'followed', mark: true },
  { text: '.', glue: true },
] as const;

/** Counted, never typed. See above. */
const SIGNALS = PROSE.filter((t) => 'mark' in t).length;

/** The few picks that visibly move in the nudge scene. */
const SWAPPERS = PROSE.filter((t) => 'alts' in t).length;

/**
 * ★ THE SENTENCE FLATTENED TO WORDS, CARRYING WHETHER EACH ONE IS A PICK.
 *
 * The rewrite beat wipes the sentence position by position, so it needs one
 * entry per WORD. `PROSE` is one entry per token and one of its tokens holds
 * two words ("and the"), so it cannot be indexed against a rewrite directly.
 * Splitting here rather than writing a second copy of the sentence means the
 * two can never drift, which is the same discipline `SIGNALS` is under.
 */
const ORIGINAL = PROSE.filter((t) => !('glue' in t)).flatMap((t) =>
  t.text.split(' ').map((word) => ({ word, mark: 'mark' in t })),
);

const ORIGINAL_WORDS = ORIGINAL.map((o) => o.word);

/**
 * ★ THE REWRITE IS A RESTRUCTURE, AND THAT IS NOT A DETAIL.
 *
 * The obvious way to animate a rewrite is to swap words in place. **It is also
 * the exact thing this site spends its whole argument saying does not work.**
 * A casual reword leaves long runs of the original standing and every surviving
 * run still carries the signature. Animating word-level swaps here would put
 * the failure mode on screen and label it the product.
 *
 * So the sentence is genuinely rebuilt: the clauses change places, the verbs
 * change, and the picks the scan just lit are no longer sitting in the order it
 * found them.
 *
 *   before  The results were striking and the effect held across every trial
 *           that followed.
 *   after   Across every trial, the effect stayed and the results were hard to
 *           miss.
 *
 * **Thirteen words in and thirteen words out**, which is what lets the beat
 * wipe position by position instead of reflowing, and which is also true of the
 * real engine: length holds to within about a tenth.
 */
const REWRITTEN_WORDS = [
  'Across',
  'every',
  'trial,',
  'the',
  'effect',
  'stayed',
  'and',
  'the',
  'results',
  'were',
  'hard',
  'to',
  'miss',
] as const;

/**
 * The longest run of consecutive words the two sentences share.
 *
 * ★ COUNTED, NEVER TYPED, FOR THE REASON `SIGNALS` IS COUNTED. Jon caught a
 * hand-written 11 sitting beside three highlighted words. The caption in this
 * beat states a number about the two sentences on screen, so the number is
 * measured from those two sentences and cannot disagree with them.
 *
 * Compared on letters only, so "trial," and "trial" are the same word. That is
 * the strict reading: it counts a run as surviving even when the punctuation
 * moved, which can only ever make the number we report larger.
 */
function longestSharedRun(a: readonly string[], b: readonly string[]): number {
  const bare = (w: string) => w.toLowerCase().replace(/[^a-z]/g, '');
  let best = 0;

  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      let n = 0;
      /* Indexed reads are bound and checked rather than asserted, because
         `noUncheckedIndexedAccess` is on and a `!` here would be a lie about
         the loop bounds rather than a fact about them. */
      for (;;) {
        const left = a[i + n];
        const right = b[j + n];
        if (left === undefined || right === undefined) break;
        if (bare(left) !== bare(right)) break;
        n++;
      }
      if (n > best) best = n;
    }
  }

  return best;
}

/** 3, and it is "The results were". Proved in the session note. */
const LONGEST_RUN = longestSharedRun(ORIGINAL_WORDS, [...REWRITTEN_WORDS]);

/**
 * The bar under the sentence, drawn as runs.
 *
 * Always these same segments. Before the rewrite the gap between them is zero,
 * so they read as ONE unbroken bar, which is the channel the mark travels in.
 * As the rewrite sweeps through, the gap opens and the same bar becomes a row
 * of short fragments. One number animating does the entire demonstration, and
 * because the segments never change count there is nothing to reflow.
 */
const RUN_SEGMENTS = Array.from(
  { length: Math.ceil(ORIGINAL_WORDS.length / LONGEST_RUN) },
  (_, i) => Math.min(LONGEST_RUN, ORIGINAL_WORDS.length - i * LONGEST_RUN),
);

/**
 * ★ THE CEILING IS JON'S NUMBER AND THIS TABLE IS HOW IT IS KEPT. It was ten
 * seconds; he raised it himself to make room for the rebuild beat. The sequence
 * runs off one counter ticking in fixed steps, so every moment is arithmetic,
 * and the ceiling is asserted below rather than remembered.
 */
const STEP = 100;

const T = {
  LINE_TWO: 450,
  INVISIBLY: 1000,
  /* The shots land ON the hook rather than after it, and they land fast. */
  SHOTS_FROM: 1500,
  SHOT_GAP: 120,
  HERO_AT: 2450,
  /* Jon: this screen "feels too compressed and too quick". It gets 3 seconds. */
  NUDGE_FROM: 3100,
  SWAP_EVERY: 260,
  NUDGE_LANDS: 5800,
  SCAN_FROM: 6100,
  SCAN_TO: 7700,
  /* ── THE REBUILD, AND IT IS NOW THE LONGEST BEAT ON PURPOSE. ──────────
     Jon: "the we rebuild the wording sequence is so short and compressed...
     We can literally see nothing in that frame. You can add a few seconds."
     It had 1.1s and no motion in it, which for the one beat that shows the
     PRODUCT rather than the problem was the wrong 1.1 seconds to save.
     It now has 3.4s, in four moments:
       FIX_FROM    the marked sentence carries over from the scan, still lit
       RUNS_AT     the highlights clear and the unbroken run bar appears
       REBUILD_AT  the rewrite sweeps through and the bar breaks apart
       REBUILT_BY  settled, with the surviving run named */
  FIX_FROM: 8000,
  RUNS_AT: 8700,
  REBUILD_AT: 9500,
  REBUILT_BY: 10700,
  END_FROM: 11400,
  TOTAL: 12200,
} as const;

/*
 * ★ THE CEILING WAS 10 SECONDS AND JON LIFTED IT HIMSELF. "I told you we can
 * go slightly over if needed." Every one of the added 2.3 seconds went to the
 * rebuild beat; no earlier beat moved by a millisecond, because he has already
 * approved their pacing.
 *
 * The assertion stays, at the new number, because the reason for having one has
 * not changed: a briefing that outstays its welcome is a thing people close.
 * **Do not raise this again without asking him.**
 */
if (T.TOTAL > 13_000)
  throw new Error('The briefing must not exceed 13 seconds.');

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
 *
 * ★ THE BOX MUST BE SHORTER THAN THE LINE PITCH OR THE TWO HALVES COLLIDE.
 * Jon, on the shipped version: "the red highlight in Soon and the line below
 * overlap and it looks a little weird." **They did, by 2.3px, and it is
 * arithmetic rather than taste.** A cloned box is `leading` plus vertical
 * padding tall; the paragraph's `leading` is how far apart the lines sit. The
 * first was 18.9 + 3 + 3 = 24px and the second was 21.7px, so every wrapped
 * highlight in the site overlapped its own next line.
 *
 * **The rule, and it is the same one that bit the scan highlights last week:
 * font-size x span leading + 2 x padding MUST be less than font-size x
 * paragraph leading.** Here 14 x 1.2 + 4 = 20.8 against 14 x 1.8 = 25.2, which
 * leaves 4.4px of air. **Change either number and check the other.**
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
            'bg-destructive/[0.16] text-foreground box-decoration-clone rounded-[4px] px-1 py-[2px] leading-[1.2] font-medium'
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

/**
 * ★ CLAUDE'S OWN WINDOW, SHARED BY THE THREE SCENES THAT NEED IT.
 *
 * Jon: "can that look like it's in the Claude chat textbox UI, like Claude
 * wrote it and nudged it." It is also what the handoff does: the essay lives in
 * a Claude window for the whole video, so the picks read as Claude's own rather
 * than as a sentence sitting on a page.
 *
 * One component rather than three copies, because the nudge, the scan and the
 * rewrite are the SAME artefact at three moments, and three hand-built windows
 * would drift apart by the second edit.
 *
 * The chrome is the handoff's, scaled down from a 1080px frame: hairline
 * border, soft shadow, a header carrying the Claude mark and the word Claude,
 * and a right-aligned prompt bubble. The mark is Anthropic's, used to depict
 * Claude's own interface, and was supplied by Jon in the handoff bundle.
 */
function ClaudeWindow({
  children,
  badge,
}: React.PropsWithChildren<{ badge?: React.ReactNode }>) {
  return (
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
        {badge ? <span className={'ml-auto'}>{badge}</span> : null}
      </div>

      <p
        className={
          'bg-mark/[0.10] text-foreground/75 mt-2 ml-auto w-fit rounded-[9px] px-2.5 py-1 text-[11.5px]'
        }
      >
        {PROMPT}
      </p>

      {children}
    </div>
  );
}

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

  /*
   * ★ THE NEWS NO LONGER GETS ITS OWN SCENE. Jon: "I'd rather just have the
   * news blobs just cover that text. It literally stays on frame one, and then
   * that text becomes obscured by the news articles popping up." So scene 1 is
   * the hook AND the cover: the words stay where they are and the screenshots
   * land on top of them, fast.
   */
  const scene1 = ms < T.NUDGE_FROM;
  const scene5 = ms >= T.END_FROM;
  const scene4 = !scene5 && ms >= T.FIX_FROM;
  const scene3 = !scene4 && !scene5 && ms >= T.SCAN_FROM;
  const scene2 = !scene1 && !scene3 && !scene4 && !scene5;

  /** Scene 1 arrives a line at a time, then is buried. */
  const showsLineTwo = ms >= T.LINE_TWO;
  const showsInvisibly = ms >= T.INVISIBLY;
  const shotsIn = Math.max(0, Math.floor((ms - T.SHOTS_FROM) / T.SHOT_GAP) + 1);
  const heroIn = ms >= T.HERO_AT;

  /** Scene 2: which alternative each moving pick is showing. */
  const swap = Math.floor((ms - T.NUDGE_FROM) / T.SWAP_EVERY);
  const landed = ms >= T.NUDGE_LANDS;

  /** Scene 3: the scan's progress, and how many picks it has lit so far. */
  const scan = clamp01((ms - T.SCAN_FROM) / (T.SCAN_TO - T.SCAN_FROM));
  const found = Math.round(scan * SIGNALS);

  /*
   * Scene 4: the rewrite sweeping left to right.
   *
   * `rebuilt` is how far through the sentence it has got, 0 to 1, and it is the
   * ONLY number the beat animates. The words it has passed show the rewrite,
   * the words ahead of it still show the original, and the gap in the run bar
   * opens by the same fraction. One value, three things moving together, which
   * is why they cannot fall out of step.
   */
  const showsRuns = ms >= T.RUNS_AT;
  const rebuilt = clamp01(
    (ms - T.REBUILD_AT) / (T.REBUILT_BY - T.REBUILD_AT),
  );
  const rebuiltWords = Math.round(rebuilt * ORIGINAL_WORDS.length);
  const settled = ms >= T.REBUILT_BY;

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
            ★ THE VIDEO BOX. Its own border and ground, a fixed height, and one
            scene in the layout at a time. Scenes CUT; two of them fading
            through each other draws both blocks of text at once.
          */}
          <div
            className={
              'border-border/70 bg-foreground/[0.022] relative h-[304px] overflow-hidden rounded-[14px] border sm:h-[286px]'
            }
          >
            {/* ── 1. THE HOOK, AND THE NEWS BURYING IT. ──────────────────── */}
            <div className={'absolute inset-0'} hidden={!scene1}>
              <div className={'p-5 sm:p-6'}>
                <p
                  className={
                    'text-muted-foreground text-[12px] font-medium tracking-wide'
                  }
                >
                  Since 2 August 2026
                </p>
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
                The screenshots land ON the words, fast, until they have
                covered the frame. 120ms apart rather than 170, because Jon
                asked for them to "cover the screen super quickly".
              */}
              {PRESS_SHOTS.map((shot, index) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={shot.src}
                  src={shot.src}
                  alt={shot.alt}
                  loading={'eager'}
                  decoding={'async'}
                  className={[
                    'ring-border/70 absolute rounded-[7px] object-cover shadow-[0_12px_30px_rgba(33,31,28,0.22)] ring-1',
                    'transition-all duration-[260ms] ease-out motion-reduce:scale-100 motion-reduce:opacity-100',
                    shotsIn > index
                      ? 'scale-100 opacity-100'
                      : 'scale-[0.86] opacity-0',
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
                loading={'eager'}
                decoding={'async'}
                className={[
                  'ring-border/70 absolute top-1/2 left-1/2 w-[56%] -translate-x-1/2 -translate-y-1/2 rounded-[8px] object-cover shadow-[0_20px_44px_rgba(33,31,28,0.34)] ring-1',
                  'transition-all duration-[260ms] ease-out motion-reduce:scale-100 motion-reduce:opacity-100',
                  heroIn ? 'scale-100 opacity-100' : 'scale-[0.72] opacity-0',
                ].join(' ')}
                style={{ rotate: '-2deg' }}
              />
            </div>

            {/* ── 2. HOW IT GETS IN, INSIDE CLAUDE'S OWN WINDOW. ─────────── */}
            <div
              className={
                'absolute inset-0 flex flex-col justify-center p-5 sm:p-6'
              }
              hidden={!scene2}
            >
              <h3
                className={
                  'text-foreground text-[19px] leading-[1.12] font-semibold tracking-[-0.022em] text-balance sm:text-[21px]'
                }
              >
                The model is nudged at every pick.
              </h3>

              <ClaudeWindow>
                <p
                  className={'mt-2.5 text-[15.5px] leading-[1.75] font-medium'}
                >
                  {PROSE.map((token, index) => {
                    const moving = 'alts' in token;
                    const pool = moving ? [token.text, ...token.alts] : null;
                    const shown =
                      pool && !landed
                        ? pool[Math.abs(swap + index) % pool.length]!
                        : token.text;

                    return (
                      <span
                        key={index}
                        className={
                          moving
                            ? 'text-mark-strong transition-colors duration-200 motion-reduce:transition-none'
                            : 'text-foreground/75'
                        }
                      >
                        {index === 0 || 'glue' in token ? '' : ' '}
                        {shown}
                      </span>
                    );
                  })}
                </p>
              </ClaudeWindow>

              <p className={'text-muted-foreground mt-2.5 text-[12px]'}>
                {SWAPPERS === 3 ? 'Three' : SWAPPERS} of these words could have
                been others. A key chose which.
              </p>
            </div>

            {/*
              ── 3. WHAT THAT ADDS UP TO.

              ★ RELAID AFTER JON'S NOTE: "this screen looks really bad... the
              title is sort of in the same area and the text and the size as
              what's being scanned." It was two blocks of the same weight
              fighting each other.

              Now there is a clear hierarchy: the ruling is the display type at
              the top, and the thing being scanned is a small artefact
              underneath it with the counter on its own corner, which is where
              the handoff puts it.
            */}
            <div
              className={
                'absolute inset-0 flex flex-col justify-center p-5 sm:p-6'
              }
              hidden={!scene3}
            >
              <p
                className={
                  'text-muted-foreground text-[12.5px] leading-[1.4] font-medium'
                }
              >
                Not hidden code. Not metadata.
              </p>
              <h3
                className={
                  'text-foreground mt-1 text-[21px] leading-[1.1] font-semibold tracking-[-0.024em] text-balance sm:text-[24px]'
                }
              >
                The watermark{' '}
                <span className={'text-mark-strong'}>is the words.</span>
              </h3>

              <ClaudeWindow
                badge={
                  <span
                    className={
                      'bg-foreground text-background rounded-full px-2 py-[3px] text-[10.5px] font-semibold tabular-nums'
                    }
                  >
                    {found} signals
                  </span>
                }
              >
                <p className={'relative mt-2 text-[13px] leading-[2]'}>
                  {PROSE.map((token, index) => {
                    const marked = 'mark' in token;
                    const lit = marked && scan > (index + 0.5) / PROSE.length;

                    return (
                      <span key={index} className={'text-foreground/70'}>
                        {index === 0 || 'glue' in token ? '' : ' '}
                        {marked && lit ? (
                          /*
                           * ★ THE CHIP ONLY EXISTS ONCE THE SCAN HAS LIT IT.
                           * Carrying `inline-block` and padding on every marked
                           * word before it lights put a visible gap around each
                           * one and left the full stop floating away from
                           * "followed". Unlit, a pick is just a word.
                           */
                          <span
                            className={
                              'bg-mark-strong inline-block rounded-[3px] px-1 py-[2px] leading-[1.2] text-white'
                            }
                          >
                            {token.text}
                          </span>
                        ) : (
                          token.text
                        )}
                      </span>
                    );
                  })}

                  <span
                    className={[
                      'bg-mark-strong pointer-events-none absolute inset-y-0 w-[2px] motion-reduce:hidden',
                      scan > 0 && scan < 1 ? 'opacity-90' : 'opacity-0',
                    ].join(' ')}
                    style={{ left: `${scan * 100}%` }}
                    aria-hidden
                  />
                </p>
              </ClaudeWindow>
            </div>

            {/*
              ── 4. THE FIX, AND IT IS THE ONLY BEAT THAT SHOWS THE PRODUCT.

              Jon: "you need to make them know... you fix this by an engineered
              structural rewrite to break the watermarks." Then, of the first
              attempt: "so short and compressed... we can literally see nothing
              in that frame."

              He was right about the cause. It had 1.1 seconds and it drew a
              finished sentence, so there was nothing to watch, and the sentence
              it drew was the ORIGINAL WITH SYNONYMS SWAPPED IN, which is the
              failure mode this site exists to explain rather than the thing it
              sells.

              So the beat now demonstrates the actual mechanism, in three moves
              a phone reader can follow:

                1. the sentence the scan just lit, still lit, so it is plainly
                   the same artefact and not a new screen
                2. the highlights clear and a single unbroken bar appears under
                   it, which is the run the mark rides in
                3. the rewrite sweeps through the sentence left to right and the
                   bar breaks into fragments as it goes

              ★ IT DESCRIBES THE ENGINEERING AND STOPS THERE. The claims file is
              explicit: confident about the engineering, stop short of proving
              the outcome. **There is no counter falling to zero and no clean
              verdict**, because a verified layer B removal is the one thing
              this product may never show. What it does show is countable and
              true of the two sentences on screen: the longest run of words that
              survives is three.
            */}
            <div
              className={
                'absolute inset-0 flex flex-col justify-center p-5 sm:p-6'
              }
              hidden={!scene4}
            >
              <h3
                className={
                  'text-foreground text-[21px] leading-[1.1] font-semibold tracking-[-0.024em] text-balance sm:text-[24px]'
                }
              >
                So we{' '}
                <span className={'text-mark-strong'}>rebuild the wording.</span>
              </h3>

              {/* One line, and it changes once, at the moment the sweep starts.
                  Before: what the bar the reader is about to see MEANS. After:
                  what they are watching happen to it. */}
              <p
                className={
                  'text-muted-foreground mt-1.5 text-[12.5px] leading-[1.45]'
                }
              >
                {rebuilt > 0
                  ? 'Not a few swapped words. The sentence is rebuilt.'
                  : 'The mark only survives in long runs of consecutive words.'}
              </p>

              <ClaudeWindow>
                <p className={'relative mt-2 text-[13px] leading-[2]'}>
                  {ORIGINAL.map(({ word, mark }, index) => {
                    const done = index < rebuiltWords;

                    return (
                      <span key={index}>
                        {index === 0 ? '' : ' '}
                        {mark && !showsRuns ? (
                          /* Carried over from the scan, chip and all, so the
                             cut into this scene changes the words above the
                             sentence and nothing else. */
                          <span
                            className={
                              'bg-mark-strong inline-block rounded-[3px] px-1 py-[2px] leading-[1.2] text-white'
                            }
                          >
                            {word}
                          </span>
                        ) : (
                          <span
                            className={
                              done ? 'text-foreground' : 'text-foreground/55'
                            }
                          >
                            {done ? REWRITTEN_WORDS[index] : word}
                          </span>
                        )}
                      </span>
                    );
                  })}
                  .
                  {/* The sweep line, deliberately the same object as the scan
                      line one scene earlier. Same tool, opposite direction of
                      travel: that one was finding, this one is rebuilding. */}
                  <span
                    className={[
                      'bg-mark-strong pointer-events-none absolute inset-y-0 w-[2px] motion-reduce:hidden',
                      rebuilt > 0 && rebuilt < 1 ? 'opacity-90' : 'opacity-0',
                    ].join(' ')}
                    style={{ left: `${rebuilt * 100}%` }}
                    aria-hidden
                  />
                </p>

                {/*
                  ★ THE WHOLE ARGUMENT, DRAWN. Identical segments throughout;
                  only the gap between them moves. At gap zero they touch and
                  read as one unbroken run. As the sweep passes, the gap opens
                  and the same bar is a row of short fragments.

                  It is reserved from the start of the scene at zero opacity
                  rather than mounted when it is needed, so the sentence above
                  it never jumps.
                */}
                <div
                  className={[
                    'mt-2.5 flex h-[5px] transition-opacity duration-300',
                    showsRuns ? 'opacity-100' : 'opacity-0',
                  ].join(' ')}
                  style={{ gap: `${rebuilt * 5}px` }}
                  aria-hidden
                >
                  {RUN_SEGMENTS.map((length, index) => (
                    <span
                      key={index}
                      className={'bg-mark-strong/75'}
                      style={{
                        flexGrow: length,
                        borderRadius: `${rebuilt * 3}px`,
                      }}
                    />
                  ))}
                </div>

                <p
                  className={[
                    'text-muted-foreground mt-1.5 text-[10.5px] tabular-nums transition-opacity duration-300',
                    settled ? 'opacity-100' : 'opacity-0',
                  ].join(' ')}
                >
                  Longest run left standing: {LONGEST_RUN} words
                </p>
              </ClaudeWindow>
            </div>

            {/*
              ── 5. THE END CARD, AND IT HOLDS.

              Jon: "at end of visual finish with an Un-Claude screen and have it
              pause there." The handoff's closing frame minus its button and
              sub-line, because this dialog has a permanent CTA in its footer.
              Also where a reduced-motion visitor lands and where the review
              loop rests.
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
                      'text-muted-foreground mt-1 text-[14px] leading-[1.8]'
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
            this dialog is ABOUT layer B: the video teaches the mark in the
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
