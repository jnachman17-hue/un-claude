MODEL: Opus 5, high effort. Ten items, all of them things a visitor sees
or a customer is told about their money.

READ FIRST
1. CLAUDE.md in full. Section 4 (show the artefact, not a measurement of
   it) and **section 8 — think like the visitor** — both apply to every
   item here.
2. docs/session-notes/f1-audit.md — the friction, accessibility, and
   error-handling sections.
3. docs/IMPLEMENTATION-BOARD.md, Lane C.

TERRITORY:
  apps/web/app/(marketing)/_components/workbench/**
  apps/web/app/(marketing)/_components/site-header*.tsx
  apps/web/app/home/**  (the wallet)
  apps/web/app/api/tool/clean/route.ts  — **W-4 ONLY, see the warning**
  per-page `metadata` exports for W-9

**DO NOT TOUCH — TWO OTHER SESSIONS ARE LIVE IN THIS REPO RIGHT NOW:**
  apps/web/lib/server/credits.ts, app/api/stripe/**, app/api/checkout,
  apps/web/scripts/**, supabase/migrations/     <- the money session
  **apps/web/app/api/credits/route.ts**         <- the money session
  apps/web/app/auth/**, proxy.ts, next.config.mjs, characters.ts
                                                <- the security session
  apps/web/engine/**, apps/web/api/*.py
  The marketing page COPY and the legal pages
  docs/IMPLEMENTATION-BOARD.md

**The boundary that matters: you own how the header READS the credit
balance. You do not own what `/api/credits` DOES.** The money session is
changing that route. If your fix needs the route to change, stop and
write it up as a handoff.

**THE SITE IS LIVE AND TAKING REAL MONEY. Do not deploy. Do not push.**

═══════════════════════════════════════
W-1 — THE HEADER CREDIT COUNT IS FROZEN AND LIES. Do this first.
═══════════════════════════════════════
Sanitise something and the workbench chip drops to 2 while the header
still reads 3, until you navigate. **Two components, two sources of
truth, one frozen at page load.**

`site-header-account-section.tsx:84` fetches `/api/credits` once on mount
into `useState` and never re-reads. The workbench chip takes its number
from the sanitise response.

**This is a number about money that is wrong on screen, on a site taking
money.** Make the two agree after a spend. Do not fix it by polling every
few seconds — that is a request per visitor per interval forever for a
number that changes rarely.

═══════════════════════════════════════
W-2 — THE HEADER CREDIT CHIP WRAPS ONTO TWO LINES
═══════════════════════════════════════
Both desktop and mobile. It is the first thing a signed-in customer sees.

═══════════════════════════════════════
W-3 — THE FILE-SIZE MESSAGE CAN NEVER FIRE
═══════════════════════════════════════
Any file over about 3.2 MB fails, because **Vercel rejects the upload
before your code ever runs.** So the polite size message already written
into the product is unreachable, and the customer gets a generic failure.

Check the size in the browser, before the upload starts, and show the
message that already exists.

═══════════════════════════════════════
W-4 — THE CUSTOMER IS ASKED TO PAY FOR A JOB THAT WILL THEN BE REFUSED
═══════════════════════════════════════
The credit check runs **before** the file check, so an unsupported file
produces "you need credits" rather than "we do not accept this type".

**WARNING: this is the only item that touches a route the money lane
cares about, and it is money-adjacent.** Change the ORDER of the two
validations and nothing else. Do not touch credit maths, pricing, or
anything the route does with the ledger. If it cannot be done without
that, stop and write it up.

═══════════════════════════════════════
W-5 — THE WALLET RENDERS EVERY LEDGER ROW
═══════════════════════════════════════
No pagination. 82 rows is already 210 KB, and it only grows.

═══════════════════════════════════════
W-6 — CREDIT HISTORY PRINTS UTC DATES
═══════════════════════════════════════
So a customer in the Americas sees tomorrow's date on something they did
today. Render in the visitor's own timezone.

═══════════════════════════════════════
W-7 — THE "WORDS CLEANED" COUNTER GOES BACKWARDS ON RELOAD
═══════════════════════════════════════
Four consecutive loads, four different numbers, some lower than the last.
A public counter that goes down looks broken, or worse, invented. Either
make it monotonic or stop presenting it as a running total.

═══════════════════════════════════════
W-8 — SCREEN READERS: FOUR SMALL THINGS
═══════════════════════════════════════
No page has a `<main>` landmark or a skip link, across ten pages checked.
The paste box has only a placeholder and no accessible name. The file
input is in the tab order with no name. **And little announces working,
finished or failed** — the status line carries no role, so a blind
visitor gets no notification that their job finished.

Add `role="status"` to the status line, a name to the paste box and the
file input, a `<main>` landmark and a skip link.

**One finding here is UNRESOLVED and you should not assume it.** An agent
reported that the scan result being wrapped in a `<button>` makes it
unreadable; the conductor found the computed tree does not support the
strongest version of that claim. **Check it, do not inherit it**, and say
what you find either way.

═══════════════════════════════════════
W-9 — EVERY PAGE'S LINK PREVIEW SHOWS THE HOMEPAGE
═══════════════════════════════════════
Share any of the nine pages and the preview is the homepage's title,
description and image. One line each in the page's own `metadata`.

═══════════════════════════════════════
W-10 — SAY WHEN THE REWRITE DID NOT RUN. Jon's ruling.
═══════════════════════════════════════
A paste under 16 words is charged a credit, comes back byte-for-byte
identical, and the screen says **"Rewritten · Measured, not estimated"**
with 0% replaced. The engine already returns a `reason` explaining it and
**nothing in the interface reads it.**

**Jon has ruled: put the minimum at the front door.** Below 16 words the
Sanitise button is disabled with the reason visible, so nobody pays for a
reduced product and the decision happens before money moves. **The free
scan stays available at any length.**

A whitespace-only box is charged too. It should not be.

**Do NOT build the "what fraction will be frozen" pre-flight.** That
depends on engine work that has not shipped.

═══════════════════════════════════════
FINISHING
═══════════════════════════════════════
Jon is not a programmer and cannot check this by reading code. **Show the
real interface, at desktop AND phone width**, for every visual item. For
W-1, show the two numbers agreeing after a spend.

A step you skipped is a step that failed. Say which.

Write docs/session-notes/lane-c-workbench.md.

Before EVERY commit run `git diff --cached --name-only` and confirm only
your own files are listed. **Two other sessions are live in this repo**,
and a `git add` in either leaves their paths staged for your commit.
Never `git add -A`, `git add .` or `git commit -a`.
Do NOT deploy or push.
