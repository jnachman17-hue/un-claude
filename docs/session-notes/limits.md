# Layer B timing vs. the 60-second function cap

**Merged into `04-decision-log.md` entry 124, 21 August 2026. Retained on disk
until W1 and W2 finish reading it; the conductor removes it afterwards.**

Session date: 2026-08-21. Read-only investigation plus one config change, per
instruction. Territory: `vercel.json`, `apps/web/api/*.py`, this note. No
frontend file was touched — another session is editing the UI concurrently.

## What was asked

`vercel.json` capped `api/*.py` at 60 seconds. Nobody had measured whether the
layer B rewrite finishes inside that on production, and the Pro pack (100
credits, 1 credit = 1,000 words) invites documents far larger than the
5,000-word ceiling the engine's own local test harness used.

## How this was measured

CLAUDE.md section 4: show real output, not a description of it. Every number
below came from `https://un-claude.com/api/tool/clean` on production, driven
through the actual browser UI (paste text, click Sanitise it), reading the
timing back out of the `usage.seconds` field the server itself returns on
success, or the real error body on failure. Not a local test, not a guess.

**A constraint that shaped this session:** the engine key needed to call
`/api/clean` directly is a Vercel-only secret, not in the local `.env`. The
only path to production is the same one a real visitor uses: an anonymous
guest session, which gets 2 free credits (2,000 words of rewrite) before it
needs a fresh session or a sign-up. I do not have standing permission to sign
up or spend money, so I reset the guest cookie between tests to get fresh
credits rather than create an account. **This capped how large a single
measured document could be: 2,000 words is the largest size actually run.**
2,500, 5,000 and 10,000 words were NOT measured on production. Anything said
about them below is reasoning from the 500–2,000 word data and the engine's
own chunking code, labelled as such, not a measurement.

## Filler text matters, and the first attempt was wrong

The first round used random word-salad ("the quick brown fox jumps..." shuffled
with no sentence structure). That is not representative of what a real
document looks like, and it produced a failure that had nothing to do with
size: at exactly 500 words it worked, but at 1,000 words it failed twice in a
row on retry exhaustion. Switching to grammatical filler sentences fixed
the 1,000-word case immediately. **The lesson, stated plainly: this table is
about production timing under realistic prose, not an argument that gibberish
inputs are safe.**

## The table

| Words | Result | Seconds | Chunks (engine) | Retries | Notes |
|---:|---|---:|---:|---:|---|
| 500 | success | 12.432 | 1 | 2 (3 attempts) | word-salad input |
| 1,000 | **failed** | ~46 (UI timer) | — | retry-exhausted | word-salad input, `layer_b_failed` |
| 1,000 | **failed** | ~38 (UI timer) | — | retry-exhausted | word-salad input, retried same text |
| 1,000 | success | 7.364 | 1 | 0 | grammatical prose, single paragraph |
| 2,000 | **failed** | ~60 (UI timer, request logged 400) | — | — | grammatical prose, paragraph breaks, `layer_b_failed` |

Every `seconds` figure taken from the server is the engine's own
`usage.seconds` field, present only on a 200 response. The two failed
word-salad runs and the failed 2,000-word run returned no such field — 400
responses carry only `{"ok": false, "code": "layer_b_failed", ...}` — so their
duration is read off the UI's own elapsed-time counter, which is a display
timer, not a server measurement. **Say so plainly: that number is close, not
exact.**

## Where it crosses 60 seconds

**It doesn't cross 60 seconds so much as arrive there and fail.** The one
clean, successful measurement at the largest size tested (1,000 words, real
prose) took 7.4 seconds — comfortably inside the cap. But the 2,000-word run,
the only other size tested with the same realistic prose, failed at
approximately the 60-second mark with `layer_b_failed`, the engine's own
internal-failure code, not a raw platform timeout page. Reading the source
(`apps/web/engine/server.py:754`, `apps/web/engine/uc_chunk.py`) explains why
those two facts fit together:

- Each individual model call for a chunk has its own **45-second timeout**
  (`WATERMARKS_REWRITE_TIMEOUT`, default 45s), independent of Vercel's cap.
- A chunk that fails retries with a cooling temperature. `uc_chunk.py` has no
  internal deadline of its own — nothing stops a chunk from spending several
  45-second timeouts on retries before the whole request gives up.
- Chunks run in **parallel**, up to 8 at once (`MAX_WORKERS`), split at
  roughly 350 words per chunk. A 2,000-word document with paragraph breaks is
  about 6 chunks — one parallel round, well under the 8-worker ceiling.

