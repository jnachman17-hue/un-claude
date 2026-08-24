MODEL: Opus 5, high effort. Two jobs. The second one is the reason this
session exists.

READ FIRST
1. **CLAUDE.md in full.** Section 4 governs. Copy work fires the
   `unclaude-messaging` skill — let it.
2. `docs/IMPLEMENTATION-BOARD.md`.
3. `apps/web/lib/analytics/events.ts` — read the whole file before adding
   to it. It has a shape and a naming convention; follow them.

TERRITORY:
  `apps/web/lib/analytics/events.ts`
  `apps/web/app/(marketing)/pricing/_components/buy-button.tsx`
  `apps/web/app/(marketing)/pricing/page.tsx`   — one FAQ answer, item 1
  `apps/web/app/(marketing)/_components/contact-form.tsx`
  `apps/web/app/(marketing)/(legal)/_components/legal.tsx`
  `apps/web/app/home/_components/purchase-banner.tsx`

**DO NOT TOUCH — SESSIONS MAY STILL BE LIVE IN THESE:**
  `apps/web/engine/**`, `apps/web/api/*.py`   <- the freeze session
  `apps/web/app/api/**`, `apps/web/vercel.json`, `engine/text_unicode.py`
                                              <- the route session
  `lib/server/credits.ts`, the workbench, `app/auth/**`
  `docs/IMPLEMENTATION-BOARD.md`

**Run `git status` FIRST.** If another session has files staged, **do not
commit until the index is clear** — a commit here would sweep their work
into yours. Say what you found.

**THE SITE IS LIVE AND TAKING REAL MONEY. Do NOT deploy. Do NOT push.**

═══════════════════════════════════════════════
JOB 1 — THE SUPPORT ADDRESS. Five places, verified present.
═══════════════════════════════════════════════
`support@un-claude.com` now forwards to Jon's inbox. **Confirmed working
end to end** — MX propagated, SPF live, a real message delivered.

Replace `unclaudeapp@gmail.com` with `support@un-claude.com` in:

```
app/home/_components/purchase-banner.tsx:110
app/(marketing)/_components/contact-form.tsx:32     (CONTACT_EMAIL)
app/(marketing)/pricing/page.tsx:264                (the refund FAQ)
app/(marketing)/(legal)/_components/legal.tsx:119   (the mailto href)
app/(marketing)/(legal)/_components/legal.tsx:122   (the visible text)
```

**Check for others before you finish** — those five were found by search
on 24 August and something may have moved since.

**Leave Stripe alone.** The receipts show `unclaudeapp@gmail.com` and that
is a Stripe dashboard setting, not code. Note it for Jon; do not chase it.

═══════════════════════════════════════════════
JOB 2 — THE FUNNEL STOPS BEFORE THE MONEY
═══════════════════════════════════════════════
`events.ts` instruments fifteen events and they cover the journey well:

```
own_text_entered · file_uploaded · scan_completed · scan_failed
sanitise_started · sanitise_completed · sanitise_failed
result_downloaded · paywall_shown · paywall_dismissed
paywall_signup_clicked · out_of_credits_shown · out_of_credits_clicked
signup_started · signin_started
```

**And then it stops.** There is **no checkout event and no purchase
event** — `buy-button.tsx` sends no analytics at all. Confirmed by search.

**So the one question this product exists to answer cannot be answered:
how many of the people who run out of credits actually buy?** The funnel
tracks a visitor all the way to the paywall and then goes dark exactly
where the money is. That instrumentation was written on 19 August;
**Stripe went live on the 22nd and nothing was added.**

**Add, in the existing style and naming convention:**
- **`checkout_started`** — the buy button posts to `/api/checkout`.
  Carry the pack id. **Never the price** — the price comes from
  `pricing-data.ts` server-side and a client-sent price is exactly the
  boundary this product refuses to cross.
- **`checkout_failed`** — the button already handles rate limits,
  unavailable checkout, and unreachable. Distinguish them.
- **`purchase_completed`** — fire it where the customer lands after
  paying. **Read `purchase-banner.tsx` first**; that component exists
  because there is already a post-purchase return path. **Do not invent
  a new one.**

**THE RULE THAT MATTERS MORE THAN THE EVENTS.** This site is **cookieless
by deliberate decision**, and `analytics-provider.tsx` says in its own
comment that if that configuration changes, **the privacy and cookie
policies change in the same commit and the site needs a consent banner.**

- **Send no personal data.** No email addresses, no names, no account
  identifiers that resolve to a person, and **nothing from the customer's
  document — not the text, not the filename, not a hash of either.**
- Counts, types, outcomes and pack ids only.
- **If you find yourself wanting to identify a user, stop and write it
  up.** That is a policy change and it is Jon's.

═══════════════════════════════════════════════
WHAT YOU CANNOT DO, AND SHOULD NOT PRETEND TO
═══════════════════════════════════════════════
**You cannot verify events arrive in PostHog** — that needs Jon's
dashboard login. What you CAN do, and must:

- Show the event firing in the **browser network tab** against a local
  build, with the payload, so the shape is proved.
- **Confirm no personal data is in that payload**, by reading it.

Then write Jon a short numbered walkthrough for PostHog itself: where to
look to confirm events are arriving, and how to build **one** funnel —
visitor → scan → sanitise → out of credits → checkout → purchase.
**One funnel he will actually read beats six dashboards he will not.**

═══════════════════════════════════════════════
FINISHING
═══════════════════════════════════════════════
Jon is not a programmer. Paste the real before and after for every address
change, and the real network payload for every new event.

A step you skipped is a step that failed. Say which, at the top.

Write `docs/session-notes/email-and-analytics.md`.

Before EVERY commit run `git diff --cached --name-only`. Never
`git add -A`, `git add .` or `git commit -a`. **Do NOT deploy or push.**
