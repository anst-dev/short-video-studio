#!/usr/bin/env python3
"""
Optional (Beta) Multi-Scene Autoresearch QA & Self-Learning Workflow (`workflows/autoresearch_video_beta.py`).
Strictly opt-in so existing production pipelines (`workflows/run_film_pipeline.py`) are NEVER disrupted.

Features:
  1. Auto-partitions a film's timeline into scenes (either from `vo/vo_timeline.json` cues or fixed `--scene-len` windows).
  2. Evaluates every scene individually in ~0.8s/scene via `eval_scene_qa.py` (Code Rules + Canvas/DOM BBox Spy + Motion + Optional Carbon Reference).
  3. Generates a unified multi-scene summary report (`<film>/autoresearch_qa/film_qa_summary.json`) and contact sheet of all `scene_<k>_compare.jpg` strips (`<film>/autoresearch_qa/all_scenes_compare.jpg`).
  4. Runs `learn_from_qa.py` to progressively update `.agents/skills/lemo-autoresearch-qa/references/learned-pitfalls.md` and `workflows/autoresearch_hints.json`.
"""
import argparse, json, math, os, subprocess, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
WORKSPACE = os.path.abspath(os.path.join(HERE, ".."))
LIB = os.path.join(WORKSPACE, "lemo-opuscar")
SKILLS = os.path.join(WORKSPACE, ".agents", "skills")
EVAL_PY = os.path.join(SKILLS, "lemo-autoresearch-qa", "scripts", "eval_scene_qa.py")
LEARN_PY = os.path.join(SKILLS, "lemo-autoresearch-qa", "scripts", "learn_from_qa.py")
PY = os.path.join(LIB, ".venv", "Scripts", "python.exe")
if not os.path.isfile(PY):
    PY = sys.executable


def resolve_film(p):
    if not p:
        return ""
    if os.path.isabs(p) and os.path.isdir(p):
        return p
    for cand in [
        os.path.join(WORKSPACE, "projects", p),
        os.path.join(LIB, "films", p),
        os.path.join(LIB, p),
        os.path.join(WORKSPACE, p),
    ]:
        if os.path.isdir(cand):
            return os.path.abspath(cand)
    return os.path.abspath(os.path.join(WORKSPACE, "projects", p))


def infer_scenes(film_dir, dur, scene_len):
    vo_p = os.path.join(film_dir, "vo", "vo_timeline.json")
    if scene_len <= 0 and os.path.isfile(vo_p):
        vo = json.load(open(vo_p, encoding="utf-8"))
        if vo:
            scenes = []
            for i, c in enumerate(vo):
                t0 = 0.0 if i == 0 else round(float(c["t0"]), 2)
                t1 = round(float(vo[i + 1]["t0"]) if i + 1 < len(vo) else dur, 2)
                if t1 - t0 >= 1.2:
                    scenes.append((len(scenes), t0, t1))
            if scenes:
                return scenes
    step = scene_len if scene_len > 0 else 6.0
    n = max(1, int(math.ceil(dur / step)))
    return [(k, round(k * step, 2), round(min(dur, (k + 1) * step), 2)) for k in range(n)]


def stitch_strips(strip_paths, out_jpg):
    valid = [p for p in strip_paths if os.path.isfile(p)]
    if not valid:
        return ""
    ims = [Image.open(p).convert("RGB") for p in valid]
    w = max(im.width for im in ims)
    total_h = sum(im.height + 8 for im in ims)
    sheet = Image.new("RGB", (w, total_h), (12, 14, 20))
    y = 0
    for im in ims:
        sheet.paste(im, (0, y))
        y += im.height + 8
    sheet.save(out_jpg, quality=88)
    return out_jpg


def main():
    ap = argparse.ArgumentParser(description="[Beta] Multi-Scene Autoresearch QA & Self-Improvement Workflow")
    ap.add_argument("--film", required=True, help="Candidate film folder")
    ap.add_argument("--ref", default="", help="Optional ground-truth reference film (e.g. Carbon build)")
    ap.add_argument("--dur", type=float, default=24.0, help="Film duration in seconds")
    ap.add_argument("--scene-len", type=float, default=6.0, help="Scene window length in seconds (set 0 to infer from vo_timeline.json)")
    ap.add_argument("--size", default="1920x1080")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    film_dir = resolve_film(args.film)
    ref_dir = resolve_film(args.ref) if args.ref else ""
    scenes = infer_scenes(film_dir, args.dur, args.scene_len)

    scene_reports = []
    strips = []
    for idx, t0, t1 in scenes:
        cmd = [PY, "-X", "utf8", EVAL_PY, "--film", film_dir, "--scene", str(idx), "--t0", str(t0), "--t1", str(t1), "--size", args.size, "--json"]
        if ref_dir:
            cmd += ["--ref", ref_dir]
        r = subprocess.run(cmd, cwd=WORKSPACE, capture_output=True, text=True, encoding="utf-8")
        rep = json.loads(r.stdout) if r.returncode == 0 else {"ok": False, "scene": idx, "qa_score": 0.0, "val_defect_loss": 1.0, "error": r.stderr}
        scene_reports.append(rep)
        if rep.get("comparison_strip_jpg"):
            strips.append(rep["comparison_strip_jpg"])

    qa_dir = os.path.join(film_dir, "autoresearch_qa")
    os.makedirs(qa_dir, exist_ok=True)
    all_sheet = stitch_strips(strips, os.path.join(qa_dir, "all_scenes_compare.jpg"))

    scores = [float(x.get("qa_score", 0.0)) for x in scene_reports]
    mean_score = round(sum(scores) / max(1, len(scores)), 2)
    worst = min(scene_reports, key=lambda x: float(x.get("qa_score", 0.0)))

    # Distill lessons into learned-pitfalls.md & workflows/autoresearch_hints.json
    subprocess.run([PY, "-X", "utf8", LEARN_PY], cwd=WORKSPACE, capture_output=True, text=True)

    summary = {
        "film": os.path.basename(film_dir),
        "ref": os.path.basename(ref_dir) if ref_dir else "",
        "scenes_evaluated": len(scene_reports),
        "mean_qa_score": mean_score,
        "min_scene_score": round(float(worst.get("qa_score", 0.0)), 2),
        "worst_scene_index": worst.get("scene", 0),
        "all_scenes_compare_jpg": all_sheet,
        "scenes": scene_reports,
    }
    sum_path = os.path.join(qa_dir, "film_qa_summary.json")
    json.dump(summary, open(sum_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

    if args.json:
        print(json.dumps(summary, ensure_ascii=False, indent=2))
    else:
        print(f"=== [BETA] AUTORESEARCH FILM QA SUMMARY: {summary['film']} ===")
        print(f"Scenes evaluated: {len(scene_reports)} | Mean QA Score: {mean_score}/100 | Min Scene Score: {summary['min_scene_score']}/100 (Scene {summary['worst_scene_index']})")
        for s in scene_reports:
            ref_str = f" | ref_align={s['reference_comparison']['reference_alignment_score']}%" if s.get("reference_comparison") else ""
            print(f"  - Scene {s['scene']} {s.get('t_window')}: score={s.get('qa_score')}/100 | collisions={s.get('text_collisions_count', 0)} | overflows={s.get('margin_overflows_count', 0)}{ref_str}")
        print(f"Visual comparison board -> {all_sheet}")
        print(f"Summary JSON            -> {sum_path}")


if __name__ == "__main__":
    main()
