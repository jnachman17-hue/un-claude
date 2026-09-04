/**
 * Every analytics event this product sends, and the only place that decides what
 * may leave the browser.
 *
 * THE ONE RULE. No part of a visitor's content ever becomes a property. Not the
 * text, not a filename, not a snippet, not an error message that might quote
 * either. The privacy policy says we do not keep what people give us, and an
 * event property is keeping it.
 *
 * That rule is enforced here rather than trusted to call sites. The exported
 * functions accept counts, flags and fixed choices. The one place a free string
 * arrives is a filename, and it is never sent: `fileType` reduces it to an
 * extension and only if that extension is one this site accepts, otherwise
 * `other`. A call site cannot send content through this module even by mistake.
 *
 * WHY SIZES ARE BUCKETED. An exact character count is not content, but it is a
 * weak fingerprint: the same document reappearing is identifiable by its length.
 * A bucket answers the only question worth asking of it — does the funnel break
 * on long documents — and identifies nobody.
 *
 * WHAT IS DELIBERATELY NOT SENT, so nobody adds it back believing it was an
 * oversight:
 *
 *   `signup_completed` DOES NOT EXIST. PostHog is configured to store nothing on
 *   the device, so the visitor's id lives in memory and dies with the page. Both
 *   ways of finishing a sign-up leave the site entirely — Google's consent screen,
 *   or a confirmation link in an email — so whoever comes back is a new person.
 *   An event fired on arrival would look like a funnel step and would be two
 *   unrelated numbers. How many accounts were created is a database question.
 *   07, "Cookieless has an identity boundary".
 *
 *   `posthog.identify()` IS NEVER CALLED. It would attach a real account id to
 *   the analytics record, which is a new category of personal data in the privacy
 *   policy, and it still would not join the anonymous half of the funnel to the
 *   signed-in half, because the anonymous id was already gone. A real cost for no
 *   gain.
 *
 *   THE SAME BOUNDARY CUTS THE CHECKOUT IN HALF, added 24 August 2026 with the
 *   purchase events. `checkout_started` fires on /pricing. The browser then leaves
 *   for stripe.com and comes back through a fresh page load, so the visitor id
 *   that fired it no longer exists and `purchase_completed` belongs to a stranger.
 *   The two are trustworthy COUNTS and they do not join into one funnel. Nobody
 *   should reach for `identify()` to close that gap: it would not close it — the
 *   id was gone before the account was known — and it would put a person into the
 *   analytics record to achieve nothing. How many purchases happened is a Stripe
 *   question, and Stripe answers it with the money attached.
 *
 *   NO PRICE IS EVER SENT. Not because it is personal, but because a browser
 *   saying a number about money is the boundary this product refuses to cross.
 *   The pack id goes; the price stays on the server. See `checkoutStarted`.
 *
 * IF AN EVENT OR A PROPERTY IS ADDED HERE, the privacy policy and the cookie
 * policy are checked against this file in the same change. 06 rows 46 and 54.
 */

type PostHog = {
  capture: (event: string, properties?: Record<string, unknown>) => void;
  __loaded?: boolean;
};

/** What the visitor gave us. Never what it said. */
export type InputKind = 'text' | 'file';

/**
 * The single exit point. Everything else in this file goes through it.
 *
 * Analytics must never be able to break the product. PostHog is absent on every
 * local machine (no key), absent for anyone running a tracker blocker, and absent
 * for anyone sending Do Not Track. All three are normal, none is an error, and a
 * thrown exception inside a click handler would take the tool down with it.
 */
function send(event: string, properties?: Record<string, unknown>): void {
  try {
    if (typeof window === 'undefined') return;

    const posthog = (window as unknown as { posthog?: PostHog }).posthog;

    if (!posthog?.__loaded) return;

    posthog.capture(event, properties);
  } catch {
    // Deliberately silent. A failure to measure is not a failure to work.
  }
}

/**
 * A fixed vocabulary of file types. Anything outside it reduces to `other`, so an
 * extension can never carry a word the visitor wrote.
 *
 * The first six are what the site accepts, and they match `ACCEPTED_FILES` in
 * `workbench/encode.ts`. PDF is deliberately not among them, 04 entry 26.
 *
 * The rest are here on purpose. The file picker filters by the accepted list, but
 * dragging a file onto the box does not, so people can and will drop formats the
 * tool refuses. Naming the common ones turns "a drop failed" into "people keep
 * bringing us PDFs", which is the difference between a number and a decision.
 */
