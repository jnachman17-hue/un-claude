import { Suspense } from 'react';

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
import { PageHeader } from '../_components/prose';
import {
  EntropyProse,
  RewritePipeline,
  type EntropyToken,
  type PipelineStep,
} from '../_components/rewrite-sequence';

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
 * as the landing page.
 *
 * ★ SPLIT IN TWO, 6 SEPTEMBER 2026. Brief: docs/briefs/how-it-works-rethink.md.
 * Session note: docs/session-notes/how-it-works-rethink.md.
 *
 * The page is now two halves that do two different jobs.
 *
 *   (a) THE THREE MARKS, as three SYMMETRIC panels. One idea, one visual,
 *       comparable height. This is the education layer. Panel three used to be
 *       2.3 times the height of the first, and a whole engine explainer wearing
 *       the same frame is what made the page read as broken.
 *
 *   (b) "HOW THE REWRITE WORKS", underneath, sequential, with motion. Most
 *       visitors came for the rewrite, and cramming it into panel three is what
 *       broke the layout.
 *
 * Beat order is not a preference and must not be rearranged into a feature
 * list: freedom exists at some words and not others, therefore the job is
 * narrower than it looks, therefore split, freeze, rewrite, restore, measure.
 * Each beat earns the next.
 *
 * Sourced from ENGINE.md throughout. The claims boundary is
 * .claude/skills/unclaude-messaging: fully confident on hidden characters and
 * metadata, engineering-and-measurement on the statistical rewrite, "runs" as
 * the noun taught in the same breath it is used, no em dashes, and the
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
 * ★ THE FOUR ENGINE RULES USED TO LIVE HERE, AND THEY DID NOT SURVIVE AS A
 * LIST. Nothing in them was lost; all four became part of the sequence below.
 *
 * "Break the runs" was the framing and is now the section standfirst and beat
 * one. "Never rewritten by Claude" is beat four. "Facts held" and "Length
 * held" are beat five, where they belong, because both are checks that run
 * after the rewrite rather than properties the engine has.
 *
 * The reason they had to move: *Break the runs · Never rewritten by Claude ·
 * Facts held · Length held* is a spec sheet. It says what the engine IS and it
 * never once says what happens to a reader's document. Read left to right it
 * also arrives before the reader has been told there is a rewrite at all.
 */

/**
 * BEAT 0, THE SENTENCE THE ENTROPY ANIMATION CYCLES.
 *
 * The copy lives here rather than in the component because every word a
 * visitor reads is governed by .claude/skills/unclaude-messaging, and this
 * file is where the governed words on this page are kept.
 *
 * The shape is the whole teaching point. The locked span had one possible
 * answer, so the model had no freedom in it and a watermark has nothing to
 * nudge. The four cycling words each had several answers that read equally
 * well, which is precisely where a mark can sit. The alternatives are the ones
 * from scene 2 of Jon's motion canvas.
 */
const ENTROPY_TOKENS: readonly EntropyToken[] = [
  { text: 'The Treaty of Versailles', locked: true },
  { text: 'transformed', alts: ['changed', 'reshaped'] },
  { text: 'the map of Europe. Trade' },
  { text: 'expanded', alts: ['grew', 'widened'] },
  { text: 'across the new borders, old rivalries' },
  { text: 'pursued', alts: ['chased', 'followed'] },
  { text: 'fresh ones, and the pace of change' },
  { text: 'quickened', alts: ['sped up', 'raced'] },
  { text: '.', glue: true },
] as const;

/**
 * BEATS 2 TO 5. Each one is a thing that happens to the visitor's document, in
 * the order it happens, and the strip beside them animates the same four
 * steps.
 *
 * Sourced from ENGINE.md sections 3 to 5 and from uc_freeze.py / uc_chunk.py:
 * chunks of 350 words rewritten concurrently, protected spans masked as
 * `[[17]]` before the model is called, one informed retry, and a fallback that
 * returns the chunk's ORIGINAL text rather than something corrupted.
 */
