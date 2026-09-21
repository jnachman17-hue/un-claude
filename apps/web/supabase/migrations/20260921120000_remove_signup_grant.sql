/*
 * -------------------------------------------------------
 * The signup grant is removed. Creating an account earns nothing.
 * -------------------------------------------------------
 * 04 entries 165 and 166, Jon's ruling of 21 September 2026, on the data in
 * docs/session-notes/pricing-investigation-21-sept.md.
 *
 * WHAT THE DATA SAID, in one paragraph. The buyers are essay people: five of
 * six have jobs of 2,000 to 7,500 words against a site median of 171. When
 * the essay did not fit in the free credits, 2 of 2 bought. When it fit, 9 of
 * 11 cleaned it free, ran exactly one job, and never returned. After signup
 * the allowance was 3 plus unspent guest credits, up to 5, which covers a
 * 5,000 word essay. The signup grant was the mechanism of the leak.
 *
 * AND THE EMAIL LIST IS RETIRED. Entry 165: Jon will not use it. The grant's
 * other purpose is gone with it. An account now exists for one reason, so
 * that purchased credits live somewhere a cleared cookie cannot reach.
 *
 * WHAT THIS DOES. Drops the two triggers that minted 3 credits on
 * confirmation, and the function behind them. Nothing else moves:
 *
 *   - `claim_grant` stays. The 2-credit welcome grant is still claimed
 *     through it, keyed to the inbox, for an account that signs up cold.
 *   - The `signup_grant` reason stays in the ledger's check constraint and in
 *     its partial unique index. 84 historic rows carry it and the ledger
 *     refuses UPDATE and DELETE by design. A reason nobody writes any more
 *     is harmless; a constraint that rejects existing rows is not.
 *   - `grant_claims` rows with reason `signup_grant` stay, for the same
 *     reason. They are history.
 *
 * THE APPLICATION SIDE IS ALREADY QUIET. `ensureGrants` in
 * lib/server/credits.ts no longer claims a signup grant, so a new account
 * gets 2 welcome credits on first use of the tool (cold signup) or its guest
 * remainder (conversion), and nothing on confirmation. UNTIL THIS MIGRATION
 * IS RUN the trigger still pays 3 to every new confirmed account, which is
 * generous rather than broken: the site's copy says two, the wallet says
 * five. Run it with the deploy, not after.
 *
 * Idempotent and safe to re-run.
 */

begin;

drop trigger if exists on_auth_user_granted on auth.users;
drop trigger if exists on_auth_user_granted_on_confirm on auth.users;
drop function if exists public.mint_signup_grant();

commit;
