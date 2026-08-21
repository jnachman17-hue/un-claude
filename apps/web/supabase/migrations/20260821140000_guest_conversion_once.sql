/*
 * -------------------------------------------------------
 * A guest converts exactly once
 * -------------------------------------------------------
 * docs/session-notes/guest-merge-double-runs.md is the full write-up, with the
 * ledger rows that proved it.
 *
 * THE DEFECT THIS CLOSES. `mergeGuestInto` reads the guest's remaining
 * balance, then writes a negative row to the guest and a positive row to the
 * account. Nothing records that the transfer has happened, so nothing stops it
 * happening again. Two requests that arrive together both read the same
 * remaining balance and both perform the transfer.
 *
 * That is not hypothetical. Two components each fetch GET /api/credits when
 * the page loads, and that route is where the merge lives:
 *
 *     225  b135917b  +2  anon_grant                17:41:18   guest, 2 free
 *     226  b135917b  -1  spend  clean text 366     17:41:18   one scan
 *     227  2ba951be  +3  signup_grant              17:42:06   correct
 *     231  b135917b  -1  adjustment transfer_out   17:42:06
 *     232  b135917b  -1  adjustment transfer_out   17:42:07   <-- second
 *     233  2ba951be  +1  adjustment transfer_in    17:42:07
 *     234  2ba951be  +1  adjustment transfer_in    17:42:07   <-- second
 *
 * The account finished on 5 where the design says 4, and the guest finished on
 * MINUS ONE, because the transfer subtracts without checking anything is left.
 * Nothing caps the repeat at two: it scales with concurrent requests, and
 * credits are the thing this product sells.
 *
 * A SECOND DEFECT, in the same rows. The route decides "this is a conversion"
 * by reading the guest cookie and then deletes that cookie. Every later call
 * therefore no longer knows, and pays the 2-credit welcome grant the account
 * was correctly denied a moment earlier — row 209, an anon_grant landing on a
 * signed-in account 46 seconds after signup, taking it to 7.
 *
 * WHY A TABLE AND NOT A UNIQUE INDEX ON THE LEDGER. A partial unique index on
 * the transfer rows would stop the double, and it was the first thing tried.
 * It cannot fix the second defect, because the fact that needs remembering is
 * "this account converted", and an account whose guest had nothing left writes
 * no ledger row at all to remember it by — `credit_ledger.delta` carries
 * `check (delta <> 0)`, so a zero-credit conversion is unrepresentable there.
 *
 * So the conversion gets its own record, written whether or not any credits
 * moved. Its two unique constraints do the work the index would have done:
 *
 *   - `guest_id` primary key  — one guest is drained once, ever. This is the
 *     double-run above.
 *   - `account_id` unique     — one account receives one conversion, ever.
 *     This closes a hole nobody had noticed: with no such limit, signing out,
 *     collecting a fresh guest welcome grant and signing back in merged it
 *     across every time. Repeat at will. The ceiling is now the 2 credits
 *     already ratified as the gaming ceiling in credits.ts.
 *
 * WHY THE WHOLE THING MOVES INTO ONE SQL FUNCTION. Same reason `spend_credits`
 * exists rather than a read followed by a write in TypeScript: the check and
 * the write have to be one indivisible step under a lock, or two requests slip
 * between them. That is the entire bug being fixed here, and fixing it in
 * application code would leave the same gap one layer up.
 *
 * Safe to re-run. Every step is guarded or idempotent.
 */

begin;

-- ---------------------------------------------------------------------------
-- Step 1. The conversion record.
-- ---------------------------------------------------------------------------
create table if not exists
    public.guest_conversions
(
    -- One guest account is drained once, ever.
    guest_id      uuid                     not null primary key,

    -- One real account receives one conversion, ever. Cascades on account
    -- deletion, so the deletion chain added in 20260821130000 stays complete.
    account_id    uuid                     not null unique
        references public.accounts (id) on delete cascade,

    -- What actually moved. Zero is a legitimate, meaningful value here: it
    -- records a guest who had spent everything, which the ledger cannot.
    credits_moved integer                  not null default 0,

    created_at    timestamp with time zone not null default now()
);

comment on table public.guest_conversions is
    'One row per guest-to-account conversion. Its uniqueness is what makes the credit transfer happen exactly once; its existence is what tells ensureGrants this account already had its welcome grant as a guest. guest-merge-double-runs.md.';
comment on column public.guest_conversions.credits_moved is
    'Credits carried across. Zero means the guest had none left, which is still a conversion.';

