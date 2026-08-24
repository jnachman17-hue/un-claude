"""THE FREEZE (board E-9): hide the spans that must survive, then put them back.

When the rewrite runs, the spans of a customer's document that must come back
character-for-character — a quotation, a heading, a reference entry, and the
citation printed beside a quotation — are swapped for short numeric placeholders like ``[[17]]`` before the
model sees the chunk, and swapped back afterwards. **The model never sees the
protected words, so it cannot change them.** That is the whole idea: masking
is deterministic where a prompt instruction is best effort, and W10 measured
48 gateway runs proving the instruction alternative does nothing at all.

THE TWO RULES THAT KILLED THE LAST DESIGN, obeyed here by construction:

  1. **Detection is `uc_spans.detect_protected_spans` and nothing else.** This
     module decides what to do with detected spans; it never detects. The
     previous design's own "Sources" latch froze 56.1% of an ordinary essay
     12 runs out of 12, and it can only come back if a second detector is
     written. It is not.
  2. **Every guard compares customer text to customer text.** The restore runs
     in `uc_chunk.one()` BEFORE the length, leak and fact guards, so each
     guard sees (original unmasked chunk, unmasked output). The previous
     designs ran the guards on the masked pair and refunded a customer whose
     rewrite was perfect — the W8 mistake exactly.

WHAT FREEZES (Jon's rulings D1 and D2, settled 23 August 2026 — implement,
do not reopen):

  * **structure tier** — headings. Even the best model in the bake-off
    renames about 1 in 6.
  * **quote tier** — EVERY quotation, inline and block, plus reference
    entries and the citation printed beside a quotation. Jon's ruling, 24
    August 2026: "any quotation is frozen and kept across the board. There's
    no delineation between novel dialogue and real quotation." Two sessions
    tried to draw that line from syntax and both failed on ordinary text,
    because «"Power tends to corrupt," Acton observed» and «"Mind the second
    stair," Aldous observed» are the same sentence to a program. Measured
    cost of dropping the distinction: under two points of extra frozen text
    on every academic document in the corpus. It is large only for
    dialogue-heavy fiction, which D4's pre-flight discloses before payment.

WHEN THE FREEZE FAILS (Jon's ruling D3): a chunk whose restore cannot be
verified falls back to that chunk's ORIGINAL text — the customer gets their
own words, never a corrupted mask. One chunk failing is handed back and
explained, no refund. When the failing share passes REFUND_SHARE of the
document's words, the whole job fails, which refunds. The threshold exists so
that tripping the freeze on purpose cannot earn both the work and the money
back.

MASK TOKENS CANNOT COLLIDE WITH THE CUSTOMER'S FIGURES. Each chunk's mask
numbers are chosen by asking the engine's own number reader (`_numbers`, the
same one the fact guard trusts) what values the chunk already contains — in
digits OR in words — and additionally refusing any number whose digits appear
anywhere in the chunk as a substring. A consequence this module relies on:
because a mask id never occurs in the customer's chunk, any occurrence of the
bare id in the restored output is mask residue, never customer text.
"""

from __future__ import annotations

import os
import re

from uc_spans import detect_protected_spans
from uc_wordcount import count_words

# ---------------------------------------------------------------------------
# Policy switches
# ---------------------------------------------------------------------------

#: The span kinds each tier freezes. D1: both tiers ship.
TIERS: dict[str, tuple[str, ...]] = {
    "structure": ("heading",),
    "quotes": ("quote", "block_quote", "reference"),
}

#: D3's refund threshold: when MORE than this share of the document's words
#: come back unrewritten because restores failed, the job fails (which
#: refunds). At or below it, the failing chunks are handed back unrewritten,
#: explained, and NOT refunded — the customer received the bulk of the work
#: plus the two provable layers. One third, because below it the customer
#: demonstrably got most of a rewrite, and because a customer who trips the
#: freeze on purpose must sacrifice over a third of their own document to
#: reach a refund — the least attractive free good on offer. Recorded in
#: docs/04-decision-log.md (changes entry 22).
REFUND_SHARE = float(os.environ.get("UC_FREEZE_REFUND_SHARE", str(1 / 3)))


