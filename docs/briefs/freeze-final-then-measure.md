# ⚠️ WITHDRAWN — SUPERSEDED 24 August 2026

**Do not run this brief.** Jon ruled that the real-quotation-versus-novel-
dialogue distinction is a guessing game and abolished it: **every quotation
freezes.** Its job 1 asked for the opposite. Jobs 2 and 3 survive and are
carried into **`docs/briefs/freeze-every-quotation.md`**, which replaces this.

Kept for its reasoning, not as a to-do list.

---

# BRIEF — finish the freeze, THEN measure it once

**Written by the conductor, 24 August 2026, after verifying E-16. Paste this
whole file into a fresh session. Three jobs and THE ORDER IS THE POINT.**

---

## 0. READ FIRST

Read `CLAUDE.md` in full — sections 1 (Jon is not a programmer), 4 (a run, not
an assertion) and 5 (stop and ask). Then read
`docs/session-notes/e16-detector-and-ceiling.md`, which you are continuing.
**Do not read the other session notes** unless something here names one.

**The verification standard:** an assertion that something works carries no
weight. Run it and paste the real output. **A step you skipped is a step that
failed — say so and say why.** State failures first and plainly.

## ★ WHY THE ORDER MATTERS, AND IT IS E-16's OWN LESSON

E-16 fixed a freeze bug **halfway through its measurement campaign**, and the
result was that **nearly every row of its results table describes an engine
that no longer exists.** Its span counts had to be thrown away.

**So: every change to what the freeze does lands FIRST. The measurement runs
ONCE, at the end, on the final engine.** Jobs 1 and 2 change freeze behaviour.
Job 3 measures it. **Do not start job 3 until 1 and 2 are done and their tests
pass.** If job 3 forces a change to freeze behaviour, **re-run job 3 from the
start** rather than reporting a mixed table.

---

## 1. YOUR TERRITORY

**Yours:** `apps/web/engine/**` · `engine/tests/**` · `engine/lab/**` ·
`docs/session-notes/freeze-final-then-measure.md` (create it).

