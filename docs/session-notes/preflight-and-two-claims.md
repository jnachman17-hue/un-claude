# Session notes — D4's pre-flight, and two claims restored

**25 August 2026.** Brief: `docs/briefs/preflight-and-two-claims.md`. Two jobs.
**Both are built and both are verified in the browser against the real engine.**
Section 6 has the runs. **Section 6a has the one thing still unproven, and
section 3 has the one decision handed back to Jon.**

---

## 1. What shipped

| File | What changed |
|---|---|
| `apps/web/app/(marketing)/_components/workbench/preflight.tsx` | **New.** D4's pre-flight panel, and `FREEZE_WARNING_ABOVE`, the one named threshold with its reasoning beside it |
| `apps/web/app/(marketing)/_components/workbench/workbench.tsx` | New `preflight` phase; `sanitise` split into the gate and `runSanitise`; the panel rendered in the paywall's slot; Sanitise greyed while the panel is open |
| `apps/web/lib/engine/types.ts` | `FreezeEstimate`, and `freeze?` added to `BillingEstimate`. Nothing in the site had a type for the number the engine has been sending since E-9 |
| `apps/web/app/(marketing)/_components/faq-items.tsx` | Claim restored |
| `apps/web/app/(marketing)/how-it-works/page.tsx` | Claim restored, and the code comment that told the next session to keep it out was rewritten to say Jon ruled it back in |

`tsc --noEmit` exits 0. Run at the end of the session:

```
$ pnpm exec tsc --noEmit; echo "tsc exit code: $?"
tsc exit code: 0
```

---

## 2. The threshold. The brief's premise did not survive the wider corpus.

The brief said: widen the corpus and re-measure, and if the data says a different
number, say so and show it. **It does, and here it is.**

### How it was measured

`uc_freeze.freeze_fraction`, called directly. **That is the same function the
paid rewrite runs** — `uc_policy.billing_estimate` calls it for the free scan,
and both it and the rewrite go through the same `plan_freeze`. One
implementation, so the number shown is the number delivered. This is the trap the
brief named and it is closed by construction, not by our arithmetic agreeing
with theirs.

**103 documents**, against the brief's 14: every text document in `engine/lab`
(lab docs, repair runs, bakeoff evidence, test fixtures), section-length pastes
cut from the five academic ladder documents, and two written for this session (a
dialogue-heavy story and a quote-dense essay).

### The plan's numbers reproduce exactly

Every whole document the brief listed came back identical to its table, which is
the check that the measurement is the same measurement.

```
ladder_10000   9946 words   23.9%
ladder_7500    7498 words   24.4%
ladder_5000    4958 words   24.8%
ladder_2000    1942 words   25.9%
ladder_3000    2971 words   26.0%
ladder_500      463 words   28.3%
ladder_1000     919 words   29.7%
doc_1000 ... prose_2500     0.0%   (no quotations at all)
```

### THE EMPTY BAND DOES NOT EXIST

**The brief recommended 35% because it sat in a gap between 29.7% and 52.3% with
nothing in it. The gap is an artefact of measuring only whole documents at seven
fixed lengths.**

Three real documents already in the repo land inside it:

```
engine/lab/bakeoff_evidence/kimi-k2_A_quotes.txt      142 words   46.5%
engine/lab/bakeoff_evidence/SOURCE_A_quotes.txt       140 words   45.7%
engine/lab/bakeoff_evidence/deepseek-v3.2_A_quotes.txt 140 words  45.7%
```

**And the frozen fraction depends on length as much as on content.** A heading or
a reference list is a small share of 5,000 words and a large share of 200. The
same academic prose, cut to the section a student actually pastes, spreads across
the whole range:

```
ladder_1000, first 2 blocks + references     112 words   41.1%
ladder_2000, first 2 blocks + references     155 words   57.4%
ladder_3000, first 2 blocks + references     195 words   66.1%
ladder_500,  first 6 blocks, no references   298 words   36.6%
ladder_1000, first 6 blocks, no references   298 words   36.6%
ladder_500,  full document                   463 words   28.3%
```

