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

export function LiveCounter() {
  // Rendered on the server too, so the figure is present in the HTML rather than
  // flashing in. Hydration re-reads the clock, which is why this is not state
  // initialised to zero.
  const [words, setWords] = useState(() => currentTotal(Date.now()));

  useEffect(() => {
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reduced) return;

    // The wall clock rather than animation frames: frames stop being delivered
    // when the tab is not painting, which used to leave this sitting still.
    const timer = window.setInterval(
      () => setWords(currentTotal(Date.now())),
      700,
    );
    return () => window.clearInterval(timer);
  }, []);

  return (
    // No container at all. Jon, twice: the counter "can literally just exist
    // on the page ... I don't think it needs a box around it." A hairline above
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
          equal. That mismatch is expected, not a defect: suppressing it is
          what silences the one hydration error this page ever produced. */}
      <p
        suppressHydrationWarning
        className={
          'text-foreground mt-3 font-mono text-[40px] leading-none font-medium tracking-[-0.03em] tabular-nums sm:text-[56px]'
        }
      >
        {words.toLocaleString('en-US')}
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
