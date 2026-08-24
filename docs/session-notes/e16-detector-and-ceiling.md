# E-16 — the quotation detector, and the model/ceiling measurement

**24 August 2026.** Two jobs from `docs/briefs/e16-detector-and-ceiling.md`:
job 1 corrects the attribution cue that freezes ordinary novel dialogue;
job 2 measures which model should run the site and how large a document it
can actually finish.

```
AI Gateway balance at start   $15.3484076412   2026-08-24T20:56:39Z
AI Gateway balance at end     (job 2 not yet run)
engine suite                  (not yet re-run)
Pushed or deployed BY THIS SESSION   NOTHING
```

*(E-9 ended at $15.3501186492. The $0.0017 gone since is not this session —
the live site shares this key.)*

---

# JOB 1 — E-16, THE ATTRIBUTION CUE

## 1.1 The before-state, reproduced in my own run

Harness: `engine/lab/attribution_probe.py` (new). Shipping detector, both
tiers, **no model involved and no money spent** — this is `plan_freeze`, the
same call the pre-flight and the rewrite make.

**Test A — one realistic novel dialogue line per verb on `_ATTRIBUTION`:**

```
FICTION DIALOGUE LINES TESTED: 20   (none should ever freeze)
WRONGLY FROZEN: 17
Frozen: argued · warned · noted · observed · claimed · stated · declared ·
        remarked · insisted · acknowledged · concluded · reported ·
        asserted · maintained · contended · cautioned · emphasised
Free:   said · asked · replied
```

**Reproduces the conductor's measurement exactly** — same count, same 17
verbs, same 3 free.

**Test B — the same story twice, differing ONLY in its four dialogue tags.**
My story is 140 words in both arms (identical word counts, because each tag
is one word either way):

```
  Story A — said / replied / asked / said
    words 140   frozen 0.0% (0 words, 0 spans)
  Story B — insisted / observed / argued / concluded
    words 140   frozen 33.6% (47 words, 4 spans)
```

Same shape as the conductor's 0.0% / 14.6%, and **worse in size** — my
version's quoted lines are longer, so the same defect freezes a third of the
document. Both stories are 100% invented dialogue.

**Test C — E-9's D2 demo passed on the story's word choices, confirmed.**
The dialogue tags in the demo story in `engine/lab/freeze_measure.py` are:

```
  tags found in the E-9 demo story: ['asked', 'replied', 'said']
  E-9 story freezes 0.0% of 193 words
```

**All three tags are the only three verbs the defect leaves free.** The 0-of-193
result in `e9-freeze.md` section 5.3 is real, but it did not test the rule —
swap those three words for `observed`, `argued`, `concluded` and the same demo
freezes. The demo was not adversarial.

**Test C also fixes the other end of the record:** the five correct attribution
shapes D2 exists to protect — `Smith puts it`, `Orwell wrote`, `(Smith, 2019,
p. 47)`, `The committee concluded`, `Acton observed` — all 5 freeze today.
Whatever the fix is, it must not lose them.

## 1.2 I tested the brief's fix and it does not close the hole

The brief recommends: **a reportive verb whose subject is a bare pronoun is
not attribution**, and reports it fixing 17 of 17 on the conductor's sample.

