# Everything left before un-claude.com goes live

**Written 21 August 2026 by the session that has been directing the parallel
chats for two days. Hand this to a new chat whole.**

This is not a plan. It is an inventory. Sequencing is deliberately left open
because Jon wants to decide it with a fresh session rather than inherit it.

**What this document is good for:** knowing what is done so nobody redoes it,
knowing what is outstanding and why it matters, and knowing which things cannot
run at the same time.

---

# PART 0 — HOW WORK HAPPENS IN THIS REPO

Read this before touching anything. Every rule here was learned by something
going wrong.

**1. `CLAUDE.md` governs.** Read it in full. Section 1 (Jon is not a
programmer), section 4 (what "done" means — a run, not an assertion) and
section 5 (stop and ask) are the ones that bite.

**2. Sessions share one working folder, so file collisions are real and
silent.** Two sessions editing the same file means the second overwrites the
first with no error. Every brief must name its territory and name what it must
not touch.

**3. Sessions also share one git index.** A `git add` in one session leaves that
path staged for **all** of them, and the next commit sweeps it in even when it
stages by explicit path. This has already put one session's file inside
another's commit. **Before every commit run `git diff --cached --name-only` and
confirm only your own files are listed.** Recovery: `git rm --cached <path>`
then `git commit --amend --no-edit`. Never `git add -A`, `git add .`, or
`git commit -a`.

**4. Sessions must not write to `docs/04-decision-log.md` or
`docs/07-runbook.md` while others are live.** Two sessions appending to the end
of one file is the one thing git cannot merge. Write to
`docs/session-notes/<topic>.md` instead, one file per session. There are now 25
of them awaiting merge — see Part 5.

**5. Nobody applies database migrations except Jon.** Sessions write the
migration file into `apps/web/supabase/migrations/` and hand Jon the exact SQL
to paste into the Supabase SQL editor. **Nothing behind an unapplied migration
is "done."**

**6. Deploys are `vercel deploy --prod` from the CLI, and they upload the
WORKING TREE, not git.** There is no GitHub integration — pushing to GitHub
deploys nothing. This confused a session for hours. It also means a deploy
while another session has half-finished edits on disk will ship those edits.
Deploy only when the tree is quiet.

**7. Dev servers: use a distinct port per session.** `.claude/launch.json` has
`web` (3000), `web-b` (3001), `web-c` (3002), `web-d` (3003).

**8. The browser preview pane freezes hydration when its tab is not fronted.**
Front the tab, wait a few seconds, then probe. Documented in `07-runbook.md`.
Three hours were lost to this once.

**9. The dev credit bypass only runs on a development build.** With it on,
nothing is charged and none of the real payment path is exercised. Several
"successful" large-document tests were measured with it on and are therefore
meaningless. **Turn it off before testing anything about credits or size.**

**10. Editing an i18n messages JSON does not reach a running dev server.** Only
a full restart works. Not a hot reload, not touching `i18n/request.ts`.

---

# PART 1 — WHERE THE PROJECT ACTUALLY STANDS

**The site is live at https://un-claude.com and serving the current build.**
`www` and `http` variants all 308-redirect to the apex.

## Done and verified with a real run behind it

- **The free credit system works end to end on production.** A guest gets 2
  credits, spends them, signs up, gets 3 more, and the guest balance carries
  over exactly once. Four invariants verified on the live database: no doubled
  transfers, no negative balances, every transfer recorded, no welcome grant
  after conversion.
- **Account deletion cascades properly.** Deleting the auth user removes the
  accounts row and the entire credit ledger. Verified twice on the live
  database. The append-only trigger does not block it — that interaction was
  marked "REASONED, NOT EXECUTED" in its own migration and has now been
  executed.
- **Refunds fire on failure.** Three on the ledger, including a 2,000-word run
  that failed and returned its credits.
- **Terms acceptance** now appears under both sign-up buttons (email and
  Google). Before this, nobody ever agreed to the terms and every protective
  clause was unenforceable.
- **The password form on `/home/settings` is fixed.** It used to ask "how did
  you sign in this session" instead of "does this account have a password", so
  anyone finishing signup via the emailed confirmation link was told their
  account had no password minutes after setting one.
