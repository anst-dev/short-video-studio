"""Cross-platform two-pass -14 LUFS EBU R128 + -1.2 dBTP true-peak muxer."""
import argparse, json, os, re, shutil, subprocess, sys

WORKSPACE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
LIB = os.path.join(WORKSPACE, "lemo-opuscar")

EXTRA_PATHS = [
    r"C:\Program Files\Git\usr\bin",
    os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg.Essentials_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.1-essentials_build\bin"),
]
for p in EXTRA_PATHS:
    if os.path.isdir(p) and p not in os.environ.get("PATH", ""):
        os.environ["PATH"] = p + os.pathsep + os.environ.get("PATH", "")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True)
    ap.add_argument("--audio", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--fps", type=int, default=24)
    ap.add_argument("--grain", type=int, default=0)
    args = ap.parse_args()

    sh = shutil.which("sh")
    mux_sh = os.path.join(LIB, "core", "render", "mux.sh")
    if sh and os.path.isfile(mux_sh):
        env = os.environ.copy()
        env["LEMO_COLOR"] = "bt709"
        r = subprocess.run([sh, mux_sh, os.path.abspath(args.video), os.path.abspath(args.audio), os.path.abspath(args.out), str(args.fps), str(args.grain)], cwd=LIB, env=env)
        sys.exit(r.returncode)

    # Pure Python + FFmpeg fallback when POSIX sh is absent
    p1 = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", args.audio, "-af", "loudnorm=I=-14:TP=-1.2:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True, check=True)
    m = re.search(r"\{[\s\S]*?\}", p1.stderr)
    j = json.loads(m.group(0))
    ln = f"loudnorm=I=-14:TP=-1.2:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true"
    lim = f"aresample=192000,alimiter=limit={10**(-1.6/20):.4f}:attack=10:release=200:level=disabled:latency=1,aresample=48000"
    vf = f"fps={args.fps}" + (f",noise=c0s={args.grain}:allf=t" if args.grain > 0 else "") + ",scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p"
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error", "-i", args.video, "-i", args.audio,
        "-filter_complex", f"[0:v]{vf}[v];[1:a]{ln},{lim}[a]",
        "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "slow", "-crf", "19",
        "-r", str(args.fps), "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", "-shortest", args.out
    ], check=True)
    print(f"[master_mux] Mastered -> {args.out}")

if __name__ == "__main__":
    main()