alter table public.guest_conversions
    enable row level security;

-- No policy for `authenticated`, deliberately, exactly as credit_ledger does.
-- A browser has no business reading or writing who converted from whom.
revoke all on public.guest_conversions from authenticated, service_role;
grant select, insert, update on table public.guest_conversions to service_role;

-- ---------------------------------------------------------------------------
-- Step 2. Repair the rows the defect already wrote.
--
-- The ledger is append-only by design, and 20260821120000 installs a trigger
-- that refuses a direct DELETE. These rows are not a balance being corrected,
-- which is what that rule protects: they are duplicates a bug emitted, and a
-- compensating row cannot fix them because the repair has to leave exactly one
-- transfer row standing for the pairing in step 3 to read.
--
-- So the trigger is stood down for the length of this transaction and put back
-- immediately. The `if exists` guard is because this migration may be applied
-- either side of 20260821120000, which is still pending.
-- ---------------------------------------------------------------------------
do
$$
    begin
        if exists (select 1
                   from pg_trigger
                   where tgname = 'credit_ledger_append_only_row'
                     and tgrelid = 'public.credit_ledger'::regclass) then
            alter table public.credit_ledger disable trigger credit_ledger_append_only_row;
        end if;
    end
$$;

-- 2a. Every transfer after the first, on both sides, goes. Keeping the LOWEST
--     id keeps the one the design intended and discards the repeats.
with surplus as (
    select l.id
    from public.credit_ledger l
    where l.reason = 'adjustment'
      and l.endpoint in ('transfer_in', 'transfer_out')
      and l.id > (select min(l2.id)
                  from public.credit_ledger l2
                  where l2.account_id = l.account_id
                    and l2.reason = 'adjustment'
                    and l2.endpoint = l.endpoint)
)
delete
from public.credit_ledger
where id in (select id from surplus);

-- 2b. A converted account must not hold a welcome grant: it already had one as
--     a guest, and that is precisely what the conversion record now remembers.
--     This is row 209 and anything like it.
delete
from public.credit_ledger l
where l.reason = 'anon_grant'
  and exists (select 1
              from public.credit_ledger t
              where t.account_id = l.account_id
                and t.reason = 'adjustment'
                and t.endpoint = 'transfer_in');

do
$$
    begin
        if exists (select 1
                   from pg_trigger
                   where tgname = 'credit_ledger_append_only_row'
                     and tgrelid = 'public.credit_ledger'::regclass) then
            alter table public.credit_ledger enable trigger credit_ledger_append_only_row;
        end if;
    end
$$;

-- ---------------------------------------------------------------------------
-- Step 3. Backfill a conversion record for every conversion that already
--         happened, so none of them can collect a welcome grant later or be
--         merged a second time.
--
-- The guest and the account are paired by the only evidence there is: equal
-- and opposite deltas, closest in time. Step 4 refuses the whole migration if
-- that pairing did not account for every transfer.
-- ---------------------------------------------------------------------------
insert into public.guest_conversions (guest_id, account_id, credits_moved, created_at)
select paired.guest_id,
       paired.account_id,
       paired.credits_moved,
       paired.created_at
from (select ti.account_id  as account_id,
             tout.guest_id  as guest_id,
             ti.delta       as credits_moved,
             ti.created_at  as created_at
      from public.credit_ledger ti
               cross join lateral (
          select l.account_id as guest_id
          from public.credit_ledger l
          where l.reason = 'adjustment'
            and l.endpoint = 'transfer_out'
            and l.delta = -ti.delta
          order by abs(extract(epoch from (l.created_at - ti.created_at)))
          limit 1
          ) tout
      where ti.reason = 'adjustment'
        and ti.endpoint = 'transfer_in') paired
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Step 4. Refuse if the repair did not land exactly.
-- ---------------------------------------------------------------------------
do
$$
    declare
        stray_in    int;
        unrecorded  int;
        negatives   text;
    begin
        -- No account may still hold more than one transfer of either direction.
        select count(*)
        into stray_in
        from (select l.account_id, l.endpoint
              from public.credit_ledger l
              where l.reason = 'adjustment'
                and l.endpoint in ('transfer_in', 'transfer_out')
              group by l.account_id, l.endpoint
              having count(*) > 1) d;

        if stray_in > 0 then
            raise exception 'Repair incomplete: % account/direction pair(s) still hold more than one transfer row.', stray_in;
        end if;

        -- Every transfer_in must now have a conversion record.
        select count(*)
        into unrecorded
        from public.credit_ledger l
        where l.reason = 'adjustment'
          and l.endpoint = 'transfer_in'
          and not exists (select 1
                          from public.guest_conversions g
                          where g.account_id = l.account_id);

        if unrecorded > 0 then
            raise exception 'Repair incomplete: % transferred account(s) have no guest_conversions row, so they could collect a welcome grant again.', unrecorded;
        end if;

        -- Nothing may be left holding a negative balance.
        select string_agg(format('  %s  %s', b.account_id, b.bal), e'\n')
        into negatives
        from (select l.account_id, sum(l.delta) as bal
              from public.credit_ledger l
              group by l.account_id
              having sum(l.delta) < 0) b;

        if negatives is not null then
            raise exception e'Repair incomplete: account(s) still hold a negative balance:\n%', negatives;
        end if;

        raise notice 'guest_conversions: % row(s) recorded.', (select count(*) from public.guest_conversions);
    end
