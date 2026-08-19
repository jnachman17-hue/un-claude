# un-claude: Build Plan

**The reference for what is being built, in what order, and what has to be true
before each session can start.** Written 18 August 2026, session 4.

**Read this before starting any session.** It is the only document that holds the
sequence. `01-build-spec.md` holds what exists, `04-decision-log.md` holds why,
and this holds what is next.

**Editing rule.** This file is edited **only when a session passes its exit
criteria**, and only by the session that passed it. Both tracks read it. Neither
rewrites it in flight. `04` entry 25.

---

## 1. The shape of the whole build

**Nothing goes live until every layer works.** Jon ruled out an incremental
launch: the site is built with the theme, styling and wording of the finished
product from the start, so it can headline what the product actually does rather
than what shipped first.

| Phase | What | State |
|---|---|---|
| **0** | Documentation rescoped to a watermark remover | **Done, session 4** |
| **1a** | **The engine. All three layers, deployed and verified live** | **DONE, 19 August 2026** |
| **1b** | **The site.** Landing page, the tool interface, free tier | **NEXT. Nothing built** |
| **2** | Integration. The site calling the real engine | After 1b |
| **3** | Pricing and unit economics | Its own session. Real cost numbers now exist |
| **4** | Billing. Stripe, credit wallet, metering | Needs phase 3 |
| **5** | Launch | Needs all of the above |

**The two-track experiment is over.** `04` entry 28: Track B was paused because
the tracks collided on decisions rather than on files, and two chats asking one
non-technical person for rulings produced contention rather than parallelism.
**One track from here.**

**Phase 1 is two tracks running simultaneously in two chats.** Track A is the
engine and owns `engine/`. Track B is the site and owns `apps/web/`. The full
ownership split and the rules are `04` entry 25.

---

## 2. The critical path, and why the order is what it is

**The engine is the longest chain and the only part with a genuine unknown in
it.** That unknown is section 5 below: the engine needs system programs that
Vercel does not obviously provide, and PDF is one of the four launch formats.

**So the engine starts first and never waits.** The site can be designed, written
and built without a working engine right up to the point it needs to call one, by
which time the engine exists.

**What changed from the earlier plan, so nobody re-derives it.** An earlier
sequence put layer A first because it shipped fastest and would have put a live
product on the internet within 24 hours. **Jon removed that goal**, so the
sequencing question changed from "what ships first" to "what is most likely to
blow up." That is the engine.

**One implementation of each layer, in the engine, not two.** An earlier plan
floated a second copy of layer A written in the site's language so it could run
inside the visitor's browser. With no incremental launch that buys nothing and
creates two versions that can drift apart. **If a browser side version is ever
wanted as a speed or privacy feature, it comes after launch and is explicitly a
second implementation of a settled thing.**

---

## 3. Session A1: the engine foundation

**Track A. Nothing gates it. It can start immediately.**

**Goal.** Layers A and metadata working on real text and real files, reachable by
the site over HTTP, with usage recorded.

**Version one formats: pasted text, PNG, JPG, Word documents. PDF is deferred**,
`04` entry 26, `06` row 26.

**Blocked as of 18 August 2026 on one thing: Jon installing Python 3.13 on his
laptop.** The laptop is the workshop, not the server. It is needed so work can be
shown running rather than asserted.

| Step | Detail |
|---|---|
| 1 | ~~Decide how the engine is deployed~~. **DONE. `04` entry 27:** Python on Vercel, same place as the site, using the repository. No Docker, no second host |
| 2 | Bring in `guillaumemeyer/watermarks-remover`. **Ruled: used as the engine**, `04` entry 27 |
| 3 | **Prove layer A on real text.** Show the actual characters found, named, counted and located |
| 4 | **Prove metadata on a real DOCX, PNG and JPG.** Show what was in the file before and what is in it after. **PDF is out of version one**, `04` entry 26 |
| 5 | ~~Resolve `qpdf`~~. **Settled by `04` entries 26 and 27.** No PDF, so no `qpdf`, so no separate programs, so the engine runs on Vercel beside the site |
| 6 | Define the HTTP contract the site calls. One shared definition, closed set of error messages, per the practice that survived from `04` entry 15 |
| 7 | **Record usage from the first line:** words in, file size in, tokens for layer B. `04` entry 22 |

**Exit criteria.** A real file goes in and a real file comes out, and Jon has seen
the before and after himself. **Not a description of it.** `CLAUDE.md` section 4.

**This session unblocks:** B2 integration, and A2.

---

## 4. Session A2: layer B

**Track A. Gated on A1 finishing and on a model being chosen.**

**Goal.** Layer B running on a non-Claude model, with a known cost per run.

