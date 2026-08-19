import Link from 'next/link';

import { cn } from '@kit/ui/utils';

/**
 * The wordmark.
 *
 * Typographic rather than drawn, set in the site's own face so it stays sharp at
 * any size, inherits the theme, and needs no asset. The bar in front of the name
 * is the same marker the tool draws over a hidden character, which makes the
 * identity come from the product rather than from decoration.
 */
function LogoImage({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'text-foreground inline-flex items-center gap-[7px] text-[17px] font-semibold tracking-[-0.03em] select-none',
        className,
      )}
    >
      <span
        aria-hidden
        className={'bg-mark-strong h-[15px] w-[3px] rounded-[1px]'}
      />
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
