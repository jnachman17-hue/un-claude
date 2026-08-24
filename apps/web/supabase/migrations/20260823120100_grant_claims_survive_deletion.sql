/*
 * -------------------------------------------------------
 * Free credits are handed to an INBOX once, and deleting the account does not
 * hand them out again
 * -------------------------------------------------------
 * f1-audit.md finding 0c. Reproduced on the live database on 23 August 2026 by
 * scripts/verify-grants-survive-deletion.mjs: three rounds of delete-and-
 * re-register on one address collected 5 credits every time, 15 in total, and
 * nothing anywhere counted it.
 *
 * THE HOLE, and it is a shape worth remembering. There already IS a guard
 * against one inbox collecting the signup grant twice —
 * 20260821120300_signup_grant_email_dedupe.sql — and it works by looking for an
 * existing grant row ON THE CREDIT LEDGER. Deleting an account cascades its
 * ledger rows away. So THE GUARD IS DELETED ALONG WITH THE THING IT WAS
 * GUARDING AGAINST, and the product ships a "Delete your Account" button on the
 * settings page. No tools are needed: delete, sign up again, collect five more.
 *
 * THE FIX. Keep the record somewhere the deletion cascade cannot reach, and
 * keep it as a HASH rather than an address, so nothing that identifies a person
 * survives their deletion.
 *
 * WHAT IS ACTUALLY RETAINED AFTER A DELETION, stated plainly because it is a
 * change to what this product keeps and the privacy policy has to agree with
 * it: a 64-character SHA-256 fingerprint of the normalised address, the reason
 * it was granted, the date, and a count of how many times that inbox has since
 * asked again. THE ADDRESS ITSELF IS NOT STORED and cannot be recovered from
 * the fingerprint — but a fingerprint can be CHECKED against a guess, so this
 * is not the same as storing nothing. It carries no name, no account id, no
 * balance and no history. THE PRIVACY PAGE NEEDS A SENTENCE ABOUT IT; that is
 * Jon's copy to write, not this migration's.
 *
 * BOTH FREE GRANTS ARE COVERED, NOT ONLY THE SIGNUP ONE. The audit named the
 * 3-credit signup grant, but a real account also receives the 2-credit welcome
 * grant with no per-network cap, so keying only the signup grant would have
 * left 2 credits per re-registration mintable without limit. An ANONYMOUS
 * browser account is untouched by this: it has no address to key on, and its
 * welcome grant stays capped per-IP and gated by Turnstile exactly as before.
 *
 * WHAT IT COSTS A HONEST PERSON. Someone who deletes their account by mistake
 * and registers again gets no second helping of free credits. That is the
 * intended behaviour and the audit asked for it.
 *
 * Idempotent and safe to re-run.
 */

begin;

-- ---------------------------------------------------------------------------
-- 1. The record that outlives the account.
-- ---------------------------------------------------------------------------
/*
 * NO account_id AND NO FOREIGN KEY, DELIBERATELY. Every link this table could
 * have to an account is a link the deletion cascade would follow, and following
 * it is the bug. It holds a fingerprint and nothing else.
 */
create table if not exists
    public.grant_claims
(
    -- SHA-256 of the normalised address, hex. See public.email_grant_hash.
    email_hash       text                     not null,

    -- Which free grant this inbox has already had.
    reason           varchar(32)              not null check (reason in ('anon_grant', 'signup_grant')),

    first_granted_at timestamp with time zone not null default now(),

    -- How many times this inbox has asked again since. A number Jon can read to
    -- see whether anyone is actually farming, rather than guessing.
    repeat_attempts  integer                  not null default 0,

    primary key (email_hash, reason)
);

comment on table public.grant_claims is
    'One row per email inbox per free grant, holding an irreversible fingerprint of the address rather than the address. Deliberately NOT linked to accounts, so deleting an account does not delete the record that stops the grant being collected again. f1-audit.md finding 0c.';
