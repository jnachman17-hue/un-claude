'use client';

/**
 * THE AUTH FAILURE SCREENS, ALL AT ONCE. Added 23 August 2026, Lane E S-3.
 *
 * Same reason as /dev/states next door. Three of these four screens need a
 * particular account in a particular state on the HOSTED database to reach by
 * hand: an unconfirmed email address needs a real signup on the live project,
 * which would mint real credits into the live ledger, and a blocked captcha
 * needs Cloudflare to be unreachable. Neither belongs in a session working on
 * a site that is taking money.
 *
 * So they are rendered here with the real component, the real error strings
 * Supabase returns, the real stylesheet and the real widths. Nothing on this
 * page is a mock-up of the alert: it is `AuthErrorAlert` itself, handed the
 * text that arrives from auth.
 *
 * `CLAUDE.md` section 4: show the artefact, not a measurement of it.
 *
 * Development builds only, same guard as /dev/credits and /dev/states.
 */
import { AuthErrorAlert, ResendConfirmationButton } from '@kit/auth/shared';

/**
 * The upstream text, exactly as auth returns it. These are not invented: the
 * first three are Supabase's own messages, and the last is the shape of
 * everything that has no case of its own.
 */
const CASES: Array<{
  title: string;
  note: string;
  error: string;
  resend?: boolean;
}> = [
  {
    title: 'The email address was never confirmed',
    note: 'They signed up, the mail went to spam, they came back a week later. The most common signup problem there is.',
    error: 'Email not confirmed',
    resend: true,
  },
  {
    title: 'Cloudflare could not be reached, so the check never loaded',
    note: 'A pi-hole, a privacy extension, or a campus network that blocks challenges.cloudflare.com.',
    error: 'captcha protection: request disallowed (invalid-input-response)',
  },
  {
    title: 'The password was wrong',
    note: 'Unchanged. It already had a sentence of its own and still does.',
    error: 'Invalid login credentials',
  },
  {
    title: 'Anything else',
    note: 'The general bucket. This is the one that used to tell all four of these that their internet was broken.',
    error: 'unexpected_failure',
  },
];

export default function DevAuthErrors() {
  if (process.env.NODE_ENV !== 'development') {
    return (
      <main className={'mx-auto max-w-[640px] px-6 py-20'}>
        <p className={'text-muted-foreground text-[14px]'}>
          This page only renders on a development build.
        </p>
      </main>
    );
  }

  return (
    <main className={'mx-auto max-w-[560px] px-6 py-12'}>
      <h1 className={'mb-8 text-[20px] font-semibold'}>Auth failure screens</h1>

      {CASES.map((item) => (
        <section className={'mb-10'} key={item.title}>
          <h2
            className={
              'text-muted-foreground mb-1 text-[11px] font-semibold tracking-[0.08em] uppercase'
            }
          >
            {item.title}
          </h2>

          <p className={'text-muted-foreground mb-1 text-[12px]'}>
            {item.note}
          </p>

          <p className={'text-muted-foreground mb-3 font-mono text-[11px]'}>
            auth returns: {item.error}
          </p>

          <AuthErrorAlert
            error={item.error}
            action={
              item.resend ? (
                <ResendConfirmationButton email={'student@example.edu'} />
              ) : null
            }
          />
        </section>
      ))}
    </main>
  );
}
