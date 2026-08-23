# What must survive a rewrite unchanged

**23 August 2026, workflow A.** Twenty-four agents, **3,865 measured runs** through
the real engine against the live gateway, both models, on twelve categories of
thing a customer's document contains.

**Discovery and design only. No engine file was modified, nothing was deployed
and nothing was pushed.** Every rate below has runs behind it and the real
inputs and outputs are pasted in full.

---

# 1. THE SHORT VERSION

**Nothing in un-claude knows that any part of a customer's document must come
back unchanged.**

Rule 1 of the rewrite prompt protects "numbers, amounts, percentages, dates, and
the names of people, companies and places". Rule 2 then orders the model to
rewrite everything else, **"including the words immediately around each fact"**.
The words *quotation*, *citation*, *title*, *heading*, *table*, *equation* and
*code* appear **nowhere in the engine at all.** I searched it.

Roughly thirty separately-measured defects across nine of the twelve categories
turn out to be that one fact wearing different clothes.

## The five worst, measured

| What happens | mistral-small | mistral-medium |
|---|---|---|
| **The words inside a direct quotation are rewritten** and still presented as the source's own | **155 of 225 quotations** | **162 of 205** |
| **A block quote is rewritten** — indented, no quote marks | **15 of 15 runs** | **15 of 15** |
| **A reference list comes back with invented authors and journals** | **23 of 41 runs** | 0 of 41 |
| **Every article title in a reference list is rewritten** | **40 of 41** | **41 of 41** |
| **Every section heading is renamed** | 70 of 90 | **90 of 90** |

**Every guard the engine owns reported success on all of it.** On the quotation
runs, 250 of 250 returned `ok=True` with the "figures to check" panel empty.

## Why the customer never catches it

This is the part that makes it dangerous rather than merely wrong. On the
quotation runs, everything a student would spot-check came back **perfect**:

```
the speaker's name          190 of 190 correct
numbers inside quotations    55 of 55  correct
block-quote indentation      40 of 40  correct
paragraph count             249 of 250 correct
```

Only the sentence the named person is on record as saying was invented. **The
document looks right. A marker clicking a link or checking a page number finds
everything in order.** That is a misattributed source, and it is the defect Jon
reported himself.

## And it is not only quotations

- A mill that **"ran for sixty years"** came back running for **"sixty decades"**
  — six hundred years — in **10 of 10** runs on `mistral-medium`, with nothing
  flagged, because the value `60` is still in the text and that is all the fact
  guard checks.
- A criminal-law paragraph came back saying the prosecution must prove the case
  **"with absolute certainty"** — the opposite of the actual rule. "Beyond a
  reasonable doubt" survived **1 of 40 runs**.
- A display equation is **deleted outright** — not reworded, deleted — in
  **14 of 30 runs**, whenever it is the last paragraph of a chunk, while the
  next paragraph still says "equation (3) gives...".
- An 898-word French essay came back **half in French and half in English** in
  **16 of 20 runs** on `mistral-small`, reported as a success every time.
- A student who wrote only the bare title *Guns, Germs, and Steel* got their
  essay back **crediting it to Isaac Asimov**, who did not write it.

## The recommendation, in one paragraph

**Four lanes, cheapest first.** Three quarters of the value ships before
anything costs a point of rewrite aggressiveness. Then a narrow freeze — detect
the spans that must survive, hide them from the model, put them back — costing a
measured **+0.016** on a 2,000-word essay and **+0.079** on one that is a fifth
quotation and reference list. **Section 8** is the plan. **Section 9 is the
reason phase 4 must not ship yet**, and it is a false positive bad enough to
destroy a document.

---

# 2. HOW TO READ THIS

Four terms, defined once.

**A rate with a denominator.** "9 of 10 runs" is a fact. "Sometimes" is not.
Every rate below is per model, because **the two models fail at completely
different things** and averaging them would hide it.

**Trigram overlap** is this product's core success measure: **the fraction of
the original's three-word sequences still present in the output.** Lower is
better — it means more of the wording genuinely changed. Today's engine
typically delivers **0.05 to 0.15**. Anything that pushes it up is spending the
product's whole purpose, which is why every protection below is priced in it.

**A protected span** is a run of the customer's words that must come back
character-for-character: a quotation, a citation, a web address, a table.

**Masking** means swapping a protected span for a short placeholder like `[[7]]`
before the model sees it, then swapping the real words back afterwards.

**One thing this document never claims.** Every number here measures **how much
of the original wording came back**. None of it measures whether a statistical
watermark was removed — **nobody can measure that, here or anywhere.** Layer B
stays best effort. See section 10.

---

# 3. THE RANKED DEFECTS

Ranked by how likely × how damaging, after deduplicating across the twelve
probes. "Findable" means a program could locate the thing needing protection
**before** the rewrite, precisely enough to be safe.

