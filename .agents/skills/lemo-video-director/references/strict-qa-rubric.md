# Strict Human-Comfort & Broadcast QA Rubric

Every video must pass BOTH automated checks (`qa_gate.py`) and human-eye inspection on full-resolution frames so viewers experience zero visual or auditory annoyance.

## 1. Typography & Readability (Zero Eye Strain)
- **No Font Fallback:** Every `@font-face` must point to a self-hosted `.ttf`/`.woff2` with full Vietnamese diacritics (`ă, â, đ, ê, ô, ơ, ư` + 5 tone marks). Never use bare `-apple-system` or `BlinkMacSystemFont` on Windows/Linux headless Chromium.
- **No Clipped or Overflowing Text:** All text bounding boxes must stay inside safe margins (`x ∈ [60, 1860]`, `y ∈ [36, 1044]`). Subtitles longer than ~55 characters must split into 2 balanced lines.
- **No Label/Pin Collisions:** Leader pins, callouts, and floating badges must point into open negative space—never across faces, numbers, or neighbouring labels.
- **No Redundant Double Reading:** When a scene's hero card already displays the exact spoken sentence in large type (e.g. hook questions or closing verdict), suppress the bottom toast/caption for that cue while keeping it in `.srt`.
- **Contrast & Size:** Body labels meant to be read `≥ 15 px`, headlines `≥ 36 px`, subtitles `25–32 px`, contrast ratio `≥ 4.5:1`.
- **No OS Emojis:** Never draw raw Unicode emojis (`📊`, `🤖`, `🚀`) in Canvas/SVG; draw crisp custom vector icons in the style's palette.

## 2. Motion, Camera & Pacing (Zero Boredom or Whiplash)
- **Authentic Medium Grammar:** Every element must belong to the chosen `STYLE.md` universe (e.g. flat computed cells in `spreadsheet`, 3-tone outline-free solids in `iso-infographic`, cyanotype technical strokes in `blueprint`, grid-snapped flat blocks in `swiss-motion`, 2.5D lit dark panels in `dark-keynote`).
- **Camera Purpose:** At least 4 distinct camera moves (`push`, `pull`, `lateral track`, `perspective tilt`, `scale reveal`) locked to musical beats. No jittery stepped cameras.
- **No Dead Screens:** Even on held reading frames, keep subtle secondary life running (streaming data packets, blinking carets, escapement gear ticks, pulsing status indicators).
- **Medium-Native Transitions:** UI expand/collapse, knife cuts, column unhides, cutaway slides, or `FIG.` rewrites—never lazy cross-dissolves or blank black frames (`blackdetect == 0`).

## 3. Voice, Score & Sound Design (Zero Ear Fatigue)
- **Zero Speech Overlap:** Every cue `i` must satisfy `cue[i].t0 >= cue[i-1].t1 + 0.30 s`, and final speech must finish by `DUR - 0.35 s`.
- **Natural Vietnamese Pronunciation:** All numbers and symbols (`1/2`, `50-60%`, `100%`, `40%`, `3.2×`) must be spelled out in Vietnamese words inside the TTS `say` field and verified with `faster-whisper`.
- **Two Real Silences:** Include at least two short intentional silences (`0.5–0.7 s`) before the main narrative turn and final verdict so subsequent impacts land with weight.
- **Voice Clarity Over Music:** Compress voice dynamics first; duck music `~9–10 dB` and foley `~4 dB` under active speech.
- **Broadcast Loudness:** Integrated loudness `-14.0 ± 1.0 LUFS`, True Peak `≤ -1.0 dBTP`, zero clipping, smooth tail fade-out.
