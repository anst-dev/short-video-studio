// film.js — Swiss Motion Graphics: Cẩm Nang Toàn Diện Điều Phối AI (12-Column Grid, 120 BPM)
// 4 Pillars: Khái niệm cơ bản -> Tư duy điều phối -> Khung PCTPR -> Yếu tố con người & Pháp lý
import { clamp, lerp, seg, E, snap, lin, steps, E8, E16, BEAT, BAR } from './ease.js';

export const W = 1920, H = 1080;
const C = {
  page: '#EAE9E5',
  paper: '#FFFFFF',
  ink: '#111111',
  red: '#E30613',      // The ONLY signal colour in Swiss International Style
  grid: '#D5D4CE',
  pgrid: '#EBEAE5',
  grey: '#C4C2BA',
  mute: '#6E6D66',
  darkBg: '#111318',
  darkCard: '#1A1D24',
};

// 12-column Zurich modular grid: margin 96px, gutter 24px, col width 122px -> 12*122 + 11*24 + 2*96 = 1920px
const FM = 96, FG = 24, FC = 122;
const fx = col => FM + col * (FC + FG);
const cwSpan = n => n * FC + (n - 1) * FG;

function setFont(g, wt, px) {
  g.font = `${wt} ${px}px Archivo`;
  if (g.letterSpacing !== undefined) {
    g.letterSpacing = px >= 84 ? `${(-px * 0.024).toFixed(1)}px` : '0px';
  }
}

function clipLine(g, str, x, y, wt, px, pIn, pOut = 0, color = C.ink, align = 'left') {
  if (pIn <= 0 || pOut >= 1 || !str) return;
  setFont(g, wt, px);
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  const tw = g.measureText(str).width + px * 0.2;
  const rx = align === 'center' ? x - tw / 2 : align === 'right' ? x - tw : x;
  g.save();
  g.beginPath();
  g.rect(rx - 6, y - px * 1.06, tw + 12, px * 1.34);
  g.clip();
  g.fillText(str, x, y + (1 - pIn) * px * 1.12 - pOut * px * 1.25);
  g.restore();
}

function wrapSwiss(g, str, wt, px, maxW) {
  setFont(g, wt, px);
  const words = str.split(' ');
  const out = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (g.measureText(test).width > maxW && cur) { out.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) out.push(cur);
  return out;
}

function drawGridLines(g, showCols = true, dark = false) {
  g.fillStyle = dark ? C.darkBg : C.page;
  g.fillRect(0, 0, W, H);
  if (showCols) {
    g.fillStyle = dark ? '#222630' : C.grid;
    for (let c = 0; c < 12; c++) {
      g.fillRect(fx(c), 0, 1, H);
      g.fillRect(fx(c) + FC, 0, 1, H);
    }
    for (let y = 72; y < H; y += 72) g.fillRect(0, y, W, 1);
  }
  // Top header rule
  g.fillStyle = dark ? '#FFFFFF' : C.ink;
  g.fillRect(FM, 56, W - 2 * FM, 2);
  setFont(g, 700, 15);
  g.fillStyle = dark ? '#FFFFFF' : C.ink; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.fillText('CẨM NANG TOÀN DIỆN  ·  4 TRỤ CỘT ĐIỀU PHỐI AI BÀI BẢN', FM, 42);
  g.fillStyle = C.red;
  g.fillText('KHÁI NIỆM · TƯ DUY · PCTPR · CON NGƯỜI', fx(5), 42);
  g.textAlign = 'right';
  g.fillStyle = dark ? C.grey : C.mute;
  g.fillText('ZURICH 12-COL GRID', W - FM, 42);
  g.textAlign = 'left';
}

function drawEditorialSub(g, textStr, pIn, pOut, dark = false) {
  if (pIn <= 0 || pOut >= 1 || !textStr) return;
  const x = FM, w = cwSpan(12), yRule = 958;
  g.save();
  g.fillStyle = dark ? C.darkBg : C.page;
  g.fillRect(FM - 8, yRule - 6, w + 16, 114);
  g.fillStyle = dark ? '#FFFFFF' : C.ink;
  g.fillRect(x, yRule, w * pIn, 2);
  g.fillStyle = C.red;
  g.fillRect(x, yRule, 64 * pIn, 4);

  setFont(g, 700, 15);
  g.fillStyle = C.red; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.fillText('THUYẾT MINH', x, yRule + 26);

  const lines = wrapSwiss(g, textStr, 700, 26, cwSpan(10) - 20);
  lines.forEach((ln, idx) => {
    clipLine(g, ln, fx(2), yRule + 32 + idx * 34, 700, 26, pIn, pOut, dark ? '#FFFFFF' : C.ink);
  });
  g.restore();
}

