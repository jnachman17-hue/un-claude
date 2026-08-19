'use client';

import { useEffect, useState } from 'react';

/**
 * How much AI text exists, counted live from the moment the page opened.
 *
 * The figure underneath it is real and attributed: Sam Altman said in February
 * 2024 that OpenAI was generating about 100 billion words a day. That is one
 * company, two years ago, and it is the most conservative public number
 * available, which is why it is the one used.
 *
 * What this is NOT is a counter of how many files Un-Claude has cleaned. Jon
 * asked for one, starting around six thousand, and described it as a little bit
 * fictitious. That is fabricated usage data presented as real, it is the one
 * claim on this site anybody could disprove, and it would undo the position
 * everything else here is built on. Declined and said so.
 */
const WORDS_PER_DAY = 100_000_000_000;
const WORDS_PER_MS = WORDS_PER_DAY / 86_400_000;

export function LiveCounter() {
  const [words, setWords] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      // Still says the true thing, just without the movement.
      setWords(Math.round(WORDS_PER_MS * 60_000));
      return;
    }

    // Driven by the wall clock rather than by animation frames. Frames stop
    // being delivered whenever the tab is not painting, which left the counter
    // sitting at zero; reading the clock means the figure is correct however
    // often it happens to be sampled, and it catches up rather than losing time.
    const started = Date.now();
    const tick = () => setWords(Math.floor((Date.now() - started) * WORDS_PER_MS));

    tick();
    const timer = window.setInterval(tick, 60);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className={'bg-card ring-border/70 animate-rise rounded-[16px] p-6 ring-1 sm:p-7'}>
      <p className={'text-muted-foreground text-[12px] font-medium tracking-[0.06em] uppercase'}>
        Words of AI text written since you opened this page
      </p>

      <p
        className={
          'text-foreground mt-3 font-mono text-[40px] leading-none font-medium tracking-[-0.03em] tabular-nums sm:text-[56px]'
        }
      >
        {words.toLocaleString('en-US')}
      </p>

      <p className={'text-muted-foreground mt-3.5 max-w-[58ch] text-[12.5px] leading-[1.6]'}>
        Counted from 100 billion words a day, which is what OpenAI’s chief
        executive said the company alone was generating in February 2024. One
        company, two years ago, and the most conservative public figure there is.
        Claude and Gemini now mark theirs.
      </p>
    </div>
  );
}
