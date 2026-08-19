# Track 3: Trust and correctness

**This is not a miscellaneous track. It is the one that stops un-claude breaking
in front of a paying customer.** Every item here is a known defect with a name.

---

## Read these, in this order, before anything

| # | File | Why |
|---|---|---|
| 1 | `CLAUDE.md` | The rules, especially section 4. **An assertion that something works carries no weight** |
| 2 | `docs/TRACK-RULES.md` | **File ownership. Four sessions are running in parallel** |
| 3 | This file | |
| 4 | **`docs/07-runbook.md`** | **Read it properly. Every trap in this project is in there, and this track will hit most of them** |
| 5 | `apps/web/engine/ENGINE.md` sections 4, 6, 9, 10 | Chunking, the config warning, what is proven, what is not |
| 6 | `apps/web/engine/API.md` sections 11 and 12 | The lock, and two payload shapes that have already misled a session |
| 7 | `docs/06-...` rows **13, 47, 48, 50, 57, 58**, then 20, 36 | This track's work list |
| 8 | `docs/04-decision-log.md` entries 22, 23, 30, 31, 48, 49 | Why the guards behave as they do |

---

## What this session has to achieve, in priority order

**1. `06` row 13. Auth errors show the literal text `<DefaultError />`.**
The most visible defect in the product. Only three errors have messages; every
other failure, including wrong email format, weak password and rate limiting,
renders a placeholder at a stranger. **Google sign-in went live 19 August 2026, so
people hit this now.** The real message already exists and is unused:
`auth.errors.default` in `apps/web/i18n/messages/en/auth.json`. Traced to
`packages/features/auth/src/components/auth-error-alert.tsx` line 37.

**2. `06` row 48. `usage_record()` records no words, tokens or retries.**
`04` entry 22 promised those three so pricing would not guess. **This is the only
open item that gets strictly worse every day it runs, because the data cannot be
backfilled.** Track 1 is waiting on it. Do it early.

**3. `06` rows 47 and 57. Layer B has no real gate.**
It is live in production and costs money per run. The only limit is a
`localStorage` counter a private window resets. `clean.py` claims "Layer B is
signed-in only, 04 entry 22" and **entry 22 does not say that and nothing enforces
it.** Make the comment true or delete it.

**4. `06` row 58. No rate limiting.**
The engine trusts anything holding the key, which is the site. Any visitor can
drive our own routes as fast as they like.

**5. `06` row 50. Set the layer B variables explicitly.**
`npx vercel@latest env ls production` returns zero `UC_LAYER_B_*` variables.
Three defaults happen to match the intended value; retries does not, and is 8
rather than the documented 3.

**6. `06` row 36. Nothing is tested.**
No test suite exists. Untested: legal text with defined terms, academic writing
with citations, quotation-heavy journalism, CVs, and deliberately hostile input.
**Quotations are the known structural weak spot**, because a quote that survives
verbatim is preserved wording by definition, which is the exact channel the mark
rides on.

**7. `06` row 20. File upload abuse surface.** A 5MB cap and a format list are the
only defences.

---

## Traps this track will hit, all of them already documented

**Never write invisible characters through a shell command.** They are destroyed
silently and it looks like a broken detector. Build them from code numbers. **This
project's subject matter is invisible characters and it has been caught three
times.**

**The harness is the likely defect, not the thing being measured.** Eight
measurement errors in one session. Before believing a failure, prove the check
itself on a case where you already know the answer.

**`grep ... | head && echo "found"` prints "found" when grep matched nothing.**
That reported a key as present when it was absent.

**Reproduce any front end bug in a NEW tab before diagnosing it.**

**`ENGINE.md` section 6 does not describe production.** Nothing is set.

---

## What you must not do

**Do not edit the landing page components** outside `_components/workbench/`, which
you own. Track 2 owns the rest.

**Do not edit legal pages or billing.** Tracks 1.

**The engine is vendored from `guillaumemeyer/watermarks-remover`, MIT.**
`PROVENANCE.md` must not be deleted. Editing engine code is allowed where it is
broken: a real crash was found and fixed there on 19 August, `06` row 42.