| Step | Detail |
|---|---|
| 1 | **Choose the model.** Jon's stated criteria: suitability and capability for the task, unit economics, **and not run locally.** That last one rules out the Ollama backend |
| 2 | Wire the `openai-compatible` backend to it. **The default backend calls no model at all**, see section 5 |
| 3 | Measure cost per 1,000 words on real text, not estimated |
| 4 | **Decide what the interface says about a layer B result.** This is a design problem, not a coding one, and it is the hardest honesty question in the product |

**Exit criteria.** Real input, real output, both shown in full, and a real cost
per run.

**Hard constraint, do not lose it.** **Layer B must not run on Claude.** A rewrite
performed by Claude re-applies the watermark at full strength rather than
removing it. The engine repository warns about this in its own documentation and
Anthropic's own material confirms the mechanism.

---

## 5. What Track A already knows before it starts

**Checked directly against the repository and Anthropic's own publications on 18
August 2026. Do not re-derive these and do not assume they are stale without
checking.**

**Layer B ships with no model.** Its default backend is `print-prompt`, which
prints the rewrite prompt and calls nothing. The real options are `ollama`, a
model running locally, and `openai-compatible`, any API speaking that format.
**Jon has ruled out running locally.**

**The core Python needs version 3.10 and no packages at all.** That part would sit
comfortably on Vercel.

**The system programs are the problem, and this is the session's main question.**

| Program | What it does | Status |
|---|---|---|
| `qpdf` | Rebuilds a PDF structurally | **Not optional in practice.** Without it, cleaning is incremental and the original metadata bytes stay recoverable |
| `exiftool` | Strips residual metadata, especially in PDFs | Optional, auto-used if present |
| `c2patool` | Inspects C2PA manifests | Optional, auto-used if present |

**The repository ships a Docker image because of exactly this.** Docker is a way
of packaging a program together with the system programs it needs, so it runs the
same anywhere. **That points at a different hosting shape than the rest of this
project uses**, and choosing it is step 1 of A1. `06` row 25.

**Layer A does nothing against Claude's text watermark.** Anthropic states
directly that no hidden characters are added. Layer A is still worth building
because other AI tools, web pages and export pipelines do insert them. **What it
must never claim is that it removes Claude's mark.**

**On a Claude generated file, the removable mark is C2PA, and the metadata layer
is what removes it.** Not layer A.

**Nobody can verify layer B today.** Anthropic confirmed on 12 August 2026 that a
public detection API is in development, with no ship date, access model or terms.
**Build as if layer B is unverifiable. Treat the detector as upside, not plan.**
`06` row 24.

---

## 6. Session B1: design and copy

**Track B. Gated on a design direction from Jon, and on `06` row 23.**

**Goal.** The landing page at final quality, structure and words, with no engine
needed.

| Step | Detail |
|---|---|
| 1 | **Get `06` row 23 ruled first: what the site claims.** Copy cannot be written before it |
| 2 | Design direction from Jon. References, dark or light |
| 3 | Landing page structure. The tool is the page, `04` entry 20 |
| 4 | Copy at final quality, headlining the finished product |
| 5 | Theme and components, so B2 assembles rather than invents |

**Exit criteria.** Jon looks at it and approves how it looks and reads.

---

## 7. Session B2: the tool frame

**Track B. Gated on B1 approved and A1's HTTP contract defined.**

| Step | Detail |
|---|---|
| 1 | **Delete the humanizer code.** Four files, `01-build-spec.md` section 3 |
| 2 | Paste box and file upload. PDF, DOCX, PNG, JPG only. `04` entry 24 |
| 3 | **Results display. Showing the marks is the product**, not a feature of it |
| 4 | Free caps, and usage recording wired to the engine's numbers |
| 5 | The signed in wrapper. Same tool, credit balance instead of marketing. `04` entry 20 |
| 6 | **Fix the auth error bug.** `06` row 13 |

**Exit criteria.** The tool works against the real engine.

---

## 8. Phases 2 to 5

| Phase | Gate | Content |
|---|---|---|
| **2. Integration** | A1, A2, B1, B2 all done | Wire site to engine end to end. Fold both tracks' notes into `04`, `01` and `06`. Delete the track notes files |
| **3. Pricing** | Real usage data exists | Its own session. Jon's position: words for text, and per file is wrong because files vary. `06` row 18 |
| **4. Billing** | Pricing decided | Stripe, credit wallet, metering. The kit ships none of it, `04` entry 14 |
| **5. Launch** | All of the above | Publishing is Jon's call and his alone. `CLAUDE.md` section 5 |

**Parked, not scheduled:** a how it works page with animations, and a mission page
Jon writes himself. `06` row 22.

---

## 9. The gates, in one table

| Session | Cannot start until |
|---|---|
| **A1** | Nothing. Start now |
| **A2** | A1 exits. Model chosen |
| **B1** | Jon gives a design direction. `06` row 23 ruled |
| **B2** | B1 approved. A1's contract defined |
| **Phase 2** | All four |
| **Phase 3** | Phase 2 producing real usage numbers |
| **Phase 4** | Phase 3 |
| **Phase 5** | Jon says so |
