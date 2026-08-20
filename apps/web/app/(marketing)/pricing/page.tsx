import Link from 'next/link';

import { CheckIcon } from 'lucide-react';

import { PageHeader } from '../_components/prose';

export const metadata = {
  title: 'Pricing',
  description:
    'Scanning is free and unlimited. Credits buy sanitising: one credit per thousand words, and they never expire.',
};

/**
 * The pricing page, built 20 August 2026 against docs/03-pricing.md section 8
 * (what this page may and may not say) and 04 entries 63 to 67 and 71.
 *
 * THE NUMBERS ARE THE RATIFIED ONES: one credit buys 1,000 words of
 * sanitising, a file with no words is a flat credit, packs at $4.99, $9.99
 * and $24.99 for 10, 25 and 100. Free is unlimited scanning, three sanitises
 * before an account, two more credits on signup.
 *
 * CHECKOUT IS JON'S MORNING TASK. Until Stripe connects, every pack button
 * routes to sign-up, and one line under the grid says card checkout opens
 * today. Swap the hrefs when the checkout route exists; nothing else here
 * needs to change.
 *
 * WHAT THIS PAGE MUST NEVER SAY, per 03 section 8: any success rate or
 * score for layer B, any detection guarantee or refund-if-flagged, the words
 * undetectable, bypass or guaranteed, anything about PDFs, or that a
 * statistical watermark was removed.
 */
const PACKS = [
  {
    name: 'Starter',
    price: '$4.99',
    credits: 10,
    per: '50¢ per credit',
    blurb: 'A term paper, a portfolio piece, a batch of files.',
    featured: false,
  },
  {
    name: 'Plus',
    price: '$9.99',
    credits: 25,
    per: '40¢ per credit',
    blurb: 'A dissertation, a manuscript, a steady month.',
    featured: true,
  },
  {
    name: 'Pro',
    price: '$24.99',
    credits: 100,
    per: '25¢ per credit',
    blurb: 'Agencies, teams, and heavy writers.',
    featured: false,
  },
];

const INCLUDED = [
  'One credit sanitises 1,000 words',
  'A file with no words costs one flat credit',
  'Credits never expire',
  'A failed operation costs nothing',
  'Works on pasted text, Word documents, PNG and JPG',
];

function Pricing() {
  return (
    <div className={'flex flex-col'}>
      <PageHeader
        title={'Scanning is free. Forever.'}
        standfirst={
          'Scan anything, as often as you like, with no account. Credits buy the sanitising: one credit per thousand words, and they never expire.'
        }
      />

      <section className={'mx-auto w-full max-w-[1180px] px-5 py-16 sm:px-8'}>
        {/* The free tier first, because it is the honest headline. */}
        <div
          className={
            'border-border/70 flex flex-col gap-4 rounded-[16px] border p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7'
          }
        >
          <div>
            <h2
              className={
                'text-foreground text-[19px] font-semibold tracking-[-0.02em]'
              }
            >
              Free
            </h2>
            <p
              className={
                'text-muted-foreground mt-1 max-w-[52ch] text-[14px] leading-[1.6]'
              }
            >
              Unlimited scanning with no account. Three sanitises on us before
              you sign up, and two more credits the moment you do.
            </p>
          </div>
          <Link
            href={'/auth/sign-up'}
            className={
              'bg-foreground text-background shrink-0 rounded-[10px] px-4 py-2.5 text-center text-[13.5px] font-semibold transition-transform active:scale-[0.98]'
            }
          >
            Start free
          </Link>
        </div>

        {/* The packs. */}
        <div className={'mt-8 grid gap-4 sm:grid-cols-3'}>
          {PACKS.map((pack) => (
            <div
              key={pack.name}
              className={[
                'flex flex-col rounded-[16px] p-6',
                pack.featured
                  ? 'bg-foreground text-background'
                  : 'border-border/70 border',
              ].join(' ')}
            >
              <p
                className={[
                  'text-[13px] font-semibold tracking-[-0.01em]',
                  pack.featured ? 'text-background/70' : 'text-muted-foreground',
                ].join(' ')}
              >
                {pack.name}
              </p>
              <p
                className={
                  'mt-2 font-mono text-[34px] leading-none font-medium tracking-[-0.02em] tabular-nums'
                }
              >
                {pack.price}
              </p>
              <p
                className={[
                  'mt-2 text-[14px] font-semibold',
                  pack.featured ? 'text-background' : 'text-foreground',
                ].join(' ')}
              >
                {pack.credits} credits
                <span
                  className={[
                    'ml-2 text-[12px] font-medium',
                    pack.featured
                      ? 'text-background/60'
                      : 'text-muted-foreground',
                  ].join(' ')}
                >
                  {pack.per}
                </span>
              </p>
              <p
                className={[
                  'mt-2 text-[13px] leading-[1.55]',
                  pack.featured ? 'text-background/70' : 'text-muted-foreground',
                ].join(' ')}
              >
                {pack.blurb}
              </p>
              <Link
                href={'/auth/sign-up'}
                className={[
                  'mt-5 rounded-[10px] px-4 py-2.5 text-center text-[13.5px] font-semibold transition-transform active:scale-[0.98]',
                  pack.featured
                    ? 'bg-mark text-mark-foreground'
                    : 'bg-foreground text-background',
                ].join(' ')}
              >
                Get {pack.name}
              </Link>
            </div>
          ))}
        </div>

        <p className={'text-muted-foreground mt-4 text-[12.5px]'}>
          Card checkout opens today. Until it does, the buttons above create
          your free account so your credits are waiting.
        </p>

        {/* What every credit includes. */}
        <ul
          className={
            'border-border/70 mt-10 grid gap-x-8 gap-y-3 border-t pt-8 sm:grid-cols-2'
          }
        >
          {INCLUDED.map((line) => (
            <li
              key={line}
              className={
                'text-foreground/85 flex items-start gap-2.5 text-[14px] leading-[1.5]'
              }
            >
              <CheckIcon
                className={'text-mark-strong mt-[3px] size-[15px] shrink-0'}
                strokeWidth={2.4}
                aria-hidden
              />
              {line}
            </li>
          ))}
        </ul>

        {/* The sentence 03-pricing.md says carries the most weight. */}
        <p
          className={
            'text-muted-foreground mt-10 max-w-[62ch] text-[14px] leading-[1.65]'
          }
        >
          Two of the three checks are provable, and we show you the proof. The
          third is best effort and we say so.{' '}
          <Link
            href={'/capabilities'}
            className={
              'text-foreground underline decoration-1 underline-offset-2'
            }
          >
            Exactly what we can and cannot do.
          </Link>
        </p>
      </section>
    </div>
  );
}

export default Pricing;
