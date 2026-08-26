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

THERE IS EXACTLY ONE EXCEPTION TO THE UNIFORM RULE, and it is `Claude`, which
is also a common human first name. It is stripped only in front of a word a lab
uses and a parent does not, so `Claude Image ...` loses its first word and
`Claude Monet study.docx` does not. See TYPE_WORD_REQUIRED, which explains why
and holds the whole of it. **Nothing else is special-cased, and nothing else
should be** without the same weight of evidence behind it.
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
    # xAI. CONFIRMED against real files, and this one was found by going and
    # looking after Jon asked for it on 26 August 2026. Two Wikimedia Commons
    # uploads, both "own work", carrying two different id shapes under one
    # prefix:
    #     Grok_image_1772320123570.jpg
    #     Grok_image_7x449i.jpg
    # Nobody names a file `Grok image 1772320123570` by hand, so that is xAI's
    # own name for it.
    "Grok",
    # Meta. NOT confirmed: nothing in the wild, and Meta's help pages say only
    # "tap Save". It is here on Jon's instruction of 26 August 2026, and it is
    # safe to carry while unproven because it is TWO WORDS. Nobody's own file
    # begins "Meta AI", so being wrong about it costs a customer nothing.
    #
    # `Meta` ALONE IS DELIBERATELY NOT HERE and must never be added: it would
    # strip the first word off `Meta description.docx` and every other ordinary
    # file that begins with the word.
    "Meta AI",
    "Meta_AI",
    "MetaAI",
    # Anthropic. Here on Jon's instruction of 26 August 2026, and GUARDED —
    # see TYPE_WORD_REQUIRED directly below, which is the only reason it can
    # be here at all.
    "Claude",
)

# ---------------------------------------------------------------------------
# THE ONE EXCEPTION, AND WHY IT EXISTS
# ---------------------------------------------------------------------------
#
# A tool name in this list is normally stripped whenever it is the first word.
# `Claude` cannot be treated that way, and the evidence is not close:
#
#   * NOTHING SAYS CLAUDE PUTS ITS NAME ON A FILE. Three separate checks found
#     no such convention. Artifacts download under the artifact's own title, a
#     document Claude writes is named from what is in it, and a search of every
#     file on Wikimedia Commons beginning `Claude Image` or `Claude Generated`
#     returned nothing at all.
#   * `Claude` IS A PERSON'S NAME, and overwhelmingly so. The first thirty
#     files on Commons beginning with the word are thirty human beings:
#     Claude Debussy, Claude Grahame-White, `Claude-Alix Bertrand.JPG`,
#     `Claude, empereur romain.tif`. Thirty out of thirty.
#
# So an unguarded entry would rename a real customer's document to remove a
# mark that has never been shown to exist. THE GUARD IS WHAT MAKES IT SAFE:
# `Claude` is stripped only when the word after it is one a LAB uses and a
# PARENT does not.
#
#     Claude Image Aug 25, 2026.png   ->  Image Aug 25, 2026.png    stripped
#     Claude_Generated_Image_a1.png   ->  Generated_Image_a1.png    stripped
#     Claude Monet study.docx         ->  Claude Monet study.docx   untouched
#     Claude-Alix Bertrand.jpg        ->  Claude-Alix Bertrand.jpg  untouched
#
# THE WORDS BELOW ARE NOT INVENTED. Each one is what a peer already puts in
# that exact position: OpenAI writes `ChatGPT Image ...`, Google writes
# `Gemini_Generated_Image_...`, xAI writes `Grok_image_...`. If Anthropic ever
# ships any of those shapes, this fires on the first day and nobody has to
# notice. **Today it fires on nothing, and that is recorded rather than hidden.**
TYPE_WORD_REQUIRED: dict[str, tuple[str, ...]] = {
    "Claude": ("image", "images", "generated", "artifact", "artifacts", "export"),
}

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

        # The guarded case. See TYPE_WORD_REQUIRED: a tool name that is also a
        # person's name is stripped only when what follows could not be a
        # surname. `rest` has already had its stranded punctuation trimmed, so
        # the first word of it is the word immediately after the tool's name.
        required = TYPE_WORD_REQUIRED.get(tool)
        if required is not None:
            first = rest.replace("_", " ").replace("-", " ").split(" ", 1)[0]
            if first.casefold() not in required:
                continue

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
