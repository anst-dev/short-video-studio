"""Verify system & repo prerequisites for lemo-opuscar video production."""
import os, shutil, subprocess, sys

WORKSPACE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
LIB = os.path.join(WORKSPACE, "lemo-opuscar")

# Ensure Windows WinGet FFmpeg & Git Bash sh are discoverable if installed
EXTRA_PATHS = [
    r"C:\Program Files\Git\usr\bin",
    os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg.Essentials_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.1-essentials_build\bin"),
]
for p in EXTRA_PATHS:
    if os.path.isdir(p) and p not in os.environ.get("PATH", ""):
        os.environ["PATH"] = p + os.pathsep + os.environ.get("PATH", "")

def main():
    ok = True
    print(f"[check_env] Workspace: {WORKSPACE}")
    print(f"[check_env] Library  : {LIB} ({'OK' if os.path.isdir(LIB) else 'MISSING'})")
    if not os.path.isdir(LIB):
        ok = False

    for cmd in ["node", "ffmpeg", "ffprobe"]:
        path = shutil.which(cmd)
        print(f"[check_env] {cmd:8s} : {path or 'MISSING'}")
        if not path:
            ok = False

    sh_path = shutil.which("sh")
    print(f"[check_env] sh       : {sh_path or 'optional (master_mux.py fallback available)'}")

    vcsl = os.path.join(LIB, "core", "audio", "instruments", "vcsl")
    print(f"[check_env] VCSL CC0 : {'OK' if os.path.isdir(vcsl) else 'MISSING (auto-downloadable)'}")

    for pkg in ["numpy", "scipy", "soundfile", "soxr", "PIL", "faster_whisper", "omnivoice"]:
        try:
            __import__(pkg)
            print(f"[check_env] py:{pkg:14s}: OK")
        except ImportError:
            print(f"[check_env] py:{pkg:14s}: NOT INSTALLED")
            if pkg in ("numpy", "scipy", "soundfile", "soxr", "PIL"):
                ok = False

    sys.exit(0 if ok else 1)

if __name__ == "__main__":
    main()
