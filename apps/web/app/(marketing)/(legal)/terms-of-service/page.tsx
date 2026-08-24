import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import { SitePageHeader } from '~/(marketing)/_components/site-page-header';

import {
  FREE_CREDITS,
  PACKS,
  SIGNUP_CREDITS,
  WELCOME_CREDITS,
} from '~/(marketing)/pricing/_components/pricing-data';

import { H2, Lead, List, Mail, P, Prose, Updated } from '../_components/legal';

import { shareTags } from '~/lib/share-tags';

/**
 * THE PRICES ARE NEVER TYPED INTO THIS PAGE. They are read from the same
 * `PACKS` array the pricing cards and the calculator read, so a price change
 * cannot leave a false figure sitting in a binding document. Same reason the
 * free credit numbers are read rather than written: 04 entry 97 reversed them
 * once already.
 */
const CHEAPEST = PACKS.reduce((low, pack) => (pack.price < low.price ? pack : low));
const DEAREST = PACKS.reduce((high, pack) => (pack.price > high.price ? pack : high));

function dollars(pack: (typeof PACKS)[number]) {
  return `$${pack.dollars}.${pack.cents}`;
}

/**
 * Written once and used twice: the browser tab and the share preview must
 * not be able to drift apart.
 */
const DESCRIPTION =
  'The agreement behind Un-Claude: what each of the three layers is promised to do, how credits and payment work, and our 30 day refund policy.';

