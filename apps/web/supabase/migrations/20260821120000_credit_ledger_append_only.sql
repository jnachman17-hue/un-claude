/*
 * -------------------------------------------------------
 * The credit ledger is append-only, enforced by the database itself
 * -------------------------------------------------------
 * security-audit.md finding 7, and operations-setup.md "Database backups".
 *
 * WHY THIS EXISTS. Jon stays on Supabase's free plan, which takes NO backups.
 * If credit_ledger is corrupted there is no restore. So the only protection
 * the ledger has is making corruption impossible in the first place. Today the
 * ledger is append-only only by CONVENTION: the base migration granted the
 * server (service_role) `select, insert` and nothing else, and never granted
 * `update`/`delete` to anyone. That is real protection, but it is one line
 * deep — a future migration that writes "grant all on credit_ledger to
 * service_role to fix a permissions issue" would silently undo it and nothing
 * would notice. This trigger is the second layer finding 7 asked for: the
 * database ACTIVELY REFUSES every UPDATE and every direct DELETE, whoever asks,
 * even the table owner, regardless of what privileges some later migration
 * hands out.
 *
 * THE ONE THING IT MUST NOT BREAK. Deleting an account must still remove that
 * account's ledger rows — the FK is `on delete cascade` and the privacy policy
 * promises deletion really deletes. So the trigger has to tell two kinds of
 * DELETE apart:
 *
 *   - a DIRECT delete against credit_ledger (nobody should ever do this) -> REFUSE
 *   - the FK CASCADE fired by deleting the owning account row            -> ALLOW
 *
 * It tells them apart WITHOUT trusting the caller, the app, or a session flag,
 * by a fact only true during the cascade: by the time the cascade reaches a
 * child row, the parent accounts row is ALREADY GONE. The FK ON DELETE CASCADE
 * runs as an AFTER-DELETE action on public.accounts, so the parent row's
 * deletion is already visible when this BEFORE-DELETE trigger fires on the
 * child. A direct `delete from credit_ledger` happens while the account still
 * exists. So: parent still present => direct delete => refuse; parent already
 * gone => cascade => allow. account_id is NOT NULL and FK-backed, so an
 * "orphan" ledger row cannot exist to confuse this test.
 *
 * TRUNCATE is refused too, as cheap defence in depth. App roles cannot TRUNCATE
 * (they lack the privilege), but a future owner-level mistake could; the
 * statement-level trigger below closes that with no downside.
 *
 * Idempotent and safe to re-run: `create or replace` the function and
 * `drop trigger if exists` before each `create trigger`.
 */

create or replace function public.credit_ledger_append_only()
    returns trigger
    language plpgsql
    -- security definer + empty search_path so the parent-existence check reads
    -- the true accounts row regardless of the firing role's row-level security.
    security definer
    set search_path = ''
as
$$
begin
    if tg_op = 'UPDATE' then
        raise exception
            'credit_ledger is append-only: UPDATE is not permitted (row id=%). To change a balance, insert a new row with its reason.',
            old.id
            using errcode = 'restrict_violation';

    elsif tg_op = 'TRUNCATE' then
        raise exception
            'credit_ledger is append-only: TRUNCATE is not permitted.'
            using errcode = 'restrict_violation';

    elsif tg_op = 'DELETE' then
        -- Allow ONLY the account-deletion cascade (parent already gone).
        -- Refuse a direct delete (parent still present).
        if exists (select 1 from public.accounts a where a.id = old.account_id) then
            raise exception
                'credit_ledger is append-only: direct DELETE is not permitted (row id=%). Rows are removed only when their account is deleted.',
                old.id
                using errcode = 'restrict_violation';
        end if;
        return old;
    end if;

    return null;
end;
$$;

comment on function public.credit_ledger_append_only is
    'Enforces the append-only invariant: refuses UPDATE, TRUNCATE, and any direct DELETE, while allowing the ON DELETE CASCADE from deleting the owning account (detected by the parent row already being gone). security-audit.md finding 7.';

drop trigger if exists credit_ledger_append_only_row on public.credit_ledger;
create trigger credit_ledger_append_only_row
    before update or delete
    on public.credit_ledger
    for each row
execute function public.credit_ledger_append_only();

drop trigger if exists credit_ledger_append_only_truncate on public.credit_ledger;
create trigger credit_ledger_append_only_truncate
    before truncate
    on public.credit_ledger
    for each statement
execute function public.credit_ledger_append_only();
