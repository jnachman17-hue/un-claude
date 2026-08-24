# The route session — 24 August 2026

**Four items in `app/api/tool/clean/route.ts`, `vercel.json` and one string in
the engine.** Three are finished and proved. One is an experiment that only a
deploy can answer, and the deploy is Jon's.

---

# WHAT I SKIPPED, AND THE TREE WAS NOT QUIET

**Two things, both stated before anything else because a step skipped is a step
that failed.**

**1. I could not test the cancellation switch. Nobody can from here.** Item 2 is
one line of configuration whose only test is a deploy to Vercel. It is written,
it is schema-valid, and it is unproven. See item 2.

**2. THE TREE WAS CLEAN WHEN I STARTED AND IS NOT NOW. Another session is
writing to `apps/web/engine/uc_spans.py` as I finish.** The brief said the lanes
were finished and I might be the only session running. At `git status` it was
clean, exactly as described. By the end:

```
 M apps/web/engine/uc_spans.py          <- NOT MINE. E-9 freeze work, in progress
```

Modified at 11:16, one minute before I looked, and `ListAgents` shows three peer
sessions, two of them fifteen minutes old. Two commits I did not make landed on
`main` while I worked. **I have not touched that file and it is not in my
commit.** The consequence for item 2 is at the bottom and it matters.

**One correction to the brief, and it changes who is currently losing money.**
See item 3: today the CJK hole costs *the customer*, not us.

---

# 1 — THE COST LEAK. Closed, and proved in both directions

**The leak was real.** Here is the engine's own reply, from the real Python
engine over the real wire:

```
report.layer_b.usage  AS THE ENGINE PRODUCES IT:
{
  "attempts": 1,
  "model_calls": 1,
  "prompt_tokens": 813,
  "completion_tokens": 49,
  "total_tokens": 862,
  "cost_usd": 9.6e-05,
  "chunks": 1,
  "retries": 0
}
```

**`cost_usd` is what the run cost us.** `strip_server_paths` removes only `path`,
and the route forwarded the report whole, so anyone with the network tab open
could read our margin.

## The position was the whole fix, and here is the proof that it is in the right place

**The strip goes after `recordRunCost(ledgerId, result)` and before the final
`Response.json`.** That writer reads exactly these figures from exactly this spot,
server side, and its row is what made the privacy policy's promise to record
"what the run cost us" a true sentence on 24 August. Strip earlier and the writer
gets nulls.

**So the test asks both questions at once, through the real route, with a real
signed-in session and the real database.** `scripts/verify-cost-leak-closed.mjs`.

**BEFORE** — the strip temporarily disabled, same route, same run:

```
--- report.layer_b.usage, as the browser now sees it ---
{
  "attempts": 1,
  "model_calls": 1,
  "prompt_tokens": 813,
  "completion_tokens": 49,
  "total_tokens": 862,
  "cost_usd": 0.000096,
  "chunks": 1,
  "retries": 0
}
  FAIL  the browser is sent no cost figure and no token counts
        still present anywhere in the body: cost_usd, prompt_tokens,
        completion_tokens, total_tokens, model_calls
```

**AFTER** — the strip in place:

```
--- report.layer_b.usage, as the browser now sees it ---
{
  "chunks": 1,
  "attempts": 1,
  "retries": 0
}
  PASS  the browser is sent no cost figure and no token counts
  PASS  the operational counts it does not pay for are still there

--- the ledger for this account ---
       +3 signup_grant       -             - words  (ledger id 2826)
      +50 adjustment         -             - words  (ledger id 2827)
       +2 anon_grant         -             - words  (ledger id 2828)
       -1 spend              clean        63 words  (ledger id 2829)

--- run_costs, written SERVER SIDE for that same spend ---
[
  {
    "ledger_id": 2829,
    "model_calls": 1,
    "retries": 0,
    "total_tokens": 862,
    "cost_usd": 0.000096,
    "seconds": null,
    "layer_b": true
  }
]
  PASS  a run_costs row was still written for this run
  PASS  and it holds the real numbers, not nulls
        model_calls=1 total_tokens=862 cost_usd=0.000096
```

**The browser gets three counts of work done. The database still gets the money.**
That is the entire item.

**The check hunts the whole body, not just that one block**, so a figure hiding a
level deeper would still be caught: it walks every key at every depth and looks
for `cost_usd`, `cost`, `prompt_tokens`, `completion_tokens`, `total_tokens`,
`model_calls` and `calls_without_usage`.

## What was real in that run and what was not

**Real:** the route, the credits code, the run-cost writer, the live database,
the real Python engine, its chunker and its own usage accounting.

