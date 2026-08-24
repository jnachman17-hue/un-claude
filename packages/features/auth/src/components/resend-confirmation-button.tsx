'use client';

import { useMutation } from '@tanstack/react-query';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { Button } from '@kit/ui/button';
import { Trans } from '@kit/ui/trans';

import { useCaptchaToken } from '../captcha/client';

/**
 * THE WAY OUT OF AN UNCONFIRMED ACCOUNT. Lane E item S-3, 23 August 2026.
 *
 * Somebody signs up, the confirmation mail lands in spam or they close the tab,
 * and a week later they come back and try to sign in. Until now the sign-in
 * page told them their internet was broken and offered nothing to click, so the
 * only route back was to guess that signing up again might work.
 *
 * THIS IS NOT `ResendAuthLinkForm`. That one asks for the email address, which
 * is the right shape for the standalone page it lives on. Here the visitor has
 * just typed their address into the form above, so asking for it again is a
 * form nobody should have to fill in twice. One button.
 *
 * The captcha token goes with the request because the live project gates this
 * endpoint, and it is reset afterwards because a Turnstile token is single use.
 */
export function ResendConfirmationButton(props: {
  email: string;
  redirectUrl?: string;
}) {
  const supabase = useSupabase();
  const { captchaToken, resetCaptchaToken } = useCaptchaToken();

  const resend = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.resend({
        email: props.email,
        type: 'signup',
        options: {
          emailRedirectTo: props.redirectUrl,
          captchaToken,
        },
      });

      if (error) {
        throw error;
      }
    },
    onSettled: () => resetCaptchaToken(),
  });

  if (resend.isSuccess) {
    return (
      <p data-test={'resend-confirmation-sent'}>
        <Trans i18nKey={'auth.resendConfirmationSent'} />
      </p>
    );
  }

  return (
    <div className={'flex flex-col gap-y-2'}>
      <Button
        type={'button'}
        size={'sm'}
        variant={'outline'}
        className={'self-start'}
        disabled={resend.isPending}
        data-test={'resend-confirmation'}
        onClick={() => resend.mutate()}
      >
        <Trans
          i18nKey={
            resend.isPending
              ? 'auth.resendConfirmationSending'
              : 'auth.resendConfirmation'
          }
        />
      </Button>

      {resend.isError ? (
        <p data-test={'resend-confirmation-failed'}>
          <Trans i18nKey={'auth.resendConfirmationFailed'} />
        </p>
      ) : null}
    </div>
  );
}
