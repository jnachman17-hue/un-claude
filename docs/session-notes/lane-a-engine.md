# Lane A — the engine

**24 August 2026, overnight session.** Steps per `docs/briefs/LANE-A-engine.md`.

# THE SHORT VERSION

**All six steps are done.** Nothing was skipped outright; two items inside
step 3 ended as write-ups rather than code, each because the stopping rules
required it, and both are recorded with exact fixes: **E-12** (the cost leak —
the only correct fix lives in `route.ts`, which this brief forbids touching,
and an in-territory fix would break the live run-cost writer) and **the
customer-facing half of CJK word counting** (one coupled pricing decision,
Jon's, now in `06`). Everything else shipped, with the real before-and-after
pasted under each step below.

- The safety net caught **two real text losses in the committed plumbing**
  before any model was involved. Both fixed.
- Repair removes the AI tells the tool itself was adding, at **median +0.0000**
  trigram cost, measured on 12 real gateway runs.
- Layer A now reports on the document the customer sent — verified live both
  ways: `removed_count: 0` before, `removed_count: 2` with both characters
  named after.
- The report instrument caught the flagship defect (a rewritten Orwell
  quotation) on its **first live run**, and the Sources latch is fixed by
  construction.
- The bake-off: **160 measured runs, 17 model configurations, one 5,047-word
  scale test.** Recommendation: **`deepseek/deepseek-v3.2`** — the switch
  itself is Jon's (D5).
- The freeze re-scope is on paper, nothing built, per the brief.

```
AI Gateway balance at start   $7.57668008
AI Gateway balance at end     $5.44054931     (see the caveat in step 5:
                              timed-out reasoning calls bill invisibly, and
                              the live site shares this key)
engine suite                  762 passed, 1 skipped   (baseline 523 + 1)
Do-not-touch list             untouched; pricing drift guard 3/3 PASS
Deployed or pushed            NOTHING
```

| Step | State | Commit |
|---|---|---|
| 1 — safety net | **DONE** | fc6a11e |
| 2 — repair | **DONE** | dc8354d |
| 3 — six fixes + two handovers | **DONE** (E-12 and CJK-pricing as write-ups, above) | 4a217f3, 4d7ea40 |
| 4 — report | **DONE** | c1facbb |
| 5 — bake-off | **DONE** | d75adbf, 0168c96 |
| 6 — freeze re-scope | **DONE, on paper only** | 4cd6432 + this file |

---

# STEP 1 — THE SAFETY NET, AND IT CAUGHT TWO REAL LOSSES

`engine/tests/test_spans.py`: 143 tests. Every test document — 33 of them, one
per category of thing a customer's document contains — is split into chunks and
reassembled **with no model involved at all**, and the result asserted
byte-identical, at three levels: the paragraph splitter alone, the chunk plan,
and the whole of `rewrite_long` with an identity "rewrite" that hands every
chunk back unchanged.

**Run against the committed code, it failed 11 of 143.** The plumbing was
losing text on its own, in two ways:

**1. A whitespace-only line at the document's edge was silently deleted.**

```
IN   '   \n\nA real paragraph.'      (a line of spaces, then the paragraph)
OUT  'A real paragraph.'             (the spaces line is gone)
```

`_split_blocks` dropped any whitespace-only paragraph and flattened every
separator to a plain blank line. Fixed: the whitespace is folded into the
document's own leading/trailing whitespace instead of dropped. No model, no
judgment — bytes in, same bytes out.

**2. A customer's own `---` rule at a chunk edge was deleted even when the
model returned it faithfully.**

```
IN   'The document closes with the customer's own rule.\n\n---'
OUT  'The document closes with the customer's own rule.'
```

`strip_edge_separator` exists to remove the prompt's own `---` showing through
at the edge of a model reply. It never asked whether the customer's chunk
itself carried a rule there. It now takes the source chunk and leaves an edge
alone when the customer's own text has a rule on it — the same principle
`check_leak` already follows: a phrase present in the customer's own text is
never treated as ours.

**After the fixes: 143 of 143 pass. Full suite: 666 passed, 1 skipped**
(baseline before this session: 523 passed, 1 skipped; every new test is mine,
no old test changed).

---

# STEP 2 — REPAIR. The tool stops handing back AI tells it added.

`apps/web/engine/uc_repair.py`, wired into `server.py` immediately after the
rewrite. Deterministic, model-free, and **every rule conditions on the
customer's own input**, so nothing they typed is ever "repaired" away.

**Three treatments, per Jon's ruling — not collapsed into one:**

| Mark | Treatment | Condition |
|---|---|---|
| `**bold**`, `*italic*`, `## heading` | **Removed.** Corruption of their file, not a style choice | Skipped entirely if the input itself uses that markup (`**kwargs` in a code sample keeps bold removal off) |
| Curly apostrophes `’` and quotes `“”` | **Straightened to match the input** | Only when the input carries none of the curly form |
| Em dashes | **Bounded at the input's own count — NOT zero.** A document that arrives with em dashes comes back with em dashes | Only mid-line dashes ever convert; a dash opening a line is dialogue punctuation (French among others) and is never touched |

**Plus one restoration:** a year the model spelled out against the engine's own
rule 5a goes back to digits (`sixteen ninety-eight` → `1698`), only when the
input had the digits, the output lost them, and the customer did not spell it
out themselves anywhere. A restored year also retires its entry in
`figures_to_check`, so the panel stops flagging a figure that is back.

## Measured on 12 real gateway runs — not on my own test strings

2 documents × 2 models × 3 runs, through `rewrite_long` with the exact wiring
`server.py` uses. Full before/after pairs are committed in
`engine/lab/repair_runs/`. Reproduce with
`engine/.venv/bin/python engine/lab/repair_measure.py`.

**11 of 12 raw outputs carried at least one mark the input never had.**
Per model, because they inject differently:

| Injected into a document that had none | mistral-small | mistral-medium |
|---|---|---|
| Curly apostrophes (per run, worst) | 1–3 | 2–7 |
| Em dashes (per run, worst) | 0–2 | 2–3 |
| Curly quotes | 2 in 1 of 6 runs | 0 of 6 |
| Years spelled out | 2 in 1 of 6 runs | 0 of 6 |

**Repair removed every one — 0 residual marks across all 12 runs.**

A real pair, mistral-medium (input had straight apostrophes, no em dashes):

```
RAW       No one ever went to London’s coffee houses just for the coffee. …
          each drawing its own regulars—sailors in one, writers in another …

REPAIRED  No one ever went to London's coffee houses just for the coffee. …
          each drawing its own regulars - sailors in one, writers in another …
```

## The cost, in trigram overlap — the brief's target was "at least as cheap as +0.0000 median"

```
12 runs:  median +0.0000    mean −0.0002    max +0.0000
```

**Repair costs nothing in rewrite aggressiveness.** Measurement spend:
$0.036685, read from the gateway's own cost figures.

---

# STEP 3 — FIX. Six engine fixes, and two items that ended as write-ups.

## 3.1 Layer A now runs BEFORE the rewrite — verified live, both ways

The one layer this product can prove was being measured after the rewrite had
already destroyed its evidence. Reproduced against the committed code, then
against the fix, with a real model call each way — the same document, carrying
two zero-width characters built from escape codes:

```
BEFORE THE FIX                        AFTER THE FIX
zero-width characters in: 2           zero-width characters in: 2
layer A reports:                      layer A reports:
  removed_count: 0                      removed_count: 2
  removed: {}                           removed: {
                                          "U+200B ZERO WIDTH SPACE (Cf)": 1,
                                          "U+200D ZERO WIDTH JOINER (Cf)": 1 }
zero-width chars in output: 0         zero-width chars in output: 0
```

The output was already clean in both cases — the rewrite destroys these
characters as collateral — but before the fix **the customer's receipt said
nothing was found in a document that arrived carrying two.** Layer A now runs
first, on what the customer actually sent; the rewrite receives the cleaned
text; and a second quiet pass after the rewrite catches anything the model
itself emits, reported separately under `stats.after_rewrite`, never mixed
into the customer's evidence. `detect_before` also now runs on the original
rather than the rewritten text — same defect, same fix.

## 3.2 Words are now counted in a way that works in Chinese, Japanese and Thai — where that cannot change a price

`uc_wordcount.py`: CJK characters count one word each, Thai/Lao/Khmer/Myanmar
one per four characters, everything else splits on spaces exactly as before.
English documents count identically to the old rule.

```
                         old rule   new rule
8-ideograph Chinese          1          8
11-char Japanese             1         11
31-char Thai                 1          8
9-word English               9          9
```

**Wired into: chunk planning, the truncation guard's ratio, and the leak
guard's expansion ratio.** Those are engine-internal safety numbers and were
meaningless on unspaced scripts (both sides of every ratio counted "1").

**NOT wired into: billing, the 10,000-word ceiling, or the 16-word rewrite
floor.** See "What needs Jon's ruling" below — those three change what a
customer is charged and what runs, they are coupled, and the brief's stopping
rule says record it rather than decide it.

## 3.3 The number reader's fourth repair, regression-locked

```
                       old            new
_numbers('[1,3-5]')    {'13','5'}     {'1','3','5'}
_numbers('[1, 3-5]')   {'1','3','5'}  {'1','3','5'}   (space no longer changes the answer)
_numbers('p = .015')   {'15'}         {'0.015'}
_numbers('30,000')     {'30000'}      {'30000'}       (real grouping still reads)
```

A comma now only joins digits in genuine thousands grouping (one to three
digits, then groups of exactly three). All 21 cases that have ever gone wrong
with this reader — including the three earlier repairs' cases — are locked in
`engine/tests/test_number_reader.py`, so the fifth repair cannot quietly undo
the first four.

## 3.4 A chunk never ends on a lone equation, table row or placeholder

W10 measured the danger: an equation ending a chunk was deleted in **14 of 30
runs**; the identical document with the equation mid-chunk, **1 of 30**. The
plan now moves a fragile paragraph to the front of the next chunk — off the
boundary — and consecutive fragile paragraphs travel together, so a table cut
by the plan is reunited. Proved plan-side with no model: the equation document
and the split-rows table both come out with the fragile text mid-chunk, once,
byte-identical (engine/tests/test_chunk_planning.py).

## 3.5 A torn code fence is stitched before anything looks at it

A blank line inside a code block counted as a paragraph break, so the planner
cut the block in half and each half saw an orphaned fence — the whole job
failed 3 of 5 runs on mistral-medium in W10. A paragraph that opens a fence
now absorbs paragraphs until the fence closes, before anything else reads the
document. Bounded at three chunks' worth of words so one stray fence cannot
fold a long document into a single oversized model call. The restore step
stitches the model's output the same way, so the paragraph counts compare like
for like.

## 3.6 No new retry anywhere

Nothing added in this session retries at all: repair is single-pass, the
detector (step 4) is passive. The existing retry budget (8 per chunk, measured
in engine-limits.md as true positives) is unchanged.

## 3.7 The stylometry scanner stops accusing ordinary English (S-5 / E-11)

Lane E's audit found the marker labels and their patterns disagreeing, and a
label is a product claim. **Only mismatches were fixed** — where a pattern
fired on something its own label does not describe. What phrases should carry
weight at all is Jon's decision; nothing else was trimmed.

Run against Lane E's own audit sentences, after the fix:

```
ORDINARY ENGLISH — must be silent:
  quiet The tallest mountain in the world is Everest.
  quiet In the era of steam, Manchester doubled in size.
  quiet Frogs are sensitive to changes in the environment.
  quiet Wordsworth wrote about the human place in the landscape.
  quiet The scar serves as a reminder of the accident.
  quiet Photosynthesis plays a key role in the carbon cycle.
  quiet The hippocampus plays a vital role in memory.
  quiet The appeal ultimately failed.
THE LABELS THEMSELVES — must still fire:
  fires In today's fast-paced world, businesses must adapt.
  fires Trade unions played a pivotal role in the strike.
  fires The award serves as a beacon of hope.
  fires Ultimately, the committee agreed.
```

**What changed, precisely:** the fast-paced-world marker requires its
adjective; `reminder` left the serves-as pattern; `key` and `vital` left the
plays-a-role pattern while its own past tense (`played a pivotal role`) now
fires — it was wrong in both directions; `ultimately,` fires only opening a
sentence; and the dead `worth noting to note` branch is gone (it could never
match ordinary text, so behaviour is unchanged). Lane E's A/B — the same
paragraph with `in the world` vs `on the planet` — now scores identically,
locked in `test_stylometry_label_accuracy.py`.

## 3.8 E-12, the cost leak — WRITTEN UP, NOT FIXED, and here is exactly why

**The leak is real and I reproduced it live.** A run's payload carries our
unit economics inside `report.layer_b.usage`:

```
"usage": { "model_calls": 1, "prompt_tokens": 813, "completion_tokens": 49,
           "total_tokens": 862, "cost_usd": 9.6e-05, ... }
```

`strip_server_paths` removes only `path`, and `route.ts` forwards the whole
report to the browser, so anyone can open the network tab and read what a run
costs us.

**The fix cannot live in my territory without breaking a live feature.** The
run-cost writer (`recordRunCost` in `lib/server/credits.ts`, Lane B's M-4,
verified in production on 24 August — the first `run_costs` row ever written)
reads exactly these figures from exactly this spot in the engine's reply,
server-side, before the reply is forwarded. Stripping them in the Python
function (my territory) would feed the writer nulls and silently break the
promise the privacy policy makes. The only correct place is
`app/api/tool/clean/route.ts`, AFTER the `recordRunCost(ledgerId, result)`
call and before the final `Response.json` — and `app/api/**` route handlers
are on this brief's DO NOT TOUCH list.

**The one-line fix, for whoever owns route.ts** (after the recordRunCost
call, around line 447):

```ts
// Our unit economics stay on the server. recordRunCost above has already
// read them; the browser gets the operational counts only.
if (result.report?.layer_b?.usage) {
  const { chunks, attempts, retries } = result.report.layer_b.usage;
  result.report.layer_b.usage = { chunks, attempts, retries };
}
```

`chunks`, `attempts` and `retries` are operational counts already implied by
the interface's own behaviour; `model_calls`, the token counts and `cost_usd`
are the figures that price our margin and they are the ones to keep back.
Nothing in the browser reads any of them (verified by grep across the
workbench and lib).

## What needs Jon's ruling, recorded rather than decided (stopping rule)

**The other half of the CJK fix is a pricing question, and it is one question,
not three.** Today a Chinese, Japanese or Thai document: counts as ~1 word →
bills 1 credit → passes the 10,000-word gate at any size → and is then
silently skipped by the 16-word rewrite floor. Wiring the honest counter into
the floor alone would run rewrites the gate never priced (a 200,000-character
Chinese document would bill 1 credit and cost us ~170 chunks of model calls);
wiring it into billing alone would charge people for a rewrite the floor still
skips. And the browser's own word counter (Lane C's territory) must change in
the same release or the price shown will not be the price charged — the exact
two-implementations trap this project has been bitten by three times.