| # | Defect | Worst measured rate | Findable? | Customer notices? |
|---|---|---|---|---|
| 1 | A quoted or cited span comes back with different words, still presented as the source's own | 15/15 block quotes, both models | **Yes** | **No** |
| 2 | A fact changes and the fact guard is blind to it by construction | "sixty years" → "sixty decades" 10/10 medium | Partly | **No** |
| 3 | Structure the document is graded on is renamed or deleted | 90/90 headings renamed on medium | **Yes** | Yes |
| 4 | A technical term, hedge or legal standard is restated wrongly | "beyond a reasonable doubt" survived 1/40 | **No** | **No** |
| 5 | A chunk boundary destroys whatever sits on it | equation deleted 14/30; job fails 3/5 on code | **Yes** | Sometimes |
| 6 | A name is replaced, translated or described away | institution translated 18/30 small | **No** | Sometimes |
| 7 | The engine injects the AI tells it exists to remove | markdown on medium 35%–100% of runs | **Yes** | Yes |
| 8 | Non-English text is translated, mixed, or silently skipped | French essay half-translated 16/20 small | Partly | Yes |
| 9 | A table is silently rebuilt with invented headings | invented header row 7/10 small, 4/10 medium | **Yes** | Yes |
| 10 | A fact or source that was never in the document appears | invented figure 19/149 small, 23/149 medium | **No** | **No** |
| 11 | A web address is replaced with one that does not exist | 1 of 145 runs | **Yes** | **No** |
| 12 | Code stops being runnable | names changed 31/55 medium | **Yes** | Yes |
| 13 | The engine knows something went wrong and does not say | `structure_kept` false on all 14 deleted-equation runs | **Yes** | — |

**Item 13 deserves a sentence of its own.** The engine already computes a flag
called `structure_kept` and sets it to false when a paragraph goes missing. **No
file anywhere in the site reads it.** The engine knew the equation had been
deleted and told nobody.

---

# 4. THE TWELVE CATEGORIES, WITH THE REAL EVIDENCE

Every input and output below is verbatim from a real run.

## 4.1 Direct quotations — 251 runs

**The one that started this, and the worst in the set.**

The words inside the quotation marks are rewritten, the marks stay, the speaker's
name stays. Nothing holds rule 2 back over a quotation, because rule 1 protects
only numbers and names.

```
IN   Orwell warned that political language is designed "to make lies sound
     truthful and murder respectable," and the same warning applies to the way
     modern governments describe their military operations.

OUT  Orwell cautioned that political discourse is contrived "to render
     falsehoods palatable and killing appear honourable," and you can extend
     that caution to how today's governments cloak their battlefield actions
     in verbiage.
```

Orwell did not write that. The essay now says he did.

**A block quote — no quote marks anywhere, just an indent — was rewritten
30 times out of 30, both models, zero exceptions:**

```
IN       The market did not fail. The market did exactly what an unregulated
         market does, and the people who designed it knew that when they built it.

OUT      The market wasn't flawed—it performed precisely as an unchecked market
         would, and its architects understood this from the outset.
```

The indentation came back perfectly in 40 of 40 runs, so it still **looks** like
a correctly handled block quote.

**`[sic]` ends up on a word the source never wrote.** `[sic]` is a claim about
somebody else's document — it means "they really did spell it that way". The
rewrite corrects the spelling and leaves the mark behind:

```
IN   their reccomendation [sic] was drafted before the evidence was heard
OUT  their verdict [sic] was composed prior to evidence being presented
```

Also seen: `advice [sic]`, `suggestion [sic]`, `proposal [sic]`, `conclusion
[sic]`. The misspelling survived **2 of 10** runs on each model.

| Defect | small | medium |
|---|---|---|
| Quotation reworded, still in quote marks | **155/225 quotations** | **162/205** |
| Block quote rewritten | 15/15 runs | 15/15 |
| `[sic]` left on a substituted word | 6/10 | 7/10 |
| Markdown asterisks added around a quote | 0/135 | **54/115** |
| Quotation marks dropped entirely | 5/30 | **10/10** |
| One quotation split into two | 2/20 | 12/20 |
| Speaker's name dropped | 1/31 | 0/10 |

**A note on one number.** The probe's structured summary reports the
per-**run** rate as 113 of 135 and 110 of 115; its evidence file reports the
per-**quotation** rate as 155 of 225 and 162 of 205. The verifier flagged the
discrepancy. The per-quotation figures are the ones with the file behind them
and are what I have used.

## 4.2 Numbers, dates and units — 299 runs

**The fact guard exists to stop this and it is blind by construction.** It
compares *values*, so as long as the number 60 is still somewhere in the
paragraph it is satisfied — even if the unit changed.

```
IN   The mill ran for sixty years before the family sold it, and the cottages
     beside it stood for eighty years more.

OUT  For **sixty** decades, the mill remained under the family's control until
     its sale, while the adjacent cottages endured another **eighty** years
     beyond that.
```

