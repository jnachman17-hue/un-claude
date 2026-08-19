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
  'Something went wrong. Please check your internet connection and try again.';

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
}: {
  error: Error | null | undefined | string;
}) {
  // Called before the early return below, because a hook may not run
  // conditionally.
  const t = useTranslations('auth');

  if (!error) {
    return null;
  }

  const errorCode = error instanceof Error ? error.message : error;

  return (
    <Alert variant={'destructive'}>
      <TriangleAlert className={'w-4'} />

      <AlertTitle>
        <Trans i18nKey={`auth.errorAlertHeading`} />
      </AlertTitle>

      <AlertDescription data-test={'auth-error-message'}>
        {resolveMessage(t, errorCode)}
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

  // 1. The kit's own behaviour: the whole Supabase sentence as a key. Keeps the
  //    three messages that already worked, and any a translator adds later.
  const exact = read(`errors.${errorCode}`);

  if (exact) {
    return exact;
  }

  // 2. Our patterns, for the failures that are common enough to deserve a
  //    sentence of their own.
  for (const [pattern, key] of PATTERNS) {
    if (pattern.test(errorCode)) {
      const matched = read(`errors.${key}`);

      if (matched) {
        return matched;
      }
    }
  }

  // 3. The general message. This is the one that existed all along and was
  //    never reachable.
  return read('errors.default') ?? LAST_RESORT;
}
