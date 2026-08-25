# Tell the truth about runs

**25 August 2026.** Brief: `docs/briefs/tell-the-truth-about-runs.md`. A copy
session. No engine code, no arithmetic, no pushes, no deploys.

**Written as I go. The "What I could not prove" section is at the bottom and it
is the part to read first if you only read one.**

---

# THE HEADLINE, BEFORE ANYTHING ELSE

**The site promised that no more than three of a customer's own words survive in
a row. The measured figure is up to 388, and the receipt that was supposed to
show this cannot print a number above 10.**

**A second thing, not in the brief, found while verifying it: the rescue the
brief proposed does not hold either.** The brief says to keep "over 90% of
three-word sequences broken" by scoping it to the text we rewrite. **The engine
lane committed a 63-run ladder hours ago that measures exactly that, and the
claim holds on 18 of the 63 runs.** The median is 81.5% broken, not over 90%,
and on deepseek — settled as the model in that same commit — it holds 3 times in
21. **It is true of a 500 word paste and false of a term paper.** §3.

**I removed it and wrote no number in its place. `04` entry 77 makes statistics
Jon's**, so the replacement figure is his call, and §3 sets out the only version
of it I think the data supports.

---

# 1. THE INSTRUMENT, RUN AGAINST THE SHIPPING FILE

**Jon has ruled that `lib/engine/receipt.ts` keeps its ladder of
`[3, 4, 5, 6, 8, 10]`. I did not touch it. I did import it and run it**, so what
follows is the real output of the real file rather than a reading of it.

Script: `ceiling.ts`, in the session scratchpad. It builds documents in which a
known number of consecutive words come back byte for byte — which is the shape of
a frozen quotation and also the shape of a chunk handed back unrewritten — and
asks the shipping receipt what it prints.

```
WHAT THE RECEIPT PRINTS WHEN A LONG RUN SURVIVES
========================================================================================================
nothing survives                                 |   truth   0 words   |   receipt prints  0   |   replaced   100%
a 3 word run survives                            |   truth   3 words   |   receipt prints  3   |   replaced  99.9%
a 6 word run survives                            |   truth   6 words   |   receipt prints  6   |   replaced  99.6%
a 10 word run survives                           |   truth  10 words   |   receipt prints 10   |   replaced  99.2%
a 57 word run  (the freeze guarantees this)      |   truth  57 words   |   receipt prints 10   |   replaced  94.5%
a 352 word run (a lazy chunk)                    |   truth 352 words   |   receipt prints 10   |   replaced  64.9%
a 388 word run (measured, worst observed)        |   truth 388 words   |   receipt prints 10   |   replaced  61.3%
========================================================================================================

The full bar chart the customer is shown for that 388 word case:
    3 in a row   38.7%
    4 in a row   38.6%
    5 in a row   38.6%
    6 in a row   38.5%
    8 in a row   38.4%
   10 in a row   38.2%
```

**Three things this settles, and the third is the useful one.**

1. **Below 10 the number is honest.** 3 prints 3, 6 prints 6. The reading is
   exact until the ladder runs out.
2. **At 10 it stops meaning anything.** 57 words, 352 words and 388 words all
   print the same "10". **A customer reading "10 words" is reading the top of
   the scale, not a fact about their document.** That is why the wording had to
   change and why the arithmetic did not have to.
3. **The "Replaced" tile is NOT blind, and it is the honest instrument.** The
   same three cases print 94.5%, 64.9% and 61.3%. **It separates a document that
   was only frozen from a document that came back partly unrewritten, which is
   exactly the distinction the brief asks the copy to make.** So the copy now
   leans on Replaced and stops leaning on Longest run.

---

# 2. THE CLAIM, IN EVERY PLACE MY SWEEP FOUND IT

**The brief listed five places. The grep found six. Reading the pages found
nine.** All three counts are below, because the gap between them is the finding.

**The grep, verbatim:**

```
$ grep -rn -iE "three[ -]word|three word|3[ -]word|three in a row|three consecutive" \
    --include=*.tsx --include=*.ts --include=*.md --include=*.json apps/web

app/(marketing)/how-it-works/page.tsx:87         'Three words in a row, maximum'
app/(marketing)/how-it-works/page.tsx:88         '...holds what survives to three in a row...'
app/(marketing)/_components/faq-items.tsx:37     '...a hard three-word ceiling on surviving sequences...'
app/(marketing)/_components/moat-section.tsx:33  '...no more than three in a row come through.'
app/(marketing)/_components/moat-section.tsx:156 '...over 90% of three-word sequences broken...'
app/(marketing)/_components/workbench/workbench.tsx:1183 'Three words in a row is the most that survives...'
app/(marketing)/_components/workbench/receipt-panel.tsx:149 'No stretch of even three original words survived...'
engine/ENGINE.md:135,137                         (the engine's own rule table, NOT MINE)
```