- **Security fixes shipped:** the PNG decompression bomb (a free, no-login image
  upload could hang the service), rate limiting, the `credit_balance` RPC leak,
  an append-only trigger on the ledger, and the double-grant hole.
- **Email works.** Resend verified, wired into Supabase SMTP, real inbox
  delivery confirmed. SPF, DKIM and **DMARC at `p=reject`** all live and
  verified.
- **Uptime monitoring** live via UptimeRobot.
- **Legal pages caught up to the code.** Cookie policy rewritten; privacy and
  terms corrected where the software had moved underneath them.
- **Mobile pass** across the whole site.
- **Pricing page** rebuilt. Packs: Starter $4.99/10, Plus $9.99/25 (featured),
  Pro $24.99/100. Defined in
  `apps/web/app/(marketing)/pricing/_components/pricing-data.ts` — **import
  from there, never hardcode a price.**
- **Layer B function timeout** raised from 60s to 300s.

## Being worked on right now by Jon, in a separate chat — DO NOT TOUCH

**Stripe.** Territory: `app/api/stripe/**`, `app/api/**` route handlers,
`lib/server/credits.ts`, the workbench paywall, and the pricing page buttons.

Already proven in **test mode**: the migration (9/9), a forged webhook cannot
mint credits (6/6), payment-surface refusals (12/12), a real test purchase
crediting a real account, and — the one that matters — **three deliveries of the
same webhook producing exactly one ledger row.**

It also caught a bug that only a screenshot could find: the Stripe account had
**Bank/ACH enabled**, which completes checkout immediately as `unpaid` and pays
days later under a different event. A customer would have paid and received
nothing, silently. Now pinned to `card` only, with the async event handled
anyway because payment methods are a dashboard setting that can change with no
deploy.

**Jon is now moving Stripe from sandbox to live. That is his work.**

---

# PART 2 — OUTSTANDING: THE ENGINE

**This is the largest untouched area and it contains the two findings most
likely to affect every paying customer.** The brief is written and has NOT been
sent yet — it is in Part 8, ready to paste.

## 2.1 Formatting is destroyed — the biggest one

Jon, testing with real essays: paste a formatted essay in, copy the sanitised
version out, **the formatting is gone.**

**Why this outranks the size ceiling:** a size limit can be stated honestly and
most people never reach it. Broken formatting hits **everyone** who pastes more
than a paragraph, and the core case is a student pasting a long document they
care about. Handing back an unbroken wall of text means rebuilding it by hand,
which destroys the "paste, clean, done" promise. There is a second reason:
flattened paragraphing **looks processed**, which cuts against the entire point
of the product.

Nobody knows yet where it is lost — candidates are the chunking in `uc_chunk`,
the rewrite round-trip, and normalisation in the clean path, and it could be on
the way in, on the way out, or in the copy button.

## 2.2 Two separate size ceilings, only one understood

**Do not conflate these.**

| Where | Time limit | What is known |
|---|---|---|
| **Localhost** | none | 5,000 words succeeds. **10,000 fails** with "something went wrong, nothing was changed." Nothing timed it out, so this is an **engine defect**, not a platform timeout — and it is the more interesting one. |
| **Production** | 300s | **Nothing above 2,000 words has ever run there.** The single 2,000-word attempt failed and refunded — under the *old* 60s cap, before it was raised. |

Jon's 5,000-word success was on localhost **with the dev bypass on**, so it
proves nothing about production and cost nothing. The ledger confirms it: no run
above 2,000 words has ever been charged.

## 2.3 No file type has ever been tested end to end

Accepted, from `encode.ts`: **`.txt` `.md` `.docx` `.png` `.jpg` `.jpeg`** plus
pasted text — seven input paths, none systematically tested.

The critical question nobody has asked: **does a `.docx` still open in Word
after cleaning?** A corrupted output is worse than an uncleaned one.

## 2.4 A pricing arbitrage nobody has verified

Pricing charges **one credit per 1,000 words of pasted text**, but **one credit
per file whatever its size.**

So 10,000 pasted words costs 10 credits — or save the identical text as a
`.txt`, upload it, and pay **1**. Same work, same cost to run, a tenth of the
price. **This may be deliberate and may not matter while files are small, but
nobody has tested whether it works.** It is a finding for Jon to rule on, not
something a session should quietly "fix".

