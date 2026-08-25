# The operator dashboard

**Built 24 August 2026, rebuilt live 25 August.** One command that answers: how
much money came in, how much is going out, how many people used it, what broke,
and how much credit is left on the AI gateway.

**It runs on your own machine and is served only to your own machine.** It is
not hosted and nothing about it is deployed — it reads your live payment key and
the database master key, and those never leave this laptop.

---

## ★ WHAT YOU HAVE TO DO

### 1. Run it

```bash
cd ~/un-claude/apps/web && node scripts/dashboard/serve.mjs
```

It opens in your browser and **stays live** — every time you refresh, it fetches
everything again. Leave the tab open all day. **Press Ctrl-C in the terminal to
stop it.**

There is a **Refresh now** button at the top, and a **refresh every minute**
tick-box beside it if you want it updating on its own.

**Why this is safe even though it reads your live keys.** The page is served
only to this computer — nothing on the wifi can reach it, the address carries a
random code that changes every time you start it, and no key is ever sent to the
browser. **The page does list customer email addresses**, so treat the tab the
way you would treat the Stripe dashboard.

**If you want a frozen copy** to keep or look at later, `run.mjs` writes one
HTML file instead:

```bash
cd ~/un-claude/apps/web && node scripts/dashboard/run.mjs
```

### 2. Add your live Stripe key (5 minutes)

**Until you do, there is no Payments panel.** It does not show practice
payments any more — a fake revenue figure is worse than none.

Your real sales still appear, in **Money taken** in the Usage panel, because our
own database recorded each payment as it happened. What the live key adds is the
detail only Stripe holds: declined cards, refunds and disputes.

1. Open the **Stripe dashboard**. Make sure the **Test mode** switch at the top
   right is **OFF**.
2. Go to **Developers → API keys**.
3. Next to **Secret key**, press **Reveal** and copy it. It starts with
   `sk_live_`.
4. Open `apps/web/.env.local` and add one line:

```
UC_DASHBOARD_STRIPE_KEY=sk_live_your_key_here
```

5. Refresh the page.

**Why that name and not `STRIPE_SECRET_KEY`.** That other variable is the key
the website itself uses when it runs on this laptop, and it is deliberately a
test key so development cannot charge a real card. **Putting a live key there
would arm your local site with real money.** `UC_DASHBOARD_STRIPE_KEY` is read
by this dashboard and by nothing else.

### 3. Create the PostHog key (5 minutes)

**This is the only way to see free scans.** A scan costs no credit, so it writes
nothing to our database — measured 25 August 2026, all 78 job rows are paid
clean-ups and there is no scan row anywhere. PostHog is the only place a scan is
recorded.

1. Open **PostHog** and sign in.
2. Click your **name or avatar, bottom left → Personal API keys**. (Or go
   straight to `https://us.posthog.com/settings/user-api-keys`.)
3. Press **+ Create personal API key**.
4. Label it `un-claude dashboard`.
5. Under **Scopes**, choose **read** access for these two, and nothing else:
   - **Query** — lets it ask questions about events
   - **Project** — lets it find which project to ask
6. Under **Organization & project access**, leave it on all projects, or pick
   the un-claude one.
7. Press **Create key**, then **copy it immediately** — PostHog shows it once
   and never again. It starts with `phx_`.
8. Open `apps/web/.env.local` and add one line:

```
POSTHOG_PERSONAL_API_KEY=phx_your_key_here
```

9. Refresh the page.

**Optional, to leave your own visits out.** The dashboard already ignores this
laptop and every preview copy of the site, but it cannot tell your visits to the
real site from a stranger's. To exclude yourself, find your IP address (search
Google for "what is my IP") and add:

```
POSTHOG_EXCLUDE_IPS=1.2.3.4
```

**A note on where these keys live.** `apps/web/.env.local` is already ignored by
git, so nothing you add there gets committed or published. The PostHog key is
read-only analytics and the least dangerous of the four. The Stripe live key is
the most dangerous — if you would rather not have it in a file at all, you can
supply it for a single run instead:

