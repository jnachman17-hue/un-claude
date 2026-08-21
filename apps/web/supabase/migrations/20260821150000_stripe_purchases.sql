/*
 * -------------------------------------------------------
 * Paid credits: the second lock against paying twice, and refunds
 * -------------------------------------------------------
 * 04 entries 111 and 112. Session 11, the Stripe session.
 *
 * WHAT ALREADY EXISTS AND IS NOT REPEATED HERE. The base ledger migration
 * already carries `credit_ledger_stripe_event_id_uniq`, a partial unique index
 * on stripe_event_id. Stripe delivers every webhook AT LEAST once, so a second
 * delivery is a certainty rather than a risk, and that index is what makes the
 * second one harmless: the insert loses to the conflict instead of granting the
 * credits again.
 *
 * WHY THAT INDEX IS NOT ENOUGH ON ITS OWN, which is the whole reason this file
 * exists. It is keyed on the EVENT, and one payment can be described by more
 * than one event. Today the webhook handles exactly one event type
 * (checkout.session.completed) so one payment produces one event, and the index
 * holds. But that safety is a property of the ROUTE, not of the database: the
 * day a future session adds a `payment_intent.succeeded` handler "for
 * completeness", the same payment arrives under a second event id, clears the
 * event index, and pays the credits a second time. Nothing would fail. Nothing
 * would be logged. The balance would simply be wrong, and the ledger is
 * append-only so it could not be corrected by editing.
 *
 * The second index below is keyed on the PAYMENT rather than on the event, so
 * one payment can buy credits exactly once no matter how many event types
 * describe it or how many handlers a later session writes.
 *
 * Idempotent and safe to re-run.
 */

begin;

-- One purchase per payment, whatever event carried the news. Partial, because
-- every non-purchase row leaves stripe_payment_intent_id null, and a refund row
-- deliberately reuses the SAME payment intent id as the purchase it reverses.
create unique index if not exists credit_ledger_purchase_payment_intent_uniq
    on public.credit_ledger (stripe_payment_intent_id)
    where reason = 'purchase' and stripe_payment_intent_id is not null;

comment on index public.credit_ledger_purchase_payment_intent_uniq is
    'One purchase row per Stripe payment. Guards against a second event type describing the same payment and paying twice.';

/*
 * Refunding money, which is NOT the same operation as refunding a failed job.
 *
 * `operation_refund` gives credits back when a run fails, and is written by the
 * server the moment it fails. THIS is the other direction: Jon refunds a card
 * payment in the Stripe dashboard, and the credits that payment bought have to
 * leave the balance, or a refunded customer keeps both the money and the
 * credits.
 *
 * THE POLICY THIS IMPLEMENTS is the one already promised in the live terms of
 * service: within 30 days, unspent credits from that purchase, at the price
 * paid. "Unspent" is the load-bearing word and it is why this cannot be a plain
 * insert of a negative row.
 *
 * WHAT HAPPENS WHEN THEY HAVE ALREADY SPENT SOME. The balance is clamped at
 * zero rather than driven negative. A negative balance is not a number this
 * product has any meaning for: the tool would refuse every job including the
 * free scan, the wallet would show a figure nobody can explain, and the person
 * would have no way back except buying their way out of a hole. Clamping means
 * the worst case is Jon having refunded more money than he took credits back
 * for, which is a business decision he made in the dashboard, recoverable, and
 * visible. Driving a stranger's balance negative is none of those things.
 *
 * The clamp is REPORTED, not hidden: the function returns how many credits it
 * actually removed, the caller logs the shortfall, and scripts/stripe-refund-
 * check.mjs exists so the unspent figure can be read BEFORE the refund is
 * issued rather than discovered after.
 *
 * Locking, for the same reason spend_credits and merge_guest_credits lock: the
 * balance is read and then written, and those two steps have to be one
 * indivisible step or a sanitise landing between them corrupts the result.
 */
create or replace function public.refund_purchase(
    target_account uuid,
    credits integer,
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
    available integer;
    to_remove integer;
begin
    if credits is null or credits <= 0 then
        raise exception 'refund_purchase: credits must be positive, got %', credits;
    end if;

    -- Lock this account so a sanitise cannot land between the read and write.
    perform 1 from public.accounts a where a.id = target_account for update;

    select coalesce(sum(l.delta), 0)::integer
    into available
    from public.credit_ledger l
    where l.account_id = target_account;

    -- Never negative. See the note above on why this clamps rather than raises.
    to_remove := least(credits, greatest(available, 0));

    if to_remove = 0 then
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
    'Remove the credits a refunded payment bought, clamped at a zero balance. Returns how many were actually removed, which is less than asked when the customer had already spent some.';

-- Only the server refunds. A browser asking to reverse a payment is exactly the
-- kind of call this table exists to make impossible.
revoke execute on function public.refund_purchase(uuid, integer, varchar, varchar, integer) from public, authenticated;
grant execute on function public.refund_purchase(uuid, integer, varchar, varchar, integer) to service_role;

commit;