## 2.5 Retry exhaustion at 1,000 words

Runs at 1,000 words sometimes fail through `uc_chunk`'s retry loop giving up, on
both word-salad and real prose. Both refunded correctly. Never investigated.
Separate from the timeout question.

## 2.6 The word counter freezes — NEW, not yet investigated

Jon: deleted 10,000 words, the box is empty, and it **still reads
"10,524 words = 11 tokens"**. Typing a few more words leaves it frozen there.

This is in the **workbench**, which is Stripe's territory right now, so it could
not be handed to the engine session. It matters more than it looks: the counter
is what tells someone what they are about to be charged, and a frozen counter
showing a stale number is a **price display that lies**.

---

# PART 3 — OUTSTANDING: LEGAL AND POLICY

## 3.1 Apply the research wording — waiting on Stripe by design

A research session produced draft wording in `legal-research.md` sections
**9A–9H**: a new "Who you are dealing with" section, the data-controller
sentence, the cancellation right, a liability replacement, suspension wording,
and pricing-page additions. **None of it is applied yet.**

**It waits for Stripe deliberately.** The terms currently say the service *"is
currently free to use and no payment method is collected... go on sale when card
checkout opens."* That is true today and becomes false the moment payments go
live. The payment sections must move from future to present tense in the same
deployment that opens checkout — doing it earlier means doing it twice.

## 3.2 The checkout consent ceremony — a legal requirement, not a nicety

The research established that **the existing 30-day unspent-credit refund does
NOT satisfy the UK/EU statutory withdrawal right**, and being more generous does
not fix it. The statutory right refunds *everything*, including credits already
spent. It is lost only if three things happen:

1. The customer **expressly consents** to immediate supply.
2. They **acknowledge losing the right**.
3. They receive **confirmation on a durable medium** — the part everyone
   forgets, and which the Stripe receipt satisfies.

Practically: one checkbox at checkout, a pay button that states the amount
("Pay $9.99", never "Continue"), and the receipt repeating it. **Cheap while
building checkout, expensive to retrofit.**

## 3.3 Put the refund on the pricing page

The live terms already promise it word for word. The pricing page deliberately
withholds it, with its own header comment explaining that `03-pricing.md` P6
*proposed* it and entry 67 never ratified it.

**That caution has been overtaken by events** — you are already committed in the
binding document. The economics: a refund costs about $0.56 and a dispute about
$24.50 (`03-pricing.md` lines 635-636, modelled on a $9 pack, so they transfer
almost exactly to the $9.99 Plus pack). **Advertising the refund is how you turn
a would-be disputer into a refund request.**

**One precision that must not be lost:** this voluntary policy is NOT the
statutory cancellation right. If the pricing page presents it as "your right to
cancel," that is a false claim in exactly the register this project is careful
about everywhere else. They coexist as two different things.

## 3.4 The disclosure line at the tool's own button

From the legal report section 2D. The people most likely to care are the ones
who never sign up, and the workbench is where the decision to paste is made:

> Your text is processed and deleted, never stored. The optional rewrite sends
> it to an AI model to be rewritten.

**Workbench = Stripe's territory. Still outstanding.**

## 3.5 Marketing constraint with a criminal statute behind it

The essay-mill offence does **not** cover this product — it criminalises
completing part of an assignment. But there is a **separate offence of
advertising such a service to students.** That is a hard constraint on
marketing, not on the tool. It belongs in the `unclaude-messaging` skill so it
binds all future copy.

## 3.6 Jon's deferred legal decisions — his call, recorded as deferred

Service address · publishing his name · Merchant of Record instead of Stripe ·
VAT registration for EU sales · ICO registration and fee. **Jon has said he
handled the name and address questions inside the Stripe chat.** No entity will
be formed — that is settled and not to be reopened.

---

# PART 4 — OUTSTANDING: SEO

**Jon continued this with ChatGPT while out of credits. His summary is below
with corrections, because two of its conclusions are now wrong.**

## Already done (his session)

- Search Console **Domain property** created for `un-claude.com`, DNS-verified,
  under his personal Google account.
- Sitemap at `https://un-claude.com/sitemap.xml` — **confirmed live, HTTP 200**
  — and submitted.
