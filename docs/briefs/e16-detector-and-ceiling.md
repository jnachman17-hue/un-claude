# BRIEF — E-16 (the quotation detector) and the model/ceiling measurement

**Written by the conductor, 24 August 2026. Paste this whole file into a fresh
session. Two jobs, in order. Job 1 is code; job 2 is measurement.**

---

## 0. READ FIRST

Read `CLAUDE.md` in full — sections 1 (Jon is not a programmer), 4 (a run, not
an assertion) and 5 (stop and ask) govern everything you do. Then read
`docs/session-notes/e9-freeze.md`, which built the freeze you are about to
correct. **Do not read the other session notes** unless something below names
one; they are history and there are many.

**The verification standard, because it is the whole job:** an assertion that
something works carries no weight here. Run it and paste the real output. Show
the artefact, never a summary of it. **A step you skipped is a step that
failed — say you skipped it and say why.** State failures first and plainly.

---

## 1. YOUR TERRITORY, AND WHAT YOU MUST NOT TOUCH

**Yours:**
- `apps/web/engine/**` — the Python engine, principally `uc_spans.py`
- `engine/tests/**` — the test suite
- `engine/lab/**` — the measurement harnesses
- `docs/session-notes/e16-detector-and-ceiling.md` — your note, create it

**NOT yours, do not edit:**
- `apps/web/app/**` — the website and its copy. **The corrected word limit is
  a Lane D copy change and is NOT yours to make.** Hand the number back; someone
  else writes the sentence.
- `apps/web/lib/**`, `apps/web/vercel.json`, anything under `supabase/`
- `docs/IMPLEMENTATION-BOARD.md` — **the conductor is its only writer.** Never
  edit it. Put everything in your session note instead.

**Hard rules:**
- **Never `git add -A`, `git add .`, or `git commit -a`.** Stage by explicit path.
- **Sessions share one git index.** Run `git diff --cached --name-only` **as its
  own separate step** before every commit and read the output. Running the check
  inside the same command as the commit does not stop the commit.
- **Do not push. Do not deploy. Do not apply migrations.** Those are Jon's.
  Committing locally is yours.
- **Do not install anything or add a dependency** without asking Jon.

---

## 2. JOB 1 — E-16: the attribution cue fires on ordinary novel dialogue

### What is wrong

The freeze protects **attributed** quotations and leaves unattributed ones free.
That is Jon's ruling D2, and its reasoning is sound: a statistical watermark
lives where the model had a choice, so a real quotation carries little
watermark and freezing it is nearly free — while **invented dialogue is the
MOST watermarked text in a document**, and freezing it hands the customer back
the worst part untouched and charges for a rewrite.

`uc_spans._ATTRIBUTION` decides which is which by looking for a reportive verb
near the quote. **Seventeen of the verbs on that list are also standard fiction
dialogue tags**, so the rule fails exactly where D2 says the cost is highest.

### The measurements the conductor ran (reproduce these before changing anything)

Run against the shipping detector, no model involved.

**Test A — one realistic novel sentence per verb on the list:**

```
FICTION DIALOGUE LINES TESTED: 20   (none should ever freeze)
WRONGLY FROZEN: 17
```

Frozen: argued · warned · noted · observed · claimed · stated · declared ·
remarked · insisted · acknowledged · concluded · reported · asserted ·
maintained · contended · cautioned · emphasised.
Free: only `said`, `asked`, `replied`.

**Test B — the product-level number. Two short stories, same length, same
content, differing ONLY in which dialogue tags the author used:**

| Story | Words | Frozen |
|---|---|---|
| A — `said` / `asked` / `replied` | 124 | **0.0%** |
| B — `insisted` / `observed` / `argued` / `concluded` | 123 | **14.6%** (18 words, 4 spans) |

Both are 100% invented dialogue. Neither should freeze one word.

