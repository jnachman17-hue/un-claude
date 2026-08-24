MODEL: Opus 5, high effort. **The largest brief on the board. It is meant
to run unattended overnight, so read the STOPPING RULES before you start.**

READ FIRST, IN THIS ORDER
1. **CLAUDE.md in full.** Section 4 governs and it is the whole point here.
   Section 5: stop and ask before overriding anything `docs/` has decided.
2. **docs/session-notes/rewrite-intelligence.md** — 12 categories, 3,500+
   measured runs, and the four-lane plan. **This is your primary input.**
3. **docs/session-notes/engine-limits.md** — what the last engine session
   already fixed and measured, so you do not redo it.
4. **docs/session-notes/f1-audit.md** — the engine findings, measured on
   the live site.
5. **docs/IMPLEMENTATION-BOARD.md**, Lane A.

TERRITORY: `apps/web/engine/**`, `apps/web/api/*.py`,
`engine/tests/**`, `engine/lab/**`, and this note.

DO NOT TOUCH: `lib/server/credits.ts`, `app/api/**` route handlers, the
workbench, the marketing or legal pages, `app/auth/**`,
`docs/IMPLEMENTATION-BOARD.md`. Other lanes own those.

**THE SITE IS LIVE AND TAKING REAL MONEY. Do NOT deploy. Do NOT push.**

═══════════════════════════════════════════════════
STOPPING RULES — you are running while Jon sleeps
═══════════════════════════════════════════════════
**COMMIT AFTER EVERY STEP.** If you run out of room at step 4, Jon keeps
steps 1–3. A session that finishes nothing because it tried everything is
worse than one that finishes half and says so.

**STOP AND WRITE IT UP RATHER THAN GUESS.** If you reach a question that
changes what a customer is charged, what the site claims, or which model
runs — **stop, record the options and your recommendation, and move to the
next step.** Do not decide it. `docs/` and Jon rank above your judgement.

**MONEY.** Read the AI Gateway balance at the start and again at the end
and report both. **If the balance drops below $3, stop running models,
finish what needs no model calls, and say so at the top of your note.**

**DO NOT SHIP THE FREEZE (step 6).** It is explicitly out of scope. See
the end of this brief.

═══════════════════════════════════════════════════
STEP 1 — THE SAFETY NET. Before any other code.
═══════════════════════════════════════════════════
`engine/tests/test_spans.py`. Take every test document, split it into
chunks and reassemble it **with no model involved at all**, and assert the
result is byte-identical to the input.

If the plumbing loses text on its own, every measurement taken afterwards
is meaningless. One agent's version passes 52 of 52 and **caught a failure
a substring count cannot see** — its own variant reported "64 of 64 block
quotes returned" while four of them sat un-indented at the end.

═══════════════════════════════════════════════════
STEP 2 — REPAIR. Free, model-independent, ships immediately.
═══════════════════════════════════════════════════
The tool currently returns documents carrying punctuation and markup the
customer never typed. Measured over 228 real stored outputs:

```
curly apostrophe   819    markdown asterisk  644
curly quote         98    em dash            359
214 of 228 outputs carried at least one
```

**JON'S RULING, AND IT CHANGES THE TARGET. Read this carefully.**

> *"Em dashes are a tell-tale sign to visitors it might be AI but have
> nothing to do with AI watermarking. They aren't the thing leaving a
> fingerprint whatsoever. Don't want our sanitisation to spit out a
> massive amount of em dashes. But some are okay. We don't need a strict
> zero em dashes rule."*

**So the rule is NOT "strip everything". It is "do not return a document
that looks more machine-written than the one that arrived."** Three
different treatments, and do not collapse them into one:

- **Markdown the input never had — REMOVE IT.** A `**bold**` that arrives
  in a Word document as literal asterisks is corruption of their file, not
  a style choice. Strict.
- **Apostrophes and quote marks — MATCH THE INPUT.** If they typed
  straight apostrophes, return straight apostrophes. This is restoring
  their text, not imposing a preference.
- **Em dashes — DO NOT INFLATE.** If the input had none and the output has
  95, that is the tool adding a visible AI tell to a document that had
  none. If the input used them, leave them alone. **Target the input's own
  rate, not zero.** A document that arrives with em dashes should come back
  with em dashes.

**Also here:** put the digits back where the model spelled a year out
(`2028` → "two thousand twenty-eight"), which the engine's own rule 5a
already forbids.

**Report the cost in trigram overlap.** W10 measured the strict version at
median +0.0000. Yours should be at least as cheap.

═══════════════════════════════════════════════════
STEP 3 — FIX. Six things provably wrong, all model-independent.
═══════════════════════════════════════════════════
- **Move the invisible-character pass BEFORE the rewrite in `server.py`.**
  Today the rewrite runs first and destroys zero-width characters as
  collateral, **so layer A reports removing nothing from a document that
  arrived carrying two.** Verified both ways in W10. This is the single
  most embarrassing defect in the engine: the one layer that can be proved
  is being measured after something else has already erased its evidence.
- Count words in a way that works in Chinese, Japanese and Thai.
- The four number-reader bugs in `rewrite-intelligence.md` §4.2.
- **Never end a chunk on a lone equation, table or placeholder.** One real
  693-word lab report went from 9.0 model calls to 2.0 and 61% cheaper,
  with job failures from 2 of 8 to 0 of 8.