**`receipt-panel.tsx:149` is the sixth, and the brief did not have it.** It is
also the one line in the whole set that was already true: it describes a
measured zero rather than promising a ceiling. It changed for grammar, not for
honesty.

**THE THREE THE GREP COULD NOT FIND ARE THE POINT.** They make the same false
claim without containing the word "three", so no sweep for the number would ever
have reached them:

| Where | What it said | Why the grep missed it |
|---|---|---|
| `faq-items.tsx`, *"How do I know the rewrite actually worked?"* | *"the receipt shows how little survives"* | A conclusion drawn FROM the capped number, with no number in it |
| `moat-section.tsx`, the receipt legend | *"the most of your words left in a row. **The mark needs longer**"* | Asserts the surviving run is too short to carry the mark. No figure named |
| `workbench.tsx:1181`, **shown to a paying customer** | *"The longest stretch of your original wording left is `{receipt.longestRun}` words in a row"* | **The number is interpolated at runtime.** There is no digit in the source to grep for |

**The last row is the one to remember.** The most exposed instance of this claim
on the whole site — addressed to somebody who has paid, about their own
document — was invisible to a text search **because the false number is only
assembled when a real customer is looking at it.** The brief warned that its
list was "what one grep found, not a guarantee". It was right, and the miss was
not at the edges.

---

# 3. THE FIGURE THE BRIEF ASKED ME TO KEEP, AND WHY IT HAD TO GO

**The brief's rescue for "over 90% of three-word sequences broken":** *"measured
overlap on the unfrozen text runs 0.02 to 0.09, meaning over 90% of the original
three-word sequences in the rewritten portion are gone."*

**The engine lane committed a fresh 63-run ladder while I was working
(`dfc4cad`, 25 August, "Deepseek confirmed on a second day"). It records
`overlap_unfrozen` per run — THE EXACT METRIC THE BRIEF NAMES: the share of the
customer's three-word runs still present in the text the engine actually
rewrote.** So this does not have to be inferred. It can be counted.

**It is not 0.02 to 0.09. Across 63 runs on the shipped engine it is 0.025 to
0.602, with a median of 0.185.**

```
BY MODEL              n      min   median      max    meets "over 90% broken"
-----------------------------------------------------------------------------
mistral/mistral-small 21   0.0347   0.1747   0.4302    6 of 21
mistral/mistral-medium 21  0.0252   0.1009   0.4093    9 of 21
deepseek/deepseek-v3.2 21  0.0505   0.2887   0.6017    3 of 21  <- THE SETTLED MODEL
-----------------------------------------------------------------------------
ALL 63 RUNS           median 0.1846  ->  81.5% broken, not "over 90%"
The claim holds on 18 of 63 runs.
```

**★ AND IT FAILS BY DOCUMENT SIZE, WHICH IS THE part WITH A PRODUCT MEANING.**

```
  words   median overlap   median % broken   meets "over 90% broken"
    463           0.0473             95.3%   9 of 9      holds
    919           0.0514             94.9%   6 of 9
   1942           0.1846             81.5%   0 of 9      gone
   2971           0.2497             75.0%   2 of 9
   4958           0.3201             68.0%   1 of 9
   7498           0.2887             71.1%   0 of 9
   9946           0.3604             64.0%   0 of 9
```

**The claim is true of a 500 word paste and false of everything a paying
customer is likely to bring.** It holds on 9 of 9 short runs and on 0 of 9 at
both 1,942 and 7,498 words. **A student's term paper is the size at which it
stops being true.**

**On deepseek — settled as the model in `dfc4cad`, hours before I wrote this —
it holds 3 times in 21.** The single worst run left 60% of the customer's
three-word runs standing in the text it had just rewritten.

**So the figure could not be rescued by scoping, and rewording could not save
it.** The brief hoped that pointing it at the rewritten text only would make it
true. `overlap_unfrozen` IS the rewritten text only, and the claim is false
there on 45 of 63 runs.

**What I did.** Removed it from the two whole-service slots and put nothing
numeric in its place, under the brief's own rule: *"If you cannot name a number
honestly, do not name one."* **No claim went up.**

**What is Jon's to decide, and it is his under `04` entry 77 (statistics are
discussed before they are changed).** Either publish an honest replacement from
this data, or publish no averaged figure at all and let the per-job receipt
speak. **My recommendation is the second, and this table is the argument for
it:** any single site-wide number is a lie about one end of the range or the
other, because **the honest figure depends on how long the customer's document
is** — 95% on a short paste, 64% on a long one. **The receipt already tells each
customer their own number, which is why the moat line now reads "Every figure
there is measured on your own document, not averaged from ours."**

