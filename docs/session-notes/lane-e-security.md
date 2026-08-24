# Lane E — security and infrastructure

**23 August 2026.** Board items S-1 to S-5. Nothing was deployed and nothing was
pushed. Everything below was run against a local build of the fix and, where the
defect was live, reproduced against `https://un-claude.com` first.

**Four of the five are done. Two things were not, and they are stated first.**

---

## What was NOT done

**1. `content-security-policy` is still missing, deliberately.** The other four
headers shipped. The reasoning is in S-2 below, and the short version is that a
correct one needs a per-request token that cannot come from a config file, and
that testing it needs a deployment this session was not allowed to make.

**2. S-5 could not be fixed here, because the brief pointed at the wrong file.**
The AI-marker list is not in the workbench. It is in
`apps/web/engine/score_stylometry.py`, which this session's territory explicitly
excluded. **The audit half of S-5 was done anyway and it found more than one
phrase**, with measurements, in S-5 below. The change itself is Lane A's or
Jon's.

**3. The tool itself could not be exercised end to end locally.** The scan
returns *"We could not reach the service"* because `UC_ENGINE_URL` points at
`127.0.0.1:8765` and the Python engine is not running on this machine. The
request does reach our own `/api/tool/scan` and fails at the hop beyond it, which
is where it failed before any of this work. Starting the engine is outside this
session's territory, so it was not started. Everything else on the page was
checked and is below.

---

## S-1 — the open redirect. Closed.

### What it was

Any link beginning `https://un-claude.com/` could be made to land the visitor on
any other website, signed out, with no account needed. **Reproduced on the live
site, before any change:**

```
next=https://example.com/         HTTP/2 307  location: https://example.com/
next=//example.com                HTTP/2 307  location: //example.com
next=https://evil.example/phish   HTTP/2 307  location: https://evil.example/phish
next=/home                        HTTP/2 307  location: /home
```

**Followed all the way through, so it is not a theoretical header:**

```
$ curl -L "https://un-claude.com/auth/callback?next=https%3A%2F%2Fexample.com%2F"
final URL reached: https://example.com/
final status:     200
```

That is the shape a phishing link takes: an address that genuinely starts with
your domain and ends on somebody else's page. Nothing leaks — the auth code is
exchanged on our server and never travels to the other site — which is why the
audit's skeptics moved it from high to medium. They were right, and it is still
the argument for closing it while it is cheap: the link is worth whatever the
domain's name is worth, and that number only goes up.

### What was done

A guard called `safeNextPath` in `packages/features/auth/src/safe-next.ts`. It
allows a path on this site and refuses everything else: a scheme, a
protocol-relative `//host`, a backslash a browser would straighten into a slash,
and any control character or space, because browsers strip those out of an
address before they resolve it and a check that only looks at the first
character can be walked straight past with a leading tab.

It resolves the candidate against a base host that cannot exist. Anything that
steers away from that host has changed the origin and is refused. Trusting the
request's own host would mean trusting a header an attacker can set.

**It is wired into two places, not one.** The audit found `/auth/callback`. While
fixing it, a second one turned up with the same defect:
`sign-in-methods-container.tsx` hands `next` to `router.replace`, which follows
an absolute address off the site, so `/auth/sign-in?next=https://evil.example`
walked a visitor off the domain the moment they signed in successfully. Same
guard, same reasoning.

### The proof

**The same URLs that worked on the live site, against the build with the fix:**

```
next=                              what the browser is told to do
---------------------------------------------------------------------------
https://example.com/               307  location: /?welcome=1
//example.com                      307  location: /?welcome=1
https://evil.example/phish         307  location: /?welcome=1
/home                              307  location: /home
/home/settings                     307  location: /home/settings
```

**Every hostile destination now lands on our own front page. Every real one
still works.**

**And the encoded and control-character versions, which are the ones a check
like this usually misses:**

