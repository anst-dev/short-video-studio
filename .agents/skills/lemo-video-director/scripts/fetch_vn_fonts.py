"""Download and stage OFL Google Fonts with full Vietnamese glyph support."""
import argparse, os, shutil, subprocess

WORKSPACE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
CACHE_DIR = os.path.join(WORKSPACE, ".agents", "cache", "fonts")

FONT_URLS = {
    "Inter-var.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf",
    "InterTight-var.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/intertight/InterTight%5Bwght%5D.ttf",
    "JetBrainsMono-var.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf",
    "SpaceGrotesk-var.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/spacegrotesk/SpaceGrotesk%5Bwght%5D.ttf",
    "Archivo-var.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/archivo/Archivo%5Bwdth%2Cwght%5D.ttf",
    "BeVietnamPro-Regular.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/bevietnampro/BeVietnamPro-Regular.ttf",
    "BeVietnamPro-Medium.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/bevietnampro/BeVietnamPro-Medium.ttf",
    "BeVietnamPro-Bold.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/bevietnampro/BeVietnamPro-Bold.ttf",
    "BeVietnamPro-ExtraBold.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/bevietnampro/BeVietnamPro-ExtraBold.ttf",
    "PatrickHand-Regular.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/patrickhand/PatrickHand-Regular.ttf",
}

def ensure_cached():
    os.makedirs(CACHE_DIR, exist_ok=True)
    # Reuse existing film fonts if already downloaded locally
    seed_dir = os.path.join(WORKSPACE, "lemo-opuscar", "films", "v2_dark_keynote", "fonts")
    for fname, url in FONT_URLS.items():
        dest = os.path.join(CACHE_DIR, fname)
        if os.path.exists(dest) and os.path.getsize(dest) > 10000:
            continue
        seed_f = os.path.join(seed_dir, fname)
        if os.path.exists(seed_f) and os.path.getsize(seed_f) > 10000:
            shutil.copy2(seed_f, dest)
            continue
        curl = "curl.exe" if os.name == "nt" else "curl"
        print(f"[fetch_vn_fonts] Downloading {fname}...")
        subprocess.run([curl, "-L", "--fail", "-sS", "-o", dest, url], check=True)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dest", required=True, help="Target fonts/ directory inside film folder")
    args = ap.parse_args()
    ensure_cached()
    os.makedirs(args.dest, exist_ok=True)
    for fname in FONT_URLS:
        shutil.copy2(os.path.join(CACHE_DIR, fname), os.path.join(args.dest, fname))
    print(f"[fetch_vn_fonts] Staged {len(FONT_URLS)} Vietnamese OFL font files -> {args.dest}")

if __name__ == "__main__":
    main()
