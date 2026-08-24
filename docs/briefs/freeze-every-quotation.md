# BRIEF — freeze every quotation, and the citation beside it

**Written by the conductor, 24 August 2026, to Jon's ruling. Paste this whole
file into a fresh session.**

**This SUPERSEDES `docs/briefs/freeze-final-then-measure.md`, which is now
withdrawn.** Its job 1 asked you to tell a real quotation from novel dialogue.
**Jon has ruled that question out of existence.** Its jobs 2 and 3 survive and
are carried into this brief.

---

## 0. READ FIRST

Read `CLAUDE.md` in full — sections 1 (Jon is not a programmer), 2 (precedence),
4 (a run, not an assertion) and 5 (stop and ask). Then read
`docs/session-notes/e16-detector-and-ceiling.md`, whose work you are replacing
in part.

**The verification standard:** an assertion carries no weight. Run it and paste
the real output. **A step you skipped is a step that failed — say so.** State
failures first and plainly.

---

## 1. JON'S RULING, IN HIS OWN TERMS

> *"I don't want to try and differentiate real quotation versus novel dialogue.
> I think that makes no sense, and it's purely a non-deterministic, subjective
> guessing game. What we're going to do is any quotation is frozen and kept
> across the board. There's no delineation between novel dialogue and real
> quotation. We preserve the text and quotations, and citations around it on
> either side."*

**This overturns decision `04` entry 137's D2 implementation and supersedes the
attribution machinery E-16 built.** It is Jon's call, it is the highest
authority in this project, and **you may not reopen it.** Record it in
`docs/04-decision-log.md` as a new entry that names and supersedes 137 and 142.

### Why he is right, measured — quote this reasoning, do not re-derive it

**Two sessions have now tried to separate a sourced quotation from invented
dialogue and both produced a rule that fails on ordinary text.** The reason is
not that they were careless. It is that the two are grammatically identical:

```
"Power tends to corrupt," Acton observed.        <- real, must freeze
"Mind the second stair," Aldous observed.        <- fiction, must not
```

Quote, comma, capitalised name, reportive verb, in both. **The difference is
that Acton published and Aldous is a character. That is world knowledge, not
syntax.**

**And the cost of abandoning the distinction is almost nothing**, measured by
the conductor across the real corpus:

```
document                  words   frozen NOW   if ALL quotes freeze   change
ladder_500                  463       27.4%          27.4%            -0.0%
ladder_1000                 919       27.8%          28.8%            +1.1%
ladder_2000                1942       23.6%          25.1%            +1.5%
ladder_3000                2971       23.5%          25.2%            +1.7%
ladder_5000                4958       22.3%          24.1%            +1.8%
ladder_10000               9946       21.4%          23.2%            +1.8%
dialogue-heavy story         99        0.0%          59.6%           +59.6%
```

**On every academic document the change is under two points.** It is dramatic
only for dialogue-heavy fiction — **the case Jon has explicitly decided this
product does not optimise for**, and the case D4's pre-flight already warns
about before any money changes hands.

**The other prize is simplification.** This DELETES the attribution machinery
rather than narrowing it: the reportive-verb list, the position test, the
subject test, the attributed/unattributed split. **This project has found three
silent freeze bugs in two days. A deleted code path cannot harbour a fourth.**

---

## 2. YOUR TERRITORY

**Yours:** `apps/web/engine/**` · `engine/tests/**` · `engine/lab/**` ·
`docs/04-decision-log.md` (the new entry only) ·
`docs/session-notes/freeze-every-quotation.md` (create it).

**NOT yours:** `apps/web/app/**` — every site sentence and the word limit are
Lane D's; **hand numbers back, never write copy** · `apps/web/lib/**` ·
`vercel.json` · `supabase/**` · `docs/03-pricing.md` ·
**`docs/IMPLEMENTATION-BOARD.md`, which only the conductor writes.**

**Hard rules:**
- **Never `git add -A`, `git add .`, `git commit -a`.** Stage by explicit path.
- **`git diff --cached` — THE DIFF, NOT THE FILE LIST — as its own step before
  every commit.** E-16 ran the file-list check every time and still swept
  another session's work into a commit: staging by path says nothing about
  whose edits are already inside a file you legitimately staged. **A marketing
  session is live in this tree and edits `docs/04-decision-log.md`. You also
  need that file. Read its diff before every single stage.**
- **Do not push, deploy, or apply migrations.** Committing locally is yours.
- **No new dependencies** without asking Jon.

---

## 3. JOB 1 — every quotation freezes

**Remove the attribution test from what the freeze acts on.** A quotation is
frozen because it is a quotation.

### What must NOT change

