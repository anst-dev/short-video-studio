#!/usr/bin/env python3
"""
Self-Improving QA Knowledge Distiller (`learn_from_qa.py` — Beta).
Reads persistent `.agents/autoresearch_qa/logs/qa_feedback_log.jsonl` and all film `results.tsv` files,
extracts recurring weak-model failure modes + highest-delta `keep` improvements, and updates:
  1. `.agents/skills/lemo-autoresearch-qa/references/learned-pitfalls.md`
  2. `workflows/autoresearch_hints.json`
so future weak-model video runs improve progressively!
"""
import collections, datetime, glob, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL_DIR = os.path.abspath(os.path.join(HERE, ".."))
WORKSPACE = os.path.abspath(os.path.join(SKILL_DIR, "..", "..", ".."))
LOGS_FILE = os.path.join(WORKSPACE, ".agents", "autoresearch_qa", "logs", "qa_feedback_log.jsonl")
PITFALLS_MD = os.path.join(SKILL_DIR, "references", "learned-pitfalls.md")
HINTS_JSON = os.path.join(WORKSPACE, "workflows", "autoresearch_hints.json")


def categorize_fix(fx: str) -> str:
    s = fx.lower()
    if "collision" in s or "overlaps" in s:
        return "TEXT_COLLISION"
    if "overflows safe screen" in s or "touches/overflows" in s:
        return "MARGIN_OVERFLOW"
    if "static slide" in s or "intra-scene motion" in s:
        return "STATIC_NO_MOTION"
    if "visually sparse" in s or "thinner than carbon" in s or "unbalanced" in s:
        return "LOW_VISUAL_DENSITY"
    if "tiny font" in s:
        return "TINY_FONT_SIZE"
    if "-apple-system" in s or "pingfang" in s or "preload" in s:
        return "FONT_HOSTING_RULE"
    if "emoji" in s:
        return "OS_EMOJI_BAN"
    if "fewer informative labels" in s:
        return "INCOMPLETE_CONTENT"
    return "OTHER_POLISH"


REMEDY_PLAYBOOK = {
    "TEXT_COLLISION": "Never hardcode single-line long Vietnamese strings without `wrapWords(str, font, maxW)`. Enforce vertical line-stepping `curY += fontSize * 1.38` and separate adjacent cards by `>= 28px`.",
    "MARGIN_OVERFLOW": "Clamp all cards and labels strictly inside `x in [72, 1848]` and `y in [120, 875]`, reserving `y in [885, 1060]` exclusively for subtitles.",
    "STATIC_NO_MOTION": "Every scene MUST animate continuously: combine staggered `outBack` card/chip pop-ins (`t0 + idx * 0.18s`), ambient background parallax/particles, and gentle camera drift (`16 * Math.sin(t * 0.5)`).",
    "LOW_VISUAL_DENSITY": "Avoid bare single-sentence slides! Pair a left comparison/concept card (`w >= 680px`) with a right application/proof card (`w >= 680px`), numbered badges, and connecting arrows or progress bars.",
    "TINY_FONT_SIZE": "Minimum readable font size on 1920x1080 is `>= 20px` for body bullets, `>= 26px` for card titles, and `>= 36px` for section headers.",
    "FONT_HOSTING_RULE": "Always load self-hosted `.ttf` (`BeVietnamPro`, `Inter`, `JBMono`) via `await Promise.all([document.fonts.load(...)])` before setting `window.READY = true`.",
    "OS_EMOJI_BAN": "Never render OS emojis (`📊`, `🚀`, `❓`); draw clean Canvas badges, circles, checkmarks (`✓`), or typographic tags (`[01]`, `[!]`).",
    "INCOMPLETE_CONTENT": "Match the full pedagogical depth of the brief: include concrete numbers, side-by-side Before/After contrasts, and clear takeaways in every scene.",
}