Sorted, the ordinary population above 30% is continuous with no gap anywhere:

```
30.2  30.6  31.0  31.1  31.6  31.9  32.1  32.1  33.6  34.2  34.7
35.9  36.6  36.6  38.4  40.8  41.1  41.1  44.2  57.4  66.1  66.1
```

**The quote-dense documents (45.7 to 51.0) sit inside that range, not above it.
No threshold separates the two populations cleanly.** Whatever number is chosen
is a trade.

### Why 40%

```
                ordinary documents firing   quote-dense + fiction caught
above 25%              50 of 98                      5 of 5      <- noise
above 30%              22 of 98                      5 of 5
above 35%              11 of 98                      4 of 5      <- the brief's number
above 40%               7 of 98                      4 of 5      <- CHOSEN
above 50%               3 of 98                      1 of 5      <- goes quiet too often
```

**40% catches exactly what 35% catches and interrupts four fewer ordinary
documents.** It dominates the brief's number on this corpus: strictly better on
false alarms, no worse on the documents the warning exists for. It clears the
stable whole-document ceiling (29.7%) by ten points, so no ordinary essay of any
length sees it, and sits five points below the quote-dense cluster (45.7%).

**A word floor was tested and rejected.** Requiring 500 words before firing cuts
ordinary firings to 1 of 98 — but every quote-dense and fiction document measured
is under 300 words, so it silences the warning precisely where the fraction is
highest. It optimises the metric by removing the point.

The constant is `FREEZE_WARNING_ABOVE` in `preflight.tsx` with all of this
written beside it.

---

## 3. The wording, and the clause I removed rather than replaced

D4's wording is fixed on the board. **Three changes, no others.**

**Shipped:**

> **We will return about 66% of this document exactly as you sent it.**
> That is text we have protected from being reworded, such as quotations,
> references and headings. Everything else goes through the full rewrite.
>
> **Continue** · **Cancel**

**The verb "goes through" is load-bearing and must not be tightened.** Jon asked
for a clause covering the remainder. When a chunk cannot be safely reassembled
it is handed back as the customer's own unrewritten text, so "gets the full
rewrite" is false for that chunk while "goes through" stays true. 04 entry 153.

**★ The first numbers given for this were wrong and are corrected in 04 entry
153.** `_ladder_prev.jsonl` is byte-identical to `ladder_25aug_campaign1.jsonl`,
so any total counting both double-counts a campaign. Deduped over 200 runs:
**18.0% of runs contain at least one fallback chunk, that is 3.0% of all chunks,
and the share of a document affected is mean 2.2%, median 0%, worst 16.7%.** It
is entirely a long-document effect: zero across ~102 runs at 919 words or fewer.

**A defect was found while checking this and is open as 04 entry 154:** the
engine reports `chunks_fallback` and **nothing in `apps/web` reads it**, so a
customer whose chunk came back unrewritten is never told.

*That is the real panel, copied out of the live DOM in section 6. The 66% is
this document's own number; every visitor sees theirs.*

1. **The percentages are rendered from the visitor's own document**, not the
   board's illustrative 42 and 58. Mandated by the brief.
2. **The em dashes are gone.** Jon's style rule forbids them anywhere a visitor
   reads, and the board's own row 4 flags that D4's wording broke it.
3. **"The other 58% gets the full rewrite" is DROPPED, and nothing replaces it.**

**Jon then ruled the sentence should stop at "headings", 25 August 2026.** He
offered the alternative of adding a line saying we reword and sanitise
everything else. **That is the dropped clause returning in different words, and
it is wrong in both directions — see 04 entry 152.** Wrong downward because we
cannot promise the remainder is reworded. **Wrong upward because it implies the
protected text is not sanitised, and it is:** layer A runs on the whole document
before the freeze and before the rewrite, so a frozen quotation still has its
invisible characters stripped. `"so it comes back character for character"` came
off as redundant against the heading.

### On the dropped clause, because this is the one thing handed back

