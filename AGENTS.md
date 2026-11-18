# Hướng Dẫn Quy Trình Sản Xuất Video Cho AI Agents (`AGENTS.md`)

Tài liệu này quy định quy trình bắt buộc dành cho mọi AI Coding Agent (**Antigravity, Claude Code, Grok, Cursor, Codex, Gemini CLI**) khi nhận nhiệm vụ tạo mới, chỉnh sửa hoặc tối ưu hóa video trong dự án `short-video-studio`.

---

## 1. Nguyên Tắc Cốt Lõi: "1 Video = 1 Thư Mục Độc Lập (100% Self-Contained)"

> **[!IMPORTANT] Quy tắc tách biệt thư mục dự án để tối ưu độc lập:**
> - **Tuyệt đối không** trộn lẫn tài nguyên của nhiều video vào chung một chỗ, và **tuyệt đối không** sửa đổi file gốc trong `lemo-opuscar/core/`, `lemo-opuscar/styles/`, hay `dashi-animationstyle/styles/`.
> - **Mỗi video PHẢI có một thư mục riêng biệt** tại `projects/<slug_du_an>/` (trong quá trình build có thể mount tại `lemo-opuscar/films/<slug_du_an>/`) và xuất bản trọn gói sang một thư mục riêng tại `OUTPUT_VIDEOS/<Ten_Video>/`.
> - **Mục tiêu:** Sau khi hoàn thành, nếu người dùng hoặc một Agent khác copy thư mục đó đi nơi khác, hoặc chỉ mở đúng thư mục đó lên để tinh chỉnh/tối ưu riêng (sửa câu chữ, đổi tốc độ giọng, chỉnh vị trí hình ảnh, mix lại nhạc), **mọi tài nguyên cần thiết đều đã nằm sẵn bên trong thư mục đó**.

### Cấu trúc chuẩn bên trong thư mục của mỗi video:

```text
OUTPUT_VIDEOS/<Ten_Video>/   (và đồng bộ tại projects/<slug_du_an>/)
├── <Ten_Video>.mp4                 # File video hoàn chỉnh (1080p @ 24fps, -14.0 LUFS, QA 100% PASS)
├── Poster_<Ten_Video>.jpg          # Ảnh bìa 1080p sạch, không dính phụ đề (?nosub=1)
├── <Ten_Video>.srt                 # File phụ đề rời tiếng Việt chuẩn thời gian thực
├── TREATMENT.md                    # Bản thiết kế đạo diễn: Cấu trúc, phân cảnh, nhịp máy quay, khoảng lặng
├── cues.json                       # Kịch bản thoại: trường "sub" (hiển thị) và "say" (viết số thành chữ)
├── index.html                      # Mã nguồn diễn hoạt chính (dùng đường dẫn tương đối ./fonts/, ./vo/)
├── fx_dashi.js                     # (Nếu dùng mẫu Dashi) Bản sao thư viện chuyển cảnh 动效部件.js tại chỗ
├── events.json                     # Các mốc thời gian hiệu ứng âm thanh foley & khoảng lặng (silence)
├── mix.py                          # Kịch bản hòa âm độc lập (Voice + Score 120 BPM + Foley -> out/mix.wav)
├── CREDITS.md                      # Thông tin bản quyền font (OFL), nhạc cụ (CC0) & giọng đọc
├── fonts/                          # 10 file font OFL tiếng Việt tự host (BeVietnamPro, Inter, JBMono, Archivo...)
├── vo/                             # Toàn bộ file c00.wav..cNN.wav & vo_timeline.json (đường dẫn tương đối "vo/c00.wav")
└── stills_qa/
    └── contact_qa.jpg              # Bảng ghép 12 khung hình kiểm định trực quan không lỗi đè chữ
```

**Lưu ý kỹ thuật để thư mục di chuyển được (Portable):**
1. Trong `index.html`: Luôn gọi font qua `./fonts/<TenFont>.ttf` và nạp timeline qua `fetch('./vo/vo_timeline.json')`.
2. Trong `vo/vo_timeline.json`: Lưu trường `"wav": "vo/c00.wav"` (đường dẫn tương đối) và trong `mix.py` luôn giải mã qua `os.path.join(HERE, c["wav"])` để khi dời thư mục sang ổ đĩa hay máy tính khác vẫn chạy lại `python mix.py` được ngay.

