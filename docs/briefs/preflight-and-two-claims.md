# BRIEF — build the pre-flight, and restore two claims Jon has ruled on

**Written by the conductor, 25 August 2026. Paste this whole file into a fresh
session. Two jobs. Job 1 is a ruling of Jon's that was never carried out.**

---

## 0. READ FIRST

Read `CLAUDE.md` in full. **Sections 1 (Jon is not a programmer), 4 (a run, not
an assertion), 7 (what the site may say) and 8 (think like the visitor) all
bite.** The **`unclaude-messaging` skill fires automatically** on this work and
governs every word; it is outranked by the documents and by Jon.

**The verification standard:** an assertion carries no weight. Run it and paste
the real output. **A step you skipped is a step that failed — say so.**

---

## 1. JOB 1 — THE PRE-FLIGHT. It was ruled, the engine half shipped, the screen half never existed.

### What is missing

**Jon's ruling D4:** before a visitor pays, they are told what share of their
document will come back exactly as they sent it, and given Continue / Cancel.

**The engine has been sending that number since E-9.** Live production, free
scan, no model call:

```
"billing": { "credits": 1, "words": 36,
             "freeze": {"fraction": 0.5, "frozen_words": 18, "spans": {"quote": 1}} }
```

**Half that document comes back unrewritten, the engine knows it, and nothing
tells the customer.** Verified three ways: the wording appears nowhere in
`apps/web/app`, **nothing anywhere reads `billing.freeze`**, and board **W-10**
has been open the whole time.

### ★ JON'S AMENDMENT, 25 August — this changes D4

**ONE standard message. No louder variant above 60%.** D4 originally specified
an escalated prompt at 60%; **Jon has removed it.** One message, one tone, fired
above a single threshold. **Record the amendment in `docs/04-decision-log.md`.**

### The threshold — measured, with a recommendation

Frozen fraction across the corpus plus two realistic extras, run against the
shipping engine:

```
document                    words   frozen
doc_1000 … prose_2500        1260+    0.0%   (no quotations at all)
ladder_10000                 9946   23.9%
ladder_7500                  7498   24.4%
ladder_5000                  4958   24.8%
ladder_2000                  1942   25.9%
ladder_3000                  2971   26.0%
ladder_500                    463   28.3%
ladder_1000                   919   29.7%
essay with quotes (short)      44   52.3%
dialogue-heavy story           52   69.2%
```

**There is an empty band between 29.7% and 52.3%.** Ordinary academic documents
cluster tightly at 24–30%; quote-dense and fiction documents start at 52%.
Nothing lands in between.

```
fires above 25%:  6 of 14 documents     <- catches ordinary essays. Noise.
fires above 30%:  2 of 14
fires above 35%:  2 of 14               <- RECOMMENDED
fires above 50%:  2 of 14
```

**RECOMMENDED THRESHOLD: 35%.** It sits in the empty band with margin on both
sides — above the ordinary cluster's top (29.7%) so a normal essay never
interrupts anyone, and below the quote-dense floor (52.3%) so the documents that
need the warning always get it.

**★ A WARNING THAT FIRES ON ORDINARY WORK IS WORSE THAN NO WARNING.** This
project has nearly shipped that mistake twice and it is written into the
handoff. **At 25% it fires on six of fourteen documents including plain
essays — that is the failure mode, not the safe direction.**

**My corpus is 14 documents and two of them I wrote. WIDEN IT AND RE-MEASURE
before committing to a number.** If your data says a different threshold, say
so and show it. **Make the number one named constant with the reasoning beside
it**, so it can be tuned without a code hunt.

### ★ THE WORDING — and one clause in D4 is now FALSE

D4's exact wording is fixed on the board:

> **We will return about 42% of this document exactly as you sent it.**
> That's text we've protected from being reworded — quotations, references and
> similar — so it comes back character for character. **The other 58% gets the
> full rewrite.**
>
> **Continue · Cancel**

**Three problems, and you must not ship it unchanged:**

1. **"The other 58% gets the full rewrite" is measurably false about half the
   time.** Jon's every-quotation ruling introduced chunk fallbacks: when the
   engine cannot verify a restore it hands that ~350-word block back as the
   customer's own text. **Measured: 13 fallbacks in 21 runs on mistral-small, 5
   in 21 on deepseek.** So the remainder does NOT reliably get the full rewrite.
   **Propose a replacement for that clause and flag it to Jon. Do not ship the
   false version and do not quietly delete the reassurance either.**
2. **It carries an em dash into visitor-facing copy, against Jon's own style
   rule.** Take it out whatever else you do.
