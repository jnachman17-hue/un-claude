import type { ReactNode } from 'react';

import { TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import { Trans } from '@kit/ui/trans';

/**
 * The last resort, written out in full rather than looked up.
 *
 * This component shipped a defect for two days where the FALLBACK ITSELF was the
 * thing that broke: it asked the translation layer for a placeholder to be swapped
 * for a component, the swap never happened, and users read the literal text
 * `<DefaultError />` on screen. 06 row 13.
 *
 * So the bottom of the chain is a plain English sentence that depends on nothing.
 * If every lookup above it fails, a person still reads a sentence.
 */
const LAST_RESORT =
  'Something went wrong and the sign in did not complete. Please try again.';

/**
 * THE TWO FAILURES THAT DESERVE THEIR OWN SCREEN. Lane E item S-3,
 * 23 August 2026.
 *
 * Three different things went wrong and all three told the visitor the same
 * thing: "please ensure you have a working internet connection". A blocked
 * captcha is not a connection problem. An unconfirmed email address is not a
 * connection problem, and it is the single most common thing that goes wrong
 * after somebody signs up: the confirmation mail lands in spam, they close the
 * tab, they come back a week later and try to sign in.
 *
 * These two are named here rather than left in the general bucket, because
 * each one has a different thing for the visitor to do next, and the general
 * message could not tell them what it was.
 *
 * `emailNotConfirmed` also drives the **Resend it** button. That is why this
 * is a case rather than only a sentence: the component needs to know which
 * failure it is looking at, not just what to print.
 */
export type AuthErrorCase =
  | 'emailNotConfirmed'
  | 'captchaUnavailable'
  | 'notActivated'
  | 'other';

/**
 * `notActivated` is the SHARED CHAPTER ACCOUNTS, added 26 August 2026.
 *
 * A chapter is sent working credentials and 250 credits by email, and the
 * account is locked (a ban on the auth user) until the chapter sends back a
 * screenshot proving the login reached the house. Almost everyone tries the
 * login the moment they read the email, BEFORE sending anything.
 *
 * Without this case they read "Something went wrong and the sign in did not
 * complete", conclude the credentials are broken, and never reply — which
 * kills the one step the whole outreach depends on. Measured on a real locked
 * account before this existed.
 *
 * The wording is deliberately true for any locked account, not only a chapter,
 * because a ban is also what an abusive account would get. It states the fact
 * first and makes the chapter instruction conditional.
 */
const CASES: ReadonlyArray<readonly [RegExp, AuthErrorCase]> = [
  [/email not confirmed|email_not_confirmed/i, 'emailNotConfirmed'],
  [/captcha/i, 'captchaUnavailable'],
  // BROAD ON PURPOSE. The exact upstream sentence was never captured: sign-in
  // is behind Turnstile, so a locked account cannot be reached from a script or
  // a headless browser to read the string back. Supabase's code is `user_banned`
  // and its message is "User is banned", but a variant such as "User is
  // temporarily banned" would slip past a narrower pattern and land the visitor
  // back in the general bucket. No other auth failure contains the word, so the
  // wide match costs nothing and the narrow one risks the whole fix silently
  // not working.
  [/banned/i, 'notActivated'],
];

/**
 * @name classifyAuthError
 * @description Which of the named failures this is, if any. Exported so the
 * sign-in container can decide whether to offer the resend control without
 * matching on upstream text a second time.
 */
export function classifyAuthError(
  error: Error | null | undefined | string,
): AuthErrorCase {
  if (!error) {
    return 'other';
  }

  const errorCode = error instanceof Error ? error.message : error;

  for (const [pattern, name] of CASES) {
    if (pattern.test(errorCode)) {
      return name;
    }
  }

  return 'other';
}

const CASE_HEADINGS: Record<AuthErrorCase, string> = {
  emailNotConfirmed: 'auth.emailNotConfirmedHeading',
  captchaUnavailable: 'auth.captchaUnavailableHeading',
  notActivated: 'auth.notActivatedHeading',
  other: 'auth.errorAlertHeading',
};

/**
 * Supabase error text, matched to one of our own messages.
 *
 * WHY THIS EXISTS. Supabase returns a human sentence rather than a code, and the
 * kit looks that whole sentence up as a translation key. Only three of them have
 * ever matched: invalid credentials, already registered, and unconfirmed email.
 * Everything else fell through, which is how a stranger came to be shown a
 * placeholder instead of a message.
 *
 * WHY PATTERNS RATHER THAN EXACT KEYS. Some of these carry a variable inside the
 * sentence and can never match a fixed key. Supabase's rate limit message names
 * the number of seconds, and its invalid-address message quotes the address the
 * user typed back at them, which is also a reason not to show it verbatim.
 *
 * The list is deliberately CLOSED. Anything not on it gets the general message,
 * never the upstream text. Same practice as the engine's error handling in
 * apps/web/api/_shared.py, and 04 entry 15.
 */
const PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [
    /email address .*is invalid|unable to validate email address|invalid format/i,
    'invalidEmail',
  ],
  [
    /password should be at least|password is too short|weak.?password|password should contain/i,
    'weakPassword',
  ],
  [
    /for security purposes|only request this after|rate limit|too many requests|over_.*_send_rate_limit/i,
    'rateLimited',
  ],
  [/provider is not enabled|unsupported provider/i, 'providerNotEnabled'],
  [
    /link is invalid or has expired|token has expired or is invalid|otp_expired/i,
    'otp_expired',
  ],
  [/signups? not allowed|signup is disabled/i, 'signupDisabled'],
];

