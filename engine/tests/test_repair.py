"""Tests for uc_repair: the rewrite gives back what the model put in.

Every rule is input-conditional, so each one is tested in both directions:
the input never had the mark (repaired) and the input carries the mark
(left exactly alone). Jon's ruling on em dashes — target the input's own
count, not zero — gets its own block.
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT.parent / "apps" / "web" / "engine"
sys.path.insert(0, str(SCRIPTS))

from uc_repair import repair_rewrite  # noqa: E402


# ---------------------------------------------------------------------------
# Markdown the input never had
# ---------------------------------------------------------------------------


def test_bold_removed_when_input_had_none():
    src = "The overview section explains the method."
    out = "**Overview** explains the approach taken."
    fixed, stats = repair_rewrite(src, out)
    assert fixed == "Overview explains the approach taken."
    assert stats["markdown_bold_removed"] == 1


def test_bold_kept_when_input_used_it():
    src = "Call fn(**kwargs) to pass options through, per the **docs**."
    out = "Pass options with fn(**kwargs), as the **docs** describe."
    fixed, stats = repair_rewrite(src, out)
    assert fixed == out
    assert "markdown_bold_removed" not in stats


def test_italic_removed_but_list_markers_and_arithmetic_survive():
    src = "The title matters. Multiply 3 * 4.\n\n* first item\n* second item"
    out = "The *title* matters. Multiply 3 * 4.\n\n* first item\n* second item"
    fixed, stats = repair_rewrite(src, out)
    assert fixed == src
    assert stats["markdown_italic_removed"] == 1


def test_heading_hashes_removed_when_input_had_none():
    src = "Introduction\n\nThe essay begins."
    out = "## Introduction\n\nThe essay begins."
    fixed, stats = repair_rewrite(src, out)
    assert fixed == src
    assert stats["markdown_headings_removed"] == 1


def test_heading_hashes_kept_when_input_used_them():
    src = "# Title\n\nBody."
    out = "# A Heading\n\nThe body."
    fixed, _stats = repair_rewrite(src, out)
    assert fixed == out


def test_hash_number_is_not_a_heading():
    src = "Ranked #5 overall."
    out = "It placed #5 in the ranking."
    fixed, _stats = repair_rewrite(src, out)
    assert fixed == out


# ---------------------------------------------------------------------------
# Apostrophes and quotes match the input
# ---------------------------------------------------------------------------


def test_curly_apostrophe_straightened_to_match_input():
    src = "It's the school's decision."
    out = "It’s the school’s own call."
    fixed, stats = repair_rewrite(src, out)
    assert fixed == "It's the school's own call."
    assert stats["curly_apostrophes_straightened"] == 2


def test_curly_apostrophe_kept_when_input_typed_them():
    src = "It’s the school’s decision."
    out = "It’s the school’s own call."
    fixed, stats = repair_rewrite(src, out)
    assert fixed == out
    assert "curly_apostrophes_straightened" not in stats


def test_curly_double_quotes_straightened_to_match_input():
    src = 'He said "no" twice.'
    out = "He said “no” two times."
    fixed, stats = repair_rewrite(src, out)
    assert fixed == 'He said "no" two times.'
    assert stats["curly_quotes_straightened"] == 2


def test_curly_double_quotes_kept_when_input_typed_them():
    src = "He said “no” twice."
    out = "He said “no” two times."
    fixed, _stats = repair_rewrite(src, out)
    assert fixed == out


def test_apostrophes_and_double_quotes_are_separate_classes():
    # The input types curly doubles but straight apostrophes: only the
    # apostrophes are straightened.
    src = "It's what “the report” says."
    out = "It’s what “the account” says."
    fixed, _stats = repair_rewrite(src, out)
    assert fixed == "It's what “the account” says."


# ---------------------------------------------------------------------------
# Em dashes: the budget is the input's own count, never zero by rule
# ---------------------------------------------------------------------------


def test_em_dashes_converted_when_input_had_none():
    src = "The market did not fail. It did exactly what such a market does."
    out = "The market didn't fail—it performed exactly as such a market would—and its designers knew."
    fixed, stats = repair_rewrite(src, out)
    assert "—" not in fixed
    assert fixed == (
        "The market didn't fail - it performed exactly as such a market would - and its designers knew."
    )
    assert stats["em_dashes_converted"] == 2


def test_em_dashes_kept_up_to_the_inputs_own_count():
    src = "One thought — then another. And one more — the last."
    out = "A thought—then a second—a third—a fourth—and a fifth."
    fixed, stats = repair_rewrite(src, out)
    # Input carried 2, rewrite carried 4: exactly 2 survive.
    assert fixed.count("—") == 2
    assert stats["em_dashes_converted"] == 2


def test_em_dashes_untouched_when_input_used_more():
    src = "First — second — third — done."
    out = "First—then done."
    fixed, stats = repair_rewrite(src, out)
    assert fixed == out
    assert stats["em_dashes_converted"] == 0


def test_line_opening_dash_is_dialogue_and_never_converted():
    src = "Il entra dans la salle.\n\nBonjour, dit-il."
    out = "Il entra.\n\n— Bonjour, dit-il.\n\n— Bonsoir."
    fixed, _stats = repair_rewrite(src, out)
    # Mid-line conversion never touches a dash that opens a line.
    assert fixed.count("\n— ") + fixed.count("— ") >= 2


def test_spaced_mid_line_dash_converts_to_one_spaced_hyphen():
    src = "Plain text with no dash at all."
    out = "Plain text — with a spaced dash."
    fixed, _stats = repair_rewrite(src, out)
    assert fixed == "Plain text - with a spaced dash."


# ---------------------------------------------------------------------------
# Years the model spelled out go back to digits
# ---------------------------------------------------------------------------


def test_year_pair_style_restored():
    src = "Stockjobbers were expelled in 1698 and returned later."
    out = "Stockjobbers were banished in sixteen ninety-eight and came back."
    fixed, stats = repair_rewrite(src, out)
    assert "1698" in fixed
    assert "sixteen ninety-eight" not in fixed
    assert stats["years_restored"] == ["1698"]


def test_year_modern_style_restored():
    src = "The plan concludes in 2028."
    out = "The plan wraps up in twenty twenty-eight."
    fixed, _stats = repair_rewrite(src, out)
    assert "2028" in fixed


def test_year_thousand_style_restored():
    src = "Published in 1984, the novel endures."
    out = "Published in one thousand nine hundred and eighty-four, it endures."
    fixed, _stats = repair_rewrite(src, out)
    assert "1984" in fixed


def test_year_left_alone_when_the_customer_spelled_it_themselves():
    # The input carries BOTH forms; the output keeping the spelled one is the
    # customer's own wording, not a violation.
    src = "In nineteen eighty-four — the year 1984 — it was published."
    out = "It appeared in nineteen eighty-four, the year 1984."
    fixed, _stats = repair_rewrite(src, out)
    assert fixed == out


def test_year_left_alone_when_digits_survived():
    src = "It was 1698."
    out = "The year was 1698."
    fixed, stats = repair_rewrite(src, out)
    assert fixed == out
    assert "years_restored" not in stats


def test_title_years_are_not_touched():
    # "nineteen eighty-four" in the OUTPUT with no 1984 in the input: there is
    # nothing to restore, so nothing changes.
    src = "Orwell's most famous novel is a warning."
    out = "Orwell's nineteen eighty-four reads as a warning."
    fixed, _stats = repair_rewrite(src, out)
    assert fixed == out


# ---------------------------------------------------------------------------
# The pass as a whole
# ---------------------------------------------------------------------------


def test_clean_rewrite_passes_through_unchanged():
    src = "A plain paragraph with a number, 42, and a name, Smith."
    out = "A simple passage carrying the figure 42 and the name Smith."
    fixed, stats = repair_rewrite(src, out)
    assert fixed == out
    assert stats["changed"] is False


def test_the_w10_shape_all_four_defects_in_one_output():
    src = (
        'The committee met in 1698. It said "the plan holds" and that '
        "it's sound.\n\nConclusion\n\nNothing changed."
    )
    out = (
        "The committee convened in sixteen ninety-eight—it stated “the plan "
        "holds” and that it’s **sound**.\n\n## Conclusion\n\nNothing was altered."
    )
    fixed, stats = repair_rewrite(src, out)
    assert "1698" in fixed
    assert "—" not in fixed
    assert "“" not in fixed and "’" not in fixed
    assert "**" not in fixed and "##" not in fixed
    assert stats["changed"] is True