```bash
cd ~/un-claude/apps/web && UC_DASHBOARD_STRIPE_KEY='sk_live_...' node scripts/dashboard/serve.mjs
```

---

## What changed on 25 August 2026, and why

Jon reviewed the first version. Five things came out of it.

**It is live now, not a snapshot.** A page he could not refresh was useless. The
original brief ruled out hosting because the dashboard reads live secrets — that
reasoning still holds, and it rules out *hosting*, not a server only this
machine can reach. `serve.mjs` binds to `127.0.0.1`, requires a random token in
the URL, and checks the `Host` header so that a hostile website cannot read it
through the browser.

**The practice-payments panel is gone.** It showed sandbox figures behind a
warning. No arrangement of warnings makes a fake revenue number worth showing to
the person trying to run the business.

**The health check runs on deepseek, not mistral.** The probe was asking
`mistral/mistral-small` whether the gateway was working, while production runs
`deepseek/deepseek-v3.2`. A cap or an outage can hit one provider and not the
other, so the check was answering the wrong question. Fixed, and the probe
timeout was raised to 40 seconds — deepseek is slower than mistral and the old
10-second limit was intermittently reporting the product as down when it was
fine.

**Credit loaded is now a headline number**, with the monthly limit beside it.
See the next section.

**The customer list is on the page**, with emails.

---

## How the gateway numbers work

Two separate things can stop the paid rewrite, and they run out independently.

**Money loaded** is real prepaid credit on the account. At zero, everything
stops. This is the number you asked for, and it is at the top of the page.

**The monthly spending limit** is the cap on the key — the thing that took the
site down on 24 August, when the key hit its $10 limit while $14.99 of credit
sat there unspendable. **You raised it to $100 a month.**

**★ No API reports that cap.** It exists only in the Vercel dashboard. So the
dashboard takes it from a setting, which defaults to $100. **If you change the
limit in Vercel, change it here too**, or the page will be confidently wrong:

```
AI_GATEWAY_MONTHLY_LIMIT=100
```

**How "spent this month" is worked out.** The gateway only ever reports a total
for all time, never a monthly figure. So every time the dashboard runs, it
writes down what the gateway said. Once there is a reading from earlier in the
month, the difference is the monthly spend — from the gateway's own numbers, so
it includes spending this project did not cause, which is exactly what burned
the cap last time.

**It is a floor, not an exact figure**, because anything spent before the first
reading is invisible. **For the first day it shows "still measuring" rather than
a number**, because "$0.00 of $100.00" would read as reassurance when it means
"we only just started counting" — and misplaced reassurance about gateway
headroom is precisely what caused the outage. Run it daily and it becomes
accurate.

## What each panel means

### The six numbers at the top

| Number | What it is |
|---|---|
| **Money in** | Everything customers have paid, after refunds, all time. |
| **Money out** | Everything spent on the AI that performs the rewrite, all time. |
| **Credit loaded** | Real money sitting on the AI account. **At zero, the rewrite stops.** |
| **AI service** | Whether the paid rewrite is working **right now**, checked on deepseek. |
| **Jobs run** | How many documents have been cleaned. Paid clean-ups only — free scans are not recorded anywhere but PostHog. |
| **Failed jobs** | Jobs that broke and had their credits handed back. |

**Anything wrong appears as a coloured strip above those numbers**, so a glance
is enough. Red is urgent, yellow is worth knowing, blue is a note.

### Payments — Stripe

The money customers actually paid, **real payments only**. If the live key is
missing the panel shows setup instructions instead of figures — it will never
show you sandbox money dressed up as revenue.

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

So this panel shows the two limits side by side — **money loaded** and **this
month against your $100 cap** — and, because neither can be fully trusted,
**asks the gateway to do a tiny piece of real work every time the page loads**,
reporting "Working normally" or "REFUSING WORK". That last line is the reliable
answer to "is it up?", because it asks rather than calculates.

**The probe runs on `deepseek/deepseek-v3.2`, the model production actually
uses.** It was on mistral until 25 August, which meant it was answering a
question nobody asked: a cap or an outage can hit one provider and not another.

### Usage and credits — our own database