3. **The percentages are illustrative.** Render the real number.

**Two things the message must NOT say, and these are still governed:**
- **Not "to keep quotations verbatim."** Headings, block quotes and reference
  entries freeze too, so "quotations" alone is incomplete.
- **Not that freezing reduces watermark removal.** By Jon's D2 reasoning the
  frozen spans carry little watermark, so that warning understates the product,
  **and it is unprovable in either direction anyway.**

### Where it goes

`apps/web/app/(marketing)/_components/workbench/**`. It appears **after the free
scan and before the spend** — the scan already returns `billing.freeze` and
costs nothing, so the number is in hand before any credit moves.

**Cancel must cost nothing.** Continue proceeds exactly as today.

### Done looks like

- **A real scan through the running site**, paste text with quotations, and
  **the actual dialog screenshotted at desktop and phone width.**
- **Show it NOT firing** on an ordinary document below the threshold — that is
  the half that proves it is not noise.
- **Show the number matching what is delivered.** `billing.freeze.fraction` and
  the rewrite use the same plan, so they must agree. **Two implementations of
  one number is the trap this project has hit three times.**
- `tsc --noEmit` clean.

---

## 2. JOB 2 — restore two claims. JON HAS RULED. Do not reopen.

**Jon has ruled that both stay.** The conductor argued against both with
measurements and **he has reaffirmed. His instruction is the higher authority
(`CLAUDE.md` section 2). Implement it.**

The last copy session removed them; they must go back.

**Claim 1 — "over 90% of three-word sequences broken."**
**Claim 2 — "zero figures lost."**

**Where they were, and where they must return:**

```
apps/web/app/(marketing)/_components/faq-items.tsx
    the answer to "Why can't I just ask another AI to reword it?"
    (homepage FAQ, and it is collapsed by default)
apps/web/app/(marketing)/how-it-works/page.tsx
    the rewrite rules — "Facts held, character for character"
```

**`"Zero figures lost across our test set."` is STILL LIVE on `/how-it-works`**
and does not need restoring there. **Check before you edit** — restore only what
is actually gone.

**Both were scoped "across our test set" in their original form. Keep that
scoping.** It is the difference between a measured claim and an absolute one,
and it is what makes them defensible at all.

**Do not invent new supporting numbers, and do not strengthen either claim.**
Restore the wording, fit it to whatever sentence now surrounds it, and print
both before and after in full.

**For the record, and do NOT act on it — it is written down so nobody
re-derives it:** across 63 measured runs the 90% figure holds on 18, with a
median of 81.5%, and on deepseek 3 of 21. A year was measured vanishing from a
live document and the figure counter reported 21 figures on a document
containing none. **Jon knows all of this and has ruled. Record it in
`04` beside the ruling and move on.**

---

## 3. YOUR TERRITORY

**Yours:** `apps/web/app/(marketing)/**` · `docs/04-decision-log.md` (the D4
amendment and the ruling record) ·
`docs/session-notes/preflight-and-two-claims.md` (create it).

**NOT yours:** **`apps/web/engine/**` and `engine/**` — an engine session may be
capping the word limit; do not touch a file under either** ·
`apps/web/lib/engine/receipt.ts` (**ruled off-limits by Jon**) ·
`apps/web/lib/server/**` · `supabase/**` · `vercel.json` ·
**`docs/IMPLEMENTATION-BOARD.md`, conductor only.**

**Hard rules:**
- **Never `git add -A`, `git add .`, `git commit -a`.** Stage by explicit path.
- **`git diff --cached` — THE DIFF, NOT THE FILE LIST — as its own SEPARATE
  step before every commit, and read it.** Three calls: add, check, commit.
  **The conductor itself broke this by chaining them with `&&`.** A marketing
  session has uncommitted work in `docs/04-decision-log.md`, which you also
  need. **Read that file's diff every single time.**
- **Do not push or deploy.** Committing locally is yours.
- **No new dependencies.**

## 4. WHAT TO HAND BACK

`docs/session-notes/preflight-and-two-claims.md`, **written as you go.** Every
sentence before and after in full, the threshold data and the number you chose,
screenshots at both widths, and **a section titled "What I could not prove."**

**If the false clause in D4 cannot be replaced without a decision from Jon, stop
and say so.** That is a legitimate result.

Commit locally by explicit path. **Leave nothing uncommitted.** Do not push.

## 5. MODEL AND EFFORT

**Opus, high reasoning effort.** Job 1 is the last thing standing between a
paying customer and an unpleasant surprise, and its failure mode — a dialog that
interrupts ordinary work — is one this project has nearly shipped twice.
