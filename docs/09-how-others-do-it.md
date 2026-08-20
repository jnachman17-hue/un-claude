# How other people solve this page

**Four parallel research passes, 19 August 2026, roughly forty sites fetched
live.** Commissioned by Jon after this session repeatedly failed to design the
top of the page by reasoning alone.

**What was studied.** Direct competitors (humanizers and watermark removers),
structural cousins (AI detectors, which also take a paste and return a multi-part
verdict about something invisible), paste-and-scan tools outside the AI category
(Have I Been Pwned, SSL Labs, Security Headers, Cover Your Tracks, PageSpeed,
TinyPNG, Squoosh, DNS Checker), and products that sell a benefit the buyer can
never see or verify (Glaze, VPNs, data removal, post-quantum security).

**Read section 8 first if you read nothing else.** It is the part that decides
what our three rows look like.

---

## 1. The findings that are unanimous

**Nobody puts explanation above the input. Not one site out of roughly forty.**
PageSpeed Insights literally places its input above its own `h1`. The tool is
about **one tenth of page height and the whole of the first screen.**

**Every site that ships a working tool ships it empty.** Not one pre-fills the
box. Every one then adds the same escape hatch beside it: `Try a sample`,
`✨ Try a Sample`, `Try sample text`, or a row of chips. GPTZero runs six pills
including `Polished by AI` and `Paraphrased by AI`. Copyleaks runs five including
`Claude Sonnet`. Undetectable runs `ChatGPT / Claude / DeepSeek / Human`.

**Two agents disagreed here and the disagreement is worth recording.** The
paste-and-scan researcher read `docs/08` before it was updated and praised the
pre-loaded example as going further than any tool studied. **The competitor
researcher found the entire category converging independently on empty plus a
sample button.** Jon had already ruled for the empty box from instinct.
**Resolution: empty box, sample button. The proven pattern and Jon's ruling
agree, and the lone endorsement of pre-loading was of a design nobody ships.**

**Teaching happens after the tool or inside the result. Never before it.**

**The split hero is the right frame:** argument in one column, tool in the other,
both above the fold. DNS Checker runs tool left and explanation right. It is the
only arrangement that serves a visitor who does not yet know the problem exists
without making a visitor who does scroll past a lecture.

---

## 2. The three-tier funnel, which is how a multi-part result stays readable

Every good tool implements some version of this.

| Tier | What it is | Examples |
|---|---|---|
| **1. One glanceable object** | One thing, large, colour coded | A letter in a 130px box (Security Headers). A count at 40px (HIBP). A grade plus four bars (SSL Labs) |
| **2. A scannable row of atoms** | One per finding, encoded by colour or icon only | Six pills (Security Headers). 33 ticks (DNS Checker). Five gauges (PageSpeed) |
| **3. One uniform block per finding** | **Always the same internal template** | Cover Your Tracks, Security Headers |

**Tier 2 is what prevents overwhelm. The reader counts the reds without reading
anything.**

**Two supporting rules, consistently observed.** **Collapse the good news, never
the bad** (PageSpeed hides `PASSED AUDITS (20)` behind a toggle; Security Headers
lists only what is missing). **The input never disappears** when the result
arrives.

---

## 3. The uniform template, which is the fix for our three rows

**Cover Your Tracks is the gold standard.** Every metric it reports uses the same
four-part block:

> **the raw value, verbatim** → **"WHAT IS THIS?"** → **"HOW IS THIS USED IN YOUR
> FINGERPRINT?"** → **the quantity**

Evidence first, interpretation second, identical shape every time, **so the fifth
one costs no effort to read.** Security Headers does the same with three parts:
name, two sentences, the exact fix.

**This is the mechanical explanation for Jon's verdict on our rows.** Ours read as
"random word blabber" because they run three different grammars: `3 FOUND` is a
count, `NO FILE` is a missing input, `IF CLAUDE WROTE IT, IT IS MARKED` is a
claim. The eye has to re-learn on every row and never builds a pattern.

**One number is the hero, never two competing. The caveat sits adjacent to the
number it qualifies, at small size, not in a footer and not behind a click.**

---

## 4. Turnitin refuses to print a number it does not trust

**Below 20%, their AI indicator shows `*%` and no figure at all.**

> "To avoid potential incidence of false positives, no score or highlights are
> attributed for AI detection scores in the 1% to 19% range."

**Every competitor prints a number they privately know is noise. Turnitin prints
an asterisk.** They also put **"False Positive Rates" in their primary
navigation**, and roughly 23% of that page is about the detector's limitations.