comment on column public.grant_claims.email_hash is
    'SHA-256 of the normalised address. The address itself is never stored and cannot be read back out of this.';
comment on column public.grant_claims.repeat_attempts is
    'How many times this inbox has asked for this grant again after already having it.';

alter table public.grant_claims
    enable row level security;

-- No policy for anyone but the server. A browser has no business reading this.
revoke all on public.grant_claims from authenticated, anon;
grant select, insert, update, delete on table public.grant_claims to service_role;

-- ---------------------------------------------------------------------------
-- 2. One definition of "the same inbox", used by everything.
-- ---------------------------------------------------------------------------
/*
 * THIS MIRRORS `normalizeEmail` IN lib/server/credits.ts, and it lives here so
 * that the database trigger added by the next migration and the application
 * code agree without either of them re-implementing it.
 *
 *   lower-cased; everything from the first `+` in the local part dropped, so
 *   student+1@ and student+2@ are one inbox; and for Gmail only, dots removed
 *   and googlemail.com folded to gmail.com, because Gmail ignores both. Dots
 *   are NOT stripped elsewhere, where they can distinguish real inboxes.
 *
 * Returns null for anything unusable, which every caller reads as "no inbox to
 * key on" — which is what an anonymous account has.
 */
create or replace function public.normalize_email(raw text)
    returns text
    language plpgsql
    immutable
    set search_path = ''
as
$$
declare
    trimmed text;
    at      integer;
    local   text;
    domain  text;
    plus    integer;
begin
    if raw is null then
        return null;
    end if;

    trimmed := lower(btrim(raw));

    if position('@' in trimmed) = 0 then
        return null;
    end if;

    -- The LAST '@', matching the application's lastIndexOf.
    at := length(trimmed) - position('@' in reverse(trimmed)) + 1;

    if at <= 1 or at = length(trimmed) then
        return null;
    end if;

    local := substring(trimmed from 1 for at - 1);
    domain := substring(trimmed from at + 1);

    plus := position('+' in local);

    if plus > 0 then
        local := substring(local from 1 for plus - 1);
    end if;

    if domain in ('gmail.com', 'googlemail.com') then
        local := replace(local, '.', '');
        domain := 'gmail.com';
    end if;

    if local = '' then
        return null;
    end if;

    return local || '@' || domain;
end;
$$;

comment on function public.normalize_email is
    'Reduce an email address to the inbox it actually reaches: lower-cased, +tag dropped, Gmail dots removed. Mirrors normalizeEmail in lib/server/credits.ts. Null means there is no usable inbox.';

/*
 * The fingerprint. SHA-256 is a Postgres built-in (no extension needed).
 *
 * THE PREFIX IS PART OF THE INPUT so that this fingerprint cannot be compared
 * against a hash of the same address computed anywhere else in the world. The
 * version number in it is there so the scheme can be changed later without
 * silently mixing two generations of fingerprint in one column.
 */
create or replace function public.email_grant_hash(raw text)
    returns text
    language sql
    immutable
    set search_path = ''
as
$$
select case
           when public.normalize_email(raw) is null then null
           else encode(
                   sha256(convert_to('un-claude:grant:v1:' || public.normalize_email(raw), 'UTF8')),
                   'hex')
           end;
$$;

comment on function public.email_grant_hash is
    'An irreversible fingerprint of the inbox an address reaches, for grant_claims. Salted with a fixed application prefix so it matches no hash computed elsewhere.';

grant execute on function public.normalize_email(text) to service_role;
grant execute on function public.email_grant_hash(text) to service_role;
revoke execute on function public.normalize_email(text) from public, authenticated, anon;
revoke execute on function public.email_grant_hash(text) from public, authenticated, anon;