---

## 2. Quy Trình 6 Bước Thực Thi Qua CLI (`video_studio_cli.py` / `vstudio.bat`)

Mọi Agent sử dụng CLI thống nhất tại thư mục gốc (`python -X utf8 video_studio_cli.py <lệnh>` hoặc `.\vstudio.bat <lệnh>`) hoặc các tool trong MCP Server (`.mcp.json`):

### Bước 1: Kiểm tra môi trường & Đọc đặc tả phong cách
```powershell
python -X utf8 video_studio_cli.py doctor
python -X utf8 video_studio_cli.py styles --search "<tu_khoa>"
python -X utf8 video_studio_cli.py style-info <style_slug>
```
- Đọc kỹ `STYLE.md` (với 99 mẫu Lemo-Opuscar) hoặc `风格卡.md` + `模板.html` (với 8 mẫu Dashi-AnimationStyle).
- Để model tự suy luận bảng màu, bố cục trạm/khung hình, chuyển động máy quay và hiệu ứng chuyển cảnh theo đúng thiết kế gốc của phong cách đó. Không dựng các hộp slide tĩnh kiểu PowerPoint sơ sài.

### Bước 2: Khởi tạo thư mục dự án riêng & Viết `TREATMENT.md`
```powershell
python -X utf8 video_studio_cli.py init-film --name <slug_du_an> --style <style_slug> --aspect 16:9 --dur <so_giay>
```
- Lệnh này tự động nạp sẵn 10 font OFL tiếng Việt vào `./fonts/` và tạo khung file ban đầu.
- Viết đầy đủ `TREATMENT.md` trước khi code giao diện: xác định rõ đối tượng khán giả, thông điệp cốt lõi, danh sách phân cảnh/trạm, chuyển động máy quay và ít nhất **2 khoảng lặng kịch tính (`type: "silence"`, `dur: 0.7s`)** trước các bước ngoặt lớn.

### Bước 3: Biên soạn `cues.json` & Tổng hợp giọng đọc (`tts`)
- **Quy tắc viết `cues.json`:**
  - `"sub"`: Câu phụ đề hiển thị trên màn hình (ngắn gọn, súc tích).
  - `"say"`: Câu văn cho mô hình TTS đọc — **bắt buộc viết mọi con số, phần trăm, ký hiệu thành chữ tiếng Việt** (ví dụ: `"9/10"` → `"chín trên mười"`, `"50-60%"` → `"năm mươi đến sáu mươi phần trăm"`).
- **Quy tắc công cụ Giọng đọc (TTS):**
  - Sử dụng **`OmniVoice`** (chạy cục bộ qua `python -X utf8 video_studio_cli.py tts --film <slug_du_an>` hoặc kết nối Colab GPU Worker qua `video_studio_cli.py colab`) hoặc TTS mặc định nếu model hỗ trợ trực tiếp.
  - **Không sử dụng `edge-tts`**.
  - Mọi file `.wav` phải được kiểm chứng bằng `faster-whisper` để lắp ráp thành `vo/vo_timeline.json` với khoảng thở giữa các câu `>= 0.32s` (tuyệt đối không đè câu) và kết thúc trước `DUR - 0.5s`.

### Bước 4: Lập trình hình ảnh chuẩn xác trong `index.html`
- Đồng bộ 100% thời gian xuất hiện của các phân cảnh, trạm quy trình, con trỏ hoặc nhân vật theo mốc thực tế trong `./vo/vo_timeline.json`.
- **100% Font OFL Tiếng Việt tự host (`./fonts/`):**
  - Nạp font qua `document.fonts.load(...)` với chuỗi mẫu tiếng Việt đầy đủ dấu trước khi gán `window.READY = true`.
  - **Tuyệt đối không** dùng `-apple-system`, không dùng font macOS `PingFang SC` / `Lantinghei SC` (gây vỡ dấu tiếng Việt trên Windows), và **không dùng ký tự Emoji hệ điều hành** (hãy vẽ icon bằng vector/canvas hoặc ký hiệu chữ `[OK]`, `[01]`, `>>`).
