/**
 * How the statistical watermark is put in.
 *
 * REDRAWN TO JON'S OWN SPEC, 20 August 2026, and it is the better drawing:
 * the sentence stops at a blank, a line drops from the blank through a secret
 * key pill, and splits into three fingers, one per candidate word. The fingers
 * to the rejected words are red, the finger to the chosen word is green. The
 * old version put the key in a floating badge with an arrow, which made the
 * key look like an annotation; here the key sits ON the line between the
 * sentence and the choice, which is where it actually is.
 *
 * Sourced from ENGINE.md section 2. Anthropic uses a variant of SynthID-Text:
 * the preceding few words plus a secret key seed a function, candidates are
 * sampled from the model's real distribution, and a tournament picks the
 * winner. The signal survives only in unbroken stretches of the original
 * words, which is why the attack is breaking the sequence, not the vocabulary.
 */
export function StatisticalWatermarkDiagram({ className }: { className?: string }) {
  // Pill row geometry, shared by the fingers and the pills themselves.
  const pills = [
    { word: 'grey', x: 24, chosen: false },
    { word: 'overcast', x: 168, chosen: true },
    { word: 'gloomy', x: 312, chosen: false },
  ];
  const pillWidth = 128;
  const pillTop = 150;
  const blankCenterX = 159;
  const branchY = 124;

  return (
    <svg
      viewBox={'0 0 460 282'}
      className={className}
      role={'img'}
      aria-label={
        'A sentence stopping at a blank, with a line running from the blank through a secret key and splitting toward three candidate words, green to the chosen word and red to the rejected ones'
      }
    >
      <g fontFamily={'var(--font-sans), sans-serif'}>
        <text x={24} y={24} fontSize={11} className={'fill-muted-foreground'}>
          At many words, several choices read equally well
        </text>

        {/* The sentence, stopping at a blank where the next word goes. */}
        <text
          x={24}
          y={58}
          fontSize={15}
          fontFamily={'var(--font-mono), monospace'}
          className={'fill-foreground'}
        >
          The sky was
        </text>
        <path
          d={'M 132 63 L 186 63'}
          className={'stroke-foreground/60'}
          strokeWidth={1.5}
          strokeLinecap={'round'}
          fill={'none'}
        />

        {/* The trunk, dropping from the blank, with the key pill sitting ON it. */}
        <path
          d={`M ${blankCenterX} 70 L ${blankCenterX} ${branchY}`}
          className={'stroke-foreground/40'}
          strokeWidth={1.4}
          fill={'none'}
        />

        {/* Three fingers, one per candidate. Red to the rejected words, green
            to the one the key picks. */}
        {pills.map((pill) => (
          <path
            key={`finger-${pill.word}`}
            d={`M ${blankCenterX} ${branchY} L ${pill.x + pillWidth / 2} ${pillTop}`}
            className={pill.chosen ? 'stroke-emerald-600' : 'stroke-rose-500/70'}
            strokeWidth={pill.chosen ? 1.8 : 1.4}
            strokeLinecap={'round'}
            fill={'none'}
          />
        ))}

        {/* The key pill, overlapping the trunk. */}
        <rect x={111} y={84} width={96} height={26} rx={13} className={'fill-foreground'} />
        <g className={'stroke-background'} strokeWidth={1.8} fill={'none'} strokeLinecap={'round'}>
          <circle cx={126} cy={97} r={4.5} />
          <path d={'M 130.5 97 L 141 97 M 136 97 L 136 101.5 M 141 97 L 141 102'} />
        </g>
        <text x={147} y={101} fontSize={10.5} className={'fill-background font-medium'}>
          secret key
        </text>

        {pills.map((pill) => (
          <g key={pill.word}>
            <rect
              x={pill.x}
              y={pillTop}
              width={pillWidth}
              height={38}
              rx={9}
              className={pill.chosen ? 'fill-emerald-600 animate-chosen' : 'fill-foreground/[0.045]'}
            />
            <text
              x={pill.x + pillWidth / 2}
              y={pillTop + 24}
              textAnchor={'middle'}
              fontSize={14}
              fontFamily={'var(--font-mono), monospace'}
              className={pill.chosen ? 'fill-white font-medium' : 'fill-foreground/55'}
            >
              {pill.word}
            </text>
          </g>
        ))}

        <text x={24} y={216} fontSize={11} className={'fill-muted-foreground'}>
          The key makes the pick. The sentence reads normally either way
        </text>

        <text x={24} y={242} fontSize={11} className={'fill-muted-foreground'}>
          Repeated across a passage, the pattern of picks becomes the signature
        </text>

        <g transform={'translate(24, 252)'}>
          {Array.from({ length: 14 }).map((_, index) => (
            <rect
              key={index}
              x={index * 30}
              y={0}
              width={22}
              height={12}
              rx={3}
              style={index % 3 === 1 ? { animationDelay: `${index * 110}ms` } : undefined}
              className={
                index % 3 === 1 ? 'fill-mark animate-chain' : 'fill-foreground/[0.09]'
              }
            />
          ))}
        </g>
      </g>
    </svg>
  );
}
