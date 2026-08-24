/*
 * -------------------------------------------------------
 * What a run cost us, actually written down
 * -------------------------------------------------------
 * f1-audit.md finding Q. The live privacy policy says:
 *
 *   "Each time you clean something, one line is added to your credit history.
 *    It records the date and time, whether the input was a file or pasted text,
 *    how many words it contained, and how many credits it cost, ALONG WITH WHAT
 *    THE RUN COST US TO PERFORM."
 *
 * The column exists (`credit_ledger.cost_usd`), the engine returns the figure,
 * and nothing has ever written it. Every spend row in the live database has it
 * null. So the policy describes a record the database does not make.
 *
 * ---------------------------------------------------------------------------
 * WHY THE COLUMN CANNOT BE USED, AND THIS IS THE PART THAT MATTERS.
 *
 * The credit is spent BEFORE the engine runs — that is what stops two racing
 * requests both spending the last credit. The cost is only known AFTER it runs.
 * Filling the column in would therefore mean UPDATING the spend row, and the
 * ledger refuses every update. Tested against the live database on 23 August
 * 2026:
 *
 *     UPDATE credit_ledger SET cost_usd = ... WHERE id = <a row we made>
 *         -> permission denied for table credit_ledger
 *     DELETE FROM credit_ledger WHERE id = <the same row>
 *         -> permission denied for table credit_ledger
 *
 * That refusal is correct and must not be relaxed: Supabase's free plan takes
 * no backups, so an append-only ledger is the only protection the credit
 * history has. `cost_usd` was simply put somewhere it could never be written.
 *
 * THE FIX. A row alongside the spend, in its own table, written after the run.
 * The ledger stays append-only and untouched; the cost record is a separate,
 * insert-only fact pointing at the ledger row it describes.
 * ---------------------------------------------------------------------------
 *
 * Requires the application change in lib/server/credits.ts that calls
 * `spend_credits_for_job` and writes `run_costs`. Applying this migration alone
 * changes nothing and breaks nothing.
 *
 * Idempotent and safe to re-run.
 */

begin;

-- ---------------------------------------------------------------------------
-- 1. What one run consumed.
-- ---------------------------------------------------------------------------
/*
 * ONE ROW PER SPEND, keyed on the ledger row itself, so the join that answers
 * "what did we charge and what did it cost" is a primary key lookup and cannot
 * drift. It cascades with the ledger row, which means it is removed when the
 * account is deleted — the same promise the privacy policy already makes about
 * the credit history.
 */
create table if not exists
    public.run_costs
(
    ledger_id    bigint primary key references public.credit_ledger (id) on delete cascade,

    -- The AI Gateway's own figures, not our arithmetic on a token count.
    model_calls  integer,
    retries      integer,
    total_tokens integer,
    cost_usd     numeric(12, 8),

    -- Wall-clock for the whole run, from the engine's own timer.
    seconds      numeric(8, 3),

    -- False on a scan-and-strip run, which makes no model call and costs
    -- nothing. Those rows are still written, so a zero can be told from a gap.
    layer_b      boolean,

    created_at   timestamp with time zone not null default now()
);

comment on table public.run_costs is
    'What one run cost us, written after it finished. Separate from credit_ledger because the ledger is append-only and the cost is only known after the credit has been spent. f1-audit.md finding Q.';
comment on column public.run_costs.cost_usd is
    'The AI Gateway''s own figure in US dollars. Our unit economics, never sent to a browser.';
comment on column public.run_costs.layer_b is
    'Whether the paid rewrite ran. False means no model call was made and the run cost nothing.';

alter table public.run_costs
    enable row level security;

-- No browser reads this. It is our own cost accounting.
revoke all on public.run_costs from authenticated, anon;
-- Insert and select only: the same append-only discipline the ledger has.
grant select, insert on table public.run_costs to service_role;

-- ---------------------------------------------------------------------------
-- 2. Spending, told to say WHICH row it wrote.
-- ---------------------------------------------------------------------------
/*
 * `spend_credits` returns the new balance and nothing else, so there is no way
 * to know afterwards which row a particular job produced. Reading back "the
 * newest spend row for this account" is not an answer: the audit ran six jobs
 * at one account simultaneously and they all passed, so two runs finishing
 * together would both claim the same row and one cost would be lost silently.
 *
 * THE OLD `spend_credits` IS DELIBERATELY LEFT EXACTLY AS IT IS. It is the
 * hottest path in the product and it is presently correct; this adds a second
 * door rather than rebuilding the one people are walking through. The
 * application uses this one and falls back to the old one when this migration
 * has not been applied. IF YOU EVER CHANGE ONE, CHANGE BOTH — they are the same
 * logic twice and nothing but this comment holds them together.
 */
create or replace function public.spend_credits_for_job(
    target_account uuid,
    amount integer,
    job_endpoint varchar default null,
    job_input_kind varchar default null,
    job_words_in integer default null
) returns table
          (
              new_balance integer,
              ledger_id   bigint
          )
    language plpgsql
    security definer
    set search_path = ''
as
$$
declare
    available integer;
    written   bigint;
begin
    if amount is null or amount <= 0 then
        raise exception 'spend_credits_for_job: amount must be positive, got %', amount;
    end if;

    -- The lock is the point. Without it a visitor with one credit could fire
    -- two sanitises together, both read a balance of one, and both spend it.
    perform 1 from public.accounts a where a.id = target_account for update;

    select coalesce(sum(l.delta), 0)::integer
    into available
    from public.credit_ledger l
    where l.account_id = target_account;

    if available < amount then
        raise exception 'insufficient_credits' using detail = format('have %s, need %s', available, amount);
    end if;

    insert into public.credit_ledger (account_id, delta, reason, endpoint, input_kind, words_in)
    values (target_account, -amount, 'spend', job_endpoint, job_input_kind, job_words_in)
    returning id into written;

    new_balance := available - amount;
    ledger_id := written;

    return next;
end;
$$;

comment on function public.spend_credits_for_job is
    'Debit credits atomically and say which ledger row it wrote, so the cost of the run can be attached to it afterwards. Otherwise identical to spend_credits. Raises insufficient_credits rather than allowing a negative balance.';

revoke execute on function public.spend_credits_for_job(uuid, integer, varchar, varchar, integer) from public, authenticated, anon;
grant execute on function public.spend_credits_for_job(uuid, integer, varchar, varchar, integer) to service_role;

commit;