- `robots.txt` confirmed correct: `User-Agent: *`, `Allow: /`, and the sitemap
  line.

## CORRECTION 1 — the noindex is already gone

His session found Search Console reporting the homepage **"Excluded by
'noindex' tag"** and concluded the site was blocking Google.

**Verified today, and it is not.** Zero occurrences of `noindex` on the live
homepage, on `/pricing`, `/how-it-works` or `/mission`, **and none anywhere in
the entire source tree.**

**The explanation is stale data.** Search Console's last recorded crawl was
**15 August**, before essentially all of this work. **Do not go hunting for a
noindex directive — there isn't one.** The fix is to make Google re-crawl.

## CORRECTION 2 — the redirects are already permanent

His session flagged that redirect status codes were never verified with curl and
might be temporary 302/307.

**Verified today. All are 308 (permanent):**

    http://un-claude.com       308 -> https://un-claude.com/
    https://www.un-claude.com  308 -> https://un-claude.com/
    http://www.un-claude.com   308 -> https://www.un-claude.com/

**That item is closed.**

## Still genuinely outstanding

1. **No canonical tag anywhere on the site.** Confirmed today. Needs
   self-referencing canonicals per page — `https://un-claude.com/` on the
   homepage and the page's own URL elsewhere, **not** every page pointing at the
   homepage.
2. **Re-run URL Inspection → Test Live URL** in Search Console after the
   canonical ships. Pass condition: Crawl allowed **Yes**, Page fetch
   **Successful**, Indexing allowed **Yes**.
3. **Inspect `https://www.un-claude.com/`** and confirm Google reports "Page
   with redirect" rather than indexing it separately.
4. **Request Indexing** on the homepage and the important public pages.
5. From the original SEO audit, still unfixed: **every page except the homepage
   loses the brand name from its own title** (needs a title template), **three
   meta descriptions are over length**, and **the three legal pages have a title
   and no description.**
6. **Structured data** (`SoftwareApplication` or `Organization`) — additive, not
   a defect.

---

# PART 5 — OUTSTANDING: OPERATIONS AND HOUSEKEEPING

## 5.1 Sentry is not wired

Account created. **Never connected.** Needs a dependency added, which
`CLAUDE.md` section 5 requires Jon to approve, plus edits to `next.config.ts`
and probably `layout.tsx`. **Right now, if the site breaks at 3am nobody finds
out until Jon looks.**

## 5.2 There are no database backups — accepted risk

Jon declined both Supabase Pro ($25/mo, nightly backups) and PITR ($100/mo).
**The credit ledger has zero backup protection. Losing it is the one
unrecoverable failure in this system.**

The mitigation is `apps/web/scripts/backup-credit-ledger.mjs` — written, works,
**and not scheduled.** Someone should put it on a timer.

## 5.3 Twenty-five session notes await merging

`docs/session-notes/` holds 25 files of findings that belong in the permanent
record. **`docs/CURRENT-HANDOFF.md` is stale** and `CLAUDE.md` section 6
requires it rewritten at session end — no session could do it while others were
live.

Zero collision risk, and it makes every future session cheaper because they stop
rediscovering the same things.

## 5.4 `proxy.ts` still excludes `/api/*`

`matcher: ['/((?!...|api/*).*)']` means API routes skip the middleware entirely,
so there is no natural place a site-wide rule can be added. Rate limiting was
built around this rather than through it. Handoff from the security session.

## 5.5 Smaller open items

- **Vercel log retention** is unverified, which blocks one sentence in the
  privacy policy. Read it off the dashboard.
- **DMARC reporting** (`rua=`) not configured — needs a real mailbox on the
  domain, since a `gmail.com` address will be refused by compliant reporters.
- **Root SPF record** not added. Optional; DKIM already carries alignment.
- **The contact form is still a `mailto:` fallback**, not a real send. Needs a
  mailer package — a dependency decision.
- **`verify-guest-merge.mjs` resolves `../.env` against the working directory**,
  so it only runs from `scripts/`. Harness bug, not product.

---

# PART 6 — DECISIONS WAITING ON JON

