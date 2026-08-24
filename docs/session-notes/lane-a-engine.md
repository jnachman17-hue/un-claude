# Lane A — the engine

**24 August 2026, overnight session.** Steps per `docs/briefs/LANE-A-engine.md`.

**STATUS: IN PROGRESS. This header is rewritten as each step lands; if the
session ended unexpectedly, everything below the line for a finished step is
real and committed, and anything not listed did not happen.**

```
AI Gateway balance at start   $7.57668008
```

| Step | State | Commit |
|---|---|---|
| 1 — safety net | **DONE** | fc6a11e |
| 2 — repair | **DONE** | dc8354d |
| 3 — six fixes + two handovers | in progress | |
| 4 — report | not started | |
| 5 — bake-off | not started | |
| 6 — freeze re-scope | not started | |

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

*(Steps 3–6 below are appended as they finish.)*