**If Jon wants a number anyway, the only defensible one from this data is a
floor stated with its condition attached**, along the lines of *"on documents
under a thousand words we measure over 90% of your three-word runs broken; on
longer documents it is lower and the receipt shows you yours."* **I have not
written that anywhere. It is a new statistic and it is his call.**

---

# 4. JOB 1 — EVERY SENTENCE, BEFORE AND AFTER, IN FULL

**The one grammar all six now share**, so a visitor who reads two of these pages
does not meet two different products:

> **runs** is the noun, taught in the same breath every time it is used · the
> engine **works to a three-word limit**, which is a rule it is built to and
> never a promise about your document · **quotations and references are
> protected on purpose and come back exactly as you sent them** · the numbers
> are **yours, measured on your document**, not a test-set average.

**Why "works to a three-word limit" and not "a hard three-word ceiling".**
`ENGINE.md` section 3 rule 3 is *"No runs of more than three consecutive words,
**subject to rules 1 and 2**"* — rule 1 is facts surviving character for
character and it explicitly OUTRANKS this one, rule 2 is length. **Three was
never a guarantee in the engine and the site was the only place it was written
as one.** Stating it as the rule it actually is keeps every bit of the technical
force and costs the claim nothing.

**Why "runs" and not "sequences".** `04` entry 76, Jon on the hero statistics:
*"three word sequences no one knows what that means."* The ruling approved
*"three-word runs of your wording ... and a clause saying runs are where the
mark hides, so the number explains itself."* **Three of the six places were
still using the word he rejected.** They are not any more.

---

## 4.1 `/how-it-works`, the engine rules

**BEFORE**

> **Three words in a row, maximum**
> The signature needs unbroken stretches of the original words, so the engine
> holds what survives to three in a row. Across our test set it breaks over 90%
> of three word sequences.

**AFTER**

> **Break the runs**
> The signature travels only in unbroken runs of your original wording, so
> swapping a word here and there leaves it intact. The engine rebuilds the
> wording wherever it rewrites, working to a three-word limit on what carries
> over. Quotations and references are protected on purpose and come back exactly
> as you sent them.

---

## 4.2 The FAQ, "Why can't I just ask another AI to reword it?"

**BEFORE**

> Because a generic rewrite protects exactly the wrong thing. Ask any model to
> reword and it hands your text back mildly altered, and unbroken stretches of
> your original wording are precisely where the statistical watermark lives. In
> our tests generic rewrites left those stretches intact, came back around a
> third shorter, and silently dropped facts. Ours is a purpose-built engine, not
> a prompt: **a hard three-word ceiling on surviving sequences**, routed through
> a model that is not Claude so the mark cannot be reapplied mid-rewrite, every
> number, date and name checked against your original with a retry if one
> drifts, and length held within a tenth. **Across our test set it breaks over
> 90% of three-word sequences with zero figures lost**, and every run hands you
> those numbers.

**AFTER**

> Because a generic rewrite protects exactly the wrong thing. Ask any model to
> reword and it hands your text back mildly altered, and unbroken runs of your
> original wording are precisely where the statistical watermark lives. In our
> tests generic rewrites left those runs intact, came back around a third
> shorter, and silently dropped facts. Ours is a purpose-built engine, not a
> prompt: **it works to a three-word limit on what carries over**, routed
> through a model that is not Claude so the mark cannot be reapplied
> mid-rewrite, every number, date and name checked against your original with a
> retry if one drifts, and length held within a tenth. **Quotations and
> references are protected on purpose and come back exactly as you sent them.
> Every run hands you the numbers for your own document.**

---

## 4.3 The FAQ, "How do I know the rewrite actually worked?"

**Not on the brief's list. My sweep found it and it was leaning on the same
broken instrument** — *"the receipt shows how little survives"* is a claim made
out of a number that stops at 10.

**BEFORE**

> Nobody can verify the removal of a statistical watermark yet, and any tool
> that claims otherwise is lying to you and selling a fraudulent product. What
> we give you is measured: every run returns the share of your wording replaced,
> the longest sequence of your original words still standing, and every figure
> checked. The mark rides only on unbroken stretches of your original words,
> **and the receipt shows how little survives.**

**AFTER**

> Nobody can verify the removal of a statistical watermark yet, and any tool
> that claims otherwise is lying to you and selling a fraudulent product. What
> we give you is measured: every run returns the share of your wording replaced,
> the longest run of your original wording still standing, and every figure
> checked. The mark rides only on unbroken runs of your wording, so those are
> the numbers that describe the work. **Read them together with what we
> protected: quotations and references come back exactly as you sent them, so
> they count towards that longest run by design.**

