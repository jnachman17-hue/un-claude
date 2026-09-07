'use client';

import dynamic from 'next/dynamic';

import type { AbstractIntlMessages } from 'next-intl';
import { ThemeProvider } from 'next-themes';

import { CaptchaProvider } from '@kit/auth/captcha/client';
import { I18nClientProvider } from '@kit/i18n/provider';
import { If } from '@kit/ui/if';
import { VersionUpdater } from '@kit/ui/version-updater';

import { AnalyticsProvider } from '~/components/analytics-provider';
import { CookieConsent } from '~/components/cookie-consent';
import { GoogleTag } from '~/components/google-tag';
import { AuthProvider } from '~/components/auth-provider';
import authConfig from '~/config/auth.config';
import featuresFlagConfig from '~/config/feature-flags.config';

import { ReactQueryProvider } from './react-query-provider';

const captchaSiteKey = authConfig.captchaTokenSiteKey;

const CaptchaTokenSetter = dynamic(async () => {
  if (!captchaSiteKey) {
    return Promise.resolve(() => null);
  }

  const { CaptchaTokenSetter } = await import('@kit/auth/captcha/client');

  return {
    default: CaptchaTokenSetter,
  };
});

export function RootProviders({
  locale,
  messages,
  children,
}: React.PropsWithChildren<{
  // The locale to use for the app
  locale: string;
  // The i18n messages
  messages: AbstractIntlMessages;
}>) {
  return (
    <ReactQueryProvider>
      <I18nClientProvider locale={locale} messages={messages}>
        <CaptchaProvider>
          <CaptchaTokenSetter siteKey={captchaSiteKey} />

          <AnalyticsProvider />
          <GoogleTag />
          <CookieConsent />

          <AuthProvider>
            {/* Dark mode retired, 20 August 2026: Jon's instruction was
                direct ("get rid of dark version... we don't need dark
                version anymore"). `enableSystem` is off so the OS
                preference can no longer flip the site into it, and the
                toggle that let a visitor switch manually is gone from the
                header. The `dark:` utility classes elsewhere in the
                codebase are left in place rather than stripped file by
                file — with no `.dark` class ever applied, they are inert,
                and removing hundreds of them individually risked breaking
                something for no visible gain. */}
            <ThemeProvider
              attribute="class"
              enableSystem={false}
              disableTransitionOnChange
              defaultTheme={'light'}
              forcedTheme={'light'}
              enableColorScheme={false}
            >
              {children}
            </ThemeProvider>
          </AuthProvider>
        </CaptchaProvider>

        <If condition={featuresFlagConfig.enableVersionUpdater}>
          <VersionUpdater />
        </If>
      </I18nClientProvider>
    </ReactQueryProvider>
  );
}
