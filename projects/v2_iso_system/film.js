// film.js — Isometric Infographic: Mô Hình Văn Phòng Tinh Gọn (60.0s @ 24fps, 120 BPM)
import {
  Iso, PAL, tri, mix, hex, haloText, pin, inset, ring, cutLine, hatch, ICON, iconGrid, person,
  C30, S30, TAU, clamp, lerp, seg, ss, eo, eio, back, hash
} from './engine.js';

export const DUR = 60.0;
const W = 1920, H = 1080;
const F = 'BeVietnamPro', MONO = 'JBMono';

// 3-Tone Isometric Palette (STYLE.md §2–3: warm cream ground, 6 semantic hues, zero outlines on solids)
const T3 = {
  board: tri('#ECE1CA', 0.22, 0.18),
  strata1: tri('#B99B72', 0.12, 0.24),
  strata2: tri('#8C6B48', 0.10, 0.26),
  desk: tri('#D8C3A5', 0.20, 0.22),
  coral: tri('#D9534F', 0.20, 0.24),     // Paperwork overload / errors
  amber: tri('#E2A03F', 0.22, 0.22),     // KPI / warnings / highlights
  blue: tri('#3A7CA5', 0.22, 0.24),      // Data streams / Gemini
  mint: tri('#3F9E72', 0.22, 0.24),      // Verified / ChatGPT / 40%
  ochre: tri('#D47A2A', 0.20, 0.24),     // Claude document chamber
  plum: tri('#6E56CF', 0.22, 0.24),      // GPTs / Gems chamber
  slate: tri('#7A828E', 0.18, 0.24),     // Neutral machines / screens
  white: tri('#FBF7EE', 0.15, 0.18),     // Clean paper / high-value boards
};

// Faint isometric dot lattice on background + soft plinth shadow + strata plinth
function drawIsoBackdropAndPlinth(g, iso, bx0, by0, bw, bd) {
  g.fillStyle = PAL.bg;
  g.fillRect(0, 0, W, H);

  // Faint isometric dot lattice (STYLE.md §2)
  g.fillStyle = 'rgba(46,37,34,0.08)';
  const step = 44;
  for (let y = 24; y < H; y += step) {
    const off = ((y / step) | 0) % 2 ? step * 0.5 : 0;
    for (let x = 24 + off; x < W; x += step) {
      g.fillRect(x, y, 2, 2);
    }
  }

  // Soft blurred plinth drop-shadow
  const c0 = iso.P(bx0, by0, -2.4), c1 = iso.P(bx0 + bw, by0, -2.4);
  const c2 = iso.P(bx0 + bw, by0 + bd, -2.4), c3 = iso.P(bx0, by0 + bd, -2.4);
  g.save();
  g.filter = 'blur(22px)';
  g.fillStyle = 'rgba(46,37,34,0.16)';
  g.beginPath();
  [c0, c1, c2, c3].forEach((p, i) => i ? g.lineTo(p[0], p[1] + 18) : g.moveTo(p[0], p[1] + 18));
  g.closePath(); g.fill();
  g.restore();

  // 3-layer Strata Plinth (soil -> stone -> clean board top at z = 0)
  iso.box(bx0, by0, -2.2, bw, bd, 0.8, T3.strata2, { layer: 0, cull: false });
  iso.box(bx0, by0, -1.4, bw, bd, 0.7, T3.strata1, { layer: 0, cull: false });
  iso.box(bx0, by0, -0.7, bw, bd, 0.7, T3.board, { layer: 0, cull: false });
}

function drawTopBanner(g, tag, headline, subline = '', accent = '#B3352B', a = 1) {
  if (a <= 0) return;
  g.save();
  g.globalAlpha = eo(a);
  const x = 84, y = 56;
  // Crisp infographic header strip with 2px ink rule
  g.fillStyle = accent;
  g.fillRect(x, y, 10, 86 + (subline ? 36 : 0));
  haloText(g, tag, x + 26, y + 22, { font: `700 15px ${MONO}`, track: 2.5, color: accent });
  haloText(g, headline, x + 26, y + 66, { font: `800 35px ${F}`, color: PAL.ink });
  if (subline) {
    haloText(g, subline, x + 26, y + 108, { font: `700 31px ${F}`, color: accent });
  }
  g.restore();
}

