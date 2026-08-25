/**
 * A TINY LOCAL RECORD OF GATEWAY READINGS, SO "SPENT THIS MONTH" IS MEASURED.
 *
 * THE PROBLEM. The gateway reports `total_used` for ALL TIME. Jon's spending cap
 * is MONTHLY. All-time spend cannot answer "how much of this month's $100 is
 * gone", and no API exposes the monthly figure.
 *
 * THE FIX. Write down what the gateway said, every time the dashboard runs. Once
 * there is a reading from earlier in the month, the difference between then and
 * now IS the monthly spend — taken from the gateway's own numbers rather than
 * inferred from our database, so it includes usage this project did not cause
 * (a lab run, a measurement campaign) which is exactly what burned the cap last
 * time.
 *
 * WHAT IT IS HONEST ABOUT. The baseline is the first reading TAKEN this month,
 * not the true first of the month. Anything spent before the dashboard first ran
 * is invisible, so the figure is a FLOOR — the real spend is that much or more.
 * The page says so rather than presenting a floor as a measurement. Running the
 * dashboard regularly is what tightens it.
 *
 * NO SECRETS ARE STORED HERE. Two dollar amounts and a timestamp per line.
 * The file is git-ignored regardless, because it is a record of business
 * spending and belongs on Jon's machine only.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(HERE, '.gateway-history.json');

/** Enough for years of daily use; small enough to never matter. */
const MAX_READINGS = 2000;

export function readHistory() {
  try {
    if (!fs.existsSync(FILE)) return [];

    const parsed = JSON.parse(fs.readFileSync(FILE, 'utf8'));

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // A corrupt history must never stop the dashboard. Losing it costs one
    // month of baseline; crashing costs Jon the whole page.
    return [];
  }
}

export function appendReading({ totalUsed, loaded }) {
  if (!Number.isFinite(totalUsed)) return;

  try {
    const history = readHistory();

    history.push({ at: new Date().toISOString(), totalUsed, loaded });

    fs.writeFileSync(FILE, JSON.stringify(history.slice(-MAX_READINGS)), 'utf8');
  } catch {
    // Read-only disk, permissions, anything. The dashboard still works; it just
    // cannot report monthly spend until this succeeds once.
  }
}
