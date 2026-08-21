import { cacheLife } from 'next/cache';

import { Footer } from '@kit/ui/marketing';
import { Trans } from '@kit/ui/trans';

import { AppLogo } from '~/components/app-logo';
import appConfig from '~/config/app.config';

/**
 * The copyright year is an unstable value, and `<Suspense>` does not fix those,
 * only uncached data. It is the same for every visitor and changes once a year,
 * so caching it is the right tool. `await connection()` would also silence the
 * error, but it would make the footer render per request and take every
 * marketing page's static shell down with it.
 */
async function getCopyrightYear() {
  'use cache';

  cacheLife('days');

  return new Date().getFullYear();
}

export async function SiteFooter() {
  const year = await getCopyrightYear();

  return (
    <Footer
      logo={<AppLogo className="w-[85px] md:w-[95px]" />}
      /*
       * THE TAGLINE WAS REWRITTEN, NOT CUT, 20 August 2026. `04` entry 103.
       * The words live in `marketing.json` under `footerDescription`.
       */
      description={<Trans i18nKey="marketing.footerDescription" />}
      copyright={
        <Trans
          i18nKey="marketing.copyright"
          values={{
            product: appConfig.name,
            year,
          }}
        />
      }
      /*
       * THE FAQ LINK IS GONE, 20 August 2026, with the /faq route it pointed
       * at. `04` entry 102. The FAQ a visitor wants is the one at the bottom of
       * the landing page. Contact took the slot it left, which keeps this
       * column four rows deep and the three columns even.
       *
       * SOCIAL LINKS ARE NOT HERE ON PURPOSE. Jon asked for them and has not
       * given the handles, and a footer full of links to nothing is worse than a
       * footer without them. Add a fourth section here when the accounts exist.
       */
      sections={[
        {
          heading: <Trans i18nKey="marketing.product" />,
          links: [
            {
              href: '/how-it-works',
              label: <Trans i18nKey="marketing.howItWorks" />,
            },
            {
              href: '/capabilities',
              label: <Trans i18nKey="marketing.capabilities" />,
            },
            {
              href: '/mission',
              label: <Trans i18nKey="marketing.mission" />,
            },
            {
              href: '/contact',
              label: <Trans i18nKey="marketing.contact" />,
            },
          ],
        },
        {
          heading: 'Account',
          links: [
            {
              href: '/auth/sign-in',
              label: <Trans i18nKey="auth.signIn" />,
            },
            {
              href: '/auth/sign-up',
              label: <Trans i18nKey="auth.signUp" />,
            },
          ],
        },
        {
          heading: <Trans i18nKey="marketing.legal" />,
          links: [
            {
              href: '/terms-of-service',
              label: <Trans i18nKey="marketing.termsOfService" />,
            },
            {
              href: '/privacy-policy',
              label: <Trans i18nKey="marketing.privacyPolicy" />,
            },
            {
              href: '/cookie-policy',
              label: <Trans i18nKey="marketing.cookiePolicy" />,
            },
          ],
        },
      ]}
    />
  );
}