**Test C — this undermines E-9's own D2 demo.** `e9-freeze.md` section 5.3
reports a short story freezing 0 of 193 words and presents it as proof D2 works.
**That story uses only `said`, `asked` and `replied`.** The demo passed on the
story's word choices, not on the rule. Verify this yourself by reading the
story in `engine/lab/` and confirming its tags.

### The fix the conductor recommends — test the SUBJECT, not the verb

**Academic attribution names a source. Fiction uses a pronoun.**

| | Subject | Examples |
|---|---|---|
| All 17 false positives | a bare pronoun | "she argued", "he concluded" |
| All 5 correct freezes | a named source | "Smith puts it", "Orwell wrote", "the 2019 review", "The committee concluded", "Acton observed" |

So: **a reportive verb whose subject is a bare pronoun (I, you, he, she, it, we,
they) is not attribution.** On the conductor's sample this fixes 17 of 17 and
breaks 0 of 5.

**Keep the citation-shape path as an independent trigger** — `(Smith, 2019)`,
`(2019)`, `p. 47` must still freeze regardless of subject, because that is the
strongest signal a real source exists.

**This also fixes a known false positive:** epistolary fiction, «she wrote: "My
dearest Thomas…"», has a pronoun subject and correctly becomes free.

**The residual it accepts, and D2 says this is the cheap direction:** «As she
wrote in her 1987 essay, "…"» stops freezing, because a bare year is not a
citation shape. Being wrong toward free costs a few reworded phrases; being
wrong toward frozen hands back a paid-for rewrite undone. **Those are not the
same size.**

**THE RECOMMENDATION IS A HYPOTHESIS, NOT A RULING.** It is the conductor's
measurement on a small sample. **If your own testing says a different rule is
better, say so and show the numbers.** What is NOT negotiable is D2 itself:
attributed freezes, unattributed does not.

### What "done" looks like for job 1

1. **Reproduce tests A and B against the current code** and paste the output, so
   the before-state is on the record in your own run.
2. **Build the fix.**
3. **Re-run A and B and paste the after.** State the exact counts.
4. **Add a fiction corpus to the freeze suite** — at minimum one dialogue line
   per verb on `_ATTRIBUTION`, asserting none freezes, plus the five correct
   attribution shapes asserting all do. **This regression must be impossible to
   reintroduce silently.**
5. **The full engine suite must still pass.** Baseline is `800 passed, 1
   skipped`. Paste the real result. **Any test you had to change, name it and
   justify it** — a changed test is where a regression hides.
6. **Re-run E-9's own D2 demo** with the fix in and confirm it still freezes 0%.

---

## 3. JOB 2 — the model and the word ceiling are ONE measurement

**Do not start job 2 until job 1's tests pass**, because the ceiling must be
measured on the corrected freeze.

### The question

Two questions that share one dataset:

1. **Which model should run the site?** Candidates: `mistral/mistral-small`,
   `mistral/mistral-medium`, `deepseek/deepseek-v3.2`.
2. **What is the real maximum document size?** The site advertises **10,000
   words**. That number is a config default (`UC_MAX_WORDS`) that **nobody has
   ever verified.** Nothing in this project has run past ~520 words.

**They are the same measurement** because the ceiling is time, not money: the
site aborts a job at **240 seconds** (`lib/engine/client.ts`), Vercel kills the
function at 300. Chunks are ~350 words (`TARGET_WORDS`), up to **8 run in
parallel** (`MAX_WORKERS`). **So a slower model means a smaller document.**

### Why mistral-medium is back on the list

Jon raised it and he is right to. The earlier bake-off recommended deepseek
over medium — but **that bake-off ran before the freeze existed**, and its main
argument for deepseek was that deepseek left quotations alone while the mistrals
destroyed them. **The freeze now protects quotations on any model, so that
argument no longer decides anything.** What was recorded about medium: roughly
deepseek's quality, roughly deepseek's speed, **at about six times deepseek's
cost.** **Medium has never once been measured with the freeze on.**

### What the conductor already measured today (your baseline, verify it)

From `engine/lab/freeze_runs/results.jsonl`, delivered runs only:

