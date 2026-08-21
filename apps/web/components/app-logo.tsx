import Link from 'next/link';

import { cn } from '@kit/ui/utils';

/**
 * The Un-Claude logo. REPLACED 20 August 2026, `04` entry 87.
 *
 * The drifting-bar U from the night before was rejected on sight. A
 * structured elimination in an isolated /prototypes/logo route (five
 * directions, then a colour riff on the winner) picked this one: no icon.
 * "Un" carries the accent colour, "Claude" carries a single strike-through
 * in that same colour, like a proofreader's deletion mark applied to the
 * borrowed name. This early in the brand's life, reading the name matters
 * more than recognising a symbol, so the wordmark is the entire mark.
 *
 * Ported verbatim from the winning prototype,
 * `app/prototypes/logo/variants/wordmark-only.tsx`, which is deleted once
 * this lands per the `prototype` skill's own rule against leaving
 * exploration surfaces behind. The `size` prop is new: 'default' is the
 * 17px header treatment this file always had, 'large' is for hero or
 * OG-scale use.
 */
function LogoImage({
  className,
  size = 'default',
}: {
  className?: string;
  size?: 'default' | 'large';
}) {
  return (
    <span
      className={cn(
        'text-foreground inline-flex items-baseline whitespace-nowrap select-none',
        size === 'large'
          ? 'text-[40px] font-semibold tracking-[-0.03em]'
          : 'text-[17px] font-semibold tracking-[-0.03em]',
        className,
      )}
    >
      <span className={'text-mark-strong'}>Un</span>
      {/* The dash needs air on both sides. Flush, the strike-through's left
          edge butts straight into the hyphen and the two read as one broken
          orange rule rather than as a dash and a deletion mark. Jon caught
          this on the shipped version; `04` entry 98. In em, so it holds at
          every size the wordmark is set at. */}
      <span className={'mx-[0.14em]'}>-</span>
      <span className={'relative inline-block'}>
        Claude
        {/* Matched to the dash's own rendered stroke, not eyeballed: Geist
            Semibold's hyphen is 2px thick at the 17px header size and
            4.375px at the 40px hero size (measured by rendering the exact
            font/weight to a canvas and counting ink pixels). A thinner
            strike read as a different, weaker mark next to the dash rather
            than the same idea in two places. `04` entry 98. */}
        <span
          aria-hidden
          className={cn(
            'bg-mark-strong absolute inset-x-0 top-[52%] -translate-y-1/2',
            size === 'large' ? 'h-[4.375px]' : 'h-[2px]',
          )}
        />
      </span>
    </span>
  );
}

export function AppLogo({
  href,
  label,
  className,
  size,
}: {
  href?: string | null;
  className?: string;
  label?: string;
  size?: 'default' | 'large';
}) {
  if (href === null) {
    return <LogoImage className={className} size={size} />;
  }

  return (
    <Link aria-label={label ?? 'Home Page'} href={href ?? '/'}>
      <LogoImage className={className} size={size} />
    </Link>
  );
}
