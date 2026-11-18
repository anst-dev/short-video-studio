# TREATMENT — «PCTPR: Trở lại làm chủ thời gian» (dark-keynote · 1080x1920 @ 24fps · 60s)

Phim số 1/2 theo yêu cầu sản xuất. Phong cách: **Dark Tech Keynote** (`styles/dark-keynote/STYLE.md`).
Ngôn ngữ: tiếng Việt (giọng đọc OmniVoice đã Whisper-verify, timeline dùng chung `master_vo_v2/vo_timeline.json`).
Khổ: **dọc 1080x1920**, 24 fps, 60.0 s, master −14.0 LUFS / ≤ −1.0 dBTP. Accent phim: **lime `#B7F34A`**.

---

## 1. Ba cấu trúc ứng viên

1. **«Side by side»** — chia đôi màn hình dọc: nửa trên là workflow cũ đang chết đuối, nửa dưới là workflow PCTPR chạy đua và về đích trước. *Bỏ*: trên khung dọc 1080 px mỗi nửa chỉ còn ~540 px, không đủ negative space cho văn pháp keynote (một đường chữ một màn); hai câu hỏi hook của kịch bản sẽ không có sân khấu riêng.
2. **«Zoom ladder»** — một pixel → một ô bảng → một dashboard → cả đội. *Bỏ*: ladder giảng giải cấu trúc dữ liệu tốt nhưng cồng kềnh với câu chuyện "con người bị giải phóng khỏi giấy tờ"; kết thiếu bàn đạp cảm xúc cho con số 50–60%.
3. **«THE SNAP» — một hành trình UI duy nhất** *(CHỌN)*: mở đầu bằng cơn bão UI sinh ra theo luật (generated accumulation) → **Freeze** đưa cả thế hệ cảnh vào khung tĩnh trong khoảnh khắc hỏi → **The snap grid**: mọi mảnh hỗn loạn bay vào một lưới dashboard trong đúng một nhịp → **Light reveal** quét qua quy trình PCTPR → màn số khổng lồ 100→40 → **Put-away** dọn UI còn một không gian làm việc sạch → verdict + CTA. *Chọn vì*: chuyển hoá "hỗn loạn → hệ thống" của kịch bản chính là cú snap của văn pháp này; snap-grid là native move đặt ở cao trào; khung cuối **quay về bố cục mở đầu** (return to an earlier framing) tạo bookend "cùng bàn làm việc, khác thế giới".

## 2. Logline & arc

**Logline:** Trên sân khấu đen của một keynote, cả căn phòng giấy tờ của một team văn phòng được thu vào một cú click — và snaps thành một hệ thống AI có nhịp: PCTPR.

- **Setup (0–13.3s):** bão báo cáo/bảng tính/biên bản/email chồng chất; hai câu hỏi hook; vòng lặp sai lầm prompt ngắn → kết quả sáo → sửa tay.
- **Turn (13.3–25.5s):** FREEZE toàn màn, mọi âm thanh về digital zero → cú SNAP: hỗn loạn bay vào lưới dashboard; rồi CRT-off còn lại một tile — PCTPR.
- **Ending (25.5–60s):** light reveal quét pipeline 4 chặng + 3 GPTs/Gems chuyên biệt; con số khổng lồ **100% → 40%**; ba thẻ tự động hoá chạy đúng hẹn; put-away thành không gian gọn gàng; verdict "50–60%"; CTA.

## 3. Benchmark

- **Học:** văn pháp keynote phần mềm kiểu Linear/Vercel launch — motion bám grid, đường hairline 1px, một accent duy nhất, "one line per screen"; tiến trình nhạc kiểu process music (additive build / subtractive process) để nhạc là quy trình nhìn thấy được.
- **Không lấy:** không stage đen kiểu发布会 nào của hãng thật, không giao diện OS thật, không font/melody/logo của ai; không vẽ "chart rừng ràm" (một con số, không phải một biểu đồ).

## 4. Shot list (camera ≥ 4 move · chuyển cảnh = UI expand/collapse, không cross-fade)