```
%09//evil.example              -> location: /?welcome=1
%0a//evil.example              -> location: /?welcome=1
%20//evil.example              -> location: /?welcome=1
/%09/evil.example              -> location: /?welcome=1
%2f%2fevil.example             -> location: /?welcome=1
https%3A%2F%2Fevil.example     -> location: /?welcome=1
%68ttps://evil.example         -> location: /?welcome=1
```

**The guard run directly over nineteen hostile inputs and six real ones:**

```
HOSTILE  ->  every one must come back as the fallback "/"
  REFUSED   "https://example.com/"             -> "/"
  REFUSED   "//example.com"                    -> "/"
  REFUSED   "https://evil.example/phish"       -> "/"
  REFUSED   "http://evil.example"              -> "/"
  REFUSED   "//evil.example/x"                 -> "/"
  REFUSED   "////evil.example"                 -> "/"
  REFUSED   "/\\evil.example"                  -> "/"
  REFUSED   "\\\\evil.example"                 -> "/"
  REFUSED   "https:/\\evil.example"            -> "/"
  REFUSED   "javascript:alert(1)"              -> "/"
  REFUSED   "data:text/html,<h1>hi"            -> "/"
  REFUSED   "mailto:a@b.c"                     -> "/"
  REFUSED   "https://un-claude.com.evil.example/" -> "/"
  REFUSED   "evil.example"                     -> "/"
  REFUSED   "\thttps://evil.example"           -> "/"
  REFUSED   "\n//evil.example"                 -> "/"
  REFUSED   " //evil.example"                  -> "/"
  REFUSED   "HTTPS://EVIL.EXAMPLE"             -> "/"
  REFUSED   "/ /evil.example"                  -> "/"

LEGITIMATE  ->  every one must pass through unchanged
  PASSED    "/"                            -> "/"
  PASSED    "/home"                        -> "/home"
  PASSED    "/home/settings"               -> "/home/settings"
  PASSED    "/pricing?a=1"                 -> "/pricing?a=1"
  PASSED    "/home#top"                    -> "/home#top"
  PASSED    "/auth/callback/error?error=auth.errors.otp_expired&code=otp_expired"
              -> "/auth/callback/error?error=auth.errors.otp_expired&code=otp_expired"

null / undefined / empty -> "/" "/" "/"

ALL PASS
```

**Nothing real was broken by it.** The wallet still sends a signed-out visitor to
sign in with the destination attached, and that destination still survives:

```
GET /home  ->  307  location: /auth/sign-in?next=/home
```

Google sign-in also still works: it sets `next` to a hard-coded `/`, which the
guard passes through untouched.

---

## S-2 — four of the five missing headers. Shipped. CSP is not, and here is why.

### Before, on the live site, checked one at a time

```
--- https://un-claude.com/ ---
  PRESENT  strict-transport-security: max-age=63072000
  missing  content-security-policy
  missing  x-frame-options
  missing  x-content-type-options
  missing  referrer-policy
  missing  permissions-policy

--- https://un-claude.com/auth/sign-in ---
  PRESENT  strict-transport-security: max-age=63072000
  missing  content-security-policy
  missing  x-frame-options
  missing  x-content-type-options
  missing  referrer-policy
  missing  permissions-policy
```

### After, on the build with the fix

```
  localhost:3003/
    missing  strict-transport-security      <- added by Vercel at the edge, not by the app
    missing  content-security-policy        <- deliberate, see below
    PRESENT  X-Frame-Options: DENY
    PRESENT  X-Content-Type-Options: nosniff
    PRESENT  Referrer-Policy: strict-origin-when-cross-origin
    PRESENT  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()

  localhost:3003/auth/sign-in
    (identical, all four present)
```

`strict-transport-security` is missing locally because Vercel adds it at its own
edge rather than the application adding it. It is untouched and stays.

**Checked on five routes, all four present on every one:** `/`, `/auth/sign-in`,
`/auth/sign-up`, `/pricing`, `/home`.

