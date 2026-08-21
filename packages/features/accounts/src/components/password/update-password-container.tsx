'use client';

import { useQuery } from '@tanstack/react-query';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { useUser } from '@kit/supabase/hooks/use-user';
import { Alert } from '@kit/ui/alert';
import { alertExtras } from '@kit/ui/alert-extras';
import { LoadingOverlay } from '@kit/ui/loading-overlay';
import { Trans } from '@kit/ui/trans';

import { UpdatePasswordForm } from './update-password-form';

/**
 * ASK WHETHER THE ACCOUNT HAS A PASSWORD, NOT HOW THIS SESSION WAS MADE.
 * 21 August 2026. Full history in docs/session-notes/password-form-bug.md.
 *
 * This used to read:
 *
 *   const canUpdatePassword = user.amr?.some(...item.method === 'password');
 *
 * `amr` is the authentication-methods-reference claim, which records how THIS
 * SESSION signed in. Whether the ACCOUNT has a password is a different
 * question, and the old code asked the wrong one. Three real people hit it:
 *
 *   - Someone who finishes signing up by clicking the emailed confirmation
 *     link. That link mints the session, so `amr` is `otp`, and they are told
 *     their account has no password within a minute of choosing one.
 *   - Anyone who signs in with Google on an account that also has a password.
 *     Several accounts here carry providers ['email','google'].
 *   - Anyone whose session was created by a password reset link.
 *
 * The right question is whether the account carries an `email` identity, which
 * is what Supabase calls a password credential.
 *
 * WHY A SECOND QUERY RATHER THAN `useUser`. Two reasons and both matter.
 *
 *   1. `useUser` returns `getClaims()`, i.e. the raw JWT. `identities` is not
 *      a JWT claim and never will be, so the token cannot answer this. Only
 *      `getUser()`, which calls the auth server, can.
 *   2. `useUser` is keyed `['supabase:user']` and is seeded with `initialData`
 *      by the account dropdown in the sidebar, with `refetchOnMount: false`
 *      and `refetchOnWindowFocus: false`. Anything wrong in that seed latches
 *      for the life of the page. Today the seed is claims and does carry
 *      `amr`, so that is not the live cause, but it is a trap and this query
 *      keeps its own key well clear of it.
 */
const IDENTITIES_QUERY_KEY = ['supabase:user:password-identity'];

function usePasswordIdentity() {
  const client = useSupabase();

  return useQuery({
    queryKey: IDENTITIES_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await client.auth.getUser();

      if (error) {
        throw error;
      }

      const identities = data.user?.identities;

      /*
       * `identities` absent is not the same as empty. Absent means the auth
       * server did not tell us, and a warning we cannot justify is worse than
       * a form that turns out to be unnecessary: setting a password on an
       * account that has none is a valid thing to do, so showing the form
       * when we are unsure is the harmless direction to fail in.
       */
      if (identities === undefined) {
        return { hasPasswordIdentity: true, unknown: true };
      }

      return {
        hasPasswordIdentity: identities.some(
          (identity) => identity.provider === 'email',
        ),
        unknown: false,
      };
    },
  });
}

export function UpdatePasswordFormContainer(
  props: React.PropsWithChildren<{
    callbackPath: string;
  }>,
) {
  const { data: user, isPending: userPending } = useUser();
  const {
    data: identity,
    isPending: identityPending,
    isError: identityError,
  } = usePasswordIdentity();

  if (userPending || identityPending) {
    return <LoadingOverlay fullPage={false} />;
  }

  // `email` is optional on the claims type, and the form requires one
  if (!user?.email) {
    return null;
  }

  /*
   * If the lookup itself failed we have learned nothing, so we do not accuse
   * the account of having no password. Same reasoning as the `unknown` case
   * above: show the form.
   */
  const canUpdatePassword = identityError || identity?.hasPasswordIdentity;

  if (!canUpdatePassword) {
    return <WarnCannotUpdatePasswordAlert />;
  }

  return (
    <UpdatePasswordForm
      callbackPath={props.callbackPath}
      userEmail={user.email}
    />
  );
}

function WarnCannotUpdatePasswordAlert() {
  return (
    <Alert className={alertExtras.warning}>
      <Trans i18nKey={'account.cannotUpdatePassword'} />
    </Alert>
  );
}
