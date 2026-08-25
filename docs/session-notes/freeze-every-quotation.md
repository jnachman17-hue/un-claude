# Freeze every quotation, and the citation beside it

**24 August 2026.** Jon's ruling: any quotation freezes, with no attempt to
tell a sourced quotation from invented dialogue, and the citations around it
freeze with it. Brief: `docs/briefs/freeze-every-quotation.md`.

```
AI Gateway total_used at start   $10.0059341268   2026-08-24T22:29:18Z
AI Gateway total_used at end     $10.3908069868   2026-08-25T01:00:08Z
SPENT THIS SESSION               $ 0.3848728600   (the $2.00 stop rule never
                                                   came close; 63 ladder runs)
engine suite                     842 passed, 1 skipped   (baseline 809 + 1)
Pushed or deployed BY THIS SESSION   NOTHING
```

**`balance` is not headroom — the cap is on the KEY and the credits endpoint
does not show it.** That is what stopped E-16. **The cap has been raised:**
a one-token probe returned HTTP 200 at 22:29 UTC, so layer B is serving again.

```
{"balance":"14.9940658732","total_used":"10.0059341268"}   HTTP 200 on mistral-small
```

---

# JOB 1 — every quotation freezes

**Done. The attribution machinery is deleted, not narrowed.**

## 1.1 What was removed

From `uc_spans.py`: `_ATTRIBUTION` (the reportive-verb list), `_quote_attributed`,
`_subject_before`, `_PRONOUN_SUBJECTS`, `_SUBJECT_SKIP`, `_SUBJECT_WORD`,
`_CUE_WINDOW`, `_SENTENCE_END`, and the `attributed` field on every span.
From `uc_freeze.plan_freeze`: the two lines that skipped an unattributed quote.
`_CITATION` stays — job 2 needs it, for a different purpose.

## 1.2 The result matches the conductor's predicted table exactly

Measured on the shipping code, not a simulation:

```
document          words   frozen NOW   conductor said   match
------------------------------------------------------------
ladder_500          463        27.4%           27.4%     yes
ladder_1000         919        28.8%           28.8%     yes
ladder_2000        1942        25.1%           25.1%     yes
ladder_3000        2971        25.2%           25.2%     yes
ladder_5000        4958        24.1%           24.1%     yes
ladder_10000       9946        23.2%           23.2%     yes
dialogue story       61        63.9%      (was 0.0%)
```

## 1.3 One decision the brief left open: block quotes

**§3 says "headings, block quotes and reference entries already freeze.
Untouched." Today a block quote freezes only if the line introducing it ends
in a colon or carries a reportive verb. I removed that test too, so every
block quote freezes.** Three reasons, and the third is the decisive one:

1. **Jon's words are "any quotation".** Indenting a paragraph *is* the
   typographic statement that it is quoted material.
2. **The colon test is the same species of guess the ruling abolishes** — it
   decides from the introduction whether indented text is a quotation.
3. **Keeping it would keep `_quote_attributed` alive**, and with it the whole
   apparatus the brief says the prize is deleting. "A deleted code path cannot
   harbour a fourth [silent bug]" is not true of a path that survives for one
   caller.

**The conductor's table cannot settle this**, because every block quote in the
ladder corpus is colon-introduced — readings (b) and (c) are identical on it.
So I measured a document that discriminates:

```
document                                          today   all-freeze
block quote, colon lead-in (attributed today)     45.9%      45.9%
block quote, NO lead-in (free today)               4.6%      36.9%
indented text that is NOT a quotation (address)    2.2%      24.4%
```

**The price, stated plainly: indented text that is not a quotation now freezes
— an address block, a poem, unfenced code.** That is the honest cost of taking
indentation at its word, and D4's pre-flight shows the customer the number
before they pay. **If Jon wants block quotes to keep the colon test, it is a
two-line change and this paragraph is the argument against it.**

## 1.4 `quotes_attributed` — removed, not renamed

`check_protected_spans` returned `quotes_attributed` and `quotes_unattributed`.
**Both are gone.** The brief says not to leave a field whose name claims a
distinction the engine no longer makes — and renaming it to `quotes` would
have duplicated a count that `spans_found["quote"]` already carries, which is
where every other kind's count already lived. **Nothing outside the engine
ever read either field** (checked across `apps/web/app` and `apps/web/lib`:
no hits). `API.md` updated.

