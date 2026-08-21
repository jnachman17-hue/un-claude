# Security audit — 21 August 2026

Read-only. Nothing in the application was changed to produce this — five
parallel read-only investigations plus direct verification of the highest-
stakes claims against the actual source and, where possible, the live
site. Every finding below quotes the real code, migration, or command
output it rests on, not a description of what it should say. Ranked by
**real** risk — what could actually hurt Jon starting today — not by how
scary a category name sounds.

**State the two that matter most, first, plainly:** the free-usage system
can mint effectively unlimited real accounts from one email inbox with no
CAPTCHA in front of it, each one worth free runs of the layer that costs
real money per use. And the free, no-login scan endpoint can be crashed
or hung for nothing by anyone who sends it one crafted image. Neither is
being exploited today as far as this audit can tell — nothing here found
evidence of actual abuse, only that both doors are open. Everything else
below is real but smaller.

---

## 1. Free credits can be minted without limit from one email address —
   new finding, more serious than the known one

**In plain English.** Signing up gives an account 5 free credits (2 for
just touching the tool, 3 more for making an account). Most email
providers, including Gmail, treat `you@gmail.com` and
`you+anything@gmail.com` as the same inbox but let a site treat them as
different addresses. Supabase, the login system this site runs on, does
exactly that: each one becomes a distinct account. There is no limit
anywhere in the code on how many accounts one person can make this way.

**How bad.** High. This is not the theoretical "someone clears their
cookies for two more credits" scenario the project already knew about —
it needs no browser trickery at all, just typing `+1`, `+2`, `+3` into a
signup form connected to a real inbox the person already controls. Each
account is worth real spend: the 5 credits include access to the
statistical-rewrite layer, which calls a paid model. At the measured cost
in `docs/06-assumptions-and-open-questions.md` row 65 (roughly
0.09–0.25 cents per 1,000 words, more on figure-dense text because of
retries), a script working through a thousand plus-addressed signups
turns a few dollars of model spend into real money quickly, with zero
technical skill required.

**How someone would actually do it.** Sign up as `student+1@gmail.com`,
confirm from the same inbox, spend the 5 credits, sign up again as
`student+2@gmail.com`, repeat. Every step uses the site's own, working
signup form.

**The code, confirmed directly** — `apps/web/lib/server/credits.ts`:
```ts
export const WELCOME_CREDITS = 2;
export const SIGNUP_CREDITS = 3;
...
export async function ensureGrants(user: { id: string; isAnonymous: boolean }): Promise<void> {
  await grantOnce(user.id, WELCOME_CREDITS, 'anon_grant');
  if (!user.isAnonymous) {
    await grantOnce(user.id, SIGNUP_CREDITS, 'signup_grant');
  }
}
```
`grantOnce` stops the *same account* from being granted twice — a partial
unique index in the database rejects the second insert. It does nothing
to stop a *new* account, and Supabase's own account system does not treat
`student+1@` and `student+2@` as related. Confirmed no identity-linking
config exists anywhere in `apps/web/supabase/config.toml` or the auth
package that would fold plus-addressed or dual-provider signups into one
account.

**Turnstile (the CAPTCHA already configured, `NEXT_PUBLIC_CAPTCHA_SITE_
KEY` in `apps/web/.env`) does not clearly cover this path.** It is wired
to `signInAnonymously()` — the guest path — in `workbench/credits.ts`.
Whether it is also enforced on the email/password signup form is a
setting inside the Supabase dashboard, not in this repository, and could
not be confirmed from source either way.

**Fix.** Two independent things, because they close different doors:
1. **Confirm, in the Supabase dashboard, whether Captcha protection is
   turned on for email/password sign-up, not only anonymous sign-in.** If
   it is off, turn it on — this alone raises the cost of scripting the
   attack substantially.
2. **Normalise the email address before treating it as a new person**,
   e.g. strip everything from `+` to `@` (and lower-case the address)
   before it's used as the key that decides whether `signup_grant` has
   already been paid. This is the fix that actually closes the hole
   Turnstile can't reach — a human typing five different real addresses
   by hand is a much smaller threat than a script doing it automatically,
   and Turnstile only raises the cost of the automated version.

