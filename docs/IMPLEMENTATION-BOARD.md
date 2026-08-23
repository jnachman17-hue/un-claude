# Implementation board — W9 audit + W10 rewrite intelligence

**Created 23 August 2026.** Everything the two agent workflows found, turned into
work. **Sources:** `docs/session-notes/f1-audit.md` (~50 findings, most reproduced
by hand on the live site) and `docs/session-notes/rewrite-intelligence.md`
(~30 defects across 12 categories, 3,500+ measured runs).

**Grouped by TERRITORY, not by severity**, so lanes run in parallel without two
writers in one file — the failure this repo has had every single time it happened.

**THE CONDUCTOR IS THIS FILE'S ONLY WRITER.**

---

# ★ PART 1 — DECISIONS — ALL SETTLED 23 AUGUST

| # | Decision | **JON'S RULING** |
|---|---|---|
| **D1** | Ship the quotation freeze, or only the cheap structure tier? | **SHIP BOTH.** Cost is not the question. |
| **D2** | A quoted run with no attribution cue — freeze it or leave it? | **FREEZE ATTRIBUTED, LEAVE UNATTRIBUTED FREE** — and the reasoning is Jon's, not the workflow's. See below. |
| **D3** | When the freeze fails: refund, or hand back the chunk unrewritten? | **BOTH — hand back the chunk, explain, and refund — WITH A THRESHOLD.** One chunk failing: hand back and explain, no refund, because they received the work. A meaningful share failing: refund the job. Without the threshold, a customer who can reliably trip the freeze gets nine-tenths of a rewritten document *and* their money back — the same free-tier shape as the mintable credits. **Explain in every case. CHANGES `04` entry 22.** |
| **D4** | Tell the visitor what fraction will be frozen before they pay? | **YES, with a Continue/Cancel, and a louder prompt above 60%.** Wording below. |
| **D5** | Which model? | **DECIDE AFTER THE ENGINE LANE SHIPS. OPEN-WEIGHT ONLY** — no frontier models. **But the field tested was too narrow**: six models, four completing, all picked when cost was the constraint. Capability is the constraint now. **A wider bake-off is its own item — see E-10.** |
| **D6** | The advertised size ceiling | **Do not set the number yet.** W9 measured 6,000 completing at 196s against a 240s cut-off and 7,500+ failing — **but W10's chunk fix took one document 61% cheaper and job failures from 2-of-8 to 0-of-8.** Ship E-3, re-measure, then publish. |
| **D7** | `support@un-claude.com` on the site | Waits on the forwarding test email arriving. |

## D2's reasoning, in Jon's terms — record this in `04`

**A statistical watermark is embedded through the model's word choices.** That
signal can only exist where the model had a choice.

**Inside a genuine quotation the model had no choice** — it reproduced fixed text
from a source. So there is little or no watermark there to begin with, and
freezing it costs almost nothing real. The trigram number rises; what it measures
in those spans is largely irrelevant. **This is a stronger argument for the freeze
than the cost-benefit one the workflow made.**

**It inverts for invented dialogue.** Ask a model for a short story and it chooses
every word inside the quotation marks — full discretion, so that dialogue is
watermarked like the narration, arguably more, since dialogue is where a model's
tells concentrate. **Freezing it hands back the most watermarked part of the
document untouched, and charges for a rewrite.**

**So the test is: did the model have discretion over these words?** The attribution
cue ("Smith wrote", "according to") is the machine-readable proxy for *these words
came from outside*. Not a guess about importance.

## D4's exact wording — do not improvise it

> **We will return about 42% of this document exactly as you sent it.**
> That's text we've protected from being reworded — quotations, references and
> similar — so it comes back character for character. The other 58% gets the
> full rewrite.
>
> **Continue** · **Cancel**

**Two things it must NOT say.** Not *"to keep quotations verbatim"* — the machine
knows what it froze, not that it found a quotation, and the Sources latch would
have said that about an essay containing none. And **not that it reduces watermark
removal** — by D2's own reasoning the frozen spans carry little watermark, so that
warning understates the product, and it is unprovable in either direction anyway.
**Layer B is unverifiable; that cuts both ways.**

# ★ PART 2 — THE LANES

## LANE A — ENGINE. The biggest, and it has hard internal sequencing.
**Territory:** `apps/web/engine/**`, `apps/web/api/*.py`
**Blocked by:** nothing — D1–D5 are settled. **One session at a time — never parallel inside this lane.**

