MODEL: Opus 5, high effort. Small, but one item is a live security hole
and one is the reason nobody can read the production logs.

READ FIRST
1. CLAUDE.md in full. Section 4 governs: prove every fix with the real
   response pasted in, not a description of it.
2. docs/session-notes/f1-audit.md — the security-headers section, the
   open-redirect finding (numbered 3), and the auth-error finding.
3. docs/IMPLEMENTATION-BOARD.md, Lane E.

TERRITORY: apps/web/app/auth/**, apps/web/proxy.ts (or the middleware),
apps/web/next.config.mjs (headers only), apps/web/app/favicon or icon
route, apps/web/app/(marketing)/_components/workbench/characters.ts
(S-5 only), and this note.

DO NOT TOUCH: lib/server/credits.ts, app/api/stripe/**,
app/api/checkout — **another session is in those right now.**
Not apps/web/engine/**, not apps/web/api/*.py, not the workbench beyond
the one file named above, not the marketing or legal pages, not
docs/IMPLEMENTATION-BOARD.md.

**THE SITE IS LIVE AND TAKING REAL MONEY. Do not deploy. Do not push.**

═══════════════════════════════════════
S-1 — THE OPEN REDIRECT. Do this first.
═══════════════════════════════════════
Any link beginning `https://un-claude.com/` can be made to land the
visitor on **any other website**, signed out, with no account needed.
That is the shape used for phishing: a link that genuinely starts with
your domain and ends somewhere else.

Three skeptics reproduced it and then argued it down from high to medium,
on the grounds that a phishing link is only worth what the domain's
reputation is worth and this domain is days old. **They are right, and
that is exactly the argument for fixing it now** — it is one condition on
`/auth/callback`, and it gets more expensive to have left as the name
becomes worth stealing.

Reproduce it first and paste the real redirect. Then allow only
same-origin destinations, or a short allow-list of your own paths, and
show a hostile URL being refused.

═══════════════════════════════════════
S-2 — FIVE OF THE SIX STANDARD SECURITY HEADERS ARE ABSENT
═══════════════════════════════════════
Verified against the live site:

```
PRESENT  strict-transport-security
missing  content-security-policy
missing  x-frame-options
missing  x-content-type-options
missing  referrer-policy
missing  permissions-policy
```

**And the same on `/auth/sign-in`, the page where people type a
password.** `x-frame-options` there is the one that stops the sign-in
form being framed by somebody else's site.

**A WARNING THAT WILL COST YOU AN AFTERNOON IF YOU IGNORE IT.** This site
serves an **inline** analytics script (the PostHog snippet in
`components/analytics-provider.tsx`). A strict Content-Security-Policy
blocks inline scripts, so a careless CSP silently kills analytics and
possibly more. **Verify in a real browser with the console open, not by
reading the header back.** If a correct CSP needs a nonce or hash and
that turns out to be a larger change, **ship the other four headers and
report CSP separately** — four headers landed beats five headers and a
broken site.

═══════════════════════════════════════
S-3 — THREE DIFFERENT AUTH FAILURES ALL BLAME THE VISITOR'S INTERNET
═══════════════════════════════════════
A blocked captcha, an unconfirmed email address, and everything else all
produce *"please ensure you have a working internet connection"*. Two of
those are not connection problems, and the middle one is **the single
most common signup problem there is**.

At minimum: an unconfirmed email says so and offers a **Resend it**
button. A blocked captcha says the check could not load and what to try.
Everything else keeps a generic message.

Copy work fires the `unclaude-messaging` skill. Let it. Keep it plain and
do not blame the visitor for something the site did.

═══════════════════════════════════════
S-4 — /favicon.ico 404s, AND IT MAKES THE PRODUCTION LOG UNREADABLE
═══════════════════════════════════════
Verified: `https://un-claude.com/favicon.ico` returns **404**.
**97% of the production log is that one error.** Everything real is
buried under it, which matters more now the site takes money and this is
the only place a problem shows up.

The site already has a full favicon set in
`apps/web/public/images/favicon/` and an `app/icon.svg`. Something is
simply not answering at the legacy path. Fix it and show a 200.

═══════════════════════════════════════
S-5 — THE SCANNER FLAGS THE WORDS "IN THE WORLD"
═══════════════════════════════════════
The AI-marker list fires on that ordinary three-word phrase, so a
perfectly human sentence gets reported as carrying an AI marker. **A
false positive here is the product accusing a customer's own writing of
being machine-written**, which is precisely backwards.

Look at the list in the workbench's `characters.ts` for other entries
with the same problem, and report anything you find rather than quietly
deleting half of it — what the scanner claims to detect is a product
claim and belongs to Jon.

═══════════════════════════════════════
FINISHING
═══════════════════════════════════════
Jon is not a programmer and cannot check this by reading code.

- S-1: the hostile URL working, then the same URL refused.
- S-2: `curl -I` before and after, plus a real browser console showing
  nothing broke.
- S-3: the actual screens.
- S-4: `curl` showing 404 then 200.

A step you skipped is a step that failed. Say which.

Write docs/session-notes/lane-e-security.md.

Before EVERY commit run `git diff --cached --name-only` and confirm only
your own files are listed — **another session is live in this repo right
now** and a stray `git add` in theirs leaves their paths staged for your
commit. Never `git add -A`, `git add .` or `git commit -a`.
Do NOT deploy or push.