1. **The different-device email confirmation gap.** Someone uses the tool on a
   laptop, gets guest credits, signs up, and **opens the confirmation email on
   their phone.** The link creates the session on the phone, which holds no
   guest cookie, so the merge cannot fire. Their credits are stranded on an
   account they can no longer reach, silently. **This is not a bug in anything —
   it is how people read email**, and it is the most likely real-world failure
   left in the funnel. Nothing measures how often it happens.
2. **Sentry** — approve the dependency.
3. **Schedule the ledger backup** — you have no other safety net.
4. **The pricing arbitrage** (Part 2.4), once measured.
5. **Whether the contact form gets a real mailer** or stays `mailto:`.

**Already ratified, for the record:** guest credits carry over **once, ever** —
closes the farming hole, costs a returning signed-out user their credits,
accepted as the cheaper of two errors.

---

# PART 7 — THE FINAL GATE

**A Fable 5 ultracode audit of the entire money path, after Stripe is live and
after the engine work lands.** Jon's own words for the scope: test the system
end to end with documents, large chunks of text, credits, payments, accounts,
signups, edge cases, everything — and confirm the ledger, Vercel and Supabase
all agree with each other.

**Why it must be last:** it can only test the credit system against Stripe once
Stripe is real.

**Why it must not be the FIRST place expensive problems are found:** the audit
is the right place to catch a subtle race or an off-by-one. It is the wrong
place to discover that 10,000-word documents need background processing. **That
is exactly why the engine work in Part 2 should happen before it, not after.**

---

# PART 8 — THE ENGINE BRIEF, WRITTEN AND NOT YET SENT

Paste into a fresh Opus chat. **Cannot run while a session holds the workbench
or the pricing page.**

