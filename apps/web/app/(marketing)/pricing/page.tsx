import Link from 'next/link';

import {
  BanknoteIcon,
  CheckIcon,
  ClockIcon,
  FileIcon,
  InfinityIcon,
  RotateCcwIcon,
  ScanLineIcon,
  TypeIcon,
} from 'lucide-react';

import { CtaBand } from '../_components/cta-band';
import { MobileDisclosure } from '../_components/mobile-disclosure';
import { CreditCoin } from '../_components/workbench/credit-chip';
import { BuyButton } from './_components/buy-button';
import { CreditCalculator } from './_components/credit-calculator';
import {
  FREE_CREDITS,
  PACKS,
  SIGNUP_CREDITS,
  WELCOME_CREDITS,
  WORDS_PER_CREDIT,
} from './_components/pricing-data';

/**
 * The pricing page, REBUILT 20 August 2026 on Jon's instruction. His verdict
 * on the version this replaces: "It looks terrible. Like it is, it truly
 * couldn't be worse."
 *
 * WHAT WAS ACTUALLY WRONG, since the fix follows from it. The old page was
 * (1) factually stale, advertising "three sanitises before you sign up and
 * two more on signup", which is entry 67's split reversed by entry 97 five
 * days later; (2) led with the free tier in a 52px headline and made a
 * stranger read two paragraphs before meeting a number; (3) set the prices at
 * 34px in a mono face that spaced them "$4 . 99"; (4) never once translated a
 * credit into anything a student owns, so "10 credits" stayed an abstraction
 * all the way to the button; (5) shipped three buttons reading "Get Starter",
 * "Get Plus" and "Get Pro" that all quietly delivered a sign-up form; and (6)
 * stacked four full-width slabs on a phone, so the first price was 900px down.
 *
 * THE NUMBERS ARE THE RATIFIED ONES AND THEY LIVE IN `_components/pricing-data.ts`.
 * 04 entry 67 for the packs, entry 97 for the free split (2 welcome, 3 more on
 * signup, 5 in total), entry 71 for a file costing one flat credit, entry 98
 * for the coin that makes a credit a currency rather than a word.
 *
 * THE PAGE READS AS LIVE, AND THAT IS JON'S RULING RATHER THAN THIS
 * SESSION'S. The first build said out loud that checkout was not connected: a
 * status bar above the grid, a caption under every button, and an FAQ entry.
 * Jon, 20 August 2026: "make this seem like it is live universally. Remove
 * card check out opens shortly and faqs all the small callouts... Just listen
 * to me on this." All three are gone and the buttons read "Purchase now".
 *
 * THE BUTTONS NOW ACTUALLY SELL. 04 entry 112, 21 August 2026. They were
 * `<Link>`s to the sign-up form wearing the label "Purchase now"; they are now
 * `<BuyButton>`, which POSTs to /api/checkout and hands the visitor to Stripe's
 * hosted payment page. **The className is unchanged**, so the card heights
 * measured and signed off at 390px in entry 109 have not moved.
 *
 * A SIGNED-OUT VISITOR STILL REACHES THE SIGN-UP FORM, and that is correct
 * rather than left over: credits live on an account, and a guest account is
 * remembered only by a cookie in one browser, so selling to one is a refund
 * request waiting to happen. The route answers 401 or 402 and the button routes
 * to sign-up. What is still missing is the return path — the chosen pack is lost
 * at sign-up, because carrying it through means editing shared auth in
 * `packages/features/auth`, which is another session's. The wallet's "Get
 * credits" button closes the loop, one click wider than it should.
 *
 * ONE THING REMOVED AGAINST THE GOVERNING DOCUMENT, RECORDED RATHER THAN
 * DONE QUIETLY. `03-pricing.md` section 8 names one sentence as the one that
 * carries the most weight here: "Two of the three checks are provable, and we
 * show you the proof. The third is best effort and we say so." Jon instructed
 * its removal, along with the link to /capabilities beside it. CLAUDE.md
 * section 2 puts his instruction above the document, so it is gone. THE
 * BOUNDARY ITSELF SURVIVES INTACT in the three layer cards below, where the
 * statistical watermark still carries "Best effort, and not verifiable yet"
 * in its own pill: the removed sentence was a summary of what those pills
 * already say one by one.
 *
 * WHAT THIS PAGE MUST NEVER SAY, per 03-pricing.md section 8 and the
 * unclaude-messaging skill: any success rate or score for layer B, any
 * detection guarantee or refund-if-flagged, the words undetectable, bypass or
 * guaranteed, anything at all about PDFs, or that a statistical watermark was
 * removed. A pricing table is the easiest place in this project to write a
 * sentence that is true of one layer as though it were true of all three,
 * which is why the three layers are set out below in one shared grammar with
 * their proof status attached to each.
 *
 * THE 30 DAY REFUND IS NOW ON THE PAGE, AND THE FLAG THAT PUT IT THERE WORKED.
 * This comment used to say it was deliberately absent, because `03-pricing.md`
 * P6 proposed it and entry 67 never ratified it, so a live page could not
 * advertise it. Jon ruled on it 21 August 2026 (04 entry 113) after that flag
 * surfaced a day later, alongside the fact that the LIVE TERMS ALREADY PROMISED
 * IT word for word — the policy was binding while the page withheld it.
 *
 * IT IS WORDED AS OUR POLICY AND MUST STAY THAT WAY. Our 30 day refund covers
 * UNSPENT credits. The UK/EU statutory right of withdrawal is a different thing
 * that covers everything including spent credits, is not ours to define, and is
 * carried separately by the checkout consent flow. See the TRUST entry below.
 */
