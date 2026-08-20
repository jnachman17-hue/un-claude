'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  DownloadIcon,
  FileUpIcon,
  SparklesIcon,
  UploadCloudIcon,
  XIcon,
} from 'lucide-react';

import type { CleanResult, ScanResult } from '~/lib/engine/types';

import { CHECK_CLASSES, explain, prettyName } from './characters';
import { Checklist, type ChecklistRow } from './checklist';
import {
  ACCEPTED_FILES,
  base64ToText,
  fileToBase64,
  textToBase64,
} from './encode';
import { MarkedText } from './marked-text';
import { SAMPLE_TEXT } from './sample';
import { detectProducer, provenanceItems } from './producer';
import { FREE_SANITISES, recordUse, remaining } from './free-uses';
import { Paywall } from './paywall';
import { ReceiptPanel } from './receipt-panel';
import type { Receipt } from '~/lib/engine/receipt';
import * as track from '~/lib/analytics/events';

type Phase =
  | 'idle'
  | 'scanning'
  | 'scanned'
  | 'cleaning'
  | 'cleaned'
  | 'error'
  | 'locked';

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

  /**
   * Seconds spent on the current sanitise.
   *
   * A moving gradient says "something is running". It does not say "this is
   * still running and has not hung", which is the question somebody asks at
   * fifteen seconds. A number that keeps climbing answers it, and unlike a
   * progress bar it does not have to invent a percentage nobody can compute:
   * the work is model calls of unknown count, so any bar here would be a lie.
   */
  const [elapsed, setElapsed] = useState(0);

  const fileInput = useRef<HTMLInputElement>(null);
  const textArea = useRef<HTMLTextAreaElement>(null);
  const inFlight = useRef<AbortController | null>(null);

  const runScan = useCallback(async (next: Loaded, fromSample = false) => {
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
        .catch(() => ({
          ok: false,
          message: 'We could not reach the service. Please try again.',
        })),
      new Promise((resolve) => setTimeout(resolve, 640)),
    ]);

    if (attempt.signal.aborted) return;

    const kind: track.InputKind = next.name === 'paste.txt' ? 'text' : 'file';

    if (result?.ok) {
      setScan(result as ScanResult);
      setPhase('scanned');

      const found = result as ScanResult;
      const scanHits = found.report?.hits ?? [];
      const scanReport = (found.report ?? {}) as Record<string, unknown>;

      track.scanCompleted({
        inputKind: kind,
        name: next.name,
        characters: found.report?.length ?? next.text.length,
        marksFound: scanHits.reduce((total, hit) => total + hit.count, 0),
        markKinds: [...new Set(scanHits.map((hit) => hit.kind))],
        provenanceFound:
          scanReport.has_c2pa === true ||
          scanReport.has_ai_metadata === true ||
          (Array.isArray(scanReport.findings) &&
            scanReport.findings.length > 0),
        producer: kind === 'file' ? detectProducer(scanReport) : null,
        isSample: fromSample,
      });
    } else {
      setMessage(result?.message ?? 'Something went wrong.');
      setPhase('error');

      track.scanFailed({ inputKind: kind, name: next.name });
    }
  }, []);

  useEffect(() => {
    if (phase !== 'cleaning') {
      setElapsed(0);
      return;
    }
    const startedAt = Date.now();
    const timer = window.setInterval(
      () => setElapsed(Math.floor((Date.now() - startedAt) / 1000)),
      500,
    );
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    setLeft(remaining());
    void runScan(
      {
        payload: textToBase64(SAMPLE_TEXT),
        name: 'paste.txt',
        text: SAMPLE_TEXT,
      },
      true,
    );
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

  const takeFile = async (
    file: File | undefined,
    method: 'picker' | 'drop' = 'picker',
  ) => {
    if (!file) return;
    setIsSample(false);
    setText('');
    track.fileUploaded(file.name, file.size, method);
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

    const kind: track.InputKind = isFile ? 'file' : 'text';

    // EVERY sanitise is charged, not only a rewrite. 04 entry 63.
    //
    // This was `wantsRewrite && remaining() <= 0` until 19 August 2026, which
    // meant an image never reached the check and never spent a use: `wantsRewrite`
    // is false for anything that is not prose. Jon sanitised three files in a row
    // on the live site, never saw the paywall, and could have gone on for ever.
    // The gate has to sit in front of the work, and all three layers are work.
    if (remaining() <= 0) {
      // Nothing is sent. Blurring a real result would mean paying for work the
      // visitor never sees.
      setPhase('locked');
      track.paywallShown({ inputKind: kind, name: loaded.name });
      return;
    }

    setPhase('cleaning');
    setMessage(null);

    // Counted from here rather than from the click, so the number is the wait
    // the visitor actually sits through and not the paywall check in front of it.
    const startedAt = performance.now();
    const scanHits = scan?.report?.hits ?? [];
    const marksFound = scanHits.reduce((total, hit) => total + hit.count, 0);

    track.sanitiseStarted({
      inputKind: kind,
      name: loaded.name,
      rewriteIncluded: wantsRewrite,
      freeRewritesLeft: remaining(),
    });

    const result = await fetch('/api/tool/clean', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // The payload is the one already loaded. An earlier version rebuilt it and
      // sent an empty string for files, which surfaced as "nothing was sent"
      // over a file that was plainly on screen.
      body: JSON.stringify({
        file: loaded.payload,
        name: loaded.name,
        layer_b: wantsRewrite,
      }),
    })
      .then((response) => response.json())
      .catch(() => ({
        ok: false,
        message: 'We could not reach the service. Please try again.',
      }));

    if (result?.ok) {
      const finished = result as CleanResult;
      setCleaned(finished);

      if (isFile) {
        // A cleaned file is useless to anybody if they cannot get it back.
        const binary = atob(finished.cleaned);
        const bytes = Uint8Array.from(binary, (character) =>
          character.charCodeAt(0),
        );
        setDownloadUrl(URL.createObjectURL(new Blob([bytes])));
      } else {
        setCleanedText(base64ToText(finished.cleaned));
      }

      // Counted for every completed sanitise, and only on success: a failed run
      // costs the visitor nothing. 04 entries 16 and 66.
      recordUse();
      setLeft(remaining());

      setPhase('cleaned');

      // The same honest count the panel shows: the finished text is re-read for
      // the exact characters the scan found, rather than trusting the engine's
      // own removal figure, which reads zero whenever a rewrite replaced the
      // prose wholesale. See the note on `stillPresent` below.
      const finishedText = isFile ? '' : base64ToText(finished.cleaned);
      const stillThere = finishedText
        ? scanHits.reduce(
            (total, hit) =>
              total +
              [...finishedText].filter(
                (character) =>
                  `U+${character.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}` ===
                  hit.codepoint,
              ).length,
            0,
          )
        : 0;
      const finishedReport = (finished.report ?? {}) as Record<string, unknown>;

      track.sanitiseCompleted({
        inputKind: kind,
        name: loaded.name,
        rewriteIncluded: wantsRewrite,
        milliseconds: performance.now() - startedAt,
        marksFound,
        marksRemoved: Math.max(0, marksFound - stillThere),
        provenanceActions: Array.isArray(finishedReport.actions)
          ? finishedReport.actions.length
          : 0,
        stillMarked:
          finishedReport.still_has_c2pa === true ||
          finishedReport.still_has_ai_metadata === true,
      });
    } else {
      setMessage(result?.message ?? 'Something went wrong.');
      setPhase('error');

      track.sanitiseFailed({
        inputKind: kind,
        name: loaded.name,
        rewriteIncluded: wantsRewrite,
        milliseconds: performance.now() - startedAt,
      });
    }
  };

  /**
   * Drop every finding on screen.
   *
   * The checklist reads from `scan`, so leaving it in place while the box is
   * emptied showed "3 found" over an empty box with nothing to find. Jon hit it
   * by clicking into the example: the text cleared, the findings did not.
   */
  const clearResults = useCallback(() => {
    inFlight.current?.abort();
    setScan(null);
    setCleaned(null);
    setCleanedText('');
    setDownloadUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
    setMessage(null);
    setPhase('idle');
  }, []);

  /**
   * Back to an empty box, whatever was in it.
   *
   * Until 19 August 2026 there was no way out of a loaded file at all: `isFile`
   * is derived from the loaded name, the textarea is disabled while it is true,
   * and nothing ever set the name back. A file went in and the box was finished.
   */
  const startOver = useCallback(() => {
    clearResults();
    setText('');
    setLoaded({ payload: '', name: 'paste.txt', text: '' });
    setIsSample(false);
    setEditing(true);
    if (fileInput.current) fileInput.current.value = '';
    requestAnimationFrame(() => textArea.current?.focus());
  }, [clearResults]);

  const startEditing = () => {
    if (isSample) {
      setText('');
      setIsSample(false);
      track.ownTextEntered();
    }
    // The example's findings belong to the example. 06 row 72.
    clearResults();
    setEditing(true);
    requestAnimationFrame(() => textArea.current?.focus());
  };

  const busy = phase === 'scanning' || phase === 'cleaning';
  const done = phase === 'cleaned';
  /**
   * Nothing has been read yet. Distinct from `busy`, which means something is
   * being read right now.
   *
   * Both used to collapse into one branch reporting that it was checking, so an
   * empty box with nothing running claimed to be working. The rows still explain
   * what each layer is; they just stop claiming to be doing it.
   */
  const waitingStatus = busy ? 'checking' : 'not scanned';

  /** Nothing read yet, and nothing running. See RESTING_MAP. */
  const idle = !scan && !busy;
  const report = (scan?.report ?? {}) as Record<string, unknown>;
  const hits = scan?.report?.hits ?? [];
  const foundCount = hits.reduce((total, hit) => total + hit.count, 0);
  const receipt = (cleaned?.report as Record<string, unknown> | undefined)
    ?.receipt as Receipt | undefined;
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
  const actions = Array.isArray(fileReport.actions)
    ? (fileReport.actions as string[])
    : [];
  const stillMarked =
    fileReport.still_has_c2pa === true ||
    fileReport.still_has_ai_metadata === true;
  const producer = isFile && scan ? detectProducer(report) : null;

  const provenanceFound =
    report.has_c2pa === true ||
    report.has_ai_metadata === true ||
    (Array.isArray(report.findings) && report.findings.length > 0);

  /**
   * The panel's own heading, which now changes with what has happened.
   *
   * Jon: "when the page loads it should be like FOUND not everything we check
   * for, and then once you click it should say every mark we check for". It was
   * fixed text, so it announced a checklist while showing results and announced
   * results while showing an empty checklist.
   */
  const anythingFound = foundCount > 0 || provenanceFound || carriesProse;

  const panelHeading = done
    ? 'What we removed'
    : idle
      ? 'The three marks we look for'
      : busy || !scan
        ? 'Every mark we check for'
        : anythingFound
          ? 'What we found'
          : 'Nothing found in this';

  const panelCaption = done
    ? 'Read the result before you use it'
    : idle
      ? 'And which one applies to you'
      : busy || !scan
        ? 'All three, every time'
        : anythingFound
          ? 'Sanitise to remove it'
          : 'All three checked';

  /**
   * WHAT THE PANEL SAYS BEFORE ANYTHING HAS BEEN READ.
   *
   * The most valuable state in the box, and it was wasted: three rows saying
   * "not scanned", in the exact place a newcomer is trying to work out what this
   * tool does. At rest they become the map instead — what each mark is, and
   * WHICH INPUT CARRIES IT. Jon's routing problem, 06 row 63.
   *
   * The status chip carries the routing on its own. Where it later reads
   * "3 found" it now reads "text or file", "files only", "text only", so
   * "does this one apply to what I have?" is answered before anything is
   * uploaded — WITHOUT adding a chooser. 04 entry 39 stands: the tool still
   * routes itself; this only says in advance what it will do.
   *
   * "text only" on the statistical row is not a simplification for the reader's
   * benefit. Layer B runs on plain text and never on a container, 06 row 74, so
   * a Word document genuinely is not rewritten — and this is the first place the
   * interface has admitted it.
   */
  const RESTING_MAP: Record<
    ChecklistRow['id'],
    { status: string; detail: string }
  > = {
    characters: {
      status: 'text or file',
      detail:
        'Characters with no width, sitting between the words where nothing shows on the page. Tools like ChatGPT emit them and they survive copy and paste. We find every one and show you exactly where it was.',
    },
    provenance: {
      status: 'files only',
      detail:
        'Data hidden inside a file rather than in the words you can read: what made it, when, and often a signed record naming the tool. Claude signs the files it generates. Pasted text has no file around it, so this one sits out.',
    },
    statistical: {
      status: 'text only',
      detail:
        'Not a character you could search for. This one is in the words themselves, so there is nothing to highlight. We rewrite to break the word sequences it rides on, and check every number, date and name against your original.',
    },
  };

  const rows: ChecklistRow[] = (
    [
      {
        id: 'characters',
        label: 'Hidden characters',
        state:
          busy || !scan
            ? 'pending'
            : done
              ? 'removed'
              : foundCount > 0
                ? 'found'
                : 'absent',
        status:
          busy || !scan
            ? waitingStatus
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
              : stats &&
                  (stats.removed_count ?? 0) + (stats.replaced_count ?? 0) > 0
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
        label: 'Metadata',
        state:
          busy || !scan
            ? 'pending'
            : !isFile
              ? 'skipped'
              : done
                ? 'removed'
                : provenanceFound
                  ? 'found'
                  : 'absent',
        status:
          busy || !scan
            ? waitingStatus
            : !isFile
              ? 'no file'
              : done
                ? stillMarked
                  ? 'partly removed'
                  : `${actions.length} removed`
                : provenanceFound
                  ? producer
                    ? producer
                    : 'found'
                  : 'none found',
        detail: !isFile
          ? 'Metadata lives in a file’s wrapper. Pasted text has no wrapper, so there is nothing here to read. Upload a file and this one runs.'
          : done
            ? stillMarked
              ? 'Some metadata could not be removed from this file. It is still marked.'
              : `Stripped, and the file was re-read afterwards to confirm nothing was left. ${fileReport.bytes_in ?? 0} bytes in, ${fileReport.bytes_out ?? 0} out, and the picture itself is untouched.`
            : provenanceFound
              ? producer
                ? `Made by ${producer}. The file says so in a signed record that free tools can read. We take it out and show you the file before and after.`
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
        state:
          busy || !scan
            ? 'pending'
            : !carriesProse
              ? 'skipped'
              : done && receipt
                ? 'removed'
                : 'found',
        status:
          busy || !scan
            ? waitingStatus
            : !carriesProse
              ? 'no text'
              : done && receipt
                ? 'rewritten'
                : 'present',
        detail: !carriesProse
          ? 'An image carries no writing, so there are no word choices for this mark to hide in.'
          : done && receipt
            ? `Rewritten. The longest run of your original wording still present is ${receipt.longestRun} words, and the signal this mark rides on needs longer runs than that to survive.`
            : 'Anthropic applies this to Claude models launched from 2 August 2026, globally, with no way to opt out. It hides in which words the model picked rather than in anything added between them, so no tool can point at it. That is why it is removed rather than found.',
      },
    ] satisfies ChecklistRow[]
  ).map((row) =>
    idle
      ? {
          ...row,
          ...RESTING_MAP[row.id],
          state: 'pending' as const,
          items: undefined,
        }
      : row,
  );

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
        void takeFile(event.dataTransfer.files?.[0], 'drop');
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
            <UploadCloudIcon
              className={'text-foreground/70 size-7'}
              strokeWidth={1.6}
              aria-hidden
            />
            <span className={'text-[13.5px] font-medium'}>
              Drop it anywhere in this box
            </span>
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
              onChange={(event) => {
                setText(event.target.value);
                // The findings describe the text that WAS scanned. The moment it
                // changes they describe nothing, so they go.
                if (scan || cleaned || message) clearResults();
              }}
              placeholder={
                'Paste your text here, or drop a file anywhere in this box.'
              }
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
                  <FileSummary
                    name={loaded.name}
                    scanning={busy}
                    downloadUrl={done ? downloadUrl : null}
                    onDownload={() =>
                      track.resultDownloaded({ name: loaded.name })
                    }
                    onClear={startOver}
                  />
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
            <button
              type={'button'}
              onClick={startEditing}
              className={
                'border-border/80 text-muted-foreground hover:text-foreground flex w-full items-center gap-2 border-t px-4 py-2.5 text-left text-[12.5px] transition-colors'
              }
            >
              <span
                className={
                  'bg-foreground/[0.07] text-foreground/70 shrink-0 rounded-[5px] px-1.5 py-[2px] text-[10px] font-semibold tracking-wide uppercase'
                }
              >
                Example
              </span>
              Click anywhere above to clear this and paste your own text.
            </button>
          ) : null}

          {/*
            THE SWEEP RUNS FOR BOTH OPERATIONS NOW, AND IT USED TO RUN FOR THE
            WRONG ONE.

            It was `phase === 'scanning'` only. Scanning is the FAST half —
            measured 1.13s against production. Sanitising is the half that can
            take 38 seconds on a number-dense document, 06 row 66, and it had no
            motion at all. So the box animated while it was quick and sat
            perfectly still while it was slow, which is exactly backwards and is
            why Jon reported it as feeling like nothing was happening.
          */}
          {busy ? (
            <div
              className={
                'pointer-events-none absolute inset-0 overflow-hidden rounded-[13px]'
              }
              aria-hidden
            >
              <div
                className={
                  'animate-sweep from-mark/0 via-mark/30 to-mark/0 h-full w-1/3 bg-gradient-to-r'
                }
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
              <SparklesIcon
                className={'size-[14px]'}
                strokeWidth={2.2}
                aria-hidden
              />
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
                onClick={() => track.resultDownloaded({ name: loaded.name })}
                className={
                  'text-foreground font-semibold underline underline-offset-2'
                }
              >
                Download the clean file
              </a>
            ) : done ? (
              'Clean. Select the text above and copy it.'
            ) : phase === 'cleaning' ? (
              // The existing sentence, with the clock appended once it is worth
              // asking whether anything is still happening. Below three seconds
              // a counter is noise; above it, it is the whole answer.
              <>
                {carriesProse
                  ? 'Breaking up the wording. This takes a few seconds.'
                  : 'Working through the file.'}
                {elapsed >= 3 ? (
                  <span
                    className={'text-foreground ml-1.5 font-mono tabular-nums'}
                  >
                    {elapsed}s
                  </span>
                ) : null}
              </>
            ) : left > 0 ? (
              `${left} free ${left === 1 ? 'credit' : 'credits'} left. Scanning is always free.`
            ) : (
              'Scanning is free and unlimited. Sanitising needs credits.'
            )}
          </p>
        </div>
      </div>

      {/* The findings. A separate surface, with its own heading, because it
          answers a different question from the box above it. */}
      <div
        className={
          'border-border bg-foreground/[0.035] rounded-b-[18px] border-t-2 px-4 py-4 sm:px-5'
        }
      >
        <div className={'mb-2 flex items-baseline justify-between gap-3'}>
          <h2
            className={
              'text-foreground text-[11.5px] font-semibold tracking-[0.06em] uppercase'
            }
          >
            {panelHeading}
          </h2>
          <span className={'text-muted-foreground text-[11px]'}>
            {panelCaption}
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

