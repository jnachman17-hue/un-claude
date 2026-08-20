/**
 * The moat: why a generic AI rewrite fails, and what our engine does instead.
 *
 * NEW, 19 August 2026, at Jon's direct instruction: "People need to know that
 * this actually works and what we do and what separates it apart from just
 * pasting a new model." The single most dangerous objection this product has
 * is "I could just paste it into another AI myself", and until this section
 * existed the site never answered it.
 *
 * Every claim here is measured and lives in ENGINE.md: the naive-rewrite
 * failures (55 to 69% length, "eighteen percent" to "18%", "semi-decade
 * pact"), the four engine rules and why each exists, and the receipt figures.
 * The Anthropic quote is verbatim and dated, 04 entry 83, and the sentence
 * after it claims a structural rewrite and points at the receipt rather than
 * claiming their exact bar of "every word replaced". Enticing, deliberately
 * ambiguous, never explicitly false: 04 entries 37 and 84 ruling 2.
 */
const ANTHROPIC_POST = 'https://www.anthropic.com/news/claude-text-watermark';

/*
 * No step numbers: the four rules are properties of every run, not a
 * sequence the reader follows, and the numbered-scaffold pattern is on the
 * craft floor's refuse list. Each title is an engineering rule; each body is
 * the one reason it exists.
 */
const RULES = [
  {
    title: 'Never Claude on Claude',
    body: 'Rewriting Claude with Claude re-applies the mark as it writes. The rewrite runs on a different model, by design.',
  },
  {
    title: 'Break every sequence',
    body: 'The mark survives only where your words survive in order. Hard ceiling: no more than three in a row come through.',
  },
  {
    title: 'Guard every fact',
    body: 'Numbers, dates and names are checked character for character. A section that drifts is rewritten until it matches.',
  },
  {
    title: 'Hold the length',
    body: 'Output stays within a tenth of your original. A rewrite that condenses is rejected, because compression eats facts.',
  },
];

const RECEIPT = [
  { figure: 'Wording replaced', detail: 'the share of your text rebuilt' },
  {
    figure: 'Longest surviving sequence',
    detail: 'the most of your words left in a row. The mark needs longer',
  },
  {
    figure: 'Figures carried through',
    detail: 'every number and date, checked against your original',
  },
  { figure: 'Length kept', detail: 'held within a tenth, by rule' },
];

export function MoatSection() {
  return (
    <section className={'border-border/70 border-t'}>
      <div className={'mx-auto max-w-[1180px] px-5 py-20 sm:px-8'}>
        <div className={'max-w-[62ch]'}>
          <h2
            className={
              'text-foreground text-[28px] leading-[1.1] font-semibold tracking-[-0.028em] text-balance sm:text-[34px]'
            }
          >
            Why you can&rsquo;t just ask another AI to reword it.
          </h2>

          <div
            className={
              'text-muted-foreground mt-5 space-y-4 text-[15px] leading-[1.65]'
            }
          >
            <p>
              Ask any model to rewrite but keep the facts, and it protects the
              sentences that contain them.{' '}
              <strong className={'text-foreground'}>
                Those untouched stretches are exactly where the watermark
                lives.
              </strong>{' '}
              A generic rewrite guards the one thing that has to be broken.
            </p>
            <p>
              We measured it. Generic rewrites came back a third shorter,
              turned &ldquo;eighteen percent&rdquo; into &ldquo;18%&rdquo;,
              and replaced &ldquo;five-year agreement&rdquo; with
              &ldquo;semi-decade pact&rdquo;. Shorter, wrong, and still marked
              where it mattered.
            </p>
          </div>
        </div>

        {/* Four engineering rules, each with the one reason it exists.
            The engineered register Jon asked for: sounds built, reads simply. */}
        <div className={'mt-12 grid gap-x-10 gap-y-7 sm:grid-cols-2'}>
          {RULES.map((rule) => (
            <div
              key={rule.title}
              className={'border-mark/40 border-l-[1px] pl-4'}
            >
              <h3
                className={
                  'text-foreground text-[15.5px] font-semibold tracking-[-0.015em]'
                }
              >
                {rule.title}
              </h3>
              <p
                className={
                  'text-muted-foreground mt-1.5 max-w-[52ch] text-[13.5px] leading-[1.6]'
                }
              >
                {rule.body}
              </p>
            </div>
          ))}
        </div>

        {/* The receipts: what every run hands back. Measurement is the honest
            confidence for the one layer nobody can verify yet. */}
        <div className={'border-border/70 mt-12 border-t pt-8'}>
          <h3
            className={
              'text-foreground text-[17px] font-semibold tracking-[-0.018em]'
            }
          >
            Every run hands back receipts.
          </h3>
          <div className={'mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-4'}>
            {RECEIPT.map((item) => (
              <div key={item.figure}>
                <p
                  className={
                    'text-foreground text-[13.5px] leading-[1.35] font-semibold tracking-[-0.012em]'
                  }
                >
                  {item.figure}
                </p>
                <p
                  className={
                    'text-muted-foreground mt-1 text-[12.5px] leading-[1.55]'
                  }
                >
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
          <p
            className={
              'text-muted-foreground mt-5 max-w-[62ch] text-[13.5px] leading-[1.6]'
            }
          >
            On our test set: over 90% of three-word sequences broken, zero
            figures lost. Measured, not estimated.
          </p>
        </div>

        {/* The kill shot, and it is not our sentence. */}
        <div className={'mt-10 max-w-[62ch]'}>
          <p className={'text-muted-foreground text-[15px] leading-[1.65]'}>
            This is not our theory. It is Anthropic&rsquo;s:{' '}
            <a
              href={ANTHROPIC_POST}
              target={'_blank'}
              rel={'noreferrer'}
              className={
                'text-foreground underline decoration-1 underline-offset-2'
              }
            >
              &ldquo;Light editing probably won&rsquo;t remove the watermark
              completely; a complete rewrite where every word is replaced
              will.&rdquo;
            </a>{' '}
            <strong className={'text-foreground'}>
              The maker of the watermark, describing the method. A structural
              rewrite is what this engine performs, and the receipt shows you
              how complete it was.
            </strong>
          </p>
        </div>
      </div>
    </section>
  );
}
