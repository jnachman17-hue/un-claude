/**
 * Create ONE shared fraternity-chapter account and put credits on it, then
 * print the login exactly as it should be pasted to the chapter.
 *
 * THE ACCOUNT IS CREATED LOCKED. The outreach email carries real credentials
 * and real credits, and sign-in is refused until the chapter sends a
 * screenshot proving the login reached the house and Jon runs --activate.
 * Less friction than a discount code, and nothing is given away unattributed.
 *
 * Added 26 August 2026 for the UA IFC campaign. The offer is: one login the
 * whole house shares, 250 credits on it, no card, nothing expires.
 *
 *   node scripts/make-chapter-account.mjs "Sigma Nu"
 *   node scripts/make-chapter-account.mjs "Sigma Nu" --credits 250
 *   node scripts/make-chapter-account.mjs "Sigma Nu" --activate      <- switch it on
 *   node scripts/make-chapter-account.mjs "Sigma Nu" --topup
 *   node scripts/make-chapter-account.mjs "Sigma Nu" --reset-password
 *
 * SAFETY. This script only ever CREATES an account or ADDS credits to one. It
 * never deletes a user and never writes a negative ledger row, so the worst a
 * mistake can do is give somebody credits. Re-running it for a chapter that
 * already exists is REFUSED unless you pass `--topup`, because the common
 * accident is running it twice and silently paying twice.
 *
 * WHY THE BALANCE READS MORE THAN THE GRANT. Creating an account with an email
 * address fires `mint_signup_grant`, which pays 3 credits, and the first use of
 * the tool pays a 2-credit welcome. So a chapter granted 250 has a balance of
 * 253, and 255 once somebody uses it. That is deliberate: netting it back to
 * exactly 250 would mean writing a NEGATIVE row to claw back credits the
 * account is genuinely entitled to, which is the one thing this ledger is
 * built to make impossible to do quietly. They get slightly more than the
 * email promised. Nobody has ever complained about that.
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

/* ------------------------------------------------------------------ env */

const HERE = path.dirname(new URL(import.meta.url).pathname);
const env = {};
for (const f of ['../.env', '../.env.local']) {
  const p = path.resolve(HERE, f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
}

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env / .env.local');
  process.exit(1);
}

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/* ----------------------------------------------------------------- args */

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith('--')));
const positional = argv.filter((a) => !a.startsWith('--'));

function flagValue(name, fallback) {
  const i = argv.indexOf(name);
  return i === -1 ? fallback : argv[i + 1];
}

const CHAPTER = positional[0];
const CREDITS = Number(flagValue('--credits', 250));
const SCHOOL = flagValue('--school', 'University of Alabama');

if (!CHAPTER) {
  console.error(
    'Usage: node scripts/make-chapter-account.mjs "Sigma Nu" [--credits 250] [--activate] [--topup] [--reset-password]',
  );
  process.exit(1);
}
if (!Number.isInteger(CREDITS) || CREDITS <= 0) {
  console.error(`--credits must be a positive whole number, got ${flagValue('--credits')}`);
  process.exit(1);
}

/*
 * The address is derived from the chapter name so it is predictable and
 * greppable, and it lives on a domain we own so a catch-all could be pointed
 * at it later. Nothing is ever sent to it: the chapter signs in with it, and
 * if they lose the password we re-run this with --reset-password rather than
 * relying on a reset email that would bounce.
 */
const slug = CHAPTER.toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');
const EMAIL = `chapter-${slug}@un-claude.com`;

/* ------------------------------------------------------------- password */

/*
 * Readable on purpose. This gets typed off a screenshot into a phone by
 * somebody in a group chat, so ambiguous characters and shell-hostile
 * punctuation are worse than a few bits of entropy. Two words plus four
 * digits out of a 64-word list is ~1 in 40 million, against an account that
 * holds credits rather than anything sensitive and is deliberately shared.
 */