---

## 4.4 The moat section, the engine rule

**BEFORE**

> **Break every sequence**
> The mark survives only where your words survive in order. **Hard ceiling: no
> more than three in a row come through.**

**AFTER**

> **Break the runs**
> The mark survives only where your words survive in order. The engine works to
> a three-word limit wherever it rewrites, and protects your quotations and
> references rather than rewording them.

---

## 4.5 The moat section, the receipt legend

**BEFORE**

> **Longest surviving sequence** — the most of your words left in a row. **The
> mark needs longer**

**AFTER**

> **Longest surviving run** — the most of your wording left in a row, protected
> text included

**"The mark needs longer" was the single most confidently wrong clause on the
site.** It told the reader that whatever survived was too short to carry the
mark. 388 words survived.

---

## 4.6 The moat section, the closing line under the receipts

**BEFORE**

> On our test set: **over 90% of three-word sequences broken**, zero figures
> lost. Measured, not estimated.

**AFTER**

> Every figure there is measured on your own document, not averaged from ours.

**"Zero figures lost" left this sentence with the 90%, and I want to be exact
about why**, because it is not my call to make. **I did not judge it and I did
not fix it.** It sits inside the sentence I was rewriting, the F1 audit has
already measured a live run losing a figure, and re-typing it into a sentence I
authored would have been me endorsing it. **So it came out of this one slot and
it is untouched everywhere else** — `/how-it-works` and the FAQ both still say
it. **That is board item C-1 and it is still open.** §8.

---

## 4.7 The workbench, the layer B row before the rewrite runs

**BEFORE** (the closing clause only; the rest of the paragraph is unchanged)

> ... so we rebuild every sentence. **Three words in a row is the most that
> survives**, and your facts and length are checked against your original.

**AFTER**

> ... so we rebuild every sentence we rewrite, **working to a three-word limit
> on what carries over. Quotations and references are protected on purpose and
> come back as you sent them.** Your facts and length are checked against your
> original.

---

## 4.8 The workbench, what a PAYING customer is told when the job finishes

**This is the one the brief singled out and it is the worst of the six**,
because it is the only one addressed to somebody who has already paid, about
their own document, with a number in it.

**BEFORE**

> Rewritten. The longest stretch of your original wording left is **10** words
> in a row. The mark rides only on unbroken stretches of your original words.

**AFTER**

> Rewritten. The receipt below shows how much of your wording was replaced, and
> the longest run of it still standing. Quotations and references are protected
> on purpose, so those come back exactly as you sent them.

**The brief offered "at least 10 words", no number, or a third thing argued for.
I took the third thing: no number HERE, and an honest number in the receipt tile
directly below it.** The reasoning, since the brief asked for an argument rather
than a preference:

1. **The receipt panel renders immediately underneath this sentence.** Saying
   the figure in prose and again in a tile puts the weakest measurement the
   product owns in front of the customer twice.
2. **A sentence is read as a finding; a tile is read as a reading.** "The longest
   stretch left is at least 10 words" still invites the reader to treat 10 as
   their document's answer. `10+` sitting in an instrument panel does not.
3. **This line's job is to say the work finished and point at the evidence.**
   That is what it now does.

---

## 4.9 The receipt tile, and the chart under it

**BEFORE** — tile: `Longest run · 10 words · of your original left in a row`,
rendered as one of the two lit headline figures.

**AFTER** — tile: `Longest run · 10+ words · of your wording, in a row`, no
longer lit.

**The de-emphasis is the argument, not a styling preference, and §1 is why.**
Replaced and Longest run were the two headline numbers. **Replaced separates a
frozen document from a partly-unrewritten one — 94.5% against 61.3% on the run
in §1. Longest run cannot: 57, 352 and 388 all print "10".** One of those two
deserves to be a headline. The other keeps its place, because below ten it is
exact, and stops carrying weight it cannot hold.

**The chart caption, BEFORE**

> Pieces of your original wording still in a row
> The mark can only travel in unbroken stretches of the original words. **This
> is all that is left of them.**

**AFTER**

> Runs of your original wording still in a row
> The mark can only travel in unbroken runs of your wording, so those are what
> the rewrite breaks up. **Some runs survive on purpose: quotations and
> references are protected, and come back exactly as you sent them.**

**And the sentence shown when nothing survived, which was already true** and
changed only to share the grammar:

> **BEFORE** No stretch of even three original words survived. The sequences the
> mark travels in are broken up completely.
> **AFTER** No run of even three of your original words survived. The runs the
> mark travels in are broken up completely.