**Sixty decades is six hundred years.** `mistral-medium` did this **10 times out
of 10**, in one model call, with no retry and nothing flagged. On
`mistral-small` the same sentence failed the other way — "six decades" — which
rule 5a forbids **using this exact example by name**.

Worse, in one paragraph of survey statistics: **"Only 8 of the councils
replied" came back as "All eighteen districts answered the survey."** The
meaning is reversed.

| Defect | small | medium |
|---|---|---|
| Quantity restated in a coarser unit | 8/10 | **10/10** |
| A number that was never in the document appears | 19/149 | 23/149 |
| A year spelled out against rule 5a | 9/10 | 0/10 |
| `3rd` became `third` | 8/10 | **10/10** |
| Clock format converted | 0/10 | 8/10 |
| Roman numerals turned into prose | 0/10 | **10/10** |

**Four separate bugs in the engine's number reader were found by running it, not
by reading it:**

```
_numbers('[1,3-5]')                      -> ['13', '5']      WRONG
_numbers('[1, 3-5]')                     -> ['1','3','5']    right
_numbers('p = .015')                     -> ['15']           WRONG
_numbers('p = 0.015')                    -> ['0.015']        right
_numbers('twelve districts and eleven days') -> ['11','12']  reads WORDS as values
```

A cosmetic space after a comma changes what the guard believes, and can burn
eight paid retries on text that was correct.

## 4.3 Citations and references — 296 runs

**The rewrite invents sources.** Page numbers, volumes and issues stay correct,
so the list still looks right, and every source in it now leads nowhere.

```
IN   Smith, J. A., & Jones, R. B. (2019). Later start times and adolescent
     attendance. Journal of School Health, 89(4), 331-339.
     Harrison, M. (2020). The sleeping campus. Princeton University Press.
     Okonkwo, A. (2021). Sleep debt in rural districts. Sleep Research
     Quarterly, 12(2), 88-104.

OUT  Díaz, C., & Gómez, H. (2019). Delayed opening and pupil turnout.
     Journal of Learning Sciences, 89(4), 331-339.
     Kaufmann, P. (2020). The evening university. Harvard University Press.
     Eze, C. (2021). Deprivation of sleep in countryside institutions.
     Sleep Science Digest, 12(2), 88-104.
```

**23 of 41 runs on `mistral-small`.** Every author, every journal, every
publisher replaced. `mistral-medium` did this 0 of 41 times — but rewrote every
article title 41 of 41.

**And a quotation with a page citation attached:**

```
IN   As Smith (2019) puts it, "the change in start time did more for attendance
     than any intervention we had previously funded" (p. 47).

OUT  Smith (2019) describes the early timetable adjustment as "the most
     effective step we have ever financed to lift turnout" (p. 47).
```

The page number is still 47. A marker who opens page 47 finds a sentence that is
not there. **9 of 10 on small, 10 of 10 on medium.**

## 4.4 Proper nouns and names — 300 runs

**Rule 1 promises names survive character-for-character. Nothing in the engine
ever checks a name.**

```
IN   Uppsala University in Sweden asks for a language certificate...
     Chulalongkorn University in Thailand is the cheapest of the four.

OUT  Sweden's Uppsala Universitet mandates a language credential...
     Thailand's Chulalongkorn University carries both the lowest price tag...
```

`Uppsala University` was translated into Swedish inside an English essay in
**18 of 30 runs** on `mistral-small`. In another run `Chulalongkorn University`
became `Chulalongkorn Institution`.

**The worst single run in the whole workflow, and it scored perfectly.** A case
study about four named companies came back naming none of them: McDonald's
became "A global fast-food giant", eBay "An online marketplace", IKEA "A
furniture retailer", Procter & Gamble "A consumer goods manufacturer". **That
run scored 0.000 trigram overlap — the best possible result on the product's own
success measure.**

**Why a general name guard was rejected**, on measurement rather than
preference: a capitalised-word detector was actually built and tested. It found
80 of 93 name spans, **missed the four most dangerous** — Reading, Bath, Nice,
Mobile, all sentence-initial — and picked up 13 spurious ones including "I",
"English" and "March". And in Russian, German, Arabic and Polish **a name is
required to change its ending to be grammatical**, so an exact-match guard would
fire constantly on correct text while missing the real substitutions.

## 4.5 Defined and technical terms — 261 runs

**No guard can see any of this, because no number and no name moved.**

```
IN   ...a 95 percent confidence interval that did not cross zero, which they
     treated as evidence that the effect was real...

OUT  ...the 95 percent confidence interval never included zero, a finding they
     interpreted as proof that the observed effect was genuine...
```

**Evidence and proof are not the same claim.** The rewritten essay asserts
something stronger than the student wrote. **10 of 11 runs on small, 8 of 10 on
medium.**

```
IN   In a criminal trial the prosecution must prove every element of the offence
     beyond a reasonable doubt...

OUT  ...prosecutors carry the burden to conclusively demonstrate every
     constituent part of the crime with absolute certainty...
```

