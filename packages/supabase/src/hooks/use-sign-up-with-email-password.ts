import { useMutation } from '@tanstack/react-query';

import { useSupabase } from './use-supabase';

interface Credentials {
  email: string;
  password: string;
  emailRedirectTo: string;
  captchaToken?: string;
}

/**
 * @name useSignUpWithEmailAndPassword
 * @description Use Supabase to sign up a user with email and password in a React component
 */
export function useSignUpWithEmailAndPassword() {
  const client = useSupabase();
  const mutationKey = ['auth', 'sign-up-with-email-password'];

  const mutationFn = async (params: Credentials) => {
    const { emailRedirectTo, captchaToken, ...credentials } = params;

    const response = await client.auth.signUp({
      ...credentials,
      options: {
        emailRedirectTo,
        captchaToken,
      },
    });

    if (response.error) {
      /*
       * SAY WHAT SUPABASE ACTUALLY SAID. 21 August 2026.
       *
       * The line below this comment throws `response.error.message` — a bare
       * STRING — and that is the only thing any layer above ever sees. The
       * status and the code, which are the two fields that tell one failure
       * apart from another, are discarded right here and have never been read.
       *
       * A sign-up has been failing for a day with no diagnosis available,
       * because "Database error saving new user" and "Error sending
       * confirmation email" both arrive at the alert as unmatched text and
       * both come out as the last-resort "check your internet connection".
       *
       * So print all three before throwing. The throw itself is left alone:
       * auth-error-alert.tsx matches on the sentence, and changing the thrown
       * type is a separate decision from being able to see the failure.
       */
      console.error('[sign-up] supabase rejected:', {
        message: response.error.message,
        status: response.error.status,
        code: response.error.code,
        name: response.error.name,
      });

      throw response.error.message;
    }

    const user = response.data?.user;
    const identities = user?.identities ?? [];

    // if the user has no identities, it means that the email is taken
    if (identities.length === 0) {
      throw new Error('User already registered');
    }

    return response.data;
  };

  return useMutation({
    mutationKey,
    mutationFn,
  });
}
