/*
 * -------------------------------------------------------
 * Refunds are CUMULATIVE, and the first version got that wrong
 * -------------------------------------------------------
 * 04 entry 114. Found by the payment audit, 21 August 2026, and confirmed
 * against Stripe's own field semantics.
 *
 * THE BUG, in one sentence: `charge.amount_refunded` is the RUNNING TOTAL
 * refunded on a charge, and the first version of this function treated it as
 * the amount of THIS refund.
 *
 * What that produced. A $9.99 pack of 25 credits, refunded $3.00 twice:
 *
 *   event 1: amount_refunded = 300  -> remove ceil(300/999 * 25) = 8   (correct)
 *   event 2: amount_refunded = 600  -> remove ceil(600/999 * 25) = 16  (WRONG)
 *                                      total removed 24, correct total 16
 *
 * The customer is refunded $6.00 of $9.99 and loses 24 of 25 credits. Worse,
 * `refund_purchase` clamps against the WHOLE ACCOUNT BALANCE rather than the
 * purchase, so the surplus is taken out of credits the customer bought in a
 * DIFFERENT, un-refunded purchase. And the ledger is append-only, so the rows
 * cannot be corrected — only compensated for by hand.
 *
 * THE FIX: the caller passes the TARGET CUMULATIVE number of credits that
 * should have been removed for this payment in total, and this function works
 * out how many have already gone and removes only the difference. That is
 * naturally idempotent: a repeat delivery of the same event computes the same
 * target, finds it already met, and removes nothing.
 *
 * The already-removed sum is computed INSIDE the lock, alongside the balance
 * read, so two refund events arriving together cannot both see the same
 * "already removed" figure and both act on it.
 *
 * Idempotent and safe to re-run.
 */

begin;

/*
 * The old four-argument signature is dropped rather than left beside the new
 * one. Postgres would happily keep both as overloads, and PostgREST would then
 * pick between them by the argument names a caller happens to send — so a stale
 * deployment calling the old shape would silently get the BUGGY function back.
 */
drop function if exists public.refund_purchase(uuid, integer, varchar, varchar, integer);

create or replace function public.refund_purchase(
    target_account uuid,
    -- The total credits that should stand removed for this payment once this
    -- call is done, NOT the number to remove now. See the header.
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
    available      integer;
    already_removed integer;
    to_remove      integer;
begin
    if target_total is null or target_total < 0 then
        raise exception 'refund_purchase: target_total must be zero or positive, got %', target_total;
    end if;

    if payment_intent is null then
        raise exception 'refund_purchase: payment_intent is required to compute what was already refunded';
    end if;

    -- Lock this account so a sanitise, a purchase or a second refund cannot
    -- land between the reads below and the write at the end.
    perform 1 from public.accounts a where a.id = target_account for update;

    -- How many credits have ALREADY been taken back for this exact payment.
    -- money_refund rows carry the same payment intent as the purchase they
    -- reverse, which is why the purchase uniqueness index is partial.
    select coalesce(sum(-l.delta), 0)::integer
    into already_removed
    from public.credit_ledger l
    where l.stripe_payment_intent_id = payment_intent
      and l.reason = 'money_refund';

    to_remove := target_total - already_removed;

    -- Nothing new to do. A repeat delivery of the same event lands here, as
    -- does an out-of-order event describing a smaller cumulative total.
    if to_remove <= 0 then
        return 0;
    end if;

    select coalesce(sum(l.delta), 0)::integer
    into available
    from public.credit_ledger l
    where l.account_id = target_account;

    -- Never negative. A balance below zero would refuse every job including the
    -- free scan, show the customer a number nobody can explain, and leave them
    -- no way out except buying their way back to zero.
    to_remove := least(to_remove, greatest(available, 0));

    if to_remove <= 0 then
        return 0;
    end if;

    insert into public.credit_ledger
        (account_id, delta, reason, stripe_event_id, stripe_payment_intent_id, price_cents)
    values
        (target_account, -to_remove, 'money_refund', event_id, payment_intent, refund_cents);

    return to_remove;
end;
$$;

comment on function public.refund_purchase is
    'Bring the total credits removed for one payment up to target_total, removing only the shortfall. Cumulative-safe: Stripe reports amount_refunded as a running total, so repeat and partial refund events must not each remove the full proportion. Clamped at a zero balance. Returns how many were removed by THIS call.';

revoke execute on function public.refund_purchase(uuid, integer, varchar, varchar, integer) from public, authenticated;
grant execute on function public.refund_purchase(uuid, integer, varchar, varchar, integer) to service_role;

commit;