**Recommendation:** wire `uc_wordcount.count_words` into `uc_policy.word_count`
(billing, gate) and the server floor in ONE change, with the workbench's
counter updated in the same deploy, and re-measure rewrite quality on CJK
before advertising it — W10 measured French coming back half-translated 16 of
20 runs on mistral-small, and CJK has never been rewritten even once. Until
then the engine's internal safety math is fixed and customer-visible behaviour
is unchanged.

---

# STEP 4 — REPORT. The instrument exists, the freeze is off, and it caught the flagship defect on its first live run.

`uc_spans.py`: the protected-span detector and its deterministic checks,
riding in every rewrite's report as `layer_b.protection`. **Report only:** it
changes no output, fails no job, costs no model call, and nothing raises.

**What it detects:** quotations (with D2's attribution cue, so attributed and
unattributed are counted separately), block quotes, headings, reference
entries, URLs, emails, code fences, tables, equations, and `[sic]` markers.

**The Sources latch is fixed by construction.** A paragraph after a
Sources/References/Bibliography/Works-cited heading counts as a reference
entry **only if it looks like one** — a bracketed year, a DOI, a URL, a page
range, a publisher — and the section ends at the first paragraph that does
not. The W10 verifier's breaking case (a "Sources" heading over ordinary
analytical prose, 56.1% frozen, 12 of 12 runs under the old design) now
yields **zero reference entries**, locked in `test_spans_detector.py`.

