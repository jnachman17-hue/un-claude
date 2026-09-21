import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import { safeNextPath } from '@kit/auth/safe-next';
import { SignInMethodsContainer } from '@kit/auth/sign-in';
import { Button } from '@kit/ui/button';
import { Heading } from '@kit/ui/heading';
import { Trans } from '@kit/ui/trans';

import authConfig from '~/config/auth.config';
import pathsConfig from '~/config/paths.config';

import { AuthAnalytics } from '../_components/auth-analytics';

export const generateMetadata = async () => {
  const t = await getTranslations();

  return {
    title: t('auth.signIn'),
  };
};

/**
 * `next` IS CARRIED THROUGH BOTH DOORS. The kit's sign-in container already
 * reads it off the address for the password path, but the Google button
 * returns to `paths.home`, so a buyer who pressed a pack on /pricing, was
 * sent to sign-up, and chose "already have an account" would sign in with
 * Google and land on the tool instead of back at the packs. 04 entry 166,
 * 21 September 2026: an account exists so purchases have somewhere to live,
 * so the way back to the purchase has to survive every door. `safeNextPath`
 * keeps it a path on this site.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  const paths = {
    callback: pathsConfig.auth.callback,
    home: safeNextPath(next, pathsConfig.app.afterAuth),
  };

  return (
    <>
      <div className={'flex flex-col items-center'}>
        <Heading level={2} className={'tracking-tighter'}>
          <Trans
            i18nKey={'auth.signInHeading'}
            values={{ productName: process.env.NEXT_PUBLIC_PRODUCT_NAME }}
          />
        </Heading>
      </div>

      <AuthAnalytics mode={'sign-in'} />

      <SignInMethodsContainer paths={paths} providers={authConfig.providers} />

      <div className={'flex justify-center'}>
        <Button
          nativeButton={false}
          variant={'link'}
          size={'sm'}
          render={
            <Link
              href={
                paths.home === pathsConfig.app.afterAuth
                  ? pathsConfig.auth.signUp
                  : `${pathsConfig.auth.signUp}?next=${encodeURIComponent(paths.home)}`
              }
            >
              <Trans i18nKey={'auth.doNotHaveAccountYet'} />
            </Link>
          }
        />
      </div>
    </>
  );
}

