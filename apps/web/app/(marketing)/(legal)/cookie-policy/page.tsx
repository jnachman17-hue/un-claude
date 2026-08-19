import { getTranslations } from 'next-intl/server';

import { SitePageHeader } from '~/(marketing)/_components/site-page-header';

import { H2, Mail, P, Prose, Table, Updated } from '../_components/legal';

export async function generateMetadata() {
  const t = await getTranslations();

  return {
    title: t('marketing.cookiePolicy'),
  };
}

/**
 * The whole value of this page is the sentence at the top, and it is the first
 * thing analytics would make false.
 *
 * Analytics arrived 19 August 2026 and this page changed in the same commit.
 * PostHog is configured with `persistence: 'memory'`, so it stores nothing on the
 * device and the no-banner property survives. If that configuration is ever
 * loosened, this page changes and the site needs a consent banner. Google
 * Analytics would have ended it outright, which is a whole system rather than a
 * paragraph. 06 row 46.
 */
async function CookiePolicyPage() {
  const t = await getTranslations();

  return (
    <div>
      <SitePageHeader
        title={t(`marketing.cookiePolicy`)}
        subtitle={t(`marketing.cookiePolicyDescription`)}
      />

      <Prose>
        <Updated date={'19 August 2026'} />

        <P>
          un-claude sets no advertising cookies and no tracking cookies. We do
          measure how many people visit, using a tool that stores nothing on your
          device at all, which is why there is no consent banner on this site.
        </P>

        <H2>What we do use</H2>
        <P>
          Two things stored on your device, both strictly necessary, and one
          measurement tool that stores nothing.
        </P>

        <Table
          headings={['What', 'Purpose', 'Lifetime']}
          rows={[
            [
              'Supabase session cookies',
              'Keep you signed in. Set only after you sign in',
              'Until you sign out or they expire',
            ],
            [
              <>
                <code className={'font-mono text-[13px]'}>uc.free-sanitises.v1</code>{' '}
                (local storage, not a cookie)
              </>,
              'Counts your free uses. Holds a number only and is never sent to us',
              'Until you clear your browser data',
            ],
            [
              'PostHog analytics',
              'Counts visits, pages read, and which steps of the tool are used. Configured to store nothing on your device, so it sets no cookie and writes no local storage',
              'Nothing is stored, so there is nothing to expire',
            ],
          ]}
        />

        <P>
          Because we set no optional cookies, there is no consent banner and
          nothing to opt out of. Signing out clears the session cookies; clearing
          your browser data clears the counter. If your browser sends a Do Not
          Track signal, we do not measure your visit at all.
        </P>

        <H2>Questions</H2>
        <P>
          <Mail />
        </P>
      </Prose>
    </div>
  );
}

export default CookiePolicyPage;
