# Policy text that is now out of date, and exactly what it should say

**Written 19 August 2026, Track 4.** Jon's instruction this session: note the
legal text a change makes wrong, hand him the replacement wording, and **do not
edit the pages.** The rewrite goes to a separate session. This file is that
handover.

**Status: OUTSTANDING.** The events are in the code. The policies have not been
changed. **The published policies currently under-describe what is measured.**

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
