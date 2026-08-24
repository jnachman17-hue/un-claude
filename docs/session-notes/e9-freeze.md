# E-9 — the freeze, built

**24 August 2026, the last big engine build.** Board E-9, W10 phase 4, on the
re-scope in `lane-a-engine.md` step 6. **The freeze is built, on by default,
and every number below has a denominator.**

**Nothing was skipped, with two honest bounds:** nothing ran past ~520 words
live (section 6), and the live model could not be confirmed — the permission
layer refused to read production's environment, so **both candidate models
were measured and every number says which it came from.** As of every
written record, the live model is `mistral/mistral-small`; D5's switch to
deepseek is not recorded anywhere as made.

```
AI Gateway balance at start   $15.3948425132   2026-08-24T18:12:46Z
AI Gateway balance at end     $15.3552562692   2026-08-24T19:21:33Z
                              --------------
SPENT                         $ 0.0395862440   (108 measured runs: two
                                                44-run campaigns, 16 debug
                                                runs, 4 baseline patches;
                                                the live site shares this
                                                key, so some fraction may
                                                be customer traffic)
engine suite                  797 passed, 1 skipped   (baseline 762 + 1)
Deployed or pushed            NOTHING
```

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
`uc_policy.py`, `uc_repair.py`; tests `test_freeze.py` (31 tests),
`test_spans_detector.py`, `test_repair.py`. **`server.py` and
`app/api/tool/**` untouched** — the freeze report and pre-flight ride
through existing plumbing (`layer_b.freeze`, `billing.freeze`; documented in
`API.md`). Env: `UC_LAYER_B_FREEZE`, `UC_FREEZE_TIERS`,
`UC_FREEZE_RETRIES`, `UC_FREEZE_REFUND_SHARE`.

**Suite: 797 passed, 1 skipped** (baseline 762 + 1). The byte-identity
safety net now runs THROUGH mask-and-restore on all 33 corpus documents,
with the freeze on — split, mask, restore, reassemble, byte-identical, no
model involved.

---

# 5. MEASURED ON THE LIVE GATEWAY

Three documents through the real engine path — `rewrite_long`, then repair,
exactly as `server.py` wires it — on `mistral/mistral-small` and
`deepseek/deepseek-v3.2`, across three arms: freeze off, structure tier
only, both tiers. Every run in its own subprocess under a hard 240-second
wall clock (see section 5.6 for why). Raw rows:
`engine/lab/freeze_runs/results.jsonl`; full outputs beside it.

The documents, with the D4 pre-flight fraction each would show a visitor:

