'use client';

import Link from 'next/link';

import { LockIcon } from 'lucide-react';

import { paywallDismissed, paywallSignUpClicked } from '~/lib/analytics/events';

/**
 * What a visitor sees once the free runs are gone.
 *
 * Jon's design. The scan still shows in full, unblurred, always: it costs
 * nothing to run and telling somebody exactly what is wrong with their text
 * before asking for money converts far harder than hiding both halves.
 *
 * Deliberately, NO rewrite is run to produce this screen. Blurring a real result
 * would mean paying for work nobody gets to see. The blur is a locked state, not
 * a hidden answer.
 *
 * "Get credits" IS A `Link` AND MUST STAY ONE. It was a plain anchor until
 * 19 August 2026, which reloaded the whole page. PostHog stores nothing on the
 * device, so the visitor's id lives in memory and a reload destroys it: the most
 * important conversion step in the product arrived at sign-up as a stranger and
 * could not be joined to anything before it. Measured, not guessed. 06 row 67 and
 * 07, "Cookieless has an identity boundary".
 */
export function Paywall({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className={'relative overflow-hidden rounded-[13px]'}>
      <div
        className={'pointer-events-none px-4 py-3.5 blur-[6px] select-none'}
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
          'bg-card/70 absolute inset-0 grid place-items-center px-5 backdrop-blur-[2px]'
        }
      >
        <div
          className={
            'flex max-w-[38ch] flex-col items-center gap-3 text-center'
          }
        >
          <span
            className={
              'bg-mark text-mark-foreground grid size-[34px] place-items-center rounded-[10px]'
            }
          >
            <LockIcon className={'size-[16px]'} strokeWidth={2} aria-hidden />
          </span>

          <h3
            className={
              'text-foreground text-[15px] font-semibold tracking-[-0.015em]'
            }
          >
            You have used your free credits
          </h3>

          <p className={'text-muted-foreground text-[13px] leading-snug'}>
            Scanning stays free and unlimited. Credits cover sanitising: the
            hidden characters, the metadata and the rewrite.
          </p>

          <div
            className={'mt-1 flex flex-wrap items-center justify-center gap-2'}
          >
            <Link
              href={'/auth/sign-up'}
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
