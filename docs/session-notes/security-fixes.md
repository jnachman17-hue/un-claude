# Security fixes — 21 August 2026

Implementing the fixes from `security-audit.md`. Backend and database only.
Frontend (marketing, components, auth pages) is owned by another live session
and was not touched; anything needing a frontend change is handed off at the
bottom.

**Verification standard (CLAUDE.md §4):** for each fix, the exploit is shown
working BEFORE and failing AFTER, with real pasted output — not a description.
Where something can't be tested safely against production, that is said plainly
and it's tested locally instead.

**Migrations (CLAUDE.md, task brief):** I do NOT apply migrations. Every
migration below is written into `apps/web/supabase/migrations/` and the exact
SQL to paste is collected in the final section for Jon to run in the Supabase
SQL editor. Nothing downstream of an unapplied migration is "done" — those
items are marked PENDING JON.

---

## 1. PNG decompression bomb — FIXED (code + tests, no migration)

**File:** `apps/web/engine/image_meta.py`. **Risk:** highest — free, no-login,
anonymous, repeatable, reachable through `/api/tool/scan`.

**What was wrong.** The zTXt and iTXt branches of `_png_text_entries` called
`zlib.decompress()` with no size limit. PNG text chunks store their value
zlib-compressed, and deflate reaches ~1000:1 on repetitive data, so a small
crafted chunk expands to gigabytes — exhausting the function's 1 GB memory or
burning its time limit, for anyone, at zero cost.

**The fix.** A new `_bounded_inflate()` helper streams the output and stops the
instant the running total would cross a 4 MB cap (`MAX_PNG_TEXT_DECOMPRESSED_BYTES`),
raising `zlib.error` — which every caller already caught and treats as
"undecodable, skip it." This is the same discipline `container_meta.py` already
applies to `.docx` zips: bound the bytes actually produced, never trust the
stream's claim about its size. 4 MB is generous for any legitimate embedded
caption or software tag (which are kilobytes); a real photo never carries
megabytes of text metadata.

### BEFORE (unbounded — current `main` behaviour, run against the real code)

A **199 KB** zTXt chunk (far under the 5 MB upload cap) aimed at 200 MB:

```
decompressed size the attacker aims for: 200 MB
compressed zTXt data (what actually ships in the file): 199.1 KB
total chunk payload on disk: 199.1 KB
BEFORE FIX: decompressed to 200 MB of text in 255 ms
BEFORE FIX: peak Python heap during the call: 438 MB
```

A single 199 KB file drove 438 MB of heap. At ~1000:1, a payload of a few MB
(still under the 5 MB cap) aims straight past the 1 GB function limit.

### AFTER (bounded — the fix)

```
=== AFTER FIX ===

zTXt bomb (199 KB chunk aiming at 200 MB):
   entries returned: 0  decompressed text kept: 0 bytes
   peak heap during call: 8.6 MB   time: 3 ms

iTXt bomb (199 KB chunk aiming at 200 MB):
   entries returned: 0  decompressed text kept: 0 bytes
   peak heap during call: 8.6 MB   time: 1 ms

Bigger bomb: 1.99 MB chunk aiming at 2 GB:
   entries returned: 0  peak heap: 16.0 MB  time: 3 ms

Legit compressed zTXt ('Software' = 'ChatGPT / DALL-E 3'):
   entries: [('Software', 'ChatGPT / DALL-E 3')]

Value just under the 4 MB cap: entries=1, kept=4194294 bytes (expected 4194294)
```

Peak heap for the bomb drops from **438 MB to 8.6 MB**; legitimate metadata
still decodes; a value just under the cap still decodes in full.

### End-to-end through the real scan/clean entry points

A valid 1×1 PNG with a bomb chunk that aims at 300 MB:

```
Crafted PNG total size: 299 KB  (bomb chunk aims at 300 MB)
inspect_png -> c2pa=False ai=False findings=[]
peak heap: 9.2 MB   time: 10 ms

strip_png -> ['drop chunk zTXt']
cleaned file size: 69 bytes, ran in 0 ms
```

### Standing tests

Added to `engine/tests/test_security_hardening.py`, mirroring the existing
zip-bomb tests, all passing:

```
test_bounded_inflate_refuses_the_bomb PASSED
test_bounded_inflate_allows_legitimate_metadata PASSED
test_bounded_inflate_keeps_value_just_under_the_cap PASSED
test_bounded_inflate_charges_real_bytes_not_the_stream_claim PASSED
test_png_text_entries_drops_a_ztxt_bomb_without_expanding_it PASSED
test_png_text_entries_drops_an_itxt_bomb_without_expanding_it PASSED
test_inspect_png_survives_a_bomb_chunk_in_a_real_png PASSED
test_strip_png_cleans_a_bomb_chunk_without_decompressing_it PASSED
```

Full `test_security_hardening.py` suite: 32 passed. No regression in the
image suites (`test_image_formats_bmp_gif_tiff`, `test_avif_heic`,
`test_clean_image`, `test_binary_guard`) — all green.

Committed as `854e7db`. **No migration needed — this one is live the moment
the code deploys.**

---

## 2. The credit ledger — HARDENED (1 migration PENDING JON + 1 script live)

Priority raised because Jon stays on Supabase's free plan: **zero backups, no
restore**. With no safety net, making corruption unlikely is the only
protection the ledger has.

### 2a. Audit of everything that writes to credit_ledger — CLEAN

Every writer, read directly:

| Writer | Operation | Verdict |
|---|---|---|
| `grantOnce` (`credits.ts`) | `insert` | append-only, idempotent by unique index |
| `refund` (`credits.ts`) | `insert` | append-only |
| `mergeGuestInto` (`credits.ts`) | two `insert`s | append-only (transfer out + in) |
| `spend_credits` (RPC) | `insert` | append-only, locks the account row first |

**No UPDATE and no DELETE exists anywhere in the codebase.** Confirmed by
searching every `.ts`/`.sql`/`.py` file. The model is already right: a balance
is never stored, only summed, so there is no number for a bug to set wrongly.

Corroborated against the **live** table (via the new backup script):

```
distinct accounts: 7
rows by reason: { anon_grant: 7, spend: 10, signup_grant: 1, operation_refund: 3 }
```

All 21 rows are appends. Nothing has been mutated in production.

### 2b. Append-only enforced by the database — MIGRATION PENDING JON

`20260821120000_credit_ledger_append_only.sql`. Today append-only rests on a
single `revoke`/`grant` pair; a future migration writing "grant all to
service_role" would silently undo it. This trigger makes the database itself
refuse **UPDATE, TRUNCATE, and any direct DELETE** — whoever asks, including
the table owner, regardless of later grants.

**How it still allows account deletion.** It distinguishes the two DELETEs by a
fact only true during a cascade: the parent `accounts` row is *already gone* by
the time the cascade reaches the child (the FK cascade runs as an after-delete
action on `accounts`). Parent still present ⇒ direct delete ⇒ refuse. Parent
already gone ⇒ cascade ⇒ allow. `account_id` is NOT NULL and FK-backed, so an
orphan ledger row cannot exist to confuse the test.

### 2c. THE BRIEF'S PREMISE ABOUT DELETION IS WRONG — verified, not assumed

The brief said *"deleting an account currently cascades the ledger away, and
that behaviour is relied on and documented in the privacy policy."* I was told
to verify rather than assume. **It does not, and the privacy policy says the
opposite.**

- `credit_ledger.account_id → accounts.id ON DELETE CASCADE` **exists**
  (confirmed live via the PostgREST schema: `FK -> <fk table='accounts' column='id'/>`).
- `public.accounts.id` has **no foreign key to `auth.users`** — confirmed in
  `20241219010757_schema.sql` (only `created_by`/`updated_by` reference
  `auth.users`), and confirmed **live**:

```
public.accounts rows : 15
auth.users rows      : 14
accounts with NO matching auth.user (orphans): 1
auth.users with NO matching account          : 0
  -> orphans exist, so deleting an auth user does NOT remove its accounts row
```

`delete-personal-account.service.ts` only calls `auth.admin.deleteUser()`, so
deleting an account removes the sign-in and leaves the account row *and the
ledger* standing. The privacy policy already documents this honestly — a prior
session found the same thing and wrote it into the page.