export async function generateMetadata() {
  const t = await getTranslations();

  return {
    title: t('marketing.termsOfService'),
    /*
     * ITS OWN DESCRIPTION, ADDED 22 August 2026. All three legal pages
     * inherited the site-wide one, so a search result for this page read
     * "Scan text and files free for hidden AI watermarks", which describes
     * the product rather than the page. Written here rather than in
     * `lib/root-metdata.ts`, which belongs to the SEO session.
     */
    description: DESCRIPTION,
    alternates: { canonical: '/terms-of-service' },
    ...shareTags({
      title: t('marketing.termsOfService'),
      description: DESCRIPTION,
      path: '/terms-of-service',
    }),
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
 * THAT SENTENCE'S EXPIRY DATE ARRIVED. 22 August 2026. Payment used to open
 * "The service is currently free to use and no payment method is collected",
 * and to say credit packs "go on sale when card checkout opens". Card checkout
 * is open. Both sentences would have become FALSE STATEMENTS IN A BINDING
 * DOCUMENT the moment the first charge landed, which is the exact failure 06
 * row 46 exists to prevent. They are now in the present tense, and the section
 * carries the two things a live payment page owes a buyer: where the card is
 * handled, and what the free credits actually are as a promotion.
 *
 * THE UK/EU CANCELLATION RIGHT IS GONE, WITH THE MARKET IT BELONGED TO.
 * Jon's ruling, 22 August 2026, 04 entry 115. A version of this page carried a
 * "Cancelling, and getting your money back" section splitting the statutory 14
 * day right of withdrawal from our voluntary refund, and the checkout carried a
 * consent ceremony to waive the first. **Credits are now sold to US customers
 * only**, so the right is out of scope, and a page explaining a right its
 * readers do not have is noise in the one document that most needs to be read.
 * The reasoning, the law and the wording are preserved in
 * `docs/session-notes/legal-applied-stripe.md` for whenever Europe is opened up.
 *
 * THE US-ONLY SENTENCE IS A TERM OF SALE AND NOTHING IN THE SOFTWARE ENFORCES
 * IT YET. The intended enforcement is a Stripe Radar block on the built-in
 * `card_country_blocklist`, which is a dashboard job that has not been done.
 * A non-US card completes normally today. That is fine for a term of sale, and
 * it would NOT be fine for a sentence claiming such cards are refused, so no
 * page says that.
 *
 * WHOSE LAW APPLIES, ADDED 22 August 2026, AND IT ENDS D1. The page carried no
 * governing law section because there was no entity to name and inventing a
 * jurisdiction would have been false. Jon confirmed he operates from
 * California, so the section is now a fact rather than an invention.
 * **California is named because he is there, not as a preference.** A
 * California court applies California law to a California trader whatever a
 * contract says, so naming another state would buy nothing and read as
 * evasive. **His legal name and address are deliberately NOT published**, on
 * his instruction; the US has no equivalent of the UK DMCC disclosure duty, and
 * Stripe holds a support address separately.
 *
 * ONE THING THAT GOT STRONGER BY ACCIDENT. "Provided as it is, without
 * warranties of any kind" in "What we can and cannot promise" was flagged as
 * close to unenforceable against a UK consumer. Against a US consumer a
 * conspicuous disclaimer of this kind is broadly enforceable, so the 9E
 * rewrite is no longer urgent. **The highest-value US addition is an
 * arbitration clause with a class action waiver, which is lawyer drafting and
 * is deliberately not attempted here.**
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
 * STILL OUTSTANDING. D1 is closed by the California section above. What is
 * left: a suspension sentence in "Ending your use" covering what happens to a
 * balance when an account is suspended (D4); an arbitration and class action
 * waiver clause, which needs a lawyer; and US state sales tax, which is an
 * accountant's question that does not bite until roughly $100,000 or 200
 * transactions in a single state. **EU VAT is no longer a question at all**,
 * because nothing is sold into the EU. What this page says about tax is only
 * what the checkout code actually does: it adds nothing to the price, verified
 * against real Stripe sessions on all three packs.
 *
 * The model cancellation form, the trader address and the phone number are all
 * gone as requirements along with the UK/EU market.
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
        <Updated date={'22 August 2026'} />

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
          something we create a guest account for your browser and give it{' '}
          {WELCOME_CREDITS} free credits, so you can try the thing you came for
          before deciding anything. Creating a real account earns {SIGNUP_CREDITS}{' '}
          more, once, which is {FREE_CREDITS} in total. The same numbers are on the{' '}
          <Link
            href={'/pricing'}
            className={'text-foreground font-medium underline underline-offset-2'}
          >
            pricing page
          </Link>
          .
        </P>
        <P>
          Free credits are a promotion rather than an entitlement, and these are
          its terms. They are granted once rather than renewed. They have no cash
          value, cannot be exchanged for money, and are not covered by any refund.
          We may change the amounts or end the promotion at any time, and doing so
          never touches credits you have already been granted or already paid for.
          We may refuse or reverse free credits where we believe someone is
          creating accounts to collect them repeatedly.
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

        <H2>Payment and credits</H2>
        <P>
          Credits are bought in packs on the{' '}
          <Link
            href={'/pricing'}
            className={'text-foreground font-medium underline underline-offset-2'}
          >
            pricing page
          </Link>
          , from {dollars(CHEAPEST)} to {dollars(DEAREST)}. Prices are in US
          dollars. The price on that page is the total you are charged: we add
          nothing at checkout, no tax and no fee. There is no subscription and
          nothing renews. Nothing is charged without your agreement, and the price
          of an operation is shown before it runs.
        </P>
        <P>
          <span className={'text-foreground font-medium'}>
            We sell credits to customers in the United States only.
          </span>{' '}
          If you are outside the United States you may use the free tool, but you
          may not buy credits, and by buying you confirm that you are a US
          resident. We may refuse or reverse a purchase made from outside the
          United States and refund it in full.
        </P>
        <P>
          <span className={'text-foreground font-medium'}>
            Your card details never reach us.
          </span>{' '}
          Payments are handled by Stripe, and you enter your card on Stripe’s own
          payment page rather than on ours. Your card number is never sent to
          Un-Claude and we never store it. What we receive back is which pack you
          bought, what it cost, and whether it was paid. Stripe emails you the
          receipt.
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
          reversal. That is not a refund request and you do not have to ask for it.
        </P>

        <H2>Refunds</H2>
        <P>
          Within 30 days of a purchase you may ask for a refund of any credits
          from it that you have not spent, at the price you paid, and we will not
          ask you why. Email <Mail /> and we will do it. Credits you have already
          spent are not refunded, because the work was done. Refunds are returned
          to the card that paid.
        </P>
        <P>
          If you delete your account, any credits on it end with it and are not
          refunded. Ask for the refund before you delete.
        </P>

        <H2>Who you are dealing with, and whose law applies</H2>
        <P>
          Un-Claude is operated by an individual sole trader based in California,
          in the United States. There is no company; the trader is a person, and
          these terms are an agreement with him. Write to <Mail /> and a person
          reads it.
        </P>
        <P>
          These terms are governed by the law of the State of California and of
          the United States, and any dispute is heard in the state or federal
          courts of California. Nothing here takes away rights you have under
          consumer law that a contract cannot remove.
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
