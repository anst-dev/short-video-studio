# Agent Instructions (`AGENTS.md` / `CLAUDE.md`)

When asked to create, edit, or inspect code-driven videos in this repository:
1. **Read `README.md` (Section 2, 3, and 4) and `GEMINI.md` first.**
2. Use the unified CLI `python -X utf8 video_studio_cli.py <command>` (or `./vstudio.bat` on Windows, `./vstudio` on macOS/Linux, or the `lemo-dashi-video-studio` MCP server configured in `.mcp.json`).
3. Key CLI commands:
   - `python -X utf8 video_studio_cli.py doctor --json`
   - `python -X utf8 video_studio_cli.py styles --json`
   - `python -X utf8 video_studio_cli.py style-info <slug>`
   - `python -X utf8 video_studio_cli.py init-film --name <project> --style <slug> --dur <sec>`
   - `python -X utf8 video_studio_cli.py tts --film <project>`
   - `python -X utf8 video_studio_cli.py stills --film <project> --times "2,12,25,45"`
   - `python -X utf8 video_studio_cli.py build --film <project> --out OUTPUT_VIDEOS/<Name>.mp4 --dur <sec>`
4. Consult `.agents/skills/lemo-video-director/SKILL.md`, `.agents/skills/dashi-explainer-director/SKILL.md`, and `.agents/skills/lemo-voice-audio/SKILL.md` for detailed rendering and audio mastering rules. Never deliver a video unless `qa_gate.py` exits `0` AND visual inspection of `stills_qa/contact_qa.jpg` passes with zero text collisions.
