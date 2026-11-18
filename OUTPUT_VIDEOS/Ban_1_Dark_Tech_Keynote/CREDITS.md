# CREDITS — AI Office Automation Films (v2)

## Voice Synthesis
- Model: `splendor1811/omnivoice-vietnamese` (fine-tuned from `k2-fsa/OmniVoice`, Apache-2.0 License)
  Source: https://huggingface.co/splendor1811/omnivoice-vietnamese
- Audio Tokenizer: `eustlb/higgs-audio-v2-tokenizer` (Apache-2.0 License)
  Source: https://huggingface.co/eustlb/higgs-audio-v2-tokenizer

## Sampled Musical Instruments (`core/audio/sampler.py`)
- Versilian Community Sample Library (VCSL) — Marimba, Vibraphone (Soft Mallets & Bowed), Xylophone, Glockenspiel, Concert Harp, Hand Chimes
  Author: Versilian Studios LLC & contributors
  Licence: CC0 1.0 Universal (Public Domain)
  Source: https://github.com/sgossner/VCSL

## Procedural Sound Effects & Rendering Pipeline
- Synthesized procedurally in code via `core/audio/sfx.py` (numpy / scipy) and rendered deterministically via `lemo-opuscar` (`MIT` License, https://github.com/lemomo-ai/lemo-opuscar).

## Self-Hosted Fonts (SIL Open Font License 1.1)
- **Inter** & **Inter Tight** — Rasmus Andersson (OFL-1.1), https://github.com/google/fonts/tree/main/ofl/inter
- **JetBrains Mono** — JetBrains s.r.o. (OFL-1.1), https://github.com/google/fonts/tree/main/ofl/jetbrainsmono
- **Be Vietnam Pro** — BeGroup / Gabriel Lam, Vietanh Nguyen, Tony Le (OFL-1.1), https://github.com/google/fonts/tree/main/ofl/bevietnampro
