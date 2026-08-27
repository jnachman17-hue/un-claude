/*
 * -------------------------------------------------------
 * A credit grant given to a fraternity chapter, counted separately
 * -------------------------------------------------------
 * 26 August 2026. The UA IFC outreach offers each chapter a shared account
 * carrying 250 credits. This teaches the ledger what that is.
 *
 * WHY NOT JUST USE `adjustment`, which is already allowed. Because the whole
 * design of this table is that a balance change keeps its REASON for ever, and
 * `adjustment` is the catch-all that corrections and one-off fixes land in.
 * Mixing "credits I gave away to win a chapter" into the same bucket as "I
 * fixed a mistake" makes the one commercial question these grants exist to
 * answer — what has this campaign cost, and did any of it convert — impossible
 * to ask in SQL later. One word now, or a forensic exercise in six months.
 *
 * DELIBERATELY NO UNIQUE INDEX, unlike `signup_grant` and `anon_grant` beside
 * it. Those are once-per-account by definition. A chapter grant is not: a
 * chapter that uses its 250 and comes back next semester should be topped up,
 * and that top-up is a second honest row rather than an edit of the first.
 * The protection against an accidental double-grant is therefore in the script
 * (`make-chapter-account.mjs` refuses unless `--topup` is passed), which is
 * weaker than an index and is the right trade here.
 *
 * Idempotent and safe to re-run. Changes no data.
 */

begin;

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
                   'adjustment',
                   'chapter_grant'
            )
        );

comment on column public.credit_ledger.reason is
    'Why the balance changed. anon_grant is the 2-credit welcome any account receives once; signup_grant is the 3 credits a real (non-anonymous) account receives once (04 entry 97); chapter_grant is credits given to a shared fraternity chapter account, which may be granted more than once as a top-up.';

commit;