**What "returned verbatim" means, said in the report itself:** the span
appears character-for-character in the output as often as in the input.
Presence and count, not position — the report's own note says which, because
W10's verifier faulted a design for quietly promoting this test to
byte-identity.

## The first live run, in full

One real document — a heading, an attributed Orwell quotation, a URL, a
reference entry — through the real engine and gateway:

```
"spans_found":        { "quote": 1, "url": 1, "heading": 2, "reference": 1 }
"returned_verbatim":  { "url": 1, "heading": 2, "reference": 1 }
"changed":            { "quote": 1 }
"quotes_attributed":  1
"examples_changed":   [ { "kind": "quote",
                          "before": "to make lies sound truthful and murder respectable," } ]
"structure_kept":     true
```

The delivered document's quotation read *"to render falsehoods credible and
killing seem decent"* — *words Orwell never wrote, still in quote marks, still
attributed to him* — **and for the first time the engine's own report says
so.** The heading, the URL and the reference entry came back verbatim and the
report says that too.

**The same run caught a repair blindspot, now fixed:** the prose's "in 1946"
came back as "in nineteen forty-six" and repair excused it because the same
year's digits survived inside the reference entry. "The value is still in the
text somewhere" is the fact guard's own blindness, and repair no longer
shares it — the spelled-out year is restored wherever it appears, provided
the customer did not spell it out themselves.