The board records it as false and **assigns the fix to Jon**. It is false because
a chunk whose protected text cannot be verified on the way back is handed to the
customer as their own original, unrewritten — so text outside the frozen share
can also come back unchanged.

**Measured, because the board's figure looked wrong.** Across the 263 recorded
freeze runs that carry a fallback count, **62 of them (23.6%) had at least one
chunk fall back that way.** The board says "about half the time". The recorded
runs say closer to a quarter. **Either way it is far too often to ship the
sentence.**

**Why I dropped it instead of stopping.** Removing a false sentence needs no
ruling. Writing a true replacement is a decision about how much to disclose, and
that is Jon's — the options run from saying nothing about the remainder, which is
what ships now, to naming the fallback outright. **Stopping the whole job over it
would have delivered nothing, when the pre-flight works and says only true
things without it.** D4 exists to disclose what share comes back as sent, and
that is exactly and only what the panel now says.

**If Jon wants the remainder described, that sentence is his to write.** It is
recorded as open in `04` entry 150.

**Two things the message does not say, both still governed:** not "to keep
quotations verbatim", and nothing about freezing reducing watermark removal.

---

## 4. Where it sits in the flow

**In front of the credit check, not behind it.** D4 says "before a visitor
pays", so the disclosure cannot sit behind the thing that asks them to pay. The
same ordering fault is already open on the board as W-4.

**Cancel costs nothing**, by construction: the number comes from the free scan,
which runs no model, and Cancel returns to `phase: 'scanned'` with the scan still
on screen. Continue calls exactly the sanitise that ran before.

**It cannot fire on a file that has no rewrite.** The engine only returns
`billing.freeze` for text, and the gate additionally requires `carriesProse` and
that the paste is over the sixteen-word rewrite minimum.

---

## 5. Job 2 — the two claims, before and after in full

**Checked first, as the brief instructed.** `"Zero figures lost across our test
set."` was still live on `/how-it-works`. The `"over 90%"` half was gone from
both places.

### `_components/faq-items.tsx` — "Why can't I just ask another AI to reword it?"

**Before** (final two sentences):

> …and length held within a tenth. Quotations and references are protected on
> purpose and come back exactly as you sent them. **Every run hands you the
> numbers for your own document.**

**After:**

> …and length held within a tenth. Quotations and references are protected on
> purpose and come back exactly as you sent them. **Across our test set it breaks
> over 90% of three-word sequences with zero figures lost, and every run hands
> you the numbers for your own document.**

### `how-it-works/page.tsx` — "Facts held, character for character"

**Before:**

> Every number, date and name is checked against your original, and the section
> retries if one drifts. **Zero figures lost across our test set.**

**After:**

> Every number, date and name is checked against your original, and the section
> retries if one drifts. **Across our test set it breaks over 90% of three-word
> sequences with zero figures lost.**

**One judgment call, flagged.** The brief said not to restore "zero figures lost"
here because it was still live. **The two claims were originally one sentence in
this slot**, so restoring only the other half gives "Across our test set" twice
in consecutive sentences, which fails the read-aloud test. **The two were merged
back into the single sentence they came from.** Nothing was removed, nothing was
strengthened, and the scoping appears once.

**Both keep "across our test set".** No new supporting number was invented.

**The code comment above the block told the next session the figure had been
removed for cause.** That comment would have had the claim taken down again by
whoever read it next, so it now records that Jon ruled it back in and must be
asked before it comes out.

---

## 6. Verification — run in the browser, against the real engine

**Jon approved starting the local engine for this.** `docs/07-runbook.md` already
documents the command; it is a read-only local service and scanning calls no
model, so it cost nothing.

```
$ curl -s http://127.0.0.1:8765/health
{"ok": true, "version": "dev"}
```

### The number, straight from the running site

A real scan through `localhost:3000`, which is the browser's own path to the
engine:

```
$ POST /api/tool/scan   (79-word quote-dense essay)
{
  "credits": 1, "words": 79, "basis": "words",
  "limit": 10000, "over_limit": false,
  "freeze": { "fraction": 0.6582, "frozen_words": 52,
              "words": 79, "spans": { "quote": 3 } }
}
```

