# Legal research — 21 August 2026

**Merged into `04-decision-log.md` entry 126, 21 August 2026. Its UK-sole-trader
jurisdiction assumption is superseded by entry 115 (US-only sales) — do not
treat sections 1, 2, 3f, 5, 9A/9B as current. Retained on disk until W1 and W2
finish reading it; the conductor removes it afterwards.**

**Research only. No page was edited, no code was changed.** Output is a
recommendation per question, the primary source behind it, and draft wording at
the end for anything that would change a published page.

**I am not a lawyer.** Nothing here is legal advice. What it is: the actual text
of the actual rules, read and quoted, with my reasoning about what they mean for
un-claude, and an explicit list of the four things I would not decide without a
professional.

---

## How to read this note

Every claim is tagged. The tags are not decoration — they are the difference
between something Jon can rely on and something he cannot.

| Tag | Means |
|---|---|
| **LAW** | The rule itself says this. A link to the legislation follows. |
| **REGULATOR** | The enforcing body's own published guidance says this. Guidance is not law and can be wrong, but it is what an investigator will apply. |
| **PRACTICE** | What businesses commonly do. Carries no legal weight. |
| **JUDGEMENT** | Mine. Reasoned from the sources, not found in them. |
| **UNSOURCED** | I believe it and could not find a source. Treat as a hypothesis. |
| **COULD NOT ESTABLISH** | I looked and did not find an answer. This is a finding, not a gap in effort. |

Where UK and EU rules differ, both are stated. They are never averaged.

---

## The consequence of the constraint, stated once

Jon has decided not to form a legal entity. That is settled and this note works
inside it. One consequence has to be said plainly and then not repeated:

**Without an entity there is no separate legal person, so every liability of the
business is Jon's personal liability, reaching his personal assets. There is no
corporate veil to pierce because there is no veil.** Insurance is the only
substitute available, and it is a partial one. Section 7 is about making the
inside of that constraint as safe as it can be.

That is the whole of the "you should incorporate" argument and it does not
appear again in this document.

---

## Section 0. The four findings that change what happens next

Ordered by how much they change.

**1. Stripe's contract requires the address on the site before checkout, and the
sole-trader exception is Japan-only.** The Stripe Payments Services Terms §3.4(b)
say the User "must prominently and clearly disclose User's name, address, and
country location to Customers before Customers are prompted to provide payment
card information." A variant of that clause exists which lets an individual or
sole proprietor give the address **on request** instead — and it appears only in
the **Japan** Regional Terms. The UK, Switzerland and Gibraltar Regional Terms do
not modify §3.4(b) at all. **So "address on request" is not available to Jon.**

**2. UK law changed on 6 April 2025 and the new statutory text asks for the
personal name AND the trading name.** The Digital Markets, Competition and
Consumers Act 2024 replaced the old unfair-trading rules. Section 230(6) defines
a trader's "identity" as *"(a) the name of the trader, and (b) if different, the
name under which the trader trades."* Not either/or. **But the CMA's own guidance
glosses the same provision as "their personal *or* trading name".** The statute
and the regulator's guidance disagree, and I am not going to pretend otherwise.

**3. The 30-day unspent-credit refund does not satisfy the statutory withdrawal
right, and being more generous does not fix it.** The statutory right refunds
*everything*, including credits already spent, and it has to be told to the
consumer as a right. It is lost only if the customer expressly consents to
immediate supply, acknowledges losing the right, and is then sent a confirmation
on a durable medium. That is three things, and the third is the one everyone
forgets.

**4. The criminal essay-mill statute exists, is narrower than feared, and its
sharper edge is advertising, not the product.** The offence is completing part of
an assignment for a student. un-claude does not do that. But there is a separate
offence of *advertising* such a service to students, which is a hard constraint
on marketing rather than on the tool.

---

## 1. Question one — must Jon's name appear on the site?

This is four questions and they have four different answers. Taking them
separately is the only way to get a usable result.

### 1a. Which rules are even in play

Four separate instruments impose disclosure on a UK sole trader selling online.
They do not say the same thing, they were written decades apart, and a business
has to satisfy all four.

| Instrument | Applies to | What it wants |
|---|---|---|
| **DMCC Act 2024 s.230** | Any "invitation to purchase" — a price plus a buy decision | Name **and** trading name; business address; service address if different; business email |
| **Consumer Contracts Regs 2013, Sch 2** | Pre-contract info for distance selling | "Identity of the trader (**such as** the trader's trading name)"; geographical address |
| **E-Commerce Regs 2002, reg 6** | Any commercial website | "The name of the service provider"; "the geographic address at which the service provider is established" |
| **Companies Act 2006, ss.1200–1204** | An individual trading under a name that is not his own surname | His own name **and** a service address — on invoices and receipts, and on request |