**Not real:** the model at the far end. **`WATERMARKS_REWRITE_API_KEY` is not on
this machine, so no live gateway call was possible.**
`scripts/_stand-in-gateway.mjs` answers in the gateway's own OpenAI-compatible
shape with **the token counts and cost from the real production run Lane A
captured** — 813 / 49 / 862 / 9.6e-05 — so the figures the test hunts for are
the figures that actually leaked. It hands back the customer's text unchanged.
That is not a rewrite and is not pretending to be one; this test is about where
the cost figures go.

**`seconds` is null only locally.** It comes from the top-level `usage` block
that `api/clean.py` adds, and `engine/server.py`, the dev server, does not add it.
In production it is a real number, as the 24 August rows show.

## One file outside the brief's territory had to move

**`lib/engine/types.ts`.** `LayerBUsage` required `model_calls`, so after the
strip the reply no longer type-checked:

```
app/api/tool/clean/route.ts(589,5): error TS2741: Property 'model_calls' is
missing in type '{ chunks: number; attempts: number; retries: number; }' but
required in type 'LayerBUsage'.
```

**The honest fix is to make the money fields optional and say why**, because the
stripped reply is now a real value of that type. The alternative was a cast,
which would have left the type claiming a field that is not there. `tsc --noEmit`
is clean.

---

# 2 — THE CANCELLATION SWITCH. Written, unproven, and it needs Jon

**A dropped connection charges the customer and never refunds.** The refund code
shipped on 24 August and is inert: Vercel request cancellation is opt-in, and
`request.signal` only aborts for functions declaring `supportsCancellation`.

**Added, narrowest possible target:**

```json
"functions": {
  "api/*.py": { "maxDuration": 300, "memory": 1024 },
  "app/api/tool/clean/route.ts": { "supportsCancellation": true }
}
```

## Two of Lane B's three reasons for not doing it blind still stand. One is weaker than it looked

**Lane B's reason 2 was "it is not established the switch can even reach an App
Router route — Vercel's own examples target `api/**` and `pages/api/**`."**

**Vercel's documentation does show App Router paths in a `functions` block.** The
advanced-configuration page gives, verbatim, `"app/api/hello/route.ts": {
"memory": 3009, "maxDuration": 60 }`, and the duration page gives
`"app/api/**/*"`. **So the glob form reaches App Router routes** — for `memory`
and `maxDuration`, which are the two the docs demonstrate.

**Whether `supportsCancellation` in particular is honoured there is still
unknown, and that is the whole experiment.** The key itself is real:
`https://openapi.vercel.sh/vercel.json` lists it among the ten allowed keys —

```
allowed keys: excludeFiles, experimentalTriggers, functionFailoverRegions,
              includeFiles, maxConcurrency, maxDuration, memory, regions,
              runtime, supportsCancellation

supportsCancellation: { "type": "boolean",
  "description": "A boolean that defines whether the Function supports
                  cancellation (default: false)" }
```

— and our `functions` block uses only allowed keys, so it will not be rejected as
a bad key.

**THE ONE RISK WORTH NAMING BEFORE JON DEPLOYS.** If the Next builder does not
recognise that path as a function, the build fails with "the pattern defined in
`functions` doesn't match any Serverless Functions". **I could not rule that out
locally: `.vercel` is not linked in this repo, and linking authenticates against
the live project, which is not mine to do.** If the build fails, the two lines
come straight back out and the answer is "the switch does not reach this route".

## The test Lane B described does not exist, so I wrote it

**`scripts/verify-connection-drop-refund.mjs`.** The board and Lane B's note both
say "re-run a script that already exists". **There is no abort test in
`scripts/` and git has no record of one being deleted.** It was a throwaway. It
is written down now.

**It costs nothing:** a 250,000-word paste asking for the free layers only, so no
model is ever called. It runs both directions and reproduces Lane B's dev-server
result exactly:

```
  paste  250,008 words, layer A only, no model call

=== the connection DROPS at 3s. The credits must come back ===
>>> connection dropped by the client at 3000ms
client saw: AbortError after 3003ms: This operation was aborted
  +8s    balance  405  spend rows 1  operation_refund rows 1
  +75s   balance  405  spend rows 1  operation_refund rows 1

       +3 signup_grant             - words
     +400 adjustment               - words
       +2 anon_grant               - words
     -251 spend               250008 words
     +251 operation_refund         - words
    SUM = 405
  PASS  a job nobody received was refunded

=== the SAME job, connection kept open. There must be NO refund ===
client saw: HTTP 200 after 2403ms
  +8s    balance  154  spend rows 1  operation_refund rows 0
  PASS  a delivered job is charged and NOT refunded
```

**THAT PASS PROVES NOTHING ABOUT VERCEL AND THE SCRIPT SAYS SO ON ITS FACE.** A
local Node server propagates a client disconnect on its own and needs no switch.
It proves the script works and the route's logic is right. **The only run that
answers the real question is against production, after a deploy:**

```bash
UC_SITE=https://un-claude.com node scripts/verify-connection-drop-refund.mjs
```

