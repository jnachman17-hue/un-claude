# Un-Claude

Sanitises AI provenance marks from text and files. Paste text or upload a file, see exactly which marks were found and where, and get a clean copy back.

Live at [un-claude.com](https://un-claude.com), with paying customers.

## What it handles

AI marks live in three different places. Each needs a different method, and only two of them can be proven.

### A. Invisible characters (provable)

Zero width characters, unusual spaces, direction and tag marks hidden between the visible words. Works on text and files.

### Metadata (provable)

C2PA content credentials, EXIF, XMP and generator tags stored inside a file's wrapper. Works on files only.

### B. Statistical watermark (best effort)

Patterns in which words a model chose. Works on text and files. Nobody can verify its removal today.

Paste text and you get A and B. Upload a file and you get all three.

Accepted inputs are pasted text, .docx, .png and .jpg. File type is checked against the actual bytes, not just the extension.

## What it does not claim

The product is built around a claims boundary. These are rules, not caveats.

- Layer A does not touch Anthropic's or Google's text watermark. Those don't use hidden characters. Layer A exists for a real but separate tell: some models emit invisible typography, like narrow no-break spaces, that looks identical to normal text and gets people flagged.
- Layer B is never presented as proven. It is labelled best effort everywhere it appears: in the docs, in the interface, and in the copy.
- Metadata cleaning is verified by reading the raw bytes afterwards, not by asking the tool whether it worked. The image or document comes out byte identical. Only the marks are gone.

## How it works

- Layers A and Metadata are deterministic. Same input, same output, no judgment involved. Every mark found is named and located, so "it worked" is a countable fact.
- Layer B runs a targeted structural rewrite. The statistical signal only survives where runs of consecutive words survive, so the rewrite holds any verbatim run to three words while preserving facts and length, and measures both.
- The tool runs on the landing page with no account needed. Guests get free credits. Accounts are created at checkout so a purchase has somewhere to live. Credits are tracked in a ledger and sold in packs through Stripe, with local pricing in USD, EUR, GBP, AUD and CAD.

Stack: Next.js and TypeScript, Supabase, a Python engine, Stripe, Vercel.

## How it was built

Built by directing AI agents (Claude Code). I set the spec, the rules, and the standard for what counts as done. The agents write the code.

That only works with structure, so the repo carries it:

- [CLAUDE.md](CLAUDE.md) is the working agreement every session loads first: what the product is, an order of authority when instructions conflict, a hard data boundary, and the verification standard.
- The verification standard: an assertion that something works carries no weight. Run it and show the real output. State failures first.
- [The decision log](docs/04-decision-log.md) records every ruling with its reasoning.
- [Assumptions and open questions](docs/06-assumptions-and-open-questions.md) is the live list of what is undecided and what would settle it.
- [The runbook](docs/07-runbook.md) holds operational facts learned the hard way.
- Handoff files let each session start where the last one stopped.

Two examples of what that process catches:

1. The analytics dashboard was reading 1,000 of 1,745 ledger rows, because Supabase caps a page at 1,000 regardless of the requested limit. Every all-time figure was roughly 40% short. Found and fixed.
2. The only guard on file type was the upload picker's hint, which drag and drop walks straight past. The engine was quietly accepting 24 file types nobody chose or tested, which is how a .csv undercharge got in. Replaced with an explicit allowlist checked against the file's bytes.

## Provenance

The core cleaning scripts come from [guillaumemeyer/watermarks-remover](https://github.com/guillaumemeyer/watermarks-remover) (MIT). The exact commit, what was copied, and what was left out are recorded in [PROVENANCE.md](apps/web/engine/PROVENANCE.md). The web app started from the MakerKit Next.js and Supabase starter kit (MIT).

Built on top of that: the Layer B rewrite prompt and chunking layer, the file policy and validation, the claims boundary, and the full product: site, accounts, credits, billing, local pricing, and analytics.

## Where things are

- apps/web: the site and the tool
- apps/web/engine/ENGINE.md: how the engine works, what it can prove, where it stops
- apps/web/engine/API.md: the contract the site builds against
- engine/tests: the engine test suite
- docs: spec, build plan, decision log, assumptions, runbook, handoffs
- CLAUDE.md: the working agreement for every agent session
  
