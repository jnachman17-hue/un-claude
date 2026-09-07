'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

/**
 * The consent banner, owed from the moment the Google Ads tag shipped.
 *
 * 6 September 2026. Until this commit the site set no advertising cookie and
 * needed no banner, and the cookie policy said so on a public page. Measuring
 * whether an ad produces a sale requires the cookie, Jon has decided that
 * trade, and this is the half of it the visitor sees.
 *
 * ★ IT IS A BAR, NOT A WALL. `CLAUDE.md` section 8: the visitor is a student on
 * a phone who came to get a document unwatermarked. Nothing here blocks the
 * tool, dims the page, or has to be answered before the box can be used. A
 * consent wall on a privacy product would cost more than the measurement is
 * worth.
 *
 * ★ DECLINING IS ONE CLICK AND IS NOT HIDDEN. Both buttons are the same size
 * and sit next to each other. A banner where "accept" is a button and "reject"
 * is a grey link is the pattern regulators name specifically, and it would sit
 * badly under a promise about not tracking people.
 *
 * ★ WHAT IT SAYS IS WHAT IT DOES. The sentence names Google, names the reason,
 * and says the tool is unaffected either way. All three are true.
 */

/** Where the choice lives. Read by `google-tag.tsx` before its first ping. */
export const CONSENT_KEY = 'uc.consent';
export const GRANTED = 'granted';
export const DENIED = 'denied';

type Consent = typeof GRANTED | typeof DENIED;

function apply(consent: Consent) {
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void })
    .gtag;

  if (typeof gtag !== 'function') return;

  gtag('consent', 'update', {
    ad_storage: consent,
    ad_user_data: consent,
    ad_personalization: consent,
    analytics_storage: consent,
  });
}

export function CookieConsent() {
  /**
   * Undefined means "not read yet", which is NOT the same as "no choice
   * stored". Rendering the bar before localStorage has been read would flash
   * it at every returning visitor who already answered.
   */
  const [choice, setChoice] = useState<Consent | null | undefined>(undefined);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(CONSENT_KEY);

      setChoice(stored === GRANTED || stored === DENIED ? stored : null);
    } catch {
      // A browser that refuses storage cannot record a choice, so it is asked
      // nothing. Consent stays denied, which is the safe direction.
      setChoice(DENIED);
    }
  }, []);

  const answer = (consent: Consent) => {
    try {
      window.localStorage.setItem(CONSENT_KEY, consent);
    } catch {
      // Nothing to do. The choice still applies for this page view.
    }

    apply(consent);
    setChoice(consent);
  };

  if (choice !== null) return null;

  return (
    <div
      role={'region'}
      aria-label={'Cookie choice'}
      className={
        'fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-3 sm:px-5 sm:pb-5'
      }
    >
      <div
        className={
          'border-border bg-card flex w-full max-w-[680px] flex-col gap-3 rounded-[14px] border p-4 shadow-lg sm:flex-row sm:items-center sm:gap-4'
        }
      >
        <p
          className={'text-foreground min-w-0 flex-1 text-[12.5px] leading-[1.5]'}
        >
          We use Google advertising cookies to see whether an ad brought you
          here. Nothing you paste or upload is ever shared, and the tool works
          exactly the same either way.{' '}
          <Link
            href={'/cookie-policy'}
            className={'text-foreground font-medium underline underline-offset-2'}
          >
            Cookie policy
          </Link>
        </p>

        <div className={'flex shrink-0 gap-2'}>
          <button
            type={'button'}
            onClick={() => answer(DENIED)}
            className={
              'border-border text-foreground hover:bg-foreground/[0.045] flex-1 rounded-[9px] border px-3.5 py-2 text-[12.5px] font-semibold transition-colors active:scale-[0.98] sm:flex-none'
            }
          >
            No thanks
          </button>

          <button
            type={'button'}
            onClick={() => answer(GRANTED)}
            className={
              'bg-foreground text-background flex-1 rounded-[9px] px-3.5 py-2 text-[12.5px] font-semibold transition-transform active:scale-[0.98] sm:flex-none'
            }
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