`structure_kept` now rides inside the protection block as well, so the flag
the engine computed and nothing read sits in the one place a reader of this
report will open. **Showing it to the visitor is interface work (Lane C,
W-10), and the words it is shown under go through the messaging skill.**

---

# STEP 6 — THE FREEZE, RE-SCOPED ON PAPER. Nothing was built.

The masking machinery (board E-9, W10 phase 4) **was not built and must not
ship yet** — this section writes down the two fixes its own adversarial
verifier demanded, and what the bake-off says is still worth freezing.

## Fix 1 — the Sources latch: ALREADY FIXED, by construction, in the detector

The freeze's detection half now exists as `uc_spans.py` (step 4), and the
latch cannot be reintroduced as long as **the freeze session reuses
`detect_protected_spans` instead of writing its own detection.** The corrected
rule, locked in `engine/tests/test_spans_detector.py`: a paragraph after a
Sources/References/Bibliography/Works-cited heading is a reference entry
**only if it looks like one** — a bracketed year, a DOI, a URL, a page range,
a publisher — and the section ends at the first paragraph that does not. The
verifier's breaking essay (a "Sources" heading over ordinary prose, 56.1%
frozen, 12 of 12 runs under the old design) now yields zero reference entries.
"My sources" as a heading never opens the section, exactly as the verifier's
tell suggested.