| ID | Work | Source | Note |
|---|---|---|---|
| **E-0** | **The safety net, before any other code.** `test_spans.py`: split every test document and reassemble it **with no model involved**, assert byte-identical. | W10 phase 0 | One agent's version passes 52/52 and caught a failure a substring count cannot see. |
| **E-1** | **REPAIR — free, and it fixes the AI tell the product exists to remove.** Strip markdown the customer never typed, restore their straight apostrophes and hyphens, put digits back where the model spelled a year out. | W10 phase 1 + **W9 1b** | Measured over 228 real outputs: curly apostrophe 819→0, markdown asterisk 644→0, em dash **359→0**. Cost: median **+0.0000**. **A tool that removes AI watermarks and then inserts 359 em dashes is undoing its own job.** |
| **E-2** | **REPORT — free, changes no output.** Ship the detector and five checks with the freeze **OFF**, nothing raising. | W10 phase 2 | First real measurement of how often a *customer's* quotation is rewritten. Every number so far comes from documents the agents wrote themselves. |
| **E-3** | **FIX — six things provably wrong today.** Move the invisible-character pass **before** the rewrite; word counting for Chinese/Japanese/Thai; four number-reader bugs; never end a chunk on a lone equation/table; stitch torn code fences; bound every new retry at one. | W10 phase 3 | **Today the rewrite runs first and destroys zero-width characters as collateral, so layer A reports removing nothing from a document that arrived carrying two.** The chunk fix alone: 61% cheaper, job failures 2/8 → 0/8. |
| **E-4** | **The output guard.** Reject a result opening with a line about rules, or carrying a bare `---` the input never had. Refund rather than return it. | **W9** | **The prompt leak is NOT closed** — 3 runs in 7 still return the model discussing its own rules. Same defect as the stray divider. |
| **E-5** | **Don't charge for a rewrite that didn't run.** Under 16 words, and for a whitespace-only box, the customer pays and the panel says "Rewritten · Measured, not estimated" with 0% replaced. | **W9** | Interface half is LANE C. |
| **E-6** | **Honest length + loss reporting.** Documents come back 6–14% longer reported as "Length 114% kept"; on repetitive text **22–29% silently deleted**. | **W9** | Pairs with E-7. |
| **E-7** | **Surface `structure_kept`.** The engine already computes it and **no file anywhere reads it.** | W10 rank 13 | *"The engine knew the equation had been deleted and told nobody."* |
| **E-8** | **Re-measure the ceiling and publish an honest number.** | W9 + D6 | After E-3. |
| **E-10** | **A wider open-weight bake-off.** Enumerate what the gateway actually offers and test credible candidates against W10's existing harness. **Measure timeouts (2 of 6 timed out last time) and SPEED — the ceiling is time, not money, so a better-but-slower model shrinks the document size that can be served.** After E-3. | D5 | Open weights only. |
| **E-9** | **FREEZE — its own session, and NOT YET.** Masking machinery: tolerant restore, mask numbers via the engine's own number reader, verify step, per-chunk masking and fallback. | W10 phase 4 | **See PART 3. This does not ship on the numbers the plan published.** |

## LANE B — MONEY. Start first. The only lane losing real money today.
**Territory:** `lib/server/credits.ts`, `app/api/stripe/**`, `app/api/checkout`, migrations
**Blocked by:** nothing.

| ID | Work | Note |
|---|---|---|
| **M-1** | **The refund is wrong in BOTH directions and one change fixes both.** Refund a purchase while another sits unused → it takes **the other one's** credits. Refund a spent purchase → full money back, almost nothing recovered, shortfall recorded nowhere. **Clamp against what remains of *that payment*, and write the shortfall down.** | **CRITICAL.** Real money, ordinary path, live today. |
| **M-2** | **Free credits are mintable on repeat.** Delete the account, sign up again on the same address, collect five more, forever — the dedupe record lives on the ledger and the deletion cascade takes it. Key it to something deletion does not touch. | **HIGH.** No ceiling on cost. |
| **M-3** | Mint the grants at signup, so a new wallet doesn't read "0 credits · Get credits". | MEDIUM |
| **M-4** | Write the cost column the privacy policy already promises is stored. | MEDIUM |
| **M-5** | The refund tool tells Jon money is owed on a payment already refunded in full. | HIGH |
| **M-6** | A dropped connection charges the customer and does not refund. | MEDIUM |
| — | **Any migration goes to Jon to apply. Nobody else applies migrations.** | |

## LANE C — WORKBENCH AND WALLET.
**Territory:** `_components/workbench/**`, header, wallet, `app/home/**`
**Blocked by:** nothing. **Coordinate with E-5/E-7 at merge.**

| ID | Work |
|---|---|
| **W-1** | Header credit count frozen at page load, disagrees with the chip (6d) |
| **W-2** | Header credit chip wraps onto two lines (6e) |
| **W-3** | Move the file-size check into the browser at ~3.2 MB — **the polite message already written can never fire**, Vercel rejects the upload first |
| **W-4** | Credit check runs before the file check, so a customer is told to pay for a job that will then be refused |
| **W-5** | Wallet renders every ledger row, no pagination — 82 rows is already 210 KB |
| **W-6** | Credit history prints UTC dates, so the Americas see tomorrow |
| **W-7** | "Words cleaned" counter goes backwards on reload |
| **W-8** | Accessibility: `role="status"` on working/finished/failed, a name on the paste box and file input, a `<main>` landmark, a skip link |
| **W-9** | Per-page share tags — nine pages, one line each |
| **W-10** | Show the short-paste skip reason, and the pre-flight freeze percentage (D4) |

