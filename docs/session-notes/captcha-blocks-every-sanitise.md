# Every sanitise is blocked by captcha, not by the ledger

**Found 21 August 2026, session 10, by driving a real sanitise from a phone
browser and reading the network rather than the screen.**

## The chain, exactly

1. Jon presses **Sanitise it** on a phone.
2. Before any work is attempted the browser must hold a Supabase session, so
   `ensureSession` calls `signInAnonymously`, passing the Turnstile token if
   the site has one.
3. **Turnstile has produced no token.** The browser console carries Cloudflare
   error `600010`, which is Turnstile refusing the host it was loaded on. A
   real site key IS configured (`NEXT_PUBLIC_CAPTCHA_SITE_KEY`, 24 characters,
   real Cloudflare prefix); it is simply not valid for `localhost` or for the
   Mac's LAN address.
4. So the sign-in goes up without a token, and the hosted Supabase project,
   which has captcha protection switched ON, rejects it:

       POST /auth/v1/signup  ->  400
       {"code":"captcha_failed",
        "message":"captcha protection: request disallowed (no captcha_token found)"}

5. `ensureSession` returns false and the interface says
   **"We could not start a session. Please try again."**

## What this means for the credit work

**`/api/tool/clean` is never called.** Not once. The request dies two steps
earlier, which means:

- **The welcome-grant migration was never the blocker for this.** It is still
  required, and Jon has now run it, but it sits behind this.
- **Nothing about the credit system has been exercised end to end against the
  hosted ledger from a browser.** The paywall, the spend, the refund path and
  the balance all remain unproven in a real session. `04` entry 97 rehearsed
  them server side; the browser half has not run.

**Reproduced on both `localhost` and the LAN address**, so this is not a
consequence of testing from a phone. It is the state of the local environment
for everybody.

## The fix, and the recommendation

**Turn Supabase captcha protection off while testing, and back on with a
working Turnstile setup before launch.**

Supabase dashboard, this project, **Authentication**, then the attack or abuse
protection settings, and the toggle is named for captcha protection. One
switch. It is the only change that unblocks both the laptop and the phone.

**The alternative was considered and is worse for now:** adding `localhost` to
the widget's allowed hostnames in Cloudflare would fix the laptop, but a phone
reaches the dev server by IP address and Turnstile works in hostnames, so
phone testing would still fail. It also leaves a second thing to remember at
launch instead of one.

**THIS MUST GO BACK ON BEFORE LAUNCH, AND IT IS NOT COSMETIC.** With captcha
protection off, anonymous sign-ins are unlimited, and an anonymous sign-in is
what mints a browser two free credits. That is the credit-farming hole
`06` already has open under "the welcome grant is paid twice". Off is correct
for a pre-launch site with no traffic. Off is not correct the day it has any.

## Open question for Jon

**Which way do the real Turnstile keys get set up?** The widget currently
refuses localhost, so once protection goes back on, local development cannot
create a session at all unless either the widget gains `localhost` as an
allowed hostname or development uses Cloudflare's documented always-pass test
pair. **Working position: add `localhost` to the real widget**, because a test
key that always passes is a thing that can ship by accident and a hostname
entry is not. Not implemented, and it is Jon's Cloudflare account.

---

## CORRECTION AND RESOLUTION, 21 August 2026, later the same day

**Captcha protection is back ON, and a real sanitise works on localhost with it
on.** Jon switched it on and ran one. The blocker is closed.

**This note's diagnosis of the CAUSE was wrong, and the wrong part is the
sentence "it is simply not valid for `localhost`".** Jon confirms `localhost`
is, and always has been, in the Turnstile widget's allowed hostnames in
Cloudflare. So whatever `600010` means here, it is not a missing hostname.

**The `600010` console warning still appears on every page load and is not
fatal.** Verified after switching protection on: the warning is present in a
fresh browser, and a sanitise still completes. So it is noise rather than the
chain this note describes.

**What remains unexplained:** why Turnstile logs `600010` at all when the
hostname is allowed and the flow works. Not chased, because nothing is broken by
it. Worth a look only if sign-in or sanitising starts failing in production,
where this warning would be the first place to look.

**The open question at the end of this note is therefore CLOSED:** no test-key
arrangement is needed, and the real widget is in use on localhost.