| Document | Words | Pre-flight, both tiers | structure only |
|---|---|---|---|
| essay — headings, one attributed quote, one introduced block quote, 3 references; the shape W10 priced | 517 | **23.6%** | 3.3% |
| short story — invented dialogue throughout (D2's demo) | 193 | **0.0%** | 0.0% |
| mask-heavy — 70% one attributed quote + one block quote (rule 2's demo) | 114 | **71.9%** | 4.4% |

## 5.1 Every frozen span came back, character for character

**132 of 132 spans across all 20 delivered frozen-arm runs. Zero chunk
fallbacks.**

| Cell | Spans verbatim | Fallbacks | Runs |
|---|---|---|---|
| essay · mistral-small · structure | 24/24 | 0 | 4 |
| essay · mistral-small · both | 44/44 | 0 | 4 |
| essay · deepseek · structure | 18/18 | 0 | 3 |
| essay · deepseek · both | 22/22 | 0 | 2 |
| mask-heavy · mistral-small · both | 12/12 | 0 | 4 |
| mask-heavy · deepseek · both | 12/12 | 0 | 4 |

A real pair from the essay (mistral-small, both tiers). The attribution
verb was rewritten; the 24 words inside the marks were not, because the
model never saw them:

```
IN   As Smith puts it, "the change in start time did more for attendance
     than any intervention we had previously funded, including the two
     years we spent on automated parent messaging" (p. 47).

OUT  As Smith observes, "the change in start time did more for attendance
     than any intervention we had previously funded, including the two
     years we spent on automated parent messaging" (p. 47).
```

The reference entry came back byte-exact — `Smith, J. A., & Jones, R. B.
(2019). Later start times and adolescent attendance. Journal of School
Health, 89(4), 331-339.` — where W10 measured invented authors in 23 of 41
runs on the same model family.

## 5.2 The cost in trigram overlap — raw, and on the unfrozen text

Mean per cell (lower = more rewritten). The second number strips every
would-freeze span from BOTH sides before measuring, which is the honest
measure of spent aggressiveness: by D2's ruling the frozen spans carry
little watermark, so their surviving trigrams are not the product failing.

| Essay (23.6% frozen) | off | structure | both |
|---|---|---|---|
| mistral-small, raw | 0.1413 (n=4) | 0.1716 (n=4) **+0.030** | 0.2554 (n=4) **+0.114** |
| mistral-small, unfrozen text only | 0.0628 (n=4) | 0.0628 (n=4) **+0.000** | 0.0416 (n=4) **−0.021** |
| deepseek, raw | 0.3027 (n=4) | 0.2456 (n=3) | 0.2933 (n=2) |
| deepseek, unfrozen text only | 0.0693 (n=4) | 0.0889 (n=3) **+0.020** | 0.0885 (n=2) **+0.019** |

**What this says, plainly.** The raw cost on this essay — +0.030 structure,
+0.114 both — is above W10's published +0.016/+0.079, **and the unfrozen
columns show why: the whole rise is the frozen words themselves.** On
mistral-small the text the freeze leaves free is rewritten exactly as hard
with the freeze on as off (0.063 → 0.063 and 0.042); on deepseek it clings
slightly (+0.02), the same effect W10 measured. W10's own conclusion —
*"the whole cost of the protection is the frozen words themselves; the only
way to spend less is to freeze less"* — reproduces here, and the raw delta
scales with the test document's frozen share (this essay freezes 23.6% of
its words; W10's shape was about a fifth). **The brief's stop-and-report
clause was written for a latch freezing text nobody asked frozen; this is
the priced-in cost of the spans D1 ruled frozen, disclosed to the visitor
before payment by D4.** My judgment is that this ships; the raw numbers are
here for Jon to rule otherwise.

## 5.3 D2's demo: the short story came back rewritten, in full

The freeze planned **0 spans of 193 words** — the pre-flight a visitor
would see says 0% — and the delivered story is rewritten as hard as with
the freeze off: mistral-small overlap 0.026 frozen-on vs 0.040 off (n=3
each); deepseek 0.171 vs 0.178 (n=3 each). The opening, freeze ON:

```
IN   The barn door had been open since morning and nobody would say why.
     Ruth counted the dogs twice and came up one short both times.

     "We can't stay here another night," she said, watching the road.
     "They know the bridge is out, and they know we know it."

OUT  The barn door had been left ajar since sunrise and not a soul would
     explain why. Ruth tallied the canines twice and both counts came up
     one shy.

     "We can't endure another night here," she remarked, eyeing the dirt
     path. "They're aware the bridge is demolished, and they know we're
     aware too."
```

Every line of dialogue reworded. **The most watermarked part of the
document got the full rewrite, and the customer paid for exactly what they
received.**

## 5.4 Rule 2's demo: the mask-heavy chunk was delivered, not refunded

The mask-heavy document is one chunk whose masked form is ~33 words while
the restored output is ~114 — **3.4x the masked input, which is past the
leak guard's 1.5x + 8 ceiling. Under the old guard ordering every one of
these 8 runs would have retried, failed, and refunded a perfect rewrite.**
With restore-first: **8 of 8 delivered, 12 of 12 spans byte-exact, 0
fallbacks, 0 refunds, 1 retry total across all 8** — and the unfrozen 30%
of the document was rewritten at 0.000 overlap on mistral-small (0.017 on
deepseek). The delivered document, mistral-small, in full contrast:

```
IN   The auditor's verdict took one paragraph. She wrote that the
     committee had "acted without malice and ..."     [quote: 47 words]
     ...
     Nobody resigned over it, which told the village everything it needed
     to know about how the next one would go.

OUT  The accountant's decision filled one block of text. She stated the
     panel had "acted without malice and ..."         [same 47 words]
     ...
     No one stepped down because of it, a detail that revealed to the
     hamlet exactly how the following incident would unfold.
```

## 5.5 What failed, and the fix the failures bought

**The first campaign found the dominant failure live: consecutive heading
masks opening a chunk get deleted as noise.** On the essay's first chunk
(four heading masks, two of them back-to-back at the top), the model's
first attempt dropped every mask in 3 of 10 debug calls on mistral-small,
and a BLIND freeze retry failed the same way — **3 of the 16 frozen essay
runs in campaign 1 crossed D3's threshold and refunded** (the fix landed
mid-campaign, so campaign 1 is the before-record).

**The fix reuses the fact guard's own channel:** a failed restore names the
dropped placeholders through the existing `missing` parameter, so the retry
prompt itself says "every one of them must appear in your new version,
exactly as written" about `[[12]]`, `[[13]]` by name. Locked in
`test_freeze_retry_names_the_dropped_placeholders`.

**After the fix (campaign 2, all 30 frozen-arm runs):** freeze-caused job
failures fell to **1 of 30** — one deepseek run dropped its heading masks
on the blind attempt AND on the informed retry. That run refunded, which is
D3 behaving as ruled: the failing chunk was 339 of 517 words, 66%, past the
one-third threshold. **Mistral-small — the model every written record says
is live — had 0 freeze failures in its 15 frozen-arm runs.**

## 5.6 Two operational facts that cost an hour, recorded in `07`

- **A gateway call can hang far past its 45-second timeout.** The first
  campaign froze 15+ minutes inside one run, blocked in `PySSL_select` on
  two ESTABLISHED connections — urllib's timeout is per socket operation,
  and a dripping connection resets it. Every measured run now lives in a
  subprocess under a hard 240-second wall clock (the site's own ceiling).
  On Vercel the 300-second function kill is the real backstop.
- **deepseek-v3.2 had a bad afternoon, and D5 should know.** Median 26.1s,
  max 74.2s per 2-chunk run today, against the bake-off's 3.1s median on
  short documents — and **3 runs of 44 across the two campaigns failed
  outright on eight consecutive 45-second timeouts** (2 of 22 deepseek runs
  in campaign 2, 1 of 22 in campaign 1, one of them in the freeze-OFF arm,
  so this is the gateway/model, not the freeze). One day, one region, one
  laptop — but the model-switch decision should wait for a calmer day's
  latency numbers or accept that today's deepseek would collide with the
  240-second site abort on long documents.

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