---

## 4.10 The one thing I added that was never on the site at all

**Before today the words "quotation" and "reference" did not appear anywhere a
visitor could read them.** Verified:

```
$ grep -rn -iE "quotation|quoted|quotes" apps/web/app/\(marketing\)/ --include=*.tsx --include=*.ts
how-it-works/page.tsx:257    (a source link, unrelated)
how-it-works/page.tsx:360    (a code comment, unrelated)
workbench/credits.ts:108,109 (code comments about pricing, unrelated)
pricing/page.tsx:274         (unrelated)
```

**So the freeze — which returns about a quarter of a typical document, and 63.9%
of one dialogue-heavy short story, exactly as the customer sent it — was
invisible on the site.** Job 1 could not be done without saying it, because the
whole point of the job is to separate a run that is the product working from a
run that is a shortfall.

**Placement respects Jon's earlier ruling.** `how-it-works/page.tsx:360` records
that the quotation caveat came off the proof block *"at Jon's instruction: both
are stated where they belong, on /capabilities and in the FAQ."* **The fullest
statement is now in the FAQ, which is one of the two homes he named. The proof
block is untouched.** `/capabilities`, the other home, still says nothing about
it — see §8, it needs its own pass and it is not in this brief.

`tsc --noEmit`, after job 1:

```
$ npx tsc --noEmit
=== tsc exit: 0 ===
```

---

# 5. JOB 2 — the word limit. THE BRIEF'S TWO TARGETS WERE BOTH THE WRONG ONES

**The brief named `pricing-data.ts` ("a dissertation") and the calculator's
"10,000" as the places to change. Neither is the advertised per-job ceiling.**

| The brief's target | What it actually is |
|---|---|
| `pricing-data.ts:73` "A dissertation, with room to spare." | The **Pro pack's total coverage**: 100 credits, 100,000 words. Nothing to do with one job |
| `credit-calculator.tsx:121` `<span>10,000</span>` | **A tick mark on a slider** running 500 to 100,000, sizing a credit purchase. Not a limit claim |

**The real per-job ceiling reaches a visitor in exactly two places, and both are
driven by a constant rather than written out:**

```
app/(marketing)/_components/workbench/credits.ts:35   export const MAX_WORDS = 10_000
  -> workbench.tsx:1811   "{words} words. The rewrite takes {MAX_WORDS} at a time..."

lib/engine/client.ts:64   'That is longer than 10,000 words, which is the most
                           the rewrite can do in one go. Split it and run it in parts.'
```

## 5.1 What I changed

**`MAX_WORDS`: 10,000 -> 8,000.** §5.5 of the freeze note derived it and handed
it back; I did not re-derive it and did not raise it. The workbench message
renders the constant, so it followed automatically. **Proved live, at 375px**,
by driving 8,500 words into the paste box:

```
8,500 words. The rewrite takes 8,000 at a time. Split it and run it in parts.
   width 292px, 2 lines, not clipped, does not overflow the viewport
```

**The pricing FAQ now states the limit**, because `"What can I put through it?"`
was the obvious home for it and said nothing:

> **ADDED** One rewrite takes up to 8,000 words, which is a long chapter.
> Anything bigger goes through in parts, and credits are charged by the word
> either way, so splitting a document costs you nothing extra.

**The Pro pack line**, because the brief named it and because a visitor buying
the biggest pack should not think a dissertation is one press:

> **BEFORE** A dissertation, with room to spare.
> **AFTER** A dissertation, run in parts.

**The pack cards did not move: all three measure 332px at 1280px**, so entry
109's signed-off card geometry is intact.

## 5.2 ★ TWO THINGS I DID NOT DO, AND THE SECOND IS THE IMPORTANT ONE

**1. `lib/engine/client.ts` still says 10,000, ON PURPOSE.** That string is the
message shown when the PYTHON ENGINE refuses, and the engine refuses at
`UC_MAX_WORDS`, which is still 10,000 and is Lane A's file. **Changing it to
8,000 would have made it fire at 10,001 words while claiming the limit is
8,000, which is a brand new false statement.** It becomes correct the moment
Lane A lowers `UC_MAX_WORDS`, and not before.

**2. ★ THE 8,000 IS ADVISORY, NOT ENFORCED, AND THE SITE AND THE ENGINE NOW
DISAGREE.** The brief asked me to say this loudly, so here it is loudly.

`workbench.tsx:503` reads:

```ts
carriesProse && (scan?.billing?.over_limit ?? wordsNow > MAX_WORDS)
```

**The server's answer comes FIRST and `MAX_WORDS` is only the fallback.** So:

