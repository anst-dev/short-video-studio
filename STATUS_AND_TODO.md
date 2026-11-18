# Nhật Ký Tiến Độ & Bàn Giao Công Việc (`STATUS_AND_TODO.md`)

**Cập nhật lần cuối:** 2026-11-19 00:05 (+07:00)

---

## 1. Những Việc Đã Hoàn Thành

### A. Khởi Tạo Hạ Tầng & Sửa Lỗi Khởi Động
- **Clone & đồng bộ Submodules**: Đã clone hoàn tất repository `short-video-studio` cùng 2 submodule (`lemo-opuscar` và `dashi-animationstyle`).
- **Sửa lỗi [Start_Studio_UI.bat](Start_Studio_UI.bat)**: Khắc phục lỗi nhảy sai thư mục `cd /d "%~dp0\.."` và fallback sang Python hệ thống khi chưa tạo `.venv`. Giao diện Web UI Studio chạy ổn định tại `http://127.0.0.1:8765`.
- **Cập nhật [AGENTS.md](AGENTS.md) & [CLAUDE.md](CLAUDE.md)**:
  - Chuẩn hóa quy trình 6 bước sản xuất video qua `video_studio_cli.py`.
  - Khóa chặt nguyên tắc **1 Video = 1 Thư mục độc lập (`100% Self-Contained`)** tại `projects/<slug>/` và `OUTPUT_VIDEOS/<Ten_Video>/` (dùng đường dẫn tương đối `./fonts/`, `./vo/` để di chuyển và tối ưu độc lập).
  - Quy định sử dụng `OmniVoice` (local hoặc Colab GPU Worker) / TTS mặc định, không dùng `edge-tts`.

### B. Sản Xuất & Kiểm Định Video Đã Xuất
1. **Video `Ban_11_System_Prompt_Nguyen_Dang_Chung_1981`** (Phong cách `#68 living-screencast` — Mascot Screencast):
   - Dành riêng cho học viên **Nguyễn Đăng Chung (1981)**, thời lượng **141 giây** (`1920x1080 @ 24fps`), 16 câu thoại, hòa âm 2 tầng (Hi-Fi Mallet + 8-bit Chiptune) & chuẩn hóa `-14.1 LUFS` / True Peak `-1.5 dBFS`.
   - Đã vượt qua 100% cổng kiểm định `qa_gate.py` (`exit code 0`).
   - Đóng gói độc lập tại `OUTPUT_VIDEOS/Ban_11_System_Prompt_Nguyen_Dang_Chung_1981/` và `projects/v8_system_prompt_chung1981/`.
2. **Video `Ban_System_Prompt_Architect`** (Phong cách `#D06 dashi-flat-flowchart` — Cream & Amber Flowchart):
   - Đã khởi tạo và xuất bản tại `OUTPUT_VIDEOS/Ban_System_Prompt_Architect/` và `projects/d06_system_prompt_architect/`.

### C. Chuẩn Bị Kết Nối Google Colab GPU (OmniVoice + Faster-Whisper)
- Đã cập nhật [colab/OmniVoice_Colab_GPU_Worker.ipynb](colab/OmniVoice_Colab_GPU_Worker.ipynb) hỗ trợ cả 2 chế độ:
  1. Tự sinh link `https://xxxx.trycloudflare.com` miễn phí (không cần cấu hình domain).
  2. Tùy chọn gắn `CLOUDFLARE_TUNNEL_TOKEN` + `CUSTOM_PUBLIC_URL` cố định theo domain riêng trên Cloudflare.
- Đã upload thành công `OmniVoice_Colab_GPU_Worker.ipynb` lên Google Colab cá nhân của người dùng.

---

## 2. Những Việc Chưa Làm / Cần Làm Tiếp

1. **Hoàn tất chạy Google Colab T4 GPU Worker cho OmniVoice**:
   - Trên tab Google Colab đang mở (`OmniVoice_Colab_GPU_Worker.ipynb`), kiểm tra **Runtime -> Change runtime type -> T4 GPU**.
   - Bấm nút **Play** ở ô code duy nhất để khởi chạy máy chủ FastAPI + Cloudflare Tunnel.
   - Copy dòng lệnh `.\vstudio.bat colab --url "https://..." --token "..."` in ra trên Colab và chạy trên Terminal máy local (lưu cấu hình vào `.agents/cache/colab_worker.json`).
2. **Tùy chọn (Nếu muốn cố định URL theo Domain Cloudflare riêng)**:
   - Tạo Cloudflare Zero Trust Tunnel trỏ subdomain (vd `tts.domain.com`) về `http://127.0.0.1:8000` và điền `CLOUDFLARE_TUNNEL_TOKEN` + `CUSTOM_PUBLIC_URL` vào cell trong notebook Colab.
3. **Tối ưu / Làm lại giọng đọc bằng `OmniVoice` (Giọng Nam Miền Bắc, speed `1.1`)**:
   - Sau khi nối xong Colab GPU Worker, có thể chạy lại `.\vstudio.bat tts --film <slug> --force` và `.\vstudio.bat build ...` để nâng cấp giọng đọc sang `OmniVoice` cho các dự án cần giọng miền Bắc tốc độ `1.1`.
4. **Cài đặt `omnivoice` & `torch` cục bộ (Tùy chọn dự phòng Offline)**:
   - Nếu muốn chạy TTS không cần phụ thuộc Google Colab/mạng, cài thêm `omnivoice` vào `lemo-opuscar/.venv`.
