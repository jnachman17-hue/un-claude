# The operator dashboard

**Built 24 August 2026.** One command that answers: how much money came in, how
much is going out, how many people used it, what broke, and how much room is
left on the AI gateway.

It writes a single HTML file on your own machine and opens it. **It is not a
website, it is not hosted, and nothing about it is deployed.** It reads your
live payment key and the database master key, and those must never leave this
laptop.

---

## ★ WHAT YOU HAVE TO DO

Three things. The first is the only one that is compulsory.

### 1. Run it

```bash
cd ~/un-claude/apps/web && node scripts/dashboard/run.mjs
```

That is the whole command. It takes about five seconds and opens the page in
your browser by itself. **Run it again whenever you want fresh numbers** — the
page is a photograph of the moment it was made, not a live feed, and it says at
the top when it was taken.

### 2. Make the Payments panel show real money (5 minutes)

**Right now the Payments panel is showing practice money, and the page says so
in yellow at the top.**

Here is the problem in plain terms. Stripe runs two separate worlds: a
**practice world** for testing, where the payments are pretend, and the **real
world**, where actual cards are charged. Each world has its own key. **The key
saved on this laptop is a practice key**, so the Payments panel can only see
pretend payments.

Your real sales are not lost, and the dashboard does show them — the **Money
taken** figures in the Usage panel come from our own database, which recorded
the real payment when it happened. That is where the $4.99 on the page comes
from, and it is real.

To make the Payments panel real as well:

1. Go to the Stripe dashboard and make sure the **Test mode** switch is OFF.
2. Go to Developers → API keys, and reveal the **Secret key**. It starts with
   `sk_live_`.
3. Run the dashboard like this, pasting your key where shown:

```bash
cd ~/un-claude/apps/web && STRIPE_SECRET_KEY='sk_live_paste_yours_here' node scripts/dashboard/run.mjs
```

**Do not save that key into any file in this project.** Typed on the command
line like that, it is used once and forgotten. The dashboard is built to prefer
a key given this way over the one in the file, precisely so you never have to
write the live key down.

### 3. Switch on the Behaviour panel (5 minutes, optional)

The fourth source is PostHog, which is the tool that records what visitors do on
the site. **It needs a key that does not exist yet**, so that panel currently
shows a grey "not set up" box. Everything else works without it.

1. In PostHog, go to **Settings → Personal API keys → Create personal API key**.
2. Name it something like `un-claude dashboard`.
3. Give it **read access to `Query` and to `Project`** and nothing else. It only
   ever reads.
4. Copy the key. It starts with `phx_`.
5. Run the dashboard like this:

```bash
cd ~/un-claude/apps/web && POSTHOG_PERSONAL_API_KEY='phx_paste_yours_here' node scripts/dashboard/run.mjs
```

**If you would rather not paste it every time,** add the line
`POSTHOG_PERSONAL_API_KEY=phx_...` to `apps/web/.env.local`. That file is
already ignored by git and never leaves the laptop. This is a read-only
analytics key, so it is much less dangerous than the Stripe one.

**Optional, to leave your own visits out of the numbers:** add
`POSTHOG_EXCLUDE_IPS=1.2.3.4` with your home IP address. See "What the Behaviour
panel can and cannot tell you" below for why this matters.

---

## What each panel means

### The five numbers at the top

| Number | What it is |
|---|---|
| **Money in** | Everything customers have paid, after refunds, all time. |
| **Money out** | Everything spent on the AI that performs the rewrite, all time. |
| **AI service** | Whether the paid rewrite is working **right now**. |
| **Jobs run** | How many times somebody cleaned a document. |
| **Failed jobs** | Jobs that broke and had their credits handed back. |

**Anything wrong appears as a coloured strip above those numbers**, so a glance
is enough. Red is urgent, yellow is worth knowing, blue is a note.

### Payments — Stripe

The money customers actually paid. **The panel says in its title and in a banner
whether it is showing real or practice money**, so you never have to wonder
which world you are looking at.

It shows what you charged, what you kept after refunds, declined payments,
refunds and disputes. **A dispute is when a customer tells their bank they did
not authorise a payment.** They have a reply deadline and cost $15 each on top
of the amount, which is why an open one is shown in red at the top of the page.

### What the AI costs us — the Vercel AI Gateway

**This panel exists because of a trap that already took the site down once,** on
24 August 2026, and the panel is designed around not letting it happen again.

The gateway reports two numbers: how much has been **spent**, and a **prepaid
credit** balance. On that day, the paid rewrite stopped working entirely while
the prepaid credit still read $14.99. The money was real and none of it was
spendable, because **there is a separate spending limit set on the key itself,
and no API anywhere reports that limit.**

So this panel does three things:

- shows **spent** as the number that matters, prominently;
- labels the prepaid balance as explicitly **not** your remaining headroom;
- **asks the gateway to do a tiny piece of real work every time the page is
  generated**, and reports "Working normally" or "REFUSING WORK".

**That last line is the reliable answer to "is it up?"** The limit itself can
only be seen in the Vercel dashboard under AI Gateway → API keys → the key.

### Usage and credits — our own database

**Everything on this panel is an exact count.** Each figure is a row in our own
database: a thing that really happened. Nothing is sampled or estimated.

It covers money taken (real, whatever mode Stripe is in), accounts, jobs run,
credits granted and spent, and what each job cost us to serve.

**On the account numbers.** "Accounts of every kind" counts anonymous visitors
too — anybody who lands on the site gets a temporary identity and two free
credits. "Real accounts, signed up" is the number that means customers. At the
time of writing that is 9 real accounts out of 46 total, so the distinction
matters a great deal.

### Behaviour — PostHog

**Treat this panel as a shape, not a count. The other two panels are the truth.**