**If the refund row appears, M-6 is closed and no dependency is needed. If it
does not, the next step is `waitUntil` from `@vercel/functions`, which is a new
dependency and therefore Jon's call. I have not installed it and I am not
recommending it be installed without him.**

---

# 3 — CJK REFUSED AT THE DOOR. Done, and the brief's premise needs one correction

## The hole is real, and here it is measured

```
200k-character Chinese document    chars  201400  words      1  credits billed    1
comparable English document        chars  102700  words  20800  credits billed   21
```

**Every price here comes from `countWords`, which is `split(/\s+/)`.** Chinese,
Japanese and Thai do not put spaces between words, so a document twice the size
of an English one bills a twentieth of the price.

## THE CORRECTION: today that money is coming out of the CUSTOMER, not out of us

**The brief says rewriting such a document "would cost us around 170 chunks of
model calls". The word is *would*.** It does not, yet. Run one through the real
engine and the rewrite is silently skipped:

```
characters: 2380   space-counted words: 1

WHAT THE ENGINE DOES WITH IT TODAY (layer_b requested):
{
  "skipped": "input_too_short",
  "min_words": 16,
  "words_in": 1,
  "reason": "The rewrite needs at least 16 words and this is 1. Hidden
             characters and file data were still removed."
}
```

**One space-counted word is under the engine's 16-word floor, so no model is
called.** So the live defect today is **the customer paying a credit for a
rewrite that never runs** — the exact "paying and not receiving" failure this
route's own comments were written about. **Our 170-chunk exposure is latent: it
becomes real the moment anyone wires an honest word counter into that floor,
which is precisely what Lane A recommends in `06`.**

**This makes refusing more right, not less.** It fixes a live defect against the
customer and closes the hole before the change that would open it. But Jon should
know the urgency is not "we are bleeding money today".

## The threshold, and why it is a share rather than "contains any"

**An English essay quoting Chinese has to go through.** So the test asks what
fraction of a document's *letters* belong to a spaceless script:

- **at least 20 such characters**, so a short aside cannot trip it, and
- **at least 20% of all letters.**

**Below a fifth it is an English document with something quoted in it, and the
English around the quotation is still being counted and charged for honestly.
Above a fifth it is not an English document and we have no honest price for it.**

**Measured, on an essay carrying repeated Chinese quotations:**

```
  1 quoted phrases     9 Han chars in  2089 letters =   0.4%   accepted
 10 quoted phrases    90 Han chars in  2170 letters =   4.2%   accepted
 20 quoted phrases   180 Han chars in  2260 letters =   8.0%   accepted
 40 quoted phrases   360 Han chars in  2440 letters =  14.8%   accepted
 60 quoted phrases   540 Han chars in  2620 letters =  20.6%   REFUSED
```

**Forty separate Chinese quotations in one essay still go through.** The
numerator counts only characters that are letters *and* in Han, Hiragana,
Katakana or Thai, so Thai's vowel and tone marks do not inflate it against the
`\p{L}` denominator.

## Proved through the real route

`scripts/verify-cjk-refusal.mjs`, real session, real credits, real database:

```
--- what the route measures, before it decides ---
  document                                 letters  spaceless    share
  Chinese document                             257        257   100.0%
  Japanese document                            217        217   100.0%
  Thai document                                285        285   100.0%
  Korean document (spaces between words)       192          0     0.0%
  English essay quoting Chinese               1052         21     2.0%

--- Chinese document ---
  POST /api/tool/clean {layer_b: true} -> HTTP 400
  code    unsupported_script
  message We cannot sanitise Chinese, Japanese or Thai yet. Nothing is wrong
          with your document, and scanning it for hidden characters is still free.
  PASS  Chinese document: refused
  PASS  Japanese document: refused
  PASS  Thai document: refused

--- Korean document (spaces between words) ---
  POST /api/tool/clean {layer_b: true} -> HTTP 200
  charged 1  balance 54
  PASS  Korean document (spaces between words): went through and was charged

--- English essay quoting Chinese ---
  POST /api/tool/clean {layer_b: true} -> HTTP 200
  charged 1  balance 53
  PASS  English essay quoting Chinese: went through and was charged

--- the ledger after all five ---
       +3 signup_grant       -             - words
      +50 adjustment         -             - words
       +2 anon_grant         -             - words
       -1 spend              clean        71 words
       -1 spend              clean       236 words
    SUM = 53
  PASS  NOTHING was charged for the three refused documents
```

**Two spend rows for five documents.** The refusal sits above every line that
touches credits — above the session lookup, the grants, the price and the spend
— so nobody is ever asked to pay for a job that will be refused. **That ordering
defect was found by the F1 audit and fixed once already, in the format check
three lines above; reintroducing it would have been a poor joke.**

