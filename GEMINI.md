# Lemo-Opuscar & Dashi-AnimationStyle Video Studio Rules

This workspace produces broadcast-grade code-driven short films and explainer animations (15–90 s) powered by **107 styles** across two local libraries (`./lemo-opuscar` — 99 styles, and `./dashi-animationstyle` — 8 styles), local Vietnamese neural TTS (`OmniVoice` / `NeuTTS`), CC0 sampled instruments (`VCSL`), and an interactive Style, Demo & Prompt Studio (`./studio-ui`).

## Core Directories
- `./lemo-opuscar/` — Cloned 99-style library (`AGENTS.md`, `DIRECTOR.md`, `TECHNIQUE.md`, `core/`, `styles/<slug>/STYLE.md`). Never edit files inside `core/` or `styles/`.
- `./dashi-animationstyle/` — Cloned 8-style explainer animation library (`SKILL.md`, `styles/<风格>/风格卡.md`, `模板.html`, `pipeline/动效部件.js`, `knowledge/`). Never edit upstream files inside `styles/` or `pipeline/`.
- `./.agents/skills/` — Workspace skills automatically discovered by Agent CLIs:
  - `lemo-video-director` — End-to-end directing, engine usage, Vietnamese font hosting, rendering, and strict QA validation.
  - `dashi-explainer-director` — Windows + Vietnamese adaptation for all 8 `dashi-animationstyle` styles (`window.seek`/`window.render` bridge, `动效部件.js` transitions, Vietnamese OFL fonts).
  - `lemo-voice-audio` — Vietnamese `OmniVoice` synthesis, Whisper ASR verification, VCSL sampled scoring, procedural foley, and `-14 LUFS` EBU R128 mastering.
  - `lemo-style-customizer` — Generates dedicated single-style skills (`lemo-style-<slug>`) from any of the **107** styles (`99 lemo-opuscar + 8 dashi`).
- `./workflows/` — Automated single-film (`run_film_pipeline.py`) and multi-style (`produce_multi_style.py`) production workflows.
- `./studio-ui/` — Web UI (`python studio-ui/server.py`, port `8765`) for browsing & watching demo videos of all **107 styles**, generating ready-to-paste Agent CLI prompts, and exporting custom skills.
- `./OUTPUT_VIDEOS/` — Final mastered `.mp4` videos, `.jpg` posters, `subtitles_vi.srt`, and `CREDITS.md`.

## Non-Negotiable Quality Standards (Zero Viewer Discomfort)
1. **Never bypass `STYLE.md` / `风格卡.md` or fake a style with generic PowerPoint cards.** Read the full style specification first, write `TREATMENT.md`, and use the style's authentic rendering grammar/template.
2. **100% Self-Hosted Vietnamese OFL Fonts.** Never rely on `-apple-system` or macOS-only `PingFang SC`/`Lantinghei SC` fallbacks (which break Vietnamese diacritics on Windows headless Chromium). Load self-hosted `.ttf`/`.woff2` (`Inter`, `Inter Tight`, `Be Vietnam Pro`, `Archivo`, `Space Grotesk`, `JetBrains Mono`) via `document.fonts.load(...)` with Vietnamese test glyphs before setting `window.READY = true`.
3. **Zero Text Overflow, Zero Element Collision, Zero Redundant Double-Text.** Wrap Vietnamese text by words (`split(' ')`), keep captions within safe margins (`x ∈ [80, 1840]`), never overlap callout pins with subjects, and suppress bottom captions on frames where the exact spoken sentence is already the giant hero headline.
4. **Zero Voice Overlap & Phonetic Number Normalization.** Spell numbers out in Vietnamese TTS `say` text (`50-60%` → `"năm mươi đến sáu mươi phần trăm"`), verify with `faster-whisper`, enforce `≥ 0.30 s` breath gaps between cues, include dramatic silences, and finish speech before `DUR - 0.35 s`.
5. **Mandatory Automated + Visual QA Gate.** Every rendered video MUST pass `.agents/skills/lemo-video-director/scripts/qa_gate.py` (`0` page/font errors, `0` black frames, `-14.0 ± 1.0 LUFS`, True Peak `≤ -1.0 dBTP`, `0` watermark leaks) AND contact-sheet visual inspection before delivery.
