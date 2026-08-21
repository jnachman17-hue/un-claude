/*
 * -------------------------------------------------------
 * The welcome grant, and the 2 + 3 split
 * -------------------------------------------------------
 * 04 entry 97. Jon ratified: 2 free credits for anyone (the welcome grant,
 * written the first time a visitor sanitises, against the anonymous account
 * their browser holds), and 3 more for creating a real account (the signup
 * grant that already exists, its amount now 3 rather than entry 67's 2).
 *
 * This migration only teaches the ledger the new reason and guards it. The
 * grants themselves are plain inserts made by the server with the service
 * key; the partial unique indexes are what make each grant once-per-account,
 * because a second insert hits the index and fails instead of paying twice.
 */

alter table public.credit_ledger
    drop constraint if exists credit_ledger_reason_check;

alter table public.credit_ledger
    add constraint credit_ledger_reason_check check (
        reason in (
                   'signup_grant',
                   'anon_grant',
                   'purchase',
                   'spend',
                   'operation_refund',
                   'money_refund',
                   'adjustment'
            )
        );

comment on column public.credit_ledger.reason is
    'Why the balance changed. anon_grant is the 2-credit welcome any account receives once; signup_grant is the 3 credits a real (non-anonymous) account receives once. 04 entry 97.';

-- One welcome grant per account, ever, enforced the same way the signup
-- grant already is: the second insert conflicts and is discarded.
create unique index if not exists credit_ledger_one_anon_grant
    on public.credit_ledger (account_id)
    where reason = 'anon_grant';