### `X-Frame-Options: DENY` actually does something

A header that is merely present proves nothing. The sign-in page was framed
inside another page on purpose, and refused:

```
{ "attempt": "frame /auth/sign-in inside another page",
  "verdict": "REFUSED",
  "detail":  "document is null" }
```

`DENY` rather than `SAMEORIGIN` because this application frames none of its own
pages — there is not one `<iframe>` in the codebase — so nothing is lost by
refusing all framing. Cloudflare's captcha is unaffected: that is us framing
Cloudflare, and this header controls who may frame us.

### Nothing broke, checked in a real browser

The console on the homepage and the sign-in page, with the headers on:

```
[info] Download the React DevTools for a better development experience
[log]  [HMR] connected
[warn] [Cloudflare Turnstile] Ignored message from unexpected source for event: requestExtraParams.
[warn] Failed to execute 'postMessage' on 'DOMWindow': The target origin provided
       ('https://challenges.cloudflare.com') does not match the recipient window's
       origin ('http://localhost:3003').
```

**Zero errors.** The two warnings are Turnstile objecting that the page origin is
`localhost` rather than `un-claude.com`, and **they were not taken on trust**:
the headers were removed, the server restarted, and the same two warnings appear
identically without them. They are not caused by this change.

Also confirmed live in the browser, with the headers on:

```
externalScriptsLoaded : ["challenges.cloudflare.com"]   <- third-party script still loads
window.turnstile      : object                          <- and still initialises
inlineScriptCount     : 9                               <- and see below
workbenchPresent      : true
```

### Why there is no `content-security-policy`

**CSP is the rule that says which scripts a page may run.** Two things stopped it
here and both are real.

**One: this site runs inline scripts, and a strict CSP kills them.** The count
above is not a guess — **nine inline scripts execute on the homepage**, five on
the sign-in page, and that is before `NEXT_PUBLIC_POSTHOG_KEY` is set, which adds
the PostHog snippet on top. The correct fix is a nonce: a fresh random token
minted per request and put on both the header and every script tag. **A nonce
cannot come from `next.config.mjs`, because that file's headers are fixed when
the site is built.** It would have to be minted per request in `proxy.ts`, and a
page carrying a per-request token cannot be prerendered, which turns off the
static shell `cacheComponents: true` gives every route. That is a change to how
every page on the site renders, not a header.

**Two: it cannot be verified on this machine.** `NEXT_PUBLIC_POSTHOG_KEY` is
empty in the local environment, so `AnalyticsProvider` returns `null` and the
inline analytics script that a CSP would break **never renders in local
development at all**. Proving a CSP safe therefore needs a deployment, and this
session was not permitted to deploy. Shipping one unverified is exactly how
analytics dies quietly.

**None of the four headers that did ship can affect whether a script runs**,
which is why they were safe to land without that deployment.

**The recommendation, for whoever picks CSP up.** Do it as its own piece of work
with a deploy to a preview URL and a browser open, decide the nonce-versus-static-shell
trade deliberately rather than as a side effect, and expect it to cost an
afternoon rather than a line.

---

## S-3 — three different failures no longer all blame the visitor's internet

### What it was

A blocked captcha, an unconfirmed email address, and everything else all produced
the same sentence: *"We have encountered an error. Please ensure you have a
working internet connection and try again."* Two of those are not connection
problems, and the middle one is the most common signup problem there is.

### What was done

Two failures now have a screen of their own, and each one names something to do
next. Everything else keeps one general message, **and that message no longer
names a cause either** — a sentence used for unknown failures should not assert
which failure it was.

| what actually went wrong | what the visitor is told now |
|---|---|
| the email address was never confirmed | **Confirm your email address first.** "We sent you a link when you signed up, and it has to be opened before you can sign in. Check your inbox, and your spam folder." **plus a Resend it button** |
| the captcha could not load | **The security check did not load.** "The check that confirms you are a person did not load, so the sign in was never sent. An ad blocker, a privacy extension, or a network that blocks challenges.cloudflare.com will do this. Turn one off for this page, or try a different network, then sign in again." |
| a wrong password | unchanged. "The credentials entered are invalid" |
| anything else | "Something went wrong and the sign in did not complete. Please try again, and if it keeps happening, wait a minute before trying once more." |

