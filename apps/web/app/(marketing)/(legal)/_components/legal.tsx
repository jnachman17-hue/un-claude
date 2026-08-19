/**
 * Shared shells for the three legal pages, so they cannot drift apart.
 *
 * These pages replaced the starter kit's stub, which shipped the literal string
 * "Your terms of service content here" on all three, privacy policy included.
 * That was live to the public.
 *
 * Every claim in them is checkable against this repository: clean.py, the route
 * handlers, the Supabase schema and free-uses.ts. Nothing here is aspirational.
 * If a claim stops being true, the page changes in the SAME deployment as the
 * change that made it false. 06 row 46.
 */

export function Updated({ date }: { date: string }) {
  return (
    <p className={'text-muted-foreground mb-10 text-[13px]'}>Last updated: {date}</p>
  );
}

export function H2({ children }: React.PropsWithChildren) {
  return (
    <h2
      className={
        'text-foreground mt-10 mb-3 text-[19px] leading-snug font-semibold tracking-[-0.02em] first:mt-0'
      }
    >
      {children}
    </h2>
  );
}

export function P({ children }: React.PropsWithChildren) {
  return (
    <p className={'text-muted-foreground mb-4 max-w-[68ch] text-[15px] leading-[1.7]'}>
      {children}
    </p>
  );
}

/** For the one paragraph on each page that must not be skimmed past. */
export function Lead({ children }: React.PropsWithChildren) {
  return (
    <p
      className={
        'text-foreground border-mark-strong mb-4 max-w-[68ch] border-l-2 pl-4 text-[15px] leading-[1.7] font-medium'
      }
    >
      {children}
    </p>
  );
}

export function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className={'mb-4 max-w-[68ch] space-y-2'}>
      {items.map((item, index) => (
        <li
          key={index}
          className={'text-muted-foreground relative pl-5 text-[15px] leading-[1.7]'}
        >
          <span className={'bg-foreground/30 absolute top-[0.65em] left-0 size-[5px] rounded-full'} />
          {item}
        </li>
      ))}
    </ul>
  );
}

/** Wide content scrolls inside its own box rather than the page scrolling. */
export function Table({
  headings,
  rows,
}: {
  headings: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className={'border-border/70 mb-5 max-w-[68ch] overflow-x-auto rounded-[12px] border'}>
      <table className={'w-full min-w-[520px] border-collapse text-left'}>
        <thead>
          <tr className={'bg-foreground/[0.025]'}>
            {headings.map((heading) => (
              <th
                key={heading}
                className={
                  'text-muted-foreground px-4 py-2.5 text-[11px] font-medium tracking-wide uppercase'
                }
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={'divide-border/70 divide-y'}>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={[
                    'px-4 py-3 align-top text-[13.5px] leading-snug',
                    cellIndex === 0 ? 'text-foreground font-medium' : 'text-muted-foreground',
                  ].join(' ')}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Mail() {
  return (
    <a
      href={'mailto:unclaudeapp@gmail.com'}
      className={'text-foreground font-medium underline underline-offset-2'}
    >
      unclaudeapp@gmail.com
    </a>
  );
}

export function Prose({ children }: React.PropsWithChildren) {
  return <div className={'container mx-auto max-w-[1180px] px-5 py-10 sm:px-8'}>{children}</div>;
}
