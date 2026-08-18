'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import { ArrowRight, Check, Copy, Loader2, Square } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import { Button } from '@kit/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Switch } from '@kit/ui/switch';
import { Textarea } from '@kit/ui/textarea';
import { cn } from '@kit/ui/utils';

import {
  type HumanizeFrame,
  MAX_WORDS_PER_REQUEST,
  type SentenceChange,
  TONES,
  type Tone,
} from '~/lib/humanize-contract';
import { type TextMetrics, analyze, splitSentences } from '~/lib/text-analysis';

type Status = 'idle' | 'running' | 'done' | 'error';

interface RunResult {
  before: TextMetrics;
  after: TextMetrics;
  changes: SentenceChange[];
  wordsBilled: number;
}

const TONE_LABELS: Record<Tone, string> = {
  neutral: 'Neutral',
  casual: 'Casual',
  professional: 'Professional',
  academic: 'Academic',
};

/**
 * Pairs each sentence of the output with the original it replaced, so a reader
 * can hover a rewritten sentence and see what was there before.
 *
 * A single change can turn one sentence into two, which is why this matches by
 * containment rather than equality.
 */
function buildHighlights(
  output: string,
  changes: SentenceChange[],
): Array<{ text: string; original: string | null }> {
  return splitSentences(output).map((sentence) => {
    const change = changes.find((candidate) =>
      candidate.rewritten.includes(sentence),
    );

    return { text: sentence, original: change?.original ?? null };
  });
}

function Stat({
  label,
  before,
  after,
  suffix = '',
  higherIsBetter,
}: {
  label: string;
  before: number;
  after: number;
  suffix?: string;
  higherIsBetter?: boolean;
}) {
  const delta = after - before;
  const moved = Math.abs(delta) >= 0.05;

  const improved =
    higherIsBetter === undefined ? null : delta > 0 === higherIsBetter;

  return (
    <div className={'flex flex-col gap-1'}>
      <span className={'text-muted-foreground text-xs'}>{label}</span>

      <span
        className={'flex items-baseline gap-1.5 font-mono text-sm tabular-nums'}
      >
        <span className={'text-muted-foreground'}>
          {before}
          {suffix}
        </span>

        <ArrowRight className={'text-muted-foreground/60 size-3'} />

        <span className={'text-foreground font-medium'}>
          {after}
          {suffix}
        </span>
      </span>

      {moved ? (
        <span
          className={cn(
            'text-xs tabular-nums',
            // Only metrics with a known good direction get colour. The rest
            // still show their delta, because a number that visibly moved and
            // reports "no change" reads as a broken panel.
            improved === null
              ? 'text-muted-foreground'
              : improved
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400',
          )}
        >
          {delta > 0 ? '+' : ''}
          {Math.round(delta * 10) / 10}
          {suffix}
        </span>
      ) : (
        <span className={'text-muted-foreground/50 text-xs'}>no change</span>
      )}
    </div>
  );
}