- Ngắt dòng tiếng Việt theo từ (`split(/\s+/)`), giữ khoảng cách an toàn không tràn lề, không để nhân vật/huy hiệu đè lên tiêu đề, và ẩn phụ đề khi URL có tham số `?nosub=1` (để chụp ảnh Poster sạch).

### Bước 5: Chụp ảnh tĩnh kiểm tra trực quan (`stills` / `qa-scene`) trước khi Render
```powershell
python -X utf8 video_studio_cli.py stills --film <slug_du_an> --times "4.0,20.0,45.0,72.0,105.0"
```
- **Bắt buộc mở xem trực tiếp** các ảnh tĩnh trong `stills/` và `stills/contact_look.jpg` (hoặc chạy `python -X utf8 video_studio_cli.py qa-scene --film <slug_du_an> --t0 <giay> --t1 <giay>`) để kiểm tra xem có chữ nào bị cắt, tràn hộp hoặc đè lên nhau không. Nếu có, sửa ngay trong `index.html` rồi mới chuyển sang Bước 6.

### Bước 6: Render đa luồng, Master âm thanh `-14.0 LUFS`, Kiểm định `qa_gate.py` & Đóng gói thư mục độc lập
```powershell
python -X utf8 video_studio_cli.py build --film <slug_du_an> --out OUTPUT_VIDEOS/<Ten_Video>/<Ten_Video>.mp4 --poster OUTPUT_VIDEOS/<Ten_Video>/Poster_<Ten_Video>.jpg --dur <so_giay> --workers 6
```
- Sau khi `qa_gate.py` báo **`=== QA RESULT: 100% PASSED (ZERO VIEWER DISCOMFORT) ===`** (`exit code 0`):
  - Đồng bộ toàn bộ mã nguồn và tài nguyên (`index.html`, `TREATMENT.md`, `cues.json`, `events.json`, `mix.py`, `CREDITS.md`, `fonts/`, `vo/`, `stills_qa/`, `.srt`, `Poster_*.jpg`, `.mp4`) vào cả hai thư mục độc lập:
    1. `OUTPUT_VIDEOS/<Ten_Video>/`
    2. `projects/<slug_du_an>/`

---

## 3. Quy Trình Tối Ưu Hóa Riêng Một Dự Án Có Sẵn

Khi một Agent được giao nhiệm vụ **cải tiến hoặc sửa riêng 1 video đã có**:
1. Chỉ mở và đọc thư mục riêng của video đó tại `projects/<slug_du_an>/` (hoặc `OUTPUT_VIDEOS/<Ten_Video>/`).
2. Đọc `TREATMENT.md`, `cues.json`, `vo/vo_timeline.json` và `index.html` ngay trong thư mục đó.
3. Nếu chỉ sửa đồ họa/bố cục: Sửa `index.html` → Chạy `stills` kiểm tra nhanh → Chạy `build` để xuất lại `.mp4` mà không cần chạy lại TTS.
4. Nếu chỉ sửa nhạc/âm lượng: Sửa `mix.py` → Chạy `python -X utf8 mix.py` và `master_mux.py` → Chạy `qa` để kiểm tra chuẩn `-14.0 LUFS` mà không cần render lại khung hình video.
5. Nếu dùng vòng lặp tự động tối ưu từng cảnh (Karpathy Autoresearch Ratchet):
   ```powershell
   python -X utf8 video_studio_cli.py ratchet --film <slug_du_an> --t0 <giay_dau> --t1 <giay_cuoi> --action snapshot
   # Sau khi sửa index.html:
   python -X utf8 video_studio_cli.py ratchet --film <slug_du_an> --t0 <giay_dau> --t1 <giay_cuoi> --action eval --desc "Mo ta thay doi"
   ```
