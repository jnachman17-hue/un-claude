'use client';

import Link from 'next/link';

import { ArrowRightIcon, UserPlusIcon, XIcon } from 'lucide-react';

import { PACKS } from '../../pricing/_components/pricing-data';
import { SIGNUP_CREDITS } from './credits';
import { CreditCoin } from './credit-chip';

/**
 * THE CHEAPEST PACK, READ FROM THE PRICING DATA AND NEVER RETYPED.
 *
 * `pricing-data.ts` is where a price lives. Writing "$4.99" into this file
 * would be a second implementation of one number, which is the trap this
 * project has walked into three times: the day a pack changes, the pricing
 * page and this panel would disagree, and only one of them would be right.
 */
const CHEAPEST = PACKS.reduce((low, pack) => (pack.price < low.price ? pack : low));

/**
 * THE OFFER, IN ONE PLACE. Added 21 August 2026, session 10.
 *
 * The signup grant is now made in two places: on the paywall, when somebody
 * has walked into the wall, and on the panel, the moment the balance reaches
 * nought without anybody walking into anything. Those two must say the same
 * thing in the same shape, so they share this file rather than each
 * inventing a sentence. `.claude/skills/unclaude-messaging/SKILL.md`, test 2:
 * one grammar per repeated element.
 *
 * Jon's brief for the badge: "animate the 3 more credits in that message so
 * it pops out and you see it more and calls your attention, use color or
 * font or bold or underline or however, because no one actually reads."
 *
 * So the number is not a word inside a sentence any more. It is its own
 * object, in the accent colour, at more than twice the body size, with the
 * coin the visitor has already learned attached to it. It lands with a
 * bounce and a light passes over it three times. Reduced motion collapses
 * both, globally, in `styles/globals.css`.
 */
export function CreditOfferBadge({
  animate = true,
  className,
}: {
  animate?: boolean;
  className?: string;
}) {
  return (
    <span
      className={[
        'bg-mark/[0.14] ring-mark/40 relative inline-flex items-center gap-2 overflow-hidden rounded-full py-1.5 pr-4 pl-2.5 ring-1',
        animate ? 'animate-offer-pop' : '',
        className ?? '',
      ].join(' ')}
    >
      {/* The light that passes over it. Purely decorative, and it takes no
          clicks, so the whole badge stays part of the link around it. */}
      {animate ? (
        <span
          className={
            'animate-sheen pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/55 to-transparent dark:via-white/20'
          }
          aria-hidden
        />
      ) : null}

      <CreditCoin className={'size-[20px] shrink-0'} />

      <span className={'text-foreground text-[19px] font-bold tabular-nums'}>
        {SIGNUP_CREDITS}
      </span>

      <span
        className={
          'text-foreground/85 text-[13px] leading-tight font-semibold'
        }
      >
        free credits
      </span>
    </span>
  );
}

/**
 * "3 more" as an object rather than as two words. Jon's brief for the motion,
 * 21 August 2026: "animate the 3 more credits in that message so it pops out
 * and you see it more and calls your attention, use color or font or bold or
 * underline or however, because no one actually reads."
 *
 * The coin the visitor has already learned, the figure at nearly twice the
 * surrounding size, in the accent colour, on its own ground. It lands with a
 * bounce and a light crosses it three times, then stops. The global
 * prefers-reduced-motion rule in styles/globals.css collapses both.
 */
