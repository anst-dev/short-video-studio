---
name: lemo-autoresearch-qa
description: >-
  (Beta / Opt-In) Karpathy `autoresearch`-inspired Per-Scene Code + Vision QA & Self-Improving
  Ratchet Loop for weaker/faster reasoning models (e.g. Flash). Evaluates and fixes ONE scene at a
  time (< 1 second per check) against strict code/geometry rules + optional high-tier reference frames,
  keeps improvements, reverts regressions, logs `results.tsv`, and evolves `learned-pitfalls.md`.
  Activate ONLY when the user opts into Beta Autoresearch QA, model benchmarking, or iterative scene repair.
---

# Autoresearch Video QA & Self-Improving Loop (Beta / Opt-In)

> **BETA / OPT-IN ONLY:** Never inject this loop into standard production runs unless explicitly requested (`--beta-qa` / `lemo-autoresearch-qa`), keeping the main production pipeline untouched.

## Why This Exists
Smaller/faster models (such as `3.8 Flash`) run fast and cheap, but when writing 100% code-driven HTML5 Canvas / WebGL animations in one shot they frequently produce:
1. **Coordinate collisions** (long Vietnamese labels overlapping neighboring cards or headers).
2. **Margin & subtitle-zone overflows** (content drawn below `y = 880` colliding with captions).
3. **Static or sparse slides** (single box on empty background with zero intra-scene motion).
4. **Shallow visual hierarchy** compared to frontier reasoning models (`Gemini 4 Carbon`).

Instead of rendering all 1,440+ frames (`2–4 minutes`) only to discover flaws at the end, we adapt **Andrej Karpathy's [`autoresearch`](../../../autoresearch/program.md)** paradigm to **Per-Scene Micro-Iteration**:

| Karpathy `autoresearch` | `lemo-autoresearch-qa` (Code-Driven Video) |
|---|---|
| `prepare.py` *(immutable ground-truth evaluator)* | `scripts/eval_scene_qa.py` *(immutable Headless Chromium 2D Canvas Text-BBox Spy + Motion + Reference Diff evaluator, ~0.8s/scene)* |
| `train.py` *(single editable target)* | Scene `k` drawing block inside `index.html` / `film.js` *(1 small, simple change at a time)* |
| `val_bpb` *(lower = better)* | `val_defect_loss` (`0.000` = ideal) & `qa_score` (`0..100`, higher = better) + visual `scene_<k>_compare.jpg` |
| `git commit` / `git reset` ratchet + `results.tsv` | `scripts/snapshot_ratchet.py` *(saves `.best` snapshot on improvement, auto-reverts on regression, logs `results.tsv`)* |
| Human-iterated `program.md` | `program.md` + `scripts/learn_from_qa.py` -> auto-updates [references/learned-pitfalls.md](./references/learned-pitfalls.md) & `workflows/autoresearch_hints.json` |

---

## Mandatory Scene-by-Scene Autoresearch Protocol

1. **Read Empirical Memory First:**
   Read [references/learned-pitfalls.md](./references/learned-pitfalls.md) and [program.md](./program.md) before writing or editing code.

2. **Establish Per-Scene Baseline (Fast `< 1s` Check, NEVER Full Video Render First!):**
   For each scene `k` (`[t0, t1]`):
   ```powershell
   .\vstudio.bat ratchet --film <candidate_film> --ref <reference_film_optional> --scene 0 --t0 0 --t1 6 --desc "baseline scene 0"
   ```

3. **Inspect BOTH Code Rules AND Vision Strip (`scene_<k>_compare.jpg`):**
   - Read the JSON output (`qa_score`, `val_defect_loss`, `actionable_fixes[]`).
   - **Visually inspect** `<film>/autoresearch_qa/scene_<k>_compare.jpg` (`[1. CARBON REFERENCE | 2. CANDIDATE + RED/ORANGE DEFECT BOXES | 3. DELTA HEATMAP]`) with `read_file`!

4. **Micro-Edit -> Ratchet -> Repeat Per Scene (Simplicity Criterion):**
   - Edit **only Scene `k`** with a small, clean fix addressing the #1 defect or visual gap vs Reference.
   - Re-run `.\vstudio.bat ratchet --film ... --scene <k> --t0 ... --t1 ... --desc "<what changed>"`.
   - `snapshot_ratchet.py` automatically **KEEPS** the change if `val_defect_loss` improves (or matches with simpler/shorter code) and **REVERTS** to the best snapshot if it worsens or crashes!
   - Once Scene `k` reaches `qa_score >= 92` (and clean visual inspection of `scene_<k>_compare.jpg`), advance to Scene `k + 1`.

5. **Full Video Render & Evolve Skills Only AFTER All Scenes Converge:**
   - Run `.\vstudio.bat build --film <candidate_film> --out OUTPUT_VIDEOS/<Out>.mp4 --dur <dur>` once at the very end!
   - Run `.\vstudio.bat learn-qa` (`scripts/learn_from_qa.py`) to distill all logged defects and winning fixes into `references/learned-pitfalls.md` and `workflows/autoresearch_hints.json` so the next film starts smarter!