**Consequence for my work: nothing is broken by the trigger.** The cascade it
must not break is `accounts → credit_ledger`, which is real and is preserved.
Because nothing legitimately deletes ledger rows today, the trigger blocks all
deletes today, which is the intended state; when the deletion chain is fixed,
the cascade will fire and the trigger allows it.

### 2d. Can spend_credits / direct writes be bypassed by a browser token?

Tested live against the real project with browser-grade tokens only. Every
attempted write used a non-existent account id, so it could not have corrupted
anything even had it succeeded.

```
target: https://itdgggoxsoolbfiwujvt.supabase.co

=== role: anon (the unauthenticated browser) ===
  select credit_ledger: BLOCKED -> [42501] permission denied for schema public
  insert credit_ledger: BLOCKED -> [42501] permission denied for schema public
  rpc spend_credits: BLOCKED -> [42501] permission denied for schema public
  rpc credit_balance(uuid): BLOCKED -> [42501] permission denied for schema public
```

The unauthenticated browser cannot reach the ledger at all — refused at the
schema level, before any policy is consulted.

**PARTIALLY VERIFIED, and this is a real limit I could not get past.** The
`authenticated`-role half could not be tested from here, because minting a
token requires creating a session and Turnstile refuses one headlessly:

```
=== attempting an anonymous session (a real browser-held authenticated token) ===
  signInAnonymously: FAILED -> [captcha_failed] captcha protection: request disallowed (no captcha_token found)
```

(That output independently confirms the brief's correction: Turnstile really is
enforced, on anonymous sign-in as well as signup.) I did not create an account
to get around it — creating accounts and solving captchas are both off-limits.
So the `authenticated`-role checks are covered by the SQL harness in 2e instead,
which Jon runs. **Until he runs it, "authenticated cannot write to the ledger"
rests on reading the grants, not on an executed test.**

### 2e. Proof harness — `apps/web/scripts/verify-ledger-hardening.sql`

Because there is no Postgres, Docker, or Supabase CLI on this machine, and
installing one needs Jon's approval (CLAUDE.md §5), **I could not execute any
migration or trigger.** Instead of asserting they work, there is a harness that
proves it. It runs inside `BEGIN … ROLLBACK`, creates only throwaway `verify-*`
rows, and **changes no real data**. It prints PASS/FAIL for:

1. UPDATE refused · 2. direct DELETE refused · 3. TRUNCATE refused ·
4. the account cascade still works · 5. `credit_balance()` self-only and
`credit_balance(uuid)` refused for `authenticated` · 6. the rate limiter allows
N then refuses · 7. a second signup grant for the same inbox refused.

It also has a read-only PART A (see the finding-5 leak *before* the fix) and a
PART A2 listing every FK into the two tables with its delete rule.

### 2f. Free stopgap backup — `apps/web/scripts/backup-credit-ledger.mjs` — DONE

Dependency-free by design: Node built-ins only (`fetch`, `fs`), no npm install,
no new service. Dumps the whole table to a timestamped CSV.

**Run it (from `apps/web`):**

```
node scripts/backup-credit-ledger.mjs
```

**Verified by running it against the live database:**

```
backup-credit-ledger: wrote 21 rows to credit-ledger-backups/credit_ledger_2026-08-21T08-56-41-692Z.csv
id,account_id,delta,reason,stripe_event_id,stripe_payment_intent_id,price_cents,endpoint,input_kind,words_in,model_calls,retries,total_tokens,cost_usd,seconds,layer_b,created_at
total data rows: 21
```

To schedule daily at 03:00: `0 3 * * * cd /path/to/apps/web && /usr/bin/node scripts/backup-credit-ledger.mjs`
It exits non-zero on failure so a broken backup is visible rather than silent.
**Not a substitute for real backups — better than the nothing the free plan gives.**

---

## 3. Rate limiting — BUILT (code live, 1 migration PENDING JON)

**No new dependency and no new service**, as required. The counting happens in
Postgres, which we already have: `20260821120200_rate_limits.sql` adds a
`rate_limits` table and a `rate_limit_hit(key, limit, window_seconds)` function
(a fixed-window counter, atomic — the insert-or-increment happens under a row
lock, so two racing requests cannot both slip past). Plus a
`rate_limits_prune()` housekeeping function so the table cannot grow forever.
Both are `service_role` only; nothing reaches the table directly.

