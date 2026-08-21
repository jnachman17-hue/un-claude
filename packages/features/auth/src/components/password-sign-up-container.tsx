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
        /*
         * PRINT THE VALUE, NOT ITS PROPERTIES, and this is the correction to
         * the first attempt at this fix. `useSignUpWithEmailAndPassword`
         * does `throw response.error.message`, so what arrives here is a bare
         * STRING. Reading .name/.status/.code/.message off a string returns
         * undefined four times, which is what the log showed and why it still
         * said nothing useful.
         *
         * The same string reaches auth-error-alert.tsx, which handles a
         * string correctly but can only map it to one of our sentences if it
         * matches a pattern in that file's list. When it does not, the
         * visitor gets the last-resort "check your internet connection" for
         * what may be an entirely different problem. So whatever this prints
         * belongs in that pattern list.
         */
        console.error(
          'sign-up failed:',
          typeof error === 'string' ? error : JSON.stringify(error, Object.getOwnPropertyNames(error ?? {})),
        );
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
