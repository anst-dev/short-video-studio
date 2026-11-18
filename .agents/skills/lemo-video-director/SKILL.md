---
name: lemo-video-director
description: >-
  Direct, build, render, and strictly QA-verify studio-quality code-driven videos
  using any of the 99 styles in the lemo-opuscar repository. Activate whenever the
  user asks to create, remake, or batch-produce short videos, explainers, keynotes,
  infographics, or motion graphics from a script or topic.
---

# Lemo Video Director Skill

End-to-end production runbook for turning any user script or topic into a cinema-grade code-driven film using `./lemo-opuscar` with zero visual or audio defects.

## Step-by-Step Production Workflow

### 1. Environment & Font Preparation
1. Verify Node, FFmpeg 7+, Python `.venv`, VCSL instruments, and headless Chromium:
   `./lemo-opuscar/.venv/Scripts/python.exe .agents/skills/lemo-video-director/scripts/check_env.py`
2. Stage self-hosted OFL fonts with full Vietnamese glyph support into your film folder (`./lemo-opuscar/films/<project>/fonts/`):
   `./lemo-opuscar/.venv/Scripts/python.exe .agents/skills/lemo-video-director/scripts/fetch_vn_fonts.py --dest ./lemo-opuscar/films/<project>/fonts`

### 2. Style Selection & Treatment First
1. Read `./lemo-opuscar/DIRECTOR.md`, `./lemo-opuscar/TECHNIQUE.md`, and the chosen style's `./lemo-opuscar/styles/<slug>/STYLE.md`.
2. **Write `TREATMENT.md` inside `./lemo-opuscar/films/<project>/` BEFORE opening `DEMO.md` or `demo/` code**:
   - 3 candidate structures + chosen structure and why.
   - Logline, `setup → turn → ending` arc, benchmark (learn / don't take).
   - Shot list (at least 4 distinct camera moves + medium-native transitions, zero generic cross-fades).
   - Beat sheet & cue map locked to a steady BPM grid (e.g., `120 BPM` = `0.5 s/beat`, `2.0 s/bar`), with **at least 2 dramatic silences** before key turns/verdicts.
3. Only after `TREATMENT.md` exists, inspect `./lemo-opuscar/styles/<slug>/demo/` to copy/adapt reusable engine modules (`engine.js`, `ease.js`, `draw.js`, etc.). Replace any relative `../../..` imports with `/core/...` root URLs.

### 3. Voice, Music & Foley (`lemo-voice-audio` skill)
- Generate non-overlapping narration (`OmniVoice` for Vietnamese, `Kokoro`/`NeuTTS` for English), verify with `faster-whisper`, compose a style-authentic score with `core/audio/sampler.py`, and synthesize frame-exact foley from `events.json` via `core/audio/sfx.py`.

### 4. Visual Look Check (Before Full Render)
1. Preload all font weights with Vietnamese sample glyphs (`"Team mọi người đã áp dụng AI để giảm được một nửa thời gian..."`) using `document.fonts.load(...)` before setting `window.READY = true`.
2. Render 10–14 review stills across all scenes and build a contact sheet:
   ```powershell
   cd lemo-opuscar
   node core/render/still.mjs films/<project> 1.5 5.5 12.0 18.0 26.0 34.0 41.0 46.0 51.0 55.5 58.5
   .\.venv\Scripts\python.exe core/render/sheet.py films/<project>/stills/contact.jpg films/<project>/stills/t_*.jpg --cols 4 --w 480
   ```
3. Inspect the contact sheet AND full-resolution stills against [strict-qa-rubric.md](./references/strict-qa-rubric.md). Fix any text clipping, label overlap, low contrast, or dead framing immediately.

### 5. Full Render, Mastering & Strict QA Gate
1. Export foley events & render all frames at 24 fps (or style's native fps):
   ```powershell
   node core/render/events.mjs films/<project>
   node core/render/video.mjs films/<project> --fps 24 --workers 4 --out films/<project>/out/video.mp4
   ```
2. Mix audio (`out/mix.wav`) and master to `-14.0 LUFS` / True Peak `≤ -1.0 dBTP` via `core/render/mux.sh` (or `.agents/skills/lemo-voice-audio/scripts/master_mux.py`).
3. **Run the mandatory automated QA Gate**:
   ```powershell
   .\.venv\Scripts\python.exe ../.agents/skills/lemo-video-director/scripts/qa_gate.py --film films/<project> --mp4 ../OUTPUT_VIDEOS/<OutputName>.mp4 --vo master_vo_v2/vo_timeline.json --srt ../OUTPUT_VIDEOS/subtitles_vi.srt
   ```
   **Never deliver a video until `qa_gate.py` exits `0` AND visual inspection of `contact_qa.jpg` shows zero viewer-annoying flaws.**
