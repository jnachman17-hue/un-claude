# Session note: the credits interface

**Session 10, 21 August 2026.** Phase 1 of a three-phase night: the credit
interface, then text density, then a mobile pass. To be merged into
`04-decision-log.md` and deleted.

---

## What was wrong, in Jon's words

> "after you complete 2 scans and use your 2 free credits it just says 0 left.
> Have an icon pop up somewhere prompting you to create an account to get 3
> free more, because you only know this exists if you try again and click scan
> and then get the locked message. Most people will see 2 free scans, then give
> up because they see their token at zero and not even try again."

That is the whole phase in one paragraph. Everything below either fixes it or
clears something out of its way.

---

## 1a. The lock was touching the top of the box

**Cause, and it was not padding.** The locked state had the blurred filler
text in normal flow and the message absolutely positioned on top of it. So the
box was exactly as tall as four blurred lines, and the message was centred
inside that fixed height. Anything taller than four lines had its top pushed
off the top edge, which is what was happening to the lock.

**Fix: the layers are the other way up.** The message is in flow and sets the
height; the filler is the absolute one. The box cannot now be shorter than its
own content, at any width, in any language, at any font size. Measured after
the change: the lock sits 28px below the top of the box in all three paywall
variants, and nothing scrolls inside it.

A floor of 184px is kept so the box does not shrink below the height of the
text area it replaces.

## 1b. The offer is an object now, not four words in a sentence

The signup grant used to be a clause: "Create a free account and 3 more
credits are yours". Jon: *"animate the 3 more credits in that message so it
pops out and you see it more and calls your attention, use color or font or
bold or underline or however, because no one actually reads."*

On the paywall it is now a badge on its own line between the heading and the
body: the coin, the figure at 19px, the words, on accent ground with a ring.
It lands with a bounce (`offer-pop`) and a light crosses it three times
(`sheen`), then stops. **Three runs, not infinite:** a thing that keeps
blinking while you try to read is the tacky version.

**Reduced motion.** Both use the existing global rule in `styles/globals.css`,
which collapses every animation on the site to its end state. Nothing new was
needed and nothing was opted out of it.

## 1c. "Anything left here follows you" is gone

Removed on Jon's instruction. It was true (the guest merge in `/api/credits`
does exactly that) but he does not want it said.

## 1d. The dead end, answered before it is reached

**The offer now fires on the balance reaching nought, not on an attempt
failing.** Nobody has to press a button that will not work in order to find
out that three more credits exist.

- It sits directly under the balance chip it explains, so the eye that reads
  "0 left" lands on the answer in the same movement.
- It also appears on arrival, for somebody coming back to a balance that was
  already spent. That population was previously unreachable by any prompt at
  all.
- **Two audiences, one shape.** A guest is offered the free grant, because
  asking a stranger for money before they have taken the free rung is the
  wrong order. An account holder has already taken it, so they are offered the
  packs.
- It is hidden while the paywall is up, because that screen is already making
  the identical offer inside the box above it.
- The balance chip gained an `empty` tone: at nought the coin greys out and
  the chip takes a ring, so a zero no longer reads like any other number.
- Two events added: `out_of_credits_shown` (with `just_ran_out`, separating
  "spent it in front of us" from "arrived empty") and `out_of_credits_clicked`.

**Jon's wording, given mid-session:** the guest line reads exactly
*"Sign up to receive 3 more free credits"*, and the second line about spent
credits and free scanning is gone.

**One judgement call, reversible.** With the sentence carrying the words "3
more free credits", the badge that sat beside it reading "3 free credits" said
the same thing twice. So in this band the badge is gone and the animation
moved onto the figure inside the sentence instead, which is closer to what the
1b brief asked for anyway. The paywall keeps the standalone badge, because
there the heading and body do not carry the number. **If Jon wants the badge
back beside the sentence, it is one line: put `<CreditOfferBadge />` back into
the guest branch of `OutOfCredits`.**

## 1e. The coin now belongs to the Tile

The old coin carried a thin inner ring and a drawn "U". At the 13px and 16px
it actually ships at, that turned into a target or a clock, and it shared no
device at all with the ratified icon mark (`04` entries 99 and 100).