**On a bigger corpus it fixes about two thirds, and the product-level test
still fails.** I built an adversarial corpus — **45 fiction dialogue lines**
(none may freeze) and **30 real attribution shapes** (all should freeze) —
and scored four rules on it. Harness: `engine/lab/attribution_rules_eval.py`.
The fiction corpus deliberately includes what the conductor's sample did not:
dialogue tagged with a **named character** ("Aldous observed"), a **common
noun** ("the boy reported"), the **tag placed first** ("Marcus concluded,
'…'"), **inverted** tags ("cautioned Aldous"), and a **bare year inside
dialogue** ("since 1987").

```
SCORE — fiction wrongly frozen (the expensive error) / attribution wrongly freed
==============================================================================
  R0 shipping    wrongly FROZEN 35/45   wrongly FREE  0/30
  R1 pronoun     wrongly FROZEN 12/45   wrongly FREE  0/30
  R2 pre-only    wrongly FROZEN  2/45   wrongly FREE  2/30
  R3 inverted    wrongly FROZEN  4/45   wrongly FREE  0/30
```

- **R0** is what shipped. **35 of 45**, not 17 of 20 — the defect is larger
  than the brief found, because most fiction does not tag with a pronoun.
- **R1** is the brief's hypothesis. It leaves **12** — every line whose
  subject is a character's name, which is half the dialogue in a real novel.
- **R2** drops the trailing-tag path entirely: attribution is a reportive
  verb that **introduces** the quote with a **named** subject, or a citation.
- **R3** keeps the trailing path only when inverted («"…," wrote Orwell»).

**The decisive number is the product-level one, not the line score.** Run the
two stories from test B through each rule:

```
document                            R0 ship     R1 pron     R2 pre-only   R3 inverted
--------------------------------------------------------------------------------------
essay (E-9 5.1/5.2)                   23.6%       23.6%       23.6%       23.6%
story (E-9 5.3, D2 demo)               0.0%        0.0%        0.0%        0.0%
mask_heavy (E-9 5.4, rule-2 demo)     71.9%       34.2%       34.2%       34.2%
E-16 story A (said/asked)              0.0%        0.0%        0.0%        0.0%
E-16 story B (insisted/argued)        33.6%       10.0%        0.0%        0.0%
```

**Under the brief's own rule, story B still freezes 10% of itself and story A
freezes nothing — the same story, the same length, the same invented
dialogue.** That is the bug, still present. R2 and R3 both take it to zero.

## 1.3 The rule I built, and why R2 over R3

**Two things separate real attribution from a dialogue tag, and neither of
them is the verb.**

- **Position.** Attribution *introduces* its quotation — «Orwell wrote that
  "…"», «As Smith puts it, "…"». A dialogue tag *follows* it — «"…," she
  argued». **Every one of the 35 false positives came through the trailing
  path.** It is gone.
- **Subject.** Attribution names a source — Smith, The committee, the 2019
  review. Fiction uses a bare pronoun. A reportive verb whose subject is a
  bare pronoun does not attribute. This is the brief's insight, kept.

**A citation shape stays an independent trigger** — `(Smith, 2019, p. 47)`,
`(2019)`, `p. 47` — subject and position irrelevant, because it is the
strongest evidence a real source exists. That is unchanged from E-9.

**I chose R2 over R3, and it is a judgment call under D2, so here is the
trade in full.** R3 scores better on paper (0 attribution lost against R2's
2). But the 2 shapes R2 gives up are **uncited** trailing attributions —
«"…," wrote Orwell in 1946» and «"…," reported the district» — and the 2
extra fiction lines R3 freezes are inverted dialogue tags, «"Mind the second
stair," cautioned Aldous». **D2 rules that those two errors are not the same
size:** being wrong toward free costs a few reworded phrases, being wrong
toward frozen hands back a paid-for rewrite undone. R2 is wrong less often in
the expensive direction. It also **deletes a code path rather than narrowing
one**, and a deleted path cannot drift back.

**If Jon wants the inverted academic case protected, R3 is measured and
ready** — it is four lines of code and the numbers above are its whole story.

## 1.4 The after-state, same harness, same three tests

```
FICTION DIALOGUE LINES TESTED: 20   (none should ever freeze)
WRONGLY FROZEN: 0
Frozen: (none)
Free:   argued · warned · noted · observed · claimed · stated · declared ·
        remarked · insisted · acknowledged · concluded · reported ·
        asserted · maintained · contended · cautioned · emphasised ·
        said · asked · replied

  Story A — said / replied / asked / said
    words 140   frozen 0.0% (0 words, 0 spans)
  Story B — insisted / observed / argued / concluded
    words 140   frozen 0.0% (0 words, 0 spans)

ATTRIBUTION SHAPES TESTED: 5   (all should freeze)
WRONGLY FREE: 0   []
```

**Test A: 17 wrongly frozen → 0. Test B: 33.6% → 0.0%, with story A
unmoved at 0.0%. Test C: all five attribution shapes still freeze.**

## 1.5 What this changed that was not asked for, stated plainly

**E-9's mask-heavy demo document drops from 71.9% frozen to 34.2%.** Its
main quotation is «The auditor's verdict took one paragraph. **She wrote**
that the committee had "…"» — a pronoun subject, so it now goes free. **This
is the brief's own accepted residual arriving in a real document**: freeing
epistolary fiction and freeing anaphoric attribution ("Smith argues X. She
notes that '…'") are the same rule seen from two sides, and academic prose
uses the pronoun form constantly.

**The E-9 essay is untouched — 23.6% before and after, same six headings,
same quote, same block quote, same three references.** The document E-9
measured its whole campaign on is unaffected by this change.

## 1.6 The new tests, and the one I had to change

**New: `engine/tests/test_spans_fiction_corpus.py`, 6 tests.**

- `test_no_fiction_dialogue_line_freezes_a_single_word` — 49 fiction lines.
- `test_every_real_attribution_shape_still_freezes` — 10 attribution shapes.
- **`test_every_attribution_verb_has_a_fiction_line` — the lock.** It reads
  `uc_spans._ATTRIBUTION`'s live pattern, splits it into its alternatives,
  and fails if any cue verb has no dialogue line in the corpus. **Adding a
  verb to the cue list without proving it does not freeze a novel now fails
  the suite.** It works: it failed on its first run because I had no line for
  `argues`, which I had missed by hand.
- `test_the_same_story_freezes_the_same_however_the_author_tags_dialogue` —
  the product-level bug as one assertion.
- Two tests pinning the residuals as deliberate: the pronoun subject and the
  uncited trailing attribution.

**Changed, one test: `test_curly_quotes_detected_too`** in
`engine/tests/test_spans_detector.py`. Its sentence was «**She** noted "…"» —
a pronoun subject, so under the new rule it is not attributed, and the test's
`attributed is True` line would have been asserting the defect. **I changed
the sentence's subject to "The registrar", not the assertion** — the test is
named for curly-mark detection and still tests exactly that — **and added
`test_curly_quotes_detected_with_a_pronoun_subject_too`, which keeps the
original sentence and asserts the new answer.** Nothing about curly-quote
detection was weakened; the old sentence is still in the suite.

```
engine suite   807 passed, 1 skipped     (E-9 baseline 800 + 1 skipped; +7 tests)
```

## 1.7 Two defects found in shipped code while building job 2's ladder

**Both are in `apps/web/engine/`, which the brief puts in my territory. I
fixed one because it was corrupting the job 2 measurement; I have not touched
the other and am describing it instead.**

### FIXED — the mask repair un-indented the block quote beside it

**deepseek and mistral-medium failed an ordinary 463-word essay outright and
refunded the job, where mistral-small delivered it. The cause was not the
model.** I found it because the very first ladder run failed, and E-9's own
demo document was the control that ruled the model out.

What happens: the model deletes the document's title — a lone `[[11]]`
placeholder — on the blind attempt and again on the informed retry.
`_reinsert_lost_masks`, the repair E-9 built for exactly this, puts the title
back correctly. **Then the job fails anyway,** and the verifier's complaint
names something else entirely:

```
>>> REPAIR dropped=[11] -> REINSERTED
>>> VERIFY PROBLEMS (1): ['span [[17]] (block_quote) missing: 0 of 1 copies present']
FAILED: FreezeRestoreFailed: 298 of 463 words came back unrewritten ... (64%,
        past the 33% threshold); the job fails rather than deliver this
```

**The repair rebuilt the chunk with a bare `"\n\n"` between paragraphs.**
`_PARA_BREAK`'s trailing `[^\S\n]*` swallows the horizontal whitespace that
*opens* the next paragraph — and for an indented block quote that whitespace
is part of the frozen span's own text. So the repair silently un-indented the
block quote sitting next to the mask it was repairing, and the verifier then
**correctly** reported the block quote missing. A fully recoverable chunk
failed. On a two-chunk document that is past D3's one-third threshold, so the
whole job refunds.

Reproduced with **no model involved at all**:

```
dropped: [11]  repair: REINSERTED
heading back?               True
block quote byte-for-byte?  False
--- the block quote as the repair left it ---
'We do not dispute the attendance figure. We dispute that it was\n    purchased...'
--- as it must be ---
'    We do not dispute the attendance figure. We dispute that it was\n    purchased...'
```

**`uc_spans._paragraphs` documents this exact trap and compensates for it.**
The fix applies the same compensation in `uc_chunk` and rejoins with the
masked chunk's own separators instead of an invented `"\n\n"`. New test
`test_reinsertion_keeps_the_indentation_of_a_neighbouring_block_quote`
fails without the fix with production's own message.

**Live, the four runs that had failed now all deliver:**

```
deepseek   ladder_500 run 1  4.9s  7/7 spans  0 fallbacks  masks_reinserted 0
deepseek   ladder_500 run 2  4.0s  7/7 spans  0 fallbacks  masks_reinserted 1
medium     ladder_500 run 1  6.0s  7/7 spans  0 fallbacks  masks_reinserted 1
medium     ladder_500 run 2  5.5s  7/7 spans  0 fallbacks  masks_reinserted 1
```

**This is live-affecting and not deployed.** Pushes track main and deploy
continuously (E-9 5.5b), so this reaches production on the next push, which is
Jon's call. Until then a customer whose essay has a heading dropped in the
same chunk as an indented block quote loses the whole job.

### DESCRIBED, NOT FIXED — a hard-wrapped quotation is invisible to the detector

`uc_spans._QUOTE` is `"([^"\n]{12,600})"`. **A quotation containing a newline
is not detected at all**, so a document that is hard-wrapped at 80 columns —
plain-text email, a `.txt` export, anything out of a terminal editor — gets
**no quote protection whatsoever**, silently, and the D4 pre-flight shows the
visitor a lower frozen percentage than the same document unwrapped. I hit this
building the ladder: wrapped, it froze 13.8%; unwrapped, 21.3%. Same document.

I have not touched it. It changes what freezes across every document and the
pre-flight number a visitor is quoted before paying, which is a decision, not
a bug fix. **File: `apps/web/engine/uc_spans.py`, the `_QUOTE` constant.**
