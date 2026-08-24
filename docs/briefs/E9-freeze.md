MODEL: Opus 5, high effort. **This is the last big engine build, and its
own adversarial verifier already broke an earlier version of it. Read
STEP 0 before writing any code.**

READ FIRST, IN THIS ORDER
1. **CLAUDE.md in full.** Section 4 governs. Section 5: stop before
   overriding anything `docs/` has decided.
2. **`docs/session-notes/rewrite-intelligence.md`** — §8 the design, and
   **§9 what the adversarial verifier broke.** §9 is the important half.
3. **`docs/session-notes/lane-a-engine.md`** — **STEP 6**, which resolved
   both blockers, and **STEP 5**, which changed how much this must do.
4. `docs/IMPLEMENTATION-BOARD.md`.

TERRITORY: `apps/web/engine/uc_spans.py`, `uc_chunk.py`, `uc_policy.py`,
a new masking module, `engine/tests/**`, and this note.

DO NOT TOUCH: `apps/web/engine/text_unicode.py` and
`apps/web/app/api/tool/**` — **another session may still be in those.**
Not `lib/server/credits.ts`, not the workbench, not the marketing or
legal pages, not `docs/IMPLEMENTATION-BOARD.md`.

**Run `git status` first and say what you find.**

**THE SITE IS LIVE AND TAKING REAL MONEY. Do NOT deploy. Do NOT push.**

═══════════════════════════════════════════════
WHAT THIS IS, IN ONE PARAGRAPH
═══════════════════════════════════════════════
When the tool rewrites a document it also rewrites the parts that were
quoted from somewhere else, so a student's citation comes back with words
the source never said. **Three runs out of three, on a quotation
attributed to a named person.** The fix: before the model sees a chunk,
replace the spans that must survive with short placeholders, let it
rewrite everything around them, then put the real words back. **The model
never sees them, so it cannot change them.**

═══════════════════════════════════════════════
STEP 0 — THE TWO RULES THAT KILLED THE LAST DESIGN
═══════════════════════════════════════════════
**RULE 1 — REUSE `detect_protected_spans`. DO NOT WRITE YOUR OWN
DETECTION.**

The earlier design treated any line reading *Sources*, *References*,
*Bibliography* or *Works cited* as the start of a reference list **and
never stopped** — every paragraph to the end of the document got frozen.
A 221-word history essay with a "Sources" heading over ordinary prose came
back **56.1% frozen, 12 of 12 runs.** The customer pays for a rewrite and
receives their own essay.

**Lane A already fixed this by construction** in `uc_spans.py`: a
paragraph after such a heading is a reference entry **only if it looks
like one** — a bracketed year, a DOI, a URL, a page range, a publisher —
and the section ends at the first paragraph that does not. Locked in
`engine/tests/test_spans_detector.py`. **The latch can only come back if
you write new detection. Do not.**

**RULE 2 — EVERY GUARD COMPARES CUSTOMER TEXT TO CUSTOMER TEXT, NEVER THE
MASKED PAIR.**

In `uc_chunk.one(i)` the restore must run **first**:

```
model output --> tolerant restore (masks -> real text) --> THEN the guards,
                 each comparing (original unmasked chunk, unmasked output)
```

Both earlier designs did the opposite. Against the committed code that
produced `FactsLost` complaining about **a mask number itself**, and
`LeakSuspected` on a mask-heavy chunk — the masked input is short, so a
normal-length rewrite reads as a 4.3x expansion — which retried and then
**failed the job and refunded a customer whose rewrite was perfect.**

**That is the W8 mistake exactly: a guard that fires on good work.** It is
worse than the defect it prevents. **Prove your guards do not fire on a
mask-heavy chunk whose rewrite is good.**

═══════════════════════════════════════════════
JON'S SETTLED RULINGS — implement these, do not reopen them
═══════════════════════════════════════════════
**D1 — ship both tiers.** Structure (headings) and quotations.

**D2 — freeze ATTRIBUTED quotations; leave unattributed ones FREE.** The
reasoning is Jon's and it decides edge cases, so understand it rather than
just obeying it:

