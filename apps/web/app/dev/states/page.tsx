'use client';

/**
 * THE CREDIT STATES, ALL AT ONCE. Added 21 August 2026, session 10.
 *
 * Every screen on this page needs a live ledger to reach in the product: an
 * empty balance, a wall, an arrival straight after signing up. Reaching them
 * by hand means spending real credits against the hosted database, three
 * times, in order, and a local Supabase is not available (06 row 11). So they
 * are rendered here directly instead, with the real components, the real
 * stylesheet and the real widths.
 *
 * This exists so a state can be LOOKED AT rather than described.
 * `CLAUDE.md` section 4: show the artefact, not a measurement of it.
 *
 * Development builds only, same guard as /dev/credits.
 */
import { CreditChip, CreditCoin } from '~/(marketing)/_components/workbench/credit-chip';
import {
  OutOfCredits,
  SignedInWelcome,
} from '~/(marketing)/_components/workbench/credit-offer';
import { Paywall } from '~/(marketing)/_components/workbench/paywall';

function Case({
  title,
  note,
  children,
}: React.PropsWithChildren<{ title: string; note?: string }>) {
  return (
    <section className={'mb-10'}>
      <h2
        className={
          'text-muted-foreground mb-1 text-[11px] font-semibold tracking-[0.08em] uppercase'
        }
      >
        {title}
      </h2>
      {note ? (
        <p className={'text-muted-foreground mb-3 text-[12px]'}>{note}</p>
      ) : null}
      <div className={'border-border bg-card rounded-[18px] border p-4'}>
        {children}
      </div>
    </section>
  );
}

export default function DevStates() {
  if (process.env.NODE_ENV !== 'development') {
    return (
      <main className={'mx-auto max-w-[640px] px-6 py-20'}>
        <p className={'text-muted-foreground text-[14px]'}>
          This page only renders on a development build.
        </p>
      </main>
    );
  }

  return (
    <main className={'mx-auto max-w-[680px] px-5 py-10'}>
      <h1 className={'text-foreground mb-8 text-[22px] font-bold'}>
        Credit states
      </h1>

      <Case title={'The coin, and the balance chip'}>
        <div className={'flex flex-wrap items-center gap-5'}>
          <CreditCoin className={'size-[44px]'} />
          <CreditCoin className={'size-[16px]'} />
          <CreditCoin className={'size-[13px]'} />
          <CreditChip amount={2} label={'free'} size={'lg'} />
          <CreditChip amount={5} label={'left'} size={'lg'} />
          <CreditChip amount={0} label={'left'} size={'lg'} tone={'empty'} />
          <CreditChip amount={3} tone={'spend'} />
        </div>
      </Case>

      {/*
        ONE STATE WHERE THERE USED TO BE FIVE. 04 entry 166, 21 September
        2026: the offer badge, the guest panel offering the signup grant, and
        the paywall's account variant are gone with the grant itself. A guest
        and an account holder at nought now see one panel, and one wall.
      */}
      <Case
        title={'1d. Out of credits, anyone'}
        note={'Shown the moment the balance reaches nought. No failed press required. Same panel for a guest and an account holder.'}
      >
        <OutOfCredits justRanOut />
      </Case>

      <Case
        title={'1f. Arriving back on the tool after signing up cold'}
        note={'Two welcome credits, because a cold signup gets the same grant a guest would have. A buyer never sees this: they return to /pricing.'}
      >
        <SignedInWelcome balance={2} onDismiss={() => undefined} />
      </Case>

      <Case title={'The paywall, credits spent'}>
        <Paywall needed={1} have={0} onDismiss={() => undefined} />
      </Case>

      <Case title={'The paywall, an essay against two free credits'}>
        <Paywall needed={3} have={2} onDismiss={() => undefined} />
      </Case>
    </main>
  );
}
