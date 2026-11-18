# program.md — Autonomous Per-Scene Video QA Research Loop

Adapted from `karpathy/autoresearch/program.md` for code-driven HTML5 Canvas / WebGL video generation.

## Scope & Rules

**What you CAN modify:**
- Only the candidate film's `index.html` (or `film.js`). Focus on **one scene at a time** (`scene 0`, then `scene 1`, ...).

**What you CANNOT modify:**
- `eval_scene_qa.py` and `snapshot_ratchet.py` (immutable evaluation harness).
- The reference film (`--ref`), `lemo-opuscar/core/`, `lemo-opuscar/styles/`, or `dashi-animationstyle/styles/`.

**Simplicity Criterion:**
- Small, clean coordinate, word-wrapping, color-hierarchy, and easing improvements beat bloated hacks.
- Never render the full `.mp4` inside the inner loop! Each scene iteration must use `snapshot_ratchet.py` (~0.8s) + visual inspection of `scene_<k>_compare.jpg`.

## Inner Loop (Per Scene `k`)

1. Run baseline evaluation:
   `.\vstudio.bat ratchet --film <cand> --ref <ref> --scene <k> --t0 <t0> --t1 <t1> --desc "baseline"`
2. Read `actionable_fixes` AND view `<cand>/autoresearch_qa/scene_<k>_compare.jpg`.
3. Apply **one targeted improvement** to Scene `k`:
   - Fix any red bounding-box text collision or orange margin overflow first.
   - Match the Reference scene's multi-card layout balance, typography hierarchy, callout connectors, and continuous intra-scene motion (`outBack` pop, progress bars, flowing arrows, subtle drift).
4. Re-run `.\vstudio.bat ratchet ... --desc "<concise description>"`.
   - `keep` -> snapshot updated, continue refining if `qa_score < 93` or visual gap vs Reference remains.
   - `discard` / `crash` -> file is automatically reverted to best snapshot; try a cleaner approach.
5. Repeat until every scene achieves `qa_score >= 92` and clean visual parity, then run full `.\vstudio.bat build` + `.\vstudio.bat learn-qa`.
