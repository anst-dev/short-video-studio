# TREATMENT — Bản 2: Ô Tính Tự Giải Phóng (Spreadsheet Film)

Style: `spreadsheet` (`styles/spreadsheet/STYLE.md`)
Duration: 60.0 s · 1920×1080 · 24 fps · 120 BPM (30 bars)
Language: Tiếng Việt (voiceover OmniVoice + cell-comment subtitle note + `.srt`)
Palette: White sheet `#FFFFFF`, shell `#EBEAE4` / `#D8D6CE`, ink `#17120A`, conditional lime `#B8F25A`, error red `#E8382D`, indigo `#2A2F6C`, amber `#FFB21F`, sky `#4EA8DE`

## 1. Three candidate structures & choice

1. **Running Annual Calendar**: 52 columns of weekly office hours fill cell by cell across a year. *Good for a static dataset, weak for showing multi-AI PCTPR stages and meeting minutes.*
2. **Two Sheets Tab-Switching**: Switch back and forth between ` Cach_Cu.sheet ` and ` AI_Bai_Ban.sheet `. *Breaks spatial continuity.*
3. **One Sheet Reflowing from `#REF!` Chaos into Computed Order (CHOSEN)**: Open zoomed into chaotic red/amber cells (`#REF!`, `QUÁ TẢI`, `18 TRANG`, `36 MAIL`) as the formula bar types the two hook questions and a naive formula `=AI("dịch + viết caption")` that triggers a cascade of manual-edit errors across 4 columns (`PROMPT NGẮN` → `SÁO RỖNG` → `SỬA TAY` → `MẤT GIỜ`). After a hard silence, **Hidden Columns `G:K` unhide** to reveal the **PCTPR** engine (`ChatGPT`, `Claude`, `Gemini`, `GPTs/Gems`), reference boxes light up in matching formula colors, **100 red workload cells physically hop and sort** down into **40 lime cells**, conditional-format sweeps turn the 3 acceptance checklist blocks green, and the camera pulls out to reveal a pristine, spacious sheet framed by a celebratory banded colour scale and merged verdict cells (`50–60%` & CTA).

## 2. Logline & Arc

- **Logline**: Ngay bên trong một trang bảng tính sống động nơi từng ô chữ nhật là điểm ảnh, cả một phòng ban lật ngược cảnh ngập đầu trong lỗi `#REF!` và sửa tay bằng cách mở khóa các cột công thức `PCTPR`, thu gọn 100 ô việc xuống còn 40 ô chuẩn nghiệm thu.
- **Arc**: Setup (`#VALUE!/#REF!` overload + naive AI formula loop, 0–16.0 s) → Turn (Silence + Unhiding PCTPR columns & live formula references, 16.0–38.5 s) → Ending (100 cells hopping/shrinking to 40 lime cells + checklist flash sweep + spacious white/colour-scale payoff & merged verdict stage, 38.5–60.0 s).

## 3. Benchmark

- **Reference works**: (1) Classic spreadsheet-grid music videos (wide 2.9:1 rectangular cells acting simultaneously as data rows up close and graphic bars from afar); (2) Minimalist statistical journalism tables (every colour means a rule fired, zero drop shadows or gradients).
- **What to learn**: Strict flat spreadsheet authenticity — fixed shell chrome on top, world→screen `XC/YR` zoom & scroll, marching-ants hero selection leading the eye, white cell flash (`0.12 s`) when conditional rules fire.
- **What not to take**: No Excel/Google Sheets logos, ribbons, or trademarked green headers.

## 4. Shot List (7 sheet-camera moves)

| Shot | Time | Sheet Camera (`col, row, zoom`) | Why |
|---|---|---|---|
| S1 | 0.0–4.8 s | Pull out (`z 1.8 → 1.05`) from blinking cell `B3` (`#QUÁ_TẢI!`) across messy stacked cells of reports, sheets, minutes & unread mails; merged banner `B2:K4` types Question 1 | Immediate medium-authentic chaos hook |
| S2 | 4.8–8.5 s | Selection hops to `B6` while camera pushes in (`z 1.35`); formula bar types `=DUNG_AI("dịch thuật", "viết caption")` → merged cell pops Question 2 | Uses the formula bar as dialogue (`STYLE.md` §1.4) |
| S3 | 8.5–16.0 s | Lateral track right (`col B → P`, `z 1.15`) following the selected cell hopping across 4 failing columns: `PROMPT NGẮN` → `KẾT QUẢ SÁO RỖNG` → `SỬA TAY ×14` → `MẤT THỜI GIAN (100%)` | Step-by-step calculation path of failure |
| S4 | 16.0–25.0 s | Silence at 15.8 s; at 16.5 s whip to column headers + pull back (`z 0.88`) as conditional-format sweep paints outward from `D10` into 4 structured ranges: `BẢNG TÍNH ĐỘNG`, `DASHBOARD KPI`, `CHECKLIST`, `LUỒNG DỮ LIỆU` | Shows computed order replacing manual mess |
| S5 | 25.0–38.5 s | **Hidden columns `Q:U` unhide** (`width 0 → 110 px`, showing `###` then crisp values!) while camera rides the reflow and colored **Reference Boxes** link `=PCTPR(ChatGPT; Claude; Gemini; Gems)` | Signature `spreadsheet` native moves (*Hidden columns* + *Reference boxes*) |
| S6 | 38.5–48.5 s | Locked wide comparison (`z 0.72`): a 10×10 block of **100 red workload cells** lifts and hops/filters down to **40 lime cells** while 3 merged checklist rows (`TÓM TẮT HỌP`, `BÁO CÁO NHANH`, `NGHIỆM THU 100%`) flash white → lime | Physical cell-count proof of 100% → 40% |
| S7 | 48.5–60.0 s | Pull out (`z 0.55 → 0.85`) over clean white workspace rows (`GIÁ TRỊ CAO`), pause in silence at 53.4 s, then banded **colour scale** blooms around a giant **Merged Cell Stage** typing `50–60%` and the final System Prompt → QA question | Pure spreadsheet payoff ending |

## 5. Beat Sheet, Cue Map & Sound Design

- **120 BPM** shared timeline (`master_vo_v2/vo_timeline.json`).
- **Foley (`window.EV`)**: crisp mechanical key clicks on every formula character, Enter clack+thump, selection-hop tick, rising sine blips on conditional-format cell sweeps, ratchet clicks when hidden PCTPR columns widen, cell-landing blips during 100→40 sort, air whoosh on big zooms.
- **Music**: Brisk office-percussion & mallet groove (marimba, xylophone, glockenspiel, pizzicato bass, crisp shaker/woodblock) that cuts cleanly to silence at `15.8–16.5 s` and `53.4–54.0 s`.
- **Subtitles**: Pale yellow cell-comment note (`#FFF9DB`, 1 px ink border, red corner triangle) docked lower-left clear of active cells, 2-line balanced wrap in self-hosted `Inter` / `Be Vietnam Pro`.