The pricing page at `apps/web/app/(marketing)/pricing/page.tsx` carries prices
and a purchase path, so it is an "invitation to purchase" as defined in
[DMCC s.230(10)](https://www.legislation.gov.uk/ukpga/2024/13/section/230):
a practice providing information "which indicates the characteristics of a
product and its price, and which enables, or purports to enable, the consumer to
decide whether to purchase". There is no argument to be had about whether s.230
applies.

### 1b. The name — and the one place where statute and regulator disagree

**LAW.** [DMCC Act 2024, s.230(2)(d) and s.230(6)](https://www.legislation.gov.uk/ukpga/2024/13/section/230),
in force 6 April 2025:

> (2) The information referred to in subsection (1) is— … (d) the identity of the
> trader and the identity of any other person on whose behalf the trader is
> acting;
>
> (6) For the purposes of subsection (2)(d) "identity", in relation to a trader,
> means— (a) the name of the trader, and (b) if different, the name under which
> the trader trades.

Read literally, that is both names. "Jon [surname], trading as un-claude."

**REGULATOR.** The CMA's own guidance on the same section,
[CMA207 *Unfair commercial practices*, ¶4.16](https://assets.publishing.service.gov.uk/media/691b9bd821ef5aaa6543ee6f/Unfair_commercial_practices_CMA207_18_Nov_2025__2_.pdf),
summarising the s.230(2) list, says:

> The identity of the trader, such as their personal **or** trading name, and the
> identity of any other person on whose behalf the trader is acting.

That is a softer reading than the statute it is summarising. **I am flagging the
divergence rather than picking the convenient side.** The statute is the law; the
guidance is what the enforcing body says it will do. Both matter and they point
different ways.

**LAW.** The older instrument is on the softer side too. The
[Consumer Contracts Regulations 2013, Schedule 2, paragraph (b)](https://www.legislation.gov.uk/uksi/2013/3134/schedule/2)
requires:

> the identity of the trader (such as the trader's trading name)

**LAW, EU.** The EU is identical on this point.
[Consumer Rights Directive 2011/83/EU, Article 6(1)(b)](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02011L0083-20220528):
"the identity of the trader, such as his trading name". **No UK/EU divergence on
the name.**

**LAW.** The [E-Commerce Regulations 2002, reg 6(1)(a)](https://www.legislation.gov.uk/uksi/2002/2013/regulation/6)
says only "the name of the service provider", with no trading-name gloss at all.

**COULD NOT ESTABLISH.** Whether "the name of the service provider" in reg 6(1)(a)
is satisfied by a trading name alone for an individual. I found no UK case law and
no official guidance settling it. The safer reading is that it means his name;
I cannot prove that is the required reading.

**LAW.** [Companies Act 2006, s.1200](https://www.legislation.gov.uk/ukpga/2006/46/section/1200)
catches "an individual … carrying on business in the United Kingdom under a
business name", meaning any name other than his own surname plus permitted
additions. "un-claude" is a business name. [Section 1201](https://www.legislation.gov.uk/ukpga/2006/46/section/1201)
then defines what must be disclosed:

> The "information required by this Chapter" is—(a) in the case of an individual,
> the individual's name; … and, in relation to each person so named, an address at
> which service of any document relating in any way to the business will be
> effective. (2) If the individual … has a place of business in the United
> Kingdom, the address must be in the United Kingdom.

**And here is the part that matters most, because it narrows the obligation
rather than widening it.** [Section 1202(1)](https://www.legislation.gov.uk/ukpga/2006/46/section/1202)
lists exactly where that disclosure must appear:

> (a) business letters, (b) written orders for goods or services to be supplied to
> the business, (c) invoices and receipts issued in the course of the business,
> and (d) written demands for payment of debts arising in the course of the
> business.

**A website is not in that list.** Companies must put their name on their
websites, but that duty comes from a different instrument that applies to
companies, not from Part 41. Section 1202(2) adds a duty to give the name and
service address "immediately … by written notice" to anyone he does business with
who asks for it.

**So the Companies Act requires Jon's own name on the receipt and on request. It
does not require it on the website.**

### 1c. Recommendation on the name

**Publish it, in the form "[Jon’s full legal name], trading as un-claude", on one
page, linked from the pricing page and the checkout.**

Three reasons, and the third is the commercial one.

**First, the statute beats the guidance if it ever comes to it.** s.230(6) says
"and", not "or". The CMA's summary is not the law, and a trader relying on a
regulator's paraphrase against the words of the Act is in a weak position. The
downside of publishing is that a name is public. The downside of not publishing
is an argument with a regulator that has fining powers of up to 10% of global
turnover.

**Second, it is on a public register anyway, so the privacy gained is small.** The
ICO publishes "the name and address of the controller" and "any other trading
names" on a register that is searchable and downloadable
([ICO, *Information we will collect and publish*](https://ico.org.uk/for-organisations/data-protection-fee/data-protection-fee/information-we-will-collect-and-publish/)).
The ICO's own sole-trader registration form prompts for a personal name — its
worked example is "Anna Katherine Smith"
([ICO, *New registration*](https://ico.org.uk/for-organisations/data-protection-fee/register/new-registration/)).
Anyone motivated enough to look up who runs un-claude will find him. **Not
publishing the name buys obscurity from casual visitors, not from anyone
determined.**

**Third, and this is the one I would press hardest: in this category the name is
an asset.** A watermark remover with no named human behind it reads exactly like
the thing a sceptical journalist, a Stripe reviewer or a university press office
expects to find. A named individual who signs an honest claims boundary reads
like the opposite. The site's whole competitive argument is *we tell you which
parts are provable and which are not*. A refusal to say who "we" is undercuts the
best sentence on the site.

**If Jon rejects that — and it is his call — the defensible fallback.** Publish
the trading name, a service address, and an email prominently; state on the same
page that un-claude is operated by an individual sole trader in the United
Kingdom, and that the trader's name is available on request and is on the ICO
register of fee payers. **That position is supported by CMA207 ¶4.16 and by CCR
Schedule 2(b) and it is a position rather than a hole.** It is weaker against the
words of s.230(6), and I would not describe it to him as safe.

**What is not available: silence.** Neither route allows the site to say nothing
about who the trader is.

### 1d. The address — and this is where there is least room

Every one of the four instruments wants an address, and Stripe's contract wants
it too.

**LAW.** [DMCC s.230(2)(e) and s.230(7)](https://www.legislation.gov.uk/ukpga/2024/13/section/230):

> (e) the business address and, if different, the service address of the trader
> and any business email address of the trader;
>
> (7) … "business address", in relation to a person, means— … (c) in a case where
> neither paragraph (a) or (b) applies, the address of the person's principal
> place of business; … "service address", in relation to a person, means the
> address at which the person will accept service of documents.

**Read carefully, this asks for the principal place of business, and treats the
service address as an addition rather than a substitute.** If Jon's principal
place of business is his home, a literal reading wants the home address, with the
service address alongside it. That is an uncomfortable finding and I am not going
to soften it.

**JUDGEMENT, and it is the practical fix.** Make the service address genuinely be
the business address. If Jon rents a serviced-office or mail-handling address and
uses it as the address of the business — on the ICO registration, on receipts, at
Stripe, on the site — then the "principal place of business" and the "service
address" coincide and there is one address to publish and it is not his home.
This is not a trick; it is what the address is for. What does not work is keeping
the business at home and bolting a forwarding address on top, because then the two
addresses differ and s.230(2)(e) asks for both.

**LAW.** The other instruments are consistent with a service address:
[CCR Sch 2(c)](https://www.legislation.gov.uk/uksi/2013/3134/schedule/2)
wants "the geographical address at which the trader is established";
[ECR reg 6(1)(b)](https://www.legislation.gov.uk/uksi/2002/2013/regulation/6)
wants "the geographic address at which the service provider is established";
[CA 2006 s.1201](https://www.legislation.gov.uk/ukpga/2006/46/section/1201)
wants "an address at which service of any document … will be effective", in the
UK if he has a UK place of business.

**JUDGEMENT.** A serviced office or mail-forwarding address that will accept
service of legal documents satisfies all of these. **A bare PO Box probably does
not**, because s.1201(3) contemplates delivery capable of being acknowledged and
because "geographic address" in the e-commerce rules is generally read as a real
place. **COULD NOT ESTABLISH:** I found no authority prohibiting a PO Box outright
for a UK-established sole trader, so treat the PO Box point as my reasoning rather
than a rule.

**The one genuine exception, and it is worth taking.** The ICO expressly permits
an alternative address so a home address is not published on its register.
[ICO, *Pay a data protection fee* privacy notice](https://ico.org.uk/global/privacy-notice/pay-a-data-protection-fee/):

> If you are a sole trader or small organisation we understand that the address
> you use in the course of your business might be a domestic address. If this is
> the case, and you do not want the address to be made public on the register of
> controllers, please provide a PO Box or alternative address instead.

**Recommendation on the address: get a real service address before opening
Stripe, and use it everywhere as the business address.** It is the single cheapest
action in this whole note and it is the only one that changes what a stranger can
find out about where Jon lives.

### 1e. Can any of it be given on request rather than published?

**Partly, and less than one would hope.**

| Item | On request? | Source |
|---|---|---|
| Name and service address, to someone he does business with | **Yes, that is the rule** — "immediately … by written notice" on request | [CA 2006 s.1202(2)](https://www.legislation.gov.uk/ukpga/2006/46/section/1202) |
| Name, in an invitation to purchase | **No.** It is material information that must be *in* the invitation | [DMCC s.230(1)](https://www.legislation.gov.uk/ukpga/2024/13/section/230) |
| Address, before the card form | **No.** Stripe's contract requires it disclosed beforehand | Stripe Payments Services Terms §3.4(b) |
| Address, for a Japanese sole trader | Yes — and only there | Stripe Payments Services Terms, Japan Regional Terms 15.2 |
| Home address, on the ICO public register | **Yes, substitute an alternative address** | [ICO privacy notice](https://ico.org.uk/global/privacy-notice/pay-a-data-protection-fee/) |

**On "can it live on a linked page rather than the pricing page itself" —
carefully.** [DMCC s.230(8)](https://www.legislation.gov.uk/ukpga/2024/13/section/230)
allows for "any limitations resulting from the means of communication … including
limitations of space or time" and "any steps taken by the trader to overcome those
limitations by providing information by other means". CMA207 ¶4.22 says those
other means "could include providing a hyperlink or QR code". **But ¶4.19–4.21
make clear this escape is aimed at packaging, radio adverts and small screens — a
website has no space limitation.** And s.230(9) provides that omitting information
includes providing it "(a) in a way that is unclear or untimely, or (b) in such a
way that the consumer is unlikely to see it", with CMA207 giving a worked example
of a link that fails because it is "placed at the bottom of the webpage in a font
that makes it difficult to pick out".

**JUDGEMENT: a clearly-labelled "Who you are dealing with" link, in the body of
the pricing page and again at checkout, is defensible. The same information
reachable only through a footer link to the terms is not.**

### 1f. The data controller sentence — the thing this unblocks

**LAW.** [UK GDPR Article 13(1)(a)](https://www.legislation.gov.uk/eur/2016/679/article/13)
requires the controller to provide "the identity and the contact details of the
controller". The ICO's checklist phrases it as "The name and contact details of
our organisation"
([ICO, *Right to be informed*](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/right-to-be-informed/)).

**For a sole trader, the controller is the individual.** There is no other legal
person available to be one.

**COULD NOT ESTABLISH.** Whether a trading name alone satisfies "the identity of
the controller" under Article 13. I found no ICO or EDPB guidance addressing it
directly. The Article 29 Working Party transparency guidelines
([WP260 rev.01](https://www.cnil.fr/sites/cnil/files/atoms/files/wp260_enpdf_transparency.pdf),
read in full — the EDPB's own copy of this URL currently 404s, so this is the
CNIL-hosted original) recommend at ¶36 that the first layer of a layered notice
"should include the details of the purposes of processing, the identity of
controller and a description of the data subject" rights. **They nowhere define
the form the controller's name must take.**

**Related and worth knowing: Jon almost certainly owes the ICO fee.** Tier 1 is
**£52, with an automatic £5 discount for direct debit**, for an organisation with
"a maximum turnover of £632,000 … or no more than 10 members of staff"
([ICO, *Guide to the data protection fee*](https://ico.org.uk/for-organisations/data-protection-fee/data-protection-fee/)
— read at source today).
He should run the ICO's own self-assessment rather than take my word for whether
an exemption applies.

**Recommendation for the privacy policy controller sentence: name him, with the
service address and the business email.** If he takes the fallback in 1c, the
honest version of the sentence names the trading name, states that the controller
is a named individual trading under it, and says the name is on the ICO register
and available on request. Draft wording for both versions is in section 9.

---

## 2. Jurisdiction and governing law

### 2a. What to name

**Recommendation: English law, with non-exclusive jurisdiction and an express
preservation of the consumer's home-court rights.** If Jon is in Scotland,
substitute Scots law and the Scottish courts throughout — the reasoning is
identical and the answer changes.

**Why naming a law is worth doing even though it does not achieve much.**

**LAW.** [Rome I, Article 6(2)](https://www.legislation.gov.uk/eur/2008/593/article/6)
(retained in UK law):

> the parties may choose the law applicable to a contract … Such a choice may not,
> however, have the result of depriving the consumer of the protection afforded to
> him by provisions that cannot be derogated from by agreement by virtue of the
> law which, in the absence of choice, would have been applicable

Article 6(1) makes the consumer's own country's law the default where the trader
"directs" activities there — which a site selling internationally does. **So a
German customer keeps German consumer protections whatever the terms say.**

**LAW.** The mirror rule protects UK consumers from the same trick.
[Consumer Rights Act 2015, s.74](https://www.legislation.gov.uk/ukpga/2015/15/section/74):
if a non-UK law is chosen "but the consumer contract has a close connection with
the United Kingdom, this Part applies despite that choice."

**JUDGEMENT: name the law anyway.** It settles the default for everything the
consumer's home law does not mandate, it settles B2B use entirely, and its absence
is conspicuous. The reconciliation note's D1 was right that inventing a
jurisdiction with no entity behind it would be a false statement — but naming the
law of the place where the trader actually lives and works is not an invention.
**There is no entity, but there is a trader, and he is somewhere.**

### 2b. The jurisdiction clause needs care

**JUDGEMENT, and it is the part people get wrong.** A clause forcing consumers to
sue only in England is likely to be unfair and unenforceable against EU consumers,
who can sue where they live. Under
[CRA 2015 s.62](https://www.legislation.gov.uk/ukpga/2015/15/section/62)
an unfair term "is not binding on the consumer", unfairness being a term that
"contrary to the requirement of good faith … causes a significant imbalance in the
parties' rights and obligations … to the detriment of the consumer."

**Recommendation: "non-exclusive", plus an explicit sentence that a consumer may
bring proceedings in the courts of the country where they live.** Giving away
something that could not be kept costs nothing and removes an unfair-terms
argument.

### 2c. One thing to *not* add

**LAW.** [Regulation (EU) 2024/3228](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202403228),
Article 1, in terms: *"Regulation (EU) No 524/2013 is repealed with effect from
20 July 2025."* Article 2 discontinues the European Online Dispute Resolution
platform and closed it to new complaints on 20 March 2025. The obligation to link
to it went with its legal base. Many terms-of-service templates still carry an ODR link. **Do not add
one — it would point at a dead service.**

---

## 3. Distance selling: does the 30-day refund satisfy the withdrawal right?

### 3a. The short answer

**No, and generosity is not the reason it fails.**

`03-pricing.md` P6 gives unspent credits back at the price paid, no questions, for
30 days. That is more generous than 14 days in *duration*. It is narrower in
*scope*, and scope is what the statute is about.

**Three ways the current policy falls short of the statutory right.**

**One — it refunds less.** A consumer exercising the statutory right gets the whole
price back, not the unspent portion. Spent credits are excluded by P6; they are not
excluded by the statute unless the right has been properly lost.

**Two — it is not described as a right.** [CCR Schedule 2(l)](https://www.legislation.gov.uk/uksi/2013/3134/schedule/2)
requires "where a right to cancel exists, the conditions, time limit and procedures
for exercising that right", and [reg 13](https://www.legislation.gov.uk/uksi/2013/3134/regulation/13/made)
requires the model cancellation form from Schedule 3 Part B. A goodwill policy in
different words does not discharge an obligation to state a statutory right.

**Three — the right has not been waived, because the waiver has three parts and
none of them exist yet.**

### 3b. What the waiver actually requires

**LAW, UK.** [CCR 2013, reg 37](https://www.legislation.gov.uk/uksi/2013/3134/regulation/37/made):

> Under a contract for the supply of digital content not on a tangible medium, the
> trader must not begin supply of the digital content before the end of the
> cancellation period provided for in regulation 30(1), unless—(a) the consumer
> has given express consent, and (b) the consumer has acknowledged that the right
> to cancel the contract under regulation 29(1) will be lost.

And reg 37 goes on: if the consumer cancels after supply began, they pay nothing
where they did not consent, or consented without acknowledging, **or the trader
failed to give the confirmation required by reg 16**.

**LAW, UK.** [CCR 2013, reg 16](https://www.legislation.gov.uk/uksi/2013/3134/regulation/16/made)
requires confirmation of the contract "on a durable medium", within a reasonable
time and before performance begins, including "confirmation of the consent and
acknowledgement" where digital content is involved.

**LAW, EU.** [CRD Article 16(m)](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02011L0083-20220528),
as amended, is explicitly three-part:

> (i) the consumer has provided prior express consent to begin the performance
> during the right of withdrawal period; (ii) the consumer has provided
> acknowledgement that he thereby loses his right of withdrawal; and (iii) the
> trader has provided confirmation in accordance with Article 7(2) or Article 8(7).

**LAW, UK.** The clock: [reg 30](https://www.legislation.gov.uk/uksi/2013/3134/regulation/30/made)
— for service and digital content contracts "the cancellation period ends at the
end of 14 days after the day on which the contract is entered into."

### 3c. The wrinkle that makes this genuinely hard

**A credit pack is not obviously "digital content", and it is not obviously a
"service" either, and the right answer changes the wording.**

- **If digital content:** the credits land in the balance the moment payment
  clears. Supply has begun. Consent plus acknowledgement plus confirmation kills
  the right, cleanly, at purchase. This is the route Jon wants.
- **If a service:** [CRD Article 16(a)](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02011L0083-20220528)
  only removes the right "after the service has been **fully performed**". **A
  credit pack with credits left in it has not been fully performed.** On that
  reading the 14-day right survives every purchase until the balance hits zero,
  and a customer could spend nine of ten credits on day 13 and cancel for a full
  refund.

**JUDGEMENT: the digital-content characterisation is the better one, because what
is delivered at purchase is a balance, immediately and in full, and the later jobs
are the consumption of a thing already supplied.** I hold that with moderate
confidence, not high. **This is item 1 on the professional-advice list in section
8 and it is the one I would actually pay for**, because it decides both the
checkout wording and how much money is at risk.

### 3d. The "obligation to pay" button, which is a separate trap

**LAW, UK.** [CCR 2013, reg 14](https://www.legislation.gov.uk/uksi/2013/3134/regulation/14/made):
the consumer must explicitly acknowledge that the order implies an obligation to
pay; a button must be "labelled in an easily legible manner only with the words
'order with obligation to pay' or a corresponding unambiguous formulation"; and if
the trader has not complied, **"the consumer is not bound by the contract or
order."**

**LAW, EU.** [CRD Article 8(2)](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02011L0083-20220528)
is the same, in the same words, with the same consequence.

**JUDGEMENT.** Stripe Checkout's default button reading "Pay £9" is very likely "a
corresponding unambiguous formulation". **COULD NOT ESTABLISH:** I found no
decided case or CMA or Commission statement confirming that Stripe's default label
passes. Stripe Checkout exposes a `submit_type` parameter, so `pay` can be set
deliberately rather than left to `auto`.

### 3e. Recommendation

**Keep 30 days. Keep no-questions-asked. Add the statutory right beside it rather
than instead of it, and take the waiver properly at checkout.**

Concretely, and all five are needed:

1. State the 14-day right and how to use it, with the model cancellation form
   available. Schedule 2(l), reg 13.
2. A checkbox at checkout, not pre-ticked, carrying both the consent and the
   acknowledgement. Reg 37(1).
3. A confirmation email on purchase that repeats the consent and acknowledgement.
   Reg 16. **This is the one that is currently missing entirely and it is the one
   that voids the waiver if omitted.**
4. Put the refund policy on the pricing page. `03-pricing.md` §12 row 8 already
   lists this as a Stripe prerequisite.
5. Show prices inclusive of tax. [CCR Sch 2(f)](https://www.legislation.gov.uk/uksi/2013/3134/schedule/2),
   [DMCC s.230(2)(b) and (4)](https://www.legislation.gov.uk/ukpga/2024/13/section/230).

### 3f. One UK/EU divergence that costs a phone number

**LAW, UK.** [CCR Schedule 2(c)](https://www.legislation.gov.uk/uksi/2013/3134/schedule/2)
requires the geographical address "and, **where available**, the trader's telephone
number, fax number and e-mail address".

**LAW, EU.** [CRD Article 6(1)(c)](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02011L0083-20220528),
as amended by the Omnibus Directive (EU) 2019/2161, requires "the geographical
address at which the trader is established **as well as** the trader's telephone
number and email address". The "where available" qualifier is gone and fax is
gone.

**The UK did not follow that amendment.** So: **a phone number is optional for UK
customers and mandatory for EU customers.** Stripe requires one anyway (§5b), so
this costs nothing beyond buying a VoIP number.

### 3g. VAT, mentioned once because it is a real consequence of selling to the EU

**LAW.** UK VAT registration is only required above £90,000 turnover
([gov.uk](https://www.gov.uk/register-for-vat)), so domestically Jon has room.
**But there is no threshold for supplying digital services to EU consumers.** VAT
is due in the customer's country from the first sale, collected via the non-Union
One Stop Shop, for which a non-EU business registers in a single member state
([European Commission, OSS](https://vat-one-stop-shop.ec.europa.eu/one-stop-shop/declare-and-pay-oss_en)).

**JUDGEMENT.** Two honest options: register for non-Union OSS, or sell through a
merchant-of-record who becomes the seller of record and handles it. The second
conflicts with the decision to use Stripe. **This is an accountant's question, not
mine, and it belongs with the record-retention number that D2 of the
reconciliation note already sends to an accountant.**

---

## 4. Liability wording for a service with an openly best-effort layer

### 4a. What cannot be limited against a consumer, whatever the terms say

**LAW.** [CRA 2015 s.65](https://www.legislation.gov.uk/ukpga/2015/15/section/65):
"A trader cannot by a term of a consumer contract or by a consumer notice exclude
or restrict liability for death or personal injury resulting from negligence."

**LAW.** [CRA 2015 s.47](https://www.legislation.gov.uk/ukpga/2015/15/section/47):
a term of a contract to supply digital content is not binding to the extent it
would exclude or restrict liability under **s.34** (satisfactory quality),
**s.35** (fit for particular purpose), **s.36** (as described), **s.37**
(pre-contract information), **s.41** (right to supply). It also catches indirect
exclusions — making a remedy restrictive, conditional or disadvantageous.

**LAW.** [CRA 2015 s.57](https://www.legislation.gov.uk/ukpga/2015/15/section/57):
a term of a services contract is not binding to the extent it excludes liability
under **s.49** (reasonable care and skill) or **s.50** (information binding), and
liability may not be restricted "if it would prevent the consumer in an
appropriate case from recovering the price paid or the value of any other
consideration."

**LAW.** [CRA 2015 s.62](https://www.legislation.gov.uk/ukpga/2015/15/section/62):
an unfair term is not binding at all.

**Reading those together, the floor is: the price paid, always recoverable; care
and skill, never excludable; the description, never excludable.**

### 4b. What can honestly be limited

**JUDGEMENT, built on the sections above.**

- Indirect and consequential loss, loss of profit, loss of opportunity, loss of
  reputation. Standard and generally fair against a consumer where the direct
  remedy survives.
- An aggregate cap, **provided it never falls below the price paid** (s.57) and is
  not so low as to be an unfair imbalance (s.62).
- Anything arising from the customer's own breach of the acceptable use policy.
- Third-party decisions — what a detector reports, what a university concludes.
  **This is not a limitation of liability at all, it is a description of what the
  service does not do**, and it is stronger for being framed that way.

### 4c. Where the current terms are wrong, and it is two sentences

The terms at `apps/web/app/(marketing)/(legal)/terms-of-service/page.tsx` say:

> To the fullest extent the law allows, we are not liable for indirect or
> consequential losses, loss of data, or loss of opportunity arising from your use
> of Un-Claude. Where liability cannot be excluded, it is limited to the greater of
> the amount you have paid us in the previous six months or 50 US dollars.

**The cap is fine and the $50 floor is better than most.** Two problems:

**"Loss of data" is the wrong exclusion for this product.** The tool operates on
the customer's document. Excluding data loss in a service whose entire job is to
hand back a modified version of the customer's file is exactly the kind of term
s.47(2) and s.62 are written for. **Recommendation: drop it.** The retention
position — nothing is kept — is a better answer to the same worry and it is true.

**"The service is provided as it is, without warranties of any kind"** is not
binding against a UK or EU consumer at all, because ss.34–36 and s.49 are
imported by statute and s.47/s.57 forbid excluding them. The saving sentence
underneath helps, but a term that tells consumers they have no warranties when the
law gives them several is itself a fairness problem. **Recommendation: qualify it
in the same sentence rather than a paragraph later.**

### 4d. The most useful thing in this section

**The accurate description of layer B is worth more than any exclusion clause, and
it already exists.**

[CRA s.36](https://www.legislation.gov.uk/ukpga/2015/15/section/47) makes digital
content non-conforming if it does not **match its description** — and that liability
cannot be excluded. So the question a court would actually ask is not "did the
disclaimer work" but "was it as described".

The terms currently say the rewriting step "is best effort and we cannot verify
it", that no public detector for statistical watermarks exists, that the result is
labelled unverified, and that "anyone who guarantees this is telling you something
nobody can currently know."

**That paragraph is the liability protection.** A customer who buys a thing
described as unverifiable, and receives an unverifiable thing, has received what
was described. **The honest sentence and the defensive sentence are the same
sentence here, which is a rare and valuable position, and it is worth saying to
Jon explicitly: the reason the terms are defensible is that they are true.**

**Corollary, and it is the real risk.** Every time marketing copy overstates layer
B, it moves the description and therefore moves the s.36 liability. **The claims
boundary in `.claude/skills/unclaude-messaging/SKILL.md` is not a tone rule. It is
the liability limit.**

---

## 5. Stripe

### 5a. Will Stripe onboard an individual for this?

**Yes on the individual part.** `individual` is a valid business type for a GB
account. Queried against Stripe's own documented requirements endpoint, a GB
individual account with card payments currently requires exactly this — **real
output, run today**:

```
business_profile.mcc
business_profile.product_description
business_profile.support_phone
business_profile.url
external_account
individual.address.city
individual.address.line1
individual.address.postal_code
individual.dob.day
individual.dob.month
individual.dob.year
individual.email
individual.first_name
individual.last_name
individual.phone
tos_acceptance.date
tos_acceptance.ip
```

Source: `https://docs.stripe.com/_endpoint/get-requirements-for-setups` with
`platformCountry=GB, accountCountry=GB, legalEntityType=individual,
capabilities[0]=card_payments`, documented at
[Stripe, *Required verification information*](https://docs.stripe.com/connect/required-verification-information).

**Two things to notice.** `business_profile.support_phone` is required — **Jon
needs a phone number for Stripe regardless of what UK consumer law says.** And
Stripe collects his personal name, date of birth and home address for KYC whatever
appears on the site; what the site publishes and what Stripe holds are different
questions.

**On the category: not prohibited, not restricted, but exposed to three
catch-alls.** I searched the full live text of
[Stripe's UK Prohibited and Restricted Businesses list](https://stripe.com/gb/legal/restricted-businesses)
for "essay", "academic", "plagiarism", "term paper", "cheat" and "watermark".
**No matches.** Several third-party articles claim essay mills were added to the
restricted list in 2020; that is not in the current text. The clauses that could
be pointed at un-claude are:

- "Products and services that infringe on intellectual property rights"
- "Document falsification services"
- "No-value-added services, including the sale or resale of a service without
  added benefit to the buyer"
- "Any other businesses that Stripe considers unfair, deceptive or predatory
  towards consumers"

**JUDGEMENT: the risk is not rejection at signup, it is revocation later.** The
restricted-business preamble states that approval "may be modified or revoked by
Stripe at any time per the terms of the Stripe Services Agreement." A product
whose site claims more than it can prove is the one that gets revoked after a
complaint. **The site's honesty is, again, the mitigation.**

### 5b. What Stripe requires disclosed

**This is contract, not guidance.** Stripe Payments Services Terms §3.4(b),
within the [Stripe Services Agreement — Services Terms](https://stripe.com/gb/legal/ssa-services-terms):

> User must prominently and clearly disclose User's name, address, and country
> location to Customers before Customers are prompted to provide payment card
> information.

**The sole-trader relief exists and Jon cannot use it.** The Japan Regional Terms
§15.2 replace §3.4(b) with a version adding "except that User may choose to
disclose User's address to Customers promptly upon request if User is an
individual or sole proprietor". **I checked the United Kingdom, Switzerland and
Gibraltar Regional Terms and the EEA Regional Terms: neither modifies §3.4(b).**
So the base rule applies to Jon and the address goes on the site before checkout.

**The UK Regional Terms add a telephone requirement.** §15.3:

> User must make customer service information readily available to User's
> Customers, including clear instructions on how User's Customers can contact User
> by email and telephone.

**And the website checklist**
([Stripe, *Website checklist*](https://docs.stripe.com/get-started/checklist/website))
wants: a description of what is sold, the purchase currency stated explicitly,
customer service contact by **multiple direct methods — "something besides contact
forms"**, fulfilment policies including a refund policy, any legal restrictions, a
privacy policy, promotion terms, HTTPS and a PCI statement, and card logos. On the
address the checklist is soft — "If you have a physical address, listing it on
your website adds credibility" — but §3.4(b) above is not soft, and the contract
governs.

**Two live gaps against that checklist.** The contact page "does not send anything
to us" per the privacy policy, so the site currently offers one direct method
(email) where Stripe asks for more than one and expressly discounts forms. And the
contact address is `unclaudeapp@gmail.com`, which is serviceable but is not a
"business email address" in the sense
[DMCC s.230(7)](https://www.legislation.gov.uk/ukpga/2024/13/section/230) uses
and reads as amateur to a reviewer.

### 5c. What the customer sees

**Useful, and better than expected.** Stripe's public business information —
what appears on statements and email receipts — is the **business name**, website
URL, support email, phone and address, support URL and statement descriptor
([Stripe, *Set up your account*](https://docs.stripe.com/get-started/account/set-up)).
The statement descriptor must "reflect your Doing Business As (DBA) name"
([Stripe, *Statement descriptors*](https://docs.stripe.com/get-started/account/statement-descriptors)).

**So "UN-CLAUDE" can be what appears on the customer's card statement, and the
support address on the receipt can be the service address.** Jon's legal name is
not automatically pushed to customers by Stripe.

**COULD NOT ESTABLISH.** Whether a Stripe-hosted email receipt can be made to
carry a separate legal-name line such as "[Jon’s full legal name] t/a un-claude". This
matters because [CA 2006 s.1202(1)(c)](https://www.legislation.gov.uk/ukpga/2006/46/section/1202)
requires the name and service address on **receipts**, and the Stripe receipt is
the receipt. **If it cannot, the fix is a short confirmation email sent by
un-claude itself — which section 3e already requires for a different reason
(reg 16), so one email discharges both duties.** That is the single tidiest
finding in this note: **the durable-medium confirmation email and the Companies
Act receipt disclosure are the same email.**

---

## 6. Academic integrity: would the position survive a university complaint?

### 6a. There is a criminal statute and it is narrower than it sounds

**LAW.** The [Skills and Post-16 Education Act 2022, Part 4 Chapter 1](https://www.legislation.gov.uk/ukpga/2022/21/part/4/chapter/1/enacted)
creates two offences for post-16 students at English institutions. Section 26
defines the target:

> a "relevant service" is a service of **completing all or part of an assignment on
> behalf of a student** where the assignment completed in that way could not
> reasonably be considered to have been completed personally by the student

Section 27 makes it an offence to provide or arrange such a service in commercial
circumstances. Section 28 makes it an offence to advertise one to students. Both
are summary offences punishable by fine.

**JUDGEMENT: un-claude is outside s.27.** The user brings finished text. Layer A
removes invisible characters, the metadata layer strips file provenance, layer B
rewrites words the user already has. **Nothing is authored on the student's
behalf; no assignment is completed.**

**The argument on the other side, stated fairly because it is not frivolous.**
Layer B does emit new words. A prosecutor could argue that rewriting an
AI-generated draft is "completing … part of an assignment". **I think that is
weak** — the tool originates no substance and takes no instruction about the
assignment — **and s.27 also provides a defence where the provider did not know
and could not reasonably have known the student would present it as their own
work. But it is not zero.** **A peer-reviewed article addresses exactly this
question** — *AI providers as criminal essay mills? Large language models meet
contract cheating law*, [Information & Communications Technology Law (2024)](https://www.tandfonline.com/doi/full/10.1080/13600834.2024.2352692).
**I could not read it: the publisher returned 403 and it appears to be paywalled.
I know its title and nothing else, so it is a pointer for a lawyer rather than
support for anything above.** Nothing in my reasoning rests on it.

### 6b. The advertising offence is the sharper edge

**s.28 catches advertising a relevant service to students**, and the ASA has said
publishers should not carry such advertising and that it "would seek to take
robust action, along with our Trading Standards backstop if required"
([ASA/CAP](https://www.asa.org.uk/news/running-down-those-mills-essay-mills-now-illegal-in-england.html)).
The CAP Code applies to any marketing targeted at a UK audience.

**Recommendation, and it is a marketing constraint with a criminal statute behind
it:** never target students, and never frame the product against an academic
detector. No "beat Turnitin", no "get past your university's checker", no student
discount, no campus channels, no exam-season campaign. **This belongs in
`.claude/skills/unclaude-messaging/SKILL.md` as a hard prohibition, because it is
the one copy rule where the downside is criminal rather than commercial.**

### 6c. Would the AUP survive a complaint?

**JUDGEMENT: yes, and I would not change it.** I agree with D4 of the
reconciliation note and reach it by a different route.

**A university has no obvious cause of action against a tool vendor.** It has no
contract with un-claude and no property right in a student's essay. The realistic
vectors are a press story, a complaint to Stripe, a complaint to the ASA about an
advert, and political pressure. **The acceptable use policy's job is to make the
middle two survivable, and it does that well:** it names the legitimate uses
first, prohibits deceiving "a school, an employer, a publisher, a client, or
anyone else who is relying on your word about how something was made", and adds
that an institution's rule "is between you and them, and this tool does not change
it."

**The one thing I would add is the one D4 already identified:** a suspension
sentence in "Ending your use" saying access may be suspended on reasonable belief
of breach, and what happens to a balance. Draft wording in section 9.

**The one thing I would not add, agreeing with D4 and against what a
risk-averse instinct suggests:** a broad "you may not violate any academic policy
anywhere" clause. It would prohibit the product's most common use, which makes the
whole document read as knowingly unenforced, and an unenforced prohibition is
worse evidence than no prohibition.

---

## 7. Practical risk reduction available without an entity

Ordered by value for money.

**1. Insurance. This is the substitute for the thing that does not exist, and it
is the highest-value item on the list.** Professional indemnity, now usually
written as technology errors and omissions, covers claims that the service caused
a customer financial loss; cyber covers a breach. **COULD NOT ESTABLISH: whether
underwriters will write this specific product.** Cover for solo UK software
operators is widely offered, but "AI watermark removal" is a category an
underwriter may decline or load. **Ask a broker early — and treat a refusal as
information, because an underwriter declining the risk is a signal about the risk,
not just about insurance.**

**2. A service address, used as the business address.** Section 1d. Cheap,
required anyway, and it is the only item that changes what a stranger can learn
about where Jon lives.

**3. Keep the terms structured to shrink a claim rather than to deny one.** Cap at
the price paid with a floor; exclude indirect loss; drop "loss of data"; keep the
accurate-description paragraph exactly as it is. A term a court strikes out is
worse than a modest term it upholds, because striking one term invites scrutiny of
the rest.

**4. What is worth not promising — the list, so it is in one place.**

| Never promise | Because |
|---|---|
| Any detection outcome, for any tool, ever | Not knowable; and it is the promise a complaint would be built on |
| A success rate, percentage or score for layer B | Unverifiable; `03-pricing.md` §8 already forbids it |
| That a statistical watermark was removed | Nobody can verify it, including us |
| That layer A removes Claude's watermark | Anthropic adds no hidden characters |
| A refund if flagged by a detector | Ties money to an event outside our control and invites disputes |
| A retention or deletion period no cron job enforces | A checkable claim that fails when checked |
| Any file type not tested with a real file | `06` row 31 |

**5. A separate business bank account.** **PRACTICE, not law, and it does not
create limited liability.** It makes the accounting clean, makes a dispute easier
to evidence, and is what Stripe's `external_account` wants anyway.

**6. Keep the transaction small.** Already true. The P6 arithmetic — a refund
costs about $0.56 and a dispute about $24.50 — is right, and a no-questions refund
policy is the cheapest dispute-prevention available.

**7. Age 18 minimum.** Already ruled (entry 54 ruling 3). Keep it. It removes the
children's-data regime entirely from a product with a student-adjacent audience,
which is a large amount of risk removed by one sentence.

**8. Decide about EU customers deliberately rather than by default.** Selling to
EU consumers brings the OSS VAT registration, the mandatory phone number, and the
Article 16(m) three-part waiver. All are manageable; none should arrive by
accident on the first sale.

---

## 8. What genuinely needs a professional

Four items. Not padding — these are the ones where I would be guessing.

**1. Whether a credit pack is "digital content" or a "service" for the withdrawal
right, and therefore which waiver wording is correct.** Section 3c. This decides
the checkout wording and how much money is exposed. **Worth an hour of a consumer
lawyer's time, and it is the one item on this list I would pay for first.**

**2. Whether publishing only a trading name is defensible under DMCC s.230(6).**
Section 1b sets out the divergence between the statutory text and CMA207. A
solicitor may know how the CMA is actually applying it since April 2025, which I
cannot find from the outside.

**3. Whether a Stripe email receipt discharges CA 2006 s.1202(1)(c).** Section 5c.
Possibly answerable by Stripe support rather than a lawyer, and if the answer is
no, the fix is already required for another reason.

**4. Tax: the EU OSS decision and the record-retention period.** Section 3g, and
D2 of the reconciliation note, which already routes the retention number to the
accountant that entry 65 says is needed.

**Explicitly not on this list: a bespoke terms of service.** The existing terms
are better than most of what is sold as a template, because they were written from
the code. The changes in section 9 are additions and corrections, not a rewrite.

---

## 9. Draft wording

**None of this has been applied. Every block below is a proposal.** Where a
decision from section 1c is needed, both versions are given.

### 9A. "Who you are dealing with" — new section, terms of service

**Version 1, recommended, name published.**

> ### Who you are dealing with
>
> Un-Claude is operated by [Jon’s full legal name], an individual trading as un-claude
> from the United Kingdom. There is no company; the trader is a person, and these
> terms are an agreement with him.
>
> Address for correspondence and for service of documents:
> [service address, United Kingdom]
> Email: [business email]
> Telephone: [number]
>
> These terms are governed by the law of England and Wales. You and we may bring
> proceedings in the courts of England and Wales, and if you are a consumer you
> may also bring proceedings in the courts of the country where you live. Nothing
> in these terms takes away consumer rights you have under the law of the country
> you live in.

**Version 2, fallback, name on request.** Weaker under DMCC s.230(6). Section 1c.

> ### Who you are dealing with
>
> Un-Claude is operated by an individual sole trader in the United Kingdom,
> trading as un-claude. There is no company; the trader is a person, and these
> terms are an agreement with him. His name is registered with the Information
> Commissioner's Office and is given immediately on request by email.
>
> [address, email, telephone, governing law paragraph as above]

### 9B. Controller sentence — privacy policy

**Version 1, matching 9A version 1.**

> ### Who is responsible for your data
>
> The data controller is [Jon’s full legal name], an individual trading as un-claude
> from the United Kingdom, registered with the Information Commissioner's Office.
> There is no company. Write to [business email], or to [service address].
>
> If you think we have handled your data badly, tell us first and we will fix it.
> You can also complain to the Information Commissioner's Office at ico.org.uk,
> or, if you live in the EU, to your own country's data protection authority.

**Version 2, matching 9A version 2.** Replace the first sentence with:

> The data controller is the individual who operates un-claude, trading under that
> name from the United Kingdom and registered with the Information Commissioner's
> Office. His name is on the ICO's public register of fee payers and is given
> immediately on request.

### 9C. Cancellation right — new section, terms of service

> ### Cancelling, and getting your money back
>
> **Two things, and the first is a legal right rather than a policy of ours.**
>
> **Your right to cancel.** If you live in the UK or the EU you have 14 days from
> buying credits to cancel and get your money back, without giving a reason. To
> use it, email [business email] saying you want to cancel — or use the
> cancellation form, which is [here]. We will refund you within 14 days of being
> told.
>
> **This right ends when you use it.** Credits arrive in your balance the moment
> you pay, so the supply has already happened. That is why the checkout asks you
> to agree to immediate delivery and to confirm you understand the 14-day
> cancellation right ends at that point. If you did not agree to that, the right
> is unaffected.
>
> **Our policy, which is more generous and separate from the above.** For 30 days
> after you buy, we refund unspent credits at what you paid for them, no questions
> asked. Credits you have already spent are not refunded. Email us and it is done.
>
> **A failed job never costs anything.** If an operation fails, the credits go
> straight back to your balance. That is automatic and it is not a refund request.

### 9D. Checkout consent — the two sentences that go beside the pay button

> ☐ I want my credits delivered immediately, and I understand that once they are
> delivered I lose my 14-day right to cancel.

**Not pre-ticked. Required to proceed.** Reg 37(1), CRD Art 16(m)(i)–(ii).

**And the confirmation email**, which must go out on every purchase and must
repeat it:

> You bought [pack] for [price] on [date]. You agreed to immediate delivery of
> your credits and confirmed you understood the 14-day cancellation right ends
> when they are delivered.
>
> Sold by [Jon’s full legal name], trading as un-claude, [service address, United
> Kingdom]. [business email]
>
> Unspent credits are refundable at the price paid for 30 days — just reply to
> this email.

**One email, three jobs: the durable-medium confirmation (reg 16), the third limb
of the waiver (CRD Art 16(m)(iii)), and the receipt disclosure (CA 2006
s.1202(1)(c)).**

### 9E. Liability — replacement for the existing section

> ### Liability
>
> **What we are responsible for.** We will provide the service with reasonable
> care and skill, and what you get will match how we have described it on this
> site. If we get that wrong, you can hold us to it, and nothing in these terms
> changes that.
>
> **What we are not responsible for.** We are not liable for indirect or
> consequential loss, lost profits, lost opportunity, or losses that were not a
> foreseeable result of us getting something wrong.
>
> **A limit on the rest.** Where liability can lawfully be limited, ours is
> limited to the greater of what you have paid us in the previous six months or 50
> US dollars.
>
> **What we do not promise, and this is the important one.** We make no promise
> about what any detection tool will report about your content, before or after
> using Un-Claude, and we are not responsible for decisions anyone makes about it.
> The rewriting step is best effort and unverifiable, and we say so everywhere we
> describe it.
>
> **Your legal rights are untouched.** If you are a consumer, you have rights
> under the law of the country you live in that a contract cannot take away —
> including, in the UK, rights under the Consumer Rights Act 2015. Nothing here
> excludes or limits them, and nothing here excludes liability for death or
> personal injury caused by our negligence, or for fraud.

**Three deliberate changes from the current text.** "Loss of data" is gone (§4c).
"Provided as it is, without warranties of any kind" is gone and replaced with a
positive statement of what is promised, because the negative version is not
binding against a consumer anyway and reads as an attempt to remove rights that
cannot be removed. And the consumer-rights saving is a named section rather than a
trailing sentence.

### 9F. Suspension — addition to "Ending your use"

> We may suspend or end access if we reasonably believe these terms have been
> broken. If we do, unspent credits are refunded at the price you paid; credits
> already spent are not. If you think we have got it wrong, email us and a person
> will read it.

**Note this is more generous than D4 of the reconciliation note proposed**, which
suggested suspension without refund of spent credits and was silent on unspent
ones. **JUDGEMENT: refunding the unspent balance on suspension costs about $0.56
and removes the single most likely chargeback in the product** — a suspended user
with money on the account. Keeping their unspent money is the expensive way to
win.

### 9G. Pricing page additions

Required by Stripe's checklist, CCR Schedule 2 and DMCC s.230:

- The refund policy, in full, on the pricing page — not only in the terms.
- Prices stated with the currency named explicitly, not only a symbol.
- Prices inclusive of any tax, with the tax position stated.
- A visible link to "Who you are dealing with" in the body of the page.
- The existence of the 14-day cancellation right, stated in one line with a link.

### 9H. What to remove or never add

- **No ODR platform link.** Dead since 20 July 2025. §2c.
- **No "as is, without warranties of any kind"** standing alone. §4c.
- **No broad academic-policy prohibition.** §6c.
- **No student-targeted marketing of any kind.** §6b — this one has a criminal
  statute behind it.

---

## 10. Sequence, if Jon wants one

Ordered so nothing is done twice and nothing blocks on something later.

| # | Do | Why now |
|---|---|---|
| 1 | **Decide 1c: name published, or trading name with name on request** | Everything else in section 9 has two versions until this is settled |
| 2 | Get a service address and a phone number | Required by Stripe, by the EU rules, and by the DMCC. Lead time |
| 3 | Get a business email off Gmail | Same, and it is a five-minute job |
| 4 | Register and pay the ICO fee, using the alternative address | £52, or £47 by direct debit, and the register entry is a fact the site can point at |
| 5 | Ask a broker about tech E&O and cyber | Long lead time and the answer may be informative in itself |
| 6 | Apply the section 9 wording | Blocked on 1 and 2 |
| 7 | Build the checkout consent box and the confirmation email | Code, not wording. One email discharges three duties |
| 8 | One hour of a consumer lawyer on section 8 item 1 | Before the first EU sale, not after |
| 9 | Open Stripe | Everything above is a prerequisite for it or for surviving its review |

---

## 11. What I did not check, so nobody assumes it was covered

- **Scotland and Northern Ireland.** Everything here assumes England. If Jon is in
  Scotland, the governing-law answer changes and the Skills and Post-16 Education
  Act offences do not apply — they are England-only.
- **The US.** No US consumer-protection, state privacy or FTC analysis was done.
  The site sells internationally and California and Colorado privacy law may reach
  it. Not researched.
- **Whether any competitor has actually been enforced against.** I found no
  enforcement action against a watermark-removal service anywhere. That is an
  absence of evidence, not evidence of safety.
- **Anthropic's or OpenAI's terms of service**, and whether removing a provider's
  provenance marks breaches any of them. Not researched, and it is a real question
  worth its own session.
- **Vercel's and Mistral's terms**, for anything restricting this use case.
- **Trade mark.** "un-claude" contains "Claude", which is Anthropic's mark. Not
  researched here, and it is a separate risk from everything in this note.

---

## 12. Appendix: what was read at first hand, and what was not

**The brief was right that this is where a model confabulates most convincingly.**
So here is the audit trail. Everything in the first list was opened and read
today; every quotation in this note comes from one of them.

**Primary sources read in full or in relevant part**

| Source | Used for |
|---|---|
| [DMCC Act 2024, s.230](https://www.legislation.gov.uk/ukpga/2024/13/section/230) | §1b, §1d, §1e — full statutory text pulled and quoted |
| [CMA207, *Unfair commercial practices* (18 Nov 2025)](https://assets.publishing.service.gov.uk/media/691b9bd821ef5aaa6543ee6f/Unfair_commercial_practices_CMA207_18_Nov_2025__2_.pdf) | §1b, §1e — PDF downloaded and text extracted; ¶4.16–4.23 read |
| [Consumer Contracts Regs 2013 — Sch 2](https://www.legislation.gov.uk/uksi/2013/3134/schedule/2), [reg 13](https://www.legislation.gov.uk/uksi/2013/3134/regulation/13/made), [14](https://www.legislation.gov.uk/uksi/2013/3134/regulation/14/made), [16](https://www.legislation.gov.uk/uksi/2013/3134/regulation/16/made), [30](https://www.legislation.gov.uk/uksi/2013/3134/regulation/30/made), [37](https://www.legislation.gov.uk/uksi/2013/3134/regulation/37/made) | §1a, §3 |
| [Consumer Rights Directive 2011/83/EU, consolidated to 28 May 2022](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02011L0083-20220528) | §1b, §3b, §3d, §3f — Arts 6, 8, 16 read directly |
| [Regulation (EU) 2024/3228](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202403228) | §2c — Articles 1 and 2 read |
| [E-Commerce Regs 2002, reg 6](https://www.legislation.gov.uk/uksi/2002/2013/regulation/6) | §1a, §1b |
| [Companies Act 2006, ss.1200](https://www.legislation.gov.uk/ukpga/2006/46/section/1200), [1201](https://www.legislation.gov.uk/ukpga/2006/46/section/1201), [1202](https://www.legislation.gov.uk/ukpga/2006/46/section/1202) | §1b, §1e, §5c |
| [Consumer Rights Act 2015, ss.47](https://www.legislation.gov.uk/ukpga/2015/15/section/47), [57](https://www.legislation.gov.uk/ukpga/2015/15/section/57), [62](https://www.legislation.gov.uk/ukpga/2015/15/section/62), [65](https://www.legislation.gov.uk/ukpga/2015/15/section/65), [74](https://www.legislation.gov.uk/ukpga/2015/15/section/74) | §2a, §4 |
| [Rome I, Article 6](https://www.legislation.gov.uk/eur/2008/593/article/6) | §2a |
| [UK GDPR, Article 13](https://www.legislation.gov.uk/eur/2016/679/article/13) | §1f |
| [Skills and Post-16 Education Act 2022, Part 4 Ch 1](https://www.legislation.gov.uk/ukpga/2022/21/part/4/chapter/1/enacted) | §6a |
| [ICO — information published on the register](https://ico.org.uk/for-organisations/data-protection-fee/data-protection-fee/information-we-will-collect-and-publish/), [the sole-trader address concession](https://ico.org.uk/global/privacy-notice/pay-a-data-protection-fee/), [registration form](https://ico.org.uk/for-organisations/data-protection-fee/register/new-registration/), [fee tiers](https://ico.org.uk/for-organisations/data-protection-fee/data-protection-fee/) | §1c, §1d, §1f |
| [WP260 rev.01 transparency guidelines](https://www.cnil.fr/sites/cnil/files/atoms/files/wp260_enpdf_transparency.pdf) | §1f — ¶36 read |
| [Stripe Services Agreement — Services Terms](https://stripe.com/gb/legal/ssa-services-terms) | §5b — the whole 646,000-character document was searched; §3.4(b) and the Japan, EEA and UK Regional Terms read side by side |
| [Stripe Prohibited & Restricted Businesses (GB)](https://stripe.com/gb/legal/restricted-businesses) | §5a — full text searched for the category terms |
| [Stripe website checklist](https://docs.stripe.com/get-started/checklist/website), [account setup](https://docs.stripe.com/get-started/account/set-up), [statement descriptors](https://docs.stripe.com/get-started/account/statement-descriptors), [required verification information](https://docs.stripe.com/connect/required-verification-information) | §5a, §5b, §5c — the GB/individual field list was queried live |
| [European Commission, non-Union OSS](https://vat-one-stop-shop.ec.europa.eu/one-stop-shop/declare-and-pay-oss_en), [gov.uk VAT registration](https://www.gov.uk/register-for-vat) | §3g |
| [ASA/CAP on essay mills](https://www.asa.org.uk/news/running-down-those-mills-essay-mills-now-illegal-in-england.html) | §6b |

**Cited but NOT read — treat as pointers only**

| Source | Why not |
|---|---|
| *AI providers as criminal essay mills?*, ICTL (2024) | Publisher returned 403; appears paywalled. Title known, contents unknown. Nothing here rests on it |

**Claims deliberately carrying no source**

Everything tagged **JUDGEMENT** in this note. There are 15 of them and they are
the parts a lawyer would most want to disagree with. They are marked so they can
be attacked separately from the law.

**Three things I looked for and did not find, listed because absence is a
finding**

1. **Any UK authority on whether a trading name alone satisfies "the name of the
   service provider" in E-Commerce Regs reg 6(1)(a).** §1b.
2. **Any ICO or EDPB statement on whether a trading name satisfies "the identity
   of the controller" under Article 13(1)(a).** §1f.
3. **Any enforcement action, anywhere, against a watermark-removal service.**
   §11. That is an absence of evidence, not evidence of safety, and it should not
   be read as comfort.
