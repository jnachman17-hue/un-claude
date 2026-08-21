# The credit system, run for real against the hosted ledger

**21 August 2026, session 10.** The first time any of this has executed from a
browser. `04` entry 97 rehearsed the server half; the browser half had never
run, because every attempt died at the captcha before reaching the code.

**Unblocked by Jon turning Supabase captcha protection off.** It must go back
on before launch: see `captcha-blocks-every-sanitise.md`.

---

## What was run

A brand new browser with no cookies, phone-shaped, against the real hosted
Supabase project. Three sanitises of an image carrying a planted generator
tag, then one of pasted text carrying a real zero width space.

## What the interface did

| Step | Balance | On screen |
|---|---|---|
| Arrive, nothing done | **2 free** | the welcome figure |
| After the first sanitise | **1 left** | "Sanitised" |
| After the second | **0 left** | **"Sign up to receive 3 more free credits"** |
| Attempt a third | 0 | the wall: "You have used your free credits" |

**The empty-balance offer built earlier tonight fired on a real balance of
nought, not a forced one.** That is the fix for the leak Jon reported, proven
in the product rather than in a gallery.

## What the ledger did

    id    account    delta  reason      endpoint  kind   words
    163   cd97145a     +2   anon_grant  -         -          -
    164   cd97145a     -1   spend       clean     file       0
    166   cd97145a     -1   spend       clean     file       0

**The third attempt wrote no row at all.** The wall stops the request before
any charge, which is what /pricing promises and what the ledger now shows.

**And the migration Jon pasted is confirmed by these rows existing.** The old
check constraint had no `anon_grant` in it; the insert on line 163 would have
failed against it.

## The main path, pasted text, including the rewrite

    IN  : The panel assessed the quarterly[ZWSP]data and decided the deployment
          should roll out in three phases instead of two.

    OUT : The committee reviewed the three-month statistics and resolved that
          the rollout would proceed in three stages rather than two.

    hidden characters   1 in, 0 out
    words               18 in, 19 out
    three word runs     16 in the original, 0 surviving
    elapsed             45 seconds
    ledger              167 +2 anon_grant, 168 -1 spend, text, 18 words

**Read the two halves of that differently, because they are not equally
provable and the whole claims boundary is this distinction:**

- **The hidden character is a fact.** One went in, none came out, countable
  either side. That is layer A and it is proven.
- **Zero surviving three-word runs is a measurement of the rewrite, not proof
  the watermark is gone.** It says the engine did what it is built to do. It
  does not say Anthropic's detector would now return a low probability,
  because nobody can run that detector yet. **Do not let this figure drift
  into a removal claim anywhere a visitor reads.**

## What is now proven end to end

- Anonymous guest session creation on first use
- The 2-credit welcome grant, once, per account
- Spending, priced by words for text and one flat credit for a file
- The balance on screen matching the ledger after every step
- The empty-balance offer, on a real nought
- The paywall, and that it costs nothing to hit
- Layer A removal, counted
- Layer B running to completion and returning rewritten text

## What is still NOT proven, and should not be described as if it were

- **Sign-up itself**, and therefore the 3-credit signup grant, the guest merge
  and the wallet at /home. Completing a sign-up needs a real email round trip.
- **The refund path in this session.** Rows 137 and 138 from an earlier run
  show a spend and an `operation_refund` of the same size, so the path works,
  but it was not exercised tonight.
- **Anything about Stripe.** Untouched.

## Tooling left behind

`apps/web/scripts/read-ledger.mjs` prints the rows above. Read only, makes no
writes, and uses the project's own keys without printing them. It exists so
the next session can show a credit claim instead of asserting one.