**The Resend it button does not ask for the email address again.** The visitor
just typed it into the form above; the container remembers it and sends the
confirmation link straight off one click. There is an existing
`ResendAuthLinkForm` that asks for the address, and it is right for the
standalone page it lives on and wrong here.

### The screens

They are in the session. Rendered with the real component, the real error strings
Supabase returns, the real stylesheet, at desktop width and at 375px. Reachable
again at **`/dev/auth-errors`** on a development build, next to the existing
`/dev/states`, and that page renders nothing outside development.

**And on the real sign-in page, not only the dev page.** The form was filled and
submitted and the new screen came back with the Resend it button on it; clicking
it swapped the button for *"Sent. Check your inbox, and your spam folder."*

**One thing about that last test, stated plainly.** The auth answer was stubbed
in the browser so the live project was never contacted. Reaching the unconfirmed
screen honestly needs a real unconfirmed account on the **hosted** database, and
creating one would sign up a real account and mint real credits into the live
ledger, on a site taking money, in the lane another session is working in right
now. The network log confirms nothing left the machine. The component, the
copy, the classification and the button are all real; only the server's answer
was canned.

### Where the copy came from

The `unclaude-messaging` skill, as the brief required. No em dashes and no en
dashes, plain sentences, and nothing that blames the visitor for something the
site did.

---

## S-4 — `/favicon.ico`. 404 before, 200 now, and it no longer wakes a server.

### Before, on the live site

```
https://un-claude.com/favicon.ico  ->  HTTP 404   text/html   70,710 bytes
```

**Note the size.** Every one of those failures downloads a seventy-kilobyte HTML
error page. Ninety-seven of every hundred lines in the production log is that
request.

### After

```
http://localhost:3003/favicon.ico  ->  HTTP 200   image/x-icon   928 bytes
  Cache-Control: public, max-age=604800, stale-while-revalidate=86400

  file: MS Windows icon resource - 3 icons, 16x16 and 32x32 with PNG image data
  sha256 served : 9170b476fdee774842bcb905f51c010d912f689caf7e6a58f6fd74cede0cd88c
  sha256 source : 9170b476fdee774842bcb905f51c010d912f689caf7e6a58f6fd74cede0cd88c
```

The bytes served are the project's own existing icon, unchanged.

### Three parts, and only the first is the one the audit asked for

**1. The file now exists at the web root**, as `apps/web/public/favicon.ico`.

**2. The proxy no longer runs on it.** A file existing is only half of it.
Without an exclusion in `proxy.ts`, every browser asking for an icon still wakes
a server function, is logged and is billed. It is excluded now, so it is served
straight off the static layer and does not appear in the function log at all.
Neither URL pattern in the proxy ever wanted to see an icon request, so this
changes no behaviour.

**3. A week of cache**, so browsers stop asking. A 200 requested on every page
load is still a line in the log. A week rather than a year because an icon that
cannot be changed for twelve months is its own problem, and
`stale-while-revalidate` picks a change up in the background.

### One thing that was tried and backed out, worth recording

The file was first put at `app/favicon.ico`, which is the Next.js convention.
**It works, and it has a side effect the repo has already documented against.**
`lib/root-metdata.ts` sets `icons` explicitly and says in its own comment that
doing so turns Next's file-convention auto-detection off. That is true of
`app/icon.svg` and **not** true of `app/favicon.ico`, which Next linked into the
head anyway:

```
shortcut icon    -> /images/favicon/favicon.ico
icon             -> /favicon.ico?favicon.2g1h95vuz7io3.ico     <- added by the convention
icon             -> /icon.svg
apple-touch-icon -> /images/favicon/apple-touch-icon.png
mask-icon        -> /images/favicon/safari-pinned-tab.svg
```

