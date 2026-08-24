# Conductor handoff — 24 August 2026

**You are the conductor for un-claude.com. This file is how you pick up.**

**Read in this order:** `CLAUDE.md` (all of it — sections 1, 4 and 5 bite) →
this file → **`docs/IMPLEMENTATION-BOARD.md`, which is the live to-do list and
the only file you update.** Everything else is history.

---

## THE ROLE, IN ONE PARAGRAPH

You do not build. You decide what gets built, in what order, by which model, and
you write the brief that Jon pastes into a fresh chat. When he reports back you
**read the session note, VERIFY its claims by probing rather than reading, and
update the board.** Verification is the job. **Five confident findings have been
wrong in this project — including two of the conductor's own** — and every one
was caught by running something rather than reading something.

**Jon is not a programmer.** Explain in plain English, define terms once, show
the artefact rather than a summary of it. He wants pushback, not agreement.
**Recommend, do not enumerate.**

---

## WHERE THE PRODUCT IS

**un-claude.com is live and takes real money.** The full money loop is proven on
real money: a purchase credited, a refund debited exactly, all four ledger
invariants holding. Stripe is live, card-only, US customers only.

**Done and verified since launch:** the refund clamped to the payment with the
shortfall recorded · free credits once per inbox · the prompt leak closed · layer
A now runs *before* the rewrite · the engine's own AI tells stripped · nine of
nine canonicals · Deployment Protection closed the free-access URLs · the cost
leak closed · CJK refused at the door · the support address moved to the domain ·
the analytics funnel extended past the paywall.

---

## WHAT IS RUNNING RIGHT NOW

| Session | State |
|---|---|
| **E-9, the freeze** | **IN FLIGHT.** `apps/web/engine/**`. Its note will be `docs/session-notes/e9-freeze.md` |
| **Cowork press drafting** | **DONE.** Nine drafts in `docs/session-notes/press-emails-phase-2.md`. **Jon is unhappy with them — see the critique on the board** |

---

## THE THREE RULES THAT KEEP PARALLEL WORK SAFE

1. **One lane per territory. Never two writers in one file.** Every collision
   this project has had came from ignoring this.
2. **Sessions share one git index.** Every brief must say: run
   `git diff --cached --name-only` before every commit. Never `git add -A`.
3. **Only Jon applies migrations, and only Jon deploys.** Deploys ship the
   **working tree, not git**, so never deploy while a session has edits on disk.

---

## THE IMMEDIATE SEQUENCE

**1. E-9 lands → verify it → deploy.** The deploy is the unlock: E-9, the route
session's cost-leak and CJK work, the email address, and the analytics funnel are
all committed and **none of them is live.**

**2. Then M-6, four steps, in `docs/IMPLEMENTATION-BOARD.md`.** Step 2 may be the
answer on its own — if the build fails naming the `functions` pattern, the switch
does not reach an App Router route and the two lines come out.

**3. Then the Lane D remainder**, which E-9's measurements unblock: the four
"enforced rather than promised" claims, the three-word ceiling, "nine classes",
and the honest size ceiling.

**4. Then press**, once the gate closes.

---

## WHAT JON OWES, AND NOBODY ELSE CAN DO

- **Deploy** (blocked on E-9) and then M-6's four steps
- **Top up the AI Gateway** — $5.44, the live site shares that key, and
  **timed-out reasoning calls bill invisibly** (own-accounting said $0.13; the
  gateway said $1.91)
- **Change the Stripe receipt address** to `support@un-claude.com` — dashboard,
  not code
- **Decide:** extend the CJK refusal to Lao, Khmer, Burmese and Tibetan?
- **Decide:** `@vercel/functions` if M-6 fails · Sentry's dependency ·
  Supabase Pro backups
- **Decide:** the Sharma sequencing (board)
- **PostHog:** build the one funnel the analytics session left a walkthrough for

---

## RULINGS THAT ARE SETTLED. Do not reopen these.

| Ruling | Where |
|---|---|
| **No public attribution of the upstream.** Licence satisfied, notice kept | `04`, board |
| **The hero keeps "100% of detectable marks removed."** The *panel* was the incoherent half and it changed instead | `04` 134–135 |
| **The news logos have no links. Intentional** | Jon, 23 Aug |
| **CJK is refused, not priced** | Jon, 24 Aug |
| **Both freeze tiers ship** (structure and quotations) | D1 |
| **Freeze attributed quotations, leave unattributed free** — a watermark lives where the model had a choice; inside a real quotation it had none | D2 |
| **A failed freeze hands back the chunk, explains, and refunds above a threshold** | D3, changes `04` entry 22 |
| **Open weights only.** `deepseek/deepseek-v3.2` recommended and live | D5 |
| **Guest credits carry over once, ever** | ratified |

---

## THINGS THAT CANNOT BE FIXED. Never let them be promised.

- **Whether a statistical watermark was removed is not measurable — by anyone.**
  Layer B stays best effort and the site says so.
- **A term of art restated wrongly is not findable by a program.** "Beyond a
  reasonable doubt" came back as "with absolute certainty" and survived 1 of 40.
- **Invented facts and sources.** Not findable.
- **Nothing has been tested past 8 chunks** while a 10,000-word document is 34.

---

## THE HABITS THAT HAVE ACTUALLY WORKED

- **Probe, do not read.** The phantom `noindex` (twice), a payment path asserted
  as wired that was never deployed, an `sk_live` grep that matched a comment, a
  Radar tier that only exists in test mode, an analytics finding from a probe
  that could not have detected it, a CJK exploit that was latent rather than
  live. **All caught by running something.**
- **Name the territory AND the no-go list in every brief.**
- **Make sessions say what they could not prove.** The best notes in this project
  lead with it.
- **Sessions leave work uncommitted.** Three did. Check the tree yourself.
- **A guard that fires on good work is worse than the defect it prevents.** This
  has nearly shipped twice.