**It now carries the Tile's one idea: a white round-capped diagonal knocked
out of the accent colour.** Same angle, same proportional stroke weight (12.5%
of the shape, matching the Tile's 3 in 24), same cut length as a fraction of
the shape. **Round rather than square,** so a coin still reads as currency
next to a number while being unmistakably the same family as the mark.

The square option (make the credit token literally the Tile) was considered
and rejected: a square does not read as money beside a count.

Before and after were rendered side by side at 64px, 32px, 16px and 13px and
shown to Jon in the session.

## 1f. Signing up lands on the tool, not the wallet

Implements the working position already written in `06`, "Where sign-up should
land you".

**New path `app.afterAuth` in `config/paths.config.ts`, set to `/`.**
`app.home` is unchanged and still the wallet: it stays in the account menu and
in the header's balance pill for anyone who wants the history. Only the
destination the auth flows use has moved. Seven call sites now read
`afterAuth`: the sign-in page, the sign-up page, `/auth/callback`,
`/auth/confirm`, `/auth/verify`, `/update-password`, and the already-signed-in
bounce in `proxy.ts`.

**And the balance is made to register.** Landing on the tool with the same
number that was on screen before you left does not read as news, so the two
route handlers mark the arrival with `?welcome=1` (see `app/auth/welcome.ts`)
and the tool answers with one line beside the balance: "Your credits are
ready". The flag is stripped from the address bar the moment it is read, so a
reload or a share does not replay it.

**Two traps found on the way, both recorded so nobody re-finds them:**

1. **`afterAuth` must stay a bare path with no query string.**
   `verifyTokenHash` in `packages/supabase` assigns it straight to
   `url.pathname`, which would encode the "?" into the path itself. The
   welcome flag is appended by the route handlers instead.
2. **The obvious alternative was a race.** Having `/api/credits` report
   whether it was the call that created the signup grant is true exactly once,
   and more than one component on the page calls that endpoint, so which of
   them learns the news is a coin toss. A parameter set by the route that
   performed the redirect is the same fact without the race.

## Also, on Jon's instruction mid-session

**The repeat password field is gone from sign-up,** along with the "Type your
password again below" hint. `refineRepeatPassword` stays in
`password.schema.ts` because the password RESET form still uses it, where
there is no email to fall back on.

---

## How this was verified

**A local Supabase is not available** (`06` row 11), so the states that need a
real ledger could not be reached by using the product. Two things were built
so they could be looked at rather than described:

- **`/dev/states`** renders every credit state at once with the real
  components and the real stylesheet. Development builds only, same guard as
  `/dev/credits`.
- **`/dev/credits` gained a balance override.** It pins what the tool believes
  this browser holds, so a state can be reached without spending anything.
  **Display only, and compiled out of production:** the server's ledger is
  untouched and still refuses work a browser cannot really pay for.

**What was actually seen, in the real tool at localhost:3000:**

| State | Result |
|---|---|
| Guest at 0 | Chip reads "0 left" with a greyed coin and a ring; the band below it reads "Sign up to receive 3 more free credits" with "Claim them" |
| Account at 0 | Same slot, "Your balance is empty", "Get credits" to /pricing |
| Arriving after sign-up | "5 credits / Your credits are ready", and `?welcome=1` stripped from the address bar |
| Sign-up page | Email and Password only. No repeat field, no hint |
| Paywall, all three variants | Lock 28px from the top edge, nothing scrolling inside |

Typecheck clean (`tsc --noEmit`, exit 0). Browser console clean. No horizontal
overflow at 375px or 1280px.

**Not verified, and it cannot be from here:** the actual redirect after a real
sign-up. That needs a live Supabase and a real email round trip. The seven
call sites were changed together and typecheck passes, but **the first real
sign-up in production is the test.** If it lands anywhere other than the tool,
the cause is a call site that was missed, and they are all named above.

---

## Left for Jon

- **"Sign in with Google" on the sign-up page should probably read "Sign up
  with Google".** It comes from the shared auth kit's translation key. Not
  changed, because it is one string used by both pages and splitting it is a
  copy decision, not a bug fix.
- **The guest band's badge**, described under 1d. One line to put back.
