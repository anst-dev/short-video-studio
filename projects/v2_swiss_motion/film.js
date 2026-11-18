// film.js — Swiss Motion Graphics: International Typographic Style on a 12-Column Grid (60.0s @ 24fps, 120 BPM)
// Strictly two curves only: E = cubic-bezier(.7,0,.2,1) (snap) and lin (linear). Zero gradients, zero shadows, zero bounce.
import { clamp, lerp, seg, E, snap, lin, steps, E8, E16, BEAT, BAR } from './ease.js';

export const W = 1920, H = 1080, DUR = 60.0;
const C = {
  page: '#EAE9E5',
  paper: '#FFFFFF',
  ink: '#111111',
  red: '#E30613',      // The ONLY signal colour in the entire film
  grid: '#D5D4CE',
  pgrid: '#EBEAE5',
  grey: '#C4C2BA',
  mute: '#6E6D66',
};

// 12-column Zurich modular grid: margin 96px, gutter 24px, col width 122px -> 12*122 + 11*24 + 2*96 = 1920px EXACT!
const FM = 96, FG = 24, FC = 122;
const fx = col => FM + col * (FC + FG);
const cwSpan = n => n * FC + (n - 1) * FG;

function setFont(g, wt, px) {
  g.font = `${wt} ${px}px Archivo`;
  if (g.letterSpacing !== undefined) {
    g.letterSpacing = px >= 84 ? `${(-px * 0.024).toFixed(1)}px` : '0px';
  }
}

// Clip-rect baseline reveal (words/lines rise cleanly from below baseline without fade or bounce)
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

function drawGridLines(g, showCols = true) {
  g.fillStyle = C.page;
  g.fillRect(0, 0, W, H);
  if (showCols) {
    g.fillStyle = C.grid;
    for (let c = 0; c < 12; c++) {
      g.fillRect(fx(c), 0, 1, H);
      g.fillRect(fx(c) + FC, 0, 1, H);
    }
    for (let y = 72; y < H; y += 72) g.fillRect(0, y, W, 1);
  }
  // Top & bottom Swiss programme rules
  g.fillStyle = C.ink;
  g.fillRect(FM, 56, W - 2 * FM, 2);
  setFont(g, 700, 15);
  g.fillStyle = C.ink; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.fillText('HỆ THỐNG ĐỒ HỌA THỤY SĨ  ·  QUẢN TRỊ QUY TRÌNH AI', FM, 42);
  g.fillStyle = C.mute;
  g.fillText('GRID 12 COL  ·  120 BPM', fx(6), 42);
  g.textAlign = 'right';
  g.fillText('PCTPR PROGRAMME', W - FM, 42);
  g.textAlign = 'left';
}

// Knife-cut deletion helper (STYLE.md §5: thin line crosses element, then element collapses to midline)
function drawKnifeLine(g, x0, y0, x1, y1, p) {
  if (p <= 0) return;
  g.save();
  g.strokeStyle = C.red;
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(x0, y0);
  g.lineTo(lerp(x0, x1, p), lerp(y0, y1, p));
  g.stroke();
  g.restore();
}

// Editorial Grid-Integrated Subtitle Row (STYLE.md §4: rule above + flush-left statement at column start, NEVER a pill!)
function drawEditorialSub(g, textStr, pIn, pOut) {
  if (pIn <= 0 || pOut >= 1 || !textStr) return;
  const x = FM, w = cwSpan(12), yRule = 958;
  g.save();
  // Clean paper backing strip on grid so underlying graphic bars never clash with caption
  g.fillStyle = C.page;
  g.fillRect(FM - 8, yRule - 6, w + 16, 114);
  g.fillStyle = C.ink;
  g.fillRect(x, yRule, w * pIn, 2);
  g.fillStyle = C.red;
  g.fillRect(x, yRule, 64 * pIn, 4);

  setFont(g, 700, 13);
  g.fillStyle = C.red; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.fillText('THUYẾT MINH', x, yRule + 26);

  const lines = wrapSwiss(g, textStr, 700, 26, cwSpan(10) - 20);
  lines.forEach((ln, idx) => {
    clipLine(g, ln, fx(2), yRule + 32 + idx * 34, 700, 26, pIn, pOut, C.ink);
  });
  g.restore();
}