A duplicate icon link pointing at the same bytes harms nothing, but it quietly
contradicts a decision the repo has written down. Moving the file to `public/`
serves the legacy path and leaves the head exactly as documented:

```
<link rel="shortcut icon" href="/images/favicon/favicon.ico"/>
<link rel="icon" href="/icon.svg"/>
<link rel="apple-touch-icon" href="/images/favicon/apple-touch-icon.png"/>
<link rel="mask-icon" href="/images/favicon/safari-pinned-tab.svg" color="#c45e3d"/>
```

---

## S-5 — the false positives. Audited and measured. NOT fixed, and it is not this lane's file.

### The brief pointed at the wrong file, and this is the pushback

The board says the AI-marker list is in the workbench's `characters.ts`. **It is
not.** That file explains hidden characters to a reader and contains no phrase
list at all. The markers live in **`apps/web/engine/score_stylometry.py`**, in a
tuple called `AI_PHRASE_PATTERNS`, and `apps/web/engine/**` was explicitly
excluded from this session. Nothing was changed there.

**What was done instead is the half the brief said belongs to Jon anyway:**
measure it and report it, because what the scanner claims to detect is a product
claim.

### The reported defect, reproduced and costed

The claim was that the marker fires on "in the world". It does. **What was not
known is how far it moves the number.** The same paragraph, twice, with three
ordinary words changed and nothing else:

```
--- "The tallest mountain in the world is Everest..." ---
  words            : 107
  ai_ngram_density : 1.3084
  score            : 0.46
  confidence_level : LOW
  matched_markers  : [{'phrase': "in today's fast-paced world/landscape",
                       'count': 1, 'weight': 1.4, 'samples': ['in the world']}]

--- "The tallest mountain on the planet is Everest..." ---
  words            : 107
  ai_ngram_density : 0.0
  score            : 0.1225
  confidence_level : CLEAN
  matched_markers  : []
```

**`CLEAN` to `LOW`, and the score close to quadruples, on "in the world".**

### It is wider than that phrase, and wider than that marker

**The real defect is that several patterns are broader than the label the
customer is shown.** The label is a product claim: it tells the customer what was
found. When the regex behind it matches something else, the product is reporting
a finding that did not happen.

**The same marker also fires on three more ordinary phrases**, because the
adjective in its own label is optional in its pattern:

```
LABEL SHOWN TO THE CUSTOMER: "in today's fast-paced world/landscape"   weight 1.4
  FIRES  The tallest mountain in the world is Everest.        matched: "in the world"
  FIRES  In the era of steam, Manchester doubled in size.     matched: "In the era"
  FIRES  Frogs are sensitive to changes in the environment.   matched: "in the environment"
  FIRES  Wordsworth wrote about the human place in the landscape.  matched: "in the landscape"
  FIRES  In today's fast-paced world, businesses must adapt.  matched: "In today's fast-paced world"
```

**And two other markers have the same shape of defect:**

```
LABEL: "serves as a beacon/catalyst/cornerstone"   weight 1.1
  FIRES  My grandmother served as a reminder that grief passes.   matched: "served as a reminder"
  FIRES  The scar serves as a reminder of the accident.           matched: "serves as a reminder"
```

`reminder` is in the pattern and is **not in the label**. "Served as a reminder"
is ordinary English.

```
LABEL: "plays a pivotal/crucial role"   weight 1.0
  FIRES  Photosynthesis plays a key role in the carbon cycle.  matched: "plays a key role"
  FIRES  The hippocampus plays a vital role in memory.         matched: "plays a vital role"
    -    Trade unions played a pivotal role in the strike.
```

`key` and `vital` are in the pattern and not in the label, and both are standard
academic writing. **And it misses the past tense of its own label** — the pattern
is `plays?`, so "played a pivotal role" does not fire while "plays a key role"
does. Wrong in both directions.

