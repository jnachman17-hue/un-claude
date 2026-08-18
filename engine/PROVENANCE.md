# Where this code came from

**This folder is a copy of `guillaumemeyer/watermarks-remover`, not our own work.**

| | |
|---|---|
| Source | https://github.com/guillaumemeyer/watermarks-remover |
| Licence | MIT. See `UPSTREAM-LICENSE` |
| Commit copied | `063119d7e548b8f75592986b92046f602b0322be` |
| Dated | 2026-08-19 |
| Copied on | 18 August 2026, session 4, Track A |

**The MIT licence permits commercial use and requires the copyright notice to be
kept.** `UPSTREAM-LICENSE` is that notice and must not be deleted. A visible
attribution on the website is not required by the licence, but is planned.

## What was copied, and what was left behind

**Copied:** `service/scripts/` (the engine itself), the licence, the upstream
README as reference, and the upstream test suite.

**Left behind deliberately:**

| Not copied | Why |
|---|---|
| Dockerfiles and `compose.yaml` | Docker is not used. `04` entry 27 |
| `Dockerfile.ctrlregen`, `.markllm`, `.markdiffusion`, `.synthid` | Optional research harnesses. Not part of this product |
| `.github/` workflows | Their automated checks, not ours |
| `integrations/`, `skills/`, install scripts | Ways of plugging the tool into other software. Not needed |

## How to update it later

Re-download from the source above and copy `service/scripts` over the top, then
run the tests in `engine/tests`. **Record the new commit in the table above.**

## Verified on the day it was copied

Runs on Python 3.14.7 with **no packages installed at all**, standard library
only. Every import in `scripts/` is either from the standard library or from a
neighbouring file in the same folder. Checked, not assumed.
