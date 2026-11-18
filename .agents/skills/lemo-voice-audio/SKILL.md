---
name: lemo-voice-audio
description: >-
  Synthesize non-overlapping Vietnamese neural voiceover with OmniVoice (verified
  by faster-whisper), compose style-authentic musical scores using VCSL CC0
  sampled instruments, generate frame-accurate procedural foley from events.json,
  and master films to -14 LUFS / -1 dBTP. Activate whenever building or fixing
  audio, TTS narration, music, foley, or mastering for a lemo-opuscar video.
---

# Lemo Voice, Score & Mastering Skill

## 1. Vietnamese Narration Rules (OmniVoice + Whisper ASR)
- **Spell numbers & symbols out in `say`**: Never feed raw digits like `"50-60%"` or `"1/2"` to `omnivoice-vietnamese`. Write `"năm mươi đến sáu mươi phần trăm"`, `"một nửa"` in `say`, while keeping `"50–60%"`, `"1/2"` in `sub` (subtitles/screen).
- **Valid `instruct` tokens only**: `omnivoice` accepts English voice-design tokens such as `'male, moderate pitch'` or `'female, moderate pitch'`. Free-form Vietnamese `instruct` strings raise `ValueError`.
- **Pace for breathing room**: Total speech duration should be **60–70% of video duration** (e.g., `38–42 s` inside a `60 s` film), enforcing `t0 >= prev_t1 + 0.32 s` and leaving at least two `0.6 s` dramatic silences before the main turn and closing verdict.
- Run [synth_omnivoice.py](./scripts/synth_omnivoice.py) with a JSON cue list:
  `./lemo-opuscar/.venv/Scripts/python.exe .agents/skills/lemo-voice-audio/scripts/synth_omnivoice.py --cues cues.json --out-dir ./lemo-opuscar/master_vo`

## 2. Original Score (`core/audio/sampler.py`) & Foley (`core/audio/sfx.py`)
- Score in the style's `STYLE.md` §7 sound palette using CC0 VCSL instruments (`marimba`, `vibraphone`, `vibraphone_bowed`, `xylophone`, `glockenspiel`, `harp`, `hand_chimes`).
- Compress voice (`sfx.compress(w, thr=0.24, ratio=3.4)`) and duck music `~9.5 dB` (`gain ≈ 0.33`) and foley `~4 dB` under active speech.
- Gate music & ambience to digital zero during the film's planned dramatic silences.

## 3. Broadcast Mastering (`-14.0 LUFS` / True Peak `≤ -1.0 dBTP`)
- Master video + `mix.wav` with [master_mux.py](./scripts/master_mux.py) (wraps `core/render/mux.sh` on Git Bash or runs native two-pass FFmpeg EBU R128 `loudnorm` + 192 kHz oversampled `alimiter` directly on Windows):
  `./lemo-opuscar/.venv/Scripts/python.exe .agents/skills/lemo-voice-audio/scripts/master_mux.py --video video.mp4 --audio mix.wav --out final.mp4 --fps 24 --grain 0`
