# Legal reconciliation — 21 August 2026

**Read-only.** Nothing in the application was changed to produce this. No legal
page was edited. Every quotation below is the real text as it stands in the
repository today, set against the real code, migration or configuration that
contradicts or confirms it.

**I am not a lawyer and neither is Jon.** Nothing here is legal advice. What it
is: an honest account of where the published documents and the running software
disagree, and wording that describes the software accurately. Before money
changes hands, one hour of a real solicitor's or attorney's time reading section
3 of this note is the cheapest insurance this project will ever buy.

---

## Correcting the brief, before anything else

**The brief says the three legal pages are "largely starter-template
boilerplate written long before the product existed." That is not true, and it
matters, because it changes what this session is for.**

The starter kit's stub *was* live to the public — the privacy policy shipped
carrying the literal string "Your terms of service content here" — but it was
replaced on 19–20 August 2026, after the pivot, and it was replaced by reading
the code rather than by editing a template. `04-decision-log.md` entry 54
records that work and Jon's four rulings inside it. The page files themselves
carry the discipline in their own header comments:

> `privacy-policy/page.tsx`: *"Written from the code rather than from a
> template. Every claim is checkable: retention against clean.py and the route
> handlers, account fields against the Supabase schema, browser storage against
> free-uses.ts…"*

So there is no boilerplate to strip out. **The real problem is the opposite and
it is more interesting: the documents were accurate on 20 August, the software
moved underneath them on 20–21 August, and nobody moved them back.** The
credit ledger shipped, `free-uses.ts` was deleted, anonymous sessions arrived,
and three sentences that were carefully verified became false in the same week
they were written.

**That is the lesson worth carrying, and it is already the project's own rule**
(`CLAUDE.md`, `06` row 46): a legal page changes in the same deployment as the
code that makes it wrong. The rule was followed on 19 August. It was not
followed on 20–21 August. Everything in section 1 below is the cost of that.

The brief is also wrong on two of its five "decisions only Jon can make" and on
both of its "compliance gaps." Those are handled where they arise, in sections
3 and 4, with the evidence.

---

## 0. The posture this wording takes, and why

Jon asked for framing that protects him, holds up in law, presents the tool
well, and reduces liability. Those four pull against each other in exactly one
place, and it is worth naming the trade before the wording arrives.

**Five principles, applied throughout.**

**1. Accuracy is the protection, not the shield-language.** A watermark remover
is a category that gets read adversarially — by Stripe's underwriters, by
Google's brand reviewers, by a journalist, and one day possibly by a regulator
or a school's counsel. In that reading, a defensive clause that overreaches is
worse than no clause, because a document caught in one false statement loses
the benefit of the doubt on every true one. **The strongest thing these pages
have going for them is that every sentence is checkable against the code.** That
property is an asset. Section 1 exists because it is currently damaged.

**2. The claims boundary is a liability boundary, not only a marketing one.**
Layers A and metadata are provable; the statistical rewrite is best effort. A
contract that promised removal of "AI watermarking" without that split would be
a false claim in a document Jon signs, and in the US it would be squarely the
kind of statement the FTC treats as a deceptive performance claim. The current
terms get this right — the "What we can and cannot promise" section is the best
thing on the page and none of the wording below weakens it.

**3. Legitimate-use-first framing is the defensive posture, not a softening
of it.** Entry 54 already ruled this and it is correct: naming the real reasons
people use the tool *before* the prohibition is what makes the prohibition
credible. A terms page that only says "do not deceive anyone" reads as a wink.
Do not let anyone "tighten" this by cutting the legitimate uses.

**4. Disclose the model call loudly rather than carefully.** The one moment a
user's document leaves this system is the layer B rewrite. Burying that is the
single highest-risk drafting choice available here — it is the fact a hostile
reader would lead with, and it is trivially provable from network traffic.
Saying it plainly, early, and also at the point of use costs nothing and
removes the story.

**5. Where a fact does not exist, write MISSING.** An invented company name,
address, jurisdiction or retention period is worse than a visible gap: the gap
is an unfinished document, the invention is a false statement. Every MISSING
below is a real thing Jon must supply or decide.

**And the one place the four goals genuinely conflict**, stated so it is a
decision and not an accident: **the strongest liability protection available is
not a clause, it is an entity.** Every disclaimer, cap and jurisdiction clause
in a terms of service is written on behalf of a legal person. Today there is no
legal person other than Jon, so today "we" means Jon, and every limitation
below limits claims against Jon personally. Wording can reduce that exposure.
Only incorporation changes its nature. See decision D1.

---

## 1. Gap list — what the documents claim, against what is true

Ordered by severity. The first four are **actively false today** and were true
when written; they were falsified by the credit-ledger work of 20–21 August.

---

### 1.1 FALSE — Both policies describe a browser storage item that no longer exists