And they state the trade honestly, in the first person:

> "In order to maintain this low rate of 1% for false positives, there is a chance
> that we might miss some AI written text... **We're comfortable with that.**"

---

## 5. Honesty is load-bearing, and the market has left it lying on the floor

**The competitive set is a wall of absolutes.** *"The only humanizer that
completely removes all AI watermarks"* (Phrasly, three absolutes in nine words).
*"We bypass ALL detectors"* (humanizeai.pro). *"100% Undetectable"* (BypassGPT).
*"99.9% success rate"* (Ryne). Winston puts **99.98%** above the fold and
*"this is a probabilistic approach"* three clicks into a help centre.

**They cancel each other out. Readers discount every number on every one of those
sites.** The research conclusion, and it is a commercial argument rather than an
ethical one:

> **In a market where everyone claims 100%, a stated limit is the only
> differentiated signal left.**

**The sites whose other claims survive are the ones with a named limit.**
WriteHuman's FAQ item titled `What it is not`. humanizeaitext's `Honest Limits`.
humantext.pro's `Watermarks Are Just One Factor`. Sapling naming its own product
in its disclaimer: *"No current AI content detector (including Sapling's) should
be used as a standalone check."*

**Glaze, the closest analogue in existence** (University of Chicago, invisible,
unverifiable, same problem), puts **"Risks and Limitations"** high on the page
between the mechanism and the samples, **and links the two published papers that
attack its own product.** A reader who cannot verify the mechanism verifies the
author instead.

**HIBP puts the caveat in the same sentence as the good news, at the same type
size:**

> "Good news, no pwnage found! This password wasn't found in any of the Pwned
> Passwords loaded into Have I Been Pwned. **That doesn't necessarily mean it's a
> good password, merely that it's not indexed on this site.**"

---

## 6. Nobody quotes the AI companies. We can.

**Across every competitor site studied: zero verbatim quotations** of OpenAI,
Google or Anthropic. Five paraphrases total, three buried inside collapsed FAQ
accordions at the very bottom, all hedged into mush: *"has discussed the
possibility"*, *"may embed"*.

**Not one blockquote. Not one linked citation. Not one company logo used as a
source marker.**

Wider than this category, the pattern is rare because almost nobody ever gets a
clean admission. **Spotify built an entire campaign site attacking Apple,
`timetoplayfair.com`, containing zero verbatim Apple quotes.**

**We have three, verified at source. `04` entry 83.**

**How to place them, from the one site that does it well.** iFixit's FTC citations
sit **inside FAQ answers, immediately after the objection they rebut**, not as a
hero pull quote. WriteHuman quotes Anthropic **inline, hyperlinked, in running
prose, no blockquote styling.** A hyperlinked sentence in prose reads as a
citation. The same sentence blown up in a hero reads as an advertisement.

---

## 7. Urgency without looking like a scam

Six techniques, all observed:

1. **State the finding flatly and let the reader supply the alarm.** *"Your
   browser fingerprint appears to be unique among the 298,622 tested in the past
   45 days."* No adjectives, and far more frightening for it.
2. **Attribute the claim to the test, not to reality.** *"Our tests indicate
   that..."* *"Values are estimated and may vary."*
3. **Hedge the consequence, not the observation.** WhatIsMyBrowser states the
   version fact flatly, then: *"can have security problems and may cause websites
   to not work properly."*
4. **Print the limits next to the verdict.** *"Cover Your Tracks does not measure
   all forms of tracking."* **A scam never volunteers its own blind spots.**
5. **Say how bad it is, specifically.** SSL Labs: *"Grade capped to B."* and,
   under a failing grade, *"If trust issues are ignored: A."* **Scams imply
   unbounded danger. Credible tools bound it.**
6. **Show the good state generously.** HIBP fires confetti on a clean result.

**On a coming event**, the pattern that fits us is post-quantum security's
harvest-now-decrypt-later: **the clock is not when the capability arrives, it is
that the data already exists.** DigiCert has urgency with no date at all, under
the heading *"Preparing takes longer than you think"*, by admitting they do not
know when. **Anthropic said "soon". We say soon. We do not invent a quarter and we
do not run a countdown.**

---

## 8. What this means for our three rows

**The mapping, straight from the research:**

| Row | Evidence shown | Quantity |
|---|---|---|
| **Hidden characters** | the actual characters, pulled out and made visible | **a count** |
| **Metadata** | the actual tags found in the file | **a count** |
| **Statistical watermark** | **nothing, and the row says why** | **no count** |

