# Paste this into a new Opus chat

---

I'm Jon. Non-programmer. I direct this project by describing outcomes, not by
reading code. Explain everything in plain English and define any technical term
the first time you use it. **Read `CLAUDE.md` in full before anything else** —
sections 1, 4 and 5 govern how you work with me, especially "an assertion that
something works carries no weight here: run it and show the real output".

## The project

un-claude.com. It removes AI watermarks from text and files. The tool lives on
the landing page and works without an account. Credits: 2 free for anyone,
3 more for making a free account, 1 credit = 1,000 words, a file is 1 flat
credit.

## What happened in the previous session

Three phases of frontend work, all committed and all verified: the credits
interface (the empty-balance offer, the paywall, the coin, sign-up landing on
the tool), cutting text density on two tables, and a whole-site mobile pass.
The full record is in `docs/session-notes/` — read `credits-ux.md`,
`density-cuts.md`, `mobile-pass.md`, `credit-funnel-verified.md`,
`what-signup-still-has-not-proven.md`. **There is a picture of the mobile
before/after at `docs/mobile-before-after.png`.**

Then we tried to verify the credit system against the real database, and got
stuck on ONE thing.

## THE BLOCKER, and where to start

**Creating an account fails.** On the sign-up form I get:

> Sorry, we could not authenticate you
> We have encountered an error. Please ensure you have a working internet
> connection and try again

**That message is a red herring.** It is the "last resort" fallback in
`packages/features/auth/src/components/auth-error-alert.tsx`, shown whenever
the real error text matches none of that file's patterns. My internet is fine.

**START HERE, it takes thirty seconds:** the previous session just fixed the
logging so the real reason gets printed. Have me try to sign up once, then run:

    grep -o '"message":"sign-up failed[^"]*"' apps/web/.next/dev/logs/next-development.log | tail -3

`useSignUpWithEmailAndPassword` in `packages/supabase/src/hooks/` does
`throw response.error.message`, so the thrown value is a bare STRING. That
string is Supabase's real message and it has never been seen. **Once you have
it: tell me what it means in plain English, fix the cause, and add a matching
pattern to `auth-error-alert.tsx` so the next person gets a true sentence
instead of the internet-connection line.**

## What is already RULED OUT, so don't re-test these

- **Not captcha.** Probed the endpoint directly with an invalid password and
  got `422 weak_password`, so the request reaches password validation. Captcha
  protection is currently OFF in Supabase (I turned it off; **it must go back
  on before launch** — see `captcha-blocks-every-sanitise.md`).
- **Not the dev bypass.** That was a separate red herring earlier and is now
  off, and the tool prints a warning when it is on.
- **Not the welcome-grant migration.** I pasted it; it works.
- **Not a network problem.**

## What IS already proven, so don't redo it

Guest sessions, the 2-credit welcome grant, spending (text priced by words,
files at 1 flat credit), the balance matching the ledger, the empty-balance
offer firing on a real zero, the paywall costing nothing to hit, layer A
removal counted, and layer B rewriting text. All run against the real hosted
database. See `credit-funnel-verified.md`.

## What is still UNPROVEN and is the goal once sign-up works

1. **The 3-credit signup grant** on the current code.
2. **The guest merge.** `mergeGuestInto` has NEVER run: zero `adjustment` rows
   in the ledger's whole history. This is the code that decides whether
   somebody keeps credits they already had when they sign up mid-job, and its
   failure mode is silent.
3. **The wallet at `/home`** has never been rendered or looked at on a phone.

**The test:** one sanitise as a guest (balance 2 → 1), then sign up in the same
browser, then check the ledger. **Final balance 4 = the merge works. 3 = it
silently dropped my credit.**

Read the ledger with: `cd apps/web/scripts && node read-ledger.mjs 20`

## Two migrations NOT applied to the hosted database

Both are the parallel session's security work, written but not pasted:

- `20260821120200_rate_limits.sql` — the log currently errors on every scan
  with `Could not find the function public.rate_limit_hit`. Non-fatal, caught,
  but rate limiting is inactive.
- `20260821120300_signup_grant_email_dedupe.sql` — `credit_ledger.grant_email`
  does not exist. There is a working fallback so grants still land, but the
  per-inbox dedupe is off, meaning plus-addressed emails can each claim a
  signup grant. **Useful for testing right now; paste it once testing is done.**

## Environment facts that cost the last session real time

- **The Browser preview pane cannot do mobile work on this site.** Any width
  under 768px turns on device emulation and the landing page never finishes
  hydrating; it looks catastrophically broken and is not. Use the repo's
  Playwright driving the installed Chrome instead:
  `cd apps/e2e && node mobile-probe.mjs /` and `node mobile-shots.mjs / <dir>`.
  Do NOT run `npx playwright install`; `channel: 'chrome'` uses the Chrome
  already on the Mac.
- **Do not test auth over the LAN IP** (`192.168.x.x:3000`). It is not a secure
  context, so WebCrypto is missing and PKCE degrades, and Supabase will not
  redirect the confirmation email there. Use `http://localhost:3000` on the Mac.
- **Dev server is on port 3000.** Start it with the "web" config in
  `.claude/launch.json`, never with Bash.
- **A second session may be running in this folder.** Stage commits by explicit
  file path, and **read what `git diff --cached --name-only` prints before every
  commit** — the git index is shared and another session's files get swept in
  otherwise. Write notes to `docs/session-notes/<topic>.md`, not to
  `04-decision-log.md` or `07-runbook.md` directly.
- Local is far ahead of `origin/main` and nothing is deployed. **un-claude.com
  is live but serving the OLD build**, so it is not a substitute for local
  testing. Do not push or deploy without asking me.

## How I want you to work

Show me real output, not descriptions. If something fails, say so in the first
sentence. Push back if I am wrong about something. Don't create accounts for me
or delete anything from the database — I'll do those parts.
