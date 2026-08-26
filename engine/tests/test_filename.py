"""uc_filename: the tool's name comes off the front, and nothing else moves.

The defect (25 August 2026, found by Jon while using the product): un-claude
stripped the C2PA record out of `ChatGPT Image Aug 25, 2026, 03_14_22 PM.png`
and handed it back under the same name, so the one mark a human reads without
any tools survived the clean. A second fault, entirely ours, prefixed every
returned file with `cleaned-`, announcing that it had been through a watermark
remover.

Every case in section 5.3 of docs/briefs/strip-the-tool-name.md is a test here.
"""

from __future__ import annotations

import base64
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT.parent / "apps" / "web" / "engine"
sys.path.insert(0, str(SCRIPTS))

from uc_filename import TOOL_NAMES, strip_tool_name  # noqa: E402


def name_of(filename: str) -> str:
    return strip_tool_name(filename)["name"]


# ---------------------------------------------------------------------------
# The reported defect, exactly as reported
# ---------------------------------------------------------------------------

def test_jons_file():
    """The ruling in section 2 of the brief, verbatim."""
    assert (
        name_of("ChatGPT Image Aug 25, 2026, 03_14_22 PM.png")
        == "Image Aug 25, 2026, 03_14_22 PM.png"
    )


def test_only_the_tool_name_goes_never_the_rest():
    """`Image`, the date and the time all survive. Jon's ruling, not ours."""
    result = strip_tool_name("ChatGPT Image Aug 25, 2026, 03_14_22 PM.png")
    assert result["tool"] == "ChatGPT"
    assert result["changed"] is True
    assert "Aug 25, 2026, 03_14_22 PM" in result["name"]


# ---------------------------------------------------------------------------
# One rule, every locale. All four of these are real filenames observed on
# Wikimedia Commons; a per-tool date pattern would have needed four regexes.
# ---------------------------------------------------------------------------

def test_every_observed_chatgpt_locale():
    assert name_of("ChatGPT Image Aug 14, 2025, 01_01_35 PM.png") == (
        "Image Aug 14, 2025, 01_01_35 PM.png")
    assert name_of("ChatGPT Image 7 mrt 2026, 11_19_57.png") == (
        "Image 7 mrt 2026, 11_19_57.png")
    assert name_of("ChatGPT Image 8. sep. 2025, 18.32.11.png") == (
        "Image 8. sep. 2025, 18.32.11.png")
    assert name_of("ChatGPT Image Sep 29, 2025 at 09_31_03 AM.png") == (
        "Image Sep 29, 2025 at 09_31_03 AM.png")


def test_gemini_underscores():
    assert name_of("Gemini_Generated_Image_wtrorwtrorwtrorw.png") == (
        "Generated_Image_wtrorwtrorwtrorw.png")


# ---------------------------------------------------------------------------
# 5.3: the name is ONLY the tool name
# ---------------------------------------------------------------------------

def test_bare_tool_name_never_becomes_an_empty_name():
    """Adobe's own forum reports downloads called literally `Firefly.jpg`."""
    result = strip_tool_name("Firefly.jpg")
    assert result["name"] == "image.jpg"
    assert result["changed"] is True


def test_bare_tool_name_never_becomes_a_bare_extension():
    for filename in ("ChatGPT.png", "Gemini.jpeg", "DALL·E.png"):
        out = name_of(filename)
        assert not out.startswith("."), out
        assert Path(out).stem, out


def test_the_fallback_describes_what_the_file_IS():
    assert name_of("ChatGPT.png") == "image.png"
    assert name_of("ChatGPT.jpg") == "image.jpg"
    assert name_of("ChatGPT.docx") == "document.docx"
    assert name_of("ChatGPT.txt") == "text.txt"


def test_the_fallback_is_neutral_for_an_extension_we_do_not_sell():
    assert name_of("ChatGPT.gif") == "file.gif"


def test_a_name_with_no_extension_at_all_still_gets_a_name():
    assert name_of("ChatGPT") == "file"


# ---------------------------------------------------------------------------
# 5.3: leftover separators
# ---------------------------------------------------------------------------

def test_stranded_separators_come_off_both_ends():
    assert name_of("ChatGPT Image.png") == "Image.png"
    assert name_of("ChatGPT_Image_.png") == "Image.png"
    assert name_of("ChatGPT-Image-.png") == "Image.png"
    assert name_of("ChatGPT, Image ,.png") == "Image.png"
    assert name_of("ChatGPT   spaced out   .png") == "spaced out.png"


def test_separators_INSIDE_the_name_are_left_alone():
    assert name_of("ChatGPT Image_Aug-25,2026.png") == "Image_Aug-25,2026.png"


# ---------------------------------------------------------------------------
# 5.3: the extension is preserved exactly
# ---------------------------------------------------------------------------

def test_extension_is_preserved_exactly_including_its_case():
    assert name_of("ChatGPT Image.PNG") == "Image.PNG"
    assert name_of("ChatGPT Image.JPEG") == "Image.JPEG"
    assert name_of("Gemini_Generated_Image_abc.jpeg") == (
        "Generated_Image_abc.jpeg")


def test_a_very_long_name_is_cut_at_the_stem_never_at_the_extension():
    result = name_of("ChatGPT " + "a" * 400 + ".png")
    assert len(result) == 255
    assert result.endswith(".png")


# ---------------------------------------------------------------------------
# 5.3: case
# ---------------------------------------------------------------------------

def test_matching_is_case_insensitive():
    assert name_of("chatgpt image.png") == "image.png"
    assert name_of("CHATGPT Image.png") == "Image.png"
    assert name_of("gemini_generated_image_abc.png") == "generated_image_abc.png"


