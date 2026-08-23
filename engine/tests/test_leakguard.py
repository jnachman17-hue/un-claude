"""Tests for the Layer B output guard (uc_leakguard).

The guard exists because a customer received a rewrite of the engine's own
prompt instead of their document on 22 August 2026. Its thresholds are measured,
not chosen; the numbers behind them are in docs/session-notes/prompt-leak.md.

THE FALSE-POSITIVE TESTS MATTER MORE THAN THE CATCH TESTS. A guard that fires on
a good rewrite refunds a paying customer for work that succeeded, which is worse
than the defect it prevents.
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT.parent / "apps" / "web" / "engine"
sys.path.insert(0, str(SCRIPTS))

from rewrite_text import build_messages, build_prompt, build_rules  # noqa: E402
from uc_leakguard import check_leak, strip_edge_separator  # noqa: E402

# A real 52-word paste and a real aggressive rewrite of it, from the measured set.
SRC = (
    "The company announced on 3 December that it would open a second facility in "
    "Leeds, creating roughly 400 jobs over the next two years. Managing director "
    "Priya Raman said the decision followed eighteen months of planning and a "
    "$4.2 million commitment from the board. Construction is expected to begin in "
    "early 2028."
)
GOOD = (
    "The firm revealed on 3 December its intention to establish a new Leeds site, "
    "promising around 400 positions within two years. MD Priya Raman stated the "
    "move came after eighteen months of preparations and a $4.2 million pledge "
    "from directors. Groundbreaking is slated to start in early 2028."
)


# --- the roles are actually separated -------------------------------------

def test_customer_text_is_alone_in_the_user_turn():
    msgs = build_messages("unclaude", SRC, lang="French", original_lang="English")
    assert [m["role"] for m in msgs] == ["system", "user"]
    assert msgs[1]["content"] == SRC
    # Not one word of the rules travels with the customer's text.
    assert "RULES" not in msgs[1]["content"]
    assert "eighteen percent" not in msgs[1]["content"]


def test_rules_never_contain_the_customer_text():
    rules = build_rules("unclaude", lang="French", original_lang="English")
    assert "Priya Raman" not in rules
    assert "{TEXT}" not in rules
    assert not rules.endswith("---")


def test_build_prompt_still_produces_the_old_single_message_form():
    p = build_prompt("unclaude", SRC, lang="French", original_lang="English")
    assert p.endswith("\n\n---\n" + SRC)
    assert p.startswith("Rewrite the text")


@pytest.mark.parametrize(
    "strength",
    ["unclaude", "paraphrase", "humanize", "code", "backtranslate", "structural",
     "unclaude_retry:400, 2028"],
)
def test_every_strength_splits_into_two_turns(strength):
    msgs = build_messages(strength, SRC, lang="French", original_lang="English")
    assert msgs[1]["content"] == SRC
    assert msgs[0]["content"].strip()


# --- the guard does not fire on good work ---------------------------------

def test_a_real_aggressive_rewrite_passes():
    assert check_leak(SRC, GOOD) is None


@pytest.mark.parametrize(
    "text",
    [
        # Ordinary prose that happens to contain apologetic or instructional
        # language. An earlier draft of the guard rejected both.
        "I am sorry for what happened that day, she wrote in her letter to him. "
        "The rest of the page was blank, and he never replied to any of it.",
        "Please provide the supporting documents before the deadline on 3 March. "
        "Applications without them are returned unread by the admissions office.",
    ],
)
def test_ordinary_prose_is_not_mistaken_for_commentary(text):
    assert check_leak(text, text.replace("the", "that")) is None


def test_a_short_input_may_grow_a_little():
    # Four words to nine is ordinary on a tiny paste; the slack exists for it.
    assert check_leak("The meeting went well.", "The discussion turned out to be productive.") is None


# --- the guard does fire on the real defect -------------------------------

def test_rejects_a_rewrite_of_our_own_prompt():
    leaked = (
        "Here's a fresh take where the facts remain untouched but the phrasing is "
        "entirely new: every figure and name survives exactly, no run of more than "
        "three consecutive words is reused, and the paragraph layout is kept."
    )
    assert check_leak(SRC, leaked) is not None


def test_rejects_an_invented_document():
    invented = " ".join(["The Arctic sea ice decline has become a pressing concern."] * 12)
    assert "1.5x" not in (check_leak("A short note about my holiday.", invented) or "")
    assert check_leak("A short note about my holiday.", invented) is not None


def test_rejects_the_model_asking_for_the_text():
    assert check_leak(
        "Rewrite this paragraph so it sounds more natural.",
        "Got it! Please paste the text you'd like me to rewrite.",
    ) is not None


def test_rejects_a_verbatim_phrase_from_the_prompt():
    lifted = "Output only the rewritten text, with no preamble or commentary."
    assert check_leak(SRC, lifted + " " + GOOD) is not None


def test_a_phrase_the_customer_themselves_sent_is_not_ours():
    # If they pasted it, handing it back is the product working, not a leak.
    src = "Here's my rewritten draft of the speech. " + SRC
    assert check_leak(src, "Here's my rewritten version of the address. " + GOOD) is None


# --- the stray separator is stripped, not rejected ------------------------

@pytest.mark.parametrize(
    "raw,expected",
    [
        ("---\n\nHello world", "Hello world"),
        ("Hello world\n\n---", "Hello world"),
        ("---\nHello world\n---", "Hello world"),
        ("Hello world", "Hello world"),
        ("Hello --- world", "Hello --- world"),
    ],
)
def test_strip_edge_separator(raw, expected):
    assert strip_edge_separator(raw)[0] == expected


def test_an_internal_horizontal_rule_is_left_alone():
    doc = "First part.\n\n---\n\nSecond part."
    assert strip_edge_separator(doc)[0] == doc
