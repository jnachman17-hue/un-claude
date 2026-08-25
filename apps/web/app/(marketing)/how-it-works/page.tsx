import {
  ArrowDownIcon,
  CheckIcon,
  ClockIcon,
  EyeOffIcon,
  FingerprintIcon,
  PaperclipIcon,
} from 'lucide-react';

import { CtaBand } from '../_components/cta-band';
import { FileProvenanceDiagram } from '../_components/diagrams/file-provenance';
import { HiddenCharactersDiagram } from '../_components/diagrams/hidden-characters';
import { StatisticalWatermarkDiagram } from '../_components/diagrams/statistical-watermark';
import { MobileDisclosure } from '../_components/mobile-disclosure';
import { PageHeader } from '../_components/prose';

import { shareTags } from '~/lib/share-tags';

/**
 * Written once and used twice: the browser tab and the share preview must
 * not be able to drift apart.
 */
const DESCRIPTION =
  'Three kinds of AI watermark, where each hides, and what Un-Claude does to each: found and counted, stripped and byte verified, or sanitised by rewrite.';

export const metadata = {
  title: 'How it works',
  description: DESCRIPTION,
  alternates: { canonical: '/how-it-works' },
  ...shareTags({
    title: 'How it works',
    description: DESCRIPTION,
    path: '/how-it-works',
  }),
};

const ANTHROPIC_POST = 'https://www.anthropic.com/news/claude-text-watermark';

/**
 * The technical explanation, rebuilt 20 August 2026 on Jon's order: less text,
 * more visuals, one grammar per repeated element, and the same visual language
 * as the landing page. The old version was six prose sections in a sticky
 * two-column shell; this one is a map, three identical panels, a proof ladder,
 * and a route back to the tool.
 *
 * Sourced from ENGINE.md throughout. The claims boundary is
 * .claude/skills/unclaude-messaging: fully confident on hidden characters and
 * metadata, engineering-and-measurement on the statistical rewrite, "three
 * words in a row" rather than "runs" (04 entry 81), no em dashes, and the
 * detector described as imminent rather than absent (04 entry 80).
 */

/**
 * One row per mark, one grammar: name, where it hides, what happens to it.
 * Each row anchors to its panel below.
 */
const MAP = [
  {
    id: 'hidden-characters',
    icon: EyeOffIcon,
    name: 'Hidden characters',
    where: 'Invisible characters sitting between the ones you can see',
    outcome: 'Deleted and counted',
  },
  {
    id: 'metadata',
    icon: PaperclipIcon,
    name: 'Metadata',
    where: 'A record inside the file’s wrapper saying what made it',
    outcome: 'Stripped, byte verified',
  },
  {
    id: 'statistical-watermark',
    icon: FingerprintIcon,
    name: 'Statistical watermark',
    where: 'The choice of the words themselves',
    outcome: 'Sanitised by an engineered rewrite',
  },
] as const;

/**
 * The engine rules, each with the reason it exists. Sourced from ENGINE.md
 * section 3 and the measured figures already ratified for the landing FAQ.
 */
const ENGINE_RULES = [
  /*
   * WAS "Three words in a row, maximum", and it was the site's most exposed
   * false claim: runs of up to 388 words have been measured in a delivered
   * document. Three is the limit the engine WORKS TO — ENGINE.md section 3
   * rule 3, "no runs of more than three consecutive words, SUBJECT TO RULES 1
   * AND 2" — and holding your facts and your length both outrank it. So it is
   * a rule, stated as a rule, and never a promise about a reader's document.
   *
   * The "over 90%" figure came off with it. It is a test-set average that
   * predates the quotation freeze, and the only measurement taken since the
   * freeze shipped contradicts it on the model the engine lane recommends.
   * See docs/session-notes/tell-the-truth-about-runs.md section 3.
   */
  {
    head: 'Break the runs',
    body: 'The signature travels only in unbroken runs of your original wording. The engine rebuilds those runs wherever it rewrites, working to a three-word limit, and protects your quotations and references rather than rewording them.',
  },
  {
    head: 'Never rewritten by Claude',
    body: 'The rewrite runs through a model that does not watermark its own output. Rewriting Claude’s text with Claude would stamp the mark straight back in.',
  },
  {
    head: 'Facts held, character for character',
    body: 'Every number, date and name is checked against your original, and the section retries if one drifts. Zero figures lost across our test set.',
  },
  {
    head: 'Length held',
    body: 'The result stays within about a tenth of your original length, because condensing is how rewrites actually lose facts.',
  },
] as const;

