'use client';

import Link from 'next/link';
import { useState } from 'react';

/**
 * The contact form, 20 August 2026. `04` entry 104, rebuilt the same day
 * against a layout Jon supplied, entry 105.
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
 * may get nothing when they press the button. That is why the address also sits
 * beside the button as a plain link. When Jon wants a true server send, this
 * component becomes a POST to a route handler and the layout does not change.
 *
 * WHY SUBJECT AND MESSAGE RATHER THAN EMAIL AND NAME. The reference layout
 * collects the sender's address, which a real form needs in order to reply to
 * anyone. A mailto does not: the address is whatever account their mail app
 * sends from, so a "your email" box here would either do nothing or be pasted
 * into the body of a mail that already carries it. Subject and message are the
 * two fields a draft actually needs, and two fields is also less to scroll.
 */
const CONTACT_EMAIL = 'support@un-claude.com';

const fieldClass =
  'bg-card text-foreground ring-border/70 placeholder:text-muted-foreground/60 focus:ring-foreground/25 w-full rounded-[10px] px-3.5 py-2.5 text-[15px] ring-1 outline-none transition-shadow focus:ring-2';

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
    <div className={'mt-9 flex flex-col gap-5'}>
      <label className={'flex flex-col gap-2'}>
        <span className={'text-foreground text-[14px] font-medium'}>
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
        <span className={'text-foreground text-[14px] font-medium'}>
          Your message
        </span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={7}
          placeholder={
            'A question about a scan, a file we would not take, a bill, or anything else.'
          }
          className={`${fieldClass} resize-y leading-[1.6]`}
        />
      </label>

      {/*
        The button and the address share one row on a wide screen and stack on a
        phone. `gap-x-6 gap-y-3` rather than `justify-between` on the stacked
        axis, so the address sits under the button at 375px instead of being
        pushed to the far edge of the column.
      */}
      <div
        className={
          'flex flex-col items-start gap-x-6 gap-y-3.5 sm:flex-row sm:items-center sm:justify-between'
        }
      >
        {/*
          An anchor rather than a button, so a phone hands it to the mail app
          the same way it handles the address beside it. Dropping `href` and
          setting `aria-disabled` keeps an empty message from opening a blank
          draft without making the control disappear.
        */}
        <a
          href={ready ? href : undefined}
          aria-disabled={!ready}
          className={
            ready
              ? 'bg-foreground text-background inline-flex w-full items-center justify-center rounded-full px-7 py-3 text-[14.5px] font-semibold transition-transform active:scale-[0.98] sm:w-auto'
              : 'bg-foreground/20 text-background pointer-events-none inline-flex w-full items-center justify-center rounded-full px-7 py-3 text-[14.5px] font-semibold sm:w-auto'
          }
        >
          Send message
        </a>

        <p className={'text-muted-foreground text-[13.5px]'}>
          Or email{' '}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className={
              'text-foreground underline decoration-1 underline-offset-2'
            }
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </div>

      {/*
        THE PRIVACY LINE, and it is worded for a mailto rather than for a form.
        This page collects nothing: the button hands a draft to the visitor's
        own mail app, so there is no submission to store and their address
        arrives in the mail headers rather than from a box on this page. The
        promise that matters is therefore about the mail once it reaches us,
        which is what the linked policy now covers under "When you write to us".
      */}
      <p className={'text-muted-foreground max-w-[62ch] text-[13.5px] leading-[1.6]'}>
        Nothing is sent from this page and nothing you type here is stored. Your
        address is used to reply and nothing else. The{' '}
        <Link
          href={'/privacy-policy'}
          className={'text-foreground underline decoration-1 underline-offset-2'}
        >
          privacy policy
        </Link>{' '}
        covers what happens to it.
      </p>
    </div>
  );
}
