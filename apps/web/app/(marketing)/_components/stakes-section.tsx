/**
 * The stakes: who the mark catches, and when checking starts.
 *
 * NEW, 19 August 2026. Two beats that used to be squeezed into the result
 * rows and a quote box that Jon rejected as having "no logical story". Each
 * beat now owns its Anthropic sentence, placed exactly where the doubt
 * occurs, hyperlinked in running prose rather than decorated: docs/09
 * section 6 found that a linked sentence in prose reads as a citation while
 * the same sentence blown up in a box reads as advertising.
 *
 * Beat one is the unfair part, and it is entirely factual: the mark records
 * that Claude touched the work, not how much. Beat two is the clock, built
 * the harvest-now-decrypt-later way: the urgency is not the detector's
 * arrival date, which Anthropic has not given, but that marked documents
 * already exist and do not change while the world waits. No invented dates,
 * no countdowns. 04 entry 80, docs/09 section 7.
 *
 * THE FIRST HEADING IS A PLACEHOLDER FOR JON. He ruled the emotional centre
 * should be in his words. This carries the beat until he writes it.
 */
const ANTHROPIC_POST = 'https://www.anthropic.com/news/claude-text-watermark';

export function StakesSection() {
  return (
    <section className={'border-border/70 border-t'}>
      <div className={'mx-auto max-w-[1180px] px-5 py-20 sm:px-8'}>
        <div className={'grid gap-14 lg:grid-cols-2 lg:gap-12'}>
          <div>
            <h2
              className={
                'text-foreground max-w-[24ch] text-[26px] leading-[1.12] font-semibold tracking-[-0.026em] text-balance sm:text-[30px]'
              }
            >
              Wrote it yourself and edited with Claude? Same mark.
            </h2>

            <div
              className={
                'text-muted-foreground mt-5 max-w-[58ch] space-y-4 text-[15px] leading-[1.65]'
              }
            >
              <p>
                The mark does not record how much you wrote. Anthropic says so
                itself:{' '}
                <a
                  href={ANTHROPIC_POST}
                  target={'_blank'}
                  rel={'noreferrer'}
                  className={
                    'text-foreground underline decoration-1 underline-offset-2'
                  }
                >
                  &ldquo;It cannot distinguish &lsquo;Claude wrote this&rsquo;
                  from &lsquo;Claude heavily edited this.&rsquo;&rdquo;
                </a>{' '}
                Their words, 14 August 2026.
              </p>
              <p>
                Tighten one paragraph and you carry the same mark as a
                document generated from a single prompt.{' '}
                <strong className={'text-foreground'}>
                  One mark. All it proves is that Claude touched it.
                </strong>
              </p>
            </div>
          </div>

          <div>
            <h2
              className={
                'text-foreground max-w-[24ch] text-[26px] leading-[1.12] font-semibold tracking-[-0.026em] text-balance sm:text-[30px]'
              }
            >
              Nobody can check it today. Anthropic says that changes soon.
            </h2>

            <div
              className={
                'text-muted-foreground mt-5 max-w-[58ch] space-y-4 text-[15px] leading-[1.65]'
              }
            >
              <p>
                From the same announcement:{' '}
                <a
                  href={ANTHROPIC_POST}
                  target={'_blank'}
                  rel={'noreferrer'}
                  className={
                    'text-foreground underline decoration-1 underline-offset-2'
                  }
                >
                  &ldquo;We will soon be offering a watermark detection
                  API.&rdquo;
                </a>{' '}
                When it opens, checking becomes a button anyone can press,
                and everything Claude has written since 2 August 2026 is
                already marked, wherever that text lives now.{' '}
                <strong className={'text-foreground'}>
                  The time to sanitise is before the checking starts.
                </strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