function HowItWorks() {
  return (
    <div className={'flex flex-col'}>
      <PageHeader
        title={'Where an AI watermark actually hides.'}
        standfirst={
          'There are three kinds of AI watermark, in three separate places, and each one comes out a different way. This page shows you where each mark sits and exactly what we do to it.'
        }
      />

      {/* The map. Three rows teach the three names before anything uses them. */}
      <section className={'border-border/70 border-b'}>
        <div className={'mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14'}>
          <div className={'grid gap-8 lg:grid-cols-12 lg:gap-14'}>
            <div className={'lg:col-span-4'}>
              <h2
                className={
                  'text-foreground text-[24px] leading-[1.15] font-semibold tracking-[-0.024em] text-balance sm:text-[28px]'
                }
              >
                Three marks, three places.
              </h2>
              {/* WHICH INPUT GETS WHICH MARK, said by type. "Upload a file
                  and all three do" was false of every file type we accept:
                  a Word document gets hidden characters and metadata and is
                  never rewritten, and a picture has no text at all. The
                  matrix on /capabilities has been right about this all
                  along; this sentence was not. F1 audit, finding M. */}
              <p className={'text-muted-foreground mt-3 max-w-[40ch] text-[15px] leading-[1.6]'}>
                Paste text, or upload a text file, and you get hidden
                characters and the statistical watermark. A Word document gets
                hidden characters and metadata. A picture gets metadata alone.
              </p>
            </div>

            <div className={'lg:col-span-8'}>
              <ul className={'border-border/70 divide-border/70 divide-y overflow-hidden rounded-[14px] border'}>
                {MAP.map((mark) => (
                  <li key={mark.id}>
                    <a
                      href={`#${mark.id}`}
                      className={
                        'hover:bg-foreground/[0.014] grid grid-cols-[auto_1fr] items-start gap-x-3.5 gap-y-1.5 px-4 py-4 transition-colors sm:grid-cols-[auto_1fr_auto] sm:items-center sm:px-5'
                      }
                    >
                      <span
                        className={
                          'bg-mark text-mark-foreground mt-[2px] grid size-[30px] shrink-0 place-items-center rounded-[9px] sm:mt-0'
                        }
                      >
                        <mark.icon className={'size-[15px]'} strokeWidth={1.9} aria-hidden />
                      </span>

                      <span className={'min-w-0'}>
                        <span className={'text-foreground block text-[14.5px] font-semibold tracking-[-0.012em]'}>
                          {mark.name}
                        </span>
                        <span className={'text-muted-foreground block text-[12.5px] leading-snug'}>
                          {mark.where}
                        </span>
                      </span>

                      <span
                        className={
                          'text-foreground col-start-2 inline-flex items-center gap-1.5 text-[12.5px] font-medium sm:col-start-3'
                        }
                      >
                        {mark.outcome}
                        <ArrowDownIcon
                          className={'text-muted-foreground size-[13px]'}
                          strokeWidth={2}
                          aria-hidden
                        />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* The three panels, one grammar. The statistical panel earns an extra
          band underneath, because the rewrite is the engineering story. */}
      <section className={'border-border/70 border-b'}>
        <div className={'mx-auto max-w-[1180px] space-y-5 px-5 py-10 sm:px-8 sm:py-14'}>
          <LayerPanel
            id={'hidden-characters'}
            icon={EyeOffIcon}
            title={'Hidden characters'}
            lede={'Real characters, drawn as nothing at all.'}
            paragraphs={[
              'Between the letters you can read, text can carry characters that display as nothing at all: invisible spaces, joiners, direction marks. They hold real positions in your text, and they travel with it through every copy and paste.',
              'Many AI tools emit them, embedded in what you paste without you ever seeing it, and anyone who knows to look can check for them in seconds. They are the easiest tell to catch, and the easiest to remove completely.',
            ]}
            checks={[
              'Nine classes of invisible character checked on every scan',
              'Each one named, with its exact position in your text',
              'Read back afterwards to confirm none remain',
            ]}
            status={'Free, on every scan.'}
            diagram={<HiddenCharactersDiagram className={'h-auto w-full max-w-[440px]'} />}
            caption={
              'A hidden character takes a real position in the sentence and is drawn as nothing. We name it, point at it, and delete it.'
            }
          />

          <LayerPanel
            id={'metadata'}
            icon={PaperclipIcon}
            title={'Metadata'}
            lede={'A signed record in the file’s wrapper, not in the content.'}
            paragraphs={[
              'Every file carries a wrapper that describes it: what made it, when, with what. When an AI tool generates a file, it writes a record into that wrapper naming itself. Claude does it, and so do OpenAI, Google, Adobe and the rest, most of them behind one shared industry format called C2PA.',
              'We strip that record, along with EXIF, XMP and generator tags, then read the file back to confirm nothing is left. Your picture or document comes out byte for byte identical, and on a file Claude made, this is Claude’s mark coming off, with proof.',
            ]}
            checks={[
              'C2PA credentials, EXIF, XMP and generator tags removed',
              'The picture or document returned byte for byte identical',
              'The file re-read afterwards to prove it is clean',
            ]}
            status={'Needs a file. Pasted text has no wrapper to read.'}
            diagram={<FileProvenanceDiagram className={'h-auto w-full max-w-[440px]'} />}
            caption={
              'The mark is not in the picture. It sits in the record attached to it, so removing it changes no pixel.'
            }
          />

          <LayerPanel
            id={'statistical-watermark'}
            icon={FingerprintIcon}
            title={'The statistical watermark'}
            lede={'Nothing is added to your text. The mark is the words themselves.'}
            paragraphs={[
              'This is the mark Claude, and others, apply to text itself: the one in the news, and the one nobody can point at, because nothing is inserted at any point. Here is the trick. As a model writes, it constantly reaches words where several options would read equally well: the sky was grey, overcast, gloomy. A normal model just picks one. A watermarking model hands that pick to a secret key, every time. Each choice reads naturally on its own, but across a few hundred words the picks line up into a hidden pattern, and whoever holds the key can test any text for it.',
              'That pattern lives only in unbroken stretches of the original words, which is why you cannot beat it by swapping synonyms or asking a chatbot to reword: a casual rewrite leaves long stretches of the original untouched, and every one of them still carries the signature. Beating it takes an engine built for this one job, one that dismantles the word sequences the mark rides on. That is what we built, and its rules are below.',
            ]}
            checks={[
              'Survives copy, paste, reformatting and light editing',
              'Invisible to you, testable by whoever holds the key',
              'Carried only by unbroken stretches of the original words',
            ]}
            checksLabel={'What makes it hard'}
            status={
              /*
                THE QUOTE IS TRIMMED, at Jon's instruction. The full sentence
                ("Light editing probably won't remove the watermark completely;
                a complete rewrite where every word is replaced will") invites
                the wrong conclusion: a visitor reads "a rewrite will" and
                thinks any chatbot reword qualifies. The kept fragment names
                the bar, a complete rewrite, and the sentence after it does the
                differentiating work: a casual reword is nowhere near that bar.
                The link goes to the full sentence, and nothing is quoted out
                of its meaning.
              */
              <>
                Anthropic&rsquo;s own words: a{' '}
                <a
                  href={ANTHROPIC_POST}
                  target={'_blank'}
                  rel={'noreferrer'}
                  className={'text-foreground underline decoration-1 underline-offset-2'}
                >
                  &ldquo;complete rewrite where every word is replaced&rdquo;
                </a>{' '}
                defeats the mark. A casual reword never comes close to that
                bar. The engine below was built for it.
              </>
            }
            diagram={<StatisticalWatermarkDiagram className={'h-auto w-full max-w-[440px]'} />}
            caption={
              'A secret key makes the pick between words that read equally well. The pattern of picks is the mark, and it rides only on your words in a row.'
            }
            band={
              <div>
                <h3 className={'text-foreground text-[17px] font-semibold tracking-[-0.016em]'}>
                  The rewrite, rule by rule
                </h3>
                <p className={'text-muted-foreground mt-1.5 max-w-[62ch] text-[13.5px] leading-[1.6]'}>
                  Why can&rsquo;t another AI do this? Because a generic model
                  protects exactly the wrong thing: long stretches of your
                  original wording, which is where the mark lives. This engine
                  was built against the mark, and every rule exists because of
                  it.
                </p>

                <div className={'mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2'}>
                  {ENGINE_RULES.map((rule) => (
                    <div key={rule.head}>
                      <h4 className={'text-foreground text-[14px] font-semibold tracking-[-0.012em]'}>
                        {rule.head}
                      </h4>
                      <p className={'text-muted-foreground mt-1 text-[13px] leading-[1.6]'}>
                        {rule.body}
                      </p>
                    </div>
                  ))}
                </div>

                <p className={'text-muted-foreground border-border/70 mt-5 border-t pt-4 text-[13px] leading-[1.6]'}>
                  <span className={'text-foreground font-medium'}>
                    Every run returns a receipt:
                  </span>{' '}
                  the share of your wording replaced, the longest stretch of
                  your original words still standing, every figure accounted
                  for, and how much of your length was kept.
                </p>
              </div>
            }
          />
        </div>
      </section>

      {/* Where proof stands. Confident about the two provable layers, precise
          and imminent about the third. */}
      <section className={'border-border/70 border-b'}>
        <div className={'mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14'}>
          <div className={'grid gap-8 lg:grid-cols-12 lg:gap-14'}>
            <div className={'lg:col-span-4'}>
              <h2
                className={
                  'text-foreground text-[24px] leading-[1.15] font-semibold tracking-[-0.024em] text-balance sm:text-[28px]'
                }
              >
                Where proof stands.
              </h2>
              <p className={'text-muted-foreground mt-3 max-w-[40ch] text-[15px] leading-[1.6]'}>
                Two of the three are provable to the byte, today. The third
                becomes checkable the day Anthropic opens its detector, and
                that day is coming.
              </p>
            </div>

            <div className={'lg:col-span-8'}>
              <ul className={'divide-border/70 divide-y'}>
                <ProofRow
                  state={'proven'}
                  name={'Hidden characters'}
                  detail={'Proven on every run. Found, counted, removed, and read back.'}
                />
                <ProofRow
                  state={'proven'}
                  name={'Metadata'}
                  detail={'Proven on every run. Verified against the raw bytes of your file.'}
                />
                <ProofRow
                  state={'measured'}
                  name={'Statistical rewrite'}
                  detail={
                    'Measured on every run. Everything a rewrite can do to defeat this mark, the engine does: it dismantles the word sequences the mark rides on, holds every fact and your length, and hands you the numbers. The one word we hold back is verified, because nobody can check a text watermark until Anthropic opens its public detector. The day it opens, we run every job against it.'
                  }
                />
              </ul>

              {/*
                The quotation and PDF caveats came off at Jon's instruction:
                both are stated where they belong, on /capabilities and in the
                FAQ, and this section's job is proof, not scope.
              */}
              <div className={'border-border/70 mt-8 border-t pt-6'}>
                <p className={'text-muted-foreground max-w-[68ch] text-[14px] leading-[1.65]'}>
                  <span className={'text-foreground font-medium'}>Measured on real documents.</span>{' '}
                  Many documents, from 1,260 to 5,047 words: every figure
                  intact, and 94 to 100% of the original length kept.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CtaBand
        heading={'See what your own text is carrying.'}
        sub={'The scan is free, takes seconds, and needs no account.'}
        secondary={{ href: '/capabilities', label: 'What we do' }}
      />
    </div>
  );
}

/**
 * One panel per mark, all three identical in shape: text and checklist on the
 * left, the drawing with its caption on the right, an optional full-width band
 * underneath. The old page put each drawing below a wall of prose; this puts
 * them side by side, the way the marks and their explanations belong together.
 */
function LayerPanel({
  id,
  icon: Icon,
  title,
  lede,
  paragraphs,
  checks,
  checksLabel = 'What we do',
  status,
  diagram,
  caption,
  band,
}: {
  id: string;
  icon: typeof EyeOffIcon;
  title: string;
  lede: string;
  paragraphs: string[];
  checks: string[];
  checksLabel?: string;
  status: React.ReactNode;
  diagram: React.ReactNode;
  caption: string;
  band?: React.ReactNode;
}) {
  return (
    <article
      id={id}
      className={'bg-card ring-border/70 scroll-mt-6 overflow-hidden rounded-[18px] ring-1'}
    >
      <div className={'grid lg:grid-cols-2'}>
        <div className={'flex flex-col gap-3.5 p-6 sm:p-9'}>
          <span
            className={'bg-mark text-mark-foreground grid size-[34px] place-items-center rounded-[10px]'}
          >
            <Icon className={'size-[17px]'} strokeWidth={1.9} aria-hidden />
          </span>

          <h2 className={'text-foreground text-[21px] font-semibold tracking-[-0.02em]'}>
            {title}
          </h2>

          <p className={'text-foreground max-w-[52ch] text-[14.5px] leading-[1.55] font-medium'}>
            {lede}
          </p>

          {/*
            THE EXPLANATION IS BEHIND A PLUS ON A PHONE, 21 August 2026.

            These two paragraphs are the best writing on the site and they
            are also, on a 390px screen, twelve to eighteen lines of grey
            body copy standing between the visitor and the picture that
            explains the same thing in one look. Three panels of that is why
            this page ran to eight phone screens.

            Nothing is cut. Below `sm` the prose waits behind a labelled
            control; from `sm` the control dissolves and the paragraphs are
            exactly where they always were. See mobile-disclosure.tsx.

            What stays outside the control is deliberate: the lede, which
            carries the claim, the checklist, which carries what we actually
            do, and the status line, which carries the limits. A phone reader
            who never opens this still reads every load-bearing sentence in
            the panel.
          */}
          <MobileDisclosure label={'How this one works'}>
            {paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className={'text-muted-foreground max-w-[56ch] text-[14px] leading-[1.65]'}>
                {paragraph}
              </p>
            ))}
          </MobileDisclosure>

          <div className={'mt-1'}>
            <p className={'text-foreground text-[11.5px] font-semibold tracking-wide uppercase'}>
              {checksLabel}
            </p>
            <ul className={'mt-2 space-y-1.5'}>
              {checks.map((check) => (
                <li
                  key={check}
                  className={'text-foreground/85 flex items-start gap-2 text-[13.5px] leading-[1.5]'}
                >
                  <CheckIcon
                    className={'text-mark-strong mt-[3px] size-[14px] shrink-0'}
                    strokeWidth={2.4}
                    aria-hidden
                  />
                  {check}
                </li>
              ))}
            </ul>
          </div>

          <p className={'text-muted-foreground border-border/70 mt-auto border-t pt-3.5 text-[13px] leading-[1.6]'}>
            {status}
          </p>
        </div>

        <div
          className={
            'border-border/70 bg-foreground/[0.016] flex flex-col border-t lg:border-t-0 lg:border-l'
          }
        >
          <div className={'flex flex-1 items-center justify-center p-6'}>{diagram}</div>
          <p
            className={
              'border-border/70 text-muted-foreground border-t px-5 py-3 text-[12.5px] leading-snug'
            }
          >
            {caption}
          </p>
        </div>
      </div>

      {band ? (
        <div className={'border-border/70 border-t px-6 py-6 sm:px-9 sm:py-7'}>{band}</div>
      ) : null}
    </article>
  );
}

function ProofRow({
  state,
  name,
  detail,
}: {
  state: 'proven' | 'measured';
  name: string;
  detail: string;
}) {
  const Icon = state === 'proven' ? CheckIcon : ClockIcon;

  return (
    <li className={'flex items-start gap-3.5 py-4 first:pt-0 last:pb-0'}>
      <span
        className={[
          'mt-[2px] grid size-[20px] shrink-0 place-items-center rounded-full text-white',
          state === 'proven' ? 'bg-emerald-600' : 'bg-amber-500',
        ].join(' ')}
      >
        <Icon className={'size-[12px]'} strokeWidth={3} aria-hidden />
      </span>
      <div className={'min-w-0'}>
        <h3 className={'text-foreground text-[15px] font-semibold tracking-[-0.012em]'}>{name}</h3>
        <p className={'text-muted-foreground mt-1 max-w-[64ch] text-[13.5px] leading-[1.6]'}>
          {detail}
        </p>
      </div>
    </li>
  );
}

export default HowItWorks;