| # | T | Shot | Framing · camera | Vì sao |
|---|---|------|------------------|--------|
| 1 | 0.0–5.0 | Bão UI sinh ra: file cards + notification tràn vào từ điểm sáng trung tâm | Medium, **continuous pull-back log-space** theo bar | generated accumulation — tải trọng lan toả, mở phim bằng năng lượng |
| 2 | 5.0–8.6 | Thẻ câu hỏi Q2 "caption/dịch thuật" + 2 badge chế nhạo pop | Close → **insert expand từ thẻ** | insert storm nửa giây biểu thị "quá nhiều để đọc" |
| 3 | 8.6–13.3 | Vòng lặp thất bại: prompt box gõ 3 chữ → kết quả sáo rỗng → red edit-marks đè dày → đồng hồ nung | **Push-in xuyên khung đóng băng** | time-stopped: sự bế tắc nhìn bằng cảm giác |
| 4 | 13.3–16.8 | **FREEZE**: mọi card ngừng giữa không trung, grid hiện 3% | Locked wide | im lặng số 1 — không khí nén lại trước cú quay đầu |
| 5 | 16.8–23.0 | **THE SNAP**: mọi mảnh bay theo curve-path vào lưới 6 tile (bảng tính động, KPI, checklist, sơ đồ luồng, biên bản, báo cáo); tick xanh nhân bản theo nhịp | **Whip pull-out một nhịp** | cause & effect trong một chuyển động — native move ở cao trào |
| 6 | 23.0–25.5 | **CRT-off**: cả lưới squash về một điểm, còn một tile tối | Pull to single tile | im lặng số 2; sân khấu trống đón PCTPR |
| 7 | 25.5–37.0 | Pipeline PCTPR trượt ngang: 4 trạm CHATGPT→CLAUDE→GEMINI→GPTS·GEMS lần lượt sáng theo light sweep; mỗi trạm một dòng vai trò mono | **Slow lateral track** + **light reveal ≤1.3s** | order được mắt đọc tuần tự; light là công cụ hé lộ |
| 8 | 38.8–43.4 | Con số khổng lồ **100%** scramble→lock, tụt xuống **40%** bounce-settle (Inter Tight 600, tracking −4.5%) | Locked ECU trên số — **không caption đè** | số là thông điệp; glyph-noise lock theo 1/16 nhịp |
| 9 | 43.4–48.4 | Ba thẻ automation: biên bản họp tự tóm tắt (transcript→minute), báo cáo dựng nhanh, checklist nghiệm thu tick từng dòng | Half-second inserts mở rộng từ nguồn | ba thắng lợi đọc trong 5s, mỗi thẻ đúng 1 ý |
| 10 | 48.4–53.3 | **Put-away**: UI tháo rời 1 phần/nhịp → còn 1 workspace sạch, con trỏ thở | Pull-out chậm, **return framing của shot 1** | bookend: cùng bàn làm việc đã khác thế giới |
| 11 | 53.9–57.0 | Verdict lớn "Thời gian xử lý giấy tờ giảm thực tế 50–60%." | Locked, chữ vào bằng light sweep | câu phán quyết — im lặng 0.6s ngay trước |
| 12 | 57.0–60.0 | CTA "Muốn dùng AI bài bản từ System Prompt đến kiểm chứng chất lượng?" + con trỏ nhấp nháy như chữ ký | Locked close | lời mời; CRT-off cuối phim |

## 5. Beat sheet (khóa lưới 120 BPM — beat 0.5s, bar 2.0s, 30 bar)

| T (s) | Bar/Beat | Hình ảnh | Âm thanh |
|-------|----------|----------|----------|
| 0.0 | B0 | glow trung tâm bật | sine pulse + fan room |
| 0.6 | B1.2 | card đầu rơi vào | file plop; VO c00 bắt đầu |
| 2.0–5.0 | B4–B10 | bão card tăng tốc, pull-back | stacking thumps dày dần |
| 5.0–5.5 | B10–11 | Q1 card expand | whoosh; VO c01 @5.2 |
| 6.5–8.5 | B13–17 | 2 badge "dịch thuật"/"caption" pop kiểu đùa | glass ticks lạc tông |
| 8.8 | B17.6 | prompt box mở | key ticks; VO c02 |
| 9.6–12.8 | B19.2–25.6 | kết quả sáo → edit marks đỏ chồng → đồng hồ nung | glitch accents + coil whine lên |
| **13.3** | **B26.6** | **FREEZE — mọi track về digital zero** | **IM LẶNG 1 (13.3–16.6)** |
| 16.8 | B33.6 | VO c03 — snap chuẩn bị | shaker 1 nhịp đơn |
| 17.6 | B35.2 | **SNAP**: toàn bộ bay vào grid (1 nhịp) | 1 shimmer in-key duy nhất |
| 18.0–22.8 | B36–45.6 | 6 tile sáng lần lượt theo nhịp; tick xanh theo note bảng | marimba additive build (1 note/bar→2→4) |
| **23.0** | **B46** | **CRT-off squash → 1 tile** | **IM LẶNG 2 (23.0–25.4)** |
| 25.5 | B51 | tile PCTPR bật; VO c04 | nhịp sine trở lại |
| 26.0–28.8 | B52–57.6 | CHATGPT + CLAUDE trạm sáng theo light sweep | vibraphone 2 note/loop |
| 31.2 | B62.4 | VO c05 — GEMINI + GPTS·GEMS | light sweep thứ 2 |
| 34.0–36.6 | B68–73.2 | 3 mini-tool specialist pop đúng nhịp | glockenspiel digit grains |
| 38.8 | B77.6 | VO c06 — số khổng lồ | pad trầm vào |
| 39.2–41.0 | B78.4–82 | 100% scramble→lock | digit grains lock từng 1/16 |
| 41.2–42.3 | B82.4–84.6 | tụt 100→40, bounce settle | marimba slide-down + thump |
| 43.4 | B86.8 | VO c07 — 3 thẻ automation | felt ticks một family |
| 44.0–47.8 | B88–95.6 | 3 thẻ vào lần lượt 1 bar/thẻ, tick nghiệm thu | glass taps in-key |
| 48.8 | B97.6 | VO c08 — put-away bắt đầu | nhạc thinned (subtractive) |
| 49.0–53.0 | B98–106 | UI tháo rời 1 phần/nhếp; workspace sạch | note bị gỡ bớt cho tới 1 |
| **53.3–53.9** | — | **breath** | **IM LẶNG 0.6s** |
| 54.0 | B108 | VO c09 — verdict sweep vào | 1 hợp âm landing duy nhất |
| 57.05 | B114.1 | VO c10 — CTA | pulse nhẹ + cursor tick |
| 59.6 | B119.2 | CRT-off kết | shimmer tắt khô |

