# Policy text that is now out of date, and exactly what it should say

**Written 19 August 2026, Track 4.** Jon's instruction this session: note the
legal text a change makes wrong, hand him the replacement wording, and **do not
edit the pages.** The rewrite goes to a separate session. This file is that
handover.

**Status: APPLIED, 19 August 2026, Track 1.** All four changes are in the pages
and shipped in the same push as the events they describe. The cookie policy's
opening line was left exactly as it is, as this file required. **The gap this
file existed to record never reached production.**

> Kept rather than deleted because it is the record of what changed and why, and
> because the next person to add measurement needs the same four places.

---

## What changed in the product

Funnel events were added on 19 August 2026. PostHog previously recorded page
views and automatic clicks. It now also records **what a visitor did in the
tool**: started on their own text, uploaded a file, a scan finished and whether
it found anything, a sanitise started, finished or failed, the paywall appeared,
they pressed "Get credits", they began signing up or signing in.

**What did NOT change, and this matters for how small the edit is:**

- **No new company is involved.** PostHog was already the analytics provider and
  is already named in both policies. The "Who else is involved" table needs no
  new row. Verified with the check in `07`, which returned PostHog and nothing
  else.
- **Nothing is stored on anyone's device.** The configuration is untouched: still
  `persistence: 'memory'`, still no cookie, still no local storage. **So there is
  still no consent banner obligation**, and the cookie policy's opening promise
  survives intact.
- **No content is collected.** No text, no filename, no snippet. Filenames are
  reduced to a file type from a fixed list before anything is sent, sizes and
  timings are grouped into ranges rather than sent exactly, and the engine's own
  error messages are not sent at all. This was tested by driving every event with
  a confidential filename and a real sentence and then searching all seventeen
  resulting records for any fragment of them. None appeared.

**So the whole edit is one idea: we now measure which actions you take, as well
as which pages you read. Still no content, still nothing on your device.**

---

## Privacy policy — three changes

### 1. "The short version", the sentence about measurement

**Currently reads:**

> We measure how many people visit and which pages they read, using a tool that
> stores nothing on your device.

**Should read:**

> We measure how many people visit, which pages they read, and which steps of the
> tool they use, with a tool that stores nothing on your device. We record that a
> scan ran and what kind of mark it found — never the text or the file it ran on.

### 2. "Cookies and browser storage", the PostHog paragraph

**Currently reads:**

> We do measure visits, using PostHog. It is configured to store nothing at all on
> your device: no cookies, no local storage. That is why this site has no cookie
> consent banner. It means we cannot recognise you between visits, which we accept
> as the price of not tracking you. If your browser sends a Do Not Track signal,
> we do not measure you at all.

**Should read** — the existing paragraph is still true and should stay exactly as
it is. **Add this second paragraph after it:**

> We also record which steps of the tool you use, so we can see where it is going
> wrong: that a scan finished, how many hidden characters it found, that a clean
> started or failed, that you reached the point where free uses run out. These are
> counts and yes-or-no answers about the tool, never about you and never about
> what you submitted. File names are reduced to a file type before anything is
> recorded, and lengths and timings are recorded as ranges rather than exact
> figures.

### 3. "Who else is involved", the PostHog row

The row exists and the company is unchanged. Only the middle and right cells
under-describe it now.

**Currently reads:**

| Who | What they do | What they see |
|---|---|---|
| PostHog | Counts visits and which pages are read | Pages viewed, rough location from IP address, browser and device type. Nothing stored on your device, and never the content you submit |

**Should read:**

| Who | What they do | What they see |
|---|---|---|
| PostHog | Counts visits, which pages are read, and which steps of the tool are used | Pages viewed, rough location from IP address, browser and device type, and which actions you took in the tool with counts of what was found. Nothing stored on your device, and never the content you submit, your file names, or your text |

---

## Cookie policy — one change, and one line to leave alone

### 1. The opening line — LEAVE IT EXACTLY AS IT IS

