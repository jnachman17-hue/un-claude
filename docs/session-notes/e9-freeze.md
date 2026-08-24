# E-9 — the freeze, built

**24 August 2026, the last big engine build.** Board E-9, W10 phase 4, on the
re-scope in `lane-a-engine.md` step 6. **The freeze is built, on by default,
and every number below has a denominator.**

*(Measured sections are being filled from the live run — placeholder.)*

---

# 1. WHAT WAS BUILT, IN ONE PARAGRAPH

Before the model sees a chunk, the spans that must survive — headings,
attributed quotations, block quotes, reference entries — are swapped for
short placeholders like `[[17]]`; the model rewrites everything around them;
the real words go back afterwards. **The model never sees the protected
words, so it cannot change them.** A restore that cannot be verified falls
back to that one chunk's original text (D3), and past one third of the
document failing, the job refunds.

---

# 2. THE TWO RULES THAT KILLED THE LAST DESIGN — HOW EACH IS DEAD

**Rule 1 — no new detection.** `uc_freeze.plan_freeze` consumes
`uc_spans.detect_protected_spans` and contains no detector of its own. The
W10 verifier's breaking essay — a "Sources" heading over ordinary prose,
56.1% frozen 12 of 12 under the old design — is locked as a freeze test now
too: `test_sources_heading_over_prose_freezes_nothing_but_the_heading`
asserts the freeze plan for that essay is **one heading and nothing else**.

**Rule 2 — guards compare customer text to customer text.** In
`uc_chunk.one()` the tolerant restore now runs immediately after the model
returns, BEFORE the length guard, the leak guard and the fact guard, so
every guard sees (original unmasked chunk, unmasked output). The unit test
`test_mask_heavy_chunk_good_rewrite_is_not_refunded` pins the arithmetic of
the W8-shaped mistake both earlier designs made: a 50-word chunk, 40 words
of it one attributed quotation, whose masked input is ~11 words and whose
model output is ~30 words. Against the masked pair that is a 2.5x expansion
(the leak guard fires at 1.5x + 8); against the raw unmasked original it is
0.6x (the length guard floor is 0.7). **Both old orderings kill this exact
good rewrite and refund it. Restore-first delivers it: 0 retries, 0
figures flagged, span back character-for-character.**

---

# 3. JON'S RULINGS, AS IMPLEMENTED

**D1 — both tiers ship.** `structure` = headings; `quotes` = attributed
quotations, attributed block quotes, reference entries. Both on by default
(`UC_FREEZE_TIERS`).

**D2 — the discretion test, and one thing it forced.** Only ATTRIBUTED
quotations freeze. Implementing this surfaced a defect in the shipped
detector's cue list: it counted the narrative dialogue tags — *said, asked,
replied, told* — as attribution, and those are exactly the verbs a short
story is full of. Freezing on them would have frozen invented dialogue, the
most watermarked text in the document — the catastrophe D2's reasoning
names. The cue is now:

- a **reportive verb** (*wrote, argues, warned, noted, observed, according
  to, puts it, concluded, …*) in the **attributive position** — before the
  quote with no sentence boundary between, or within 20 characters after
  the closing mark. Position matters: a window-only test froze fiction
  whenever nearby narration used "argued" or "observed" in its plain sense.
- or a **citation shape** — `(2019)`, `(Smith, 2019, p. 47)`, `p. 47` —
  near the quote;
- for a **block quote**, the cue lives in the introducing text, and a
  lead-in ending with a colon ("The report concluded:") also counts —
  fiction almost never introduces invented text that way.

This narrowing changes the meaning of `quotes_attributed` in the report-only
protection block: it now counts freeze-grade attribution. One detector, one
proxy, used identically by the report, the freeze and the pre-flight —
deliberately, because two implementations of one number is the trap this
project has hit three times.

**What the narrowed cue deliberately lets through, stated plainly:** a
journalist's *«the minister said "…"»* does not freeze (narrative verb), and
epistolary fiction's *«she wrote: "…"»* freezes wrongly. Both residuals fall
on the side D2 chose: being wrong toward free costs a few reworded phrases;
being wrong toward frozen hands back a paid-for rewrite undone.

