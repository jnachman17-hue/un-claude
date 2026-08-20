# Un-Claude: Current Handoff

**Date: 20 August 2026, early morning. Rewritten at the end of the overnight
build session.** `04` entries 79 to 86 are the full record of the last day.

**Status: the site is launch-shaped. The one gap between here and taking money
is Stripe, and it is Jon's.**

---

## 1. What is live on localhost, verified this session

| | State |
|---|---|
| The page | Hero + tool, marquee, Claude band, vendor table, FAQ. One argument, no text walls |
| The tool | Scan, sanitise, receipts, file clean, paywall, remove, copy button: **all tested live and passing** |
| Pricing | **/pricing built** at the ratified prices. Buttons route to sign-up until Stripe lands |
| Mission | **Live**, Jon's words refined, first person |
| Logo | Drawn, in the header, the favicon and the share card |
| Vendor table | **Corrected against primary sources.** xAI never signed the EU code; Claude text is committed-not-live |
| Legal | Terms ready for Stripe activation: credits, refunds (30 days, unspent), failed-ops-free |
| SEO | Title, description, OG card, complete sitemap, robots |
| Theme | Light and dark only |
| Console | Clean |

## 2. Jon's morning list, in order

1. **Stripe.** Account, identity verification, business description, payout
   bank, 2FA, statement descriptor `UN-CLAUDE.COM`. `03` section 12c is the
   step-by-step. The site side is built up to the checkout call: swap the
   pricing buttons' hrefs when checkout exists.
2. **Vercel Pro before the first sale** (`03` 12c step 7), then deploy and
   spot-check production: the engine env keys, `UC_ENABLE_LAYER_B`, PostHog.
3. **Read `04` entry 86's "found and left for Jon" list**: the rewrite invented
   a dollar sign once (engine fact-guard tweak); the hero rides the
   announced-rollout ambiguity deliberately (his entry 84 posture ruling, worth
   one conscious re-read); stakes heading and marquee caption are placeholders
   in his voice.
4. **Say the word on the sample chip label** ("Try an example") and anything
   else the morning eye catches.

## 3. Standing cautions

- **The preview pane freezes background hydration.** `07` has the mechanism and
  the three-step discipline. Do not diagnose the app until the tab is fronted
  and the fiber probe returns true.
- **Layer B is off in production by default** (`UC_ENABLE_LAYER_B`); turning it
  on before credits are real spends money on the honour system.
- **No document outside `docs/` records decisions.** Write them down when they
  happen.
