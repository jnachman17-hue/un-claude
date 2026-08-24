"""uc_wordcount: no script may count as zero.

The production defect (W10 §4.9): every word count was len(text.split()),
which counts spaces — a 101-character Japanese paragraph counted as 1 word,
fell under every floor, and was silently refused the rewrite.
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT.parent / "apps" / "web" / "engine"
sys.path.insert(0, str(SCRIPTS))

from uc_wordcount import count_words  # noqa: E402


def test_english_counts_exactly_as_before():
    text = "The quick brown fox jumps over the lazy dog"
    assert count_words(text) == len(text.split()) == 9


def test_chinese_counts_characters_not_spaces():
    text = "这是一段中文文本"          # 8 ideographs, 0 spaces
    assert len(text.split()) == 1     # the old rule
    assert count_words(text) == 8


def test_japanese_kana_and_kanji_count():
    text = "これは日本語の文章です"    # 11 chars of kana + kanji
    assert len(text.split()) == 1
    assert count_words(text) == 11


def test_thai_counts_about_four_chars_per_word():
    text = "นี่คือย่อหน้าภาษาไทยสำหรับทดสอบ"
    assert len(text.split()) == 1
    assert count_words(text) >= 6     # 31 Thai chars -> ceil(31/4) = 8


def test_mixed_scripts_add_up():
    text = "The word 東京 appears twice in 東京 prose"
    # 8 Latin words + 4 ideographs
    assert count_words(text) == 12 - 2  # '東京' tokens no longer count as words
    assert count_words(text) == len("The word appears twice in prose".split()) + 4


def test_russian_and_arabic_count_by_spaces_as_before():
    # Space-separated scripts are unaffected by the CJK rule.
    assert count_words("Канал имени Москвы соединяет две реки") == 6
    assert count_words("النص العربي يفصل الكلمات بمسافات") == 5


def test_empty_and_whitespace():
    assert count_words("") == 0
    assert count_words("   \n\t ") == 0