| Case | What happens now |
|---|---|
| 8,500 words, before a scan runs | **Refused**, with the 8,000 message. Verified above |
| 8,500 words, after a scan has run | **Allowed through.** The server said `over_limit: false`, because ITS ceiling is still 10,000 |

**So a scanned 9,000 word document still runs, and the site now advertises a
number it does not always hold itself to.** The direction is the safe one —
nothing is charged for a job that is then refused, and no job that starts is at
any new risk — but it is a real gap and it is not mine to close. **Closing it is
one number in the Python engine: `UC_MAX_WORDS` to 8,000. That is Lane A's, and
the `client.ts` string above follows it in the same change.**

**This is the "two implementations of one number" trap the brief named, and I
could only move one of the two.**

---

# 6. JOB 3 — "about 10 seconds"

**There was no literal "10 seconds" in the source to find.** The sentence is
assembled at runtime from `estimateSeconds`, which is
`Math.max(10, ceil(words / 1000 * 15))` — **a floor of ten seconds**, so every
document under about 670 words was quoted "about 10 seconds".

**Why that had to go, in one line: the only time this project has ever measured
the rewrite in production, a 478 word document took 65 seconds.** That document
is quoted 10 seconds by this function. **It was out by 6.5x on the single
real-world case anyone has checked it against, in the direction that makes a
working tool look hung** — and the same box quoted 2.9 seconds correctly for a
short paste on mistral-small, so it was not conservative or optimistic, it was
unrelated to the answer.

**BEFORE**

> Breaking up the wording. This can take about 10 seconds.
> · takes up to about 30 seconds *(the pre-button line, on a 2,000 word paste)*

**AFTER**

> Breaking up the wording. *(under 1,000 words)*
> Breaking up the wording. A document this long can take a few minutes. *(1,000+)*
> · can take a few minutes *(the pre-button line)*

**Verified live at 375px on a 2,000 word paste:**

```
2,000 words = 2 · can take a few minutes
   1 line, 260px wide, does not overflow

Seconds figures anywhere on the page:  NONE
   (/\d+\s*seconds/ against document.body.innerText -> false)
```

**Jon's instruction of 21 August is still being obeyed.** "A long run must tell
people it is long, or a working tool reads as a hung one." It still says so. It
stopped naming seconds.

**Why no number at all rather than a bigger number, which is the part the brief
asked me to argue.** The ceiling here is the per-wave time, and **the per-wave
time is a property of the model, which is under review right now.** Any constant
becomes a lie the day the model switches. "A few minutes" is true of a long
document on all three models measured, and **the elapsed-second counter that
already sits beside it is the real time rather than a prediction about it** — a
number that keeps climbing answers "is this hung?" better than any estimate.

**`estimateSeconds` and `humanDuration` are left in `credits.ts`, no longer
called, carrying a warning not to wire them back in without a production
measurement.** Deleting them would have thrown away the lab measurements in
their comment; leaving them bare would have invited the next session to reuse
them.

---

# 7. RENDERED AND MEASURED — AND THE PART THAT FAILED

**★ I could not photograph anything. The browser pane returned a blank image on
every attempt**, at three viewport sizes and after fronting the tab. It is the
pane, not the pages: the same pages report full geometry, real element heights
and correct text through the DOM, and the dev server answers 200. **The brief
asked for screenshots at desktop and phone width and I do not have them. That is
a step that failed and I am not dressing it up as anything else.**

**What I did instead, and it answers the same question more precisely than an
eye would.** For every changed string, at 1280px and at 375px: rendered width,
line count, whether the element clips its own content vertically or
horizontally, whether it crosses the viewport edge, and whether the document
scrolls sideways.

```
/how-it-works — the four engine rule cards
  1280px   Break the runs 3 lines · the other three 2 lines each
           no clipping · no sideways scroll
   375px   Break the runs 5 lines · others 4, 3, 3
           no clipping · no sideways scroll · nothing crosses the edge

  (first draft was 4 lines against 2 at desktop, which read as a broken row.
   Rewritten shorter to the same shape as the moat card before it was kept.)

/ homepage — the two rewritten FAQ answers
  1280px   613px wide · 9 lines and 7 lines · no clipping · no sideways scroll
   375px   335px wide · 16 lines and 12 lines · no clipping · no sideways scroll

/pricing — the new limit sentence and the changed pack line
  1280px   FAQ 615px, 7 lines, not clipped
           pack cards 332px / 332px / 332px — EQUAL, entry 109 geometry intact
   375px   FAQ 335px, not clipped, right edge 355 of 375
           pack line 1 line, not clipped

workbench, driven live with real input at 375px
   8,500 words -> "8,500 words. The rewrite takes 8,000 at a time. Split it
                   and run it in parts."   2 lines, not clipped
   2,000 words -> "2,000 words = 2 · can take a few minutes"   1 line
```

