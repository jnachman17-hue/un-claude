/*
 * -------------------------------------------------------
 * A refund takes back the credits of the payment being refunded, and nothing
 * else — and what it could not take back is written down
 * -------------------------------------------------------
 * f1-audit.md finding 0a, both directions, reproduced on the live database on
 * 23 August 2026 and again by scripts/verify-refund-attribution.mjs.
 *
 * THE BUG, in one sentence: `refund_purchase` decided how many credits it was
 * allowed to remove by looking at THE WHOLE ACCOUNT BALANCE, and the whole
 * account balance is not the same thing as what is left of the payment being
 * refunded. One mistake, two opposite losses.
 *
 * DIRECTION ONE — IT CONFISCATES CREDITS THE CUSTOMER PAID FOR.
 *
 *     +2  anon_grant
 *     +3  signup_grant
 *    +10  purchase      pack A, $4.99
 *    -15  spend                            <- pack A is now entirely gone
 *    +10  purchase      pack B, $4.99      <- paid for, untouched
 *    -10  money_refund  pack A             <- took pack B's credits
 *
 *   The customer asked for pack A back inside the thirty days the site offers.
 *   Pack A's credits were already spent, so the balance clamp found pack B's
 *   and removed those. The customer paid $4.99 for pack B, never used it,
 *   never asked for it back, and ends with nothing.
 *
 * DIRECTION TWO — IT HANDS BACK THE MONEY AND RECOVERS ALMOST NOTHING.
 *
 *     +2 / +3 grants, +10 purchase, -14 spend   ->  balance 1
 *     Stripe refunds the whole $4.99            ->  1 credit removed
 *
 *   The customer gets the entire $4.99 back and keeps nine credits' worth of
 *   work they were just refunded for. The ledger reads "$4.99 refunded, 1
 *   credit removed" and NOTHING ANYWHERE RECORDS THE NINE.
 *
 * THE CLAMP ITSELF IS RIGHT AND STAYS. A negative balance would refuse every
 * job including the free scan, show the customer a number nobody can explain,
 * and leave them no way out except buying their way back to zero. What changes
 * is WHICH POOL is clamped against.
 *
 * ---------------------------------------------------------------------------
 * HOW "WHAT IS LEFT OF THAT PAYMENT" IS WORKED OUT, because credits are not
 * labelled and the answer has to come from somewhere.
 * ---------------------------------------------------------------------------
 * Credits are spent OLDEST FIRST. That is the only rule, and everything below
 * follows from it. It is the customer-favourable reading (the free grants,
 * which arrive first, are used up before anything they paid for) and it is the
 * reading the audit itself used when it said "4 of those were free grants".
 *
 * So, for the payment being refunded:
 *
 *   what it granted            the purchase row's delta
 *   minus what already went    money_refund rows already written for it
 *   = what it still stands for
 *
 *   everything granted BEFORE it, net of refunds already taken against those
 *   earlier payments, is the queue ahead of it. Spending fills that queue from
 *   the front. Anything spent beyond it came out of THIS payment.
 *
 *   so:  used_from_this = clamp(total_spent - queue_ahead, 0, still_stands_for)
 *        remaining      = still_stands_for - used_from_this
 *
 * `total_spent` deliberately EXCLUDES money_refund rows. A refund is not
 * consumption, and it is already accounted for against its own payment above;
 * counting it twice would make an earlier refund eat a later purchase, which is
 * the bug in a new coat.
 *
 * PROVED, not asserted: run `node scripts/verify-refund-attribution.mjs`.
 * Before this migration it fails four checks; after it, it passes.
 *
 * Idempotent and safe to re-run.
 */

begin;

-- ---------------------------------------------------------------------------
-- 1. Where a refund that gave back more than it recovered is written down.
-- ---------------------------------------------------------------------------
/*
 * WHY A SEPARATE TABLE AND NOT A LEDGER ROW. The ledger records CHANGES TO A
 * BALANCE, and a shortfall is the opposite: it is the change that could not be
 * made. `credit_ledger.delta` is `check (delta <> 0)` precisely so that no row
 * can mean "nothing happened", and a shortfall row would have to.
 *
 * WHY account_id IS `on delete set null` RATHER THAN CASCADE. This is a money
 * record, and money records have to survive the account they came from or they
 * cannot be counted — which is the whole complaint the audit made. Setting it
 * to null keeps the loss countable while removing the link to the person, so
 * deleting an account still removes that person's data.
 */
