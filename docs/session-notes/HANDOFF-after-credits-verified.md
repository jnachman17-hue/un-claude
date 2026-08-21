# Paste this into a new Opus chat

---

I'm Jon. Non-programmer. I direct this project by describing outcomes, not by
reading code. Explain everything in plain English and define any technical term
the first time you use it. **Read `CLAUDE.md` in full before anything else** —
sections 1, 4 and 5 govern how you work with me, especially "an assertion that
something works carries no weight here: run it and show the real output". Push
back if I'm wrong. Don't create accounts for me or delete anything from the
database — I'll do those parts.

## The project

un-claude.com. It removes AI watermarks from text and files. The tool lives on
the landing page and works without an account. Credits: 2 free for anyone,
3 more for making a free account, 1 credit = 1,000 words, a file is 1 flat
credit.

## Where things stand: THE FREE CREDIT SYSTEM IS FINISHED AND PROVEN

Every part of it now has a run behind it, against the real hosted database.
Nothing here is waiting on anything. **The next piece of work is Stripe.**

Session 10 notes are in `docs/session-notes/`. The ones that matter:
`guest-merge-double-runs.md` (the big one), `wallet-mobile-pass.md`,
`migrations-applied.md`, `credit-funnel-verified.md`.

## What session 10 did

**1. Sign-up was fixed** (by a parallel session — a missing foreign key between
the sign-in table and the accounts table). Accounts can be created again.

**2. The guest merge turned out to be badly broken, and is now fixed.** This is
the code that carries your credits over when you sign up after using the tool
signed out. It had never once run before this session. It had two defects that
both created credits out of nothing, plus a third hole nobody had noticed:

- It ran **twice** every time, because two page components each fetch the
  balance route on load and the merge lived in that route with no record that
  it had run. The account got double credits; the guest went to MINUS ONE.
- It decided "this is a conversion" from a cookie **that the same request
  deleted**, so every later page load paid a welcome grant that had just been
  correctly withheld. Accounts drifted to 7 credits against a ratified 5.
- With no per-account limit, you could **sign out, collect a fresh guest
  welcome grant, sign back in, and merge it across — repeatedly, forever.**

Fixed by a new `guest_conversions` table whose uniqueness rules make a
conversion happen once per guest and once per account, and by moving the whole
transfer into a locking SQL function (`merge_guest_credits`) so two requests
can't race. The merge now runs BEFORE the grants.

Proven end to end: one sanitise as a guest, then signing in, produced exactly
ONE transfer on each side and a final balance of 4. Repeated page reloads added
no rows at all.

**3. The wallet at `/home` was looked at on a phone** for the first time. Layout
was fine (390x844, no sideways scroll). Two defects found and fixed: the page
could not be prerendered and had never said so (a real build-time problem under
`cacheComponents: true`, fixed with `await connection()`), and the history said
**"Transfer +1"**, which means nothing to a reader — it now says "Credits from
before you signed up". Picture at `docs/wallet-mobile.png`.

**4. All pending migrations are applied.** `migrations-applied.md` has the table.
One of them, the rate-limit migration, had never been run and was broken: a URL
path written with a trailing wildcard inside a comment. Postgres NESTS block
comments, so those two characters swallowed the rest of the file. Fixed.

**5. Captcha protection is back ON** and a real sanitise works with it on.

## Verify any of it yourself, all read-only

    cd apps/web/scripts && node read-ledger.mjs 20        # the raw ledger
    cd apps/web/scripts && node verify-guest-merge.mjs    # 4 invariants, exits non-zero if broken
    cd apps/e2e && node wallet-shots.mjs shots/wallet     # the wallet at phone width

## THE ONE THING OUTSTANDING

**`node apps/web/scripts/verify-account-deletion.mjs` has not been run since the
append-only ledger migration was applied.**

It matters because that migration's own comment says the interaction was
**"REASONED, NOT EXECUTED"**: the append-only rule refuses every direct delete on
the ledger, and account deletion depends on a cascade delete getting through it.
If it doesn't, pressing "delete account" leaves the person's credit history
behind, which is a data-protection promise the privacy policy now makes.

The script creates a throwaway account, deletes it through the real delete path,
and cleans up after itself either way. **It creates an account, so Jon runs it or
explicitly approves it.** It exits non-zero if deletion is broken.

## Next: Stripe

Paid credits enter through the same ledger as everything else. Two things are
already built for it:

- `credit_ledger.stripe_event_id` has a unique index, so a webhook delivered
  twice cannot pay twice. Stripe delivers at least once, so it will happen.
- The wallet's "Get credits" button currently links to `/pricing` rather than
  being a dead Buy button.

Re-run `verify-guest-merge.mjs` after Stripe work — it's cheap and it catches
anything that disturbs the ledger's invariants.

## Two decisions waiting on Jon

**An account carries guest credits across once, ever.** That's what closes the
sign-out-and-farm hole. The cost: a signed-up user who later uses the tool
signed out leaves those credits stranded on the guest. Deliberate, recorded in
`guest-merge-double-runs.md`, **not yet ratified either way.**

**Real users open confirmation emails on a different device.** Found the hard
way: confirming in a different browser from the one holding the guest cookie
means the account is created and confirmed but never signed in, gets no credits,
and the guest keeps its credit — silently. That's a normal thing for real people
to do. Not investigated.

## Environment facts that cost real time

- **The Browser preview pane cannot do mobile on this site.** Below 768px it
  turns on device emulation and the landing page never finishes hydrating; it
  looks catastrophically broken and is not. Use the repo's Playwright driving
  the installed Chrome: `cd apps/e2e && node mobile-probe.mjs /`,
  `node mobile-shots.mjs / <dir>`, `node wallet-shots.mjs <dir>`.
  **Do NOT run `npx playwright install`** — `channel: 'chrome'` uses the Chrome
  already on the Mac.
- **Do not test auth over the LAN IP.** Not a secure context, so WebCrypto is
  missing and PKCE degrades. Use `http://localhost:3000`.
- **Dev server is on port 3000.** Start it with the "web" config in
  `.claude/launch.json`, never with Bash.
- **A second session may be running in this folder.** Stage commits by explicit
  file path and **read what `git diff --cached --name-only` prints before every
  commit.** Write notes to `docs/session-notes/<topic>.md`.
- **`[Cloudflare Turnstile] Error: 600010` appears on every page load and is
  harmless** — captcha works anyway. Unexplained. First place to look if
  sign-in or sanitising starts failing in production.
- Local is far ahead of `origin/main` and **nothing is deployed.**
  un-claude.com serves an OLD build. Don't push or deploy without asking Jon.