## Fix 2 — the guard ordering: one sentence, written down for the E-9 session

**Every guard compares customer text to customer text — never the masked
pair.** In `uc_chunk.one(i)`, the restore (unmask) must run FIRST, before
`_guard` (length), `check_leak` and `_guard_facts` see anything:

```
model output --> tolerant restore (masks -> real text) --> THEN the guards,
                 each comparing (original unmasked chunk, unmasked output)
```

Both W10 masking designs did the opposite — guards ran on the masked chunk —
and against the committed code that produced `FactsLost` complaining about a
mask number itself, and `LeakSuspected` on a mask-heavy chunk (the masked
input is short, so a normal-length rewrite reads as a 4.3x expansion), which
retried and then **failed the job and refunded a customer whose rewrite was
perfect** — the W8 mistake exactly. Two supporting rules from the W10 design
that stand: mask tokens must be chosen by asking the engine's own `_numbers()`
reader what values the chunk already contains, so a mask can never collide
with a real figure; and a restore failure in one chunk falls back to that
chunk's original text per D3 (hand back, explain, threshold for refund).

## How much of the freeze is still needed

*(Filled in from the step 5 results below — see the bake-off section.)*

---

# STEP 5 — THE BAKE-OFF. 160 measured runs, 17 model configurations, and a recommendation.

