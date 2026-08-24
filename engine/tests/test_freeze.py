"""THE FREEZE (board E-9): mask, restore, verify, fall back — no model.

The two tests that matter most are the ones named for the ways this design's
predecessors died:

  * `test_short_story_dialogue_is_never_frozen` — D2. The narrative dialogue
    tags (said, asked, replied) are not attribution, so a short story full of
    invented dialogue is rewritten in full rather than handed back frozen.
  * `test_mask_heavy_chunk_good_rewrite_is_not_refunded` — E-9 rule 2. The
    guards compare customer text to customer text, never the masked pair.
    The numbers in that test are chosen so that BOTH earlier designs would
    have failed the job: the raw model output is short enough to trip the
    length guard against the unmasked original (0.6x < 0.7 floor) and long
    enough to trip the leak guard against the masked input (2.5x > 1.5x + 8).
    Restore-first makes both guards see the truth and the job succeeds.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT.parent / "apps" / "web" / "engine"
sys.path.insert(0, str(SCRIPTS))

from uc_chunk import _numbers, rewrite_long  # noqa: E402
from uc_freeze import (  # noqa: E402
    FreezeRestoreFailed,
    choose_mask_ids,
    freeze_fraction,
    mask_chunk,
    plan_freeze,
    restore_chunk,
    verify_restore,
)
from uc_policy import billing_estimate  # noqa: E402
from uc_spans import detect_protected_spans  # noqa: E402

# ---------------------------------------------------------------------------
# Documents
# ---------------------------------------------------------------------------

ESSAY = (
    "Introduction\n\n"
    'Orwell warned that political language is designed "to make lies sound '
    'truthful and murder respectable," and the warning still applies to the '
    "way modern institutions describe their own failures. The essay that "
    "follows takes his claim seriously and tests it against three cases.\n\n"
    "References\n\n"
    "Orwell, G. (1946). Politics and the English language. Horizon, 13(76), "
    "252-265."
)

STORY = (
    "The barn door had been open since morning and nobody would say why.\n\n"
    '"We can\'t stay here another night," she said, watching the road. '
    '"They know the bridge is out and they know we know it."\n\n'
    '"Then we move at dark," Marcus replied. "You take the dogs around the '
    'long field and I follow with the cart," he added, and that was the '
    "whole of the plan."
)


# ---------------------------------------------------------------------------
# The plan: D1's tiers and D2's attribution test
# ---------------------------------------------------------------------------


def test_plan_freezes_attributed_quote_heading_and_reference():
    spans = plan_freeze(ESSAY, ("structure", "quotes"))
    kinds = sorted(s["kind"] for s in spans)
    assert kinds == ["heading", "heading", "quote", "reference"]
    for s in spans:
        assert ESSAY[s["start"]:s["end"]] == s["text"]
    quote = next(s for s in spans if s["kind"] == "quote")
    # The mask covers the quotation MARKS too, so a model that drops them
    # cannot cost the customer theirs.
    assert quote["text"].startswith('"') and quote["text"].endswith('"')


def test_short_story_dialogue_freezes_like_any_other_quotation():
    # INVERTED 24 August 2026 on Jon's ruling. This was
    # `test_short_story_dialogue_is_never_frozen` and asserted
    # `plan_freeze(STORY, ...) == []` — E-9's D2 demo, and the single test
    # this project leaned on hardest for the claim that invented dialogue
    # stays free.
    #
    # It could never have failed. E-16 measured why: this story tags its
    # dialogue only with said/asked/replied, the three verbs that were
    # already off E-9's cue list, so it passed on its own word choices rather
    # than on the rule. Swapping them for `observed`/`argued`/`concluded`
    # froze 33.6% of an identical story.
    #
    # Jon: "any quotation is frozen and kept across the board." So the demo
    # now asserts the opposite, and asserts it precisely: every line of
    # dialogue in the story, not merely something.
    spans = plan_freeze(STORY, ("structure", "quotes"))
    quotes = [s for s in spans if s["kind"] == "quote"]
    detected = [s for s in detect_protected_spans(STORY) if s["kind"] == "quote"]
    assert len(detected) == 4, detected
    assert len(quotes) == 4, quotes
    # Every quotation the detector found is inside a frozen span. Not "some".
    frozen_text = " ".join(q["text"] for q in quotes)
    for q in detected:
        assert q["quotation"] in frozen_text, q


def test_structure_tier_alone_freezes_only_headings():
    spans = plan_freeze(ESSAY, ("structure",))
    assert sorted(s["kind"] for s in spans) == ["heading", "heading"]


def test_sources_heading_over_prose_freezes_nothing_but_the_heading():
    # The W10 verifier's breaking case must stay dead: 56.1% of this essay
    # was frozen by the old design, 12 runs of 12.
    from test_spans_detector import LATCH_ESSAY

    spans = plan_freeze(LATCH_ESSAY, ("structure", "quotes"))
    assert [s["kind"] for s in spans] == ["heading"]


def test_nested_spans_do_not_double_freeze():
    text = (
        "As the commission wrote:\n\n"
        '    The chairman called the figures "an invention of the press '
        'office" and the record supports him.\n\n'
        "That settled it."
    )
    spans = plan_freeze(text, ("structure", "quotes"))
    block = [s for s in spans if s["kind"] == "block_quote"]
    assert len(block) == 1
    inner = [s for s in spans if s["kind"] == "quote"]
    assert inner == []                     # contained in the frozen block


def test_freeze_fraction_matches_the_plan():
    report = freeze_fraction(ESSAY, ("structure", "quotes"))
    assert report["spans"] == {"heading": 2, "quote": 1, "reference": 1}
    assert 0.0 < report["fraction"] < 1.0
    assert report["frozen_words"] < report["words"]


# ---------------------------------------------------------------------------
# Mask ids: chosen by the engine's own number reader, collision-free
# ---------------------------------------------------------------------------


def test_mask_ids_avoid_digits_present_in_the_chunk():
    chunk = "The 11 delegates met in 2012 and 13 more joined."
    ids = choose_mask_ids(chunk, 3, _numbers(chunk))
    for i in ids:
        assert str(i) not in chunk
        assert str(i) not in _numbers(chunk)
    assert 11 not in ids and 12 not in ids and 13 not in ids
    assert 20 not in ids                   # "2012" contains "20"


def test_mask_ids_avoid_values_written_as_words():
    chunk = "Thirty delegates and forty-two observers attended."
    taken = _numbers(chunk)
    assert "30" in taken and "42" in taken
    ids = choose_mask_ids(chunk, 5, taken)
    assert 30 not in ids and 42 not in ids


# ---------------------------------------------------------------------------
# Mask and the tolerant single-pass restore
# ---------------------------------------------------------------------------


def _mask(text: str):
    spans = plan_freeze(text, ("structure", "quotes"))
    ids = choose_mask_ids(text, len(spans), _numbers(text))
    return mask_chunk(text, spans, ids)


def test_mask_round_trip_is_byte_identical():
    masked, mask_map = _mask(ESSAY)
    for row in mask_map:
        assert row["text"] not in masked
        assert f"[[{row['id']}]]" in masked
    restored, missing = restore_chunk(masked, mask_map)
    assert restored == ESSAY
    assert missing == []


@pytest.mark.parametrize("shape", [
    "[[{i}]]", "[{i}]", "(({i}))", "[[ {i} ]]", "**[[{i}]]**", "{{{{{i}}}}}",
])
def test_restore_tolerates_degraded_bracket_shapes(shape):
    masked, mask_map = _mask(ESSAY)
    mask_id = mask_map[0]["id"]
    degraded = masked.replace(f"[[{mask_id}]]", shape.format(i=mask_id), 1)
    restored, _ = restore_chunk(degraded, mask_map)
    assert mask_map[0]["text"] in restored
    assert verify_restore(ESSAY, restored, mask_map) == []


def test_restore_tolerates_a_bare_number_alone_on_a_line():
    # The W10 verifier's second breaking case: the model stripped the
    # brackets off a heading mask and the old restore was unable to touch a
    # bare number, so five bare numbers reached the customer. Because mask
    # ids are chosen to be ABSENT from the chunk, a line that is exactly the
    # id cannot be customer text, and restoring it is safe.
    masked, mask_map = _mask(ESSAY)
    heading = next(r for r in mask_map if r["kind"] == "heading")
    degraded = masked.replace(f"[[{heading['id']}]]", str(heading["id"]), 1)
    restored, _ = restore_chunk(degraded, mask_map)
    assert heading["text"] in restored
    assert verify_restore(ESSAY, restored, mask_map) == []


def test_restore_is_single_pass_and_never_rescans_restored_text():
    # A restored span whose own text looks like another mask must not be
    # expanded again. Constructed directly: customer text containing [[12]].
    mask_map = [
        {"id": 11, "kind": "quote", "text": 'the file "[[12]] rev B" as sent'},
        {"id": 12, "kind": "heading", "text": "Appendix"},
    ]
    out = "Start [[11]] middle [[12]] end."
    restored, missing = restore_chunk(out, mask_map)
    assert restored == 'Start the file "[[12]] rev B" as sent middle Appendix end.'
    assert missing == []


def test_restore_leaves_real_bracketed_numbers_alone():
    mask_map = [{"id": 17, "kind": "heading", "text": "Method"}]
    out = "As shown in [3] and [12], the result holds.\n\n[[17]]\n\nDone."
    restored, _ = restore_chunk(out, mask_map)
    assert "[3]" in restored and "[12]" in restored
    assert "Method" in restored


def test_verify_catches_a_dropped_span_and_residue():
    masked, mask_map = _mask(ESSAY)
    gone = masked.replace(f"[[{mask_map[0]['id']}]]", "")
    restored, missing = restore_chunk(gone, mask_map)
    assert missing == [mask_map[0]["id"]]
    problems = verify_restore(ESSAY, restored, mask_map)
    assert any("missing" in p for p in problems)
    # Residue: a degraded token the tolerant restore cannot recognise.
    residue = masked.replace(
        f"[[{mask_map[0]['id']}]]", f"placeholder {mask_map[0]['id']} kept")
    restored2, _ = restore_chunk(residue, mask_map)
    assert any("residue" in p for p in
               verify_restore(ESSAY, restored2, mask_map))


# ---------------------------------------------------------------------------
# rewrite_long integration — no model anywhere
# ---------------------------------------------------------------------------


def _identity(chunk, attempt=0, missing=None, usage_out=None):
    return chunk, {"mode": "test"}


def test_the_model_never_sees_the_protected_words(monkeypatch):
    monkeypatch.delenv("UC_LAYER_B_FREEZE", raising=False)
    seen: list[str] = []

    def spy(chunk, attempt=0, missing=None, usage_out=None):
        seen.append(chunk)
        return chunk, {}

    out, info = rewrite_long(ESSAY, spy)
    assert out == ESSAY                    # identity + restore = byte identity
    sent = "\n".join(seen)
    assert "to make lies sound truthful" not in sent
    assert "Politics and the English language" not in sent
    assert "[[" in sent
    freeze = info["freeze"]
    assert freeze["enabled"] is True
    assert freeze["spans_frozen"] == {"heading": 2, "quote": 1, "reference": 1}
    assert freeze["chunks_fallback"] == []


def test_a_rewriting_model_cannot_change_a_frozen_span(monkeypatch):
    monkeypatch.delenv("UC_LAYER_B_FREEZE", raising=False)

    def rewriter(chunk, attempt=0, missing=None, usage_out=None):
        # Rewrites every word it can see; keeps mask tokens and figures.
        words = chunk.split(" ")
        return " ".join(
            w if re.search(r"\d|\[\[", w) else w.upper() for w in words
        ), {}

    out, info = rewrite_long(ESSAY, rewriter)
    assert 'to make lies sound truthful and murder respectable,' in out
    assert "Orwell, G. (1946). Politics and the English language." in out[
        out.index("References"):]
    assert info["freeze"]["chunks_fallback"] == []
    assert out != ESSAY                    # the rest genuinely changed


def test_freeze_off_by_env_sends_the_original_text(monkeypatch):
    monkeypatch.setenv("UC_LAYER_B_FREEZE", "0")
    seen: list[str] = []

    def spy(chunk, attempt=0, missing=None, usage_out=None):
        seen.append(chunk)
        return chunk, {}

    out, info = rewrite_long(ESSAY, spy)
    assert out == ESSAY
    assert "[[" not in "\n".join(seen)
    assert info["freeze"] == {"enabled": False}


def test_structure_tier_env_masks_headings_only(monkeypatch):
    monkeypatch.delenv("UC_LAYER_B_FREEZE", raising=False)
    monkeypatch.setenv("UC_FREEZE_TIERS", "structure")
    seen: list[str] = []

    def spy(chunk, attempt=0, missing=None, usage_out=None):
        seen.append(chunk)
        return chunk, {}

    out, info = rewrite_long(ESSAY, spy)
    assert out == ESSAY
    sent = "\n".join(seen)
    assert "to make lies sound truthful" in sent      # quote left free
    assert "Introduction" not in sent                 # heading masked
    assert info["freeze"]["spans_frozen"] == {"heading": 2}


# ---------------------------------------------------------------------------
# D3: the per-chunk fallback and the refund threshold
# ---------------------------------------------------------------------------


def _mask_dropper(chunk, attempt=0, missing=None, usage_out=None):
    """A model that deletes every placeholder it is given."""
    return re.sub(r"\[\[\d+\]\]\n?", "", chunk), {}


def test_one_failing_chunk_falls_back_alone_and_is_explained(monkeypatch):
    monkeypatch.delenv("UC_LAYER_B_FREEZE", raising=False)
    # Four ~350-word chunks; only the last carries a frozen span, so its
    # fallback is ~25% of the document — under the one-third threshold.
    filler = [" ".join(f"word{i}x{j}" for i in range(350)) for j in range(3)]
    quoted = (
        "The historian wrote that the settlement was "
        '"an accident of weather and paperwork rather than of policy" '
        "and the archive bears him out across every season on record."
    )
    doc = "\n\n".join([*filler, quoted])

    out, info = rewrite_long(doc, _mask_dropper)
    freeze = info["freeze"]
    assert len(freeze["chunks_fallback"]) == 1
    assert freeze["chunks_fallback"][0]["chunk"] == 4
    assert 0 < freeze["fallback_share"] < freeze["refund_threshold_share"]
    assert "note" in freeze
    # The failing chunk came back as the customer's own original text.
    assert quoted in out
    # The freeze retry is bounded at one: 2 attempts, not 8.
    assert info["usage"]["retries"] == 1


def test_past_the_threshold_the_job_fails_which_refunds(monkeypatch):
    monkeypatch.delenv("UC_LAYER_B_FREEZE", raising=False)
    # One chunk, one frozen span, restore impossible: 100% of the document
    # falls back, far past one third — refund per D3.
    doc = (
        "The historian wrote that the settlement was "
        '"an accident of weather and paperwork rather than of policy" '
        "and the archive bears him out across every season on record."
    )
    with pytest.raises(FreezeRestoreFailed):
        rewrite_long(doc, _mask_dropper)


# ---------------------------------------------------------------------------
# E-9 RULE 2: guards compare customer text to customer text
# ---------------------------------------------------------------------------


def test_mask_heavy_chunk_good_rewrite_is_not_refunded(monkeypatch):
    monkeypatch.delenv("UC_LAYER_B_FREEZE", raising=False)
    # 50 words, 40 of them one attributed quotation. Masked input: ~11 words.
    prose = "He weighed the evidence for a long moment before conceding that"
    quote = (
        '"the committee acted without malice and without competence in equal '
        "measure, spending eleven months and the whole reserve on a bridge "
        'survey that the county had already completed twice before the war"'
    )
    doc = f"{prose} the historian wrote {quote} in his final report."
    words_in_doc = len(doc.split())
    assert 45 <= words_in_doc <= 60

    def plausible(chunk, attempt=0, missing=None, usage_out=None):
        # ~30 words around the mask token — a perfectly good rewrite of the
        # ~11-word masked input. Against the MASKED pair this is a 2.5x
        # expansion (leak guard fires at 1.5x + 8); against the raw unmasked
        # original it is 0.6x (length guard floor is 0.7). Both earlier
        # designs therefore killed this exact shape and refunded a customer
        # whose rewrite was perfect. Restore-first passes it.
        token = re.search(r"\[\[\d+\]\]", chunk)
        assert token, "the fake model expected a masked chunk"
        return (
            "After sitting with the papers far longer than he liked, the "
            "historian finally allowed the point and set down "
            f"{token.group(0)} in the closing pages of the report he "
            "signed."
        ), {}

    out, info = rewrite_long(doc, plausible)
    freeze = info["freeze"]
    assert freeze["chunks_fallback"] == []
    assert quote in out                       # the span, marks and all
    assert info["usage"]["retries"] == 0      # no guard fired, first try
    assert info["figures_to_check"] == []     # and no mask number flagged


def test_facts_guard_never_sees_a_mask_number(monkeypatch):
    monkeypatch.delenv("UC_LAYER_B_FREEZE", raising=False)
    captured: list[str] = []

    def rewriter(chunk, attempt=0, missing=None, usage_out=None):
        captured.append(chunk)
        return chunk.replace("weighed", "considered"), {}

    doc = (
        "The panel weighed the 240 submissions over 18 days before "
        "the chair concluded that "
        '"the 240 objections rested on a single clerical error from 1987" '
        "and closed the file."
    )
    out, info = rewrite_long(doc, rewriter)
    mask_ids = re.findall(r"\[\[(\d+)\]\]", "\n".join(captured))
    assert mask_ids, "the quote should have been masked"
    assert info["figures_to_check"] == []
    for mask_id in mask_ids:
        assert mask_id not in info["figures_to_check"]
    assert '"the 240 objections rested on a single clerical error from 1987"' in out


# ---------------------------------------------------------------------------
# D4: the pre-flight number rides in the billing estimate
# ---------------------------------------------------------------------------


def test_billing_estimate_carries_the_freeze_fraction(monkeypatch):
    monkeypatch.delenv("UC_LAYER_B_FREEZE", raising=False)
    monkeypatch.delenv("UC_FREEZE_TIERS", raising=False)
    est = billing_estimate("text", ESSAY.encode())
    assert est["freeze"] == freeze_fraction(ESSAY)
    assert est["freeze"]["fraction"] > 0


def test_billing_estimate_freeze_absent_when_disabled(monkeypatch):
    monkeypatch.setenv("UC_LAYER_B_FREEZE", "0")
    est = billing_estimate("text", ESSAY.encode())
    assert "freeze" not in est


def test_billing_estimate_flat_kinds_have_no_freeze():
    est = billing_estimate("image", b"\x89PNG\r\n\x1a\n....")
    assert "freeze" not in est


def test_freeze_retry_names_the_dropped_placeholders(monkeypatch):
    # Live measurement found the dominant failure: consecutive heading masks
    # opening a chunk get deleted as noise, and a BLIND retry fails the same
    # way about 1 time in 3. The fix rides the fact guard's own channel: the
    # dropped tokens arrive in the retry's `missing` argument, so the retry
    # prompt names them. This fake drops every mask until the retry names
    # them — the shape of a model that obeys the naming.
    monkeypatch.delenv("UC_LAYER_B_FREEZE", raising=False)
    seen_missing: list[list[str]] = []

    def obeys_when_told(chunk, attempt=0, missing=None, usage_out=None):
        seen_missing.append(list(missing or []))
        if not missing:
            return re.sub(r"\[\[\d+\]\]\n?", "", chunk), {}
        return chunk, {}

    doc = (
        "The historian wrote that the settlement was "
        '"an accident of weather and paperwork rather than of policy" '
        "and the archive bears him out across every season on record."
    )
    out, info = rewrite_long(doc, obeys_when_told)
    assert info["freeze"]["chunks_fallback"] == []
    assert '"an accident of weather and paperwork rather than of policy"' in out
    assert len(seen_missing) == 2                 # one blind call, one retry
    assert seen_missing[0] == []
    assert len(seen_missing[1]) == 1              # the dropped mask, by name
    assert re.fullmatch(r"\[\[\d+\]\]", seen_missing[1][0])


HEADED_DOC = (
    "The Rise of the Canal Towns\n\n"
    "Overview\n\n"
    "The towns that grew along the northern canals did so for reasons that "
    "had little to do with the water itself and everything to do with the "
    "warehouses beside it, where goods waited out the winter closures.\n\n"
    "The Decline\n\n"
    "When the railways arrived the warehouses emptied within a decade, and "
    "the towns that survived were the ones that had built anything else at "
    "all worth keeping."
)


def test_a_deleted_heading_placeholder_is_reinserted_not_failed(monkeypatch):
    # THE DOMINANT LIVE FAILURE (E-9 campaigns): the model deletes a lone
    # placeholder paragraph — a masked heading — and returns everything else
    # faithfully. A lone placeholder's position is known exactly, so the
    # paragraph is put back deterministically, with no model call, before
    # this counts as a failure at all. Before this repair, one deleted
    # two-word heading cost the whole chunk — and on a short document the
    # whole job, refunded.
    monkeypatch.delenv("UC_LAYER_B_FREEZE", raising=False)
    calls: list[str] = []

    def deletes_heading_masks(chunk, attempt=0, missing=None, usage_out=None):
        calls.append(chunk)
        return re.sub(r"\[\[\d+\]\]\n*", "", chunk).strip(), {}

    out, info = rewrite_long(HEADED_DOC, deletes_heading_masks)
    assert len(calls) == 1                        # no retry was even needed
    assert info["freeze"]["chunks_fallback"] == []
    assert info["usage"]["masks_reinserted"] == 3
    # Every heading back, in its right place, with the layout restored.
    assert out.startswith("The Rise of the Canal Towns\n\n")
    assert "\n\nOverview\n\n" in out
    assert "\n\nThe Decline\n\n" in out
    assert info["structure_kept"] is True


def test_a_block_quote_that_opens_a_chunk_is_still_frozen(monkeypatch):
    """E-16, and it is a SILENT failure — the worst kind this project has.

    A block quote is recognised by the indentation opening its first line, so
    its span starts at that whitespace, and `_PARA_BREAK` puts that whitespace
    into the separator BEFORE the paragraph. When a block quote opens a chunk
    that separator is the gap BETWEEN chunks, so the chunk begins four
    characters after the span does and the containment test missed it by
    exactly four. The span was then never masked, therefore never verified,
    therefore never reported: the model rewrote a block quote that the D4
    pre-flight had already counted as frozen and the customer had already paid
    to keep. No error, no fallback, no retry — the run reports success.

    Measured on a 9,946-word essay before the fix: 4 of 18 block quotes
    rewritten, identically in all three runs. E-9 could not have caught it —
    its documents are two chunks and no block quote ever opened one, which is
    exactly the "past ~520 words is unmeasured" gap E-9 closed with.
    """
    monkeypatch.delenv("UC_LAYER_B_FREEZE", raising=False)
    monkeypatch.setattr("uc_chunk.TARGET_WORDS", 60)

    quote = (
        "    No member present could say who had ordered the second survey,\n"
        "    who had signed for the deposit, or where the first survey was\n"
        "    filed. The clerk's ledger shows the sum leaving and nothing back."
    )
    filler = (
        "The committee met on a Tuesday and the minutes record nothing of what "
        "was said before the vote was taken, which several members later said "
        "was the whole difficulty with the way the thing had been arranged "
        "from the beginning of the year onwards."
    )
    # The colon lead-in is what makes the block quote ATTRIBUTED, and so
    # eligible to freeze at all (D2). Enough filler in front to push the
    # quote onto a chunk boundary, and the lead-in ends the chunk before it.
    lead_in = "The minutes recorded, in full:"
    doc = "\n\n".join([filler] * 3 + [lead_in, quote] + [filler] * 2)
    assert quote in doc
    assert any(sp["kind"] == "block_quote"
               for sp in plan_freeze(doc, ("structure", "quotes"))), (
        "fixture broken: the block quote is not attributed, so nothing here "
        "would freeze even with the bug present"
    )

    def rewrites_everything_it_is_shown(chunk, attempt=0, missing=None,
                                        usage_out=None):
        # A model that rewrites every word it sees. Anything that survives
        # survived because it was MASKED, which is the whole point.
        return re.sub(r"[A-Za-z]{4,}", "WORD", chunk), {}

    out, info = rewrite_long(doc, rewrites_everything_it_is_shown)

    # The block quote came back untouched because it was masked, even though
    # it opens a chunk.
    assert quote in out, (
        "the block quote was rewritten: it opened a chunk, so its indentation "
        "fell in the separator and the freeze never masked it"
    )


def test_reinsertion_keeps_the_indentation_of_a_neighbouring_block_quote(
        monkeypatch):
    # E-16, found while measuring the document ladder, and it is the reason
    # deepseek and mistral-medium failed an ordinary 463-word essay outright
    # while mistral-small delivered it.
    #
    # The repair rebuilt the chunk with a bare "\n\n" between paragraphs.
    # _PARA_BREAK's trailing [^\S\n]* swallows the horizontal whitespace that
    # OPENS the next paragraph, and for an indented block quote that
    # whitespace is part of the frozen span's own text. So the repair put the
    # heading back and silently un-indented the block quote beside it, the
    # verifier correctly reported the block quote missing, and a chunk that
    # was fully recoverable failed instead — on a two-chunk document, past
    # D3's one-third threshold, refunding the whole job.
    monkeypatch.delenv("UC_LAYER_B_FREEZE", raising=False)
    doc = (
        "Fairmont: School start times\n\n"
        "Fairmont changed its school start times in September 2016 and the "
        "effect on attendance was larger than anything the authority had "
        "funded in the preceding decade.\n\n"
        "The minority report recorded:\n\n"
        "    We do not dispute the attendance figure. We dispute\n"
        "    that it was purchased at the price stated, and no\n"
        "    business case here has carried that number forward.\n\n"
        "Nobody resigned over it, which told the district everything it "
        "needed to know about how the next one would go."
    )
    block_quote = (
        "    We do not dispute the attendance figure. We dispute\n"
        "    that it was purchased at the price stated, and no\n"
        "    business case here has carried that number forward."
    )
    assert block_quote in doc

    def deletes_the_heading_mask(chunk, attempt=0, missing=None,
                                 usage_out=None):
        # The lone heading placeholder goes; everything else comes back.
        return re.sub(r"^\[\[\d+\]\]\n*", "", chunk).strip(), {}

    out, info = rewrite_long(doc, deletes_the_heading_mask)

    assert info["usage"]["masks_reinserted"] == 1
    assert info["freeze"]["chunks_fallback"] == []
    assert out.startswith("Fairmont: School start times\n\n")
    # THE ASSERTION THAT WAS FAILING: the block quote comes back with its
    # indentation, character for character, which is the whole promise.
    assert block_quote in out


def test_reinsertion_stays_out_when_paragraphs_also_merged(monkeypatch):
    # Conservative on purpose: if the model deleted a placeholder AND merged
    # prose paragraphs, the arithmetic no longer proves where anything goes,
    # so the repair declines and the retry/fallback path decides.
    monkeypatch.delenv("UC_LAYER_B_FREEZE", raising=False)

    def deletes_and_merges(chunk, attempt=0, missing=None, usage_out=None):
        out = re.sub(r"\[\[\d+\]\]\n*", "", chunk).strip()
        out = out.replace("closures.\n\n", "closures. ", 1)   # merge two paras
        return out, {}

    # The repair declines, the informed retry fails the same way, the chunk
    # falls back to the customer's own text — and on a one-chunk document
    # that is past the threshold, so the job fails, which refunds (D3).
    with pytest.raises(FreezeRestoreFailed):
        rewrite_long(HEADED_DOC, deletes_and_merges)


def test_reinsertion_never_places_an_inline_mask(monkeypatch):
    # An inline quotation mask that vanishes has no recoverable position —
    # its paragraph was rewritten around it. The repair must decline and the
    # fallback must fire exactly as before.
    monkeypatch.delenv("UC_LAYER_B_FREEZE", raising=False)
    doc = (
        "The historian wrote that the settlement was "
        '"an accident of weather and paperwork rather than of policy" '
        "and the archive bears him out across every season on record."
    )
    with pytest.raises(FreezeRestoreFailed):
        rewrite_long(doc, _mask_dropper)
