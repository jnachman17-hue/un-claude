# Un-Claude: Current Handoff

**THE CREDIT SYSTEM IS BUILT AND WAITING ON ONE PASTE.** `04` entry 97:
2 welcome credits + 3 at signup, anonymous Supabase sessions as guest
identity, server-side enforcement live in `/api/tool/clean` (401/402/403 all
verified), the wallet at /home, the dev bypass at /dev/credits. **A real
sanitise fails until Jon pastes `supabase/migrations/
20260820210000_welcome_grant.sql` into the Supabase SQL editor** (the
`anon_grant` reason is not yet in the hosted check constraint; everything
else was rehearsed live against the hosted ledger and works). After that:
Turnstile keys, end-to-end funnel verification, then Stripe and the pricing
page rebuild.

**Date: 20 August 2026. Updated after session 9, the inner-pages rebuild.**
`04` entries 79 to 88 are the full record of the last two days.

**Session 9 in one line:** /how-it-works and /capabilities were rebuilt to the
landing page's visual grammar and claims boundary (`04` entry 88), /faq was
rebuilt with the real questions after the boilerplate version was deleted
(`04` entries 89 then 90, which supersedes it), and **Jon reviewed the rebuild
and ruled /capabilities finished while /how-it-works got a sell-mode copy pass
and his own redesign of the choice diagram** (`04` entry 91: shorter panels,
the trimmed Anthropic quote, the we-beat-it proof row, blank-and-fingers
drawing, 8.4 phone screens down from 12.4).

**The mission page was rewritten off a new argument** (`04` entry 92) because
the previous draft was a close paraphrase of a widely read X essay on the same
subject, in places word for word. New spine: they marked the output and not
the intake. Redesigned to the site's section grammar and connected to the
product.

**The site is now nine routes**, all returning 200: the landing page, how it
works, what we can do, why I built this, pricing, FAQ, and the three legal
pages. **No page on it is boilerplate any more.**

**One thing to check on the next dev server start:** the navigation label was
changed to "Why I built this" and the JSON is correct, but the running server
serves the old "Why we built this" from a cached dynamic import of the i18n
messages. It should correct itself on restart. `04` entry 92.

**One thing to know before editing any FAQ answer:** the words live in
`app/(marketing)/_components/faq-items.tsx` and **both the home page section
and /faq render that one array.** Edit there and both update. /faq groups them
into three and opens them by default; the home page runs all nine in order,
collapsed.

**Status: the site is launch-shaped. The one gap between here and taking money
is Stripe, and it is Jon's.**

**TWO PRICING QUESTIONS WAITING ON JON, `04` entry 108.** First: **the 30 day
no-questions refund of unspent credits** (`03-pricing.md` P6) is proposed but
never ruled, so it is deliberately absent from /pricing. It is the strongest
trust line still available there and a refund costs 56 cents where a dispute
costs about $24.50. Second: **the pack names**. Entry 67's table says Taster,
Standard, Pro; the page says Starter, Plus, Pro, on the grounds that "Taster"
reads British to a US student. Both are one word from him.

---

## 1. What is live on localhost, verified this session

| | State |
|---|---|
| The page | Hero + tool, marquee, Claude band, vendor table, FAQ. One argument, no text walls |
| The tool | Scan, sanitise, receipts, file clean, paywall, remove, copy button: **all tested live and passing** |
| Pricing | **/pricing REBUILT 20 August 2026, `04` entry 108.** Price is the hero, the credit is taught before it is spent, a slider mirrors the server's arithmetic, and no button pretends to sell. Wiring Stripe is three hrefs, three labels and deleting one status bar |
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
