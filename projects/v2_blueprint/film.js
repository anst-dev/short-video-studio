// film.js — Engineering Blueprint: Bản Vẽ Cơ Khí Tự Động Hóa (60.0s @ 24fps, 120 BPM)
import { clamp, lerp, seg, ss, eo, eio, back } from '/core/lib.js';
import { makePaper } from './paper.js';
import * as D from './draw.js';
const { W, H, inkC, fxC, ovC, g, f, ov, TAU, cam, proj, LW, setCam, lw, clear, S, line, solid, hatch, circ, rect, gearPts, text, dim, balloon, nibs } = D;

export const DUR = 60.0;
const SHEET = [3800, 2400];
const TECH = 'BeVietnamPro', MONO = 'JBMono';

// Escapement stepping helper: advances smoothly on 8th-note subdivisions like clockwork!
function escapement(t, rate = 4) {
  const u = t * rate, i = Math.floor(u), frac = u - i;
  return (i + eo(clamp(frac * 2.2, 0, 1))) / rate;
}

// Wrap text for blueprint NOTE subtitle overlay
function wrapOv(ctx, str, fontStr, maxW) {
  ctx.font = fontStr;
  const words = str.split(' ');
  const out = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && cur) { out.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) out.push(cur);
  return out;
}

// Double-ruled Blueprint Drafting Note Box (`STYLE.md` §4: translucent box, double white rules, "NOTE / n" cell, placed in open sky)
function drawBlueprintNote(noteNum, textStr, a, placeTop = false) {
  if (a <= 0 || !textStr) return;
  const fontStr = `600 24px ${TECH}`;
  const lines = wrapOv(ov, textStr, fontStr, 1180);
  ov.font = fontStr;
  const tw = Math.max(...lines.map(l => ov.measureText(l).width));
  const boxW = tw + 168, boxH = lines.length === 1 ? 68 : 100;
  const x = (W - boxW) / 2, y = placeTop ? 36 : H - boxH - 36;

  ov.save();
  ov.globalAlpha = eo(a);
  // Premultiplied-friendly translucent Prussian-navy backing
  ov.fillStyle = 'rgba(12, 28, 62, 0.86)';
  ov.fillRect(x, y, boxW, boxH);
  ov.strokeStyle = 'rgba(232, 242, 252, 0.92)';
  ov.lineWidth = 2;
  ov.strokeRect(x, y, boxW, boxH);
  ov.lineWidth = 1;
  ov.strokeRect(x + 5, y + 5, boxW - 10, boxH - 10);

  // Left "NOTE / 0n" cell divider
  ov.beginPath(); ov.moveTo(x + 112, y + 5); ov.lineTo(x + 112, y + boxH - 5); ov.stroke();
  ov.fillStyle = '#E8F2FC';
  ov.font = `700 13px ${MONO}`; ov.textAlign = 'center'; ov.textBaseline = 'middle';
  ov.fillText(`NOTE / 0${noteNum}`, x + 58, y + boxH / 2);

  // Lettered text reveal left-to-right
  const writeU = eo(seg(a, 0.1, 1.0));
  ov.save();
  ov.beginPath(); ov.rect(x + 120, y, (boxW - 126) * writeU, boxH); ov.clip();
  ov.font = fontStr; ov.textAlign = 'left'; ov.fillStyle = '#F2F7FD';
  lines.forEach((ln, idx) => {
    ov.fillText(ln, x + 130, y + (lines.length === 1 ? boxH / 2 + 1 : 32 + idx * 34));
  });
  ov.restore();
  ov.restore();
}

// Camera keyframes across the 3800 × 2400 Blueprint Sheet
const CAM_KEYS = [
  { t: 0.00, x: 740, y: 660, z: 0.82 },
  { t: 0.85, x: 740, y: 610, z: 1.00 },
  { t: 4.70, x: 740, y: 610, z: 1.00 },
  // Pan right to superficial Bypass Valve (Question 2)
  { t: 5.25, x: 1260, y: 620, z: 1.00 },
  { t: 8.40, x: 1260, y: 620, z: 1.00 },
  // Tilt down to Broken 4-Gear Escapement
  { t: 9.00, x: 780, y: 1080, z: 0.96 },
  { t: 16.40, x: 780, y: 1080, z: 0.96 },
  // Whip/Cut on 16.5s downbeat to FIG. 2 Coherent System
  { t: 16.55, x: 2040, y: 540, z: 0.96 },
  { t: 24.85, x: 2040, y: 540, z: 0.96 },
  // Track down to FIG. 2B Oblique PCTPR 4-AI Gear Train
  { t: 25.45, x: 2040, y: 1050, z: 0.96 },
  { t: 38.35, x: 2040, y: 1050, z: 0.96 },
  // Pan to FIG. 3 Workload Compression Piston (100% -> 40%)
  { t: 39.00, x: 760, y: 1790, z: 0.98 },
  { t: 43.20, x: 760, y: 1790, z: 0.98 },
  // Lateral track to FIG. 3B 3 QA Inspection Gauges
  { t: 43.75, x: 1810, y: 1730, z: 0.96 },
  { t: 48.35, x: 1810, y: 1730, z: 0.96 },
  // Whole-Sheet Establishing Reveal (Clean Workspace + Full Sheet on Drafting Cloth!)
  { t: 49.25, x: 1900, y: 1200, z: 0.46 },
  { t: 53.85, x: 1900, y: 1200, z: 0.46 },
  // Push into Stamped Title Block & Final Specification!
  { t: 54.15, x: 3060, y: 1940, z: 1.08 },
  { t: 60.00, x: 3060, y: 1940, z: 1.08 },
];

