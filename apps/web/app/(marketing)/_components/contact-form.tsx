'use client';

import { useState } from 'react';

/**
 * The contact form, 20 August 2026. `04` entry 104.
 *
 * IT IS A MAILTO COMPOSITION, NOT A SEND, AND THAT IS DELIBERATE. This
 * monorepo has no mailer package and no mail credentials: `packages/` holds
 * features, i18n, next, shared, supabase and ui, and nothing in `.env` names an
 * SMTP host or a mail provider. Wiring a real send would mean adding a
 * dependency and a paid key, and `CLAUDE.md` section 5 says that is Jon's call
 * rather than a session's. So the button opens the visitor's own mail client
 * with the address, subject and message already filled in, which needs no
 * backend, no key and no dependency.
 *
 * THE TRADEOFF, so the next session does not rediscover it: a visitor with no
 * mail client configured, which is common on a phone with only a webmail app,
 * may get nothing when they press the button. That is why the address is
 * printed in full above this form and is selectable, rather than hidden behind
 * the button. When Jon wants a true server send, this component becomes a POST
 * to a route handler and nothing else on the page changes.
 */
const CONTACT_EMAIL = 'help@unclaudeapp.com';

const fieldClass =
  'bg-card text-foreground ring-border/70 placeholder:text-muted-foreground/70 focus:ring-foreground/30 w-full rounded-[10px] px-3.5 py-2.5 text-[15px] ring-1 outline-none transition-shadow focus:ring-2';

export function ContactForm() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  /*
   * `encodeURIComponent` on both, because a subject line with an ampersand or a
   * hash in it would otherwise truncate the body silently.
   */
  const href =
    `mailto:${CONTACT_EMAIL}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(message)}`;

  const ready = subject.trim().length > 0 && message.trim().length > 0;

  return (
    <div className={'max-w-[46rem]'}>
      <p className={'text-muted-foreground text-[15px] leading-[1.7]'}>
        The fastest way to reach us is straight to the inbox.
      </p>

      <a
        href={`mailto:${CONTACT_EMAIL}`}
        className={
          'text-foreground mt-2 inline-block text-[19px] font-semibold tracking-[-0.02em] break-all underline decoration-1 underline-offset-[3px] sm:text-[22px]'
        }
      >
        {CONTACT_EMAIL}
      </a>

      <div className={'border-border/70 mt-9 border-t pt-9'}>
        <h2
          className={
            'text-foreground text-[20px] leading-[1.15] font-semibold tracking-[-0.022em]'
          }
        >
          Or write it here.
        </h2>
        <p
          className={
            'text-muted-foreground mt-2 max-w-[52ch] text-[15px] leading-[1.65]'
          }
        >
          Fill this in and the button opens your own mail app with the message
          ready to send. Nothing is sent from this page, and nothing you type
          here is stored.
        </p>

        <div className={'mt-6 flex flex-col gap-4'}>
          <label className={'flex flex-col gap-2'}>
            <span className={'text-foreground text-[13.5px] font-medium'}>
              Subject
            </span>
            <input
              type={'text'}
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder={'What is this about?'}
              className={fieldClass}
            />
          </label>

          <label className={'flex flex-col gap-2'}>
            <span className={'text-foreground text-[13.5px] font-medium'}>
              Message
            </span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={7}
              placeholder={'Tell us what you need.'}
              className={`${fieldClass} resize-y leading-[1.6]`}
            />
          </label>

          {/*
            An anchor rather than a button, so a phone hands it to the mail app
            the same way it handles the address above. `aria-disabled` and the
            removed `href` keep an empty message from opening a blank draft
            without making the control disappear.
          */}
          <a
            href={ready ? href : undefined}
            aria-disabled={!ready}
            className={
              ready
                ? 'bg-foreground text-background inline-flex w-full items-center justify-center rounded-[10px] px-4 py-3 text-[14px] font-semibold transition-transform active:scale-[0.98] sm:w-auto sm:self-start'
                : 'bg-foreground/25 text-background pointer-events-none inline-flex w-full items-center justify-center rounded-[10px] px-4 py-3 text-[14px] font-semibold sm:w-auto sm:self-start'
            }
          >
            Open in my mail app
          </a>
        </div>
      </div>
    </div>
  );
}