create table if not exists
    public.refund_shortfalls
(
    id                       bigint generated always as identity primary key,

    -- Null once the account is deleted. The payment intent below is what makes
    -- the row reconcilable against Stripe afterwards.
    account_id               uuid references public.accounts (id) on delete set null,

    stripe_payment_intent_id varchar(255)             not null,
    stripe_event_id          varchar(255),

    -- What this refund should have taken back in total, what it actually took,
    -- and the difference: work the customer keeps and was refunded for.
    target_credits           integer                  not null,
    removed_credits          integer                  not null,
    shortfall_credits        integer                  not null check (shortfall_credits > 0),

    -- The money side. `refund_cents` is what Stripe handed back on this event;
    -- `shortfall_cents` is what the credits we could not recover were sold for.
    refund_cents             integer,
    purchase_credits         integer,
    purchase_cents           integer,
    shortfall_cents          integer,

    created_at               timestamp with time zone not null default now()
);

comment on table public.refund_shortfalls is
    'Refunds that gave back more value than they recovered: the customer keeps work they were refunded for. One row per refund event that could not remove its full target. f1-audit.md finding 0a.';
comment on column public.refund_shortfalls.shortfall_credits is
    'Credits the refund should have taken back but could not, because they were already spent.';
comment on column public.refund_shortfalls.shortfall_cents is
    'What those credits were sold for, at this payment''s own price per credit. The cash value of the loss.';
comment on column public.refund_shortfalls.account_id is
    'Null once the account is deleted. The loss stays countable; the link to the person does not.';

-- One row per refund event. A repeat delivery of the same Stripe event must
-- not count the same loss twice.
create unique index if not exists refund_shortfalls_event_uniq
    on public.refund_shortfalls (stripe_event_id)
    where stripe_event_id is not null;

create index if not exists refund_shortfalls_payment_idx
    on public.refund_shortfalls (stripe_payment_intent_id);

alter table public.refund_shortfalls
    enable row level security;

-- Deliberately NO policy for `authenticated`. This is our own accounting, it is
-- never sent to a browser, and it is written only by the function below.
revoke all on public.refund_shortfalls from authenticated, anon;
grant select, insert on table public.refund_shortfalls to service_role;

-- ---------------------------------------------------------------------------
-- 2. The refund itself.
-- ---------------------------------------------------------------------------
create or replace function public.refund_purchase(
    target_account uuid,
    -- The total credits that should stand removed for this payment once this
    -- call is done, NOT the number to remove now. Stripe reports
    -- `amount_refunded` as a running total, so the caller passes a cumulative
    -- target and this works out the difference.
    -- 20260821160000_refund_cumulative.sql.
    target_total integer,
    payment_intent varchar,
    event_id varchar,
    refund_cents integer default null
) returns integer
    language plpgsql
    security definer
    set search_path = ''
as
$$
declare
    purchase_row_id  bigint;
    bought_credits   integer;
    bought_cents     integer;
    already_removed  integer;
    still_stands_for integer;
    queue_ahead      integer;
    earlier_granted  integer;
    earlier_refunded integer;
    total_spent      integer;
    used_from_this   integer;
    remaining        integer;
    available        integer;
    wanted           integer;
    to_remove        integer;
    shortfall        integer;