- **Headings, block quotes and reference entries** already freeze. Untouched.
- **The quotation marks freeze with the quote** (E-9). Untouched.
- **The 12-character minimum in `uc_spans._QUOTE` stays.** It is what keeps a
  two-word scare quote — «the so-called "gig economy"» — out of the freeze.
  **Verified by the conductor: that phrase is currently not detected at all,
  and it should stay that way.** A scare quote is not a quotation. **If you
  believe this boundary is wrong, report it — do not move it.**
- **D3's fallback and one-third refund threshold.** Untouched.
- **D4's pre-flight.** It is the safety valve that makes this ruling safe: a
  fiction customer is shown the frozen percentage and can cancel before paying.
  **Confirm the pre-flight number still equals what the rewrite delivers** —
  one detector, one number, which is the trap this project has hit three times.

### What to do with `quotes_attributed`

The report block carries `quotes_attributed`, which counted freeze-grade
attribution. **It no longer means anything.** Decide and justify: remove it, or
keep it as a plain count of quotations. **Do not leave a field whose name
claims a distinction the engine no longer makes.**

### The tests

E-16 built `engine/tests/test_spans_fiction_corpus.py` asserting **no fiction
dialogue line freezes**. **That assertion is now backwards** and must invert.

**Do not simply delete that corpus — invert it into the stronger invariant:
every quotation in it freezes, fiction and academic alike.** E-16's lock test
(`test_every_attribution_verb_has_a_fiction_line`) is tied to a cue list that is
going away; replace it with a lock that fits the new rule, so that a future
change reintroducing an attribution test fails the suite.

**Full engine suite. Baseline `809 passed, 1 skipped`. Name and justify every
test you change** — a changed test is where a regression hides.

---

## 4. JOB 2 — freeze the citation beside the quotation

**This is the second half of Jon's ruling and it is a live exposure.** Proved by
the conductor against the shipping masker — this is literally what the model is
handed today:

```
As Smith puts it, [[11]] (p. 47). The minutes were circulated the following week.
The review found that [[11]] (Jones, 2019, p. 12). No objection was recorded.
Weber called it [[11]] (Weber, 1922) in his final chapter on bureaucratic life.
```

**The quotation is protected. The citation next to it is not.** The model is
free to renumber a page, shift a year, or change an author. W10 measured
invented authors in **23 of 41 runs** on this model family; reference-list
entries now freeze, **inline citations do not.** A rewritten citation attached
to a correctly preserved quotation is worse than either error alone — it looks
authoritative and is wrong.

**Build it:** when a citation shape sits adjacent to a quotation span, the
frozen span covers both, including the whitespace and punctuation between them.
`uc_spans._CITATION` already recognises `(2019)`, `(Smith, 2019, p. 47)` and
`p. 47`, and already ignores bare years.

**Handle these, and say what you decided for each:**
- The citation **before** the quote as well as after — Jon said *"on either side"*.
- A trailing sentence period **outside** the citation's closing bracket.
- A citation adjacent to a quote that is **already inside a block quote**.
- **A citation that is NOT adjacent to any quotation.** Jon's ruling is about
  citations *around* quotations. **Freezing every parenthetical year everywhere
  is a bigger change than he asked for — do not do it without asking.**

**`_CITATION` only matches years beginning 19 or 20.** The conductor found
`(1887)` is therefore not recognised. **Report this; do not widen it without
saying what else the wider pattern would catch.**

---

## 5. JOB 3 — the hard-wrap gap. CONDITIONAL, READ THIS

**Jon has NOT ruled on this. The conductor believes his ruling implies it and
has said so to him. If he has not confirmed it by the time you reach this job,
ASK HIM BEFORE BUILDING IT.**

`uc_spans._QUOTE` is `"([^"\n]{12,600})"` — **a quotation containing a newline
is not detected at all.** Measured by the conductor, same document, same 86
words:

```
UNWRAPPED (pasted from Word)      FROZEN 61.6%   spans {heading:1, quote:2}
HARD-WRAPPED at 72 cols (.txt)    FROZEN  5.8%   spans {heading:1}
```

**Both quotations vanish.** un-claude accepts `.txt` uploads and `.txt` is
routinely hard-wrapped. Under Jon's ruling — *any quotation is frozen* — a
wrapped quotation is still a quotation.

**The risk that put the newline exclusion there in the first place, and you must
not walk into it:** a quote pattern that crosses newlines can run away. One
unbalanced quotation mark — an apostrophe, a possessive, an em-dashed aside —
and the match swallows paragraphs, freezing enormous spans of ordinary prose.
**That is the Sources-latch failure shape again: a 221-word essay came back
56.1% frozen, 12 of 12 runs, and it nearly killed the freeze entirely.**

**So bound it.** Permit at most a small number of line breaks inside one
quotation, keep the 600-character ceiling, and **prove the runaway cannot
happen**: build a document with an unbalanced quotation mark and assert the
frozen fraction does not blow up. Report the before-and-after frozen fraction
across the whole corpus, not just the wrapped sample.

---

## 6. JOB 4 — the second silent span shortfall

