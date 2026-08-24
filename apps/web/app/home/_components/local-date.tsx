'use client';

import { useEffect, useState } from 'react';

/**
 * A ledger row's date, in the visitor's own time zone.
 *
 * IT USED TO BE PRINTED IN UTC, on the one page in this product that is a
 * financial record. F1 audit, finding 8, measured against the real database:
 *
 *   the row was written   2026-08-23T01:54:18Z
 *   the customer was in   America/Los_Angeles, where that is 6:54pm on the 22nd
 *   the wallet said       "Aug 23, 2026"
 *
 * So everyone in the Americas saw tomorrow's date on anything they did after
 * late afternoon, and anybody checking their history against a bank statement
 * found the days did not line up. The cause is that the page renders on the
 * server, and a server has no idea where the person reading it is standing.
 *
 * ONLY THE BROWSER KNOWS THE ANSWER, so the browser supplies it. The server
 * still renders a real date — deliberately pinned to UTC so its output is the
 * same on every machine and hydration has something stable to match — and the
 * moment this mounts it is replaced with the same instant in the visitor's own
 * zone. Two renders rather than one, which is the price of the server not being
 * able to know this, and it is paid once per row on arrival.
 *
 * The time is shown as well as the day. This is a money record and the reason
 * the audit gave for caring about the date was somebody matching it against a
 * bank statement, which is a job the hour makes possible and the day alone does
 * not.
 */
/* The day and the hour are formatted separately rather than sliced apart
   afterwards: "Aug 22, 2026, 6:54 PM" carries two commas and every attempt to
   split it on one of them picks the wrong one on some locale or some date. */
const DAY: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
};

const TIME: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };

function format(iso: string, timeZone?: string): string {
  const at = new Date(iso);
  const zone = timeZone ? { timeZone } : {};

  const day = at.toLocaleDateString('en-US', { ...DAY, ...zone });
  const time = at.toLocaleTimeString('en-US', { ...TIME, ...zone });

  return `${day} · ${time}`;
}

export function LocalDate({ iso }: { iso: string }) {
  const [shown, setShown] = useState(() => format(iso, 'UTC'));

  useEffect(() => setShown(format(iso)), [iso]);

  return <time dateTime={iso}>{shown}</time>;
}
