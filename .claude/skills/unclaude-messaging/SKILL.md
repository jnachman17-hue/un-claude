---
name: unclaude-messaging
description: Governs every word a visitor of un-claude.com reads, and the argument the site makes to sell. Use whenever writing, rewriting, reviewing or restructuring landing page copy, headlines, section order, button labels, empty states, error messages, tooltips, the marquee, the coverage table, the limits section, or any marketing page. Also use before adding, removing or reordering a section of the site, and before invoking the copywriting, cro or product-marketing skills, because it sets what those skills may claim and how hard they may push.
---

# Un-Claude: the argument, the voice, and the line

**This site exists to sell.** It converts a visitor into a credit purchase. That
is the job. **Write confident, technical, commercial copy that makes a coherent
and convincing argument, and do not cross into a claim that is explicitly false.**

**Jon is the final arbiter on every sentence.** `CLAUDE.md` section 2. When this
file and Jon disagree in a session, Jon wins and this file gets updated.

## Think like the visitor first. Jon's standing order, 19 August 2026

**Before anything ships, re-read it top to bottom as the person it is for: a
college student on a phone who wants a document unwatermarked and knows nothing
else.** Not as the team, which has researched this for weeks. Their exact words:
"take a step back and understand at a human level... The average person visiting
this is a college student who wants to unwatermark something. Think like them."

**The mechanical tests, run every time:**

1. **Left to right, top to bottom.** A reader knows only what the page has already
   told them. A term, a count, or a concept used before it is taught is a defect.
   "0 facts lost in rewrites" is meaningless to someone who does not yet know a
   rewrite is involved.
2. **One grammar per repeated element.** Three rows, three statuses: all three
   must answer the same question in the same shape. A count, a missing input and
   a philosophy lesson side by side is the signature failure of this project.
3. **Read it aloud.** A sentence you stumble on, they abandon.
4. **Render it and look.** At desktop and at 375px, before claiming done. Text
   overflowing a column ships to nobody.
5. **Would they care?** Every block must answer a question this visitor actually
   has: does it work on my thing, is it free, will it wreck my essay, can anyone
   tell. A block answering a question only the team finds interesting moves off
   the page.

## Before writing a word

**Read `.agents/product-marketing.md`.** Full positioning: audience, the three
layers, what may be claimed, the argument order. This file is the short version
that fires automatically. That file is the substance.

| Touching | Also read |
|---|---|
| Any claim about what the tool does | **`apps/web/engine/ENGINE.md` section 2** |
| Copy, tone, moral framing | `docs/04-decision-log.md` entries 36, 37, 68, 70, 78 |
| Section order or layout | `04` entries 20, 41, 70 |

## Who is reading

**Consumers. B2C. Not a buying committee, not a company, not a procurement
cycle.** One person deciding for themselves in a few minutes. Every B2B instinct
a marketing skill has is wrong here.

**Two overlapping groups, and the site serves both:**

- **People who have just learned that AI writing is watermarked** and that
  institutions can check. Most of them. Usually students, and not only students.
- **Somewhat more technical people** who know what metadata is and want a
  watermark or a content credential off a file.

**They are on a phone.** Traffic is expected from TikTok. `04` entry 70. Mobile is
a first class constraint, not a later pass.

**What they know:** the category. Marks exist, institutions can check, their work
might carry one.

**What they do not know:** the mechanism. Which layer, which model, what is
actually detectable. **They cannot tell the three layers apart and they need to be
taught.**

## Teach. Do not just demonstrate

**This is the central structural rule of the page and it is easy to get wrong.**

**Most visitors come for the Claude text watermark, and that one cannot be shown.**
It is not a character, not metadata, not anything with a position in the document.
**It is the words themselves.** A page built on "paste your text and watch us find
it" therefore has nothing to show the person who came for the main thing.

**So the page explains.** What the three layers are, which one applies to them,
what to expect from each. **Clear, confident, plain teaching is the conversion
mechanism here, not a detour from it.** A visitor who understands why word choice
carries a mark is a visitor who understands why a rewrite is the answer, and that
is the visitor who buys.

**Demonstration still carries its own weight where a mark is real and visible.**
Hidden characters named and positioned, metadata read out of the file, the
producer name. **"Made by Stability AI" is a headline finding, not a footnote**,
`04` entry 70. Use demonstration where it works and teaching where it must.

## Detection is imminent. This is the argument, not a caveat

**Anthropic has publicly committed to a detection API that anyone can use.**
Confirmed 12 August 2026, further detail 15 August, explainer updated 16 August.
**Not callable yet. No pricing or access tier published.**

**Say imminent. Never say it does not exist and never say it will not come.**

