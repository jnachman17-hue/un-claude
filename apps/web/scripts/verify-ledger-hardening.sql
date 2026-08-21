-- ============================================================================
-- verify-ledger-hardening.sql
--
-- Proof harness for the database security fixes (security-audit.md findings
-- 4, 5, 7 and the finding-1 email dedupe). Run it in the Supabase SQL editor.
--
-- It is in TWO parts:
--   PART A — run this BEFORE applying the migrations, to SEE the finding-5
--            credit_balance leak as it exists today.
--   PART B — run this AFTER applying the four migrations, to prove every fix.
--            It wraps everything in BEGIN … ROLLBACK, creates only throwaway
--            "verify-*" rows, and undoes itself. It changes NO real data.
--
-- Read the NOTICE lines it prints; each is PASS or FAIL.
-- ============================================================================


-- ============================================================================
-- PART A  (run BEFORE the migrations)  —  the finding-5 leak, live
-- ----------------------------------------------------------------------------
-- A signed-in user asks for SOME OTHER account's balance. Today this returns a
-- number instead of "permission denied": that is the leak. Paste a real account
-- id from the credit_ledger to see an actual balance come back; any uuid at all
-- proves the function is callable by `authenticated` with an arbitrary target.
-- Read-only and rolled back.
-- ============================================================================
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-0000000000aa","role":"authenticated"}';
select public.credit_balance('00000000-0000-4000-8000-0000000000bb'::uuid) as leaked_balance_for_another_account;
rollback;


-- ============================================================================
-- PART A2  —  the account-deletion chain, read-only, run any time
-- ----------------------------------------------------------------------------
-- This answers a question the security-fixes note raises: does deleting a user
-- actually remove their ledger rows? It lists every foreign key pointing INTO
-- public.accounts and public.credit_ledger, with its delete rule.
--
-- EXPECTED, and the point of the check:
--   credit_ledger.account_id -> accounts.id      delete_rule = CASCADE   (present)
--   accounts.id              -> auth.users.id    ** expected to be ABSENT **
-- If the second row is absent, deleting an auth user leaves the accounts row
-- and the whole ledger behind, and the privacy promise is not being kept.
-- ============================================================================
select
    con.conname                                as constraint_name,
    src.relname                                as child_table,
    tgt_ns.nspname || '.' || tgt.relname       as parent_table,
    case con.confdeltype
        when 'a' then 'NO ACTION' when 'r' then 'RESTRICT'
        when 'c' then 'CASCADE'   when 'n' then 'SET NULL'
        when 'd' then 'SET DEFAULT' end        as delete_rule
from pg_constraint con
         join pg_class src on src.oid = con.conrelid
         join pg_class tgt on tgt.oid = con.confrelid
         join pg_namespace tgt_ns on tgt_ns.oid = tgt.relnamespace
where con.contype = 'f'
  and (src.relname in ('accounts', 'credit_ledger')
    or tgt.relname in ('accounts', 'credit_ledger'))
order by child_table, constraint_name;


-- ============================================================================
-- PART B  (run AFTER applying all four migrations)  —  prove every fix
-- ============================================================================
begin;

-- ---- throwaway fixtures (all rolled back) ----------------------------------
insert into public.accounts (id, name, email) values
  ('a11c0000-0000-4000-8000-000000000001', 'verify-A', 'verify-a+tag@gmail.com'),
  ('a11c0000-0000-4000-8000-000000000002', 'verify-B', 'verify-b@example.com');

insert into public.credit_ledger (account_id, delta, reason) values
  ('a11c0000-0000-4000-8000-000000000001', 2, 'anon_grant'),
  ('a11c0000-0000-4000-8000-000000000001', 3, 'signup_grant'),
  ('a11c0000-0000-4000-8000-000000000002', 2, 'anon_grant');

-- ---- 1. append-only: UPDATE is refused ------------------------------------
do $$
begin
  begin
    update public.credit_ledger set delta = 999
      where account_id = 'a11c0000-0000-4000-8000-000000000002';
    raise notice '1 UPDATE:    FAIL - update was allowed';
  exception when others then
    raise notice '1 UPDATE:    PASS - refused: %', sqlerrm;
  end;
