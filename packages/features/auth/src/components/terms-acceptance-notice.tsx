import type React from 'react';

import Link from 'next/link';

import { Trans } from '@kit/ui/trans';

/**
 * THE ACCEPTANCE LINE. 21 August 2026.
 *
 * Until today nobody ever agreed to anything. There was no line under either
 * sign-up button, the starter's terms checkbox was switched off, and the only
 * route to the terms was a link in the footer. Every protective clause in that
 * document is only as strong as the acceptance behind it, and there was none.
 * Recorded as handoff 5.1 in docs/session-notes/legal-applied.md.
 *
 * ONE COMPONENT, USED IN BOTH PLACES, ON PURPOSE. Either sign-up button
 * creates an account, so both carry the same sentence in the same words. It
 * sits under the button rather than above it, so it is the last thing read
 * before the account is created.
 *
 * WHY NOT THE STARTER'S CHECKBOX, which exists behind
 * NEXT_PUBLIC_DISPLAY_TERMS_AND_CONDITIONS_CHECKBOX. Two reasons, both
 * decided by what the surface actually looks like:
 *
 *   1. It only renders inside the email and magic-link FORMS. The Google
 *      button is not a form and never sees it, so switching the flag on would
 *      have covered one of the two routes into an account and left the other
 *      exactly as it was.
 *   2. Turning it on as well as this would put two different acceptance
 *      mechanisms on one page, in two different grammars.
 *
 * The flag is therefore deliberately left off. See docs/session-notes/
 * auth-surface.md if it is ever reconsidered.
 */
export function TermsAcceptanceNotice() {
  return (
    <p
      data-test={'terms-acceptance-notice'}
      className={'text-muted-foreground text-center text-xs leading-relaxed'}
    >
      <Trans
        i18nKey={'auth.termsAcceptanceNotice'}
        components={{
          /*
           * The link TEXT lives in the message, not here, and the tags are
           * paired rather than self-closing. next-intl parses `<Tag />` as
           * literal text and prints it, which is how the starter's older
           * `acceptTermsAndConditions` string is written and why it would
           * have shown `<TermsOfServiceLink/>` on the page verbatim. Paired
           * tags also keep the whole sentence, links included, in one string
           * a translator can move words around in.
           */
          TermsOfServiceLink: (chunks: React.ReactNode) => (
            <Link
              target={'_blank'}
              className={'hover:text-foreground underline underline-offset-2'}
              href={'/terms-of-service'}
            >
              {chunks}
            </Link>
          ),
          PrivacyPolicyLink: (chunks: React.ReactNode) => (
            <Link
              target={'_blank'}
              className={'hover:text-foreground underline underline-offset-2'}
              href={'/privacy-policy'}
            >
              {chunks}
            </Link>
          ),
        }}
      />
    </p>
  );
}
