# Lemo-Opuscar (99) + Dashi-AnimationStyle (8) Video Studio — CLI, MCP & Web UI

Hệ sinh thái sản xuất video đồ họa & thuyết minh hoạt họa **100% bằng code (HTML5 Canvas / WebGL2)** tích hợp **107 phong cách** (`99 Lemo-Opuscar` + `8 Dashi-AnimationStyle`), giọng đọc tiếng Việt **OmniVoice**, nhạc cụ mẫu CC0 **VCSL**, chuẩn âm thanh phát sóng **`-14.0 LUFS`**, và cổng kiểm định khắt khe **`qa_gate.py`**.

> **Dành cho Người dùng:** Chỉ cần clone repo này về, mở bằng bất kỳ AI Coding Agent nào (Antigravity, Claude Code, Codex, Cursor, Gemini CLI) và nhắn:
> *"Hãy đọc `README.md` và dùng CLI `video_studio_cli.py` (hoặc MCP) tạo cho tôi một video 60 giây phong cách `...` về nội dung `...`"* — AI sẽ tự động triển khai từ A–Z!

---

## 1. Cài Đặt Khi Mới Clone Repo (`1 Lệnh Duy Nhất`)

```bash
git clone --recurse-submodules <REPO_URL>
cd "short video"

# Windows:
.\vstudio.bat bootstrap
.\vstudio.bat doctor

# macOS / Linux / Git Bash:
sh ./vstudio bootstrap
sh ./vstudio doctor
```

*(Yêu cầu máy có sẵn **Node.js 20+**, **FFmpeg 7+**, và **Python 3.11+**. Nếu dùng giọng đọc tiếng Việt cục bộ, cài thêm `omnivoice` và `faster-whisper` vào `lemo-opuscar/.venv`).*

---

## 2. Hướng Dẫn Sử Dụng Qua CLI (`vstudio` / `python video_studio_cli.py`)

Mọi tác vụ từ tra cứu phong cách, khởi tạo dự án, tổng hợp giọng đọc, chụp khung hình kiểm tra đến kết xuất & kiểm định `-14 LUFS` đều gọi qua CLI thống nhất:

```powershell
# 1. Tra cứu & tìm kiếm trong 107 phong cách (thêm --json nếu gọi từ AI Agent)
.\vstudio.bat styles
.\vstudio.bat styles --source dashi
.\vstudio.bat styles --search "flowchart" --pure-code

# 2. Đọc đặc tả kỹ thuật đầy đủ (STYLE.md hoặc 风格卡.md) của 1 phong cách
.\vstudio.bat style-info spreadsheet
.\vstudio.bat style-info dashi-flat-flowchart

# 3. Khởi tạo thư mục dự án phim mới (tự nạp sẵn 10 font OFL tiếng Việt + file mẫu)
.\vstudio.bat init-film --name my_explainer_v1 --style dashi-flat-flowchart --aspect 16:9 --dur 60

# 4. Tổng hợp giọng đọc tiếng Việt OmniVoice + kiểm chứng bằng faster-whisper (tự nối tiếp nếu chạy dở)
.\vstudio.bat tts --film my_explainer_v1

# (Tuỳ chọn) Tăng tốc giọng đọc gấp ~40 lần miễn phí bằng Google Colab Tesla T4 GPU:
# Mở `colab/OmniVoice_Colab_GPU_Worker.ipynb` trên Google Colab (T4 GPU) -> Bấm Play -> Dán lệnh được in ra:
.\vstudio.bat colab --url "https://xxxx.trycloudflare.com" --token "<TOKEN>"
.\vstudio.bat colab --status

# 5. Xuất nhanh các khung hình tĩnh 1080p + bảng ghép (contact sheet) để kiểm tra tràn chữ trước khi render
.\vstudio.bat stills --film my_explainer_v1 --times "2.0,12.0,25.0,42.0,55.0"

# 6. Kết xuất trọn gói: Render đa luồng -> Hòa âm VCSL + Foley -> Master -14 LUFS -> Xuất Poster -> Chạy QA Gate 10 điểm
.\vstudio.bat build --film my_explainer_v1 --out OUTPUT_VIDEOS/Ban_Moi.mp4 --dur 60 --workers 4

# 7. Đóng gói bất kỳ phong cách nào thành Skill độc lập lưu vào .agents/skills/
.\vstudio.bat create-skill --slug dark-keynote --accent "#B7F34A"

# 8. Mở giao diện Web UI Studio trực quan (Xem video demo của cả 107 phong cách tại http://127.0.0.1:8765)
.\vstudio.bat ui --port 8765
```