begin
    if target_total is null or target_total < 0 then
        raise exception 'refund_purchase: target_total must be zero or positive, got %', target_total;
    end if;

    if payment_intent is null then
        raise exception 'refund_purchase: payment_intent is required to compute what was already refunded';
    end if;

    -- Lock this account so a sanitise, a purchase or a second refund cannot
    -- land between the reads below and the write at the end. Everything from
    -- here down is computed inside the lock, which is the only way the
    -- arithmetic can be trusted.
    perform 1 from public.accounts a where a.id = target_account for update;

    -- The purchase this refund reverses. Without it there is nothing to
    -- attribute against, and taking credits from the account at large is
    -- exactly the mistake this migration exists to end.
    select l.id, l.delta, l.price_cents
    into purchase_row_id, bought_credits, bought_cents
    from public.credit_ledger l
    where l.stripe_payment_intent_id = payment_intent
      and l.reason = 'purchase'
      and l.account_id = target_account
    order by l.id
    limit 1;

    if purchase_row_id is null then
        -- Nothing of ours was ever granted for this payment. The webhook
        -- already tells these two cases apart before calling; this is the
        -- backstop, and doing nothing is the only safe answer.
        return 0;
    end if;

    -- How many credits have ALREADY been taken back for this exact payment.
    select coalesce(sum(-l.delta), 0)::integer
    into already_removed
    from public.credit_ledger l
    where l.stripe_payment_intent_id = payment_intent
      and l.reason = 'money_refund';

    wanted := target_total - already_removed;

    -- Nothing new to do. A repeat delivery of the same event lands here, as
    -- does an out-of-order event describing a smaller cumulative total.
    if wanted <= 0 then
        return 0;
    end if;

    -- ---- what is left of THIS payment -------------------------------------
    still_stands_for := greatest(bought_credits - already_removed, 0);

    -- Everything granted before this purchase...
    select coalesce(sum(l.delta), 0)::integer
    into earlier_granted
    from public.credit_ledger l
    where l.account_id = target_account
      and l.delta > 0
      and l.id < purchase_row_id;

    -- ...net of refunds already taken against those earlier payments. Note
    -- this matches on the PAYMENT, not on row order: a refund of an earlier
    -- purchase can be written long after this one was bought.
    select coalesce(sum(-r.delta), 0)::integer
    into earlier_refunded
    from public.credit_ledger r
    where r.account_id = target_account
      and r.reason = 'money_refund'
      and exists (select 1
                  from public.credit_ledger p
                  where p.reason = 'purchase'
                    and p.account_id = target_account
                    and p.stripe_payment_intent_id = r.stripe_payment_intent_id
                    and p.id < purchase_row_id);

    queue_ahead := greatest(earlier_granted - earlier_refunded, 0);

    -- Everything ever consumed, refunds excluded: they are not consumption and
    -- are already accounted for against their own payment.
    select coalesce(sum(-l.delta), 0)::integer
    into total_spent
    from public.credit_ledger l
    where l.account_id = target_account
      and l.delta < 0
      and l.reason <> 'money_refund';

    -- Oldest first: spending fills the queue ahead before it reaches this
    -- payment, and anything beyond that came out of this one.
    used_from_this := least(greatest(total_spent - queue_ahead, 0), still_stands_for);
    remaining := greatest(still_stands_for - used_from_this, 0);

    to_remove := least(wanted, remaining);

    -- The balance floor stays as a second guard. It is proved never to bind
    -- once the clamp above is right — what is left of one payment can never
    -- exceed the whole balance — but a floor on a money path costs nothing.
    select coalesce(sum(l.delta), 0)::integer
    into available
    from public.credit_ledger l
    where l.account_id = target_account;

    to_remove := least(to_remove, greatest(available, 0));
    to_remove := greatest(to_remove, 0);

    shortfall := wanted - to_remove;

    -- ---- the shortfall, written down before anything else ------------------
    /*
     * BEFORE the early return below, because the WORST case — a payment whose
     * credits are entirely spent — removes nothing at all, and that is exactly
     * the case that most needs recording. Under the old function this case
     * silently raided another purchase; under this one it would silently do
     * nothing unless this row is written.
     */
    if shortfall > 0 then
        insert into public.refund_shortfalls
        (account_id, stripe_payment_intent_id, stripe_event_id,
         target_credits, removed_credits, shortfall_credits,
         refund_cents, purchase_credits, purchase_cents, shortfall_cents)
        values (target_account, payment_intent, event_id,
                target_total, already_removed + to_remove, shortfall,
                refund_cents, bought_credits, bought_cents,
                case
                    when bought_cents is null or bought_credits is null or bought_credits = 0
                        then null
                    else round(shortfall::numeric * bought_cents / bought_credits)::integer
                    end)
        on conflict do nothing;
    end if;

    if to_remove <= 0 then
        return 0;
    end if;

    insert into public.credit_ledger
        (account_id, delta, reason, stripe_event_id, stripe_payment_intent_id, price_cents)
    values (target_account, -to_remove, 'money_refund', event_id, payment_intent, refund_cents);

    return to_remove;
end;
$$;

comment on function public.refund_purchase is
    'Bring the total credits removed for one payment up to target_total, removing only what THAT PAYMENT still has left — never credits belonging to another purchase or to a free grant. Credits are attributed oldest-first. Whatever could not be recovered is written to refund_shortfalls. Cumulative-safe and idempotent. Returns how many were removed by THIS call.';

revoke execute on function public.refund_purchase(uuid, integer, varchar, varchar, integer) from public, authenticated;
grant execute on function public.refund_purchase(uuid, integer, varchar, varchar, integer) to service_role;

commit;
