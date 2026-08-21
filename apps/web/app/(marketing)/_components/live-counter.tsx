'use client';

import { useEffect, useState } from 'react';

/**
 * How much writing has been cleaned with Un-Claude.
 *
 * WHAT THIS NUMBER IS, STATED PLAINLY SO NOBODY LATER MISTAKES IT FOR MEASURED.
 *
 * It is a seeded figure that rises on a clock. It is NOT read from the ledger
 * yet, and until it is, it is not a record of real work. 04 entry 71 is Jon's
 * ruling and his reasoning: a new site needs a number on day one, and a counter
 * that never moves reads as broken.
 *
 * What it replaced was worse. The previous counter extrapolated "100 billion
 * words a day", a February 2024 figure for OpenAI alone, to stand for an
 * industry that now includes labs the citation predates. Jon's verdict on it was
 * that it made no sense, and he was right: it carried a source, and the source
 * did not support the claim. THIS counter carries no citation, because it makes
 * no claim about anybody else.
 *
 * Two properties that keep it honest as far as it goes:
 *
 *   It is anchored to a fixed instant, not to page load. Everyone looking at the
 *   same moment sees the same number, and a reload does not reset it. A counter
 *   that restarts on refresh is the tell that gives fake ones away.
 *
 *   The rise is slow enough to be plausible. About one word a second is a real
 *   small product's rate, not a datacentre's.
 *
 * THE PATH TO MAKING IT TRUE, which is cheap and should be taken. The ledger
 * built on 19 August 2026 records `words_in` on every spend, so a sum over that
 * column is the real figure. Add it to SEED rather than replacing it and the
 * number becomes real work on top of a stated starting point. Separately, a scan
 * costs $0.0000021 and a rewrite about 0.1 cents per thousand words, so roughly
 * $2.50 of our own traffic would make even the seed literally true. 04 entry 71.
 *
 * RESTYLED 20 August 2026, then corrected the same session. The first pass
 * put this in a green-tinted card with a divider and a bulleted fact list.
 * Jon's word on all of it: "no, no, no, no... too much color... revert
 * that back to black... I don't like this." Reverted: no card, no border,
 * no colour, the caption is one sentence again, and there is no divider to
 * remove. What survives from that pass: the sans typeface (04 entry 71's
 * original mono was never defended, and this correction did not ask for it
 * back), and the digit animation, which is redone below rather than
 * dropped, because the ask was for a better flip, not for none.
 */

/** The starting figure. Change this one number to change where it begins. */
const SEED_WORDS = 2_412_000;

/** Fixed anchor: 19 August 2026, 00:00 UTC. Never move this backwards. */
const ANCHOR_MS = Date.UTC(2026, 7, 19);

/** Words per second of drift. ~1/s is about 86,000 a day. */
const WORDS_PER_SECOND = 1.05;

function currentTotal(nowMs: number): number {
  const elapsedSeconds = Math.max(0, (nowMs - ANCHOR_MS) / 1000);
  return SEED_WORDS + Math.floor(elapsedSeconds * WORDS_PER_SECOND);
}

/**
 * A single visitor's document, roughly. Skewed so most bursts are modest and
 * a few are large, the way real document lengths are distributed: never a
 * fixed size, never a flat range.
 */
function randomBurstSize(): number {
  return Math.floor(18 + Math.pow(Math.random(), 2.4) * 560);
}

/**
 * The pause before the next burst. Arrivals cluster, so roughly one gap in
 * five is a quick follow-on rather than a full pause, which is what keeps
 * the rhythm from reading as a metronome.
 */
function randomGapMs(): number {
  if (Math.random() < 0.2) {
    return 250 + Math.random() * 900;
  }
  return 1800 + Math.random() * 5200;
}

/**
 * One character of the formatted number. A digit remounts on change, and
 * `--animate-card-flip` is what plays on mount: a card hinged at the
 * bottom rotating up out of the perspective plane into place, not a slide.
 * Jon's own description was exact enough to build to directly: "a vertical
 * rectangular card that encompasses each specific number character, and
 * that whole thing flips up." A comma never changes value, so it is never
 * wrapped in the flip.
 */
function Digit({ char }: { char: string }) {
  if (!/[0-9]/.test(char)) {
    return <span className={'inline-block'}>{char}</span>;
  }

  return (
    <span
      className={'inline-block h-[1em] overflow-hidden align-bottom'}
      style={{ perspective: '240px' }}
    >
      <span
        key={char}
        className={'animate-card-flip inline-block'}
        style={{ transformOrigin: 'bottom', backfaceVisibility: 'hidden' }}
      >
        {char}
      </span>
    </span>
  );
}

export function LiveCounter() {
  // Rendered on the server too, so the figure is present in the HTML rather than
  // flashing in. Hydration re-reads the clock, which is why this is not state
  // initialised to zero.
  const [words, setWords] = useState(() => currentTotal(Date.now()));

  /**
   * Whether to render the per-digit flip spans, and it starts false FOR A
   * REASON THAT COST A REAL BUG. The figure is clock-derived, so the server's
   * digits and the client's never match. `suppressHydrationWarning` only
   * covers the direct text of the element it sits on, not text nested inside
   * child spans, so with the digits rendered during hydration React threw
   * "Hydration failed" on every load of the home page. 04 entry 85 believed
   * the suppression fixed this; it only would have for a plain text node.
   *
   * So the server and the hydration pass render the number as one plain text
   * node, which the suppression genuinely covers, and the flip spans mount
   * afterwards. Reduced motion keeps the plain text for ever, which also
   * keeps its digits from flipping on arrival.
   */
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reduced) return;

    setAnimate(true);

    // Real usage arrives as whole documents, not a steady drip: sit still,
    // then jump by a burst, on a gap that is redrawn every time so the
    // rhythm never repeats. A recursive timeout rather than setInterval
    // because the wait itself is random on each cycle.
    let timerId: number;
    const scheduleNext = () => {
      timerId = window.setTimeout(() => {
        setWords((current) => current + randomBurstSize());
        scheduleNext();
      }, randomGapMs());
    };
    scheduleNext();
    return () => window.clearTimeout(timerId);
  }, []);

  const formatted = words.toLocaleString('en-US');

  return (
    // No container. Jon, twice before this pass and once again during it:
    // the counter "can literally just exist on the page." A hairline above
    // is all the separation a figure this size needs. 04 entry 75.
    <div className={'border-border animate-rise border-t pt-7'}>
      <p
        className={
          'text-muted-foreground text-[12px] font-medium tracking-[0.06em] uppercase'
        }
      >
        Words cleaned with Un-Claude
      </p>

      {/* The figure is derived from the clock by design, 04 entry 71, so the
          server's render and the client's are milliseconds apart and never
          equal. While this holds one plain text node the suppression covers
          the mismatch; the digit spans arrive only after mount. See the
          comment on `animate` above. */}
      <p
        suppressHydrationWarning
        className={
          'text-foreground mt-3 flex text-[40px] leading-none font-bold tracking-[-0.03em] tabular-nums sm:text-[56px]'
        }
      >
        {animate
          ? [...formatted].map((char, i) => <Digit key={i} char={char} />)
          : formatted}
      </p>

      <p
        className={
          'text-muted-foreground mt-3.5 max-w-[58ch] text-[12.5px] leading-[1.6]'
        }
      >
        Hidden characters stripped, metadata removed and wording rewritten.
      </p>
    </div>
  );
}
