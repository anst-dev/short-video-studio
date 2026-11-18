#!/usr/bin/env python3
"""
Video Studio Unified CLI (`video_studio_cli.py` / `vstudio`).
Designed for BOTH humans and AI Coding Agents (Antigravity, Claude Code, Codex, Cursor, Gemini CLI).

Commands:
  doctor        Check environment, submodules, Python venv, Node, FFmpeg, VCSL & fonts
  bootstrap     Initialize git submodules, stage Vietnamese OFL fonts & verify dependencies
  styles        List or search all 107 styles (99 lemo-opuscar + 8 dashi-animationstyle)
  style-info    Print full STYLE.md / 风格卡.md specification & template paths for a style
  init-film     Scaffold a ready-to-build film folder (fonts, TREATMENT.md, cues.json, mix.py, index.html)
  tts           Synthesize & Whisper-verify non-overlapping Vietnamese OmniVoice narration
  stills        Render 1080p look-check stills + contact sheet before full render
  build         Run end-to-end production: fonts -> events -> video -> mix -> -14 LUFS master -> poster -> QA gate
  qa            Run standalone 10-point broadcast & viewer-comfort QA gate
  qa-scene      [Beta] Evaluate ONE scene (~1s) with code rules + Canvas/DOM BBox spy + visual comparison strip
  ratchet       [Beta] Karpathy Keep/Discard snapshot ratchet per scene (logs results.tsv, reverts regressions)
  learn-qa      [Beta] Distill QA logs & results.tsv into learned-pitfalls.md & workflows/autoresearch_hints.json
  create-skill  Export a standalone .agents/skills/lemo-style-<slug>/SKILL.md
  ui            Launch the interactive Web UI Studio (http://127.0.0.1:8765)
"""
import argparse, glob, json, os, re, shutil, subprocess, sys

WORKSPACE = os.path.dirname(os.path.abspath(__file__))
LIB = os.path.join(WORKSPACE, "lemo-opuscar")
DASHI = os.path.join(WORKSPACE, "dashi-animationstyle")
SKILLS = os.path.join(WORKSPACE, ".agents", "skills")
DASHI_CAT = os.path.join(WORKSPACE, "studio-ui", "dashi_catalog.json")
OUT_VIDEOS = os.path.join(WORKSPACE, "OUTPUT_VIDEOS")

EXTRA_PATHS = [
    r"C:\Program Files\Git\usr\bin",
    os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg.Essentials_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.1-essentials_build\bin"),
]
for _p in EXTRA_PATHS:
    if os.path.isdir(_p) and _p not in os.environ.get("PATH", ""):
        os.environ["PATH"] = _p + os.pathsep + os.environ.get("PATH", "")


def find_python():
    candidates = [
        os.path.join(LIB, ".venv", "Scripts", "python.exe"),
        os.path.join(LIB, ".venv", "bin", "python"),
        sys.executable,
    ]
    for c in candidates:
        if c and os.path.isfile(c):
            return c
    return sys.executable


PY = find_python()


def load_all_styles():
    items = []
    lemo_cat = os.path.join(LIB, "styleboard", "catalog.json")
    if os.path.isfile(lemo_cat):
        for x in json.load(open(lemo_cat, encoding="utf-8")):
            sjson = os.path.join(LIB, "styles", x["slug"], "style.json")
            needs = []
            if os.path.isfile(sjson):
                try:
                    needs = json.load(open(sjson, encoding="utf-8")).get("needs", [])
                except Exception:
                    pass
            items.append({
                "slug": x["slug"],
                "num": x.get("num", ""),
                "source": "lemo",
                "en": x.get("en", ""),
                "cn": x.get("cn", ""),
                "category": x.get("cat_en", ""),
                "summary": x.get("line", ""),
                "uses": x.get("uses", []),
                "needs_image_gen": "image-generation" in needs,
                "spec_path": os.path.join("lemo-opuscar", "styles", x["slug"], "STYLE.md"),
                "engine_dir": os.path.join("lemo-opuscar", "styles", x["slug"], "demo"),
            })
    if os.path.isfile(DASHI_CAT):
        for d in json.load(open(DASHI_CAT, encoding="utf-8")):
            cn_dir = d["dashi_dir"]
            tpl = "模板.html" if d.get("has_template", True) else d.get("demo_html", "实测_Token.html")
            items.append({
                "slug": d["slug"],
                "num": d.get("num", ""),
                "source": "dashi",
                "dashi_dir": cn_dir,
                "en": d.get("en", ""),
                "cn": d.get("cn", ""),
                "category": d.get("cat_en", ""),
                "summary": d.get("line", ""),
                "uses": d.get("uses", []),
                "needs_image_gen": False,
                "spec_path": os.path.join("dashi-animationstyle", "styles", cn_dir, "风格卡.md"),
                "engine_dir": os.path.join("dashi-animationstyle", "styles", cn_dir),
                "template_file": tpl,
            })
    return items


