# Account deletion actually deletes the account — 21 August 2026

**The defect.** Pressing "delete account" destroyed the sign-in and kept the
person's data. Their `accounts` row, holding their **email address and their
name**, stayed. So did every line of their credit history. Someone exercising a
data-protection right got the opposite of what the button promised: locked out
for good, personal data retained.

**The fix.** One migration,
`apps/web/supabase/migrations/20260821130000_account_deletion_cascade.sql`,
adding the one foreign key the schema was missing. Plus the privacy policy,
upgraded in the same commit to the stronger sentence, per the standing rule in
06 row 46.

**APPLIED 21 August 2026, and proved afterwards rather than assumed.** Jon ran
all three blocks from section 5. The end-to-end run in section 10 shows a real
account created, given credit history, deleted through the real path, and every
row gone. The nine orphan rows went with them. **The site is now safe to deploy,
and the privacy policy's new wording is true.**

Everything below section 5 was written before that happened and is left as it
was written, because the value of it is the reasoning that was available at the
time. Section 10 is what actually happened.

---

## 1. The defect, verified rather than taken on trust

I was told to check the note's claims myself before changing anything. All three
links check out exactly as `legal-applied.md` section 1 describes.

**Link one exists.** `20260819180000_credit_ledger.sql` line 29:

```sql
account_id  uuid  not null references public.accounts (id) on delete cascade,
```

**Link two does not.** The whole of the accounts key column, from
`20241219010757_schema.sql` line 92:

```sql
id  uuid unique  not null default extensions.uuid_generate_v4(),
```

A grep of every `.sql` file in the repository for `on delete cascade` returns
exactly one hit, and it is link one:

```
apps/web/supabase/migrations/20260819180000_credit_ledger.sql:29:    account_id ... on delete cascade,
```

The only two `references auth.users` in the schema are `accounts.created_by` and
`accounts.updated_by`, neither of which is the key column and neither of which
cascades.

**Link three confirms it.** `delete-personal-account.service.ts` calls one thing:

```ts
await params.adminClient.auth.admin.deleteUser(userId);
```

Nothing in the application deletes a row from `public.accounts`. The only
writers to that table anywhere are the `on_auth_user_created` trigger, two
harness scripts, and profile updates.

### And then I ran it against the real database

Reading code is not proof. This created a real account, gave it real credit
history, and pressed the real button. **Unedited output:**

```
target: https://itdgggoxsoolbfiwujvt.supabase.co
throwaway account: deletion-chain-test@un-claude.com

=== STEP 1 — create the account, the way a real sign-up does ===
auth.users row created: 34f7503d-479d-47c4-9f8e-6b338c479168
public.accounts row written by the on_auth_user_created trigger:
    [{"id":"34f7503d-479d-47c4-9f8e-6b338c479168","name":"Deletion Chain Test","email":"deletion-chain-test@un-claude.com"}]

=== STEP 2 — give it credit history, the shape the product writes ===
  insert signup_grant     -> 201  ledger id 190
  insert spend            -> 201  ledger id 191
  insert operation_refund -> 201  ledger id 192

--- BEFORE — everything this person has in the database ---
auth.users      : PRESENT (deletion-chain-test@un-claude.com)
public.accounts : 1 row(s)
    {"id":"34f7503d-479d-47c4-9f8e-6b338c479168","name":"Deletion Chain Test","email":"deletion-chain-test@un-claude.com"}
credit_ledger   : 3 row(s)
    {"id":190,...,"delta":3,"reason":"signup_grant","created_at":"2026-08-21T17:25:58.079397+00:00"}
    {"id":191,...,"delta":-1,"reason":"spend","created_at":"2026-08-21T17:25:58.255411+00:00"}
    {"id":192,...,"delta":1,"reason":"operation_refund","created_at":"2026-08-21T17:25:58.501866+00:00"}

=== STEP 3 — press "delete account" ===
The button runs deletePersonalAccountAction, which calls
DeletePersonalAccountService.deletePersonalAccount, whose entire body is:
    await params.adminClient.auth.admin.deleteUser(userId)
which is exactly this request:
    DELETE /auth/v1/admin/users/34f7503d-479d-47c4-9f8e-6b338c479168
  -> 200 {}

--- AFTER — what is left behind ---
auth.users      : GONE
public.accounts : 1 row(s)
    {"id":"34f7503d-479d-47c4-9f8e-6b338c479168","name":"Deletion Chain Test","email":"deletion-chain-test@un-claude.com"}
credit_ledger   : 3 row(s)
    {"id":190,...,"delta":3,"reason":"signup_grant",...}
    {"id":191,...,"delta":-1,"reason":"spend",...}
    {"id":192,...,"delta":1,"reason":"operation_refund",...}

=== VERDICT ===
sign-in destroyed      : YES
account record removed : NO — 1 row still holds the email address and name
credit history removed : NO — 3 row(s) still there

DEFECT LIVE — the person is locked out for good and their personal data is retained.
```

