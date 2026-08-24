"""The number reader, regression-locked.

This reader has now been repaired FOUR times (see the history in uc_chunk.py).
Every case that ever went wrong is here, so the fifth repair cannot quietly
undo the first four.
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT.parent / "apps" / "web" / "engine"
sys.path.insert(0, str(SCRIPTS))

from uc_chunk import _numbers  # noqa: E402


# The four W10 §4.2 bugs, found by running the reader rather than reading it.
@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("[1,3-5]", {"1", "3", "5"}),          # was {'13', '5'}
        ("[1, 3-5]", {"1", "3", "5"}),         # a cosmetic space changed the answer
        ("p = .015", {"0.015"}),               # was {'15'}
        ("p = 0.015", {"0.015"}),
        ("twelve districts and eleven days", {"12", "11"}),
    ],
)
def test_w10_cases(text, expected):
    assert _numbers(text) == expected


# Real thousands grouping still reads as one number.
@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("30,000 copies", {"30000"}),
        ("1,234,567 people", {"1234567"}),
        ("$1,234.56 exactly", {"1234.56"}),
        ("1,23 is not grouping", {"1", "23"}),  # was read as 123
    ],
)
def test_thousands_grouping(text, expected):
    assert _numbers(text) == expected


# The three historical mistakes in the reader's own docstring, plus the
# engine-limits part 14.2 table rows that are visible in that note.
@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("thirty-four percent", {"34"}),                    # mistake 1
        ("thirty-four", {"34"}),                            # mistake 2: no 30, no 4
        ("thirty thousand manuscripts", {"30000"}),         # mistake 3
        ("two thousand five hundred pounds", {"2500"}),     # the rejected repair broke this
        ("one hundred and twenty seats", {"120"}),
        ("$4.2 million in sales", {"4200000"}),
        ("30 thousand copies", {"30000"}),
        ("nineteen eighty-four", {"19", "84"}),             # NOT 103, and not 1984
        ("a hundred reasons", {"100"}),
        ("two hundred and five", {"205"}),
        ("sixty years and eighty years", {"60", "80"}),
        ("profits rose 42 percent in 2019", {"42", "2019"}),
    ],
)
def test_historical_regressions(text, expected):
    assert _numbers(text) == expected


def test_same_value_two_spellings_compare_equal():
    # The reader compares VALUES, never spellings: 'eighteen percent' for
    # '18 percent' is not a loss.
    assert _numbers("eighteen percent") == _numbers("18 percent")
