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
 * Setting no optional cookies is why there is no consent banner. A cookieless
 * measurement tool keeps that property and costs one line here. Google Analytics
 * ends it and creates a consent obligation in the EU and UK, which is a whole
 * system rather than a paragraph. 06 row 46.
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
          un-claude uses no advertising or tracking cookies, and we have no
          third-party trackers.
        </P>

        <H2>What we do use</H2>
        <P>Two things, both strictly necessary.</P>

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
          ]}
        />

        <P>
          Because we set no optional cookies, there is no consent banner and
          nothing to opt out of. Signing out clears the session cookies; clearing
          your browser data clears the counter.
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
