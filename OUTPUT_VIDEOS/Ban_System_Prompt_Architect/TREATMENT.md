# TREATMENT — d06_system_prompt_architect (`dashi-flat-flowchart`)

- **Style:** `dashi-flat-flowchart` — Cream & Amber Flowchart (扁平流程图)
- **Spec đã đọc:** `dashi-animationstyle/styles/扁平流程图/风格卡.md` và `模板.html`
- **Khung hình:** `1920x1080 @ 24fps`, mục tiêu khoảng `88–90s` (khóa đúng `window.DUR` sau khi có `vo_timeline.json`)
- **Khán giả:** nhân viên văn phòng, quản lý, người mới dùng AI. Giải thích **cách làm**, không đọc lại toàn bộ prompt gốc.
- **Giọng:** OmniVoice, token `male, moderate pitch` (nam, cao độ vừa — giọng nam miền Bắc của model), `speed: 1.1`. Không dùng edge-tts.
- **Nhạc:** marimba + vibraphone, nền cream/amber, duck dưới lời thoại, hai khoảng lặng kịch tính tắt nhạc.

## 1. Ba cấu trúc và cấu trúc được chọn

- **A — Đọc 6 phần như slide:** liệt kê IDENTITY → RULES. Dễ thành danh sách, lệch thế mạnh của flowchart.
- **B — Một ví dụ email từ đầu đến cuối:** dễ hiểu nhưng chìm quy trình 9 bước.
- **C — CHỌN: một câu thô chạy trên đường ngang 7 trạm.** Mở bằng câu người dùng gõ, máy ảnh trượt từng trạm đúng thứ tự làm việc, kết bằng ba lớp đầu ra và dấu «dùng ngay».

Vì sao chọn C: phong cách này dành cho «trước làm gì, sau làm gì, cuối được gì». Nội dung là quy trình 9 bước.

## 2. Logline và cung

- **Logline:** Bạn chỉ gõ một câu ngắn. System Prompt Architect không làm hộ việc đó. Nó chạy 9 bước và trả một System Prompt 6 phần, dùng được ngay.
- **Setup:** Một câu thô («tạo trợ lý viết email») trông như nhờ AI viết hộ.
- **Turn:** Trợ lý từ chối làm hộ, nhận vai kiến trúc sư, và lần lượt giữ ý đã có, tự suy luận, đặt `{{biến}}`.
- **Ending:** Sáu phần nằm trong một khối mã, kèm giải thích ngắn và gợi ý tài liệu. Sao chép là dùng.

**Học:** một câu thô là yêu cầu thiết kế trợ lý, không phải yêu cầu làm việc lẻ.
**Không lấy:** không biến video thành bản system prompt đầy đủ để người xem chép từ màn hình.

## 3. Bảng màu và vai nhấn (đúng thẻ phong cách)

| Vai | Màu | Dùng cho |
|---|---|---|
| Nền kem | `#fcf9ec` | Toàn khung |
| Giấy | `#fffdf6` | Cửa sổ chat, thẻ, khối mã |
| Hổ phách | `#fbbf2f` / `#f7a30e` | Băng tiêu đề, số thứ tự, mũi tên, hộp giải thích |
| Mực | `#1a1410` | Chữ chính |
| **COL_A đỏ** | `#d41928` | Cụm «System Prompt» (khái niệm phải nhớ, xuất hiện từ trạm đầu) |
| **COL_B xanh** | `#2373ce` | Cụm «sáu phần» |
| Xoay phụ | cam `#ee8013`, lục `#4f9d34`, vàng `#d98e04` | Chip ví dụ, không đụng A/B |

Bút dạ hổ phách dưới phụ đề: «không làm hộ», «dùng ngay», «{{biến}}».

## 4. Danh sách cảnh — thế giới ngang, máy ảnh trượt trạm

Thế giới đặt 7 trạm, tâm cách nhau 1700px. Tiêu đề hổ phách cố định. Phụ đề một dòng, đáy y=993, ẩn khi `?nosub=1`. Vùng chủ thể nằm trong y thế giới khoảng 220–820 để không đụng băng tiêu đề và đáy phụ đề khi máy ảnh đẩy gần 10%.

| Trạm | Câu | Hình | Chuyển cảnh vào trạm |
|---|---|---|---|
| 0 Một câu thô | c00–c03 | Cửa sổ chat, chữ gõ dần, bong bóng ví dụ, dấu từ chối đỏ, thẻ System Prompt | Mở màn: lỗ tròn hổ phách 0–0.62s |
| 1 Kiến trúc sư | c04–c05 | Sáu thẻ vai trò / người dùng / năng lực / quy trình / đầu ra / luật + hộp «không làm hộ» | Trượt ngang |
| 2 Đọc yêu cầu | c06–c07 | Bước 1 «mọi câu = thiết kế», bước 2 bốn ô vai trò / ai dùng / đầu vào / đầu ra | Quét khối màu |
| 3 Điền chỗ trống | c08–c10 | Ba cột: giữ ý đã có, tự suy luận, `{{biến}}` | Mặt nạ tròn |
| 4 Hỏi khi bí | c11–c12 | Vẫn có bản nháp, tối đa 3 câu, gạch «chỉ hỏi suông» | Trượt ngang |
| 5 Soạn và kiểm | c13–c14 | Khối 6 dòng hiện dần + phiếu tự kiểm 4 dấu | Quét khối màu |
| 6 Ba lớp đầu ra | c15–c16 | Ba tầng: khối mã, giải thích ≤5, knowledge ≤5, dấu DÙNG NGAY (rung nhẹ) | Mặt nạ tròn |

Chuyển cảnh xoay vòng **trượt ngang → quét khối → mặt nạ tròn**, không lặp liền hai lần. Nền: vòng đồng hồ (kim chạy) + hình học phẳng trôi. Mũi tên cong có hạt chảy sau khi vẽ xong. Mỗi câu có một vật mới xuất hiện (pop 0.35–0.45s).

## 5. Âm thanh, lưới 120 BPM và hai khoảng lặng

- Lưới gợi ý: 120 BPM = 0.5s/nhịp, 2.0s/ô. Mốc lời thoại khóa lại theo `vo_timeline.json` sau OmniVoice, không viết cứng giây trong cảnh.
- **Lặng 1:** trước c04 (hé lộ vai kiến trúc sư), `min_gap` 0.75s, `window.EV` type `silence`.
- **Lặng 2:** trước c11 (ngoại lệ bước sáu: vẫn viết nháp), `min_gap` 0.75s, `window.EV` type `silence`.
- Foley: `pop` khi vào trạm, `whoosh` khi đổi trạm, `click` lúc gõ/chip, `ding` lúc đóng dấu dùng ngay.
- Lời nói khoảng 60–70% thời lượng phim. Câu `say` không có chữ số. Khoảng thở ≥ 0.40s, hai nhịp kịch ≥ 0.75s. Lời kết thúc trước `DUR - 0.35s`.

## 6. Việc không làm

- Không dùng `edge-tts`, không font macOS, không `-apple-system`.
- Không sửa file trong `dashi-animationstyle/styles/` hay `pipeline/`.
- Không giao video nếu `qa_gate.py` khác 0 hoặc ảnh contact còn đè chữ.