end $$;

-- ---- 2. append-only: a DIRECT delete is refused ---------------------------
do $$
begin
  begin
    delete from public.credit_ledger
      where account_id = 'a11c0000-0000-4000-8000-000000000002';
    raise notice '2 DELETE:    FAIL - direct delete was allowed';
  exception when others then
    raise notice '2 DELETE:    PASS - refused: %', sqlerrm;
  end;
end $$;

-- ---- 3. append-only: TRUNCATE is refused ----------------------------------
do $$
begin
  begin
    truncate public.credit_ledger;
    raise notice '3 TRUNCATE:  FAIL - truncate was allowed';
  exception when others then
    raise notice '3 TRUNCATE:  PASS - refused: %', sqlerrm;
  end;
end $$;

-- ---- 4. the account-deletion CASCADE is still ALLOWED ---------------------
do $$
declare before_n int; after_n int;
begin
  select count(*) into before_n from public.credit_ledger
    where account_id = 'a11c0000-0000-4000-8000-000000000001';
  delete from public.accounts where id = 'a11c0000-0000-4000-8000-000000000001';
  select count(*) into after_n from public.credit_ledger
    where account_id = 'a11c0000-0000-4000-8000-000000000001';
  if before_n > 0 and after_n = 0 then
    raise notice '4 CASCADE:   PASS - deleting the account cascaded away all % ledger rows.', before_n;
  else
    raise notice '4 CASCADE:   FAIL - before=% after=% (rows survived the cascade)', before_n, after_n;
  end if;
end $$;

-- ---- 5. credit_balance: a signed-in user reads OWN only -------------------
do $$
declare own int;
begin
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"a11c0000-0000-4000-8000-000000000002","role":"authenticated"}';

  select public.credit_balance() into own;
  raise notice '5a SELF:     % - own balance via credit_balance() = % (expect 2)',
    case when own = 2 then 'PASS' else 'CHECK' end, own;

  begin
    perform public.credit_balance('a11c0000-0000-4000-8000-000000000099'::uuid);
    raise notice '5b LEAK:     FAIL - authenticated could still call credit_balance(uuid)';
  exception when others then
    raise notice '5b LEAK:     PASS - credit_balance(uuid) refused for authenticated: %', sqlerrm;
  end;

  reset role;
end $$;

-- ---- 6. rate_limit_hit: first N allowed, then refused ---------------------
do $$
declare i int; allowed boolean; first_block int := 0;
begin
  for i in 1..7 loop
    select public.rate_limit_hit('verify:rate:test', 5, 60) into allowed;
    if not allowed and first_block = 0 then first_block := i; end if;
  end loop;
  if first_block = 6 then
    raise notice '6 RATELIMIT: PASS - calls 1-5 allowed, call 6 refused (limit 5).';
  else
    raise notice '6 RATELIMIT: CHECK - first refusal at call % (expected 6).', first_block;
  end if;
end $$;

-- ---- 7. signup grant is once-per-INBOX (email dedupe) ---------------------
do $$
begin
  insert into public.accounts (id, name, email) values
    ('a11c0000-0000-4000-8000-000000000003', 'verify-C', 'verify-c@example.com'),
    ('a11c0000-0000-4000-8000-000000000004', 'verify-D', 'verify-d@example.com');

  insert into public.credit_ledger (account_id, delta, reason, grant_email)
    values ('a11c0000-0000-4000-8000-000000000003', 3, 'signup_grant', 'shared@gmail.com');

  begin
    insert into public.credit_ledger (account_id, delta, reason, grant_email)
      values ('a11c0000-0000-4000-8000-000000000004', 3, 'signup_grant', 'shared@gmail.com');
    raise notice '7 EMAILDEDUPE: FAIL - a second signup grant for the same inbox was allowed';
  exception when unique_violation then
    raise notice '7 EMAILDEDUPE: PASS - second signup grant for the same inbox refused.';
  end;
end $$;

rollback;
-- Nothing above is committed. Run the real migrations separately to apply them.
