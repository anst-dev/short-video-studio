"""
Dynamic Antigravity `run_workflow` script (`produce_multi_style.py`).
Stages:
  1. Shared Voiceover & SRT Generation (`lemo-voice-audio` skill)
  2. Parallel Multi-Style Film Direction, Rendering & Scoring (`lemo-video-director` skill)
  3. Strict 10-Point QA Gate + Automated Fix Pass if any check fails
"""

topic = args.get("topic", "")
styles = args.get("styles", ["dark-keynote"])
duration = float(args.get("duration", 60))
aspect = args.get("aspect", "16:9")
voice = args.get("voice", "omnivoice")
size = "1080x1920" if aspect == "9:16" else "1920x1080"

phase("1. Voiceover & Timeline Master")
vo_info = await agent(
    f"""Activate and read `.agents/skills/lemo-voice-audio/SKILL.md` and `.agents/skills/lemo-video-director/SKILL.md`.
Create a shared `{duration}s` voiceover timeline (`lemo-opuscar/master_vo_workflow/vo_timeline.json`) and `OUTPUT_VIDEOS/subtitles_vi.srt` using `{voice}` for this story:

{topic}

Rules:
- Spell all numbers/percentages out in Vietnamese words in `say`.
- Enforce >= 0.32s breath gaps, zero overlap, at least two 0.6s silences before the turn and final verdict, and finish before {duration - 0.35:.2f}s.
- Return the path to `vo_timeline.json` and `subtitles_vi.srt`.""",
    schema={
        "type": "object",
        "properties": {
            "vo_timeline": {"type": "string"},
            "srt_path": {"type": "string"}
        },
        "required": ["vo_timeline", "srt_path"]
    },
    role="Voice & Timeline Director",
)
log(f"Voiceover ready: {vo_info}")

phase("2. Parallel Style Direction & Rendering")
async def build_one_style(idx_slug):
    idx, slug = idx_slug
    out_mp4 = f"OUTPUT_VIDEOS/Ban_{idx+1}_{slug.replace('-', '_')}.mp4"
    proj = f"films/wf_{idx+1}_{slug.replace('-', '_')}"
    builder = agent(
        f"""You are directing Version {idx+1} in `{slug}` style (`lemo-opuscar/styles/{slug}/STYLE.md`).
Read `.agents/skills/lemo-video-director/SKILL.md` and `lemo-opuscar/styles/{slug}/STYLE.md` in full.
Story brief ({duration}s, {size} @ 24fps):
{topic}

Shared voiceover timeline: `{vo_info['vo_timeline']}`
Shared SRT: `{vo_info['srt_path']}`

Steps:
1. Stage Vietnamese OFL fonts into `lemo-opuscar/{proj}/fonts` using `fetch_vn_fonts.py`.
2. Write `lemo-opuscar/{proj}/TREATMENT.md` first, then inspect `lemo-opuscar/styles/{slug}/demo/` for engine helpers.
3. Build authentic `{slug}` visuals, inspect 10+ stills via `still.mjs` + `sheet.py`, fix any overlap/clipping.
4. Render full video (`--size {size} --fps 24`), compose VCSL score + frame-exact `sfx.py` foley + compressed voiceover, and master to `-14 LUFS` into `{out_mp4}`.
5. Run `.agents/skills/lemo-video-director/scripts/qa_gate.py --film {proj} --mp4 ../{out_mp4} --vo {vo_info['vo_timeline']} --srt ../{vo_info['srt_path']} --dur {duration} --size {size}` until it exits 0.""",
        role=f"Director [{slug}]",
    )
    res = await builder(
        "Execute all 5 steps and return final QA summary.",
        schema={
            "type": "object",
            "properties": {
                "slug": {"type": "string"},
                "mp4": {"type": "string"},
                "qa_passed": {"type": "boolean"},
                "summary": {"type": "string"}
            },
            "required": ["slug", "mp4", "qa_passed", "summary"]
        }
    )
    if not res.get("qa_passed"):
        res = await builder(
            "QA Gate reported issues. Fix every issue and re-run `qa_gate.py` until `qa_passed` is true.",
            schema={
                "type": "object",
                "properties": {
                    "slug": {"type": "string"},
                    "mp4": {"type": "string"},
                    "qa_passed": {"type": "boolean"},
                    "summary": {"type": "string"}
                },
                "required": ["slug", "mp4", "qa_passed", "summary"]
            }
        )
    del builder
    return res

results = await parallel(list(enumerate(styles)), build_one_style)
for r in results:
    log(f"[{r['slug']}] QA={r['qa_passed']} -> {r['mp4']}: {r['summary']}")
