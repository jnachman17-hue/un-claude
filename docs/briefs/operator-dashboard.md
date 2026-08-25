# BRIEF — the operator dashboard

**Written by the conductor, 25 August 2026. Paste this whole file into a fresh
session.**

**Jon is running a live business that takes real money and he cannot see it.
Build him one command that answers: how much money came in, how much is going
out, how many people used it, what broke, and how much runway is left on the
gateway.**

---

## 0. READ FIRST

Read `CLAUDE.md` in full. **Section 1 (Jon is not a programmer) governs this
whole job** — he is the only user of what you build. **Section 4** (run it and
show the real output) and **section 8** (render it and look at it) both bite.

**The verification standard:** an assertion carries no weight. **Every number
this dashboard prints must be traceable to a real API call you can show.**

---

## 1. WHAT IT IS, AND WHAT IT IS NOT

**It is one command Jon runs that writes a single self-contained HTML file he
opens in a browser.** A snapshot of right now, regenerated whenever he runs it.

**It is NOT a hosted page, NOT a live-streaming dashboard, and NOT anything
deployed to un-claude.com.** Reasons, and do not design around them:

- **It reads live secrets** — Stripe's live key, the Supabase service role key,
  the AI Gateway key. **Those must never leave Jon's machine and must never
  reach a browser other than his own.**
- A hosted version needs auth, and auth on a page holding the Stripe live key is
  a much bigger job with a much worse failure mode.
- **Nothing in this job touches `apps/web/app/**` or gets deployed.** If you
  find yourself editing the website, you have gone wrong.

---

## 2. YOUR TERRITORY

**Yours:**
- `apps/web/scripts/dashboard/**` — new directory, all your code
- `docs/session-notes/operator-dashboard.md` (create it)

**NOT yours:** everything else. Specifically **`apps/web/app/**`,
`apps/web/lib/**`, `apps/web/engine/**`, `engine/**`, `supabase/**`,
`vercel.json`, and `docs/IMPLEMENTATION-BOARD.md` (conductor only).**

**Hard rules:**
- **Never `git add -A`, `git add .`, `git commit -a`.** Stage by explicit path.
- **`git diff --cached` — THE DIFF, NOT THE FILE LIST — as its own SEPARATE
  step before every commit, and read it.** Three separate calls: add, check,
  commit. The conductor broke this rule by chaining them with `&&`.
- **Do not push or deploy.** Committing locally is yours.
- **NO NEW DEPENDENCIES without asking Jon** (`CLAUDE.md` section 5). Node's
  built-in `fetch` and the Supabase client already in the repo are enough. **A
  charting library is a dependency — draw with inline SVG instead.**

---

## 3. ★★ CREDENTIALS — READ THIS TWICE

**Three of the four already exist on this machine. Do not print, echo, log, or
copy any value.**

```
apps/web/.env.local        STRIPE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY,
                           NEXT_PUBLIC_SUPABASE_URL
.env.engine.local          AI_GATEWAY_API_KEY
```

**Existing scripts already read these correctly — copy their pattern rather
than inventing one.** `apps/web/scripts/read-ledger.mjs` reads the project's own
`.env.local` for Supabase. Reuse it.

**The fourth does not exist yet: a PostHog Personal API Key.** Jon must create
it (Settings → Personal API keys, scoped read-only to Query + Insights).
**Read it from `POSTHOG_PERSONAL_API_KEY` in the environment.**

**IF IT IS ABSENT, THE DASHBOARD MUST STILL RUN** and show the PostHog panel as
"not configured", with the one line Jon needs to fix it. **A dashboard that dies
because one of four sources is missing is useless to him.** The same applies to
every source: **one dead API must degrade one panel, never the page.**

**The generated HTML must contain NO SECRETS.** Numbers only. Grep your own
output for the first six characters of each key before you call this done, and
paste the result of that check.

---

## 4. THE FOUR SOURCES, AND WHAT TO ASK EACH

### A. Stripe — the money that came in
`STRIPE_SECRET_KEY`, REST API over `fetch`. **READ-ONLY. Never create, modify,
refund or cancel anything.**

- Revenue today, last 7 days, last 30 days, all time
- Number of successful payments, and the most recent few with date and amount
- **Refunds and disputes, counted and totalled** — Jon needs the bad news too
- **Say whether the key is live or test mode** on the page, in plain words. He
  should never have to wonder which world he is looking at.

**Jon made his first real sale on 25 August 2026. That sale must appear.**

### B. AI Gateway — the money going out, and the runway
`AI_GATEWAY_API_KEY` against `https://ai-gateway.vercel.sh/v1/credits`.

