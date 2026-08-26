"""The file's NAME is a watermark too, and it is the one a person reads first.

Found by Jon on 25 August 2026 while using the product. A visitor downloads an
image from ChatGPT, which arrives called

    ChatGPT Image Aug 25, 2026, 03_14_22 PM.png

uploads it, and un-claude correctly strips the C2PA record and the EXIF block —
the marks nobody can see — and then hands the file back still wearing the mark
anybody can. A document called `ChatGPT Image ...` handed to a marker makes the
invisible work irrelevant.

WHAT THIS MODULE DOES, IN ONE SENTENCE: it takes the TOOL'S NAME off the front
of a filename and leaves everything else exactly as it was.

    ChatGPT Image Aug 25, 2026, 03_14_22 PM.png
      ->     Image Aug 25, 2026, 03_14_22 PM.png

JON'S RULING, 25 August 2026, and it decides the shape of everything below.
Strip the tool name, keep the rest. Not the date, not the prompt, not the id —
only the name of the tool. The conductor's recorded objection is that this makes
the product depend on a list of naming conventions that moves whenever a lab
ships a new export button, and that even ONE tool has several. Jon weighed that
and ruled anyway, so the list below is built to be edited: one line per tool,
the reasoning beside it, and nothing else to understand.

THE RULE IS DELIBERATELY UNIFORM. There is no per-tool pattern, no date format,
no id shape. A tool name is stripped when it is the FIRST word of the name and
the character after it is not a letter or a digit. That one rule covers every
variant of every convention at once, which matters more than it sounds:

    ChatGPT Image Aug 14, 2025, 01:01:35 PM.png     US English
    ChatGPT Image 7 mrt 2026, 11:19:57.png          Dutch
    ChatGPT Image 8. sep. 2025, 18.32.11.png        Danish
    ChatGPT Image Sep 29, 2025 at 09:31:03 AM.png   a newer build
    Gemini_Generated_Image_wtrorwtrorwtrorw.png     underscores, no spaces

All five are real filenames observed in the wild (see WHERE THE LIST CAME FROM),
and one rule handles all five. A per-tool regular expression would have needed
five and would have missed the sixth the day it shipped.

WHAT IT WILL NOT DO, said plainly because a list that looks complete and is not
is the failure mode this whole approach carries:

  * IT ONLY LOOKS AT THE FRONT. `Artificial planet by ChatGPT Image May 3.png`
    is a real file and keeps its tell. Matching anywhere in the name would
    mangle far more customer filenames than it would clean, so the front is
    where it stops.
  * IT STRIPS ONE NAME, ONCE. No looping, no second pass.
  * IT CANNOT HELP WITH A TOOL THAT NEVER SIGNS ITS NAME. Midjourney names
    files `<user>_<prompt>_<uuid>.png` and Microsoft Copilot names them
    `OIG.<id>.jpeg`. Neither contains the tool's name, so neither is in the
    list and neither ever will be by this route.
"""
from __future__ import annotations

from pathlib import Path

# ---------------------------------------------------------------------------
# THE LIST. Adding a tool is one line.
# ---------------------------------------------------------------------------
#
# HOW AN ENTRY EARNS ITS PLACE. Two questions, and a new entry has to pass one
# of them:
#
#   1. Is the tool's name really the first word of what that tool hands a user?
#      Evidenced, ideally by a real file, not by a plausible guess.
#   2. If we are wrong about (1), what does it cost the customer whose OWN file
#      happens to start with that word?
#
# Include when (1) is evidenced, or when (2) is harmless. Leave it out when (1)
# is unevidenced AND (2) is a word people really name files after — that
# combination is the one that damages a paying customer's document for nothing.
# See docs/session-notes/strip-the-tool-name.md for what was checked and what
# was not.
#
# Case does not matter here: matching is case-insensitive, so `chatgpt` and
# `ChatGPT` both hit. Spelling variants DO matter and get their own line.
TOOL_NAMES: tuple[str, ...] = (
    # OpenAI. CONFIRMED against real files: Wikimedia Commons carries hundreds
    # of `ChatGPT Image <date>.png` uploads in at least four locale formats.
    # Nothing else is called ChatGPT, so there is no collision to worry about.
    "ChatGPT",
    # OpenAI's older image tool. The middle dot is U+00B7 and is the one the
    # product itself uses; the hyphen and the run-together spellings are how
    # the same name survives a filesystem that dislikes the dot. Taken on
    # trust: no real download was inspected. Kept anyway because a customer
    # file beginning "DALL-E" is a file about DALL-E.
    "DALL·E",
    "DALL-E",
    "DALL_E",
    "DALLE",
    # Google. CONFIRMED against real files: Wikimedia Commons carries
    # `Gemini_Generated_Image_<id>.png` uploads. Stripping the tool name alone
    # leaves `Generated_Image_<id>.png`, which is Jon's ruling applied
    # literally — it names no tool.
    #
    # KNOWN COLLISION: Gemini is a constellation, a star sign and a NASA
    # programme. `Gemini 4 spacewalk.jpg` would lose its first word. Judged
    # worth it because the AI naming is confirmed and the damage is cosmetic:
    # the file still opens, and the customer can rename it.
    "Gemini",
    # Adobe. Reported first-hand on Adobe's own community forum as literally
    # `Firefly.jpg`, which is also the worst case in this module — see
    # FALLBACK_STEMS. Not confirmed by a download of our own.
    #
    # KNOWN COLLISION, AND THE WORST ONE HERE: fireflies are insects, and
    # Firefly is also an aircraft, a tank, a rocket company and a television
    # series. This is the first line to delete if it ever causes trouble.
    "Firefly",
)

