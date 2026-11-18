# Learned Weak-Model Pitfalls & Autoresearch Remedies (Auto-Updated)

> Initialized baseline · Auto-updated by `scripts/learn_from_qa.py` after every Beta Autoresearch QA session.

## Core Prevention Rules For Lighter Reasoning Models
1. **`TEXT_COLLISION`**: Never draw long Vietnamese sentences in a narrow card without word-wrapping (`split(' ')`). Step line `Y` by `>= fontSize * 1.38`.
2. **`MARGIN_OVERFLOW`**: Keep all scene cards strictly inside `x in [72, 1848]` and `y in [120, 875]`; reserve `y in [885, 1060]` exclusively for bottom captions.
3. **`STATIC_NO_MOTION`**: Every scene must show continuous motion across start/mid/end (`outBack` staggered entry + flowing connectors/bars + gentle drift).
4. **`LOW_VISUAL_DENSITY`**: Pair structured visual diagrams/badges with clear 2-column comparison cards rather than leaving empty slides.