**Privacy policy claims** (`privacy-policy/page.tsx`, "Cookies and browser
storage"):

> One item of local browser storage, `uc.free-sanitises.v1`, counts how many
> free uses you have taken. It holds a number only, never leaves your browser,
> and clearing your browser data removes it.

**Cookie policy claims the same thing** in its table:

> `uc.free-sanitises.v1` (local storage, not a cookie) — Counts your free uses.
> Holds a number only and is never sent to us — Until you clear your browser
> data.

**What is true.** The file that wrote that key is deleted. `git status` shows
`D apps/web/app/(marketing)/_components/workbench/free-uses.ts`, and its
replacement says so in its own header:

> `workbench/credits.ts`: *"This file replaced `free-uses.ts`, which counted
> three free sanitises in localStorage and was the entire 'billing system'
> until this session. The truth now lives in the server's ledger."*

A search of the whole application for that key returns exactly two hits, and
both of them are the legal pages describing it. Nothing writes it. Nothing
reads it.

**Why it matters.** It is the smallest kind of false statement and the easiest
to check — a reader opens their browser's storage inspector, finds nothing, and
now doubts the rest of the page. It is also the *good* direction to be wrong in
(we claim to store something we do not), which is why it ranks below 1.2.

---

### 1.2 FALSE, and this is the one that matters — both policies say cookies are set only after sign-in, and neither mentions the two things now set for everyone

**Cookie policy claims:**

> Supabase session cookies — Keep you signed in. **Set only after you sign in**
> — Until you sign out or they expire.

**Privacy policy claims:**

> Session cookies, **set only after you sign in**, keep you signed in. Signing
> out removes them.

**What is true. Two identifiers are now placed on the device of a visitor who
has never signed in and never created an account.**

**First, an anonymous Supabase session.** The first time anyone uses the tool, a
real account is created for them in the background — `workbench/credits.ts`:

```ts
const { error } = await supabase.auth.signInAnonymously(
  captchaToken ? { options: { captchaToken } } : undefined,
);
```

Its own comment describes the boundary precisely: *"a visitor who only reads the
page never becomes a row anywhere."* True — but a visitor who presses the button
does, without signing in, and the session that results is stored on their
device.

**Second, `uc-guest`, a cookie with a one-year lifetime**, set by
`app/api/tool/clean/route.ts`:

```ts
const GUEST_COOKIE = 'uc-guest';
const GUEST_COOKIE_SECONDS = 60 * 60 * 24 * 365;
...
cookieStore.set(GUEST_COOKIE, user.id, {
  httpOnly: true, sameSite: 'lax', secure: ..., maxAge: GUEST_COOKIE_SECONDS, path: '/',
});
```

The route's comment calls it *"the coat-check ticket: this cookie is how the
guest's credits find them again on the next visit."* That is an accurate
description of a **persistent identifier that survives for a year and links a
returning visitor to their prior activity.**

**Why it matters, and precisely how far.** Both are defensible as *strictly
necessary* — they exist to deliver the credit balance the visitor asked for, and
strictly necessary storage is exempt from consent in the UK and EU. **So this
does not, on its own, create a consent-banner obligation.** What it does create
is a disclosure failure in the one document whose entire value is that its
opening sentence is true, and a claim ("only after you sign in") that is now
demonstrably wrong to anyone who opens their browser's cookie list after
pressing the button once.

---

### 1.3 FALSE — The terms describe a free allowance that is no longer enforced the way they say

**Terms claim** ("Accounts and free use"):

> You may use the tool without an account, subject to a free allowance. **That
> allowance is enforced in your browser and is not a security measure;** we may
> replace it with stronger limits at any time.

**What is true.** It was replaced. The allowance is now a server-side credit
ledger, enforced in the database, in a transaction that locks the account row —
`supabase/migrations/20260819180000_credit_ledger.sql`:

> *"Spending, done in one statement so two requests cannot both pass the check.
> The lock is the point."*

and `credits.ts`:

> *"A balance is never stored: it is the sum of the ledger's deltas, computed by
> the database… Credits are granted and spent by this file or by Stripe's
> webhook, never by anything a visitor can call with their own token."*

**Why it matters.** This one is false in the direction that *understates* the
product, and it is the sentence a Stripe reviewer would notice: the terms tell
them the metering is a browser honour system while the code shows a real ledger.
It also invites the reading that free allowances are ungoverned, which is not
what Jon wants on record once credits are sold.

---

### 1.4 FALSE BY OMISSION — "we do not keep what you give us" is true of content, and the policy does not mention the permanent record that is kept about each job

**Privacy policy claims, as its opening line and its whole positioning:**

> We do not keep what you give us. Text you paste and files you upload are
> processed and returned, not stored.

and:

> If you create an account, we hold your email address and name and nothing
> else.

**What is true about content: the claim holds, and it was verified.** Uploaded
files live inside a Python `tempfile.TemporaryDirectory` for the length of one
request (`engine/server.py` lines 607, 642, 711) and are removed when the block
exits. No table holds submitted text. That part of the policy stands.

**What is not true is "nothing else."** Every credit-spending job writes a
permanent row to `credit_ledger`, and that row holds real facts about the
submission — from the migration:

```sql
endpoint    varchar(32),
input_kind  varchar(32),
words_in    integer,
model_calls integer,
retries     integer,
total_tokens integer,
cost_usd    numeric(12, 8),
seconds     numeric(8, 3),
layer_b     boolean,
created_at  timestamp with time zone not null default now()
```

So the database permanently holds, per account: **that you cleaned something, on
what date and time, whether it was a file or pasted text, how many words it
contained, whether it was rewritten, and what it cost.** No content — but a
history of activity, kept indefinitely, with no stated retention period. The
project intended this and is right to have it (`06` row 64 asked for exactly
it); the privacy policy simply does not mention it exists.

There is a second, smaller omission of the same kind: every request also writes
an application log line (`api/_shared.py`, `usage_record`) carrying the file
**extension** (never the filename), byte size, word counts, timing and the
Vercel request id. That code is careful — *"Words only mean something for text.
A PNG has bytes, not words"* — and it is honest about what it is: *"THIS IS A
LOG LINE, NOT A DATABASE. Vercel's runtime logs are kept for a short window."*
It is arguably covered by "standard server logs" in the third-party table, but
"standard server logs" understates it.

**Why it matters.** "We keep nothing" is this product's single best positioning
line against GPTZero (entry 54 says so explicitly). It is worth more when it is
precisely true than when it is broadly true, because the precise version
survives someone checking. And a subject-access request under UK/EU or
California law reaches the ledger whether or not the policy mentions it.

---

### 1.5 GAP — Cloudflare is loaded on every page for every visitor and appears in neither document

**Both documents list who else is involved.** The privacy policy's table names
Vercel, Supabase, PostHog, Mistral via Vercel AI Gateway, and Google.
**Cloudflare is not among them.**

**What is true.** Cloudflare Turnstile is mounted in the root providers, so it
loads for every visitor on every page, not only on the sign-in form —
`components/root-providers.tsx` renders `<CaptchaTokenSetter siteKey={...} />`
above everything, and the site key is configured
(`NEXT_PUBLIC_CAPTCHA_SITE_KEY=0x4AAAAAAEXKpQRbLAfG3DbU` in `apps/web/.env`).
`CaptchaTokenSetter` renders `<Turnstile>` in invisible mode, which loads a
script from Cloudflare's own domain. **That means Cloudflare receives every
visitor's IP address and browser signals on every page view.**

**What I did NOT verify, said plainly rather than assumed:** whether Turnstile
writes anything to the device in this configuration. Cloudflare documents
Turnstile as privacy-preserving and not used for cross-site tracking, but I
could not confirm from source whether it sets storage, because that happens
inside Cloudflare's own script at runtime. **This needs one browser check before
the cookie policy's opening sentence can be re-asserted with full confidence.**
See item 4.1.

**Why it matters.** It is a genuine omission from a list the policy presents as
complete ("we do not… transfer it to anyone not listed above"). It is also the
easy kind to fix — Turnstile is a security measure, which is the most defensible
category of third party there is.

---

### 1.6 MISMATCH — The terms promise a 30-day money-back window that the pricing page does not mention and no code can execute

**Terms claim:**

> Unspent credits from a purchase are refundable at the price paid for 30 days
> from the purchase.

**This is not false and it is not invented.** It is Jon's own ratified policy —
`03-pricing.md` P6 and section 12 question 4: *"Yes, 30 days, unspent credits
only. A refund costs $0.56 and a dispute costs about $24.50."* The reasoning is
sound and the wording matches it.

**Three things are nonetheless wrong around it.** First, **the pricing page does
not state a refund policy at all** — a search of `pricing/page.tsx` for
"refund" returns only the *operation* refund (credits returned when a run
fails), never the money-back window. Stripe's own onboarding review looks for a
visible refund policy; `03-pricing.md` section 12 row 8 already lists it as a
pre-activation requirement. Second, **nothing can be bought yet**, so the clause
is presently inert — harmless, but it means the promise ships before the
mechanism. Third, **the refund as specified needs data the ledger is only just
ready for**: "unspent credits at the price paid" requires knowing what each
credit cost, which is what `price_cents` on the ledger exists for
(`03-pricing.md` 9b saw this and put the column in the first migration — that
was good foresight, and it holds).

---

### 1.7 GAP — Nobody ever agrees to the terms

**What is true.** The terms-checkbox flag is unset:
`NEXT_PUBLIC_DISPLAY_TERMS_AND_CONDITIONS_CHECKBOX` does not appear in
`apps/web/.env`, so `authConfig.displayTermsCheckbox` is `false` and
`<TermsAndConditionsFormField />` never renders on either sign-up form. There is
no "by creating an account you agree to…" line under the button either. The
only route to the terms is a link in the site footer.

**Why it matters, in plain English.** A contract nobody was shown and nobody
accepted is the weakest form of agreement there is — courts on both sides of the
Atlantic have repeatedly declined to enforce terms a user was never meaningfully
presented with. **Every protective clause in the document — the liability cap,
the acceptable-use prohibition, the "as is" disclaimer — is only as strong as
the acceptance behind it.** This is the cheapest single improvement in this
whole note: one sentence under the sign-up button, and one under the tool's
button for people who never sign up at all.

---

### 1.8 GAP — No retention period is stated for anything

Neither document says how long **anything** is kept: not the account record, not
the credit ledger, not the server logs, not correspondence ("only for as long as
it is useful for answering you" is a sentiment, not a period). The one retention
statement that *is* precise is the one about submitted content, and it is the
strongest sentence on the page — which shows exactly what the others are
missing.

This is a real requirement under UK/EU law and a reasonable expectation
elsewhere. It is also **a decision, not a drafting task**: see D2.

---

### 1.9 GAP — The rights section is thin for a site that names UK and EU law

**Privacy policy claims:**

> Wherever you live, you may ask us to show you what we hold about you, correct
> it, or delete it… If you are in the UK or EU: our lawful basis is performance
> of a contract for account data, and legitimate interest in operating a working
> service for server logs.

**What is missing**, and each of these is standard rather than exotic: **who the
controller is** (there is no named party anywhere in the document — see D1);
**the right to object and the right to portability**, which are named rights
alongside the three listed; **the right to complain to a supervisory authority**
(the ICO in the UK, a member-state authority in the EU) — its absence is one of
the more commonly-cited defects in a policy review; **the fact that data is
processed in the United States** by Vercel, Supabase, PostHog and Cloudflare,
which for a UK/EU visitor is an international transfer that a policy is expected
to acknowledge; and **the lawful basis for analytics**, which the document
covers for account data and logs but not for PostHog.

Also worth noting rather than burying: the layer B lawful basis is the
cleanest thing here — the user presses a button that says rewrite, and the text
goes to the model. That is performance of a contract and it is easy to say.

---

### 1.10 SMALL — Naming the model in the policy is brittle, and the FAQ under-discloses it

The privacy policy names **"Mistral Small, reached through Vercel AI Gateway."**
That was verified live on 19 August (`engine/rewrite_text.py`: *"Verified live
against mistral/mistral-small on 19 August 2026"*). But the model is set by an
environment variable read at runtime — `WATERMARKS_REWRITE_MODEL` in
`engine/server.py` — which does not live in this repository. **Changing one
Vercel setting silently falsifies a legal page.**

Separately, the visitor-facing FAQ says:

> It is processed and deleted. Uploads are held for the length of the request
> and removed when the response is sent. **Nothing you paste or upload is
> stored.**

True — and it omits the one thing a person deciding whether to paste a
confidential document most needs to know, which is that the rewrite sends that
text to a third-party model. The capabilities page has the same shape. **The
policy discloses it properly; the pages people actually read do not.**

---

### 1.11 Checked and CONFIRMED TRUE — so nobody re-audits these

Stated because a gap list that only lists gaps invites the assumption that
everything unmentioned is broken.

- **Content is not retained.** Temp directories, context-managed, verified in
  `server.py`. No table holds submitted text. The opening line of the privacy
  policy stands.
- **Content is not used for training.** No such path exists in the code.
- **PostHog stores nothing on the device.** `persistence: 'memory'`, plus
  `respect_dnt: true`, plus `disable_session_recording: true`, in
  `components/analytics-provider.tsx`. The no-banner claim survives — see 4.1.
- **PostHog never receives content.** `lib/analytics/events.ts` enforces it at
  the single exit point: filenames reduce to an extension from a fixed list,
  sizes and timings are bucketed, `posthog.identify()` is never called.
- **The contact page really does collect nothing.** `contact-form.tsx` builds a
  `mailto:` link; the policy describes this accurately, including the fact that
  the inbox is Gmail.
- **Account deletion exists, works, and is reachable.** `/home/settings` renders
  the danger zone with `enableAccountDeletion: true`, wired to
  `deletePersonalAccountAction` → `adminClient.auth.admin.deleteUser`, and it is
  in the sidebar via `navigation.config.tsx`. Because `credit_ledger.account_id`
  is declared `on delete cascade`, deleting the account takes the ledger history
  with it. **The brief's claim that "users can create accounts but have no way
  to delete them" is wrong.** See D5, which is now a much smaller question than
  the brief assumed.
- **The account fields are as described:** email, name, picture URL, created and
  updated dates, with row-level security restricting each account to its own
  record.
- **Google sign-in is described accurately**, including the revocation link.
- **The claims boundary in the terms is correct** and is the best-drafted
  section on the site. Nothing below weakens it.

---

## 2. Replacement wording, ready to paste

Written as prose for Jon to read and approve. **Do not convert it to TSX until
he has read it** — a legal document is a claim about what the business does, and
this session was explicitly told not to change the pages.

Every `**MISSING:**` marker is a fact that does not exist yet. **None has been
invented.** A page must not ship with a MISSING marker still in it.

---

### 2A. Cookie policy — full replacement

> **Last updated: MISSING — the date this actually ships.**
>
> Un-Claude sets no advertising cookies and no tracking cookies. We do measure
> how many people visit, using a tool that stores nothing on your device at all,
> which is why there is no consent banner on this site.
>
> ## What we do use
>
> Three things stored on your device, all of them needed to run the tool you
> asked for, and two measurement and security tools that store nothing.
>
> | What | Purpose | Lifetime |
> |---|---|---|
> | **A guest session** | The first time you clean something, we create a guest account for your browser so your free credits have somewhere to live. You are not signed in and we do not know who you are. | Until you clear your browser data |
> | **`uc-guest`** (a cookie) | Holds the identity of that guest account, so your credits are still there when you come back, and so they follow you if you later create a real account. It holds one identifier and nothing else, and no script on the page can read it. | One year, or until you clear your browser data |
> | **Supabase session cookies** | Keep you signed in, once you sign in | Until you sign out or they expire |
> | **PostHog analytics** | Counts visits, pages read, and which steps of the tool are used. Configured to store nothing on your device, so it sets no cookie and writes no local storage | Nothing is stored, so there is nothing to expire |
> | **Cloudflare Turnstile** | A background check that tells people apart from automated scripts, so free credits cannot be farmed by a program. It runs on every page. | **MISSING — see item 4.1. Do not publish this row until someone has opened the browser tools on a live page and looked.** |
>
> The first three are what the industry calls strictly necessary: they exist to
> deliver the thing you asked for, they carry no advertising, and they are not
> shared with anyone. That is why there is no consent banner and nothing to opt
> out of.
>
> Signing out clears the session cookies. Clearing your browser data clears
> everything on this page, including your guest credits — we have no way to
> restore them, because we have no way to know they were yours.
>
> If your browser sends a Do Not Track signal, we do not measure your visit at
> all.
>
> ## Questions
>
> unclaudeapp@gmail.com

**Note on the deliberate honesty in "we have no way to restore them."** It is
the natural consequence of not tracking people, it pre-empts a support
complaint, and it is the kind of sentence that makes the rest of the page
believable.

---

### 2B. Privacy policy — replacement sections

Only the sections that change are given. **Everything not listed here stays
exactly as it is** — in particular "What happens to text and files you submit,"
"When you write to us," and "Children," which are accurate.

---

**Replace "The short version" in full:**

> We do not keep what you give us. Text you paste and files you upload are
> processed and returned, not stored. We do not use your content to train
> anything. We run no advertising and no advertising trackers.
>
> There is one exception and we would rather lead with it than bury it: **if you
> use the optional rewrite, your text is sent to another company's AI model to be
> rewritten, and comes straight back.** Nothing else you submit ever leaves our
> systems.
>
> We measure how many people visit, which pages they read, and which steps of the
> tool they use, with a tool that stores nothing on your device. We keep a record
> of each job you run — the date, whether it was a file or pasted text, how many
> words it had, and what it cost you — because that is your credit history and
> it is what a balance is made of. Never the text or the file itself. If you
> create an account, we hold your email address and name. If you write to us, we
> use your address to reply and for nothing else.

---

**Add a new section, immediately after "What happens to text and files you
submit":**

> ## What we keep a record of, and for how long
>
> We keep no copy of what you submit. We do keep a record that you submitted
> something, because that is how a credit balance works.
>
> Each time you clean something, one line is added to your credit history. It
> records the date and time, whether the input was a file or pasted text, how
> many words it contained, whether the rewrite ran, how many credits it cost, and
> what it cost us to run. You can read your own history at any time on your
> account page. **It never contains your text, your file, or the name of your
> file.**
>
> We keep that history for **MISSING — see decision D2** after the account is
> closed, because it is the record of what you paid for and what you used.
>
> Our servers also keep ordinary technical logs of each request — the time, how
> long it took, the size and file type of the input, and how many words it had.
> These carry no file names and no content. Our hosting company keeps them for
> **MISSING — Vercel's log retention on the current plan; check the dashboard, do
> not guess.**
>
> If you delete your account, your account record and your whole credit history
> are deleted with it. See "Your rights" below.

---

**Replace "What we store if you create an account", first two paragraphs:**

> An account is optional and the tool works without one. But the moment you clean
> something, even signed out, we create a **guest account** for your browser so
> your free credits have somewhere to live. It holds no name, no email address
> and nothing about you — only an identifier, your credit balance, and the
> history described above. Your browser remembers it with a cookie called
> `uc-guest` that lasts a year. Clear your browser data and it is gone for good,
> along with any credits on it, because we have no way to connect it back to you.
>
> If you create a real account, we store your email address, your name, and a
> profile picture URL if your sign-in method supplies one, along with the dates
> your account was created and last updated. Any credits left on your guest
> account move across to it. Database access rules restrict each account to its
> own record.

---

**Replace the "Cookies and browser storage" section in full:**

> ## Cookies and browser storage
>
> We use no advertising cookies and no advertising trackers.
>
> Three things are stored on your device, and all three are there to run the tool
> you asked for: a guest session and the `uc-guest` cookie that finds it again, so
> your free credits survive until you come back, and — once you sign in — the
> session cookies that keep you signed in. The full list, with lifetimes, is on
> the [cookie policy](/cookie-policy).
>
> We do measure visits, using PostHog. It is configured to store nothing at all on
> your device: no cookies, no local storage. That is why this site has no cookie
> consent banner. It means we cannot recognise you between visits, which we accept
> as the price of not tracking you. If your browser sends a Do Not Track signal,
> we do not measure you at all.
>
> We also record which steps of the tool you use, so we can see where it is going
> wrong: that a scan finished, how many hidden characters it found, that a clean
> started or failed, that you reached the point where free credits run out. These
> are counts and yes-or-no answers about the tool, never about you and never about
> what you submitted. File names are reduced to a file type before anything is
> recorded, and lengths and timings are recorded as ranges rather than exact
> figures.
>
> Every page also runs a background check from Cloudflare that tells real people
> apart from automated scripts. It is there because free credits are worth money
> and would otherwise be farmed by a program. It sees your IP address and some
> ordinary details about your browser. It is not advertising and it does not
> follow you around the internet.

---

**Replace the "Who else is involved" table in full:**

> | Who | What they do | What they see |
> |---|---|---|
> | Vercel | Hosts the site and runs the processing | Standard server logs: IP address, time, and which page was requested |
> | Supabase | Stores accounts and credit balances, and handles sign-in | Your account record and your credit history |
> | Cloudflare | Tells real visitors apart from automated scripts, on every page | Your IP address and ordinary details about your browser. No content, and nothing about what you submitted |
> | PostHog | Counts visits, which pages are read, and which steps of the tool are used | Pages viewed, rough location from IP address, browser and device type, and which actions you took in the tool with counts of what was found. Nothing stored on your device, and never the content you submit, your file names, or your text |
> | **MISSING — the model provider. See decision D6.** Reached through Vercel AI Gateway | Performs the optional rewrite | The text you submitted for rewriting, at the moment it runs |
> | Google | Runs the inbox you write to, and sign-in if you choose it | Any email you send us, and that you signed in to our site |
>
> All of these companies are based in the United States, so if you are in the UK
> or EU, your information is processed there.
>
> We do not sell your information, share it for advertising, or transfer it to
> anyone not listed above.

---

**Replace "Your rights" in full:**

> ## Your rights
>
> Wherever you live, you may ask us to show you what we hold about you, correct
> it, delete it, receive a copy of it in a portable form, or object to how we use
> it. Write to us at the address below and we will respond within 30 days.
>
> You can delete your account yourself at any time, from your account settings.
> Deleting it removes your account record and your entire credit history,
> including any credits still on it. **This cannot be undone and unused credits
> are not refunded on deletion** — if you want a refund, ask for it first. We will
> delete any correspondence you have sent us on request. Because we do not retain
> submitted content, there is nothing else to delete.
>
> We do not currently offer a one-click download of your data. Ask us and we will
> send it to you.
>
> If you are in the UK or EU: our lawful basis is performance of a contract for
> your account, your credits and the rewrite; legitimate interest in keeping the
> service working and free from abuse, which covers our server logs, the
> anti-script check and our measurement of how the site is used. **MISSING — the
> controller. See decision D1: this must name the person or company responsible
> for your information.** You have the right to complain to a data protection
> authority: in the UK that is the Information Commissioner's Office, and in the
> EU it is the authority in your own country.

---

### 2C. Terms of service — replacement sections

Again, only what changes. **"What Un-Claude does", "What we can and cannot
promise", "Your content is yours", "Acceptable use", "Availability",
"Liability", "Ending your use", "Changes" and "Contact" all stay as they are.**
The claims boundary section in particular is correct and is the strongest thing
on the site.

---

**Replace "Accounts and free use" in full:**

> ## Accounts, credits and free use
>
> You can use the tool without an account. The first time you clean something we
> create a guest account for your browser and give it a small number of free
> credits, so you can try the thing you came for before deciding anything.
> Creating a real account earns a few more, once. The current numbers are on the
> [pricing page](/pricing).
>
> Free credits are a courtesy, not an entitlement. They are granted once rather
> than renewed, we may change the amounts, and we may refuse or reverse them where
> we believe someone is creating accounts to collect them repeatedly.
>
> If you create an account you must give accurate information and keep your
> credentials secure. You are responsible for what happens under your account. You
> must be at least 18 years old.
>
> Guest credits live on the browser that earned them. Clear your browser data and
> they are gone, and we cannot restore them, because we deliberately hold nothing
> that would let us recognise you.

---

**Replace "Payment, credits and refunds" in full — and read the note under it,
because part of this depends on decision D3:**

> ## Payment, credits and refunds
>
> **MISSING — while nothing can be bought, keep the current opening sentence:
> "The service is currently free to use and no payment method is collected."
> Replace it with the paragraph below on the day checkout opens, in the same
> deployment.**
>
> Credits are bought in packs at the prices shown on the pricing page. Nothing is
> charged without your agreement, and the price of an operation is shown before it
> runs. Prices are in US dollars. **MISSING — whether prices include or exclude
> sales tax and VAT. See `06` row 61 and decision D4.**
>
> One credit covers one thousand words of text, and a file with no words in it
> costs one credit. Every job rounds up to a whole credit. Credits never expire.
>
> **A failed operation costs nothing.** If a run fails, the credits it took are
> returned to your balance automatically, and your credit history shows the
> reversal.
>
> **Refunds.** Within 30 days of a purchase you may ask for a refund of any
> credits from it that you have not spent, at the price you paid, and we will not
> ask you why. Credits you have already spent are not refunded, because the work
> was done. Refunds are returned to the card that paid.
>
> **If you delete your account, any credits on it are gone and are not refunded.**
> Ask for the refund before you delete.

---

**Add a new section, "Where you stand with us", immediately before
"Liability" — this is the entity and jurisdiction section, and it cannot be
written until decision D1 is made:**

> ## Who you are dealing with, and whose law applies
>
> **MISSING — everything in this section. See decision D1.**
>
> **Do not draft this speculatively and do not let a later session fill it in
> with a plausible-looking country.** It needs: the legal name of the party
> providing the service, its address, the governing law, and where disputes are
> heard. The existing pages omit it deliberately and for a good reason — there is
> no entity to name — and the header comment on `terms-of-service/page.tsx` says
> so:
>
> > *"There is deliberately no governing law section… Inventing a jurisdiction
> > would be a false statement in the one document that most needs to be true."*
>
> That reasoning still holds. It stops holding the moment money changes hands.

---

**Small edit to "Your content is yours":** the sentence *"We do not retain it"*
is true of content and is now doing more work than it should. Replace it with:

> We do not retain what you submit. We do keep a record that you ran a job, so
> your credit balance means something; the [Privacy Policy](/privacy-policy)
> explains exactly what that record contains and what it does not.

---

### 2D. Two lines that are not on a legal page and matter more than most of the above

**At the sign-up button**, under it, small:

> By creating an account you agree to our [Terms of Service](/terms-of-service)
> and [Privacy Policy](/privacy-policy).

**At the tool's own button**, so the people who never sign up are covered too,
and so the disclosure that matters lands where the decision is made:

> Your text is processed and deleted, never stored. The optional rewrite sends it
> to an AI model to be rewritten. [How we handle your files](/privacy-policy)

The second line is the answer to item 4.2, and it earns its place twice over: it
is the disclosure a hostile reader would say was missing, and it is the
reassurance a nervous student needs before pasting a dissertation.

---

## 3. Decisions only Jon can make

Each with a recommendation, because `CLAUDE.md` section 1 says recommend rather
than enumerate.

---

### D1. The legal entity, and the governing jurisdiction — **the one that blocks the others**

**Where it stands.** There is no entity. Entry 54 ruling 2 is Jon's, and it is
recorded with its consequence stated once, plainly: *"'we' in these documents is
Jon personally, so liability runs to him rather than to an entity."* The terms
deliberately have no governing-law section and the code comment explains why.
That was the right call for a free tool with no revenue.

**What changes it.** Taking money. The moment a card is charged, four things
arrive at once: Stripe requires an identified seller; a consumer contract exists
with someone; UK and EU data law expects a named controller with an address;
and a dissatisfied customer, a school's lawyer, or a rights-holder has a person
to sue rather than a company.

**Recommendation: incorporate before the first payment, and do not open Stripe
until it exists.** Not because of the paperwork, but because of what this
product is. A watermark remover is a category that attracts adversarial
attention — the exposure is not the ordinary business risk of a small SaaS, it
is the specific risk of being personally named in a complaint about academic
integrity or content provenance. **A limited company is the difference between
that complaint reaching a business and reaching Jon's own assets.** It is also
the cheapest item on this entire list.

**On which jurisdiction: I do not know where Jon is, and I will not guess.** The
governing law should normally be where he actually lives and where the entity is
formed. **MISSING — Jon's country of residence, and the country of
incorporation.** Once both exist, the "Who you are dealing with" section writes
itself in four sentences.

**One caution to carry into that decision**: naming a jurisdiction in the terms
does *not* let him escape consumer protection law elsewhere. A UK or EU consumer
keeps their local rights whatever the contract says. That is not a reason to
avoid the clause; it is a reason not to over-rely on it.

---

### D2. How long data is kept, and whether the code enforces it

**Where it stands. Nothing is enforced in code, and nothing is stated.** There
is no scheduled deletion anywhere in the repository. The three things that
persist are: the account record (until deletion), the credit ledger (forever,
though it cascades away when the account is deleted), and Vercel's runtime logs
(a platform-set window I could not verify from source — **MISSING, check the
Vercel dashboard**).

Content retention is the exception and it is genuinely enforced: a temp
directory that the operating system reclaims when the request ends. **That one
is real, not stated.**

**Recommendation, and it is a modest one on purpose: state a period, and choose
one the code already achieves.**

- **Submitted content: none.** Already true, already enforced. Say it — it is
  the best sentence on the page.
- **Credit history: keep it for as long as the account exists, plus a stated tail
  after closure.** Recommend **MISSING — but the honest range is one to seven
  years, and the number is driven by tax and accounting record-keeping in
  whichever country D1 lands in, not by privacy law.** Get this from the
  accountant that `04` entry 65 already says is needed. It is the one number
  here that a professional should set.
- **Server logs: whatever Vercel's platform retention is.** Say that, name the
  window, and do not promise a shorter one than the platform actually applies.

**Do not promise a deletion schedule the code does not run.** A retention promise
with no cron job behind it is the same category of defect as everything in
section 1: a checkable claim that fails when checked. If Jon wants a genuine
deletion window on the ledger, that is a small scheduled job and it should be
built in the same deployment as the sentence that promises it.

---

### D3. The refund policy

**Where it stands: already decided, and the decision is good.**
`03-pricing.md` P6 and section 12 question 4: unspent credits, at the price
paid, no questions asked, within 30 days; spent credits are not refunded. The
arithmetic behind it is decisive and is in P6 — a refund costs about $0.56 and a
chargeback dispute costs about $24.50.

**So the decision Jon actually has left is narrower**, and it is this: **is 30
days still right once EU and UK consumers are in scope?**

**Recommendation: keep 30 days, keep it no-questions-asked, and add one sentence
about immediate delivery.** UK and EU consumers have a 14-day right to cancel a
distance purchase. For digital content delivered immediately, that right can be
waived — but only if the customer expressly agrees to immediate delivery and
acknowledges they lose the cancellation right. **That acknowledgement is a
checkbox at checkout, not a paragraph in the terms**, and it needs to exist
before the first EU sale. Jon's 30-day policy is more generous than the 14-day
minimum anyway, so this costs him nothing commercially — it is a formality that
protects the *rest* of the policy from being overridden.

Also required, and cheap: **put the refund policy on the pricing page.**
`03-pricing.md` section 12 row 8 already lists it as a Stripe prerequisite, and
today the pricing page mentions only the operation refund.

---

### D4. Acceptable use, and the academic-integrity position

**Where it stands: a position exists, it is Jon's (entry 54 ruling 4), and it is
better than most of what competitors publish.** The terms name the legitimate
uses first, then prohibit deceiving a school, employer, publisher or client, and
add the line that does the most work: *"If a person or institution has a rule
about AI-assisted work, that rule is between you and them, and this tool does
not change it."*

**Recommendation: keep it exactly as it is. Do not tighten it and do not soften
it.** Three reasons, and the middle one is the one people get wrong.

**First**, the structure is the defence. A prohibition that arrives after the
legitimate uses reads as a policy; a prohibition that arrives alone reads as a
disclaimer somebody's lawyer bolted on. Entry 54 saw this and it was right.

**Second, and this is the counter-intuitive part: do not add a broader
prohibition to look safer.** The temptation before a Stripe application is to
add "you may not use this to violate any academic policy anywhere." That
sentence sounds stronger and is weaker — it prohibits the product's own most
common use, which makes the whole document read as knowingly unenforced, and it
invites the exact question Jon does not want asked. The current wording
prohibits **deception of a specific relying party**, which is both narrower and
genuinely enforceable.

**Third, what Stripe will actually ask.** Stripe's review looks at what is sold,
whether the site describes it accurately, and whether terms, refunds and contact
details exist (`04` entry 72 records this). **The answer Jon should give, and it
should be the same answer the site gives:** un-claude sells a document-cleaning
tool that removes hidden characters, file provenance metadata and statistical
patterns from a user's own text and files, sold as credits, with an acceptable
use policy that prohibits misrepresenting authorship to a relying party. That
answer is true, it is on the site, and it matches the code.

**One thing to add, and only one:** a takedown and enforcement sentence in
"Ending your use" — that Jon may suspend an account on reasonable belief of
breach, without refund of spent credits. Today the terms say access may end but
say nothing about what happens to a balance, and an unhappy suspended user with
credits is exactly the person who files a chargeback.

---

### D5. Account deletion and data export — **smaller than the brief thought**

**Where it stands.** Deletion **exists, works, and is reachable**:
`/home/settings` renders the danger zone (`enableAccountDeletion: true`), which
calls `deletePersonalAccountAction` → `auth.admin.deleteUser`, and the ledger
cascades away with the account. It is in the sidebar. The brief's premise here
was wrong.

**Two real questions remain.**

**First, a guest cannot delete anything.** Someone who used the tool signed out
has an account, a balance and a job history, and no interface anywhere that
would let them delete it or even see it. **Recommendation: this is acceptable
for now and should be said rather than hidden.** The guest record holds no name,
no email and no content — nothing that identifies a person — and clearing
browser data severs the only link to it. The privacy policy wording in 2B says
exactly that. **Revisit it if guest accounts ever gain an identifying field.**

**Second, deletion destroys unspent credits with no warning.** Today that is
free credits only. **Once credits are bought, a "delete account" button that
silently destroys money is a chargeback generator.** Recommendation: put the
warning in the terms and the privacy policy now (both drafts above do), and put
a real confirmation dialog that names the balance in front of the button before
Stripe opens.

**Export does not exist**, and that is fine. **Recommendation: handle it by
email and say so.** The volume of data is one account row and a short list of
credit lines; a self-serve export is engineering work for a request that may
never arrive. Build it if and when someone asks.

---

### D6. Naming the model provider in the privacy policy

**Not in the brief, but it belongs here, because it is a decision and not a
drafting choice.**

The policy names "Mistral Small." That is honest and it was verified. It is also
set by a Vercel environment variable, which means **changing one setting in a
dashboard silently makes a published legal page false** — the exact failure mode
this whole note is about.

**Recommendation: name the provider, not the model.** "Mistral, reached through
Vercel AI Gateway" survives a model upgrade; "Mistral Small" does not. **And add
one sentence committing to a rule rather than to a fact:** that the list of
companies who see submitted text is the list in the table, and it is updated
before any new one is used. That is a promise Jon can actually keep, and it
converts a brittle fact into a durable commitment — which is the stronger legal
position as well as the more honest one.

**If the provider itself ever changes, the policy changes in the same
deployment.** Same rule as everything else.

---

## 4. The two items that need wording AND code

The brief named two. **Both are real, and both are differently shaped than the
brief describes.** Here is what is actually true of each.

---

### 4.1 PostHog and consent — **the brief has this backwards, and the correction is good news**

**The brief says:** *"PostHog analytics loads with no consent banner, while the
cookie policy describes consent that is never collected."*

**Neither half is right.** PostHog is configured to store nothing on the device —
`components/analytics-provider.tsx`:

```js
posthog.init(KEY, {
  api_host: HOST,
  persistence: 'memory',
  capture_pageview: 'history_change',
  disable_session_recording: true,
  autocapture: true,
  respect_dnt: true
});
```

and its header comment shows the reasoning was done deliberately and correctly:

> *"The rule in the EU and UK is not about cookies by name: it is triggered by
> storing or accessing ANY information on a visitor's device, local storage
> included. Strictly necessary is exempt, analytics is not… `persistence:
> 'memory'` stores nothing at all, so there is no banner to build and no claim in
> the cookie policy to walk back."*

That analysis is correct. And **the cookie policy does not describe consent being
collected** — it says the opposite, that there is nothing to consent to. There is
no gap between the two.

**What IS real, and it is smaller and fixable.**

**(a) Cloudflare Turnstile has not been checked, and it is on every page.** This
is the one thing that could actually undermine the no-banner position, because
it loads a third-party script for every visitor and I could not confirm from
source whether it writes to the device. **Wording is blocked on this: the
Turnstile row in the cookie policy above is marked MISSING for exactly this
reason.** The check is five minutes: open the live site in a clean browser
profile, press nothing, and look at cookies, local storage and session storage.
If Turnstile stores nothing, the row says so and the no-banner sentence stands
unchanged. If it stores something, decide whether it is strictly necessary
(security usually is) and say so precisely.

**(b) The guest session and `uc-guest` do store on the device, and neither is
disclosed.** Section 1.2. They are almost certainly strictly necessary — they
deliver the credits the visitor asked for — **so this is a disclosure fix, not a
banner obligation.** But "almost certainly" is doing work in that sentence, and
the safest framing is the one in the wording above: state plainly what each one
is for, and let the necessity be obvious from the purpose rather than asserted.

**(c) `autocapture: true` is the one setting worth a second look.** Autocapture
records clicks and the text of what was clicked. PostHog masks input values by
default, and `events.ts` is rigorous about the events *this project* sends — but
autocapture is PostHog's own behaviour, not this project's, and the main element
on this page is a box people paste confidential text into. **Recommendation:
verify in the PostHog interface that no autocaptured event has ever carried text
from the workbench.** If there is any doubt, mask the workbench subtree. The
project already applied exactly this caution to session replay and was right to.

**The code work here is therefore: one browser check, one PostHog check, and no
banner.** That is a much better outcome than the brief assumed, and it is worth
saying plainly: **the decision made on 19 August to choose a cookieless
configuration is why there is no consent system to build now.** It was the right
call and it saved a system's worth of work.

---

### 4.2 Telling a user what happens to their document — **partly already done, and the missing part is at the tool**

**The brief says:** *"Nothing anywhere tells a user what happens to a document
they upload."*

**Not quite.** Two places do:

- The capabilities page: *"Text and files are processed, returned and deleted.
  Uploads are held only for the length of the request, and nothing you paste is
  kept."*
- The FAQ: *"It is processed and deleted. Uploads are held for the length of the
  request and removed when the response is sent. Nothing you paste or upload is
  stored."*

**Two things are genuinely wrong with that, and the brief's instinct is right
even where its facts are not.**

**First, it is not where the decision is made.** A person deciding whether to
paste a dissertation is looking at the workbench, not at a marketing page two
clicks away or an FAQ below the fold. **This is a conversion problem exactly as
much as a legal one, and the fix is the same sentence for both.** The line in
2D goes directly under the tool's button.

**Second, and more seriously: both existing statements omit the rewrite.**
"Nothing you paste or upload is stored" is true. It is also, standing alone next
to a rewrite button, an incomplete answer to the question the reader is actually
asking, which is *does my text leave your building.* For layer B it does. **That
omission is the most defensible-looking and least defensible thing in this whole
note** — it is technically true, it is in the right neighbourhood, and it is
exactly what a hostile reader would quote.

**Recommendation, and it is a positioning argument as much as a compliance one:
say it loudly and treat it as a feature.** The competitor comparison Jon already
owns is that GPTZero retains submitted text by default and reserves the right to
train on it (entry 54). Against that, "we keep nothing; the rewrite passes your
text to a model and it comes straight back" is a *strong* statement, not a
confession. Hiding it forfeits the comparison and keeps the risk.

**Code work: two lines of copy** — one under the sign-up button (item 1.7), one
under the tool's button — **plus one sentence added to the FAQ answer.** No new
systems.

---

## 5. What I did not check, so nobody assumes it was covered

- **Whether Cloudflare Turnstile writes to the device.** Needs a browser. Item
  4.1(a). The cookie policy wording is blocked on it.
- **Vercel's actual log retention window** on this account's plan. Needs the
  dashboard. The privacy policy wording is blocked on it.
- **Whether PostHog's autocapture has ever recorded workbench text.** Needs the
  PostHog interface. Item 4.1(c).
- **Whether Supabase's captcha protection covers email/password sign-up**, not
  only anonymous sign-in. This is a dashboard setting, not a repository fact —
  the security audit flagged the same limit. It bears on the "free credits are a
  courtesy" clause in 2C only lightly, but it bears heavily on section 1 of the
  security audit.
- **The live production values of `WATERMARKS_REWRITE_MODEL` and
  `UC_ENABLE_LAYER_B`.** Both are Vercel environment variables outside this
  repository. The second determines whether the rewrite is switched on in
  production at all today — `layerBAllowed()` in the clean route defaults it to
  *off* in production unless the flag is explicitly `true`. **If layer B is off
  in production right now, the Mistral disclosure describes something that is
  not currently happening, which is harmless, but it should be known rather than
  assumed.**
- **Anything a lawyer would check.** This note reconciles documents against code.
  It does not review them as contracts.

---

## 6. Sequence, if Jon wants one

**Now, and they need no decisions from anyone:**

1. Fix the four false statements — sections 1.1 to 1.4. They are false today.
2. Add Cloudflare to the third-party table — 1.5.
3. The two copy lines — 2D. Cheapest protective change in this note.
4. The three verification checks in section 5 that block wording.

**Before the first payment, and all of them block it:**

5. D1, the entity and jurisdiction. **This blocks the rest.**
6. D3's checkout acknowledgement, and the refund policy onto the pricing page.
7. D2's retention numbers, from the accountant D1 requires anyway.
8. D4's suspension-and-balance sentence.

**And the rule that would have prevented all of section 1**, which is already
written down in `CLAUDE.md` and `06` row 46 and simply was not followed on 20–21
August: **the legal page changes in the same deployment as the code that makes
it wrong.** Every gap in section 1 is one commit that did not carry its sentence
with it.