`apps/web/lib/server/rate-limit.ts` is the helper the routes call.

The audit's numbers, applied:

| Limit | Key | Where |
|---|---|---|
| 20 / minute | **per IP** | `/api/tool/scan` |
| 10 / minute | **per account** | `/api/tool/clean` |
| 60 / hour | **per IP** | new anonymous welcome grants (see §5) |

**IT FAILS OPEN, deliberately.** If the limiter itself errors — the migration
is not applied yet, the service key is missing, the database blinks — the
request is **allowed** and the error is logged. A rate limiter is a backstop
against abuse; it must never be the thing that takes the free tool down for
everyone. This also means **deploying this code before running the migration is
safe**: the RPC is missing, every call fails open, behaviour is exactly today's.

**Handoff, not done:** `proxy.ts` still excludes `/api/*` from the middleware,
so limits are applied per-route rather than site-wide. That is unchanged by
design — editing `proxy.ts` was outside what this work needed, and per-route is
where the account-aware keys have to live anyway. Any future `/api/` route must
add its own limit; there is no site-wide net.

---

## 4. The credit_balance RPC leak — CLOSED (migration PENDING JON)

`20260821120100_credit_balance_self_only.sql`.

**Callers checked before changing the signature, as instructed:**

- `apps/web/app/home/page.tsx` → `rpc('credit_balance')`, **no argument**, on
  the user's own session.
- `apps/web/lib/server/credits.ts` `getBalance()` → `rpc('credit_balance', {target_account})`
  through the **admin (service_role)** client.
- Nothing else calls it.

So the audit's cleaner option fits both callers exactly. Split by arity:

- `credit_balance()` — granted to `authenticated`; always resolves to
  `auth.uid()`. **No argument to abuse.** Serves the home page unchanged.
- `credit_balance(uuid)` — `service_role` only, execute revoked from
  `authenticated` and `public`. Serves `getBalance()` unchanged.

The `default null` is **removed** from the uuid form so the two can never be
ambiguous to PostgREST: a no-arg call binds to `credit_balance()`, a one-arg
call to `credit_balance(uuid)`.

