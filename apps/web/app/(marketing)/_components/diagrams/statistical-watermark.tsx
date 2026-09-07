/**
 * What the statistical watermark actually is: nothing added, and two words
 * picked differently.
 *
 * ★ REDRAWN 6 September 2026, and the reason is a duplicate rather than a
 * fault in the old drawing.
 *
 * The old version was Jon's own spec from 20 August: a sentence stopping at a
 * blank, a line dropping through a secret key pill and splitting into three
 * candidate words. It was a good drawing. What changed is that "how the rewrite
 * works" now opens with beat 0, which teaches exactly that idea in running
 * prose, in motion, using the same "The sky was ___" example. Two makings of
 * one idea on one page is the defect the rethink brief asked to remove, and the
 * motion version is the better of the two.
 *
 * So this panel keeps the point that is ITS OWN and that nothing else on the
 * page makes: the mark is invisible because nothing is inserted anywhere. The
 * same sentence from a plain model and from a watermarking one is the same
 * length, the same shape and equally natural. Two words differ. That is the
 * whole of it.
 *
 * The slot layout is deliberate: both rows use the width of the WIDER word at
 * every position, so the two sentences line up column for column and the eye
 * finds the two differences without being told where to look.
 *
 * Sourced from ENGINE.md section 2: candidates are sampled from the model's
 * true distribution and a tournament seeded by a secret key picks the winner,
 * so a watermarked sentence is a sentence the model could have written anyway.
 */

const PLAIN = [
  'the',
  'results',
  'were',
  'striking',
  'and',
  'the',
  'effect',
  'held',
];
const MARKED = [
  'the',
  'results',
  'were',
  'notable',
  'and',
  'the',
  'effect',
  'lasted',
];

/** Monospace advance at the 13px used below, plus the gap between slots. */
const CHAR = 7.8;
const GAP = 12;
const START_X = 24;

const SLOTS = PLAIN.map((word, index) => {
  const widest = Math.max(word.length, MARKED[index]!.length);
  return widest * CHAR + GAP;
});

const OFFSETS = SLOTS.reduce<number[]>((acc, width, index) => {
  acc.push(index === 0 ? START_X : acc[index - 1]! + SLOTS[index - 1]!);
  return acc;
}, []);

const PLAIN_Y = 76;
const MARKED_Y = 138;

export function StatisticalWatermarkDiagram({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox={'0 0 460 170'}
      className={className}
      role={'img'}
      aria-label={
        'The same sentence written twice, once by a plain model and once by a watermarking one, identical except for two words'
      }
    >
      <g fontFamily={'var(--font-sans), sans-serif'}>
        <text
          x={START_X}
          y={20}
          fontSize={11}
          className={'fill-muted-foreground'}
        >
          The same sentence, from two models
        </text>

        <text
          x={START_X}
          y={52}
          fontSize={10.5}
          className={'fill-muted-foreground'}
        >
          No watermark
        </text>
        <text
          x={START_X}
          y={114}
          fontSize={10.5}
          className={'fill-muted-foreground'}
        >
          Watermarked
        </text>

        <g fontFamily={'var(--font-mono), monospace'} fontSize={13}>
          {PLAIN.map((word, index) => {
            const changed = word !== MARKED[index];

            return (
              <g key={`plain-${index}`}>
                {changed ? (
                  <rect
                    x={OFFSETS[index]! - 5}
                    y={PLAIN_Y - 14}
                    width={SLOTS[index]! - 2}
                    height={20}
                    rx={5}
                    className={'fill-foreground/[0.055]'}
                  />
                ) : null}
                <text
                  x={OFFSETS[index]}
                  y={PLAIN_Y}
                  className={'fill-foreground/70'}
                >
                  {word}
                </text>
              </g>
            );
          })}

          {MARKED.map((word, index) => {
            const changed = word !== PLAIN[index];

            return (
              <g key={`marked-${index}`}>
                {changed ? (
                  <rect
                    x={OFFSETS[index]! - 5}
                    y={MARKED_Y - 14}
                    width={SLOTS[index]! - 2}
                    height={20}
                    rx={5}
                    className={'fill-mark/[0.16]'}
                  />
                ) : null}
                <text
                  x={OFFSETS[index]}
                  y={MARKED_Y}
                  className={
                    changed
                      ? 'fill-mark-strong font-medium'
                      : 'fill-foreground/70'
                  }
                >
                  {word}
                </text>
              </g>
            );
          })}
        </g>

        {/* A hairline from each unchanged word to the one below it, so the two
            rows read as one sentence twice rather than as two sentences. */}
        {PLAIN.map((word, index) =>
          word === MARKED[index] ? (
            <path
              key={`tie-${index}`}
              d={`M ${OFFSETS[index]! + 4} ${PLAIN_Y + 10} L ${OFFSETS[index]! + 4} ${MARKED_Y - 22}`}
              className={'stroke-foreground/12'}
              strokeWidth={1}
              fill={'none'}
            />
          ) : null,
        )}

        {/* And a rust one between the two that differ. */}
        {PLAIN.map((word, index) =>
          word !== MARKED[index] ? (
            <path
              key={`swap-${index}`}
              d={`M ${OFFSETS[index]! + 4} ${PLAIN_Y + 10} L ${OFFSETS[index]! + 4} ${MARKED_Y - 22}`}
              className={'stroke-mark-strong/60'}
              strokeWidth={1.4}
              strokeDasharray={'3 3'}
              fill={'none'}
            />
          ) : null,
        )}

        <text
          x={START_X}
          y={164}
          fontSize={11}
          className={'fill-muted-foreground'}
        >
          Nothing added. Nothing removed. Two picks changed.
        </text>
      </g>
    </svg>
  );
}
