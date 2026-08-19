'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { FileUpIcon, PencilLineIcon, SparklesIcon } from 'lucide-react';

import type { CleanResult, ScanResult } from '~/lib/engine/types';

import { Checklist, type ChecklistRow } from './checklist';
import { ACCEPTED_FILES, base64ToText, fileToBase64, textToBase64 } from './encode';
import { MarkedText, MarkedTextLegend } from './marked-text';
import { SAMPLE_CAPTION, SAMPLE_TEXT } from './sample';
import { SourceSelect } from './source-select';
import { DEFAULT_SOURCE, type Source } from './sources';

type Phase = 'editing' | 'scanning' | 'scanned' | 'cleaning' | 'cleaned' | 'error';

/**
 * The product.
 *
 * One box. The visitor pastes text or drops a file and never chooses a layer:
 * the tool runs whatever applies to what it was given. 04 entry 39.
 *
 * Two actions, not one. Scanning is free, instant and unlimited, so it happens
 * on its own. Sanitising is the deliberate press, and it is the action that will
 * cost credits. Folding them into a single button would mean either charging for
 * the free hook or giving away the paid work.
 */
export function Workbench() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [scannedText, setScannedText] = useState(SAMPLE_TEXT);
  const [source, setSource] = useState<Source>(DEFAULT_SOURCE);
  const [phase, setPhase] = useState<Phase>('scanning');
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [cleaned, setCleaned] = useState<CleanResult | null>(null);
  const [cleanedText, setCleanedText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSample, setIsSample] = useState(true);

  const fileInput = useRef<HTMLInputElement>(null);
  const request = useRef(0);

  const runScan = useCallback(async (payloadFile: string, name: string, shownText: string) => {
    const ticket = ++request.current;
    setPhase('scanning');
    setMessage(null);
    setCleaned(null);

    // The scan itself takes about 40 milliseconds, which is too fast to read as
    // work having happened. The floor is not padding for its own sake: watching
    // the markers land is the moment that explains the product, and it needs
    // long enough to be perceived.
    const [result] = await Promise.all([
      fetch('/api/tool/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: payloadFile, name }),
      })
        .then((response) => response.json())
        .catch(() => ({ ok: false, message: 'We could not reach the service. Please try again.' })),
      new Promise((resolve) => setTimeout(resolve, 620)),
    ]);

    if (ticket !== request.current) return;

    if (result?.ok) {
      setScan(result as ScanResult);
      setScannedText(shownText);
      setPhase('scanned');
    } else {
      setMessage(result?.message ?? 'Something went wrong.');
      setPhase('error');
    }
  }, []);

  // The page arrives and scans itself. Nothing to click, nothing to read first.
  useEffect(() => {
    void runScan(textToBase64(SAMPLE_TEXT), 'paste.txt', SAMPLE_TEXT);
  }, [runScan]);

  const onScanText = () => {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      setMessage('Paste some text, or choose a file.');
      setPhase('error');
      return;
    }
    setFileName(null);
    setIsSample(trimmed === SAMPLE_TEXT.trim());
    void runScan(textToBase64(text), 'paste.txt', text);
  };

  const onChooseFile = async (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    setIsSample(false);
    setText('');
    const encoded = await fileToBase64(file);
    void runScan(encoded, file.name, '');
  };

  const onSanitise = async () => {
    setPhase('cleaning');
    setMessage(null);

    const payload = fileName
      ? { file: scan ? '' : '', name: fileName }
      : { file: textToBase64(scannedText), name: 'paste.txt' };

    // Layer B is not wired here yet. It costs money on every run and the credit
    // gate that has to sit in front of it does not exist, so this press runs the
    // free, instant, provable half: hidden characters and file provenance.
    const result = await fetch('/api/tool/clean', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, layer_b: false }),
    })
      .then((response) => response.json())
      .catch(() => ({ ok: false, message: 'We could not reach the service. Please try again.' }));

    if (result?.ok) {
      setCleaned(result as CleanResult);
      if (!fileName) setCleanedText(base64ToText((result as CleanResult).cleaned));
      setPhase('cleaned');
    } else {
      setMessage(result?.message ?? 'Something went wrong.');
      setPhase('error');
    }
  };

  const hits = scan?.report?.hits ?? [];
  const foundCount = hits.reduce((total, hit) => total + hit.count, 0);
  const isFile = Boolean(fileName);
  const busy = phase === 'scanning' || phase === 'cleaning';

  const done = phase === 'cleaned';
  const stats = cleaned?.report?.stats;
  const removed = (stats?.removed_count ?? 0) + (stats?.replaced_count ?? 0);

  const rows: ChecklistRow[] = [
    {
      id: 'characters',
      label: 'Hidden characters',
      state: busy ? 'pending' : done ? 'clean' : foundCount > 0 ? 'found' : 'clean',
      status: busy
        ? 'checking'
        : done
          ? removed > 0
            ? `${removed} removed`
            : 'clean'
          : foundCount > 0
            ? `${foundCount} found`
            : 'clean',
      detail: done
        ? // Removed and replaced are separate numbers and both have to be shown.
          // Some characters are deleted and some are swapped for an ordinary
          // space, and a swap does not change the length, so a single "removed"
          // figure will not match the size change and looks broken. API.md
          // section 4, and it has already caught this project once.
          `${stats?.removed_count ?? 0} deleted, ${stats?.replaced_count ?? 0} replaced with ordinary spaces. Nothing else in the text changed.`
        : foundCount > 0
          ? 'Marked above, exactly where each one sits. Invisible on the page until now.'
          : 'Nine classes checked: zero width, direction, tag, variation selector, private use, space and lookalike.',
    },
    {
      id: 'provenance',
      label: 'File provenance',
      state: busy ? 'pending' : isFile ? (done ? 'clean' : scan?.suspicious ? 'found' : 'clean') : 'skipped',
      status: busy
        ? 'checking'
        : isFile
          ? done
            ? 'removed'
            : scan?.suspicious
              ? 'found'
              : 'clean'
          : 'no file',
      detail: isFile
        ? 'C2PA content credentials, EXIF, XMP and generator tags, read from the file wrapper.'
        : 'Pasted text has no file wrapper to read. Upload a file and this one runs.',
    },
    {
      id: 'statistical',
      label: 'Statistical watermark',
      state: busy ? 'pending' : source.watermarksText ? 'present' : 'clean',
      status: busy ? 'checking' : source.watermarksText ? 'present' : 'not confirmed',
      detail: source.statement,
    },
  ];

  return (
    <div className={'bg-card ring-border/70 rounded-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_-12px_rgba(0,0,0,0.10)] ring-1'}>
      {/* Controls */}
      <div className={'border-border/70 flex flex-wrap items-center gap-3 border-b px-4 py-2.5 sm:px-5'}>
        <SourceSelect value={source} onChange={setSource} />

        <div className={'ml-auto flex items-center gap-2'}>
          <input
            ref={fileInput}
            type={'file'}
            accept={ACCEPTED_FILES}
            className={'sr-only'}
            onChange={(event) => void onChooseFile(event.target.files?.[0])}
          />
          <button
            type={'button'}
            onClick={() => fileInput.current?.click()}
            className={
              'text-foreground/75 hover:text-foreground hover:bg-foreground/[0.045] inline-flex items-center gap-1.5 rounded-[9px] px-2.5 py-1.5 text-[12.5px] font-medium transition-colors active:scale-[0.98]'
            }
          >
            <FileUpIcon className={'size-[13px]'} strokeWidth={2} aria-hidden />
            Upload a file
          </button>
        </div>
      </div>

      {/* The text */}
      <div className={'relative px-4 py-4 sm:px-5'}>
        {phase === 'editing' ? (
          <textarea
            autoFocus
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={'Paste your text here.'}
            className={
              'text-foreground placeholder:text-muted-foreground/70 min-h-[150px] w-full resize-none border-0 bg-transparent text-[15px] leading-[1.75] tracking-[-0.005em] outline-none'
            }
          />
        ) : (
          <div className={'min-h-[150px]'}>
            {isFile ? (
              <FileSummary name={fileName!} />
            ) : phase === 'cleaned' ? (
              <MarkedText text={cleanedText} hits={[]} animate={false} />
            ) : (
              <MarkedText text={scannedText} hits={phase === 'scanning' ? [] : hits} />
            )}
          </div>
        )}

        {phase === 'scanning' ? (
          <div
            className={'pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden'}
            aria-hidden
          >
            <div
              className={
                'animate-sweep from-mark/0 via-mark/25 to-mark/0 h-full w-1/3 bg-gradient-to-r'
              }
            />
          </div>
        ) : null}
      </div>

      {/* Legend and edit affordance */}
      <div className={'border-border/70 flex flex-wrap items-center gap-x-5 gap-y-3 border-t px-4 py-2.5 sm:px-5'}>
        {phase === 'scanned' && hits.length > 0 ? <MarkedTextLegend hits={hits} /> : null}

        {phase === 'cleaned' ? (
          <p className={'text-[12.5px] font-medium'}>
            Clean. Select the text above and copy it.
          </p>
        ) : null}

        {phase === 'error' ? (
          <p className={'text-destructive text-[12.5px] font-medium'}>{message}</p>
        ) : null}

        <div className={'ml-auto flex items-center gap-2'}>
          {phase === 'editing' ? (
            <button
              type={'button'}
              onClick={onScanText}
              className={
                'bg-foreground text-background inline-flex items-center gap-1.5 rounded-[9px] px-3.5 py-2 text-[12.5px] font-semibold transition-transform active:scale-[0.98]'
              }
            >
              Scan it
            </button>
          ) : (
            <button
              type={'button'}
              onClick={() => {
                setPhase('editing');
                setFileName(null);
                if (isSample) setText('');
              }}
              className={
                'text-foreground/70 hover:text-foreground hover:bg-foreground/[0.045] inline-flex items-center gap-1.5 rounded-[9px] px-2.5 py-1.5 text-[12.5px] font-medium transition-colors active:scale-[0.98]'
              }
            >
              <PencilLineIcon className={'size-[13px]'} strokeWidth={2} aria-hidden />
              {isSample ? 'Use your own text' : 'Edit'}
            </button>
          )}
        </div>
      </div>

      {/* What was checked */}
      <div className={'bg-foreground/[0.018] rounded-b-[18px] px-4 py-3.5 sm:px-5'}>
        <Checklist rows={rows} />

        <div className={'border-border/70 mt-3.5 flex flex-wrap items-center gap-3 border-t pt-3.5'}>
          <button
            type={'button'}
            onClick={() => void onSanitise()}
            disabled={busy || phase === 'editing'}
            className={
              'bg-mark text-mark-foreground hover:bg-mark-strong inline-flex items-center gap-2 rounded-[10px] px-4 py-2.5 text-[13.5px] font-semibold transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45'
            }
          >
            <SparklesIcon className={'size-[15px]'} strokeWidth={2.2} aria-hidden />
            {phase === 'cleaning' ? 'Sanitising' : 'Sanitise it'}
          </button>

          <p className={'text-muted-foreground text-[12px] leading-snug'}>
            {isSample && phase !== 'cleaned'
              ? SAMPLE_CAPTION
              : 'Free while we are in preview. No account needed.'}
          </p>
        </div>
      </div>
    </div>
  );
}

function FileSummary({ name }: { name: string }) {
  return (
    <div className={'flex h-[150px] flex-col items-start justify-center gap-1.5'}>
      <span className={'text-muted-foreground text-[12px]'}>Reading</span>
      <span className={'font-mono text-[15px] font-medium'}>{name}</span>
    </div>
  );
}
