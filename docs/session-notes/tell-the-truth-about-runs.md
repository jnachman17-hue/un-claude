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
three-word sequences broken" by scoping it to the rewritten text. **The only
post-freeze measurement this project has contradicts that on the model the
engine lane recommends.** §3 below. **That figure is a statistic, `04` entry 77
makes statistics Jon's, and I have taken it off the two whole-service slots
rather than restate it. Jon may want it back with a fresh measurement behind
it.**

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

# 3. THE FIGURE THE BRIEF ASKED ME TO KEEP, AND WHY I DID NOT

**The brief's rescue:** *"measured overlap on the unfrozen text runs 0.02 to
0.09, meaning over 90% of the original three-word sequences in the rewritten
portion are gone."*

**The measurement it cites is `freeze-every-quotation.md` §5.3, and that table
does not say 0.02 to 0.09.** It is reproduced here in full, unedited. These are
three-word overlap figures measured per paragraph; higher means more of the
customer's original wording survived.

```
doc                      mistral-small        mistral-medium         deepseek-v3.2
----------------------------------------------------------------------------------
ladder_500                0.042  (n=6)          0.024  (n=6)          0.043  (n=6)
ladder_1000              0.034  (n=12)         0.032  (n=12)         0.356  (n=12)
ladder_2000              0.206  (n=25)         0.183  (n=25)         0.065  (n=25)
ladder_3000              0.144  (n=38)         0.019  (n=38)         0.121  (n=38)
ladder_5000              0.019  (n=64)         0.038  (n=64)         0.158  (n=64)
ladder_7500              0.059  (n=98)         0.056  (n=98)         0.107  (n=98)
ladder_10000             0.089 (n=130)         0.013 (n=130)         0.156 (n=130)
```

**"Over 90% broken" means a cell at or under 0.10. Counting the cells:**

| model | cells at or under 0.10 | cells over |
|---|---|---|
| mistral-small | 5 of 7 | 2 |
| mistral-medium | 6 of 7 | 1 |
| **deepseek-v3.2 — the model §5.4 recommends switching to** | **2 of 7** | **5** |
| **all three** | **13 of 21** | **8** |

**So the claim fails on 8 of 21 measured documents, and on 5 of 7 for the model
the engine lane recommends.** The worst cell, deepseek at 1,000 words, is 0.356 —
**64% broken, not 90%.**

**This is not a scoping problem and rewording does not fix it.** The brief hoped
the figure survived once you pointed it at the rewritten text only; §5.3 already
is the rewritten text only, measured per paragraph precisely so the frozen spans
would not inflate it.

**What I did.** Removed the figure from the two places it stood as a
whole-service claim, and put nothing numeric in its place. The brief's own rule
governs this: *"If you cannot name a number honestly, do not name one."* **No
claim went up; one came down and one went away.**

**What Jon has to decide, and it is his under `04` entry 77.** Either
re-measure the rewritten-text overlap on the shipped engine and publish whatever
it actually is, or leave the site making no averaged claim and let the per-job
receipt speak instead. **My recommendation is the second.** A per-customer
number the visitor can check on their own document is worth more than a test-set
average they cannot, it cannot go stale when the model changes, and the model is
under review right now.

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