**That is the defect, live, on the production database, today.** The script then
removed everything it had made:

```
=== CLEANUP — removing every trace of this run ===
delete the throwaway accounts row -> 204
accounts rows left      -> []
credit_ledger rows left -> []
auth.users row left     -> GONE
```

**The cleanup is itself a second proof.** Deleting the one `accounts` row took
all three ledger rows with it. So link one is not merely declared in a
migration, it fires on the live database. The whole defect is the missing link
above it.

**The script is committed** as `apps/web/scripts/verify-account-deletion.mjs`,
so this is repeatable rather than a one-off paste. Run it from `apps/web`:

```bash
node scripts/verify-account-deletion.mjs
```

It exits 0 when the fix is in and 1 when it is not, and it always cleans up
after itself.

---

## 2. Which approach, and why

I was given two and asked to pick one and say why.

**Chosen: (a), the foreign key.**

```
auth.users  --( THIS )-->  public.accounts  --(already there)-->  credit_ledger
```

**Why, in one sentence: the button is not the only way an account gets deleted.**
You delete users from the Supabase dashboard — you did it several times while I
was writing this. An admin action, a support request, a script, or a code path
nobody has written yet all bypass a fix that lives in the delete service. The
database is the one place every deletion has to pass through.

**Why not (b), the line of application code.** It would protect exactly one path
and would go on looking like it protected all of them. It also has a failure
mode the foreign key does not: if the code deletes the account row and the
sign-in delete then fails, you get the *inverse* orphan, a signed-in user with
no account row, which breaks the app for a live person. The foreign key cannot
produce that state, because the database performs both halves or neither.

**What (a) costs, honestly.** It is the riskier migration. It adds a constraint
to a table that already has rows, so it fails until the rows that violate it are
dealt with, and dealing with them is a decision about real records. That is
section 4.

**Why the key is right and not a guess.** Every `accounts` row in this database
is written by one thing, the `on_auth_user_created` trigger in
`20241219010757_schema.sql`, and its insert is `values (new.id, ...)`. The
account id **is** the auth user id, always. There are no team accounts in this
schema: no memberships table, no `is_personal_account` column, only inherited
MakerKit comment text that mentions teams. The column's `uuid_generate_v4()`
default is never reached in practice. Live check: 15 auth users, 15 non-orphan
accounts, and **zero auth users with no account row**.

**Two things it could have broken, both checked and both clear.**

- **Sign-up.** `on_auth_user_created` fires AFTER INSERT on `auth.users`, so the
  parent row exists by the time the account row is written. No change.
- **`created_by` / `updated_by`.** These also point at `auth.users`, with NO
  ACTION, which would *block* a user delete if either were set. Checked live:

```
accounts with created_by or updated_by set: 200 []
```

  No row in the database has either. Nothing to trip over.

---

## 3. The interaction with the append-only ledger trigger

The brief warned about this and it is the most important technical point in the
note: the security session's `20260821120000_credit_ledger_append_only.sql` makes
the database refuse every UPDATE and every DELETE on `credit_ledger`. **The
cascade this fix relies on is a DELETE.** If the trigger blocks it, account
deletion fails outright and the bug is replaced by a worse one.

**First, the state of the database, because a test proves nothing if you do not
know what you are testing.** I checked each pending migration by probing for the
thing it creates, rather than trusting the file list:

| Migration | Probe | State |
|---|---|---|
| `20260821120000` append-only ledger | UPDATE a throwaway ledger row | **NOT APPLIED** |
| `20260821120100` credit_balance self-only | call both arities | inconclusive from outside; treat as **NOT APPLIED** |
| `20260821120200` rate limits | call `rate_limit_hit`, read `rate_limits` | **NOT APPLIED** |
| `20260821120300` signup grant email dedupe | read `credit_ledger.grant_email` | **NOT APPLIED** |

The evidence for the first, which is the one that matters here. If the trigger
were applied, an UPDATE would be refused by the trigger with its own message. It
was refused by the *grant*, one layer below:

```
UPDATE the probe ledger row -> 403 {"code":"42501", ...
  "hint":"Grant the required privileges to the current role with: GRANT UPDATE ON public.credit_ledger TO service_role;",
  "message":"permission denied for table credit_ledger"}
DIRECT DELETE the probe ledger row -> 403 {"code":"42501", ...
  "message":"permission denied for table credit_ledger"}
```

```
20260821120200 rate_limits table -> ABSENT: {"code":"PGRST205","message":"Could not find the table 'public.rate_limits' in the schema cache"}
20260821120300 grant_email column -> ABSENT: {"code":"42703","message":"column credit_ledger.grant_email does not exist"}
```

**So four migrations are waiting for you, and mine is the fifth.** Nothing in
the security session's write-up is live on the hosted database yet.

### Does the cascade survive the trigger?

**The trigger was written to allow it, and its logic is sound.** It tells a
direct DELETE from a cascade by a fact only true during a cascade: the parent
`accounts` row is already gone by the time the child's trigger fires. Parent
still there means somebody is deleting ledger rows directly, so refuse. Parent
already gone means the cascade is running, so allow.

My change makes that cascade fire one level deeper:

```
auth.users deleted  ->  accounts row deleted  ->  ledger rows deleted
                                   ^
                        by the time the ledger trigger asks,
                        this row is already gone, so the allow branch is taken
```

The nesting does not change the test. The ledger trigger fires as a consequence
of the accounts row being deleted, so the accounts row is deleted before it can
be asked about.

**I could not execute this and I am not going to pretend otherwise.** There is
no Postgres, no Docker and no Supabase CLI on this machine, installing one needs
your say-so (CLAUDE.md section 5), and I may not apply migrations. **The
reasoning above is reasoning, not a test.**

**So here is how it gets tested for real, at no risk.** Two safeguards, in this
order:

1. **The orphan sweep in section 5 is the canary.** It deletes `accounts` rows,
   two of which carry ledger rows, and it runs inside `begin … commit`. If the
   trigger blocks that cascade, the sweep errors, the transaction rolls back,
   **nothing changes**, and you know before the foreign key is anywhere near the
   database. That is why the order below puts the append-only migration first.
2. **`node scripts/verify-account-deletion.mjs` is the real proof.** It drives
   the full three-link chain through the actual delete path and prints every
   surviving row. Run it after applying everything.

**If it ever does go wrong, the undo is one line:**

```sql
alter table public.accounts drop constraint accounts_id_fkey;
```

That puts the database back exactly where it is today.

---

## 4. The orphans

**Adding the key fails while any `accounts` row has no `auth.users` parent.**
Every account deleted before this fix left exactly such a row. There are **nine**,
and I confirmed each one individually with a direct fetch rather than trusting a
list endpoint, because the list endpoint disagreed with itself between two runs:

```
public.accounts rows : 24
auth.users rows      : 15

124e10d8-a533-4751-a918-4739fc95a3c1  jnachman17+merge1@gmail.com          -> 404 REAL ORPHAN
32d447f7-9770-4536-9a39-8c8e313c354b  jnachman170@gmail.com                -> 404 REAL ORPHAN
4d376277-758a-4d9a-ab25-61779c0f35a2  nachmanbookings@gmail.com            -> 404 REAL ORPHAN
7c376386-ae32-413a-a78b-acefae40055c  blotterib@gmail.com                  -> 404 REAL ORPHAN
83a02735-1fc0-4c81-9e61-73756f8dff26  unclaudeapp@gmail.com                -> 404 REAL ORPHAN
9ef0e180-7824-4c9c-9bd0-ba5e3a245408  verify-test@un-claude.com            -> 404 REAL ORPHAN
a1235a82-9c0a-42a2-892e-0a3e99fd60b3  jnachman17+merge2@gmail.com          -> 404 REAL ORPHAN
d110ab47-1e9b-43ae-b688-949dc4911763  ministeriodelinterrior.es@gmail.com  -> 404 REAL ORPHAN
f17969e2-4699-4627-9e5b-6f40a8b5c494  jnachman17@gmail.com                 -> 404 REAL ORPHAN
```

**Two of them still hold credit history:**