**Everything on this panel is an exact count.** Each figure is a row in our own
database: a thing that really happened. Nothing is sampled or estimated.

It covers money taken (real, whatever key Stripe is using), **the list of
everyone who has signed up**, jobs run, credits granted and spent, and what each
job cost us to serve.

**The customer list.** Every signed-up person, newest first, with their email,
when they joined, how many credits they have left, how many jobs they have run
and how much they have paid. Nine people at the time of writing, two of whom
have bought something. Everything beside the address is computed from that
person's own credit history, so it cannot disagree with the balance they see
when they log in.

**On the account numbers.** "Accounts of every kind" counts anonymous visitors
too — anybody who lands on the site gets a temporary identity and free credits.
At the time of writing that is 9 real accounts out of 52 total, so the
distinction matters a great deal.

**★ FREE SCANS ARE NOT HERE AND CANNOT BE.** A scan costs no credit, so it
writes no row. Measured 25 August 2026: all 78 job rows are paid clean-ups,
there is no scan endpoint and no scans table. **PostHog is the only place a free
scan is recorded.**

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
test key exists on this machine, and I will not put a live key anywhere myself.
The code path is identical for both — same requests, same arithmetic, only the
key differs — so I have no specific reason to doubt it. But I did not run it, so
I am not claiming it as verified. **The first thing to check after you add the
key is that the "Kept, all time" figure matches your Stripe dashboard.**

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
The $100 figure is the one you told me. If it is wrong, or you change it in
Vercel, the page will be confidently wrong until `AI_GATEWAY_MONTHLY_LIMIT` is
updated. **The live probe is unaffected by this** — it asks rather than
calculates, which is why it is the line to trust.

**5. "Spent this month" has never shown a real figure yet.** It needs a reading
from an earlier day to subtract from, and the first readings were taken today.
The arithmetic is simple and the "still measuring" state is what you will see
until tomorrow. I could not test the populated state without waiting a day.

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

**The commands**

```bash
cd ~/un-claude/apps/web && node scripts/dashboard/serve.mjs
```

The live dashboard. `--no-open` skips opening the browser, `UC_DASHBOARD_PORT`
changes the port (default 4477).

```bash
cd ~/un-claude/apps/web && node scripts/dashboard/run.mjs
```

The frozen file. `--no-open`, and `--out <path>` to write elsewhere.

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
| `serve.mjs` | **The live dashboard.** Local-only HTTP server: binds 127.0.0.1, random URL token, checks the Host header, re-reads all four sources on every request |
| `run.mjs` | The frozen file. Same numbers, written once, and refuses to write at all if a key is in the output |
| `view.mjs` | Which six numbers go at the top and what counts as a problem. Shared by both, so they cannot disagree |
| `history.mjs` | The local record of gateway readings, which is the only way to know this month's spend |
| `env.mjs` | The only place credentials are read. The real environment wins over the files, so a live key can be supplied for one run without being saved |
| `http.mjs` | **Every network call goes through here.** Refuses any method but GET except two named read-shaped POSTs |
| `leak-check.mjs` | Scans the finished page for keys, and redacts anything credential-shaped out of text before it is shown |
| `stripe.mjs`, `gateway.mjs`, `database.mjs`, `posthog.mjs` | One source each. Each returns a failure as a value, never as a crash |
| `html.mjs` | The page. Nothing is loaded from the internet — no font, no stylesheet, no image. The only script is a few lines for the auto-refresh tick-box |
| `verify-safety.mjs` | Proves the two guarantees above |

**The two rules that hold it together**

- **One dead source degrades one panel, never the page.** Every source is wrapped
  so it returns a failure rather than throwing. Verified by unplugging all four
  at once: the page still rendered, with every panel explaining itself.
- **Read-only is enforced, not promised.** `http.mjs` throws on any write before
  a request leaves the machine. No function that could write to Stripe exists in
  this directory. The live server also refuses any request that is not a GET.
- **The live server is reachable only from this machine.** Verified 25 August:
  bound to `127.0.0.1:4477` and unreachable on the LAN address; no token, wrong
  token and a spoofed `Host` header all return 404; a POST returns 405.