const KNOWN_TYPES = [
  // Accepted
  'txt',
  'md',
  'docx',
  'png',
  'jpg',
  'jpeg',
  // Refused, but common enough to be worth telling apart from each other
  'pdf',
  'doc',
  'odt',
  'rtf',
  'pages',
  'pptx',
  'xlsx',
  'csv',
  'json',
  'html',
  'gif',
  'webp',
  'heic',
  'svg',
  'tif',
  'tiff',
  'zip',
] as const;

/** `paste.txt` is the workbench's name for pasted text, which is not a file. */
export function fileType(name: string): string {
  if (name === 'paste.txt') return 'none';

  const extension = name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';

  return (KNOWN_TYPES as readonly string[]).includes(extension) ? extension : 'other';
}

/**
 * Buckets, not measurements. Named so a chart reads in English rather than as a
 * range somebody has to decode.
 */
function sizeBucket(characters: number): string {
  if (characters <= 0) return 'empty';
  if (characters < 500) return 'under 500';
  if (characters < 2000) return '500 to 2k';
  if (characters < 10000) return '2k to 10k';
  if (characters < 50000) return '10k to 50k';
  return 'over 50k';
}

function bytesBucket(bytes: number): string {
  if (bytes < 100_000) return 'under 100kb';
  if (bytes < 1_000_000) return '100kb to 1mb';
  if (bytes < 5_000_000) return '1mb to 5mb';
  return 'over 5mb';
}

function durationBucket(milliseconds: number): string {
  if (milliseconds < 1000) return 'under 1s';
  if (milliseconds < 3000) return '1s to 3s';
  if (milliseconds < 10000) return '3s to 10s';
  if (milliseconds < 30000) return '10s to 30s';
  return 'over 30s';
}

// ---------------------------------------------------------------------------
// Getting started
// ---------------------------------------------------------------------------

/**
 * The visitor cleared the example and started on their own text.
 *
 * The most important early step there is. It separates somebody reading a demo
 * from somebody actually trying the product, and those two look identical in a
 * pageview count.
 */
export function ownTextEntered(): void {
  send('own_text_entered');
}

/** A file was chosen or dropped. The name is reduced to a type and discarded. */
export function fileUploaded(name: string, bytes: number, method: 'picker' | 'drop'): void {
  send('file_uploaded', {
    file_type: fileType(name),
    size: bytesBucket(bytes),
    method,
  });
}

// ---------------------------------------------------------------------------
// Scanning, which is free and happens on its own
// ---------------------------------------------------------------------------

export function scanCompleted(properties: {
  inputKind: InputKind;
  name: string;
  /** Length of what was scanned. Bucketed before it is sent. */
  characters: number;
  /** Total hidden characters found. A count, never the characters themselves. */
  marksFound: number;
  /**
   * The CLASSES of mark found, e.g. `zwj_family`. These describe the watermark,
   * not the document: they are the same handful of values for every visitor.
   */
  markKinds: string[];
  provenanceFound: boolean;
  /** The tool that made the file, e.g. `Stability AI`. About the file's maker. */
  producer: string | null;
  /** Whether this was the sample text the page loads with. */
  isSample: boolean;
}): void {
  send('scan_completed', {
    input_kind: properties.inputKind,
    file_type: fileType(properties.name),
    size: sizeBucket(properties.characters),
    found_anything: properties.marksFound > 0 || properties.provenanceFound,
    marks_found: properties.marksFound,
    mark_kinds: properties.markKinds,
    provenance_found: properties.provenanceFound,
    producer: properties.producer,
    is_sample: properties.isSample,
  });
}

export function scanFailed(properties: { inputKind: InputKind; name: string }): void {
  send('scan_failed', {
    input_kind: properties.inputKind,
    file_type: fileType(properties.name),
  });
}

// ---------------------------------------------------------------------------
// Sanitising, which is the deliberate press and the thing that will cost money
// ---------------------------------------------------------------------------

export function sanitiseStarted(properties: {
  inputKind: InputKind;
  name: string;
  /** Whether this run includes the rewrite, which is the part that costs. */
  rewriteIncluded: boolean;
  freeRewritesLeft: number;
}): void {
  send('sanitise_started', {
    input_kind: properties.inputKind,
    file_type: fileType(properties.name),
    rewrite_included: properties.rewriteIncluded,
    free_rewrites_left: properties.freeRewritesLeft,
  });
}