def freeze_enabled() -> bool:
    """Master switch, read at call time so tests and ops can flip it."""
    return os.environ.get("UC_LAYER_B_FREEZE", "1").strip().lower() not in (
        "0", "false", "no", "off")


def enabled_tiers() -> tuple[str, ...]:
    """Which tiers run. Default: both, per D1. Env: UC_FREEZE_TIERS."""
    raw = os.environ.get("UC_FREEZE_TIERS", "structure,quotes")
    return tuple(t.strip() for t in raw.split(",") if t.strip() in TIERS)


class FreezeRestoreFailed(RuntimeError):
    """Too much of the document came back unrestorable. Fails the job (D3)."""


# ---------------------------------------------------------------------------
# The plan: which exact character ranges freeze
# ---------------------------------------------------------------------------


def plan_freeze(text: str, tiers: tuple[str, ...] | None = None) -> list[dict]:
    """The spans of `text` the freeze will protect, with exact offsets.

    Detection is uc_spans's alone (rule 1). This function only selects —
    tiers, D2's attribution test — and resolves each selected span to the
    exact character range that will be masked. Returns dicts of
    {kind, text, start, end}, sorted by start, non-overlapping.
    """
    tiers = enabled_tiers() if tiers is None else tiers
    frozen_kinds = {kind for t in tiers for kind in TIERS[t]}
    picked: list[dict] = []

    for span in detect_protected_spans(text):
        kind = span["kind"]
        if kind not in frozen_kinds:
            continue
        # EVERY quotation freezes. There is no attribution test any more
        # (Jon, 24 August 2026) — see the long note in uc_spans for why two
        # attempts at one failed. A quotation is frozen because it is a
        # quotation, whoever said it.
        if kind == "quote":
            # The detector now hands back the WHOLE frozen run with explicit
            # offsets — the quotation marks (E-9: a model that drops them must
            # not cost the customer theirs) and any citation printed beside it
            # (Jon, 24 August 2026). This used to rebuild the marks here by
            # adding 2 to the inner length, which cannot express a citation
            # and put a second opinion about the span's extent in a file whose
            # first rule is that it holds no detector of its own.
            start, end = span["start"], span["end"]
            exact = text[start:end]
            if exact != span["text"]:
                continue                       # defensive: detector drift
        else:
            try:
                start = text.index(span["text"], span["start"])
            except ValueError:
                continue                       # defensive: detector drift
            exact = span["text"]
        picked.append({
            "kind": kind, "text": exact,
            "start": start, "end": start + len(exact),
        })

    # Non-overlapping, outermost first: a quote inside a frozen block quote
    # is already protected by the outer mask, and nested masks would corrupt
    # the restore.
    picked.sort(key=lambda s: (s["start"], -(s["end"] - s["start"])))
    flat: list[dict] = []
    for span in picked:
        if flat and span["start"] < flat[-1]["end"]:
            continue
        flat.append(span)
    return flat


def freeze_fraction(text: str, tiers: tuple[str, ...] | None = None) -> dict:
    """The D4 pre-flight number: how much of this document would freeze.

    Same plan the rewrite itself uses — one implementation, so the number the
    visitor is shown is the number the freeze delivers. Word-based, counted
    with the engine's script-aware counter.
    """
    spans = plan_freeze(text, tiers)
    total = count_words(text)
    frozen = sum(count_words(s["text"]) for s in spans)
    by_kind: dict[str, int] = {}
    for s in spans:
        by_kind[s["kind"]] = by_kind.get(s["kind"], 0) + 1
    return {
        "fraction": round(min(1.0, frozen / total), 4) if total else 0.0,
        "frozen_words": frozen,
        "words": total,
        "spans": by_kind,
    }


# ---------------------------------------------------------------------------
# Masking one chunk
# ---------------------------------------------------------------------------


def choose_mask_ids(chunk: str, n: int, taken: set[str]) -> list[int]:
    """`n` mask numbers that collide with nothing in `chunk`.

    `taken` is the chunk's own numeric values as the engine's `_numbers`
    reader sees them — so a chunk saying "thirty" rules out 30 — and the
    substring test rules out any candidate whose digits appear anywhere in
    the chunk ("2019" rules out 19, 20, 201 and 2019). Chosen small and
    counting up, skipping collisions, so the placeholders look like nothing
    worth rewriting.
    """
    ids: list[int] = []
    candidate = 11
    while len(ids) < n:
        s = str(candidate)
        if s not in taken and s not in chunk:
            ids.append(candidate)
        candidate += 1
        if candidate > 100000:                 # cannot happen; hard stop
            raise FreezeRestoreFailed("no collision-free mask ids")
    return ids


