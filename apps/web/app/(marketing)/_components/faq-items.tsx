import Link from 'next/link';

/**
 * The questions and answers, in one place, 20 August 2026.
 *
 * WHY THIS FILE EXISTS. The words were split out of `faq-section.tsx` when the
 * FAQ was rendered on two surfaces at once. THE STANDALONE /faq ROUTE IS GONE
 * AGAIN, 20 August 2026, at Jon's instruction: see `04` entry 102. The array
 * stays here anyway, because it is the words rather than the markup, and the
 * landing page section is now its only reader.
 *
 * `a` is the answer as plain text and is the single source of the words.
 * `render` exists only for the one answer that carries a link, and says the
 * same words.
 *
 * Every answer here is governed by the claims boundary in
 * .claude/skills/unclaude-messaging: confident on the two provable layers,
 * measured-and-imminent on the third, nothing explicitly false anywhere.
 */
export interface FaqItem {
  q: string;
  a: string;
  render?: React.ReactNode;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: 'Can my school or employer detect Claude’s watermark today?',
    a: 'For files, yes. For text, not yet. Anthropic’s text detector is not open yet, and the company has committed to releasing one imminently. The day it opens, anyone can check, and text that is already marked stays marked. We will be running our own sanitised output against Anthropic’s API from the day it opens, to verify our sanitisation works on every run.',
  },
  {
    q: 'What can you actually guarantee?',
    a: 'Two of the three layers, completely. Hidden characters and metadata are found, counted, removed and verified: we show you exactly what was in your file, and prove it is gone. The third layer, the statistical watermark in the word choices themselves, is different. It is present in everything Claude writes and in Gemini’s text too, no tool on earth can currently detect it, and so nobody can verify its removal, including us. We target it with an engine built for that one job: it dismantles the word sequences the mark rides on, holds every fact and your original length, and hands you the measurements from each run.',
  },
  {
    q: 'Why can’t I just ask another AI to reword it?',
    a: 'Because a generic rewrite protects exactly the wrong thing. Ask any model to reword and it hands your text back mildly altered, and unbroken runs of your original wording are precisely where the statistical watermark lives. In our tests generic rewrites left those runs intact, came back around a third shorter, and silently dropped facts. Ours is a purpose-built engine, not a prompt: it works to a three-word limit on what carries over, routed through a model that is not Claude so the mark cannot be reapplied mid-rewrite, every number, date and name checked against your original with a retry if one drifts, and length held within a tenth. Quotations and references are protected on purpose and come back exactly as you sent them. Across our test set it breaks over 90% of three-word sequences with zero figures lost, and every run hands you the numbers for your own document.',
  },
  {
    q: 'How do I know the rewrite actually worked?',
    a: 'Nobody can verify the removal of a statistical watermark yet, and any tool that claims otherwise is lying to you and selling a fraudulent product. What we give you is measured: every run returns the share of your wording replaced, the longest run of your original wording still standing, and every figure checked. The mark rides only on unbroken runs of your wording, so those are the numbers that describe the work. Read them together with what we protected: quotations and references come back exactly as you sent them, so they count towards that longest run by design.',
  },
  {
    q: 'Will it change my meaning, my facts, or my numbers?',
    a: 'No, and this is enforced rather than promised. Every number, date and name is checked against your original and the section retries if one drifts. Length is held within a tenth, and the receipt shows the figures carried through.',
  },
  {
    q: 'Is using Un-Claude cheating?',
    a: 'Un-Claude removes marks that AI companies place inside your work, invisibly, without asking you and without telling you. What you then submit, publish or send is your call and your responsibility, under whatever rules you have agreed to. Where we stand on the marking itself is on the mission page.',
    render: (
      <>
        Un-Claude removes marks that AI companies place inside your work,
        invisibly, without asking you and without telling you. What you then
        submit, publish or send is your call and your responsibility, under
        whatever rules you have agreed to. Where we stand on the marking itself
        is on the{' '}
        <Link
          href={'/mission'}
          className={'text-foreground underline decoration-1 underline-offset-2'}
        >
          mission page
        </Link>
        .
      </>
    ),
  },
  {
    q: 'What happens to my document after I upload it?',
    a: 'It is processed and deleted. Uploads are held for the length of the request and removed when the response is sent. Nothing you paste or upload is stored.',
  },
  {
    q: 'What about Word documents and PDFs?',
    a: 'Upload a Word document and we clean its hidden characters and metadata. For the statistical rewrite, paste the text itself into the box, and paste it back into your document when it is done. More file types are coming soon.',
  },
  {
    q: 'What if the scan finds nothing?',
    a: 'Then your text or file is clean of hidden characters and metadata, and that is a real answer rather than a failed scan. The statistical watermark is the exception: no tool can show or count it yet, which is why it is not found at all but targeted, by an engine built to break the word sequences it rides on.',
  },
];