> un-claude sets no advertising cookies and no tracking cookies. We do measure how
> many people visit, using a tool that stores nothing on your device at all, which
> is why there is no consent banner on this site.

**This is still true and must not be softened.** Nothing about the storage
configuration changed. If a future change does loosen it, this sentence goes and
a consent banner has to be built. The whole value of the page is this sentence.

### 2. The PostHog row in "What we do use"

**Currently reads:**

| What | Purpose | Lifetime |
|---|---|---|
| PostHog analytics | Counts visits and pages read. Configured to store nothing on your device, so it sets no cookie and writes no local storage | Nothing is stored, so there is nothing to expire |

**Should read:**

| What | Purpose | Lifetime |
|---|---|---|
| PostHog analytics | Counts visits, pages read, and which steps of the tool are used. Configured to store nothing on your device, so it sets no cookie and writes no local storage | Nothing is stored, so there is nothing to expire |

---

## The date lines

Both pages carry `<Updated date={'19 August 2026'} />`. The change is being made
on the same date, so **the date does not need to move.** If the rewrite lands on
a later day, both dates move to that day.

---

## The code comments in those two files also promise something now untrue

Neither is published, so neither is a legal problem, but both will mislead the
next session that reads them.

**`privacy-policy/page.tsx`, the header comment**, says analytics "arrived
19 August 2026 and this page changed in the same commit". That was true of the
original install and is no longer true of this change. It should say that funnel
events were added on 19 August 2026 and that this page was updated separately,
naming this file.

**`cookie-policy/page.tsx`, the header comment**, makes the same claim. Same fix.

---

## Why this is outstanding rather than shipped

`CLAUDE.md`, `06` row 46 and `TRACK-4-ANALYTICS.md` all require the policy edit to
ship in the **same commit** as the change that makes it necessary. **That rule was
not followed here**, because Jon instructed on 19 August 2026 that policy rewrites
go to a separate session and that this session should hand over the text rather
than edit the pages. His instruction is the higher authority, `CLAUDE.md`
section 2.

**The consequence, stated plainly so it is a decision and not an accident:**
between the deploy that carries the events and the deploy that carries this text,
the published privacy policy describes less measurement than actually happens. It
does not describe anything false — no new company, no device storage, no content —
but it is incomplete. **The gap closes when this file is applied.**

---

# 23 August 2026, lane B: the privacy page needs one new sentence

**STATUS: SHIPPED 24 AUGUST 2026 BY LANE D, committed, NOT deployed.** Everything
below is kept as the record of what was decided and why; the wording that
actually went on the page, and what changed around it, is in
`docs/session-notes/lane-d-copy.md` item 7.

**What shipped, in one line.** The paragraph under "Your rights" that used to end
*"there is nothing else to delete"* now ends *"there is nothing of yours left
beyond one small record, and here is exactly what that is"*, and a new paragraph
follows it describing the fingerprint, the date and which grant it was. The
page's "Last updated" moved from 21 August to 24 August. **Both prohibitions
below were honoured: it is never called anonymous, and the page never implies the
address can be read back.**

**One thing deliberately NOT done, and it is Jon's to rule on.** The wording
below scopes this to the deletion section only, so the section called "What we
store about your account" still does not mention the fingerprint, even though it
is written when the free credits are claimed rather than when the account is
deleted. **Lane D followed this file rather than its own judgement,** `CLAUDE.md`
section 2. A second mention up there would be accurate and is one sentence.

**The original instruction, for the record:** note the change, hand over the
wording, do not touch the pages.

**It is only needed once
`20260823120100_grant_claims_survive_deletion.sql` is applied.** Until then
nothing has changed and the page is still true.

## What changed in the product

**Free credits could be minted from one email address without limit.** Delete the
account, sign up again on the same address, collect another five. Three rounds on
the live database collected fifteen. The record that was supposed to stop it
lived on the credit ledger, and deleting an account deletes the ledger — so the
guard was deleted along with the thing it guarded against. `f1-audit.md` finding
0c; the rows are in `session-notes/lane-b-money.md`.

