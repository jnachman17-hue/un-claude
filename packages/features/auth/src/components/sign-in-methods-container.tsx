'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import type { Provider } from '@supabase/supabase-js';

import { isBrowser } from '@kit/shared/utils';
import { If } from '@kit/ui/if';
import { Separator } from '@kit/ui/separator';

import { safeNextPath } from '../safe-next';
import { MagicLinkAuthContainer } from './magic-link-auth-container';
import { OauthProviders } from './oauth-providers';
import { PasswordSignInContainer } from './password-sign-in-container';

export function SignInMethodsContainer(props: {
  paths: {
    callback: string;
    home: string;
  };

  providers: {
    password: boolean;
    magicLink: boolean;
    oAuth: Provider[];
  };
}) {
  const router = useRouter();

  /**
   * THE SECOND HALF OF THE OPEN REDIRECT. Lane E item S-1, 23 August 2026.
   *
   * `/auth/callback` was not the only place `next` was obeyed without being
   * looked at. This one hands it to `router.replace`, which follows an
   * absolute address off the site, so
   * `/auth/sign-in?next=https://evil.example` walked a visitor off the domain
   * the moment they signed in successfully. Same guard, same reasoning: a path
   * on this site or nothing.
   */
  const nextPath = safeNextPath(
    useSearchParams().get('next'),
    props.paths.home,
  );

  const redirectUrl = isBrowser()
    ? new URL(props.paths.callback, window?.location.origin).toString()
    : '';

  const onSignIn = () => {
    router.replace(nextPath);
  };

  return (
    <>
      <If condition={props.providers.password}>
        <PasswordSignInContainer
          onSignIn={onSignIn}
          confirmationRedirectUrl={redirectUrl}
        />
      </If>

      <If condition={props.providers.magicLink}>
        <MagicLinkAuthContainer
          redirectUrl={redirectUrl}
          shouldCreateUser={false}
        />
      </If>

      <If condition={props.providers.oAuth.length}>
        <Separator />

        <OauthProviders
          enabledProviders={props.providers.oAuth}
          shouldCreateUser={false}
          paths={{
            callback: props.paths.callback,
            returnPath: props.paths.home,
          }}
        />
      </If>
    </>
  );
}