export const metadata = {
  title: 'Pricing',
  description:
    'Five credits free, then packs from $4.99. One credit sanitises 1,000 words, a file is one credit whatever its size, and credits never expire. No subscription.',
};

/**
 * What a credit buys, in one grammar, taught before any price is shown.
 *
 * TWO ROWS, NOT THREE. Jon, 20 August 2026: "let's just make this universal.
 * 1 credit = 1,000 words of text. 1 credit = 1 file." A Word document on one
 * row and a PNG on the next taught the visitor to look for their own file
 * type in a list, and a list invites the question of what is missing from it.
 * One rule for files, whatever the file is, is both simpler and truer to what
 * the server actually charges: a flat credit per file entry, 04 entry 71.
 */
const UNIT = [
  { icon: TypeIcon, label: '1,000 words of text' },
  { icon: FileIcon, label: 'One file, whatever its size' },
];

/** The four reassurances that sit under the buy buttons. All four are ruled. */
const TRUST = [
  {
    icon: InfinityIcon,
    title: 'Credits never expire',
    body: 'They sit in your account until you use them.',
  },
  {
    icon: RotateCcwIcon,
    title: 'A failed run costs nothing',
    body: 'The credits go straight back to your balance.',
  },
  /*
   * THE REFUND CAME OFF THIS GRID ON 22 August 2026, AND WHERE IT WENT IS THE
   * POINT. 04 entry 115, Jon's ruling: "I don't want to aggressively advertise
   * it... only people that are really fed up would go looking for this."
   *
   * THE REASONING IS THE SAME ARITHMETIC THAT CREATED THE POLICY, READ THE
   * OTHER WAY. A refund costs under a dollar and a dispute costs about $24.50,
   * so the policy earns its keep by catching the customer who would otherwise
   * call their bank. It does NOT earn its keep by reminding a satisfied
   * customer that their money is refundable. A tile in a four-up grid directly
   * under the buy buttons is the second thing, not the first.
   *
   * SO IT IS DISCOVERABLE RATHER THAN ADVERTISED, in three places and none of
   * them a tile: the small print under this grid, the FAQ below, and in full in
   * the terms of service. Anyone actually looking finds it in seconds. A
   * skimmer never meets it.
   *
   * DO NOT REMOVE IT FROM THE PAGE ENTIRELY. Stripe's website checklist
   * expects a visible refund policy and `03-pricing.md` section 12c step 8
   * lists it as a pre-activation requirement. Hidden is fine. Absent is an
   * account risk.
   *
   * WHAT TOOK THE SLOT, and it is not filler. Stripe's same checklist asks a
   * business to be able to tell customers their payment details are handled
   * safely, and ours can, truthfully. It sells where the refund line cost.
   */
  {
    icon: BanknoteIcon,
    title: 'Your card never touches us',
    body: 'You pay on Stripe’s own page. We never see the number.',
  },
  {
    icon: ScanLineIcon,
    title: 'Scanning is always free',
    body: 'Unlimited, with no account, forever.',
  },
];

