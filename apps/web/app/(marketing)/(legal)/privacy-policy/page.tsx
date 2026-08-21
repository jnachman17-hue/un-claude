import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import { SitePageHeader } from '~/(marketing)/_components/site-page-header';

import { H2, Lead, Mail, P, Prose, Table, Updated } from '../_components/legal';

export async function generateMetadata() {
  const t = await getTranslations();

  return {
    title: t('marketing.privacyPolicy'),
    /*
     * ITS OWN DESCRIPTION, ADDED 22 August 2026. All three legal pages
     * inherited the site-wide one, so a search result for this page read
     * "Scan text and files free for hidden AI watermarks", which describes
     * the product rather than the page. Written here rather than in
     * `lib/root-metdata.ts`, which belongs to the SEO session.
     */
    description:
      'What Un-Claude does with your text and files. Nothing you submit is kept, the optional rewrite is the only thing that leaves, and here is what we store.',
  };
}

/**
 * Written from the code rather than from a template. Every claim is checkable:
 * retention against clean.py and the route handlers, account fields against the
 * Supabase schema, browser storage against the clean route and credits.ts, and
 * the absence of trackers against a grep of the whole application.
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
 * REWRITTEN 21 AUGUST 2026, from the legal reconciliation in
 * `docs/session-notes/legal-reconciliation.md`, sections 1 and 2B. The rule was
 * followed on 19 August and not followed on 20 and 21 August: the credit ledger
 * shipped, `free-uses.ts` was deleted and anonymous guest sessions arrived, and
 * carefully verified sentences went false in the same week they were written.
 * What changed here, and why:
 *
 *   - It documented `uc.free-sanitises.v1` in local storage. That key no longer
 *     exists anywhere in the application.
 *   - It said session cookies are set "only after you sign in". Untrue since
 *     guest sessions arrived: an anonymous Supabase session and the `uc-guest`
 *     cookie are now placed on the device of anyone who presses the button.
 *   - It said we hold an account's email and name "and nothing else". The
 *     credit ledger holds a permanent row per job. No content, but a history.
 *   - Cloudflare Turnstile runs on every page and appeared nowhere.
 *   - It named "Mistral Small", a value read from an environment variable that
 *     does not live in this repository. Changing one Vercel setting silently
 *     falsified a legal page. It now names the provider and commits to a rule
 *     instead: the table is updated before a new company sees submitted text.
 *
 * THE ACCOUNT DELETION SENTENCES ARE NOW THE STRONGER ONES, 21 AUGUST 2026,
 * and this is the change the previous comment here said to make. Two paragraphs
 * moved: the credit-history retention paragraph, and the deletion paragraph
 * under "Your rights". They used to say that deleting your account removes the
 * sign-in but does not by itself erase the record, and to write in for erasure.
 * That was accurate. The chain had three links and only two existed:
 * `credit_ledger.account_id` cascaded from `public.accounts`, but
 * `public.accounts.id` carried no foreign key to `auth.users` at all, so
 * `auth.admin.deleteUser` in `delete-personal-account.service.ts` destroyed the
 * sign-in and left the account row, holding the person's email address and
 * name, and the whole ledger standing.
 *
 * `20260821130000_account_deletion_cascade.sql` adds the missing link, so the
 * page can now promise the simple thing: deleting your account deletes your
 * account record and your entire credit history with it. Written up with the
 * before-and-after proof in `docs/session-notes/account-deletion-fix.md`.
 *
 * THESE TWO PARAGRAPHS ARE ONLY TRUE ONCE THAT MIGRATION IS APPLIED TO THE
 * HOSTED DATABASE. It is SQL a person pastes into the Supabase editor, and it
 * is not carried by a deploy. So the order is: run the SQL first, deploy
 * second. Shipping this page ahead of the migration puts a false statement in a
 * legal document, which is the exact failure 06 row 46 exists to prevent.
 * `node scripts/verify-account-deletion.mjs` from `apps/web` answers which
 * state the database is actually in: it creates a throwaway account, deletes
 * it through the real path, prints every surviving row, and cleans up after
 * itself. It exits 0 when this page is telling the truth.
 *
 * The claim that remains, and that must stay true: PostHog is configured to store
 * NOTHING on the visitor's device. If that configuration ever changes, this page
 * and the cookie policy change with it, and the site needs a consent banner.
 *
 * STILL OUTSTANDING, deliberately absent rather than forgotten: there is no
 * named data controller on this page, because there is no legal entity and
 * naming a person is not this session's call. 04 entry 54, decision D1.
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
        <Updated date={'21 August 2026'} />

        <H2>The short version</H2>
        <Lead>
          We do not keep what you give us. Text you paste and files you upload
          are processed and returned, not stored. We do not use your content to
          train anything. We run no advertising and no advertising trackers.
          There is one exception and we would rather lead with it than bury it:
          if you use the optional rewrite, your text is sent to another
          company&rsquo;s AI model to be rewritten, and comes straight back.
          Nothing else you submit ever leaves our systems.
        </Lead>
        <P>
          We measure how many people visit, which pages they read, and which
          steps of the tool they use, with a tool that stores nothing on your
          device. We keep a record of each job you run: the date, whether it was
          a file or pasted text, how many words it had, and what it cost you.
          That record is your credit history and it is what a balance is made
          of. Never the text or the file itself. If you create an account, we
          hold your email address and name. If you write to us, we use your
          address to reply and for nothing else.
        </P>

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
          sent to a third-party language model, reached through Vercel AI
          Gateway, which rewrites it and returns it. Today that model comes from
          Mistral. This happens only when you run the rewrite. Scanning,
          invisible-character removal, and file metadata cleaning never leave
          our infrastructure.
        </P>
        <P>
          The companies that can see text you submit are the ones named in the
          table below. If we ever move the rewrite to a different provider, we
          update that table before the change goes live, so the list is a
          promise about who sees your text rather than a snapshot of who saw it
          last week.
        </P>
        <P>
          We do not use your content to train models, to improve detection, or
          for any purpose other than returning your result.
        </P>

        <H2>What we keep a record of, and for how long</H2>
        <P>
          We keep no copy of what you submit. We do keep a record that you
          submitted something, because that is how a credit balance works.
        </P>
        <P>
          Each time you clean something, one line is added to your credit
          history. It records the date and time, whether the input was a file or
          pasted text, how many words it contained, and how many credits it
          cost, along with what the run cost us to perform. If you have an
          account you can read your own history at any time on your account
          page. It never contains your text, your file, or the name of your
          file.
        </P>
        <P>
          We keep that history for as long as you have an account. Delete your
          account and your whole history is deleted with it, automatically and
          at the same moment. You do not have to ask us.
        </P>
        <P>
          Our servers also keep ordinary technical logs of each request: the
          time, how long it took, the size of the input, the file type, and how
          many words it had. These carry no file names and no content. They sit
          with our hosting company, which keeps them for a limited period set by
          its platform rather than by us.
        </P>

        <H2>What we store about your account</H2>
        <P>
          An account is optional and the tool works without one. But the moment
          you clean something, even signed out, we create a guest account for
          your browser so your free credits have somewhere to live. It holds no
          name, no email address and nothing about you: only an identifier, your
          credit balance, and the history described above. Your browser
          remembers it with a cookie called{' '}
          <code className={'text-foreground font-mono text-[13px]'}>
            uc-guest
          </code>{' '}
          that lasts a year. Clear your browser data and it is gone for good,
          along with any credits on it, because we have no way to connect it
          back to you.
        </P>
        <P>
          If you create a real account, we store your email address, your name,
          and a profile picture URL if your sign-in method supplies one, along
          with the dates your account was created and last updated. Any credits
          left on your guest account move across to it. Database access rules
          restrict each account to its own record.
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
          Three things are stored on your device, and all three are there to run
          the tool you asked for: a guest session, the{' '}
          <code className={'text-foreground font-mono text-[13px]'}>
            uc-guest
          </code>{' '}
          cookie that finds it again so your free credits survive until you come
          back, and, once you sign in, the session cookies that keep you signed
          in. The full list, with lifetimes, is on the{' '}
          <Link
            href={'/cookie-policy'}
            className={
              'text-foreground font-medium underline underline-offset-2'
            }
          >
            cookie policy
          </Link>
          .
        </P>
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
          where free credits run out. These are counts and yes-or-no answers
          about the tool, never about you and never about what you submitted.
          File names are reduced to a file type before anything is recorded, and
          lengths and timings are recorded as ranges rather than exact figures.
        </P>
        <P>
          Every page also runs a background check from Cloudflare that tells
          real people apart from automated scripts. It is there because free
          credits are worth money and would otherwise be farmed by a program. It
          sees your IP address and some ordinary details about your browser, and
          it stores nothing on your device under our domain. It is not
          advertising and it does not follow you around the internet.
        </P>

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
              'Stores accounts and credit balances, and handles sign-in',
              'Your account record and your credit history',
            ],
            [
              'Cloudflare',
              'Tells real visitors apart from automated scripts, on every page',
              'Your IP address and ordinary details about your browser. No content, and nothing about what you submitted',
            ],
            [
              'PostHog',
              'Counts visits, which pages are read, and which steps of the tool are used',
              'Pages viewed, rough location from IP address, browser and device type, and which actions you took in the tool with counts of what was found. Nothing stored on your device, and never the content you submit, your file names, or your text',
            ],
            [
              'Mistral, reached through Vercel AI Gateway',
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
          All of these companies are based in the United States, so if you are
          in the UK or EU, your information is processed there.
        </P>
        <P>
          We do not sell your information, share it for advertising, or transfer
          it to anyone not listed above.
        </P>

        <H2>Your rights</H2>
        <P>
          Wherever you live, you may ask us to show you what we hold about you,
          correct it, delete it, receive a copy of it in a portable form, or
          object to how we use it. Write to us at the address below and we will
          respond within 30 days. We do not currently offer a one-click download
          of your data. Ask us and we will send it to you.
        </P>
        <P>
          You can delete your account yourself at any time, from your account
          settings. Deleting your account deletes your account record and your
          entire credit history with it. Your email address, your name and every
          line of your history are removed from our database in that moment, not
          marked for removal later, and your sign-in is destroyed with them.
          Because we do not retain submitted content, there is nothing else to
          delete.
        </P>
        <P>
          Deleting your account also ends any credits still on it, and unused
          credits are not refunded on deletion. If you want a refund, ask for it
          first.
        </P>
        <P>
          If you are in the UK or EU: our lawful basis is performance of a
          contract for your account, your credits and the rewrite, and
          legitimate interest in keeping the service working and free from
          abuse, which covers our server logs, the anti-script check and our
          measurement of how the site is used. You have the right to complain to
          a data protection authority: in the UK that is the Information
          Commissioner&rsquo;s Office, and in the EU it is the authority in your
          own country.
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