```
  7c376386-...  blotterib@gmail.com   2 ledger rows (net 5 credits)
       {"id":172,"delta":2,"reason":"anon_grant","created_at":"2026-08-21T16:55:29.841742+00:00"}
       {"id":173,"delta":3,"reason":"signup_grant","created_at":"2026-08-21T16:55:30.13321+00:00"}
  f17969e2-...  jnachman17@gmail.com  2 ledger rows (net 5 credits)
       {"id":52,"delta":2,"reason":"anon_grant","created_at":"2026-08-21T04:13:20.978935+00:00"}
       {"id":53,"delta":3,"reason":"signup_grant","created_at":"2026-08-21T04:13:21.125569+00:00"}
```

**The other seven hold nothing but an email address and a name.** One of them,
`verify-test@un-claude.com`, is the account `07-runbook.md` already tells you to
delete, from the 18 August sign-up test.

**You answered the question this raised, mid-session:** *"I deleted users on my
end from supa they were all me testing."* That settles the only thing I could
not settle from here, which is whether any of these belong to a stranger. Every
address on that list is yours or a test.

**Recommendation: delete all nine.** They exist only because of the bug this
change fixes. They are permanently unreachable, nobody can ever sign in to them,
and each one holds an email address for no purpose. Removing them is the same
erasure the old privacy policy told people to write in and ask for, and it is
exactly what the new wording promises will happen automatically from now on.
The lost credits are 10 in total, on two accounts that no longer have a sign-in
to spend them from.

**I have not deleted them, and I will not without you saying so.** The migration
will not delete them either. It refuses, and prints the whole list, so this can
never happen by accident:

```
Cannot add the foreign key: N accounts row(s) have no auth.users parent.

These are accounts whose sign-in was deleted before this fix existed. Each one
still holds a person's email address and name:

  <id>  <email>  (<name>)
  ...

Decide what happens to them first. They are records about real people, so this
migration will not delete them for you.
```

**Back the ledger up first anyway,** because the free Supabase plan takes no
backups and two of these rows are ledger rows. It costs one command:

```bash
node scripts/backup-credit-ledger.mjs
```

---

## 5. What to paste, in order. PENDING JON

**I may not apply migrations (CLAUDE.md section 5 and the brief), so none of
this is done until you run it.** Three blocks. Read block 1's answer before you
run block 2.

**Do the four security-session migrations first,** in their number order
(`120000`, `120100`, `120200`, `120300`). Not because this depends on them, but
because doing the append-only one first turns block 2 into the free test
described in section 3.

### Block 1 — LOOK. Changes nothing

Read-only. It lists every account whose sign-in is already gone, and how much
credit history each one holds.

```sql
select a.id,
       a.email,
       a.name,
       (select count(*) from public.credit_ledger l where l.account_id = a.id)
           as credit_history_rows
from public.accounts a
where not exists (select 1 from auth.users u where u.id = a.id)
order by a.email;
```

**What it should return:** the nine rows in section 4, possibly more if anyone
has pressed "delete account" since. **If it returns something you do not
recognise, stop and do not run block 2.**

### Block 2 — REMOVE those rows. This is a deletion and it cannot be undone

Run this only after reading block 1's output and agreeing to every line of it.

```sql
begin;

delete from public.accounts a
where not exists (select 1 from auth.users u where u.id = a.id);

commit;
```

**In plain English:** delete every account record whose sign-in no longer
exists. Each one's credit history goes with it, through the cascade that already
exists.

**What would break if this went wrong.** It deletes account rows, so the danger
is deleting one that should have been kept. It cannot touch an account that
still has a sign-in, because the `where not exists` clause only matches rows
whose auth user is gone, and those accounts are unreachable by definition. It is
wrapped in `begin … commit`, so if any part of it errors **nothing at all
changes**. The realistic failure is the append-only trigger refusing the ledger
cascade, which would show as an error mentioning `credit_ledger is append-only`
and would leave the database untouched. If you see that, stop and say so: it
means the trigger needs a fix before the foreign key can go on.

### Block 3 — THE MIGRATION. The actual fix

This is `apps/web/supabase/migrations/20260821130000_account_deletion_cascade.sql`
character for character, so what you run and what is committed are the same
thing.

**In plain English:** it adds the one missing rule, "an account belongs to a
sign-in, and when the sign-in goes the account goes with it." After it, pressing
"delete account" removes the sign-in, the account record with the email address
and name on it, and every line of credit history, in one action.

**What would break if this went wrong.** Two possibilities, and both announce
themselves rather than doing damage quietly.

1. **It refuses because orphans still exist.** It prints them and changes
   nothing. Re-run block 1, then block 2.
