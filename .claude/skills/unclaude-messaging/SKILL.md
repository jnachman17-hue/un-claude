---
name: unclaude-messaging
description: Governs every word a visitor of un-claude.com reads, and the reasoning behind how the product is explained. Use whenever writing, rewriting, reviewing or restructuring landing page copy, headlines, section order, button labels, empty states, error messages, tooltips, the marquee, the coverage table, the limits section, or any marketing page. Also use before adding, removing or reordering a section of the site, and before invoking the copywriting, cro or product-marketing skills, because it constrains what those skills are allowed to claim.
---

# Un-Claude: what the site is allowed to say, and why

This skill exists because **the highest converting sentence available to this
product is false**, and a general purpose conversion skill will find it and write
it. It is the wrapper that keeps the downloaded marketing skills honest.

## Before writing a single word

**Read `.agents/product-marketing.md`.** It is the full positioning: the visitor,
the three layers, the claims boundary, the conversion ladder. This file is the
short version that fires automatically. That file is the substance.

**Then read the governing sources for whatever you are about to touch:**

| Touching | Read |
|---|---|
| Any claim about what the tool does | **`apps/web/engine/ENGINE.md` section 2.** Non negotiable |
| Copy, tone, or a moral framing | `docs/04-decision-log.md` entries 36, 37, 68, 70 |
| Section order or layout | `04` entries 20, 41, 70 |
| A number of any kind | `04` entry 47 |

## Precedence, when the downloaded skills disagree

`CLAUDE.md` section 2 sets the order of authority. Applied here:

1. **Jon's instruction in the session.**
2. **`docs/` and `ENGINE.md`.** Where a document decides a question, that answer
   governs.
3. **The `copywriting`, `cro` and `product-marketing` skills.** Outside
   convention. They may inform anything the documents leave open. **They may never
   override anything the documents have decided.**
4. **Your own judgment.** Last.

**When a marketing skill recommends something the documents forbid, say so out
loud.** Name the document, state what the skill wanted, and say plainly that the
document governs. Do not split the difference and do not quietly pick a side.

## The visitor

**A student, on a phone, close to a deadline, who has just learned that AI work
is watermarked and that institutions can check.**

**They arrive already believing the threat.** So the first screen does not explain
watermarking. **It shows them what is in their own work.** A hero that teaches
instead of demonstrating has wasted its one chance.

**Mobile is a first class constraint.** `04` entry 70. Nothing is finished until
it is right on a small screen.

## The three sentences that must never appear

1. **Anything saying or implying a school, employer or detector can currently
   detect Claude's text watermark.** It cannot. No public detector exists
   anywhere, and no marked model is shipping publicly. This is the false sentence
   that converts best. Do not write it.
2. **Anything saying layer A removes Claude's watermark.** Anthropic adds no
   hidden characters. `04` entry 37.
3. **Any invented number, counter, statistic or measurement.** `04` entry 47. Jon
   asked for invented metrics once and was declined. **Anthropic has a detector in
   development, which is the day every invented number in this category becomes
   checkable at once.**

4. **Anything saying we target the token sequences Claude used.** `04` entry 78
   ruling 2. The key is Anthropic's and nothing can identify which tokens carry
   the mark. **What may be said:** the rewrite runs through a model that is not
   Claude, every number and date and name is checked against the original, and
   length is held within about a tenth.
5. **The word "provenance" anywhere a visitor can read it.** `04` entry 78 ruling
   1. **The layer is called Metadata**, because metadata is the umbrella and
   provenance is one signed thing inside it. Code identifiers keep the old name on
   purpose.

Also: **claim nothing about PDFs.** Not in version one.

## Two rules about where a claim sits, not just whether it is true

**A claim in a whole-service slot must be true of the whole service.** `04` entry
78 ruling 3. Two hero attempts failed identically: a claim about one layer is
wrong for the other two. "Every mark shown in place" over-promises for Claude
text, which has no visible mark. "Zero figures changed" is meaningless over a PNG.
**The replacements, Free / Nothing stored / Nothing lost, share one job: removing
a reason not to try.**

**Where the layer B disclosure sits is a choice. Whether it exists is not.** It is
labelled best effort **at the result, at the point of purchase and in the terms**,
`04` entries 23 and 78. **It does not headline the home page.** Jon: *"why is that
screaming at you at the very front of this website when that's kind of why we're
here and we want your payment?"* **Do not read the honesty rule as an instruction
to lead with the limitation.** Honest and self-sabotaging are not the same thing.

## The strongest claim you are allowed, and it is stronger than the false one

`04` entry 68:

> If Claude made you a file, it carries a signed credential anyone can read with a
> free public tool. We remove it, and we show you the file before and after.
> Claude's text watermark is a separate mechanism, rolling out, and no detector
> for it exists anywhere. Our rewrite is the published defence and we call it best
> effort because that is what it is.

**Certainty about files, today. Best effort on text, labelled.**

## The confidence rule, per layer

| Layer | Provable | How copy may sound |
|---|---|---|
| **A. Invisible characters** | **Yes** | **Confident.** The marks are countable and shown |
| **Metadata** | **Yes** | **Confident.** File before and after, byte verified |
| **B. Statistical rewrite** | **No** | **Best effort, always labelled.** Never with the confidence of the other two |

**Reporting layer B with the confidence of the other two is the single easiest way
to make this project dishonest.** `CLAUDE.md` section 4.

## Voice

**Restrained. State the fact and let the visitor conclude.** Jon's ruling. The
register is his own draft: "AI tools now mark what they make. Invisibly, and
without telling you." **No adjectives. The secrecy does the work.** The site does
not call the labs unethical, illegal or immoral in its own voice. It reports what
they do, accurately, which is more damning and much harder to attack.

**Hard rules:**

- **No em dashes and no en dashes.** Anywhere a visitor reads. `docs/05` section
  2. **Jon's style rule for his site and documents only. It says nothing about the
  engine and must never leak into what the tool does to a user's text.**
- **"Sanitise", not "remove the watermark".** `04` entry 70. Sanitise claims the
  work, not the outcome, and for layer B the outcome cannot be claimed.
- **"Un-Claude".** Capital U, capital C, hyphenated. Display name only.
- **Claude forward.** `04` entry 36. The capability is general, the marketing
  leads with Claude, other labs appear less prominently.

**Marketing may be enticing and deliberately ambiguous. It stops short of
explicitly false. Final wording authority is Jon's, on every sentence.**

## What the page is trying to achieve

**Destination: a credit purchase.** **The checkout does not exist yet**, blocked
on Stripe, which is Jon's to open. So optimise the highest rung that currently
exists:

1. A completed scan by a signed out stranger. **The real hero metric today.**
2. **The producer name landing.** "Made by Stability AI" is a headline finding,
   not a footnote. `04` entry 70. It is the moment the visitor watches the tool
   read their own file, and it is the most persuasive thing on the site.
3. Google sign in. Live, branded, earns 2 credits.
4. The paywall firing after 3 sanitises.
5. Buying credits. Blocked.

**Do not write copy promising a checkout that will 404.**

## Two things to do every time, not once

**Say which layer you are talking about.** Most incoherent copy in this project
has come from a sentence that was true of one layer being written as though it
were true of all three. If a sentence does not survive the question "which layer,
and is that provable", it is not finished.

**Push back before executing, not after.** If an instruction rests on a claim the
documents forbid, say so first. `CLAUDE.md` section 1. **Building the wrong thing
correctly is a failure.**