$$;

-- ---------------------------------------------------------------------------
-- Step 5. The transfer, as one indivisible statement.
-- ---------------------------------------------------------------------------
create
    or replace function public.merge_guest_credits(
    guest_account uuid,
    target_account uuid
) returns integer
    language plpgsql
    security definer
    set
        search_path = '' as
$$
declare
    guest_is_anonymous boolean;
    remaining          integer;
    lock_first         uuid;
    lock_second        uuid;
begin
    if guest_account is null or target_account is null or guest_account = target_account then
        return 0;
    end if;

    -- The source must be a real ANONYMOUS sign-in. guest_account arrives from
    -- a cookie, which a hostile visitor sets to whatever they like, so this is
    -- the check that stops someone naming another person's account as their
    -- "guest" and draining it into their own.
    select u.is_anonymous
    into guest_is_anonymous
    from auth.users u
    where u.id = guest_account;

    if guest_is_anonymous is distinct from true then
        return 0;
    end if;

    -- Lock both accounts, lowest id first, so two conversions running at the
    -- same moment queue up instead of deadlocking against each other.
    if guest_account < target_account then
        lock_first := guest_account;
        lock_second := target_account;
    else
        lock_first := target_account;
        lock_second := guest_account;
    end if;

    perform 1 from public.accounts a where a.id = lock_first for update;
    perform 1 from public.accounts a where a.id = lock_second for update;

    -- THE IDEMPOTENCY GUARANTEE, and it is claimed BEFORE anything moves.
    -- A conflict on either constraint means this guest has already been
    -- drained or this account has already received its one conversion.
    insert into public.guest_conversions (guest_id, account_id)
    values (guest_account, target_account)
    on conflict do nothing;

    if not found then
        return 0;
    end if;

    select coalesce(sum(l.delta), 0)::integer
    into remaining
    from public.credit_ledger l
    where l.account_id = guest_account;

    -- Nothing to carry. The conversion is still recorded, which is the point:
    -- it is what stops the welcome grant being paid to this account later.
    if remaining <= 0 then
        return 0;
    end if;

    insert into public.credit_ledger (account_id, delta, reason, endpoint)
    values (guest_account, -remaining, 'adjustment', 'transfer_out'),
           (target_account, remaining, 'adjustment', 'transfer_in');

    update public.guest_conversions
    set credits_moved = remaining
    where guest_conversions.account_id = target_account;

    return remaining;
end;
$$;

comment on function public.merge_guest_credits is
    'Move a guest account''s remaining credits to the real account it just became, exactly once. Locks both accounts and claims the conversion record before moving anything, so concurrent calls cannot both transfer. guest-merge-double-runs.md.';

revoke execute on function public.merge_guest_credits(uuid, uuid) from public, authenticated;
grant execute on function public.merge_guest_credits(uuid, uuid) to service_role;

/*
 * Has this account already converted from a guest? Read by ensureGrants to
 * decide the welcome grant, replacing the cookie that the same request
 * deletes. One row, by primary-key-grade index, on every balance check.
 */
create
    or replace function public.has_converted(target_account uuid) returns boolean
    language sql
    security definer
    set
        search_path = '' as
$$
select exists (select 1
               from public.guest_conversions g
               where g.account_id = target_account);
$$;

comment on function public.has_converted is
    'True if this account carried credits over from a guest session. The durable replacement for the guest cookie, which is deleted mid-request.';

revoke execute on function public.has_converted(uuid) from public, authenticated;
grant execute on function public.has_converted(uuid) to service_role;

commit;