2. **It applies, and then account deletion fails because the append-only trigger
   refuses the cascade.** This is the one I could not test from here. Block 2 is
   the canary for it, and `node scripts/verify-account-deletion.mjs` is the
   check. If it happens, undo is one line:
   `alter table public.accounts drop constraint accounts_id_fkey;`

It cannot lose data: it adds a rule, it does not delete anything, and the whole
block is one transaction.

```sql
/*
 * -------------------------------------------------------
 * "Delete account" must actually delete the account
 * -------------------------------------------------------
 * docs/session-notes/legal-applied.md section 1, and section 5.3 which hands
 * this over. docs/session-notes/account-deletion-fix.md is the full write-up.
 *
 * THE DEFECT THIS CLOSES. Pressing "delete account" calls exactly one thing,
 * `auth.admin.deleteUser()` in delete-personal-account.service.ts. That
 * destroys the sign-in and nothing else. The `public.accounts` row — which
 * holds the person's EMAIL ADDRESS AND NAME — stays, and so does their whole
 * credit history. Someone exercising a data-protection right gets the opposite
 * of what the button promises: locked out for good, personal data retained.
 *
 * WHY. The chain has three links and only two existed:
 *
 *     auth.users  --( MISSING )-->  public.accounts  --(cascade)-->  credit_ledger
 *
 * `credit_ledger.account_id -> accounts.id on delete cascade` is real and is
 * the ONLY `on delete cascade` in the entire schema. But `public.accounts.id`
 * carried no reference to `auth.users` at all — its whole key column, from
 * 20241219010757_schema.sql, is:
 *
 *     id uuid unique not null default extensions.uuid_generate_v4()
 *
 * This migration adds the missing first link. Once it exists, deleting the
 * sign-in cascades to the account row, which cascades to the ledger, and the
 * button does what it says.
 *
 * WHY A FOREIGN KEY RATHER THAN A LINE OF APPLICATION CODE. The database
 * enforces it for every deletion, not just the one the button performs — an
 * admin deleting a user in the Supabase dashboard, a support action, a script,
 * a future code path nobody has written yet. A line in the delete service would
 * only protect the single path it sits in, and would silently stop protecting
 * anything the day someone deletes a user by another route.
 *
 * WHY THE KEY IS CORRECT AND NOT A GUESS. Every accounts row in this database
 * is created by one thing: the `on_auth_user_created` trigger in
 * 20241219010757_schema.sql, whose insert is `values (new.id, ...)` — the
 * accounts id IS the auth user id, always. There are no team accounts in this
 * schema (no memberships table, no is_personal_account column; only inherited
 * MakerKit comment text mentions teams), so no account exists that is not one
 * person's sign-in. The column default `uuid_generate_v4()` is never reached in
 * practice. Verified 21 August 2026 against the live database: 15 auth users,
 * 15 non-orphan accounts, and zero auth users without an account.
 *
 * WHAT IT DOES NOT BREAK.
 *
 *   - Sign-up. `on_auth_user_created` is an AFTER INSERT trigger on auth.users,
 *     so the parent row already exists when the accounts row is inserted.
 *   - `accounts.created_by` / `accounts.updated_by` also reference auth.users,
 *     with NO ACTION, which would block a user delete if either were set.
 *     Verified live: no row in this database has either column set.
 *   - The append-only ledger trigger from 20260821120000. That trigger refuses
 *     every direct DELETE on credit_ledger but ALLOWS the cascade, telling them
 *     apart by whether the parent accounts row is already gone. This migration
 *     makes that cascade fire one level deeper (auth.users -> accounts ->
 *     credit_ledger); the parent accounts row is still already gone by the time
 *     the ledger trigger fires, so the allow branch is the one taken.
 *     THIS PARTICULAR INTERACTION WAS REASONED, NOT EXECUTED — there is no
 *     Postgres on the machine this was written on. It is proved by running
 *     `node scripts/verify-account-deletion.mjs`, which drives the real
 *     database through the real deletion path end to end. Run it after
 *     applying this. If it fails, `alter table public.accounts drop constraint
 *     accounts_id_fkey;` puts things back exactly as they were.
 *
 * ORPHANS, AND WHY THIS MIGRATION REFUSES RATHER THAN TIDIES. Every account
 * deleted before this fix left its accounts row behind with no auth.users
 * parent. Those rows violate the constraint, so it cannot be added while they
 * exist. They are real records holding real email addresses, and deciding what
 * happens to them is not a migration's business. So step 1 below REFUSES, and
 * prints every offending row, rather than deleting anything. Clearing them is a
 * separate, deliberate statement a person runs after reading the list — see
 * account-deletion-fix.md, "The orphans".
 *
 * Safe to re-run: the guard is a read, and the constraint is only added if it
 * is not already there.
 */

begin;

-- ---------------------------------------------------------------------------
-- Step 1. Refuse, loudly and readably, if any accounts row has lost its user.
-- ---------------------------------------------------------------------------
do
$$
    declare
        orphan_count int;
        orphan_list  text;
    begin
        select count(*),
               string_agg(format('  %s  %s  (%s)', a.id, coalesce(a.email, '<no email>'), coalesce(a.name, '<no name>')),
                          e'\n' order by a.email)
        into orphan_count, orphan_list
        from public.accounts a
        where not exists (select 1 from auth.users u where u.id = a.id);

        if orphan_count > 0 then
            raise exception e'Cannot add the foreign key: % accounts row(s) have no auth.users parent.\n\nThese are accounts whose sign-in was deleted before this fix existed. Each one still holds a person''s email address and name:\n\n%\n\nDecide what happens to them first. They are records about real people, so this migration will not delete them for you. See docs/session-notes/account-deletion-fix.md, "The orphans".',
                orphan_count, orphan_list
                using errcode = 'foreign_key_violation';
        end if;
    end
$$;

-- ---------------------------------------------------------------------------
-- Step 2. The missing link.
-- ---------------------------------------------------------------------------
do
$$
    begin
        if not exists (select 1
                       from pg_constraint
                       where conname = 'accounts_id_fkey'
                         and conrelid = 'public.accounts'::regclass) then

            alter table public.accounts
                add constraint accounts_id_fkey
                    foreign key (id) references auth.users (id) on delete cascade;

        end if;
    end
$$;

comment on constraint accounts_id_fkey on public.accounts is
    'Deleting the sign-in deletes the account row, which cascades to credit_ledger. The missing first link of the deletion chain: legal-applied.md section 1, account-deletion-fix.md.';

commit;
```

