/**
 * How the statistical watermark is put in, and how a rewrite takes it out.
 *
 * Jon described this picture almost exactly: a token, a key with an arrow down
 * into it, three synonyms, and the key steering the choice. That is the correct
 * mental model and it is worth drawing properly, because every wrong intuition
 * about this product comes from imagining the mark as something added between
 * the words rather than as the choice of the words themselves.
 *
 * Sourced from ENGINE.md section 2. Anthropic uses a variant of SynthID-Text:
 * the preceding few words plus a secret key seed a function, candidates are
 * sampled from the model's real distribution, and a tournament picks the winner.
 * Signal survives only where runs of consecutive words survive, which is why the
 * attack is breaking runs rather than changing vocabulary.
 */
export function StatisticalWatermarkDiagram({ className }: { className?: string }) {
  const candidates = [
    { word: 'grey', chosen: false },
    { word: 'overcast', chosen: true },
    { word: 'gloomy', chosen: false },
  ];

  return (
    <svg
      viewBox={'0 0 460 320'}
      className={className}
      role={'img'}
      aria-label={
        'A secret key steering the model between three equally good synonyms, repeated across a sentence to form a signature'
      }
    >
      <defs>
        <marker id={'arrow-down'} markerWidth={7} markerHeight={7} refX={3.5} refY={6} orient={'auto'}>
          <path d={'M 0 0 L 3.5 6 L 7 0'} className={'fill-none stroke-foreground/45'} strokeWidth={1.4} />
        </marker>
      </defs>

      <g fontFamily={'var(--font-sans), sans-serif'}>
        <text x={24} y={26} fontSize={11} className={'fill-muted-foreground'}>
          1. The model reaches a word where several choices are equally good
        </text>

        <text
          x={24}
          y={62}
          fontSize={15}
          fontFamily={'var(--font-mono), monospace'}
          className={'fill-foreground'}
        >
          The sky was
        </text>

        {/* The key, sitting above the choice it steers. */}
        <g transform={'translate(232, 74)'}>
          <rect x={-58} y={0} width={116} height={30} rx={8} className={'fill-foreground'} />
          <circle cx={-38} cy={15} r={5.5} className={'fill-none stroke-background'} strokeWidth={2} />
          <path d={'M -33 15 L -21 15 M -25 15 L -25 20 M -21 15 L -21 21'} className={'stroke-background'} strokeWidth={2} fill={'none'} strokeLinecap={'round'} />
          <text x={4} y={20} fontSize={11.5} textAnchor={'middle'} className={'fill-background font-medium'}>
            secret key
          </text>
        </g>

        <path
          d={'M 232 106 L 232 128'}
          className={'stroke-foreground/45'}
          strokeWidth={1.4}
          fill={'none'}
          markerEnd={'url(#arrow-down)'}
        />

        {candidates.map((candidate, index) => {
          const x = 24 + index * 148;
          return (
            <g key={candidate.word}>
              <rect
                x={x}
                y={138}
                width={132}
                height={38}
                rx={9}
                className={candidate.chosen ? 'fill-mark' : 'fill-foreground/[0.045]'}
              />
              <text
                x={x + 66}
                y={162}
                textAnchor={'middle'}
                fontSize={14}
                fontFamily={'var(--font-mono), monospace'}
                className={candidate.chosen ? 'fill-mark-foreground font-medium' : 'fill-foreground/55'}
              >
                {candidate.word}
              </text>
            </g>
          );
        })}

        <text x={24} y={200} fontSize={11} className={'fill-muted-foreground'}>
          2. The key picks one. Nothing was added, and the sentence reads normally
        </text>

        {/* The chain across a whole paragraph. */}
        <text x={24} y={236} fontSize={11} className={'fill-muted-foreground'}>
          3. Repeated at every such word, the run of choices becomes the signature
        </text>

        <g transform={'translate(24, 248)'}>
          {Array.from({ length: 14 }).map((_, index) => (
            <rect
              key={index}
              x={index * 30}
              y={0}
              width={22}
              height={12}
              rx={3}
              className={index % 3 === 1 ? 'fill-mark' : 'fill-foreground/[0.09]'}
            />
          ))}
        </g>

        <text x={24} y={296} fontSize={11} className={'fill-muted-foreground'}>
          4. A rewrite that never repeats more than three of your words in a row
        </text>
        <text x={24} y={312} fontSize={11} className={'fill-muted-foreground'}>
          breaks the run the signature is carried in. That is what sanitising does.
        </text>
      </g>
    </svg>
  );
}