def cmd_doctor(args):
    chk = os.path.join(SKILLS, "lemo-video-director", "scripts", "check_env.py")
    r = subprocess.run([PY, "-X", "utf8", chk], cwd=WORKSPACE, capture_output=args.json, text=True)
    submodules_ok = os.path.isdir(os.path.join(LIB, "core")) and os.path.isdir(os.path.join(DASHI, "styles"))
    styles = load_all_styles()
    if args.json:
        print(json.dumps({
            "ok": r.returncode == 0 and submodules_ok,
            "python": PY,
            "submodules_ready": submodules_ok,
            "styles_count": len(styles),
            "check_env_output": (r.stdout or "") + (r.stderr or ""),
        }, ensure_ascii=False, indent=2))
    else:
        print(f"[vstudio] Submodules ready: {submodules_ok} | Total styles loaded: {len(styles)} | Python: {PY}")
    sys.exit(0 if (r.returncode == 0 and submodules_ok) else 1)


def cmd_bootstrap(args):
    print("[1/3] Ensuring git submodules (lemo-opuscar & dashi-animationstyle)...", flush=True)
    if not os.path.isdir(os.path.join(LIB, "core")) or not os.path.isdir(os.path.join(DASHI, "styles")):
        subprocess.run(["git", "submodule", "update", "--init", "--recursive"], cwd=WORKSPACE, check=True)
    if not os.path.isdir(os.path.join(LIB, "node_modules")):
        print("[2/3] Installing Node dependencies inside lemo-opuscar...", flush=True)
        subprocess.run(["npm", "ci" if os.path.isfile(os.path.join(LIB, "package-lock.json")) else "install"], cwd=LIB, shell=(os.name == "nt"), check=True)
    print("[3/3] Caching self-hosted Vietnamese OFL fonts...", flush=True)
    fetch_f = os.path.join(SKILLS, "lemo-video-director", "scripts", "fetch_vn_fonts.py")
    subprocess.run([PY, "-X", "utf8", fetch_f, "--dest", os.path.join(WORKSPACE, ".agents", "cache", "fonts")], cwd=WORKSPACE, check=True)
    print("[DONE] Workspace bootstrap complete! Run `python video_studio_cli.py styles` to browse 107 styles.")


def cmd_styles(args):
    styles = load_all_styles()
    if args.source != "all":
        styles = [s for s in styles if s["source"] == args.source]
    if args.pure_code:
        styles = [s for s in styles if not s["needs_image_gen"]]
    if args.search:
        q = args.search.lower()
        styles = [s for s in styles if q in f"{s['slug']} {s['en']} {s['cn']} {s['category']} {s['summary']} {' '.join(s['uses'])}".lower()]

    if args.json:
        print(json.dumps({"count": len(styles), "styles": styles}, ensure_ascii=False, indent=2))
        return

    print(f"=== {len(styles)} VIDEO STYLES AVAILABLE ===")
    for s in styles:
        src_tag = "DASHI" if s["source"] == "dashi" else "LEMO "
        gen_tag = " [needs-image-gen]" if s["needs_image_gen"] else ""
        print(f"  [{src_tag}] #{s['num']:<3} {s['slug']:<24} | {s['en']} ({s['cn']}) — {s['category']}{gen_tag}")


def get_style_detail(slug):
    styles = load_all_styles()
    meta = next((s for s in styles if s["slug"] == slug), None)
    if not meta:
        raise SystemExit(f"Unknown style slug '{slug}'. Run `python video_studio_cli.py styles` to list valid slugs.")
    spec_abs = os.path.join(WORKSPACE, meta["spec_path"])
    spec_text = open(spec_abs, encoding="utf-8").read() if os.path.isfile(spec_abs) else ""
    return {**meta, "spec_markdown": spec_text}


def cmd_style_info(args):
    info = get_style_detail(args.slug)
    if args.json:
        print(json.dumps(info, ensure_ascii=False, indent=2))
        return
    print(f"# Style: {info['en']} ({info['cn']}) — `{info['slug']}`")
    print(f"- Source: {info['source']}")
    print(f"- Category: {info['category']}")
    print(f"- Spec Path: {info['spec_path']}")
    print(f"- Engine/Template Dir: {info['engine_dir']}")
    print("\n" + "=" * 72 + "\n")
    print(info["spec_markdown"])