export function sanitiseCompleted(properties: {
  inputKind: InputKind;
  name: string;
  rewriteIncluded: boolean;
  milliseconds: number;
  marksFound: number;
  /** Confirmed gone by re-reading the result, not assumed. */
  marksRemoved: number;
  provenanceActions: number;
  /** The file still carries provenance after cleaning. A real failure. */
  stillMarked: boolean;
}): void {
  send('sanitise_completed', {
    input_kind: properties.inputKind,
    file_type: fileType(properties.name),
    rewrite_included: properties.rewriteIncluded,
    duration: durationBucket(properties.milliseconds),
    marks_found: properties.marksFound,
    marks_removed: properties.marksRemoved,
    marks_left: Math.max(0, properties.marksFound - properties.marksRemoved),
    fully_clean: properties.marksFound === properties.marksRemoved && !properties.stillMarked,
    provenance_actions: properties.provenanceActions,
    still_marked: properties.stillMarked,
  });
}

/**
 * A failed run.
 *
 * The engine's own message is NOT sent. It is written by us, but it is built at
 * the far end from a payload that contains the visitor's document, and one day
 * somebody will interpolate a filename into it. A fixed set of properties cannot
 * develop that problem later.
 */
export function sanitiseFailed(properties: {
  inputKind: InputKind;
  name: string;
  rewriteIncluded: boolean;
  milliseconds: number;
}): void {
  send('sanitise_failed', {
    input_kind: properties.inputKind,
    file_type: fileType(properties.name),
    rewrite_included: properties.rewriteIncluded,
    duration: durationBucket(properties.milliseconds),
  });
}

/** They got a clean result and took it away with them. The end of a good run. */
export function resultDownloaded(properties: { name: string }): void {
  send('result_downloaded', { file_type: fileType(properties.name) });
}

// ---------------------------------------------------------------------------
// The paywall
// ---------------------------------------------------------------------------

/**
 * The wall appeared. Nothing was sent to the engine to produce this screen, so
 * this event is also the record of a run that cost nothing and earned nothing.
 */
export function paywallShown(properties: { inputKind: InputKind; name: string }): void {
  send('paywall_shown', {
    input_kind: properties.inputKind,
    file_type: fileType(properties.name),
  });
}

export function paywallDismissed(): void {
  send('paywall_dismissed');
}

/**
 * They pressed "Get credits".
 *
 * This is the conversion step the whole funnel exists to measure, and it only
 * joins to everything before it while that link stays a client-side one. A plain
 * anchor reloads the page, which loses the visitor's id and turns this event into
 * an orphan. 06 row 67.
 */
export function paywallSignUpClicked(): void {
  send('paywall_signup_clicked');
}

// ---------------------------------------------------------------------------
// The empty balance
// ---------------------------------------------------------------------------

/**
 * The offer that fires on reaching nought, rather than on failing an attempt.
 * 21 August 2026, session 10: the balance hitting zero used to say only
 * "0 left" and the signup grant was reachable only by pressing a button that
 * would not work. `just_ran_out` separates the two populations that see this:
 * somebody whose last credit was just spent, and somebody arriving on a
 * balance that was already empty.
 */
export function outOfCreditsShown(properties: {
  isGuest: boolean;
  justRanOut: boolean;
}): void {
  send('out_of_credits_shown', {
    is_guest: properties.isGuest,
    just_ran_out: properties.justRanOut,
  });
}

/**
 * They took the offer from the empty balance rather than from the wall.
 *
 * `road` separates the two the panel now offers. Added 4 September 2026 with
 * entry 159: a guest used to be shown only the free grant, so there was one
 * road and nothing to distinguish. There are two now, and which one people
 * take is the whole question that override was made to answer.
 */
export function outOfCreditsClicked(properties: {
  isGuest: boolean;
  road: 'free' | 'buy';
}): void {
  send('out_of_credits_clicked', {
    is_guest: properties.isGuest,
    road: properties.road,
  });
}

// ---------------------------------------------------------------------------
// Signing up
// ---------------------------------------------------------------------------

/**
 * They committed: pressed the sign-up button or chose a provider.
 *
 * This is the last step that can be joined to the visitor who arrived. Whatever
 * happens next — Google's consent screen, or a confirmation email — takes the
 * browser off this site and the identity does not come back. See the note at the
 * top of this file about why there is no `signup_completed`.
 */
export function signUpStarted(properties: { method: 'password' | 'google' }): void {
  send('signup_started', { method: properties.method });
}

export function signInStarted(properties: { method: 'password' | 'google' }): void {
  send('signin_started', { method: properties.method });
}

// ---------------------------------------------------------------------------
// Checkout, which is where the money starts
// ---------------------------------------------------------------------------

