# The auth surface: terms acceptance, and the password form

**21 August 2026.** Two defects on the sign-in and settings pages, both fixed
and both verified against the case that actually fails. Files touched:

- `packages/features/auth/src/components/terms-acceptance-notice.tsx` (new)
- `packages/features/auth/src/components/password-sign-up-form.tsx`
- `packages/features/auth/src/components/oauth-providers.tsx`
- `packages/features/accounts/src/components/password/update-password-container.tsx`
- `apps/web/i18n/messages/en/auth.json`

---

## 1. Nobody ever agreed to the terms. Now they do.

Handoff 5.1 in `legal-applied.md`. There was no acceptance anywhere: no line
under either sign-up button, the starter's checkbox flag unset, and the only
route to the terms a link in the footer.

**One sentence now sits under both sign-up buttons**, because either of them
creates an account:

> By creating an account you agree to our Terms of Service and Privacy Policy.

Both are real links, both open in a new tab, both return 200 and the pages they
reach are titled "Terms of Service" and "Privacy Policy".

### The starter's own mechanism was checked first, and deliberately not used

There is one, behind `NEXT_PUBLIC_DISPLAY_TERMS_AND_CONDITIONS_CHECKBOX`:
`TermsAndConditionsFormField`, a checkbox reading "I accept the ... and ...".
**Switching it on would have fixed half the problem and looked like it had
fixed all of it.** Two reasons it was rejected:

1. **It only renders inside the email and magic-link forms.** The Google button
   is not a form and never sees it. Turning the flag on would have covered one
   of the two routes into an account and left the other exactly as it was —
   and it is the Google button that takes one click to an account.
2. **Adding it as well as the sentence** would put two acceptance mechanisms
   on one page in two different grammars, which is what the instruction to
   check for an existing one was trying to avoid.

**The flag stays off.** If anyone reconsiders, the choice to make is between
the two mechanisms, not to run both.

### One thing to know if the checkbox is ever switched on

It is not wired to the form. `TermsAndConditionsFormField` renders
`<Checkbox required name={field.name} />` with no `checked` and no
`onCheckedChange`, and `PasswordSignUpSchema` has no `termsAccepted` field, so
nothing validates it beyond the browser's own `required` attribute. **Not
fixed here** — it is dead code while the flag is off, and touching it would
have meant maintaining a mechanism this session had just decided against.

### A trap in the messages files, confirmed the hard way

**next-intl parses a self-closing tag like `<TermsOfServiceLink />` as literal
text and prints it on the page.** The starter's `acceptTermsAndConditions`
string is written that way — an i18next leftover — and would have rendered
`By creating an account you agree to our <TermsOfServiceLink/> ...` verbatim
to a visitor. It has never been seen because the flag has always been off.

**Tags must be paired:** `<TermsOfServiceLink>Terms of Service</TermsOfServiceLink>`,
with the component receiving `chunks`. That is how the new string is written.

### And the operational one, which cost most of the time here

**Editing a messages JSON does not reach a running dev server at all.** Not by
saving it, not by touching `i18n/request.ts`, not by editing that file's
contents, not by a hard reload. The server keeps serving the old JSON and logs
`MISSING_MESSAGE` for the new key. **Only a full dev-server restart works.**
The warning already in `i18n/request.ts` says restart; it is stronger than it
reads, so it is repeated here: **restart is the first move, not the last.**

---

## 2. The password form asked the wrong question

Full prior history in `password-form-bug.md`, which ruled out a great deal and
correctly identified that the check was wrong regardless. It is now fixed, and
**the case that fails was reproduced first**, which no previous attempt managed.

### What the code used to ask

```ts
const canUpdatePassword = user.amr?.some((item) => item.method === 'password');
```

`amr` records **how this session signed in**. Whether the account **has** a
password is a different question.

### The failing case, produced end to end on the live project

A throwaway account was created with an email and a password, then its session
was minted by the sign-up confirmation link — the app's own
`/auth/confirm?token_hash=...&type=signup` route, the same one the emailed link
hits. The token in that session:

```
{ "email": "auth-surface-test-21aug@example.com",
  "amr": [ { "method": "otp", "timestamp": 1787339056 } ],
  "aal": "aal1",
  "has_identities_claim": false }
```

`amr` is `otp`. On the old code, that session on `/home/settings` rendered:

> Update your Password
> Update your password to keep your account secure.
> **You cannot update your password because your account is not linked to any.**

