/**
 * Shared shells for the reading pages, so the three of them cannot drift apart.
 */
export function PageHeader({
  eyebrow,
  title,
  standfirst,
}: {
  eyebrow?: string;
  title: string;
  standfirst: string;
}) {
  return (
    <header className={'border-border/70 border-b'}>
      <div className={'mx-auto max-w-[1180px] px-5 py-11 sm:px-8 sm:py-16 lg:py-20'}>
        {eyebrow ? (
          <p className={'text-muted-foreground mb-4 text-[12px] font-medium tracking-wide uppercase'}>
            {eyebrow}
          </p>
        ) : null}

        <h1
          className={
            'text-foreground max-w-[20ch] text-[34px] leading-[1.06] font-semibold tracking-[-0.032em] text-balance sm:text-[44px] lg:text-[52px]'
          }
        >
          {title}
        </h1>

        <p className={'text-muted-foreground mt-5 max-w-[62ch] text-[16px] leading-[1.65]'}>
          {standfirst}
        </p>
      </div>
    </header>
  );
}

export function Section({
  title,
  children,
  aside,
}: React.PropsWithChildren<{ title: string; aside?: React.ReactNode }>) {
  return (
    <section className={'border-border/70 border-b'}>
      <div className={'mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14'}>
        <div className={'grid gap-8 lg:grid-cols-12 lg:gap-14'}>
          <div className={'lg:col-span-4'}>
            <h2
              className={
                'text-foreground text-[22px] leading-[1.15] font-semibold tracking-[-0.024em] text-balance sm:text-[26px] lg:sticky lg:top-24'
              }
            >
              {title}
            </h2>
          </div>

          <div className={'lg:col-span-8'}>
            <div
              className={
                'text-muted-foreground max-w-[68ch] space-y-4 text-[15px] leading-[1.7] [&_strong]:text-foreground [&_strong]:font-medium'
              }
            >
              {children}
            </div>

            {aside ? <div className={'mt-8'}>{aside}</div> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Figure({
  children,
  caption,
}: React.PropsWithChildren<{ caption: string }>) {
  return (
    <figure className={'bg-card ring-border/70 overflow-hidden rounded-[16px] ring-1'}>
      <div className={'bg-foreground/[0.014] flex justify-center p-6'}>{children}</div>
      <figcaption
        className={'border-border/70 text-muted-foreground border-t px-5 py-3 text-[12.5px] leading-snug'}
      >
        {caption}
      </figcaption>
    </figure>
  );
}
