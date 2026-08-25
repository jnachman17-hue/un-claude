# BRIEF — the receipt cannot count, and the site promises three words

**Written by the conductor, 25 August 2026. Paste this whole file into a fresh
session.**

**One sentence: the site promises that no more than three of a customer's
original words survive in a row, and the real figure is up to 388.**

**This is a COPY job. There is no code in it.**

## ★ JON'S RULING, 25 August — READ BEFORE ANYTHING ELSE

**`lib/engine/receipt.ts` probes a fixed ladder `[3, 4, 5, 6, 8, 10]`, so 10 is
the largest number the receipt can ever print. Jon has ruled that it STAYS that
way. Do not change it, do not propose changing it, do not touch that file.**

**One consequence you MUST handle, and it is the reason this ruling needs care.**
The workbench currently tells a paying customer:

> *"Rewritten. The longest stretch of your original wording left is 10 words in
> a row."*

**That is stated as a fact about their own document and it is not one** — 10 is
the ceiling of the measurement, not the answer. A capped number reported as an
exact one is a false statement to someone who has paid.

**So the number must stop being presented as precise.** *"At least 10 words"*,
or no number at all, or some third thing you argue for. **This is wording, it
costs nothing, and it is the one thing that makes Jon's ruling honest.**

**There is also a real argument FOR the cap, and it should shape what you
write.** Now that quotations freeze on purpose, a long surviving run is usually
**the feature working as Jon ruled** rather than a failure — so a single
"longest run" number measures frozen text and rewritten text with the same
ruler and tells the customer nothing useful about either. **Copy that leans on
that number is copy built on a broken instrument.**

---

## 0. READ FIRST

Read `CLAUDE.md` in full. **Sections 1 (Jon is not a programmer), 4 (a run, not
an assertion), 7 (what the site is allowed to say) and 8 (think like the
visitor) all bite.**

**The `unclaude-messaging` skill fires automatically on copy work and governs
every word here.** It outranks your judgment. It is outranked by the documents
and by Jon.

**Then read `docs/session-notes/freeze-every-quotation.md` section 5.6**, which
measured this and handed the numbers back deliberately without writing a word
of copy.

**The verification standard:** an assertion carries no weight. Run it and paste
the real output. **A step you skipped is a step that failed — say so.**

---

## 1. THE FACTS, MEASURED. Reproduce them before you write anything.

**What the site says today**, in four places found by the conductor:

```
app/(marketing)/how-it-works/page.tsx            "...three word sequences."
app/(marketing)/_components/faq-items.tsx        "...three-word sequences with zero figures lost..."
app/(marketing)/_components/moat-section.tsx     "...three in a row come through."
app/(marketing)/_components/moat-section.tsx     "...three-word sequences broken, zero..."
app/(marketing)/_components/workbench/workbench.tsx:1183
        "Three words in a row is the most that survives..."
```

**Sweep for more. That list is what one grep found, not a guarantee.**

**What actually happens.** The freeze session measured the delivered documents
with `engine/lab/longest_surviving_run.py`:

```
The longest unbroken run of the customer's own wording in a delivered
document was 388 WORDS.
```

**Three separate causes, and they are NOT equally bad. This distinction is the
whole job:**

| Cause | Typical run | What it is |
|---|---|---|
| **A frozen span** | up to **57 words** | **The feature working exactly as Jon ruled.** A protected quotation IS an unbroken run of the customer's words |
| **A D3 chunk fallback** | ~**290–390 words** | The customer's own text handed back because the tool could not verify a restore. **A real shortfall** |
| **A lazy chunk** | up to **352 words** | The model returned a section barely changed |

**Even with no fallback and no lazy chunk, the freeze alone guarantees runs of
55 to 57 words.** Three is not a ceiling and it is not the right order of
magnitude.

## ★ THE ARGUMENT YOU MUST NOT LOSE

**"Three words in a row" is not decoration — it is the site's entire
anti-detection argument.** The reasoning runs: a statistical watermark rides on
unbroken stretches of the model's original word choices, so if only three
words in a row survive, there is no stretch left to carry it.

**Deleting the sentence and putting nothing there guts the pitch. That is a
failure, not a fix.**

**The true version is available and it is arguably stronger, because it is
checkable.** Jon's own D2 reasoning: **a watermark can only exist where the
model had a choice.** Inside a real quotation it had none — it reproduced fixed
text — so **the frozen spans carry little or no watermark to begin with.**
Meanwhile the text that IS rewritten is rewritten hard: measured overlap on the
unfrozen text runs 0.02 to 0.09, meaning **over 90% of the original three-word
sequences in the rewritten portion are gone.**

**So the honest claim is about the text we rewrite, and about telling the
customer exactly how much we did not.** Find that sentence. **It must survive
being read aloud by a college student on a phone who knows nothing yet.**

---

## 2. YOUR TERRITORY

**Yours:**
- `apps/web/app/(marketing)/**` — the copy
- `apps/web/app/(marketing)/_components/workbench/receipt-panel.tsx` and
  `workbench.tsx` — **only the WORDS around the number, never the arithmetic**