**Jon's sentence, word for word, on an account that had just set a password.**
That is the reproduction, and it explains why signing in with a password five
times never showed it: a password sign-in is the one route that happens to
produce the right `amr` by accident.

### What it asks now

Whether the account carries an `email` identity, which is what Supabase calls a
password credential. Same session, after the fix, the form renders normally.

The lookup that drives it, taken from the live session:

```
GET /auth/v1/user   (what getUser() calls)
{ "status": 200,
  "identities_field_present": true,
  "identities": [ "email" ],
  "has_email_identity": true }
```

As a control the predicate was temporarily flipped to a provider that does not
exist; the warning came straight back, then went away again when it was
restored. **So the form is being shown because an email identity was found,
not because the check now always passes.**

### Two things the fix had to work around

**`identities` is not a JWT claim and never will be.** The claim list on that
live token is `aal, amr, app_metadata, aud, email, exp, iat, is_anonymous,
iss, phone, role, session_id, sub, user_metadata`. `useUser` returns
`getClaims()`, so the token cannot answer this. The fix calls `getUser()`,
which asks the auth server.

**The `initialData` latch was investigated and is not the live cause, but it is
real.** `useUser` is keyed `['supabase:user']` with `refetchOnMount: false` and
`refetchOnWindowFocus: false`, and `personal-account-dropdown-container.tsx`
seeds it via `useUser(props.user)` from the sidebar. Anything wrong in that
seed latches for the life of the page. Today the seed comes from `requireUser`,
which returns `getClaims()` and does carry `amr`, so it is sound — **but only
by luck of that one function's return type.** If `requireUser` is ever changed
to return `getUser()`, the seed loses `amr` and the old bug would have come
back permanently. The new query keeps its own key, `['supabase:user:password-identity']`,
well clear of it.

**Where it fails safe.** If `identities` comes back absent, or the lookup errors,
the form is shown rather than the warning. Setting a password on an account
that has none is a valid thing to do, so an unnecessary form is harmless where
an unjustified accusation is not. Note that the admin **list** endpoint
(`/auth/v1/admin/users`) returns `identities: null`, so that branch is not
hypothetical for anything that ever reads identities from there.

---

## 3. Test data

One throwaway account, `auth-surface-test-21aug@example.com`, id
`917278de-…3a4`. Deleted: auth user gone (404), accounts row gone, its two
`credit_ledger` rows gone with it, and a search for any remaining
`auth-surface-test` account returns empty.

**The accounts row had to be deleted explicitly.** Deleting the auth user does
not remove it — that is the defect in `legal-applied.md` section 1, still open,
and it was confirmed again here in passing.

---

## 4. Not done, and why

- **The disclosure line at the tool's own button** (legal report 2D, handoff
  5.2). The workbench belongs to the Stripe session running alongside this one.
  Still outstanding.
- **The account-deletion defect** (handoff 5.3). Belongs to whoever owns the
  database. Confirmed again here.
- **Wiring the starter's terms checkbox to its form.** Dead code while the flag
  is off. See section 1.

---

## CORRECTION, appended 21 August 2026 by a later session

**Section 3 says the account-deletion defect is "still open" and was
"confirmed again here in passing." That is no longer true, and was probably
already untrue when it was written.**

`apps/web/scripts/verify-account-deletion.mjs` was run twice against the live
database after the deploy, and both runs print the same verdict:

    --- AFTER — what is left behind ---
    auth.users      : GONE
    public.accounts : 0 row(s)
    credit_ledger   : 0 row(s)

    sign-in destroyed      : YES
    account record removed : YES
    credit history removed : YES

    FIXED

**Deleting the auth user now cascades to the accounts row and to the whole
credit ledger.** The fix is `20260821130000_account_deletion_cascade.sql`,
which has been applied to the hosted project.

**The likely explanation for the discrepancy:** this session deleted its
throwaway accounts row explicitly, as earlier sessions had learned to do, and
read the success of that manual delete as evidence the cascade had not fired.
Deleting a row that a cascade would also have deleted looks identical from the
outside.

**Also worth recording, because it was a real open question:** the append-only
trigger on `credit_ledger` does NOT block the cascade. That interaction was
marked "REASONED, NOT EXECUTED" in the migration's own comment. It has now been
executed, twice, and it holds.

**Nothing else in this note is affected.** Both fixes it describes are real and
were verified against the failing case.