```
Engine correctness, file handling, and the size ceiling. Five parts.

TERRITORY: apps/web/engine/**, apps/web/api/*.py, and
docs/session-notes/engine-limits.md.

DO NOT TOUCH: app/api/** route handlers, lib/server/credits.ts, the
workbench, the paywall, or the pricing page. If a fix needs one of them,
do the engine half and write the rest up as a handoff.

Read CLAUDE.md — section 4 governs, and it is strict here because these
are correctness claims about money and about people's documents.
Read docs/session-notes/limits.md first: it measured production timing
and raised the function cap from 60s to 300s.

═══════════════════════════════════
PART 1 — FORMATTING IS DESTROYED. Do this first.
═══════════════════════════════════
Jon, testing with real essays: pasting a formatted essay in and copying
the sanitised version out loses the formatting.

This outranks everything else here. A size limit can be stated honestly
and most people never hit it. Broken formatting hits EVERY person who
pastes more than a paragraph, and the core case is a student pasting a
long document they care about. Handing back an unbroken wall of text
means they must rebuild it by hand, which destroys the whole "paste,
clean, done" promise.

Second reason it matters: structure is a signal. Flattened paragraphing
looks processed, which cuts against the point of the product.

FIND WHERE IT IS LOST BEFORE CHANGING ANYTHING. At least three
candidates — the chunking in uc_chunk, the rewrite round-trip, and
normalisation in the clean path — and it may be lost on the way in, on
the way out, or in the copy button. Guessing wastes the session.

Preserve paragraph breaks at minimum; list structure and line breaks too
if it can be done safely.

PROVE IT with a real multi-paragraph essay, input and output pasted in
full.

═══════════════════════════════════
PART 2 — EVERY FILE TYPE, END TO END
═══════════════════════════════════
Accepted, from encode.ts: .txt .md .docx .png .jpg .jpeg
Plus pasted text. Seven input paths.

For EACH, on production, with the dev bypass OFF:
  - Does the scan report sensibly?
  - Does the clean succeed?
  - DOES THE FILE STILL OPEN AFTERWARDS? A .docx that comes back
    corrupted is worse than one that was never cleaned. Verify each
    output is a valid file of its type, not just that bytes came back.
  - Was the right number of credits charged?
  - On failure, was it refunded?

Then the things that go wrong:
  - An empty file
  - A file renamed to lie about its type (a .png called .docx)
  - A file with no watermarks at all — a clean input must not be
    reported as cleaned of something
  - A filename with spaces, unicode, or a very long name
  - The largest file of each type you can reasonably make

Report as a table. Any row that fails is a finding.

═══════════════════════════════════
PART 3 — THE PRICING ARBITRAGE. Verify, do not assume.
═══════════════════════════════════
Pricing charges one credit per 1,000 words of PASTED text, but one
credit per FILE whatever its size.

So 10,000 pasted words costs 10 credits, and the identical text saved as
a .txt and uploaded costs 1. Same work, same cost to run, a tenth of the
price.

TEST IT. Take one document, submit it both ways, report what each
actually charged. If the gap is real, say what it costs at the sizes the
engine can handle. This is a finding for Jon to rule on, NOT something
to fix — the pricing rule is his and those files are not yours.

═══════════════════════════════════
PART 4 — THE TWO CEILINGS. Measure, do not assume.
═══════════════════════════════════
  LOCALHOST has no function time limit. 5,000 words succeeds, 10,000
  fails with "something went wrong, nothing was changed." Nothing timed
  it out, so that is an ENGINE defect and it is the more interesting one.

  PRODUCTION has a 300s cap. NOTHING above 2,000 words has ever run
  there. The single 2,000-word attempt failed and refunded correctly,
  and that was under the old 60s cap.

  (a) Find why 10,000 fails locally where nothing is timing it out.
  (b) Then measure production at 2,500 / 5,000 / 7,500 / 10,000 and give
      a table of words against seconds and outcome.

Then recommend ONE of: raise the cap, split large documents into
background work, or set an honest limit. Reasoning, not a menu. If it is
a limit, say exactly what the interface must tell the user and hand that
to Jon — the workbench is not yours.

═══════════════════════════════════
PART 5 — RETRY EXHAUSTION AT 1,000 WORDS
═══════════════════════════════════
From limits.md: runs at 1,000 words sometimes fail through uc_chunk's
retry loop giving up, on both word salad and real prose. Both refunded
correctly. Nobody has investigated why it gives up when it does.

═══════════════════════════════════
HOW TO TEST WITHOUT SPENDING MONEY
═══════════════════════════════════
The dev bypass MUST be off — it only runs on development builds, and
with it on nothing is charged and none of the real path is exercised.
Everything measured so far was measured with it on, which is why the
ledger contains no large runs at all.

Do NOT buy credits. Fund one test account by inserting ledger rows
directly, in the same append-only shape the grants use. Delete the
account afterwards — deletion cascades and takes the ledger rows with
it, verified twice.

Model costs are settled at roughly 0.09-0.25 cents per 1,000 words. Do
not re-derive them, but do report what your testing actually spent.

═══════════════════════════════════
FINISHING
═══════════════════════════════════
Jon is not a programmer and cannot check this by reading code. Every
claim needs real pasted output — especially the before/after formatting
and the file-type table.

A step you skipped is a step that failed. Say which ones you skipped.

Write docs/session-notes/engine-limits.md.

Before EVERY commit run `git diff --cached --name-only` — sessions share
one git index. Never `git add -A`, `git add .` or `git commit -a`.
Do NOT deploy.
```

---

# PART 9 — WHAT CAN AND CANNOT RUN AT THE SAME TIME

**Territories that collide:**

| Territory | Files | Currently held by |
|---|---|---|
| Payments | `app/api/**`, `lib/server/credits.ts`, workbench paywall, pricing page | **Stripe — Jon, live** |
| Engine | `apps/web/engine/**`, `apps/web/api/*.py` | free |
| Legal pages | `app/(marketing)/(legal)/**` | free, but should wait for Stripe |
| Marketing pages | `app/(marketing)/**` | free |
| Auth/accounts | `app/auth/**`, `packages/features/**` | free |
| Docs | `docs/**` | free |

**Safe to run right now, alongside Stripe:** the engine brief (Part 8), the docs
merge (Part 5.3), and SEO **if scoped to exclude the pricing page**.

**Must wait for Stripe:** the legal wording session, the workbench disclosure
line, the word-counter bug, and the Fable audit.

**Must run alone:** nothing currently, but any future site-wide pass (a second
mobile sweep, accessibility) collides with everything.

---

# PART 10 — NEVER STARTED

Accessibility pass · file-size-limit behaviour and the copy that explains it ·
analytics funnel instrumentation check · a full stress test with Stripe in test
mode across concurrent users.
