'use client';

import { useEffect } from 'react';

import { signInStarted, signUpStarted } from '~/lib/analytics/events';

/**
 * RECORDS THAT SOMEBODY TRIED TO SIGN UP OR SIGN IN.
 *
 * Added 25 August 2026. `signUpStarted` and `signInStarted` had existed in
 * `lib/analytics/events.ts` since the analytics work and were never called from
 * anywhere — verified by grep, and confirmed in PostHog, where neither event has
 * ever fired despite 24 views of `/auth/sign-up` in thirty days. The sign-up
 * step of the funnel was simply missing.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS LISTENS TO THE DOM INSTEAD OF CALLING THE EVENT AT THE SOURCE.
 *
 * The sign-in and sign-up forms come from `@kit/auth`, a vendored package shared
 * across the template. Firing the event where the click happens would mean
 * either editing that package — which puts this product's analytics vocabulary
 * inside library code that is meant to stay replaceable — or having the package
 * call `window.posthog` directly, which breaks the rule at the top of
 * `events.ts` that ONE module decides what may leave the browser. Neither is
 * worth it for two events.
 *
 * So the app layer listens instead, on two anchors that are part of the
 * package's public shape rather than of its styling:
 *
 *   - `[data-provider]`, set by `AuthProviderButton` and carrying the provider
 *     id, which is exactly the value the event wants.
 *   - the `<form>` element, which is what the password path submits.
 *
 * THE RISK, NAMED SO IT IS NOT A SURPRISE LATER: if the package stops rendering
 * a `<form>`, or drops `data-provider`, these events go quiet rather than
 * erroring. That is why the dashboard flags a funnel step that reads lower than
 * the step below it — a silent zero here shows up there as "under-recorded"
 * instead of being believed.
 *
 * IT IS A LISTENER, NOT A WRAPPER, so it cannot interfere with signing in.
 * Everything is passive and capture-phase; nothing is intercepted, nothing is
 * prevented, and a throw inside it could not stop the form submitting.
 */
export function AuthAnalytics({ mode }: { mode: 'sign-up' | 'sign-in' }) {
  useEffect(() => {
    const fire = (method: 'password' | 'google') => {
      // Analytics must never be able to break signing in. `events.ts` already
      // swallows its own failures; this is the second belt.
      try {
        if (mode === 'sign-up') signUpStarted({ method });
        else signInStarted({ method });
      } catch {
        // Deliberately silent.
      }
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest?.('[data-provider]');

      if (!button) return;

      const provider = button.getAttribute('data-provider');

      // `method` is a fixed vocabulary in `events.ts` — password or google. Any
      // other provider that gets enabled later would arrive here as a string we
      // have not agreed to send, so it is ignored rather than passed through.
      if (provider === 'google') fire('google');
    };

    // Capture phase: the form's own submit handler calls `preventDefault`, and a
    // bubbling listener would still see the event, but capture runs first and
    // cannot be cancelled out of by anything downstream.
    const onSubmit = () => fire('password');

    document.addEventListener('click', onClick, true);
    document.addEventListener('submit', onSubmit, true);

    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('submit', onSubmit, true);
    };
  }, [mode]);

  return null;
}
