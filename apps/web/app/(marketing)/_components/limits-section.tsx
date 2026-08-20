import Link from 'next/link';

import { ArrowRightIcon } from 'lucide-react';

/**
 * What we can prove, and what nobody can.
 *
 * This section is not a compliance chore. It is what makes a confident headline
 * defensible: a punchy claim above a page that states precisely what the tool
 * does and does not do is a much stronger position than the claim alone.
 *
 * Everything here is from ENGINE.md section 9, which separates what was measured
 * from what was not.
 */
const ROWS = [
  {
    claim: 'Hidden characters',
    provable: true,
    body: 'Countable. We name every character found, give its exact position, remove it, and read the text back afterwards to confirm none are left.',
  },
  {
    claim: 'Metadata',
    provable: true,
    body: 'Verified against the raw bytes. The record is present before and absent after, and the picture or document itself comes out byte for byte identical.',
  },
  {
    claim: 'Statistical watermark',
    provable: false,
    body: 'Best effort, and we will not pretend otherwise. No public detector exists for any vendor’s text watermark, so removal cannot be confirmed by us or by anyone else. What we can show is exactly what the rewrite changed.',
  },
];

export function LimitsSection() {
  return (
    <section className={'border-border/70 border-t'}>
      <div className={'mx-auto max-w-[1180px] px-5 py-20 sm:px-8'}>
        <div className={'grid gap-10 lg:grid-cols-12 lg:gap-14'}>
          <div className={'lg:col-span-4'}>
            <h2
              className={
                'text-foreground text-[28px] leading-[1.1] font-semibold tracking-[-0.028em] text-balance sm:text-[34px]'
              }
            >
              Two of these we can prove. One we cannot.
            </h2>
            <p className={'text-muted-foreground mt-4 max-w-[40ch] text-[15px] leading-[1.6]'}>
              Every tool in this category makes claims nobody can currently check.
              We would rather tell you which of ours are which, and show you the
              working.
            </p>

            <Link
              href={'/capabilities'}
              className={
                'text-foreground hover:bg-foreground/[0.045] mt-5 inline-flex items-center gap-1.5 rounded-[9px] px-3 py-2 text-[13.5px] font-semibold transition-colors'
              }
            >
              Exactly what we can and cannot do
              <ArrowRightIcon className={'size-[14px]'} strokeWidth={2.2} aria-hidden />
            </Link>
          </div>

          <ul className={'divide-border/70 divide-y lg:col-span-8'}>
            {ROWS.map((row) => (
              <li key={row.claim} className={'py-5 first:pt-0 last:pb-0'}>
                <div className={'flex flex-wrap items-baseline gap-x-3 gap-y-1'}>
                  <h3 className={'text-foreground text-[15px] font-semibold tracking-[-0.015em]'}>
                    {row.claim}
                  </h3>
                  <span
                    className={[
                      'rounded-full px-2 py-[2px] text-[10.5px] font-semibold tracking-wide uppercase',
                      row.provable
                        ? 'bg-emerald-600/12 text-emerald-700'
                        : 'bg-amber-500/15 text-amber-700',
                    ].join(' ')}
                  >
                    {row.provable ? 'Provable' : 'Best effort'}
                  </span>
                </div>
                <p className={'text-muted-foreground mt-1.5 max-w-[62ch] text-[13.5px] leading-[1.6]'}>
                  {row.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
