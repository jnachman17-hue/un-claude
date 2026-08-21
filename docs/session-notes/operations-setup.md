# Operations setup — 2026-08-21

Dashboard/account session. No code touched. Progress logged as it happened.

## Email delivery (Resend + Supabase SMTP) — DONE

- Resend account created by Jon.
- Domain `un-claude.com` added and verified in Resend. Three DNS records
  added at Squarespace and confirmed live via `dig`:
  - TXT `resend._domainkey` (DKIM)
  - MX `send` → `feedback-smtp.us-east-1.amazonses.com`, priority 10
  - TXT `send` → `v=spf1 include:amazonses.com ~all`
  - No DMARC record was offered by Resend at setup time; not added.
- Resend API key created (Sending access, scoped to un-claude.com). Not
  recorded anywhere in this session or this file.
- Supabase Authentication → SMTP Settings: custom SMTP enabled.
  - Sender email: `noreply@un-claude.com`
  - Sender name: Un-Claude
  - Host: `smtp.resend.com`, port 587, username `resend`, password = Resend API key
- Supabase auth email rate limit raised from the default to **70/hour**
  (Jon's choice; default was low because it assumed the shared dev sender).
- Email templates rewritten for "Confirm signup" and "Reset password":
  short, plain, branded "Un-Claude", no marketing copy.

**Sender avatar (Gravatar) — explicitly skipped for now.** `noreply@un-claude.com`
is not a real inbox, so Gravatar's ownership-verification email has nowhere to
land. Real fix is a BIMI DNS record + verified mark certificate — bigger,
paid, post-launch project. Not started.

## Real signup test — RESULT: email delivery confirmed, product bug found

Jon signed up on un-claude.com with a real, previously-unused email address.

- **Confirmation email: arrived in inbox (not spam), instantly.** This is the
  thing SMTP setup exists to prove, and it's confirmed working.
- **After clicking the confirmation link: landed on `/home`, showed 0 credits.**
  Expected 5 (2 welcome + 3 signup, per `apps/web/lib/server/credits.ts`).

### Root cause, found read-only, NOT fixed here

Local `main` is **37 commits ahead of `origin/main`** — none of those commits
are pushed to GitHub, which is what Vercel deploys from. The live site is
running old code.

Among the 37 unpushed commits is `3e5cd5b` — *"Credits: answer the dead end
at zero, and land sign-up back on the tool"* — which by its message and by
reading `apps/web/app/auth/confirm/route.ts` (redirects to
`pathsConfig.app.afterAuth`, now `'/'`) appears to be exactly the fix for
both symptoms Jon hit (wrong landing page, zero credits).

**This was not pushed.** Per CLAUDE.md section 5, pushing to GitHub is Jon's
call, and three other sessions are actively editing this repo — unclear if
all 37 commits are meant to ship as one batch. Decision: check with the
coding sessions / Jon before pushing, then redo this exact signup test
against the live site once deployed.

**Action item:** once pushed and deployed, redo the real-signup test end to
end and confirm 5 credits + correct landing page before calling this closed.

## Database backups — Jon's decision

Supabase Free plan = **no automatic backups at all.** Pro ($25/month) adds
nightly backups, 7 days retention. Point-in-Time Recovery (PITR) is a
separate add-on on top of Pro — Jon's own Supabase dashboard shows it
starting at $100/month. Recommendation given: take Pro for the nightly
backups, skip PITR at this stage (traffic/volume doesn't justify it yet).

**Confirmed: staying on the Free plan.** Jon declined both the $100/month
PITR add-on and the $25/month Pro tier. **As of this note, the credit
ledger has zero backup protection** — if the `credit_ledger` table (or the
whole database) were lost or corrupted, there is no way to restore it.
This is a live, accepted risk, not an oversight — Jon's call, made with
the tradeoff explained. The mitigation below is what stands in its place.

**Recommended mitigation in place of paid backups: harden the code path,
not just insure against its failure.** Since there's no safety net to fall
back on if the ledger gets corrupted, the priority shifts to making
corruption unlikely in the first place. For the next code session:
- Review `apps/web/lib/server/credits.ts` and anything that writes to
  `credit_ledger` for destructive operations (deletes, updates, anything
  that isn't an append-only insert). The grant logic already looks
  append-only and idempotent (unique-index-guarded inserts) as of this
  read — that's the right shape and should stay that way.
- Confirm the `spend_credits` database function (called via RPC) can't be
  bypassed by anything other than that function — i.e. row-level security
  really does block direct writes from a browser-held token, as the
  comments in that file claim.
- Consider a cheap, free stopgap: a periodic manual export of the
  `credit_ledger` table (e.g. a scheduled `pg_dump` of just that table, or
  a scripted CSV export) stored somewhere safe. Not a substitute for real
  backups, but better than nothing at $0/month.

## Uptime monitoring — DONE

UptimeRobot account created, monitor added for `https://un-claude.com`,
HTTP(s) check every 5 minutes, email (and optionally push) alerts on.
Verified independently from this session with a direct request: **HTTP 200,
responded in 0.41s** at time of check — site healthy, matching what the
monitor should also be showing.

## Sentry — account created, NOT wired in

Sentry account created by Jon. Deliberately stopped there: connecting it to
the app means adding a new dependency and editing shared files
(`next.config.ts`, likely `layout.tsx`) that the other three concurrent
sessions currently have modified and uncommitted. Doing that from this
session risks silently clobbering their work, and this project's rules
require Jon's explicit sign-off before adding any dependency regardless.
**To-do for a future code session:** install Sentry's Next.js SDK and wire
it up once the other sessions are at a clean stopping point.

## Summary — end of session, 2026-08-21

**What's live and working:**
- Custom domain email sending: `noreply@un-claude.com` via Resend, SMTP
  wired into Supabase. Real signup test confirmed delivery — inbox,
  instant.
- Auth email rate limit raised to 70/hour.
- Confirm-signup and reset-password email templates rewritten, short and
  branded.
- Uptime monitoring live and verified.
- Sentry account exists, ready for a future wiring session.

**What's confirmed broken, with a fix already written but not deployed:**
- Post-confirmation landing page and signup credit grant (0 credits shown
  instead of 5). Root cause: local `main` is 37 commits ahead of
  `origin/main` — Vercel deploys from GitHub, so the live site predates the
  fix. The fix appears to already exist as commit `3e5cd5b`. Not pushed
  during this session (pushing is Jon's call, and it's unclear whether all
  37 commits are meant to ship as one batch — check with the coding
  sessions first). **Once pushed and deployed, redo the real signup test
  end to end and confirm 5 credits + correct landing page.**

**Accepted risk, not a bug:**
- Supabase Free plan — zero database backups. Jon's explicit decision,
  declining both the $25/month Pro tier and the $100/month PITR add-on.
  Mitigation recommended for a future code session: review
  `apps/web/lib/server/credits.ts` and everything touching `credit_ledger`
  for anything that isn't an append-only, idempotent insert; confirm
  `spend_credits` can't be bypassed by a direct client write; consider a
  free periodic export of just the `credit_ledger` table as a cheap
  stopgap.

**Deferred, needs a code session:**
- [ ] Wire up Sentry (dependency + config changes)
- [ ] Push the 37 pending commits (after checking with the other sessions)
      and redeploy, then retest signup
- [ ] Harden `credit_ledger` write paths against corruption, given there's
      no backup safety net
- [ ] Consider a low-cost periodic export of `credit_ledger` as a stopgap
      backup