**Enumerated from the gateway itself on 24 August, not from any list in these
documents:** 352 models, of which roughly 90 are open-weight families. 14
credible candidates ran through the **real engine path** — `rewrite_long`, the
real prompt, the real guards, the production 45-second call timeout — against
four documents built to carry the W10 defect list, measured with step 4's
instrument plus per-document sentinel strings. Then a second pass with
`reasoning_effort: "none"` on the three models that timed out, and a
5,047-word scale test on the finalists at the full production retry budget.

**Two stated departures from production in the short-document sweep, both
bounded:** retries capped at 2 (so a timing-out model costs minutes, not
hours), and four documents per model run in parallel. The scale test used the
production budget (8 retries, 180s deadline).

## The full field — 8 runs each, four documents, per model

```
model                            fail  sec med/max  overlap  sent lost  quotes chg  heads chg  inject
mistral-small (CURRENT)             0   2.4 / 5.3    0.0611     19/42       8/8        6/12       43
mistral-medium                      0   2.8 / 7.5    0.0757     16/42       6/8       11/12      131
mistral-large-3                     1   9.2 / 12     0.0458     17/36       7/8         7/7       24
meta/llama-4-maverick               0   1.6 / 1.7    0.2628      9/84      6/16        4/24        0
deepseek-v3.2                       0   3.1 / 5.8    0.2369      5/84      4/16        4/24        3
deepseek-v4-flash                   7  92.8 / 93.3   —  (times out: reasoning model, default mode)
deepseek-v4-flash [effort none]     0   3.4 / 4.2    0.2538      3/42       1/8        2/12        0
zai/glm-4.7-flashx                  5  93.1 / 93.7   —  (times out; IGNORES the effort parameter)
zai/glm-5                           0   2.8 / 4.9    0.3260      0/42       0/8        2/12        3
moonshotai/kimi-k2                  1   6.5 / 93.2   0.1692      7/78      0/16       10/19        6
moonshotai/kimi-k3                  7  93.3 / 93.7   —  (times out in default mode)
moonshotai/kimi-k3 [effort none]    0   6.6 / 31.0   0.3114      0/42       0/8        2/12        0
minimax-m2.5                        0  11.5 / 22.1   0.2412     12/42       0/8       12/12        0
nvidia/nemotron-3-super-120b        0   1.9 / 3.6    0.5220      2/42       1/8        1/12        4
alibaba/qwen3-next-80b-instruct     0   1.9 / 4.1    0.3161      4/42       2/8        2/12       25
xiaomi/mimo-v2.5                    0  10.7 / 11.4   0.2442      6/42       2/8        7/12       23
```

