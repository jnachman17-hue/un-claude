/**
 * THE OPEN REDIRECT, CLOSED. Added 23 August 2026, session 12, Lane E item S-1.
 *
 * `/auth/callback` took its destination straight from the `next` query
 * parameter and handed it to `redirect()`. `redirect()` writes whatever it is
 * given into the `Location` header, so any link beginning
 * `https://un-claude.com/auth/callback?next=` landed the visitor on any site
 * in the world, signed out, with no account needed:
 *
 *   next=https://example.com/       ->  307  location: https://example.com/
 *   next=//example.com              ->  307  location: //example.com
 *
 * That is the shape a phishing link takes: an address that genuinely starts
 * with this domain and ends on somebody else's copy of the sign-in page.
 * Nothing leaks -- the auth code is exchanged on the server and never reaches
 * the other site -- so this was rated medium on the grounds that a phishing
 * link is worth what the domain's reputation is worth, and this domain is
 * days old. That is the argument for closing it now rather than later.
 *
 * WHAT COUNTS AS SAFE HERE: a path on this site and nothing else. Not a full
 * address, not a protocol-relative `//host`, not a scheme of any kind. The
 * legitimate callers only ever pass a bare path -- `apps/web/proxy.ts` sends
 * `?next=/home/settings`, and the default is `/` -- so nothing real is lost.
 *
 * The parse below resolves against a base host that cannot exist. Anything
 * that steers away from it (a scheme, a `//host`, a backslash a browser would
 * straighten into a slash) changes the origin and is refused. Trusting the
 * request's own host here would mean trusting a header an attacker can set.
 */
const IMPOSSIBLE_BASE = 'https://un-claude.invalid';

/**
 * Control characters and spaces. Browsers strip tabs, newlines and other
 * control characters out of an address before they resolve it, so a leading
 * tab in "/<tab>/evil.example" is a real bypass against a check that only
 * looks at the first character. Refused outright rather than stripped.
 *
 * The linter objects to control characters inside a regular expression and
 * suggests writing them as Unicode escapes, which is what this is. Matching
 * them is the whole purpose here, so the rule is turned off for this line
 * rather than the range being weakened to satisfy it.
 */
// oxlint-disable-next-line no-control-regex
const UNSAFE_CHARACTERS = /[\u0000-\u0020\u007f]/;

export function safeNextPath(
  candidate: string | null | undefined,
  fallback: string,
): string {
  if (!candidate) {
    return fallback;
  }

  if (UNSAFE_CHARACTERS.test(candidate)) {
    return fallback;
  }

  // Must be a path on this site: one leading slash, and nothing that turns
  // into a host. "//evil.example" and "/\evil.example" both do.
  if (!candidate.startsWith('/')) {
    return fallback;
  }

  if (candidate.startsWith('//') || candidate.startsWith('/\\')) {
    return fallback;
  }

  let resolved: URL;

  try {
    resolved = new URL(candidate, IMPOSSIBLE_BASE);
  } catch {
    return fallback;
  }

  if (resolved.origin !== IMPOSSIBLE_BASE) {
    return fallback;
  }

  return `${resolved.pathname}${resolved.search}${resolved.hash}`;
}