function evalSheetCam(t) {
  let k = 0;
  while (k < CAM_KEYS.length - 2 && t >= CAM_KEYS[k + 1].t) k++;
  const A = CAM_KEYS[k], B = CAM_KEYS[k + 1];
  const u = eio(seg(t, A.t, B.t));
  let bumpX = 0, bumpY = 0;
  // Physical camera bump when rubber stamp slams at 54.05s! (`STYLE.md` §5)
  if (t >= 54.02 && t < 54.45) {
    const dt = t - 54.02;
    bumpY = Math.exp(-dt * 14) * Math.cos(dt * 55) * 14;
    bumpX = Math.exp(-dt * 14) * Math.sin(dt * 42) * 6;
  }
  return {
    x: lerp(A.x, B.x, u) + bumpX,
    y: lerp(A.y, B.y, u) + bumpY,
    z: Math.exp(lerp(Math.log(A.z), Math.log(B.z), u)),
    r: 0,
  };
}

export function initBlueprintFilm(canvas, voTimeline) {
  const compositePaper = makePaper(canvas, W, H);

  const VO = (voTimeline || []).map((c, idx, arr) => {
    const nextT0 = idx + 1 < arr.length ? arr[idx + 1].t0 - 0.12 : 59.92;
    const c0 = Math.max(0.05, c.t0 - 0.08);
    const c1 = Math.min(nextT0, Math.max(c.t1 + 0.55, c0 + 1.85));
    return { ...c, c0, c1, num: idx + 1 };
  });

  // Deterministic drafting & mechanical foley events (`window.EV`)
  const EV = [
    { t: 0.05, type: 'whoosh', dur: 0.45 },
    { t: 0.85, type: 'leader_pin', idx: 0 },
    { t: 5.05, type: 'leader_pin', idx: 1 },
    { t: 8.75, type: 'step_bad', idx: 0 },
    { t: 10.25, type: 'step_bad', idx: 1 },
    { t: 11.85, type: 'step_bad', idx: 2 },
    { t: 13.45, type: 'step_bad', idx: 3 },
    { t: 15.80, type: 'silence' },
    { t: 16.50, type: 'snap_impact' },
    { t: 25.30, type: 'whoosh', dur: 0.35 },
    { t: 26.30, type: 'ai_lock', idx: 0 },
    { t: 28.60, type: 'ai_lock', idx: 1 },
    { t: 31.30, type: 'ai_lock', idx: 2 },
    { t: 33.80, type: 'ai_lock', idx: 3 },
    { t: 38.90, type: 'whoosh', dur: 0.28 },
    { t: 41.20, type: 'verdict_chime', idx: 0 },
    { t: 43.45, type: 'check_ding', idx: 0 },
    { t: 44.95, type: 'check_ding', idx: 1 },
    { t: 46.45, type: 'check_ding', idx: 2 },
    { t: 48.80, type: 'whoosh', dur: 0.45 },
    { t: 53.40, type: 'silence' },
    { t: 54.02, type: 'snap_impact' }, // Heavy rubber stamp thump!
    { t: 56.98, type: 'verdict_chime', idx: 2 },
  ];
  // Escapement gear ticks during active machine sections
  for (let gt = 16.75; gt < 38.2; gt += 0.5) EV.push({ t: +gt.toFixed(3), type: 'cursor_tick' });
  // Winding-down ticks before 15.8s freeze
  [14.2, 14.5, 14.88, 15.32, 15.72].forEach(wt => EV.push({ t: wt, type: 'key_tap' }));
  EV.sort((a, b) => a.t - b.t);
  window.DUR = DUR;
  window.EV = EV;

  // Helper: Draw a technical pressure/QA dial gauge on the blueprint
  function drawGauge(cx, cy, r, needleAng, labelTop, labelVal, u = 1) {
    if (u <= 0) return;
    solid(circ(cx, cy, r, 48), { w: LW.out, u });
    line(circ(cx, cy, r * 0.84, 36, Math.PI * 0.8, Math.PI * 2.2), { w: LW.thin, u });
    for (let i = 0; i <= 6; i++) {
      const a = Math.PI * 0.85 + (i / 6) * Math.PI * 1.3;
      line([[cx + Math.cos(a) * r * 0.72, cy + Math.sin(a) * r * 0.72], [cx + Math.cos(a) * r * 0.86, cy + Math.sin(a) * r * 0.86]], { w: LW.hair, u, nib: false });
    }
    if (u > 0.5) {
      const nx = cx + Math.cos(needleAng) * r * 0.68, ny = cy + Math.sin(needleAng) * r * 0.68;
      line([[cx, cy], [nx, ny]], { w: LW.out, nib: false });
      solid(circ(cx, cy, r * 0.09, 16), { w: LW.det, nib: false });
      if (labelTop) text(labelTop, cx, cy - r - 18, { size: 20, weight: 700, font: MONO, align: 'center', u: seg(u, 0.5, 1) });
      if (labelVal) text(labelVal, cx, cy + r * 0.48, { size: 26, weight: 800, font: TECH, align: 'center', u: seg(u, 0.5, 1) });
    }
  }

  // ── Draw Master 3800 × 2400 Sheet Frame, Parts List, General Notes & Title Block ──
  function drawSheetFurniture(t) {
    // Outer & inner technical borders + zone grid ticks
    line(rect(44, 44, 3756, 2356), { w: LW.out, closed: true, nib: false });
    line(rect(72, 72, 3728, 2328), { w: LW.thin, closed: true, nib: false });
    for (let i = 1; i < 8; i++) {
      const gx = 72 + i * (3656 / 8), gy = 72 + i * (2256 / 8);
      line([[gx, 44], [gx, 72]], { w: LW.hair, nib: false });
      line([[gx, 2328], [gx, 2356]], { w: LW.hair, nib: false });
      line([[44, gy], [72, gy]], { w: LW.hair, nib: false });
      line([[3728, gy], [3756, gy]], { w: LW.hair, nib: false });
    }

    // Master Sheet Header
    text('BẢN VẼ CƠ KHÍ QUY TRÌNH AI VĂN PHÒNG  —  HỆ THỐNG PCTPR CHUẨN HÓA', 120, 142, { size: 34, weight: 800, font: TECH, nib: false });
    line([[120, 162], [2660, 162]], { w: LW.det, nib: false });

    // Right Column: PARTS & AI ENGINE SCHEDULE (x: 2740..3690, y: 120..920)
    const tx0 = 2740, tx1 = 3690;
    solid(rect(tx0, 120, tx1, 900), { w: LW.out, nib: false });
    text('BẢNG KÊ CẤU PHẦN HỆ THỐNG (PARTS LIST)', tx0 + 24, 168, { size: 22, weight: 700, font: MONO, nib: false });
    line([[tx0, 188], [tx1, 188]], { w: LW.det, nib: false });
    const parts = [
      ['01', 'BẢNG TÍNH ĐỘNG', 'TỰ ĐỘNG 0.6S'],
      ['02', 'DASHBOARD KPI', 'HIỆU SUẤT 2.8×'],
      ['03', 'CHECKLIST NGHIỆM THU', '12/12 ĐẠT'],
      ['04', 'CHATGPT ENGINE', 'LẬP KẾ HOẠCH'],
      ['05', 'CLAUDE ENGINE', 'PHÂN TÍCH TÀI LIỆU'],
      ['06', 'GEMINI ENGINE', 'NGHIÊN CỨU ĐA NGUỒN'],
      ['07', 'GPTS / GEMS BOT', 'HỌP · LỖI · TUẦN'],
      ['08', 'TẢI GIẤY TỜ SAU AI', '100% → 40%'],
    ];
    parts.forEach(([no, nm, st], idx) => {
      const ry = 242 + idx * 78;
      line([[tx0, ry + 22], [tx1, ry + 22]], { w: LW.hair, nib: false });
      text(no, tx0 + 24, ry, { size: 20, weight: 700, font: MONO, nib: false });
      text(nm, tx0 + 95, ry, { size: 20, weight: 700, font: TECH, nib: false });
      text(st, tx1 - 24, ry, { size: 19, weight: 600, font: MONO, align: 'right', nib: false });
    });

    // GENERAL NOTES Column (`STYLE.md` §4: accumulates voiceover notes onto the sheet!)
    solid(rect(tx0, 940, tx1, 1520), { w: LW.det, nib: false });
    text('GHI CHÚ KỸ THUẬT (GENERAL NOTES)', tx0 + 24, 988, { size: 21, weight: 700, font: MONO, nib: false });
    line([[tx0, 1008], [tx1, 1008]], { w: LW.thin, nib: false });
    const gnotes = [
      '1. LOẠI BỎ PROMPT NGẮN & SỬA TAY LẶP LẠI.',
      '2. ÁP DỤNG KHUNG CHUẨN P-C-T-P-R TOÀN TEAM.',
      '3. TỰ ĐỘNG TÓM TẮT BIÊN BẢN HỌP TRONG 0.8S.',
      '4. ĐỐI SOÁT SỐ LIỆU BẰNG CHECKLIST NGHIỆM THU.',
      '5. GIẢM TẢI TỪ 100% XUỐNG CÒN 40% KHỐI LƯỢNG.',
      '6. NHÂN SỰ TẬP TRUNG VÀO CÔNG VIỆC GIÁ TRỊ CAO.',
    ];
    gnotes.forEach((gn, gi) => {
      if (t >= gi * 8.0) {
        text(gn, tx0 + 24, 1062 + gi * 68, { size: 19, weight: 600, font: TECH, u: seg(t, gi * 8.0, gi * 8.0 + 0.8), nib: false });
      }
    });

    // TITLE BLOCK & FINAL SPECIFICATION (x: 2440..3690, y: 1560..2290)
    const bx0 = 2440, bx1 = 3690, by0 = 1560, by1 = 2290;
    solid(rect(bx0, by0, bx1, by1), { w: LW.out, nib: false });
    line([[bx0, by0 + 88], [bx1, by0 + 88]], { w: LW.det, nib: false });
    line([[bx0, by0 + 380], [bx1, by0 + 380]], { w: LW.det, nib: false });
    text('KHUNG PHÊ DUYỆT & KẾT QUẢ THỰC TẾ  ·  DWG NO. AI-PCTPR-05', bx0 + 28, by0 + 54, { size: 22, weight: 700, font: MONO, nib: false });

    // Final Line 1 inside Title Block (54.0s+) + Pitted RED RUBBER STAMP on `fxC` Blue channel!
    if (t >= 53.95) {
      const u1 = eo(seg(t, 53.98, 54.60));
      text('Thời gian xử lý giấy tờ giảm thực tế:', bx0 + 36, by0 + 158, { size: 34, weight: 700, font: TECH, u: u1 });
      text('50–60%.', bx0 + 36, by0 + 292, { size: 112, weight: 800, font: TECH, u: u1 });

      // Red Rubber Stamp in `fxC` blue channel (`rgb(0,0,255)` -> shader renders pitted red stamp ink!)
      const stScale = back(seg(t, 54.02, 54.28), 1.35);
      const [sx, sy] = S(bx1 - 310, by0 + 235);
      f.save();
      f.setTransform(1, 0, 0, 1, 0, 0);
      f.translate(sx, sy);
      f.rotate(-0.14);
      f.scale(stScale * cam.z, stScale * cam.z);
      f.strokeStyle = 'rgb(0,0,255)';
      f.fillStyle = 'rgb(0,0,255)';
      f.lineWidth = 10;
      f.strokeRect(-235, -86, 470, 172);
      f.lineWidth = 4;
      f.strokeRect(-221, -72, 442, 144);
      f.font = `800 42px ${MONO}`;
      f.textAlign = 'center'; f.textBaseline = 'middle';
      f.fillText('ĐÃ NGHIỆM THU', 0, -22);
      f.font = `800 34px ${TECH}`;
      f.fillText('GIẢM 50–60%', 0, 32);
      f.restore();
    } else {
      text('TRẠNG THÁI: ĐANG VẬN HÀNH KIỂM ĐỊNH...', bx0 + 36, by0 + 235, { size: 28, weight: 700, font: MONO, nib: false });
    }

    // Final Line 2 CTA written with glowing drafting nib inside lower Title Block (56.95s+)
    if (t >= 56.92) {
      const u2a = seg(t, 56.95, 57.65);
      const u2b = seg(t, 57.55, 58.35);
      text('BƯỚC TIẾP THEO CHO ĐỘI NGŨ CỦA BẠN:', bx0 + 36, by0 + 444, { size: 21, weight: 700, font: MONO, u: u2a });
      text('Muốn dùng AI bài bản từ System Prompt', bx0 + 36, by0 + 528, { size: 42, weight: 800, font: TECH, u: u2a });
      text('đến kiểm chứng chất lượng?', bx0 + 36, by0 + 598, { size: 46, weight: 800, font: TECH, u: u2b });
      line([[bx0 + 36, by0 + 622], [bx0 + 690, by0 + 622]], { w: LW.out, u: seg(t, 58.1, 58.6) });
      text('REV 2.0  ·  SYSTEM PROMPT  →  PCTPR  →  GPTS/GEMS  →  QA CHECKLIST', bx0 + 36, by0 + 676, { size: 19, weight: 600, font: MONO, nib: false });
    }
  }

  // ── ZONE FIG. 1 (x: 120..1360, y: 210..1280): Chaos Hopper, Bypass Valve & Broken 4-Gear Chain ──
  function drawFig1ChaosAndLoop(t) {
    const uDraw = eo(seg(t, 0.2, 1.1));
    const q1Dim = t >= 4.85 ? 0.35 : 1.0;
    // Question 1 Blueprint Header over Fig. 1
    text('FIG. 1  —  HIỆN TRẠNG QUÁ TẢI BÁO CÁO & BIÊN BẢN HỌP', 160, 245, { size: 22, weight: 700, font: MONO, u: uDraw, v: q1Dim });
    text('Team mọi người đã áp dụng AI để giảm được một nửa thời gian', 160, 302, { size: 30, weight: 800, font: TECH, u: seg(t, 0.55, 1.35), v: q1Dim });
    text('làm báo cáo với biên bản họp chưa?', 160, 346, { size: 32, weight: 800, font: TECH, u: seg(t, 1.05, 1.75), v: q1Dim });

    // Jammed Paperwork Funnel / Hopper (x: 320..820, y: 420..800)
    line([[570, 390], [570, 830]], { w: LW.hair, dash: 'center', u: uDraw, nib: false });
    const hopper = [[320, 430], [820, 430], [690, 720], [690, 800], [450, 800], [450, 720]];
    solid(hopper, { w: LW.out, u: uDraw });
    hatch(rect(360, 455, 780, 525), { sp: 14, u: seg(t, 0.45, 1.2) });
    hatch(rect(405, 540, 735, 610), { sp: 14, ang: -Math.PI / 4, u: seg(t, 0.65, 1.4) });
    text('PHỄU GIẤY TỜ THỦ CÔNG', 570, 668, { size: 20, weight: 700, font: MONO, align: 'center', u: uDraw, nib: false });

    // 5 Numbered Part Balloons for stacked chaos items (cleanly inside inner sheet border!)
    const balls = [
      [[370, 470], [260, 445], 1, 'BÁO CÁO TUẦN'],
      [[760, 470], [885, 435], 2, 'BẢNG TÍNH #REF!'],
      [[410, 575], [260, 585], 3, 'BIÊN BẢN 18TR'],
      [[725, 575], [885, 565], 4, '47 EMAIL'],
      [[450, 755], [265, 765], 5, '19 TIN NHẮN'],
    ];
    balls.forEach(([fr, to, num, lbl], bi) => {
      // Clear right-side hopper callouts once Bypass Valve & Question 2 arrive at t >= 4.75s
      if (bi % 2 === 1 && t >= 4.75) return;
      const bu = seg(t, 0.4 + bi * 0.14, 0.95 + bi * 0.14);
      balloon(fr, to, num, { r: 21, u: bu });
      if (bu > 0.7) text(lbl, to[0] + (bi % 2 === 0 ? -28 : 28), to[1] + 6, { size: 15.5, weight: 700, font: MONO, align: bi % 2 === 0 ? 'right' : 'left', nib: false });
    });

    // Pressure Gauge pinning 100% overload
    drawGauge(570, 500, 42, -0.2 + Math.sin(Math.min(t, 15.8) * 14) * 0.08, '', '100%', uDraw);

    // Right of Hopper: Superficial Bypass Valve for Question 2 (x: 1030..1450, y: 420..810)
    if (t >= 4.75) {
      const u2 = seg(t, 4.85, 5.55);
      line([[690, 745], [1080, 745], [1080, 635]], { w: LW.det, u: u2 });
      solid(rect(1030, 560, 1430, 720), { w: LW.out, u: u2 });
      hatch(rect(1045, 575, 1415, 615), { sp: 16, u: u2 });
      text('VAN PHỤ: DỊCH THUẬT & CAPTION', 1230, 658, { size: 19, weight: 700, font: MONO, align: 'center', u: u2, nib: false });
      dim([1030, 720], [1430, 720], 46, 'CHỈ XỬ LÝ < 6% VIỆC PHỤ', { size: 18, font: MONO, u: seg(t, 5.2, 5.9) });

      text('Hay vẫn đang dùng AI', 1030, 448, { size: 36, weight: 800, font: TECH, u: seg(t, 4.95, 5.55) });
      text('chỉ để dịch thuật với viết caption?', 1030, 504, { size: 38, weight: 800, font: TECH, u: seg(t, 5.30, 5.95) });
    }

    // Bottom of Fig. 1 (y: 880..1260): 4-Gear Jammed Broken-Loop Train!
    if (t >= 8.45) {
      const fT = Math.min(t, 15.80);
      // Gears spin and then decelerate/wind down to a dead stop at 15.8s! (`STYLE.md` §5)
      const spinPhase = fT < 13.8 ? fT * 1.4 : 13.8 * 1.4 + (1 - Math.exp(-(fT - 13.8) * 1.8)) * 0.75;
      text('CƠ CẤU LỖI:  PROMPT NGẮN  →  KẾT QUẢ SÁO RỖNG  →  SỬA TAY LIÊN TỤC  →  MẤT THỜI GIAN', 180, 905, {
        size: 23, weight: 800, font: TECH, u: seg(fT, 8.55, 9.25)
      });

      const gears = [
        { cx: 300, cy: 1090, teeth: 14, m: 11, t0: 8.65, lbl: '01 PROMPT NGẮN', sub: '3 từ sơ sài' },
        { cx: 590, cy: 1090, teeth: 16, m: 11, t0: 10.15, lbl: '02 SÁO RỖNG', sub: 'Sai ngữ cảnh' },
        { cx: 895, cy: 1090, teeth: 15, m: 11, t0: 11.75, lbl: '03 SỬA TAY ×14', sub: 'Dò lại từ đầu' },
        { cx: 1210, cy: 1090, teeth: 18, m: 11, t0: 13.35, lbl: '04 MẤT THỜI GIAN', sub: 'Kẹt cứng 100%' },
      ];
      line([[180, 1090], [1350, 1090]], { w: LW.hair, dash: 'center', u: seg(fT, 8.5, 9.2), nib: false });
      gears.forEach((gr, idx) => {
        const gu = seg(fT, gr.t0, gr.t0 + 0.55);
        if (gu <= 0) return;
        const dir = idx % 2 === 0 ? 1 : -1;
        solid(gearPts(gr.cx, gr.cy, gr.teeth, gr.m, dir * spinPhase), { w: LW.out, u: gu });
        solid(circ(gr.cx, gr.cy, 22, 24), { w: LW.det, u: gu, nib: false });
        text(gr.lbl, gr.cx, gr.cy + 138, { size: 19, weight: 800, font: MONO, align: 'center', u: gu, nib: false });
        text(gr.sub, gr.cx, gr.cy + 166, { size: 18, weight: 500, font: TECH, align: 'center', u: gu, nib: false });
      });

      // Strike-through FIG. 1 once we move to FIG. 2 at 16.5s! (`STYLE.md` §8)
      if (t >= 16.5) {
        line([[160, 238], [880, 238]], { w: LW.out, nib: false });
      }
    }
  }

  // ── ZONE FIG. 2 (x: 1420..2680, y: 210..1290): Coherent 4-Module System + Oblique PCTPR Gear Train ──
  function drawFig2SystemAndPCTPR(t) {
    if (t < 16.48) return;
    const sT = t - 16.5;

    // Top Half (y: 220..760): 4 Precision Assemblies in strict drafting order
    const uSys = eo(seg(sT, 0.05, 0.85));
    text('FIG. 2  —  HỆ THỐNG LÀM VIỆC MẠCH LẠC & LUỒNG DỮ LIỆU ĐỒNG BỘ', 1460, 245, { size: 23, weight: 800, font: MONO, u: uSys });
    line([[1460, 505], [2640, 505]], { w: LW.hair, dash: 'center', u: uSys, nib: false });

    const boxes = [
      [1470, 320, 1990, 480, '01 · BẢNG TÍNH ĐỘNG', 'Tự động gom & tính toán 0.6s', 0.10],
      [2110, 320, 2630, 480, '02 · DASHBOARD KPI', 'Đo lường trực tiếp 2.8×', 0.30],
      [1470, 540, 1990, 700, '03 · CHECKLIST NGHIỆM THU', 'Kiểm lỗi công thức & biên bản', 0.50],
      [2110, 540, 2630, 700, '04 · LUỒNG DỮ LIỆU', 'Vận hành liên tục tự động', 0.70],
    ];
    boxes.forEach(([x0, y0, x1, y1, h1, h2, dly]) => {
      const bu = seg(sT, dly, dly + 0.55);
      solid(rect(x0, y0, x1, y1), { w: LW.out, th: 16, u: bu });
      hatch(rect(x0 + 14, y0 + 14, x1 - 14, y0 + 48), { sp: 12, u: bu });
      if (bu > 0.6) {
        text(h1, x0 + 22, y0 + 92, { size: 22, weight: 800, font: TECH, nib: false });
        text(h2, x0 + 22, y0 + 128, { size: 18, weight: 500, font: MONO, nib: false });
      }
    });
    // Animated flowing data conduit arrows between the 4 assemblies
    line([[1990, 400], [2110, 400]], { w: LW.det, dash: 'hidden', dashOff: -t * 48, u: uSys, nib: false });
    line([[2370, 480], [2370, 540]], { w: LW.det, dash: 'hidden', dashOff: -t * 48, u: uSys, nib: false });
    line([[2110, 620], [1990, 620]], { w: LW.det, dash: 'hidden', dashOff: -t * 48, u: uSys, nib: false });

    // Bottom Half (y: 800..1310): Oblique Extruded PCTPR + 4 Interlocking AI Mechanisms (25.0s+)
    if (t >= 25.0) {
      const pT = t - 25.0;
      const esc = escapement(t, 4);
      text('FIG. 2B  —  CƠ CẤU ĐA MÔ HÌNH PCTPR (PERSONA · CONTEXT · TASK · PROCESS · RESULT)', 1460, 815, {
        size: 21, weight: 800, font: MONO, u: seg(pT, 0.05, 0.65)
      });

      // 5 PCTPR Intake Valves along y = 855..915
      ['P: PERSONA', 'C: CONTEXT', 'T: TASK', 'P: PROCESS', 'R: RESULT'].forEach((tok, ti) => {
        const vx = 1470 + ti * 238;
        const vu = seg(pT, 0.15 + ti * 0.14, 0.55 + ti * 0.14);
        solid(rect(vx, 845, vx + 216, 905), { w: LW.det, th: 22, u: vu });
        if (vu > 0.6) text(tok, vx + 108, 883, { size: 17, weight: 700, font: MONO, align: 'center', nib: false });
      });

      // 4 Interlocking Clockwork AI Gears with cabinet oblique thickness (`th: 28`)!
      const aiGears = [
        { cx: 1590, cy: 1085, teeth: 14, t0: 1.2, nm: 'ChatGPT', rl: 'LẬP KẾ HOẠCH' },
        { cx: 1880, cy: 1085, teeth: 16, t0: 3.4, nm: 'Claude', rl: 'PHÂN TÍCH TÀI LIỆU' },
        { cx: 2180, cy: 1085, teeth: 14, t0: 6.1, nm: 'Gemini', rl: 'NGHIÊN CỨU' },
        { cx: 2480, cy: 1085, teeth: 16, t0: 8.6, nm: 'GPTs / Gems', rl: 'HỌP · LỖI · TUẦN' },
      ];
      line([[1460, 1085], [2640, 1085]], { w: LW.hair, dash: 'center', nib: false });
      aiGears.forEach((ag, idx) => {
        const gu = seg(pT, ag.t0 - 0.6, ag.t0);
        if (gu <= 0) return;
        const dir = idx % 2 === 0 ? 1 : -1;
        solid(gearPts(ag.cx, ag.cy, ag.teeth, 10.5, dir * esc * 0.9), { w: LW.out, th: 26, u: gu });
        solid(circ(ag.cx, ag.cy, 24, 24), { w: LW.det, u: gu, nib: false });
        text(ag.nm, ag.cx, ag.cy + 138, { size: 24, weight: 800, font: TECH, align: 'center', u: gu, nib: false });
        text(ag.rl, ag.cx, ag.cy + 166, { size: 16, weight: 700, font: MONO, align: 'center', u: gu, nib: false });
      });
    }
  }

  // ── ZONE FIG. 3 (x: 160..2380, y: 1360..2260): Live Dimension 100%->40% + 3 QA Dials + Clean Elevation ──
  function drawFig3WorkloadAndWorkspace(t) {
    if (t < 38.45) return;
    const sT = t - 38.5;

    // Left Sub-Figure (x: 180..1280, y: 1420..2200): Paperwork Load Piston + Live Dimension Arrows (100% -> 40%)
    const u3 = eo(seg(sT, 0.05, 0.65));
    text('FIG. 3  —  NÉN GIẢM KHỐI LƯỢNG CÔNG VIỆC (100% → 40%)', 200, 1435, { size: 23, weight: 800, font: MONO, u: u3 });

    const dropU = eio(seg(sT, 0.65, 2.75));
    const curPct = Math.round(lerp(100, 40, dropU));
    const fullH = 520, curH = fullH * (curPct / 100);
    const baseB = 2080, topY = baseB - curH;

    // Ghost phantom outline of original 100% load
    line(rect(340, baseB - fullH, 760, baseB), { w: LW.thin, dash: 'phantom', u: u3, nib: false });
    // Live compressing hatched load piston
    solid(rect(340, topY, 760, baseB), { w: LW.out, th: 24, u: u3 });
    hatch(rect(356, topY + 16, 744, baseB - 16), { sp: 14, u: u3 });
    text(`${curPct}%`, 550, (topY + baseB) / 2 + 28, { size: 86, weight: 800, font: TECH, align: 'center', nib: false });

    // Live Dimension Line tracking the shrinking piston height in real time! (`STYLE.md` §8 *Live annotations*)
    dim([760, topY], [760, baseB], -95, `TẢI THỰC TẾ = ${curPct}%`, { size: 24, font: MONO, u: u3 });
    text('ĐÃ CẮT GIẢM 60% THỜI GIAN LẶP LẠI', 200, 2165, { size: 24, weight: 700, font: TECH, u: seg(sT, 1.8, 2.6), nib: false });

    // Right Sub-Figure (x: 1360..2280, y: 1420..2200): 3 QA Inspection Gauges + Clean Workspace Elevation
    if (t >= 43.3) {
      const qT = t - 43.3;
      text('FIG. 3B  —  ĐỒNG HỒ NGHIỆM THU & KHÔNG GIAN GIÁ TRỊ CAO', 1360, 1435, {
        size: 20, weight: 800, font: MONO, u: seg(qT, 0.05, 0.55)
      });

      const dials = [
        [1490, 1660, 0.05, 'TÓM TẮT HỌP', '0.8 GIÂY'],
        [1810, 1660, 1.40, 'TỐC ĐỘ BÁO CÁO', 'NHANH 3.2×'],
        [2130, 1660, 2.80, 'CHECKLIST QA', '12/12 ĐẠT'],
      ];
      dials.forEach(([cx, cy, dly, topLbl, valLbl]) => {
        const du = seg(qT, dly, dly + 0.55);
        // Joy = needle snapping upright with back-ease overshoot (`STYLE.md` §5)!
        const ang = lerp(Math.PI * 0.85, -Math.PI / 2, back(seg(qT, dly + 0.15, dly + 0.70), 1.6));
        drawGauge(cx, cy, 98, ang, topLbl, valLbl, du);
      });

      // Symmetrical Clean Workspace Plan below the 3 QA dials (visible in 48.5s whole-sheet pull-back!)
      const wu = seg(t, 48.4, 49.3);
      if (wu > 0) {
        solid(rect(1380, 1875, 2360, 2210), { w: LW.out, th: 20, u: wu });
        line([[1870, 1875], [1870, 2210]], { w: LW.hair, dash: 'center', u: wu, nib: false });
        text('KHÔNG GIAN LÀM VIỆC GỌN GÀNG  —  TẬP TRUNG CÔNG VIỆC GIÁ TRỊ CAO', 1870, 1965, {
          size: 23, weight: 800, font: TECH, align: 'center', u: wu, nib: false
        });
        ['CHIẾN LƯỢC TĂNG TRƯỞNG', 'RA QUYẾT ĐỊNH NHANH', '0% TỒN ĐỌNG GIẤY TỜ'].forEach((pl, pi) => {
          const px = 1425 + pi * 305;
          solid(rect(px, 2015, px + 280, 2165), { w: LW.det, u: wu, nib: false });
          text(pl, px + 140, 2100, { size: 17, weight: 700, font: MONO, align: 'center', u: wu, nib: false });
        });
      }
    }
  }

  const noSub = new URLSearchParams(location.search).get('nosub') === '1';
  window.render = function (t) {
    t = clamp(t, 0, DUR);
    clear();
    const c = evalSheetCam(t);
    setCam(c);

    // Animate oblique depth `proj.k` during FIG. 2B & FIG. 3 (`STYLE.md` §6 & §8: flat plan turns and gains thickness!)
    proj.k = t < 25.0 ? 0 : t < 48.5 ? 0.34 * eio(seg(t, 25.2, 26.8)) : 0.20;

    drawSheetFurniture(t);
    drawFig1ChaosAndLoop(t);
    drawFig2SystemAndPCTPR(t);
    drawFig3WorkloadAndWorkspace(t);
    nibs(0.95);

    if (!noSub) {
      const cue = VO.find(q => t >= q.c0 && t < q.c1);
      if (cue && !['c00', 'c01', 'c09', 'c10'].includes(cue.id)) {
        const a = Math.min(seg(t, cue.c0, cue.c0 + 0.16), 1 - seg(t, cue.c1 - 0.16, cue.c1));
        drawBlueprintNote(cue.num, cue.sub, a, false);
      }
    }

    // Paper unrolls across the dark drafting table during the opening 0.6s!
    const rollX = t < 0.65 ? lerp(280, SHEET[0] + 200, eo(t / 0.65)) : 1e6;
    compositePaper(inkC, fxC, ovC, {
      sheet: SHEET,
      cam: c,
      seed: 19,
      desk: 1,
      sheetA: 1,
      fade: 0,
      roll: [rollX, 58],
    });
  };

  window.TEXTS = function (t) {
    const out = [];
    if (t >= 1.1 && t < 4.7) out.push({ id: 'q1', text: 'Team mọi người đã áp dụng AI để giảm được một nửa thời gian làm báo cáo với biên bản họp chưa?', x0: 120, y0: 80, x1: 1800, y1: 360 });
    if (t >= 5.3 && t < 8.4) out.push({ id: 'q2', text: 'Hay vẫn đang dùng AI chỉ để dịch thuật với viết caption?', x0: 500, y0: 180, x1: 1750, y1: 420 });
    if (t >= 9.0 && t < 16.4) out.push({ id: 'lp', text: 'PROMPT NGẮN → KẾT QUẢ SÁO RỖNG → SỬA TAY LIÊN TỤC → MẤT THỜI GIAN', x0: 120, y0: 200, x1: 1800, y1: 420 });
    if (t >= 16.8 && t < 24.9) out.push({ id: 'sys', text: 'HỆ THỐNG LÀM VIỆC MẠCH LẠC', x0: 200, y0: 100, x1: 1700, y1: 320 });
    if (t >= 25.6 && t < 38.4) out.push({ id: 'pct', text: 'CƠ CẤU ĐA MÔ HÌNH PCTPR', x0: 200, y0: 120, x1: 1700, y1: 320 });
    if (t >= 39.0 && t < 48.4) out.push({ id: 'wl', text: '40%', x0: 200, y0: 200, x1: 1600, y1: 800 });
    if (t >= 49.3 && t < 53.8) out.push({ id: 'cln', text: 'KHÔNG GIAN LÀM VIỆC GỌN GÀNG', x0: 200, y0: 300, x1: 1700, y1: 900 });
    if (t >= 54.2 && t <= 60.0) out.push({ id: 'fin', text: '50–60%', x0: 200, y0: 150, x1: 1750, y1: 950 });
    return out;
  };
}