export function initSwissFilm(canvas, voTimeline, customDur = 160.0) {
  const g = canvas.getContext('2d');
  const NOSUB = /[?&]nosub=1/.test(location.search);

  const VO = (voTimeline || []).map((c, idx, arr) => {
    const nextT0 = idx + 1 < arr.length ? arr[idx + 1].t0 - 0.12 : customDur - 0.15;
    const c0 = Math.max(0.05, c.t0 - 0.08);
    const c1 = Math.min(nextT0, Math.max(c.t1 + 0.55, c0 + 1.85));
    return { ...c, c0, c1 };
  });

  const DUR = VO.length ? Math.ceil(VO[VO.length - 1].t1 + 3.0) : customDur;

  // Foley Events & 2 Planned Dramatic Silences
  const EV = [];
  const sil1 = VO.length >= 12 ? VO[11].t0 - 0.80 : 108.5;
  const sil2 = VO.length >= 15 ? VO[14].t0 - 0.80 : 138.8;
  EV.push({ t: sil1, dur: 0.75, type: 'silence' });
  EV.push({ t: sil2, dur: 0.75, type: 'silence' });
  VO.forEach(c => {
    EV.push({ t: c.t0, type: 'snap_click' });
    if (c.t1 - c.t0 > 4.0) EV.push({ t: c.t0 + 2.0, type: 'module_lock' });
  });
  EV.push({ t: 1.2, type: 'block_thud' });
  EV.push({ t: sil1 + 0.85, type: 'stamp_ding' });
  EV.push({ t: sil2 + 0.85, type: 'stamp_ding' });
  EV.sort((a, b) => a.t - b.t);

  window.DUR = DUR;
  window.EV = EV;

  // Cue Lookup helper
  function cueP(idx, t) {
    if (!VO[idx]) return { active: false, pIn: 0, pOut: 0, t0: idx * 10, t1: idx * 10 + 8, sub: '' };
    const c = VO[idx];
    const pIn = snap(t, c.c0 + 0.25, 0.35);
    const pOut = snap(t, c.c1 + 0.15, 0.25);
    return { active: t >= c.c0 && t <= c.c1, pIn, pOut, t0: c.t0, t1: c.t1, sub: c.sub };
  }

  // ── Spread 0: Overview & 4 Pillars (c00) ──
  function drawSpread0(t) {
    drawGridLines(g, true, false);
    const cp = cueP(0, t);
    const p0 = snap(t, 0.9, BEAT);

    clipLine(g, 'CẨM NANG TOÀN DIỆN', FM, 160, 900, 68, p0, 0, C.ink);
    clipLine(g, '4 TRỤ CỘT ĐIỀU PHỐI AI BÀI BẢN', FM, 230, 900, 64, p0, 0, C.red);
    g.fillStyle = C.ink; g.fillRect(FM, 256, cwSpan(12) * p0, 4);

    // 4 Modular Pillars Cards
    const pillars = [
      { num: '01', title: 'BẢN CHẤT CỐT LÕI', desc: 'LLM, Token, Cửa sổ ngữ cảnh, Ảo giác (Hallucination)' },
      { num: '02', title: 'TƯ DUY ĐIỀU PHỐI', desc: 'Thực tập sinh siêu tốc, Thu hẹp xác suất, Tổng công trình sư' },
      { num: '03', title: 'KHUNG PROMPT PCTPR', desc: '5 chiều kích chuẩn mực + Tách biệt khuôn hệ thống và dữ liệu' },
      { num: '04', title: 'YẾU TỐ CON NGƯỜI', desc: 'AI không ngồi tù thay bạn, Trách nhiệm pháp lý, Kiểm chứng 4 bước' },
    ];

    pillars.forEach((p, i) => {
      const col = i * 3;
      const x = fx(col), w = cwSpan(3), y = 310, h = 570;
      const cardP = snap(t, 1.1 + i * 0.15, E8);
      g.save();
      g.fillStyle = i === 3 ? C.red : C.paper;
      g.fillRect(x, y, w, h * cardP);
      g.strokeStyle = C.ink; g.lineWidth = 2;
      g.strokeRect(x, y, w, h * cardP);

      if (cardP > 0.6) {
        clipLine(g, p.num, x + 24, y + 100, 900, 78, cardP, 0, i === 3 ? C.paper : C.red);
        g.fillStyle = i === 3 ? C.paper : C.ink;
        g.fillRect(x + 24, y + 120, w - 48, 2);
        const tLines = wrapSwiss(g, p.title, 800, 24, w - 48);
        tLines.forEach((ln, lidx) => {
          clipLine(g, ln, x + 24, y + 160 + lidx * 30, 800, 24, cardP, 0, i === 3 ? C.paper : C.ink);
        });
        const dLines = wrapSwiss(g, p.desc, 500, 18, w - 48);
        dLines.forEach((ln, lidx) => {
          clipLine(g, ln, x + 24, y + 260 + lidx * 26, 500, 18, cardP, 0, i === 3 ? '#FFE5E5' : C.mute);
        });
      }
      g.restore();
    });
  }

  // ── Spread 1: Trụ Cột 1 — Bản Chất Kỹ Thuật (c01, c02, c03) ──
  function drawSpread1(t) {
    drawGridLines(g, true, false);
    const pIn = snap(t, cueP(1, t).t0 - 0.2, BEAT);

    clipLine(g, '01 / TRỤ CỘT BẢN CHẤT KỸ THUẬT', FM, 140, 900, 48, pIn, 0, C.red);
    g.fillStyle = C.ink; g.fillRect(FM, 160, cwSpan(12) * pIn, 3);

    // Box 1: LLM = Cỗ máy xác suất (Cols 0..3)
    const x1 = fx(0), w1 = cwSpan(4), y1 = 190, h1 = 700;
    const pBox1 = snap(t, cueP(1, t).t0, E8);
    g.fillStyle = C.paper; g.fillRect(x1, y1, w1, h1 * pBox1);
    g.strokeStyle = C.ink; g.lineWidth = 2; g.strokeRect(x1, y1, w1, h1 * pBox1);
    if (pBox1 > 0.6) {
      clipLine(g, 'LLM & XÁC SUẤT', x1 + 24, y1 + 54, 800, 28, pBox1, 0, C.ink);
      clipLine(g, 'DỰ ĐOÁN TỪ TIẾP THEO', x1 + 24, y1 + 86, 700, 18, pBox1, 0, C.mute);
      g.fillStyle = C.ink; g.fillRect(x1 + 24, y1 + 104, w1 - 48, 1);

      const words = ['AI', 'không', 'có', 'ý thức', 'như', 'người'];
      words.forEach((w, wi) => {
        const wp = snap(t, cueP(1, t).t0 + 0.3 + wi * 0.12, 0.2);
        g.fillStyle = wi === 3 ? C.red : C.page;
        g.fillRect(x1 + 24, y1 + 130 + wi * 42, (w1 - 48) * wp, 34);
        clipLine(g, `P(w_${wi+1}) = "${w}"`, x1 + 36, y1 + 154 + wi * 42, 700, 16, wp, 0, wi === 3 ? C.paper : C.ink);
      });
      clipLine(g, 'Giống thủ thư đọc vạn sách, ghép từ nghe hợp tai nhất.', x1 + 24, y1 + 420, 600, 18, pBox1, 0, C.ink);
    }

    // Box 2: Token & Context Window (Cols 4..7)
    const x2 = fx(4), w2 = cwSpan(4), y2 = 190, h2 = 700;
    const pBox2 = snap(t, cueP(2, t).t0, E8);
    g.fillStyle = C.paper; g.fillRect(x2, y2, w2, h2 * pBox2);
    g.strokeStyle = C.ink; g.lineWidth = 2; g.strokeRect(x2, y2, w2, h2 * pBox2);
    if (pBox2 > 0.6) {
      clipLine(g, 'TOKEN & NGỮ CẢNH', x2 + 24, y2 + 54, 800, 28, pBox2, 0, C.ink);
      clipLine(g, 'CHIẾC BÀN LÀM VIỆC HỮU HẠN', x2 + 24, y2 + 86, 700, 18, pBox2, 0, C.mute);
      g.fillStyle = C.ink; g.fillRect(x2 + 24, y2 + 104, w2 - 48, 1);

      // Token bricks representation
      const tokens = ['[Quản]', '[trị]', '[hệ]', '[thống]', '[AI]'];
      tokens.forEach((tk, ti) => {
        const tp = snap(t, cueP(2, t).t0 + 0.2 + ti * 0.1, 0.15);
        g.fillStyle = C.ink;
        g.fillRect(x2 + 24 + ti * 68, y2 + 132, 64 * tp, 40);
        clipLine(g, tk, x2 + 31 + ti * 68, y2 + 158, 700, 16, tp, 0, C.paper);
      });

      // Desk visual
      g.fillStyle = C.page; g.fillRect(x2 + 24, y2 + 210, w2 - 48, 180);
      g.strokeStyle = C.red; g.lineWidth = 2; g.strokeRect(x2 + 24, y2 + 210, w2 - 48, 180);
      clipLine(g, 'MẶT BÀN GHI NHỚ NGẮN HẠN', x2 + 36, y2 + 246, 700, 16, pBox2, 0, C.red);
      clipLine(g, 'Nhét quá nhiều việc -> Bàn tràn -> Quên quy tắc ban đầu!', x2 + 36, y2 + 290, 500, 16, pBox2, 0, C.ink);
      clipLine(g, '-> Xóa cột thừa, tách ô chat theo từng việc riêng!', x2 + 36, y2 + 330, 700, 16, pBox2, 0, C.ink);
    }

    // Box 3: Ảo giác AI (Cols 8..11)
    const x3 = fx(8), w3 = cwSpan(4), y3 = 190, h3 = 700;
    const pBox3 = snap(t, cueP(3, t).t0, E8);
    g.fillStyle = C.paper; g.fillRect(x3, y3, w3, h3 * pBox3);
    g.strokeStyle = C.red; g.lineWidth = 3; g.strokeRect(x3, y3, w3, h3 * pBox3);
    if (pBox3 > 0.6) {
      clipLine(g, 'ẢO GIÁC (HALLUCINATION)', x3 + 24, y3 + 54, 800, 26, pBox3, 0, C.red);
      clipLine(g, 'BẪY TỰ TIN NGUY HIỂM NHẤT', x3 + 24, y3 + 86, 700, 18, pBox3, 0, C.mute);
      g.fillStyle = C.red; g.fillRect(x3 + 24, y3 + 104, w3 - 48, 2);

      g.fillStyle = '#FFF1F2'; g.fillRect(x3 + 24, y3 + 126, w3 - 48, 140);
      clipLine(g, 'VĂN BẢN MA DO AI TỰ BỊA:', x3 + 36, y3 + 160, 700, 16, pBox3, 0, C.red);
      clipLine(g, '• Thông tư số 999/2026/BTC (KHÔNG TỒN TẠI)', x3 + 36, y3 + 196, 600, 15, pBox3, 0, C.ink);
      clipLine(g, '• Tự cộng tổng tiền sai để câu văn xuôi tai', x3 + 36, y3 + 226, 600, 15, pBox3, 0, C.ink);

      // Slamming Stamp
      const stampP = snap(t, cueP(3, t).t0 + 1.2, 0.2);
      if (stampP > 0) {
        g.save();
        g.translate(x3 + w3 / 2, y3 + 340);
        g.rotate(-0.08);
        g.fillStyle = C.red;
        g.fillRect(-140 * stampP, -30 * stampP, 280 * stampP, 60 * stampP);
        clipLine(g, 'HƯ CẤU 100%!', 0, 12, 900, 32, stampP, 0, C.paper, 'center');
        g.restore();
      }
    }
  }

  // ── Spread 2: Trụ Cột 2 — Tư Duy Khi Làm Việc Với AI (c04, c05, c06) ──
  function drawSpread2(t) {
    drawGridLines(g, true, false);
    const pIn = snap(t, cueP(4, t).t0 - 0.2, BEAT);

    clipLine(g, '02 / TRỤ CỘT TƯ DUY ĐIỀU PHỐI HỆ THỐNG', FM, 140, 900, 48, pIn, 0, C.red);
    g.fillStyle = C.ink; g.fillRect(FM, 160, cwSpan(12) * pIn, 3);

    // Left Panel: Đừng coi AI là đũa thần -> Thực tập sinh siêu tốc (Cols 0..5)
    const xl = fx(0), wl = cwSpan(6), yl = 190, hl = 700;
    const pl = snap(t, cueP(4, t).t0, E8);
    g.fillStyle = C.paper; g.fillRect(xl, yl, wl, hl * pl);
    g.strokeStyle = C.ink; g.lineWidth = 2; g.strokeRect(xl, yl, wl, hl * pl);
    if (pl > 0.6) {
      clipLine(g, 'AI LÀ AI TRONG DOANH NGHIỆP?', xl + 36, yl + 60, 800, 32, pl, 0, C.ink);
      g.fillStyle = C.ink; g.fillRect(xl + 36, yl + 84, wl - 72, 1);

      // Wrong mindset vs Right mindset
      g.fillStyle = '#FFF1F2'; g.fillRect(xl + 36, yl + 110, wl - 72, 120);
      clipLine(g, 'SAI LẦM PHỔ BIẾN: Coi AI là "Cây đũa thần"', xl + 54, yl + 150, 700, 20, pl, 0, C.red);
      clipLine(g, '-> Ra lệnh 3 từ: "Làm báo cáo đi" -> Nhận lại rác văn mẫu!', xl + 54, yl + 190, 500, 18, pl, C.ink);

      g.fillStyle = '#F0FDF4'; g.fillRect(xl + 36, yl + 250, wl - 72, 160);
      clipLine(g, 'TƯ DUY CHUẨN: "Thực tập sinh thiên tài tốc độ cao"', xl + 54, yl + 290, 800, 22, pl, 0, C.ink);
      clipLine(g, '• Cần đề bài chi tiết, tiêu chuẩn nghiệm thu rõ ràng', xl + 54, yl + 330, 600, 18, pl, C.ink);
      clipLine(g, '• Đưa nguyên liệu chuẩn -> Cho ra bản thảo thần tốc!', xl + 54, yl + 365, 600, 18, pl, C.ink);
    }

    // Right Panel: Thu hẹp xác suất & Chuyển vai Tổng công trình sư (Cols 6..11)
    const xr = fx(6), wr = cwSpan(6), yr = 190, hr = 700;
    const pr = snap(t, cueP(5, t).t0, E8);
    g.fillStyle = C.paper; g.fillRect(xr, yr, wr, hr * pr);
    g.strokeStyle = C.ink; g.lineWidth = 2; g.strokeRect(xr, yr, wr, hr * pr);
    if (pr > 0.6) {
      clipLine(g, 'THU HẸP ĐẠI DƯƠNG XÁC SUẤT', xr + 36, yr + 60, 800, 32, pr, 0, C.ink);
      g.fillStyle = C.ink; g.fillRect(xr + 36, yr + 84, wr - 72, 1);

      // Visual cone of probability narrowing
      const pCone = snap(t, cueP(5, t).t0 + 0.3, 0.4);
      g.fillStyle = C.page;
      g.beginPath();
      g.moveTo(xr + 60, yr + 120);
      g.lineTo(xr + wr - 60, yr + 120);
      g.lineTo(xr + wr / 2, yr + 280);
      g.closePath();
      g.fill();
      g.fillStyle = C.red;
      g.beginPath();
      g.arc(xr + wr / 2, yr + 280, 14 * pCone, 0, Math.PI * 2);
      g.fill();
      clipLine(g, 'Đại dương xác suất Internet (Bình thường / Vô giá trị)', xr + wr / 2, yr + 150, 600, 16, pr, 0, C.mute, 'center');
      clipLine(g, 'TIÊU ĐIỂM CHÍNH XÁC 9/10', xr + wr / 2, yr + 325, 800, 20, pCone, 0, C.red, 'center');

      // Elevation from Doer to Architect
      const pArch = snap(t, cueP(6, t).t0, 0.3);
      g.fillStyle = C.ink; g.fillRect(xr + 36, yr + 360, wr - 72, 140 * pArch);
      if (pArch > 0.6) {
        clipLine(g, 'NÂNG TẦM VỊ THẾ BẢN THÂN:', xr + 54, yr + 400, 700, 18, pArch, 0, C.grey);
        clipLine(g, 'THỢ GÕ SỬA TAY -> TỔNG CÔNG TRÌNH SƯ', xr + 54, yr + 440, 800, 24, pArch, 0, C.paper);
        clipLine(g, 'Thiết kế đề bài chuẩn mực & Nghiệm thu chất lượng.', xr + 54, yr + 475, 500, 16, pArch, 0, C.red);
      }
    }
  }

  // ── Spread 3: Trụ Cột 3 — Khung Prompt Chuẩn PCTPR (c07, c08, c09, c10) ──
  function drawSpread3(t) {
    drawGridLines(g, true, false);
    const pIn = snap(t, cueP(7, t).t0 - 0.2, BEAT);

    clipLine(g, '03 / KHUNG THIẾT KẾ PROMPT CHUẨN PCTPR', FM, 140, 900, 48, pIn, 0, C.red);
    g.fillStyle = C.ink; g.fillRect(FM, 160, cwSpan(12) * pIn, 3);

    // 5 Rows for P - C - T - P - R (Cols 0..7)
    const xp = fx(0), wp = cwSpan(8), yp = 190;
    const pctprItems = [
      { k: 'P', name: 'PERSONA', desc: 'Khóa lăng kính chuyên gia, hệ từ vựng chuyên ngành sâu' },
      { k: 'C', name: 'CONTEXT', desc: 'Neo biên giới thực tế, số liệu và tình hình doanh nghiệp' },
      { k: 'T', name: 'TASK', desc: 'Động từ hành động biến đổi dứt khoát, không nhờ vả mơ hồ' },
      { k: 'P', name: 'PATTERN', desc: 'Khuôn mẫu trực quan: Bảng, gạch đầu dòng, giảm tải não người đọc' },
      { k: 'R', name: 'RULES', desc: 'Vùng cấm tiêu cực: Cấm bịa đặt, bắt báo "Chưa đủ căn cứ" nếu thiếu' },
    ];

    pctprItems.forEach((item, idx) => {
      const iy = yp + idx * 82;
      const ip = snap(t, cueP(7, t).t0 + idx * 0.15, E8);
      g.save();
      g.fillStyle = idx === 4 ? '#FFF1F2' : C.paper;
      g.fillRect(xp, iy, wp, 72 * ip);
      g.strokeStyle = idx === 4 ? C.red : C.ink; g.lineWidth = 2;
      g.strokeRect(xp, iy, wp, 72 * ip);

      if (ip > 0.6) {
        g.fillStyle = idx === 4 ? C.red : C.ink;
        g.fillRect(xp + 16, iy + 14, 44, 44);
        clipLine(g, item.k, xp + 38, iy + 46, 900, 30, ip, 0, C.paper, 'center');
        clipLine(g, `[${item.k} — ${item.name}]`, xp + 76, iy + 45, 800, 22, ip, 0, idx === 4 ? C.red : C.ink);
        clipLine(g, item.desc, xp + 260, iy + 45, 500, 17, ip, 0, C.mute);
      }
      g.restore();
    });

    // Right Side: Separation of Logic vs Data (Cols 8..11) (c10)
    const xd = fx(8), wd = cwSpan(4), yd = 190, hd = 410;
    const pd = snap(t, cueP(10, t).t0, E8);
    g.fillStyle = C.paper; g.fillRect(xd, yd, wd, hd * pd);
    g.strokeStyle = C.ink; g.lineWidth = 2; g.strokeRect(xd, yd, wd, hd * pd);
    if (pd > 0.6) {
      clipLine(g, 'TÁCH RỜI LOGIC VÀ DỮ LIỆU', xd + 24, yd + 50, 800, 24, pd, 0, C.ink);
      g.fillStyle = C.ink; g.fillRect(xd + 24, yd + 70, wd - 48, 1);

      g.fillStyle = C.page; g.fillRect(xd + 24, yd + 90, wd - 48, 120);
      clipLine(g, 'KHUÔN DÂY CHUYỀN HỆ THỐNG', xd + 36, yd + 124, 700, 16, pd, 0, C.ink);
      clipLine(g, '5 khối [P - C - T - P - R] giữ cố định.', xd + 36, yd + 160, 500, 16, pd, C.mute);
      clipLine(g, 'Đạt chuẩn 9/10, rèn một lần duy nhất!', xd + 36, yd + 190, 700, 16, pd, C.red);

      g.fillStyle = C.ink; g.fillRect(xd + 24, yd + 230, wd - 48, 140);
      clipLine(g, 'BIẾN ĐẦU VÀO ĐỘNG [INPUT]', xd + 36, yd + 268, 800, 18, pd, 0, C.paper);
      clipLine(g, '{{TÀI_LIỆU_CẦN_TÓM_TẮT}}', xd + 36, yd + 304, 600, 16, pd, 0, C.red);
      clipLine(g, 'Thay dữ liệu mới -> Chạy 100 lần nhất quán!', xd + 36, yd + 342, 500, 15, pd, 0, C.grey);
    }
  }

  // ── Spread 4: Trụ Cột 4 — Yếu Tố Con Người & Pháp Lý (c11, c12, c13) (DARK INVERTED) ──
  function drawSpread4(t) {
    drawGridLines(g, true, true);
    const pIn = snap(t, cueP(11, t).t0 - 0.2, BEAT);

    clipLine(g, '04 / YẾU TỐ CON NGƯỜI & TRÁCH NHIỆM PHÁP LÝ', FM, 140, 900, 48, pIn, 0, C.red);
    g.fillStyle = '#FFFFFF'; g.fillRect(FM, 160, cwSpan(12) * pIn, 3);

    // Giant Wake-Up Call Banner (c11)
    const xb = FM, wb = cwSpan(12), yb = 190, hb = 160;
    const pb = snap(t, cueP(11, t).t0, E8);
    g.fillStyle = '#1F2430'; g.fillRect(xb, yb, wb, hb * pb);
    g.strokeStyle = C.red; g.lineWidth = 3; g.strokeRect(xb, yb, wb, hb * pb);
    if (pb > 0.6) {
      clipLine(g, 'SỰ THẬT TỐI HẬU: AI KHÔNG CÓ TƯ CÁCH PHÁP NHÂN!', xb + 36, yb + 60, 900, 36, pb, 0, '#FFFFFF');
      clipLine(g, 'AI KHÔNG NỘP PHẠT THAY VÀ KHÔNG THỂ NGỒI TÙ THAY CHỮ KÝ CỦA BẠN.', xb + 36, yb + 115, 800, 32, pb, 0, C.red);
    }

    // Left Column: Trách Nhiệm Chữ Ký (c12) (Cols 0..5)
    const xl = fx(0), wl = cwSpan(6), yl = 370, hl = 520;
    const pl = snap(t, cueP(12, t).t0, E8);
    g.fillStyle = C.darkCard; g.fillRect(xl, yl, wl, hl * pl);
    g.strokeStyle = '#2B313E'; g.lineWidth = 2; g.strokeRect(xl, yl, wl, hl * pl);
    if (pl > 0.6) {
      clipLine(g, 'CHỮ KÝ VÀ TRÁCH NHIỆM PHÁP LÝ', xl + 36, yl + 54, 800, 26, pl, 0, '#FFFFFF');
      g.fillStyle = '#3A4252'; g.fillRect(xl + 36, yl + 76, wl - 72, 1);

      clipLine(g, 'Khi thanh tra thuế xuất toán hoặc hợp đồng phát sinh tranh chấp:', xl + 36, yl + 120, 500, 18, pl, 0, C.grey);
      clipLine(g, 'Pháp luật chỉ nhìn vào DUY NHẤT một thứ:', xl + 36, yl + 160, 700, 20, pl, 0, '#FFFFFF');

      // Signature Card
      g.fillStyle = '#111318'; g.fillRect(xl + 36, yl + 190, wl - 72, 120);
      g.strokeStyle = C.red; g.lineWidth = 2; g.strokeRect(xl + 36, yl + 190, wl - 72, 120);
      clipLine(g, 'NGƯỜI KÝ DUYỆT BÁO CÁO / TỜ TRÌNH', xl + 54, yl + 230, 800, 20, pl, 0, C.red);
      clipLine(g, '>>> CHÍNH LÀ BẠN (100% TRÁCH NHIỆM) <<<', xl + 54, yl + 275, 900, 22, pl, 0, '#FFFFFF');
      clipLine(g, 'Không ai có thể đổ lỗi cho công cụ AI.', xl + 36, yl + 350, 500, 18, pl, 0, C.grey);
    }

    // Right Column: 4-Step Verification Protocol (c13) (Cols 6..11)
    const xr = fx(6), wr = cwSpan(6), yr = 370, hr = 520;
    const pr = snap(t, cueP(13, t).t0, E8);
    g.fillStyle = C.darkCard; g.fillRect(xr, yr, wr, hr * pr);
    g.strokeStyle = C.red; g.lineWidth = 2; g.strokeRect(xr, yr, wr, hr * pr);
    if (pr > 0.6) {
      clipLine(g, 'PHÁC ĐỒ 4 BƯỚC KIỂM CHỨNG BẮT BUỘC', xr + 36, yr + 54, 800, 26, pr, 0, C.red);
      g.fillStyle = '#3A4252'; g.fillRect(xr + 36, yr + 76, wr - 72, 1);

      const steps = [
        { n: '01', t: 'NEO TÀI LIỆU GỐC (RAG)', d: 'Đính kèm tệp văn bản chuẩn, không để AI tự nhớ điều luật' },
        { n: '02', t: 'LỐI THOÁT TRUNG THỰC', d: 'Dặn rõ trong [R]: Nếu thiếu dữ liệu, phải báo "Chưa đủ căn cứ"' },
        { n: '03', t: 'TRÍCH DẪN SỐ TRANG / ĐIỀU', d: 'Bắt dẫn nguyên văn điều khoản pháp lý để tiện tra cứu' },
        { n: '04', t: 'TÍNH LẠI 100% TRÊN EXCEL', d: 'Kiểm toán lại phép tính, số tổng và tỷ lệ trên bảng tính thật' },
      ];

      steps.forEach((st, sidx) => {
        const sy = yr + 100 + sidx * 94;
        const sp = snap(t, cueP(13, t).t0 + sidx * 0.15, E8);
        g.fillStyle = '#161920'; g.fillRect(xr + 36, sy, wr - 72, 80 * sp);
        if (sp > 0.6) {
          g.fillStyle = C.red; g.fillRect(xr + 46, sy + 16, 36, 36);
          clipLine(g, st.n, xr + 64, sy + 42, 900, 20, sp, 0, '#FFFFFF', 'center');
          clipLine(g, st.t, xr + 94, sy + 40, 800, 18, sp, 0, '#FFFFFF');
          clipLine(g, st.d, xr + 94, sy + 64, 500, 15, sp, 0, C.grey);
        }
      });
    }
  }

  // ── Spread 5: Closing Verdict (c14) ──
  function drawSpread5(t) {
    drawGridLines(g, true, false);
    const pIn = snap(t, cueP(14, t).t0 - 0.2, BEAT);

    clipLine(g, 'KẾT LUẬN', FM, 160, 900, 72, pIn, 0, C.ink);
    clipLine(g, 'CÔNG THỨC THÀNH CÔNG BỀN VỮNG VỚI AI', FM, 235, 900, 56, pIn, 0, C.red);
    g.fillStyle = C.ink; g.fillRect(FM, 260, cwSpan(12) * pIn, 4);

    const xf = FM, wf = cwSpan(12), yf = 310, hf = 570;
    const pf = snap(t, cueP(14, t).t0, E8);
    g.fillStyle = C.paper; g.fillRect(xf, yf, wf, hf * pf);
    g.strokeStyle = C.ink; g.lineWidth = 3; g.strokeRect(xf, yf, wf, hf * pf);

    if (pf > 0.6) {
      clipLine(g, 'AI  =  TỐC ĐỘ NHÂN BẢN CẤP SỐ NHÂN', xf + 60, yf + 120, 900, 48, pf, 0, C.ink);
      clipLine(g, 'CON NGƯỜI  =  ĐỊNH HƯỚNG + KIỂM CHỨNG + TRÁCH NHIỆM', xf + 60, yf + 200, 900, 48, pf, 0, C.red);

      g.fillStyle = C.page; g.fillRect(xf + 60, yf + 260, wf - 120, 220);
      g.strokeStyle = C.ink; g.lineWidth = 2; g.strokeRect(xf + 60, yf + 260, wf - 120, 220);

      clipLine(g, 'NGUYÊN TẮC VÀNG VĨNH CỬU:', xf + 100, yf + 320, 800, 26, pf, 0, C.mute);
      clipLine(g, 'GIAO AI LÀM NHÁP TỐC ĐỘ CAO', xf + 100, yf + 380, 900, 42, pf, 0, C.ink);
      clipLine(g, 'GIỮ TRỌN QUYỀN PHÊ DUYỆT & TRÁCH NHIỆM TRONG TAY BẠN!', xf + 100, yf + 440, 900, 42, pf, 0, C.red);
    }
  }

  // Master Render Loop
  window.render = function(t) {
    const tClamped = clamp(t, 0, DUR);

    // Route spreads based on VO timestamps
    const tS0 = VO.length ? VO[0].c1 : 9.5;
    const tS1 = VO.length >= 4 ? VO[3].c1 : 38.5;
    const tS2 = VO.length >= 7 ? VO[6].c1 : 68.5;
    const tS3 = VO.length >= 11 ? VO[10].c1 : 108.5;
    const tS4 = VO.length >= 14 ? VO[13].c1 : 138.5;

    let isDark = false;
    if (tClamped < tS0) {
      drawSpread0(tClamped);
    } else if (tClamped < tS1) {
      drawSpread1(tClamped);
    } else if (tClamped < tS2) {
      drawSpread2(tClamped);
    } else if (tClamped < tS3) {
      drawSpread3(tClamped);
    } else if (tClamped < tS4) {
      isDark = true;
      drawSpread4(tClamped);
    } else {
      drawSpread5(tClamped);
    }

    // Active subtitle render
    if (!NOSUB && VO.length) {
      const activeCue = VO.find(c => tClamped >= c.c0 && tClamped <= c.c1);
      if (activeCue) {
        const pIn = snap(tClamped, activeCue.c0 + 0.15, 0.22);
        const pOut = snap(tClamped, activeCue.c1, 0.18);
        drawEditorialSub(g, activeCue.sub, pIn, pOut, isDark);
      }
    }
  };
  window.seek = window.render;
}