const PIPELINE_BEATS: readonly PipelineStep[] = [
  {
    head: 'Split',
    body: 'Your document goes in as pieces of about 350 words. A thousand words is three of them. Hand a model ten thousand at once and it drifts, drops facts and comes back shorter; small pieces stay faithful, and they run at the same time.',
  },
  {
    head: 'Freeze',
    body: 'Quotations, citations, references and headings become numbered placeholders before anything is sent, so the rewriting model never sees those words. Nothing is lost by that: a verbatim quote was copied from fixed text, so there was no freedom in it to carry a mark.',
  },
  {
    head: 'Rewrite',
    /*
     * "Working to a three-word limit" is the corrected wording that replaced a
     * false "hard three-word ceiling", and it must not be turned back into a
     * promise. ENGINE.md section 3 rule 3 is "no runs of more than three
     * consecutive words, SUBJECT TO RULES 1 AND 2", and holding facts and
     * length both outrank it. Runs of up to 388 words have been measured in a
     * delivered document. See docs/session-notes/tell-the-truth-about-runs.md.
     */
    body: 'Everything else goes to a model that does not watermark its own output, because rewriting Claude’s text with Claude would stamp a fresh mark straight back in. The rebuild works to a three-word limit on what carries over.',
  },
  {
    head: 'Restore and check',
    body: 'The frozen words go back, and the result is checked against what you sent: protected spans character for character, every number, date and name still yours, and the length close to your original, because condensing is how rewrites lose facts. A piece that fails twice comes back exactly as you sent it, rather than corrupted.',
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
              <p
                className={
                  'text-muted-foreground mt-3 max-w-[40ch] text-[15px] leading-[1.6]'
                }
              >
                Paste text, or upload a text file, and you get hidden characters
                and the statistical watermark. A Word document gets hidden
                characters and metadata. A picture gets metadata alone.
              </p>
            </div>

            <div className={'lg:col-span-8'}>
              <ul
                className={
                  'border-border/70 divide-border/70 divide-y overflow-hidden rounded-[14px] border'
                }
              >
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
                        <mark.icon
                          className={'size-[15px]'}
                          strokeWidth={1.9}
                          aria-hidden
                        />
                      </span>

                      <span className={'min-w-0'}>
                        <span
                          className={
                            'text-foreground block text-[14.5px] font-semibold tracking-[-0.012em]'
                          }
                        >
                          {mark.name}
                        </span>
                        <span
                          className={
                            'text-muted-foreground block text-[12.5px] leading-snug'
                          }
                        >
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

      {/* The three panels, one grammar and now one shape: text and checklist
          on the left, a drawing on the right, and nothing hanging underneath
          any of them. */}
      <section className={'border-border/70 border-b'}>
        <div
          className={
            'mx-auto max-w-[1180px] space-y-5 px-5 py-10 sm:px-8 sm:py-14'
          }
        >
          <LayerPanel
            id={'hidden-characters'}
            icon={EyeOffIcon}
            title={'Hidden characters'}
            lede={'Real characters, drawn as nothing at all.'}
            paragraphs={[
              'Between the letters you can read, text can carry characters that display as nothing at all: invisible spaces, joiners, direction marks. They hold real positions in your text and travel with it through every copy and paste.',
              'Many AI tools emit them, embedded in what you paste without you ever seeing it, and anyone who knows to look can check in seconds. They are the easiest tell to catch, and the easiest to remove completely.',
            ]}
            checks={[
              'Nine classes of invisible character checked on every scan',
              'Each one named, with its exact position in your text',
              'Read back afterwards to confirm none remain',
            ]}
            status={'Free, on every scan.'}
            diagram={
              <HiddenCharactersDiagram
                className={'h-auto w-full max-w-[440px]'}
              />
            }
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
              'Every file carries a wrapper that describes it: what made it, when, with what. When an AI tool generates a file it writes a record into that wrapper naming itself. Claude does it, and so do OpenAI, Google, Adobe and the rest, most of them behind one shared industry format called C2PA.',
              'We strip that record, along with EXIF, XMP and generator tags, then read the file back to confirm nothing is left. On a file Claude made, this is Claude’s mark coming off, with proof.',
            ]}
            checks={[
              'C2PA credentials, EXIF, XMP and generator tags removed',
              'The picture or document returned byte for byte identical',
              'The file re-read afterwards to prove it is clean',
            ]}
            status={'Needs a file. Pasted text has no wrapper to read.'}
            diagram={
              <FileProvenanceDiagram
                className={'h-auto w-full max-w-[440px]'}
              />
            }
            caption={
              'The mark is not in the picture. It sits in the record attached to it, so removing it changes no pixel.'
            }
          />

          <LayerPanel
            id={'statistical-watermark'}
            icon={FingerprintIcon}
            title={'The statistical watermark'}
            lede={
              'Nothing is added to your text. The mark is the words themselves.'
            }
            /*
             * ★ SHORTENED 6 September 2026, from 524 words to a single beat.
             *
             * This panel was 1,189px against 520px and 567px for its two
             * siblings, and 442px of that was a full-width band hanging below
             * the columns. Three panels that are meant to be one idea each had
             * a whole engine explainer wearing the same frame, which is why
             * the page read as broken.
             *
             * What it says now is what the brief ruled it should say: what the
             * statistical mark is, and that it comes off by rewriting. It
             * stops there and hands the reader to the section below, which is
             * where the rewrite is explained properly and in sequence.
             */
            paragraphs={[
              'This is the mark Claude, and others, apply to text itself: the one in the news, and the one nobody can point at, because nothing is inserted at any point. As a model writes it reaches words where several options read equally well, and a watermarking model hands that pick to a secret key. Across a few hundred words those picks line up into a pattern, and whoever holds the key can test any text for it.',
              'The pattern lives only in unbroken runs of the original words, so a casual reword leaves it standing. Taking it off means rebuilding the wording, and that is what the section below does.',
            ]}
            checks={[
              'Survives copy, paste, reformatting and light editing',
              'Invisible to you, testable by whoever holds the key',
              'Carried only by unbroken runs of the original words',
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
                  className={
                    'text-foreground underline decoration-1 underline-offset-2'
                  }
                >
                  &ldquo;complete rewrite where every word is replaced&rdquo;
                </a>{' '}
                defeats the mark. A casual reword never comes close to that bar.
              </>
            }
            diagram={
              <StatisticalWatermarkDiagram
                className={'h-auto w-full max-w-[440px]'}
              />
            }
            caption={
              'A watermarked sentence is one the model could have written anyway. There is nothing extra in it to find, and nothing to point at.'
            }
          />
        </div>
      </section>

      {/*
        ═══════════════════════════════════════════════════════════════════════
        HOW THE REWRITE WORKS. Added 6 September 2026.

        This is the half of the page that used to be crammed into panel 3, and
        it is what most visitors came for. It is deliberately SEQUENTIAL: every
        beat earns the next one, and the whole thing answers "what happens to
        my document" rather than "what is this engine like".

        WHY IT IS ON THIS PAGE AND NOT ITS OWN. The navigation is already five
        items and a "why this matters" tab is coming. Jon's ruling.

        ★ THE THING TO NOT BREAK. `EntropyProse` and `RewritePipeline` are
        client components with animation in them, which is the exact shape of
        change that took this site out of Google's index in August. Both are
        behind their own <Suspense> boundaries, and both render their settled
        final state from a constant, so they prerender into the static HTML and
        every word here is readable by a crawler. Read the docblock at the top
        of rewrite-sequence.tsx before changing either.
        ═══════════════════════════════════════════════════════════════════════
      */}
      <section
        id={'the-rewrite'}
        className={'border-border/70 scroll-mt-6 border-b'}
      >
        <div className={'mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14'}>
          {/* THE HEADER IS SIDE BY SIDE AND THE CARDS BELOW IT RUN FULL WIDTH.
              The first draft put the whole section in the 4/8 shell the two
              reading sections use, and the cards inherited a 725px column, so
              their `lg:grid-cols-2` never engaged and every one of them
              stacked: 1,983px for a section that is 1,180px wide. */}
          <div className={'grid gap-3 lg:grid-cols-12 lg:items-end lg:gap-14'}>
            <h2
              className={
                'text-foreground lg:col-span-5 text-[24px] leading-[1.15] font-semibold tracking-[-0.024em] text-balance sm:text-[28px]'
              }
            >
              How the rewrite works.
            </h2>
            <p
              className={
                'text-muted-foreground lg:col-span-7 max-w-[68ch] text-[15px] leading-[1.6]'
              }
            >
              The signature travels in runs: unbroken stretches of the words the
              first model picked. Break the runs and there is nothing left to
              read it from. Here is what happens to your document, in the order
              it happens.
            </p>
          </div>

          <div className={'mt-7'}>
            <div className={'space-y-5'}>
              {/* Beats 0 and 1. */}
              <article
                className={
                  'bg-card ring-border/70 overflow-hidden rounded-[18px] ring-1'
                }
              >
                <div className={'grid lg:grid-cols-2'}>
                  <div className={'flex flex-col gap-3.5 p-6 sm:p-9'}>
                    <p
                      className={
                        'text-muted-foreground text-[11.5px] font-semibold tracking-wide uppercase'
                      }
                    >
                      Where the mark can live
                    </p>

                    <h3
                      className={
                        'text-foreground text-[19px] font-semibold tracking-[-0.018em]'
                      }
                    >
                      A watermark needs a choice to hide in.
                    </h3>

                    <p
                      className={
                        'text-muted-foreground max-w-[54ch] text-[14px] leading-[1.65]'
                      }
                    >
                      When a model writes, some places leave it plenty of
                      freedom and some leave it none. After &ldquo;the sky
                      was&rdquo;, grey, overcast and gloomy all fit. After
                      &ldquo;the Treaty of&rdquo;, there is one answer. A
                      watermark works by nudging the pick, so it can only exist
                      where there was a pick to nudge.
                    </p>

                    <p
                      className={
                        'text-foreground max-w-[54ch] text-[14.5px] leading-[1.6] font-medium'
                      }
                    >
                      Which makes the job narrower than it looks. You do not
                      have to rewrite everything. You have to rewrite the places
                      where the model had freedom, and break the runs that carry
                      the signal between them.
                    </p>
                  </div>

                  <div
                    className={
                      'border-border/70 bg-foreground/[0.016] border-t lg:border-t-0 lg:border-l'
                    }
                  >
                    <Suspense fallback={<div className={'min-h-[240px]'} />}>
                      <EntropyProse tokens={ENTROPY_TOKENS} />
                    </Suspense>
                  </div>
                </div>
              </article>

              {/* Beats 2 to 5. */}
              <article
                className={
                  'bg-card ring-border/70 overflow-hidden rounded-[18px] ring-1'
                }
              >
                <Suspense fallback={<div className={'min-h-[420px]'} />}>
                  <RewritePipeline steps={PIPELINE_BEATS} />
                </Suspense>
              </article>

              {/*
                  BEAT 6, AND IT IS WHERE THE HONESTY LANDS.

                  It is last on purpose. Jon's ruling: the limitation does not
                  come to the doorway. His own Reddit post opens with "we can
                  only positively claim we remove two of them" and that framing
                  stays off the site. The honesty is not softened, it is placed.

                  ★ THE MEASURED CLAIM IN THE LAST SENTENCE IS A RULING, NOT AN
                  OVERSIGHT. Jon reinstated it on 25 August 2026 AFTER being
                  shown the measurements that argue against it, and reaffirmed
                  it. `04` entry 151 records the ruling and supersedes entry
                  145, which took it down. It moved here from the panel above
                  when that panel was cut; it did not appear from nowhere and
                  it may not disappear.

                  DO NOT REMOVE IT AGAIN WITHOUT ASKING HIM, and do not drop
                  the "across our test set" scoping, which is what makes it a
                  measured claim rather than an absolute one. The measurements
                  are in `04` entries 145 and 151 and in
                  docs/session-notes/preflight-and-two-claims.md so nobody has
                  to re-derive them: across 63 measured runs the figure holds on
                  18, the median is 81.5%, and on deepseek it holds on 3 of 21.
                */}
              <div
                className={
                  'border-border/70 grid gap-x-10 gap-y-3 rounded-[18px] border border-dashed px-6 py-6 sm:px-8 lg:grid-cols-2'
                }
              >
                <div>
                  <h3
                    className={
                      'text-foreground text-[16.5px] font-semibold tracking-[-0.016em]'
                    }
                  >
                    What we can measure, and what nobody can yet
                  </h3>
                  <p
                    className={
                      'text-muted-foreground mt-2 text-[14px] leading-[1.65]'
                    }
                  >
                    Your document cannot be tested for the watermark itself.
                    Anthropic&rsquo;s detector is coming rather than callable,
                    and nobody outside the labs can check a text for the mark
                    today.
                  </p>
                </div>

                <p
                  className={
                    'text-muted-foreground text-[14px] leading-[1.65] lg:mt-[3px]'
                  }
                >
                  What can be measured is how much of your original word order
                  survived, and that is the number that matters, because the
                  signature cannot be read at all without unbroken runs to read
                  it from.{' '}
                  <span className={'text-foreground font-medium'}>
                    So every run hands you your own figures:
                  </span>{' '}
                  the share of your wording replaced, the longest run of it
                  still standing, every figure accounted for, and how much of
                  your length was kept. Across our test set it breaks over 90%
                  of three-word sequences with zero figures lost.
                </p>
              </div>
            </div>
          </div>
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
              <p
                className={
                  'text-muted-foreground mt-3 max-w-[40ch] text-[15px] leading-[1.6]'
                }
              >
                Two of the three are provable to the byte, today. The third
                becomes checkable the day Anthropic opens its detector, and that
                day is coming.
              </p>
            </div>

            <div className={'lg:col-span-8'}>
              <ul className={'divide-border/70 divide-y'}>
                <ProofRow
                  state={'proven'}
                  name={'Hidden characters'}
                  detail={
                    'Proven on every run. Found, counted, removed, and read back.'
                  }
                />
                <ProofRow
                  state={'proven'}
                  name={'Metadata'}
                  detail={
                    'Proven on every run. Verified against the raw bytes of your file.'
                  }
                />
                <ProofRow
                  state={'measured'}
                  name={'Statistical rewrite'}
                  /*
                   * TRIMMED 6 September 2026. The long version listed what the
                   * engine does to the mark, and the whole "how the rewrite
                   * works" section above now does that in sequence and in
                   * motion. What is left is this row's own job: the state of
                   * the proof. Nothing was dropped that is not said better
                   * upstream, and the last two sentences are untouched.
                   */
                  detail={
                    'Measured on every run, and the section above is what the engine does to earn that. The one word we hold back is verified, because nobody can check a text watermark until Anthropic opens its public detector. The day it opens, we run every job against it.'
                  }
                />
              </ul>

              {/*
                The quotation and PDF caveats came off at Jon's instruction:
                both are stated where they belong, on /capabilities and in the
                FAQ, and this section's job is proof, not scope.
              */}
              <div className={'border-border/70 mt-8 border-t pt-6'}>
                <p
                  className={
                    'text-muted-foreground max-w-[68ch] text-[14px] leading-[1.65]'
                  }
                >
                  <span className={'text-foreground font-medium'}>
                    Measured on real documents.
                  </span>{' '}
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
 * left, the drawing with its caption on the right. The old page put each drawing
 * below a wall of prose; this puts them side by side, the way the marks and
 * their explanations belong together.
 *
 * ★ THE `band` SLOT IS GONE, 6 September 2026, AND IT SHOULD NOT COME BACK.
 * It existed so the statistical panel could carry the engine explainer
 * underneath its columns, and that one exception is the whole reason this page
 * read as broken: 442px of full-width band below a two-column panel, in a row
 * of three panels that were otherwise identical. The explainer has its own
 * section now. A panel is one idea and one drawing, with nothing under it.
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
}) {
  return (
    <article
      id={id}
      className={
        'bg-card ring-border/70 scroll-mt-6 overflow-hidden rounded-[18px] ring-1'
      }
    >
      <div className={'grid lg:grid-cols-2'}>
        <div className={'flex flex-col gap-3.5 p-6 sm:p-9'}>
          <span
            className={
              'bg-mark text-mark-foreground grid size-[34px] place-items-center rounded-[10px]'
            }
          >
            <Icon className={'size-[17px]'} strokeWidth={1.9} aria-hidden />
          </span>

          <h2
            className={
              'text-foreground text-[21px] font-semibold tracking-[-0.02em]'
            }
          >
            {title}
          </h2>

          <p
            className={
              'text-foreground max-w-[52ch] text-[14.5px] leading-[1.55] font-medium'
            }
          >
            {lede}
          </p>

          {/*
            ★ THE PLUS IS GONE, 6 September 2026, AND IT IS THE COPY THAT
            CHANGED RATHER THAN THE CONTROL.

            From 21 August these paragraphs waited behind a labelled control
            below `sm`, because three panels of twelve to eighteen lines of
            grey body copy is what ran this page to eight phone screens.

            The rethink brief rules that trick out: "whatever replaces it must
            not need that trick. If the new structure still needs a disclosure
            to be bearable on a phone, the structure is wrong."

            So the prose was cut instead. Each panel is one beat now, the
            engine explainer that used to hang under panel three has its own
            section, and what is left reads straight through on a phone with
            nothing to press. `mobile-disclosure.tsx` stays: /capabilities and
            /pricing still use it.
          */}
          {paragraphs.map((paragraph) => (
            <p
              key={paragraph.slice(0, 24)}
              className={
                'text-muted-foreground max-w-[56ch] text-[14px] leading-[1.65]'
              }
            >
              {paragraph}
            </p>
          ))}

          <div className={'mt-1'}>
            <p
              className={
                'text-foreground text-[11.5px] font-semibold tracking-wide uppercase'
              }
            >
              {checksLabel}
            </p>
            <ul className={'mt-2 space-y-1.5'}>
              {checks.map((check) => (
                <li
                  key={check}
                  className={
                    'text-foreground/85 flex items-start gap-2 text-[13.5px] leading-[1.5]'
                  }
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

          <p
            className={
              'text-muted-foreground border-border/70 mt-auto border-t pt-3.5 text-[13px] leading-[1.6]'
            }
          >
            {status}
          </p>
        </div>

        <div
          className={
            'border-border/70 bg-foreground/[0.016] flex flex-col border-t lg:border-t-0 lg:border-l'
          }
        >
          <div className={'flex flex-1 items-center justify-center p-6'}>
            {diagram}
          </div>
          <p
            className={
              'border-border/70 text-muted-foreground border-t px-5 py-3 text-[12.5px] leading-snug'
            }
          >
            {caption}
          </p>
        </div>
      </div>
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
        <h3
          className={
            'text-foreground text-[15px] font-semibold tracking-[-0.012em]'
          }
        >
          {name}
        </h3>
        <p
          className={
            'text-muted-foreground mt-1 max-w-[64ch] text-[13.5px] leading-[1.6]'
          }
        >
          {detail}
        </p>
      </div>
    </li>
  );
}

export default HowItWorks;