### After you have run all three

From `apps/web`:

```bash
node scripts/verify-account-deletion.mjs
```

**It should end with FIXED** and print `0 row(s)` for both tables after the
delete. It cleans up after itself either way. **Until that prints FIXED, the
privacy policy is not telling the truth and must not be deployed.** Which is
section 6.

---

## 6. The privacy policy, in the same commit. 06 row 46

**Two paragraphs changed** in
`apps/web/app/(marketing)/(legal)/privacy-policy/page.tsx`. Both were accurate
before and both would have been false after the fix, in the direction of
understating what we do for people, which is the safe direction but still wrong.

**Under "What we keep a record of, and for how long":**

> ~~We keep that history for as long as we hold your account. Nothing deletes it
> automatically after that, and we would rather say so than state a period we do
> not enforce. Ask us to delete it and we will.~~

becomes

> We keep that history for as long as you have an account. Delete your account
> and your whole history is deleted with it, automatically and at the same
> moment. You do not have to ask us.

**Under "Your rights":**

> ~~You can delete your account yourself at any time, from your account settings.
> That removes your sign-in for good and you will not be able to reach the
> account again. It does not by itself erase the record we hold: your account
> record and your credit history stay in our database until we remove them, so
> write to us and we will. Because we do not retain submitted content, there is
> nothing else to delete.~~

becomes

> You can delete your account yourself at any time, from your account settings.
> Deleting your account deletes your account record and your entire credit
> history with it. Your email address, your name and every line of your history
> are removed from our database in that moment, not marked for removal later,
> and your sign-in is destroyed with them. Because we do not retain submitted
> content, there is nothing else to delete.

**The page's header comment was updated too**, replacing the block that recorded
this as a pending change with what actually happened, and carrying the deploy
warning below.

**Rendered and looked at, per CLAUDE.md section 8.** Both paragraphs at desktop
and at 375px, no overflow, no dashes:

```
{"viewport":375,"paraWidth":335,"bodyScrollW":375,"docScrollW":375,
 "horizontalOverflow":false,"dashes":false}
```

### The one thing that could still make this dishonest

**The migration is SQL you paste. It does not ride along with a deploy.** So
these two paragraphs become true at the moment you run block 3, and not before.

