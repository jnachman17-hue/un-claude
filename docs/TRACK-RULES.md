# The four tracks, and the rules that stop them colliding

**Written 19 August 2026.** Work on un-claude now runs as four parallel sessions.
This file is short on purpose. **Read it before doing anything in any track.**

---

## The four tracks

| Track | Owns | Handoff |
|---|---|---|
| **1. Billing** | Pricing decision, Stripe, credits, the ledger, the paywall made real | `TRACK-1-BILLING.md` |
| **2. Landing page** | Everything a visitor reads or looks at | `TRACK-2-LANDING.md` |
| **3. Trust and correctness** | The defects that break in front of a paying customer | `TRACK-3-TRUST.md` |
| **4. Analytics and admin** | Funnel events, Google, the rename, session replay | `TRACK-4-ANALYTICS.md` |

---

## File ownership. This is the collision rule and it is not advisory

**A track edits only the files it owns.** If work requires a file another track
owns, **stop and tell Jon** rather than editing it. He decides which session takes
it.

| Path | Owner |
|---|---|
| `packages/billing/**` | 1 |
| `apps/web/app/api/billing/**` | 1 |
| `apps/web/supabase/**` and any migration | 1 |
| `apps/web/app/(marketing)/pricing/**` | 1 |
| `apps/web/app/(marketing)/(legal)/**` | **1** |
| `apps/web/app/(marketing)/_components/**` | 2 |
| `apps/web/app/(marketing)/page.tsx` | 2 |
| `apps/web/app/(marketing)/how-it-works/**` | 2 |
| `apps/web/app/(marketing)/capabilities/**` | 2 |
| `apps/web/app/(marketing)/mission/**` | 2 |
| `apps/web/public/images/**` | 2 |
| `apps/web/styles/**` | 2 |
| `apps/web/api/*.py` | 3 |
| `apps/web/engine/**` | 3 |
| `apps/web/lib/engine/**` | 3 |
| `apps/web/app/api/tool/**` | 3 |
| `packages/features/auth/**` | 3 |
| **`_components/workbench/**`** | **3** |
| `apps/web/components/analytics-provider.tsx` | 4 |
| `apps/web/config/auth.config.ts` | 4 |

**The three that will actually cause trouble:**

**`_components/workbench/**` belongs to TRACK 3, not track 2.** It looks like
landing page work and it is not: it holds the credit gate, the paywall trigger and
every engine call. Track 2 must not touch it even to change a colour. Ask.

**The legal pages belong to TRACK 1, not track 2.** They look like content and
they are not: payments change the terms, the privacy policy and add a governing
law section, and those edits must ship in the same deployment as the billing they
describe. `06` row 46.

**`apps/web/.env` and `turbo.json` are shared.** Any track may need to add a
variable. **Append only, never reformat, and pull first.**

---

## Shared documents

**`04-decision-log.md`, `06-assumptions-and-open-questions.md` and
`07-runbook.md` are written by every track.** That is the highest collision risk
in the project.

**The rule, in order, every time:**

1. `git pull --rebase` **before** you start writing to a shared document
2. **Append.** Never rewrite an existing entry that another track authored
3. Head your addition with the track number, e.g. `### 61. [T3] ...`
4. Commit the shared document **on its own**, immediately, not batched with code

**Never** `git add -A`, `git add .`, or `git commit -a`. `CLAUDE.md` section 5,
and it has already caused a collision in this project.

---

## Before you push, every track

```bash
cd ~/un-claude && git pull --rebase && npx vercel@latest ls | head -3
```

**Look for `Ready`.** A site returning HTTP 200 proves a server is alive, not that
your code is on it. This project has served a healthy page for three hours while
every deployment behind it failed.

---

## Things every track must know

**Layer B is ON in production** and costs real money per run, gated only by a
browser counter. `06` row 47. Off switch:
`npx vercel@latest env rm UC_ENABLE_LAYER_B production`.

**Any variable needed at BUILD time must be in three places:** Vercel, `turbo.json`
`globalEnv`, and `apps/web/.env` as blank documentation. Turborepo strips
undeclared variables and the build succeeds silently without them. `07-runbook.md`.

**`ENGINE.md` section 6 does not describe production.** No `UC_LAYER_B_*` variable
is set. Run `npx vercel@latest env ls production` before believing any config
table.

**Do not touch `~/Documents/GitHub/Blotter-Claude`.** `CLAUDE.md` section 3.
