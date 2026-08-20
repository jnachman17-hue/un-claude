# Un-Claude: Current Handoff

**Date:** 19 August 2026, session 7.
**Status: the product works, the prices are decided, the ledger exists, and it
still cannot take money.** Stripe is the remaining gap and it is Jon's to open.

**The four parallel tracks are over.** Jon paused 2, 3 and 4 mid-session after
five collisions in one day, four of which ran through billing. **One session owns
everything now.** `TRACK-RULES.md` and the four track files are history; read
them only for what they recorded, not for who owns what.

---

## 1. What is live on `un-claude.com`

| | State |
|---|---|
| The tool | **Working.** Scan, hidden characters, file provenance, layer B rewrite with receipts |
| The paywall | **Real now.** Fires after 3 free sanitises. It never fired for images before, `04` entry 63 |
| Prices | **Decided and unbuilt.** `04` entry 67 |
| The ledger | **Table applied to live Supabase**, empty, unused. `20260819180000_credit_ledger.sql` |
| Payments | **None. No Stripe account yet** |
| Look | Un-Claude, Claude's orange with white text, deboxed counter and facts |
| Analytics | PostHog cookieless, 17 funnel events, policies updated to match |

---

## 2. Where the money work actually stands

**Decided:** one credit buys 1,000 words; a file with no words is a flat credit;
packs at **$4.99 / $9.99 / $24.99** for 10 / 25 / 100 credits; free is unlimited
scanning, 3 signed-out credits with no rewrite, +2 on signup; credits debited on
success and refunded on failure; statement descriptor `UN-CLAUDE.COM`; Stripe
rather than a merchant of record.

**Built:** the scan now returns what a job will cost **before** it runs, verified
live — 2,500 words comes back as 3 credits, an image as 1. The ledger stores no
balance anywhere; a balance is the sum of its rows, the Stripe event id is
uniquely indexed so a webhook delivered twice cannot pay twice, and
`spend_credits` locks before it checks.

**Not built:** everything Stripe. Products, prices, checkout, the webhook, and
wiring the paywall to real credits instead of `localStorage`.

**Blocked on Jon:** creating the Stripe account. His identity and bank details,
his alone. **Verification is not on the critical path** — the whole system can be
built and tested in the sandbox first.

---

## 3. The things most likely to hurt

**The free counter is still `localStorage`.** A private window resets it. `06`
row 47. It is a real gate now rather than a decorative one, but it is not a
strong one, and it stops mattering the moment credits are real.

**`06` row 79: white on the accent orange is 3.12:1 and fails AA for small
text.** Chosen deliberately with the number in hand. Do not silently darken it.

**`06` row 74: a Word document never gets the rewrite.** The engine runs layer B
only on plain text. Priced accordingly, but the interface still asks for a
rewrite it will not get.

**`06` row 77: the landing page intermittently does not hydrate on a local dev
server.** No error, no fetches, effects never run. **Restart the dev server
before believing a workbench change is broken.** It cost this session real time
twice.

---

## 4. What is next, in Jon's order

1. **The box rebuild.** Show only what applies to what was given, verdict first
   with the producer name as the headline, and make credits legible before a
   visitor commits. `06` row 63 and `04` entry 70.
2. **Stripe**, once the account exists.
3. Wording throughout. Jon is deliberately holding this until layout settles,
   `04` entry 70.

**Already done from his list:** the rename, Claude's orange, the page gradient,
the definition pass, the marquee band, the deboxed counter, plain-English
statistics, the named scope section, the paywall firing at all, the reset out of
a loaded file, the download beside the file, badges that go quiet after removal,
a state-following panel heading, and the tool above the fold on a phone.

---

## Added 19 August 2026, session 8. The messaging layer

**Appended, not rewritten, because session 7 was live in this folder at the time.**

**Copy and UI messaging now has a written source of truth that loads itself.**
`04` entry 79 has the reasoning.

| File | Role |
|---|---|
| `.claude/skills/unclaude-messaging/SKILL.md` | **Fires automatically** on any copy, landing page or section-order work |
| `.agents/product-marketing.md` | The full positioning. Read automatically by the three marketing skills |
| `CLAUDE.md` section 7 | The pointer that loads every session |

**Three skills installed** from `coreyhaines31/marketingskills`: `product-marketing`,
`copywriting`, `cro`. **They rank third under `CLAUDE.md` section 2.** They may
never override `ENGINE.md`, a decision log entry, or Jon.

**Four positioning facts that were previously nowhere:** the visitor is a student
on a phone near a deadline; they arrive already believing the threat, so the first
screen demonstrates rather than educates; the moral stance is restrained; the
destination is a credit purchase.

**Open, and flagged rather than filled in.** Two sections of
`.agents/product-marketing.md` are marked under-researched and must not be used
for copy without checking first: **section 5, the competitive landscape**, and
**section 9, the words students actually use.** A named third party detection
product must not appear in copy on a guess.