---

## 2. The known "welcome grant paid twice" bug is still live — confirmed
   against today's code, not just the historical write-up

**In plain English.** `docs/06-assumptions-and-open-questions.md`
already documented this on 20 August: a visitor gets 2 free credits as a
guest, spends them, signs up — and the new real account gets the 2-credit
welcome grant **again**, on top of the 3-credit signup bonus, because the
guest identity and the real identity are different accounts as far as the
database is concerned. Ratified total: 5. Actual total: 7, and it repeats
every time cookies are cleared.

**Confirmed still true today**, by reading the actual grant code above
together with the brand-new migration dated today,
`apps/web/supabase/migrations/20260820210000_welcome_grant.sql`. That
migration's own comment states the intent plainly: *"2 free credits for
anyone... and 3 more for creating a real account."* What it actually
does is add `anon_grant` as a valid reason code and stop the *same*
account from getting a second `anon_grant` — it does not link a spent-out
guest account to the real account that follows it. **This migration
unblocks the feature from crashing (the reason code didn't exist before
today and every real grant was failing); it does not fix the double
grant.** `mergeGuestInto` in `credits.ts` does exist and moves any
*remaining* guest balance onto the new account, but a guest who already
spent their 2 credits has nothing left to move, so it does nothing for
this exact sequence.

**How bad.** Medium-high on its own, and it compounds directly with
finding 1 — a script doesn't even need to invent new email addresses to
extract more than the ratified 5 credits per person, clearing cookies
between runs is enough, and every generated address in finding 1 gets
this same extra +2 for free on top of its own 5.

**Fix.** The working position already in the docs is correct: a per-IP
cap on how many anonymous (`anon_grant`) grants can be issued in a given
window. Build it alongside the email-normalisation fix from finding 1,
not instead of it — they close different gaps and neither one alone
closes both. One real-world caveat worth carrying into that work: several
genuine students on the same campus or phone network can share one IP
address (family and campus Wi-Fi, and mobile carriers, commonly do this),
so the cap needs to be generous enough not to lock out real classmates
sitting in the same lecture hall.

---

## 3. A free, no-login image upload can crash or hang the server for
   nothing — new finding

**In plain English.** The site reads text hidden inside uploaded PNG
images as part of the free scan (`/api/tool/scan`, which requires no
account and no credits). One of the ways image files store that hidden
text is compressed, the same way a `.zip` file is compressed. The code
that decompresses it has no limit on how large the decompressed result is
allowed to get. A small file can be built so it explodes into gigabytes
when decompressed — a classic trick usually called a "decompression
bomb."

**Proof — the exact code, `apps/web/engine/image_meta.py`, lines 239–268:**
```python
elif ctype == b"zTXt":
    key, sep, rest = payload.partition(b"\x00")
    ...
    try:
        text = zlib.decompress(rest[1:])          # <-- no size limit
    except zlib.error:
        return entries
    ...
elif ctype == b"iTXt":
    ...
    if comp_flag == 1:
        try:
            text = zlib.decompress(text)           # <-- no size limit, same call
        except zlib.error:
            return entries
```
Python's `zlib.decompress()` takes an optional maximum-output-size
argument; neither call here uses it, so there is nothing stopping the
call from trying to produce an output far larger than the input. This
runs on **every** call to the free scan endpoint that includes a PNG,
with no login and no rate limit in front of it (see finding 5).

Worth saying plainly what this codebase gets right elsewhere, so the one
real gap is clear by contrast: the equivalent risk for `.docx` files (also
a compressed format) **is** properly guarded —
`apps/web/engine/container_meta.py` charges real decompressed bytes
against a 128MB budget as it streams, not the file's own (attacker-
controlled) claim of how big it is, and this exact protection has its own
passing tests in `engine/tests/test_security_hardening.py`. The same
pattern was simply never applied to this one PNG code path, and nothing
in the test suite currently catches that it's missing.