> A statistical watermark is embedded through the model's **word choices**,
> so it can only exist where the model had a choice. **Inside a real
> quotation it had none** — the words came from a source — so freezing
> costs almost nothing real. **It inverts for invented dialogue:** ask a
> model for a short story and it chose every word inside the quotation
> marks, so that dialogue is watermarked like the narration around it.
> **Freezing it would hand back the most watermarked part of the document
> untouched, and charge for a rewrite.**

**So the test is: did the model have discretion over these words?** The
attribution cue — "Smith wrote", "according to" — is the machine-readable
proxy. **A short story full of dialogue must come back rewritten.**

**D3 — when the freeze fails: hand back that chunk unrewritten, explain,
and refund WITH A THRESHOLD.** One chunk failing: hand back and explain,
**no refund**, because they received the work. A meaningful share failing:
refund the job. **Without the threshold, anyone who can trip the freeze on
purpose gets the work and their money back.** Choose the threshold, say
what you chose and why. **This changes `04` entry 22 — record it.**

**D4 — tell the visitor what fraction will be frozen, before they pay.**
The wording is FIXED. Do not improvise it:

> **We will return about 42% of this document exactly as you sent it.**
> That's text we've protected from being reworded — quotations, references
> and similar — so it comes back character for character. The other 58%
> gets the full rewrite.
>
> **Continue** · **Cancel**

**It must NOT say "to keep quotations verbatim"** — the program knows what
it froze, not that it found a quotation. **And it must NOT say removal is
reduced** — by D2's reasoning the frozen spans carry little watermark, and
layer B is unverifiable in both directions. **Above 60% frozen, make the
prompt louder.** The engine returns the number; the interface is another
lane's, so hand that half over.

═══════════════════════════════════════════════
THE BUILD
═══════════════════════════════════════════════
- **Mask per chunk, not per document**, with a **per-chunk fallback** — a
  restore failure in one chunk falls back to that chunk's original text
  (D3), it does not fail the document.
- **Choose mask tokens by asking the engine's own `_numbers()` reader what
  values the chunk already contains**, so a mask can never collide with a
  real figure.
- **Tolerant single-pass restore** — the model will not always return a
  placeholder byte-perfect.
- **Verify after restoring:** every protected span present, character for
  character. If not, that chunk falls back.

═══════════════════════════════════════════════
WHAT THE BAKE-OFF CHANGED — read STEP 5 before sizing this
═══════════════════════════════════════════════
The recommended model changes the workload:

- **Quotations rewritten fell from 6-of-8 to 4-of-16**, and two of those
  four were boundary shifts rather than rewordings. **The quotation tier
  still ships (D1) but its failure surface — and how often D3's hand-back
  path fires — is much smaller than the original numbers suggested.**
- **The structure tier is still clearly needed: even the new model renames
  about 1 in 6 headings.**
- **Confirm which model is live before you measure anything**, and say
  which one your numbers are from. It may or may not have been switched.

**What this can never fix, and must not be claimed:** terms of art and
invented facts. *"Beyond a reasonable doubt"* came back as *"with absolute
certainty"* and survived **1 of 40 runs**; that fails on every model and
**is not findable by a program.**

═══════════════════════════════════════════════
THE COST, AND IT IS THE THING TO WATCH
═══════════════════════════════════════════════
**Report the cost in trigram overlap, measured.** The original estimate
was **+0.016** for structure and **+0.079** with quotations. Lower overlap
is better — it means more of the wording genuinely changed — so **anything
that pushes it up is spending the product's whole purpose.**

**A protection that freezes half a document defeats the product.** If your
numbers come out far above those figures, **stop and report** rather than
shipping it.

**Read the AI Gateway balance at the start and the end and report both.**
Stop running models if it drops below $3.

═══════════════════════════════════════════════
FINISHING
═══════════════════════════════════════════════
Jon is not a programmer. **Rates need denominators** — "9 of 10", never
"sometimes". Paste real before-and-after. **Show a short story full of
dialogue coming back rewritten** (D2) and **a mask-heavy chunk whose good
rewrite is NOT refunded** (Rule 2). Those two are the ones that go wrong.

A step you skipped is a step that failed. Say which, at the top.

Write `docs/session-notes/e9-freeze.md`.

Before EVERY commit run `git diff --cached --name-only`. Never
`git add -A`, `git add .` or `git commit -a`. **Do NOT deploy or push.**