*(quotes chg counts inline quotes + block quotes changed / found; llama,
deepseek-v3.2 and kimi-k2 ran 16 runs, the rest 8. Fuller columns:
`engine/.venv/bin/python engine/lab/bakeoff_summary.py`.)*

## The scale test — one 5,047-word document, 18 chunks, production budget

```
model                     seconds  calls  retries  overlap  cost      marks injected (pre-repair)
mistral-small (current)     36.8     49      31     0.3866  $0.0088   23 curly + 4 em dashes
mistral-medium              50.6     60      42     0.2528  $0.0624   42 curly + 2 em dashes
deepseek-v3.2               48.9     39      21     0.3138  $0.0113   5 curly
llama-4-maverick            27.0     69      51     0.3606  $0.0384   none
kimi-k2                     99.4     25      10     0.6667  $0.0283   none
```

## What the numbers say, per model — averaging would hide it

- **The three mistrals rewrite hardest and destroy the most.** Every inline
  quotation changed on small (8/8) and large (7/8); medium 6/8. Medium renamed
  11 of 12 headings and injected 131 marks across 8 runs (now stripped by
  repair, but the injection is real). Small lost 19 of 42 sentinels including
  `Uppsala University`, `$4.2 million` and `beyond a reasonable doubt` twice.
  **Their low overlap is partly bought with exactly the damage W10
  catalogued** — the McDonald's lesson: a 0.000 overlap can be the worst
  document in the set.
- **deepseek-v3.2** changed 4 of 16 quotes (mostly a subtle boundary shift:
  `designed "to make lies…"` became `crafted to "make lies…"`, moving one word
  out of the marks), kept 20 of 24 headings, all references, injected 3 marks
  in 16 runs, never failed, never exceeded 5.8s on a short document, and at
  scale had the FEWEST retries of any model (21) at 1/6 of medium's cost.
- **kimi-k2's fingerprint is unique: 0 of 16 quotations changed** — inline,
  attributed, unattributed and block quotes all byte-identical — and only 6
  injected marks. **But at 5,047 words it returned a document with two thirds
  of its trigrams intact (0.6667)** — a customer paying for a rewrite gets a
  light edit — plus one run in 16 hit two consecutive 45s timeouts. The
  engine-limits note recorded kimi-k2 as "timed out"; the truth is subtler:
  it mostly completes, slowly, and goes gentle at scale.
- **kimi-k3, which Jon asked about by name:** in its default mode it thinks
  past the 45s ceiling and fails 7 of 8. With `reasoning_effort: "none"` (a
  new env knob this session added) it completes and **loses zero sentinels —
  the cleanest content preservation in the field** — but the rewrite is weak
  and erratic (overlap 0.08 to 0.78 across eight runs), it ran to 31s on a
  300-word document, and it costs 20–40x the alternatives ($0.0044/run).
  **The time ceiling rules it out**: at that pace a large document blows the
  240-second site abort.
- **glm-5 / nemotron / qwen3-next**: barely rewrite (0.33 / 0.52 / 0.32
  overlap) — they keep everything by not doing the job.
- **The timeout pattern is the reasoning tax, now understood**: a model tagged
  `reasoning` through this engine thinks with no cap because the engine never
  sent `reasoning_effort`. The new `WATERMARKS_REWRITE_REASONING_EFFORT` env
  var fixes that for models that honour it (deepseek-v4-flash went from 7/8
  failed to 8/8 completing at 3.4s); glm-4.7-flashx ignores it and stays
  unusable.
- **No model, anywhere, preserved the terms of art.** `in vitro` and `beyond a
  reasonable doubt` were restated by every model that rewrites at all —
  kimi-k2 wrote *"a certainty that leaves no reasonable uncertainty"*. W10's
  rank 4 is not a model-choice problem and no bake-off will fix it.

## RECOMMENDATION — and D5 says the decision is Jon's

