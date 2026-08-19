import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import { SitePageHeader } from '~/(marketing)/_components/site-page-header';

import { H2, Lead, List, Mail, P, Prose, Updated } from '../_components/legal';

export async function generateMetadata() {
  const t = await getTranslations();

  return {
    title: t('marketing.termsOfService'),
  };
}

/**
 * THERE IS DELIBERATELY NO GOVERNING LAW SECTION.
 *
 * There is no company and no legal entity behind un-claude, so there is nothing
 * to name as a party and nowhere to seat a dispute. Inventing a jurisdiction
 * would be a false statement in the one document that most needs to be true.
 * It gets added when an entity exists, alongside payments. 04 entry 54.
 *
 * The "currently free and no payment method is collected" sentence in Payment is
 * the other line with an expiry on it. 06 row 46.
 */
async function TermsOfServicePage() {
  const t = await getTranslations();

  return (
    <div>
      <SitePageHeader
        title={t(`marketing.termsOfService`)}
        subtitle={t(`marketing.termsOfServiceDescription`)}
      />

      <Prose>
        <Updated date={'19 August 2026'} />

        <H2>What un-claude does</H2>
        <P>
          un-claude finds and removes marks that identify text and documents as
          machine-generated. It works in three parts:
        </P>
        <List
          items={[
            <>
              <span className={'text-foreground font-medium'}>
                Invisible characters.
              </span>{' '}
              Zero-width characters, unusual spaces, and direction marks hidden
              between visible words.
            </>,
            <>
              <span className={'text-foreground font-medium'}>File metadata.</span>{' '}
              Provenance and generator information stored inside a file’s wrapper,
              including C2PA and EXIF data. This requires a file and cannot apply to
              pasted text.
            </>,
            <>
              <span className={'text-foreground font-medium'}>
                Statistical rewriting.
              </span>{' '}
              An optional step that rewrites text to disturb patterns in word
              choice.
            </>,
          ]}
        />

        <H2>What we can and cannot promise</H2>
        <P>
          This is the most important section and we would rather you read it than
          skip it.
        </P>
        <P>
          The first two are checkable. We can tell you which characters were found,
          where they were, and show you a file before and after. When we say a mark
          was removed, that is a fact you can verify for yourself.
        </P>
        <Lead>
          The rewriting step is best effort and we cannot verify it. No public
          detector for statistical watermarks exists, so neither we nor anyone else
          can confirm whether one was removed. We show you the text before and
          after and label the result unverified. Anyone who guarantees this is
          telling you something nobody can currently know.
        </Lead>
        <P>
          We make no promise that any particular detection tool will or will not
          flag your content, and we are not responsible for decisions anyone makes
          about it.
        </P>
        <P>The service is provided as it is, without warranties of any kind.</P>

        <H2>Your content is yours</H2>
        <P>
          You keep all rights to anything you submit. We claim no ownership and no
          licence beyond what is needed to process your request and return the
          result. We do not retain it. See the{' '}
          <Link
            href={'/privacy-policy'}
            className={'text-foreground font-medium underline underline-offset-2'}
          >
            Privacy Policy
          </Link>
          .
        </P>
        <P>You are responsible for having the right to submit what you submit.</P>

        <H2>Acceptable use</H2>
        <P>
          un-claude is for your own writing and your own files. People use it
          because they do not want their work carrying hidden data about the tool
          that produced it, because invisible characters break formatting and
          search, because file metadata reveals more than they intended to share,
          and because automated detectors are unreliable and flag human writing
          every day.
        </P>
        <P>
          It is not for passing off machine-generated work as your own where
          somebody has asked you not to. Do not use un-claude to deceive a school,
          an employer, a publisher, a client, or anyone else who is relying on your
          word about how something was made. If a person or institution has a rule
          about AI-assisted work, that rule is between you and them, and this tool
          does not change it.
        </P>
        <P>
          You also agree not to use un-claude to break the law, to infringe
          anyone’s rights, or to attack, overload, or reverse-engineer the service.
        </P>

        <H2>Accounts and free use</H2>
        <P>
          You may use the tool without an account, subject to a free allowance.
          That allowance is enforced in your browser and is not a security measure;
          we may replace it with stronger limits at any time.
        </P>
        <P>
          If you create an account you must give accurate information and keep your
          credentials secure. You must be at least 18 years old.
        </P>

        <H2>Payment</H2>
        <P>
          The service is currently free and no payment method is collected. If we
          introduce paid credits, the terms will be shown to you before you are
          asked to pay, and nothing will be charged without your agreement.
        </P>

        <H2>Availability</H2>
        <P>
          We may change, suspend, or discontinue any part of the service at any
          time. We do not guarantee uninterrupted availability.
        </P>

        <H2>Liability</H2>
        <P>
          To the fullest extent the law allows, we are not liable for indirect or
          consequential losses, loss of data, or loss of opportunity arising from
          your use of un-claude. Where liability cannot be excluded, it is limited
          to the greater of the amount you have paid us in the previous six months
          or 50 US dollars.
        </P>
        <P>Nothing here excludes liability that cannot lawfully be excluded.</P>

        <H2>Ending your use</H2>
        <P>
          You may stop using un-claude and delete your account at any time. We may
          suspend or end access if these terms are breached.
        </P>

        <H2>Changes</H2>
        <P>
          We may update these terms. Continued use after a change means you accept
          it.
        </P>

        <H2>Contact</H2>
        <P>
          <Mail />
        </P>
      </Prose>
    </div>
  );
}

export default TermsOfServicePage;
