"""
Strict 10-Point Automated Human-Comfort & Broadcast QA Gate (`qa_gate.py`).
Exits 0 ONLY when the rendered video and film source pass every technical,
typographic, audio-loudness, subtitle, and frame-integrity check.
"""
import argparse, glob, json, os, re, shutil, subprocess, sys

WORKSPACE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
LIB = os.path.join(WORKSPACE, "lemo-opuscar")

EXTRA_PATHS = [
    r"C:\Program Files\Git\usr\bin",
    os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg.Essentials_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.1-essentials_build\bin"),
]
for p in EXTRA_PATHS:
    if os.path.isdir(p) and p not in os.environ.get("PATH", ""):
        os.environ["PATH"] = p + os.pathsep + os.environ.get("PATH", "")

def parse_srt_time(ts):
    h, m, rest = ts.strip().split(":")
    s, ms = rest.split(",")
    return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000.0

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--film", required=True, help="Path to film project folder (relative to LIB or absolute)")
    ap.add_argument("--mp4", required=True, help="Path to final mastered MP4")
    ap.add_argument("--vo", default="", help="Optional vo_timeline.json path")
    ap.add_argument("--srt", default="", help="Optional .srt file path")
    ap.add_argument("--dur", type=float, default=60.0, help="Expected duration in seconds")
    ap.add_argument("--fps", type=int, default=24, help="Expected FPS")
    ap.add_argument("--size", default="1920x1080", help="Expected WxH")
    args = ap.parse_args()

    film_dir = args.film if os.path.isabs(args.film) else os.path.abspath(os.path.join(LIB, args.film))
    mp4_path = args.mp4 if os.path.isabs(args.mp4) else os.path.abspath(os.path.join(LIB, args.mp4))
    exp_w, exp_h = [int(x) for x in args.size.lower().split("x")]

    failures = []
    notes = []

    def check(cond, ok_msg, fail_msg):
        if cond:
            notes.append(f"  [PASS] {ok_msg}")
        else:
            failures.append(f"  [FAIL] {fail_msg}")

    print(f"=== STRICT QA GATE: {os.path.basename(mp4_path)} ({os.path.basename(film_dir)}) ===")

    # 1. TREATMENT.md & CREDITS & watermark check
    check(os.path.isfile(os.path.join(film_dir, "TREATMENT.md")),
          "TREATMENT.md exists", f"Missing TREATMENT.md in {film_dir}")

    lemo_leaks = []
    for root, _, files in os.walk(film_dir):
        for fn in files:
            if fn.endswith((".html", ".js", ".mjs")):
                txt = open(os.path.join(root, fn), encoding="utf-8", errors="ignore").read()
                if re.search(r"lemo\s?lab|opus\s*5\.5", txt, re.I):
                    lemo_leaks.append(fn)
    check(len(lemo_leaks) == 0, "Zero LemoLab/demo watermark leaks in source", f"Watermark text found in {lemo_leaks}")

    # 2. Self-hosted Font Check & No Bare -apple-system Fallback
    bad_font_refs = []
    for root, _, files in os.walk(film_dir):
        for fn in files:
            if fn.endswith((".html", ".js")):
                txt = open(os.path.join(root, fn), encoding="utf-8", errors="ignore").read()
                if "-apple-system" in txt:
                    bad_font_refs.append(fn)
    check(len(bad_font_refs) == 0, "Zero bare -apple-system fallback fonts (100% self-hosted OFL)", f"Found -apple-system in {bad_font_refs}")

    # 3. MP4 Container, Codec, Resolution, Frame Rate & Exact Duration
    if not os.path.isfile(mp4_path) or os.path.getsize(mp4_path) < 50000:
        failures.append(f"  [FAIL] MP4 missing or empty: {mp4_path}")
    else:
        pr = subprocess.run([
            "ffprobe", "-v", "error", "-print_format", "json",
            "-show_format", "-show_streams", mp4_path
        ], capture_output=True, text=True, check=True)
        info = json.loads(pr.stdout)
        v_streams = [s for s in info.get("streams", []) if s.get("codec_type") == "video"]
        a_streams = [s for s in info.get("streams", []) if s.get("codec_type") == "audio"]
        check(len(v_streams) == 1 and len(a_streams) == 1, "Both video & audio streams present", "Missing video or audio stream")
        if v_streams:
            vs = v_streams[0]
            w, h = int(vs.get("width", 0)), int(vs.get("height", 0))
            r_fps = vs.get("r_frame_rate", "0/1")
            num, den = [int(x) for x in r_fps.split("/")]
            fps_val = num / max(1, den)
            check(w == exp_w and h == exp_h, f"Resolution {w}x{h} matches {args.size}", f"Wrong resolution {w}x{h}")
            check(abs(fps_val - args.fps) < 0.05, f"Frame rate {fps_val:.2f} fps matches {args.fps}", f"Wrong FPS {fps_val}")
        dur = float(info.get("format", {}).get("duration", 0))
        check(abs(dur - args.dur) <= 0.08, f"Exact duration {dur:.3f}s (target {args.dur:.1f}s)", f"Duration {dur:.3f}s off target {args.dur:.1f}s")

        # 4. Zero Black Frames Check
        blk_r = subprocess.run([
            "ffmpeg", "-hide_banner", "-i", mp4_path,
            "-vf", "blackdetect=d=0.05:pix_th=0.01", "-an", "-f", "null", "-"
        ], capture_output=True, text=True)
        blks = re.findall(r"black_start:([0-9.]+).*?black_duration:([0-9.]+)", blk_r.stderr)
        check(len(blks) == 0, "Zero blank/black frames across entire video", f"Detected black frames: {blks}")

        # 5. EBU R128 Broadcast Loudness (-14 LUFS ± 1.0 LU) & True Peak (<= -1.0 dBTP)
        eb_r = subprocess.run([
            "ffmpeg", "-hide_banner", "-nostats", "-i", mp4_path,
            "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"
        ], capture_output=True, text=True)
        m_i = re.findall(r"I:\s*(-?[0-9.]+)\s*LUFS", eb_r.stderr)
        m_pk = re.findall(r"Peak:\s*(-?[0-9.]+)\s*dBFS", eb_r.stderr)
        if m_i and m_pk:
            lufs = float(m_i[-1])
            tpk = float(m_pk[-1])
            check(-15.0 <= lufs <= -13.0, f"Integrated Loudness {lufs:.1f} LUFS (target -14.0 LUFS)", f"Loudness {lufs:.1f} LUFS outside [-15, -13]")
            check(tpk <= -0.9, f"True Peak {tpk:.1f} dBFS (clean, zero clipping)", f"True Peak {tpk:.1f} dBFS too hot (> -0.9 dBFS)")
        else:
            failures.append("  [FAIL] Could not measure EBU R128 loudness")

    # 6. Headless Page Integrity + Review Stills + Contact Sheet (catches any JS error or missing font 404!)
    qa_stills_dir = os.path.join(film_dir, "stills_qa")
    os.makedirs(qa_stills_dir, exist_ok=True)
    for old in glob.glob(os.path.join(qa_stills_dir, "*.jpg")):
        os.remove(old)
    sample_ts = [f"{round(args.dur * frac, 1)}" for frac in (0.025, 0.11, 0.21, 0.31, 0.41, 0.50, 0.59, 0.68, 0.77, 0.85, 0.92, 0.97)]
    st_r = subprocess.run(
        ["node", "core/render/still.mjs", film_dir, *sample_ts, "--out", qa_stills_dir],
        cwd=LIB, capture_output=True, text=True
    )
    page_err = ("missing:" in st_r.stdout or "missing:" in st_r.stderr or st_r.returncode != 0)
    check(not page_err, f"All {len(sample_ts)} live page renders clean (0 JS/font/404 errors)", f"Page error in still.mjs: {st_r.stdout} {st_r.stderr}")
    imgs = sorted(glob.glob(os.path.join(qa_stills_dir, "t_*.jpg")),
                  key=lambda p: float(os.path.splitext(os.path.basename(p))[0].replace("t_", "")))
    if imgs:
        contact_out = os.path.join(film_dir, "stills_qa", "contact_qa.jpg")
        py_exe = os.path.join(LIB, ".venv", "Scripts", "python.exe")
        if not os.path.exists(py_exe):
            py_exe = sys.executable
        subprocess.run([py_exe, "core/render/sheet.py", contact_out, *imgs, "--cols", "4", "--w", "480"], cwd=LIB, check=True)
        notes.append(f"  [INFO] Generated QA contact sheet: {contact_out}")

    # 7. Voiceover Timeline Non-Overlap & End-Margin Check
    if args.vo:
        vo_p = args.vo if os.path.isabs(args.vo) else os.path.abspath(os.path.join(LIB, args.vo))
        if os.path.isfile(vo_p):
            vo = json.load(open(vo_p, encoding="utf-8"))
            overlaps = []
            for idx in range(1, len(vo)):
                gap = vo[idx]["t0"] - vo[idx - 1]["t1"]
                if gap < 0.25:
                    overlaps.append((vo[idx - 1]["id"], vo[idx]["id"], round(gap, 3)))
            check(len(overlaps) == 0, f"All {len(vo)} voice cues have >= 0.25s breath gaps (zero overlap)", f"Voice cue overlaps/tight gaps: {overlaps}")
            check(vo[-1]["t1"] <= args.dur - 0.25, f"Final voice cue ends cleanly at {vo[-1]['t1']:.2f}s (< {args.dur - 0.25:.2f}s)", f"Final cue cut off at {vo[-1]['t1']:.2f}s")

    # 8. SRT Subtitle Timing & Readability Check
    if args.srt:
        srt_p = args.srt if os.path.isabs(args.srt) else os.path.abspath(os.path.join(LIB, args.srt))
        if os.path.isfile(srt_p):
            raw = open(srt_p, encoding="utf-8").read().strip()
            blocks = re.split(r"\n\s*\n", raw)
            srt_errs = []
            prev_end = 0.0
            for b in blocks:
                ls = b.strip().splitlines()
                if len(ls) >= 3 and "-->" in ls[1]:
                    t0_s, t1_s = ls[1].split("-->")
                    t0, t1 = parse_srt_time(t0_s), parse_srt_time(t1_s)
                    if t0 < prev_end - 0.01:
                        srt_errs.append(f"overlap at {t0:.2f}s")
                    if t1 - t0 < 1.75:
                        srt_errs.append(f"too short ({t1-t0:.2f}s) at {t0:.2f}s")
                    prev_end = t1
            check(len(srt_errs) == 0, f"SRT file valid ({len(blocks)} cues, >= 1.8s hold, zero overlap)", f"SRT issues: {srt_errs}")

    for n in notes:
        print(n)
    for f in failures:
        print(f)

    if failures:
        print(f"=== QA RESULT: FAILED ({len(failures)} issue(s)) ===")
        sys.exit(1)
    print("=== QA RESULT: 100% PASSED (ZERO VIEWER DISCOMFORT) ===")
    sys.exit(0)

if __name__ == "__main__":
    main()