**Deploy the site before running the SQL and the privacy policy contains a false
statement.** That is precisely the failure 06 row 46 exists to prevent, and the
reason it exists is that ignoring it once already cost a night of legal
reconciliation.

**The order is: run the SQL, then deploy.** `node scripts/verify-account-deletion.mjs`
answers which state the database is in, in about five seconds, and exits 0 only
when the page is telling the truth.

I have not deployed anything.

---

## 7. One other file had to change, and it is not mine

`apps/web/scripts/verify-ledger-hardening.sql`, the security session's proof
harness, **would have broken the moment the foreign key was added.** Its PART B
fixtures insert `accounts` rows with made-up ids and no matching auth user,
which is exactly what the new key forbids. Left alone, you would have run it,
seen it fail, and reasonably concluded my migration had broken the ledger.

**Two changes, both small:**

- PART B now drops the constraint inside its own transaction. Postgres rolls
  DDL back like anything else, so the `rollback;` at the foot of the file puts
  the key straight back. The harness is about the ledger, not about this key.
- PART A2's comment said `accounts.id -> auth.users.id` was **expected to be
  ABSENT**, and called its absence the defect. That is now backwards, so it says
  the opposite: if the row is missing, this migration has not been applied.

**PART A2 is a second, independent check on this fix.** Run it in the SQL editor
any time and it lists both links of the chain with their delete rules. After
block 3 it should show two rows, both CASCADE.

---

## 8. For the permanent documents. Not written by me, and why

`docs/06-assumptions-and-open-questions.md` is **modified in the working tree by
another live session**, and this project shares one git index. Editing it would
mean either dropping their work or committing it inside mine. So the text is
here for whoever merges, the same call the legal session made yesterday for the
same reason.

**06, "Should deleting an account delete the ledger?" (opened 21 August 2026):
CLOSE IT.** Its working position was "leave it" and its trigger for revisiting
was "a user asking for their data to be erased, a GDPR/CCPA obligation, or the
ledger starting to carry anything more identifying." None of those fired. Jon
did, directly, on 21 August. Replacement closing text:

> **CLOSED 21 August 2026.** Fixed rather than accepted. Jon called it a live
> defect, which it was: a button labelled "delete account" that leaves the
> account behind is not a documentation problem.
> `20260821130000_account_deletion_cascade.sql` adds the foreign key from
> `public.accounts.id` to `auth.users(id) on delete cascade`, and the privacy
> policy moved to the stronger sentence in the same commit. The append-only
> trigger's cascade branch was written for exactly this and is what allows the
> ledger rows through. See `docs/session-notes/account-deletion-fix.md`.

**04-decision-log.md, a new entry:** the choice of a database constraint over a
line in the delete service, for the reason in section 2 — the button is not the
only way an account gets deleted, and a fix inside the delete service would go
on looking like it covered them all.

**07-runbook.md, two entries:**

- The `verify-test@un-claude.com` note in "Sign up was tested end to end" can be
  closed once block 2 runs; it was one of the nine orphans.
- New: **a migration that adds a constraint to a populated table needs an orphan
  check before it is written, not after it fails.** Nine rows were waiting here,
  and every one was created by the very bug the constraint fixes. Expect that
  pattern again: the rows a new rule rejects are usually the evidence of the
  problem the rule exists to solve.

---

## 9. What is done and what is not

**Done, and proved in this session:**

- The defect confirmed from the schema, from the service, and from a real
  end-to-end run against the production database, with the output above.
- The migration written, with an orphan guard that refuses rather than tidies.
- A repeatable proof script committed, which cleans up after itself.
- The privacy policy upgraded, rendered and checked at both widths.
- The ledger harness kept working, and its stale expectation corrected.
- Every row this session created was removed. Two throwaway accounts and six
  ledger rows, all deleted, verified empty.

**Still open when this section was written, all closed in section 10 except the
last:**

- The migration was not applied. It is now.
- The nine orphan rows were still there. They are gone.
- **Nothing was deployed.** Still true. Deploying is Jon's call, and it is now
  safe to make.

---

## 10. Applied, and what happened. 21 August 2026

Jon ran blocks 1, 2 and 3. **The order was changed from what section 5 first
recommended, and the change made it safer.** Section 5 said to run the four
security-session migrations first, so that the orphan sweep would act as a
canary for the append-only trigger. Running this fix FIRST is better, because
with that trigger not yet applied there is no trigger to interfere at all, and
the `accounts -> credit_ledger` cascade had already been watched working on this
database earlier the same day. The trigger question moves to whoever applies
`20260821120000`, where it belongs, and it now has a working chain to be tested
against.