The site deliberately stores nothing on a visitor's device — that is a decision
recorded in the decision log and promised in the live cookie policy. Two things
follow, and neither is a bug:

1. **Visitor counts are higher than the number of real people.** Somebody who
   comes back tomorrow is counted as a new person.
2. **"Came back having paid" cannot be joined to "pressed a pack button".** A
   buyer leaves the site for Stripe and returns as a stranger. Both numbers are
   honest on their own; **a conversion rate calculated between them would be
   fiction.** The page prints this warning next to the funnel.

**On internal traffic.** PostHog's own "internal user" setting is applied inside
PostHog's own interface and does **not** apply to the queries this dashboard
makes, so it would have had no effect. Instead the dashboard counts only visits
to `un-claude.com`, which removes this laptop and every preview copy of the
site. **Your own visits to the live site are still counted** unless you set
`POSTHOG_EXCLUDE_IPS`. The page states exactly this, so the number is never
read as cleaner than it is.

---

## What each source can and cannot tell you

| Source | Can tell you | Cannot tell you |
|---|---|---|
| **Stripe** | Every payment, refund and dispute, with amounts. The authority on money | Anything at all about the other world. A practice key cannot see real sales, and a real key cannot see practice ones |
| **AI Gateway** | Total spent, prepaid balance, and whether it is serving right now | **The spending limit on the key.** No API reports it. Vercel dashboard only |
| **Database** | Exact counts of everything: money, accounts, jobs, credits, costs | When an account was created (that column is empty — see below). Anything about visitors who never triggered an event |
| **PostHog** | The shape of how people move through the site, and what is failing | Whether two events came from the same person. Any reliable conversion rate across the Stripe boundary |

---

## What I could not prove

**The honest list, per `CLAUDE.md` section 4. A step I skipped is a step that
failed.**

**1. The Behaviour panel has never returned real data.** There is no PostHog key
on this machine, so the only paths I could exercise were the failure ones — no
key, a rejected key, and a key that cannot list projects. All three degrade
correctly and are shown on the page with the fix. **The success path — the query
running and its answer being drawn as a funnel — is written but unverified.**
The first time you run it with a real key, it may need a correction. If it does,
the panel will say what went wrong rather than breaking the page.

**2. The Payments panel has never been run against a live Stripe key.** Only the
practice key exists here. The code path is identical for both — the same
requests, the same maths — and the only difference is which key is sent, so I
have no specific reason to doubt it. But I did not run it, so I am not claiming
it as verified.

**3. "Jon's first real sale must appear" — it does, but not from Stripe.** The
brief asked for the real sale to be visible. With the key on this machine it
cannot come from the Payments panel, because that key is a practice key and
Stripe refuses to show it: asked directly about the payment, Stripe replies *"a
similar object exists in live mode, but a test mode key was used to make this
request."* **The sale does appear, in the Usage panel, as $4.99 taken**, because
our own database recorded it when the real payment came in. So the requirement
is met, by a different route than the brief assumed, and the page is explicit
about which source each money figure came from.

**4. I did not verify the gateway's spending limit, because it cannot be read.**
The page says so rather than showing a gap.

---

## Two things I found that are not mine to fix

**Recorded here rather than in `docs/06`, because this session's brief limits it
to this file. Both are worth someone's attention.**

**1. `accounts.created_at` is empty on every row.** All 46 of them. The column
exists, is nullable, and has no default, so nothing ever fills it in. It cannot
answer "how many people signed up last week". The dashboard works around this by
dating each account from the moment it received its first free credits, which
happens the instant the account is made — the count is exact, only the column is
a stand-in, and the page says so. **The underlying gap is still there** and any
future report that trusts that column will silently return zero.

**2. The documented 60-second job ceiling disagrees with the deployed
configuration.** `docs/04` and `docs/06` both describe a 60-second limit, and one
recorded job took 64.98 seconds — which under that limit should have been
impossible. `apps/web/vercel.json` sets `maxDuration: 300`. **I did not resolve
which is authoritative**, so the dashboard states the longest recorded job time
and deliberately makes no claim about the limit.

---

## For whoever works on this next

**The command**

```bash
cd ~/un-claude/apps/web && node scripts/dashboard/run.mjs
```

Options: `--no-open` to skip opening the browser, `--out <path>` to write
elsewhere.

**Proving the safety promises**

```bash
cd ~/un-claude/apps/web && node scripts/dashboard/verify-safety.mjs
```

This tries to break both guarantees and shows them refusing: it plants real keys
into a pretend page and confirms the scanner catches them, and it attempts six
different writes to Stripe and the database and confirms every one is blocked.

**The files**

| File | What it does |
|---|---|
| `run.mjs` | The command. Reads all four sources at once, decides what counts as a problem, and refuses to write the file if a key is in it |
| `env.mjs` | The only place credentials are read. The real environment wins over the files, so a live key can be supplied for one run without being saved |
| `http.mjs` | **Every network call goes through here.** Refuses any method but GET except two named read-shaped POSTs |
| `leak-check.mjs` | Scans the finished page for keys, and redacts anything credential-shaped out of text before it is shown |
| `stripe.mjs`, `gateway.mjs`, `database.mjs`, `posthog.mjs` | One source each. Each returns a failure as a value, never as a crash |
| `html.mjs` | The page. No script, no font, no external anything |
| `verify-safety.mjs` | Proves the two guarantees above |

**The two rules that hold it together**

- **One dead source degrades one panel, never the page.** Every source is wrapped
  so it returns a failure rather than throwing. Verified by unplugging all four
  at once: the page still rendered, with every panel explaining itself.
- **Read-only is enforced, not promised.** `http.mjs` throws on any write before
  a request leaves the machine. No function that could write to Stripe exists in
  this directory.