```
LABEL: "ultimately,"   weight 0.6
  FIRES  The appeal ultimately failed.        matched: "ultimately "
  FIRES  She ultimately chose medicine over law.
```

The label has a comma, implying the word opens a sentence. The pattern fires on
the word anywhere.

```
LABEL: "it is important/crucial to note"   weight 0.9
  FIRES  It is worth noting to note that this branch can never match.
```

A dead branch: the pattern can build "it is worth noting to note", which nobody
writes.

### How often this lands

Nineteen ordinary human sentences, written for this check, none machine-written:

```
19 of 19 fired at least one AI marker.
```

**That number should not be read as nineteen defects.** Some of those are the
markers doing their job — "in conclusion", "furthermore", "moreover" genuinely
are overrepresented in machine writing, and when they fire, the label matches
what matched. **Whether ordinary words like those should carry weight at all is a
product decision and belongs to Jon**, which is why nothing was deleted.

### The recommendation, for Jon

**Two different problems, and only the first is unambiguously a bug.**

**Fix the label mismatches.** Where a pattern matches something its own label does
not describe, the product is telling a customer it found a thing it did not find.
That is not a tuning question. The cheapest correct fix on the worst one is to
make the adjective compulsory rather than optional, so
`in today's fast-paced world` still fires and `in the world` does not.

**Leave the rest to a decision.** Whether "a myriad of", "paradigm shift" and
"holistic approach" should move a customer's score is a claim about what the
product detects, and that is Jon's to set, not a session's to quietly trim.

**Why it matters more than its severity.** A false positive here is the product
accusing a customer's own writing of being machine-written, which is precisely
backwards. It is limited today because the row on screen reads "PRESUMED
PRESENT" whatever the score, but the score is computed, stored and shown, and it
is the layer the site offers as evidence.

---

## Files changed

**In territory:**

```
apps/web/app/auth/callback/route.ts          S-1
apps/web/proxy.ts                            S-4  (matcher only)
apps/web/next.config.mjs                     S-2, S-4  (headers only)
apps/web/public/favicon.ico                  S-4  (new; the project's existing icon)
```

**Outside the literal territory list, named here because it was, and why:**

```
packages/features/auth/src/safe-next.ts                          S-1  (new)
packages/features/auth/src/components/sign-in-methods-container.tsx  S-1, S-3
packages/features/auth/src/components/auth-error-alert.tsx       S-3
packages/features/auth/src/components/password-sign-in-container.tsx S-3
packages/features/auth/src/components/resend-confirmation-button.tsx S-3  (new)
packages/features/auth/src/shared.ts                             S-3  (two exports)
packages/features/auth/package.json                              S-1  (one export entry)
apps/web/i18n/messages/en/auth.json                              S-3  (the copy)
apps/web/app/dev/auth-errors/page.tsx                            S-3  (new; dev-only)
```

**S-3 could not be done inside `app/auth/**`.** The sign-in page renders a
component that lives in `packages/features/auth`, and that is where the error
text is chosen. The auth package is not the territory of Lane B, C or D, so
there is no second writer in any of these files, but it is outside what the brief
listed and is recorded here rather than glossed over.

`apps/web/app/dev/auth-errors/page.tsx` follows the pattern `/dev/states` already
set: real components, real widths, guarded so it renders nothing outside
development. It exists so the screens can be looked at rather than described.

---

## For the conductor

- **S-1 done**, and it closed a second instance the audit did not find.
- **S-2 done for four headers. CSP is open and needs its own session with a
  preview deployment.** It is not a line of config.
- **S-3 done.**
- **S-4 done**, plus the two extra pieces that are what actually quiets the log.
- **S-5 audited, not fixed. The board's file reference is wrong** and should be
  corrected to `apps/web/engine/score_stylometry.py`, which puts the fix in Lane
  A. The audit and the recommendation are above.
- Nothing deployed, nothing pushed.