### Backed up first, because the free plan has no restore

Both things block 2 destroys were captured into `apps/web/credit-ledger-backups/`,
which is gitignored:

```
backup-credit-ledger: wrote 43 rows to credit-ledger-backups/credit_ledger_2026-08-21T17-35-28-525Z.csv
wrote 9 orphan accounts rows to credit-ledger-backups/orphan_accounts_before_sweep_...csv
```

The four ledger rows the sweep would take, confirmed present in the backup
before it ran:

```
52,f17969e2-4699-4627-9e5b-6f40a8b5c494,2,anon_grant,...,2026-08-21T04:13:20.978935+00:00
53,f17969e2-4699-4627-9e5b-6f40a8b5c494,3,signup_grant,...,2026-08-21T04:13:21.125569+00:00
172,7c376386-ae32-413a-a78b-acefae40055c,2,anon_grant,...,2026-08-21T16:55:29.841742+00:00
173,7c376386-ae32-413a-a78b-acefae40055c,3,signup_grant,...,2026-08-21T16:55:30.13321+00:00
```

### The full chain, run against the live database after the migration

**Unedited output of `node scripts/verify-account-deletion.mjs`:**

```
--- BEFORE — everything this person has in the database ---
auth.users      : PRESENT (deletion-chain-test@un-claude.com)
public.accounts : 1 row(s)
    {"id":"087ed20d-eb0f-4767-977b-db67e7077f54","name":"Deletion Chain Test","email":"deletion-chain-test@un-claude.com"}
credit_ledger   : 3 row(s)
    {"id":198,...,"delta":3,"reason":"signup_grant","created_at":"2026-08-21T17:38:01.822632+00:00"}
    {"id":199,...,"delta":-1,"reason":"spend","created_at":"2026-08-21T17:38:01.930861+00:00"}
    {"id":200,...,"delta":1,"reason":"operation_refund","created_at":"2026-08-21T17:38:02.022171+00:00"}

=== STEP 3 — press "delete account" ===
    DELETE /auth/v1/admin/users/087ed20d-eb0f-4767-977b-db67e7077f54
  -> 200 {}

--- AFTER — what is left behind ---
auth.users      : GONE
public.accounts : 0 row(s)
credit_ledger   : 0 row(s)

=== VERDICT ===
sign-in destroyed      : YES
account record removed : YES
credit history removed : YES

FIXED — deleting your account deletes your account record and your entire credit history with it.
That is what the privacy policy now promises, and it is what just happened.
```

**Compare that with the same script's output in section 1, before the fix**, where
the account row and all three ledger rows survived. Same script, same database,
same call. Only the foreign key changed.

**This also proves sign-up is unharmed**, which was the main thing the new
constraint could have broken: STEP 1 created an auth user and the
`on_auth_user_created` trigger wrote its accounts row with the key in place.

### The orphans are gone and the two tables now agree

```
public.accounts rows : 16
auth.users rows      : 16
CONFIRMED ORPHANS (accounts row with no auth.users parent): 0
credit_ledger rows total: 39
```

Accounts went from 25 to 16, exactly the nine swept. The ledger went from 43 to
39, exactly the four rows those nine held, all four of them in the backup above.
**Every account in the database now has a sign-in, and every sign-in has an
account.**

### The constraint is enforcing, not merely declared

Trying to create the tenth orphan, the same way the first nine came to exist:

```
=== Is the constraint actually there and enforcing? ===
Try to create an account row with no sign-in behind it.
Before today this succeeded. It is how all nine orphans came to exist.

  -> 409 {"code":"23503",
          "details":"Key (id)=(00000000-0000-4000-8000-0000000000ff) is not present in table \"users\".",
          "message":"insert or update on table \"accounts\" violates foreign key constraint \"accounts_id_fkey\""}
  rows created: []
```

**The class of bug is closed, not just its nine instances.** An account row with
no sign-in behind it can no longer be created by anything: not the application,
not a script, not the dashboard, not a future code path.

### What is still pending, and is not this fix

`20260821120000` (append-only ledger), `120100` (credit_balance self-only),
`120200` (rate limits) and `120300` (signup grant email dedupe) are **still not
applied.** They belong to the security session. When they are applied, re-run
`node scripts/verify-account-deletion.mjs`: it is now the standing check that the
append-only trigger has not broken account deletion, and it exits non-zero if it
has.