**`deepseek/deepseek-v3.2`**, replacing both the current `mistral/mistral-small`
and the standing engine-limits recommendation of `mistral/mistral-medium`.

The case, in one paragraph: it avoids most of the defect list instead of
needing machinery to mask it — quotations mostly intact where the mistrals
destroyed every one, headings 20/24 kept, references untouched, near-zero
injected marks, zero fabricated sources observed — while still rewriting
within ~0.06 overlap of medium at scale (0.31 vs 0.25), at the same speed
(48.9s vs 50.6s on 5,047 words), with the fewest fact-guard retries in the
field, at a sixth of medium's cost. Every quotation it leaves alone is masking
machinery nobody has to build, and every heading it keeps shrinks what the
freeze must do. `engine-limits` §15 recommended medium *"after this plan ships
and not before"* — the plan shipped this session, and with repair now
stripping medium's 131 injected marks the remaining difference is medium
destroying quotations and headings that deepseek simply leaves alone.

**Runner-up:** `deepseek-v4-flash` with `WATERMARKS_REWRITE_REASONING_EFFORT=none`
— slightly better content preservation, slightly weaker rewrite, needs the
extra env var. **Not recommended:** kimi-k2 (near-copy behaviour at scale),
kimi-k3 (time ceiling and cost), anything glm (timeouts or non-rewrites).

**To apply (Jon's, per D5):** set `WATERMARKS_REWRITE_MODEL=deepseek/deepseek-v3.2`
on Vercel. No code change. **One check first:** confirm the v3.2 checkpoint is
published open-weight (DeepSeek's releases are MIT-licensed; the ruling is
open weights only and the licence check is not something this bake-off can
prove from an API).

## What this bake-off did NOT do — a step skipped is a step failed

- **Non-English text was not tested.** W10 measured French flipping language
  16/20 on mistral-small; whether deepseek-v3.2 does this is UNKNOWN.
- Denominators are 8–16 runs per model against W10's thousands; the mistral
  numbers agree with W10's large-sample findings, which is reassuring but not
  proof for the others.
- Latency is one day, one region, one gateway.
- Nothing ran past 5,047 words / 18 chunks.
- Licence verification per checkpoint is Jon's, as above.

## What it cost, read from the gateway, with one honest caveat

```
balance at step 5 start   $7.53968078
balance at step 5 end     $5.62513968     (spent: $1.91454110)
own-accounting total      $0.13 across 160 runs + evidence + scale runs
```

**The gap is mostly the timed-out reasoning calls**: a call our side abandons
at 45 seconds keeps generating — and billing — on the server, and reports no
usage block to us. kimi-k3's default-mode thinking at $15 per million output
tokens is the bulk of it. (The live site shares this gateway key, so some
fraction may also be real customer traffic tonight; the two cannot be
separated from here.) Recorded in `07-runbook.md`.

---

# STEP 6, COMPLETED — how much of the freeze is still needed

Given the recommended model, per D1 both tiers still ship, but the bake-off
reorders what they are FOR:

- **The structure tier (headings, +0.016) is still clearly needed** — even
  deepseek-v3.2 renames ~1 in 6 headings, and D1 ships it.
- **The quotation tier's workload shrinks by most of an order of magnitude**
  with the model switch: from 6-of-8-quotes-rewritten (medium) to 4-of-16 —
  and two of those four were boundary shifts, not rewordings. It still ships
  (D1, settled), but its failure surface — and therefore how often D3's
  hand-back-and-explain path fires — is much smaller than W10's numbers
  suggested, because those numbers were measured on the mistrals.
- **What the freeze can never fix stays fixed by nothing**: terms of art and
  invented facts (ranks 4 and 10) fail on every model and are not findable by
  a program. The site's claims must continue to steer around them.

The two prerequisite fixes are written down above (the latch is already fixed
in `uc_spans.py` by construction; the guard-ordering rule is one sentence:
guards compare customer text to customer text, never the masked pair). E-9
remains its own session and nothing of it was built here.