**How bad.** High for a "free" bug: it costs the attacker nothing (one
small file, no account), it's repeatable, and depending on how large the
decompressed result is made, the outcome is either the server running out
of the 1GB of memory Vercel gives this function
(`apps/web/vercel.json`: `memory: 1024`) or burning most of the 60-second
time limit before Vercel kills it — either way, real resource cost to
Jon and a slower or failed scan for anyone else using the tool at that
moment, for the price of one crafted file.

**Fix.** Cap the size, the same way the `.docx` path already does:
```python
text = zlib.decompressobj().decompress(rest[1:], max_length=SOME_SMALL_CAP)
```
A few megabytes is more than enough room for legitimate metadata text — a
real photo's embedded caption or software tag is never gigabytes. Add a
test alongside it that mirrors the zip-bomb tests already in
`test_security_hardening.py`, so this class of bug gets the same standing
coverage the `.docx` path has.

---

## 4. Nothing rate-limits the free scan endpoint, and that's what turns
   findings 1–3 from "possible" into "scriptable at scale"

**In plain English.** `docs/06` row 58 already flagged this: nothing
anywhere in the code limits how fast one visitor, or one script, can call
the site's own API routes. Confirmed still true, and confirmed to be by
design rather than oversight in one specific way worth knowing: the
site's own request-handling layer (`apps/web/proxy.ts`) explicitly
excludes every `/api/*` route from running at all —
```ts
export const config = {
  matcher: ['/((?!_next/static|_next/image|images|locales|assets|api/*).*)'],
};
```
— so the API routes don't just lack a rate limit, they skip the one place
a site-wide limit would naturally be added later without touching every
route file individually.

**How bad.** Medium by itself, but it's the multiplier sitting behind
every other finding here. `/api/tool/scan` needs no login, no credits,
and (confirmed) never calls the paid model — so on its own it costs
bandwidth and server time, not real money. But it's also the exact
endpoint finding 3's image bomb travels through, and the account-creation
path finding 1 abuses has nothing slowing repeated signups either.
Without a limit, a single-person exploit becomes a scripted, unattended
one.

One thing checked and confirmed **not** to be a gap: the credit-consuming
path (`/api/tool/clean` with the rewrite turned on) does correctly check
and deduct real credits server-side before it will call the paid model —
no way was found to skip or under-pay that charge by varying the request.
The exposure here is volume against a free/cheap path, not a way to spend
without paying.

**Fix, concrete numbers:**
- `/api/tool/scan` (free, no login): roughly **20 requests per minute per
  IP address**. A real visitor scans a handful of things in one sitting;
  this comfortably covers normal use while stopping a script from
  hammering it.
- `/api/tool/clean` (spends credits): roughly **10 requests per minute
  per account**. Tighter, because each call can carry real cost.
- **New anonymous ("guest") sessions**: roughly **5 per hour per IP
  address**, since each one is a fresh 2-credit grant per finding 2 — this
  is the number that actually caps the abuse in finding 2, more directly
  than limiting the scan/clean routes themselves.

Building the limiter itself (a small key-value store counting requests,
which Vercel and several add-on services provide) is implementation work
for a future session, not something this read-only pass should attempt —
flagging the specific numbers so that session doesn't have to re-derive
them.

---

## 5. A signed-in user can read another account's credit balance through
   a back door in the database, not through the table itself

**In plain English.** The database correctly stops one signed-in user
from reading another user's row in the credits table directly — that
part is right, see finding 7. But there's a second, separate way to ask
the database "how many credits does this account have," and that second
way does not check whose account it is.

**Proof** — `apps/web/supabase/migrations/20260819180000_credit_
ledger.sql`, lines 110–124:
```sql
create or replace function public.credit_balance(target_account uuid default null)
    returns integer
    language sql
    security definer
    set search_path = ''
as $$
select coalesce(sum(l.delta), 0)::integer
from public.credit_ledger l
where l.account_id = coalesce(target_account, (select auth.uid()));
$$;
...
grant execute on function public.credit_balance(uuid) to authenticated, service_role;
```
`security definer` means this function runs with elevated permissions
that skip the normal per-row permission check, by design — that part is
completely standard and needed for the server's own code to look up any
account's balance. The gap is that it's also handed directly to
`authenticated` (any signed-in visitor), and it takes the account to look
up as a plain argument with no check that the argument matches the
caller. Any signed-in user can call this function naming a different
account's ID and get that account's balance number back.