def scaffold_film(project_name, style_slug, aspect="16:9", duration=60.0):
    pname = re.sub(r"[^a-zA-Z0-9_\-]", "_", project_name.strip())
    info = get_style_detail(style_slug)
    film_dir = os.path.join(LIB, "films", pname)
    os.makedirs(film_dir, exist_ok=True)
    os.makedirs(os.path.join(film_dir, "vo"), exist_ok=True)

    # 1. Stage self-hosted Vietnamese OFL fonts
    fetch_f = os.path.join(SKILLS, "lemo-video-director", "scripts", "fetch_vn_fonts.py")
    subprocess.run([PY, "-X", "utf8", fetch_f, "--dest", os.path.join(film_dir, "fonts")], cwd=WORKSPACE, check=True)

    # Copy Dashi motion helper if Dashi style
    if info["source"] == "dashi":
        shutil.copy2(os.path.join(DASHI, "pipeline", "动效部件.js"), os.path.join(film_dir, "fx_dashi.js"))

    size = "1080x1920" if aspect == "9:16" else "1920x1080"
    w_px, h_px = [int(x) for x in size.split("x")]

    # 2. CREDITS
    credits_p = os.path.join(film_dir, "CREDITS")
    if not os.path.isfile(credits_p):
        open(credits_p, "w", encoding="utf-8").write(
            "Fonts: Inter, Be Vietnam Pro, Archivo, Space Grotesk, JetBrains Mono (SIL OFL 1.1)\n"
            "Instruments: Versilian Community Sample Library (VCSL, CC0 1.0)\n"
            "Voiceover: OmniVoice Vietnamese Neural TTS (Apache-2.0)\n"
        )

    # 3. TREATMENT.md template
    treat_p = os.path.join(film_dir, "TREATMENT.md")
    if not os.path.isfile(treat_p):
        open(treat_p, "w", encoding="utf-8").write(
            f"# TREATMENT — {pname} (`{style_slug}`)\n\n"
            f"- **Style:** `{style_slug}` — {info['en']} ({info['cn']})\n"
            f"- **Spec Read:** `{info['spec_path']}`\n"
            f"- **Target Resolution & Duration:** `{size} @ 24fps` · `{duration}s`\n\n"
            "## 1. Candidate Structures & Chosen Arc\n- Candidate A:\n- Candidate B:\n- Candidate C (CHOSEN):\n\n"
            "## 2. Logline & Setup -> Turn -> Ending\n- Logline:\n\n"
            "## 3. Shot List & Camera / Native Transitions\n1. Shot 1:\n\n"
            "## 4. Sound, 120 BPM Cue Map & >= 2 Dramatic Silences\n- Silence 1:\n- Silence 2:\n"
        )

    # 4. Starter cues.json
    cues_p = os.path.join(film_dir, "cues.json")
    if not os.path.isfile(cues_p):
        sample_cues = [
            {
                "id": "c00",
                "target_t0": 0.7,
                "max_dur": 7.0,
                "speed": 1.08,
                "sub": "Câu mở đầu ngắn gọn, rõ ràng hiển thị trên màn hình.",
                "say": "Câu mở đầu ngắn gọn, viết toàn bộ con số thành chữ tiếng Việt để phát âm chuẩn xác."
            }
        ]
        json.dump(sample_cues, open(cues_p, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

    # 5. Starter mix.py (reads vo/vo_timeline.json + events.json -> out/mix.wav + OUTPUT_VIDEOS/<pname>.srt)
    mix_p = os.path.join(film_dir, "mix.py")
    if not os.path.isfile(mix_p):
        open(mix_p, "w", encoding="utf-8").write(f'''"""Auto-scaffolded VCSL + Foley + OmniVoice mixer for `{pname}`."""
import json, os, sys
import numpy as np
import soundfile as sf
import soxr
from scipy.ndimage import uniform_filter1d

HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.path.abspath(os.path.join(HERE, "..", ".."))
WORKSPACE = os.path.abspath(os.path.join(LIB, ".."))
sys.path.insert(0, LIB)
from core.audio import sampler as S, sfx

SR = sfx.SR

def fmt_srt(sec):
    ms = int(round(sec * 1000))
    h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{{h:02d}}:{{m:02d}}:{{s:02d}},{{ms:03d}}"

def main():
    vo_p = os.path.join(HERE, "vo", "vo_timeline.json")
    ev_p = os.path.join(HERE, "events.json")
    vo = json.load(open(vo_p, encoding="utf-8")) if os.path.isfile(vo_p) else []
    ev_doc = json.load(open(ev_p, encoding="utf-8")) if os.path.isfile(ev_p) else {{"dur": {duration}, "events": []}}
    dur = float(ev_doc.get("dur", {duration}))
    events = ev_doc.get("events", [])

    if vo:
        srt_out = os.path.join(WORKSPACE, "OUTPUT_VIDEOS", "{pname}.srt")
        os.makedirs(os.path.dirname(srt_out), exist_ok=True)
        blocks = []
        for idx, c in enumerate(vo):
            nxt = vo[idx + 1]["t0"] - 0.10 if idx + 1 < len(vo) else dur - 0.15
            c0 = max(0.05, c["t0"] - 0.06)
            c1 = min(nxt, max(c["t1"] + 0.50, c0 + 1.85))
            blocks.append(f"{{idx+1}}\\n{{fmt_srt(c0)}} --> {{fmt_srt(c1)}}\\n{{c['sub']}}")
        open(srt_out, "w", encoding="utf-8").write("\\n\\n".join(blocks) + "\\n")

    n = int(round(dur * SR))
    vo_mono = np.zeros(n, dtype=np.float32)
    mask = np.zeros(n, dtype=np.float32)
    for c in vo:
        w, wsr = sf.read(c["wav"], dtype="float32")
        if w.ndim > 1: w = w.mean(axis=1)
        if wsr != SR: w = soxr.resample(w, wsr, SR)
        w = w * (0.14 / float(np.sqrt(np.mean(w ** 2) + 1e-9)))
        s0 = int(round(c["t0"] * SR)); e0 = min(n, s0 + len(w))
        if e0 > s0:
            vo_mono[s0:e0] += w[:e0 - s0]
            mask[max(0, s0 - int(0.18 * SR)):min(n, e0 + int(0.18 * SR))] = 1.0
    if vo:
        vo_mono = sfx.compress(vo_mono, thr=0.22, ratio=3.4)
    speech_env = uniform_filter1d(mask, size=int(0.28 * SR))

    S.seed(42)
    chords = [("C3", ["G3", "C4", "E4", "G4"]), ("A2", ["E3", "A3", "C4", "E4"]), ("F2", ["C3", "F3", "A3", "C4"]), ("G2", ["D3", "G3", "B3", "D4"])]
    notes = []
    for b in range(int(dur // 2.0)):
        tb = b * 2.0
        if tb > dur - 1.5: break
        bp, tn = chords[b % 4]
        notes += [(tb, "marimba", bp, 0.85, 0.40, -0.18), (tb + 0.5, "vibraphone", tn[1], 1.0, 0.28, 0.2), (tb + 1.0, "marimba", tn[0], 0.8, 0.34, 0.12), (tb + 1.5, "vibraphone", tn[2], 1.0, 0.28, -0.2)]
    music = S.render(notes, dur)
    duck = (1.0 - 0.72 * speech_env) * 0.48
    music[:, 0] *= duck; music[:, 1] *= duck

    sil = np.ones(n, dtype=np.float32)
    for ev in events:
        if ev.get("type") == "silence":
            st, sd = float(ev["t"]), float(ev.get("dur", 0.7))
            sil[max(0, int(st * SR)):min(n, int((st + sd) * SR))] = 0.0
    sil_env = uniform_filter1d(sil, size=int(0.08 * SR))
    music[:, 0] *= sil_env; music[:, 1] *= sil_env

    foley = np.zeros((n, 2), dtype=np.float32)
    for ev in events:
        t, tp = float(ev.get("t", 0)), ev.get("type", "")
        if tp in ("pop", "station_pop"): sfx.add(foley, sfx.pop(0.20), t, gain=0.5)
        elif tp in ("click", "chip_pop", "key_click"): sfx.add(foley, sfx.click(1.2, 0.16), t, gain=0.45)
        elif tp in ("whoosh", "arrow_whoosh"): sfx.add(foley, sfx.whoosh(0.3, 0.18), t, gain=0.45)
        elif tp in ("ding", "stamp_ding", "okr_ding"): sfx.add(foley, sfx.ding(0.24), t, gain=0.55)
    foley *= (1.0 - 0.40 * speech_env)[:, None]

    mix = np.zeros((n, 2), dtype=np.float32)
    mix[:, 0] = sfx.limit(vo_mono * 0.92 + music[:, 0] + foley[:, 0], ceil=0.88)
    mix[:, 1] = sfx.limit(vo_mono * 0.92 + music[:, 1] + foley[:, 1], ceil=0.88)
    os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
    sf.write(os.path.join(HERE, "out", "mix.wav"), mix, SR)
    print(f"[mix.py] Wrote out/mix.wav ({{dur:.2f}}s)", flush=True)

if __name__ == "__main__":
    main()
''')

    # 6. Starter index.html with self-hosted Vietnamese OFL fonts preloaded
    idx_p = os.path.join(film_dir, "index.html")
    if not os.path.isfile(idx_p):
        open(idx_p, "w", encoding="utf-8").write(f'''<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>{pname} — {style_slug}</title>
<style>
@font-face {{ font-family: 'BeVietnamPro'; src: url('./fonts/BeVietnamPro-Regular.ttf') format('truetype'); font-weight: 400; }}
@font-face {{ font-family: 'BeVietnamPro'; src: url('./fonts/BeVietnamPro-Bold.ttf') format('truetype'); font-weight: 600 700; }}
@font-face {{ font-family: 'BeVietnamPro'; src: url('./fonts/BeVietnamPro-ExtraBold.ttf') format('truetype'); font-weight: 800 900; }}
@font-face {{ font-family: 'Inter'; src: url('./fonts/Inter-var.ttf') format('truetype'); font-weight: 100 900; }}
@font-face {{ font-family: 'JBMono'; src: url('./fonts/JetBrainsMono-var.ttf') format('truetype'); font-weight: 100 800; }}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
html, body {{ width: {w_px}px; height: {h_px}px; overflow: hidden; background: #101218; }}
canvas {{ display: block; width: {w_px}px; height: {h_px}px; }}
</style>
</head>
<body>
<canvas id="c" width="{w_px}" height="{h_px}"></canvas>
<script type="module">
// Replace this starter scene with authentic `{style_slug}` engine code per `{info['spec_path']}`!
const W = {w_px}, H = {h_px};
let DUR = {duration};
const cv = document.getElementById('c');
const g = cv.getContext('2d');
const NOSUB = new URLSearchParams(location.search).get('nosub') === '1';
let VO = [];

window.DUR = DUR;
window.EV = [{{ t: 0.2, type: 'pop' }}, {{ t: Math.max(1.0, DUR - 6.0), dur: 0.7, type: 'silence' }}];

window.render = function(t) {{
  g.fillStyle = '#121620';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#EEF1F7';
  g.font = '800 48px "BeVietnamPro"';
  g.textAlign = 'center';
  g.fillText('{pname} ({style_slug}) — t=' + t.toFixed(2) + 's', W / 2, H / 2);
}};
window.seek = window.render;

const SAMPLE_VI = 'Tiếng Việt chuẩn sắc nét 50–60% PCTPR';
Promise.all([
  document.fonts.load('400 24px "BeVietnamPro"', SAMPLE_VI),
  document.fonts.load('700 32px "BeVietnamPro"', SAMPLE_VI),
  document.fonts.load('800 48px "BeVietnamPro"', SAMPLE_VI),
  document.fonts.load('700 20px "JBMono"', SAMPLE_VI),
  fetch('./vo/vo_timeline.json').then(r => r.ok ? r.json() : []).catch(() => []),
]).then(async ([,,,, vo]) => {{
  await document.fonts.ready;
  VO = vo || [];
  window.render(0);
  window.READY = true;
  window.ready = true;
}});
</script>
</body>
</html>
''')

    return {
        "ok": True,
        "project": pname,
        "style": style_slug,
        "film_dir": film_dir,
        "spec_path": os.path.join(WORKSPACE, info["spec_path"]),
        "engine_dir": os.path.join(WORKSPACE, info["engine_dir"]),
        "files_created": ["TREATMENT.md", "cues.json", "mix.py", "index.html", "CREDITS", "fonts/"],
    }


def cmd_init_film(args):
    res = scaffold_film(args.name, args.style, args.aspect, args.dur)
    if args.json:
        print(json.dumps(res, ensure_ascii=False, indent=2))
    else:
        print(f"[init-film] Scaffolded film project -> {res['film_dir']}")
        print(f"  1. Read style spec: {res['spec_path']}")
        print(f"  2. Edit TREATMENT.md & cues.json, then run: python video_studio_cli.py tts --film {res['project']}")
        print(f"  3. Implement authentic visuals in index.html (using engine reference: {res['engine_dir']})")
        print(f"  4. Preview stills: python video_studio_cli.py stills --film {res['project']} --times 2,10,25,45")
        print(f"  5. Render & QA:    python video_studio_cli.py build --film {res['project']} --out OUTPUT_VIDEOS/{res['project']}.mp4 --dur {args.dur}")


def resolve_film_dir(film_arg):
    if os.path.isabs(film_arg) and os.path.isdir(film_arg):
        return film_arg
    for cand in [os.path.join(LIB, "films", film_arg), os.path.join(LIB, film_arg), os.path.join(WORKSPACE, film_arg)]:
        if os.path.isdir(cand):
            return os.path.abspath(cand)
    return os.path.abspath(os.path.join(LIB, "films", film_arg))


def cmd_tts(args):
    film_dir = resolve_film_dir(args.film) if args.film else ""
    cues_p = args.cues or os.path.join(film_dir, "cues.json")
    out_d = args.out_dir or os.path.join(film_dir, "vo")
    script = os.path.join(SKILLS, "lemo-voice-audio", "scripts", "synth_omnivoice.py")
    cmd = [PY, "-X", "utf8", script, "--cues", os.path.abspath(cues_p), "--out-dir", os.path.abspath(out_d), "--instruct", args.instruct]
    if args.force:
        cmd.append("--force")
    subprocess.run(cmd, cwd=WORKSPACE, check=True)


def cmd_stills(args):
    film_dir = resolve_film_dir(args.film)
    times = [t.strip() for t in re.split(r"[,\s]+", args.times.strip()) if t.strip()]
    stills_dir = os.path.join(film_dir, "stills")
    os.makedirs(stills_dir, exist_ok=True)
    subprocess.run(["node", "core/render/still.mjs", film_dir, *times, "--size", args.size, "--out", stills_dir], cwd=LIB, check=True)
    imgs = sorted(glob.glob(os.path.join(stills_dir, "t_*.jpg")),
                  key=lambda p: float(os.path.splitext(os.path.basename(p))[0].replace("t_", "")))
    if imgs:
        contact = os.path.join(stills_dir, "contact_look.jpg")
        subprocess.run([PY, "core/render/sheet.py", contact, *imgs, "--cols", "4", "--w", "480"], cwd=LIB, check=True)
        print(f"[stills] Contact sheet -> {contact}")


def cmd_build(args):
    film_dir = resolve_film_dir(args.film)
    pname = os.path.basename(film_dir)
    vo_default = os.path.join(film_dir, "vo", "vo_timeline.json")
    vo_arg = args.vo or (vo_default if os.path.isfile(vo_default) else "")
    srt_default = os.path.join(OUT_VIDEOS, f"{pname}.srt")
    srt_arg = args.srt or (srt_default if os.path.isfile(srt_default) else "")
    poster_arg = args.poster
    if not poster_arg:
        base_mp4 = os.path.splitext(os.path.basename(args.out))[0]
        poster_name = (base_mp4.replace("Ban_", "Poster_", 1) if base_mp4.startswith("Ban_") else f"Poster_{base_mp4}") + ".jpg"
        poster_arg = os.path.join(OUT_VIDEOS, poster_name)

    pipe = os.path.join(WORKSPACE, "workflows", "run_film_pipeline.py")
    cmd = [
        PY, "-X", "utf8", pipe,
        "--film", film_dir,
        "--out", os.path.abspath(args.out),
        "--poster", os.path.abspath(poster_arg),
        "--fps", str(args.fps),
        "--workers", str(args.workers),
        "--grain", str(args.grain),
        "--size", args.size,
        "--dur", str(args.dur),
    ]
    if vo_arg:
        cmd += ["--vo", vo_arg]
    if srt_arg:
        cmd += ["--srt", srt_arg]
    subprocess.run(cmd, cwd=WORKSPACE, check=True)
    if getattr(args, "beta_qa", False):
        print("[beta-qa] Running post-build Autoresearch scene sweep & knowledge distillation...", flush=True)
        beta_wf = os.path.join(WORKSPACE, "workflows", "autoresearch_video_beta.py")
        bcmd = [PY, "-X", "utf8", beta_wf, "--film", film_dir, "--dur", str(args.dur), "--size", args.size]
        if getattr(args, "ref_film", ""):
            bcmd += ["--ref", resolve_film_dir(args.ref_film)]
        subprocess.run(bcmd, cwd=WORKSPACE, check=False)


def cmd_qa_scene(args):
    film_dir = resolve_film_dir(args.film)
    ev_py = os.path.join(SKILLS, "lemo-autoresearch-qa", "scripts", "eval_scene_qa.py")
    cmd = [
        PY, "-X", "utf8", ev_py,
        "--film", film_dir,
        "--scene", str(args.scene),
        "--t0", str(args.t0),
        "--t1", str(args.t1),
        "--size", args.size,
    ]
    if args.ref:
        cmd += ["--ref", resolve_film_dir(args.ref)]
    if args.json:
        cmd.append("--json")
    subprocess.run(cmd, cwd=WORKSPACE, check=True)


def cmd_ratchet(args):
    film_dir = resolve_film_dir(args.film)
    rt_py = os.path.join(SKILLS, "lemo-autoresearch-qa", "scripts", "snapshot_ratchet.py")
    cmd = [
        PY, "-X", "utf8", rt_py,
        "--film", film_dir,
        "--scene", str(args.scene),
        "--t0", str(args.t0),
        "--t1", str(args.t1),
        "--desc", args.desc,
        "--size", args.size,
    ]
    if args.ref:
        cmd += ["--ref", resolve_film_dir(args.ref)]
    if args.no_revert:
        cmd.append("--no-revert")
    subprocess.run(cmd, cwd=WORKSPACE, check=True)


def cmd_learn_qa(args):
    lr_py = os.path.join(SKILLS, "lemo-autoresearch-qa", "scripts", "learn_from_qa.py")
    subprocess.run([PY, "-X", "utf8", lr_py], cwd=WORKSPACE, check=True)


def cmd_qa(args):
    film_dir = resolve_film_dir(args.film)
    qa_py = os.path.join(SKILLS, "lemo-video-director", "scripts", "qa_gate.py")
    cmd = [
        PY, "-X", "utf8", qa_py,
        "--film", film_dir,
        "--mp4", os.path.abspath(args.mp4),
        "--dur", str(args.dur),
        "--fps", str(args.fps),
        "--size", args.size,
    ]
    if args.vo:
        cmd += ["--vo", os.path.abspath(args.vo)]
    if args.srt:
        cmd += ["--srt", os.path.abspath(args.srt)]
    subprocess.run(cmd, cwd=WORKSPACE, check=True)


def cmd_create_skill(args):
    cs_py = os.path.join(SKILLS, "lemo-style-customizer", "scripts", "create_style_skill.py")
    cmd = [PY, "-X", "utf8", cs_py, "--slug", args.slug, "--aspect", args.aspect, "--voice", args.voice, "--lang", args.lang]
    if args.name:
        cmd += ["--name", args.name]
    if args.accent:
        cmd += ["--accent", args.accent]
    if args.rules:
        cmd += ["--rules", args.rules]
    subprocess.run(cmd, cwd=WORKSPACE, check=True)


def cmd_colab(args):
    cfg_path = os.path.join(WORKSPACE, ".agents", "cache", "colab_worker.json")
    os.makedirs(os.path.dirname(cfg_path), exist_ok=True)
    if args.off:
        if os.path.isfile(cfg_path):
            os.remove(cfg_path)
        print("[colab] Disconnected Google Colab worker (reverted to local CPU/GPU).")
        return

    if args.url:
        url = args.url.strip().rstrip("/")
        tok = args.token.strip()
        import urllib.request
        headers = {"X-Api-Token": tok, "User-Agent": "VideoStudioClient/1.0"}
        try:
            req = urllib.request.Request(f"{url}/health", headers=headers, method="GET")
            with urllib.request.urlopen(req, timeout=8) as r:
                info = json.loads(r.read().decode("utf-8"))
            json.dump({"enabled": True, "url": url, "token": tok, "gpu": info.get("gpu", "")}, open(cfg_path, "w", encoding="utf-8"), indent=2)
            print(f"[colab] CONNECTED! Remote GPU: {info.get('gpu')} -> saved to {cfg_path}")
        except Exception as e:
            json.dump({"enabled": True, "url": url, "token": tok}, open(cfg_path, "w", encoding="utf-8"), indent=2)
            print(f"[colab] Saved endpoint {url}, but health-check failed ({e}). Check if Colab cell is still running.")
        return

    # Status check
    if not os.path.isfile(cfg_path):
        print("[colab] Status: NOT CONFIGURED (using local CPU/GPU). Open `colab/OmniVoice_Colab_GPU_Worker.ipynb` in Google Colab to connect!")
        return
    cfg = json.load(open(cfg_path, encoding="utf-8"))
    import urllib.request
    try:
        req = urllib.request.Request(f"{cfg['url']}/health", headers={"X-Api-Token": cfg.get("token", ""), "User-Agent": "VideoStudioClient/1.0"})
        with urllib.request.urlopen(req, timeout=6) as r:
            info = json.loads(r.read().decode("utf-8"))
        print(f"[colab] Status: ONLINE ({info.get('gpu')}) at {cfg['url']}")
    except Exception as e:
        print(f"[colab] Status: OFFLINE ({e}) at {cfg.get('url')} — will automatically fall back to local CPU.")


def cmd_ui(args):
    srv_py = os.path.join(WORKSPACE, "studio-ui", "server.py")
    subprocess.run([PY, "-X", "utf8", srv_py, "--host", args.host, "--port", str(args.port)], cwd=WORKSPACE, check=True)


def main():
    ap = argparse.ArgumentParser(prog="vstudio", description="Lemo-Opuscar (99) + Dashi-AnimationStyle (8) Unified Video Studio CLI")
    sub = ap.add_subparsers(dest="cmd", required=True)

    p_doc = sub.add_parser("doctor", help="Verify runtime environment, fonts, submodules & tools")
    p_doc.add_argument("--json", action="store_true")
    p_doc.set_defaults(func=cmd_doctor)

    p_boot = sub.add_parser("bootstrap", help="Initialize git submodules, Node packages & Vietnamese OFL fonts")
    p_boot.set_defaults(func=cmd_bootstrap)

    p_st = sub.add_parser("styles", help="List or search all 107 styles")
    p_st.add_argument("--source", choices=["all", "lemo", "dashi"], default="all")
    p_st.add_argument("--search", default="")
    p_st.add_argument("--pure-code", action="store_true")
    p_st.add_argument("--json", action="store_true")
    p_st.set_defaults(func=cmd_styles)

    p_si = sub.add_parser("style-info", help="Print full STYLE.md / 风格卡.md spec for a style")
    p_si.add_argument("slug", help="Style slug (e.g. spreadsheet, dark-keynote, dashi-flat-flowchart)")
    p_si.add_argument("--json", action="store_true")
    p_si.set_defaults(func=cmd_style_info)

    p_init = sub.add_parser("init-film", help="Scaffold a new film project folder with Vietnamese OFL fonts & starter files")
    p_init.add_argument("--name", required=True, help="Project folder name (e.g. my_explainer_v1)")
    p_init.add_argument("--style", required=True, help="Style slug from `styles`")
    p_init.add_argument("--aspect", choices=["16:9", "9:16"], default="16:9")
    p_init.add_argument("--dur", type=float, default=60.0)
    p_init.add_argument("--json", action="store_true")
    p_init.set_defaults(func=cmd_init_film)

    p_tts = sub.add_parser("tts", help="Synthesize & Whisper-verify Vietnamese OmniVoice narration")
    p_tts.add_argument("--film", default="", help="Film project name/path")
    p_tts.add_argument("--cues", default="", help="Path to cues JSON (defaults to <film>/cues.json)")
    p_tts.add_argument("--out-dir", default="", help="Output VO directory (defaults to <film>/vo)")
    p_tts.add_argument("--instruct", default="male, moderate pitch")
    p_tts.add_argument("--force", action="store_true")
    p_tts.set_defaults(func=cmd_tts)

    p_stl = sub.add_parser("stills", help="Render 1080p review stills + contact sheet")
    p_stl.add_argument("--film", required=True)
    p_stl.add_argument("--times", default="1.5,8.0,20.0,35.0,50.0")
    p_stl.add_argument("--size", default="1920x1080")
    p_stl.set_defaults(func=cmd_stills)

    p_bld = sub.add_parser("build", help="End-to-end render + mix + -14 LUFS master + poster + 10-point QA gate")
    p_bld.add_argument("--film", required=True)
    p_bld.add_argument("--out", required=True, help="Output MP4 path (e.g. OUTPUT_VIDEOS/Ban_New.mp4)")
    p_bld.add_argument("--poster", default="")
    p_bld.add_argument("--vo", default="")
    p_bld.add_argument("--srt", default="")
    p_bld.add_argument("--dur", type=float, default=60.0)
    p_bld.add_argument("--fps", type=int, default=24)
    p_bld.add_argument("--workers", type=int, default=4)
    p_bld.add_argument("--grain", type=int, default=0)
    p_bld.add_argument("--size", default="1920x1080")
    p_bld.add_argument("--beta-qa", action="store_true", help="[Beta] Opt-in post-build Autoresearch QA logging & skill update")
    p_bld.add_argument("--ref-film", default="", help="[Beta] Optional reference film for --beta-qa")
    p_bld.set_defaults(func=cmd_build)

    p_qas = sub.add_parser("qa-scene", help="[Beta] Fast (~1s) per-scene code + visual + optional reference QA")
    p_qas.add_argument("--film", required=True)
    p_qas.add_argument("--ref", default="", help="Optional reference film project (e.g. Carbon reference)")
    p_qas.add_argument("--scene", type=int, default=0)
    p_qas.add_argument("--t0", type=float, required=True)
    p_qas.add_argument("--t1", type=float, required=True)
    p_qas.add_argument("--size", default="1920x1080")
    p_qas.add_argument("--json", action="store_true")
    p_qas.set_defaults(func=cmd_qa_scene)

    p_rat = sub.add_parser("ratchet", help="[Beta] Karpathy Keep/Discard per-scene snapshot ratchet + results.tsv")
    p_rat.add_argument("--film", required=True)
    p_rat.add_argument("--ref", default="", help="Optional reference film project")
    p_rat.add_argument("--scene", type=int, required=True)
    p_rat.add_argument("--t0", type=float, required=True)
    p_rat.add_argument("--t1", type=float, required=True)
    p_rat.add_argument("--desc", required=True, help="Short description of this micro-fix")
    p_rat.add_argument("--size", default="1920x1080")
    p_rat.add_argument("--no-revert", action="store_true")
    p_rat.set_defaults(func=cmd_ratchet)

    p_lrn = sub.add_parser("learn-qa", help="[Beta] Distill QA telemetry & results.tsv into learned-pitfalls.md")
    p_lrn.set_defaults(func=cmd_learn_qa)

    p_qa = sub.add_parser("qa", help="Run standalone 10-point Strict QA Gate on a rendered video")
    p_qa.add_argument("--film", required=True)
    p_qa.add_argument("--mp4", required=True)
    p_qa.add_argument("--vo", default="")
    p_qa.add_argument("--srt", default="")
    p_qa.add_argument("--dur", type=float, default=60.0)
    p_qa.add_argument("--fps", type=int, default=24)
    p_qa.add_argument("--size", default="1920x1080")
    p_qa.set_defaults(func=cmd_qa)

    p_sk = sub.add_parser("create-skill", help="Generate a dedicated .agents/skills/lemo-style-<slug>/SKILL.md")
    p_sk.add_argument("--slug", required=True)
    p_sk.add_argument("--name", default="")
    p_sk.add_argument("--accent", default="")
    p_sk.add_argument("--aspect", choices=["16:9", "9:16"], default="16:9")
    p_sk.add_argument("--voice", default="omnivoice")
    p_sk.add_argument("--lang", default="vi")
    p_sk.add_argument("--rules", default="")
    p_sk.set_defaults(func=cmd_create_skill)

    p_col = sub.add_parser("colab", help="Connect, check, or disconnect free Google Colab T4 GPU TTS worker")
    p_col.add_argument("--url", default="", help="Cloudflare HTTPS URL printed by OmniVoice_Colab_GPU_Worker.ipynb")
    p_col.add_argument("--token", default="", help="API token printed by OmniVoice_Colab_GPU_Worker.ipynb")
    p_col.add_argument("--status", action="store_true", help="Check live Colab GPU worker status")
    p_col.add_argument("--off", action="store_true", help="Disconnect Colab worker and use local CPU/GPU")
    p_col.set_defaults(func=cmd_colab)

    p_ui = sub.add_parser("ui", help="Start the interactive 107-style Web UI Studio")
    p_ui.add_argument("--host", default="127.0.0.1")
    p_ui.add_argument("--port", type=int, default=8765)
    p_ui.set_defaults(func=cmd_ui)

    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
