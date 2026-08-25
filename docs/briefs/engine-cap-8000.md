# BRIEF — cap the engine at 8,000 words

**Written by the conductor, 25 August 2026. Paste this whole file into a fresh
session. Small job, one number, and a false statement to a customer if it is
done carelessly.**

---

## 0. READ FIRST

Read `CLAUDE.md` in full — sections 1 (Jon is not a programmer), 4 (a run, not
an assertion) and 5 (stop and ask). Then read **§5.2 of
`docs/session-notes/tell-the-truth-about-runs.md`**, which found this gap and
could only close half of it.

**The verification standard:** an assertion carries no weight. Run it and paste
the real output.

---

## 1. THE PROBLEM

**The site now advertises 8,000 words. The engine still allows 10,000. They
disagree, and the browser trusts the engine.**

```
apps/web/app/(marketing)/_components/workbench/credits.ts:35
    export const MAX_WORDS = 8_000          <- changed, the site's number

apps/web/engine/uc_policy.py:43
    MAX_WORDS = int(os.environ.get("UC_MAX_WORDS", "10000"))   <- NOT changed

apps/web/lib/engine/client.ts:64
    'That is longer than 10,000 words, which is the most the rewrite can do
     in one go. Split it and run it in parts.'                 <- NOT changed
```

**`workbench.tsx:503` reads `scan?.billing?.over_limit ?? wordsNow > MAX_WORDS`
— the server's answer FIRST, the site's constant only as a fallback.** So:

| Case | Today |
|---|---|
| 8,500 words, before a scan | Refused, with the 8,000 message |
| **8,500 words, after a scan** | **Allowed through** — the server said `over_limit: false`, because its ceiling is still 10,000 |

**So a scanned 9,000-word document still runs and the site advertises a limit it
does not hold itself to.**

## 2. WHERE THE NUMBER CAME FROM — do not re-derive it, do not raise it

`docs/session-notes/freeze-every-quotation.md` §5.5. The ceiling is time, not
words: the site aborts at 240 seconds, documents run as waves of 8 parallel
model calls.

```
  8000 words -> 23 chunks -> 3 waves   at the worst per-wave time on record (65s) = 195s   FITS
 10000 words -> 29 chunks -> 4 waves   at the same rate                          = 260s   DOES NOT
```

**No model has ever actually crossed 240s in the lab — the worst of 63 runs was
30.8s. So this is an argument sized against the worst production figure on
record, not a measured crossing.** That is deliberate and it is not yours to
revisit.

---

## 3. YOUR TERRITORY

**Yours:** `apps/web/engine/uc_policy.py` · `apps/web/lib/engine/client.ts` ·
`engine/tests/**` · `docs/session-notes/engine-cap-8000.md` (create it).

**NOT yours:** `apps/web/app/**` — the site's copy is done and correct, do not
touch it · `apps/web/lib/server/**` · `supabase/**` · `vercel.json` ·
**`docs/IMPLEMENTATION-BOARD.md`, conductor only.**

**Hard rules:**
- **Never `git add -A`, `git add .`, `git commit -a`.** Stage by explicit path.
- **`git diff --cached` — THE DIFF, NOT THE FILE LIST — as its own SEPARATE
  step before every commit, and read it.** Three calls: add, check, commit.
  Other sessions have uncommitted work in `docs/04-decision-log.md` and
  `docs/06-assumptions-and-open-questions.md`.
- **Do not push or deploy.** Committing locally is yours.
- **No new dependencies.**

---

## 4. THE JOB

**1. `UC_MAX_WORDS` default 10000 → 8000** in `apps/web/engine/uc_policy.py:43`.
It is read from the environment with a default; **change the default.**

**★ CHECK WHETHER `UC_MAX_WORDS` IS SET IN PRODUCTION.** Run
`npx vercel env ls production` and look for it. **If it is set there, changing
the default does nothing on the live site and Jon has to change the variable
instead. Say which case it is, loudly, at the top of your note.** This is the
whole job — a default nobody reads is not a fix.

**2. `apps/web/lib/engine/client.ts:64` — the refusal message.** It says
10,000. It must say 8,000, and **it must change in the SAME commit as the
engine**, never before. The copy session deliberately left it alone because
changing it first would have made it fire at 10,001 while claiming 8,000 — a
brand new false statement.

**3. Find every other place the engine states its own limit.** Sweep for
`10000`, `10_000` and `10,000` across `apps/web/engine/**` and
`apps/web/api/**`. **Report what you find even if you do not change it.**

---

## 5. HOW TO PROVE IT

**The gate is free — it refuses before any model call, so this costs nothing.**

- **Drive the real engine** with a document just under and just over 8,000
  words and paste the actual `billing_estimate` output for both, showing
  `over_limit` flipping at the right place.
- **Show `over_limit: true` at 8,001 and `false` at 7,999.**
- **Run the full engine suite.** Baseline is **`842 passed, 1 skipped`**. Paste
  the real result. **Any test that hard-codes 10,000 must be found and updated —
  name each one and justify it.**
- **Then prove the site and the engine agree**, which is the actual point: a
  9,000-word document must now be refused *after* a scan as well as before it.
  If you cannot exercise the browser path, **say so** rather than assuming.

## 6. THE TRAP THIS JOB EXISTS TO CLOSE

**"Two implementations of one number" has bitten this project three times.**
After this change there must be exactly one ceiling, and the site, the engine
and the refusal message must all say 8,000. **If you find a fourth place that
disagrees, that is the finding — report it rather than papering over it.**

## 7. WHAT TO HAND BACK

`docs/session-notes/engine-cap-8000.md`, written as you go. The production
env-var answer at the top, the before/after `over_limit` output, the suite
result, and **a section titled "What I could not prove."**

Commit locally by explicit path. **Leave nothing uncommitted.** Do not push.

## 8. MODEL AND EFFORT

**Opus, medium reasoning effort.** It is a small change, but it is a customer-
facing number and the failure mode is a message that states one limit while the
code enforces another.
