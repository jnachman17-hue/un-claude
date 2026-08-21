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
