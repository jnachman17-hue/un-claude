'use client';

import { useCallback, useRef, useState } from 'react';

import { CheckCircle } from 'lucide-react';

import { useSignUpWithEmailAndPassword } from '@kit/supabase/hooks/use-sign-up-with-email-password';
import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import { alertExtras } from '@kit/ui/alert-extras';
import { If } from '@kit/ui/if';
import { Trans } from '@kit/ui/trans';

import { useCaptchaToken } from '../captcha/client';
import { AuthErrorAlert } from './auth-error-alert';
import { PasswordSignUpForm } from './password-sign-up-form';

interface EmailPasswordSignUpContainerProps {
  displayTermsCheckbox?: boolean;
  defaultValues?: {
    email: string;
  };

  onSignUp?: (userId?: string) => unknown;
  emailRedirectTo: string;
}

export function EmailPasswordSignUpContainer({
  defaultValues,
  onSignUp,
  emailRedirectTo,
  displayTermsCheckbox,
}: EmailPasswordSignUpContainerProps) {
  const { captchaToken, resetCaptchaToken } = useCaptchaToken();

  const signUpMutation = useSignUpWithEmailAndPassword();
  const redirecting = useRef(false);
  const [showVerifyEmailAlert, setShowVerifyEmailAlert] = useState(false);

  const loading = signUpMutation.isPending || redirecting.current;

  const onSignupRequested = useCallback(
    async (credentials: { email: string; password: string }) => {
      if (loading) {
        return;
      }

      try {
        const data = await signUpMutation.mutateAsync({
          ...credentials,
          emailRedirectTo,
          captchaToken,
        });

        setShowVerifyEmailAlert(true);

        if (onSignUp) {
          onSignUp(data.user?.id);
        }
      } catch (error) {
        /*
         * SPELL THE ERROR OUT. 21 August 2026.
         *
         * This was `console.error(error)`, and a Supabase AuthError carries
         * its message, status and code on the prototype rather than as own
         * enumerable properties, so the console and the dev server log both
         * recorded the literal string `{}`.
         *
         * A sign-up failed for Jon and the only trace of why was an empty
         * object, while the visitor was shown the last-resort "check your
         * internet connection" because the message never reached the pattern
         * list in auth-error-alert.tsx. Two layers of the diagnostic chain
         * blind at once, on the most important step in the funnel.
         */
        const detail = error as {
          message?: string;
          status?: number;
          code?: string;
          name?: string;
        };

        console.error('sign-up failed', {
          name: detail?.name,
          status: detail?.status,
          code: detail?.code,
          message: detail?.message,
        });
      } finally {
        resetCaptchaToken();
      }
    },
    [
      captchaToken,
      emailRedirectTo,
      loading,
      onSignUp,
      resetCaptchaToken,
      signUpMutation,
    ],
  );

  return (
    <>
      <If condition={showVerifyEmailAlert}>
        <SuccessAlert />
      </If>

      <If condition={!showVerifyEmailAlert}>
        <AuthErrorAlert error={signUpMutation.error} />

        <PasswordSignUpForm
          onSubmit={onSignupRequested}
          loading={loading}
          defaultValues={defaultValues}
          displayTermsCheckbox={displayTermsCheckbox}
        />
      </If>
    </>
  );
}

function SuccessAlert() {
  return (
    <Alert className={alertExtras.success}>
      <CheckCircle className={'w-4'} />

      <AlertTitle>
        <Trans i18nKey={'auth.emailConfirmationAlertHeading'} />
      </AlertTitle>

      <AlertDescription data-test={'email-confirmation-alert'}>
        <Trans i18nKey={'auth.emailConfirmationAlertBody'} />
      </AlertDescription>
    </Alert>
  );
}
