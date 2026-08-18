# un-claude: Build Specification

What exists, how the pieces fit, and the contract between the interface and the
rewriting engine. Written 18 August 2026 at the end of session 3.

**This describes what is actually built and verified,** not what is planned.
Anything unbuilt is in the gaps section at the bottom, or in
`06-assumptions-and-open-questions.md`.

---

## 1. The product, in one paragraph

A user pastes machine written text into a box. The tool rewrites it so it reads
naturally, and shows what changed and by how much. A signed out visitor gets a
free budget of words. Past that they register and buy credits, priced in words.
**Removing any provider's watermarks is explicitly not the goal.** See `04`
entry 10.

---

## 2. The stack

| Layer | Choice | Version |
|---|---|---|
| Framework | Next.js, App Router, Turbopack, Cache Components on | 16.3.0 |
| UI | React | 19.2.8 |
| Styling | Tailwind CSS with shadcn/ui components | 4.3.3 |
| Language | TypeScript | 7.0.2 |
| Auth and database | Supabase, hosted Postgres | managed |
| Hosting | Vercel, production on `un-claude.com` | managed |
| Monorepo | Turborepo with pnpm workspaces | 2.10.8 |
| Base | MakerKit Lite, MIT licensed | 1.0.0 |

**This is a monorepo.** The Next.js application lives in `apps/web`. Shared code
sits in `packages/` split across `ui`, `auth`, `supabase`, `features`, `i18n`,
`next` and `shared`. Vercel's root directory is set to `apps/web`.

**Read `apps/web/AGENTS.md` before writing Next.js code.** It warns that this
version differs from what a model is likely to remember and points at bundled
documentation in `apps/web/node_modules/next/dist/docs/`. That warning is real.

---

## 3. What was built in session 3

### `apps/web/lib/text-analysis.ts`

Measures prose. Dependency free and deterministic, so the same numbers come out
on the server and in the browser.

**The headline metric is `variation`,** the spread of sentence lengths expressed
as a percentage. Machine written prose holds one sentence length throughout, so
a low score is the most recognisable tell, and raising it is what "natural
rhythm" actually means.

**Verified on real passages rather than asserted:** a machine sounding paragraph
scores 24.5%, a human sounding paragraph of near identical word and sentence
count scores 100.5%. The metric genuinely discriminates.

Also produces word count, sentence count, average sentence length, and a Flesch
Kincaid reading grade.

**Word counting lives here and nowhere else,** deliberately. The number shown in
the counter and the number a user is billed for must never be able to disagree.

### `apps/web/lib/humanize-contract.ts`

**The agreed boundary between the interface and the engine.** Both sides import
it, so the interface cannot drift without the type check failing.

- Request: `{ text: string, tone: 'neutral' | 'casual' | 'professional' | 'academic' }`
- Response: a stream of newline delimited JSON frames
- `MAX_WORDS_PER_REQUEST` is 5,000
- `FREE_WORD_ALLOWANCE` is 500, **defined but not yet enforced**

**Errors are a closed set of codes with written messages,** not an open string.
This is deliberate: an open error string puts raw upstream text in front of a
user, which is exactly the `<DefaultError />` defect found in the kit's own auth
alert earlier the same day. See `06` row 13.

### `apps/web/app/api/humanize/route.ts`

**A MOCK. It contains no model call.** Replace `mockRewrite` when the real engine
lands; nothing else in the file should need to change.

Two properties worth preserving when it is replaced:

**It streams.** A client written to await one complete JSON object has to be
rebuilt when the engine later streams, because streaming changes the component's
state model rather than adding to it. A real rewrite of a long document takes
tens of seconds.

**It is slow and can be forced to fail.** Default delay is eight seconds.
`?delay=<ms>` overrides it and `?simulate=<code>` forces any error state,
including one that dies partway through a stream. A fast, always successful mock
produces an interface that only works on the happy path.

### `apps/web/app/home/_components/humanizer.tsx`

The editor. Split pane, tone selector, live word counter against the cap, Stop
button, copy button, streaming output with a cursor, metrics panel showing before
against after, and a sentence level highlight toggle where hovering a rewritten
sentence reveals the original.

Mounted at `/home`, which sits behind login.

---

## 4. The response stream, precisely

Frames arrive as one JSON object per line. Any number of `chunk` frames, then
exactly one terminal frame which is either `result` or `error`.

```
{"type":"chunk","text":"Artificial "}
{"type":"chunk","text":"intelligence "}
{"type":"result","before":{...},"after":{...},"changes":[...],"wordsBilled":66}
```

**A stream that ends without a terminal frame is treated as a failure,** not as a
success with missing data. Showing a half rewrite as though it were finished is
worse than saying it broke.

**`changes` is an array of `{ original, rewritten }` sentence pairs.** It powers
the highlight toggle. A single change can turn one sentence into two, so the
client matches by containment rather than equality.

---

## 5. Billing rules, decided and not yet built

Full reasoning in `04` entry 16.

- **Credits are priced in words,** not tokens. Nobody outside the industry knows
  what a token is, and an unfamiliar unit costs conversions at the moment
  someone is deciding to pay.
- **Input words are billed, not output.** The price must be knowable before
  committing, not discovered afterwards.
- **A failed rewrite refunds.** One bad minute of infrastructure must not cost a
  visitor their whole trial.
- **Overflow rejects, never truncates.** Silently rewriting the first N words
  hands someone a document that stops mid sentence, which reads as a broken
  product rather than as a limit.
- **A rewrite bills you twice.** The model charges for reading the input and
  again for writing the output, so 1,000 words costs roughly 2,600 tokens. Set
  margin against that number, not against the word count.

---

## 6. A constraint on the engine, found by accident and worth reading

The first mock made the product **worse on its own headline metric.** Sentence
variation went from 30.5% down to 18.9%.

**The cause generalises beyond the mock.** Compressing every sentence pulls them
all toward the same length, which makes the rhythm more uniform. That is the
opposite of humanizing. Three strategies were measured rather than guessed, and
compressing only alternate sentences fixed the direction by preserving contrast
between long and short sentences.

**Any rewriter that uniformly shortens or uniformly smooths will degrade the
exact quality it is selling.** That applies to a real model with a prompt just as
much as it applied to a crude regular expression. The reasoning is preserved in a
comment in the route so it outlives the mock.

---

## 7. What is not built

| | Status | Where it is tracked |
|---|---|---|
| The rewriting engine | Not started. Jon's workstream | `04` entry 15 |
| Definition of good output | **Undefined since session 1** | `06` row 4 |
| Billing and credits | Decided, not built | `06` row 10 |
| Free allowance enforcement | Decided, not built. Needs per visitor accounting | `06` row 10 |
| Landing page and features section | Still the kit's stock page | Next session |
| The tool on the public page | Agreed model, not built | `04` entry 16 |
| Auth error messages | Broken, shows `<DefaultError />` | `06` row 13 |
| File upload | Out of scope for now | `04` entry 16 |