**Two surfaces are NOT covered by any of that, and both are named again in §9.**

---
# 8. JOB 4 — D4'S PRE-FLIGHT WORDING. IT NO LONGER READS CORRECTLY

**First, the thing that decides how to read the rest of this section: D4 IS NOT
BUILT.** It is board item **W-10**, in Lane C, and nothing implements it.
Verified:

```
$ grep -rn "exactly as you sent it\|protected from being reworded\|full rewrite" \
    apps/web/app apps/web/lib --include=*.tsx --include=*.ts
(no match)
```

**So this is a review of the text on the board, not of a rendered dialogue. I
have changed nothing, which is what the brief asked.**

**D4's fixed wording, quoted from `IMPLEMENTATION-BOARD.md`:**

> **We will return about 42% of this document exactly as you sent it.**
> That's text we've protected from being reworded — quotations, references and
> similar — so it comes back character for character. The other 58% gets the
> full rewrite.
>
> **Continue** · **Cancel**

## 8.1 The percentage itself: fine, and the 60% trigger now earns its place

**The number rising does not hurt this wording.** It is written as "about X%"
with the figure substituted, so 23% and 64% both read correctly.

**And Jon's "louder prompt above 60%" has gone from theoretical to live.** Before
the ruling the dialogue-heavy short story measured 0.0% frozen; after it, 63.9%.
**That threshold now fires on exactly the case it was designed for**, which is a
point in the design's favour rather than against it.

## 8.2 ★ BUT "The other 58% gets the full rewrite" IS NOW FALSE, and it is the
## sentence the customer is asked to click Continue on

**Two independent reasons, and the first is the serious one.**

**1. A chunk inside that 58% can come back unrewritten.** That is D3's fallback,
and it is not rare. The freeze note §5.2: *"In about half of all runs the
customer now receives at least one chunk — roughly 350 words — unrewritten."*
The 25 August ladder shows the same thing on the settled model: every
`ladder_5000` deepseek run recorded `fallbacks: 1`.

**So a visitor is told "the other 58% gets the full rewrite", clicks Continue,
pays, and receives 350 words of that 58% exactly as they sent it.** The promise
is made at the one moment it is load-bearing: before the money moves.

**2. "Full rewrite" overstates what the rewritten portion gets even when nothing
falls back.** §3's table: on a document of a few thousand words, the median run
leaves 18% to 36% of the customer's three-word runs standing inside the text it
did rewrite. **That is a heavy rewrite. It is not a full one, and this project
has just spent a whole session removing the last sentence that said otherwise.**

## 8.3 ★ AND IT BREAKS JON'S OWN STYLE RULE

**D4's wording contains an em dash** — *"protected from being reworded —
quotations, references and similar"*. The `unclaude-messaging` skill, from
`docs/05` section 2: **"No em dashes and no en dashes. Anywhere a visitor
reads."** It is Jon's own rule for his own site.

**This is a trap for whoever builds W-10**, who is told the wording is fixed and
may not be improvised. They will either ship the dash and break the style rule,
or change the wording and break the board. **Only Jon can release that.**

## 8.4 One smaller thing, flagged and not acted on

*"quotations, references and similar"* was accurate when the freeze was
attribution-gated. Since the ruling **every block quote freezes, with no test at
all** — the freeze note's own §1.3 records that an indented address or a poem
now freezes too, and its "what I could not prove" #4 flags it as the author's
reading of Jon's ruling rather than Jon's words. **"And similar" is carrying
more weight than it was written to carry.** Minor next to §8.2, and listed for
completeness.

## 8.5 What I recommend, in one sentence, since D4 is Jon's

**Change only the last sentence, keep the rest byte for byte:** *"The other 58%
is rewritten."* **It drops the word doing the damage, needs no new number, keeps
the two-part shape and the Continue/Cancel, and stops promising a completeness
the engine does not deliver in about half of runs.** The em dash in §8.3 still
needs his separate say-so.

---
# 9. WHAT I COULD NOT PROVE

**1. ★ I have no screenshots. The brief asked for them and I do not have them.**
The browser pane returned a blank image on every attempt, at 800x450, 1280x900
and 375x812, before and after fronting the tab. It is the pane rather than the
pages: the same pages report full geometry and correct text through the DOM and
the dev server answers 200 throughout. **What I have instead is measured
geometry at both widths — width, line count, self-clipping, viewport overflow,
sideways scroll — which answers the layout question more precisely than an eye
would, and does not answer the question of whether it LOOKS right.** §7 has the
numbers. **Somebody should look at these five surfaces before this ships.**

