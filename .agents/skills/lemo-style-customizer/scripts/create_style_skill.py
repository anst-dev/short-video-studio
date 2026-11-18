"""Create a standalone Agent Skill (.agents/skills/<name>/SKILL.md) from any lemo-opuscar (99) or dashi-animationstyle (8) style."""
import argparse, json, os, re

WORKSPACE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
LIB = os.path.join(WORKSPACE, "lemo-opuscar")
DASHI = os.path.join(WORKSPACE, "dashi-animationstyle")
DASHI_CAT = os.path.join(WORKSPACE, "studio-ui", "dashi_catalog.json")
SKILLS_ROOT = os.path.join(WORKSPACE, ".agents", "skills")


def generate_skill_markdown(slug, skill_name="", accent="", aspect="16:9", voice="omnivoice", lang="vi", extra_rules=""):
    cat_path = os.path.join(LIB, "styleboard", "catalog.json")
    catalog = json.load(open(cat_path, encoding="utf-8"))
    dashi_list = json.load(open(DASHI_CAT, encoding="utf-8")) if os.path.isfile(DASHI_CAT) else []

    sname = skill_name.strip() or f"lemo-style-{slug}"
    sname = re.sub(r"[^a-z0-9-]", "-", sname.lower()).strip("-")
    size = "1080x1920" if aspect == "9:16" else "1920x1080"
    accent_line = f"- **Custom Brand Accent Override:** `{accent}`\n" if accent else ""
    extra_block = f"\n## Custom Brand & Project Rules\n{extra_rules.strip()}\n" if extra_rules.strip() else ""

    # Case A: Dashi AnimationStyle (8 styles)
    dmeta = next((item for item in dashi_list if item["slug"] == slug), None)
    if dmeta:
        cn_dir = dmeta["dashi_dir"]
        card_path = os.path.join(DASHI, "styles", cn_dir, "风格卡.md")
        style_md = open(card_path, encoding="utf-8").read()
        tpl_file = "模板.html" if dmeta.get("has_template", True) else dmeta.get("demo_html", "实测_Token.html")
        content = f"""---
name: {sname}
description: >-
  Direct and produce broadcast-grade code-driven explainer videos in the "{dmeta['en']}"
  ({dmeta['cn']}) style from dashi-animationstyle (`dashi-animationstyle/styles/{cn_dir}`).
  Activate whenever the user asks for a video in {dmeta['en']} / {slug} / {dmeta['cn']} style or invokes {sname}.
---

# Dedicated Video Skill: Dashi · {dmeta['en']} (`{slug}` / `{dmeta['cn']}`)

- **Source Library:** `dashi-animationstyle` (`./dashi-animationstyle/styles/{cn_dir}/`)
- **Category:** {dmeta['cat_en']} ({dmeta['cat']})
- **Default Resolution:** `{size}` (`{aspect}`) @ 24 fps
- **Default Language & Voice:** `{lang}` · `{voice}`
{accent_line}- **Style Card (`风格卡.md`):** `./dashi-animationstyle/styles/{cn_dir}/风格卡.md`
- **Base HTML/Canvas Template:** `./dashi-animationstyle/styles/{cn_dir}/{tpl_file}` + `./dashi-animationstyle/pipeline/动效部件.js`
- **Core Companion Skills:** `.agents/skills/dashi-explainer-director/SKILL.md` & `.agents/skills/lemo-voice-audio/SKILL.md`
{extra_block}
## Mandatory Production Checklist (Windows + Vietnamese Broadcast QA)
1. **Stage Self-Hosted Vietnamese OFL Fonts** (replace macOS `PingFang SC`/`Lantinghei SC` with self-hosted `BeVietnamPro`, `Archivo`, `SpaceGrotesk`, `JBMono`):
   `./lemo-opuscar/.venv/Scripts/python.exe .agents/skills/lemo-video-director/scripts/fetch_vn_fonts.py --dest ./lemo-opuscar/films/<project>/fonts`
2. **Write `TREATMENT.md` & Shot/Change Plan first** inside `./lemo-opuscar/films/<project>/` (visible motion every 2–3s, >= 2 moving background layers, >= 3 distinct transitions via `动效部件.js`, 2 fixed highlight colors `COL_A` / `COL_B`).
3. **Synthesize & Whisper-Verify Voiceover** (spell out numbers in Vietnamese `say` text, enforce `>= 0.30s` breath gaps, zero overlap):
   Use `.agents/skills/lemo-voice-audio/scripts/synth_omnivoice.py` and map `window.TL` directly from `vo_timeline.json`.
4. **Build Authentic `{dmeta['cn']}` Visuals**: Copy `pipeline/动效部件.js`, adapt `styles/{cn_dir}/{tpl_file}`, wrap Vietnamese text by words (`split(' ')`), call `动效.resetCtx(g)` every frame, and expose both `window.render = (t) => ...` and `window.seek = window.render` + `window.READY = true`.
5. **Render, Score, Foley & Master (`-14.0 LUFS`)**:
   Use `workflows/run_film_pipeline.py` (or `video.mjs` + `master_mux.py`) and pass `.agents/skills/lemo-video-director/scripts/qa_gate.py` (exit `0` + clean visual contact sheet).

---

## Original Style Card (`dashi-animationstyle/styles/{cn_dir}/风格卡.md`)

{style_md}
"""
        return sname, content

    # Case B: Lemo-Opuscar (99 styles)
    meta = next((item for item in catalog if item["slug"] == slug), None)
    if not meta:
        raise ValueError(f"Unknown style slug: {slug}")

    style_md_path = os.path.join(LIB, "styles", slug, "STYLE.md")
    style_md = open(style_md_path, encoding="utf-8").read()

    content = f"""---
name: {sname}
description: >-
  Direct and produce broadcast-grade code-driven videos in the "{meta['en']}"
  ({meta['cn']}) style from lemo-opuscar (`styles/{slug}`). Activate whenever
  the user asks for a video in {meta['en']} / {slug} style or invokes {sname}.
---

# Dedicated Video Skill: {meta['en']} (`{slug}`)

- **Source Library:** `lemo-opuscar` (`./lemo-opuscar/styles/{slug}/`)
- **Category:** {meta['cat_en']} ({meta['cat']})
- **Default Resolution:** `{size}` (`{aspect}`) @ 24 fps
- **Default Language & Voice:** `{lang}` · `{voice}`
{accent_line}- **Style Source:** `./lemo-opuscar/styles/{slug}/STYLE.md`
- **Engine Reference (read ONLY after writing TREATMENT.md):** `./lemo-opuscar/styles/{slug}/demo/`
{extra_block}
## Mandatory Production Checklist
1. **Stage Self-Hosted Vietnamese OFL Fonts** (never use `-apple-system`):
   `./lemo-opuscar/.venv/Scripts/python.exe .agents/skills/lemo-video-director/scripts/fetch_vn_fonts.py --dest ./lemo-opuscar/films/<project>/fonts`
2. **Write `TREATMENT.md` first** inside `./lemo-opuscar/films/<project>/` (3 candidate structures, logline, shot list with >= 4 camera moves, 120 BPM cue map, >= 2 dramatic silences).
3. **Synthesize & Whisper-Verify Voiceover** (spell out all numbers in Vietnamese `say` text, enforce `>= 0.32s` breath gaps, zero overlap):
   Use `.agents/skills/lemo-voice-audio/scripts/synth_omnivoice.py`.
4. **Build Authentic `{slug}` Visuals**: Follow every invariant in the Style Specification below. Preload fonts via `document.fonts.load(...)` before `window.READY = true`.
5. **Look Check Before Full Render**: Render 10+ stills with `node core/render/still.mjs` and tile with `core/render/sheet.py`; inspect full-res frames for any clipping or overlap.
6. **Render, Score, Foley & Master (`-14.0 LUFS`)**:
   - `node core/render/events.mjs films/<project>`
   - `node core/render/video.mjs films/<project> --size {size} --fps 24 --workers 4 --out films/<project>/out/video.mp4`
   - Compose VCSL score + frame-exact `sfx.py` foley -> `out/mix.wav`
   - Master with `.agents/skills/lemo-voice-audio/scripts/master_mux.py`
7. **Pass Mandatory QA Gate** (must exit `0` before delivery):
   `./lemo-opuscar/.venv/Scripts/python.exe .agents/skills/lemo-video-director/scripts/qa_gate.py --film films/<project> --mp4 ../OUTPUT_VIDEOS/<Out>.mp4 --size {size}`

---

## Style Specification (`styles/{slug}/STYLE.md`)

{style_md}
"""
    return sname, content


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug", required=True)
    ap.add_argument("--name", default="")
    ap.add_argument("--accent", default="")
    ap.add_argument("--aspect", default="16:9", choices=["16:9", "9:16"])
    ap.add_argument("--voice", default="omnivoice")
    ap.add_argument("--lang", default="vi")
    ap.add_argument("--rules", default="")
    args = ap.parse_args()

    sname, md = generate_skill_markdown(args.slug, args.name, args.accent, args.aspect, args.voice, args.lang, args.rules)
    out_dir = os.path.join(SKILLS_ROOT, sname)
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "SKILL.md")
    open(out_file, "w", encoding="utf-8").write(md)
    print(f"[create_style_skill] Created skill '{sname}' -> {out_file}")


if __name__ == "__main__":
    main()
