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
 * There is no company and no legal entity behind Un-Claude, so there is nothing
 * to name as a party and nowhere to seat a dispute. Inventing a jurisdiction
 * would be a false statement in the one document that most needs to be true.
 * It gets added when an entity exists, alongside payments. 04 entry 54, and
 * decision D1 of the legal reconciliation, which is the thing that blocks
 * taking money.
 *
 * The "currently free and no payment method is collected" sentence in Payment is
 * the other line with an expiry on it. 06 row 46.
 *
 * REWRITTEN 21 AUGUST 2026, from `docs/session-notes/legal-reconciliation.md`
 * sections 1.3 and 2C. Two things had gone false when the credit ledger shipped
 * on 20 and 21 August, and one was imprecise against the code:
 *
 *   - "Accounts and free use" said the free allowance "is enforced in your
 *     browser and is not a security measure". It was replaced by a server-side
 *     ledger enforced inside a locking database transaction. That sentence was
 *     false in the direction that UNDERSTATES the product, which is the one a
 *     payments reviewer would notice.
 *   - Nothing mentioned guest accounts, guest credits, or what clearing browser
 *     data does to them, so the free tier the terms described no longer existed.
 *   - The credit price did not match `costFor` in workbench/credits.ts or the
 *     server's own arithmetic in api/tool/clean/route.ts. A file is one flat
 *     credit EXCEPT a plain text file being rewritten, which is priced by its
 *     words. The old sentence, "a file with no words costs one credit", implied
 *     word count decides a file's price. It does not.
 *
 * WHAT THIS REWRITE DELIBERATELY DID NOT TOUCH. "What we can and cannot
 * promise" is the claims boundary and it is the strongest section on the site:
 * layers A and metadata are provable, the rewrite is best effort, and a
 * contract promising removal of "AI watermarking" without that split would be a
 * false claim in a document Jon signs. "Acceptable use" is left exactly as it
 * is for the same reason: naming the legitimate uses BEFORE the prohibition is
 * what makes the prohibition credible, and broadening it to look safer would
 * prohibit the product's own most common use. 04 entry 54 rulings 3 and 4.
 *
 * STILL OUTSTANDING, and both are Jon's rather than a drafting job: the entity
 * and jurisdiction section (D1), and a suspension sentence in "Ending your use"
 * covering what happens to a balance when an account is suspended (D4). Neither
 * is invented here.
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
        <Updated date={'21 August 2026'} />

        <H2>What Un-Claude does</H2>
        <P>
          Un-Claude finds and removes marks that identify text and documents as
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
          result. We do not retain what you submit. We do keep a record that you
          ran a job, so your credit balance means something, and the{' '}
          <Link
            href={'/privacy-policy'}
            className={'text-foreground font-medium underline underline-offset-2'}
          >
            Privacy Policy
          </Link>{' '}
          explains exactly what that record contains and what it does not.
        </P>
        <P>You are responsible for having the right to submit what you submit.</P>

        <H2>Acceptable use</H2>
        <P>
          Un-Claude is for your own writing and your own files. People use it
          because they do not want their work carrying hidden data about the tool
          that produced it, because invisible characters break formatting and
          search, because file metadata reveals more than they intended to share,
          and because automated detectors are unreliable and flag human writing
          every day.
        </P>
        <P>
          It is not for passing off machine-generated work as your own where
          somebody has asked you not to. Do not use Un-Claude to deceive a school,
          an employer, a publisher, a client, or anyone else who is relying on your
          word about how something was made. If a person or institution has a rule
          about AI-assisted work, that rule is between you and them, and this tool
          does not change it.
        </P>
        <P>
          You also agree not to use Un-Claude to break the law, to infringe
          anyone’s rights, or to attack, overload, or reverse-engineer the service.
        </P>

        <H2>Accounts, credits and free use</H2>
        <P>
          You can use the tool without an account. The first time you clean
          something we create a guest account for your browser and give it a small
          number of free credits, so you can try the thing you came for before
          deciding anything. Creating a real account earns a few more, once. The
          current numbers are on the{' '}
          <Link
            href={'/pricing'}
            className={'text-foreground font-medium underline underline-offset-2'}
          >
            pricing page
          </Link>
          .
        </P>
        <P>
          Free credits are a courtesy, not an entitlement. They are granted once
          rather than renewed, we may change the amounts, and we may refuse or
          reverse them where we believe someone is creating accounts to collect
          them repeatedly.
        </P>
        <P>
          Guest credits live on the browser that earned them. Clear your browser
          data and they are gone, and we cannot restore them, because we
          deliberately hold nothing that would let us recognise you. If you create
          an account on that browser, whatever is left moves across to it.
        </P>
        <P>
          If you create an account you must give accurate information and keep your
          credentials secure. You are responsible for what happens under your
          account. You must be at least 18 years old.
        </P>

        <H2>Payment, credits and refunds</H2>
        <P>
          The service is currently free to use and no payment method is
          collected. Credit packs and their prices are announced on the pricing
          page and go on sale when card checkout opens. Prices are in US dollars.
          Nothing is charged without your agreement, and the price of an operation
          is shown before it runs.
        </P>
        <P>
          One credit covers one thousand words of pasted text. An uploaded file is
          one flat credit whatever its size, unless it is a plain text file you
          also send through the rewrite, which is priced by its words in the same
          way a paste is. Every job rounds up to a whole credit, and credits never
          expire.
        </P>
        <P>
          A failed operation costs nothing. If a run fails, the credits it took are
          returned to your balance automatically, and your credit history shows the
          reversal.
        </P>
        <P>
          Within 30 days of a purchase you may ask for a refund of any credits from
          it that you have not spent, at the price you paid, and we will not ask
          you why. Credits you have already spent are not refunded, because the
          work was done. Refunds are returned to the card that paid.
        </P>
        <P>
          If you delete your account, any credits on it end with it and are not
          refunded. Ask for the refund before you delete.
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
          your use of Un-Claude. Where liability cannot be excluded, it is limited
          to the greater of the amount you have paid us in the previous six months
          or 50 US dollars.
        </P>
        <P>Nothing here excludes liability that cannot lawfully be excluded.</P>

        <H2>Ending your use</H2>
        <P>
          You may stop using Un-Claude and delete your account at any time. We may
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