- `docs/session-notes/tell-the-truth-about-runs.md` (create it)

**NOT yours:**
- **`apps/web/engine/**` and `engine/**` — the Python engine. Not one file.**
- **`apps/web/lib/engine/receipt.ts` — RULED OUT BY JON. See section 3.**
- `apps/web/lib/server/**`, `apps/web/app/api/**`, `supabase/**`, `vercel.json`
- **`docs/IMPLEMENTATION-BOARD.md`, which only the conductor writes.**

**Hard rules:**
- **Never `git add -A`, `git add .`, `git commit -a`.** Stage by explicit path.
- **`git diff --cached` — THE DIFF, NOT THE FILE LIST — as its own SEPARATE
  step before every commit, and read it.** The conductor itself broke this rule
  by chaining the check to the commit with `&&`, so the warning scrolled past.
  **Three separate calls: add, then check, then commit.** A marketing session
  has uncommitted work in `docs/04-decision-log.md` and
  `docs/06-assumptions-and-open-questions.md` right now.
- **Do not push, deploy, or apply migrations.** Committing locally is yours.

---

## 3. JOB 1 — the sentence, in every place it appears

**Every fix here brings a claim DOWN to what is true. None goes up.**

**Rewrite the claim wherever it appears** — the four places above plus whatever
your sweep finds. **They must share one grammar**; a visitor reads more than one
of these pages and repeated elements that disagree read as carelessness
(`CLAUDE.md` section 8).

**Two things the new copy MUST do:**

1. **Distinguish the frozen text from the rewritten text.** A long run inside a
   protected quotation is the product working. A long run because a chunk came
   back unrewritten is not. **A sentence that blurs them is the same defect in
   a new place.**
2. **Not promise a number the receipt cannot guarantee.** Any figure you write
   must be one the product can stand behind on an arbitrary customer document.
   **If you cannot name a number honestly, do not name one.**

**DO NOT TOUCH:** *"100% of detectable marks removed"* is a settled ruling
(`04` entries 134–135). Jon reverted a change to it. **Byte for byte, do not
reopen it.**

---

## 4. JOB 2 — the advertised word limit: 10,000 → 8,000

**Handed back by two sessions, measured, and not yet written.**

The site advertises **10,000 words**. The engine's own ceiling is time: the site
aborts a job at 240 seconds. Documents run as waves of 8 parallel calls.

```
  8000 words -> 23 chunks -> 3 waves   at the worst per-wave time on record (65s) = 195s   FITS
 10000 words -> 29 chunks -> 4 waves   at the same rate                          = 260s   DOES NOT
```

**The number is 8,000. Do not re-derive it and do not raise it** — the reasoning
is in `freeze-every-quotation.md` §5.5. **Find every place 10,000 appears and
change it**, including any that phrase it as "about ten thousand" or "a
dissertation".

**`UC_MAX_WORDS` in the Python engine is NOT yours** — it is the engine's, and
the engine is another lane's. **If the site and the engine would then disagree,
say so loudly in your note and hand it back.** Two implementations of one number
is a trap this project has hit three times.

## 5. JOB 3 — "This can take about 10 seconds"

`workbench.tsx` tells a waiting customer the rewrite takes about 10 seconds.
**Measured on production: 65 seconds for 478 words on deepseek, 2.9 seconds for
a short paste on mistral-small.** In the lab a 10,000-word document ran 20–30
seconds.

**The honest version is not a single number** — it depends on the document and
the model. **Write something true for a customer watching a progress line, and
make sure it stays true if the model changes**, because the model is currently
under review.

## 6. JOB 4 — check D4's pre-flight wording still holds

Jon's ruling moved the frozen percentage up on any document containing
quotations, and a great deal on dialogue-heavy fiction (0.0% to 63.9% on one
short story). **D4's exact wording is FIXED on the board and you may not
improvise it.** Your job is only to confirm it still reads correctly now the
number behind it is larger, **and to flag it rather than change it if it does
not.**

---

## 7. HOW TO PROVE ANY OF THIS

**Show the artefact, never a measurement of it.**

- Every changed sentence **in full, before and after, as plain text Jon can read
  aloud.** No summaries.
- `tsc --noEmit` clean, and paste it.
- **Rendered and photographed at desktop and phone width** for anything whose
  layout could move.

## 8. WHAT TO HAND BACK

`docs/session-notes/tell-the-truth-about-runs.md`, **written as you go, not at
the end.** Every before/after in full, the receipt numbers, the screenshots, and
**a section titled "What I could not prove"** — the best notes here lead with
it.

**If you conclude a claim cannot be made true by rewording — that it has to go
entirely, or that Jon has to decide something — say so and stop.** That is a
legitimate result. The FAQ line *"it will not change your facts"* was previously
judged unfixable by rewording, and saying so was the right answer.

Commit locally by explicit path as you go. **Leave nothing uncommitted.** Do not
push.

## 9. MODEL AND EFFORT

**Opus, high reasoning effort.** This is the most exposed claim on a live
commercial site and the argument underneath it has to survive the correction.
**There is no code to write; every hard part is a sentence.**
