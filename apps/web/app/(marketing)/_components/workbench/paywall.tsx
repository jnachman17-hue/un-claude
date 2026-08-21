'use client';

import Link from 'next/link';

import { LockIcon } from 'lucide-react';

import { paywallDismissed, paywallSignUpClicked } from '~/lib/analytics/events';

import { CreditOfferBadge } from './credit-offer';

/**
 * What a visitor sees when the work cannot run. 04 entry 97.
 *
 * Jon's design survives from the first version: the scan still shows in
 * full, unblurred, always. It costs nothing to run, and telling somebody
 * exactly what is wrong with their text before asking for anything converts
 * far harder than hiding both halves. The blur below is a locked state, not
 * a hidden answer: no rewrite is run to produce this screen.
 *
 * TWO VARIANTS NOW, because the ladder has two rungs and they ask for
 * different things:
 *
 *   `account`  a guest hit the wall: the rewrite needs an account, or their
 *              welcome credits are spent. The ask is an email, and the offer
 *              is the signup grant. Nothing here says "buy".
 *   `buy`      a signed-in account cannot afford this job. The ask is a
 *              purchase, and the message carries the exact numbers, because
 *              "this needs 3 and you have 2" reads as arithmetic where
 *              "insufficient credits" reads as a wall.
 *
 * "Get credits" and "Create a free account" ARE `Link`s AND MUST STAY SO. A
 * plain anchor reloads the page, and PostHog's in-memory visitor id dies
 * with it: the most important conversion step in the product would arrive at
 * sign-up as a stranger. Measured, not guessed. 06 row 67.
 *
 * THREE CHANGES 21 August 2026, session 10, all Jon's:
 *
 *   1a  The lock was touching the top edge of the box. The overlay is
 *       centred over a fixed-height blur, and the content column had grown
 *       taller than the blur behind it, so centring pushed the top of the
 *       column off the top of the box. The blur now carries a floor and the
 *       overlay has its own vertical padding, so the lock cannot reach the
 *       edge at any width.
 *   1b  The signup grant is now a badge rather than a clause. See
 *       `credit-offer.tsx` for the reasoning and the motion.
 *   1c  "Anything left here follows you" is gone, on Jon's instruction. It
 *       was true (the guest merge in /api/credits does exactly that) but he
 *       does not want it said.
 */
export function Paywall({
  variant,
  needed,
  have,
  onDismiss,
}: {
  variant: 'account' | 'buy';
  needed?: number;
  have?: number;
  onDismiss: () => void;
}) {
  const isAccount = variant === 'account';

  const heading = isAccount
    ? have === 0
      ? 'You have used your free credits'
      : 'The rewrite needs a free account'
    : 'Not enough credits for this one';

  const body = isAccount
    ? 'Create a free account and they are yours, with the rewrite unlocked.'
    : typeof needed === 'number' && typeof have === 'number'
      ? `This needs ${needed} ${needed === 1 ? 'credit' : 'credits'} and you have ${have}. Scanning stays free and unlimited.`
      : 'Scanning stays free and unlimited. Sanitising needs credits.';

  return (
    <div className={'relative overflow-hidden rounded-[13px]'}>
      {/*
        THE LAYERS ARE THE OTHER WAY UP SINCE 21 AUGUST 2026, and that is the
        whole of fix 1a.

        The blurred filler used to be in normal flow and the message on top of
        it, absolutely positioned. So the box was exactly as tall as four
        blurred lines, the message was centred inside that fixed height, and
        anything taller than four lines had its top pushed off the edge. That
        is why the lock was touching the top: the column had simply outgrown
        the box it was being centred in, and every attempt to fix it by
        nudging padding was fixing the wrong layer.

        Now the message is in flow and sets the height, and the filler is the
        absolute one. The box cannot be shorter than its own content at any
        width, in any language, at any font size.
      */}
      <div
        className={
          'pointer-events-none absolute inset-0 px-4 py-3.5 blur-[6px] select-none'
        }
        aria-hidden
      >
        <p className={'text-foreground/70 text-[14.5px] leading-[1.75]'}>
          The panel assessed the quarterly data and decided the deployment
          should roll out in three phases instead of two. The initial phase
          encompasses the northern locations and is projected to finish within
          eleven weeks, with spending pegged at the figure matching February.
        </p>
      </div>

      <div
        className={
          'bg-card/70 relative grid min-h-[184px] place-items-center px-5 py-7 backdrop-blur-[2px]'
        }
      >
        <div
          className={
            'flex max-w-[42ch] flex-col items-center gap-3 text-center'
          }
        >
          <span
            className={
              'bg-mark text-mark-foreground grid size-[34px] shrink-0 place-items-center rounded-[10px]'
            }
          >
            <LockIcon className={'size-[16px]'} strokeWidth={2} aria-hidden />
          </span>

          <h3
            className={
              'text-foreground text-[15px] font-semibold tracking-[-0.015em]'
            }
          >
            {heading}
          </h3>

          {/*
            THE OFFER, ON ITS OWN LINE. It used to be four words inside the
            sentence below, which is exactly where an eye skips. Same words,
            promoted to an object.
          */}
          {isAccount ? <CreditOfferBadge /> : null}

          <p className={'text-muted-foreground text-[13px] leading-snug'}>
            {body}
          </p>

          <div
            className={'mt-1 flex flex-wrap items-center justify-center gap-2'}
          >
            <Link
              href={isAccount ? '/auth/sign-up' : '/pricing'}
              onClick={paywallSignUpClicked}
              className={
                'bg-mark text-mark-foreground hover:bg-mark-strong rounded-[9px] px-4 py-2 text-[13px] font-semibold transition-colors active:scale-[0.98]'
              }
            >
              {isAccount ? 'Create a free account' : 'Get credits'}
            </Link>
            <button
              type={'button'}
              onClick={() => {
                paywallDismissed();
                onDismiss();
              }}
              className={
                'text-muted-foreground hover:text-foreground rounded-[9px] px-3 py-2 text-[13px] font-medium transition-colors'
              }
            >
              Back to the scan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
