# TREATMENT — `v7_tong_quan_ai_pctpr_con_nguoi` (`swiss-motion`)

- **Output Film:** `OUTPUT_VIDEOS/Ban_10_Cam_Nang_Toan_Dien_AI_Tu_Duy_PCTPR_Con_Nguoi.mp4`
- **Style:** `swiss-motion` — Zurich International Typographic Style (`lemo-opuscar/styles/swiss-motion/STYLE.md`)
- **Target Resolution & Duration:** `1920x1080 @ 24fps` · Dynamic VO-driven (`~155–168s`)
- **Target Audience:** Chuyên gia, Kế toán trưởng, Quản lý, và Người đi làm muốn sở hữu một cẩm nang toàn diện: từ bản chất máy móc, tư duy điều phối, kỹ thuật prompt PCTPR đến trách nhiệm pháp lý của con người.

## 1. Candidate Structures & Chosen Arc
- **Candidate A (Monotonous Lecture Slides):** Đi tuần tự 15 định nghĩa như sách giáo khoa. *Loại vì thiếu nhịp điệu và năng lượng thị giác.*
- **Candidate B (High-Level Philosophy Essay):** Chỉ bàn về con người và AI mà không trang bị khung kỹ thuật PCTPR thực chiến. *Loại vì thiếu tính ứng dụng.*
- **Candidate C (CHOSEN — The 4-Pillar Executive Master Programme):**
  - Cấu trúc hệ thống đồ họa 12 cột chuẩn Zurich với 4 chương lớn:
    - `PROGRAMME 01 / CÁC KHÁI NIỆM CỐT LÕI` (LLM, Xác suất, Token, Context Window, Ảo giác).
    - `PROGRAMME 02 / TƯ DUY ĐIỀU PHỐI HỆ THỐNG` (Thực tập sinh siêu tốc, Thu hẹp không gian xác suất, Vị thế Tổng công trình sư).
    - `PROGRAMME 03 / KHUNG THIẾT KẾ PROMPT PCTPR` (5 khóa tọa độ P-C-T-P-R + Tách biệt Logic Khuôn mẫu vs Dữ liệu `[INPUT] {{...}}`).
    - `PROGRAMME 04 / YẾU TỐ CON NGƯỜI & TRÁCH NHIỆM PHÁP LÝ` (Cú ngoặt thức tỉnh: *"AI KHÔNG NGỒI TÙ THAY BẠN"*, Quy trình kiểm chứng 4 bước, Chữ ký con người định đoạt giá trị).

## 2. Palette, Typography & Authentic `swiss-motion` Grammar
- **Zurich 12-Column Modular Grid:** `FM = 96px`, `FG = 24px`, `FC = 122px` (`12 * 122 + 11 * 24 + 2 * 96 = 1920px`).
- **Strict Color Budget (STYLE.md §3):**
  - Page Background: `#EAE9E5` warm archival paper
  - Card Fill: `#FFFFFF` pure white paper blocks
  - Deep Ink: `#111111` for all copy, borders, baseline text
  - Signal Accent: `#E30613` Signal Red (The ONLY signal color across the entire film)
  - Grid Rules: `#D5D4CE` hairline rules
- **Typography:** Self-hosted `Archivo` (400, 500, 700, 800, 900) + `JBMono` (700). Negative letter-spacing on display headlines. Word-wrapping by words (`str.split(' ')`).
- **Motion & Transitions:**
  - Strictly two timing curves: Snap `cubic-bezier(.7, 0, .2, 1)` and Linear. Zero bouncy overshoot, zero gradients, zero shadows.
  - Baseline clip reveals, modular panel shifts, knife-cut deletions with Signal Red incision lines.
  - Subtitles integrated into the Swiss bottom rule line (flush-left, never floating pills).

## 3. Sound, 120 BPM Grid & >= 2 Dramatic Silences
- **Score:** Minimalist acoustic piano + marimba pulse + woodblock clicks (`120 BPM`), ducked `-10 dB` under narration.
- **Dramatic Silence #1 (`~0.8s` before `c11`):** Complete digital silence before entering `PROGRAMME 04: YẾU TỐ CON NGƯỜI & TRÁCH NHIỆM PHÁP LÝ`.
- **Dramatic Silence #2 (`~0.8s` before `c14`):** Complete silence before the closing executive verdict.
- **Foley (`sfx.py`):** `snap_click`, `knife_whoosh`, `block_thud`, `stamp_ding`.