## LANE D — CLAIMS AND COPY. Cheapest work here, and it protects what the site is sold on.
**Territory:** `app/(marketing)/**` copy, FAQ, legal pages. **NOT the workbench.**
**Blocked by:** nothing. **Loads `unclaude-messaging`.**

| ID | Work |
|---|---|
| **C-1** | Four "enforced rather than promised" FAQ claims — **three fail against the product's own receipt** |
| **C-2** | "Upload a file and you get all three" — no accepted type gets all three |
| **C-3** | "A hard three-word ceiling" — the site's own receipt printed **6** |
| **C-4** | "100% of detectable marks removed" — 15 found, 12 removed, 3 kept on purpose |
| **C-5** | "Nine classes checked" — one of the nine finds nothing |
| **C-6** | News logos: a link behind them, or take them down |
| **C-7** | Account-deletion warning names teams and subscriptions that don't exist, never mentions credits |
| **C-8** | `support@un-claude.com` everywhere (4 files) — **waits on D7** |
| **C-9** | The advertised size ceiling — **waits on D6 and E-8** |

**Every fix here brings a claim DOWN to what is true. None goes up.**

## LANE E — SECURITY AND INFRASTRUCTURE.
**Territory:** `app/auth/**`, `proxy.ts`/middleware, headers config
**Blocked by:** nothing.

| ID | Work |
|---|---|
| **S-1** | **Open redirect** — any `un-claude.com` link can land a visitor on any site, signed out. One condition on `/auth/callback`. Skeptics downgraded it to medium *because the domain is days old* — **which is exactly why it is cheap now** |
| **S-2** | Five of the six standard browser security headers absent, including on sign-in |
| **S-3** | Three different auth failures all say "please ensure you have a working internet connection". Two real cases and a **Resend it** button |
| **S-4** | `/favicon.ico` 404s — **97% of the production log is that one error**, making the log unreadable |
| **S-5** | The scanner's AI-marker list fires on the three ordinary words "in the world" |

---

# ★ PART 3 — WHAT MUST NOT SHIP YET

**E-9, the freeze, does not ship on the numbers W10 published.** Its own
adversarial verifier broke it with a false positive bad enough to destroy a
document.

**The "Sources" latch.** The detector treats any line reading *Sources*,
*References*, *Bibliography* or *Works cited* as the start of a reference list
**and never stops** — from there to the end of the document, every paragraph of
five words or more is frozen.

A 221-word history essay whose only unusual feature was a section headed
"Sources" containing **ordinary analytical prose** came back **56.1% frozen**,
delivered at 0.55–0.58 trigram overlap, **12 of 12 runs.** The customer pays for
a rewrite and gets their own essay back.

**And a second, structural one.** Both masking designs put the customer's real
text back *before* the engine's existing guards run — but those guards are handed
**the masked chunk**. Against the committed code, a flawless rewrite produced
`FactsLost` (complaining about the mask number itself) and a mask-heavy chunk
produced `LeakSuspected` → retry → **fail the job and refund a customer whose
rewrite was perfect.** **That is the W8 mistake exactly: a guard that fires on
good work.**

---

# ★ PART 4 — WHAT NOBODY CAN SOLVE

**Stated plainly so it never gets promised.**

- **Whether a statistical watermark was removed is not measurable** — not here,
  not by anyone. Every number in W10 measures *how much of the original wording
  came back*. **Layer B stays best effort.** This is the site's existing position
  and nothing found changes it.
- **Rank 4 — a technical term, hedge or legal standard restated wrongly.** *"Beyond
  a reasonable doubt"* survived **1 of 40 runs**, coming back as *"with absolute
  certainty"* — the opposite of the rule. **Not findable by a program**, and the
  customer cannot see it.
- **Rank 10 — invented facts and sources.** 19–23 of 149 runs. Not findable.
- **Rank 2's actual fix is not in the plan** — only the report. *"Sixty years"* →
  *"sixty decades"* still passes the fact guard afterwards, because `60` is still
  in the text and that is all the guard checks.
- **Nothing in W10 ran past 2,172 words or 8 chunks**, while a 10,464-word
  document is 34 chunks. **Mask loss at that size is unknown and must not be
  assumed to scale linearly.**

---

# ★ PART 5 — SEQUENCING

**Now, in parallel — three lanes, no shared files, no decisions needed:**
**LANE B (money, start first)** · **LANE D (claims)** · **LANE E (security)**

**Also now:** LANE C, if you want a fourth running.

**Then, once D1–D5 are ruled:** LANE A as a single session, in order
**E-0 → E-1 → E-2 → E-3**, then re-measure for D6/E-8.

**Then, and only then:** E-9 in its own session, with the Sources latch and the
guard-ordering defect fixed first and re-verified.

**Rationale:** E-1 is free, ships immediately, and fixes the defect where the
product inserts the very marks it exists to remove. E-2 costs nothing and tells
us for the first time how often this happens to real customers. Both land before
anything spends a point of rewrite aggressiveness.
