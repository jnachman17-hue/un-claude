import { getTranslations } from 'next-intl/server';

import { SitePageHeader } from '~/(marketing)/_components/site-page-header';

import {
  H2,
  Lead,
  List,
  Mail,
  P,
  Prose,
  Table,
  Updated,
} from '../_components/legal';

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
 * ANALYTICS ARRIVED 19 AUGUST 2026 and this page changed in the same commit,
 * which was the whole discipline: a privacy policy claiming no tracking while
 * tracking is a false statement in a legal document. 06 row 46. THE CONTACT
 * PAGE ARRIVED 20 AUGUST 2026 and was handled the same way: see "When you write
 * to us" below and 04 entry 107. The interesting fact there is that the page
 * itself collects nothing, because the button composes a draft in the
 * visitor's own mail app, and the policy has to say so rather than describe a
 * form submission that never happens.
 *
 * The claim that remains, and that must stay true: PostHog is configured to store
 * NOTHING on the visitor's device. If that configuration ever changes, this page
 * and the cookie policy change with it, and the site needs a consent banner.
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
        <Updated date={'20 August 2026'} />

        <H2>The short version</H2>
        <Lead>
          We do not keep what you give us. Text you paste and files you upload
          are processed and returned, not stored. We do not use your content to
          train anything. We run no advertising and no advertising trackers. We
          measure how many people visit, which pages they read, and which steps
          of the tool they use, with a tool that stores nothing on your device.
          We record that a scan ran and what kind of mark it found. Never the
          text or the file it ran on. If you create an account, we hold your
          email address and name and nothing else. If you write to us, we use
          your address to reply and for nothing else.
        </Lead>

        <H2>What happens to text and files you submit</H2>
        <P>
          When you paste text or upload a document, it is sent to our processing
          engine, cleaned, and returned to you. It is not written to our
          database and we keep no copy. Uploaded files exist briefly as a
          temporary file while being processed and are discarded when the
          request finishes.
        </P>
        <P>
          One exception, because it is the only time your text leaves our
          systems. The optional rewriting step, the part that addresses
          statistical watermarks, cannot run on our own servers. Your text is
          sent to a third-party language model, Mistral Small, reached through
          Vercel AI Gateway, which rewrites it and returns it. This happens only
          when you run the rewrite. Scanning, invisible-character removal, and
          file metadata cleaning never leave our infrastructure.
        </P>
        <P>
          We do not use your content to train models, to improve detection, or
          for any purpose other than returning your result.
        </P>

        <H2>What we store if you create an account</H2>
        <P>An account is optional. The tool works without one.</P>
        <P>
          If you create one, we store your email address, your name, and a
          profile picture URL if your sign-in method supplies one, along with
          the dates your account was created and last updated. Database access
          rules restrict each account to its own record.
        </P>
        <P>
          If you sign in with Google, Google gives us your email address, your
          name, and your profile picture. We use them to create your account, to
          show you who is signed in, and to send you service messages about your
          account. We do not receive, request, or store anything else from your
          Google account, and we never share this information with anyone. You
          can revoke our access at any time at{' '}
          <a
            href={'https://myaccount.google.com/permissions'}
            target={'_blank'}
            rel={'noopener noreferrer'}
            className={
              'text-foreground font-medium underline underline-offset-2'
            }
          >
            myaccount.google.com/permissions
          </a>
          .
        </P>
        <P>
          If you sign in with a password, we store your email address and a
          scrambled version of your password that cannot be reversed.
        </P>

        <H2>When you write to us</H2>
        <P>
          The contact page does not send anything to us. When you press Send
          message it builds a draft in your own email app, filled in with the
          subject and message you typed, and your app sends it. Nothing you type
          on that page reaches us, and nothing is stored anywhere, until you
          send it yourself.
        </P>
        <P>
          What arrives is an ordinary email. We use your address to reply to you
          and for nothing else: we do not add it to a mailing list, and we do
          not connect it to any account or to anything you have scanned. Our
          inbox is a Gmail account, so Google holds those messages the way it
          holds any mail sent to a Gmail address. We keep correspondence only
          for as long as it is useful for answering you, and you can ask us to
          delete it.
        </P>

        <H2>Cookies and browser storage</H2>
        <P>We use no advertising cookies, and no advertising trackers.</P>
        <P>
          We do measure visits, using PostHog. It is configured to store nothing
          at all on your device: no cookies, no local storage. That is why this
          site has no cookie consent banner. It means we cannot recognise you
          between visits, which we accept as the price of not tracking you. If
          your browser sends a Do Not Track signal, we do not measure you at
          all.
        </P>
        <P>
          We also record which steps of the tool you use, so we can see where it
          is going wrong: that a scan finished, how many hidden characters it
          found, that a clean started or failed, that you reached the point
          where free uses run out. These are counts and yes-or-no answers about
          the tool, never about you and never about what you submitted. File
          names are reduced to a file type before anything is recorded, and
          lengths and timings are recorded as ranges rather than exact figures.
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
              , counts how many free uses you have taken. It holds a number
              only, never leaves your browser, and clearing your browser data
              removes it.
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
            [
              'Supabase',
              'Stores accounts and handles sign-in',
              'Your account record',
            ],
            [
              'PostHog',
              'Counts visits, which pages are read, and which steps of the tool are used',
              'Pages viewed, rough location from IP address, browser and device type, and which actions you took in the tool with counts of what was found. Nothing stored on your device, and never the content you submit, your file names, or your text',
            ],
            [
              'Mistral, via Vercel AI Gateway',
              'Performs the optional rewrite',
              'The text you submitted for rewriting, at the moment it runs',
            ],
            [
              'Google',
              'Runs the inbox you write to, and sign-in if you choose it',
              'Any email you send us, and that you signed in to our site',
            ],
          ]}
        />
        <P>
          We do not sell your information, share it for advertising, or transfer
          it to anyone not listed above.
        </P>

        <H2>Your rights</H2>
        <P>
          Wherever you live, you may ask us to show you what we hold about you,
          correct it, or delete it. Deleting your account removes your account
          record, and we will delete any correspondence you have sent us on
          request. Because we do not retain submitted content, there is nothing
          else to delete. Write to us at the address below and we will respond
          within 30 days.
        </P>
        <P>
          If you are in the UK or EU: our lawful basis is performance of a
          contract for account data, and legitimate interest in operating a
          working service for server logs.
        </P>

        <H2>Children</H2>
        <P>
          Un-Claude is not intended for anyone under 18 and we do not knowingly
          collect their information.
        </P>

        <H2>Changes</H2>
        <P>
          If we change this policy we will update the date above. Material
          changes to how we handle your content will be announced on the site.
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
