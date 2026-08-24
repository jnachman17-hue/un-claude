# Freeze every quotation, and the citation beside it

**24 August 2026.** Jon's ruling: any quotation freezes, with no attempt to
tell a sourced quotation from invented dialogue, and the citations around it
freeze with it. Brief: `docs/briefs/freeze-every-quotation.md`.

```
AI Gateway total_used at start   $10.0059341268   2026-08-24T22:29:18Z
AI Gateway total_used at end     (job 5 not yet run)
engine suite                     (baseline 809 passed, 1 skipped)
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