## 1.5 The pre-flight still equals what the rewrite delivers

**Proved, not asserted** — `engine/lab/preflight_equals_delivered.py` counts
the words the masker actually replaced from inside `rewrite_long`, and
compares them to the number D4 shows a visitor. No model involved:

```
document            words  pre-flight  delivered   spans  agree
---------------------------------------------------------------
ladder_1000           919         265        265      13    yes
ladder_10000         9946        2305       2305     101    yes
ladder_2000          1942         488        488      24    yes
ladder_3000          2971         748        748      35    yes
ladder_500            463         127        127       7    yes
ladder_5000          4958        1195       1195      54    yes
ladder_7500          7498        1776       1776      78    yes
prose_2500           2478           0          0       0    yes
doc_1000 … doc_5000                 0          0       0    yes

DISAGREEMENTS: 0
```

It also asserts the reassembled document is byte-identical to the source, on
every corpus document, with the freeze on.

## 1.6 Every test I changed, named and justified

**`engine/tests/test_spans_fiction_corpus.py` — inverted, not deleted.** The
same 49 fiction lines that proved the old rule broken now prove the new rule
whole: `test_every_fiction_dialogue_line_freezes_its_quotation`.

- **`test_every_attribution_verb_has_a_fiction_line` (E-16's lock) is
  replaced.** It read `uc_spans._ATTRIBUTION` and required a dialogue line per
  verb; a lock tied to a deleted constant protects nothing. **The new lock is
  `test_the_surrounding_words_never_decide`: one quotation placed in fourteen
  surroundings** — pronoun and named and common-noun subjects, tag leading and
  trailing, inverted, narrative tag, published source, institution, citation
  before and after, colon lead-in, mid-sentence, and no cue at all — **and it
  requires the identical answer from all fourteen.** Any future change that
  reads the context and decides fails it, whatever mechanism it uses.
- **`test_the_detector_no_longer_reports_an_attributed_field`** is the
  structural half: while the field exists, something downstream can start
  honouring it again and no behavioural test would notice.
- `test_the_same_story_freezes_the_same_however_the_author_tags_dialogue` is
  **kept and strengthened**. It used to pass by freezing nothing in both
  stories; it now passes by freezing the same five quotations in both.
- `test_a_short_scare_quote_is_still_not_a_quotation` is **new**, pinning the
  12-character floor the brief told me not to move.

**`engine/tests/test_spans_detector.py` — six tests inverted.** Each keeps its
original subject (is this shape *detected*) and its attribution assertion
becomes the ruling's: it freezes.
`test_curly_quotes_detected_too` gets its **original sentence back** — E-16
had to change the sentence's subject from "She noted" to "The registrar noted"
to keep the attribution assertion true, and there is no such assertion now.
`test_block_quote_attribution_follows_the_lead_in` becomes
`test_every_block_quote_freezes_introduced_or_not`.
`test_identity_output_returns_everything_verbatim` asserts
`spans_found["quote"] == 1` in place of `quotes_attributed == 1`.

**`engine/tests/test_freeze.py` — one test inverted, and it is the important
one.** `test_short_story_dialogue_is_never_frozen` was E-9's D2 demo and the
single test this project leaned on hardest. **It could never have failed:**
that story tags dialogue only with `said`/`asked`/`replied`, so it passed on
its own word choices rather than on the rule. It is now
`test_short_story_dialogue_freezes_like_any_other_quotation` and asserts all
four quotations freeze, by name rather than by count alone.

```
engine suite   810 passed, 1 skipped     (baseline 809 + 1)
```

---

# JOB 2 — the citation beside the quotation freezes with it

**Done.** A quotation's frozen span now covers the citation printed next to
it, on either side, including the whitespace and punctuation between them.

## 2.1 What the model used to be handed

This was the exposure, and it is exactly what the masker produced:

```
As Smith puts it, [[11]] (p. 47). The minutes were circulated the following week.
```

**The words were protected and the source beside them was not.** The model
could renumber the page, shift the year, or rename the author — and W10
measured invented authors in 23 of 41 runs on this model family. A rewritten
citation attached to a correctly preserved quotation is the worse half of two
errors: it reads as authoritative and it is wrong.

## 2.2 Every case the brief listed, run against the shipping code

```
citation AFTER            '"attendance rose in every quartile" (Smith, 2019, p. 47)'
citation BEFORE           '(2019): "the change did more for attendance than anything"'
bare page after           '"the change did more for attendance than anything" (p. 47)'
bare page, no bracket     '"the market did not fail at all" pp. 88-104'
period OUTSIDE bracket    '"the iron cage of rationality" (Weber, 1922)'
two quotes, one citation  '"the first of the two sayings" (Smith, 2019)'
  between them            '"the second of the two sayings" (Jones, 2020)'
NOT adjacent              (nothing frozen)
citation far from quote   '"attendance rose in every quartile"'
(1887) — the known bound  '"the long campaign in the south"'
quote inside a block quote → the whole block quote, citation included
```

## 2.3 The four decisions the brief asked me to make

**1. The citation before the quote — built.** Jon said "on either side", so
the search runs backwards too. Only whitespace and at most one colon or comma
may stand between them, so «Smith (2019) argued at length that "…"» is *not*
adjacent and the prose between is not dragged in.

**2. A trailing sentence period outside the bracket — left FREE.** «"…"
(Weber, 1922).» freezes up to the closing bracket. A full stop carries no
source information, it belongs to the sentence rather than the citation, and
leaving it free lets the model punctuate its own sentence. Pinned in a test so
the decision is visible rather than accidental.

**3. A citation inside a block quote — already covered, nothing added.** The
whole indented paragraph is one frozen span, citation included, and the inline
quotation inside it is deduplicated away by `plan_freeze` because nested masks
corrupt the restore. Verified.

**4. A citation NOT adjacent to any quotation — deliberately NOT frozen.**
The brief is explicit that freezing every parenthetical year everywhere is a
bigger change than Jon asked for. It is not done, and a test asserts it.

## 2.4 A silent regression this feature nearly shipped with

**A citation standing between two quotations is adjacent to both.** The first
working version let both claim it, so the two spans overlapped — and
`plan_freeze` drops an overlapping span. **A dropped span is an unfrozen
quotation**, and nothing would have said so: the pre-flight would have counted
it, the customer would have paid for it, and the model would have rewritten it.
That is the same shape as the two silent defects E-16 found.

Caught while testing, before commit:

```
before   detected: ['"the first..." (Smith, 2019)', '(Smith, 2019) "the second..." (Jones, 2020)']
after    detected: ['"the first..." (Smith, 2019)', '"the second..." (Jones, 2020)']
```

A running high-water mark now gives the citation to the first quotation — a
trailing citation being the commoner academic shape — and
`test_a_citation_between_two_quotes_never_costs_the_second_one` locks it.

## 2.5 Two bounds I am reporting rather than widening

**`(1887)` is not recognised.** `_CITATION` matches only years beginning 19 or
20. **Widening it to any four digits would also catch page ranges, sums of
money, equation numbers and years in ordinary prose**, every one of which
would then drag the text beside it into the freeze — and it would do so
*adjacent to quotations*, which is where the damage lands. **My
recommendation: leave it.** Historical sources cited by year alone are rare
next to a quotation, and the failure is in the cheap direction (the citation
is rewritten, which is the status quo). If Jon wants 18th- and 19th-century
years, the safe widening is `(?:1[6-9]|20)\d\d` — still bounded, and it would
need its own measurement pass.

**An author name outside the brackets stays free.** «Smith (2019): "…"»
freezes `(2019): "…"` and leaves `Smith` loose, so the model may still rename
the author in that one shape. Extending backwards over a capitalised name is a
guess of exactly the kind this session just deleted — «He returned to Paris
(1919)» would freeze "Paris" — so I did not build it. **Hand-back for Jon:
this is the one remaining way a source name next to a quotation can change.**

## 2.6 Also fixed while here

`plan_freeze` used to rebuild a quotation's marks by adding 2 to the inner
length (`text[start: start + len(span["text"]) + 2]`). That is a second
opinion about a span's extent living in the file whose **first rule is that it
holds no detector of its own**, and it cannot express a citation. The detector
now hands back the whole frozen run with explicit offsets and `plan_freeze`
uses them.

```
engine suite   820 passed, 1 skipped     (job 1 left it at 810)
pre-flight vs delivered   DISAGREEMENTS: 0   (re-run after the change)
```

---

# JOB 4 — the "second" silent span shortfall was the first one

**There is no second defect. E-16 misread its own residual, and the arithmetic
proves it four times over.**

E-16 recorded that `ladder_3000` returned 87 of 90 spans in every run and
flagged it as a cause it had found but not chased. **It was the block quote
opening a chunk — the defect E-16 had already fixed.** What threw it off is
that the lab's span metric counts a span short whenever *any* instance of its
text was rewritten, and the ladder corpus repeats a template, so one orphaned
block quote with a twin elsewhere in the document counts as **two** spans
short. E-16 saw 4 orphans against 8 missing spans at 10,000 words and
reasonably concluded something else was also happening.

**Simulating the pre-E-16 containment rule and applying the duplicate
arithmetic reproduces every figure it recorded, exactly:**

```
document       orphans  w/ twin   predicted   E-16 saw  match
--------------------------------------------------------------
ladder_3000          1        0       29/30      29/30    yes
ladder_5000          2        0       43/45      43/45    yes
ladder_7500          3        2       59/64      59/64    yes
ladder_10000         4        4       75/83      75/83    yes
```

**And on the current engine there are no orphans anywhere** —
`engine/lab/orphan_spans.py`, no model involved:

```
document           chunks  planned  masked  ORPHANED
----------------------------------------------------
ladder_1000             3       13      13         0
ladder_10000           33      101     101         0
ladder_2000             7       24      24         0
ladder_3000            10       35      35         0
ladder_500              2        7       7         0
ladder_5000            17       54      54         0
ladder_7500            25       78      78         0
doc_1000 … prose_2500           0       0         0

TOTAL ORPHANED SPANS: 0
```

**So nothing was fixed, because nothing was broken.** What was added is the
guard that should have existed before either defect:
`engine/tests/test_freeze_no_orphan_spans.py` asserts **the invariant itself**
— every planned word reaches the masker — over documents that walk an indented
quotation across twelve paragraph positions, so it catches any future cause of
this class rather than the one shape already known. **It fails against the
pre-fix code** (positions 9 to 12, plus the pre-flight test) and passes with
it.

**One thing worth recording that the test surfaced.** When a block quote opens
a chunk, its frozen span is *clipped* — it starts at the first word, because
the first line's indentation belongs to the separator between chunks. The
indentation is restored at reassembly by the separator, not by the model, and
`out == doc` is asserted byte-for-byte on every one of those twelve documents.
**The model never sees those four spaces, so it cannot change them.** That is
correct, but it was not obvious, and my first version of the test asserted the
unclipped text and failed against working code.

```
engine suite   833 passed, 1 skipped
```

---

# JOB 3 — the hard-wrap gap. BUILT, after asking

**Gated on Jon and he approved it**, with the measured evidence in front of
him: the prototype recovered a wrapped document and moved nothing else in the
corpus, including a document built to trigger the runaway.

## 3.1 The gap

`uc_spans._QUOTE` forbade a newline inside a quotation, so **a hard-wrapped
document had no quotation protection at all, silently** — while the identical
text pasted from Word had full protection. un-claude accepts `.txt` uploads
and `.txt` is routinely wrapped.

## 3.2 What bounds the runaway, and it is four things

A pattern that crosses newlines can swallow paragraphs of prose the moment a
document contains one unbalanced quotation mark. **That is the Sources-latch
shape that nearly killed the freeze: 56.1% of a 221-word essay, 12 runs of
12.** So:

- **A blank line always ends a quotation.** A paragraph break is a hard stop,
  which is what keeps one stray mark from reaching the next stray mark
  wherever it is.
- **At most 8 line breaks** inside one quotation (`_MAX_WRAPPED_LINES`).
- **The 600-character ceiling stays**, and so does the 12-character floor that
  keeps a scare quote out.
- **Matching is non-greedy**, so a quotation ends at the first closing mark
  and never a later one.

**One subtlety worth recording.** The line cap is applied by *rescanning from
one character inside* a rejected run, not by skipping past its end — an
over-long run begins at a real quotation mark, and skipping past it would take
any genuine quotation starting inside it along with it. There is a test for
exactly that.

## 3.3 The result: wrapped and unwrapped now freeze identically

Whole corpus, `engine/lab/wrap_and_runaway.py`, no model:

```
document                    words  unwrapped   wrapped  longest span
--------------------------------------------------------------------
doc_1000                     1260       0.0%      0.0%           0 words
doc_2000                     2105       0.0%      0.0%           0 words
doc_3000                     3367       0.0%      0.0%           0 words
doc_5000                     5047       0.0%      0.0%           0 words
ladder_1000                   919      29.7%     29.7%          56 words
ladder_10000                 9946      23.9%     23.9%          57 words
ladder_2000                  1942      25.9%     25.9%          56 words
ladder_3000                  2971      26.0%     26.0%          56 words
ladder_500                    463      28.3%     28.3%          55 words
ladder_5000                  4958      24.8%     24.8%          57 words
ladder_7500                  7498      24.4%     24.4%          57 words
prose_2500                   2478       0.0%      0.0%           0 words
CITED sample                   70      48.6%     48.6%          20 words
UNBALANCED (adversarial)      114       2.6%      2.6%           3 words
MANY STRAYS (adversarial)     216       0.0%      0.0%           0 words

WORST ADVERSARIAL FROZEN FRACTION: 2.6%
(the Sources-latch failure this guards against was 56.1%)
```

**Every document now freezes the same amount wrapped as unwrapped** — the
column is identical top to bottom — **and the two adversarial documents did
not move at all.** The longest frozen span in the unbalanced document is 3
words.

## 3.4 One thing the measurement caught that the brief did not name

**A hard wrap breaks the citation too** — «(Smith, 2019, p.\n47)» — and job
2's citation pattern forbade a newline inside the brackets, so a wrapped
citation stopped attaching to its quotation even once the quotation itself was
found. That is why the CITED sample first came back at 42.9% rather than
48.6%. The citation's inner run now tolerates a single line break by the same
rule, with the same blank-line stop.

```
engine suite   842 passed, 1 skipped
pre-flight vs delivered   DISAGREEMENTS: 0
orphaned spans            0
```

---

# JOB 5 — the ladder, once, on the final engine

**63 runs, three models, seven rungs, n=3 everywhere. ZERO failures.** Run
after jobs 1 to 4 were committed, on one engine, so nothing here is mixed.

```
AI Gateway total_used at start   $10.0059368268   2026-08-24T22:55:48Z
AI Gateway total_used at end     $10.3908069868   2026-08-25T01:00:08Z
                                 ---------------
SPENT                            $ 0.3848701600
own accounting said              $ 0.384768        (they agree — no invisible
                                                    timeout billing this time)
```

**The budget guard worked and never had to fire.** A one-token probe ran before
the campaign and would have run again on any `HTTPError`; the gateway answered
200 throughout.

## 5.1 Seconds by model by document size

```
model             words chunks  n  median   worst  failed  spans back retries  cost/run
---------------------------------------------------------------------------------------
mistral-small       463      2  3     6.2     6.6    0/3       21/21       2   0.00039
mistral-small       919      3  3     4.0     7.7    0/3       39/39       1   0.00049
mistral-small      1942      6  3     6.9     8.0    0/3       72/72       2   0.00083
mistral-small      2971      9  3     7.5     7.9    0/3     105/105       9   0.00145
mistral-small      4958     15  3    18.5    22.0    0/3     162/162      21   0.00251
mistral-small      7498     22  3    16.0    54.6    0/3     234/234      21   0.00368
mistral-small      9946     29  3    20.2    21.7    0/3     303/303      24   0.00479

mistral-medium      463      2  3     3.1     3.3    0/3       21/21       0   0.00138
mistral-medium      919      3  3     4.4     4.5    0/3       39/39       0   0.00236
mistral-medium     1942      6  3     9.2    13.1    0/3       72/72       7   0.00684
mistral-medium     2971      9  3    10.8    14.1    0/3     105/105      12   0.00989
mistral-medium     4958     15  3    30.8    38.1    0/3     162/162      25   0.01849
mistral-medium     7498     22  3    22.2    25.0    0/3     234/234      32   0.02495
mistral-medium     9946     29  3    26.6    30.8    0/3     303/303      44   0.03304

deepseek-v3.2       463      2  3     3.5     3.7    0/3       21/21       0   0.00027
deepseek-v3.2       919      3  3     4.2     4.3    0/3       39/39       0   0.00051
deepseek-v3.2      1942      6  3     4.3     5.9    0/3       72/72       0   0.00117
deepseek-v3.2      2971      9  3     7.8     7.9    0/3     105/105       1   0.00179
deepseek-v3.2      4958     15  3     8.6    14.1    0/3     162/162       1   0.00300
deepseek-v3.2      7498     22  3    14.8    15.1    0/3     234/234       2   0.00443
deepseek-v3.2      9946     29  3    24.1    24.4    0/3     303/303       6   0.00602

FAILED RUNS: 0 of 63
THE WALL: no model crossed 240 seconds. At 9,946 words the worst run of all
          63 was 30.8s — 13% of the site's abort.
```

**Every frozen span came back character-for-character, 936 of 936 per model,
2,808 of 2,808 in total.** That is the first campaign in this project where
the span count is perfect at every size, and it is the payoff from E-16's
chunk-boundary fix plus job 4's invariant guard.

## 5.2 The interaction the brief asked about: cost fell, timings held, and
## something else got worse

**Cost fell**, as predicted — more frozen text means fewer words sent:

```
mistral-small, cost per run   now      E-16 (pre-change)
  1,942 words                 0.00083     0.00103
  4,958 words                 0.00251     0.00254
  7,498 words                 0.00368     0.00374
  9,946 words                 0.00479     0.00484
```

**Timings held or improved slightly** — medians 6.9 vs 7.6, 7.5 vs 9.4, 18.5
vs 20.8, 20.2 vs 21.1.

**But chunk fallbacks appeared, and this is the real price of the ruling:**

```
model             runs  fails        spans  retries  fallbacks  runs w/ fb
--------------------------------------------------------------------------
mistral-small       21      0      936/936       80         13       10/21
mistral-medium      21      0      936/936      120         12       10/21
deepseek-v3.2       21      0      936/936       10          6         6/21

E-16 mistral-small (pre-change): 21 runs, 0 fallbacks, 67 retries
```

**Mistral-small went from 0 fallbacks to 13.** More frozen text means more
placeholders per chunk, more restores that cannot be verified, and D3 hands
those chunks back as the customer's own text. **In about half of all runs the
customer now receives at least one chunk — roughly 350 words — unrewritten.**

**This is customer-safe and it is not a refund** (D3 refunds only past one
third of the document), and the report explains it in every case. **But it is
a real reduction in what the customer receives, it did not exist before this
ruling, and Jon should know it is the cost of the trade he chose.**

## 5.3 Rewrite depth — measured per paragraph, and it separates nothing

```
doc                      mistral-small        mistral-medium         deepseek-v3.2
----------------------------------------------------------------------------------
ladder_500                0.042  (n=6)          0.024  (n=6)          0.043  (n=6)
ladder_1000              0.034  (n=12)         0.032  (n=12)         0.356  (n=12)
ladder_2000              0.206  (n=25)         0.183  (n=25)         0.065  (n=25)
ladder_3000              0.144  (n=38)         0.019  (n=38)         0.121  (n=38)
ladder_5000              0.019  (n=64)         0.038  (n=64)         0.158  (n=64)
ladder_7500              0.059  (n=98)         0.056  (n=98)         0.107  (n=98)
ladder_10000            0.089  (n=130)        0.013  (n=130)        0.156  (n=130)
```

**No model is consistently deeper and the numbers bounce by an order of
magnitude within one model.** Reading a winner out of this would be reading
noise. **Depth does not decide the model choice and I am not going to pretend
it does.** (Whole-document trigram overlap is not used here: E-16 established
it is inflated by internal repetition, which grows with document size.)

## 5.4 WHICH MODEL: switch to `deepseek/deepseek-v3.2`

**This is a change of recommendation from E-16, and the reason is that E-16
could not measure deepseek at all — the budget cap landed on its first run.**
It now has a full ladder.

| | mistral-small | mistral-medium | **deepseek-v3.2** |
|---|---|---|---|
| Failures | 0 of 21 | 0 of 21 | **0 of 21** |
| Spans returned | 936/936 | 936/936 | **936/936** |
| **Retries across the ladder** | 80 | 120 | **10** |
| **Runs with a fallback** | 10 of 21 | 10 of 21 | **6 of 21** |
| Median at 9,946 words | 20.2s | 26.6s | 24.1s |
| Worst run, whole ladder | **54.6s** | 38.1s | **24.4s** |
| Cost, 9,946-word document | $0.0048 | $0.0330 | $0.0060 |

**The deciding number is retries: 10 against 80.** Now that a quarter of a
typical document is frozen into many separate placeholders, **how reliably a
model preserves those placeholders is the axis that matters**, and deepseek is
eight times better at it. That is not noise at n=21. It shows up where the
customer can feel it: **6 runs in 21 with a chunk handed back unrewritten,
against 10 in 21.**

**It also has the tightest tail** — worst 24.4s against a 24.1s median, where
mistral-small produced a 54.6s run against a 16.0s median.

**Cost is not a reason to refuse: 0.6 cents against 0.48 cents** for a
10,000-word document. **Mistral-medium is out** — 5.5x deepseek's cost, the
most retries of any model, and no advantage anywhere.

**The one thing against deepseek, stated plainly.** E-9 recorded it having a
bad afternoon: median 26.1s, worst 191.5s, and **3 of 44 runs failing
outright**. That is the only genuine deepseek failure evidence in this project
— E-16's two "deepseek failures" were the budget cap, not the model. E-9's own
note said the switch "should wait for a calmer day's latency numbers".
**Today is that day, and deepseek is the best model measured.**

**What would falsify this, and it is cheap to watch:** a repeat of E-9's
afternoon. Re-run `freeze_measure.py ladder deepseek/deepseek-v3.2` on a
different day; if the retry count stays near 10 and nothing fails, the case is
closed.

## 5.5 THE WORD LIMIT: I confirm 8,000, and today's data does not raise it

**No model crossed 240 seconds — the worst run of all 63 was 30.8 seconds at
9,946 words, 13% of the wall.** That is a third consecutive good day and it
tells us nothing new about a bad one.

**The ceiling is still an argument, not a measured crossing**, and the
argument has not changed:

```
  8000 words ->  23 chunks -> 3 waves   at 65s/wave 195s   fits inside 240
 10000 words ->  29 chunks -> 4 waves   at 65s/wave 260s   does not
```

**The only production measurement this project has is ~65 seconds for one
wave** (478 words, 64.982s). Every lab figure — E-16's, and today's ~6s per
wave — is a good day. **8,000 words is the largest round number that survives
the worst per-wave time on record.**

**Two things today's campaign adds, and both point the same way:** cost per
document fell, and the words sent to the model fell with it, so the ceiling is
at worst unchanged. **And the fallback finding argues for restraint rather
than expansion** — a bigger document is more chunks, and every chunk is a
chance for a fallback.

**Recommendation: 8,000. Unchanged. The number is handed back; the sentence
is Lane D's and I have not written it.** The one thing that would earn 10,000
is a single production measurement of a 10,000-word document, which remains
the missing piece.

## 5.6 §9 hand-back: the "hard three-word ceiling" is wrong by two orders of magnitude

**Measured on the delivered documents, `engine/lab/longest_surviving_run.py`.**
The site says *"a hard three-word ceiling on surviving sequences"* and *"no
more than three in a row come through"*.

**The longest unbroken run of the customer's own wording in a delivered
document was 388 words.**

**The site's own receipt cannot show this.** `lib/engine/receipt.ts` measures
run lengths `[3, 4, 5, 6, 8, 10]` and reports the largest with any survivor,
so **10 is the biggest number it can ever print** — which is why the live
receipt printed 10 rather than the truth.

**Three separate causes, and only one is the freeze:**

| Cause | Typical run |
|---|---|
| A frozen span — the ruling working as designed | up to **57 words** |
| A D3 chunk fallback — the customer's own text handed back | ~**290–390 words** |
| The model returning a chunk barely changed | up to **352 words** |

**Even with no fallback and no lazy chunk, the freeze alone guarantees runs of
55 to 57 words** on these documents, because that is the longest frozen span.
**Three is not a ceiling; it is not even the right order of magnitude.**

**This is Lane D's sentence and I have not touched it.** The numbers to write
against: **57 words guaranteed by the freeze, 388 words observed.**

---

# WHAT I COULD NOT PROVE

**1. That production behaves like the lab.** The whole ceiling argument turns
on it and it is still unmeasured. Three per-wave figures exist and they span
5s to 65s; only the 65s came from production, and it is one run of one
document on one afternoon. **Today's 63 runs are a third lab day and add
nothing to this question.**

**2. That deepseek is reliable across days.** It was the best model measured
today by a clear margin, on 21 runs. **E-9 recorded it failing 3 of 44 runs on
a bad afternoon**, and that remains the only genuine deepseek failure evidence
in this project. One good day does not answer one bad day. The model
recommendation says so and names the cheap way to settle it.

**3. That the fallback rate is stable.** 13 fallbacks in 21 mistral-small runs
against E-16's 0 is a real change and the direction is certain, but n=21 per
model is thin for a rate. **What I can prove is that it went from zero to not
zero, and why.**

**4. That freezing every block quote is right rather than merely defensible.**
It is my reading of Jon's ruling, not his words — the brief left it open, I
took indentation at its word, and the price is that an indented address or
poem now freezes. §1.3 carries the numbers and the argument against; **it is a
two-line change if he wants the colon test back.**

**5. That the hard-wrap pattern cannot run away on a document I did not think
of.** Two adversarial documents did not move it, every corpus document freezes
identically wrapped and unwrapped, and four separate bounds hold it. **That is
strong evidence and it is not a proof.** The failure it guards against is the
one that nearly killed the freeze, so it deserves watching on real customer
documents rather than trust.

**6. Whether a statistical watermark was removed.** Not measurable, by anyone.
**Every number in this note measures how much original wording came back.**
Layer B is best effort and the site says so.

---

# WHERE THE NEXT SESSION PICKS UP

**Nothing is blocking.** The budget cap that stopped E-16 has been raised;
this session spent $0.385 of a $2.00 allowance and the gateway answered 200
throughout.

**Three numbers are handed back to Lane D and none of them is mine to write:**

1. **The word limit: 8,000**, down from the advertised 10,000.
2. **The "hard three-word ceiling" sentence is wrong** — the freeze alone
   guarantees 57-word runs and 388 words was observed. The receipt cannot
   print above 10, so it cannot show this either.
3. **The pre-flight percentage rises** on any document containing quotations,
   and rises a great deal on dialogue-heavy fiction (0.0% to 63.9% on a short
   story). D4's wording is fixed on the board and this does not change it, but
   the number behind it moved.

**In order, for the next engine session:**

1. **Re-run deepseek's ladder on a different day.** One command, a few cents,
   and it is the only thing standing between the model recommendation and a
   decision.
2. **Watch the fallback rate.** It went from 0 to 13 in 21 runs on
   mistral-small. If it climbs on real documents, the lever is
   `UC_LAYER_B_CHUNK_WORDS` — fewer masks per chunk — not a change to the
   ruling.
3. **One production measurement of a 10,000-word document**, which would
   settle the word limit properly instead of by argument.
4. **`docs/03-pricing.md` §4b** still rests on a 60-second cap that
   `vercel.json` now sets to 300 (found by E-16, still unfixed, not my
   territory).

**Everything landed locally and NOTHING was pushed or deployed.** Pushes track
main and deploy continuously, so all of it reaches production on the next
push, which is Jon's call:

- every quotation freezes, and the attribution machinery is gone;
- the citation beside a quotation freezes with it;
- a hard-wrapped document is protected for the first time;
- an invariant guard against the silent-orphan failure shape.