/**
 * A fixed vocabulary of packs, for the same reason `KNOWN_TYPES` exists: a pack
 * id arrives here as a string, and a string is the one thing this module does
 * not let out. Anything outside the list reduces to `other`.
 *
 * These three match `PACKS` in `pricing/_components/pricing-data.ts`. A fourth
 * pack added there and not here shows up in PostHog as `other` rather than as a
 * wrong number, which is the failure worth having.
 */
const KNOWN_PACKS = ['starter', 'plus', 'pro'] as const;

function packSlug(id: string): string {
  return (KNOWN_PACKS as readonly string[]).includes(id) ? id : 'other';
}

/**
 * THE PRICE IS NEVER SENT, and this is not a style preference.
 *
 * What a pack costs is decided by `pricing-data.ts` on the server and charged by
 * Stripe. A price travelling up from a browser is the exact shape of the bug
 * this product refuses to have, and an analytics event is still a browser saying
 * a number about money. The pack id is enough: it maps to a price in one place,
 * and that place is the one allowed to know.
 */
export type CheckoutFailure =
  /** 429. Too many checkouts too quickly. */
  | 'rate_limited'
  /** 503. Stripe is configured but not answering. Nothing was charged. */
  | 'unavailable'
  /** Any other non-ok reply from the route. */
  | 'error'
  /** The request never landed. A dropped connection, a blocked request, no network. */
  | 'unreachable';

/** They pressed a pack button and the browser is asking the route for a session. */
export function checkoutStarted(properties: { packId: string }): void {
  send('checkout_started', { pack_id: packSlug(properties.packId) });
}

/**
 * The click did not reach Stripe, and it was not the visitor's doing.
 *
 * The route's own message is NOT sent, for the same reason `sanitise_failed`
 * does not send the engine's: a fixed set of causes cannot later grow a
 * filename in it.
 */
export function checkoutFailed(properties: {
  packId: string;
  reason: CheckoutFailure;
}): void {
  send('checkout_failed', {
    pack_id: packSlug(properties.packId),
    reason: properties.reason,
  });
}

/**
 * The click did not reach Stripe because there is nobody to bill yet: 401 means
 * no session at all, 402 means the anonymous guest identity the tool hands out
 * on arrival. Both send the visitor to sign-up.
 *
 * IT IS NOT A `checkout_failed`, and putting it there would have been the easy
 * mistake. Nothing is broken in this branch — it is the ordinary path for
 * everyone who finds /pricing before making an account, which is most people.
 * Filed as a failure it would have buried real breakage under normal traffic;
 * left unrecorded it would have made `checkout_started` look like it leaks
 * customers, when in fact they were handed to the sign-up form on purpose.
 *
 * `state` is a session class and not an identity. It says which of two doors
 * the visitor was standing at, and it is the same two values for everybody.
 */
export function checkoutAccountRequired(properties: {
  packId: string;
  state: 'signed_out' | 'guest';
}): void {
  send('checkout_account_required', {
    pack_id: packSlug(properties.packId),
    state: properties.state,
  });
}

// ---------------------------------------------------------------------------
// Coming back from Stripe
// ---------------------------------------------------------------------------

/**
 * The card cleared. Stripe only sends a buyer to the success return once the
 * payment is done, so this fires on arrival rather than on the credits landing.
 *
 * READ THE IDENTITY WARNING BELOW BEFORE BUILDING A FUNNEL ON THIS. The buyer
 * left this site for stripe.com and came back through a fresh page load, and
 * persistence is `memory`, so the visitor id that fired `checkout_started` is
 * gone. This event is a reliable COUNT and an unreliable funnel step — the same
 * boundary that killed `signup_completed`, for the same reason.
 *
 * THE PACK IS NOT SENT, because this page does not know it. The return URL
 * carries `?purchase=success` and nothing else, and the pack is only recoverable
 * from the ledger row, which is a change in a file this session does not own.
 * Which pack sold is a Stripe question anyway, and Stripe answers it with the
 * money attached.
 *
 * `credits_ready` is the one thing worth measuring here and it is an operational
 * number, not a marketing one: it says whether the webhook that grants the
 * credits beat the redirect that brings the buyer home. False means a paying
 * customer looked at their old balance. See the header of `purchase-banner.tsx`.
 */
export function purchaseCompleted(properties: { creditsReady: boolean }): void {
  send('purchase_completed', { credits_ready: properties.creditsReady });
}

/**
 * They reached Stripe's payment page and came back without paying.
 *
 * The other half of the answer. Without it, everybody who did not buy looks
 * alike, and the two populations need completely different fixes: somebody who
 * never reached Stripe is a broken button, and somebody who reached it and
 * backed out is a price or a moment of doubt.
 */
export function purchaseCancelled(): void {
  send('purchase_cancelled');
}