const WORDS = [
  'anchor', 'amber', 'arrow', 'atlas', 'basin', 'beacon', 'birch', 'bison',
  'bramble', 'bridge', 'canyon', 'cedar', 'cinder', 'clover', 'cobalt', 'comet',
  'copper', 'crimson', 'delta', 'ember', 'falcon', 'fathom', 'forge', 'garnet',
  'granite', 'harbor', 'hazel', 'hollow', 'indigo', 'ivory', 'juniper', 'kestrel',
  'lantern', 'ledger', 'lumen', 'maple', 'marble', 'meadow', 'meridian', 'onyx',
  'orchard', 'osprey', 'pewter', 'pine', 'quarry', 'quartz', 'ranger', 'raven',
  'ridge', 'river', 'saddle', 'sable', 'sierra', 'slate', 'summit', 'tamarack',
  'thistle', 'timber', 'tundra', 'valley', 'verdant', 'walnut', 'willow', 'zenith',
];

function pick(list) {
  return list[crypto.randomInt(0, list.length)];
}

function makePassword() {
  const a = pick(WORDS);
  const b = pick(WORDS);
  const n = String(crypto.randomInt(1000, 10000));
  return `${a[0].toUpperCase()}${a.slice(1)}-${b[0].toUpperCase()}${b.slice(1)}-${n}`;
}

/* ------------------------------------------------------------- helpers */

