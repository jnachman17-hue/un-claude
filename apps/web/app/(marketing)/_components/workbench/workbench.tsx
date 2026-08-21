'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  CopyIcon,
  DownloadIcon,
  FileTextIcon,
  FileUpIcon,
  ImageIcon,
  SparklesIcon,
  UploadCloudIcon,
  WandSparklesIcon,
  XIcon,
} from 'lucide-react';

import type { CleanResult, ScanResult } from '~/lib/engine/types';

import { CHECK_CLASSES, prettyName, shortExplain } from './characters';
import { Checklist, type ChecklistRow } from './checklist';
import {
  ACCEPTED_FILES,
  base64ToText,
  fileToBase64,
  textToBase64,
} from './encode';
import { MarkedText } from './marked-text';
import { detectProducer, provenanceItems } from './producer';
import { useCaptchaToken } from '@kit/auth/captcha/client';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';

import { CreditChip, CreditCoin } from './credit-chip';
import {
  type CreditsState,
  WELCOME_CREDITS,
  costFor,
  countWords,
  devMode,
  ensureSession,
  fetchCredits,
} from './credits';
import { OutOfCredits, SignedInWelcome } from './credit-offer';
import { Paywall } from './paywall';
import { SAMPLE_HINT, SAMPLE_TEXT } from './sample';
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
  /**
   * THE BOX ARRIVES EMPTY. Jon's executive decision, 19 August 2026.
   *
   * It used to arrive holding an example paragraph and scanning itself, 04
   * entry 42, so the first thing a visitor met was a finished result for text
   * that was not theirs: three marked bars, three rows in three different
   * answer formats, and a heading claiming a find. His verdict: "it's just too
   * clunky and it's too confusing the other way around."
   *
   * So the page now opens in what used to be the state AFTER you cleared the
   * example: an empty box, and the three marks named underneath.
   */
  const [text, setText] = useState('');
  const [loaded, setLoaded] = useState<Loaded>({
    payload: '',
    name: 'paste.txt',
    text: '',
  });
  const [phase, setPhase] = useState<Phase>('idle');
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [cleaned, setCleaned] = useState<CleanResult | null>(null);
  const [cleanedText, setCleanedText] = useState('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSample, setIsSample] = useState(false);
  /*
   * OPEN AND READY TO TYPE. With no example loaded there is nothing to display
   * in the read-only branch, so the box would otherwise arrive blank with no
   * placeholder at all.
   */
  const [editing, setEditing] = useState(true);
  /** The arrival swoosh, one run only. See the panel below the textarea. */
  const [swooshDone, setSwooshDone] = useState(false);
  /** Two-second confirmation after the clean text is copied. */
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  /**
   * What the server says this browser holds. `balance: null` means no account
   * exists yet, which is every fresh visitor: the interface shows the static
   * welcome figure, which is true by definition because nothing has been
   * spent. The first sanitise creates the guest account and from then on the
   * number is the ledger's. 04 entry 97.
   */
  const [credits, setCredits] = useState<CreditsState>({
    balance: null,
    isAnonymous: true,
  });
  /** Which paywall to show while phase is 'locked', and with what numbers. */
  const [wall, setWall] = useState<{
    variant: 'account' | 'buy';
    needed?: number;
    have?: number;
  }>({ variant: 'account' });
  /**
   * THE DEAD END, WATCHED FOR. 21 August 2026, Jon: "Most people will see 2
   * free scans, then give up because they see their token at zero and not
   * even try again."
   *
   * True is "the balance reached nought while they were sitting here", which
   * is the moment the offer should arrive with a bit of movement. False with
   * a balance of nought means they walked in already empty, and the same
   * offer is shown, still, but without the animation: motion that fires on
   * page load reads as decoration rather than as news.
   */
  const [justRanOut, setJustRanOut] = useState(false);
  const previousBalance = useRef<number | null>(null);
  /**
   * Whether this page load is the one straight after signing in. Set by the
   * auth routes; see app/auth/welcome.ts.
   *
   * Read from `window.location` inside an effect rather than through
   * `useSearchParams`, which would pull this whole tree behind a Suspense
   * boundary and take the landing page's static render with it.
   */
  const [welcoming, setWelcoming] = useState(false);

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

  const supabase = useSupabase();
  const { captchaToken } = useCaptchaToken();

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
    void fetchCredits().then(setCredits);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (new URLSearchParams(window.location.search).get('welcome') !== '1') {
      return;
    }

    setWelcoming(true);

    // The flag has been read, so it comes off the address bar. Otherwise a
    // reload, a share or a back button replays the greeting.
    const clean = new URL(window.location.href);
    clean.searchParams.delete('welcome');
    window.history.replaceState(null, '', clean.pathname + clean.search);
  }, []);

  /**
   * The watch itself. It runs on every balance the server hands back, so it
   * catches the drop to nought whether it came from a finished sanitise or
   * from a refetch after a 402.
   */
  useEffect(() => {
    const now = credits.balance;
    const before = previousBalance.current;

    previousBalance.current = now;

    if (now !== 0) {
      if (now !== null && now > 0) setJustRanOut(false);
      return;
    }

    // Nought, and it was something else a moment ago: that is the event.
    if (before !== null && before > 0) setJustRanOut(true);
  }, [credits.balance]);

  /** One event per arrival at the empty balance, not one per render. */
  const reportedEmpty = useRef(false);

  useEffect(() => {
    if (credits.balance !== 0) {
      reportedEmpty.current = false;
      return;
    }
    if (reportedEmpty.current) return;

    reportedEmpty.current = true;
    track.outOfCreditsShown({
      isGuest: credits.isAnonymous,
      justRanOut,
    });
  }, [credits.balance, credits.isAnonymous, justRanOut]);

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
    const bypass = devMode();

    /**
     * PRE-FLIGHT, FROM WHAT THE INTERFACE ALREADY KNOWS. The server is the
     * authority on every one of these and re-checks them all; failing fast
     * here just saves the visitor a round trip when the answer is already
     * certain. EVERY sanitise is charged, not only a rewrite, 04 entry 63:
     * the gate sits in front of the work, and all three layers are work.
     */
    if (!bypass) {
      const cost = costFor({
        isFile,
        name: loaded.name,
        wantsRewrite,
        words: countWords(loaded.text || text),
      });

      /*
       * A guest's credits buy the rewrite too, 04 entry 98. The block that
       * used to sit here made the welcome credits unspendable on pasted
       * text, which is the only thing most visitors bring.
       */
      if (credits.balance !== null && credits.balance < cost) {
        setWall({
          variant: credits.isAnonymous ? 'account' : 'buy',
          needed: cost,
          have: credits.balance,
        });
        setPhase('locked');
        track.paywallShown({ inputKind: kind, name: loaded.name });
        return;
      }
    }

    setPhase('cleaning');
    setMessage(null);

    /**
     * A session, before any work is attempted. First use creates the guest
     * account here, lazily, so a visitor who never sanitises never becomes a
     * row anywhere. The captcha token rides along when the site has one.
     */
    if (!bypass) {
      const haveSession = await ensureSession(supabase, captchaToken);

      if (!haveSession) {
        setMessage('We could not start a session. Please try again.');
        setPhase('error');
        return;
      }
    }

    // Counted from here rather than from the click, so the number is the wait
    // the visitor actually sits through and not the paywall check in front of it.
    const startedAt = performance.now();
    const scanHits = scan?.report?.hits ?? [];
    const marksFound = scanHits.reduce((total, hit) => total + hit.count, 0);

    track.sanitiseStarted({
      inputKind: kind,
      name: loaded.name,
      rewriteIncluded: wantsRewrite,
      freeRewritesLeft: credits.balance ?? WELCOME_CREDITS,
    });

    const result = await fetch('/api/tool/clean', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(bypass ? { 'x-uc-dev': '1' } : {}),
      },
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

    /**
     * THE SERVER'S VERDICTS, each with its own door. 402 carries the exact
     * numbers so the wall can say "needs 3, have 2"; 403 is the rewrite
     * asking for an account; 401 means the session died mid-visit, and the
     * kindest handling is a fresh balance fetch and the normal error path.
     */
    if (result?.code === 'insufficient_credits') {
      setWall({
        variant: result.isAnonymous === false ? 'buy' : 'account',
        needed: result.needed,
        have: result.have,
      });
      setPhase('locked');
      track.paywallShown({ inputKind: kind, name: loaded.name });
      void fetchCredits().then(setCredits);
      return;
    }

    if (result?.code === 'requires_account') {
      setWall({ variant: 'account', have: credits.balance ?? undefined });
      setPhase('locked');
      track.paywallShown({ inputKind: kind, name: loaded.name });
      return;
    }

    if (result?.ok) {
      const finished = result as CleanResult & {
        credits?: { charged: number; balance: number | null };
      };
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

      // The server answers with the new balance on every success, so the
      // number on screen is the ledger's, not an optimistic guess.
      if (typeof finished.credits?.balance === 'number') {
        setCredits((previous) => ({
          ...previous,
          balance: finished.credits!.balance,
        }));
      } else {
        void fetchCredits().then(setCredits);
      }

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

  /**
   * THE SAMPLE IS A BUTTON NOW, NOT THE ARRIVAL STATE.
   *
   * docs/09 section 1: every working tool in the category ships an empty box
   * with a sample control beside it. GPTZero runs six chips, Copyleaks five.
   * The box stays honest about whose text goes in it, and the curious visitor
   * with nothing to paste still gets the demonstration on demand.
   */
  const loadSample = () => {
    setText(SAMPLE_TEXT);
    setIsSample(true);
    void runScan(
      {
        payload: textToBase64(SAMPLE_TEXT),
        name: 'paste.txt',
        text: SAMPLE_TEXT,
      },
      true,
    );
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

  /** Countable marks only: characters plus a signed record. Never layer B. */
  const markCount = foundCount + (provenanceFound ? 1 : 0);

  const panelHeading = done
    ? 'What we removed'
    : idle
      ? 'We scan for every kind of watermark'
      : busy || !scan
        ? 'Every mark we check for'
        : isSample && anythingFound
          ? 'What is in this example'
          : anythingFound
            ? 'What we found'
            : 'Nothing found in this';

  const panelCaption = done
    ? 'Read the result before you use it'
    : idle
      ? // The balance moved out of this caption and into the coin chip
        // beside it, 04 entry 98. Scanning being free is the thing worth
        // saying next to a balance.
        'Scanning is always free'
      : busy || !scan
        ? 'All three, every time'
        : isSample && anythingFound
          ? // Jon, 19 August 2026: this said the same thing as the Sanitise
            // button directly above it. On a real document it is a useful next
            // step; on the example it was pure duplication.
            ''
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
    {
      status: string;
      detail: string;
      teach: true;
      items: Array<{ key: string; head: string; body: string }>;
    }
  > = {
    /*
     * ONE GRAMMAR FOR EVERY STATUS: the state of your input. "Awaiting text
     * or file / Awaiting a file / Awaiting text." Jon's central complaint,
     * three times over: a count, a missing input and a philosophy lesson side
     * by side is not a system. The property talk ("nothing can show this
     * one") moved into the teach table where it has room to make sense.
     *
     * The teach table itself is Jon's design: three columns, What it is,
     * Who puts it there, What we do, orange deepening column by column.
     */
    characters: {
      status: 'Awaiting text or file',
      detail: 'Invisible characters sitting between your words.',
      teach: true,
      items: [
        {
          key: 'what',
          head: 'What it is',
          body: 'Invisible spaces and joiners: real characters that hold a position in your text and display as nothing.',
        },
        {
          key: 'who',
          head: 'Who puts it there',
          body: 'Many major AI models leave them behind, and they survive copy, paste and export.',
        },
        {
          key: 'we',
          head: 'How we remove it',
          body: 'Find every one, show you where it sat, remove it, and prove none are left.',
        },
      ],
    },
    provenance: {
      status: 'Awaiting a file',
      detail: 'A digital fingerprint hidden inside your file.',
      teach: true,
      items: [
        {
          key: 'what',
          head: 'What it is',
          body: 'A signed record inside the file naming the tool that made it, and when.',
        },
        {
          key: 'who',
          head: 'Who puts it there',
          body: 'Every major AI model signs its files. Claude included.',
        },
        {
          key: 'we',
          head: 'How we remove it',
          body: 'Strip the record and show you the file before and after, byte for byte.',
        },
      ],
    },
    statistical: {
      status: 'Awaiting text',
      detail: 'The watermark hidden in the sequence of your words.',
      teach: true,
      items: [
        {
          key: 'what',
          head: 'What it is',
          body: 'Nothing is added to your text. The mark is the pattern of word choices itself, and no tool can show it. Yet.',
        },
        {
          key: 'who',
          head: 'Who puts it there',
          body: 'Claude and other major models, everywhere, with no off switch.',
        },
        {
          key: 'we',
          head: 'How we sanitise it',
          body: 'A structurally engineered rebuild of every sentence that keeps your facts and your length, and hands you the receipts.',
        },
      ],
    },
  };

  const rows: ChecklistRow[] = (
    [
      {
        id: 'characters',
        label: 'Hidden characters',
        where: 'Lives invisibly between your words',
        // An image has no text, so this check cannot apply to it. `skipped`
        // before anything else, exactly like the statistical row: a grey row
        // for an irrelevant check, never a green "none found" that implies
        // the check ran. Jon's framework, 20 August 2026, 04 entry 95.
        state:
          busy || !scan
            ? 'pending'
            : !carriesProse
              ? 'skipped'
              : done
                ? 'removed'
                : foundCount > 0
                  ? 'found'
                  : 'absent',
        status:
          busy || !scan
            ? waitingStatus
            : !carriesProse
              ? 'No text to check'
              : done
                ? foundCount > 0
                  ? `${actuallyRemoved} of ${foundCount} removed`
                  : 'none found'
                : foundCount > 0
                  ? `${foundCount} found`
                  : 'none found',

        detail: !carriesProse
          ? 'An image carries no text, so there are no characters to hide between. This check runs on pasted text and documents.'
          : done
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
                // Name, count, and a phrase. The long-form explanation was a
                // sentence per finding, which stacked into a wall on any text
                // carrying more than one. 04 entry 96.
                head: `${prettyName(hit.label, hit.codepoint)}${hit.count > 1 ? ` x${hit.count}` : ''}`,
                body: shortExplain(hit.codepoint, hit.kind),
              }))
            : undefined,
      },
      {
        id: 'provenance',
        label: 'Metadata',
        where: 'A digital fingerprint inside your file',
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
              ? 'Needs a file'
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
                ? `This file names ${producer} as its maker, in a signed record anyone can read with a free tool.`
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
              : // THE PRODUCER LEADS, and in one line. Jon's note on testing
                // with a ChatGPT image: opening the found row should say what
                // made the file first, then the marks, and all of it readable
                // at a glance. "Made by X" is the moment the visitor watches
                // the tool read their own document, 04 entry 70.
                [
                  ...(producer
                    ? [
                        {
                          key: 'producer',
                          head: `Made by ${producer}`,
                          body: 'Named in the file itself',
                        },
                      ]
                    : []),
                  ...provenanceItems(report),
                ]
            : undefined,
      },
      {
        id: 'statistical',
        label: 'Statistical watermark',
        where: 'The exact sequence of your words',
        state:
          busy || !scan
            ? 'pending'
            : !carriesProse
              ? 'skipped'
              : done && receipt
                ? 'removed'
                : // NOT 'found'. Nothing was examined: this row was driven
                  // entirely by whether the input contains words, so PRESENT
                  // asserted a finding about the visitor's own text that we
                  // cannot make. 04 entry 81.
                  'certain',
        status:
          busy || !scan
            ? waitingStatus
            : !carriesProse
              ? 'No words to mark'
              : done && receipt
                ? 'Rewritten'
                : // Never a count: there is nothing to count. The state word
                  // matches the row grammar, and the teach table carries why.
                  'Presumed present',
        detail: !carriesProse
          ? 'An image carries no writing, so there are no word choices for this mark to hide in.'
          : done && receipt
            ? `Rewritten. The longest stretch of your original wording left is ${receipt.longestRun} words in a row. The mark rides only on unbroken stretches of your original words.`
            : 'Presumed present, because Claude marks what it writes and no tool can show the mark in place. It is not hidden in your words. It is your words: the exact sequence they were chosen in. Ask another AI to reword and whatever it leaves alone still carries the mark, so we rebuild every sentence. Three words in a row is the most that survives, and your facts and length are checked against your original.',
      },
    ] satisfies ChecklistRow[]
  ).map((row) =>
    idle
      ? {
          ...row,
          ...RESTING_MAP[row.id],
          state: 'pending' as const,
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
          {/*
            THE ARRIVAL SWOOSH. Jon's design, 19 August 2026.

            One orange panel crosses the empty box carrying one sentence, holds
            long enough to be read, and leaves. Behind it is the ordinary box
            with its ordinary placeholder. It says what to do with this thing in
            the second before anyone has decided to care.

            It unmounts on animation end so it can never sit over the input, and
            it does not run at all for a visitor who has asked for reduced
            motion: for them the box is simply ready to type in.
          */}
          {!swooshDone ? (
            <div
              aria-hidden
              className={
                'pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[13px] motion-reduce:hidden'
              }
            >
              {/* Translucent, not opaque. The same treatment as the sweep that
                  runs while the engine works, from-mark/0 via-mark to-mark/0,
                  so the box stays visible through it and the two motions on
                  this surface read as the same object. */}
              <div
                onAnimationEnd={() => setSwooshDone(true)}
                className={
                  'animate-swoosh from-mark/0 via-mark/40 to-mark/0 flex h-full w-full items-center justify-center bg-gradient-to-r px-6 text-center'
                }
              >
                <span
                  className={
                    'text-foreground text-[15px] leading-snug font-semibold tracking-[-0.012em]'
                  }
                >
                  Paste AI generated content here to remove its watermark.
                </span>
              </div>
            </div>
          ) : null}

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
                'text-foreground placeholder:text-muted-foreground/60 max-h-[280px] min-h-[184px] w-full resize-none bg-transparent px-4 py-3.5 text-[14.5px] leading-[1.75] tracking-[-0.005em] outline-none'
              }
            />
          ) : phase === 'locked' ? (
            <Paywall
              variant={wall.variant}
              needed={wall.needed}
              have={wall.have}
              onDismiss={() => setPhase('scanned')}
            />
          ) : isFile ? (
            /*
              A LOADED FILE IS A DIV, NOT A BUTTON, and the difference cost a
              real bug. This view used to live inside the click-to-edit button
              with `disabled={isFile}`, and a disabled button swallows every
              click on its children, so Remove and Download inside FileSummary
              could be clicked and did nothing. Jon found it by clicking
              Remove. It was also a button inside a button, which is invalid
              HTML. A file is not editable text, so nothing here needs the
              edit affordance at all.
            */
            <div className={'px-4 py-3.5'}>
              <FileSummary
                name={loaded.name}
                scanning={busy}
                downloadUrl={done ? downloadUrl : null}
                onDownload={() => track.resultDownloaded({ name: loaded.name })}
                onClear={startOver}
              />
            </div>
          ) : (
            <button
              type={'button'}
              onClick={startEditing}
              aria-label={'Edit this text'}
              className={'block w-full cursor-text px-4 py-3.5 text-left'}
            >
              {/*
                CAPPED, AND SCROLLING INSIDE. Jon's note, 20 August 2026: a
                long paste made the whole box grow with it and pushed the page
                around. The box now holds its footprint and the text scrolls
                within it, the way the empty state already implied it would.
              */}
              <div className={'max-h-[280px] min-h-[184px] overflow-y-auto'}>
                {done ? (
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

          {/*
            THE MODEL STRIP, Jon's placement, 20 August 2026: inside the box,
            bottom left, visible before any scroll on any screen. A first-time
            visitor arrives thinking in models ("will this work on ChatGPT?"),
            not in watermark types, and nothing above the fold named a model
            until the vendor table far below. Four recognisable marks answer it
            without a sentence.

            It behaves like the placeholder: present while the box is empty,
            gone the moment the first character lands or a file loads. It never
            takes a click, so typing straight through it works.
          */}
          {text === '' && !isFile && loaded.text === '' && phase !== 'locked' ? (
            <div
              className={
                'pointer-events-none absolute bottom-3 left-4 flex flex-wrap items-center gap-x-2 gap-y-1'
              }
            >
              <span className={'flex items-center gap-1.5'} aria-hidden>
                {[
                  { src: '/images/vendors/claude.svg', mono: false },
                  { src: '/images/vendors/chatgpt.svg', mono: true },
                  { src: '/images/vendors/gemini.svg', mono: false },
                  { src: '/images/vendors/grok.svg', mono: true },
                ].map((logo) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={logo.src}
                    src={logo.src}
                    alt={''}
                    loading={'lazy'}
                    decoding={'async'}
                    className={[
                      'size-[13px] object-contain',
                      logo.mono ? 'opacity-60 dark:invert' : 'opacity-90',
                    ].join(' ')}
                  />
                ))}
              </span>
              {/* Dark, not placeholder-grey: Jon wants this line to jump out
                  while the box is empty. It still clears with the first
                  character, so it never competes with the visitor's text. */}
              <span className={'text-foreground text-[11px] font-medium'}>
                Sanitises Claude, ChatGPT, Gemini, Grok and every other model
              </span>
            </div>
          ) : null}

          {/* The line that ties the marked bars in the sample to the row
              beneath. Without it they read as cursor artefacts, which is what
              Jon reported. Only for the sample: a visitor's own text carries
              its own stakes. */}
          {isSample && !editing && !busy && scan && !done ? (
            <p
              className={
                'text-foreground/75 border-border/80 border-t px-4 pt-2.5 pb-1 text-[13px] font-medium'
              }
            >
              {SAMPLE_HINT}
            </p>
          ) : null}

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
          ) : null}

          {/* The category's universal affordance: an empty box, and a sample
              one tap away. docs/09 section 1. */}
          {editing ? (
            <button
              type={'button'}
              onClick={loadSample}
              className={
                'text-foreground/70 hover:text-foreground hover:bg-foreground/[0.045] inline-flex items-center gap-1.5 rounded-[9px] px-2.5 py-2 text-[12.5px] font-medium transition-colors active:scale-[0.98]'
              }
            >
              <WandSparklesIcon
                className={'size-[13px]'}
                strokeWidth={2}
                aria-hidden
              />
              Try an example
            </button>
          ) : done ? (
            /*
              THE RESULT DESERVES A REAL BUTTON. Jon's note, 20 August 2026:
              once the output exists, taking it away is the whole point, and
              it was a small underlined link in the corner. The primary slot
              now hands over the result: copy for text, download for a file.
              The greyed "Sanitised" button it replaces said only that the
              work was over; this says what to do next.
            */
            isFile && downloadUrl ? (
              <a
                href={downloadUrl}
                download={`cleaned-${loaded.name}`}
                onClick={() => track.resultDownloaded({ name: loaded.name })}
                className={
                  'bg-foreground text-background inline-flex items-center gap-2 rounded-[9px] px-4 py-2 text-[13px] font-semibold transition-transform active:scale-[0.98]'
                }
              >
                <DownloadIcon
                  className={'size-[14px]'}
                  strokeWidth={2.2}
                  aria-hidden
                />
                Download the clean file
              </a>
            ) : (
              <button
                type={'button'}
                onClick={() => {
                  void navigator.clipboard.writeText(cleanedText).then(() => {
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 2000);
                  });
                }}
                className={
                  'bg-foreground text-background inline-flex items-center gap-2 rounded-[9px] px-4 py-2 text-[13px] font-semibold transition-transform active:scale-[0.98]'
                }
              >
                <CopyIcon
                  className={'size-[14px]'}
                  strokeWidth={2.2}
                  aria-hidden
                />
                {copied ? 'Copied' : 'Copy the clean text'}
              </button>
            )
          ) : (
            <button
              type={'button'}
              onClick={() => void sanitise()}
              disabled={busy}
              className={
                'bg-mark text-mark-foreground hover:bg-mark-strong inline-flex items-center gap-2 rounded-[9px] px-4 py-2 text-[13px] font-semibold transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45'
              }
            >
              <SparklesIcon
                className={'size-[14px]'}
                strokeWidth={2.2}
                aria-hidden
              />
              {phase === 'cleaning' ? (
                carriesProse ? (
                  'Rewriting'
                ) : (
                  'Sanitising'
                )
              ) : (
                // The count lives in the verb: one control that is the call
                // to action, the finding and the proof at once. The
                // statistical mark is deliberately not counted, because it
                // has no count. docs/09 section 8. The price rides on the
                // same button, quieter, so the cost is known at the moment
                // of commitment. 04 entry 97.
                <>
                  {markCount > 0 ? `Sanitise it (${markCount})` : 'Sanitise it'}
                  {/* The coin rides the button, so the cost is on the
                      control being pressed, not only near it. */}
                  <span
                    className={
                      'bg-mark-foreground/20 ml-0.5 inline-flex items-center gap-1 rounded-full px-1.5 py-[2px] text-[11.5px] tabular-nums'
                    }
                  >
                    <CreditCoin className={'size-[12px]'} />
                    {costFor({
                      isFile,
                      name: loaded.name,
                      wantsRewrite: carriesProse,
                      words: countWords(loaded.text || text),
                    })}
                  </span>
                </>
              )}
            </button>
          )}

          {done ? (
            <button
              type={'button'}
              onClick={startOver}
              className={
                'text-foreground/70 hover:text-foreground hover:bg-foreground/[0.045] inline-flex items-center gap-1.5 rounded-[9px] px-2.5 py-2 text-[12.5px] font-medium transition-colors active:scale-[0.98]'
              }
            >
              <XIcon className={'size-[13px]'} strokeWidth={2} aria-hidden />
              Start over
            </button>
          ) : (
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
          )}

          <p className={'text-muted-foreground ml-auto text-[11.5px]'}>
            {/* Copy and download moved into the primary button slot on the
                left, 20 August 2026, so this line no longer repeats them.
                When the work is done it says so, plainly. */}
            {phase === 'error' ? (
              <span className={'text-destructive font-medium'}>{message}</span>
            ) : done ? (
              <span className={'text-emerald-700 font-medium'}>Sanitised</span>
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
            ) : loaded.text || text || isFile ? (
              /*
                THE PRICE, BEFORE THE BUTTON IS PRESSED. 03-pricing 11c: the
                cost must be known before committing. The words and the coin
                sit in one line, which is what teaches the unit: a visitor
                reads "867 words" next to one coin and never has to be told
                the conversion. 04 entry 98.
              */
              (() => {
                const words = countWords(loaded.text || text);
                const price = costFor({
                  isFile,
                  name: loaded.name,
                  wantsRewrite: carriesProse,
                  words,
                });

                return (
                  <span className={'inline-flex items-center gap-1.5'}>
                    {isFile
                      ? '1 file'
                      : `${words.toLocaleString('en-US')} ${words === 1 ? 'word' : 'words'}`}
                    <span className={'text-muted-foreground/60'}>=</span>
                    <CreditChip amount={price} tone={'spend'} />
                  </span>
                );
              })()
            ) : (
              // Empty with an empty box: the panel caption beside the coin
              // already says scanning is free, and saying it twice on one
              // screen was the first thing to look wrong after the chip
              // landed.
              ''
            )}
          </p>
        </div>
      </div>

      {/* The findings. A separate surface, with its own heading, because it
          answers a different question from the box above it. */}
      <div
        className={
          'border-border bg-foreground/[0.035] rounded-b-[18px] border-t px-4 py-4 sm:px-5'
        }
      >
        <div className={'mb-2 flex items-center justify-between gap-3'}>
          <h2
            className={
              'text-foreground text-[11.5px] font-semibold tracking-[0.06em] uppercase'
            }
          >
            {panelHeading}
          </h2>

          {/*
            THE BALANCE, AS A TOKEN. 04 entry 98. This was 11px grey text
            saying "2 free credits", which Jon read as far too quiet for the
            thing the whole funnel turns on. It is now the coin and the
            count, present from the first frame, and it is the same coin
            that appears on the price of the job and on the file card.
          */}
          <span className={'flex shrink-0 items-center gap-2'}>
            {panelCaption ? (
              <span className={'text-muted-foreground hidden text-[11px] sm:inline'}>
                {panelCaption}
              </span>
            ) : null}

            <CreditChip
              amount={credits.balance ?? WELCOME_CREDITS}
              label={credits.balance === null ? 'free' : 'left'}
              size={'lg'}
              tone={credits.balance === 0 ? 'empty' : 'neutral'}
            />
          </span>
        </div>

        {/*
          THE OFFER AT NOUGHT, WITHOUT WAITING FOR A FAILED PRESS.
          21 August 2026, session 10, and it is the single biggest conversion
          leak this session was sent to fix. Jon:

            "after you complete 2 scans and use your 2 free credits it just
            says 0 left. Have an icon pop up somewhere prompting you to
            create an account to get 3 free more, because you only know this
            exists if you try again and click scan and then get the locked
            message."

          It sits immediately under the balance it explains, so the eye that
          just read "0 left" lands on the answer in the same movement. Not
          shown while the paywall is up, because that screen is already
          making the identical offer inside the box above.
        */}
        {welcoming && typeof credits.balance === 'number' && credits.balance > 0 ? (
          <div className={'mb-3'}>
            <SignedInWelcome
              balance={credits.balance}
              onDismiss={() => setWelcoming(false)}
            />
          </div>
        ) : null}

        {credits.balance === 0 && phase !== 'locked' ? (
          <div className={'mb-3'}>
            <OutOfCredits
              isGuest={credits.isAnonymous}
              justRanOut={justRanOut}
              onSignUpClick={() =>
                track.outOfCreditsClicked({ isGuest: credits.isAnonymous })
              }
            />
          </div>
        ) : null}

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
  /*
   * REBUILT 20 August 2026 to Jon's note: "the font is weird, the loaded is
   * weird, the remove. Make it look structured and cleaner."
   *
   * What was wrong: a bare grey word ("Loaded"), the filename in monospace at
   * a size nothing else on the surface used, and two controls floating under
   * them with no relationship to anything. It read as three unrelated
   * fragments stacked in the middle of an empty box.
   *
   * What it is now: one card. A typed icon tile, the name in the interface
   * face at reading size with its own truncation, the file type and state
   * under it, and Remove as a real control on the right of the same row where
   * a person expects to find it. The download lives in the main action bar
   * with copy, so this row is identity and removal only.
   */
  const extension = name.includes('.')
    ? (name.split('.').pop() ?? '').toUpperCase()
    : 'FILE';
  const isImage = /\.(png|jpe?g|webp|gif)$/i.test(name);

  return (
    <div className={'flex min-h-[184px] items-center'}>
      <div
        className={
          'border-border/70 bg-foreground/[0.02] flex w-full items-center gap-3 rounded-[12px] border p-3'
        }
      >
        <span
          className={
            'bg-foreground/[0.06] text-foreground/70 grid size-[38px] shrink-0 place-items-center rounded-[10px]'
          }
        >
          {isImage ? (
            <ImageIcon className={'size-[18px]'} strokeWidth={1.8} aria-hidden />
          ) : (
            <FileTextIcon className={'size-[18px]'} strokeWidth={1.8} aria-hidden />
          )}
        </span>

        <span className={'min-w-0 flex-1'}>
          <span
            className={
              'text-foreground block truncate text-[14px] font-medium tracking-[-0.01em]'
            }
            title={name}
          >
            {name}
          </span>
          {/* The file pricing rule, taught at the exact moment it applies:
              the card says "1 credit" instead of anything explaining it.
              04 entry 97. */}
          {/* The file pricing rule, taught at the exact moment it applies:
              the card wears the coin instead of explaining anything.
              04 entries 97 and 98. */}
          <span
            className={
              'text-muted-foreground flex items-center gap-1.5 text-[12px]'
            }
          >
            {extension} file
            {scanning ? (
              ' · reading'
            ) : downloadUrl ? (
              ' · sanitised'
            ) : (
              <>
                <span className={'text-muted-foreground/60'}>=</span>
                <CreditChip amount={1} tone={'spend'} />
              </>
            )}
          </span>
        </span>

        {!scanning ? (
          <button
            type={'button'}
            onClick={onClear}
            aria-label={'Remove this file'}
            className={
              'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] grid size-[30px] shrink-0 place-items-center rounded-[8px] transition-colors'
            }
          >
            <XIcon className={'size-[15px]'} strokeWidth={2.2} aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}