def mask_chunk(chunk: str, spans: list[dict], ids: list[int]) -> tuple[str, list[dict]]:
    """Replace each span of `chunk` with ``[[id]]``. Spans use chunk-local
    offsets and must be sorted and non-overlapping (plan_freeze's contract).

    Returns (masked_text, mask_map) where mask_map rows are
    {id, kind, text} in document order.
    """
    if len(ids) < len(spans):
        raise ValueError("fewer mask ids than spans")
    out: list[str] = []
    mask_map: list[dict] = []
    cursor = 0
    for span, mask_id in zip(spans, ids):
        out.append(chunk[cursor: span["start"]])
        out.append(f"[[{mask_id}]]")
        mask_map.append({"id": mask_id, "kind": span["kind"], "text": span["text"]})
        cursor = span["end"]
    out.append(chunk[cursor:])
    return "".join(out), mask_map


# ---------------------------------------------------------------------------
# The tolerant single-pass restore
# ---------------------------------------------------------------------------

#: What a mask may look like when the model hands it back. Byte-perfect
#: ``[[17]]`` is the common case; also seen: single brackets, parentheses,
#: spaces inside, markdown bold wrapped around, and — the W10 verifier's
#: breaking case — the brackets stripped entirely, leaving a bare number
#: alone on a line. The bare-line form is safe to restore HERE and was not in
#: W10's design, because mask ids are chosen to be absent from the chunk: a
#: line consisting of exactly that number cannot be the customer's text.
_MASK_SHAPE = re.compile(
    r"\*{0,2}[\[\(\{]{1,2}[ \t]*(?P<bracketed>\d{1,6})[ \t]*[\]\)\}]{1,2}\*{0,2}"
    r"|^[^\S\n]*(?P<bare_line>\d{1,6})[^\S\n]*$",
    re.MULTILINE,
)


def restore_chunk(out: str, mask_map: list[dict]) -> tuple[str, list[int]]:
    """Put the real spans back into the model's output. Single pass, tolerant.

    ONE pass over `out`, so restored customer text is never itself scanned
    for masks — a quotation that happens to contain bracketed numbers cannot
    be corrupted. Returns (restored, missing_ids): ids the model dropped so
    thoroughly that no tolerated shape of them survives.
    """
    by_id = {row["id"]: row["text"] for row in mask_map}
    found: set[int] = set()

    def _swap(m: re.Match) -> str:
        token = m.group("bracketed") or m.group("bare_line")
        mask_id = int(token)
        if mask_id not in by_id:
            return m.group(0)                  # a real number; not ours
        found.add(mask_id)
        return by_id[mask_id]

    restored = _MASK_SHAPE.sub(_swap, out)
    missing = [i for i in by_id if i not in found]
    return restored, missing


def verify_restore(chunk: str, restored: str, mask_map: list[dict]) -> list[str]:
    """Every protected span present, character for character — or say why not.

    Returns a list of problems; empty means verified. Two checks:

      * each span's text appears in the restored output at least as many
        times as in the original chunk (presence and count — position is the
        paragraph plumbing's job and the safety net's proof);
      * no residue of any mask id survives anywhere. Because ids are chosen
        absent from the chunk, a bare id in the restored text can only be a
        degraded mask the tolerant restore could not recognise.
    """
    problems: list[str] = []
    for row in mask_map:
        wanted = max(1, chunk.count(row["text"]))
        have = restored.count(row["text"])
        if have < wanted:
            problems.append(
                f"span [[{row['id']}]] ({row['kind']}) missing: "
                f"{have} of {wanted} copies present")
    for row in mask_map:
        if re.search(rf"(?<!\d){row['id']}(?!\d)", restored):
            problems.append(
                f"mask residue: the number {row['id']} survives in the output "
                f"and was never the customer's")
    return problems