function OfferFigure({ animate = true }: { animate?: boolean }) {
  /*
   * NO BOX, NO OUTLINE. Jon's instruction, 25 August 2026, six-ui-fixes
   * brief fix 1: "remove the box and its outline entirely. Keep the credit
   * coin symbol and the words."
   *
   * WHY THIS ONE AND NOT THE OTHER TWO IN THIS FILE, because the brief quotes
   * a different element's class string than the text it complains about. His
   * complaint is that the pill "is vertically off balance AGAINST THE TEXT
   * BESIDE IT", and this is the only pill that sits inline inside a sentence:
   * "Sign up to receive [3 more] free credits". `CreditOfferBadge` and the
   * "0 credits" readout below are standalone blocks with no text beside them,
   * so the complaint cannot describe them and they are left alone.
   *
   * THE VERTICAL BALANCE WAS THE REAL FAULT AND THE BOX WAS HIDING IT. The
   * old version carried BOTH `align-baseline` and `translate-y-[1px]`, which
   * is two alignment mechanisms disagreeing: baseline-aligning a flex box
   * whose contents are centred, then nudging it back by a pixel to
   * compensate. It cannot come out right at every font size, and the pill's
   * outline made the error visible as a tilt. `align-middle` centres the
   * whole object on the surrounding text's midline in one instruction, and
   * with no outline there is no edge to read a tilt against.
   *
   * THE SHEEN CAME OFF WITH THE BOX, and this was a judgment the brief asked
   * for. `animate-sheen` is a white gradient swept across the element and
   * clipped by `overflow-hidden` on a rounded background. With no background
   * it has nothing to travel over: on the page it is either invisible or, at
   * dark-mode contrast, a smear passing across live text, which reads as a
   * rendering fault rather than as emphasis.
   *
   * `animate-offer-pop` STAYS. That is the bounce Jon actually asked for in
   * the first place ("so it pops out and you see it more and calls your
   * attention"), it acts on the object rather than on a surface behind it,
   * and it survives the box being removed. The accent colour, the size step
   * and the coin carry the rest of the emphasis. Reduced motion still
   * collapses it globally via styles/globals.css.
   */
  return (
    <span
      className={[
        'mx-0.5 inline-flex items-center gap-1 align-middle',
        animate ? 'animate-offer-pop' : '',
      ].join(' ')}
    >
      <CreditCoin className={'size-[15px] shrink-0'} />
      <span className={'text-foreground text-[17px] leading-none font-extrabold tabular-nums'}>
        {SIGNUP_CREDITS}
      </span>
      <span className={'text-foreground/85 text-[13px] leading-none font-semibold'}>
        more
      </span>
    </span>
  );
}

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
 * Two audiences, one shape. A guest is offered the account grant, because
 * that is the next free thing and asking a stranger for money before they
 * have taken the free rung is the wrong order. An account holder has already
 * taken it, so they are offered the packs.
 */
