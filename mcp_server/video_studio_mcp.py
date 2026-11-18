#!/usr/bin/env python3
"""
Model Context Protocol (MCP) Server for Lemo-Opuscar (99) + Dashi-AnimationStyle (8) Video Studio.
Zero external pip dependencies — pure Python 3.10+ stdlib JSON-RPC 2.0 over stdio.
Auto-discovered via `.mcp.json` in Claude Code, Cursor, Gemini CLI, or Antigravity MCP config.
"""
import json, os, subprocess, sys, traceback

HERE = os.path.dirname(os.path.abspath(__file__))
WORKSPACE = os.path.abspath(os.path.join(HERE, ".."))
CLI_PY = os.path.join(WORKSPACE, "video_studio_cli.py")

sys.path.insert(0, WORKSPACE)
import video_studio_cli as vcli  # noqa: E402

PY = vcli.PY
SERVER_INFO = {"name": "lemo-dashi-video-studio", "version": "1.1.0"}

TOOLS = [
    {
        "name": "check_studio_env",
        "description": "Verify Node, FFmpeg, Python venv, git submodules (lemo-opuscar & dashi-animationstyle), VCSL instruments, OmniVoice, and self-hosted Vietnamese OFL fonts.",
        "inputSchema": {"type": "object", "properties": {}, "additionalProperties": False},
    },
    {
        "name": "list_video_styles",
        "description": "Browse or search all 107 code-driven video styles (99 lemo-opuscar + 8 dashi-animationstyle).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "source": {"type": "string", "enum": ["all", "lemo", "dashi"], "default": "all", "description": "Filter by style library"},
                "search": {"type": "string", "default": "", "description": "Optional keyword filter (e.g. 'spreadsheet', 'flowchart', 'keynote', 'swiss')"},
                "pure_code_only": {"type": "boolean", "default": False, "description": "Exclude the 3 styles that require external AI image generation"},
            },
        },
    },
    {
        "name": "get_style_spec",
        "description": "Read the full STYLE.md (lemo-opuscar) or 风格卡.md (dashi-animationstyle) specification and engine/template paths for a chosen style slug.",
        "inputSchema": {
            "type": "object",
            "properties": {"slug": {"type": "string", "description": "Style slug from list_video_styles (e.g. 'spreadsheet', 'dark-keynote', 'dashi-flat-flowchart')"}},
            "required": ["slug"],
        },
    },
    {
        "name": "init_film_project",
        "description": "Scaffold a new film folder in lemo-opuscar/films/<project_name> with staged Vietnamese OFL fonts, TREATMENT.md, cues.json, mix.py, CREDITS, and starter index.html.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "project_name": {"type": "string", "description": "Folder slug (e.g. 'my_ai_film_v1')"},
                "style_slug": {"type": "string", "description": "Style slug from list_video_styles"},
                "aspect": {"type": "string", "enum": ["16:9", "9:16"], "default": "16:9"},
                "duration": {"type": "number", "default": 60.0, "description": "Target duration in seconds"},
            },
            "required": ["project_name", "style_slug"],
        },
    },
    {
        "name": "synthesize_vietnamese_vo",
        "description": "Synthesize non-overlapping Vietnamese neural narration with OmniVoice (automatically uses connected Google Colab T4 GPU if active, else local) and verify via faster-whisper ASR.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "film_project": {"type": "string", "default": "", "description": "Film project name (uses <film>/cues.json and <film>/vo)"},
                "cues_json": {"type": "string", "default": "", "description": "Optional explicit path to cues JSON"},
                "out_dir": {"type": "string", "default": "", "description": "Optional explicit output directory for WAVs + vo_timeline.json"},
                "instruct": {"type": "string", "default": "male, moderate pitch"},
            },
        },
    },
    {
        "name": "configure_colab_gpu",
        "description": "Connect, check status, or disconnect a remote Google Colab T4 GPU worker (colab/OmniVoice_Colab_GPU_Worker.ipynb) for ~40x faster OmniVoice synthesis.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "url": {"type": "string", "default": "", "description": "HTTPS trycloudflare URL printed by the Colab notebook"},
                "token": {"type": "string", "default": "", "description": "Secret token printed by the Colab notebook"},
                "off": {"type": "boolean", "default": False, "description": "Set true to disconnect Colab and revert to local execution"},
            },
        },
    },
    {
        "name": "render_lookcheck_stills",
        "description": "Render 1080p review stills at specified timestamps and generate contact_look.jpg to visually check layout/typography before full video render.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "film_project": {"type": "string", "description": "Film project name or path"},
                "timestamps": {"type": "string", "default": "1.5,8.0,20.0,35.0,50.0", "description": "Comma-separated timestamps in seconds"},
                "size": {"type": "string", "default": "1920x1080"},
            },
            "required": ["film_project"],
        },
    },
    {
        "name": "build_and_qa_film",
        "description": "Run the complete end-to-end production pipeline: stage Vietnamese fonts -> export foley events -> parallel frame render -> VCSL + foley mix -> -14.0 LUFS EBU R128 master -> clean poster -> 10-point Strict QA Gate.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "film_project": {"type": "string", "description": "Film project name or path"},
                "output_mp4": {"type": "string", "description": "Output MP4 path (e.g. 'OUTPUT_VIDEOS/Ban_New.mp4')"},
                "duration": {"type": "number", "default": 60.0},
                "workers": {"type": "integer", "default": 4},
                "grain": {"type": "integer", "default": 0},
                "size": {"type": "string", "default": "1920x1080"},
            },
            "required": ["film_project", "output_mp4"],
        },
    },
    {
        "name": "run_strict_qa_gate",
        "description": "Run the standalone 10-point Automated Broadcast & Viewer-Comfort QA Gate.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "film_project": {"type": "string"},
                "mp4_path": {"type": "string"},
                "duration": {"type": "number", "default": 60.0},
                "size": {"type": "string", "default": "1920x1080"},
            },
            "required": ["film_project", "mp4_path"],
        },
    },
    {
        "name": "create_custom_style_skill",
        "description": "Export a standalone Agent Skill (.agents/skills/lemo-style-<slug>/SKILL.md) from any of the 107 styles.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "slug": {"type": "string"},
                "skill_name": {"type": "string", "default": ""},
                "accent": {"type": "string", "default": ""},
                "aspect": {"type": "string", "enum": ["16:9", "9:16"], "default": "16:9"},
                "rules": {"type": "string", "default": ""},
            },
            "required": ["slug"],
        },
    },
]