**D3 — hand back, explain, refund past a threshold.** A chunk whose restore
fails retries ONCE (Lane A's bound-new-retries-at-one rule), then falls back
to that chunk's own original text. The report's `layer_b.freeze` block
explains it in every case. **The threshold is one third of the document's
words** (`UC_FREEZE_REFUND_SHARE`): at or below, no refund — the customer
received the bulk of the rewrite plus the two provable layers; above it, the
job fails, which refunds. Why a third: below it the customer demonstrably
got most of a rewrite; above it "delivered" stops being honest; and a
customer engineering a refund must sabotage over a third of their own
document while keeping a document at most two-thirds rewritten — the least
attractive free good on offer. **Recorded as `04` entry 137; changes entry
22.** A single-chunk document that falls back is 100% failed and refunds —
correct, that customer got no rewrite at all.

**D4 — the pre-flight, engine half.** `billing_estimate` now carries
`freeze: {fraction, frozen_words, words, spans}` on every free text scan,
computed by `uc_freeze.freeze_fraction` — **the same plan the rewrite
runs**, so the fraction shown is the fraction delivered. The interface half
is Lane C's (board W-10): D4's wording is FIXED on the board, including the
louder prompt above 60%, and must not say "quotations" or "reduced removal".

---

# 4. THE MACHINERY, FOR THE NEXT SESSION

- **Mask per chunk, planned per document.** `plan_freeze` runs once on the
  whole document (the same call the pre-flight makes); spans map to chunks
  by exact offset — chunks are contiguous substrings of the document, which
  the byte-identity safety net proves. The mask/restore/fallback UNIT is
  the chunk, so one failure never spreads.
- **Mask ids via the engine's own `_numbers` reader, plus a substring
  test.** An id is refused if the chunk contains its value in digits OR in
  words, or its digits anywhere as a substring. Consequence the design
  leans on: **a bare id occurring anywhere in restored output is mask
  residue, never customer text** — which is what makes the bare-number
  restore safe (below) and the residue check sound.
- **Tolerant single-pass restore.** One regex pass over the model's output:
  `[[17]]`, `[17]`, `((17))`, `[[ 17 ]]`, `**[[17]]**`, `{17}`, and — the
  W10 verifier's second breaking case — the brackets stripped entirely,
  leaving the bare number alone on a line. W10's restore was "deliberately
  unable to touch a bare number" and delivered five of them to a customer;
  here the collision-free id choice makes the bare-line restore safe.
  Single-pass means restored customer text is never itself rescanned, so a
  quotation containing bracketed numbers cannot be corrupted
  (`test_restore_is_single_pass_and_never_rescans_restored_text`).
- **Verify after restoring:** every span present character-for-character at
  least as often as in the original chunk, and no id residue anywhere. Any
  problem → one retry → fallback.
- **The quotation MARKS freeze with the quote.** The mask covers `"…"`
  including the marks, so the drop-the-quote-marks defect (10/10 on
  mistral-medium in W10) cannot cost the customer theirs.
- **One repair interaction fixed.** `uc_repair`'s em-dash budget converts
  from the document's end backwards and could have converted a dash INSIDE
  a restored frozen span — breaking the character-for-character promise
  AFTER the freeze had verified it. It now skips any dash whose surrounding
  context appears verbatim in the input (the module's own
  condition-on-input principle): the customer's own dashes are never the
  ones sacrificed to the budget. Locked in
  `test_em_dash_inside_text_copied_from_the_input_is_never_converted`.

**Files:** `uc_freeze.py` (new), `uc_chunk.py`, `uc_spans.py`,
`uc_policy.py`, `uc_repair.py`; tests `test_freeze.py` (30 tests),
`test_spans_detector.py`, `test_repair.py`. **`server.py` and
`app/api/tool/**` untouched** — the freeze report and pre-flight ride
through existing plumbing (`layer_b.freeze`, `billing.freeze`; documented in
`API.md`). Env: `UC_LAYER_B_FREEZE`, `UC_FREEZE_TIERS`,
`UC_FREEZE_RETRIES`, `UC_FREEZE_REFUND_SHARE`.

**Suite: 796 passed, 1 skipped** (baseline 762 + 1). The byte-identity
safety net now runs THROUGH mask-and-restore on all 33 corpus documents,
with the freeze on — split, mask, restore, reassemble, byte-identical, no
model involved.

---

# 5. MEASURED ON THE LIVE GATEWAY

*(being filled)*

---

# 6. WHAT THIS DOES NOT DO, STATED PLAINLY

- **Terms of art and invented facts stay unfixed and unfindable.** "Beyond
  a reasonable doubt" came back wrong on every model measured (survived 1
  of 40 runs in W10); no program can find it, no freeze can protect it, and
  the site must keep steering around it.
- **Layer B stays best effort.** Nothing here measures watermark removal;
  every number is about how much of the original wording came back. The
  freeze makes one NEW sentence provable — "these spans came back exactly
  as sent, and here is the count" — and nothing more.
- **Unattributed quotations are rewritten on purpose** (D2), and the
  narrowed cue's residual misses are listed in section 3.
- **Nothing ran past ~520 words in this session's live runs.** Mask
  survival at 34-chunk scale is still unmeasured, as W10 warned.
