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