| Model | median | worst | failures, freeze on | rewrite depth (lower = better) |
|---|---|---|---|---|
| mistral-small | **3.9s** | **11.2s** | **0 of 29** | **0.037** |
| deepseek-v3.2 | 31.2s | 191.5s | 3 of 24 | 0.089 |
| mistral-medium | — | — | **never tested** | — |

Live production, deepseek: **478 words took 64.982 seconds.**

### What to run

Use `engine/lab/freeze_measure.py`, which already does subprocess isolation and
a hard 240-second wall clock. Extend it rather than writing a new harness.

- **All three models**, freeze ON (both tiers), on a **document-size ladder**:
  roughly 500 / 1,000 / 2,000 / 3,000 / 5,000 / 7,500 / 10,000 words. Corpus
  documents already exist in `engine/lab/docs/`.
- **Enough runs per cell to have a denominator.** Report every number with n.
- **Record for every run:** seconds, cost, failure or not, retries, spans
  returned verbatim, fallbacks, and rewrite depth on the unfrozen text.
- **Find where each model crosses 240 seconds.** That crossing point, minus a
  safety margin you argue for, is the honest ceiling for that model.

### Two operational traps, both learned the hard way — read `07-runbook.md`

- **A gateway call can hang far past its timeout.** urllib's timeout is per
  socket operation and a dripping connection resets it. E-9 lost 15+ minutes to
  this. The subprocess wall clock in `freeze_measure.py` exists for this reason
  — **do not remove it.**
- **Timed-out calls bill invisibly.** A call abandoned at 45 seconds keeps
  generating and billing server-side and reports no usage back. Own-accounting
  once said $0.13 when the gateway said **$1.91**.

### BUDGET — a hard rule

**Read the AI Gateway balance before you start and after you finish, and put
both numbers at the top of your session note**, as E-9 did. **The live site
shares this key**, so some of the difference may be customer traffic — say so.

**If the campaign has spent more than $3.00, stop and report rather than
continuing.** Long documents at 29 chunks with retries are the expensive case
and the timeout billing above is invisible until you check.

### What "done" looks like for job 2

- A table of **seconds by model by document size, with n**, and the crossing
  point where each model exceeds 240 seconds.
- **One recommended model, with the reasoning**, covering speed, rewrite depth,
  failure rate under the freeze, and cost.
- **One recommended number for the advertised word limit** — a number Jon can
  put on the pricing page and defend. **Say what safety margin you applied and
  why.**
- **Say plainly what you could not measure.** If 10,000 words was never
  completed on any model, that is the finding, not a gap to paper over.

---

## 4. THE THINGS THAT CANNOT BE FIXED — never let these get promised

- **Whether a statistical watermark was removed is not measurable, by anyone.**
  Every number you produce measures how much original wording came back. Layer B
  is best effort and the site says so.
- **A term of art restated wrongly is not findable by a program.** "Beyond a
  reasonable doubt" came back as "with absolute certainty" and survived 1 of 40.
- **Invented facts and sources are not findable.**

---

## 5. WHAT TO HAND BACK

Write `docs/session-notes/e16-detector-and-ceiling.md` **as you go, not at the
end** — a session that dies loses everything unwritten. It must contain:

- The gateway balance before and after, and the suite result, at the top
- Job 1: the before numbers, the fix, the after numbers, the new tests
- Job 2: the full table, the model recommendation, the ceiling recommendation
- **A section titled "What I could not prove"** — the best notes in this project
  lead with it
- Anything you found that is outside your territory: **describe it, do not fix
  it**, and say which file it lives in

Commit locally by explicit path as you go. **Leave nothing uncommitted** —
three sessions have, and the conductor had to find it. **Do not push.**

---

## 6. MODEL AND EFFORT

Run this on **Opus with high reasoning effort.** Job 1 is a heuristic that has
already fooled one careful session by passing a test that was not adversarial;
job 2 is a measurement campaign where the expensive mistakes are silent.
