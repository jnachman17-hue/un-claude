/**
 * Create (or reset) ONE throwaway confirmed account for end-to-end payment
 * testing, and print its credentials so a browser can sign in as it.
 *
 * Added 21 August 2026, session 11, for the Stripe end-to-end run.
 *
 * SAFETY: operates on exactly ONE fixed email address and deletes only users
 * matching it exactly. It never touches any other account.
 *
 *   node scripts/make-test-buyer.mjs
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

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

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const EMAIL = 'stripe-e2e-buyer@un-claude.com';
const PASSWORD = 'StripeE2E-testing-2026!';

const { data: listed } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
for (const u of listed?.users ?? []) {
  if (u.email === EMAIL) {
    await db.auth.admin.deleteUser(u.id);
    console.log('removed previous throwaway buyer', u.id.slice(0, 8));
  }
}

const { data, error } = await db.auth.admin.createUser({
  email: EMAIL,
  password: PASSWORD,
  email_confirm: true,
  user_metadata: { name: 'Stripe E2E Buyer' },
});

if (error) { console.error('FAILED:', error.message); process.exit(1); }

console.log('\nthrowaway buyer created');
console.log('  id      ', data.user.id);
console.log('  email   ', EMAIL);
console.log('  password', PASSWORD);