export function OutOfCredits({
  isGuest,
  justRanOut,
  onSignUpClick,
  onBuyClick,
}: {
  isGuest: boolean;
  /** True when the balance hit nought during this visit, rather than before it. */
  justRanOut: boolean;
  onSignUpClick?: () => void;
  /** They took the paid road rather than the free one. Entry 159. */
  onBuyClick?: () => void;
}) {
  if (isGuest) {
    return (
      <div className={justRanOut ? 'animate-rise' : ''}>
        <Link
        href={'/auth/sign-up'}
        onClick={onSignUpClick}
        className={
          'border-mark/30 bg-mark/[0.055] hover:bg-mark/[0.085] group flex items-center gap-3 rounded-[13px] border p-3 transition-colors sm:gap-4 sm:p-3.5'
        }
      >
        <span
          className={
            'bg-mark text-mark-foreground grid size-[34px] shrink-0 place-items-center rounded-full'
          }
        >
          <UserPlusIcon className={'size-[17px]'} strokeWidth={2.1} aria-hidden />
        </span>

        {/*
          ONE LINE, AND THE NUMBER IS AN OBJECT INSIDE IT. Jon, 21 August
          2026: "Make it say Sign up to receive 3 more free credits instead of
          these are yours with a free account. Remove all of the text below
          about your 2 free credits are spent and scanning is free."

          So the second line is gone and the offer is the whole message. The
          badge that used to sit to the left of it is gone too, because with
          the sentence carrying the words "3 more free credits" a badge
          reading "3 free credits" beside it said the same thing twice. The
          motion Jon asked for in the same round has not been dropped: it has
          moved onto the figure inside the sentence, which is what he asked
          for in the first place ("animate the 3 more credits in that message
          so it pops out").
        */}
        <span
          className={
            'text-foreground min-w-0 flex-1 text-[13.5px] leading-tight font-semibold'
          }
        >
          Sign up to receive <OfferFigure animate={justRanOut} /> free credits
        </span>

        <span
          className={
            'bg-mark text-mark-foreground group-hover:bg-mark-strong hidden shrink-0 rounded-[9px] px-3.5 py-2 text-[12.5px] font-semibold transition-colors sm:inline-block'
          }
        >
          Claim them
        </span>
        </Link>

        {/*
          THE SECOND ROAD, AND IT IS THE WHOLE OF JON'S OVERRIDE OF 4 SEPTEMBER
          2026. Measured that day: of 85 people who reached nought in thirty
          days, 74 were guests, and a guest was shown ONLY the free offer. So
          87% of every sales moment in this product could not produce a sale,
          by design. `04` entry 97 point 5 and this file's own rule that
          nothing at this rung says "buy" are overridden by entry 159.

          IT IS DELIBERATELY THE QUIETER OF THE TWO. The free grant is still
          the better deal for almost everybody, and it is still the first
          thing read. This exists so that somebody who wants more than three
          credits has somewhere to go other than away.

          THE PRICE IS ON IT RATHER THAN BEHIND IT. A button reading "buy
          credits" asks a visitor to navigate to find out whether they can
          afford it. The number costs nothing to show and answers that before
          the click.

          The line above it is untouched. Jon removed the "your free credits
          are spent" text on 21 August and it stays removed: this adds a road,
          not an explanation.
        */}
        <Link
          href={'/pricing'}
          onClick={onBuyClick}
          className={
            'border-border/70 text-muted-foreground hover:text-foreground hover:bg-foreground/[0.03] group/buy mt-2 flex items-center gap-2 rounded-[10px] border border-dashed px-3 py-2 text-[12.5px] transition-colors'
          }
        >
          <span className={'min-w-0 flex-1'}>
            Need more? Packs start at{' '}
            <span className={'text-foreground font-semibold'}>
              ${CHEAPEST.price} for {CHEAPEST.credits} credits
            </span>
            .
          </span>
          <span
            className={
              'text-foreground inline-flex shrink-0 items-center gap-1 font-semibold'
            }
          >
            Buy credits
            <ArrowRightIcon
              className={
                'size-[13px] transition-transform group-hover/buy:translate-x-0.5'
              }
              strokeWidth={2.4}
              aria-hidden
            />
          </span>
        </Link>
      </div>
    );
  }

  return (
    <Link
      href={'/pricing'}
      className={[
        'border-mark/30 bg-mark/[0.055] hover:bg-mark/[0.085] group flex items-center gap-3 rounded-[13px] border p-3 transition-colors sm:gap-4 sm:p-3.5',
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
          Scanning stays free. Sanitising needs credits, and they never expire.
        </span>
      </span>

      <span
        className={
          'bg-mark text-mark-foreground group-hover:bg-mark-strong hidden shrink-0 rounded-[9px] px-3.5 py-2 text-[12.5px] font-semibold transition-colors sm:inline-block'
        }
      >
        Get credits
      </span>
    </Link>
  );
}

/**
 * THE ARRIVAL, CONFIRMED. Added 21 August 2026, session 10, as the other
 * half of sending sign-up back to the tool instead of the wallet.
 *
 * Jon's instruction was "send them back to the tool, with the new balance
 * visible so the 3 credits register". The balance chip on the panel does the
 * first part on its own, but a number that was already on screen before they
 * left does not read as news when they come back. This says it once, in
 * words, beside the chip it is talking about, and then gets out of the way.
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
