# Claude Code & AI Agent Instructions (`CLAUDE.md`)

1. **Đọc `@AGENTS.md`, `@GEMINI.md`, và `@README.md` trước khi thực hiện bất kỳ yêu cầu làm phim nào.**
2. **Nguyên tắc bắt buộc (1 Video = 1 Thư mục độc lập):**
   - Mỗi dự án video PHẢI được tách thành một thư mục riêng biệt tại `projects/<slug_du_an>/` và xuất bản đầy đủ sang `OUTPUT_VIDEOS/<Ten_Video>/`.
   - Toàn bộ tài nguyên (`index.html`, `TREATMENT.md`, `cues.json`, `vo/`, `fonts/`, `events.json`, `mix.py`, `CREDITS.md`, `stills_qa/`, `.srt`, `Poster_*.jpg`, `.mp4`) phải nằm khép kín trong thư mục đó (dùng đường dẫn tương đối `./fonts/`, `./vo/`) để có thể di chuyển hoặc tối ưu độc lập từng video.
3. Sử dụng CLI thống nhất `python -X utf8 video_studio_cli.py <command>` (hoặc `.\vstudio.bat` trên Windows / MCP Server trong `.mcp.json`).