**Korean is the control and it matters.** It is an Asian script that *does* put
spaces between its words, so it counts correctly (71 words, 1 credit) and prices
correctly. Refusing it would have turned away a paying customer for nothing.

**An uploaded `.txt` is refused on the same terms as a paste:**

```
  essay.txt    -> HTTP 400  unsupported_script  (refused)
  paste.txt    -> HTTP 400  unsupported_script  (refused)
```

**A `.docx` is deliberately NOT refused**, because the rewrite never runs on a
container anyway; it gets layer A and metadata for its one flat credit, exactly
as before.

## The free scan is untouched, and it really does still find things

**A different route, unchanged.** And layer A is genuinely script-independent
rather than merely returning zero — a Chinese paragraph carrying three invisible
marks, through the live scan route:

```
ok: True  characters: 45  hidden marks found: 3
    U+200B ZERO WIDTH SPACE (Cf)        x 1 at [5]
    U+200C ZERO WIDTH NON-JOINER (Cf)   x 1 at [18]
    U+2060 WORD JOINER (Cf)             x 1 at [33]
```

## The message, and the one consequence Jon should see

```
We cannot sanitise Chinese, Japanese or Thai yet. Nothing is wrong with your
document, and scanning it for hidden characters is still free.
```

**"Sanitise" is the word on the button they just pressed**, so it is their
vocabulary, not ours. No blame, no em dashes, and the second sentence says what
they can still do. The workbench needs no change: its error path already prints
`result.message` for any code it does not recognise.

**THE CONSEQUENCE, STATED PLAINLY BECAUSE IT FOLLOWS FROM THE RULING RATHER THAN
FROM A BUG.** The workbench sends `layer_b: true` automatically for anything
carrying prose — there is no toggle a visitor can turn off. So **a Chinese
document cannot be sanitised through the site at all now**, not even for its
layer A characters, which the scan above proves are there and removable. The
ruling was "refuse rather than price", and refusing the request is what that
means. The free scan still shows them what is hidden. If Jon would rather they
could still buy the deterministic layers, that is a different ruling and it needs
the browser to ask for it, which is Lane C's file.

## Korean is in. Lao, Khmer, Burmese and Tibetan are not, and that is a gap

**They have exactly this hole and are one entry away from being closed.** Jon's
ruling named three scripts, so three is what this does. **Recorded in `06` rather
than decided here.**

---

# 4 — THE BORROWED NOTE. Replaced

**`engine/text_unicode.py:554` carried the upstream project's own wording,
unchanged, and it is sent to every browser on every scan.**

**Before:**

```
Load-bearing invisibles are preserved by default during cleaning: emoji glue,
CJK/Mongolian variation selectors, script joiners, complete flag tag sequences,
same-script fillers/selectors (Mongolian FVS, Khmer inherent vowels, Hangul jamo
fillers), RTL directional marks/paired embeddings, and orthographic Arabic/Syriac
Cf marks. Inspection still reports bidi controls. Use explicit strip flags only
after review.
```

**After, out of the real engine on a real scan:**

```
Some invisible characters are load-bearing, and cleaning keeps them by default,
because taking them out would damage the writing rather than unmark it. Kept: the
joiners that hold an emoji or a flag together; the joiners that decide whether
two letters connect, in scripts such as Arabic and Devanagari; the variation
selectors and fillers that choose a letter's shape in Mongolian, Khmer, Hangul,
Chinese and Japanese; and the direction marks and paired embeddings that Arabic,
Hebrew and Syriac need in order to be read in the right order. Scanning still
reports every one of them, direction controls included, so they are kept in plain
sight rather than quietly ignored. The strip flags will remove them anyway, once
you have looked at what you would be removing.
```

**Same meaning, our words, and it now says why rather than only what.** One
string changed and nothing else in that file — the diff is a single line.

---

# WHAT JON HAS TO DO, AND ONE THING TO CHECK FIRST

| | |
|---|---|
| **1. Do not deploy from this tree yet** | **Another session is mid-flight in `apps/web/engine/uc_spans.py`.** A deploy now ships someone else's half-finished freeze work. This is the same "waits for a quiet tree" block the board already records for M-6, and the tree stopped being quiet during this session |
| **2. Then deploy, and watch the build** | If it fails with "the pattern defined in `functions` doesn't match any Serverless Functions", the switch does not reach an App Router route. Take the two lines out; that is the answer |
| **3. Then run one free test** | `UC_SITE=https://un-claude.com node scripts/verify-connection-drop-refund.mjs`. No model call, costs nothing. A refund row means M-6 is closed |
| **4. If no refund row** | Stop. `waitUntil` needs `@vercel/functions`, a new dependency, and that is yours |

**Nothing was pushed and nothing was deployed.** Committed locally, staged by
explicit path, `uc_spans.py` deliberately left out of the commit.
