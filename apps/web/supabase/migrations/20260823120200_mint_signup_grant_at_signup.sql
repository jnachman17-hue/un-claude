/*
 * -------------------------------------------------------
 * A new customer's first look at their wallet must not say "0 credits"
 * -------------------------------------------------------
 * f1-audit.md finding 0d. Measured live on a brand-new confirmed account that
 * had done nothing else:
 *
 *     GET /home  ->  "Your credits · 0 credits · About 0 words of sanitising.
 *                     Credits never expire. · Get credits"
 *     then GET /api/credits  ->  {"ok":true,"balance":5}
 *
 * THE CAUSE. The free credits are minted lazily, by `/api/credits`, which is
 * only called by the tool. `/home` reads the balance and never calls it. So the
 * sign-up page promises 3 free credits, the first page after confirming the
 * email says 0 and offers a "Get credits" button, and later, if the customer
 * finds the tool, it becomes 5. Three different numbers about their money in
 * the first two minutes, and the middle one is the one that asks them to pay.
 *
 * THE FIX. Mint the signup grant when the account is created, in the database,
 * so it is there before any page can be looked at. `/home` reads the balance
 * with the customer's own client and needs no change.
 *
 * ---------------------------------------------------------------------------
 * WHY ONLY THE SIGNUP GRANT AND NOT THE WELCOME GRANT TOO, because the wallet
 * still moves from 3 to 5 on first use and that is a deliberate choice.
 *
 * The welcome grant is withheld from an account that is CONTINUING A GUEST
 * SESSION, because the guest account was already paid it and its leftover moves
 * across. Whether this is such a conversion is not knowable at the moment the
 * account is created — the browser's guest cookie is what says so, and no
 * database trigger can see a cookie. Minting the welcome grant here would pay
 * it to converting accounts as well, which is the 7-credits-against-a-ratified-5
 * defect that guest-merge-double-runs.md exists to record.
 *
 * So: 3 at signup, which is exactly the number the sign-up page promises, and
 * the welcome 2 when the tool is first used and a conversion can be told from a
 * cold signup. "0 credits · Get credits" never appears.
 * ---------------------------------------------------------------------------
 *
 * REQUIRES 20260823120100_grant_claims_survive_deletion.sql, which defines
 * `claim_grant`. Apply that one first.
 *
 * Idempotent and safe to re-run.
 */

begin;

create or replace function public.mint_signup_grant()
    returns trigger
    language plpgsql
    security definer
    set search_path = ''
as
$$
begin
    -- An anonymous browser account has no address. Its welcome grant stays
    -- where it is, capped per-IP and gated by Turnstile.
    if new.email is null then
        return new;
    end if;

    -- Not confirmed yet, so this is not a signup that has happened. Waiting for
    -- confirmation is also what stops someone burning a stranger's free credits
    -- by registering their address and never opening the email.
    if new.email_confirmed_at is null then
        return new;
    end if;

    -- On UPDATE, only the moment confirmation ARRIVES, not every later change.
    if tg_op = 'UPDATE' and old.email_confirmed_at is not null then
        return new;
    end if;

    -- Already paid on this account. Without this, changing your email address
    -- later would consume the new inbox's claim without paying anything for it.
    if exists (select 1
               from public.credit_ledger l
               where l.account_id = new.id
                 and l.reason = 'signup_grant') then
        return new;
    end if;

    /*
     * WRAPPED, BECAUSE NOTHING HERE MAY EVER STOP SOMEBODY SIGNING UP. This
     * trigger runs inside the transaction that creates the user; an exception
     * escaping it would fail the registration itself. A grant that does not
     * land here is not lost — `ensureGrants` pays it on the customer's first
     * request exactly as it does today. A registration that fails is lost.
     */
    begin
        /*
         * 3 MUST MATCH `SIGNUP_CREDITS` IN lib/server/credits.ts. It is written
         * out rather than read from anywhere because a database trigger has
         * nowhere to read it from. If the two ever disagree, THIS ONE WINS for
         * every new account, because it runs first.
         */
        perform public.claim_grant(new.id, new.email, 'signup_grant', 3);
    exception
        when others then
            raise warning 'signup grant not minted for % : %', new.id, sqlerrm;
    end;

    return new;
end;
$$;

comment on function public.mint_signup_grant is
    'Pay the signup grant when an account is confirmed, so a new customer''s wallet never reads "0 credits". f1-audit.md finding 0d. Never raises: a failure here must not block a registration.';

/*
 * TWO TRIGGERS, BECAUSE CONFIRMATION ARRIVES TWO WAYS. A password signup
 * inserts the row unconfirmed and confirms it later by UPDATE. A Google signin,
 * and an admin-created account, arrive already confirmed on the INSERT.
 *
 * THE NAME MATTERS. Postgres fires triggers on the same table and event in
 * ALPHABETICAL ORDER, and `on_auth_user_created` — which creates the
 * public.accounts row this grant's foreign key points at — must go first.
 * "created" sorts before "granted". Renaming either one breaks that.
 */
drop trigger if exists on_auth_user_granted on auth.users;
create trigger on_auth_user_granted
    after insert
    on auth.users
    for each row
execute function public.mint_signup_grant();

drop trigger if exists on_auth_user_granted_on_confirm on auth.users;
create trigger on_auth_user_granted_on_confirm
    after update of email_confirmed_at
    on auth.users
    for each row
execute function public.mint_signup_grant();

commit;
