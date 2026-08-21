/**
 * How a hidden character sits in a sentence.
 *
 * The point the picture has to make: the character occupies a position in the
 * text and is drawn as nothing at all. A list of codepoints cannot say that. A
 * row of letter cells with one occupied-but-empty cell in it can.
 *
 * TRIMMED 20 August 2026: the two moral lines at the bottom duplicated the
 * panel caption underneath the drawing, so they came out and the viewBox
 * tightened around what is left.
 */
export function HiddenCharactersDiagram({ className }: { className?: string }) {
  const letters = ['t', 'h', 'e', ' ', 'r', 'e', 'p', 'o', 'r', 't'];
  const gapAfter = 3;

  return (
    <svg
      viewBox={'0 0 460 156'}
      className={className}
      role={'img'}
      aria-label={
        'A row of letters spelling the report, with one cell between them holding an invisible character'
      }
    >
      <g fontFamily={'var(--font-mono), monospace'}>
        <text
          x={24}
          y={30}
          fontSize={11}
          fontFamily={'var(--font-sans), sans-serif'}
          className={'fill-muted-foreground'}
        >
          What you see on the page
        </text>

        {letters.map((letter, index) => {
          const slot = index > gapAfter ? index + 1 : index;
          const x = 24 + slot * 34;
          return (
            <g key={index}>
              <rect
                x={x}
                y={44}
                width={30}
                height={44}
                rx={6}
                className={'fill-foreground/[0.045]'}
              />
              <text
                x={x + 15}
                y={73}
                textAnchor={'middle'}
                fontSize={17}
                className={'fill-foreground'}
              >
                {letter === ' ' ? '' : letter}
              </text>
            </g>
          );
        })}

        {/* The cell that holds something and shows nothing. */}
        <rect
          x={24 + (gapAfter + 1) * 34}
          y={44}
          width={30}
          height={44}
          rx={6}
          className={'fill-mark'}
        />
        <rect
          x={24 + (gapAfter + 1) * 34 + 14}
          y={52}
          width={2}
          height={28}
          rx={1}
          className={'fill-mark-foreground/70'}
        />

        <path
          d={`M ${24 + (gapAfter + 1) * 34 + 15} 96 L ${24 + (gapAfter + 1) * 34 + 15} 122 L 300 122`}
          className={'stroke-foreground/25'}
          strokeWidth={1.25}
          fill={'none'}
        />

        <text x={306} y={118} fontSize={12.5} className={'fill-foreground font-medium'}>
          U+200B
        </text>
        <text
          x={306}
          y={135}
          fontSize={11.5}
          fontFamily={'var(--font-sans), sans-serif'}
          className={'fill-muted-foreground'}
        >
          Zero width space
        </text>
      </g>
    </svg>
  );
}