/**
 * The three layers, in ONE shared shape: what it is, what happens to it, and
 * what we are allowed to claim about the result. Same three parts, same
 * order, three times. docs/09 section 3 is the reason: a repeated element
 * that changes grammar between rows makes the reader re-learn on every row.
 */
const LAYERS = [
  {
    name: 'Invisible characters',
    body: 'Zero width characters, unusual spaces, direction marks and tag marks. Every one is found, counted, shown to you in the exact place it was sitting, and removed.',
    status: 'Proven on every run',
    proven: true,
  },
  {
    name: 'File metadata',
    body: 'The content credentials, EXIF, XMP and generator tags hidden in the file wrapper. Read out, listed by name, and stripped. Your file before and after is checkable byte for byte.',
    status: 'Proven on every run',
    proven: true,
  },
  {
    name: 'The statistical watermark',
    body: 'The pattern in the word choices themselves. A targeted rewrite breaks the runs of your original wording the mark rides on, holding your figures and your length, and hands you the measurements from the run.',
    status: 'Best effort, and not verifiable yet',
    proven: false,
  },
];

const FAQ = [
  {
    q: 'What exactly is a credit?',
    a: 'One credit sanitises 1,000 words of pasted text. A file is one flat credit whatever its size, because stripping a 4 MB photograph and a 40 KB one is the same piece of work. Every job rounds up to a whole credit.',
  },
  {
    q: 'Do my credits expire?',
    a: 'No. Most of this market resets your allowance every month and takes back what you did not use. Yours sit in your account until you spend them.',
  },
  {
    q: 'What happens if a job fails?',
    a: 'The credits return to your balance automatically. It is the ledger that enforces this rather than a promise: a failed run writes the refund itself.',
  },
  {
    q: 'What can I put through it?',
    a: 'Pasted text, Word documents, PNG and JPG. Paste text and you get the invisible characters and the rewrite. Upload a file and you get the metadata as well.',
  },
  {
    q: 'Is the free allowance a trial that runs out?',
    a: 'It is granted once rather than reset. Two credits the moment you use the tool, with no account and no card, and three more when you create a free account. Scanning is separate and never runs out.',
  },
  /*
   * THE REFUND'S SECOND HOME, AND IT IS LAST ON PURPOSE. 04 entry 115. Someone
   * who wants their money back reads the FAQ to the bottom. Someone who is
   * deciding whether to buy does not. Placed after the failure question rather
   * than beside it, because "what if it breaks" is a reassurance a buyer reads
   * on the way in, and putting "can I have my money back" next to it plants the
   * idea in a customer who did not have it.
   */
  {
    q: 'Can I get a refund?',
    a: 'Yes. Within 30 days of buying, email unclaudeapp@gmail.com and we will refund any credits from that purchase you have not spent, at the price you paid, without asking why. Credits already spent are not refunded, because the work was done.',
  },
];

