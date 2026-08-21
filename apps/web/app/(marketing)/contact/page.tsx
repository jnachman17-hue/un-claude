import { ContactForm } from '../_components/contact-form';
import { PageHeader } from '../_components/prose';

export const metadata = {
  title: 'Contact',
  description:
    'Reach Un-Claude. Email us directly, or write a subject and message here and send it from your own mail app.',
};

/**
 * Contact, 20 August 2026, at Jon's instruction. `04` entry 104.
 *
 * IT IS DELIBERATELY THE SMALLEST PAGE ON THE SITE. A contact page has one
 * job, and a visitor who reached it has already decided to write to us: there
 * is nothing left to sell here, so there is no CTA band and no argument. The
 * address, the form, and out.
 */
function ContactPage() {
  return (
    <div className={'flex flex-col'}>
      <PageHeader
        title={'Talk to us.'}
        standfirst={
          'A question about a scan, a file we would not take, a bill, or anything else. One person reads this inbox, so write plainly and we will answer the same way.'
        }
      />

      <section>
        <div className={'mx-auto max-w-[1180px] px-5 py-14 sm:px-8'}>
          <ContactForm />
        </div>
      </section>
    </div>
  );
}

export default ContactPage;