**"With absolute certainty" is not the criminal standard — it is specifically
not the criminal standard.** "Beyond a reasonable doubt" survived verbatim in
**1 of 40 runs**. Other failures: "to a standard of reasonable doubt" and "the
stringent standard of reasonable doubt" (both the opposite of the rule), "the
probable-cause threshold" (a US arrest standard, not a burden of proof), and
"the probability majority" (not a thing).

`in vitro` was dropped in 17 of 20 and 20 of 20. `type 2` was dropped from a
diabetes diagnosis in 15 of 20 runs on small.

## 4.6 Code, identifiers and filenames — 298 runs

**A blank line inside a code block counts as a paragraph break**, so the chunk
planner cuts the block in half and sends the two halves to two different model
calls. Neither sees the whole snippet. One holds an opening fence never closed;
the other a closing fence never opened.

On `mistral-medium` the orphaned half tripped the leak guard on all eight
retries and **the whole job failed in 3 of 5 runs** — the customer is refunded
after paying for nine or more model calls. The runs that did return had the code
moved out of the block into the prose:

```
IN   for row in rows:
         totals[row.key] = totals.get(row.key, 0) + row.amount
     print(totals)
     ```
     Those seven lines are the whole of the hot path...

OUT  Here's the rewritten version:
     ---
     That snippet—just those seven lines—represents the entire
     performance-critical section...
