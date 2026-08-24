import { ContactForm } from '../_components/contact-form';

import { shareTags } from '~/lib/share-tags';

/**
 * Written once and used twice: the browser tab and the share preview must
 * not be able to drift apart.
 */
const DESCRIPTION =
  'Reach Un-Claude. Write a subject and a message here and send it from your own mail app, or email us directly.';

export const metadata = {
  title: 'Contact',
  description: DESCRIPTION,
  alternates: { canonical: '/contact' },
  ...shareTags({
    title: 'Contact',
    description: DESCRIPTION,
    path: '/contact',
  }),
};

/**
 * Contact, 20 August 2026, at Jon's instruction. `04` entry 104, rebuilt the
 * same day against a layout he supplied, entry 105.
 *
 * IT IS DELIBERATELY THE SMALLEST PAGE ON THE SITE, and the first build was
 * not small enough. Gone: the shared `PageHeader`, which is a full-bleed
 * bordered band sized for a reading page and pushed the first field below the
 * fold, and the rules that split the address off from the form. What is left is
 * one column, one heading, two fields, and the row that sends it. A visitor who
 * reached contact has already decided to write to us, so there is nothing to
 * sell here and no reason to make them scroll.
 */
function ContactPage() {
  return (
    <section>
      <div className={'mx-auto max-w-[46rem] px-5 py-12 sm:px-8 sm:py-16'}>
        <h1
          className={
            'text-foreground text-[32px] leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:text-[38px]'
          }
        >
          Get in touch
        </h1>

        <p
          className={
            'text-muted-foreground mt-3 max-w-[54ch] text-[16px] leading-[1.6]'
          }
        >
          Ask anything about Un-Claude, tell us a question this site should
          answer, or say something else entirely. Every message is read.
        </p>

        <ContactForm />
      </div>
    </section>
  );
}

export default ContactPage;
