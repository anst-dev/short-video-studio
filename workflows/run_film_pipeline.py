"""
Universal CLI Pipeline Runner (`workflows/run_film_pipeline.py`).
Runs the complete production & strict QA lifecycle for a single film folder:
  1. Stage Vietnamese OFL fonts (`fetch_vn_fonts.py`)
  2. Export deterministic foley events (`core/render/events.mjs`)
  3. Render review stills & contact sheet (`still.mjs` + `sheet.py`)
  4. Render full video (`core/render/video.mjs`)
  5. Run custom `mix.py` if present in the film folder
  6. Master to -14.0 LUFS / <= -1.0 dBTP (`master_mux.py`)
  7. Render clean poster (`?nosub=1`)
  8. Enforce 10-point Strict QA Gate (`qa_gate.py`)
"""
import argparse, os, shutil, subprocess, sys

WORKSPACE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
LIB = os.path.join(WORKSPACE, "lemo-opuscar")
PY = os.path.join(LIB, ".venv", "Scripts", "python.exe")
if not os.path.exists(PY):
    PY = sys.executable

EXTRA_PATHS = [
    r"C:\Program Files\Git\usr\bin",
    os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg.Essentials_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.1-essentials_build\bin"),
]
for p in EXTRA_PATHS:
    if os.path.isdir(p) and p not in os.environ.get("PATH", ""):
        os.environ["PATH"] = p + os.pathsep + os.environ.get("PATH", "")

def run(cmd, cwd=LIB):
    print(">>", " ".join(str(x) for x in cmd), flush=True)
    subprocess.run(cmd, cwd=cwd, check=True)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--film", required=True, help="Film folder (e.g. films/v2_swiss_motion)")
    ap.add_argument("--out", required=True, help="Final output MP4 path")
    ap.add_argument("--poster", default="", help="Optional poster JPG output path")
    ap.add_argument("--vo", default="master_vo_v2/vo_timeline.json")
    ap.add_argument("--srt", default="../OUTPUT_VIDEOS/subtitles_vi.srt")
    ap.add_argument("--fps", type=int, default=24)
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--grain", type=int, default=0)
    ap.add_argument("--size", default="1920x1080")
    ap.add_argument("--dur", type=float, default=60.0)
    args = ap.parse_args()

    film_abs = args.film if os.path.isabs(args.film) else os.path.abspath(os.path.join(LIB, args.film))
    out_abs = args.out if os.path.isabs(args.out) else os.path.abspath(os.path.join(WORKSPACE, args.out))

    # 1. Fonts
    run([PY, os.path.join(WORKSPACE, ".agents/skills/lemo-video-director/scripts/fetch_vn_fonts.py"),
         "--dest", os.path.join(film_abs, "fonts")])

    # 2. Events
    run(["node", "core/render/events.mjs", film_abs, "--size", args.size])

    # 3. Full Video Render
    raw_vid = os.path.join(film_abs, "out", "video.mp4")
    run(["node", "core/render/video.mjs", film_abs, "--size", args.size, "--fps", str(args.fps),
         "--workers", str(args.workers), "--out", raw_vid])

    # 4. Audio Mix (if film has mix.py)
    mix_py = os.path.join(film_abs, "mix.py")
    mix_wav = os.path.join(film_abs, "out", "mix.wav")
    if os.path.isfile(mix_py):
        run([PY, "-X", "utf8", mix_py])

    # 5. Two-Pass -14 LUFS Broadcast Mux
    run([PY, os.path.join(WORKSPACE, ".agents/skills/lemo-voice-audio/scripts/master_mux.py"),
         "--video", raw_vid, "--audio", mix_wav, "--out", out_abs,
         "--fps", str(args.fps), "--grain", str(args.grain)])

    # 6. Clean Poster
    if args.poster:
        poster_abs = args.poster if os.path.isabs(args.poster) else os.path.abspath(os.path.join(WORKSPACE, args.poster))
        pt = f"{max(1.5, args.dur - 4.0):.1f}"
        run(["node", "core/render/still.mjs", film_abs, pt, "--size", args.size, "--q", "nosub=1", "--prefix", "poster_"])
        shutil.copy2(os.path.join(film_abs, "stills", f"poster_{pt}.jpg"), poster_abs)

    # 7. Mandatory Strict QA Gate
    run([PY, os.path.join(WORKSPACE, ".agents/skills/lemo-video-director/scripts/qa_gate.py"),
         "--film", film_abs, "--mp4", out_abs, "--vo", args.vo, "--srt", args.srt,
         "--dur", str(args.dur), "--fps", str(args.fps), "--size", args.size])

if __name__ == "__main__":
    main()