```

**The code is simply gone.** Variable names inside surviving code blocks were
changed in **31 of 55 runs** on medium. One run in 55 on each model came back as
Python that will not start.

## 4.7 Lists, headings and structure — 300 runs

**Not one of 90 runs on `mistral-medium` returned all its headings unchanged.**

```
IN   Introduction / Sources / Method / Conclusion
OUT  **Overview** / **Materials** / **Approach** / **Final Assessment**
```

A marker grading against a required structure now sees different sections.
`Sources` also became "References Used" and "Where the Data Comes From";
`Introduction` became "A New Force in the Fields".

**The engine reports the layout as perfectly preserved**, because the only
structural check it performs is counting blank-line-separated blocks. On
`mistral-medium` the line `CHAPTER THREE:` was **deleted outright 10 times out
of 10**.

**The good news, and it is real:** list items themselves — their text, their
count and their order — survived everything measured. That is a genuine
zero-finding.

## 4.8 URLs, emails and handles — 290 runs

**Mostly fine, with one rare and severe failure.** Addresses survived
character-for-character in **858 of 860 chances**. But once in 145 runs:

```
IN   [Watermarking and Detection in Large Language Models]
     (https://arxiv.example.org/abs/2401.09876)

OUT  *Watermarking and Detection in Large Language Models*
     (available at 2401.09876.example.org)
```

**That address does not exist.** It sits in the bibliography where the real one
was, and the length guard, the fact guard and the leak guard all passed it.

On `mistral-medium`, **57 of 145 runs** jammed a link into the next word or
wrapped it in formatting the customer never typed.

## 4.9 Non-English and mixed-language text — 430 runs

**Nobody had ever tested this, and it is the second-worst thing found.**

The engine cuts anything over ~350 words into chunks and sends each as a
**separate model call with no knowledge of the others**, so each chunk decides
its own language independently:

```
IN   Le financement constitue le second axe de la controverse...
     La sélection à l'entrée reste le point le plus inflammable de tout le dossier.

OUT  Le financement représente le deuxième champ de friction...
     The entrance criteria remain the most contentious aspect of the entire matter.
```

**The seam falls exactly on the chunk boundary.** An 898-word French essay came
back part-French, part-English in **16 of 20 runs** on `mistral-small`. Every one
was reported as a success.

**Three languages are silently refused today.** Every word count in the engine
counts spaces, so a 101-character Japanese paragraph and a 163-character Thai
paragraph both count as **"1 word"** and fall under the 16-word floor — the
rewrite is skipped and the customer is not told why. Chinese, Japanese and Thai.

**And the product's own success metric is invalid on non-Latin script, in both
directions.** `trigram_overlap` tokenises with `[A-Za-z0-9']+`, which matches no
Cyrillic, Arabic, Devanagari or CJK character at all. On the same 831-word
Russian essay it reports **0.700** — which reads as "barely rewritten" — while a
script-aware measure of the same runs reports **0.043**. On Hindi it reports a
flat **1.000**. On Arabic it reports **0.000**, a perfect score. **Any tuning
done against this metric on non-Latin text is tuning against noise.**

## 4.10 Titles of works — 300 runs

**Mostly safe, with one fabrication.** Title *words* almost never changed. But
on bare titles — no italics, no quote marks — the rewrite attaches an author the
student never wrote:

```
IN   I also used Guns, Germs, and Steel: The Fates of Human Societies...

OUT  Isaac Asimov's Guns, Germs, and Steel: The Fates of Human Societies also
     proved invaluable...
```

**Isaac Asimov did not write it. Jared Diamond did.** 10 of 168 runs on
`mistral-small`, **0 of 130 on `mistral-medium`**. It fired on bare titles 10 of
10 and on already-quoted or italicised titles 0 of 60 — so the customer's own
formatting is what protects them.

On `mistral-medium`, **106 of 130 runs** wrapped titles in markdown asterisks
the student never typed.

## 4.11 Equations and mathematical notation — 540 runs

**A whole display equation is deleted from the document.** Not reworded —
deleted — whenever it is the last paragraph of a chunk. **14 runs out of 30.**

The surrounding prose still refers to it: the delivered document says "equation
(3) gives a projected population of about 5700" and contains no equation (3).

**It is the chunk edge, not the document length.** A control with the identical
458 words and the identical chunk split, but the equation moved to the middle of
a chunk, dropped the rate from **14/30 to 1/30**.

Nothing flags it: the document is still 84–97% of its original length, and every
number in the equation is a single digit, which the fact guard discards.

The square root sign was lost in 12 of 30 and 13 of 30. Inequality symbols were
replaced by words 10 of 10 on medium. A slash fraction failed to come back as a
fraction 20 of 20 on small.

## 4.12 Tables and tabular text — 300 runs

**A whole table is one paragraph to this engine**, so every structural check it
has is blind to a table falling apart.

When the document is long enough to be chunked and the rows have blank lines
between them — which is what pasting out of a PDF or a Word table produces — the
boundary cuts through the table. The second half arrives as bare rows with no
headings, so **the model invents a heading row and puts it inside the table**:

```
IN   | Cohort | Institutions | Invited | Completed | Response rate | ...
     | One    | 1            | 2400    | 311       | 13.0 percent  | ...
     | Two    | 4            | 3150    | 892       | 28.3 percent  | ...

OUT  | Cluster | Schools | Contacted | Returned | Acceptance rate | ...
     | 1       | 1       | 2400      | 311      | thirteen percent | ...
     | Group   | Quantity| Total     | Invitees | Conversion Rate | ...   <-- INVENTED
     | First   | 4       | 3150      | 892      | 28.3 percent    | ...
```

**The invented names are wrong and reversed** — the real column 3 is `Invited`
and column 4 is `Completed`; the invented heading calls them `Total` and
`Invitees`. On `mistral-medium` the invented heading read **"Positive Cases |
Detection Rate"** on a survey response table, so from row two onward the
student's table claims to be a diagnostic test.

**7 of 10 runs on small, 4 of 10 on medium.** Every figure intact. Nothing
flagged.

A CSV header row was deleted 10 of 10 times on small. CSV quoting was destroyed
10 of 10 on both.

---

# 5. WHAT WAS MEASURED AND FOUND FINE

A category with nothing wrong in it is a real finding, and this is where **not**
to spend effort.

- **List items** — text, count and order survived everything run against them.
- **Web and email addresses themselves** — 858 of 860 exact.
- **Numbers inside quotations** — 55 of 55 correct.
- **Speaker names** — 190 of 190 correct.
- **Paragraph count** — 249 of 250 correct.
- **Block-quote indentation** — 40 of 40 correct.
- **Titles already in quotes or italics** — 0 of 60 given a fabricated author.
- **The prompt-leak guard from session W8** — held throughout. Not one of the
  3,865 runs disclosed any part of the prompt.

---

# 6. THE TWO MODELS FAIL AT DIFFERENT THINGS

**This is the finding that stops "just switch to medium" being an answer.**

| | `mistral-small` | `mistral-medium` |
|---|---|---|
| Facts and units | **worse** | better |
| Names and institutions | **worse** | better |
| Terms of art | **worse** | better |
| Language flips | **worse** (15/70) | better (0/70) |
| Invented sources | **worse** (23/41) | better (0/41) |
| Headings | better (70/90) | **worse (90/90)** |
| Deleting a heading line | 0/10 | **worse (10/10)** |
| Table row labels | better (54/160) | **worse (77/140)** |
| Dropping quotation marks | better (5/30) | **worse (10/10)** |
| Roman numerals | 0/10 | **worse (10/10)** |
| Markdown injected | ~zero | **worse (35%–100%)** |

**Small breaks facts and names. Medium breaks form and labels.** Switching to
medium fixes about half this report and makes the other half worse.

Medium also owns the two most dangerous single results measured: **"sixty years"
→ "sixty decades"** (10/10), and a Russian shipping canal becoming a city
(12/20 against 0/20 on small).

---

# 7. THE MASKING BET, MEASURED

Jon's bet was **protected spans: detect, mask before the rewrite, restore after
— rather than more prompt instructions**, because masking is deterministic and a
prompt instruction is best effort. A dedicated agent built a prototype and ran
it against the real gateway to settle the empirical half.

## It works mechanically

```
masks intact                  1,543 of 1,560
masks dropped                 0
recovered by a tolerant restore   1,560 of 1,560
                              (226 runs, 5 documents, both models)
```

## And you cannot prompt your way there instead

48 gateway runs compared the committed prompt against one rewritten to tell the
model in terms to rewrite the words around every placeholder:

```
mistral-medium   0.2183  vs  0.2208      no difference
mistral-small    0.2412  vs  0.2412      no difference at all
```

**Jon's bet is correct and W8's lesson holds: the model ignores an instruction
until something enforces it. Nobody should spend a session tuning the prompt.**

## What it costs, and this is the hard part

```
A 541-word essay, one fifth quotation and reference list, 8 runs a cell:
                          today    structure tier   both tiers
  mistral-small           0.1499       0.1661          0.2289
  mistral-medium          0.1517       0.1679          0.2316
                                       +0.016          +0.079

A 2,172-word essay, 8 chunks, 6 runs a cell:
  mistral-small           0.0630  ->   0.0805          +0.0175
  mistral-medium          0.0495  ->   0.0659          +0.0164
```

**In plain English:** on a 2,000-word essay, protection moves the document from
about 5% of its three-word runs surviving to about 7%. On a short essay that is
one fifth quotation, from about 15% to 23%.

**Spans returned exactly went from 42 of 64 to 64 of 64 on both models.**

## The uncomfortable result, reported against the recommendation

**The model does not become gentler on the rest of the document — it becomes
slightly harder on it, and it clings *more* to the wording either side of a
frozen span.** Measured 6 times out of 6 by one agent, twice by another, 3 of 4
by a third:

```
the wording touching a frozen span:  0.1369 -> 0.1905
                                     0.1488 -> 0.1726
                                     0.1083 -> 0.1333
```

**So the whole cost of the protection is the frozen words themselves. The only
way to spend less is to freeze less.** An optimistic earlier estimate that
masking would pay for itself is refuted and must not be quoted.

## And the honest cost nobody can price

**If the AI wrote the quotation too, freezing it protects machine-written text
from the rewrite that exists to change it.** Nobody can measure how big that is,
because nobody can measure whether a statistical watermark was removed. It is
the real trade and it should be stated rather than hidden.

---

# 8. THE PLAN: FOUR LANES, CHEAPEST FIRST

Four designs were built independently and judged on three lenses — correctness,
cost in aggressiveness, and provability. **Correctness and cost both chose the
narrow-freeze design; provability chose the full protected-spans design.** The
synthesis takes the narrow freeze's rules and builds them on the other's
machinery.

**PHASE 0 — the safety net, before any other code.** `engine/tests/test_spans.py`:
take every test document, split it and put it back together **with no model
involved**, and assert it is byte-identical. One agent's version passes 52 of 52
and it caught a failure a substring count cannot see — its own variant reported
"64 of 64 block quotes returned" while four of them sat un-indented at the end
of the document.

**PHASE 1 — REPAIR. Free, and it fixes the AI tell this product exists to
remove.** A new file that strips the markdown the customer never typed, puts
back their own straight apostrophes and hyphens, and puts the digits back where
the model spelled a year out against the engine's own rule 5a. No detector, no
masking, no model call. Re-measured over 228 real stored outputs:

```
curly apostrophe   819 -> 0        markdown asterisk  644 -> 0
curly quote         98 -> 0        em dash            359 -> 0
214 of 228 outputs carried at least one; 0 residual
cost in trigram overlap: median +0.0000, mean +0.0016, max +0.0167
```

**A tool that removes AI watermarks and then inserts 359 em dashes into
documents that had none is undoing its own job.**

**PHASE 2 — REPORT. Free, changes no output.** Ship the detector and five
deterministic checks with the freeze **off** and nothing raising. It costs no
model calls, and it measures for the first time **how often a real customer's
quotation is being rewritten** — every number in this entire workflow comes from
documents the agents wrote themselves. Add the pre-flight that tells the visitor
what fraction of *their* document would be frozen, before they pay.

**PHASE 3 — FIX. Six things that are provably wrong today**, all deterministic,
all reproduced against the committed engine:

- Move the invisible-character pass **before** the rewrite in `server.py`, so
  layer A reports on what the customer actually sent. **Today the rewrite runs
  first and destroys zero-width characters as collateral**, so layer A reports
  removing nothing from a document that arrived carrying two. Verified both ways.
- Count words in a way that works in Chinese, Japanese and Thai.
- Fix the four number-reader bugs in section 4.2.
- Never end a chunk on a lone equation, table or placeholder. **This one change
  took a real 693-word lab report from 9.0 model calls to 2.0, from $0.004670 to
  $0.001808 per run — 61% cheaper — and job failures from 2 of 8 to 0 of 8.**
- Stitch a torn code fence back together before anything looks at it.
- Bound every new retry at one. Eight retries against one returned the identical
  80 of 80 spans for 82% more calls, 76% more money, and a **less** rewritten
  document.

**PHASE 4 — FREEZE. Its own session, and see section 9 first.** The masking
machinery: tolerant single-pass restore, mask numbers chosen by asking the
engine's own number reader rather than searching for digits, a verify step,
masking per chunk rather than per document, and a per-chunk fallback.

**The defect the design panel found in its own winner.** Both masking proposals
say to put the customer's real text back before the engine's existing guards
run. But those guards are handed **the masked chunk**. Run against the committed
code:

```
a flawless rewrite ->  FactsLost: "chunk 1 dropped 1 numbers: ['46']"
                       (it is complaining about the mask number itself)

a mask-heavy chunk ->  LeakSuspected: "came back at 73 words from 17
                       (4.3x the original)"
                       -> retries, then FAILS THE JOB AND REFUNDS
                          a customer whose rewrite was perfect
```

**That is the W8 mistake exactly** — a guard that fires on good work. One line
fixes it, and it had to be written down because as specified it fires on every
good masked run.

---

# 9. WHAT THE ADVERSARIAL VERIFIER BROKE

**Phase 4 must not ship on the numbers the plan published.** A final agent spent
48 gateway runs trying to break the plan and found a false positive bad enough
to destroy a document.

## The "Sources" latch

The detector treats any line reading **Sources**, **References**, **Bibliography**
or **Works cited** as the start of a reference list — **and never stops.** From
that line to the end of the document, every paragraph of five words or more is
frozen as a bibliography entry.

A 221-word history essay whose only unusual feature is a section headed
"Sources" containing **ordinary analytical prose**:

```
the rejected design A     2.3% of words frozen
the rejected design B     0.0%
the RECOMMENDED design   56.1%   trigram floor 0.6475
```

**Through the real gateway, 12 runs a model:**

- `mistral-small`: **12 of 12** delivered the essay at **0.55 to 0.58** overlap.
  Today's engine on the same document returns 0.059 to 0.091. **The student paid
  for a rewrite and got their own essay back.**
- `mistral-medium`: **6 of 12 runs deleted every mask** and the engine reported
  `ok=True`, `structure_kept=True`, `figures_to_check=[]`. One delivered
  document, in full:

```
10

[two rewritten paragraphs]

11

12

13

14
```

**The back half of the essay replaced by five bare numbers.** The model stripped
the brackets off `[[HEADING10]]`, and the restore is deliberately unable to
touch a bare number.

**Rewording the heading to "My sources" drops it to 0.0%**, which is the tell
that this is a latch and not a judgement. **The fix is small:** require a
reference entry to actually look like one — a year in brackets, a page range, a
DOI — and stop at the first paragraph that does not.

## Three published numbers that do not hold

1. **The headline cost figures were a subtraction across two different
   documents.** The baseline was measured on the essay with the quotation taken
   out; the freeze arms on the essay with it in. Proved arithmetically, no model
   involved. The verifier re-ran the missing baseline: **the true cost is
   slightly lower** (+0.0162 and +0.0790) and the recommendation survives, but
   the four published numbers must be replaced with the ones in section 7.
2. **"Spans came back character-for-character" is a substring test**, not a
   byte-identity test. It proves the words appear somewhere, not that they
   appear once, in the right place, with the right indentation. The plan
   rejected another design for exactly this and then promoted its own substring
   count to the top of its list of facts. The numbers happen to agree on
   re-check; the standard does not.
3. **Two masks were lost in 88 runs, not one**, and the second was on the cheap
   model — a citation deleted, leaving a bogus `[13]` in the delivered essay,
   with `ok=True` and nothing flagged.

## What held

Every deterministic claim the verifier re-ran reproduced exactly: the guard
ordering defect, all four number-reader bugs, the layer A ordering evidence, the
Japanese and Thai word counts, `structure_kept` being read by nothing, and the
repair lane's character counts to the sixth decimal. **All twelve probe files
paste real input and real output with per-model denominators.**

And: **"the provability line is drawn correctly and I tried hard to break it."**
Nothing in the plan claims the statistical watermark is removed.

---

# 10. WHAT BECOMES PROVABLE, AND WHAT DOES NOT

**This is the strategic result and it needs stating precisely, because getting it
wrong is how this project becomes dishonest.**

**Becomes a countable fact:**

1. *"This exact span is byte-identical to what you sent."* A mask came back or it
   did not. Countable, repeatable — **once the check is byte-identity rather than
   a substring test**, per section 9.
2. *"These characters were not in your document and they are gone."* 2,019
   injected characters removed across 228 real outputs, 0 residual.
3. *"Layer A found and removed two invisible characters."* Today this sentence is
   **false** for the whole document, because the rewrite runs first and destroys
   them. Moving one call repairs the evidence for the one layer this project is
   permitted to call a fact.

**Stays best effort, and must never be reported otherwise:** whether a
statistical watermark was removed. Nothing in this plan touches it. **Every
number in this document measures how much of the original phrasing came back. A
document at 0.07 trigram overlap is a document whose wording changed a great
deal. It is not a document proven clean.**

**What the site may say:** "your quotation came back exactly as you sent it, and
here is the count." **What it may not say:** "layer B is now verifiable."

---

# 11. WHAT NEEDS JON'S RULING

**1. Ship the quotation tier at all, or only the cheap structure tier?**
Structure alone costs +0.016. Adding quotations takes it to +0.079.
**My recommendation: ship both.** The question is not four cents per thousand
words; it is whether the product is willing to put invented words in a named
person's mouth.

**2. A quoted run with no attribution cue — freeze it or leave it?**
**Recommendation: leave it free.** Being wrong one way costs one essay three
reworded phrases. Being wrong the other hands a student their own short story
back 59% unchanged after they paid for a rewrite. Those are not the same size.

**3. When the freeze fails, refund or hand back that chunk unrewritten?**
**`docs/04-decision-log.md` entry 22 says a failed rewrite refunds, and that
entry governs — I am naming it rather than resolving it quietly** (CLAUDE.md
section 2). **My recommendation: hand back the one failing chunk and say so**,
because the customer still receives layer A and the metadata pass, which are the
two provable layers. That changes entry 22 and needs a line in the decision log
either way.

**4. Tell the visitor what fraction of their document will be frozen, before
they pay?** **Recommendation: yes** — it costs nothing and no model call.
**But not in the words the plan proposed.** "About a third of this document is
quoted from other sources" would have said 56% about an essay containing no
quotation at all. Say only what the program knows: *"We will return about 56% of
this document exactly as you sent it, and rewrite the rest."*

**5. Which model does the site run?** **Recommendation: `mistral-medium`, after
this plan ships and not before.** Everything medium is worse at — headings,
labels, markdown, form — is exactly what phases 1 and 4 fix deterministically.
Everything small is worse at — facts, names, terms, language flips, invented
sources — is what this plan leaves broken. **The plan changes which model is the
right one, so do not decide until it has shipped.**

---

# 12. WHAT WAS NOT DONE

**Stated plainly, because a step skipped is a step failed.**

- **Nothing was implemented.** Design and evidence only, per the brief. No engine
  file was modified; the engine hashes are unchanged.
- **Nothing was deployed and nothing was pushed.**
- **Nothing ran on production.** Every run used the engine's real code and the
  real gateway from this machine, not the deployed function or the site's route.
- **No file went through the upload path.** Only pasted text. Whether stripped
  markdown arrives in Word as literal asterisks is unknown.
- **Nothing ran past 2,172 words or 8 chunks**, while `engine-limits.md` records
  a 10,464-word document as **34 chunks**. Mask loss at that size is unknown and
  **must not be assumed to scale linearly** — the verifier measured 50% mask loss
  at 221 words and one chunk, so it looks like a function of how many masks sit
  alone as whole paragraphs, not of document size.
- **Five of the ten protection claims are single-model** (`mistral-medium` only):
  headings, reference entries, tables, and the chunk-plan job-failure fix. The
  brief asked for both models on every rate and these fell short.
- **Rank 2's actual fix is not in the plan** — only the report. "Sixty years" to
  "sixty decades" still passes the fact guard afterwards.
- **The Latin and legal terms list is asserted twice and specified nowhere.** An
  implementer following the steps will not build it.
- **I did not write to `04-decision-log.md`, `06-assumptions-and-open-questions.md`
  or `07-runbook.md`.** CLAUDE.md section 6 asks for that; **the brief restricted
  this workflow to this one file and Jon's instruction ranks first.** Section 11's
  rulings belong in 04 once decided, and two operational facts belong in 07: the
  engine's cost meter is correct (every campaign matched the gateway to the
  seventh decimal), and `trigram_overlap` is invalid on non-Latin script.

---

# 13. WHAT IT COST

```
AI Gateway balance at start   $14.06515638      2026-08-23T01:45:45Z
AI Gateway balance at end     $ 7.57668008      2026-08-23T21:44:22Z
                              -------------
SPENT                         $ 6.48847630
```

24 agents, 6 phases, roughly 3,865 probe runs plus the design, measurement and
verification campaigns. **The brief budgeted $0.50 to $1 and Jon lifted the cap
mid-run to "up to the $12 remaining".** The overrun is real and its cause is
structural: the four designers each built and measured their own prototype
before I moved the measurement agents ahead of them, so the same masking
question was priced four times over.

The workflow stalled three times on session usage limits, not on credits. Each
resume replayed completed agents from cache at no cost.

**The engine's own cost meter is correct.** Five earlier files recorded the
gateway billing 2× to 7× what the engine reported and none could attribute it.
Every campaign here ran with nobody else on the key and matched to the seventh
decimal. That belongs in the runbook.
