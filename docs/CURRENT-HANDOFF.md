# un-claude: Current Handoff

**Date:** 19 August 2026, end of session 5.
**Status: the product works end to end and cannot take money.**

**Work now runs as four parallel tracks. This file is an index. Your instructions
are in your own track file.**

---

## 0. Which file is yours

| Track | Read | Priority |
|---|---|---|
| **1. Billing** | `TRACK-1-BILLING.md` | **Jon's stated priority** |
| **2. Landing page** | `TRACK-2-LANDING.md` | Continuous |
| **3. Trust and correctness** | `TRACK-3-TRUST.md` | **Blocks track 1 on one item** |
| **4. Analytics and admin** | `TRACK-4-ANALYTICS.md` | Smallest |

**Every track reads `TRACK-RULES.md` first.** It carries file ownership, and four
sessions editing one repository is the largest new risk in this project.

---

## 1. What is live on `un-claude.com`

| | State |
|---|---|
| The tool | **Working.** Scan, hidden characters, file provenance, layer B rewrite with receipts, paywall |
| The engine | **Locked** behind `UC_ENGINE_KEY`, fails closed. Verified from outside |
| Layer B | **ON in production.** Costs money per run. Gated only by a browser counter, `06` row 47 |
| Landing page | Hero, marquee on real artwork, how it works, coverage table, limits |
| Pages | `/how-it-works`, `/capabilities`, `/mission` as a shell, three real legal pages |
| Sign-in | Email and **Google, live and branded** |
| Analytics | **PostHog, verified cookieless.** Funnel events added 19 Aug, `04` entry 66. **Policy text to match them is still outstanding, `06` row 68** |
| Payments | **None** |

---

## 2. The three things most likely to hurt

**Layer B is live and costs real money, behind a `localStorage` counter a private
window resets.** `06` row 47. Balance is fine, 22 cents spent ever. The exposure
changed shape when the site went public with sign-in.

**`usage_record()` records no words, tokens or retries.** `06` row 48. `04` entry
22 promised exactly those so pricing would not guess. **It cannot be backfilled,
so every day it runs is evidence permanently lost.** Track 3 owns it and Track 1
is waiting on it.

**Auth errors show the literal text `<DefaultError />`.** `06` row 13. Google
sign-in is live, so strangers hit this now.

---

## 3. Sessions so far

**1 to 3, 17 to 18 Aug.** Repository, documentation system, MakerKit Lite,
Supabase, deployed to `un-claude.com`, a humanizer built against a mocked engine.

**4, 18 to 19 Aug.** Rescoped from humanizer to watermark remover. Engine vendored,
proved and deployed. Eighteen decisions, entries 18 to 35.

**5, 19 Aug. The long one.** The landing page became the product. Engine locked
behind a key after being found open. A crash that broke every rewrite under 350
words, found and fixed. Receipts built. Layer B wired and switched on. Seventeen
logos. Three legal pages replacing the kit's public placeholder. PostHog
cookieless. Entries 36 to 55, `06` rows 37 to 60.

**In parallel, 19 Aug.** Google sign-in taken end to end and published.
`03-pricing.md` written from measured cost.

---

## 4. What has not been decided at all

Pricing, in every dimension: credits or subscription, pack price, signup
allowance, refund window. `06` row 18 and `03-pricing.md` section 6.

**And the hardest open question in the project:** how a free allowance is tracked
so it cannot be refilled by opening a new tab. `06` row 37.

---

## 5. Track 4, session 7, 19 August 2026

**Done.** Seventeen funnel events, `04` entry 66. The paywall's "Get credits" was
a plain anchor that reloaded the page and destroyed the visitor's in-memory id,
so the most important conversion step in the product could not be joined to
anything before it; it is now a `Link`, `06` row 67. PostHog's host corrected to
the US region in the two places that documented it as the EU one.

**Outstanding, and it is the first thing to pick up.**

**`docs/POLICY-CHANGES-PENDING.md` has not been applied.** It contains the exact
replacement wording for three passages in the privacy policy and one in the
cookie policy. Jon's instruction was that policy rewrites go to a separate
session, which overrides the same-commit rule, `04` entry 69. **Until it is
applied the published policy under-describes what is measured.** Nothing in it is
false; it is incomplete.

**Nothing has been pushed.** Publishing is Jon's call, `CLAUDE.md` section 5.

**Not verified, and it must be before anyone trusts a number.** The events were
proven by compiling the module and driving it in Node, because **the landing page
does not hydrate on a local machine at all**, `06` row 70. What is proven: every
event's exact payload, and that no fragment of a confidential filename or a real
sentence reaches any property. **What is not proven: that they fire at the right
moments in a real browser.** That needs one pass over the live site after a
deploy, watching `window.__events` with a stubbed `posthog.capture`, or the
PostHog live view.

**Session replay, `06` row 55, is still off and should stay last.** Beyond the
masking that row already names, there is an unverified second blocker: the
recorder may need to write a session marker to the device, which would end the
no-consent-banner property and turn a small job into a consent system. **Unproven
either way.** Testing it means starting a real recording against the production
PostHog project, which was not done unasked.

**The rename and the Google logo, `06` row 60, were not touched.** Jon said he is
handling them himself.