**How bad.** Low. It leaks one number — a credit count — not names,
emails, spend history, or anything else, and doing it requires already
having another account's internal ID, which isn't shown anywhere in the
product today. Real, and worth closing on principle and because it's
nearly free to fix, but not something to lose sleep over.

**Fix.** One line, inside the function: reject or ignore `target_account`
when the caller isn't the service role, e.g.
```sql
if current_setting('request.jwt.claim.role', true) = 'authenticated'
   and target_account is not null and target_account <> auth.uid() then
  raise exception 'not authorized';
end if;
```
or more simply, stop granting `authenticated` the `uuid`-argument version
of the function at all, and give it only a parameterless
`credit_balance()` that always resolves to the caller's own account.

---

## 6. Key exposure — checked thoroughly, one closed historical gap, one
   small live cosmetic gap, nothing currently leaking

Ranked last because, after checking it directly, this is the area in the
best shape.

**Nothing secret has ever been committed.** Checked the entire git
history, not just the current files: `git log --all --diff-filter=A
--name-only | grep -iE '\.env(\.|$)'` returns only `apps/web/.env`, which
by design holds only public, browser-safe values (site name, the
Cloudflare Turnstile *site* key — which is meant to be public; the secret
half of that pair lives only in Cloudflare's dashboard). A broad search
of every commit on every branch for key-shaped strings turned up only
variable names, code, and one intentionally-redacted example in
documentation prose. Also checked the actual built output
(`apps/web/.next/`), not just the source, for the real service-role key
and engine key values — neither appears anywhere in it, confirming they
are read at request time on the server and never baked into anything
sent to a browser.

**The one historical gap, and why it's closed rather than open.**
`.vercelignore` — the file telling Vercel's own upload tool which local
files to never include in a deployment — was only added today, in commit
`7c0b645`, and its own commit message says plainly why: without it, files
holding the Supabase service role key were being uploaded toward a
deployment. Before concluding this was a live leak, it's worth being
precise about what "uploaded toward" means here: this project deploys
automatically from GitHub on every push, and `.vercelignore` only matters
for the separate, manual `vercel deploy` command run from a local
terminal. The one time that manual command was run before today, it
never finished — the project's own runbook records it hanging and never
registering a completed deployment. So the exposure *route* was real, and
the fix is right to have shipped, but there is no evidence any complete,
served deployment ever actually contained these files. Recorded as closed
with a caveat, not as fully proven safe — a partial upload before the
hang can't be ruled out from local evidence alone.

**One small, live, cosmetic gap**, overlapping with the SEO audit's
finding 6: `/dev/credits` is a real page in production, and it is not
marked to keep search engines out (no `noindex`, and `robots.txt` allows
everything). It renders nothing but a static sentence outside of a
local development build, so there's no data or secret exposed by it being
crawlable — just a half-finished-looking page that shouldn't be the
thing a stranger finds when searching the site. Worth fixing before
launch on principle; see the SEO audit for the one-line fix.

---

## 7. Row Level Security on the credit ledger — mostly right, and the
   one specific trap the docs warned about was successfully avoided

**Can one account read another's ledger rows directly? No, confirmed by
the actual policy:**
```sql
create policy credit_ledger_read on public.credit_ledger for select
    to authenticated using ((select auth.uid()) = account_id);
```

**Can a signed-in user write to the ledger at all — their own row or
anyone's? No.** Not because a policy blocks it, but because the
permission to write was never granted in the first place, which is a
stronger guarantee than a policy — Postgres refuses the write before any
policy is even checked:
```sql
revoke all on public.credit_ledger from authenticated, service_role;
grant select on table public.credit_ledger to authenticated;
grant select, insert on table public.credit_ledger to service_role;
```
Every actual credit change goes through `credits.ts`, which uses the
server's own elevated database connection — never a visitor's session —
confirmed by reading the file directly.

**Is the ledger really append-only, including against the service role
the server itself uses? Yes, today** — and for a more solid reason than
expected. The natural assumption is that only a database trigger can stop
the powerful "service role" connection from editing old rows, since that
role normally skips row-level security checks entirely. But the grant
statement above never gave that role permission to `update` or `delete`
in the first place, which Postgres enforces independently of row-level
security. Confirmed no later migration re-adds that permission.

**The one honest caveat**, worth recording rather than leaving as a
silent assumption: this protection currently rests on that single
`revoke`/`grant` pair, with no second layer behind it. A future migration
that writes something as ordinary-looking as "grant all privileges to the
service role, to fix a permissions issue" would silently undo it, and
nothing today would catch that. A trigger that actively refuses any
update or delete, added once, would survive a mistake like that where the
current setup would not. Recommended as cheap hardening, not because
anything is wrong today.

**The specific trap `docs/06` row 49 warned about — checked and
confirmed avoided.** That row worried that a credit balance might end up
stored inside `accounts.public_data`, a field any signed-in user can
freely edit (its protective trigger only checks the `id` and `email`
fields, confirmed by reading the trigger function directly). It does not
end up there. The balance is never stored as a number anywhere — it's
calculated fresh each time by adding up the ledger's rows, and no
writable field exists for a user to set it directly. The trap was real
and was correctly designed around, not avoided by luck.

---

## 8. File upload injection risks — checked in full, one finding (§3
   above), everything else genuinely solid