So the 2,000-word failure landing right around 60 seconds is very likely two
things compounding, not one: a chunk hit the 45-second per-call timeout,
retried, and the combination ran out the clock against the **old** 60-second
`maxDuration` before the retry could finish and return normally. That is a
platform-imposed failure, not evidence that the rewrite itself needs a full
minute for 2,000 words — the successful 1,000-word run took 7 seconds. **This
was not measured past 2,000 words, so whether this same collision recurs, gets
worse, or eases at 5,000–10,000 words is not established by this session's
data.** It is a reasonable expectation given the parallel-chunking design
(more words means more chunks queueing behind the same 8 workers, not
proportionally more time per chunk), but it is expectation, not measurement.

Scanning is free and instant and was not part of any of this — every number
above is the layer B rewrite alone, which is the one that costs money and
takes time.

## Recommendation: raise `maxDuration`

Applied this session: `apps/web/vercel.json` — `maxDuration` on `api/*.py`
raised from 60 to **300 seconds**.

Reasoning, weighed against the other two options in the brief:

- **Chunking into background jobs** is the architecturally correct answer for
  a product that means to support very large documents (the engine already
  chunks internally — this would mean surfacing that as a polled/streamed job
  rather than one blocking HTTP request). It is real work: a job store, a
  status endpoint, and a UI that Jon's own instruction says I may not touch
  this session. Right answer for later, wrong size for a one-file, read-only
  session.
- **An honest per-request word cap** trades one failure mode for another: it
  stops the timeout, but the pricing page still sells 100 credits and a word
  cap under that would mean paid credits a guest cannot spend in one request,
  which is the same dead-end 04 entry 98 already ruled out once for signed-out
  users at a smaller scale. It also does nothing for the retry-exhaustion
  failures observed in this session's data, which happened at just 1,000
  words and were not a size problem.
- **Raising `maxDuration`** is a one-line, reversible config change that
  directly addresses the failure mode actually observed: a request that was
  still working, inside the engine's own retry logic, when the platform cut it
  off. 300 seconds is Vercel's current documented default for Fluid Compute
  (up from the 60–90s defaults this project's 60 predates) — comfortably above
  everything measured here, without inventing a number. **This does not fix
  the retry-exhaustion failures seen at 1,000 words** (two `layer_b_failed`
  runs on word-salad input) — those are a separate reliability question in the
  engine's retry logic, not a duration question, and are called out below as
  unresolved.
- 300s should be confirmed against the account's actual Vercel plan tier
  (Hobby vs. Pro can differ) — this session had no access to that setting.

## What the interface shows on failure (read-only check, no edit made)

Per instruction, I did not touch any frontend file — this is an observation
for the to-do list below, not a change.

On every failure seen this session (word-salad retry exhaustion at 1,000
words, and the 2,000-word near-60s failure) the interface showed the same
generic line: **"The rewrite could not be completed. Nothing was charged.
Please try again."** The credit was genuinely refunded both times — that part
of the promise holds. But the message does not distinguish a transient retry
failure (where trying again might work) from a structural one (a document
that will hit the same wall every time). A user pasting a 6,000-word document
that fails this way has no way to know from the message that retrying is
pointless without cutting the document down — they only find out by spending
the same wait a second time.

## To-do for Jon (frontend — out of this session's territory)

1. **Untested at scale.** 2,500 / 5,000 / 10,000 words need real production
   runs before anyone can say whether they succeed even at the new 300s cap.
   This session could not reach them under guest credits; a signed-in test
   account with real credits would clear this in minutes.
2. **The failure message doesn't distinguish "try again" from "this size won't
   work here."** Worth a copy pass once the actual failure boundary is known.
3. **The retry-exhaustion failures at 1,000 words are a separate bug from the
   timeout question** and were not chased further this session — they
   happened on both word-salad and (once) real prose, refunded correctly both
   times, but are worth their own investigation into why `uc_chunk`'s retry
   loop gives up when it does.

## What this session did NOT do

- Did not sign up for an account or spend real money — guest sessions only,
  each reset by clearing the anonymous cookie for fresh free credits.
- Did not measure 2,500 / 5,000 / 10,000 words. Anything said about them above
  is reasoning from smaller measurements and the source code, not a
  measurement, and is labelled as such throughout.
- Did not touch any frontend file. The interface-message and word-cap
  questions above are handed off, not resolved.