**NOT yours:** `apps/web/app/**` (the word limit and every site sentence are
Lane D's — **hand numbers back, do not write copy**) · `apps/web/lib/**` ·
`vercel.json` · `supabase/**` · `docs/03-pricing.md` ·
**`docs/IMPLEMENTATION-BOARD.md`, which only the conductor writes.**

**Hard rules:**
- **Never `git add -A`, `git add .`, `git commit -a`.** Stage by explicit path.
- **`git diff --cached` — THE DIFF, NOT THE FILE LIST — as its own step before
  every commit.** E-16 ran the file-list check every time and still swept
  another session's decision-log entry into its commit, because staging by path
  says nothing about whose edits are already inside a file you legitimately
  staged. **A marketing session is live in this tree and is editing
  `docs/04-decision-log.md` and `docs/06-assumptions-and-open-questions.md`.
  Read the diff of those two files before staging them, every time.**
- **Do not push, deploy, or apply migrations.** Committing locally is yours.
- **Do not add a dependency** without asking Jon.

---

## 2. JOB 1 — restore trailing attribution WITHOUT re-freezing novels

### What happened, and why this is delicate

E-16 fixed a real defect: 35 of 45 ordinary novel dialogue lines were being
frozen, because the cue list's reportive verbs are also fiction dialogue tags.
**Its fix deleted the trailing-attribution path entirely** — every one of those
35 false positives came through it. That worked: fiction now freezes nothing.

**But it also gave up real quotations.** Measured by the conductor on the
shipped fix:

```
LEADING attribution  ("Acton observed that '…'")             FROZEN  4/4
TRAILING with a cite ("'…,' Hartley wrote (p. 1)")           FROZEN  1/2
TRAILING, no cite    ("'Power tends to corrupt,' Acton observed")   FROZEN  0/5
```

**Jon has ruled that this must be fixed.** All five are real quotations a
student essay would plausibly contain.

### ★ READ THIS BEFORE YOU DESIGN ANYTHING: the sentence alone cannot decide

```
REAL QUOTATION (must freeze)                    FICTION DIALOGUE (must not)
"Power tends to corrupt," Acton observed.       "Mind the second stair," Aldous observed.
"The medium is the message," McLuhan argued.    "You never listen to me," Marcus argued.
"The past is a foreign country," Hartley wrote. "I am not coming home," Eleanor wrote.
"All happy families are alike," Tolstoy declared. "This ends tonight," Rosalind declared.
```

**Grammatically identical.** Quote, comma, capitalised name, reportive verb.
The only difference is that the left column names people who published and the
right names characters. **That is world knowledge, not syntax, and no pattern
over these characters separates them.**

**E-16 offers rule R3 as its measured alternative. R3 restores only INVERTED
tags — «"…," wrote Orwell» — and four of the five cases above are normal order
— «"…," Orwell wrote». R3 probably does not recover them. Measure it; do not
assume it.**

### The hypothesis the conductor recommends you test: decide at DOCUMENT level

The sentence is ambiguous; the document is not. An academic essay cites
something somewhere. A short story does not. Tested on realistic documents:

```
ACADEMIC essay (trailing attribution is real)
   citation shapes found : 4   ['(Weber, 1922)', 'p. 2', '(1922)']
   reference section     : True
FICTION (trailing tags are dialogue)
   citation shapes found : 0
   reference section     : False
FICTION containing a bare year ("It was 1994")
   citation shapes found : 0        <- robust to this trap
   reference section     : False
```

**So: permit the trailing path — with a named, non-pronoun subject — only in a
document that cites something.** `uc_spans._CITATION` already exists and
already ignores bare years.

### ★★ THE TRAP THIS IDEA WALKS TOWARD — the reason E-9's first design died

**A document-level flag is the same shape as the "Sources latch"**, the defect
that killed the first freeze design: a document-level state that, once
triggered, over-froze everything after it. A 221-word essay came back 56.1%
frozen, 12 of 12 runs.

**So scope it narrowly and prove the scoping:**
- The flag must only **PERMIT** the trailing path. **It must never freeze
  anything by itself**, and it must not touch leading attribution, citations,
  headings, block quotes or references — all of which already work.
- **A document with citations must not start freezing more of its ordinary
  prose.** Prove this: run E-9's essay before and after and show the frozen
  percentage is unchanged except for the trailing quotations you intend.
- **A story that happens to contain one citation must not have its dialogue
  frozen.** Build that adversarial document and test it.

**If your testing says the document-level idea is unsafe, say so and show the
numbers. Jon's instruction is "fix the trailing-attribution loss", not "ship
this particular rule."** If no rule recovers real trailing quotations without
re-freezing fiction, **that is a legitimate finding and you must report it as
one** rather than shipping something that half works. Say which way you erred
and why, in D2's terms.

### D2, which governs and which you may not overturn

Attributed quotations freeze; unattributed ones do not. **Being wrong toward
free costs a few reworded phrases. Being wrong toward frozen hands the customer
back the most watermarked part of their document untouched and charges them for
a rewrite. Those are not the same size.** When in doubt, leave it free.

### Done looks like

1. Reproduce the three conductor measurements above, before changing anything.
2. Build the rule.
3. Re-run them, plus **E-16's full 45-fiction / 30-attribution corpus** —
   `engine/lab/attribution_rules_eval.py`. **Fiction wrongly frozen must stay
   at 0.**
4. Re-run the two-stories test: both must stay at 0.0%.
5. Add tests, including the adversarial "fiction containing a citation".
6. Full suite. **Baseline `809 passed, 1 skipped`.** Name and justify any test
   you changed.

---

## 3. JOB 2 — the second silent span shortfall

E-16 fixed one deterministic cause of spans going missing and **found a second
it did not chase.** On `ladder_3000`, **87 of 90 spans come back in every run,
identically.** Identical across runs rules out the model.

**This is the same shape as the bug already fixed and that shape is the worst
one this product has:** the span is never masked, so it is never verified, so
**nothing reports it** — while the D4 pre-flight has already counted it as
frozen and the customer has already paid on that number. A loud failure
refunds. This one delivers.

**Costs nothing to reproduce — no model involved.** Start at
`engine/lab/ladder_report.py` on `ladder_3000`, and use E-16's own method from
§1.7: plan the spans, assign them to chunks, and print the ones that land in
neither. Fix it, and add a test that **fails against the pre-fix code.**

**If it turns out to be benign, say so with the evidence.** Do not fix
something that is not broken.

---

## 4. JOB 3 — the ladder, once, on the final engine, ALL THREE MODELS

**Only after jobs 1 and 2 pass.**

`python engine/lab/freeze_measure.py ladder`, read with
`python engine/lab/ladder_report.py`. Both written and tested by E-16.

**Models: `mistral/mistral-small`, `mistral/mistral-medium`,
`deepseek/deepseek-v3.2`.** Rungs 463 → 9,946 words, n=3 minimum.

**`deepseek` is the whole reason this re-run matters. It has NO ladder
measurement at all** — the budget cap landed on its first run. Every model
recommendation this project has made about deepseek since the freeze shipped
rests on two short-document samples. **If you measure nothing else, measure
deepseek across the ladder.**

**Report per cell:** n, median and worst seconds, failures with their exact
messages, **spans returned versus spans planned**, retries, and cost per run.

**Use `engine/lab/depth_by_paragraph.py` for rewrite depth, not whole-document
trigram overlap.** E-16 established that whole-document overlap is inflated by
internal repetition, which grows with document size (4.3% of trigrams repeat at
500 words, 83.5% at 10,000). Across rungs the raw metric is not sound.

### Two questions to answer

1. **Which model runs the site?** Currently `mistral/mistral-small`, chosen by
   default rather than by measurement because deepseek was never tested.
2. **Confirm or correct the 8,000-word limit.** E-16 recommends 8,000, down
   from the advertised 10,000, sized so 3 waves of 8 parallel calls fit inside
   the 240-second abort at the worst per-wave time ever recorded in production
   (~65s). **No model has ever actually crossed 240s in the lab, so this is an
   argument, not a measured crossing.** Confirm it, or produce a better number
   and show the working. **Hand the number back — the sentence is Lane D's.**

### ★ BUDGET, and the trap that stopped E-16

**The spend limit is on the KEY, and the credits endpoint does not show it.**
E-16 read `balance` as headroom; it is not. It reported `balance $14.99` while
the key was already at `total_used $10.005` against a **$10.00 cap**, and every
model returned **HTTP 402**. Its own $3.00 stop rule could never have fired,
because the key had $0.35 of headroom when the session started.

**Therefore:**
- Record `total_used` from `https://ai-gateway.vercel.sh/v1/credits` at the
  start and end. Put both at the top of your note. **Never call `balance`
  headroom.**
- **Stop immediately and report on the FIRST HTTP 402.** Do not retry it — the
  retry loop turns one refusal into eight and looks exactly like a model
  failing. E-16 misread two model failures as exactly this.
- **Stop and report if this session's own spend passes $2.00.**
- `mistral-medium` costs roughly 7x `mistral-small` per run. Budget accordingly.

### The operational trap that cost E-9 an hour

A gateway call can hang far past its timeout — urllib's timeout is per socket
operation and a dripping connection resets it. **`freeze_measure.py` runs every
run in a subprocess under a hard 240-second wall clock. Do not remove it.**

---

## 5. THINGS THAT CANNOT BE FIXED — never let these get promised

- **Whether a statistical watermark was removed is not measurable, by anyone.**
  Every number you produce measures how much original wording came back.
- **A term of art restated wrongly is not findable by a program.**
- **Invented facts and sources are not findable.**

## 6. TWO THINGS DELIBERATELY NOT IN THIS BRIEF

- **The hard-wrap gap.** A quotation containing a newline is invisible to
  `uc_spans._QUOTE`, so a hard-wrapped `.txt` gets almost no quote protection —
  measured 61.6% frozen unwrapped against 5.8% wrapped, same document. **It is
  Jon's ruling, not yours. Do not fix it.** If job 1 makes it worse or better,
  say so.
- **`docs/03-pricing.md` §4b**, whose "no request over two cents" rests on a
  60-second cap now set to 300. Outside your territory.

## 7. WHAT TO HAND BACK

`docs/session-notes/freeze-final-then-measure.md`, **written as you go, not at
the end.** Gateway `total_used` before and after, and the suite result, at the
top. Then each job. Then **a section titled "What I could not prove"** — the
best notes here lead with it.

Commit locally by explicit path as you go. **Leave nothing uncommitted.** Do
not push.

## 8. MODEL AND EFFORT

**Opus, high reasoning effort.** Job 1 is a rule that has already fooled two
careful sessions, and job 3 is a campaign whose expensive mistakes are silent.