**The fix keeps one small record that deletion no longer removes.**

## What is retained after an account is deleted, and only this

- a **64-character fingerprint** of the email address (a SHA-256 hash of the
  normalised address, salted with a fixed application prefix),
- **which** free grant it was — the welcome credits or the signup credits,
- the **date** it was first given,
- a **count** of how many times that inbox has asked for it again since.

**The address itself is not stored and cannot be read back out of the
fingerprint.** But a fingerprint **can be checked against a guess**, so it is not
the same as keeping nothing, and the page must not imply that it is. It carries
no name, no account, no balance, no history, and nothing about anything the
person ever cleaned.

**Everything else the privacy policy promises to delete is still deleted**, and
that was re-verified this session: the account row, the sign-in, and every credit
ledger row all go, exactly as before.

## Suggested wording, for Jon to rewrite in his own voice

Under whichever heading covers deleting your account:

> **One thing survives, and here is what it is.** If you delete your account we
> keep a scrambled fingerprint of your email address — not the address itself.
> It is there for one reason: the free credits you get for signing up are meant
> to be once per person, and without it anyone could delete their account and
> collect them again and again. The fingerprint cannot be turned back into your
> address, and it is not attached to your name, your credit history, or anything
> you cleaned here. We keep it, the date, and which free credits it was.

**Two things the wording must not do**, because both would be false:

- **Do not say the fingerprint is anonymous.** It is a one-way hash of a real
  address. Somebody holding both it and a guess at the address can confirm the
  match.
- **Do not imply we can read the address back.** We cannot, and the sentence
  should be plain that we cannot.

## Where it goes

The same privacy page section that already says what deleting an account
removes. **One paragraph. Nothing else on the page becomes wrong.**

---

## 21 September 2026: the signup grant is gone, and two policy sentences named it

**Status: APPLIED in the same change, 21 September 2026.** `04` entries 165 and
166. Recorded here so the legal wording can be read in one place, as the 23
August changes were. Jon has not separately reviewed these two sentences.

**What changed in the product.** Creating an account no longer grants 3 free
credits. The free allowance is 2 credits on the browser, once, with no account.
An account is created at checkout and exists so purchased credits are not tied
to a browser. The email list will not be used.

### Terms of service, "Accounts, credits and free use", first paragraph

**Was:**

> Creating a real account earns 3 more, once, which is 5 in total.

**Is:**

> That is the whole free allowance: creating an account does not add to it. An
> account is where the credits you buy are kept, so they are not tied to one
> browser.

The rest of the paragraph and the two after it (free credits as a promotion;
guest credits living on the browser and moving across on sign-up) are unchanged
and still true: the guest merge still runs.

### Privacy policy, "Deleting your account", the fingerprint paragraph

**Was:**

> It is there for one reason: the free credits you get for signing up are meant
> to be once per person, and without it anyone could delete their account and
> collect them again and again.

**Is:**

> It is there for one reason: the free credits are meant to be once per person,
> and without it anyone could delete their account and collect them again and
> again.

**Why the fingerprint stays at all.** A real account that signs up cold, with
no guest session to carry credits from, still receives the 2-credit welcome
grant on first use, keyed to the inbox through `claim_grant`. Without the
fingerprint, delete-and-re-register would collect it again. The mechanism is
unchanged; only the sentence claiming the credits were "for signing up" was
wrong.

### Not changed, checked

- **Cookie policy.** Its two sentences about free credits describe the guest
  account and the captcha, both still true.
- **The "Who else is involved" tables.** No company added or removed.
- **The privacy policy's marketing paragraph**, if any, was not touched: the
  email list is retired by ruling, not by a change in what is collected. Whether
  the policy should now say the address is used only to sign in is a question
  for Jon; nothing in it is false today.