- Stitch a torn code fence back together before anything looks at it.
- Bound every new retry at one. Eight retries against one returned the
  identical 80 of 80 spans for 82% more calls and a **less** rewritten
  document.

**Also in this step, two handed over from other lanes:**
- **`engine/score_stylometry.py` flags the ordinary words "in the world"**
  as an AI marker. Lane E audited it and found more than one bad phrase —
  read their note. **A false positive here is the product accusing a
  customer's own writing of being machine-written.** Report what you
  change; what the scanner claims to detect is a product claim and belongs
  to Jon.
- **Our cost per run is sent to every browser.** `api/_shared.py` keeps
  token counts and cost out of `usage`, and then the same figures ride
  along inside `report.layer_b.usage`, which `strip_server_paths` does not
  touch. Anyone can open the network tab and read what a run costs us.

═══════════════════════════════════════════════════
STEP 4 — REPORT. Free, changes no output, and it is the instrument.
═══════════════════════════════════════════════════
Ship the detector and the deterministic checks with **the freeze OFF and
nothing raising.** It costs no model calls.

**This is what makes step 5 possible.** It is the first measurement of how
often a real document's quotation, heading or reference is rewritten, and
it is the yardstick you will compare models against. Every number in W10
came from documents the agents wrote themselves.

**Also surface `structure_kept`.** The engine already computes it and sets
it false when a paragraph goes missing, and **no file anywhere reads it.**
The engine knew an equation had been deleted and told nobody.

═══════════════════════════════════════════════════
STEP 5 — THE MODEL BAKE-OFF. Jon's idea, and it belongs here.
═══════════════════════════════════════════════════
**Only six models have ever been tried, all chosen when cost was the
constraint, and two of the six timed out.** Jon's ruling: capability
matters more than cost, **open weights only — no frontier models.**

**Enumerate what the gateway actually offers today.** Do not work from any
list in these documents, including this one — they are weeks old.

Test the credible candidates against **step 4's harness**, and measure:

- **How much of W10's defect list does each model simply not do?** That is
  the real question. Every quotation it leaves alone is masking machinery
  nobody has to build.
- Trigram overlap — the product's core measure, lower is better.
- **Speed.** **The ceiling is time, not money.** A better-but-slower model
  shrinks the document size that can be served, and the site currently
  aborts at 240 seconds. A model that is 20% better and twice as slow may
  be worse for this product.
- Timeouts and failures.
- Cost per 1,000 words, for the record rather than as a deciding factor.

**Recommend one, with the numbers. Do not switch it** — the model is a
Vercel environment variable and it is Jon's to set.

═══════════════════════════════════════════════════
STEP 6 — RE-SCOPE THE FREEZE. Write it down. DO NOT BUILD IT.
═══════════════════════════════════════════════════
The masking design exists in `rewrite-intelligence.md` §8. **It must not
ship, and its own adversarial verifier is the reason:**

- **The "Sources" latch.** The detector treats a line reading *Sources*,
  *References*, *Bibliography* or *Works cited* as the start of a
  reference list **and never stops.** A 221-word history essay with a
  "Sources" heading over ordinary prose came back **56.1% frozen, 12 of 12
  runs.** The customer pays for a rewrite and gets their own essay back.
- **The guards run on the masked chunk.** A flawless rewrite produced
  `FactsLost` complaining about the mask number itself, and a mask-heavy
  chunk produced `LeakSuspected` → retry → **fail the job and refund a
  customer whose rewrite was perfect.** That is the W8 mistake exactly.

**Your job is to say how much of it is still needed** given what step 5's
best model already gets right — and to write down what the latch fix and
the guard-ordering fix actually are. **Nothing more.**

═══════════════════════════════════════════════════
JON'S SETTLED RULINGS — do not reopen these
═══════════════════════════════════════════════════
- **D1: ship both tiers** — structure and quotations.
- **D2: freeze attributed quotations, leave unattributed ones free.** The
  reasoning is Jon's: a watermark is embedded through the model's word
  choices, so it can only exist where the model had a choice. **Inside a
  real quotation it had none**, so freezing costs almost nothing real. **It
  inverts for invented dialogue**, where the model chose every word — so
  freezing a short story's dialogue hands back the most watermarked part
  untouched. **The test is discretion; the attribution cue is the proxy.**
- **D3: hand back the failing chunk, explain, and refund — WITH A
  THRESHOLD.** One chunk failing: hand back and explain, no refund. A
  meaningful share failing: refund. Without the threshold, anyone who can
  trip the freeze on purpose gets the work and the money. **This changes
  `04` entry 22.**
- **D4:** the pre-flight wording is fixed in the board. Do not improvise it.
- **D5: model decision is Jon's**, after your step 5.

═══════════════════════════════════════════════════
FINISHING
═══════════════════════════════════════════════════
Jon is not a programmer and cannot check this by reading code. **Every
claim needs the real before and after pasted in.** Rates need denominators
— "9 of 10 runs", never "sometimes". Report per model; the two tested so
far fail at completely different things and averaging hides it.

**A step you skipped is a step that failed. Say which, at the top.**

Write `docs/session-notes/lane-a-engine.md`.

Before EVERY commit run `git diff --cached --name-only` and confirm only
your own files are listed. Never `git add -A`, `git add .` or
`git commit -a`. **Do NOT deploy. Do NOT push.**
