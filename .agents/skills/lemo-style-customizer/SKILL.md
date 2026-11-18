---
name: lemo-style-customizer
description: >-
  Generate a dedicated, standalone Agent Skill (.agents/skills/lemo-style-<slug>/SKILL.md)
  or ready-to-paste Agent CLI prompt tailored to any specific film style in the
  99-style lemo-opuscar catalog, optionally customizing palette, brand accent,
  aspect ratio, and voice settings. Activate when the user wants a custom skill
  for a chosen style or wants to lock a reusable video template.
---

# Lemo Style Customizer Skill

Turns any of the 99 styles in `./lemo-opuscar/styles/<slug>/` into a dedicated, reusable workspace skill so the user or any CLI agent can invoke that exact visual style repeatedly with one command.

## Usage
Run [create_style_skill.py](./scripts/create_style_skill.py):
```powershell
./lemo-opuscar/.venv/Scripts/python.exe .agents/skills/lemo-style-customizer/scripts/create_style_skill.py --slug dark-keynote --accent "#B7F34A" --lang vi --voice omnivoice
```

## What It Generates
Creates `.agents/skills/<skill-name>/SKILL.md` bundling:
1. All visual, typographic, camera, motion, and sound invariants extracted from `lemo-opuscar/styles/<slug>/STYLE.md`.
2. Custom overrides (brand accent hex, aspect ratio `16:9` or `9:16`, default duration, voice engine).
3. Mandatory Vietnamese OFL font staging (`fetch_vn_fonts.py`) and strict zero-defect QA gate (`qa_gate.py`) commands.