-- ---------------------------------------------------------------------------
-- 3. Claim a free grant for an inbox, exactly once, ever.
-- ---------------------------------------------------------------------------
/*
 * WHY THIS IS ONE FUNCTION AND NOT TWO STATEMENTS IN TYPESCRIPT. "Mark it, then
 * pay it" done from the application is two round trips with a gap in the
 * middle, and a failure in that gap either pays twice or marks a grant that was
 * never paid. Here they are one transaction: the mark and the payment stand or
 * fall together.
 *
 * Returns true when THIS call is the one that paid the credits, so the caller
 * can tell a first signup from a repeat.
 */
create or replace function public.claim_grant(
    target_account uuid,
    raw_email text,
    grant_reason varchar,
    credits integer
) returns boolean
    language plpgsql
    security definer
    set search_path = ''
as
$$
declare
    hashed  text;
    written integer;
begin
    if target_account is null then
        return false;
    end if;

    if credits is null or credits <= 0 then
        raise exception 'claim_grant: credits must be positive, got %', credits;
    end if;

    if grant_reason not in ('anon_grant', 'signup_grant') then
        raise exception 'claim_grant: % is not a free grant', grant_reason;
    end if;

    hashed := public.email_grant_hash(raw_email);

    if hashed is null then
        /*
         * No usable address. That is an ANONYMOUS browser account, which has
         * no inbox to key on and is deliberately still allowed its welcome
         * grant — the per-account unique index is the only guard it has, and
         * the per-IP cap in the application is the other half.
         */
        insert into public.credit_ledger (account_id, delta, reason)
        values (target_account, credits, grant_reason)
        on conflict do nothing;

        get diagnostics written = row_count;

        return written > 0;
    end if;

    insert into public.grant_claims (email_hash, reason)
    values (hashed, grant_reason)
    on conflict (email_hash, reason) do nothing;

    get diagnostics written = row_count;

    if written = 0 then
        -- This inbox has had this grant before, on this account or on one that
        -- has since been deleted. Count the attempt and pay nothing.
        update public.grant_claims
        set repeat_attempts = repeat_attempts + 1
        where email_hash = hashed
          and reason = grant_reason;

        return false;
    end if;

    /*
     * `grant_email` is still written on the signup grant. It is the older,
     * ledger-side guard from 20260821120300, it is deleted with the account
     * exactly as the privacy policy says, and it costs nothing to keep as a
     * second layer while the account exists.
     */
    insert into public.credit_ledger (account_id, delta, reason, grant_email)
    values (target_account, credits, grant_reason,
            case when grant_reason = 'signup_grant' then public.normalize_email(raw_email) end)
    on conflict do nothing;

    get diagnostics written = row_count;

    return written > 0;
end;
$$;

comment on function public.claim_grant is
    'Pay a free grant to an account once per email inbox, ever, recording the claim in grant_claims where account deletion cannot reach it. Returns true only when this call paid the credits. f1-audit.md finding 0c.';

revoke execute on function public.claim_grant(uuid, text, varchar, integer) from public, authenticated, anon;
grant execute on function public.claim_grant(uuid, text, varchar, integer) to service_role;

-- ---------------------------------------------------------------------------
-- 4. Everyone who has already been paid, recorded before the door closes.
-- ---------------------------------------------------------------------------
/*
 * WITHOUT THIS, EVERY EXISTING ACCOUNT GETS ONE FREE PASS. Their claim row does
 * not exist yet, so the first thing any of them could do after this lands is
 * delete and re-register for another five credits. This reads the grants
 * already on the ledger and writes their fingerprints, so the door is shut for
 * accounts that exist today as well as for ones created tomorrow.
 *
 * It keys off the account's own address rather than the ledger's `grant_email`,
 * because rows written before 20260821120300 have no grant_email at all.
 */
insert into public.grant_claims (email_hash, reason, first_granted_at)
select public.email_grant_hash(a.email),
       l.reason,
       min(l.created_at)
from public.credit_ledger l
         join public.accounts a on a.id = l.account_id
where l.reason in ('anon_grant', 'signup_grant')
  and a.email is not null
  and public.email_grant_hash(a.email) is not null
group by public.email_grant_hash(a.email), l.reason
on conflict (email_hash, reason) do nothing;

commit;