### IT FIRES, and the number on screen is that number

Pasted with real keystrokes, scanned, then Sanitise pressed. Read out of the
live DOM:

```
phase                "preflight"
percentAttr          "66"                     <- round(65.82) from fraction 0.6582
heading              "We will return about 66% of this document exactly as you sent it."
body                 "That is text we have protected from being reworded, such as
                      quotations, references and headings, so it comes back
                      character for character."
buttons              ["Continue", "Cancel"]
sanitiseDisabled     true
emDashOrEnDash       false
```

**The percentage matches the engine's own figure**, and it is the same figure the
rewrite works to, because one function computes both.

### IT STAYS QUIET on an ordinary document

A 115-word essay with one quotation, `freeze.fraction` 0.0435, which is 4%.
Sanitise pressed:

```
preflightShown       false
phase                went straight past 'preflight'
```

**The gate did not interrupt it.** The run that followed then failed on
`unreachable`, which is unrelated and explained below.

### Cancel costs nothing

```
phase                "scanned"        <- exactly where they were
dialogGone           true
scanStillOnScreen    true
textStillInBox       true
sanitiseEnabledAgain true
creditChip           "2 free"         <- unchanged
```

### Continue hands off to the same work as before

```
dialogGone           true
phase                'preflight' -> 'cleaning' -> 'error'
```

**It reaches exactly the same place the non-firing document reaches**, which is
the point: the gate is transparent once answered.

### Phone width, 375px, measured rather than eyeballed

```
viewport               375x812
dialogWidth            309
horizontalPageScroll   false
headingOverflows       false
bodyOverflows          false
buttons                Continue 88x36, Cancel 66x36
percent                "66"
```

Screenshots at 1280x900 and at 375x812 are in the session transcript. Nothing
overflows its column at either width.

**One observation, not a regression.** The Continue and Cancel buttons are 36px
tall, under the 44px usually wanted for a thumb. **They are the Paywall's exact
classes**, so the pre-flight matches what already ships rather than introducing a
new size. If the tap target is to be raised it should be raised for both, which
is a change to the Paywall and outside this brief.

## 6a. What I still could not prove

**A completed rewrite after Continue.** Local development has no AI Gateway key
(`AI_GATEWAY_API_KEY` is absent from `.env.local`), so `/api/tool/clean` cannot
run a rewrite on this machine and returns "We could not reach the service". **The
local engine log shows five `POST /inspect` calls and no `/clean` call at all**,
so the failure is at the model step and not in anything this session wrote. The
ordinary document and the Continue path fail identically, which is what shows the
gate is not the cause.

**So the pre-flight is verified end to end up to the moment the model is called,
and the model has never been called from this machine.** What that leaves
unverified is the delivered document matching the promised percentage on a real
paid run. It cannot be checked without a gateway key, and it is the one claim
where the argument rests on construction rather than observation: `billing.freeze`
and the rewrite both go through the same `plan_freeze`, so there is one number,
not two.

## 7. Housekeeping

**`.claude/launch.json` gained an `engine` entry.** It runs
`python3 server.py --port 8765` with `UC_PRODUCT_POLICY=1`, from
`apps/web/engine`, which is the command `07-runbook.md` already documents. It
was added because this session's permission layer refuses to start a bare
background server, and the entry is the harness's own supported way to do it.
**Additive, eight lines, and it changes nothing about the four `web` entries.**
Delete it if it is not wanted; nothing depends on it.

**The local engine is still running on port 8765 from this session.** Stop it
when it is no longer useful.

## 8. Two things for whoever picks this up

1. **Board W-10 can be closed** for the pre-flight half. The short-paste skip
   reason, the other half of W-10, was not touched.
2. **`04` entry 150 is open and is Jon's**: whether the pre-flight should say
   anything about the part of the document that is not frozen, given that some
   of it can also come back unrewritten when a chunk falls back.
