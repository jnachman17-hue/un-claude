'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { FileUpIcon, SparklesIcon, UploadCloudIcon } from 'lucide-react';

import type { CleanResult, ScanResult } from '~/lib/engine/types';

import { CHECK_CLASSES, explain, prettyName } from './characters';
import { Checklist, type ChecklistRow } from './checklist';
import { ACCEPTED_FILES, base64ToText, fileToBase64, textToBase64 } from './encode';
import { MarkedText } from './marked-text';
import { SAMPLE_TEXT } from './sample';
import { detectProducer, provenanceItems } from './producer';
import { FREE_SANITISES, recordUse, remaining } from './free-uses';
import { Paywall } from './paywall';
import { ReceiptPanel } from './receipt-panel';
import type { Receipt } from '~/lib/engine/receipt';

type Phase = 'scanning' | 'scanned' | 'cleaning' | 'cleaned' | 'error' | 'locked';

interface Loaded {
  /** base64, exactly as sent to the engine, kept so sanitising can reuse it. */
  payload: string;
  name: string;
  /** Empty for a file. A file's content is not text we can show. */
  text: string;
}

/**
 * The product.
 *
 * One box. Paste text or drop a file, and the tool runs whatever applies to what
 * it was given. The visitor never chooses a layer and never sees the word.
 * 04 entry 39.
 *
 * Two actions. Scanning is free, instant and happens on its own. Sanitising is
 * the deliberate press and is the action that will cost credits. Folding them
 * into one button would mean either charging for the free hook or giving away
 * the paid work.
 */