**2. ★ I never saw the receipt panel render, and it is the surface I changed
most.** It only exists after a completed rewrite, which needs credits and a
live engine call, which costs money and was not mine to spend. **So "10+" in the
tile, the un-lit Longest run, and the new two-sentence chart caption are
unrendered.** What I can say: the tile's value slot already carries "100%" in
the Length tile and "53/53" in the Facts tile at the same size, so a three
character "10+" cannot overflow anything those do not — **but that is reasoning,
not a measurement, and I am labelling it as such.**

**3. That "a few minutes" is right for the longest documents.** It is true of
everything measured: the worst lab run is 30.8s and the worst production
per-wave figure is 65s, and 8,000 words is 3 waves. **But the whole word-limit
argument rests on one production measurement of one document on one afternoon,
and that has not changed today.** If production is routinely slower than the
lab, "a few minutes" is right and my confidence in it is borrowed.

**4. Whether removing the 90% figure costs conversions.** It was the site's only
hard number about the rewrite's depth. **Taking it down is the honest move and
it is also the commercially expensive one**, and I have not measured that trade
because it is not measurable from here. §3 names the version I think the data
supports if Jon wants a number back.

**5. Whether "protected on purpose" reads as reassurance or as a catch.** It is
new language on this site and no visitor has ever seen it. **My reading is that
"your quotations come back exactly as you sent them" is a feature to a student
who is quoting a source, and the D4 pre-flight exists precisely because it might
not be.** Untested either way.

**6. Whether a statistical watermark is removed.** Not measurable, by anyone,
and nothing here claims otherwise. **Every number in this note measures how much
of the customer's own wording came back.**

---

# 10. HANDED BACK — THINGS I FOUND AND DID NOT FIX

**In the order I would want them looked at.**

**1. ★ `UC_MAX_WORDS` — LANE A. The site now says 8,000 and the engine still
refuses at 10,000**, and because the browser trusts the server's `over_limit`
first, a scanned 9,000 word document still runs. **One number in the Python
engine closes it, and `lib/engine/client.ts:64` follows in the same change.**
§5.2.

**2. ★ D4's pre-flight wording — JON. "The other 58% gets the full rewrite" is
false about half the time**, and the wording is fixed on the board so I could
not touch it. It also carries an em dash into visitor-facing copy, against Jon's
own rule. §8.

**3. ★ The replacement for "over 90%" — JON.** Removed, nothing put in its
place, and `04` entry 77 makes the new figure his. §3 has the data and my
recommendation.

**4. `moat-section.tsx` IS DEAD CODE, and two of the brief's five targets were
in it.** Nothing imports it. `claude-band.tsx` replaced it on 19 August 2026 and
carries no version of the claim, so the live site was never showing those two.
**I fixed them anyway — a dead file that gets revived carrying a false claim is
how this comes back.** `fact-cards.tsx`, `how-it-works-section.tsx` and
`stakes-section.tsx` are dead the same way. **Somebody should delete them, and
it should be a deliberate decision rather than mine at the end of a copy
session.**

**5. "Zero figures lost" is still live in two places** (`/how-it-works` engine
rule 3, and the FAQ). **The F1 audit measured a live run dropping a figure.**
That is board item **C-1**, not this brief. I took it out of the one sentence I
was rewriting and left it untouched elsewhere. §4.6.

**6. `/capabilities` says nothing about the freeze.** Jon's ruling of
`how-it-works:360` names `/capabilities` and the FAQ as the two homes for
quotation scope. **The FAQ now has it. `/capabilities` does not**, and putting
it there was outside this brief.

**7. The pricing calculator will size a 100,000 word job** and never mentions
that it runs in parts. The pack line now says so; the slider does not.

**8. `ENGINE.md` section 3 still documents only the seven prompt rules and does
not mention the freeze at all.** The site now describes behaviour the engine's
own document does not. Lane A's file.

---

# 11. WHERE THE NEXT SESSION PICKS UP

**Nothing here is blocking and nothing was pushed or deployed.** Three commits,
all local, all staged by explicit path:

```
a459798  Runs: the site said three, the measurement says up to 388
14c239e  Word limit down to 8,000, and the wait stops naming seconds
(this note)
```

**Other lanes committed underneath me while I worked** — `dfc4cad` (deepseek
confirmed) and `c1f8c1c` (the operator dashboard). **I staged nothing of
theirs.** `docs/04-decision-log.md` and `docs/06` had uncommitted marketing-session
work in them when I started; I have added to them and committed only those two
files plus my own.

**The single most useful next thing is not copy.** It is `UC_MAX_WORDS`, because
until it moves the site is advertising a limit it does not hold itself to.
