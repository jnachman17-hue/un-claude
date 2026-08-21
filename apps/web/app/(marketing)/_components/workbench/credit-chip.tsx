'use client';

/**
 * The credit token, made visible. 04 entry 98.
 *
 * Jon's note, after the balance shipped as grey 11px text in a corner:
 * "way too small... we need to tokenize and almost gamify credits. They need
 * to show there... more gamified symbol."
 *
 * So a credit gets a face: a struck coin in the product's own orange, with
 * the count beside it at a size that reads across the room. The same coin
 * appears wherever a credit is mentioned, which is what makes it a currency
 * rather than a word: on the balance, on the price of the job in hand, and
 * on the file card. A visitor learns the symbol once and then recognises it
 * everywhere without reading anything.
 */

/**
 * The coin. Drawn rather than borrowed from an icon set.
 *
 * RESTYLED 21 August 2026, session 10, on Jon's note that the first version
 * "reads as stale" beside the ratified icon mark. It carried a thin inner
 * ring and a drawn "U", which at the 13px and 16px it actually ships at
 * turned into a target or a clock, and shared no device at all with the
 * Tile in `app/icon.svg` (04 entries 99 and 100).
 *
 * It now carries the Tile's one idea: knock a white round-capped diagonal
 * out of the accent colour. Same angle, same proportional stroke weight
 * (12.5% of the shape, matching the Tile's 3 in 24), same cut length as a
 * fraction of the shape. Round rather than square, so a coin still reads as
 * currency next to a number, but unmistakably the same family as the mark.
 */
export function CreditCoin({ className }: { className?: string }) {
  return (
    <svg
      viewBox={'0 0 20 20'}
      className={className}
      aria-hidden
      focusable={'false'}
    >
      <circle cx={10} cy={10} r={9} className={'fill-mark-strong'} />
      <path
        d={'M7.1 12.9 L12.9 7.1'}
        className={'fill-none stroke-mark-foreground'}
        strokeWidth={2.7}
        strokeLinecap={'round'}
      />
    </svg>
  );
}

/**
 * The balance, as a token count. `size` picks the two places it appears:
 * `lg` on the panel header where it is the visitor's running score, `sm`
 * inline anywhere a number needs its unit attached.
 *
 * `tone` has a third value since 21 August 2026: `empty`, for a balance of
 * nought. A zero in the same quiet neutral as every other number is the
 * exact thing Jon reported as a dead end, so it now reads as a state that
 * wants something done about it.
 */
export function CreditChip({
  amount,
  label,
  size = 'sm',
  tone = 'neutral',
}: {
  amount: number;
  label?: string;
  size?: 'sm' | 'lg';
  tone?: 'neutral' | 'spend' | 'empty';
}) {
  const large = size === 'lg';

  return (
    <span
      className={[
        'inline-flex items-center rounded-full font-semibold tabular-nums',
        large
          ? 'gap-1.5 px-2.5 py-1 text-[14px]'
          : 'gap-1 px-2 py-[3px] text-[12px]',
        tone === 'empty'
          ? 'bg-mark/[0.16] text-foreground ring-mark/35 ring-1'
          : tone === 'spend'
            ? 'bg-mark/[0.18] text-foreground'
            : 'bg-mark/[0.12] text-foreground',
      ].join(' ')}
    >
      <CreditCoin
        className={[
          large ? 'size-[16px]' : 'size-[13px]',
          tone === 'empty' ? 'opacity-40 saturate-0' : '',
        ].join(' ')}
      />
      {amount}
      {label ? (
        <span className={'text-muted-foreground font-medium'}>{label}</span>
      ) : null}
    </span>
  );
}
