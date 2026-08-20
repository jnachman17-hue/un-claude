import { FileProvenanceDiagram } from '../_components/diagrams/file-provenance';
import { HiddenCharactersDiagram } from '../_components/diagrams/hidden-characters';
import { StatisticalWatermarkDiagram } from '../_components/diagrams/statistical-watermark';
import { Figure, PageHeader, Section } from '../_components/prose';

export const metadata = {
  title: 'How it works',
  description:
    'The three kinds of AI watermark, where each one hides, and exactly how Un-Claude removes them.',
};

/**
 * The technical explanation, written for someone with no technical background.
 *
 * Sourced throughout from apps/web/engine/ENGINE.md, which records what was
 * measured and what was not. Where something is unproven this page says so.
 */
function HowItWorks() {
  return (
    <div className={'flex flex-col'}>
      <PageHeader
        title={'Where an AI watermark actually hides.'}
        standfirst={
          'Three different marks, in three different places, with three different levels of proof behind removing them. None of this is secret, and understanding it is the only way to judge what any tool in this category can honestly promise you.'
        }
      />

      <Section title={'A watermark is not one thing'}>
        <p>
          The word gets used for three unrelated mechanisms, which is why the
          claims made about removing them are so often nonsense. It is worth
          separating them before anything else.
        </p>
        <p>
          <strong>Hidden characters</strong> are real characters sitting between
          the ones you can see, drawn as nothing at all.{' '}
          <strong>Metadata</strong> is the hidden data inside a file, including a record of what made it,
          tucked into the file’s wrapper rather than its content.{' '}
          <strong>A statistical watermark</strong> is not added to your text at
          all: it is a bias in which words the model chose in the first place.
        </p>
        <p>
          The first two are exact. We can name what was found, point at where it
          sat, remove it, and read the result back to prove nothing is left. The
          third cannot be verified by anyone, including us, and the rest of this
          page explains why.
        </p>
      </Section>

      <Section
        title={'Hidden characters'}
        aside={
          <Figure caption={'A hidden character occupies a real position in the sentence and is drawn as nothing. It travels with the text through copy and paste.'}>
            <HiddenCharactersDiagram className={'h-auto w-full max-w-[460px]'} />
          </Figure>
        }
      >
        <p>
          Text is a sequence of characters, and not all of them are visible.
          Some are instructions rather than letters: join these two together,
          run this passage right to left, break the line here if you must. Your
          screen obeys them and draws nothing.
        </p>
        <p>
          They arrive from several places. Copying from a web page brings them.
          Export pipelines add them. And AI tools emit them: in 2025 researchers
          found newer ChatGPT models producing narrow no-break spaces in longer
          answers, a character identical in appearance to an ordinary space.{' '}
          <strong>
            OpenAI said this was not deliberate, calling it a quirk of large
            scale training, and independent analysis agrees.
          </strong>
        </p>
        <p>
          What matters is that they are a real tell that catches real people
          today, and that finding them is exact.{' '}
          <strong>
            Anthropic adds no hidden characters to Claude’s text, and says so
            directly, so this layer is not what deals with Claude’s watermark.
          </strong>{' '}
          We would rather tell you that than let you assume otherwise.
        </p>
        <p>
          We check nine classes of these on every scan, free, in about forty
          milliseconds. Some are deleted outright and some are swapped for the
          ordinary character they were imitating, which is why the two counts we
          show you are separate.
        </p>
      </Section>

      <Section
        title={'Metadata'}
        aside={
          <Figure caption={'The mark is not in the picture. It sits in the wrapper around it, which is why removing it changes no pixel.'}>
            <FileProvenanceDiagram className={'h-auto w-full max-w-[460px]'} />
          </Figure>
        }
      >
        <p>
          Every file has a wrapper: a region that describes the file rather than
          being its content. Who made it, with what, when. When an AI tool
          generates an image it writes a signed record into that wrapper saying
          so. The industry agreed on a single format for this, called C2PA, and
          nearly every major provider now attaches one.
        </p>
        <p>
          <strong>
            That standard is removable by design, and its own documentation says
            so.
          </strong>{' '}
          Re-saving or converting a file drops it. We do it deliberately, then
          read the file back afterwards to confirm nothing was left behind.
        </p>
        <p>
          This is the strongest provable claim in the product. On a Claude
          generated image, this is the layer that removes Claude’s mark. The
          picture itself comes out byte for byte identical.
        </p>
        <p>
          Pasted text has no wrapper, so there is nothing here to read. That is
          why the panel says so rather than quietly hiding the row.
        </p>
      </Section>

      <Section
        title={'The statistical watermark'}
        aside={
          <Figure caption={'A secret key steers the choice between words that read equally well. Repeated across a passage, the run of choices becomes a signature.'}>
            <StatisticalWatermarkDiagram className={'h-auto w-full max-w-[460px]'} />
          </Figure>
        }
      >
        <p>
          This is the one in the news, and the one people find hardest to
          picture, because nothing is added to your text at any point.
        </p>
        <p>
          A language model writes one word at a time, and at many of those words
          several choices read equally well. Grey, overcast, gloomy. Anthropic
          uses a variant of a technique called SynthID-Text: the few words
          already written, combined with a secret key, seed a function that runs
          a small tournament between the candidates and picks a winner.
        </p>
        <p>
          Any single choice means nothing. Across a few hundred words, the run of
          choices becomes a statistical signature that whoever holds the key can
          test for. The text reads completely normally, because every word chosen
          was a word the model would plausibly have chosen anyway.
        </p>
        <p>
          <strong>
            Two consequences decide how it can be removed. The signal survives
            only where runs of consecutive words survive, not where meaning or
            vocabulary is similar. And the signal can only sit at words where
            there was genuine choice.
          </strong>
        </p>
        <p>
          So the attack is not swapping in synonyms. It is breaking the runs. Our
          rewrite is instructed never to reuse more than three of your words in a
          row, to preserve facts and figures character for character above every
          other rule, and to keep the length rather than condensing, because
          compression is the mechanism by which facts actually disappear.
        </p>
      </Section>

      <Section title={'Why we will not tell you it worked'}>
        <p>
          There is no public detector for any vendor’s text watermark. Anthropic
          confirmed in August 2026 that one is in development, with no ship date
          and no published terms.
        </p>
        <p>
          <strong>
            Until that exists, every claim about text watermark removal made by
            any tool, ours included, is unfalsifiable.
          </strong>{' '}
          Anyone telling you their rewrite is verified is telling you something
          they cannot know.
        </p>
        <p>
          What we do instead is show you the work. After a rewrite you get the
          proportion of your original wording that was replaced, the longest run
          of your words still present, how much of your original length was
          kept, and every figure in your text accounted for. Those are
          measurements of what changed. They are not, and we will not dress them
          up as, a measure of whether the watermark is gone.
        </p>
      </Section>

      <Section title={'What we have not tested'}>
        <p>
          Verified on business prose and essay prose at five lengths, from 1,260
          to 5,047 words, with every figure intact and 94 to 100 per cent of the
          original length preserved.
        </p>
        <p>
          <strong>Not tested:</strong> legal text with defined terms, academic
          writing with citations, quotation heavy journalism, and CVs.
          Quotations are the known structural weak spot, because a quote that has
          to survive word for word is preserved wording by definition, and
          preserved wording is exactly the channel the signature rides on.
        </p>
        <p>
          PDFs are not supported at all. Doing them properly needs a step we
          cannot currently run, and a half done job would mean telling you a file
          was clean while the old data was still recoverable inside it. That is
          the precise broken promise this product exists to avoid.
        </p>
      </Section>
    </div>
  );
}

export default HowItWorks;
