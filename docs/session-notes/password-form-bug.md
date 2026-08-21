# The password form on /home/settings, and why it was not fixed

**21 August 2026.** Jon, on every account created with email and password:

> "Update your Password ... You cannot update your password because your
> account is not linked to any."

**Not reproducible from this session, after extensive verification.** Left
open deliberately. Severity assessed as cosmetic. What follows is everything
established, so whoever picks it up does not start from zero.

## What was ruled out, with evidence

| Checked | Result |
|---|---|
| Do the accounts have a password identity? | **Yes.** Admin API shows `providers: ['email']` and a real `email` identity on every account concerned. |
| Does a password login produce the right claim? | **Yes.** A real password grant returns `amr: [{"method":"password","timestamp":…}]`, exactly the shape the code tests for. |
| Does the page work with such a session? | **Yes.** A genuine password session injected into a browser on the live site rendered the form normally. `warningShown: false`. |
| Does the sign-in page offer password at all? | **Yes.** Real `email` and `password` inputs, submitted by "Sign in with Email". |
| Was Jon on a stale local dev server? | **No.** Confirmed `un-claude.com`. |
| Was he signing in with Google? | **No.** Confirmed password. |

A throwaway account was created and deleted for this; the ledger is clean.

## The mechanism, and why the check is wrong regardless

`packages/features/accounts/src/components/password/update-password-container.tsx`:

```ts
const canUpdatePassword = user.amr?.some((item) =>
  typeof item === 'string' ? item === 'password' : item.method === 'password',
);
```

`amr` is **how this session authenticated**, not **whether the account has a
password**. Those are different questions and the code asks the wrong one.

A user who finishes signing up by clicking the confirmation link has a session
created by that link, so `amr` is `otp`, not `password` — and they are told
their account has no password minutes after setting one. The same happens to
anyone who signs in with Google on an account that also has a password: several
accounts here carry `providers: ['email','google']`.

`useUser` returns `getClaims()`, i.e. raw JWT claims, so whatever is in the
token is all the component sees.

**So the check is wrong even though it could not be made to fail on demand.**
Fixing the question it asks is worth doing on its own merits, and would very
likely take the reported symptom with it.

## The fix, for whoever takes it

Ask whether the ACCOUNT has a password identity, not how this session was
made. Supabase exposes `identities` on the user object with `provider: 'email'`
for password accounts.

**One caveat that must be checked first:** `useUser` returns JWT claims, and
`identities` is not in the claims. The fix likely needs the full user object
(`getUser()`) rather than the token, or a server-side check passed down.

Note also `refetchOnMount: false` and `refetchOnWindowFocus: false` on that
query, with an `initialData` parameter. If anything ever passes `initialData`
lacking `amr`, the warning would latch permanently and never re-resolve. Not
proven to be happening, but it is the one path that would explain a symptom
that survives repeated sign-ins, and it is the first thing to look at.

## Severity, stated plainly

**Cosmetic.** The account is fine. The password exists. A user can still change
it through "Password forgotten?" on the sign-in page, which does not depend on
this check. **That workaround is NOT verified end to end** — it needs a real
inbox — so it is a reasoned expectation, not a tested fact.

No security hole, no data loss, no blocked signup, no payment impact. One
confusing sentence on a settings page.

## Where it belongs

With the other auth-surface handoffs waiting on the same files:
- the terms-acceptance line under the sign-up button (legal report item 1.7)
- the disclosure line at the tool's own button (legal report 2D)

All three are in `packages/features/**` or the auth pages, all three were
blocked by concurrent sessions on the night of 20–21 August.
