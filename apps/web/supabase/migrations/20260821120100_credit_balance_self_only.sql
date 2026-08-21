/*
 * -------------------------------------------------------
 * credit_balance: a signed-in user may read only their OWN balance
 * -------------------------------------------------------
 * security-audit.md finding 5.
 *
 * THE LEAK. The original credit_balance(target_account uuid default null) was
 * `security definer` (runs past row-level security, by design) AND granted to
 * `authenticated` AND took the account to look up as a plain argument with no
 * check that it matched the caller. So any signed-in user could call
 * credit_balance('<someone-else's-id>') and read that account's credit count.
 * Low impact — it leaks one integer and account IDs are not shown in the
 * product — but free to close.
 *
 * THE FIX (the audit's cleaner option). Split the function in two by arity, so
 * the powerful form is simply not reachable by a browser:
 *
 *   credit_balance()      -> granted to authenticated; ALWAYS resolves to the
 *                            caller (auth.uid()). No argument to abuse.
 *   credit_balance(uuid)  -> service_role ONLY; the server's own code passes an
 *                            explicit account. Execute is revoked from
 *                            authenticated/public.
 *
 * CALLERS CHECKED before changing the signature (security-audit item 4):
 *   - apps/web/app/home/page.tsx calls rpc('credit_balance') with NO argument,
 *     as the user's own session -> now binds to credit_balance().
 *   - apps/web/lib/server/credits.ts getBalance() calls it WITH target_account
 *     through the admin (service_role) client -> now binds to
 *     credit_balance(uuid), which service_role may still execute.
 * Nothing else calls it.
 *
 * The uuid form's default is REMOVED so the two forms can never be ambiguous to
 * PostgREST: a no-argument call resolves to credit_balance(), a one-argument
 * call to credit_balance(uuid).
 *
 * WHY THE DROP BELOW IS NOT OPTIONAL. The existing function is declared
 * `credit_balance(target_account uuid default null)`, and PostgreSQL refuses to
 * take a default away with CREATE OR REPLACE — it raises
 * "cannot remove parameter defaults from existing function" and the migration
 * stops. The old form has to be dropped and recreated. Nothing else in the
 * database depends on it (no view, no other function), only application code.
 *
 * WRAPPED IN A TRANSACTION so there is never a moment where the balance
 * function is missing while the live site is calling it. Idempotent and safe to
 * re-run: `drop ... if exists`, then create-or-replace.
 */

begin;

-- Drop the old `uuid default null` form FIRST. Recreated below without the
-- default, so the no-arg and one-arg forms can never be ambiguous.
drop function if exists public.credit_balance(uuid);

-- The self-only form any signed-in user may call. No argument, so nothing to
-- point at another account.
create or replace function public.credit_balance()
    returns integer
    language sql
    security definer
    set search_path = ''
as
$$
select coalesce(sum(l.delta), 0)::integer
from public.credit_ledger l
where l.account_id = (select auth.uid());
$$;

comment on function public.credit_balance() is
    'Credits available to the CALLER. Always resolves to auth.uid(); a signed-in user cannot read anyone else''s balance. security-audit.md finding 5.';

revoke execute on function public.credit_balance() from public, anon;
grant execute on function public.credit_balance() to authenticated, service_role;

-- The explicit-account form is now service_role only. Default dropped so it is
-- callable only WITH an argument (the server always passes one), which also
-- removes any overload ambiguity with the no-arg form above.
create or replace function public.credit_balance(target_account uuid)
    returns integer
    language sql
    security definer
    set search_path = ''
as
$$
select coalesce(sum(l.delta), 0)::integer
from public.credit_ledger l
where l.account_id = target_account;
$$;

comment on function public.credit_balance(uuid) is
    'Credits available to a NAMED account. service_role only — used by the server''s own credit code. Not executable by authenticated: that is the finding-5 leak this closes.';

-- Close the leak: strip execute from everyone except the server. A freshly
-- created function is granted EXECUTE to PUBLIC by default, so this revoke is
-- what actually closes it, not just tidiness.
revoke execute on function public.credit_balance(uuid) from public, anon, authenticated;
grant execute on function public.credit_balance(uuid) to service_role;

commit;