#: What a name becomes when the tool's name was ALL there was.
#
# `Firefly.jpg` strips to nothing, and nothing is not a filename: an empty name
# or a bare `.jpg` is invisible on macOS, unnamed on Windows, and reads to the
# customer as a download that broke. So the stem is replaced with the most
# ordinary word for what the file actually is. `image.png` tells a reader
# nothing at all, which is exactly the point, and it is what several million
# entirely human files are already called.
FALLBACK_STEMS: dict[str, str] = {
    ".png": "image",
    ".jpg": "image",
    ".jpeg": "image",
    ".docx": "document",
    ".txt": "text",
}

#: For an extension we do not sell. Neutral, and never empty.
FALLBACK_DEFAULT = "file"

#: Punctuation left stranded at either end once the tool's name is gone.
#: `ChatGPT_Image.png` would otherwise strip to `_Image.png`.
_STRANDED = " \t_-,.·–—"


def _boundary(stem: str, at: int) -> bool:
    """Does the tool's name END here, rather than run on into another word?

    The whole false-positive defence is this function. `Gemini_Generated` ends
    its first word at the underscore and is stripped; `Geminids meteor shower`
    does not, and is left completely alone. Without it every customer file
    beginning with those letters would be damaged.
    """
    if at >= len(stem):
        return True
    return not stem[at].isalnum()


def strip_tool_name(name: str) -> dict:
    """Take the tool's name off the front of *name*, if there is one there.

    Returns a small record rather than a bare string, because the interface has
    to be able to TELL the customer their file was renamed — a name that
    changes silently reads as a download that went wrong. See 5.4 of the brief.

        {"original": "ChatGPT Image Aug 25.png",
         "name":     "Image Aug 25.png",
         "tool":     "ChatGPT",
         "changed":  True}

    A name with no tool in it comes back byte for byte identical and
    `changed` is False. That is the guarantee that matters most here: the
    overwhelming majority of uploads are documents the customer named, and this
    function must be invisible to every one of them.
    """
    original = str(name)
    suffix = Path(original).suffix          # preserved EXACTLY, case included
    stem = original[: len(original) - len(suffix)] if suffix else original

    for tool in TOOL_NAMES:
        if len(stem) < len(tool):
            continue
        if stem[: len(tool)].casefold() != tool.casefold():
            continue
        if not _boundary(stem, len(tool)):
            continue

        rest = stem[len(tool):].strip(_STRANDED)
        if not rest:
            rest = FALLBACK_STEMS.get(suffix.lower(), FALLBACK_DEFAULT)
        # 255 is the filename ceiling every filesystem this product meets
        # agrees on, and is the same cap uc_policy.safe_name applies. The
        # STEM is what gets cut, never the extension: a file that will not
        # open is a far worse failure than a long name.
        cleaned = rest[: max(1, 255 - len(suffix))] + suffix
        return {"original": original, "name": cleaned, "tool": tool,
                "changed": cleaned != original}

    return {"original": original, "name": original, "tool": None,
            "changed": False}
