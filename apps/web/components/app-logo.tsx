import Link from 'next/link';

import { cn } from '@kit/ui/utils';

/**
 * The Un-Claude logo, drawn 20 August 2026 at Jon's instruction.
 *
 * THE CONCEPT: the U is missing the top of its right stem, and the missing
 * piece is the orange bar, drifted up and away, tilted. That bar is the same
 * marker the tool draws over a hidden character in a scan, so the glyph is
 * the product's whole story in one shape: the mark, removed from the word,
 * leaving. Nothing in it resembles Anthropic's starburst or Claude's
 * hand-drawn asterisk, deliberately.
 *
 * Drawn inline so the U inherits the theme through currentColor and stays
 * sharp at any size. The favicon at app/icon.svg is the same glyph with
 * fixed colors and a prefers-color-scheme swap.
 */
function LogoImage({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'text-foreground inline-flex items-center gap-[8px] text-[17px] font-semibold tracking-[-0.03em] whitespace-nowrap select-none',
        className,
      )}
    >
      <svg
        aria-hidden
        viewBox={'0 0 26 26'}
        className={'h-[20px] w-[20px]'}
      >
      <path
        d={'M5 4.5 V13 a8 8 0 0 0 16 0 V10.5'}
        fill={'none'}
        stroke={'currentColor'}
        strokeWidth={3.2}
        strokeLinecap={'round'}
      />
      <rect
        x={19.4}
        y={0.6}
        width={3.2}
        height={7}
        rx={1.6}
        transform={'rotate(18 21 4.1)'}
        className={'fill-mark-strong'}
      />
      </svg>
      Un-Claude
    </span>
  );
}

export function AppLogo({
  href,
  label,
  className,
}: {
  href?: string | null;
  className?: string;
  label?: string;
}) {
  if (href === null) {
    return <LogoImage className={className} />;
  }

  return (
    <Link aria-label={label ?? 'Home Page'} href={href ?? '/'}>
      <LogoImage className={className} />
    </Link>
  );
}