function Pricing() {
  return (
    <div className={'flex flex-col'}>
      {/* ------------------------------------------------------------------
          HERO. The headline carries a number, because the one question a
          visitor arrived with is what this costs. The card beside it teaches
          the unit, because every price below this point is quoted in credits
          and a term used before it is taught is a defect.
         ------------------------------------------------------------------ */}
      <header className={'border-border/70 relative overflow-hidden border-b'}>
        <div
          aria-hidden
          className={
            'pointer-events-none absolute top-[-30%] right-[-8%] h-[520px] w-[720px] rounded-full bg-[radial-gradient(closest-side,var(--mark),transparent)] opacity-[0.09] blur-[80px]'
          }
        />

        <div
          className={
            'relative mx-auto grid max-w-[1180px] gap-8 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-12 lg:items-center lg:gap-14 lg:py-20'
          }
        >
          <div className={'animate-rise lg:col-span-7'}>
            <p
              className={
                'text-muted-foreground mb-4 text-[12px] font-semibold tracking-[0.08em] uppercase'
              }
            >
              Pricing
            </p>

            <h1
              className={
                'text-foreground text-[34px] leading-[1.06] font-semibold tracking-[-0.032em] text-balance sm:text-[44px] lg:text-[52px]'
              }
            >
              {FREE_CREDITS} credits free. Packs from{' '}
              <span className={'text-mark-strong'}>$4.99</span>.
            </h1>

            <p
              className={
                'text-muted-foreground mt-5 max-w-[54ch] text-[16px] leading-[1.65]'
              }
            >
              Buy a pack once, use it whenever you like, and it never expires.
              No subscription, no monthly reset, nothing to cancel.
            </p>

            <div className={'mt-7 flex flex-wrap items-center gap-3'}>
              <Link
                href={'/'}
                className={
                  'bg-foreground text-background rounded-[11px] px-5 py-3 text-[14px] font-semibold transition-transform active:scale-[0.98]'
                }
              >
                Start free, no account
              </Link>

              <a
                href={'#packs'}
                className={
                  'text-foreground hover:bg-foreground/[0.05] rounded-[11px] px-4 py-3 text-[14px] font-semibold transition-colors'
                }
              >
                See the packs
              </a>
            </div>
          </div>

          <div
            className={'animate-rise lg:col-span-5'}
            style={{ animationDelay: '110ms' }}
          >
            <div
              className={
                'bg-card ring-border/70 rounded-[20px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 sm:p-7'
              }
            >
              <p
                className={
                  'text-muted-foreground text-[12px] font-semibold tracking-[0.06em] uppercase'
                }
              >
                What one credit buys
              </p>

              <ul className={'mt-4 space-y-3.5 sm:mt-5 sm:space-y-4'}>
                {UNIT.map((unit) => (
                  <li key={unit.label} className={'flex items-center gap-3'}>
                    <CreditCoin className={'size-[26px] shrink-0'} />
                    <span
                      className={
                        'text-muted-foreground text-[15px] font-medium'
                      }
                    >
                      =
                    </span>
                    <unit.icon
                      className={'text-muted-foreground size-[15px] shrink-0'}
                      strokeWidth={1.9}
                      aria-hidden
                    />
                    <span
                      className={
                        'text-foreground text-[14.5px] leading-snug font-medium'
                      }
                    >
                      {unit.label}
                    </span>
                  </li>
                ))}
              </ul>

              <p
                className={
                  'border-border/70 text-muted-foreground mt-5 border-t pt-4 text-[13px] leading-[1.6] sm:mt-6 sm:pt-5'
                }
              >
                Word documents, PNG and JPG. Scanning costs nothing and always
                will, so credits are only spent when you sanitise.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------
          THE PACKS. The prices are the loudest thing on the page, which is
          the whole point of it.
         ------------------------------------------------------------------ */}
      <section id={'packs'} className={'scroll-mt-20'}>
        <div className={'mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14 lg:py-18'}>
          <div className={'grid gap-4 md:grid-cols-3 lg:gap-5'}>
            {PACKS.map((pack) => (
              <div
                key={pack.id}
                style={
                  pack.featured
                    ? {
                        boxShadow:
                          '0 24px 60px -24px color-mix(in oklab, var(--mark) 70%, transparent)',
                      }
                    : undefined
                }
                className={[
                  'relative flex flex-col overflow-hidden rounded-[20px] p-6 transition-transform duration-200 sm:p-7 md:p-5 lg:p-7',
                  pack.featured
                    ? 'bg-[linear-gradient(155deg,var(--mark)_0%,var(--mark-strong)_100%)] text-white lg:-translate-y-2'
                    : 'bg-card ring-border/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 hover:-translate-y-1',
                ].join(' ')}
              >
                {pack.featured ? (
                  <div
                    aria-hidden
                    className={
                      'pointer-events-none absolute top-[-40%] right-[-20%] h-[300px] w-[300px] rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.5),transparent)]'
                    }
                  />
                ) : null}

                <div className={'relative flex items-center justify-between'}>
                  <p
                    className={[
                      'text-[14px] font-semibold tracking-[-0.01em]',
                      pack.featured ? 'text-white' : 'text-foreground',
                    ].join(' ')}
                  >
                    {pack.name}
                  </p>

                  {pack.featured ? (
                    <span
                      className={
                        'rounded-full bg-white/25 px-2.5 py-1 text-[11px] font-semibold tracking-[0.03em] text-white uppercase'
                      }
                    >
                      Most popular
                    </span>
                  ) : pack.saving ? (
                    <span
                      className={
                        'bg-mark/12 text-mark-strong rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.03em] uppercase'
                      }
                    >
                      {pack.saving}
                    </span>
                  ) : null}
                </div>

                {/* THE PRICE. Set as three pieces so the decimal sits tight,
                    and at roughly four times body size so it is the first
                    thing the eye lands on in the card. */}
                <div className={'relative mt-5 flex items-start gap-[3px]'}>
                  <span
                    className={[
                      'mt-[9px] text-[22px] font-semibold',
                      pack.featured ? 'text-white/80' : 'text-muted-foreground',
                    ].join(' ')}
                  >
                    $
                  </span>
                  <span
                    className={
                      'text-[56px] leading-[0.86] font-semibold tracking-[-0.045em] tabular-nums sm:text-[62px] md:text-[46px] lg:text-[58px] xl:text-[62px]'
                    }
                  >
                    {pack.dollars}
                  </span>
                  <span
                    className={
                      'mt-[9px] text-[24px] font-semibold tracking-[-0.02em] tabular-nums'
                    }
                  >
                    .{pack.cents}
                  </span>
                </div>

                {/* The rate sits directly under the price, because it
                    qualifies the price rather than the quantity. Keeping it
                    off the credits line is what stops both wrapping into
                    four ragged lines in a three-up grid on a tablet. */}
                <p
                  className={[
                    'relative mt-2 text-[13px] font-medium',
                    pack.featured ? 'text-white/75' : 'text-muted-foreground',
                  ].join(' ')}
                >
                  {pack.rate}
                </p>

                <div className={'relative mt-5 flex items-center gap-2'}>
                  <CreditCoin className={'size-[20px] shrink-0'} />
                  <span
                    className={[
                      'text-[16px] font-semibold tabular-nums',
                      pack.featured ? 'text-white' : 'text-foreground',
                    ].join(' ')}
                  >
                    {pack.credits} credits
                  </span>
                  <span
                    className={[
                      'text-[13px] font-medium tabular-nums',
                      pack.featured ? 'text-white/70' : 'text-muted-foreground',
                    ].join(' ')}
                  >
                    {pack.words.toLocaleString('en-US')} words
                  </span>
                </div>

                {/* flex-1 so three cards of unequal copy still line their
                    buttons up along one edge. */}
                <p
                  className={[
                    'relative mt-3 flex-1 text-[14px] leading-[1.55]',
                    pack.featured ? 'text-white/85' : 'text-muted-foreground',
                  ].join(' ')}
                >
                  {pack.covers}
                </p>

                <BuyButton
                  packId={pack.id}
                  packName={pack.name}
                  className={[
                    'relative mt-6 rounded-[11px] px-4 py-3.5 text-center text-[14px] font-semibold text-nowrap transition-transform active:scale-[0.98]',
                    pack.featured
                      ? 'text-mark-strong bg-white hover:bg-white/92'
                      : 'bg-foreground text-background hover:bg-foreground/90',
                  ].join(' ')}
                >
                  Purchase now
                </BuyButton>

              </div>
            ))}
          </div>

          {/* The reassurances, directly under the buttons where the doubt is. */}
          <ul
            className={
              'border-border/70 mt-9 grid gap-x-8 gap-y-4 border-t pt-7 sm:mt-12 sm:gap-y-6 sm:pt-9 sm:grid-cols-2 lg:grid-cols-4'
            }
          >
            {/* Icon beside the words on a phone, above them from `sm`. Four
                stacked icon-over-heading-over-body blocks was a third of a
                screen for four short sentences. Same grammar as the home
                page's three beats, deliberately. */}
            {TRUST.map((item) => (
              <li key={item.title} className={'flex gap-3 sm:block'}>
                <span
                  className={
                    'bg-mark/12 text-mark-strong grid size-[32px] shrink-0 place-items-center rounded-[10px]'
                  }
                >
                  <item.icon className={'size-[16px]'} strokeWidth={2} aria-hidden />
                </span>
                <span className={'min-w-0'}>
                  <span
                    className={
                      'text-foreground block text-[14.5px] font-semibold tracking-[-0.01em] sm:mt-3'
                    }
                  >
                    {item.title}
                  </span>
                  <span
                    className={
                      'text-muted-foreground mt-1 block text-[13.5px] leading-[1.55]'
                    }
                  >
                    {item.body}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          {/* ------------------------------------------------------------
              THE SMALL PRINT, AND EVERY CLAUSE IN IT IS PLACED RATHER THAN
              DUMPED. 04 entry 115.

              THE REFUND LIVES HERE NOW, one clause long, under a rule, at 12.5px.
              Jon's ruling: findable by anyone looking for it, invisible to
              anyone who is not. See the TRUST array above for the full
              reasoning and for why it must not be deleted outright.

              US ONLY IS A TERM OF SALE AND IT IS STATED WHERE THE SALE HAPPENS.
              It is also the sentence that lets the terms drop the UK/EU
              cancellation right entirely. It is NOT enforced by anything on
              this page or in the checkout route today.

              NO TAX SENTENCE BEYOND WHAT THE CHECKOUT ACTUALLY DOES. "The price
              on the card is the total you pay" is verified against the real
              Stripe sessions: subtotal equals total, amount_tax is zero,
              automatic_tax is off, on all three packs. It is not a claim that
              no tax is owed anywhere, which is an accountant's question.
             ------------------------------------------------------------ */}
          <p
            className={
              'text-muted-foreground mt-7 max-w-[72ch] text-[12.5px] leading-[1.6]'
            }
          >
            Prices are in US dollars, and the price on the card is the total you
            pay. Credits are sold to customers in the United States only. Unspent
            credits are refundable for 30 days at the price you paid.{' '}
            <Link
              href={'/terms-of-service'}
              className={
                'text-foreground font-medium underline underline-offset-2'
              }
            >
              The terms have the detail
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------
          THE CALCULATOR. A credit is an abstraction until somebody puts
          their own document into it.
         ------------------------------------------------------------------ */}
      <section className={'border-border/70 border-t'}>
        <div className={'mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14 lg:py-18'}>
          <h2
            className={
              'text-foreground text-[24px] leading-[1.15] font-semibold tracking-[-0.026em] text-balance sm:text-[30px]'
            }
          >
            Work out what you actually need
          </h2>
          <p
            className={
              'text-muted-foreground mt-3 max-w-[56ch] text-[15px] leading-[1.65]'
            }
          >
            Drag it to the size of the thing sitting in your downloads folder.
            The arithmetic here is the same arithmetic the server charges.
          </p>

          <div className={'mt-8'}>
            <CreditCalculator />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------
          FREE. Placed after the price so it reads as the reason to start
          rather than as the reason not to buy.
         ------------------------------------------------------------------ */}
      <section className={'border-border/70 border-t'}>
        <div className={'mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14 lg:py-18'}>
          <div className={'grid gap-8 lg:grid-cols-12 lg:gap-14'}>
            <div className={'lg:col-span-5'}>
              <h2
                className={
                  'text-foreground text-[24px] leading-[1.15] font-semibold tracking-[-0.026em] text-balance sm:text-[30px]'
                }
              >
                You do not pay to find out
              </h2>
              <p
                className={
                  'text-muted-foreground mt-3 max-w-[46ch] text-[15px] leading-[1.65]'
                }
              >
                Scanning is free and unlimited with no account, so you can see
                exactly what your document carries before you decide anything.
                The five free credits are granted once rather than reset every
                month, and nothing here asks for a card.
              </p>

              <Link
                href={'/'}
                className={
                  'bg-foreground text-background mt-6 inline-block rounded-[11px] px-5 py-3 text-[14px] font-semibold transition-transform active:scale-[0.98]'
                }
              >
                Run a free scan
              </Link>
            </div>

            <div className={'lg:col-span-7'}>
              <ol className={'grid gap-4 sm:grid-cols-2'}>
                <li
                  className={
                    'bg-card ring-border/70 rounded-[18px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 sm:p-6'
                  }
                >
                  <span
                    className={
                      'bg-foreground text-background grid size-[26px] place-items-center rounded-full text-[13px] font-semibold'
                    }
                  >
                    1
                  </span>
                  <p className={'mt-4 flex items-center gap-2'}>
                    <CreditCoin className={'size-[22px] shrink-0'} />
                    <span
                      className={
                        'text-foreground text-[28px] leading-none font-semibold tracking-[-0.03em] tabular-nums'
                      }
                    >
                      {WELCOME_CREDITS}
                    </span>
                    <span
                      className={
                        'text-muted-foreground text-[14px] font-medium'
                      }
                    >
                      credits
                    </span>
                  </p>
                  <p
                    className={
                      'text-foreground mt-3 text-[14.5px] font-semibold'
                    }
                  >
                    Right now, with no account
                  </p>
                  <p
                    className={
                      'text-muted-foreground mt-1.5 text-[13.5px] leading-[1.55]'
                    }
                  >
                    They are already waiting in the tool on the home page. No
                    email, no card, nothing to fill in.
                  </p>
                </li>

                <li
                  className={
                    'bg-mark/[0.06] ring-mark/25 rounded-[18px] p-5 ring-1 sm:p-6'
                  }
                >
                  <span
                    className={
                      'bg-mark text-mark-foreground grid size-[26px] place-items-center rounded-full text-[13px] font-semibold'
                    }
                  >
                    2
                  </span>
                  <p className={'mt-4 flex items-center gap-2'}>
                    <CreditCoin className={'size-[22px] shrink-0'} />
                    <span
                      className={
                        'text-foreground text-[28px] leading-none font-semibold tracking-[-0.03em] tabular-nums'
                      }
                    >
                      +{SIGNUP_CREDITS}
                    </span>
                    <span
                      className={
                        'text-muted-foreground text-[14px] font-medium'
                      }
                    >
                      credits
                    </span>
                  </p>
                  <p
                    className={
                      'text-foreground mt-3 text-[14.5px] font-semibold'
                    }
                  >
                    When you create a free account
                  </p>
                  <p
                    className={
                      'text-muted-foreground mt-1.5 text-[13.5px] leading-[1.55]'
                    }
                  >
                    {/*
                      "Anything left over from step one comes with you" was
                      removed 21 August 2026 on Jon's instruction, the same
                      sentence he had struck from the paywall. It is true, and
                      the guest merge in /api/credits still does exactly that,
                      but he does not want it said. The arithmetic it was
                      introducing stays, because 2 plus 3 needs a total beside
                      it or the two cards read as alternatives.
                    */}
                    {FREE_CREDITS} credits in total, or{' '}
                    {(FREE_CREDITS * WORDS_PER_CREDIT).toLocaleString('en-US')}{' '}
                    words.
                  </p>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------
          WHAT THE CREDIT ACTUALLY BUYS, and the claims boundary handled
          where a pricing page usually breaks it.
         ------------------------------------------------------------------ */}
      <section className={'border-border/70 border-t'}>
        <div className={'mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14 lg:py-18'}>
          <h2
            className={
              'text-foreground text-[24px] leading-[1.15] font-semibold tracking-[-0.026em] text-balance sm:text-[30px]'
            }
          >
            One price, three different jobs
          </h2>
          <p
            className={
              'text-muted-foreground mt-3 max-w-[62ch] text-[15px] leading-[1.65]'
            }
          >
            You never choose a layer and you are never charged differently for
            one. The tool reads what you gave it and runs whatever applies.
            Paste text and you get the first and the third. Upload a file and
            you get all three.
          </p>

          <ul className={'mt-8 grid gap-4 md:grid-cols-3 lg:gap-5'}>
            {LAYERS.map((layer) => (
              <li
                key={layer.name}
                className={
                  'bg-card ring-border/70 flex flex-col rounded-[18px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 sm:p-6'
                }
              >
                <h3
                  className={
                    'text-foreground text-[16px] font-semibold tracking-[-0.015em]'
                  }
                >
                  {layer.name}
                </h3>

                {/*
                  THE NAME AND THE CLAIM STRENGTH ARE NOT COLLAPSIBLE. The
                  status pill below is the claims boundary on this page:
                  "Proven on every run" on two of these and "Best effort, and
                  not verifiable yet" on the third. It stays visible at every
                  width, always. Only the description of the work waits behind
                  the plus, and only on a phone.
                */}
                <div className={'mt-3 flex-1 sm:contents'}>
                  <MobileDisclosure label={'What comes off'}>
                    <p
                      className={
                        'text-muted-foreground flex-1 text-[14px] leading-[1.6] sm:mt-3'
                      }
                    >
                      {layer.body}
                    </p>
                  </MobileDisclosure>
                </div>

                <p
                  className={[
                    'mt-3 inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-[12px] font-semibold sm:mt-5',
                    layer.proven
                      ? 'bg-foreground text-background'
                      : 'border-border text-muted-foreground border',
                  ].join(' ')}
                >
                  {layer.proven ? (
                    <CheckIcon className={'size-[13px]'} strokeWidth={2.6} aria-hidden />
                  ) : (
                    <ClockIcon className={'size-[13px]'} strokeWidth={2.4} aria-hidden />
                  )}
                  {layer.status}
                </p>
              </li>
            ))}
          </ul>

        </div>
      </section>

      {/* ------------------------------------------------------------------
          THE QUESTIONS A BUYER ACTUALLY HAS. Native details elements, so
          the whole block works before a line of JavaScript arrives.
         ------------------------------------------------------------------ */}
      <section className={'border-border/70 border-t'}>
        <div className={'mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14 lg:py-18'}>
          <div className={'grid gap-8 lg:grid-cols-12 lg:gap-14'}>
            <div className={'lg:col-span-4'}>
              <h2
                className={
                  'text-foreground text-[24px] leading-[1.15] font-semibold tracking-[-0.026em] text-balance sm:text-[30px] lg:sticky lg:top-24'
                }
              >
                Questions about the money
              </h2>
            </div>

            <div className={'lg:col-span-8'}>
              <div className={'border-border/70 border-t'}>
                {FAQ.map((item) => (
                  <details
                    key={item.q}
                    className={'group border-border/70 border-b'}
                  >
                    <summary
                      className={
                        'text-foreground flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-[15px] font-semibold tracking-[-0.012em] [&::-webkit-details-marker]:hidden'
                      }
                    >
                      {item.q}
                      <span
                        aria-hidden
                        className={
                          'border-border text-muted-foreground grid size-[22px] shrink-0 place-items-center rounded-full border text-[15px] leading-none transition-transform duration-200 group-open:rotate-45'
                        }
                      >
                        +
                      </span>
                    </summary>
                    <p
                      className={
                        'text-muted-foreground max-w-[64ch] pb-5 text-[14.5px] leading-[1.7]'
                      }
                    >
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className={'border-border/70 border-t'}>
        <CtaBand
          heading={'See what your document is carrying'}
          sub={
            'The scan is free, unlimited and needs no account. You only spend a credit once you decide to clean it.'
          }
          secondary={{ href: '/auth/sign-up', label: 'Create a free account' }}
        />
      </div>
    </div>
  );
}

export default Pricing;
