/**
 * READ THE CREDIT LEDGER, so a credit claim can be shown rather than asserted.
 *
 * Added 21 August 2026, session 10. Jon cannot check this project's work by
 * reading code (CLAUDE.md section 1), and "the credits worked" is worth
 * nothing on its own. This prints the actual rows: who was granted what, what
 * was spent, what was refunded, in order.
 *
 *   cd apps/web && node scripts/read-ledger.mjs 20
 *
 * Reads the project's own .env / .env.local for the Supabase URL and service
 * key. It uses those values and never prints them. Read only: this script
 * makes no writes of any kind.
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

// Read the project's own env. Values are used, never printed.
const env = {};
for (const f of ['../.env', '../.env.local']) {
  const p = path.resolve(f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
}
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const { data, error } = await db
  .from('credit_ledger')
  .select('id, account_id, delta, reason, endpoint, input_kind, words_in, created_at')
  .order('id', { ascending: false })
  .limit(Number(process.argv[2] || 20));
if (error) { console.error('LEDGER READ FAILED:', error.message); process.exit(1); }
const rows = data.reverse();
console.log('id      account          delta  reason            endpoint      kind   words  when');
for (const r of rows) {
  console.log(
    String(r.id).padEnd(7),
    String(r.account_id).slice(0, 8).padEnd(16),
    String(r.delta > 0 ? '+' + r.delta : r.delta).padStart(5),
    ' ' + String(r.reason).padEnd(17),
    String(r.endpoint ?? '-').padEnd(13),
    String(r.input_kind ?? '-').padEnd(6),
    String(r.words_in ?? '-').padStart(5),
    ' ' + new Date(r.created_at).toISOString().slice(11, 19),
  );
}
console.log('\nrows returned:', rows.length);
