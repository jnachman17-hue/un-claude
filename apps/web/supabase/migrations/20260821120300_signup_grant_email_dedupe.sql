/*
 * -------------------------------------------------------
 * One signup grant per email INBOX, not per email ADDRESS
 * -------------------------------------------------------
 * security-audit.md finding 1 (the plus-address vector) and finding 2.
 *
 * THE HOLE. Signing up earns SIGNUP_CREDITS (3) once per account, enforced by a
 * partial unique index on account_id. But `student+1@gmail.com` and
 * `student+2@gmail.com` are the SAME inbox and different accounts, so one person
 * with one inbox can collect the 3-credit signup grant — and with it access to
 * the paid rewrite layer — again and again. The signup grant is the part that
 * costs real money, so this is the money-bleeding half of finding 1.
 *
 * THE FIX. Carry a NORMALISED email on the signup-grant row and make it unique.
 * The server (credits.ts) computes the normalised address — lower-cased, the
 * `+tag` stripped, and for Gmail the dots removed — and writes it here. A second
 * plus-addressed signup from the same inbox then hits this index and its grant
 * is discarded (23505, already handled as idempotent by grantOnce). The account
 * is still created; it just does not get a second inbox's worth of paid credits.
 *
 * WHY THIS DOES NOT PUNISH SHARED IPs. It keys on the inbox, not the network. A
 * lecture hall of 300 students on one campus IP has 300 different inboxes and
 * every one still gets its grant. This is the shared-IP-safe half of the
 * "one person, many accounts" defence; the network-based half (a per-IP cap) is
 * deliberately NOT shipped here — see security-fixes.md for why it is the wrong
 * tool for a student audience.
 *
 * Existing signup_grant rows predate the column and keep grant_email = null; the
 * partial index ignores nulls, so nothing already in the ledger conflicts.
 * Idempotent and safe to re-run.
 */

alter table public.credit_ledger
    add column if not exists grant_email text;

comment on column public.credit_ledger.grant_email is
    'Normalised email inbox a signup grant was paid to (lower-cased, +tag stripped, Gmail dots removed). Null on every non-signup row. Makes the signup grant once-per-inbox, not once-per-address. security-audit.md finding 1.';

-- One signup grant per normalised inbox, ever.
create unique index if not exists credit_ledger_one_signup_grant_per_email
    on public.credit_ledger (grant_email)
    where reason = 'signup_grant' and grant_email is not null;
