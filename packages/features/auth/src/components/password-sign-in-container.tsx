'use client';

import { useCallback, useState } from 'react';

import type { z } from 'zod';

import { useSignInWithEmailPassword } from '@kit/supabase/hooks/use-sign-in-with-email-password';

import { useCaptchaToken } from '../captcha/client';
import type { PasswordSignInSchema } from '../schemas/password-sign-in.schema';
import { AuthErrorAlert, classifyAuthError } from './auth-error-alert';
import { PasswordSignInForm } from './password-sign-in-form';
import { ResendConfirmationButton } from './resend-confirmation-button';

export function PasswordSignInContainer({
  onSignIn,
  confirmationRedirectUrl,
}: {
  onSignIn?: (userId?: string) => unknown;
  /**
   * Where the resent confirmation link should land. Threaded down from the
   * sign-in page so the **Resend it** button can send a link that comes back
   * to this site rather than to Supabase's default. S-3.
   */
  confirmationRedirectUrl?: string;
}) {
  const { captchaToken, resetCaptchaToken } = useCaptchaToken();
  const signInMutation = useSignInWithEmailPassword();
  const isLoading = signInMutation.isPending;

  /**
   * The address the visitor just typed. Kept so that an unconfirmed account
   * can be offered a resend without making them type it a second time. It is
   * held in memory for the life of the page and sent nowhere except back to
   * the same auth endpoint they just used.
   */
  const [attemptedEmail, setAttemptedEmail] = useState('');

  const onSubmit = useCallback(
    async (credentials: z.infer<typeof PasswordSignInSchema>) => {
      setAttemptedEmail(credentials.email);

      try {
        const data = await signInMutation.mutateAsync({
          ...credentials,
          options: { captchaToken },
        });

        if (onSignIn) {
          const userId = data?.user?.id;

          onSignIn(userId);
        }
      } catch {
        // wrong credentials, do nothing
      } finally {
        resetCaptchaToken();
      }
    },
    [captchaToken, onSignIn, resetCaptchaToken, signInMutation],
  );

  // An unconfirmed email address is the one failure with something to click,
  // and it is the most common one there is. S-3.
  const canResend =
    classifyAuthError(signInMutation.error) === 'emailNotConfirmed' &&
    attemptedEmail !== '';

  return (
    <>
      <AuthErrorAlert
        error={signInMutation.error}
        action={
          canResend ? (
            <ResendConfirmationButton
              email={attemptedEmail}
              redirectUrl={confirmationRedirectUrl}
            />
          ) : null
        }
      />

      <PasswordSignInForm onSubmit={onSubmit} loading={isLoading} />
    </>
  );
}