Covering the rest of what was asked under this heading, so nothing reads
as skipped:

- **Command injection** (tricking the server into running an attacker's
  own commands): none found. Every place the code shells out to another
  program uses a plain list of arguments rather than a single string a
  clever filename could break out of, and filenames are passed through a
  guard (`safe_arg()` in `apps/web/engine/common.py`) that specifically
  defuses a filename designed to look like a command option.
- **Path traversal** (a filename like `../../etc/passwd` tricking the
  server into reading or writing outside its own temp folder): none
  found. Checked directly with real traversal-style filenames — every one
  is rejected before use by a check that a constructed path's parent
  folder is still the intended temp folder.
- **Zip bombs in Word documents** (`.docx` files are actually `.zip`
  files in disguise): none possible. Confirmed a real, tested 128MB cap
  on real decompressed bytes — not on the file's own attacker-controlled
  claim of its size — with existing passing tests for exactly this.
- **The one real finding**: the PNG decompression bomb in §3, the one
  place this same discipline wasn't applied.
- **General resource exhaustion**: file size is capped at 5MB before it
  reaches any processing (`apps/web/api/_shared.py`), the server function
  has a 60-second hard ceiling and 1GB of memory
  (`apps/web/vercel.json`), and the file-parsing code was checked and
  does not loop indefinitely on malformed input. The one place this
  ceiling can actually be hit for free is, again, §3.

---

## Priority list, ranked by what could actually hurt Jon first

1. **§1 — email-alias signup farming.** Real money bleed, needs no
   trickery, works today. Confirm Supabase's captcha setting on
   email/password signup, then normalise the email before deciding
   whether the signup grant has already been paid.
2. **§3 — the PNG decompression bomb.** Free, anonymous, and can degrade
   or crash the service for every other user at that moment. Add the same
   size cap the `.docx` path already has.
3. **§2 — the known double-grant bug.** Confirmed still live in today's
   code, not just historical. Build the per-IP cap on anonymous grants
   already recommended in the docs, alongside (not instead of) §1's fix.
4. **§4 — rate limiting.** Turns 1–3 from "someone could" into "a script
   already is." The concrete numbers above are ready for whoever
   implements it.
5. **§5 — the `credit_balance` RPC leak.** Cheap, one-line fix; low
   impact but no reason to leave it.
6. **§6 — `/dev/credits` noindex.** Cosmetic, shared with the SEO audit's
   fix list; do before launch on principle.
7. **§7's hardening note.** Add a trigger as a second line of defence for
   the ledger's append-only guarantee — not urgent, cheap insurance.
