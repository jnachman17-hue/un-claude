/*
 * -------------------------------------------------------
 * The credit ledger
 * -------------------------------------------------------
 * 04 entries 59, 63, 66 and 67. 06 rows 49 and 64.
 *
 * A BALANCE IS NEVER STORED. It is the sum of this table's `delta` for an
 * account. There is no number anywhere that a bug, a race or a person can set
 * to the wrong value: to change a balance you add a row saying why it changed,
 * and every change keeps its reason for ever.
 *
 * 06 row 49 is the trap this exists to avoid. `accounts.public_data` is the
 * obvious home for a balance and it is the one place it cannot go, because
 * `accounts_update` in the first migration lets any signed-in user update their
 * own row and the protective trigger guards only `id` and `email`. A user could
 * set their own balance. Nothing in this file is writable by `authenticated`.
 *
 * 06 row 64 asked for the usage figures and the credit figures to live in one
 * table, and they do. One sanitise is ONE row carrying both what we charged and
 * what it cost us. That join is the whole point: usage without revenue beside it
 * cannot answer a pricing question, which is the question 04 entry 59 exists to
 * make answerable.
 */

create table if not exists
    public.credit_ledger
(
    id                       bigint generated always as identity primary key,
    account_id               uuid                     not null references public.accounts (id) on delete cascade,

    -- Positive adds credits, negative spends them. Never zero.
    delta                    integer                  not null check (delta <> 0),
    reason                   varchar(32)              not null check (
        reason in ('signup_grant', 'purchase', 'spend', 'operation_refund', 'money_refund', 'adjustment')
        ),

    -- Stripe. `event_id` carries the idempotency guarantee: see the unique index.
    stripe_event_id          varchar(255),
    stripe_payment_intent_id varchar(255),
    price_cents              integer,

    -- What the job was and what it actually cost us to run. Null on any row that
    -- is not a spend. `cost_usd` is the AI Gateway's own figure, not our
    -- arithmetic on a token count. 06 row 64.
    endpoint                 varchar(32),
    input_kind               varchar(32),
    words_in                 integer,
    model_calls              integer,
    retries                  integer,
    total_tokens             integer,
    cost_usd                 numeric(12, 8),
    seconds                  numeric(8, 3),
    layer_b                  boolean,

    created_at               timestamp with time zone not null default now()
);

comment on table public.credit_ledger is
    'Every change to a credit balance, with its reason. A balance is the sum of delta and is never stored.';
comment on column public.credit_ledger.delta is
    'Credits added (positive) or spent (negative). One credit buys 1,000 words: 04 entry 67.';
comment on column public.credit_ledger.stripe_event_id is
    'The Stripe event that caused this row. Unique, so a webhook delivered twice cannot pay twice.';
comment on column public.credit_ledger.cost_usd is
    'What the run cost us at the AI Gateway. Our unit economics, never sent to a browser.';

-- A Stripe webhook is delivered AT LEAST once, so it will eventually arrive
-- twice. This index is what makes the second delivery harmless: the insert
-- fails on the conflict rather than granting the credits again. Partial,
-- because every non-Stripe row leaves the column null.
create unique index if not exists credit_ledger_stripe_event_id_uniq
    on public.credit_ledger (stripe_event_id)
    where stripe_event_id is not null;

-- One account's history, newest first, is the only query the app makes often.
create index if not exists credit_ledger_account_created_idx
    on public.credit_ledger (account_id, created_at desc);

alter table public.credit_ledger
    enable row level security;

-- SELECT(credit_ledger): a user can read their own history and nothing else.
create policy credit_ledger_read on public.credit_ledger for
    select
    to authenticated using (
    (select auth.uid()) = account_id
    );

-- There is deliberately NO insert, update or delete policy for `authenticated`.
-- Credits are granted by the server or by Stripe's webhook, never by a browser.
revoke all on public.credit_ledger
    from
    authenticated,
    service_role;

grant
    select
    on table public.credit_ledger to authenticated;

grant
    select
    ,
    insert on table public.credit_ledger to service_role;

/*
 * The balance. A function rather than a column, so it cannot drift from the
 * rows that produced it.
 */
create
    or replace function public.credit_balance(target_account uuid default null) returns integer
    language sql
    security definer
    set
        search_path = '' as
$$
select coalesce(sum(l.delta), 0)::integer
from public.credit_ledger l
where l.account_id = coalesce(target_account, (select auth.uid()));
$$;

comment on function public.credit_balance is
    'Credits available to an account. Defaults to the caller. Sums the ledger rather than reading a stored number.';

grant execute on function public.credit_balance(uuid) to authenticated, service_role;

/*
 * Spending, done in one statement so two requests cannot both pass the check.
 *
 * The lock is the point. Without `for update` a visitor with one credit could
 * fire two sanitises together, both read a balance of one, and both spend it.
 * Returns the new balance, or raises if the account cannot afford the job.
 */
create
    or replace function public.spend_credits(
    target_account uuid,
    amount integer,
    job_endpoint varchar default null,
    job_input_kind varchar default null,
    job_words_in integer default null
) returns integer
    language plpgsql
    security definer
    set
        search_path = '' as
$$
declare
    available integer;
begin
    if amount is null or amount <= 0 then
        raise exception 'spend_credits: amount must be positive, got %', amount;
    end if;

    -- Lock this account's rows so a concurrent spend waits rather than racing.
    perform 1 from public.accounts a where a.id = target_account for update;

    select coalesce(sum(l.delta), 0)::integer
    into available
    from public.credit_ledger l
    where l.account_id = target_account;

    if available < amount then
        raise exception 'insufficient_credits' using detail = format('have %s, need %s', available, amount);
    end if;

    insert into public.credit_ledger (account_id, delta, reason, endpoint, input_kind, words_in)
    values (target_account, -amount, 'spend', job_endpoint, job_input_kind, job_words_in);

    return available - amount;
end;
$$;

comment on function public.spend_credits is
    'Debit credits atomically. Raises insufficient_credits rather than allowing a negative balance.';

-- Only the server may spend. A browser asking to debit its own account is
-- exactly the thing this table exists to prevent.
revoke execute on function public.spend_credits(uuid, integer, varchar, varchar, integer) from public, authenticated;
grant execute on function public.spend_credits(uuid, integer, varchar, varchar, integer) to service_role;

/*
 * The signup grant. 04 entry 67: two credits on creating an account, once.
 *
 * `on conflict do nothing` against the partial unique index below is what makes
 * "once" true even if this runs twice.
 */
create unique index if not exists credit_ledger_one_signup_grant
    on public.credit_ledger (account_id)
    where reason = 'signup_grant';