async function findUserByEmail(email) {
  // listUsers is paged; walk it rather than assuming one page holds everything.
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers: ${error.message}`);
    const hit = (data?.users ?? []).find((u) => u.email === email);
    if (hit) return hit;
    if ((data?.users ?? []).length < 200) return null;
  }
  return null;
}

async function balanceOf(accountId) {
  const { data, error } = await db.rpc('credit_balance', { target_account: accountId });
  if (error) throw new Error(`credit_balance: ${error.message}`);
  return data ?? 0;
}

async function chapterGrantCount(accountId) {
  const { count, error } = await db
    .from('credit_ledger')
    .select('id', { count: 'exact', head: true })
    .eq('account_id', accountId)
    .eq('reason', 'chapter_grant');
  if (error) throw new Error(`count chapter_grant: ${error.message}`);
  return count ?? 0;
}

/* ---------------------------------------------------------------- main */

const existing = await findUserByEmail(EMAIL);
let user = existing;
let password = null;

if (
  existing &&
  !flags.has('--topup') &&
  !flags.has('--reset-password') &&
  !flags.has('--activate')
) {
  const grants = await chapterGrantCount(existing.id);
  const bal = await balanceOf(existing.id);
  console.error(`\nREFUSED. ${CHAPTER} already has an account.`);
  console.error(`  email            ${EMAIL}`);
  console.error(`  balance          ${bal} credits`);
  console.error(`  chapter grants   ${grants}`);
  console.error(`\nTo add another ${CREDITS} credits:  --topup`);
  console.error(`To issue a new password:         --reset-password\n`);
  process.exit(1);
}

/*
 * ACTIVATION. The outreach email carries the real credentials, and the account
 * is LOCKED until the chapter sends a screenshot proving the login reached the
 * house. Locking is a ban at the auth layer — `ban_duration` — which is the
 * right mechanism because it needs no schema change and no application code:
 * the credentials are genuine, the row exists, the credits are already on it,
 * and sign-in is simply refused until the ban is lifted.
 *
 * A hundred years, because Supabase wants a duration rather than a flag, and
 * an accidental expiry would silently switch an account on.
 */
const LOCK_DURATION = '876000h';

if (existing && flags.has('--activate')) {
  const { error } = await db.auth.admin.updateUserById(existing.id, { ban_duration: 'none' });
  if (error) {
    console.error(`FAILED to activate: ${error.message}`);
    process.exit(1);
  }
  const bal = await balanceOf(existing.id);
  console.log(`\n  ACTIVATED — ${CHAPTER}`);
  console.log(`  ${EMAIL} can now sign in. Balance ${bal} credits.\n`);
  process.exit(0);
}

if (!existing && flags.has('--activate')) {
  console.error(`\nNo account exists for ${CHAPTER} (${EMAIL}). Create it first.\n`);
  process.exit(1);
}

if (!existing) {
  password = makePassword();
  const { data, error } = await db.auth.admin.createUser({
    email: EMAIL,
    password,
    email_confirm: true,
    ban_duration: LOCK_DURATION,
    user_metadata: { name: `${CHAPTER} — ${SCHOOL}`, chapter: CHAPTER, school: SCHOOL },
  });
  if (error) {
    console.error(`FAILED to create account: ${error.message}`);
    process.exit(1);
  }
  user = data.user;
  console.log(`created account for ${CHAPTER}`);
} else if (flags.has('--reset-password')) {
  password = makePassword();
  const { error } = await db.auth.admin.updateUserById(existing.id, { password });
  if (error) {
    console.error(`FAILED to reset password: ${error.message}`);
    process.exit(1);
  }
  console.log(`reset password for ${CHAPTER}`);
}

/*
 * The accounts row is written by a trigger on auth.users. It is normally there
 * the moment createUser returns, but the ledger has a foreign key onto it, so
 * confirm rather than assume — a failure here would otherwise surface as a
 * confusing FK violation on the insert below.
 */
let accountReady = false;
for (let attempt = 0; attempt < 10; attempt++) {
  const { data } = await db.from('accounts').select('id').eq('id', user.id).maybeSingle();
  if (data) { accountReady = true; break; }
  await new Promise((r) => setTimeout(r, 250));
}
if (!accountReady) {
  console.error(`FAILED: no accounts row for ${user.id} after 2.5s. The auth user exists; no credits were granted.`);
  process.exit(1);
}

// Grant the credits, unless this run was only about issuing a new password.
const granting = !existing || flags.has('--topup');
if (granting) {
  const { error } = await db.from('credit_ledger').insert({
    account_id: user.id,
    delta: CREDITS,
    reason: 'chapter_grant',
  });
  if (error) {
    console.error(`\nFAILED to grant credits: ${error.message}`);
    if (/credit_ledger_reason_check/.test(error.message)) {
      console.error('The database has not learned the chapter_grant reason yet.');
      console.error('Apply supabase/migrations/20260826233000_chapter_grant.sql first.');
    }
    console.error(`The account EXISTS (${EMAIL}) but has no chapter grant. Re-run with --topup.\n`);
    process.exit(1);
  }
}

const balance = await balanceOf(user.id);
const grants = await chapterGrantCount(user.id);

// Read the lock state back from auth rather than assuming it from what this
// run did. A previous run, or a hand edit in the Supabase dashboard, is the
// case where an assumption would print the wrong thing on the one line that
// decides whether a chapter can actually sign in.
const { data: fresh } = await db.auth.admin.getUserById(user.id);
const bannedUntil = fresh?.user?.banned_until ?? null;
const locked = Boolean(bannedUntil && new Date(bannedUntil) > new Date());

/* -------------------------------------------------------------- output */

console.log('');
console.log('='.repeat(58));
console.log(`  ${CHAPTER} — ${SCHOOL}`);
console.log('='.repeat(58));
console.log(`  account id      ${user.id}`);
console.log(`  balance         ${balance} credits  (~${(balance * 1000).toLocaleString()} words)`);
console.log(`  chapter grants  ${grants} × recorded in the ledger`);
if (granting) console.log(`  granted now     ${CREDITS} credits`);
console.log(`  status          ${locked ? 'LOCKED — cannot sign in yet' : 'ACTIVE — can sign in'}`);
console.log('='.repeat(58));

if (password) {
  console.log('');
  console.log('  PASTE THIS TO THE CHAPTER  (shown once — it is not stored anywhere)');
  console.log('');
  console.log(`      un-claude.com`);
  console.log(`      email:    ${EMAIL}`);
  console.log(`      password: ${password}`);
  console.log('');
  console.log('  Lost it? Re-run with --reset-password. There is no reset email:');
  console.log('  nothing delivers to that address by design.');
} else {
  console.log('');
  console.log(`  Login unchanged: ${EMAIL}`);
  console.log('  Use --reset-password to issue a new one.');
}

if (locked) {
  console.log('');
  console.log('  The credits are already on it. Sign-in is refused until you run:');
  console.log(`      node scripts/make-chapter-account.mjs "${CHAPTER}" --activate`);
}
console.log('');