/**
 * @name AuthErrorAlert
 * @param error The error Supabase returned. Its `message` is upstream text and is
 * NEVER rendered: it is only ever used to choose one of our own sentences.
 */
export function AuthErrorAlert({
  error,
  action,
}: {
  error: Error | null | undefined | string;
  /**
   * Something for the visitor to do about this particular failure, rendered
   * under the sentence. The **Resend it** button is the one caller today.
   * Placed below the text rather than in the alert's own top-right action
   * slot, because on a phone a control floated beside two lines of wrapped
   * text sits on top of them.
   */
  action?: ReactNode;
}) {
  // Called before the early return below, because a hook may not run
  // conditionally.
  const t = useTranslations('auth');

  if (!error) {
    return null;
  }

  const errorCode = error instanceof Error ? error.message : error;
  const name = classifyAuthError(errorCode);

  return (
    <Alert variant={'destructive'}>
      <TriangleAlert className={'w-4'} />

      <AlertTitle>
        <Trans i18nKey={CASE_HEADINGS[name]} />
      </AlertTitle>

      <AlertDescription data-test={'auth-error-message'}>
        {resolveMessage(t, errorCode)}

        {action ? <div className={'mt-3'}>{action}</div> : null}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Upstream error text in, one of our own sentences out. Four steps, and the last
 * one cannot fail.
 *
 * Split out from the component so it is a plain function of its inputs and can be
 * checked without rendering anything.
 */
function resolveMessage(
  t: ReturnType<typeof useTranslations>,
  errorCode: string,
): string {
  const read = (key: string): string | null => {
    try {
      // t.has() is what tells a missing key apart from a key whose value is
      // empty. Without it, next-intl throws or returns the key itself, and the
      // key is upstream text.
      return t.has(key as never) ? t(key as never) : null;
    } catch {
      return null;
    }
  };

  // 1. The two failures we name ourselves, checked FIRST so our wording wins
  //    over whatever sentence the kit happens to have under the upstream text.
  //    S-3: these are the cases that were being told their internet was down.
  const named = classifyAuthError(errorCode);

  if (named !== 'other') {
    const owned = read(`errors.${named}`);

    if (owned) {
      return owned;
    }
  }

  // 2. The kit's own behaviour: the whole Supabase sentence as a key. Keeps the
  //    three messages that already worked, and any a translator adds later.
  const exact = read(`errors.${errorCode}`);

  if (exact) {
    return exact;
  }

  // 3. Our patterns, for the failures that are common enough to deserve a
  //    sentence of their own.
  for (const [pattern, key] of PATTERNS) {
    if (pattern.test(errorCode)) {
      const matched = read(`errors.${key}`);

      if (matched) {
        return matched;
      }
    }
  }

  // 4. The general message. This is the one that existed all along and was
  //    never reachable.
  return read('errors.default') ?? LAST_RESORT;
}
