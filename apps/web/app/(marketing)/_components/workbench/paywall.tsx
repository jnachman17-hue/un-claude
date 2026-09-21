'use client';

import Link from 'next/link';

import { LockIcon } from 'lucide-react';

import { paywallDismissed, paywallSignUpClicked } from '~/lib/analytics/events';

import { CHEAPEST_PACK } from '../../pricing/_components/pricing-data';

/**
 * What a visitor sees when the work cannot run. 04 entry 97.
 *
 * Jon's design survives from the first version: the scan still shows in
 * full, unblurred, always. It costs nothing to run, and telling somebody
 * exactly what is wrong with their text before asking for anything converts
 * far harder than hiding both halves. The blur below is a locked state, not
 * a hidden answer: no rewrite is run to produce this screen.
 *
 * ONE VARIANT, SINCE 21 SEPTEMBER 2026 (04 entries 165 and 166). There used
 * to be two: `account`, shown to a guest, which offered the 3-credit signup
 * grant and read "Create a free account and they are yours, with the rewrite
 * unlocked"; and `buy`, shown to a signed-in account, which carried the
 * numbers and a price. The measurement in
 * docs/session-notes/pricing-investigation-21-sept.md found that the first
 * one was handing essays out free: a guest with a 2,500 word document met
 * "needs 3, have 2", signed up, received 3 more, and cleaned it. 9 of 11
 * essay signups whose essay fit did exactly that and never ran another job.
 * The signup grant is gone, so there is nothing free to offer at the wall,
 * and everybody sees the same arithmetic and the same price.
 *
 * The message carries the exact numbers, because "this needs 3 and you have
 * 2" reads as arithmetic where "insufficient credits" reads as a wall. And
 * it carries the starting price, because a button reading "Get credits" asks
 * a visitor to navigate to find out whether they can afford it (entry 159).
 * The price is read from `pricing-data.ts` and never retyped here.
 *
 * "Get credits" IS A `Link` AND MUST STAY SO. A plain anchor reloads the
 * page, and PostHog's in-memory visitor id dies with it: the most important
 * conversion step in the product would arrive at /pricing as a stranger.
 * Measured, not guessed. 06 row 67. A guest who presses a pack there is sent
 * to create the account the purchase will live on, and comes back.
 *
 * FIX 1a FROM 21 AUGUST 2026 SURVIVES: the lock was touching the top edge of
 * the box, and the reason and the repair are in the comment inside.
 */
export function Paywall({
  needed,
  have,
  onDismiss,
}: {
  needed?: number;
  have?: number;
  onDismiss: () => void;
}) {
  const arithmetic =
    typeof needed === 'number' && typeof have === 'number'
      ? `This needs ${needed} ${needed === 1 ? 'credit' : 'credits'} and you have ${have === 0 ? 'none' : have}.`
      : 'Sanitising needs credits.';

  const body = `${arithmetic} Packs start at $${CHEAPEST_PACK.price} for ${CHEAPEST_PACK.credits} credits, and scanning stays free.`;

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
            Not enough credits for this one
          </h3>

          <p className={'text-muted-foreground text-[13px] leading-snug'}>
            {body}
          </p>

          <div
            className={'mt-1 flex flex-wrap items-center justify-center gap-2'}
          >
            <Link
              href={'/pricing'}
              onClick={paywallSignUpClicked}
              className={
                'bg-mark text-mark-foreground hover:bg-mark-strong rounded-[9px] px-4 py-2 text-[13px] font-semibold transition-colors active:scale-[0.98]'
              }
            >
              Get credits
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