E-16 fixed one deterministic cause of spans going missing and **found a second
it did not chase.** On `ladder_3000`, **87 of 90 spans come back in every run,
identically** — identical across runs rules out the model.

**This is the worst failure shape this product has:** the span is never masked,
so never verified, so **nothing reports it** — while D4's pre-flight already
counted it as frozen and the customer already paid on that number. A loud
failure refunds; this one delivers.

**Costs nothing — no model involved.** Use E-16's own method from its §1.7: plan
the spans, assign them to chunks, print the ones that land in neither. Add a
test that **fails against the pre-fix code.** **If it turns out benign, say so
with the evidence** rather than fixing something that is not broken.

---

## 7. JOB 5 — the ladder, once, at the end, all three models

**Only after jobs 1–4 pass. THE ORDER IS THE POINT.**

**E-16 fixed a freeze bug halfway through its campaign and had to discard every
span count it had measured.** Every change to freeze behaviour lands first; the
measurement runs once, on the final engine. **If this job forces a further
change, re-run it from the start rather than reporting a mixed table.**

`python engine/lab/freeze_measure.py ladder`, read with
`python engine/lab/ladder_report.py`. Both written and tested by E-16.

**Models: `mistral/mistral-small`, `mistral/mistral-medium`,
`deepseek/deepseek-v3.2`.** Rungs 463 → 9,946 words, n=3 minimum.

**`deepseek` is the reason this matters. It has NO ladder measurement at all** —
the budget cap landed on its first run. Every claim about it since the freeze
shipped rests on two short-document samples.

**Report per cell:** n, median and worst seconds, failures with exact messages,
**spans returned versus spans planned**, retries, cost per run.

**Use `engine/lab/depth_by_paragraph.py` for rewrite depth, not whole-document
trigram overlap** — E-16 established that whole-document overlap is inflated by
internal repetition, which grows with document size (4.3% of trigrams repeat at
500 words, 83.5% at 10,000).

**Answer two questions:**
1. **Which model runs the site?** Currently `mistral/mistral-small`, chosen by
   default rather than by measurement, because deepseek was never tested.
2. **Confirm or correct the 8,000-word limit.** E-16 recommends 8,000, down from
   the advertised 10,000, sized so 3 waves of 8 parallel calls fit inside the
   240-second abort at the worst per-wave time ever seen in production (~65s).
   **No model has actually crossed 240s in the lab, so this is an argument, not
   a measured crossing.** **Hand the number back — the sentence is Lane D's.**

**Note the interaction with jobs 1–3:** more frozen text means fewer words sent
to the model, so timings may improve and cost may fall. **Say whether they did.**

### ★ BUDGET — the trap that stopped E-16

**The spend limit is on the KEY, and the credits endpoint does not show it.**
E-16 read `balance` as headroom; it is not. It saw `balance $14.99` while the
key stood at `total_used $10.005` against a **$10.00 cap**, and every model
returned **HTTP 402**. Its $3.00 stop rule could never have fired — the key had
$0.35 of headroom when it started. **Jon has since raised the cap.**

- Record `total_used` at start and end; put both at the top of your note.
  **Never call `balance` headroom.**
- **Stop and report on the FIRST HTTP 402. Do not retry it** — the retry loop
  turns one refusal into eight and looks exactly like a model failing. E-16
  misread two failures as precisely this.
- **Stop and report if this session's own spend passes $2.00.**
- `mistral-medium` costs roughly 7x `mistral-small` per run.

**A gateway call can hang far past its timeout** — urllib's timeout is per
socket operation and a dripping connection resets it. **`freeze_measure.py`
runs every run in a subprocess under a hard 240-second wall clock. Do not
remove it.**

---

## 8. THINGS THAT CANNOT BE FIXED — never let these get promised

- **Whether a statistical watermark was removed is not measurable, by anyone.**
  Every number here measures how much original wording came back. Layer B is
  best effort and the site says so.
- **A term of art restated wrongly is not findable by a program.**
- **Invented facts and sources are not findable.**

## 9. ONE CONSEQUENCE TO HAND BACK, NOT FIX

Freezing more text makes the site's **"a hard three-word ceiling"** claim worse.
It was already wrong — the live receipt printed **10** today. **It is Lane D's
sentence and not yours.** Measure the longest run on a few real documents after
your changes and hand the number back.

## 10. WHAT TO HAND BACK

`docs/session-notes/freeze-every-quotation.md`, **written as you go, not at the
end.** Gateway `total_used` before and after, plus the suite result, at the top.
Then each job. Then **a section titled "What I could not prove"** — the best
notes in this project lead with it.

Commit locally by explicit path as you go. **Leave nothing uncommitted.** Do not
push.

## 11. MODEL AND EFFORT

**Opus, high reasoning effort.** Job 3 walks toward the failure shape that
nearly killed the freeze, and job 5 is a campaign whose expensive mistakes are
silent.
