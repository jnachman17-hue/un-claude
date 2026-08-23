# Post-audit plan — 23 August 2026

**Source: `docs/session-notes/f1-audit.md`** (3,460 lines, ~50 findings, most
reproduced by hand against the live site). Its own "WHAT TO DO, IN ORDER" is
sound and this plan follows it, grouped by **territory** so sessions can run in
parallel without colliding.

**The audit corrected the conductor.** It found that analytics works; the
conductor had committed the opposite from a probe that could not have detected
it. Corrected on the board. That is a point in the audit's favour.

---

## PHASE 0 — JON, RIGHT NOW. No code, no session.

| # | Action | Why it is first |
|---|---|---|
| **1** | **Turn on Vercel Deployment Protection** | **Verified by the conductor: all six deployment URLs are publicly reachable and the API answers.** Old builds run the paid rewrite with no account and no charge, on Jon's gateway key. No account = no rate limit; no credit check = no spend cap. **The only finding with no ceiling on what it can cost.** One switch closes all of them and every future one. |
| **2** | **Lock down or delete the Supabase storage bucket** | Any free account can upload any file, any type, any size, to a **public** bucket — and **deleting the account does not delete the file**, which the privacy policy says it does. Nothing in the product shows a profile picture, so deleting the bucket is cleaner than securing it. |
| **3** | **Add MX records + point the confirmation email at un-claude.com** | One DNS change and one Supabase setting close three findings: no `support@` can exist, the confirmation link shows a raw Supabase domain, and the support channel is a `mailto:` to an address that cannot receive. |
| **4** | **Schedule the ledger backup** | Still unscheduled. Cheapest while the table is small. |

---

## PHASE 1 — FOUR PARALLEL SESSIONS. Territories are disjoint.

### S1 — MONEY. Start first; it is the only one losing real money today.
**Territory:** `lib/server/credits.ts`, `app/api/stripe/**`, `app/api/checkout`, migrations.
- **The refund is wrong in both directions and one change fixes both.** Refund a
  purchase while another sits unused and it takes the *other* one's credits.
  Refund a spent purchase and it returns all the money while recovering almost
  nothing, with the shortfall recorded nowhere. **Clamp against what remains of
  that payment, not the account balance, and write the shortfall down.**
- **Free credits are mintable on repeat** — delete, sign up again, collect five
  more, forever, because the dedupe record lives on the ledger and the deletion
  cascade takes it. Key it to something deletion does not touch.
- Mint the grants at signup so a new wallet does not read "0 credits · Get credits".
- Write the cost column the privacy policy already promises is stored.
- **Any migration goes to Jon to apply. Nobody else applies migrations.**

### S2 — CLAIMS AND COPY. Cheapest, and it protects the thing the site is sold on.
**Territory:** `app/(marketing)/**` copy, FAQ, legal pages. **Not** the workbench.
- The four "enforced rather than promised" FAQ claims — **three fail against the
  product's own receipt.**
- "Upload a file and you get all three" — no accepted type gets all three.
- "A hard three-word ceiling" — the site's own receipt printed 6.
- "100% of detectable marks removed" — 15 found, 12 removed, 3 kept on purpose.
- "Nine classes checked" — one of the nine finds nothing.
- The news logos: a link behind them, or take them down.
- The account-deletion warning names teams and subscriptions that do not exist
  and never mentions credits.
- **Loads `unclaude-messaging`. Every fix here is a claim coming *down* to what
  is true, never a new one going up.**

### S3 — SECURITY AND INFRASTRUCTURE.
**Territory:** `app/auth/**`, `proxy.ts`/middleware, headers config.
- **Open redirect:** any `un-claude.com` link can land a visitor on any site,
  signed out. One condition on `/auth/callback`. Skeptics downgraded it to
  medium because the domain is days old — **which is exactly why it is cheap now.**
- Five of the six standard browser security headers are absent, including on
  sign-in.
- Auth pages: three different failures all say "please ensure you have a working
  internet connection". Two real cases and a **Resend it** button.

### S4 — WORKBENCH AND WALLET.
**Territory:** `_components/workbench/**`, header, wallet, `app/home/**`.
- The header credit count is frozen at page load and disagrees with the chip (6d).
- The chip wraps onto two lines (6e).
- Move the file-size check into the browser at ~3.2 MB — the polite message
  already written **can never fire**, because Vercel rejects the upload first.
- Credit check runs before the file check, so a customer is told to pay for a
  job that will then be refused.
- Wallet renders every ledger row with no pagination.
- Credit history prints UTC dates, so the Americas see tomorrow.
- Accessibility: `role="status"` on the working/finished/failed line, a name on
  the paste box and file input, a `<main>` landmark, a skip link.
- Per-page share tags (nine pages, one line each).

---

## PHASE 2 — THE ENGINE. One session, after W10 lands.

**Blocked on W10 (rewrite intelligence), which owns this territory right now.**
W10's design must be merged with these before anything is built, because they are
the same problem:

- **The rewrite invents quotations** and leaves them attributed to a named
  person, 3 of 3. **The only finding that can damage a student's academic
  record, and they cannot see it.**
- **The tool adds the signature it exists to remove** — em dashes, curly
  apostrophes, markdown asterisks the customer never typed. 8 of 8 runs; 95 em
  dashes added to a 10,000-word essay that had none. **Cheapest fix on the list
  and close to the most valuable.**
- **The advertised size is roughly twice what works.** 6,000 words completes in
  196s against a 240s cut-off; 7,500 and up fail. Fixing it also closes the retry
  burn, where each failed attempt costs 6–21 cents and the error invites a repeat.
- **The prompt leak is not closed.** 3 runs in 7 return the model discussing its
  own rules. **Same defect as the stray `---` divider.** Guard the *output*.
- Under 16 words, and for a whitespace-only box, the customer is charged and the
  screen says "Rewritten · Measured, not estimated" with 0% replaced.
- A dropped connection charges and does not refund.
- Length reported as "114% kept"; on repetitive text 22–29% silently deleted.

---

## WHAT PASSED, AND IT MATTERS

The two provable layers both work, tested properly rather than assumed: 15 of 15
planted invisible characters found; a real C2PA block found, named, removed and
confirmed absent from the returned bytes; a Word document returned uncorrupted
with its author gone and the panel honest about what it did. **The money boundary
holds** — no browser can change a price. Six concurrent jobs never overspent. The
ledger passes every integrity check. **And the economics are comfortable: the
cheapest pack against the most expensive work returns 27x what the job costs.**
