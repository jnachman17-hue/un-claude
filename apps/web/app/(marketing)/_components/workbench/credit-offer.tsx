'use client';

import Link from 'next/link';

import { ArrowRightIcon, XIcon } from 'lucide-react';

import { CHEAPEST_PACK } from '../../pricing/_components/pricing-data';
import { CreditCoin } from './credit-chip';

/**
 * THE MOMENT AT NOUGHT, IN ONE PLACE.
 *
 * This file used to hold three things: a badge reading "3 free credits" that
 * followed a visitor onto the sign-up page, an animated "3 more" figure for
 * the sentence "Sign up to receive 3 more free credits", and two versions of
 * the panel below, one for guests offering the free grant and one for account
 * holders offering the packs. All of the first two and half of the third came
 * off on 21 September 2026, 04 entries 165 and 166: the signup grant no
 * longer exists, so there is nothing free to offer anyone at nought, and one
 * panel says the same thing to everybody.
 *
 * WHY THE PRICE IS ON THE PANEL. Entry 159: a button reading "Get credits"
 * asks a visitor to navigate to find out whether they can afford it, and the
 * number costs nothing to show. It is read from `pricing-data.ts` and never
 * retyped here, because the day a pack changes only one file may be right.
 */

/**
 * THE DEAD END, ANSWERED BEFORE IT IS REACHED. Jon, 21 August 2026:
 *
 *   "after you complete 2 scans and use your 2 free credits it just says
 *   0 left... you only know this exists if you try again and click scan and
 *   then get the locked message. Most people will see 2 free scans, then
 *   give up because they see their token at zero and not even try again."
 *
 * This is that fix. It is shown by the balance reaching nought, not by an
 * attempt failing, so nobody has to press a button that will not work to
 * find out what happens next. It appears on arrival too, for the visitor who
 * comes back tomorrow to a balance that was already spent.
 *
 * ONE AUDIENCE NOW. A guest and an account holder at nought are shown the
 * same panel and the same price. The guest creates the account at checkout,
 * which is the only reason an account exists (entry 165). The heading has to
 * be true for both, which rules out "your free credits are used up": a buyer
 * who spent a pack to nothing sees this too.
 */
export function OutOfCredits({
  justRanOut,
  onBuyClick,
}: {
  /** True when the balance hit nought during this visit, rather than before it. */
  justRanOut: boolean;
  onBuyClick?: () => void;
}) {
  return (
    <Link
      href={'/pricing'}
      onClick={onBuyClick}
      className={[
        'border-mark/30 bg-mark/[0.055] hover:bg-mark/[0.085] group flex flex-wrap items-center gap-3 rounded-[13px] border p-3 transition-colors sm:flex-nowrap sm:gap-4 sm:p-3.5',
        justRanOut ? 'animate-rise' : '',
      ].join(' ')}
    >
      <span
        className={[
          'bg-mark/[0.14] ring-mark/40 relative inline-flex shrink-0 items-center gap-2 overflow-hidden rounded-full py-1.5 pr-4 pl-2.5 ring-1',
          justRanOut ? 'animate-offer-pop' : '',
        ].join(' ')}
      >
        <CreditCoin className={'size-[20px] shrink-0 opacity-40 saturate-0'} />
        <span className={'text-foreground text-[19px] font-bold tabular-nums'}>
          0
        </span>
        <span className={'text-foreground/85 text-[13px] font-semibold'}>
          credits
        </span>
      </span>

      <span className={'min-w-0 flex-1'}>
        <span
          className={
            'text-foreground block text-[13.5px] leading-tight font-semibold'
          }
        >
          Your balance is empty
        </span>
        <span
          className={
            'text-muted-foreground mt-0.5 block text-[12.5px] leading-snug'
          }
        >
          Packs start at{' '}
          <span className={'text-foreground font-semibold'}>
            ${CHEAPEST_PACK.price} for {CHEAPEST_PACK.credits} credits
          </span>
          , and they never expire. Scanning stays free.
        </span>
      </span>

      {/*
        VISIBLE ON A PHONE. The two panels this replaced hid their button
        below the `sm` breakpoint and relied on the whole card being the
        link, which left the only sales moment in the product with no visible
        call to action on the device most visitors hold. On a phone it takes
        the full width under the text; from `sm` up it sits on the right.
      */}
      <span
        className={
          'bg-mark text-mark-foreground group-hover:bg-mark-strong inline-flex w-full shrink-0 items-center justify-center gap-1 rounded-[9px] px-3.5 py-2 text-[12.5px] font-semibold transition-colors sm:w-auto'
        }
      >
        Get credits
        <ArrowRightIcon
          className={'size-[13px] transition-transform group-hover:translate-x-0.5'}
          strokeWidth={2.4}
          aria-hidden
        />
      </span>
    </Link>
  );
}

/**
 * THE ARRIVAL, CONFIRMED. Added 21 August 2026, session 10, as the other
 * half of sending sign-up back to the tool instead of the wallet.
 *
 * Jon's instruction was "send them back to the tool, with the new balance
 * visible so the 3 credits register". The 3 is history since 04 entry 166,
 * but the panel is not: it renders for any balance above nought, which now
 * means a cold signup's welcome credits or a guest remainder that came
 * across. The balance chip on the panel shows the number on its own, but a
 * number that was already on screen before they left does not read as news
 * when they come back. This says it once, in words, beside the chip it is
 * talking about, and then gets out of the way.
 *
 * Deliberately worded for both arrivals: somebody who has just created an
 * account, and somebody who has just signed back into one. We do not know
 * which from here, and the sentence does not need to.
 */
export function SignedInWelcome({
  balance,
  onDismiss,
}: {
  balance: number;
  onDismiss: () => void;
}) {
  return (
    <div
      className={
        'border-mark/30 bg-mark/[0.055] animate-rise flex items-center gap-3 rounded-[13px] border p-3 sm:gap-4 sm:p-3.5'
      }
    >
      <span
        className={
          'bg-mark/[0.14] ring-mark/40 animate-offer-pop relative inline-flex shrink-0 items-center gap-2 overflow-hidden rounded-full py-1.5 pr-4 pl-2.5 ring-1'
        }
      >
        <span
          className={
            'animate-sheen pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/55 to-transparent dark:via-white/20'
          }
          aria-hidden
        />
        <CreditCoin className={'size-[20px] shrink-0'} />
        <span className={'text-foreground text-[19px] font-bold tabular-nums'}>
          {balance}
        </span>
        <span className={'text-foreground/85 text-[13px] font-semibold'}>
          {balance === 1 ? 'credit' : 'credits'}
        </span>
      </span>

      <span className={'min-w-0 flex-1'}>
        <span
          className={
            'text-foreground block text-[13.5px] leading-tight font-semibold'
          }
        >
          Your credits are ready
        </span>
        <span
          className={
            'text-muted-foreground mt-0.5 block text-[12.5px] leading-snug'
          }
        >
          They never expire. Paste something in and sanitise it.
        </span>
      </span>

      <button
        type={'button'}
        onClick={onDismiss}
        aria-label={'Dismiss'}
        className={
          'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] shrink-0 rounded-full p-1.5 transition-colors'
        }
      >
        <XIcon className={'size-[15px]'} strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}
