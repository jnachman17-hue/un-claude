/*
 * -------------------------------------------------------
 * The two new money tables are insert-only, like the ledger beside them
 * -------------------------------------------------------
 * Found 24 August 2026, right after the four migrations before this one were
 * applied, by probing the live database rather than by reading the files.
 *
 * WHAT WAS WRONG. `refund_shortfalls` and `run_costs` were each created with
 *
 *     grant select, insert on table ... to service_role;
 *
 * and that is NOT the same as granting only select and insert. Supabase sets
 * default privileges on the public schema that already hand `service_role`
 * everything on every new table, and a `grant` ADDS privileges — it never
 * narrows them. So both tables arrived fully writable and fully deletable.
 * Measured, with the credit ledger as the control:
 *
 *     credit_ledger      DELETE -> REFUSED: permission denied for table credit_ledger
 *     refund_shortfalls  DELETE -> ALLOWED
 *     run_costs          DELETE -> ALLOWED
 *
 * The ledger is refused because 20260819180000_credit_ledger.sql REVOKES first
 * and grants afterwards. These two never revoked.
 *
 * WHY IT MATTERS ENOUGH TO BE ITS OWN MIGRATION. `refund_shortfalls` exists for
 * one reason: so that money given back and never recovered can be COUNTED. A
 * record of losses that any code holding the service key can quietly erase is a
 * weaker record than the ledger sitting next to it, and it is weaker in exactly
 * the way that would go unnoticed — the number simply gets smaller. Supabase's
 * free plan takes no backups, so there is nothing to compare it against.
 *
 * `grant_claims` IS DELIBERATELY LEFT WRITABLE. It has to be: `claim_grant`
 * counts repeat attempts by updating a row, and removing a claim is a
 * legitimate thing a person might need to do — somebody who deleted their
 * account by mistake and wants their free credits back has no other remedy.
 *
 * Idempotent and safe to re-run. Changes no data.
 */

begin;

revoke all on table public.refund_shortfalls from authenticated, anon, service_role;
grant select, insert on table public.refund_shortfalls to service_role;

revoke all on table public.run_costs from authenticated, anon, service_role;
grant select, insert on table public.run_costs to service_role;

commit;