function wrapLines(g, str, fontStr, maxW) {
  g.font = fontStr;
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

// Map-label Subtitle Card (STYLE.md §4: pale card, 2px ink border, tiny iso legend cube chip, bottom-centre)
function drawMapSubtitle(g, textStr, a, chipTri = T3.blue) {
  if (a <= 0 || !textStr) return;
  const f = `600 26px ${F}`;
  const lines = wrapLines(g, textStr, f, 1340);
  g.font = f;
  const tw = Math.max(...lines.map(l => g.measureText(l).width));
  const w = tw + 104, h = lines.length === 1 ? 66 : 98;
  const x = (W - w) / 2, y = H - h - 32;

  g.save();
  const bordP = eo(seg(a, 0, 0.55)), txtP = eo(seg(a, 0.25, 1.0));
  g.globalAlpha = bordP;
  g.fillStyle = 'rgba(46,37,34,0.12)';
  g.beginPath(); g.roundRect(x + 4, y + 6, w, h, 10); g.fill();
  g.fillStyle = PAL.paper;
  g.beginPath(); g.roundRect(x, y, w, h, 10); g.fill();
  g.strokeStyle = PAL.ink; g.lineWidth = 2;
  g.beginPath(); g.roundRect(x + 1, y + 1, w - 2, h - 2, 10); g.stroke();

  // Tiny isometric 3-tone cube legend chip
  ICON.box(g, x + 36, y + h / 2 + 2, 26, chipTri, 1);

  g.globalAlpha = txtP;
  g.fillStyle = PAL.ink; g.font = f; g.textAlign = 'left'; g.textBaseline = 'middle';
  lines.forEach((ln, idx) => {
    g.fillText(ln, x + 68, y + (lines.length === 1 ? h / 2 + 1 : 31 + idx * 34));
  });
  g.restore();
}

export function initIsoFilm(canvas, voTimeline) {
  const g = canvas.getContext('2d');
  const iso = new Iso(g, W, H);

  const VO = (voTimeline || []).map((c, idx, arr) => {
    const nextT0 = idx + 1 < arr.length ? arr[idx + 1].t0 - 0.12 : 59.92;
    const c0 = Math.max(0.05, c.t0 - 0.08);
    const c1 = Math.min(nextT0, Math.max(c.t1 + 0.55, c0 + 1.85));
    return { ...c, c0, c1 };
  });

  // Pre-seed 32 chaotic paper/binder/mail blocks for Scene 1
  const chaosStacks = [];
  const deskCoords = [[-6.5, -4.5], [3.5, -4.5], [-6.5, 4.0], [3.5, 4.0]];
  for (let i = 0; i < 32; i++) {
    const [dx, dy] = deskCoords[i % 4];
    const colIdx = i % 3;
    chaosStacks.push({
      x: dx + ((i % 4) - 1.5) * 1.15 + (hash(i * 7) - 0.5) * 0.6,
      y: dy + (Math.floor((i % 8) / 4) - 0.5) * 1.2,
      z: 1.45 + Math.floor(i / 8) * 0.68,
      w: 1.05, d: 0.85, h: 0.62,
      t0: 0.04 + i * 0.045,
      t3: colIdx === 0 ? T3.coral : colIdx === 1 ? T3.white : T3.amber,
    });
  }

  // Deterministic sound events (`window.EV`)
  const EV = [];
  chaosStacks.forEach((s, i) => { if (i % 2 === 0) EV.push({ t: +s.t0.toFixed(3), type: 'paper_thud', idx: i }); });
  [0.85, 4.88, 8.65, 10.2, 11.8, 13.4, 16.5, 17.2, 17.6, 18.0, 25.2, 26.3, 28.6, 31.3, 33.8, 38.7, 43.4, 44.9, 46.4, 48.7, 54.0, 57.0].forEach(tp => {
    EV.push({ t: tp, type: 'leader_pin' });
  });
  for (let k = 0; k < 20; k++) EV.push({ t: +(39.25 + k * 0.09).toFixed(3), type: 'iso_pop', idx: k });
  EV.push({ t: 15.80, type: 'silence' }, { t: 53.40, type: 'silence' });
  EV.sort((a, b) => a.t - b.t);
  window.DUR = DUR;
  window.EV = EV;

  // Helper: Draw an isometric office desk + monitor
  function drawDesk(x, y, clean = false) {
    iso.box(x, y, 0, 4.4, 2.6, 1.35, T3.desk);
    // Monitor stand & screen
    iso.box(x + 1.7, y + 0.5, 1.35, 1.0, 0.35, 0.25, T3.slate);
    iso.box(x + 1.2, y + 0.45, 1.6, 2.0, 0.22, 1.25, clean ? T3.mint : T3.slate);
  }

  // ── SCENE 1 & 2 (0.0 – 8.5s): Overloaded Office Plinth + Focus & Context Q2 ──
  function sceneChaos(t) {
    const inQ2 = t >= 4.85;
    const uQ2 = eio(seg(t, 4.85, 5.45));
    const kZoom = Math.exp(lerp(Math.log(33), Math.log(27.5), eo(seg(t, 0, 1.1))));
    iso.cam = {
      x: lerp(-0.5, 3.8, uQ2),
      y: lerp(0.5, 4.2, uQ2),
      z: 1.5,
      k: lerp(kZoom, 32, uQ2),
    };
    iso.desat = inQ2 ? 0.78 * uQ2 : 0;

    drawIsoBackdropAndPlinth(g, iso, -12, -10, 24, 20);

    // 4 Desks + Miniature workers (stepping at 12 fps per STYLE.md §2)
    const tStep = Math.floor(t * 12) / 12;
    deskCoords.forEach(([dx, dy], idx) => {
      const heroDesk = inQ2 && idx === 3;
      iso.keep = heroDesk;
      drawDesk(dx, dy, false);
      const bob = Math.abs(Math.sin(tStep * 7 + idx)) * 0.14;
      iso.bill(dx + 2.2, dy + 3.1, 0, (gg) => {
        person(gg, { h: 2.9, body: heroDesk ? '#D9534F' : ['#3A7CA5', '#6E56CF', '#D47A2A', '#D9534F'][idx], hair: '#2E2522', arm: 0.4 + Math.sin(tStep * 8 + idx) * 0.25, bob });
      });
    });

    // 32 Towering stacks of reports, spreadsheets, 18-page minutes & mails
    for (const st of chaosStacks) {
      if (t < st.t0) continue;
      iso.keep = false;
      const drop = 1 - eo(seg(t, st.t0, st.t0 + 0.32));
      iso.box(st.x, st.y, st.z + drop * 5.5, st.w, st.d, st.h, st.t3);
    }
    iso.keep = false;
    iso.flush();
    iso.desat = 0;

    if (!inQ2) {
      // Leader pins calling out the piled paperwork
      pin(iso, -4.5, -3.2, 3.2, { a: seg(t, 0.55, 1.15), up: 105, dir: -1, len: 54, title: 'BÁO CÁO & BẢNG TÍNH', num: '14', unit: 'LỖI #REF!', ts: 18, ns: 36, dot: '#D9534F' });
      pin(iso, 5.5, -3.2, 3.2, { a: seg(t, 0.75, 1.35), up: 105, dir: 1, len: 54, title: 'BIÊN BẢN HỌP & EMAIL', num: '47', unit: 'CHƯA XỬ LÝ', ts: 18, ns: 36, dot: '#D9534F' });

      drawTopBanner(
        g,
        'THỰC TRẠNG QUÁ TẢI TẠI VĂN PHÒNG',
        'Team mọi người đã áp dụng AI để giảm được một nửa thời gian',
        'làm báo cáo với biên bản họp chưa?',
        '#B3352B',
        seg(t, 0.75, 1.15)
      );
    } else {
      // Focus + Context ring + Circular Inset showing trivial translation/caption usage
      const [hx, hy] = iso.P(5.7, 5.2, 1.8);
      ring(g, hx, hy, 56, uQ2, t, 'CHỈ DÙNG BỀ NỔI', { color: '#B3352B', ts: 20 });

      inset(iso, hx, hy, 1460, 470, 185, seg(t, 5.05, 5.75), (gg, cx, cy, r) => {
        gg.fillStyle = '#F5ECDC'; gg.fillRect(cx - r, cy - r, r * 2, r * 2);
        haloText(gg, 'CÁCH DÙNG PHỔ BIẾN', cx, cy - 82, { font: `700 15px ${MONO}`, align: 'center', color: '#B3352B', halo: false });
        gg.fillStyle = '#FFFFFF'; gg.strokeStyle = PAL.ink; gg.lineWidth = 2;
        gg.fillRect(cx - 135, cy - 52, 270, 52); gg.strokeRect(cx - 135, cy - 52, 270, 52);
        haloText(gg, '“Dịch giúp đoạn email…”', cx, cy - 20, { font: `600 18px ${F}`, align: 'center', halo: false });
        gg.fillStyle = '#FFFFFF';
        gg.fillRect(cx - 135, cy + 16, 270, 52); gg.strokeRect(cx - 135, cy + 16, 270, 52);
        haloText(gg, '“Viết 3 câu caption…”', cx, cy + 48, { font: `600 18px ${F}`, align: 'center', halo: false });
        haloText(gg, '0% GIẢM TẢI BÁO CÁO', cx, cy + 108, { font: `800 16px ${MONO}`, align: 'center', color: '#B3352B', halo: false });
      });

      drawTopBanner(
        g,
        'CÂU HỎI THỨC TỈNH',
        'Hay vẫn đang dùng AI',
        'chỉ để dịch thuật với viết caption?',
        '#B3352B',
        seg(t, 4.90, 5.30)
      );
    }
  }

  // ── SCENE 3 (8.5 – 16.5s): 4-Station Broken Conveyor Loop + Hard Freeze (15.8s) ──
  function sceneBrokenLoop(t) {
    const fT = Math.min(t, 15.80);
    const sT = fT - 8.5;
    iso.cam = {
      x: lerp(-4.0, 0.5, eio(seg(sT, 0, 4.8))),
      y: lerp(-2.0, 0.5, eio(seg(sT, 0, 4.8))),
      z: 1.6,
      k: lerp(29, 24.5, eio(seg(sT, 3.2, 5.2))),
    };

    drawIsoBackdropAndPlinth(g, iso, -16, -9, 32, 18);

    // Crooked dashed red route line leading the 4 broken stations (STYLE.md §5: "Nothing moves without a line leading it")
    const routePts = [[-11, 0, 0.1], [-4, 0, 0.1], [3, 0, 0.1], [10, 0, 0.1]];
    iso.line3(routePts, '#B3352B', 3, { dash: [10, 7], off: -fT * 28, layer: 0 });

    const stations = [
      { x: -11, t0: 0.15, title: '01 · PROMPT NGẮN', num: '3 từ', unit: 'SƠ SÀI' },
      { x: -4, t0: 1.65, title: '02 · KẾT QUẢ SÁO RỖNG', num: '0%', unit: 'DÙNG ĐƯỢC' },
      { x: 3, t0: 3.20, title: '03 · SỬA TAY LIÊN TỤC', num: '×14', unit: 'GẠCH XÓA' },
      { x: 10, t0: 4.75, title: '04 · MẤT THỜI GIAN', num: '100%', unit: 'QUÁ TẢI' },
    ];

    stations.forEach((st, idx) => {
      if (sT < st.t0) return;
      const p = back(seg(sT, st.t0, st.t0 + 0.4), 1.4);
      // Base pad
      iso.box(st.x - 2.3, -2.3, 0, 4.6, 4.6, 0.35 * p, T3.white);
      if (idx === 0) {
        iso.box(st.x - 0.8, -0.8, 0.35, 1.6, 1.6, 0.9 * p, T3.slate);
      } else if (idx === 1) {
        // Hollow/scattered grey cubes
        for (let k = 0; k < 3; k++) iso.box(st.x - 1.3 + k * 0.9, -0.7 + (k % 2) * 0.8, 0.35, 0.8, 0.8, (1.1 + k * 0.3) * p, T3.slate);
      } else if (idx === 2) {
        // Worker restacking crooked coral piles
        for (let k = 0; k < 4; k++) iso.box(st.x - 1.2 + (k % 2) * 1.1, -1.0, 0.35 + Math.floor(k / 2) * 0.7, 1.0, 0.9, 0.65 * p, T3.coral);
        iso.bill(st.x + 0.8, 1.5, 0.35, (gg) => person(gg, { h: 2.8, body: '#D9534F', arm: 0.6 + Math.sin(fT * 10) * 0.35 }));
      } else {
        // Towering 100% red overload monolith
        iso.box(st.x - 1.4, -1.4, 0.35, 2.8, 2.8, 4.8 * p, T3.coral);
      }
    });
    iso.flush();

    stations.forEach((st, idx) => {
      if (sT < st.t0 + 0.1) return;
      pin(iso, st.x, -0.5, idx === 3 ? 5.2 : 2.1, {
        a: seg(sT, st.t0 + 0.1, st.t0 + 0.65),
        up: [130, 85, 148, 82][idx],
        dir: idx < 2 ? -1 : 1,
        len: 48,
        title: st.title, num: st.num, unit: st.unit, ts: 17, ns: 34, dot: '#B3352B'
      });
    });

    drawTopBanner(
      g,
      t >= 15.8 ? 'ĐÓNG BĂNG QUÁ TẢI  ·  CẦN MỘT HỆ THỐNG MỚI' : 'QUÁ TRÌNH TỰ PHÁT GÂY LÃNG PHÍ',
      'Prompt ngắn  →  Kết quả sáo rỗng  →  Sửa tay liên tục  →  Mất thời gian',
      '',
      '#B3352B',
      seg(sT, 0.05, 0.45)
    );
  }

  // ── SCENE 4 (16.5 – 25.0s): Coherent 4-Station System + Moving Data Cubes ──
  function sceneCoherentSystem(t) {
    const sT = t - 16.5;
    iso.cam = { x: 0, y: 0.8, z: 1.5, k: lerp(21.5, 24.5, eio(seg(sT, 0, 2.5))) };
    drawIsoBackdropAndPlinth(g, iso, -15, -11, 30, 22);

    // Clean electric-blue route loop drawn ahead of stations
    const loopPts = [[-7.5, -4.5, 0.15], [6.5, -4.5, 0.15], [6.5, 5.0, 0.15], [-7.5, 5.0, 0.15], [-7.5, -4.5, 0.15]];
    iso.line3(loopPts, '#2D6390', 3.2, { dash: [10, 6], off: -sT * 36, layer: 0 });

    // Moving data spheres/cubes streaming along the system loop!
    if (sT > 0.6) {
      for (let pIdx = 0; pIdx < 8; pIdx++) {
        const u = (sT * 0.28 + pIdx / 8) % 1;
        const segIdx = Math.min(3, Math.floor(u * 4)), su = (u * 4) - segIdx;
        const A = loopPts[segIdx], B = loopPts[segIdx + 1];
        iso.box(lerp(A[0], B[0], su) - 0.35, lerp(A[1], B[1], su) - 0.35, 0.35, 0.7, 0.7, 0.7, pIdx % 2 ? T3.mint : T3.blue);
      }
    }

    // Station 1: Dynamic Spreadsheet Plinth (-8.5, -5.5)
    const p1 = back(seg(sT, 0.15, 0.60), 1.35);
    iso.box(-10.5, -7.2, 0, 6.0, 4.6, 0.5 * p1, T3.white);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
      iso.box(-9.9 + c * 1.25, -6.6 + r * 1.2, 0.5, 1.0, 0.9, (0.35 + ((r + c) % 2) * 0.25) * p1, (r + c) % 3 === 0 ? T3.mint : T3.blue);
    }

    // Station 2: KPI Dashboard Towers (4.5, -5.5)
    const p2 = back(seg(sT, 0.40, 0.85), 1.35);
    iso.box(3.8, -7.2, 0, 6.0, 4.6, 0.5 * p2, T3.white);
    [1.4, 2.2, 3.1, 4.2].forEach((bh, bi) => {
      iso.box(4.5 + bi * 1.2, -5.6, 0.5, 0.9, 1.4, bh * p2, bi >= 2 ? T3.mint : T3.amber);
    });

    // Station 3: Acceptance Checklist Gate (-8.5, 4.5)
    const p3 = back(seg(sT, 0.65, 1.10), 1.35);
    iso.box(-10.5, 2.6, 0, 6.0, 4.6, 0.5 * p3, T3.white);
    for (let k = 0; k < 3; k++) {
      iso.box(-9.7 + k * 1.65, 3.8, 0.5, 1.25, 2.0, 1.1 * p3, T3.mint);
    }

    // Station 4: Process Flow Router (4.5, 4.5)
    const p4 = back(seg(sT, 0.90, 1.35), 1.35);
    iso.box(3.8, 2.6, 0, 6.0, 4.6, 0.5 * p4, T3.white);
    iso.cyl(6.8, 4.9, 0.5, 1.6, 1.8 * p4, T3.blue);
    iso.cone(6.8, 4.9, 0.5 + 1.8 * p4, 1.1, 1.1 * p4, T3.amber);

    iso.flush();

    pin(iso, -7.5, -5.0, 1.4, { a: seg(sT, 0.5, 1.1), up: 95, dir: -1, len: 50, title: 'BẢNG TÍNH ĐỘNG', num: '0.6s', unit: 'TỰ ĐỘNG', ts: 18, ns: 34, dot: '#3F9E72' });
    pin(iso, 6.8, -5.0, 4.5, { a: seg(sT, 0.75, 1.35), up: 75, dir: 1, len: 50, title: 'DASHBOARD KPI', num: '2.8×', unit: 'HIỆU SUẤT', ts: 18, ns: 34, dot: '#E2A03F' });
    pin(iso, -7.5, 4.8, 1.7, { a: seg(sT, 1.0, 1.6), up: 100, dir: -1, len: 56, title: 'CHECKLIST NGHIỆM THU', num: '100%', unit: 'ĐỐI SOÁT', ts: 18, ns: 34, dot: '#3F9E72' });
    pin(iso, 6.8, 6.2, 1.2, { a: seg(sT, 1.25, 1.85), up: 50, dir: 1, len: 72, title: 'LUỒNG DỮ LIỆU', num: 'LIVE', unit: 'LIÊN TỤC', ts: 18, ns: 34, dot: '#3A7CA5' });

    drawTopBanner(
      g,
      'CHUYỂN ĐỔI HỆ THỐNG BÀI BẢN',
      'Bảng tính động  ·  Dashboard KPI  ·  Checklist  ·  Luồng dữ liệu',
      '',
      '#2D6390',
      seg(sT, 0.1, 0.5)
    );
  }

  // ── SCENE 5 (25.0 – 38.5s): Cutaway PCTPR Chambers (ChatGPT -> Claude -> Gemini -> GPTs/Gems) ──
  function scenePCTPRCutaway(t) {
    const sT = t - 25.0;
    iso.cam = {
      x: lerp(-2.5, 2.0, eio(seg(sT, 0, 10.5))),
      y: lerp(-1.0, 1.5, eio(seg(sT, 0, 10.5))),
      z: 1.8,
      k: 24.5,
    };
    drawIsoBackdropAndPlinth(g, iso, -17, -10, 34, 20);

    // 5 PCTPR Pedestal Tokens along back ridge (y = -6.8)
    const pLetters = ['P · Persona', 'C · Context', 'T · Task', 'P · Process', 'R · Result'];
    pLetters.forEach((lbl, idx) => {
      const tp = back(seg(sT, 0.15 + idx * 0.16, 0.55 + idx * 0.16), 1.35);
      const px = -12 + idx * 5.6;
      iso.box(px, -7.8, 0, 4.2, 2.2, 1.1 * tp, T3.amber);
      iso.text3(lbl.split(' · ')[0], px + 1.5, -6.3, 1.15 * tp, { plane: 'xy', size: 1.35, extrude: 0.18, tri: T3.white });
    });

    // Main PCTPR conveyor route through the 4 Cutaway Chambers
    iso.line3([[-13, 1.2, 0.2], [13, 1.2, 0.2]], '#2D6390', 3.5, { dash: [12, 7], off: -sT * 42, layer: 0 });
    for (let d = 0; d < 6; d++) {
      const ux = -12.5 + ((sT * 4.5 + d * 4.3) % 25);
      iso.sphere(ux, 1.2, 0.65, 0.42, T3.mint);
    }

    // 4 Cutaway AI Chambers (front walls skipped `skip: [1, 2]` + hatched cutaway rim!)
    const chambers = [
      { x: -12.8, t0: 1.2, name: 'ChatGPT', role: 'LẬP KẾ HOẠCH', unit: 'Dàn ý & mục tiêu', t3: T3.mint, dot: '#3F9E72' },
      { x: -5.2, t0: 3.4, name: 'Claude', role: 'PHÂN TÍCH TÀI LIỆU', unit: 'Đọc sâu 24 trang', t3: T3.ochre, dot: '#D47A2A' },
      { x: 2.4, t0: 6.1, name: 'Gemini', role: 'HỖ TRỢ NGHIÊN CỨU', unit: 'Đa nguồn xác thực', t3: T3.blue, dot: '#3A7CA5' },
      { x: 10.0, t0: 8.6, name: 'GPTs / Gems', role: 'TÓM TẮT · LỖI · TUẦN', unit: '3 Bot chuyên biệt', t3: T3.plum, dot: '#6E56CF' },
    ];

    chambers.forEach((ch, idx) => {
      const cp = back(seg(sT, ch.t0 - 0.8, ch.t0 - 0.2), 1.25);
      if (cp <= 0) return;
      const cutOpen = eo(seg(sT, ch.t0, ch.t0 + 0.55));
      // Floor & back walls of chamber (cutaway open on +x / +y when cutOpen > 0.3!)
      iso.box(ch.x, -1.6, 0, 5.2, 5.2, 0.4 * cp, T3.white);
      iso.box(ch.x, -1.6, 0.4, 5.2, 0.45, 3.2 * cp, ch.t3);
      iso.box(ch.x, -1.6, 0.4, 0.45, 5.2, 3.2 * cp, ch.t3);

      // Inside mechanisms revealed by cutaway!
      if (idx === 0) {
        for (let b = 0; b < 3; b++) iso.box(ch.x + 1.1 + b * 1.15, -0.2, 0.4, 0.85, 2.2, (1.0 + b * 0.55) * cp, T3.mint);
      } else if (idx === 1) {
        iso.box(ch.x + 1.2, -0.4, 0.4, 2.8, 2.4, 2.2 * cp, T3.white);
        const scanY = -0.3 + ((sT * 1.4) % 2.0);
        iso.box(ch.x + 1.0, scanY, 2.65, 3.2, 0.35, 0.22, T3.ochre);
      } else if (idx === 2) {
        iso.cyl(ch.x + 2.6, 1.0, 0.4, 1.35, 1.2 * cp, T3.blue);
        iso.sphere(ch.x + 2.6, 1.0, 2.2 * cp, 0.75 * cp, T3.amber);
      } else {
        // 3 specialized Gems output chutes: Tóm tắt họp · Kiểm lỗi · Kế hoạch tuần
        [T3.mint, T3.amber, T3.plum].forEach((c3, gi) => {
          iso.box(ch.x + 1.0 + gi * 1.3, -0.3, 0.4, 1.0, 2.8, (1.5 + Math.sin(sT * 4 + gi) * 0.25) * cp, c3);
        });
      }

      // Sliding front skin fading away during cutaway (`STYLE.md` §5)
      if (cutOpen < 1) {
        const slide = cutOpen * 1.8;
        iso.box(ch.x + slide, 3.1 + slide, 0.4, 5.2, 0.4, 3.1 * (1 - cutOpen), ch.t3);
      }
    });

    iso.flush();

    // Cutaway dashed lines & section hatches + station leader pins
    chambers.forEach((ch, idx) => {
      const cutA = seg(sT, ch.t0 - 0.15, ch.t0 + 0.35);
      if (cutA > 0 && cutA < 1) {
        const pA = iso.P(ch.x, 3.6, 3.6), pB = iso.P(ch.x + 5.2, 3.6, 3.6), pC = iso.P(ch.x + 5.2, -1.6, 3.6);
        cutLine(g, [pA, pB, pC], cutA);
      }
      if (sT >= ch.t0) {
        // Hatched top cut rim
        const r0 = iso.P(ch.x, -1.6, 3.6), r1 = iso.P(ch.x + 5.2, -1.6, 3.6), r2 = iso.P(ch.x + 5.2, -1.15, 3.6), r3 = iso.P(ch.x, -1.15, 3.6);
        hatch(g, [r0, r1, r2, r3], { sp: 6 });
        pin(iso, ch.x + 2.6, 1.0, 3.5, {
          a: seg(sT, ch.t0 + 0.1, ch.t0 + 0.65),
          up: [105, 175, 165, 155][idx],
          dir: idx === 0 ? -1 : 1,
          len: [56, 36, 42, 48][idx],
          title: ch.role,
          num: ch.name,
          unit: ch.unit,
          ts: 16, ns: 30, dot: ch.dot
        });
      }
    });

    drawTopBanner(
      g,
      'QUY TRÌNH MỚI: PCTPR (PERSONA · CONTEXT · TASK · PROCESS · RESULT)',
      'ChatGPT lập kế hoạch  →  Claude phân tích  →  Gemini nghiên cứu  →  GPTs/Gems',
      '',
      '#2D6390',
      seg(sT, 0.05, 0.45)
    );
  }

  // ── SCENE 6 & 7 (38.5 – 48.5s): Isotype 10×10 Matrix (100% -> 40%) + 3 Circular Proof Insets ──
  function sceneIsotypeAndProof(t) {
    const sT = t - 38.5;
    iso.cam = { x: 0.5, y: 0.5, z: 1.2, k: lerp(25, 22.5, eio(seg(sT, 4.5, 5.5))) };
    drawIsoBackdropAndPlinth(g, iso, -14, -11, 28, 22);

    // 10 x 10 = 100 Physical Isometric Blocks on centre plinth!
    // Indices 0..39 turn/stay crisp Mint (#3F9E72 = 40%); indices 40..99 lift off and clear!
    const dropProgress = eio(seg(sT, 0.65, 2.85));
    for (let idx = 0; idx < 100; idx++) {
      const c = idx % 10, r = Math.floor(idx / 10);
      const bx = -8.8 + c * 1.75, by = -8.2 + r * 1.75;
      const keep = idx < 40;
      if (keep) {
        const sq = 1 + 0.18 * Math.sin(clamp((sT - 2.4 - idx * 0.01) * 8, 0, Math.PI));
        iso.box(bx, by, 0, 1.28, 1.28, 1.15 * sq, sT > 1.2 ? T3.mint : T3.coral);
      } else {
        const uLift = clamp((sT - 0.55 - ((99 - idx) * 0.024)) / 0.55, 0, 1);
        if (uLift < 1) {
          iso.box(bx, by, uLift * 9.5, 1.28 * (1 - uLift * 0.6), 1.28 * (1 - uLift * 0.6), 0.95 * (1 - uLift), T3.coral);
        } else {
          // Flat faint footprint square showing eliminated 60% paperwork!
          iso.flat([[bx + 0.15, by + 0.15], [bx + 1.1, by + 0.15], [bx + 1.1, by + 1.1], [bx + 0.15, by + 1.1]], 0.02, '#DFD3BC');
        }
      }
    }
    iso.flush();

    const curPct = Math.round(lerp(100, 40, dropProgress));
    pin(iso, -5.2, -4.5, 1.3, {
      a: seg(sT, 0.2, 0.7), up: 120, dir: -1, len: 56,
      title: 'KHỐI LƯỢNG CÔNG VIỆC GIẤY TỜ',
      num: `${curPct}%`,
      unit: 'GIẢM TỪ 100% XUỐNG 40%',
      ts: 18, ns: 56, dot: '#3F9E72'
    });

    // At t >= 43.3s (sT >= 4.8s): 3 Circular Detail Insets proving Auto Minutes, Fast Report, QA Checklist!
    if (t >= 43.3) {
      const pT = t - 43.3;
      const proofs = [
        { ax: -3.5, ay: -5.0, cx: 310, cy: 560, t0: 0.05, tag: '01 · TỰ ĐỘNG TÓM TẮT', big: '0.8 giây', sub: 'Biên bản họp rõ đầu việc' },
        { ax: 1.5, ay: 0.0, cx: 1580, cy: 330, t0: 1.40, tag: '02 · TẠO BÁO CÁO NHANH', big: '3.2×', sub: 'Tự động hóa bảng & biểu đồ' },
        { ax: 4.5, ay: 5.5, cx: 1560, cy: 690, t0: 2.80, tag: '03 · CHECKLIST NGHIỆM THU', big: '12/12', sub: 'Kiểm chứng 100% số liệu' },
      ];
      for (const pr of proofs) {
        const [wx, wy] = iso.P(pr.ax, pr.ay, 1.0);
        inset(iso, wx, wy, pr.cx, pr.cy, 138, seg(pT, pr.t0, pr.t0 + 0.55), (gg, cx, cy, r) => {
          gg.fillStyle = '#FBF6EA'; gg.fillRect(cx - r, cy - r, r * 2, r * 2);
          haloText(gg, pr.tag, cx, cy - 52, { font: `700 13px ${MONO}`, align: 'center', color: '#3F9E72', halo: false });
          haloText(gg, pr.big, cx, cy + 12, { font: `800 46px ${F}`, align: 'center', color: PAL.ink, halo: false });
          haloText(gg, pr.sub, cx, cy + 54, { font: `600 16px ${F}`, align: 'center', color: '#4A3F3A', halo: false });
        });
      }
    }

    drawTopBanner(
      g,
      t < 43.3 ? 'ĐỊNH LƯỢNG BẰNG ISOTYPE (1 KHỐI = 1% TẢI CÔNG VIỆC)' : 'NGHIỆM THU CHẤT LƯỢNG ĐẦU RA',
      t < 43.3 ? 'Khối lượng công việc giảm từ 100% xuống còn 40%' : 'Biên bản tự động tóm tắt  ·  Báo cáo nhanh hơn  ·  Chuẩn checklist',
      '',
      '#3F9E72',
      1
    );
  }

  // ── SCENE 8 (48.5 – 60.0s): Scale Reveal Tidy Office Diorama + Museum Legend Card (50–60% & CTA) ──
  function sceneTidyFinale(t) {
    const sT = t - 48.5;
    const showLegend = t >= 53.95;
    const legU = eio(seg(t, 53.95, 54.65));

    // Shift plinth smoothly to the left when the finished Infographic Legend Card arrives on the right!
    iso.cam = {
      x: lerp(0, 5.2, legU),
      y: lerp(0, -2.5, legU),
      z: 1.5,
      k: lerp(26.5, 22.5, legU),
    };

    drawIsoBackdropAndPlinth(g, iso, -13, -10, 24, 20);

    // Clean, spacious High-Value Strategy Table at centre of sunlit office plinth (ZERO paper clutter!)
    iso.box(-4.8, -3.2, 0, 8.6, 5.4, 1.35, T3.white);
    // Floating clean holographic/3-tone KPI centerpiece model on strategy table
    iso.box(-2.2, -1.6, 1.35, 3.4, 2.2, 0.3, T3.mint);
    iso.box(-1.6, -1.1, 1.65, 0.7, 0.7, 1.5, T3.blue);
    iso.box(-0.5, -1.1, 1.65, 0.7, 0.7, 2.2, T3.mint);
    iso.box(0.6, -1.1, 1.65, 0.7, 0.7, 2.9, T3.amber);

    // Neat minimalist side consoles + potted greenery spheres
    drawDesk(-10.5, -7.2, true);
    drawDesk(4.8, -7.2, true);
    [[-10.8, 6.2], [7.8, 6.2]].forEach(([px, py]) => {
      iso.cyl(px, py, 0, 0.85, 1.1, T3.strata1);
      iso.sphere(px, py, 2.0, 1.35, T3.mint);
    });

    // 4 Calm Employees collaborating on high-value strategy around the clean table
    const tStep = Math.floor(t * 12) / 12;
    const team = [
      [-6.0, -0.5, '#3A7CA5', 1],
      [5.0, -0.5, '#3F9E72', -1],
      [-2.0, 3.6, '#6E56CF', 1],
      [1.8, 3.6, '#D47A2A', -1],
    ];
    team.forEach(([px, py, col, fc], idx) => {
      iso.bill(px, py, 0, (gg) => {
        person(gg, { h: 3.1, body: col, hair: '#2E2522', face: fc, arm: 0.25 + Math.sin(tStep * 3 + idx) * 0.08 });
      });
    });

    iso.flush();

    pin(iso, -0.5, -0.5, 4.7, {
      a: seg(sT, 0.35, 0.95), up: 95, dir: -1, len: 52,
      title: 'KHÔNG GIAN LÀM VIỆC GỌN GÀNG',
      num: '100%',
      unit: 'TẬP TRUNG GIÁ TRỊ CAO',
      ts: 18, ns: 38, dot: '#3F9E72'
    });

    if (!showLegend) {
      drawTopBanner(
        g,
        'GIẢI PHÓNG ĐỘI NGŨ KHỎI GIẤY TỜ LẶP LẠI',
        'Không gian gọn gàng — Nhân sự tập trung vào công việc giá trị cao',
        '',
        '#3F9E72',
        seg(sT, 0.1, 0.5)
      );
    } else {
      // Museum-grade Isometric Infographic Legend Card (styled after styles/iso-infographic/poster.jpg)
      const lx = 1020, ly = 150, lw = 816, lh = 760;
      const open = eo(seg(t, 53.95, 54.45));
      g.save();
      g.globalAlpha = open;
      g.fillStyle = 'rgba(46,37,34,0.14)';
      g.beginPath(); g.roundRect(lx + 8, ly + 10, lw, lh, 16); g.fill();
      g.fillStyle = PAL.paper;
      g.beginPath(); g.roundRect(lx, ly, lw, lh, 16); g.fill();
      g.strokeStyle = PAL.ink; g.lineWidth = 2.5;
      g.beginPath(); g.roundRect(lx + 1, ly + 1, lw - 2, lh - 2, 16); g.stroke();

      haloText(g, 'TỔNG KẾT HỆ THỐNG AI VĂN PHÒNG  ·  PCTPR', lx + 44, ly + 62, { font: `700 15px ${MONO}`, track: 2, color: '#3F9E72', halo: false });
      haloText(g, 'Thời gian xử lý giấy tờ giảm thực tế', lx + 44, ly + 118, { font: `700 32px ${F}`, color: PAL.ink, halo: false });
      haloText(g, '50–60%', lx + 44, ly + 245, { font: `800 116px ${F}`, color: '#2E6F4E', halo: false });

      // Isotype 10-icon Legend Bar (6 of 10 icons lit = 60% paperwork time saved!)
      iconGrid(g, lx + 44, ly + 282, 10, lerp(0, 6, eo(seg(t, 54.2, 55.2))), 10, 56, (gg, x, y, s, lit) => {
        ICON.box(gg, x, y, s, T3.mint, lit);
      });
      haloText(g, '■ = 10% thời gian làm báo cáo & biên bản họp được giải phóng', lx + 48, ly + 368, { font: `500 16px ${F}`, color: '#5A4E46', halo: false });

      // Horizontal ink divider
      g.strokeStyle = PAL.ink; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(lx + 44, ly + 404); g.lineTo(lx + lw - 44, ly + 404); g.stroke();

      // Final Line 2 CTA at t >= 56.92s (with teaser summary before 56.92s)
      if (t < 56.92) {
        haloText(g, 'QUY TRÌNH CHUẨN ĐÃ KIỂM CHỨNG:', lx + 44, ly + 458, { font: `700 15px ${MONO}`, color: '#3A7CA5', halo: false });
        const recap = [
          '• ChatGPT lập kế hoạch  ·  Claude phân tích tài liệu',
          '• Gemini nghiên cứu  ·  GPTs/Gems tóm tắt & soát lỗi',
          '• Khối lượng giấy tờ giảm từ 100% xuống còn 40%',
        ];
        recap.forEach((rc, ri) => haloText(g, rc, lx + 44, ly + 510 + ri * 46, { font: `600 22px ${F}`, color: PAL.ink, halo: false }));
      } else {
        const ctaP = back(seg(t, 56.92, 57.40), 1.25);
        g.save();
        g.translate(lx + lw / 2, ly + 565);
        g.scale(ctaP, ctaP);
        g.translate(-(lx + lw / 2), -(ly + 565));

        g.fillStyle = '#231A2C';
        g.beginPath(); g.roundRect(lx + 38, ly + 432, lw - 76, 268, 14); g.fill();
        haloText(g, 'BƯỚC TIẾP THEO CHO ĐỘI NGŨ CỦA BẠN', lx + 72, ly + 484, { font: `700 15px ${MONO}`, track: 2, color: '#E9BE5C', halo: false });
        haloText(g, 'Muốn dùng AI bài bản', lx + 72, ly + 544, { font: `800 38px ${F}`, color: '#FBF4E6', halo: false });
        haloText(g, 'từ System Prompt đến', lx + 72, ly + 598, { font: `800 38px ${F}`, color: '#FBF4E6', halo: false });
        haloText(g, 'kiểm chứng chất lượng?', lx + 72, ly + 652, { font: `800 38px ${F}`, color: '#8CE99A', halo: false });
        g.restore();
      }
      g.restore();
    }
  }

  const noSub = new URLSearchParams(location.search).get('nosub') === '1';
  window.render = function (t) {
    t = clamp(t, 0, DUR);
    if (t < 8.5) sceneChaos(t);
    else if (t < 16.5) sceneBrokenLoop(t);
    else if (t < 25.0) sceneCoherentSystem(t);
    else if (t < 38.5) scenePCTPRCutaway(t);
    else if (t < 48.5) sceneIsotypeAndProof(t);
    else sceneTidyFinale(t);

    if (!noSub) {
      const cue = VO.find(c => t >= c.c0 && t < c.c1);
      if (cue && !['c00', 'c01', 'c09', 'c10'].includes(cue.id)) {
        const a = Math.min(seg(t, cue.c0, cue.c0 + 0.16), 1 - seg(t, cue.c1 - 0.16, cue.c1));
        drawMapSubtitle(g, cue.sub, a, t < 16.5 ? T3.coral : T3.mint);
      }
    }
  };

  window.TEXTS = function (t) {
    const out = [];
    if (t >= 0.8 && t < 4.8) out.push({ id: 'q1', text: 'Team mọi người đã áp dụng AI để giảm được một nửa thời gian làm báo cáo với biên bản họp chưa?', x0: 84, y0: 56, x1: 1650, y1: 190 });
    if (t >= 4.95 && t < 8.45) out.push({ id: 'q2', text: 'Hay vẫn đang dùng AI chỉ để dịch thuật với viết caption?', x0: 84, y0: 56, x1: 1400, y1: 190 });
    if (t >= 8.6 && t < 16.4) out.push({ id: 'lp', text: 'Prompt ngắn → Kết quả sáo rỗng → Sửa tay liên tục → Mất thời gian', x0: 84, y0: 56, x1: 1750, y1: 160 });
    if (t >= 16.7 && t < 24.9) out.push({ id: 'sys', text: 'Bảng tính động · Dashboard KPI · Checklist · Luồng dữ liệu', x0: 84, y0: 56, x1: 1750, y1: 160 });
    if (t >= 25.2 && t < 38.4) out.push({ id: 'pct', text: 'ChatGPT lập kế hoạch → Claude phân tích → Gemini nghiên cứu → GPTs/Gems', x0: 84, y0: 56, x1: 1820, y1: 160 });
    if (t >= 38.7 && t < 48.4) out.push({ id: 'iso', text: '100% → 40%', x0: 84, y0: 56, x1: 1750, y1: 160 });
    if (t >= 48.7 && t < 53.9) out.push({ id: 'cln', text: 'Không gian gọn gàng — Nhân sự tập trung vào công việc giá trị cao', x0: 84, y0: 56, x1: 1750, y1: 160 });
    if (t >= 54.0 && t <= 60.0) out.push({ id: 'leg', text: 'Thời gian xử lý giấy tờ giảm thực tế 50–60%', x0: 1020, y0: 150, x1: 1836, y1: 910 });
    return out;
  };
}