export function Humanizer() {
  const [input, setInput] = useState('');
  const [tone, setTone] = useState<Tone>('neutral');
  const [status, setStatus] = useState<Status>('idle');
  const [output, setOutput] = useState('');
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHighlights, setShowHighlights] = useState(true);
  const [copied, setCopied] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const inputWords = useMemo(() => analyze(input).words, [input]);
  const overCap = inputWords > MAX_WORDS_PER_REQUEST;
  const running = status === 'running';

  const highlights = useMemo(() => {
    if (!result || status !== 'done') {
      return null;
    }

    return buildHighlights(output, result.changes);
  }, [output, result, status]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus(output.length > 0 ? 'done' : 'idle');
  }, [output.length]);

  const run = useCallback(async () => {
    if (inputWords === 0 || overCap || running) {
      return;
    }

    const controller = new AbortController();

    abortRef.current = controller;

    setStatus('running');
    setOutput('');
    setResult(null);
    setError(null);
    setCopied(false);

    try {
      const response = await fetch('/api/humanize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: input, tone }),
        signal: controller.signal,
      });

      if (!response.body) {
        throw new Error('no body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // A network chunk can split a JSON line in half, so completed lines are
      // taken off the front and the remainder is held until the rest arrives.
      let buffer = '';
      let sawTerminalFrame = false;

      for (;;) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');

        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.trim().length === 0) {
            continue;
          }

          const frame = JSON.parse(line) as HumanizeFrame;

          if (frame.type === 'chunk') {
            setOutput((current) => current + frame.text);
          }

          if (frame.type === 'result') {
            setResult({
              before: frame.before,
              after: frame.after,
              changes: frame.changes,
              wordsBilled: frame.wordsBilled,
            });

            setStatus('done');
            sawTerminalFrame = true;
          }

          if (frame.type === 'error') {
            setError(frame.message);
            setStatus('error');
            sawTerminalFrame = true;
          }
        }
      }

      // A stream that ends without a terminal frame is a failure, not a
      // success with missing data. Saying so beats showing a half rewrite as
      // though it were finished.
      //
      // Tracked with a local flag rather than by reading `status`, which inside
      // this callback is the value captured when the run started and never the
      // current one.
      if (!sawTerminalFrame) {
        setError(
          'The rewrite stopped before it finished. Nothing was charged. Try again.',
        );

        setStatus('error');
      }
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') {
        return;
      }

      setError(
        'Could not reach the rewriter. Check your connection and try again.',
      );
      setStatus('error');
    } finally {
      abortRef.current = null;
    }
  }, [input, inputWords, overCap, running, tone]);

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2_000);
  }, [output]);

  return (
    <div className={'flex flex-col gap-4'}>
      {/* Controls */}
      <div className={'flex flex-wrap items-center gap-3'}>
        <Select value={tone} onValueChange={(value) => setTone(value as Tone)}>
          <SelectTrigger className={'w-44'} disabled={running}>
            {/* The label is passed explicitly. A bare <SelectValue /> falls
                back to the raw value and renders "neutral" in lower case. */}
            <SelectValue>{TONE_LABELS[tone]}</SelectValue>
          </SelectTrigger>

          <SelectContent>
            {TONES.map((value) => (
              <SelectItem key={value} value={value}>
                {TONE_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {running ? (
          <Button variant={'outline'} onClick={stop}>
            <Square className={'size-3.5'} />
            Stop
          </Button>
        ) : (
          <Button onClick={run} disabled={inputWords === 0 || overCap}>
            Humanize
          </Button>
        )}

        <span
          className={cn(
            'font-mono text-xs tabular-nums',
            overCap ? 'text-destructive font-medium' : 'text-muted-foreground',
          )}
        >
          {inputWords.toLocaleString()} /{' '}
          {MAX_WORDS_PER_REQUEST.toLocaleString()} words
        </span>

        {result ? (
          <div className={'ml-auto flex items-center gap-2'}>
            <Switch
              id={'highlights'}
              checked={showHighlights}
              onCheckedChange={setShowHighlights}
            />

            <label
              htmlFor={'highlights'}
              className={'text-muted-foreground text-xs'}
            >
              Show what changed
            </label>
          </div>
        ) : null}
      </div>

      {overCap ? (
        <Alert variant={'destructive'}>
          <AlertTitle>Too long to rewrite in one go</AlertTitle>

          <AlertDescription>
            That is {(inputWords - MAX_WORDS_PER_REQUEST).toLocaleString()}{' '}
            words over the limit. Split it into smaller pieces and run them
            separately.
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant={'destructive'}>
          <AlertTitle>The rewrite did not finish</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {/* Split pane */}
      <div className={'grid gap-4 lg:grid-cols-2'}>
        <div className={'flex flex-col gap-2'}>
          <span className={'text-muted-foreground text-xs font-medium'}>
            Your draft
          </span>

          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={'Paste the text you want to humanize.'}
            className={
              'min-h-[360px] resize-y font-sans text-sm leading-relaxed'
            }
            disabled={running}
          />
        </div>

        <div className={'flex flex-col gap-2'}>
          <div className={'flex items-center justify-between'}>
            <span className={'text-muted-foreground text-xs font-medium'}>
              Humanized
            </span>

            {output.length > 0 && !running ? (
              <button
                type={'button'}
                onClick={copy}
                className={
                  'text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs'
                }
              >
                {copied ? (
                  <Check className={'size-3'} />
                ) : (
                  <Copy className={'size-3'} />
                )}
                {copied ? 'Copied' : 'Copy'}
              </button>
            ) : null}
          </div>

          <div
            className={
              'bg-muted/30 min-h-[360px] rounded-md border p-3 text-sm leading-relaxed'
            }
          >
            {output.length === 0 && !running ? (
              <span className={'text-muted-foreground/60'}>
                The rewritten version will appear here.
              </span>
            ) : null}

            {running && output.length === 0 ? (
              <span className={'text-muted-foreground flex items-center gap-2'}>
                <Loader2 className={'size-3.5 animate-spin'} />
                Rewriting. This can take up to a minute on longer text.
              </span>
            ) : null}

            {highlights && showHighlights ? (
              <p className={'whitespace-pre-wrap'}>
                {highlights.map((sentence, index) => (
                  <span
                    key={index}
                    title={
                      sentence.original
                        ? `Was: ${sentence.original}`
                        : 'Unchanged from your draft'
                    }
                    className={cn(
                      'rounded-sm',
                      sentence.original
                        ? 'bg-emerald-500/15 decoration-emerald-500/40 cursor-help underline decoration-dotted underline-offset-4'
                        : '',
                    )}
                  >
                    {sentence.text}{' '}
                  </span>
                ))}
              </p>
            ) : (
              <p className={'whitespace-pre-wrap'}>
                {output}
                {running ? (
                  <span
                    className={
                      'bg-foreground ml-0.5 inline-block h-4 w-1.5 animate-pulse align-text-bottom'
                    }
                  />
                ) : null}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Metrics */}
      {result ? (
        <div className={'rounded-md border p-4'}>
          <div className={'mb-3 flex items-baseline justify-between'}>
            <span className={'text-sm font-medium'}>What changed</span>

            <span
              className={'text-muted-foreground font-mono text-xs tabular-nums'}
            >
              {result.wordsBilled.toLocaleString()} words used
            </span>
          </div>

          <div className={'grid grid-cols-2 gap-4 sm:grid-cols-4'}>
            <Stat
              label={'Sentence variation'}
              before={result.before.variation}
              after={result.after.variation}
              suffix={'%'}
              higherIsBetter
            />

            <Stat
              label={'Avg sentence length'}
              before={result.before.avgSentenceLength}
              after={result.after.avgSentenceLength}
            />

            <Stat
              label={'Reading grade'}
              before={result.before.readingGrade}
              after={result.after.readingGrade}
            />

            <Stat
              label={'Sentences'}
              before={result.before.sentences}
              after={result.after.sentences}
            />
          </div>

          <p className={'text-muted-foreground mt-3 text-xs'}>
            Sentence variation is the spread of sentence lengths. Machine
            written prose tends to hold one length throughout, so a higher
            number reads as more natural.
          </p>
        </div>
      ) : null}
    </div>
  );
}