**Three facts from Anthropic's own public material, all usable and all on the
record.**

1. **Anthropic says the mark can be defeated by rewriting with another model.**
   The company that built the watermark describes the method that removes it.
   **That is the strongest citation this product has.**
2. **A check returns a probability, never yes or no.** There is no binary verdict,
   so "reduce the signal" is the honest and accurate frame, and metrics are the
   right language for it.
3. **A detected mark means Claude processed the content, not that Claude wrote
   it.** It flags people who wrote their own work and edited it with Claude.
   **Say that plainly. It needs no adjectives and it is the emotional centre of
   the page.**

**What this changes commercially.** Verification is coming, which is the reason to
act now. **It is also the reason not to overclaim:** when the API ships, every
sentence on this site becomes checkable at once. Overclaiming is not just
dishonest here, it is a dated liability.

## What the three layers may claim

| Layer | Status | How copy may sound |
|---|---|---|
| **A. Invisible characters** | **Provable now.** Deterministic, counted, positioned | **Fully confident.** Show the marks |
| **Metadata** | **Provable now.** File before and after, byte verified | **Fully confident.** This is what strips a Claude file's signed credential |
| **B. Statistical rewrite** | **Imminently provable.** Checkable when Anthropic's API ships | **Confident about the engineering. Stop short of proving the outcome** |

**Layer B, the shape of the honest sell.** Describe the engineering, report the
measured result, do not claim a verified defeat.

- **A targeted structural rewrite that breaks the verbatim word sequences the
  watermark rides on.** True: the mark survives only through runs of consecutive
  words, and the engine holds runs to three.
- **Facts persist. Length is preserved.** Numbers, dates and names are checked
  against the original and the chunk retries if one drifts. Length holds within
  about a tenth.
- **Report the measured survival rate**, from our own test data, beside the run
  length chart on the receipt.

**The one line that stays out**, `04` entry 78 ruling 2: **we do not claim to know
which specific tokens Anthropic marked.** The key is Anthropic's, and Anthropic's
own detector returns a probability rather than a location. **Target the runs, which
is true and sounds technical. Do not claim to target the key, which nobody can.**

## What must never be said

1. **That layer A removes Claude's text watermark.** Anthropic's mark is not
   Unicode, not metadata, not hidden characters. It is in the word choices.
   Confirmed by Anthropic's own documentation. `04` entry 37.
2. **That we can currently prove a text watermark was removed.** Nobody can, yet.
   **Imminent is the word.**
3. **That a school or employer can run Anthropic's detector today.** It is not
   callable yet. **Coming, not live.**
4. **Anything about PDFs.** Not in version one.
5. **The word "provenance" anywhere a visitor reads.** The layer is called
   **Metadata**. `04` entry 78 ruling 1. Code identifiers keep the old name.
6. **A named third party detection product, on a guess.** Research it first.

## Numbers

**Figures come from our own measured test data and from sourced public reporting.**
Measure it, then say it. **Do not put a number on the page that nobody ran.**

**Real and available:** hidden character classes checked per scan, providers
confirmed marking files, the live per job receipt (wording replaced, longest
surviving original run, figures carried through, length preserved), and the
measured share of three word sequences broken by the rewrite.

**Parked, with sources, in `docs/PARKED-CONTENT.md`.** Removed for placement, not
accuracy. Read why before reinstating one.

## Voice

**Confident, technical, plain.** Big-technology marketing register: it should sound
engineered and be simple to understand. **No hedging in the first screen. No lab
report. No hype without a mechanism behind it.**

**Hard rules:**

- **No em dashes and no en dashes.** Anywhere a visitor reads. `docs/05` section 2.
  **Jon's style rule for his site and documents. It never governs the engine.**
- **"Sanitise", not "remove the watermark".** `04` entry 70.
- **"Un-Claude".** Capital U, capital C, hyphenated. Display name only.
- **Claude forward.** `04` entry 36. Capability is general, marketing leads with
  Claude, other labs appear less prominently.

**Moral framing is restrained ON THE LANDING PAGE.** State what the labs do,
accurately, and let the visitor conclude. Jon's register: "AI tools now mark what
they make. Invisibly, and without telling you." **Jon writes the mission page in
his own voice and will call the labs unethical, illegal and immoral there. That is
his to write and it does not belong on the home page.**

## The goal

**A credit purchase.** Billing ships before the site goes live, so write for a
working checkout. The ladder: scan, the finding lands, sign in, paywall, purchase.

## The question that catches most defects

**Which layer, and what may that layer claim?** A sentence true of one layer
written as though true of all three is the single most common failure in this
project's copy. `04` entry 78 ruling 3: **a claim in a whole-service slot must be
true of the whole service.**
