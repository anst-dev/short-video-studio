#!/usr/bin/env python3
"""
Karpathy-style Keep / Discard Snapshot Ratchet (`snapshot_ratchet.py` — Beta).
Works without requiring `git commit`: stores clean `.best` snapshots of `index.html` / `film.js`
per scene inside `<film>/autoresearch_qa/snapshots/` and logs every experiment to `<film>/autoresearch_qa/results.tsv`.

Usage:
  # Evaluate current candidate on Scene k, auto-keep if val_defect_loss improved (or equal with simpler code), else auto-revert!
  python snapshot_ratchet.py --film films/beta_flash --ref films/beta_carbon_ref --scene 0 --t0 0 --t1 6 --desc "baseline"
"""
import argparse, hashlib, json, os, shutil, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
WORKSPACE = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
LIB = os.path.join(WORKSPACE, "lemo-opuscar")
EVAL_PY = os.path.join(HERE, "eval_scene_qa.py")
PY = os.path.join(LIB, ".venv", "Scripts", "python.exe")
if not os.path.isfile(PY):
    PY = sys.executable

TRACKED_EXTS = (".html", ".js", ".mjs", ".css")


def resolve_film(p):
    if os.path.isabs(p) and os.path.isdir(p):
        return p
    for cand in [os.path.join(LIB, "films", p), os.path.join(LIB, p), os.path.join(WORKSPACE, p)]:
        if os.path.isdir(cand):
            return os.path.abspath(cand)
    return os.path.abspath(os.path.join(LIB, "films", p))


def code_Editable_files(film_dir):
    out = []
    for fn in sorted(os.listdir(film_dir)):
        fp = os.path.join(film_dir, fn)
        if os.path.isfile(fp) and fn.endswith(TRACKED_EXTS) and fn != "fx_dashi.js":
            out.append(fn)
    return out


def code_fingerprint_and_lines(film_dir):
    h = hashlib.sha1()
    lines = 0
    for fn in code_Editable_files(film_dir):
        raw = open(os.path.join(film_dir, fn), "rb").read()
        h.update(fn.encode("utf-8") + b":" + raw)
        lines += raw.count(b"\n") + 1
    return h.hexdigest()[:7], lines


def save_snapshot(film_dir, snap_dir):
    os.makedirs(snap_dir, exist_ok=True)
    for fn in code_Editable_files(film_dir):
        shutil.copy2(os.path.join(film_dir, fn), os.path.join(snap_dir, fn))


def restore_snapshot(film_dir, snap_dir):
    if not os.path.isdir(snap_dir):
        return False
    for fn in os.listdir(snap_dir):
        src = os.path.join(snap_dir, fn)
        if os.path.isfile(src):
            shutil.copy2(src, os.path.join(film_dir, fn))
    return True


def main():
    ap = argparse.ArgumentParser(description="Karpathy Keep/Discard Ratchet for Per-Scene Video Autoresearch")
    ap.add_argument("--film", required=True)
    ap.add_argument("--ref", default="")
    ap.add_argument("--scene", type=int, required=True)
    ap.add_argument("--t0", type=float, required=True)
    ap.add_argument("--t1", type=float, required=True)
    ap.add_argument("--desc", required=True, help="Short description of this micro-experiment")
    ap.add_argument("--size", default="1920x1080")
    ap.add_argument("--no-revert", action="store_true", help="Record only without reverting on worse score")
    args = ap.parse_args()

    film_dir = resolve_film(args.film)
    qa_dir = os.path.join(film_dir, "autoresearch_qa")
    os.makedirs(qa_dir, exist_ok=True)
    snap_dir = os.path.join(qa_dir, f"best_scene_{args.scene}")
    state_file = os.path.join(qa_dir, "ratchet_state.json")
    tsv_file = os.path.join(qa_dir, "results.tsv")

    if not os.path.isfile(tsv_file):
        open(tsv_file, "w", encoding="utf-8").write(
            "hash\tscene\tqa_score\tval_defect_loss\tcollisions\toverflows\tloc\tstatus\tdescription\n"
        )

    state = json.load(open(state_file, encoding="utf-8")) if os.path.isfile(state_file) else {}
    s_key = str(args.scene)
    prev_best = state.get(s_key)

    short_hash, loc = code_fingerprint_and_lines(film_dir)

    cmd = [PY, "-X", "utf8", EVAL_PY, "--film", film_dir, "--scene", str(args.scene), "--t0", str(args.t0), "--t1", str(args.t1), "--size", args.size, "--json"]
    if args.ref:
        cmd += ["--ref", args.ref]
    r = subprocess.run(cmd, cwd=WORKSPACE, capture_output=True, text=True, encoding="utf-8")

    try:
        rep = json.loads(r.stdout)
    except Exception:
        rep = {"ok": False, "crashed": True, "qa_score": 0.0, "val_defect_loss": 1.0, "error": (r.stderr or r.stdout)[-400:]}

    if not rep.get("ok"):
        status = "crash"
        if prev_best and not args.no_revert:
            restore_snapshot(film_dir, snap_dir)
        row = f"{short_hash}\t{args.scene}\t0.00\t1.000000\t0\t0\t{loc}\tcrash\t{args.desc.replace(chr(9), ' ')}\n"
        open(tsv_file, "a", encoding="utf-8").write(row)
        print(json.dumps({"status": status, "reverted": bool(prev_best and not args.no_revert), "report": rep}, ensure_ascii=False, indent=2))
        sys.exit(1)

    score = float(rep["qa_score"])
    loss = float(rep["val_defect_loss"])
    colls = int(rep["text_collisions_count"])
    ovs = int(rep["margin_overflows_count"])

    # Karpathy Simplicity & Improvement Criterion:
    # Keep if first baseline OR loss strictly decreased OR equal score with fewer lines of code!
    if prev_best is None:
        keep = True
    elif loss < prev_best["val_defect_loss"] - 1e-6:
        keep = True
    elif abs(loss - prev_best["val_defect_loss"]) <= 1e-6 and loc <= prev_best["loc"]:
        keep = True
    else:
        keep = False

    if keep:
        status = "keep"
        save_snapshot(film_dir, snap_dir)
        state[s_key] = {"qa_score": score, "val_defect_loss": loss, "loc": loc, "hash": short_hash}
        json.dump(state, open(state_file, "w", encoding="utf-8"), indent=2)
    else:
        status = "discard"
        if not args.no_revert:
            restore_snapshot(film_dir, snap_dir)

    clean_desc = args.desc.replace("\t", " ").replace("\n", " ").strip()
    row = f"{short_hash}\t{args.scene}\t{score:.2f}\t{loss:.6f}\t{colls}\t{ovs}\t{loc}\t{status}\t{clean_desc}\n"
    open(tsv_file, "a", encoding="utf-8").write(row)

    out = {
        "status": status,
        "hash": short_hash,
        "scene": args.scene,
        "qa_score": score,
        "prev_best_score": prev_best["qa_score"] if prev_best else None,
        "val_defect_loss": loss,
        "reverted_to_best": (status == "discard" and not args.no_revert),
        "comparison_strip_jpg": rep.get("comparison_strip_jpg", ""),
        "actionable_fixes": rep.get("actionable_fixes", []),
        "results_tsv": tsv_file,
    }
    print(json.dumps(out, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
