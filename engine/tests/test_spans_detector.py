"""The protected-span detector, and the Sources latch it must never have.

The latch is the reason the freeze must not ship (board, PART 3): W10's
detector treated any line reading "Sources" as the start of a reference list
and never stopped — a 221-word history essay with a Sources heading over
ordinary prose came back 56.1% frozen, 12 of 12 runs. The tests here hold the
corrected behaviour: a reference entry must LOOK like one, and the section
ends at the first paragraph that does not.
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT.parent / "apps" / "web" / "engine"
sys.path.insert(0, str(SCRIPTS))

from uc_freeze import plan_freeze  # noqa: E402
from uc_spans import check_protected_spans, detect_protected_spans  # noqa: E402

#: Both shipping tiers, which is what the site runs.
TIERS = ("structure", "quotes")


def _kinds(text: str) -> dict[str, int]:
    counts: dict[str, int] = {}
    for span in detect_protected_spans(text):
        counts[span["kind"]] = counts.get(span["kind"], 0) + 1
    return counts


# ---------------------------------------------------------------------------
# The latch
# ---------------------------------------------------------------------------

#: The W10 verifier's breaking case, in shape: a "Sources" heading over
#: ordinary analytical prose. The old design froze 56.1% of it.
LATCH_ESSAY = (
    "The Meiji Restoration of 1868 is often described as a revolution from "
    "above, and the description fits.\n\n"
    "Sources\n\n"
    "The primary evidence for this view comes from the correspondence of the "
    "court officials themselves, who wrote frankly about the need to move "
    "first before rival factions did. Their letters show a leadership acting "
    "out of fear as much as vision.\n\n"
    "A second body of evidence is economic. The land tax reform of 1873 "
    "reveals a government that understood exactly whose support it could "
    "afford to lose."
)


def test_sources_heading_over_prose_yields_zero_references():
    counts = _kinds(LATCH_ESSAY)
    assert counts.get("reference", 0) == 0
    assert counts.get("heading", 0) == 1          # "Sources" itself


def test_real_reference_list_is_detected_and_the_section_ends():
    text = (
        "References\n\n"
        "Smith, J. A., & Jones, R. B. (2019). Later start times and "
        "adolescent attendance. Journal of School Health, 89(4), 331-339.\n\n"
        "Harrison, M. (2020). The sleeping campus. Princeton University "
        "Press.\n\n"
        "This closing paragraph is ordinary prose reflecting on the sources "
        "above, and it must not be treated as an entry."
    )
    spans = detect_protected_spans(text)
    refs = [s for s in spans if s["kind"] == "reference"]
    assert len(refs) == 2
    assert all("prose" not in s["text"] for s in refs)


def test_reference_entry_outside_a_section_is_caught_by_shape():
    text = (
        "The most cited work remains the following.\n\n"
        "Okonkwo, A. (2021). Sleep debt in rural districts. Sleep Research "
        "Quarterly, 12(2), 88-104."
    )
    assert _kinds(text).get("reference", 0) == 1


# ---------------------------------------------------------------------------
# Quotations and D2's attribution cue
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# EVERY quotation is a quotation. Inverted 24 August 2026 on Jon's ruling:
# these six tests all asserted the attributed/unattributed split, which the
# engine no longer makes. Each keeps its original subject — is the quotation
# DETECTED, in this shape — and its attribution assertion becomes the ruling's
# assertion: it freezes.
# ---------------------------------------------------------------------------


def test_a_quotation_with_a_named_source_is_detected_and_freezes():
    text = (
        'Orwell warned that political language is designed "to make lies '
        'sound truthful and murder respectable," and the warning applies '
        "today."
    )
    quotes = [s for s in detect_protected_spans(text) if s["kind"] == "quote"]
    assert len(quotes) == 1
    assert plan_freeze(text, TIERS)


def test_a_quotation_with_no_source_at_all_is_detected_and_freezes():
    # Was `test_unattributed_quote_is_detected_as_unattributed`, asserting
    # this one stayed FREE. A sign on a door is quoted material and the
    # engine no longer asks who is responsible for it.
    text = (
        'The sign on the door read "no entry after dark on weekdays" in '
        "faded letters."
    )
    quotes = [s for s in detect_protected_spans(text) if s["kind"] == "quote"]
    assert len(quotes) == 1
    assert plan_freeze(text, TIERS)


def test_curly_quotes_detected_too():
    # The subject of this test is the curly marks and always was. E-16 had to
    # change its SUBJECT to keep the attribution assertion true; the original
    # sentence is restored here, because there is no longer an attribution
    # assertion to satisfy.
    text = "She noted “the committee will not meet again this year” and left."
    quotes = [s for s in detect_protected_spans(text) if s["kind"] == "quote"]
    assert len(quotes) == 1
    assert plan_freeze(text, TIERS)


def test_narrative_dialogue_tags_freeze_like_everything_else():
    # THE HEADLINE INVERSION. This test asserted the exact opposite until
    # today: said/asked/replied marked a line as invented dialogue and it was
    # deliberately left free. Jon: "any quotation is frozen and kept across
    # the board. There's no delineation between novel dialogue and real
    # quotation."
    for text in (
        '"We can\'t stay here another night," she said, and nobody argued '
        "with her about the weather.",
        '"Where were you when the lights went out?" he asked from the '
        "doorway of the empty barn.",
        '"That was never part of the plan at all," Marcus replied, folding '
        "the map away from the rain.",
    ):
        quotes = [s for s in detect_protected_spans(text) if s["kind"] == "quote"]
        assert len(quotes) == 1
        frozen = [s for s in plan_freeze(text, TIERS) if s["kind"] == "quote"]
        assert len(frozen) == 1, text


def test_a_quotation_with_a_citation_beside_it_is_detected_and_freezes():
    text = (
        'The change "did more for attendance than any intervention we had '
        'previously funded" (Smith, 2019, p. 47).'
    )
    quotes = [s for s in detect_protected_spans(text) if s["kind"] == "quote"]
    assert len(quotes) == 1
    assert plan_freeze(text, TIERS)


def test_every_block_quote_freezes_introduced_or_not():
    # Was `test_block_quote_attribution_follows_the_lead_in`, which required
    # the introducing line to end in a colon. That test was the same species
    # of guess as the one Jon abolished: it decided from the introduction
    # whether indented text was quoted material. Indenting IS the statement.
    introduced = (
        "The report concluded:\n\n"
        "    The market did not fail. The market did exactly what an\n"
        "    unregulated market does.\n\n"
        "Nobody challenged it."
    )
    bare = (
        "The rain kept falling on the ruined field.\n\n"
        "    The market did not fail. The market did exactly what an\n"
        "    unregulated market does.\n\n"
        "Nobody challenged it."
    )
    for text in (introduced, bare):
        bqs = [s for s in detect_protected_spans(text)
               if s["kind"] == "block_quote"]
        assert len(bqs) == 1, text
        frozen = [s for s in plan_freeze(text, TIERS)
                  if s["kind"] == "block_quote"]
        assert len(frozen) == 1, text


# ---------------------------------------------------------------------------
# The other kinds
# ---------------------------------------------------------------------------


def test_headings_tables_urls_and_equations():
    text = (
        "Introduction\n\n"
        "Ordinary prose follows the heading and carries on for a while.\n\n"
        "| Cohort | Invited | Completed |\n| One | 2400 | 311 |\n\n"
        "P(t) = P0 * (1 + r)^t\n\n"
        "See https://example.org/paper and write to author@example.org for "
        "details."
    )
    counts = _kinds(text)
    assert counts.get("heading") == 1
    assert counts.get("table") == 1
    assert counts.get("equation") == 1
    assert counts.get("url") == 1
    assert counts.get("email") == 1


def test_block_quote_and_sic():
    text = (
        "The report said, in full:\n\n"
        "    The market did not fail. The market did exactly what an\n"
        "    unregulated market does.\n\n"
        "Their reccomendation [sic] was drafted before the hearing."
    )
    counts = _kinds(text)
    assert counts.get("block_quote") == 1
    assert counts.get("sic") == 1


def test_ordinary_prose_yields_nothing():
    text = (
        "The committee met twice in March and both meetings ran long. Nobody "
        "resigned, nothing was decided, and the minutes record mostly "
        "disagreement about lunch.\n\n"
        "By April the mood had improved, though not by much."
    )
    assert _kinds(text) == {}


# ---------------------------------------------------------------------------
# The checks: report only, presence-and-count
# ---------------------------------------------------------------------------

ESSAY = (
    "Introduction\n\n"
    'Orwell warned that political language is designed "to make lies sound '
    'truthful and murder respectable," and the warning applies today.\n\n'
    "See https://example.org/orwell for the full essay.\n\n"
    "References\n\n"
    "Orwell, G. (1946). Politics and the English language. Horizon, 13(76), "
    "252-265."
)


def test_identity_output_returns_everything_verbatim():
    report = check_protected_spans(ESSAY, ESSAY)
    assert report["mode"] == "report_only"
    assert report["changed"] == {}
    assert report["spans_found"] == report["returned_verbatim"]
    # Was `report["quotes_attributed"] == 1`. That field is gone: its name
    # claimed a distinction the engine no longer makes, and nothing outside
    # the engine ever read it. The quotation count lives in `spans_found`,
    # which is where every other kind's count already was.
    assert report["spans_found"]["quote"] == 1


def test_a_rewritten_quotation_is_counted_as_changed():
    out = ESSAY.replace(
        "to make lies sound truthful and murder respectable,",
        "to render falsehoods palatable and killing appear honourable,",
    )
    report = check_protected_spans(ESSAY, out)
    assert report["changed"].get("quote") == 1
    assert report["examples_changed"][0]["kind"] == "quote"
    assert "to make lies sound truthful" in report["examples_changed"][0]["before"]


def test_a_renamed_heading_and_invented_url_are_counted():
    out = ESSAY.replace("Introduction", "A New Force in Language").replace(
        "https://example.org/orwell", "https://orwell.example.net/essay"
    )
    report = check_protected_spans(ESSAY, out)
    assert report["changed"].get("heading", 0) >= 1
    assert report["changed"].get("url") == 1


def test_the_checks_never_change_the_text():
    # Report only: the function takes strings and returns counts. This test
    # documents the contract that there is nothing else — no raise, no edit.
    report = check_protected_spans(ESSAY, "completely unrelated output")
    assert set(report["spans_found"]) == set(
        {**report["returned_verbatim"], **report["changed"]}
    )