export function Workbench() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [loaded, setLoaded] = useState<Loaded>({
    payload: '',
    name: 'paste.txt',
    text: SAMPLE_TEXT,
  });
  const [phase, setPhase] = useState<Phase>('scanning');
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [cleaned, setCleaned] = useState<CleanResult | null>(null);
  const [cleanedText, setCleanedText] = useState('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSample, setIsSample] = useState(true);
  const [editing, setEditing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [left, setLeft] = useState(FREE_SANITISES);

  const fileInput = useRef<HTMLInputElement>(null);
  const textArea = useRef<HTMLTextAreaElement>(null);
  const inFlight = useRef<AbortController | null>(null);

  const runScan = useCallback(async (next: Loaded) => {
    // A counter comparing "is this still the newest call" would work, but an
    // AbortController cannot get out of step with itself: the request that was
    // cancelled is exactly the request that must not apply its result, and the
    // cancelled request also stops travelling rather than finishing unwatched.
    inFlight.current?.abort();
    const attempt = new AbortController();
    inFlight.current = attempt;

    // Every previous result is dropped the instant new input arrives. Leaving
    // the old one on screen while the next scan runs is what made an uploaded
    // image report provenance found before anything had read it.
    setScan(null);
    setCleaned(null);
    setCleanedText('');
    setDownloadUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
    setMessage(null);
    setLoaded(next);
    setEditing(false);
    setPhase('scanning');

    // The scan takes about 40 milliseconds, too fast to read as work happening.
    // The floor is not decoration: watching the marks land is what explains the
    // product, and it needs long enough to be seen.
    const [result] = await Promise.all([
      fetch('/api/tool/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: next.payload, name: next.name }),
        signal: attempt.signal,
      })
        .then((response) => response.json())
        .catch(() => ({ ok: false, message: 'We could not reach the service. Please try again.' })),
      new Promise((resolve) => setTimeout(resolve, 640)),
    ]);

    if (attempt.signal.aborted) return;

    if (result?.ok) {
      setScan(result as ScanResult);
      setPhase('scanned');
    } else {
      setMessage(result?.message ?? 'Something went wrong.');
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    setLeft(remaining());
    void runScan({ payload: textToBase64(SAMPLE_TEXT), name: 'paste.txt', text: SAMPLE_TEXT });
  }, [runScan]);

  const scanText = () => {
    if (text.trim().length === 0) {
      setMessage('Paste some text, or choose a file.');
      setPhase('error');
      return;
    }
    setIsSample(false);
    void runScan({ payload: textToBase64(text), name: 'paste.txt', text });
  };

  const takeFile = async (file: File | undefined) => {
    if (!file) return;
    setIsSample(false);
    setText('');
    const payload = await fileToBase64(file);
    void runScan({ payload, name: file.name, text: '' });
  };

  const isFile = loaded.name !== 'paste.txt';
  // An image carries no writing. A document does. Pasted text always does.
  const carriesProse = !isFile || scan?.kind === 'container';

  const sanitise = async () => {
    // An image has no prose, so there is nothing for the rewrite to do and no
    // reason to spend a model call on it.
    const wantsRewrite = carriesProse;

    if (wantsRewrite && remaining() <= 0) {
      // Nothing is sent. Blurring a real result would mean paying for work the
      // visitor never sees.
      setPhase('locked');
      return;
    }

    setPhase('cleaning');
    setMessage(null);

    const result = await fetch('/api/tool/clean', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // The payload is the one already loaded. An earlier version rebuilt it and
      // sent an empty string for files, which surfaced as "nothing was sent"
      // over a file that was plainly on screen.
      body: JSON.stringify({ file: loaded.payload, name: loaded.name, layer_b: wantsRewrite }),
    })
      .then((response) => response.json())
      .catch(() => ({ ok: false, message: 'We could not reach the service. Please try again.' }));

    if (result?.ok) {
      const finished = result as CleanResult;
      setCleaned(finished);

      if (isFile) {
        // A cleaned file is useless to anybody if they cannot get it back.
        const binary = atob(finished.cleaned);
        const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
        setDownloadUrl(URL.createObjectURL(new Blob([bytes])));
      } else {
        setCleanedText(base64ToText(finished.cleaned));
      }

      if (wantsRewrite) {
        recordUse();
        setLeft(remaining());
      }

      setPhase('cleaned');
    } else {
      setMessage(result?.message ?? 'Something went wrong.');
      setPhase('error');
    }
  };

  const startEditing = () => {
    if (isSample) {
      setText('');
      setIsSample(false);
    }
    setEditing(true);
    requestAnimationFrame(() => textArea.current?.focus());
  };

  const busy = phase === 'scanning' || phase === 'cleaning';
  const done = phase === 'cleaned';
  const report = (scan?.report ?? {}) as Record<string, unknown>;
  const hits = scan?.report?.hits ?? [];
  const foundCount = hits.reduce((total, hit) => total + hit.count, 0);
  const receipt = (cleaned?.report as Record<string, unknown> | undefined)?.receipt as
    | Receipt
    | undefined;
  const stats = cleaned?.report?.stats;

  /**
   * How many of the characters the SCAN found are genuinely gone.
   *
   * The layer A counter alone is not the answer once a rewrite is involved. The
   * rewrite replaces the prose, so the hidden characters vanish with it, and the
   * layer A pass that runs afterwards then has nothing left to remove and
   * reports zero. Showing "3 found" and then "0 removed" reads as a failure over
   * a run that worked perfectly. So the finished text is re-read for the exact
   * characters that were found, which is the only honest count.
   */
  const stillPresent =
    done && cleanedText
      ? hits.reduce(
          (total, hit) =>
            total +
            [...cleanedText].filter(
              (character) =>
                `U+${character.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}` ===
                hit.codepoint,
            ).length,
          0,
        )
      : 0;
  const actuallyRemoved = Math.max(0, foundCount - stillPresent);
  const fileReport = (cleaned?.report ?? {}) as Record<string, unknown>;
  const actions = Array.isArray(fileReport.actions) ? (fileReport.actions as string[]) : [];
  const stillMarked =
    fileReport.still_has_c2pa === true || fileReport.still_has_ai_metadata === true;
  const producer = isFile && scan ? detectProducer(report) : null;

  const provenanceFound =
    report.has_c2pa === true ||
    report.has_ai_metadata === true ||
    (Array.isArray(report.findings) && report.findings.length > 0);

  const rows: ChecklistRow[] = [
    {
      id: 'characters',
      label: 'Hidden characters',
      state: busy || !scan ? 'pending' : done ? 'removed' : foundCount > 0 ? 'found' : 'absent',
      status: busy || !scan
        ? 'checking'
        : done
          ? foundCount > 0
            ? `${actuallyRemoved} of ${foundCount} removed`
            : 'none found'
          : foundCount > 0
            ? `${foundCount} found`
            : 'none found',
      detail: done
        ? foundCount === 0
          ? 'There were none in this to begin with.'
          : stillPresent > 0
            ? `${stillPresent} could not be removed. Read the result before you use it.`
            : stats && (stats.removed_count ?? 0) + (stats.replaced_count ?? 0) > 0
              ? // Removed and replaced are separate numbers and both are shown.
                // Some characters are deleted and some are swapped for an ordinary
                // space, and a swap does not change the length, so one figure
                // looks broken against the size change. API.md section 4.
                `${stats.removed_count ?? 0} deleted and ${stats.replaced_count ?? 0} swapped for ordinary spaces. The text was read back to confirm none are left.`
              : 'Removed with the rewrite, and the result was read back to confirm none are left.'
        : foundCount > 0
          ? 'Characters sitting between the words that never appear on the page.'
          : `None in this text. ${CHECK_CLASSES.length} classes checked, including ${CHECK_CLASSES.slice(0, 3).join(', ').toLowerCase()}.`,
      items:
        !busy && !done && hits.length > 0
          ? hits.map((hit) => ({
              key: hit.codepoint,
              head: `${prettyName(hit.label, hit.codepoint)}${hit.count > 1 ? ` x${hit.count}` : ''}`,
              body: explain(hit.codepoint, hit.kind),
            }))
          : undefined,
    },
    {
      id: 'provenance',
      label: 'File provenance',
      state: busy || !scan
        ? 'pending'
        : !isFile
          ? 'skipped'
          : done
            ? 'removed'
            : provenanceFound
              ? 'found'
              : 'absent',
      status: busy || !scan
        ? 'checking'
        : !isFile
          ? 'no file'
          : done
            ? stillMarked
              ? 'partly removed'
              : `${actions.length} removed`
            : provenanceFound
              ? producer
                ? `made by ${producer}`
                : 'found'
              : 'none found',
      detail: !isFile
        ? 'Provenance lives in a file’s wrapper. Pasted text has no wrapper, so there is nothing here to read. Upload a file and this one runs.'
        : done
          ? stillMarked
            ? 'Some provenance data could not be removed from this file. It is still marked.'
            : `Stripped, and the file was re-read afterwards to confirm nothing was left. ${fileReport.bytes_in ?? 0} bytes in, ${fileReport.bytes_out ?? 0} out, and the picture itself is untouched.`
          : provenanceFound
            ? producer
              ? `This file carries a signed record naming ${producer} as what made it.`
              : 'This file carries a record of the tool that made it.'
            : 'No content credentials, generator tags or AI metadata in this file.',
      items:
        !busy && isFile
          ? done
            ? actions.map((action, index) => ({
                key: `action-${index}`,
                head: 'Removed',
                body: action,
              }))
            : provenanceItems(report)
          : undefined,
    },
    {
      id: 'statistical',
      label: 'Statistical watermark',
      state: busy || !scan
        ? 'pending'
        : !carriesProse
          ? 'skipped'
          : done && receipt
            ? 'removed'
            : 'found',
      status: busy || !scan
        ? 'checking'
        : !carriesProse
          ? 'no text'
          : done && receipt
            ? 'rewritten'
            : 'present',
      detail: !carriesProse
        ? 'An image carries no writing, so there are no word choices for this mark to hide in.'
        : done && receipt
          ? `Rewritten. The longest run of your original wording still present is ${receipt.longestRun} words, and the signal this mark rides on needs longer runs than that.`
          : 'Hidden in which words the model picked, not in anything added between them. No tool can point to it, which is why it is removed rather than found.',
    },
  ];

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        void takeFile(event.dataTransfer.files?.[0]);
      }}
      /* A stable hook for checking what the tool is actually doing from
         outside it. This project's own runbook records eight occasions where a
         test failed and the fault was the measurement, so being able to read the
         real state without guessing from pixels is worth three characters of
         markup. */
      data-phase={phase}
      className={[
        'bg-card ring-border/70 relative rounded-[18px] ring-1 transition-shadow',
        'shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_-12px_rgba(0,0,0,0.10)]',
        dragging ? 'ring-mark-strong ring-2' : '',
      ].join(' ')}
    >
      {dragging ? (
        <div
          className={
            'bg-card/92 absolute inset-0 z-20 grid place-items-center rounded-[18px] backdrop-blur-[2px]'
          }
        >
          <div className={'flex flex-col items-center gap-2'}>
            <UploadCloudIcon className={'text-foreground/70 size-7'} strokeWidth={1.6} aria-hidden />
            <span className={'text-[13.5px] font-medium'}>Drop it anywhere in this box</span>
          </div>
        </div>
      ) : null}

      {/* The input surface. Deliberately inset and bordered so it reads as the
          thing you type into, separate from the findings underneath it. */}
      <div className={'p-3 sm:p-3.5'}>
        <div
          className={[
            'bg-background border-border/80 relative rounded-[13px] border transition-colors',
            editing ? 'border-foreground/25' : 'hover:border-foreground/20',
          ].join(' ')}
        >
          {editing ? (
            <textarea
              ref={textArea}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={'Paste your text here, or drop a file anywhere in this box.'}
              className={
                'text-foreground placeholder:text-muted-foreground/60 min-h-[184px] w-full resize-none bg-transparent px-4 py-3.5 text-[14.5px] leading-[1.75] tracking-[-0.005em] outline-none'
              }
            />
          ) : phase === 'locked' ? (
            <Paywall onDismiss={() => setPhase('scanned')} />
          ) : (
            <button
              type={'button'}
              onClick={startEditing}
              disabled={isFile}
              aria-label={'Edit this text'}
              className={
                'block w-full cursor-text px-4 py-3.5 text-left disabled:cursor-default'
              }
            >
              <div className={'min-h-[184px]'}>
                {isFile ? (
                  <FileSummary name={loaded.name} scanning={busy} />
                ) : done ? (
                  <MarkedText text={cleanedText} hits={[]} animate={false} />
                ) : (
                  <div className={isSample ? 'opacity-55' : ''}>
                    <MarkedText
                      text={loaded.text}
                      hits={phase === 'scanning' ? [] : hits}
                    />
                  </div>
                )}
              </div>
            </button>
          )}

          {/* Nothing about a paragraph of prose says "this is a demonstration,
              delete it". The label and the line beneath it do. */}
          {isSample && !editing ? (
            <>
              <span
                className={
                  'bg-foreground/[0.055] text-muted-foreground absolute top-2.5 right-2.5 rounded-[6px] px-2 py-[3px] text-[10.5px] font-medium tracking-wide uppercase'
                }
              >
                Example
              </span>
              <button
                type={'button'}
                onClick={startEditing}
                className={
                  'border-border/80 text-muted-foreground hover:text-foreground w-full border-t px-4 py-2.5 text-left text-[12.5px] transition-colors'
                }
              >
                Click anywhere above to clear this and paste your own text.
              </button>
            </>
          ) : null}

          {phase === 'scanning' ? (
            <div
              className={'pointer-events-none absolute inset-0 overflow-hidden rounded-[13px]'}
              aria-hidden
            >
              <div
                className={'animate-sweep from-mark/0 via-mark/30 to-mark/0 h-full w-1/3 bg-gradient-to-r'}
              />
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className={'mt-3 flex flex-wrap items-center gap-2'}>
          <input
            ref={fileInput}
            type={'file'}
            accept={ACCEPTED_FILES}
            className={'sr-only'}
            onChange={(event) => void takeFile(event.target.files?.[0])}
          />

          {editing ? (
            <button
              type={'button'}
              onClick={scanText}
              className={
                'bg-foreground text-background rounded-[9px] px-3.5 py-2 text-[12.5px] font-semibold transition-transform active:scale-[0.98]'
              }
            >
              Scan it
            </button>
          ) : (
            <button
              type={'button'}
              onClick={() => void sanitise()}
              disabled={busy || done}
              className={
                'bg-mark text-mark-foreground hover:bg-mark-strong inline-flex items-center gap-2 rounded-[9px] px-4 py-2 text-[13px] font-semibold transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45'
              }
            >
              <SparklesIcon className={'size-[14px]'} strokeWidth={2.2} aria-hidden />
              {phase === 'cleaning'
                ? carriesProse
                  ? 'Rewriting'
                  : 'Sanitising'
                : done
                  ? 'Sanitised'
                  : 'Sanitise it'}
            </button>
          )}

          <button
            type={'button'}
            onClick={() => fileInput.current?.click()}
            className={
              'text-foreground/70 hover:text-foreground hover:bg-foreground/[0.045] inline-flex items-center gap-1.5 rounded-[9px] px-2.5 py-2 text-[12.5px] font-medium transition-colors active:scale-[0.98]'
            }
          >
            <FileUpIcon className={'size-[13px]'} strokeWidth={2} aria-hidden />
            Upload a file
          </button>

          <p className={'text-muted-foreground ml-auto text-[11.5px]'}>
            {phase === 'error' ? (
              <span className={'text-destructive font-medium'}>{message}</span>
            ) : done && downloadUrl ? (
              <a
                href={downloadUrl}
                download={`cleaned-${loaded.name}`}
                className={'text-foreground font-semibold underline underline-offset-2'}
              >
                Download the clean file
              </a>
            ) : done ? (
              'Clean. Select the text above and copy it.'
            ) : phase === 'cleaning' && carriesProse ? (
              'Breaking up the wording. This takes a few seconds.'
            ) : left > 0 ? (
              `${left} free ${left === 1 ? 'rewrite' : 'rewrites'} left. Scanning is always free.`
            ) : (
              'Scanning is free and unlimited. Rewrites need credits.'
            )}
          </p>
        </div>
      </div>

      {/* The findings. A separate surface, with its own heading, because it
          answers a different question from the box above it. */}
      <div className={'border-border/70 bg-foreground/[0.017] rounded-b-[18px] border-t px-4 py-3.5 sm:px-5'}>
        <div className={'mb-2 flex items-baseline justify-between gap-3'}>
          <h2 className={'text-foreground text-[12px] font-semibold tracking-wide uppercase'}>
            Every mark we check for
          </h2>
          <span className={'text-muted-foreground text-[11.5px]'}>
            Checked in full, every time
          </span>
        </div>

        <Checklist rows={rows} />

        {receipt ? (
          <div className={'border-border/70 mt-4 border-t pt-4'}>
            <ReceiptPanel receipt={receipt} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FileSummary({ name, scanning }: { name: string; scanning: boolean }) {
  return (
    <div className={'flex h-[184px] flex-col items-start justify-center gap-1.5'}>
      <span className={'text-muted-foreground text-[12px]'}>
        {scanning ? 'Reading' : 'Loaded'}
      </span>
      <span className={'font-mono text-[15px] font-medium'}>{name}</span>
    </div>
  );
}
