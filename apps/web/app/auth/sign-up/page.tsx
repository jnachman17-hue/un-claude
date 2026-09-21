import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import { safeNextPath } from '@kit/auth/safe-next';
import { SignUpMethodsContainer } from '@kit/auth/sign-up';
import { Button } from '@kit/ui/button';
import { Heading } from '@kit/ui/heading';
import { Trans } from '@kit/ui/trans';

import authConfig from '~/config/auth.config';
import pathsConfig from '~/config/paths.config';

import { AuthAnalytics } from '../_components/auth-analytics';

export const generateMetadata = async () => {
  const t = await getTranslations();

  return {
    title: t('auth.signUp'),
  };
};

/**
 * WHY AN ACCOUNT EXISTS, SINCE 21 SEPTEMBER 2026: so that purchased credits
 * have somewhere to live. 04 entries 165 and 166. It used to earn three free
 * credits and this page carried a badge saying so, because everything that
 * sent a visitor here promised them. The grant is gone, the badge with it,
 * and the sentence under the heading now says the one true thing about the
 * account instead: the credits you buy are attached to it, not to a browser.
 *
 * WHERE THEY LAND AFTERWARDS. Sign-up lands on the tool by default (see
 * `afterAuth` in paths.config.ts), marked with the welcome flag so the tool
 * can show the balance. But most people arrive here because they pressed a
 * pack on /pricing and were told they need an account first
 * (`buy-button.tsx`), and sending them to the tool afterwards was "one click
 * wider than it should" be, 04 entry 109. So the pack button now sends them
 * here with `?next=/pricing`, and this page carries it through both doors:
 * `appHome` is the OAuth return path, and the kit's sign-up container reads
 * `next` off the address for the email path on its own. `safeNextPath` keeps
 * it a path on this site, the same close as on /auth/callback.
 */
export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const destination = safeNextPath(next, pathsConfig.app.afterAuth);
  const returning = destination !== pathsConfig.app.afterAuth;

  const paths = {
    callback: pathsConfig.auth.callback,
    // The welcome flag is only for the plain tool arrival; a buyer going back
    // to /pricing does not need to be told about a balance they came to add to.
    appHome: returning ? destination : `${pathsConfig.app.afterAuth}?welcome=1`,
  };

  const signIn = returning
    ? `${pathsConfig.auth.signIn}?next=${encodeURIComponent(destination)}`
    : pathsConfig.auth.signIn;

  return (
    <>
      <div className={'flex flex-col items-center gap-2 text-center'}>
        <Heading level={2} className={'tracking-tighter'}>
          <Trans i18nKey={'auth.signUpHeading'} />
        </Heading>

        <p className={'text-muted-foreground max-w-[36ch] text-[13.5px] leading-snug'}>
          The credits you buy live on your account, so they are there on any
          device and never expire.
        </p>
      </div>

      <AuthAnalytics mode={'sign-up'} />

      <SignUpMethodsContainer
        providers={authConfig.providers}
        displayTermsCheckbox={authConfig.displayTermsCheckbox}
        paths={paths}
      />

      <div className={'flex justify-center'}>
        <Button
          nativeButton={false}
          variant={'link'}
          size={'sm'}
          render={
            <Link href={signIn}>
              <Trans i18nKey={'auth.alreadyHaveAnAccount'} />
            </Link>
          }
        />
      </div>
    </>
  );
}