```json
{"balance":"14.99...","total_used":"10.00..."}
```

**★ THE TRAP, AND IT ALREADY TOOK THE SITE DOWN ONCE.** On 24 August every model
returned HTTP 402 — *"API key budget exceeded. Current spend: $10.00, limit:
$10.00"* — **while `balance` still read $14.99.** The spend limit is on the KEY
and **this endpoint does not show it.** A session read `balance` as headroom and
the live site's paid rewrite was down.

**So: show `total_used` as the number that matters, and label `balance` so it
cannot be mistaken for headroom.** If the key's cap can be read from any API,
show the gap; if it cannot, **say plainly on the page that the cap is invisible
here and must be checked in the Vercel dashboard.**

**Add a live probe:** one cheap call to the gateway, and report **"serving" or
"REFUSED (402)"**. That single line would have caught the outage immediately.

### C. The database — usage and the credit ledger
Supabase service role, tables `credit_ledger` and `run_costs`.
**READ-ONLY. `SELECT` only. Never insert, update or delete — the ledger is
append-only by design and that is the only protection it has.**

- Accounts created, over time
- Credits granted, spent, refunded
- **Runs performed, and what they cost us** (`run_costs`) — this is the real
  unit economics: revenue per credit against cost per run
- Failed and refunded jobs

**These are EXACT counts, not sampled analytics.** Say so on the page — it is
the difference between this panel and the PostHog one.

### D. PostHog — behaviour
Personal API key, HogQL query endpoint.

**Twenty events already exist**, listed in `apps/web/lib/analytics/events.ts`.
Build the funnel from the ones that matter:

```
pageview -> own_text_entered / file_uploaded -> scan_completed
         -> paywall_shown -> checkout_started -> purchase_completed
```

Plus: pages visited ranked by count, `scan_failed` and `sanitise_failed` counts,
`checkout_failed` with its reasons.

**★ TWO THINGS THE PAGE MUST STATE, because they change how Jon reads it:**
1. **Filter out internal traffic.** Jon is configuring PostHog's internal-user
   filter. **Apply the equivalent in your queries and say on the page that you
   did**, or his own visits inflate everything.
2. **`persistence: 'memory'` is deliberate and ruled** (`04` entry 68; the live
   cookie policy promises it). **A visitor who leaves for Stripe returns as a
   new person, and a returning visitor is always new.** So `purchase_completed`
   **cannot** be joined to the visit that caused it, and visitor counts are
   inflated against real humans.
   **Print that caveat next to the funnel, in plain English.** Jon must never
   read a PostHog conversion rate as truth. **The Stripe and database panels are
   the truth; PostHog is the shape.**

---

## 5. WHAT IT MUST LOOK LIKE

**Jon is not a programmer and this is the only thing he will use.** `CLAUDE.md`
section 8: read it as the person who opens it at 7am on a phone.

- **The five numbers that matter go at the top, big**: money in, money out,
  gateway runway, runs performed, failures.
- **Anything wrong is visible without reading** — a refused gateway, a failed
  job, a dispute. Colour and position, not a number buried in a table.
- **Every panel says where its number came from** — "Stripe, live mode",
  "database, exact", "PostHog, see caveat".
- **Timestamp it.** A snapshot with no time on it is a lie waiting to happen.
- **Plain English labels.** Not `total_used`. Not `run_costs`. Not `p50`.
- **It must work with no network on one source** — one panel degrades, the page
  still opens.

**Define technical terms the first time.** If a term cannot be avoided, explain
it in the panel.

---

## 6. HOW TO PROVE IT

- **Run it and paste the real terminal output**, plus the real HTML rendered and
  screenshotted (`CLAUDE.md` section 8).
- **Paste the actual numbers it produced**, including Jon's first real sale.
- **Show the secret-leak check** on the generated file.
- **Show what it does when a source is unreachable** — unset one variable, run
  it, screenshot the degraded panel.
- **State the read-only guarantee and how you enforced it**: no Stripe write
  endpoints called, no SQL beyond SELECT.

## 7. WHAT TO HAND BACK

`docs/session-notes/operator-dashboard.md`, **written as you go, not at the
end**: the command Jon runs, what each panel means in plain English, what each
source can and cannot tell him, and **a section titled "What I could not
prove."**

**Also hand back, in one place at the top: exactly what Jon must do**, which is
at minimum creating the PostHog key. **Write it as steps for a non-programmer,
the way this brief's own instructions are written.**

Commit locally by explicit path. **Leave nothing uncommitted.** Do not push.

## 8. MODEL AND EFFORT

**Opus, high reasoning effort.** It touches a live Stripe key and a service-role
database credential, and the failure mode is leaking one of them into a file.
