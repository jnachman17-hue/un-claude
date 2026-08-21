import Link from 'next/link';

import { ArrowRightIcon } from 'lucide-react';

/**
 * The closing band on the reading pages, added 20 August 2026.
 *
 * Both /how-it-works and /capabilities previously ended in prose with no route
 * back to the tool, which broke the conversion ladder at its first rung: the
 * free scan. This band is that route. The primary action always points at the
 * tool on the home page; the secondary link lets the two sibling pages point
 * at each other.
 */
export function CtaBand({
  heading,
  sub,
  secondary,
}: {
  heading: string;
  sub: string;
  secondary?: { href: string; label: string };
}) {
  return (
    <section>
      <div
        className={
          'mx-auto flex max-w-[1180px] flex-col items-start gap-6 px-5 py-11 sm:px-8 sm:py-16 lg:flex-row lg:items-center lg:justify-between lg:py-20'
        }
      >
        <div>
          <h2
            className={
              'text-foreground text-[24px] leading-[1.15] font-semibold tracking-[-0.024em] text-balance sm:text-[28px]'
            }
          >
            {heading}
          </h2>
          <p className={'text-muted-foreground mt-2 max-w-[46ch] text-[15px] leading-[1.6]'}>
            {sub}
          </p>
        </div>

        <div className={'flex flex-wrap items-center gap-2.5'}>
          <Link
            href={'/'}
            className={
              'bg-foreground text-background rounded-[10px] px-4 py-2.5 text-[13.5px] font-semibold transition-transform active:scale-[0.98]'
            }
          >
            Run a free scan
          </Link>

          {secondary ? (
            <Link
              href={secondary.href}
              className={
                'text-foreground hover:bg-foreground/[0.045] inline-flex items-center gap-1.5 rounded-[10px] px-3 py-2.5 text-[13.5px] font-semibold transition-colors'
              }
            >
              {secondary.label}
              <ArrowRightIcon className={'size-[14px]'} strokeWidth={2.2} aria-hidden />
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