/**
 * The loaded file, and the two things you always want next to it: the clean copy,
 * and a way to put something else in.
 *
 * Neither existed until 19 August 2026. A loaded file disabled the textarea and
 * nothing ever cleared it, so the box read "Loaded <name>" for ever and the only
 * escape was a button labelled "Upload a file" that did not look like one.
 */
function FileSummary({
  name,
  scanning,
  downloadUrl,
  onDownload,
  onClear,
}: {
  name: string;
  scanning: boolean;
  downloadUrl: string | null;
  onDownload: () => void;
  onClear: () => void;
}) {
  return (
    <div
      className={'flex h-[184px] flex-col items-start justify-center gap-1.5'}
    >
      <span className={'text-muted-foreground text-[12px]'}>
        {scanning ? 'Reading' : 'Loaded'}
      </span>
      <span className={'font-mono text-[15px] font-medium'}>{name}</span>

      {!scanning ? (
        <div className={'mt-2 flex flex-wrap items-center gap-2'}>
          {downloadUrl ? (
            <a
              href={downloadUrl}
              download={`cleaned-${name}`}
              onClick={(event) => {
                event.stopPropagation();
                onDownload();
              }}
              className={
                'bg-foreground text-background inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[12px] font-semibold transition-transform active:scale-[0.98]'
              }
            >
              <DownloadIcon
                className={'size-[13px]'}
                strokeWidth={2.2}
                aria-hidden
              />
              Download the clean file
            </a>
          ) : null}

          <button
            type={'button'}
            onClick={(event) => {
              event.stopPropagation();
              onClear();
            }}
            className={
              'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.045] inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[12px] font-medium transition-colors'
            }
          >
            <XIcon className={'size-[13px]'} strokeWidth={2.2} aria-hidden />
            Remove
          </button>
        </div>
      ) : null}
    </div>
  );
}