def run_cli_subproc(args_list):
    r = subprocess.run(
        [PY, "-X", "utf8", CLI_PY, *args_list],
        cwd=WORKSPACE,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    out = ((r.stdout or "") + ("\n" + r.stderr if r.stderr else "")).strip()
    return r.returncode == 0, out


def handle_tool_call(name, args):
    args = args or {}
    if name == "check_studio_env":
        ok, out = run_cli_subproc(["doctor", "--json"])
        return not ok, out

    if name == "list_video_styles":
        cmd = ["styles", "--source", args.get("source", "all"), "--json"]
        if args.get("search"):
            cmd += ["--search", str(args["search"])]
        if args.get("pure_code_only"):
            cmd.append("--pure-code")
        ok, out = run_cli_subproc(cmd)
        return not ok, out

    if name == "get_style_spec":
        ok, out = run_cli_subproc(["style-info", str(args["slug"]), "--json"])
        return not ok, out

    if name == "init_film_project":
        cmd = [
            "init-film",
            "--name", str(args["project_name"]),
            "--style", str(args["style_slug"]),
            "--aspect", str(args.get("aspect", "16:9")),
            "--dur", str(args.get("duration", 60.0)),
            "--json",
        ]
        ok, out = run_cli_subproc(cmd)
        return not ok, out

    if name == "synthesize_vietnamese_vo":
        cmd = ["tts", "--instruct", str(args.get("instruct", "male, moderate pitch"))]
        if args.get("film_project"):
            cmd += ["--film", str(args["film_project"])]
        if args.get("cues_json"):
            cmd += ["--cues", str(args["cues_json"])]
        if args.get("out_dir"):
            cmd += ["--out-dir", str(args["out_dir"])]
        ok, out = run_cli_subproc(cmd)
        return not ok, out

    if name == "configure_colab_gpu":
        cmd = ["colab"]
        if args.get("off"):
            cmd.append("--off")
        elif args.get("url"):
            cmd += ["--url", str(args["url"]), "--token", str(args.get("token", ""))]
        else:
            cmd.append("--status")
        ok, out = run_cli_subproc(cmd)
        return not ok, out

    if name == "render_lookcheck_stills":
        cmd = [
            "stills",
            "--film", str(args["film_project"]),
            "--times", str(args.get("timestamps", "1.5,8.0,20.0,35.0,50.0")),
            "--size", str(args.get("size", "1920x1080")),
        ]
        ok, out = run_cli_subproc(cmd)
        return not ok, out

    if name == "build_and_qa_film":
        cmd = [
            "build",
            "--film", str(args["film_project"]),
            "--out", str(args["output_mp4"]),
            "--dur", str(args.get("duration", 60.0)),
            "--workers", str(args.get("workers", 4)),
            "--grain", str(args.get("grain", 0)),
            "--size", str(args.get("size", "1920x1080")),
        ]
        ok, out = run_cli_subproc(cmd)
        return not ok, out

    if name == "run_strict_qa_gate":
        cmd = [
            "qa",
            "--film", str(args["film_project"]),
            "--mp4", str(args["mp4_path"]),
            "--dur", str(args.get("duration", 60.0)),
            "--size", str(args.get("size", "1920x1080")),
        ]
        ok, out = run_cli_subproc(cmd)
        return not ok, out

    if name == "create_custom_style_skill":
        cmd = [
            "create-skill",
            "--slug", str(args["slug"]),
            "--aspect", str(args.get("aspect", "16:9")),
        ]
        if args.get("skill_name"):
            cmd += ["--name", str(args["skill_name"])]
        if args.get("accent"):
            cmd += ["--accent", str(args["accent"])]
        if args.get("rules"):
            cmd += ["--rules", str(args["rules"])]
        ok, out = run_cli_subproc(cmd)
        return not ok, out

    return True, f"Unknown tool: {name}"


def write_msg(obj, use_content_length=False):
    raw = json.dumps(obj, ensure_ascii=False).encode("utf-8")
    if use_content_length:
        hdr = f"Content-Length: {len(raw)}\r\n\r\n".encode("ascii")
        sys.stdout.buffer.write(hdr + raw)
    else:
        sys.stdout.buffer.write(raw + b"\n")
    sys.stdout.buffer.flush()


def serve_stdio():
    use_cl = False
    while True:
        line = sys.stdin.buffer.readline()
        if not line:
            break
        s = line.strip()
        if not s:
            continue
        if s.lower().startswith(b"content-length:"):
            use_cl = True
            length = int(s.split(b":", 1)[1].strip())
            while True:
                h = sys.stdin.buffer.readline()
                if not h or h in (b"\r\n", b"\n"):
                    break
            body = sys.stdin.buffer.read(length)
            msg = json.loads(body.decode("utf-8"))
        else:
            msg = json.loads(s.decode("utf-8"))

        method = msg.get("method", "")
        msg_id = msg.get("id")
        if msg_id is None:
            continue

        try:
            if method == "initialize":
                client_proto = (msg.get("params") or {}).get("protocolVersion") or "2024-11-05"
                res = {
                    "protocolVersion": client_proto,
                    "capabilities": {"tools": {}},
                    "serverInfo": SERVER_INFO,
                }
                write_msg({"jsonrpc": "2.0", "id": msg_id, "result": res}, use_cl)

            elif method == "ping":
                write_msg({"jsonrpc": "2.0", "id": msg_id, "result": {}}, use_cl)

            elif method == "tools/list":
                write_msg({"jsonrpc": "2.0", "id": msg_id, "result": {"tools": TOOLS}}, use_cl)

            elif method == "tools/call":
                params = msg.get("params") or {}
                tname = params.get("name", "")
                targs = params.get("arguments") or {}
                is_err, text_out = handle_tool_call(tname, targs)
                write_msg({
                    "jsonrpc": "2.0",
                    "id": msg_id,
                    "result": {
                        "content": [{"type": "text", "text": text_out}],
                        "isError": is_err,
                    },
                }, use_cl)

            else:
                write_msg({
                    "jsonrpc": "2.0",
                    "id": msg_id,
                    "error": {"code": -32601, "message": f"Method not found: {method}"},
                }, use_cl)

        except Exception as e:
            write_msg({
                "jsonrpc": "2.0",
                "id": msg_id,
                "error": {"code": -32603, "message": f"{e}\n{traceback.format_exc()}"},
            }, use_cl)


if __name__ == "__main__":
    serve_stdio()
