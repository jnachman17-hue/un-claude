import { getTranslations } from 'next-intl/server';

import { SitePageHeader } from '~/(marketing)/_components/site-page-header';

import { H2, Lead, List, Mail, P, Prose, Table, Updated } from '../_components/legal';

export async function generateMetadata() {
  const t = await getTranslations();

  return {
    title: t('marketing.privacyPolicy'),
  };
}

/**
 * Written from the code rather than from a template. Every claim is checkable:
 * retention against clean.py and the route handlers, account fields against the
 * Supabase schema, browser storage against free-uses.ts, and the absence of
 * trackers against a grep of the whole application.
 *
 * THE TRACKING CLAIM IS THE FRAGILE ONE. "We run no advertising or tracking" is
 * true today and stops being true the moment analytics is added. That edit ships
 * in the SAME deployment as the analytics, never after it. 06 row 46.
 */
async function PrivacyPolicyPage() {
  const t = await getTranslations();

  return (
    <div>
      <SitePageHeader
        title={t('marketing.privacyPolicy')}
        subtitle={t('marketing.privacyPolicyDescription')}
      />

      <Prose>
        <Updated date={'19 August 2026'} />

        <H2>The short version</H2>
        <Lead>
          We do not keep what you give us. Text you paste and files you upload are
          processed and returned, not stored. We do not use your content to train
          anything. We run no advertising or tracking. If you create an account,
          we hold your email address and name and nothing else.
        </Lead>

        <H2>What happens to text and files you submit</H2>
        <P>
          When you paste text or upload a document, it is sent to our processing
          engine, cleaned, and returned to you. It is not written to our database
          and we keep no copy. Uploaded files exist briefly as a temporary file
          while being processed and are discarded when the request finishes.
        </P>
        <P>
          One exception, because it is the only time your text leaves our systems.
          The optional rewriting step, the part that addresses statistical
          watermarks, cannot run on our own servers. Your text is sent to a
          third-party language model, Mistral Small, reached through Vercel AI
          Gateway, which rewrites it and returns it. This happens only when you
          run the rewrite. Scanning, invisible-character removal, and file
          metadata cleaning never leave our infrastructure.
        </P>
        <P>
          We do not use your content to train models, to improve detection, or for
          any purpose other than returning your result.
        </P>

        <H2>What we store if you create an account</H2>
        <P>An account is optional. The tool works without one.</P>
        <P>
          If you create one, we store your email address, your name, and a profile
          picture URL if your sign-in method supplies one, along with the dates
          your account was created and last updated. Database access rules
          restrict each account to its own record.
        </P>
        <P>
          If you sign in with Google, Google gives us your email address, your
          name, and your profile picture. We use them to create your account, to
          show you who is signed in, and to send you service messages about your
          account. We do not receive, request, or store anything else from your
          Google account, and we never share this information with anyone. You can
          revoke our access at any time at{' '}
          <a
            href={'https://myaccount.google.com/permissions'}
            target={'_blank'}
            rel={'noopener noreferrer'}
            className={'text-foreground font-medium underline underline-offset-2'}
          >
            myaccount.google.com/permissions
          </a>
          .
        </P>
        <P>
          If you sign in with a password, we store your email address and a
          scrambled version of your password that cannot be reversed.
        </P>

        <H2>Cookies and browser storage</H2>
        <P>
          We use no advertising or tracking cookies. We have no third-party
          trackers.
        </P>
        <List
          items={[
            <>
              Session cookies, set only after you sign in, keep you signed in.
              Signing out removes them.
            </>,
            <>
              One item of local browser storage,{' '}
              <code className={'text-foreground font-mono text-[13px]'}>
                uc.free-sanitises.v1
              </code>
              , counts how many free uses you have taken. It holds a number only,
              never leaves your browser, and clearing your browser data removes it.
            </>,
          ]}
        />

        <H2>Who else is involved</H2>
        <Table
          headings={['Who', 'What they do', 'What they see']}
          rows={[
            [
              'Vercel',
              'Hosts the site and runs the processing',
              'Standard server logs: IP address, time, and which page was requested',
            ],
            ['Supabase', 'Stores accounts and handles sign-in', 'Your account record'],
            [
              'Mistral, via Vercel AI Gateway',
              'Performs the optional rewrite',
              'The text you submitted for rewriting, at the moment it runs',
            ],
            ['Google', 'Only if you choose Google sign-in', 'That you signed in to our site'],
          ]}
        />
        <P>
          We do not sell your information, share it for advertising, or transfer it
          to anyone not listed above.
        </P>

        <H2>Your rights</H2>
        <P>
          Wherever you live, you may ask us to show you what we hold about you,
          correct it, or delete it. Deleting your account removes your account
          record. Because we do not retain submitted content, there is nothing else
          to delete. Write to us at the address below and we will respond within 30
          days.
        </P>
        <P>
          If you are in the UK or EU: our lawful basis is performance of a contract
          for account data, and legitimate interest in operating a working service
          for server logs.
        </P>

        <H2>Children</H2>
        <P>
          un-claude is not intended for anyone under 18 and we do not knowingly
          collect their information.
        </P>

        <H2>Changes</H2>
        <P>
          If we change this policy we will update the date above. Material changes
          to how we handle your content will be announced on the site.
        </P>

        <H2>Contact</H2>
        <P>
          <Mail />
        </P>
      </Prose>
    </div>
  );
}

export default PrivacyPolicyPage;
