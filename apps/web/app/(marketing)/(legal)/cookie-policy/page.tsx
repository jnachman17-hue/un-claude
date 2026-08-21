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
 *
 * REWRITTEN 21 August 2026, from the legal reconciliation in
 * `docs/session-notes/legal-reconciliation.md`. Three things on this page had
 * gone false in the space of a day, and every one of them is a commit that did
 * not carry its sentence with it:
 *
 *   - It documented `uc.free-sanitises.v1` in local storage. That key no longer
 *     exists: `free-uses.ts` was deleted when the credit ledger shipped.
 *   - It said Supabase cookies are set "only after you sign in". Untrue since
 *     anonymous guest sessions arrived: something is now set for every visitor
 *     who uses the tool, signed in or not. This was the one that mattered.
 *   - Cloudflare Turnstile runs on every page and appeared nowhere.
 *
 * The Turnstile row is measured, not assumed. Read off the live homepage on 21
 * August: `localStorage` and `sessionStorage` are both empty, and the only
 * script from Cloudflare is the Turnstile API itself. It stores nothing on the
 * device under our domain, so that is what the row says and no more.
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
        <Updated date={'21 August 2026'} />

        <P>
          Un-Claude sets no advertising cookies and no tracking cookies. We do
          measure how many people visit, using a tool that stores nothing on your
          device at all, which is why there is no consent banner on this site.
        </P>

        <H2>What we do use</H2>
        <P>
          Three things stored on your device, all of them needed to run the tool
          you asked for, and two measurement and security tools that store
          nothing.
        </P>

        <Table
          headings={['What', 'Purpose', 'Lifetime']}
          rows={[
            [
              'A guest session',
              'The first time you clean something, we create a guest account for your browser so your free credits have somewhere to live. You are not signed in and we do not know who you are',
              'Until you clear your browser data',
            ],
            [
              <>
                <code className={'font-mono text-[13px]'}>uc-guest</code> (a
                cookie)
              </>,
              'Holds the identity of that guest account, so your credits are still there when you come back, and so they follow you if you later create a real account. It holds one identifier and nothing else, and no script on the page can read it',
              'One year, or until you clear your browser data',
            ],
            [
              'Supabase session cookies',
              'Keep you signed in, once you sign in',
              'Until you sign out or they expire',
            ],
            [
              'PostHog analytics',
              'Counts visits, pages read, and which steps of the tool are used. Configured to store nothing on your device, so it sets no cookie and writes no local storage',
              'Nothing is stored, so there is nothing to expire',
            ],
            [
              'Cloudflare Turnstile',
              'A background check that tells people apart from automated scripts, so free credits cannot be farmed by a program. It runs on every page and sees your IP address and ordinary details about your browser',
              'Nothing is stored on your device by this site',
            ],
          ]}
        />

        <P>
          The first three are what the industry calls strictly necessary: they
          exist to deliver the thing you asked for, they carry no advertising,
          and they are not shared with anyone. That is why there is no consent
          banner and nothing to opt out of.
        </P>

        <P>
          Signing out clears the session cookies. Clearing your browser data
          clears everything on this page, including your guest credits. We have
          no way to restore them, because we have no way to know they were
          yours. If your browser sends a Do Not Track signal, we do not measure
          your visit at all.
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
