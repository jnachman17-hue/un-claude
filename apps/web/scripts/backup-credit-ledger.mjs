#!/usr/bin/env node
/**
 * backup-credit-ledger.mjs — a $0, dependency-free backup of the credit ledger.
 *
 * WHY THIS EXISTS. Jon stays on Supabase's free plan (operations-setup.md),
 * which takes NO database backups. If credit_ledger were lost or corrupted
 * there is no restore. This script is the cheap stopgap: it dumps the whole
 * credit_ledger table to a timestamped CSV so there is always a recent copy
 * off to one side. It is NOT a substitute for real backups — it is better than
 * the nothing the free plan otherwise provides.
 *
 * DEPENDENCY-FREE ON PURPOSE. It uses only Node's built-ins (global fetch, fs) —
 * no npm install, no new service. It talks to Supabase's REST API (PostgREST)
 * with the service-role key, which reads every row past row-level security.
 *
 * HOW TO RUN (from apps/web):
 *   SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... \
 *     node scripts/backup-credit-ledger.mjs
 *
 * If you keep the values in apps/web/.env.local (they are already there for
 * local dev), the loader below reads them, so a bare run works too:
 *   node scripts/backup-credit-ledger.mjs
 *
 * Output: ./credit-ledger-backups/credit_ledger_<UTC-timestamp>.csv
 *
 * TO RUN ON A SCHEDULE (macOS/Linux cron, e.g. daily at 03:00):
 *   0 3 * * * cd /path/to/apps/web && /usr/bin/node scripts/backup-credit-ledger.mjs
 * The script prints one summary line and exits non-zero on failure, so cron
 * mail (or a wrapper) surfaces a broken backup instead of failing silently.
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function loadEnvFile(name) {
  if (!existsSync(name)) return;
  for (const raw of readFileSync(name, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

// Prefer real environment; fall back to the local dotenv files.
loadEnvFile('.env.local');
loadEnvFile('.env');

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !KEY) {
  console.error(
    'backup-credit-ledger: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Set them in the environment or in apps/web/.env.local, then re-run.',
  );
  process.exit(1);
}

const PAGE = 1000; // PostgREST's default page size.

async function fetchAll() {
  const rows = [];
  for (let offset = 0; ; offset += PAGE) {
    const res = await fetch(
      `${URL}/rest/v1/credit_ledger?select=*&order=id.asc&limit=${PAGE}&offset=${offset}`,
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Accept: 'application/json' } },
    );
    if (!res.ok) {
      throw new Error(`PostgREST ${res.status}: ${await res.text()}`);
    }
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < PAGE) break;
  }
  return rows;
}

function toCsv(rows) {
  // Stable column order: union of keys, first-seen order, so the header is the
  // full schema even if early rows have nulls.
  const cols = [];
  for (const r of rows) for (const k of Object.keys(r)) if (!cols.includes(k)) cols.push(k);
  const esc = (v) => {
    if (v === null || v === undefined) return '';
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [cols.join(',')];
  for (const r of rows) lines.push(cols.map((c) => esc(r[c])).join(','));
  return lines.join('\n') + '\n';
}

try {
  const rows = await fetchAll();
  const dir = 'credit-ledger-backups';
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  // Timestamp without ':' so the filename is valid on every filesystem.
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = join(dir, `credit_ledger_${stamp}.csv`);
  writeFileSync(file, toCsv(rows), 'utf8');
  console.log(`backup-credit-ledger: wrote ${rows.length} rows to ${file}`);
} catch (err) {
  console.error('backup-credit-ledger: FAILED —', err.message);
  process.exit(1);
}
