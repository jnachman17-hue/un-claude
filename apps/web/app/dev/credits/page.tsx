'use client';

/**
 * The credit bypass for local testing. Jon's ask, 04 entry 97: "a dev page
 * where I don't get blocked from the free credits so I can keep testing."
 *
 * The switch writes one localStorage flag. With it on, the workbench sends
 * `x-uc-dev: 1` with every sanitise, and the server skips the whole credit
 * path FOR DEVELOPMENT BUILDS ONLY: `devBypass` in lib/server/credits.ts
 * checks NODE_ENV before it reads the header, so on Vercel the header is
 * inert whatever a visitor sends. This page is a convenience, not a hole.
 */
import { useEffect, useState } from 'react';

const DEV_KEY = 'uc.dev-mode';
/** Mirrors DEV_BALANCE_KEY in _components/workbench/credits.ts. */
const BALANCE_KEY = 'uc.dev-balance';

/**
 * THE BALANCES WORTH LOOKING AT. Added 21 August 2026, session 10.
 *
 * Every one of these is a real state of the interface that used to need a
 * live ledger, in the right order, to reach. `null` clears the override and
 * hands the tool back to the server's real answer.
 */
const BALANCES: Array<{ value: string | null; label: string; note: string }> = [
  { value: null, label: 'Off', note: 'Use the real balance from the server' },
  { value: '2:guest', label: '2, guest', note: 'A fresh visitor' },
  {
    value: '0:guest',
    label: '0, guest',
    note: 'The dead end. The sign-up offer appears on the panel',
  },
  { value: '5:account', label: '5, account', note: 'Just signed up' },
  {
    value: '0:account',
    label: '0, account',
    note: 'Empty account. The panel offers the packs',
  },
];

export default function DevCredits() {
  const [on, setOn] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setOn(window.localStorage.getItem(DEV_KEY) === '1');
    setBalance(window.localStorage.getItem(BALANCE_KEY));
    setReady(true);
  }, []);

  const pickBalance = (value: string | null) => {
    if (value) window.localStorage.setItem(BALANCE_KEY, value);
    else window.localStorage.removeItem(BALANCE_KEY);
    setBalance(value);
  };

  const toggle = () => {
    const next = !on;
    if (next) window.localStorage.setItem(DEV_KEY, '1');
    else window.localStorage.removeItem(DEV_KEY);
    setOn(next);
  };

  if (process.env.NODE_ENV !== 'development') {
    return (
      <main className={'mx-auto max-w-[640px] px-6 py-20'}>
        <p className={'text-muted-foreground text-[14px]'}>
          This page only does anything on a development build.
        </p>
      </main>
    );
  }

  return (
    <main className={'mx-auto max-w-[640px] px-6 py-20'}>
      <h1 className={'text-foreground text-[24px] font-semibold tracking-[-0.02em]'}>
        Testing mode
      </h1>

      <p className={'text-muted-foreground mt-3 max-w-[52ch] text-[14px] leading-[1.65]'}>
        With this on, sanitises in this browser skip the credit system
        entirely: no session is required, nothing is charged, and the paywall
        never appears. Turn it off to test the real flow. It only works on a
        development build, so it cannot leak to the live site.
      </p>

      {ready ? (
        <button
          type={'button'}
          onClick={toggle}
          className={[
            'mt-6 rounded-[10px] px-5 py-2.5 text-[14px] font-semibold transition-colors',
            on
              ? 'bg-emerald-600 text-white'
              : 'bg-foreground text-background',
          ].join(' ')}
        >
          {on ? 'Testing mode is ON. Click to turn off' : 'Turn testing mode on'}
        </button>
      ) : null}

      <h2
        className={
          'text-foreground mt-14 text-[18px] font-semibold tracking-[-0.015em]'
        }
      >
        Force a balance
      </h2>

      <p
        className={
          'text-muted-foreground mt-2 max-w-[52ch] text-[14px] leading-[1.65]'
        }
      >
        Pins what the tool believes this browser holds, so a state can be
        looked at without spending anything to reach it. Display only: the
        server still refuses work this browser cannot really pay for. Pick one,
        then open the home page.
      </p>

      {ready ? (
        <div className={'mt-5 flex flex-col gap-2'}>
          {BALANCES.map((option) => {
            const active = balance === option.value;

            return (
              <button
                key={option.label}
                type={'button'}
                onClick={() => pickBalance(option.value)}
                className={[
                  'flex items-baseline gap-3 rounded-[10px] border px-4 py-2.5 text-left transition-colors',
                  active
                    ? 'border-foreground bg-foreground/[0.06]'
                    : 'border-border hover:bg-foreground/[0.03]',
                ].join(' ')}
              >
                <span
                  className={
                    'text-foreground w-[84px] shrink-0 text-[14px] font-semibold'
                  }
                >
                  {option.label}
                </span>
                <span className={'text-muted-foreground text-[13px]'}>
                  {option.note}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </main>
  );
}