**Before/after proof** is PART A and check 5 of the harness in §2e — PART A run
before the migration returns another account's balance (the leak); check 5 after
it returns `permission denied for function credit_balance`. **I could not run
either myself** (no Postgres locally, and the live database is Jon's to change).

---

## 5. The double grant and plus-address farming — SOLVED AS ONE MECHANISM

Two doors, one design, per the brief.

### 5a. The double grant (7 credits instead of the ratified 5) — FIXED in code

A visitor gets 2 as a guest, spends them, signs up, and the new account is paid
the welcome grant **again** on top of the signup grant. `mergeGuestInto` did not
help, because a guest who already spent has nothing left to move.

The fix: **detect the conversion and skip the second welcome grant.** Both
routes now read the guest cookie *before* granting; if a real account is
continuing a guest session, `ensureGrants` is told `isConversion: true` and the
`anon_grant` is not paid. `mergeGuestInto` still carries any leftover across, so
both arrival paths land on the ratified **5**:

| Path | anon_grant | signup_grant | Total |
|---|---|---|---|
| Sign up cold | 2 | 3 | **5** |
| Guest → spends 2 → signs up | skipped (already paid as guest) | 3 | **5** (2 spent + 3) |
| Guest → spends 0 → signs up | skipped | 3 | **5** (2 merged + 3) |

### 5b. Plus-address farming — FIXED (code + migration PENDING JON)

`student+1@gmail.com` and `student+2@gmail.com` are one inbox and two accounts.
The signup grant is the part that costs real money, so this is the money half.

`normalizeEmail()` in `credits.ts` reduces an address to the **inbox** it
reaches; the normalised value is stored on the signup-grant row (`grant_email`)
and a partial unique index makes the grant **once per inbox, not per address**.
A second plus-addressed signup hits 23505 — already handled as "already paid,
do nothing". The account is still created; it just gets no second giveaway.

**Verified by executing the real function, extracted from the source file:**

```
input                              -> normalized (the signup-grant dedupe key)
student@gmail.com                  -> "student@gmail.com"
student+1@gmail.com                -> "student@gmail.com"
student+2@gmail.com                -> "student@gmail.com"
student+anything.here@gmail.com    -> "student@gmail.com"
Stu.Dent+tag@gmail.com             -> "student@gmail.com"
stu.dent@gmail.com                 -> "student@gmail.com"
student@googlemail.com             -> "student@gmail.com"
user+promo@outlook.com             -> "user@outlook.com"
first.last@outlook.com             -> "first.last@outlook.com"
ALICE@Example.COM                  -> "alice@example.com"
                                   -> null
null                               -> null
not-an-email                       -> null
@nolocal.com                       -> null
trailing@                          -> null

COLLISION CHECK (plus-address farming):
  student+1@gmail.com === student+2@gmail.com ? true
  student@gmail.com === stu.dent+x@gmail.com ? true
  distinct inboxes stay distinct: a@gmail === b@gmail ? false
  non-gmail dots preserved: first.last@outlook === firstlast@outlook ? false
```

Dot-stripping is applied to **Gmail only**, because Gmail ignores dots and other
providers do not — stripping them everywhere would merge genuinely different
people's inboxes.

### 5c. SHARED IPs — how this design avoids punishing a lecture hall

**This is the part I want Jon to read.** The audit's per-IP number was
5 anonymous sessions/hour. **I did not use 5, and the departure is deliberate.**

- The primary defence here is **IP-blind**: the per-inbox dedupe (5b) keys on
  the inbox, not the network. 300 students on one campus IP have 300 different
  inboxes and every one is served normally. This is the mechanism doing the real
  work against "one person, many accounts".
- The per-IP cap on anonymous grants is a **backstop against industrial
  farming, not a quota**, and is set at **60/hour** — a full lecture hall
  arriving at once is fine.
- **Why 60 and not 5:** the audit derived 5 before it was confirmed that
  Turnstile is actually enforced. I confirmed it is (§2d output). Each anonymous
  account already costs a human solving a captcha, so this is not scriptable —
  the same correction the brief applied to finding 1 applies here. A cap of 5
  would lock out real classmates in one room, which the audit itself warns
  against.
- **It counts grants actually paid, not requests.** `ensureGrants` runs on every
  request; charging the IP each time would exhaust the budget on ordinary repeat
  visitors. Only a genuinely new anonymous account consumes a slot.
- **The failure at the cap is the softest available:** the account still works,
  it just goes without free credits. The scan is free and needs none, and
  signing up earns credits on its own. Nobody is locked out of the product.
- **Real accounts are never IP-capped at all** — they have already cleared email
  confirmation, a captcha, and the per-inbox dedupe.
- If a real shared network ever does hit it, the number is one constant:
  `ANON_GRANTS_PER_HOUR_PER_IP` in `credits.ts`.

Per the brief, this per-IP cap **is** item 3's "new anonymous sessions per IP"
limit — one mechanism, sharing the same `rate_limit_hit` counter, not two
competing ones.

---

## WHAT JON STILL HAS TO RUN

**Four migrations, none applied.** I do not have permission to apply them and
did not. Paste the block below into the **Supabase SQL editor** and run it. The
files are in `apps/web/supabase/migrations/` under the project's naming
convention; the combined SQL is in the final chat message.

| File | What it does | What breaks if it goes wrong |
|---|---|---|
| `20260821120000_credit_ledger_append_only.sql` | Trigger refusing UPDATE/TRUNCATE/direct DELETE on the ledger | If the cascade detection were wrong, deleting an account would error. Harness check 4 proves it before you rely on it. |
| `20260821120100_credit_balance_self_only.sql` | Splits `credit_balance` by arity; `authenticated` loses the uuid form | If a caller were missed, a balance would read 0 or error. Both callers checked (§4); the home page uses the no-arg form. |
| `20260821120200_rate_limits.sql` | Counter table + `rate_limit_hit` + prune | Nothing: the app fails open, so before this runs behaviour is exactly today's. |
| `20260821120300_signup_grant_email_dedupe.sql` | `grant_email` column + per-inbox unique index | Only adds a nullable column and a partial index; existing rows are untouched (null `grant_email` is ignored by the index). |

All four are **idempotent and safe to re-run** (`if not exists`,
`create or replace`, `drop trigger if exists`) and each is **wrapped in
`begin; … commit;`**, so pasting one either fully applies or fully does not.

**One of them drops a function, and that is not optional.**
`20260821120100` must `drop function public.credit_balance(uuid)` before
recreating it, because PostgreSQL refuses to take a parameter default away with
`create or replace` — it raises `cannot remove parameter defaults from existing
function` and stops. The drop and the recreate are inside the same transaction,
so there is never a moment where the live site can call a missing function.

**Order:** any order works, but run them **before** deploying the code, or right
after. The code is written to survive an unmigrated database in both directions:
the rate limiter fails open, and `grantOnce` detects a missing `grant_email`
column and retries without it rather than failing every grant. That specific
outage — every grant failing because the database did not know a value — has
already happened once on this project, so it is guarded rather than assumed.

**Then run the proof:** `apps/web/scripts/verify-ledger-hardening.sql`
(PART A *before*, PART B *after*). It rolls itself back and touches no real data.

---

## SKIPPED, AND WHY — a step skipped is a step that failed

Stated plainly rather than buried.

1. **I did not execute a single migration or trigger.** There is no Postgres, no
   Docker, and no Supabase CLI on this machine, and installing one needs Jon's
   approval (CLAUDE.md §5). So findings 5 and 7 and the rate limiter are
   **written and reasoned, not executed.** The harness exists precisely so the
   claim can be proved rather than trusted. **Do not treat those three as
   verified until PART B prints its PASS lines.**
2. **The `authenticated`-role write tests were not run** (§2d). Turnstile
   refuses a headless session and I did not create an account or solve a captcha
   to get one. The `anon` role was fully tested and is blocked at the schema
   level; the `authenticated` half is covered by harness check 5.
3. **No end-to-end HTTP test of the rate limiter or the grant changes.** Both
   need a running app plus an applied migration; the live site is 20 commits
   behind and another session has uncommitted work in the tree.
4. **`/dev/credits` noindex (audit finding 6) — not done.** It is a frontend
   page and frontend is another session's territory. Handed off below.
5. **Sentry — not wired.** Needs a new dependency (CLAUDE.md §5) and edits to
   shared files another session is holding.

---

## HANDED OFF, NOT DONE

**Frontend (another session owns these — I did not touch them):**

1. **Handle HTTP 429 in the workbench.** Both `/api/tool/scan` and
   `/api/tool/clean` can now return `429` with
   `{ok:false, code:'rate_limited', message:'You are going a little fast. Wait a moment and try again.'}`.
   The interface should show that message rather than a generic failure. **Until
   this is done, a rate-limited user sees whatever the generic error path
   shows.** The limits are loose enough that normal use will not hit them.
2. **`/dev/credits` needs `noindex`** — audit finding 6, shared with the SEO
   audit's fix list.

**Backend, deliberately not attempted:**

3. **The account-deletion chain is incomplete** (§2c). `auth.admin.deleteUser()`
   leaves the `accounts` row and the ledger standing. The privacy policy
   currently documents this honestly, so nothing is *false* today — but if the
   intent is that deletion really deletes, the fix is a foreign key from
   `public.accounts.id` to `auth.users(id) on delete cascade`. **I did not add
   it:** it changes the deletion semantics of every account, it is not in the
   audit, and the legal page's wording changes with it. That is Jon's call, and
   it needs the privacy policy edited in the same deployment.
4. **`rate_limits_prune()` is not scheduled.** Run it occasionally, or add a
   cron, so closed windows do not accumulate.
5. **A site-wide API limit is still impossible** while `proxy.ts` excludes
   `/api/*` (§3).

---

## NOT DEPLOYED

Nothing was deployed and nothing was pushed. The live site is 20 commits behind
and a frontend session has uncommitted work in the tree. Jon controls when that
happens.

Commits from this session, staged by explicit path only (and checked against the
shared git index before each commit):

- `854e7db` — the PNG decompression-bomb cap and its tests.