---

## 3. Tích Hợp MCP Server Cho AI Gọi Trực Tiếp (`mcp_server/video_studio_mcp.py`)

Dự án đi kèm sẵn **MCP Server thuần Python (0 thư viện phụ thuộc ngoài)** tại `mcp_server/video_studio_mcp.py` và file cấu hình tự động nhận diện `.mcp.json` ở thư mục gốc.

Nếu thêm thủ công vào cấu hình MCP của IDE / Agent CLI (`mcp_config.json` / `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "lemo-dashi-video-studio": {
      "command": "python",
      "args": ["-X", "utf8", "mcp_server/video_studio_mcp.py"],
      "cwd": "/duong/dan/toi/repo"
    }
  }
}
```

**9 MCP Tools cung cấp sẵn cho AI:**
- `check_studio_env` — Kiểm tra toàn bộ môi trường, font tiếng Việt, nhạc cụ VCSL & submodules.
- `list_video_styles` — Tìm kiếm trong 107 phong cách (`lemo` + `dashi`).
- `get_style_spec` — Đọc trọn vẹn `STYLE.md` / `风格卡.md` và đường dẫn engine mẫu.
- `init_film_project` — Tạo khung dự án phim mới kèm sẵn font OFL tiếng Việt, `TREATMENT.md`, `cues.json`, `mix.py`, `index.html`.
- `synthesize_vietnamese_vo` — Tạo lời thoại `OmniVoice` tiếng Việt + kiểm chứng ASR `faster-whisper`.
- `render_lookcheck_stills` — Kết xuất ảnh tĩnh 1080p + `contact_look.jpg` để kiểm tra bố cục.
- `build_and_qa_film` — Chạy toàn bộ pipeline render, hòa âm, chuẩn hóa `-14.0 LUFS` và kiểm định tự động.
- `run_strict_qa_gate` — Chạy độc lập cổng kiểm định 10 tiêu chí `qa_gate.py`.
- `create_custom_style_skill` — Đóng gói phong cách thành `SKILL.md`.

---

## 4. 🤖 Playbook Bắt Buộc Dành Cho AI Coding Agent (Đọc Trước Khi Làm Phim)

Khi người dùng yêu cầu tạo video mới trong repo này, AI Agent thực hiện tuần tự 6 bước sau qua CLI `video_studio_cli.py` (hoặc các MCP tools tương ứng):

1. **Chọn & Đọc kỹ đặc tả phong cách:**
   - Chạy `python -X utf8 video_studio_cli.py styles --json` để chọn phong cách hợp chủ đề nhất trong 107 mẫu.
   - Chạy `python -X utf8 video_studio_cli.py style-info <slug>` để đọc toàn bộ quy luật thị giác. **Tuyệt đối không** sửa file trong `lemo-opuscar/core/`, `lemo-opuscar/styles/`, hoặc `dashi-animationstyle/styles/`, và **không** giả lập phong cách bằng các hộp slide tĩnh sơ sài.
2. **Khởi tạo dự án & Viết `TREATMENT.md`:**
   - Chạy `python -X utf8 video_studio_cli.py init-film --name <slug_du_an> --style <slug> --dur <giay>`.
   - Điền đầy đủ `lemo-opuscar/films/<slug_du_an>/TREATMENT.md` (cấu trúc kịch bản, danh sách cảnh, ít nhất 2 khoảng lặng kịch tính `type: 'silence'` trong `window.EV`).
3. **Soạn `cues.json` & Tổng hợp giọng đọc (`tts`):**
   - Trong trường `"say"` dành cho `OmniVoice` tiếng Việt: **viết mọi con số/ký hiệu thành chữ tiếng Việt** (`"50-60%"` → `"năm mươi đến sáu mươi phần trăm"`), mỗi câu dài tối đa `<= 32 từ` để mô hình đọc tự nhiên và nhanh trên CPU.
   - Chạy `python -X utf8 video_studio_cli.py tts --film <slug_du_an>` để nhận `vo/vo_timeline.json` đã kiểm chứng không chồng câu.
4. **Lập trình hình ảnh chuẩn xác trong `index.html`:**
   - Khớp mọi chuyển động, máy quay và phụ đề theo mốc thời gian thực trong `./vo/vo_timeline.json`.
   - Chỉ dùng bộ font OFL tự host trong `./fonts/` (`BeVietnamPro`, `Inter`, `InterTight`, `Archivo`, `SpaceGrotesk`, `JBMono`), nạp qua `document.fonts.load(...)` trước khi đặt `window.READY = true`. Không dùng `-apple-system`, `PingFang SC` hay emoji hệ điều hành.
   - Ngắt dòng tiếng Việt theo từ (`split(' ')`), giữ vùng an toàn không tràn lề, không đè hộp phụ đề lên nội dung chính, và ẩn phụ đề khi URL có `?nosub=1`.
5. **Kiểm tra trực quan ảnh tĩnh (`stills`) trước khi kết xuất:**
   - Chạy `python -X utf8 video_studio_cli.py stills --film <slug_du_an> --times "..."` và mở xem trực tiếp các ảnh tĩnh full-HD trong `stills/` để sửa sạch mọi lỗi đè chữ (nếu có).
6. **Kết xuất hoàn chỉnh & Vượt cổng QA (`build`):**
   - Chạy `python -X utf8 video_studio_cli.py build --film <slug_du_an> --out OUTPUT_VIDEOS/<Ten_Video>.mp4 --dur <giay> --workers 4`.
   - Chỉ bàn giao khi lệnh `build` báo `=== QA RESULT: 100% PASSED (ZERO VIEWER DISCOMFORT) ===` (`-14.0 ± 1.0 LUFS`, True Peak `<= -1.0 dBTP`, `0` khung hình đen, `0` lỗi JS/404) và ảnh `stills_qa/contact_qa.jpg` hoàn toàn sắc nét.

---

## 5. Cấu Trúc Kho Mã Nguồn
- `video_studio_cli.py` / `vstudio.bat` / `vstudio` — CLI thống nhất cho người dùng & AI Agent.
- `mcp_server/video_studio_mcp.py` & `.mcp.json` — Máy chủ MCP chuẩn JSON-RPC stdio.
- `.agents/skills/` — Bộ Skills chuyên sâu (`lemo-video-director`, `dashi-explainer-director`, `lemo-voice-audio`, `lemo-style-customizer`).
- `workflows/` — Pipeline tự động đơn lẻ (`run_film_pipeline.py`) và song song đa phong cách (`produce_multi_style.py`).
- `studio-ui/` & `Start_Studio_UI.bat` — Giao diện Web UI Studio duyệt & xem demo toàn bộ 107 phong cách.
- `projects/` — Lưu trữ mã nguồn các bộ phim đã sản xuất.
- `OUTPUT_VIDEOS/` — Thư mục chứa video `.mp4` thành phẩm, ảnh bìa `Poster_*.jpg`, phụ đề `.srt` và `CREDITS.md`.