export function initSwissFilm(canvas, voTimeline) {
  const g = canvas.getContext('2d');

  const VO = (voTimeline || []).map((c, idx, arr) => {
    const nextT0 = idx + 1 < arr.length ? arr[idx + 1].t0 - 0.12 : 59.92;
    const c0 = Math.max(0.05, c.t0 - 0.08);
    const c1 = Math.min(nextT0, Math.max(c.t1 + 0.55, c0 + 1.85));
    return { ...c, c0, c1 };
  });

  // Deterministic unordered chaos slips for Spread 01 (the ONLY off-grid elements per STYLE.md §1 & §5)
  const slips = [];
  const slipNames = ['BÁO CÁO TUẦN V7', 'BIÊN BẢN 18 TRANG', 'BẢNG TÍNH #REF!', '47 EMAIL KHẨN', '19 TIN NHẮN DỒN', 'ĐỐI SOÁT LỆCH'];
  for (let i = 0; i < 24; i++) {
    const s = Math.sin(i * 91.7) * 0.5 + 0.5, c2 = Math.cos(i * 37.3) * 0.5 + 0.5;
    slips.push({
      x: fx(6) + 30 + s * (cwSpan(6) - 250),
      y: 120 + c2 * 670,
      w: 220 + (i % 3) * 34,
      h: 46,
      rot: ((i % 5) - 2) * 0.065,
      t0: 0.04 + i * 0.035,
      label: slipNames[i % slipNames.length],
      isRed: i % 6 === 0,
    });
  }

  // Foley events (`window.EV`) — print-shop letterpress clacks, guillotine knife snicks, block snaps
  const EV = [];
  slips.forEach((s, i) => { if (i % 2 === 0) EV.push({ t: +s.t0.toFixed(3), type: 'paper_thud', idx: i }); });
  [0.80, 4.85, 8.55, 10.15, 11.75, 13.35, 16.50, 25.00, 26.3, 28.6, 31.3, 33.8, 38.55, 43.4, 44.9, 46.4, 48.6, 54.00, 56.95].forEach((ts, idx) => {
    EV.push({ t: ts, type: ts === 16.50 || ts === 38.55 || ts === 54.00 ? 'snap_impact' : 'module_lock', idx });
  });
  EV.push({ t: 16.46, type: 'whoosh', dur: 0.18 }, { t: 39.20, type: 'whoosh', dur: 0.22 });
  EV.push({ t: 15.80, type: 'silence' }, { t: 53.40, type: 'silence' });
  EV.sort((a, b) => a.t - b.t);
  window.DUR = DUR;
  window.EV = EV;

  // ── SPREAD 01 & 02 (0.0 – 8.5s): Off-Grid Chaos vs Flush-Left Questions 1 & 2 ──
  function renderSpreadQuestions(t) {
    drawGridLines(g, true);
    const inQ2 = t >= 4.85;
    const pan = snap(t, 5.05, BEAT);

    // Right Poster Artifact (Cols 6..11, y = 92..916)
    const px0 = fx(6), py0 = 92, pw = cwSpan(6), ph = 824;
    g.fillStyle = C.paper;
    g.fillRect(px0, py0, pw, ph);
    g.strokeStyle = C.ink; g.lineWidth = 2;
    g.strokeRect(px0 + 1, py0 + 1, pw - 2, ph - 2);

    if (!inQ2) {
      // Left Programme Page (Cols 0..5): Optical Numeral 01 + Question 1
      const p1 = snap(t, 0.85, BEAT);
      clipLine(g, '01', FM - 8, 256, 900, 176, p1, 0, C.red);
      g.fillStyle = C.ink; g.fillRect(FM, 286, cwSpan(5) * p1, 4);

      const q1Lines = [
        'Team mọi người đã',
        'áp dụng AI để giảm',
        'một nửa thời gian',
        'làm báo cáo với',
        'biên bản họp chưa?'
      ];
      q1Lines.forEach((ln, idx) => {
        const lp = snap(t, 0.95 + idx * E16, E8);
        clipLine(g, ln, FM, 368 + idx * 72, 800, 56, lp, 0, idx === 2 ? C.red : C.ink);
      });

      setFont(g, 600, 16); g.fillStyle = C.mute;
      g.fillText('HIỆN TRẠNG: BÁO CÁO, BẢNG TÍNH, BIÊN BẢN & EMAIL CHỒNG CHẤT', FM, 790);

      // Right Poster: 24 unsnapped off-grid colliding office slips
      g.save();
      g.beginPath(); g.rect(px0, py0, pw, ph); g.clip();
      slips.forEach((sl) => {
        const sp = lin(t, sl.t0, sl.t0 + 0.12);
        if (sp <= 0) return;
        g.save();
        g.translate(sl.x + sl.w / 2, sl.y + sl.h / 2);
        g.rotate(sl.rot);
        g.fillStyle = sl.isRed ? C.red : C.ink;
        g.fillRect(-sl.w / 2, -sl.h / 2, sl.w * sp, sl.h);
        setFont(g, 700, 14);
        g.fillStyle = C.paper; g.textAlign = 'left'; g.textBaseline = 'middle';
        if (sp > 0.7) g.fillText(sl.label, -sl.w / 2 + 14, 1);
        g.restore();
      });
      g.fillStyle = C.red; g.fillRect(px0, py0 + ph - 48, pw, 48);
      setFont(g, 800, 16); g.fillStyle = C.paper;
      g.fillText('CẢNH BÁO LƯỚI: HỖN LOẠN THỦ CÔNG  ·  OFF-GRID VIOLATION', px0 + 24, py0 + ph - 18);
      g.restore();
    } else {
      // SPREAD 02: Question 2 ("Hay vẫn đang dùng AI chỉ để dịch thuật với viết caption?")
      clipLine(g, '02', FM - 8, 256, 900, 176, pan, 0, C.ink);
      g.fillStyle = C.red; g.fillRect(FM, 286, cwSpan(5) * pan, 4);

      const q2Lines = [
        'Hay vẫn đang',
        'dùng AI chỉ để',
        'dịch thuật với',
        'viết caption?'
      ];
      q2Lines.forEach((ln, idx) => {
        const lp = snap(t, 5.10 + idx * E16, E8);
        clipLine(g, ln, FM, 376 + idx * 78, 800, 62, lp, 0, idx >= 2 ? C.red : C.ink);
      });

      // Right Poster: Extreme Swiss Scale Contrast — 94% untouched black mass vs 2 tiny red bars!
      const bh = 590 * pan;
      g.fillStyle = C.ink;
      g.fillRect(px0 + 36, py0 + 40, pw - 72, bh);
      if (pan > 0.6) {
        setFont(g, 800, 28); g.fillStyle = C.paper;
        g.fillText('94% KHỐI LƯỢNG BÁO CÁO & BIÊN BẢN HỌP', px0 + 64, py0 + 106);
        setFont(g, 500, 18); g.fillStyle = C.grey;
        g.fillText('VẪN XỬ LÝ THỦ CÔNG  ·  CHƯA CÓ HỆ THỐNG AI', px0 + 64, py0 + 144);
      }
      // Two tiny superficial slivers at bottom
      const sP = snap(t, 5.55, E8);
      g.fillStyle = C.red;
      g.fillRect(px0 + 36, py0 + 668, (pw - 90) * 0.48 * sP, 54);
      g.fillRect(px0 + 36 + (pw - 72) * 0.52, py0 + 668, (pw - 90) * 0.48 * sP, 54);
      setFont(g, 800, 17); g.fillStyle = C.paper;
      if (sP > 0.7) {
        g.fillText('CHỈ DỊCH THUẬT', px0 + 56, py0 + 701);
        g.fillText('CHỈ VIẾT CAPTION', px0 + 56 + (pw - 72) * 0.52, py0 + 701);
      }
      setFont(g, 700, 15); g.fillStyle = C.mute;
      g.fillText('TỶ LỆ TÁC ĐỘNG VÀO LÕI CÔNG VIỆC: < 6%', px0 + 36, py0 + 772);
    }
  }

  // ── SPREAD 03 (8.5 – 16.5s): 4 Modular Columns of the Broken Loop + Hard Stop at 15.8s ──
  function renderBrokenLoop(t) {
    drawGridLines(g, true);
    const fT = Math.min(t, 15.80);

    clipLine(g, 'QUÁ TRÌNH CŨ GÂY MẤT THỜI GIAN', FM, 118, 800, 22, snap(fT, 8.75, E8), 0, C.red);
    clipLine(g, 'prompt ngắn  →  kết quả sáo rỗng  →  sửa tay liên tục  →  mất thời gian', FM, 172, 800, 44, snap(fT, 8.90, E8), 0, C.ink);

    const cols = [
      { num: '01', title: 'Prompt ngắn', desc: 'Câu lệnh 3 từ thiếu ngữ cảnh', t0: 8.8, fillH: 0.32 },
      { num: '02', title: 'Kết quả sáo rỗng', desc: 'Văn mẫu chung chung sai số', t0: 10.3, fillH: 0.55 },
      { num: '03', title: 'Sửa tay liên tục', desc: 'Gạch xóa viết lại hàng chục lần', t0: 11.9, fillH: 0.78 },
      { num: '04', title: 'Mất thời gian', desc: '100% quá tải giấy tờ cuối tuần', t0: 13.5, fillH: 1.00 },
    ];

    cols.forEach((c, idx) => {
      const x = fx(idx * 3), w = cwSpan(3), yTop = 216, hMax = 684;
      const p = snap(fT, c.t0 + BEAT, BEAT);
      if (p <= 0) return;

      g.fillStyle = C.paper;
      g.fillRect(x, yTop, w, hMax);
      g.strokeStyle = C.ink; g.lineWidth = 2;
      g.strokeRect(x + 1, yTop + 1, w - 2, hMax - 2);

      // Rising heavy black mass stepped one module at a time!
      const rise = steps(fT, c.t0, c.t0 + 1.4, 6) * c.fillH;
      const bh = Math.round((hMax - 170) * rise);
      g.fillStyle = idx === 3 ? C.red : C.ink;
      g.fillRect(x + 1, yTop + hMax - bh - 1, w - 2, bh);

      // Swiss column typography at top
      clipLine(g, c.num, x + 24, yTop + 82, 900, 72, p, 0, idx === 3 ? C.red : C.ink);
      clipLine(g, c.title, x + 24, yTop + 128, 800, 30, p, 0, C.ink);
      clipLine(g, c.desc, x + 24, yTop + 160, 500, 18, p, 0, C.mute);

      if (rise > 0.25) {
        setFont(g, 900, 44);
        g.fillStyle = C.paper;
        g.fillText(`${Math.round(c.fillH * 100)}%`, x + 24, yTop + hMax - 28);
      }
    });
  }

  // ── SPREAD 04 (16.5 – 25.0s): Signal-Red Knife-Cut + Swiss 4-Quadrant System Re-flow ──
  function renderSwissSystem(t) {
    drawGridLines(g, true);
    const sT = t - 16.5;

    // 16.5 – 17.1s: Signal Red Knife-Cut slices across the entire 12-column spread!
    if (sT < 0.85) {
      drawKnifeLine(g, 0, 520, W, 520, lin(sT, 0, 0.22));
    }

    const hp = snap(t, 16.85, E8);
    clipLine(g, 'HỆ THỐNG LÀM VIỆC MẠCH LẠC  ·  CHUẨN HÓA TRÊN LƯỚI', FM, 114, 800, 20, hp, 0, C.red);
    clipLine(g, 'Bảng tính động  ·  Dashboard KPI  ·  Checklist  ·  Luồng dữ liệu', FM, 168, 800, 46, hp, 0, C.ink);

    const quads = [
      { c: 0, y: 206, num: '01', name: 'BẢNG TÍNH ĐỘNG', stat: '0.6s', note: 'Tự động gom & tính toán bảng biểu tuần', t0: 16.85 },
      { c: 6, y: 206, num: '02', name: 'DASHBOARD KPI', stat: '2.8×', note: 'Theo dõi chỉ số hiệu suất theo thời gian thực', t0: 17.05 },
      { c: 0, y: 564, num: '03', name: 'CHECKLIST NGHIỆM THU', stat: '100%', note: 'Kiểm tra chéo công thức & biên bản tự động', t0: 17.25 },
      { c: 6, y: 564, num: '04', name: 'SƠ ĐỒ & LUỒNG DỮ LIỆU', stat: 'LIVE', note: 'Dữ liệu vận hành liên tục không đứt quãng', t0: 17.45 },
    ];

    quads.forEach((q, idx) => {
      const p = snap(t, q.t0 + BEAT, BEAT);
      if (p <= 0) return;
      const x = fx(q.c), w = cwSpan(6) * p, h = 334;
      g.fillStyle = C.paper;
      g.fillRect(x, q.y, w, h);
      g.fillStyle = C.ink;
      g.fillRect(x, q.y, w, 6);
      g.strokeStyle = C.ink; g.lineWidth = 1.5;
      g.strokeRect(x + 0.75, q.y + 0.75, w - 1.5, h - 1.5);

      if (p > 0.75) {
        clipLine(g, `${q.num}  //  ${q.name}`, x + 28, q.y + 52, 800, 24, p, 0, C.ink);
        clipLine(g, q.stat, x + 24, q.y + 186, 900, 118, p, 0, idx === 3 ? C.red : C.ink);
        clipLine(g, q.note, x + 28, q.y + 242, 500, 20, p, 0, C.mute);

        // Moving Swiss modular data bars inside each quadrant (locked to 16th grid!)
        const barCount = 12, bw = (cwSpan(6) - 56 - 11 * 8) / 12;
        const activeBeat = Math.floor(sT * 8) % barCount;
        for (let b = 0; b < barCount; b++) {
          g.fillStyle = b === activeBeat ? C.red : (b < 8 ? C.ink : C.grey);
          g.fillRect(x + 28 + b * (bw + 8), q.y + 272, bw, 32);
        }
      }
    });
  }

  // ── SPREAD 05 (25.0 – 38.5s): Gerstner Programme `PCTPR` (Left) -> 4 AI Specimen Bands (Right) ──
  function renderPCTPRSpread(t) {
    drawGridLines(g, true);

    // Left Programme Column (Cols 0..3): Giant Stacked P-C-T-P-R Index
    const pHead = snap(t, 25.35, BEAT);
    clipLine(g, 'QUY TRÌNH MỚI', FM, 118, 800, 20, pHead, 0, C.red);
    clipLine(g, 'PCTPR', FM - 6, 232, 900, 128, pHead, 0, C.ink);
    g.fillStyle = C.red;
    g.fillRect(FM, 254, cwSpan(4) * pHead, 6);

    const letters = [
      ['P', 'PERSONA', 'Định danh vai trò chuyên gia'],
      ['C', 'CONTEXT', 'Nạp bối cảnh & dữ liệu chuẩn'],
      ['T', 'TASK', 'Giao nhiệm vụ tường minh'],
      ['P', 'PROCESS', 'Khóa các bước thực thi'],
      ['R', 'RESULT', 'Ràng buộc chuẩn nghiệm thu'],
    ];
    letters.forEach(([l, en, vi], idx) => {
      const lp = snap(t, 25.45 + idx * E8, E8);
      const ry = 310 + idx * 116;
      g.fillStyle = C.ink;
      g.fillRect(FM, ry, cwSpan(4) * lp, 1.5);
      clipLine(g, l, FM, ry + 66, 900, 58, lp, 0, C.red);
      clipLine(g, en, FM + 58, ry + 42, 800, 22, lp, 0, C.ink);
      clipLine(g, vi, FM + 58, ry + 72, 500, 17, lp, 0, C.mute);
    });

    // Right Artifact Column (Cols 4..11): 4 Horizontal Architectural AI Bands
    const bands = [
      { t0: 26.2, num: '01', name: 'ChatGPT', role: 'LẬP KẾ HOẠCH', spec: 'Xây dựng cấu trúc báo cáo, phân rã mục tiêu & khung công việc chuẩn.' },
      { t0: 28.5, num: '02', name: 'Claude', role: 'PHÂN TÍCH TÀI LIỆU', spec: 'Đọc hiểu biên bản & báo cáo dài hàng chục trang, giữ trọn logic.' },
      { t0: 31.2, num: '03', name: 'Gemini', role: 'HỖ TRỢ NGHIÊN CỨU', spec: 'Tra cứu đa nguồn, đối chiếu dữ liệu thị trường & kiểm chứng dẫn chứng.' },
      { t0: 33.7, num: '04', name: 'GPTs / Gems', role: 'CHUYÊN BIỆT HÓA', spec: 'Tóm tắt biên bản họp  ·  Kiểm tra lỗi dữ liệu  ·  Lập kế hoạch tuần.' },
    ];

    bands.forEach((b, idx) => {
      const bp = snap(t, b.t0 + BEAT, BEAT);
      if (bp <= 0) return;
      const bx = fx(4), bw = cwSpan(8) * bp, by = 96 + idx * 204, bh = 184;
      const isCurrent = t >= b.t0 && (idx === 3 || t < bands[idx + 1].t0);

      g.fillStyle = isCurrent ? C.ink : C.paper;
      g.fillRect(bx, by, bw, bh);
      g.strokeStyle = C.ink; g.lineWidth = 2;
      g.strokeRect(bx + 1, by + 1, bw - 2, bh - 2);
      g.fillStyle = C.red;
      g.fillRect(bx, by, 14 * bp, bh);

      if (bp > 0.75) {
        const fg = isCurrent ? C.paper : C.ink;
        const subFg = isCurrent ? C.grey : C.mute;
        clipLine(g, b.num, bx + 36, by + 68, 900, 48, bp, 0, C.red);
        clipLine(g, b.name, bx + 120, by + 68, 900, 48, bp, 0, fg);
        clipLine(g, b.role, bx + 480, by + 62, 800, 22, bp, 0, C.red);
        clipLine(g, b.spec, bx + 36, by + 132, 500, 22, bp, 0, subFg);
      }
    });
  }

  // ── SPREAD 06 (38.5 – 48.5s): Optical Giant `100% -> 40%` + Knife-Cut 60 Bars + 3 QA Rules ──
  function renderScaleContrastAndQA(t) {
    drawGridLines(g, true);
    const dropP = steps(t, 39.0, 41.2, 6);
    const pct = Math.round(lerp(100, 40, dropP));

    // Left Half (Cols 0..5): Optical Giant Numeral 100% -> 40%
    clipLine(g, 'KHỐI LƯỢNG CÔNG VIỆC GIẤY TỜ', FM, 118, 800, 20, snap(t, 38.8, E8), 0, C.ink);
    setFont(g, 900, 248);
    g.fillStyle = pct <= 45 ? C.red : C.ink;
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.fillText(`${pct}%`, FM - 12, 378);
    g.fillStyle = C.ink;
    g.fillRect(FM, 412, cwSpan(5), 4);
    clipLine(g, 'GIẢM TỪ 100% XUỐNG CÒN 40%', FM, 464, 800, 28, snap(t, 39.2, E8), 0, C.ink);

    // 3 Museum-Rule QA Rows below on Left/Full bottom when t >= 43.3s
    if (t >= 43.3) {
      const qas = [
        ['01  BIÊN BẢN HỌP TỰ ĐỘNG TÓM TẮT', 'Chốt đầu việc, người phụ trách & thời hạn ngay sau cuộc họp'],
        ['02  BÁO CÁO ĐƯỢC TẠO NHANH HƠN', 'Tổng hợp bảng tính & biểu đồ chuẩn xác gấp 3.2 lần'],
        ['03  KIỂM TRA THEO CHECKLIST NGHIỆM THU', 'Đối soát 12/12 tiêu chí chất lượng trước khi phát hành'],
      ];
      qas.forEach(([h1, h2], qi) => {
        const qp = snap(t, 43.5 + qi * 1.35, BEAT);
        const qy = 530 + qi * 124;
        g.fillStyle = C.ink;
        g.fillRect(FM, qy, cwSpan(5) * qp, 2);
        clipLine(g, h1, FM, qy + 44, 800, 24, qp, 0, C.red);
        clipLine(g, h2, FM, qy + 82, 500, 19, qp, 0, C.ink);
      });
    }

    // Right Half Poster (Cols 6..11): 10 x 10 = 100 Swiss Blocks -> Knife-Cut deletes 60 blocks!
    const px0 = fx(6), py0 = 96, pw = cwSpan(6), ph = 816;
    g.fillStyle = C.paper; g.fillRect(px0, py0, pw, ph);
    g.strokeStyle = C.ink; g.lineWidth = 2; g.strokeRect(px0 + 1, py0 + 1, pw - 2, ph - 2);

    const gx0 = px0 + 42, gy0 = py0 + 84, cellW = (pw - 84 - 9 * 10) / 10, cellH = 54;
    for (let i = 0; i < 100; i++) {
      const c = i % 10, r = Math.floor(i / 10);
      const bx = gx0 + c * (cellW + 10), by = gy0 + r * (cellH + 10);
      const keep = r < 4; // Top 4 rows = 40 blocks kept! Bottom 6 rows = 60 blocks cut!
      if (keep) {
        g.fillStyle = t >= 41.0 ? C.ink : C.ink;
        g.fillRect(bx, by, cellW, cellH);
      } else {
        const cutCollapse = 1 - snap(t, 39.45 + (r - 4) * 0.18, E8);
        if (cutCollapse > 0.02) {
          const hh = cellH * cutCollapse;
          g.fillStyle = C.grey;
          g.fillRect(bx, by + (cellH - hh) / 2, cellW, hh);
        } else {
          g.fillStyle = '#F2F1EC';
          g.fillRect(bx, by, cellW, cellH);
        }
      }
    }
    // Red knife cut separating row 4 (40%) from eliminated 60%!
    const cutLineP = lin(t, 39.15, 39.55);
    if (cutLineP > 0) {
      drawKnifeLine(g, px0 + 20, gy0 + 4 * 64 - 5, px0 + pw - 20, gy0 + 4 * 64 - 5, cutLineP);
    }
    setFont(g, 800, 18); g.fillStyle = C.ink;
    g.fillText('MA TRẬN 100 ĐƠN VỊ CÔNG VIỆC  ·  GIỮ 40  ·  CẮT GIẢM 60', px0 + 42, py0 + 52);
  }

  // ── SPREAD 07 (48.5 – 60.0s): Generous White Space Focus -> `50–60%` Poster -> Final Manifesto ──
  function renderCleanAndFinale(t) {
    drawGridLines(g, t < 54.0);

    if (t < 53.95) {
      // 48.5 – 53.95s: Serene Zurich White Space = Clean Workspace & High-Value Focus
      const wp = snap(t, 49.0, BEAT);
      g.fillStyle = C.paper;
      g.fillRect(FM, 96, cwSpan(12) * wp, 816);
      g.strokeStyle = C.ink; g.lineWidth = 2;
      g.strokeRect(FM + 1, 97, cwSpan(12) * wp - 2, 814);

      if (wp > 0.8) {
        g.fillStyle = C.red;
        g.fillRect(FM + 48, 152, 88, 8);
        clipLine(g, 'KHÔNG GIAN LÀM VIỆC GỌN GÀNG  ·  LOẠI BỎ RÁC GIẤY TỜ', FM + 48, 204, 800, 20, wp, 0, C.red);
        clipLine(g, 'Nhân viên tập trung vào', FM + 48, 316, 900, 88, wp, 0, C.ink);
        clipLine(g, 'công việc giá trị cao.', FM + 48, 414, 900, 88, wp, 0, C.ink);

        const cols = [
          ['01  CHIẾN LƯỢC', 'Phân tích & ra quyết định tăng trưởng'],
          ['02  SÁNG TẠO', 'Tối ưu giải pháp & trải nghiệm khách hàng'],
          ['03  KIỂM CHỨNG', 'Vận hành hệ thống AI chuẩn hóa bền vững'],
        ];
        cols.forEach(([h1, h2], idx) => {
          const cx = fx(idx * 4) + (idx === 0 ? 48 : 16), cy = 690;
          const cp = snap(t, 49.4 + idx * 0.25, E8);
          g.fillStyle = C.ink; g.fillRect(cx, cy, (cwSpan(4) - 64) * cp, 3);
          clipLine(g, h1, cx, cy + 46, 800, 24, cp, 0, C.ink);
          clipLine(g, h2, cx, cy + 84, 500, 19, cp, 0, C.mute);
        });
      }
    } else if (t < 56.92) {
      // 54.0 – 56.92s: FINAL LINE 1 — Giant Swiss Signal-Red Poster `50–60%`
      const p = snap(t, 54.25, E8);
      g.fillStyle = C.paper;
      g.fillRect(FM, 96, cwSpan(12), 880);
      g.fillStyle = C.red;
      g.fillRect(FM, 96, cwSpan(12) * p, 24);

      clipLine(g, 'KẾT QUẢ THỰC TẾ ĐÃ KIỂM CHỨNG', FM + 56, 212, 800, 24, p, 0, C.mute);
      clipLine(g, 'Thời gian xử lý giấy tờ giảm thực tế', FM + 56, 308, 800, 62, p, 0, C.ink);
      clipLine(g, '50–60%.', FM + 44, 650, 900, 290, p, 0, C.red);

      g.fillStyle = C.ink;
      g.fillRect(FM + 56, 740, (cwSpan(12) - 112) * p, 4);
      clipLine(g, 'BÁO CÁO TUẦN   ·   BIÊN BẢN HỌP   ·   BẢNG TÍNH KPI   ·   CHECKLIST NGHIỆM THU', FM + 56, 798, 700, 22, p, 0, C.ink);
    } else {
      // 56.92 – 60.0s: FINAL LINE 2 — Flush-Left International Typographic Closing Manifesto
      const p = snap(t, 57.25, E8);
      g.fillStyle = C.ink;
      g.fillRect(FM, 96, cwSpan(12), 880);
      g.fillStyle = C.red;
      g.fillRect(FM, 96, 28, 880 * p);

      clipLine(g, 'GIẢM 50–60% THỜI GIAN GIẤY TỜ  ·  HỆ THỐNG HÓA CÙNG PCTPR', FM + 76, 210, 800, 22, p, 0, C.red);
      clipLine(g, 'Muốn dùng AI bài bản', FM + 76, 372, 900, 98, p, 0, C.paper);
      clipLine(g, 'từ System Prompt đến', FM + 76, 488, 900, 98, p, 0, C.paper);
      clipLine(g, 'kiểm chứng chất lượng?', FM + 76, 604, 900, 98, p, 0, C.red);

      g.fillStyle = C.paper;
      g.fillRect(FM + 76, 720, (cwSpan(12) - 152) * p, 2);
      clipLine(g, '01 SYSTEM PROMPT     02 QUY TRÌNH PCTPR     03 GPTS & GEMS     04 CHECKLIST NGHIỆM THU', FM + 76, 778, 700, 21, p, 0, C.grey);
    }
  }

  const noSub = new URLSearchParams(location.search).get('nosub') === '1';
  window.render = function (t) {
    t = clamp(t, 0, DUR);
    if (t < 8.5) renderSpreadQuestions(t);
    else if (t < 16.5) renderBrokenLoop(t);
    else if (t < 25.0) renderSwissSystem(t);
    else if (t < 38.5) renderPCTPRSpread(t);
    else if (t < 48.5) renderScaleContrastAndQA(t);
    else renderCleanAndFinale(t);

    if (!noSub) {
      const cue = VO.find(c => t >= c.c0 && t < c.c1);
      if (cue && !['c00', 'c01', 'c09', 'c10'].includes(cue.id)) {
        const pIn = snap(t, cue.c0 + E16, E16);
        const pOut = snap(t, cue.c1, E16);
        drawEditorialSub(g, cue.sub, pIn, pOut);
      }
    }
  };

  window.TEXTS = function (t) {
    const out = [];
    if (t >= 0.9 && t < 4.8) out.push({ id: 'q1', text: 'Team mọi người đã áp dụng AI để giảm một nửa thời gian làm báo cáo với biên bản họp chưa?', x0: FM, y0: 300, x1: fx(6), y1: 760 });
    if (t >= 5.1 && t < 8.4) out.push({ id: 'q2', text: 'Hay vẫn đang dùng AI chỉ để dịch thuật với viết caption?', x0: FM, y0: 310, x1: fx(6), y1: 720 });
    if (t >= 8.9 && t < 16.4) out.push({ id: 'lp', text: 'prompt ngắn → kết quả sáo rỗng → sửa tay liên tục → mất thời gian', x0: FM, y0: 130, x1: W - FM, y1: 190 });
    if (t >= 16.9 && t < 24.9) out.push({ id: 'sys', text: 'Bảng tính động · Dashboard KPI · Checklist · Luồng dữ liệu', x0: FM, y0: 130, x1: W - FM, y1: 190 });
    if (t >= 25.4 && t < 38.4) out.push({ id: 'pct', text: 'PCTPR', x0: FM, y0: 120, x1: fx(4), y1: 260 });
    if (t >= 38.8 && t < 48.4) out.push({ id: 'wl', text: '40%', x0: FM, y0: 140, x1: fx(5), y1: 420 });
    if (t >= 49.0 && t < 53.9) out.push({ id: 'cln', text: 'Nhân viên tập trung vào công việc giá trị cao.', x0: FM, y0: 220, x1: W - FM, y1: 460 });
    if (t >= 54.2 && t <= 60.0) out.push({ id: 'fin', text: '50–60%', x0: FM, y0: 100, x1: W - FM, y1: 960 });
    return out;
  };
}