**The blank is the design, not a gap in it.** Turnitin's asterisk, applied to our
hardest row. **A blank where a number would be is a stronger trust signal than any
number we could put there.**

**And the contrast is the mechanism.** Rows one and two are countable and stated
flatly and unhedged. **That is precisely what earns the right to say row three is
certain but unshowable.** This is Jon's ratified spine, sight then certainty,
arrived at independently by the research.

**Three supporting patterns to adopt.**

- **Show the shape of the answer before the question is asked.** DNS Checker
  renders all 33 result rows, empty, on load. Originality renders its gauge, its
  label and its threshold selector before you scan. **Three labelled empty rows on
  arrival is the teaching**, and it is why the resting state works and the
  pre-filled example was fighting it.
- **Pre-empt the null result before the scan.** Content Credentials Verify:
  *"Content Credentials are still rolling out, so the content you choose to
  inspect may not have information to view."* **Clean pastes will be common. Say so
  up front so finding nothing reads as a working tool rather than a broken one.**
- **Put the count inside the verb.** getgpt.app labels its button
  **`Remove Watermarks (4)`**. The control is the call to action, the finding and
  the proof at once. **For a product whose whole difficulty is that the benefit is
  invisible, this is the highest leverage single idea found anywhere.**

---

## 9. Where the hard arguments actually live

**The FAQ is the largest section on these pages. Larger than the hero.** Measured
on Undetectable.ai: **2.27 screens of FAQ against a 1.09-screen hero.**

Every site loads legality, ethics, mechanism and limits into it. **It is the one
place long, careful, hedged prose is expected and forgiven.** Neither Jon nor this
session had considered it, and it answers the question that had been stalling us:
where do arguments go that will not fit near the top.

**Rough proportions across the detector set:** tool 7 to 11% of page height,
argument 35 to 50%, proof 15 to 25%, commerce and FAQ and footer the rest.
**Pages are long. Nobody is trying to fit the argument on one screen. They fit the
tool on one screen and let the argument run for thirty.**

---

## 10. Warnings

**A three-part result is not free.** Content at Scale shipped one and killed it:
*"We have simplified the scoring to give you an overall probability."* Ours is
three-part by nature, which is all the more reason the three rows must share one
template.

**Do not build a before-and-after detection gauge for layer B.** It is
undetectable.ai's core device, *"See your text the way a detector would"*, and it
is the most tempting thing in the category to copy. **No public detector for the
Claude statistical watermark exists, so any needle that moves for layer B is a
fabricated instrument.**

**The FTC fined accessiBe $1,000,000** for claiming its automated tool would
*"automatically comply"* with accessibility standards, when the product *"failed
to make many basic website components accessible."* **An automated tool making a
categorical claim about an outcome it cannot demonstrate. That is the layer B
shape exactly.** The same order also penalised them for presenting paid
endorsements as impartial reviews.

**Do not reach for a badge, a logo wall or an "as seen in" strip until something
has actually been audited.** On a page whose argument is that we say what we
cannot prove, an unearned trust mark poisons everything around it.

**Emoji-led headings, countdown timers, manufactured report IDs and
live-ticking "new users this week" counters** all correlate, in this category,
with sites that also have copy errors, affiliate upsells in their success states,
or the vendor's name spelled wrong.

---

## 11. Competitive notes worth keeping

**`claudewatermark.com` already exists**, and is a find-and-replace clone of a
ChatGPT site that nobody proofread. It answers *"What is a Claude Watermark?"*
with a sentence about **OpenAI and ChatGPT**, and calls the company
**"Claude Anthrotopic"**.

**A small cluster has already built our three-layer table:**
`checkaiwatermarks.com`, `slopornot.ai`, `erased.ink`,
`remove-ai-watermark.com`. Their headings:

> **"Not every AI watermark lives in the same layer."**
> **"Know what you are scanning"**
> **"Evidence, not guesswork"**

Their capability grid uses tick and cross per layer, **with the cross rows reading
"Provider detector needed" and "API not released."** A competitor publishing what
it cannot do, layer by layer, in the same table as what it can.

**`humantext.pro` states our hardest fact better than we do:** *"SynthID
watermarks are fundamentally different from Unicode watermarks and cannot be
simply stripped out like hidden characters."*

**`writehuman.ai` is already running our best emotional argument**, in a piece
titled "Claude's Watermark Punishes the Wrong People", quoting Anthropic inline.
