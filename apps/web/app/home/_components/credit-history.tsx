import Link from 'next/link';

import { LocalDate } from './local-date';

/**
 * The credit history: the list of every movement on an account, newest first.
 *
 * IT LIVES IN ITS OWN FILE SO IT CAN BE LOOKED AT. `CLAUDE.md` section 4 asks
 * for the artefact rather than a description of it, and this list is behind a
 * real signed-in session against a hosted database — there is no local Supabase
 * (06 row 11), so nobody has ever been able to put a long history on screen
 * while working on it. With the list as a component, /dev/wallet renders it
 * with fabricated rows at any length, and the page below renders it with the
 * customer's real ones. Same component, same markup, same CSS.
 */

/** The ledger reasons, translated into wallet language. */
const REASON_LABEL: Record<string, string> = {
  anon_grant: 'Welcome credits',
  signup_grant: 'Account credits',
  purchase: 'Purchase',
  spend: 'Sanitise',
  operation_refund: 'Refund: the operation failed',
  money_refund: 'Refund',
  adjustment: 'Adjustment',
};

/**
 * What a row is called, in words the person reading it has not had to learn.
 *
 * `adjustment` USED TO SAY "Transfer", AND NOBODY HAD EVER SEEN IT. The guest
 * merge had never once run against the real database, so no wallet had ever
 * contained one of these rows. It ran for the first time on 21 August 2026,
 * and now it is the FIRST ROW most new accounts will ever see, sitting above
 * their signup credits saying "Transfer +1" — a transfer from what, to what,
 * by whom.
 *
 * CLAUDE.md section 8: teach the term before using it, and read it as the
 * visitor. The visitor here used the tool before making an account and has no
 * idea that a "guest session" was ever a thing that existed, so the sentence
 * cannot mention one. It says what happened in their words: they had credits
 * before they signed up, and they still have them.
 */
function labelFor(row: LedgerRow): string {
  if (row.reason === 'adjustment') {
    if (row.endpoint === 'transfer_in') return 'Credits from before you signed up';
    if (row.endpoint === 'transfer_out') return 'Moved to your account';
  }

  return REASON_LABEL[row.reason] ?? row.reason;
}

export interface LedgerRow {
  id: number;
  delta: number;
  reason: string;
  /** Only ever set on a purchase row. What the customer actually paid. */
  price_cents: number | null;
  endpoint: string | null;
  input_kind: string | null;
  words_in: number | null;
  created_at: string;
}

export function CreditHistory({
  rows,
  from,
  page,
  hasOlder,
}: {
  rows: LedgerRow[];
  /** How many rows come before this page, for the "26 to 50" line. */
  from: number;
  page: number;
  hasOlder: boolean;
}) {
  const history = rows;

  return (
    <div>
      <h2 className={'text-foreground text-[15px] font-semibold tracking-[-0.01em]'}>
        History
      </h2>

      {history.length === 0 ? (
        <p className={'text-muted-foreground mt-2 text-[13.5px]'}>
          {page === 1
            ? 'Nothing yet. Your first sanitise will show up here.'
            : 'There is nothing this far back.'}
        </p>
      ) : (
        <ul className={'divide-border/70 mt-2 divide-y'}>
          {history.map((row) => (
            <li
              key={row.id}
              className={'flex items-baseline justify-between gap-4 py-2.5'}
            >
              <div className={'min-w-0'}>
                <p className={'text-foreground text-[13.5px] font-medium'}>
                  {labelFor(row)}
                  {row.reason === 'spend' && row.words_in ? (
                    <span className={'text-muted-foreground font-normal'}>
                      {' '}
                      · {row.words_in.toLocaleString('en-US')} words
                    </span>
                  ) : row.reason === 'spend' && row.input_kind === 'file' ? (
                    <span className={'text-muted-foreground font-normal'}>
                      {' '}
                      · file
                    </span>
                  ) : null}
                </p>
                <p className={'text-muted-foreground text-[11.5px]'}>
                  <LocalDate iso={row.created_at} />
                </p>
              </div>

              <span
                className={[
                  'shrink-0 font-mono text-[13px] font-medium tabular-nums',
                  row.delta > 0 ? 'text-emerald-700' : 'text-foreground',
                ].join(' ')}
              >
                {row.delta > 0 ? `+${row.delta}` : row.delta}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/*
        THE WAY BACK AND THE WAY FURTHER, and the sentence that says
        which part of the record is on screen.

        Ordinary links, not a button: this is a server-rendered page, so
        an older page of history costs nothing to build and needs no
        JavaScript to reach. It also means a customer can send themselves
        the link to a page of their own history, and the back button does
        what they expect.

        "Older" and "Newer" rather than "Next" and "Previous", because
        the list is in time order and those are the words a person uses
        about a list in time order.
      */}
      {history.length > 0 && (hasOlder || page > 1) ? (
        <div
          className={
            'border-border/70 mt-3 flex items-center justify-between gap-4 border-t pt-3'
          }
        >
          <p className={'text-muted-foreground text-[12px]'}>
            {(from + 1).toLocaleString('en-US')} to{' '}
            {(from + history.length).toLocaleString('en-US')}, newest
            first
          </p>

          <div className={'flex shrink-0 items-center gap-3'}>
            {page > 1 ? (
              <Link
                href={page === 2 ? '/home' : `/home?page=${page - 1}`}
                className={
                  'text-foreground text-[12.5px] font-semibold underline underline-offset-2'
                }
              >
                Newer
              </Link>
            ) : null}

            {hasOlder ? (
              <Link
                href={`/home?page=${page + 1}`}
                className={
                  'text-foreground text-[12.5px] font-semibold underline underline-offset-2'
                }
              >
                Older
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