## 6. Cue map nhạc (120 BPM · scale D-dorian · process music)

- **0–13.3 (Chaos):** hai voice cùng pattern lệch pha (phasing), plucked synth detune ±30 cent, pan ngẫu nhiên seed-cố định — "rác rải" nghe rời rạc.
- **13.3–16.6:** digital zero tuyệt đối mọi track.
- **16.8–23.0 (Snap & build):** additive build trên marimba D-mixolydian — bar 1 có 1 note, mỗi bar +1 note tới 4; shimmer in-key duy nhất tại nhịp snap.
- **23.0–25.4:** digital zero.
- **25.5–37.0 (Pipeline):** vibraphone_bowed pad + marimba 2-voice ổn định; light sweep gặp note legato; glockenspiel 1 note/mỗi trạm bật.
- **38.8–43.4 (Number):** bỏ percussion, chỉ sine pad trầm + digit grains; note "40" landing = hợp âm D duy nhất.
- **43.4–53.3 (Wins & put-away):** subtractive process — pattern 8 note bị gỡ dần còn 1 note cuối (như UI put-away).
- **53.9–60:** 1 hợp âm Dmaj7 landing tại verdict; pulse + cursor tick cho CTA; fade khô tại 59.6.

## 7. Bảng sound design

| Section | Ambience | Foley chính | Nhạc |
|---------|----------|-------------|------|
| Chaos | fan máy tính + coil whine nhẹ lên | file plop, stacking thumps, notification glass lạc tông | phasing plucks detuned |
| Failure | whine đỉnh | key ticks, glitch accents, đồng hồ nung | vòng lặp lệch pha dồn |
| Freeze ×2 | −60 dB room | không | digital zero |
| Snap/build | room sạch | whoosh bay, tick landing, tick xanh | marimba additive |
| Pipeline | không khí keynote | light-sweep shimmer, glass tap mỗi trạm | vibraphone_bowed pad |
| Number | gần im | digit grains | sine pad |
| Wins | room | felt ticks, ding checklist | pattern bị gỡ dần |
| Put-away/End | fan rất khẽ | pop tháo UI, cursor tick | subtractive còn 1 note; hợp âm kết |

Mix: voice nén (thr .24/ratio 3.4), nhạc duck ~9.5 dB (gain .33), foley duck ~4 dB dưới lời; −14 LUFS, TP ≤ −1.0 dBTP.

## 8. Chữ & phụ đề

- Inter (UI/headline, var weight), **Inter Tight 600** cho số khổng lồ (tracking −4.5%), **JetBrains Mono** label small-caps tracking rộng. 100% self-hosted OFL (`fonts/`), nạp `document.fonts.load` đầy đủ glyph Việt mẫu "Team mọi người đã áp dụng AI…" trước `window.READY`.
- Caption = toast UI đáy (pill đen translucent, viền 1px, dot accent phát nói, Inter 500 ~40px trên khung dọc thu nhỏ ~30px): vào rise+fade 0.16s, hold ≥ max(1.8s, speech+0.6s). **Màn số khổng lồ không đè caption** (số là thông điệp — chỉ còn trong .srt); verdict/CTA hiển thị hero-line riêng nên caption cũng ẩn, chống "đọc hai lần".
- Layout dọc 1080×1920: safe area x∈[64,1016], y∈[110,1660]; caption zone y≈1700–1800; mọi label ≥15px, headline ≥40px, contrast ≥4.5:1; không emoji hệ điều hành — icon vector tự vẽ.
