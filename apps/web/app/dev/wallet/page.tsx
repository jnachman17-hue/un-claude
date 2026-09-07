import { Suspense } from 'react';

import {
  CreditHistory,
  type LedgerRow,
} from '~/home/_components/credit-history';

/**
 * THE CREDIT HISTORY, AT A LENGTH NOBODY HAS EVER SEEN IT AT. Added
 * 23 August 2026, and it is the same idea as /dev/states one folder over.
 *
 * The wallet needs a real, non-anonymous session against the hosted database,
 * and there is no local Supabase (06 row 11). So the two defects the F1 audit
 * found on this list — a history that stopped dead at fifty rows with nothing
 * saying so, and dates printed in UTC so everyone in the Americas saw tomorrow
 * — could be fixed but not LOOKED AT, which by `CLAUDE.md` section 4 is not
 * finished. This renders the real component with fabricated rows.
 *
 * Development builds only, the same guard as /dev/credits and /dev/states.
 */
export const metadata = { robots: { index: false, follow: false } };

/** Every kind of row the wallet can show, so the labels can all be read. */
const KINDS: Array<Pick<LedgerRow, 'delta' | 'reason' | 'endpoint'>> = [
  { delta: -2, reason: 'spend', endpoint: 'clean' },
  { delta: +40, reason: 'purchase', endpoint: null },
  { delta: -1, reason: 'spend', endpoint: 'clean' },
  { delta: +2, reason: 'operation_refund', endpoint: 'clean' },
  { delta: +3, reason: 'signup_grant', endpoint: null },
  { delta: +1, reason: 'adjustment', endpoint: 'transfer_in' },
  { delta: -5, reason: 'money_refund', endpoint: null },
  { delta: +2, reason: 'anon_grant', endpoint: null },
];

/**
 * Rows on a fixed clock. The times are deliberately spread across the evening
 * so that several of them fall on a different DAY in UTC than they do in the
 * Americas, which is the whole of finding 8 and cannot be seen on rows that
 * all happen at noon.
 */
function rowsFor(page: number, size: number, total: number): LedgerRow[] {
  const from = (page - 1) * size;
  const count = Math.max(0, Math.min(size, total - from));

  return Array.from({ length: count }, (_, index) => {
    const nth = from + index;
    const kind = KINDS[nth % KINDS.length]!;
    // 23 August 2026, 01:54 UTC — the exact instant from the audit's finding 8
    // — then one hour earlier per row.
    const at = new Date(Date.UTC(2026, 7, 23, 1, 54, 18) - nth * 3_600_000);

    return {
      id: 10_000 - nth,
      delta: kind.delta,
      reason: kind.reason,
      endpoint: kind.endpoint,
      input_kind: kind.reason === 'spend' ? 'text' : null,
      words_in: kind.reason === 'spend' ? 1_140 + nth * 37 : null,
      // Only a purchase row carries a price. Pro pack, so the sample shows a
      // real figure rather than a round one.
      price_cents: kind.reason === 'purchase' ? 2_499 : null,
      created_at: at.toISOString(),
    };
  });
}

/*
 * The shell renders immediately and the query-string read happens inside the
 * boundary. Same shape as `app/update-password/page.tsx` and the auth callback
 * error page: under `cacheComponents` a segment that awaits `searchParams` in
 * its own body blocks the whole route from prerendering, and Next says so.
 */
export default function DevWallet(props: {
  searchParams: Promise<{ page?: string; total?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <Fixture searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Fixture(props: {
  searchParams: Promise<{ page?: string; total?: string }>;
}) {
  if (process.env.NODE_ENV !== 'development') {
    return (
      <main className={'mx-auto max-w-[640px] px-6 py-20'}>
        <p className={'text-muted-foreground text-[14px]'}>
          This page only renders on a development build.
        </p>
      </main>
    );
  }

  const query = await props.searchParams;
  const asked = Number(query.page);
  const page = Number.isFinite(asked) && asked > 1 ? Math.floor(asked) : 1;
  const total = Number(query.total) || 82;
  const SIZE = 25;

  const rows = rowsFor(page, SIZE, total);

  return (
    <main className={'mx-auto max-w-[640px] px-5 py-10'}>
      <h1 className={'text-foreground mb-1 text-[22px] font-bold'}>
        Credit history
      </h1>
      <p className={'text-muted-foreground mb-8 text-[12.5px]'}>
        The real component, with {total} fabricated rows. Add{' '}
        <code>?total=8</code> for a history that fits on one page. Page links
        below point at /home, which is the real wallet.
      </p>

      <CreditHistory
        rows={rows}
        from={(page - 1) * SIZE}
        page={page}
        hasOlder={page * SIZE < total}
      />
    </main>
  );
}