# ---------------------------------------------------------------------------
# 5.3: unicode
# ---------------------------------------------------------------------------

def test_the_middle_dot_in_dalle_is_matched():
    """U+00B7, the character OpenAI actually uses in the product name."""
    assert "·" in "DALL·E"
    assert name_of("DALL·E 2026-08-25 14.32.11 - a cat.png") == (
        "2026-08-25 14.32.11 - a cat.png")


def test_the_hyphen_and_runtogether_spellings_are_matched_too():
    assert name_of("DALL-E 2 variation 1.png") == "2 variation 1.png"
    assert name_of("DALL_E sketch.png") == "sketch.png"
    assert name_of("DALLE sketch.png") == "sketch.png"


def test_a_unicode_name_the_customer_chose_is_untouched():
    for filename in ("café notes.docx", "论文.docx", "Ωmega draft.txt"):
        assert name_of(filename) == filename


# ---------------------------------------------------------------------------
# 5.3: a name the customer chose comes back byte-identical
# ---------------------------------------------------------------------------

def test_a_customer_named_file_is_returned_byte_identical():
    result = strip_tool_name("my essay.docx")
    assert result["name"] == "my essay.docx"
    assert result["changed"] is False
    assert result["tool"] is None


def test_ordinary_names_are_all_left_alone():
    for filename in (
        "paste.txt",
        "final draft v3.docx",
        "IMG_2481.jpg",
        "Screenshot 2026-08-25 at 15.14.22.png",
        "notes.txt",
    ):
        assert name_of(filename) == filename


def test_a_tool_name_that_runs_on_into_another_word_is_not_a_tool_name():
    """The whole false-positive defence. `Geminids` is not `Gemini`."""
    assert name_of("Geminids meteor shower.docx") == "Geminids meteor shower.docx"
    assert name_of("ChatGPTastic.png") == "ChatGPTastic.png"
    assert name_of("Fireflies at dusk.jpg") == "Fireflies at dusk.jpg"


def test_the_tool_name_must_be_at_the_FRONT():
    """A known and deliberate limit, recorded so nobody reads it as coverage.

    `Artificial planet by ChatGPT Image May 3, 2025.png` is a real file and
    keeps its tell: matching anywhere in a name would damage far more customer
    filenames than it would clean.
    """
    keeps_its_tell = "Artificial planet by ChatGPT Image May 3, 2025.png"
    assert name_of(keeps_its_tell) == keeps_its_tell


def test_only_one_name_is_stripped_once():
    """No looping. Jon's ruling is one tool name off the front, and no more."""
    assert name_of("ChatGPT Gemini thing.png") == "Gemini thing.png"


# ---------------------------------------------------------------------------
# 5.3: Midjourney and Copilot are OUT OF SCOPE, and the list says so by
# staying silent about them rather than by carrying a pattern that never fires
# ---------------------------------------------------------------------------

def test_midjourney_and_copilot_names_are_untouched():
    """Neither convention contains the tool's name, so there is nothing to strip.

    An entry for either would look like coverage and deliver none.
    """
    for filename in (
        "jonathan_a_cat_wearing_a_hat_8f3a91c2-4b7d-4e11-9d6a-1c2b3d4e5f60.png",
        "OIG.5rT9wQpL.jpeg",
        "_e7d1c4a2-3b5f-4c8a-9d2e-6f1a0b3c4d5e.jpeg",
    ):
        assert name_of(filename) == filename
    assert "Midjourney" not in TOOL_NAMES
    assert "Copilot" not in TOOL_NAMES
    assert "OIG" not in TOOL_NAMES


# ---------------------------------------------------------------------------
# Nothing surprising reaches a filesystem
# ---------------------------------------------------------------------------

def test_a_stripped_name_never_grows_a_path_separator():
    for filename in ("ChatGPT Image a/b.png", "ChatGPT Image a\\b.png"):
        assert name_of(filename) == filename.split("ChatGPT ", 1)[1]


def test_an_empty_name_does_not_raise():
    assert strip_tool_name("")["name"] == ""
    assert strip_tool_name("")["changed"] is False


# ---------------------------------------------------------------------------
# End to end through the engine's own clean, which is where the browser gets
# the name from. One implementation: the browser renders what it is handed.
# ---------------------------------------------------------------------------

def _clean(name: str, data: bytes) -> dict:
    import server  # noqa: PLC0415 — heavy import, and only this file needs it

    return server._clean_payload(data, name, {})


def test_the_clean_response_carries_the_download_name():
    payload = _clean("ChatGPT Image Aug 25, 2026, 03_14_22 PM.txt",
                     b"A short note with nothing hidden in it at all.")
    assert payload["download_name"] == "Image Aug 25, 2026, 03_14_22 PM.txt"
    assert payload["report"]["filename"]["tool"] == "ChatGPT"
    assert payload["report"]["filename"]["original"].startswith("ChatGPT")


def test_the_clean_response_carries_the_ORIGINAL_name_when_nothing_was_stripped():
    payload = _clean("my essay.txt", b"A short note with nothing hidden in it.")
    assert payload["download_name"] == "my essay.txt"
    assert "filename" not in payload["report"]


def test_the_cleaned_bytes_are_unaffected_by_the_rename():
    """A rename is a label on the answer. It must never touch the file."""
    data = b"A short note with nothing hidden in it at all."
    renamed = _clean("ChatGPT note.txt", data)
    plain = _clean("note.txt", data)
    assert renamed["cleaned"] == plain["cleaned"]
    assert base64.b64decode(renamed["cleaned"]) == data
