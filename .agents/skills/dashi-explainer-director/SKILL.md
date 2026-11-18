---
name: dashi-explainer-director
description: >-
  Direct, build, render, and QA-verify 15–90s code-driven explainer animations using the 8 styles
  and motion library from `chuspeeism/dashi-animationstyle` (`./dashi-animationstyle`), upgraded for
  Windows headless Chromium, 100% self-hosted Vietnamese OFL fonts, Vietnamese `OmniVoice` narration,
  VCSL music/foley, and `-14 LUFS` EBU R128 broadcast mastering. Activate whenever the user selects a
  `dashi-*` style (`立体卡通`, `黑底科技`, `超现实拼贴`, `复古剪纸`, `复古报刊`, `扁平流程图`, `手绘笔记`, `霓虹赛博`)
  or asks for a Dashi explainer animation.
---

# Dashi AnimationStyle Director Skill (Windows + Vietnamese Studio Edition)

This skill adapts the cloned `./dashi-animationstyle` library (`SKILL.md`, `styles/<风格>/风格卡.md`, `模板.html`, `pipeline/动效部件.js`, `knowledge/`) to run cleanly on Windows with full Vietnamese typography, `OmniVoice` neural narration, VCSL sampled music, and strict `qa_gate.py` verification.

## Available Dashi Styles (`./dashi-animationstyle/styles/`)

| Slug | Folder (`styles/<cn>/`) | Visual Signature |
|---|---|---|
| `dashi-3d-toon` | `立体卡通` | Charcoal `#141518` stage, 5-value glossy 3D objects, magazine split-columns |
| `dashi-dark-gold` | `黑底科技` | Deep navy-black `#05070b`, warm gold hairlines `#e5cf95`, focus-in typography |
| `dashi-surreal-collage` | `超现实拼贴` | Warm grey-beige poster, heavy display headline, central metaphor + hand notes |
| `dashi-retro-papercut` | `复古剪纸` | Multi-layer cut paper on crumpled paper texture, stop-motion stepped bounce |
| `dashi-vintage-press` | `复古报刊` | Multi-column vintage broadsheet diving into deep indigo illustration plates |
| `dashi-flat-flowchart` | `扁平流程图` | Cream `#fcf9ec` base, amber header band `#fbbf2f`, numbered ①②③ horizontal flow |
| `dashi-fountain-notes` | `手绘笔记` | Ivory notebook paper, ink-blue fountain pen stroke-by-stroke + single orange accent |
| `dashi-neon-cyber` | `霓虹赛博` | Night city skyline, scrolling perspective grid, glowing neon tubes & HUD (`实测_Token.html`) |

## Core Reference Docs (Read Before Coding)
1. **Style Card (`风格卡.md`)**: `./dashi-animationstyle/styles/<cn>/风格卡.md` — exact palette (`C`), layout grid, reusable components, transitions, and pitfalls.
2. **Universal Explainer Rules**: `./dashi-animationstyle/knowledge/讲解动画通用规则.md` — minimum font sizes (`>= 48px` body labels, captions clean inside bottom safe zone), contrast ratios, color budget (2 fixed highlight roles `COL_A` / `COL_B`), one clear idea per shot (`1.5–5.0s` per shot).
3. **Motion & Richness Rules**: `./dashi-animationstyle/knowledge/动效和画面变化.md` & `./dashi-animationstyle/pipeline/动效部件.js` — visible visual change every `2–3s`, ambient background motion (`>= 2` moving layers), and `>= 3` distinct transitions rotated across cuts (`fxBefore` / `fxAfter`).

## Critical Adaptation Rules for Windows & Vietnamese (Non-Negotiable)

1. **Replace macOS-Only Chinese Fonts with Self-Hosted Vietnamese OFL Fonts**:
   - The original `dashi` templates reference macOS fonts (`"PingFang SC"`, `"Lantinghei SC"`, `"Hanzipen SC"`, `"Songti SC"`), which do **NOT** exist on Windows and lack Vietnamese diacritics!
   - Stage fonts with:
     `./lemo-opuscar/.venv/Scripts/python.exe .agents/skills/lemo-video-director/scripts/fetch_vn_fonts.py --dest <film_dir>/fonts`
   - Declare `@font-face` in `<style>` (`BeVietnamPro`, `Archivo`, `SpaceGrotesk`, `JBMono`) and `await Promise.all([document.fonts.load('700 48px "BeVietnamPro"', 'Tiếng Việt 50–60%'), ...])` BEFORE setting `window.READY = true` / `window.ready = true`.
   - Wrap Vietnamese sentences by **words** (`str.split(' ')`), NEVER character-by-character (`for (const ch of str)`), because splitting Vietnamese words per character breaks kerning and wraps mid-syllable!

2. **Bridge `window.seek(t)` & `window.render(t)` for Universal Rendering + QA**:
   - Define BOTH `window.render = function(t) { ... }` AND `window.seek = window.render;`, plus `window.DUR = DUR; window.READY = true; window.ready = true;`.
   - That way BOTH `./dashi-animationstyle/pipeline/render.mjs` AND `./lemo-opuscar/core/render/video.mjs` + `qa_gate.py` work seamlessly on your film!
   - Always call `动效.resetCtx(g)` at the start of every frame so `seek(t)` is 100% deterministic (`--check-determinism auto` passes pixel-identically).
   - Respect `?nosub=1` (`const NOSUB = /[?&]nosub=1/.test(location.search);`) so clean posters and external `.srt` exports hide both the subtitle text AND its backing bar.

3. **Audio, Narration & `-14 LUFS` Broadcast Mastering**:
   - Generate non-overlapping Vietnamese narration via `.agents/skills/lemo-voice-audio/scripts/synth_omnivoice.py` (numbers spelled out in `say`, verified with `faster-whisper`, `>= 0.30s` breath gaps).
   - Build `timeline.js` (`window.TL = { duration, cues, shots, marks, highlights, emphasis, ... }`) directly from `vo_timeline.json` timestamps so every keyword pop (`TL.mark(...)`) lands frame-accurately on speech!
   - Layer subtle VCSL score + frame-accurate `sfx.py` foley (`window.EV`) and master to `-14.0 LUFS` / `<= -1.0 dBTP` via `.agents/skills/lemo-voice-audio/scripts/master_mux.py`.

4. **Mandatory Strict QA Gate**:
   - Run `.agents/skills/lemo-video-director/scripts/qa_gate.py` AND visually inspect `stills_qa/contact_qa.jpg` (zero text overflow, zero overlapping callouts, zero black frames, `-14.0 ± 1.0 LUFS`) before delivering to `OUTPUT_VIDEOS/`.