def main():
    counts = collections.Counter()
    samples = {}
    total_evals = 0

    if os.path.isfile(LOGS_FILE):
        for line in open(LOGS_FILE, encoding="utf-8"):
            line = line.strip()
            if not line:
                continue
            total_evals += 1
            rec = json.loads(line)
            for fx in rec.get("fixes", []):
                if "passes all code" in fx:
                    continue
                cat = categorize_fix(fx)
                counts[cat] += 1
                samples.setdefault(cat, fx)

    # Scan all results.tsv files for winning `keep` experiments
    tsv_paths = glob.glob(os.path.join(WORKSPACE, "lemo-opuscar", "films", "*", "autoresearch_qa", "results.tsv"))
    winning_moves = []
    for tp in sorted(tsv_paths):
        film_name = os.path.basename(os.path.dirname(os.path.dirname(tp)))
        rows = [ln.strip().split("\t") for ln in open(tp, encoding="utf-8").read().splitlines()[1:] if ln.strip()]
        best_by_scene = {}
        for r in rows:
            if len(r) < 9:
                continue
            sc, score, status, desc = r[1], float(r[2]), r[7], r[8]
            if status == "keep":
                prev = best_by_scene.get(sc)
                if prev is not None and score - prev >= 1.0:
                    winning_moves.append({
                        "film": film_name,
                        "scene": int(sc),
                        "gain": round(score - prev, 2),
                        "new_score": score,
                        "description": desc,
                    })
                best_by_scene[sc] = score

    winning_moves.sort(key=lambda x: -x["gain"])
    top_cats = counts.most_common(8) or [("TEXT_COLLISION", 0), ("LOW_VISUAL_DENSITY", 0), ("STATIC_NO_MOTION", 0)]

    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    md_lines = [
        "# Learned Weak-Model Pitfalls & Autoresearch Remedies (Auto-Updated)",
        "",
        f"> Last updated by `learn_from_qa.py`: **{now_str}** · Total scene evaluations analyzed: **{total_evals}**",
        "",
        "Read this file **BEFORE** writing or fixing `index.html` / `film.js` when running on lighter/faster models (e.g. Flash).",
        "",
        "## 1. Top Empirically Observed Defects & Mandatory Code Rules",
        "",
    ]
    for idx, (cat, cnt) in enumerate(top_cats, 1):
        remedy = REMEDY_PLAYBOOK.get(cat, "Verify coordinates and visual contrast in `scene_k_compare.jpg`.")
        ex = samples.get(cat, "")
        md_lines.append(f"### {idx}. `{cat}` (Observed `{cnt}` time(s))")
        md_lines.append(f"- **Mandatory Prevention Rule:** {remedy}")
        if ex:
            md_lines.append(f"- **Real Logged Example:** `{ex}`")
        md_lines.append("")

    md_lines.append("## 2. Highest-Impact `keep` Fixes From Past Autoresearch Loops")
    md_lines.append("")
    if winning_moves:
        for wm in winning_moves[:12]:
            md_lines.append(f"- **`+{wm['gain']} pts` (`-> {wm['new_score']}/100`)** on `{wm['film']}` Scene `{wm['scene']}`: {wm['description']}")
    else:
        md_lines.append("- *(Baseline initialized — winning micro-edits will accumulate here automatically after each run).*")
    md_lines.append("")

    os.makedirs(os.path.dirname(PITFALLS_MD), exist_ok=True)
    open(PITFALLS_MD, "w", encoding="utf-8").write("\n".join(md_lines))

    hints = {
        "updated_at": now_str,
        "total_scene_evaluations": total_evals,
        "top_defect_categories": [{"category": c, "count": n, "rule": REMEDY_PLAYBOOK.get(c, "")} for c, n in top_cats],
        "top_winning_edits": winning_moves[:10],
    }
    os.makedirs(os.path.dirname(HINTS_JSON), exist_ok=True)
    json.dump(hints, open(HINTS_JSON, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"[learn_from_qa] Updated {PITFALLS_MD} and {HINTS_JSON} ({total_evals} evals, {len(winning_moves)} winning edits).")


if __name__ == "__main__":
    main()
