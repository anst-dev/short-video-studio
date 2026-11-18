// film.js — «PCTPR: Trở lại làm chủ thời gian» · dark-keynote · 1080x1920 · 60s · 24fps
// Timeline locked to 120 BPM grid (beat 0.5s, bar 2s). Shared VO: master_vo_v2 (OmniVoice, Whisper-verified).
import * as E from './engine.js';
const { W, H, PAL } = E;
export const DUR = 60.0;
export const BOIL = { step: 0 };

// ── shared VO cues (verbatim from master_vo_v2/vo_timeline.json) ──
const VO = [
  { id: 'c00', t0: 0.6, t1: 4.463, sub: 'Team mọi người đã áp dụng AI để giảm được một nửa thời gian làm báo cáo với biên bản họp chưa?', hero: true },
  { id: 'c01', t0: 5.2, t1: 7.883, sub: 'Hay vẫn đang dùng AI chỉ để dịch thuật với viết caption?', hero: true },
  { id: 'c02', t0: 8.8, t1: 13.116, sub: 'Prompt ngắn → kết quả sáo rỗng → sửa tay liên tục → mất thời gian.' },
  { id: 'c03', t0: 16.8, t1: 22.817, sub: 'Biến hỗn loạn thành hệ thống mạch lạc: bảng tính động, dashboard KPI, checklist và luồng dữ liệu chuyển động.' },
  { id: 'c04', t0: 25.5, t1: 28.804, sub: 'Quy trình mới PCTPR: ChatGPT lập kế hoạch → Claude phân tích tài liệu.' },
  { id: 'c05', t0: 31.2, t1: 36.595, sub: 'Gemini hỗ trợ nghiên cứu → GPTs/Gems tóm tắt họp, kiểm tra lỗi dữ liệu & lập kế hoạch tuần.' },
  { id: 'c06', t0: 38.8, t1: 42.341, sub: 'Khối lượng công việc giảm từ 100% xuống còn 40%.', hero: true },
  { id: 'c07', t0: 43.4, t1: 47.856, sub: 'Biên bản họp tự động tóm tắt, báo cáo nhanh hơn, dữ liệu kiểm tra theo checklist nghiệm thu.' },
  { id: 'c08', t0: 48.8, t1: 52.998, sub: 'Không gian làm việc gọn gàng — nhân viên tập trung vào công việc giá trị cao thay vì giấy tờ.' },
  { id: 'c09', t0: 54.0, t1: 56.663, sub: 'Thời gian xử lý giấy tờ giảm thực tế 50-60%.', hero: true },
  { id: 'c10', t0: 57.05, t1: 59.607, sub: 'Muốn dùng AI bài bản từ System Prompt đến kiểm chứng chất lượng?', hero: true },
];
const TOAST_ON = new Set(['c02', 'c03', 'c04', 'c05', 'c07', 'c08']);
const toastWin = {}; VO.forEach(c => { if (TOAST_ON.has(c.id)) toastWin[c.id] = [c.t0 - 0.1, c.t1 + 0.62]; });

// ── deterministic event list (foley cues for mix.py) ──
export const EV = [];
const ev = (t, type, o = {}) => EV.push({ t: +t.toFixed(3), type, ...o });
// chaos spawn plops + stacking
for (let i = 0; i < 14; i++) ev(0.55 + 4.45 * Math.pow(i / 33, 1.35), 'plop', { v: 0.5, pan: (E.hash(i * 7.3) - 0.5) * 0.8 });
for (let k = 0; k < 7; k++) ev(2.0 + k * 0.5, 'thump', { v: 0.55 + 0.05 * k });
ev(2.4, 'whoosh', { d: 0.3 }); ev(5.15, 'whoosh', { d: 0.28 });
ev(6.8, 'glass', { pan: -0.5 }); ev(7.6, 'glass', { pan: 0.5 });
ev(8.6, 'whoosh', { d: 0.35 });
for (let k = 0; k < 8; k++) ev(8.95 + k * 0.1, 'key', { v: 0.7 });
ev(10.0, 'glitch', { v: 0.7 });
for (let k = 0; k < 6; k++) ev(10.3 + k * 0.48, 'scrib', { v: 0.55, pan: (k % 2 ? 0.4 : -0.4) });
ev(10.8, 'thump', { v: 0.5 }); ev(11.6, 'thump', { v: 0.55 }); ev(12.4, 'thump', { v: 0.6 });
for (let k = 0; k < 7; k++) ev(11.0 + k * 0.37, 'clock', { v: 0.5 });
ev(11.4, 'whoosh', { d: 0.2, v: 0.6 }); ev(12.2, 'whoosh', { d: 0.2, v: 0.6 });
ev(11.3, 'glitch', { v: 0.5 }); ev(12.5, 'glitch', { v: 0.6 });
ev(22.95, 'crt', { v: 0.8 });
// snap & system
[17.6, 17.66, 17.72, 17.78, 17.84, 17.9].forEach((t, i) => ev(t, 'tick', { v: 0.8, pan: (i - 2.5) * 0.2 }));
[18.0, 18.35, 18.7, 19.05, 19.4, 19.75].forEach((t, i) => ev(t, 'sweep', { d: 0.5, v: 0.5 }));
[19.7, 20.3, 20.9, 21.5].forEach(t => ev(t, 'tickgreen', { v: 0.7 }));
ev(21.8, 'ding', { v: 0.7 });
[20.4, 21.0, 21.6, 22.2].forEach(t => ev(t, 'grain', { v: 0.5 }));
// pipeline
[26.2, 27.6, 31.5, 33.5].forEach((t, i) => ev(t, 'sweepst', { d: 0.6, v: 0.6, pan: (i % 2 ? 0.3 : -0.3) }));
[34.2, 35.0, 35.8].forEach((t, i) => ev(t, 'chip', { v: 0.6, pan: (i - 1) * 0.4 }));
// number
[39.6, 40.0, 40.4].forEach(t => ev(t, 'grain', { v: 0.7 }));
ev(41.0, 'press', { v: 0.9 });
[41.5, 41.8, 42.1].forEach(t => ev(t, 'grain', { v: 0.8 }));
ev(42.35, 'press', { v: 0.5 });
// wins
[43.8, 45.2, 46.6].forEach(t => ev(t, 'whoosh', { d: 0.24, v: 0.7 }));
ev(44.8, 'ding', { v: 0.8 }); ev(46.8, 'ding', { v: 0.8 });
[47.0, 47.3, 47.6, 47.9].forEach((t, i) => ev(t, 'tickgreen', { v: 0.75, pan: (i - 1.5) * 0.25 }));
// put-away
for (let k = 0; k < 6; k++) ev(48.9 + k * 0.3, 'retick', { v: 0.4 });
ev(49.8, 'pop', { v: 0.7 }); ev(50.9, 'pop', { v: 0.7 }); ev(52.0, 'pop', { v: 0.7 });
ev(54.0, 'sweep', { d: 1.2, v: 0.7 });
ev(57.15, 'whoosh', { d: 0.26, v: 0.6 });
ev(57.8, 'blip', { v: 0.35 }); ev(58.6, 'blip', { v: 0.35 });
ev(59.5, 'settle', { v: 0.6 });

// ═══════════════ SCENE 1+2: CHAOS & QUESTIONS (0–8.6) ═══════════════
const CX = 540, CY = 950;
const ITEMS = (() => {
  const R = E.mulberry(1234);
  const list = [];
  const notifs = [
    ['Họp nhóm lúc 15:00', 'Phòng họp B — cả team', 4, '5'],
    ['Re: Báo cáo tuần', 'Sửa lại phần số liệu', 5, '12'],
    ['Cập nhật KPI quý', 'Dashboard chưa đồng bộ', 2, '3'],
    ['Biên bản họp 12/10', 'Chờ bạn duyệt gửi', 6, '7'],
    ['Hợp đồng cần duyệt', 'Khách hàng đang chờ', 1, '2'],
    ['Nhắc hạn chót', 'Báo cáo đóng trước 17:00', 3, '9'],
  ];
  const files = [
    ['Bao_cao_Q3_v7.docx', 'DOCX'], ['Bien_ban_hop_104.txt', 'TXT'], ['Ke_hoach_tuan.xlsx', 'XLS'],
    ['Tong_hop_du_lieu.csv', 'CSV'], ['Bao_cao_chi_phi.pdf', 'PDF'], ['Ghi_chu_hop.txt', 'TXT'],
    ['Slide_kinh_doanh.pptx', 'PPT'], ['Du_lieu_KPI.xlsx', 'XLS'], ['Phan_hoi_khach.docx', 'DOC'],
    ['Bao_cao_final_FINAL.docx', 'DOC'],
  ];
  const wins = [
    ['Bao_cao_Q3_v7.docx — Word', 5, 'note'], ['Du_lieu_KPI.xlsx — Sheets', 1, 'sheet'],
    ['Chat team — 47 tin mới', 0, 'chat'], ['Hộp thư — 12 chưa đọc', 4, 'inbox'],
  ];
  const N = 34;
  for (let i = 0; i < N; i++) {
    const t0 = 0.55 + 4.45 * Math.pow(i / 33, 1.35);
    let kind, data;
    if (i < 6) { kind = 'notif'; data = notifs[i]; }
    else if (i < 16) { kind = 'file'; data = files[i - 6]; }
    else if (i < 20) { kind = 'win'; data = wins[i - 16]; }
    else if (i < 23) { kind = 'badge'; data = [['GẤP!'], ['SỬA LẠI'], ['QUÁ HẠN']][i - 20]; }
    else { kind = 'file'; data = files[(i - 23) % files.length]; }
    // seeded slot: rings bursting outward, clamped to safe stage
    const ring = i / N, ang = R() * Math.PI * 2, rad = 130 + ring * 620 * (0.75 + R() * 0.5);
    let x = CX + Math.cos(ang) * rad * 1.05, y = CY + Math.sin(ang) * rad * 0.95;
    x = E.clamp(x, 110, 970); y = E.clamp(y, 350, 1640);
    list.push({ i, t0, kind, data, x, y, bow: (R() - 0.5) * 160, rot: (R() - 0.5) * 0.5, j: R() });
  }
  return list;
})();
function drawChaosItem(g, it, tt) {
  const p = E.seg(tt, it.t0, it.t0 + 0.28); if (p <= 0) return;
  const pose = E.flyPose({ x: CX, y: CY, rot: it.rot * 3, s: 0.4 }, { x: it.x, y: it.y, rot: it.rot, s: 1 }, p);
  const tremX = p >= 1 ? (E.hash(it.i * 13.1 + Math.floor(tt * 12) * 0.7) - 0.5) * 3 : 0;
  const tremY = p >= 1 ? (E.hash(it.i * 7.7 + Math.floor(tt * 12) * 1.3) - 0.5) * 3 : 0;
  const bow = Math.sin(p * Math.PI) * it.bow;
  const x = pose.x + bow * 0.4 + tremX, y = pose.y + bow * 0.2 + tremY;
  g.save(); g.translate(x, y); g.rotate(pose.rot * 0.5); g.globalAlpha = Math.min(1, p * 2);
  const [d0, d1] = it.data;
  if (it.kind === 'notif') E.notif(g, -150, -42, 300, 84, { app: it.data[2], title: d0, body: d1, bd: it.data[3], cheap: true });
  else if (it.kind === 'file') E.fileIcon(g, 0, 0, 1, { name: d0, ext: d1, cheap: true });
  else if (it.kind === 'win') { const r = E.windowBox(g, -180, -130, 360, 260, { title: d0, app: d1, cheap: true, bar: 34 }); E.windowContent(g, r, it.data[2], { seed: it.i, scroll: tt * 30, n: 5, unread: 2 }); }
  else E.badge(g, 0, 0, d0, 1.4);
  g.restore();
}
function heroCard(g, t, tIn, lines, label, o = {}) {
  const { y = 700, h = 470, px = 40 } = o;
  const p = E.back(E.seg(t, tIn, tIn + 0.25), 1.3);
  if (p <= 0) return;
  const s = 0.7 + 0.3 * p;
  g.save(); g.globalAlpha = p;
  E.glow(g, CX, y + h / 2, 640, PAL.accent, 0.05 * p);
  g.translate(CX, y + h / 2); g.scale(s, s); g.translate(-CX, -(y + h / 2));
  E.panel(g, 64, y, 952, h, { r: 22, fill: PAL.surf2 });
  g.textAlign = 'center';
  g.fillStyle = PAL.mute; g.font = E.font(19, 600, 'mono');
  if (g.letterSpacing !== undefined) g.letterSpacing = '3px';
  g.fillText(label, CX, y + 64);
  if (g.letterSpacing !== undefined) g.letterSpacing = '0px';
  g.fillStyle = PAL.text; g.font = E.font(px, 600);
  const lh = px * 1.34, y0 = y + h / 2 - (lines.length - 1) * lh / 2 + 8;
  lines.forEach((s2, i) => g.fillText(s2, CX, y0 + i * lh));
  g.fillStyle = PAL.accent; g.shadowColor = E.rgba(PAL.accent, 0.6); g.shadowBlur = 16;
  E.rr(g, CX - 60, y + h - 46, 120, 4, 2); g.fill(); g.shadowColor = 'transparent';
  g.restore();
}
const wrapN = (text, maxChars) => {
  const words = text.split(' '); const lines = []; let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length <= maxChars || !cur) cur = (cur + ' ' + w).trim();
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  // rebalance: avoid a lonely last line
  if (lines.length >= 2 && lines[lines.length - 1].length < maxChars * 0.3) {
    const last = lines.pop(); const prevWords = lines[lines.length - 1].split(' ');
    if (prevWords.length > 2) { const mv = prevWords.pop(); lines[lines.length - 1] = prevWords.join(' '); lines.push(mv + ' ' + last); }
  }
  return lines;
};

function sceneQuestions(g, t) {
  // generated accumulation keeps running underneath (log-space pull-back camera)
  const zoomS = Math.exp(E.lerp(Math.log(1.32), Math.log(0.95), E.seg(t, 0, 8.45)));
  const wob = Math.sin(t * 0.9) * 0.008 * (t < 8.4 ? 1 : 0);
  E.withCam(g, { x: CX, y: 980, s: zoomS, rot: wob }, () => {
    for (const it of ITEMS) drawChaosItem(g, it, Math.min(t, 8.45));
  });
  const dim = E.seg(t, 2.35, 2.6);
  if (dim > 0) { g.fillStyle = `rgba(6,7,10,${0.62 * dim})`; g.fillRect(0, 0, W, H); }
  // Q1 hero 2.4–5.0 → collapses into point; Q2 5.15–8.45
  const q1 = wrapN(VO[0].sub, 38);
  const q1p = E.seg(t, 2.4, 5.0);
  if (q1p > 0) {
    if (t < 5.0) heroCard(g, t, 2.4, q1, 'CÂU HỎI CHO TOÀN TEAM', { y: 690, h: 500, px: 40 });
    else { const q = E.seg(t, 5.0, 5.22); if (q < 1) heroCardOut(g, 690, 500, q); }
  }
  const q2 = wrapN(VO[1].sub, 40);
  if (t >= 5.15 && t < 8.45) heroCard(g, t, 5.15, q2, 'KIỂM TRA THỰC TẾ', { y: 740, h: 430, px: 40 });
  else if (t >= 8.45) { const q = E.seg(t, 8.45, 8.62); if (q < 1) heroCardOut(g, 740, 430, q); }
  // two joke chips pop (problem colour — only while the problem exists)
  const chips = [
    ['chỉ để dịch thuật?', 6.8, 300],
    ['chỉ để viết caption?', 7.6, -300],
  ];
  chips.forEach(([label, t0, dx], k) => {
    const p = E.back(E.seg(t, t0, t0 + 0.25), 1.4);
    if (p <= 0 || t > 8.45) return;
    const x = CX + dx, y = 1290 + k * 30;
    g.save(); g.globalAlpha = p; g.translate(x, y); g.scale(0.8 + 0.2 * p, 0.8 + 0.2 * p); g.translate(-x, -y);
    g.font = E.font(28, 600); const w = g.measureText(label).width + 96;
    E.panel(g, x - w / 2, y - 32, w, 64, { r: 32, fill: PAL.surf, cheap: true, stroke: E.rgba(PAL.red, 0.45) });
    // tiny vector glyphs: doc-with-arrows / speech bubble
    g.strokeStyle = PAL.red; g.lineWidth = 3; g.lineCap = 'round';
    if (k === 0) { g.strokeRect(x - w / 2 + 26, y - 14, 22, 28); g.beginPath(); g.moveTo(x - w / 2 + 54, y - 6); g.lineTo(x - w / 2 + 64, y); g.moveTo(x - w / 2 + 54, y + 8); g.lineTo(x - w / 2 + 64, y + 2); g.stroke(); }
    else { g.beginPath(); g.ellipse(x - w / 2 + 38, y, 15, 11, 0, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(x - w / 2 + 30, y + 9); g.lineTo(x - w / 2 + 26, y + 16); g.stroke(); }
    g.fillStyle = '#FFB4B6'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(label, x - w / 2 + 80, y + 1);
    g.restore();
  });
}
function heroCardOut(g, y, h, q) {
  if (q <= 0) return;
  g.save(); g.globalAlpha = 1 - q;
  g.translate(CX, y + h / 2); g.scale(Math.max(0.03, 1 - q), Math.max(0.03, 1 - E.ss(q) * 1.1)); g.translate(-CX, -(y + h / 2));
  g.fillStyle = PAL.surf2; E.rr(g, 64, y, 952, h, 22); g.fill();
  g.restore();
}

// ═══════════════ SCENE 3: FAILURE LOOP (8.6–13.3) ═══════════════
function sceneFailure(g, t) {
  const tf = Math.min(t, 13.3); // freeze: every internal clock stops at 13.3
  // camera push-in (gentle — panels must never clip)
  const camS = 1.0 + 0.1 * E.seg(tf, 8.6, 13.2);
  const gone = putAwayState(t);
  E.withCam(g, { x: CX, y: 960, s: camS }, () => {
    // prompt window
    const [px0, py0, pw0, ph0] = [64, 430, 952, 230];
    if (gone.win < 1) {
      g.save(); if (gone.win > 0) { g.translate(CX, py0 + ph0 / 2); g.scale(1 - gone.win, Math.max(0.02, 1 - E.ss(gone.win) * 1.15)); g.translate(-CX, -(py0 + ph0 / 2)); }
      const r = E.windowBox(g, px0, py0, pw0, ph0, { title: 'Trợ lý AI — nháp 7', app: 0, bar: 38 });
      g.fillStyle = PAL.text; g.font = E.font(30, 500); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      const typed = 'viết báo cáo tuần này giúp tôi';
      const n = Math.floor(E.seg(tf, 8.95, 9.75) * typed.length);
      const show = typed.slice(0, n);
      g.fillText(show, px0 + 28, py0 + 105);
      if (n < typed.length && Math.floor(tf * 2.4) % 2 === 0) E.caret(g, px0 + 34 + g.measureText(show).width, py0 + 95, 34, { on: 1 });
      else if (n >= typed.length) E.caret(g, px0 + 34 + g.measureText(show).width, py0 + 95, 34, { on: (Math.floor(tf * 2.4) % 2) === 0 ? 1 : 0.25 });
      g.fillStyle = PAL.mute; g.font = E.font(19, 500, 'mono'); g.fillText('prompt #7 — chỉ 6 từ', px0 + 28, py0 + 172);
      g.restore();
    }
    // result window
    const [rx0, ry0, rw0, rh0] = [64, 700, 952, 520];
    if (gone.result < 1) {
      g.save(); if (gone.result > 0) { g.translate(CX, ry0 + rh0 / 2); g.scale(Math.max(0.02, 1 - gone.result), Math.max(0.02, 1 - gone.result)); g.translate(-CX, -(ry0 + rh0 / 2)); }
      const r2 = E.windowBox(g, rx0, ry0, rw0, rh0, { title: 'Kết quả — bản nháp', app: 5, bar: 38 });
      const R = E.mulberry(41);
      for (let i = 0; i < 5; i++) {
        const yy = ry0 + 62 + i * 56;
        g.fillStyle = 'rgba(255,255,255,.07)';
        const wr = (rw0 - 80) * (0.5 + R() * 0.42);
        const retract = E.seg(gone.result, i / 5, (i + 1) / 5);
        g.fillRect(rx0 + 40, yy, Math.max(0, wr * (1 - retract)), 16);
      }
      // verdict label + red edit marks accumulate
      const marks = E.seg(tf, 10.2, 12.8);
      const nM = Math.floor(marks * 7.2);
      for (let m = 0; m < nM; m++) {
        const yy = ry0 + 70 + (m % 5) * 56, xx = rx0 + 50 + E.hash(m * 3.3) * (rw0 - 240);
        const len = 90 + E.hash(m * 7.1) * 200;
        g.save(); g.translate(xx + len / 2, yy + 8); g.rotate((E.hash(m * 1.7) - 0.5) * 0.2);
        g.strokeStyle = PAL.red; g.lineWidth = 4; g.lineCap = 'round'; g.globalAlpha = 0.9;
        const lp = E.seg(tf, 10.2 + m * 0.36, 10.42 + m * 0.36);
        g.beginPath(); g.moveTo(-len / 2, 0); g.lineTo(-len / 2 + len * lp, -2 + Math.sin(lp * 30) * 3); g.stroke();
        g.restore();
      }
      g.fillStyle = PAL.dim; g.font = E.font(22, 600); g.textAlign = 'left';
      g.fillText('Kết quả: sáo rỗng, chung chung, không số liệu thật.', rx0 + 40, ry0 + 440);
      g.fillStyle = PAL.mute; g.font = E.font(19, 500, 'mono');
      g.fillText('phải sửa tay toàn bộ — lần thứ 3', rx0 + 40, ry0 + 478);
      g.restore();
    }
    // clock strip
    const [kx0, ky0, kw0, kh0] = [64, 1260, 952, 150];
    if (gone.clock < 1) {
      g.save(); if (gone.clock > 0) { g.translate(CX, ky0 + kh0 / 2); g.scale(Math.max(0.02, 1 - gone.clock), 1 - E.ss(gone.clock) * 1.1); g.translate(-CX, -(ky0 + kh0 / 2)); }
      E.panel(g, kx0, ky0, kw0, kh0, { r: 18, cheap: true });
      const ccx = kx0 + 90, ccy = ky0 + kh0 / 2;
      g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 5;
      g.beginPath(); g.arc(ccx, ccy, 44, 0, Math.PI * 2); g.stroke();
      const spin = 2.1 * Math.pow(E.seg(tf, 11.0, 13.25), 2.2) * Math.PI * 2;
      g.strokeStyle = PAL.red; g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(ccx, ccy); g.lineTo(ccx + Math.cos(-Math.PI / 2 + spin) * 34, ccy + Math.sin(-Math.PI / 2 + spin) * 34); g.stroke();
      g.fillStyle = PAL.text; g.font = E.font(28, 600); g.textAlign = 'left'; g.textBaseline = 'middle';
      g.fillText('Sửa tay liên tục — càng làm càng mất thời gian.', kx0 + 170, ccy - 14);
      g.fillStyle = PAL.mute; g.font = E.font(19, 500, 'mono');
      g.fillText('THỜI GIAN TỐN: 3 GIỜ 40 PHÚT / TUẦN', kx0 + 170, ccy + 24);
      g.restore();
    }
    // red joke badges fling in
    const fb = [['+30 phút sửa', 10.8, 210, 640], ['lại sửa…', 11.6, 700, 940], ['lần 3 rồi!', 12.4, 820, 480]];
    fb.forEach(([label, t0, bx, by], k) => {
      const p = E.back(E.seg(tf, t0, t0 + 0.24), 1.5);
      if (p <= 0) return;
      g.save(); g.translate(bx, by); g.rotate((k - 1) * 0.12 + p * 0.1); g.scale(p, p);
      E.badge(g, 0, 0, label, 1.6); g.restore();
    });
    // half-second insert expanding from result edges (overload)
    [[11.4, rx0 + rw0, ry0 + 120, 1], [12.2, rx0 - 300, ry0 + 300, -1]].forEach(([t0, ix, iy, dir]) => {
      const p = E.seg(tf, t0, t0 + 0.5);
      if (p <= 0 || p >= 1) return;
      const wI = 280 * E.eo(p), hI = 150 * E.eo(p);
      g.save(); g.globalAlpha = 0.95 * Math.min(1, p * 3);
      E.panel(g, dir > 0 ? ix + 8 : ix, iy - hI / 2, wI, hI, { r: 14, cheap: true, fill: '#1A1E28' });
      g.fillStyle = 'rgba(255,120,124,.8)'; g.font = E.font(20, 600); g.textAlign = 'center';
      g.fillText(dir > 0 ? 'sửa tiếp…' : 'chưa xong!', (dir > 0 ? ix + 8 : ix) + wI / 2, iy + 6);
      g.restore();
    });
  });
}
// put-away order: [badges implicit via tf freeze & exit], clock folds, marks retract, rows collapse, prompt squash
function putAwayState(t) {
  // returns per-part exit progress 0..1 during 14.2–16.4
  const st = { marks: 0, clock: 0, result: 0, win: 0 };
  if (t < 14.2) return st;
  st.clock = E.seg(t, 14.2, 14.7);
  st.marks = E.seg(t, 14.7, 15.2);
  st.result = E.seg(t, 15.2, 15.8);
  st.win = E.seg(t, 15.8, 16.4);
  return st;
}
function drawMarkRetract(gone) { /* marks retract handled inside sceneFailure via gone.marks */ }

// ═══════════════ SCENE 4: FREEZE → SNAP → SYSTEM (13.3–23.0) ═══════════════
const GRID = { x0: 64, y0: 460, tw: 460, th: 320, gx: 32, gy: 40, cols: 2, rows: 3 };
const TILE_TITLES = ['BẢNG TÍNH ĐỘNG', 'DASHBOARD KPI', 'CHECKLIST', 'SƠ ĐỒ QUY TRÌNH', 'BIÊN BẢN HỌP', 'BÁO CÁO TỰ ĐỘNG'];
const landT = [17.6, 17.66, 17.72, 17.78, 17.84, 17.9];
const revT = [18.0, 18.35, 18.7, 19.05, 19.4, 19.75];
const slotPos = i => [GRID.x0 + (i % 2) * (GRID.tw + GRID.gx), GRID.y0 + Math.floor(i / 2) * (GRID.th + GRID.gy)];
const exitTargets = (() => { const R = E.mulberry(99); return Array.from({ length: 28 }, () => ({ x: R() < 0.5 ? -320 : 1400, y: R() * 2100 - 100, bow: (R() - 0.5) * 300 })); })();

function flockCards(g, t) {
  // respawn condensed flock 16.8–17.6, then fly to slots (6) / off-screen (rest)
  const n = 22;
  for (let i = 0; i < n; i++) {
    const born = 16.85 + E.hash(i * 3.7) * 0.35;
    if (t < born) continue;
    const isTile = i < 6;
    const slot = isTile ? i : -1;
    const flyT = 17.6 + (isTile ? landT[i] - 17.6 : E.hash(i * 9.1) * 0.12);
    let x, y, rot = 0, s = 1;
    if (t < flyT) {
      const th = (t - 16.8) * 5.2 + E.hash(i * 5.3) * Math.PI * 2;
      const rr2 = 170 - (t - 16.8) * 55;
      x = CX + Math.cos(th) * rr2 * 1.15; y = 950 + Math.sin(th) * rr2 * 0.9;
      rot = Math.sin(th + E.hash(i) * 6) * 0.3;
      s = 0.42 + 0.1 * Math.sin(i * 2.3);
    } else {
      const p = E.seg(t, flyT, flyT + (isTile ? 0.34 : 0.5));
      if (isTile) {
        const [tx, ty] = slotPos(i);
        const pose = E.flyPose({ x: CX, y: 950, rot: 0.4, s: 0.42 }, { x: tx + GRID.tw / 2, y: ty + GRID.th / 2, rot: 0, s: 1 }, p, { over: 1.25 });
        x = pose.x; y = pose.y; rot = pose.rot; s = pose.s;
        drawTileAt(g, i, x, y, s, rot, t);
        continue;
      } else {
        const ext = exitTargets[i % exitTargets.length];
        const pose = E.flyPose({ x: CX, y: 950, rot: 0.3, s: 0.42 }, { x: ext.x, y: ext.y, rot: ext.bow * 0.004, s: 0.3 }, p, { over: 1.1 });
        x = pose.x; y = pose.y; rot = pose.rot; s = pose.s;
        if (p >= 1) continue;
      }
    }
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.globalAlpha = 0.95;
    g.fillStyle = '#1A1E28'; E.rr(g, -70, -46, 140, 92, 10); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1.5; E.rr(g, -70, -46, 140, 92, 10); g.stroke();
    for (let l = 0; l < 3; l++) { g.fillStyle = 'rgba(255,255,255,.10)'; g.fillRect(-52, -26 + l * 18, 100 - l * 26, 8); }
    g.restore();
  }
}
function tileCanvas(i, t) {
  const [c, g] = E.buf(`tile${i}`, GRID.tw, GRID.th);
  g.clearRect(0, 0, GRID.tw, GRID.th);
  E.panel(g, 0, 0, GRID.tw, GRID.th, { r: 18, fill: PAL.surf2, shadow: 0.9 });
  // title bar
  g.textAlign = 'left'; g.textBaseline = 'middle';
  g.fillStyle = PAL.dim; g.font = E.font(18, 600, 'mono');
  if (g.letterSpacing !== undefined) g.letterSpacing = '2px';
  g.fillText(TILE_TITLES[i], 24, 32);
  if (g.letterSpacing !== undefined) g.letterSpacing = '0px';
  g.fillStyle = PAL.line; g.fillRect(0, 58, GRID.tw, 1);
  const cy0 = 58;
  if (i === 0) { // sheet
    const cw = 54, ch = 40, cols = 8, rows = 6;
    const fillP = E.seg(t, 18.0, 21.6);
    g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 1;
    for (let a = 0; a <= cols; a++) { g.beginPath(); g.moveTo(24 + a * cw, cy0 + 16); g.lineTo(24 + a * cw, cy0 + 16 + rows * ch); g.stroke(); }
    for (let b = 0; b <= rows; b++) { g.beginPath(); g.moveTo(24, cy0 + 16 + b * ch); g.lineTo(24 + cols * cw, cy0 + 16 + b * ch); g.stroke(); }
    g.fillStyle = PAL.dim; g.font = E.font(13, 500, 'mono'); g.textAlign = 'center';
    const R = E.mulberry(i * 17 + 3);
    for (let b = 0; b < rows; b++) for (let a = 0; a < cols; a++) {
      const idx = b * cols + a, tot = cols * rows;
      if (idx / tot < fillP) g.fillText(String(Math.floor(R() * 900 + 100)), 24 + a * cw + cw / 2, cy0 + 16 + b * ch + ch / 2 + 1);
    }
    const hi = (Math.floor(t * 2) % rows);
    g.fillStyle = E.rgba(PAL.accent, 0.16); g.fillRect(24, cy0 + 16 + hi * ch, cols * cw, ch);
    g.fillStyle = PAL.accent; g.fillRect(24, cy0 + 16 + hi * ch, 4, ch);
  } else if (i === 1) { // KPI bars
    const vals = [0.62, 0.78, 0.41];
    const grow = E.seg(t, 18.35, 20.4);
    vals.forEach((v, k) => {
      const bx = 28, by = cy0 + 30 + k * 76, bw2 = GRID.tw - 120;
      g.fillStyle = 'rgba(255,255,255,.06)'; E.rr(g, bx, by, bw2, 34, 17); g.fill();
      const vv = v * E.eo(E.clamp(grow * 3 - k * 0.6));
      g.fillStyle = k === 1 ? PAL.accent : '#3D475C';
      if (k === 1) { g.shadowColor = E.rgba(PAL.accent, 0.5); g.shadowBlur = 12; }
      E.rr(g, bx, by, Math.max(6, bw2 * vv), 34, 17); g.fill(); g.shadowColor = 'transparent';
      g.fillStyle = PAL.text; g.font = E.font(17, 600, 'mono'); g.textAlign = 'left'; g.textBaseline = 'middle';
      g.fillText(['62%', '78%', '41%'][k], bx + bw2 + 14, by + 17);
    });
    g.fillStyle = PAL.mute; g.font = E.font(15, 500, 'mono'); g.textAlign = 'left';
    g.fillText('KPI CẬP NHẬT TỰ ĐỘNG', 28, cy0 + 240);
  } else if (i === 2) { // checklist
    const rows = ['Số liệu khớp nguồn', 'Đúng mẫu quy định', 'Đủ chữ ký duyệt', 'Gửi đúng hạn'];
    rows.forEach((s, k) => {
      const yy = cy0 + 30 + k * 58;
      g.fillStyle = 'rgba(255,255,255,.05)'; E.rr(g, 24, yy, GRID.tw - 48, 44, 10); g.fill();
      const on = t > 19.7 + k * 0.6;
      g.strokeStyle = on ? PAL.accent : 'rgba(255,255,255,.18)'; g.lineWidth = 3; g.lineCap = 'round';
      g.strokeRect(36, yy + 10, 24, 24);
      if (on) { const tp = E.seg(t, 19.7 + k * 0.6, 19.88 + k * 0.6); g.beginPath(); g.moveTo(41, yy + 22); g.lineTo(41 + 7 * tp, yy + 29); g.lineTo(41 + 15 * tp, yy + 15 + (1 - tp) * 6); g.stroke(); }
      g.fillStyle = on ? PAL.text : PAL.mute; g.font = E.font(19, on ? 600 : 400); g.textAlign = 'left'; g.textBaseline = 'middle';
      g.fillText(s, 76, yy + 22);
    });
  } else if (i === 3) { // flow
    const nodes = [[70, cy0 + 90], [230, cy0 + 90], [230, cy0 + 210], [390, cy0 + 210]];
    g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 2;
    for (let a = 0; a < nodes.length - 1; a++) {
      const [x1, y1] = nodes[a], [x2, y2] = nodes[a + 1];
      const dp = E.seg(t, 19.05 + a * 0.3, 19.45 + a * 0.3);
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 + (x2 - x1) * dp, y1 + (y2 - y1) * dp); g.stroke();
    }
    nodes.forEach(([nx, ny], k) => {
      const on = t > 19.05 + k * 0.3 - 0.05;
      g.fillStyle = on ? '#262B38' : 'rgba(255,255,255,.05)';
      g.beginPath(); g.arc(nx, ny, 16, 0, Math.PI * 2); g.fill();
      g.strokeStyle = on ? E.rgba(PAL.accent, 0.8) : 'rgba(255,255,255,.15)'; g.lineWidth = 2; g.stroke();
    });
    // moving accent packets
    for (let pk = 0; pk < 2; pk++) {
      const u = ((t * 0.55 + pk * 0.5) % 1);
      const segI = Math.min(2, Math.floor(u * 3));
      const lu = u * 3 - segI;
      const [x1, y1] = nodes[segI], [x2, y2] = nodes[segI + 1];
      const px2 = x1 + (x2 - x1) * lu, py2 = y1 + (y2 - y1) * lu;
      E.glow(g, px2, py2, 26, PAL.accent, 0.5);
      g.fillStyle = PAL.accent; g.beginPath(); g.arc(px2, py2, 6, 0, Math.PI * 2); g.fill();
    }
  } else if (i === 4) { // minutes
    const R = E.mulberry(88);
    const messy = E.seg(t, 21.6, 21.9); // messy lines collapse out
    for (let l = 0; l < 5; l++) {
      const yy = cy0 + 26 + l * 34;
      const keep = 1 - E.seg(messy, l / 5, (l + 1) / 5);
      if (keep <= 0) continue;
      g.fillStyle = 'rgba(255,255,255,.09)';
      g.fillRect(24, yy, (GRID.tw - 48) * (0.55 + R() * 0.4) * keep, 12);
    }
    const neat = E.seg(t, 21.9, 22.5);
    for (let l = 0; l < 3; l++) {
      const yy = cy0 + 26 + l * 40;
      const lp = E.seg(neat, l / 3, (l + 1) / 3);
      if (lp <= 0) continue;
      g.fillStyle = 'rgba(185,243,90,.30)';
      g.fillRect(24, yy, (GRID.tw - 120) * lp, 12);
    }
    const chip = E.back(E.seg(t, 22.5, 22.75), 1.4);
    if (chip > 0) {
      g.save(); g.translate(GRID.tw - 130, cy0 + 170); g.scale(chip, chip);
      g.fillStyle = E.rgba(PAL.accent, 0.14); E.rr(g, -86, -20, 172, 40, 20); g.fill();
      g.strokeStyle = E.rgba(PAL.accent, 0.6); g.lineWidth = 1.5; E.rr(g, -86, -20, 172, 40, 20); g.stroke();
      g.fillStyle = PAL.accent; g.font = E.font(17, 700, 'mono'); g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('ĐÃ TÓM TẮT', 0, 1); g.restore();
    }
  } else { // report progress
    const p = E.seg(t, 19.75, 22.4);
    g.fillStyle = 'rgba(255,255,255,.06)'; E.rr(g, 24, cy0 + 40, GRID.tw - 48, 46, 23); g.fill();
    g.fillStyle = PAL.accent; g.shadowColor = E.rgba(PAL.accent, 0.45); g.shadowBlur = 14;
    E.rr(g, 24, cy0 + 40, Math.max(8, (GRID.tw - 48) * p), 46, 23); g.fill(); g.shadowColor = 'transparent';
    g.fillStyle = PAL.text; g.font = E.font(26, 600, 'mono'); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(`${Math.round(p * 100)}%`, CX - GRID.x0 - (i % 2) * 0, cy0 + 130);
    g.fillStyle = PAL.mute; g.font = E.font(15, 500, 'mono'); g.textAlign = 'left';
    g.fillText('TỰ ĐỘNG DỰNG TỪ DỮ LIỆU CHUẨN', 24, cy0 + 200);
  }
  return c;
}
function drawTileAt(g, i, x, y, s, rot, t) {
  const rp = E.seg(t, revT[i], revT[i] + 0.5);
  const src = tileCanvas(i, t);
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.translate(-GRID.tw / 2, -GRID.th / 2);
  E.lightReveal(g, src, 0, 0, GRID.tw, GRID.th, rp, { base: 0.3, glint: 0.35 });
  g.restore();
}
function sceneSystem(g, t) {
  // whip pull-out camera
  const camS = 1.22 - 0.22 * E.eo(E.seg(t, 17.6, 18.15));
  E.withCam(g, { x: CX, y: 980, s: camS }, () => { flockCards(g, t); });
  // section label while tiles assemble
  if (t > 18.2 && t < 22.8) {
    const a = Math.min(E.seg(t, 18.2, 18.5), 1 - E.seg(t, 22.5, 22.8));
    g.save(); g.globalAlpha = a;
    g.fillStyle = PAL.mute; g.font = E.font(20, 600, 'mono'); g.textAlign = 'center';
    if (g.letterSpacing !== undefined) g.letterSpacing = '4px';
    g.fillText('MỌI THỨ VÀO ĐÚNG LƯỚI CỦA NÓ', CX, 370);
    if (g.letterSpacing !== undefined) g.letterSpacing = '0px';
    g.restore();
  }
}
// CRT collapse: 23.0–23.45 grid squashes to centre point → single dim tile breathes (23.8–25.4)
function sceneCollapse(g, t) {
  const q = E.seg(t, 23.0, 23.45);
  if (q < 1) {
    E.withCam(g, { x: CX, y: 980, s: 1 }, () => {
      g.save(); g.translate(CX, 980); g.scale(Math.max(0.02, 1 - E.ss(q) * 1.06), Math.max(0.02, 1 - E.back(q, 1.6) * 1.08)); g.translate(-CX, -980);
      for (let i = 0; i < 6; i++) { const [tx, ty] = slotPos(i); g.drawImage(tileCanvas(i, 23.0), tx, ty); }
      g.restore();
    });
  } else {
    const breathe = 1 + 0.012 * Math.sin((t - 23.45) * 2.4);
    const src = tileCanvas(5, 23.0);
    g.save(); g.globalAlpha = 0.5;
    g.translate(CX, 880); g.scale(breathe * 0.8, breathe * 0.8); g.translate(-GRID.tw / 2, -GRID.th / 2);
    g.drawImage(src, 0, 0); g.restore();
    if (t > 23.8) {
      g.save(); g.globalAlpha = Math.min(1, (t - 23.8) * 2);
      g.fillStyle = PAL.mute; g.font = E.font(18, 600, 'mono'); g.textAlign = 'center';
      if (g.letterSpacing !== undefined) g.letterSpacing = '4px';
      g.fillText('MỘT QUY TRÌNH DUY NHẤT', CX, 1130);
      if (g.letterSpacing !== undefined) g.letterSpacing = '0px';
      g.restore();
    }
  }
}

// ═══════════════ SCENE 6: PCTPR PIPELINE (25.5–37.8) ═══════════════
const ST = [
  { name: 'CHATGPT', role: 'Lập kế hoạch tổng thể', light: 26.2, glyph: 'spark' },
  { name: 'CLAUDE', role: 'Phân tích tài liệu sâu', light: 27.6, glyph: 'aster' },
  { name: 'GEMINI', role: 'Hỗ trợ nghiên cứu', light: 31.5, glyph: 'gem' },
  { name: 'GPTS · GEMS', role: 'Trợ lý chuyên biệt', light: 33.5, glyph: 'grid3' },
];
const CHIPS = ['Tóm tắt họp', 'Kiểm tra lỗi dữ liệu', 'Kế hoạch tuần'];
const chipT = [34.2, 35.0, 35.8];
function stationCanvas(i, t) {
  const hh = i === 3 ? 300 : 220;
  const [c, g] = E.buf(`st${i}`, 952, hh);
  g.clearRect(0, 0, 952, hh);
  E.panel(g, 0, 0, 952, hh, { r: 20, fill: PAL.surf2, shadow: 0.9 });
  // glyph
  const gx = 64, gy = hh / 2 - (i === 3 ? 24 : 0);
  g.save(); g.translate(gx, gy); g.strokeStyle = PAL.dim; g.fillStyle = PAL.dim; g.lineWidth = 3.4; g.lineCap = 'round';
  if (ST[i].glyph === 'spark') { g.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, r = k % 2 ? 9 : 24; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.stroke(); }
  else if (ST[i].glyph === 'aster') { for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3; g.beginPath(); g.moveTo(-Math.cos(a) * 22, -Math.sin(a) * 22); g.lineTo(Math.cos(a) * 22, Math.sin(a) * 22); g.stroke(); } }
  else if (ST[i].glyph === 'gem') { g.beginPath(); g.moveTo(0, -26); g.lineTo(24, 0); g.lineTo(0, 26); g.lineTo(-24, 0); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(-24, 0); g.lineTo(24, 0); g.stroke(); }
  else { for (let a = 0; a < 3; a++) { g.strokeRect(-30 + (a % 2) * 34, -14 + Math.floor(a / 2) * 30, 26, 22); } }
  g.restore();
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.fillStyle = PAL.text; g.font = E.font(34, 600, 'mono');
  g.fillText(ST[i].name, 128, i === 3 ? gy + 6 : gy + 10);
  g.fillStyle = PAL.dim; g.font = E.font(29, 500);
  g.fillText(ST[i].role, 128, i === 3 ? gy + 52 : gy + 58);
  if (i === 3) {
    chipT.forEach((ct, k) => {
      const p = E.back(E.seg(t, ct, ct + 0.24), 1.4);
      if (p <= 0) return;
      const label = CHIPS[k];
      g.save(); g.font = E.font(21, 500);
      const wC = g.measureText(label).width + 44;
      const xs = [96, 386, 668][k], yc = 240;
      g.translate(xs, yc); g.scale(p, p); g.translate(-xs, -yc);
      g.fillStyle = 'rgba(255,255,255,.05)'; E.rr(g, xs - wC / 2, yc - 21, wC, 42, 21); g.fill();
      g.strokeStyle = E.rgba(PAL.accent, 0.5); g.lineWidth = 1.4; E.rr(g, xs - wC / 2, yc - 21, wC, 42, 21); g.stroke();
      g.fillStyle = PAL.text; g.font = E.font(21, 500); g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(label, xs, yc + 1); g.restore();
    });
  }
  return c;
}
const stY = [590, 850, 1110, 1370];
function scenePipeline(g, t) {
  // header expand from tile
  const hp = E.back(E.seg(t, 25.5, 25.9), 1.3);
  const out = 1 - E.seg(t, 37.8, 38.15);
  if (hp > 0 && out > 0) {
    g.save(); g.globalAlpha = Math.min(hp, out);
    g.translate(CX, 380); g.scale(0.6 + 0.4 * hp, 0.6 + 0.4 * hp); g.translate(-CX, -380);
    g.fillStyle = PAL.text; g.font = E.font(88, 700, 'disp'); g.textAlign = 'center';
    if (g.letterSpacing !== undefined) g.letterSpacing = `${-0.045 * 88}px`;
    g.fillText('PCTPR', CX, 408);
    if (g.letterSpacing !== undefined) g.letterSpacing = '0px';
    g.fillStyle = PAL.mute; g.font = E.font(20, 600, 'mono');
    if (g.letterSpacing !== undefined) g.letterSpacing = '4px';
    g.fillText('QUY TRÌNH AI 4 BƯỚC — MỖI VIỆC MỘT CÔNG CỤ', CX, 470);
    if (g.letterSpacing !== undefined) g.letterSpacing = '0px';
    g.restore();
  }
  // connector spine + accent packets (living element)
  const spineA = Math.min(E.seg(t, 25.9, 26.2), out);
  if (spineA > 0) {
    g.save(); g.globalAlpha = spineA;
    g.strokeStyle = 'rgba(255,255,255,.10)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(CX, 560); g.lineTo(CX, 1660); g.stroke();
    for (let pk = 0; pk < 3; pk++) {
      const u = ((t * 0.42 + pk * 0.33) % 1);
      const py = 560 + u * 1100;
      const lit = ST.some(s => t > s.light);
      E.glow(g, CX, py, 30, PAL.accent, lit ? 0.5 : 0.25);
      g.fillStyle = PAL.accent; g.beginPath(); g.arc(CX, py, 7, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  }
  // stations
  ST.forEach((s, i) => {
    const inP = E.back(E.seg(t, 25.9 + i * 0.18, 26.12 + i * 0.18), 1.25);
    if (inP <= 0 || out <= 0) return;
    const hh = i === 3 ? 300 : 220;
    const src = stationCanvas(i, t);
    const rp = E.seg(t, s.light, s.light + 0.55);
    const y = stY[i];
    const k = Math.min(1, 0.85 + 0.15 * inP);
    g.save(); g.globalAlpha = out;
    g.translate(CX, y + hh / 2); g.scale(k, k);
    if (rp > 0) { g.shadowColor = E.rgba(PAL.accent, 0.14 * E.ss(rp)); g.shadowBlur = 40 * rp; }
    E.lightReveal(g, src, -952 / 2, -hh / 2, 952, hh, rp, { base: 0.12, glint: 0.4, angle: 0.4 });
    g.shadowColor = 'transparent';
    // step number chip (accent when lit)
    const lit = rp >= 1;
    g.fillStyle = lit ? E.rgba(PAL.accent, 0.16) : 'rgba(255,255,255,.05)';
    g.beginPath(); g.arc(424, 0, 26, 0, Math.PI * 2); g.fill();
    g.strokeStyle = lit ? E.rgba(PAL.accent, 0.7) : 'rgba(255,255,255,.14)'; g.lineWidth = 1.5; g.stroke();
    g.fillStyle = lit ? PAL.accent : PAL.mute; g.font = E.font(22, 700, 'mono'); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(String(i + 1), 424, 1);
    g.restore();
  });
}

// ═══════════════ SCENE 7: GIANT NUMBER (38.8–43.4) ═══════════════
function sceneNumber(g, t) {
  const out = 1 - E.seg(t, 43.3, 43.55);
  if (out <= 0) return;
  g.save(); g.globalAlpha = out;
  // label
  const la = Math.min(E.seg(t, 40.6, 40.9), out);
  if (la > 0) {
    g.save(); g.globalAlpha = la;
    g.fillStyle = PAL.mute; g.font = E.font(21, 600, 'mono'); g.textAlign = 'center';
    if (g.letterSpacing !== undefined) g.letterSpacing = '4px';
    g.fillText('KHỐI LƯỢNG CÔNG VIỆC GIẤY TỜ', CX, 1120);
    if (g.letterSpacing !== undefined) g.letterSpacing = '0px';
    g.restore();
  }
  // 100%: scramble in, squash out at 41.0
  const sq = E.seg(t, 41.0, 41.3);
  if (sq < 1) {
    g.save();
    g.translate(CX, 880); g.scale(1, Math.max(0.02, 1 - E.ss(sq) * 1.12)); g.translate(-CX, -880);
    E.scramble(g, '100%', CX, 880, t, [39.6, 40.0, 40.4, 38.95], { px: 270, wt: 600, align: 'center', color: PAL.text, start: 38.9 });
    g.restore();
  }
  // 40%: locks in accent
  const p40 = E.seg(t, 41.3, 41.5);
  if (p40 > 0) {
    const dt = t - 42.3;
    const settle = (dt > 0 && dt < 0.6) ? 1 + 0.05 * Math.exp(-dt * 10) * Math.cos(dt * 34) : 1;
    g.save(); g.translate(CX, 890); g.scale(p40 * settle, p40 * settle); g.translate(-CX, -890);
    E.glow(g, CX, 860, 300, PAL.accent, 0.16);
    E.scramble(g, '40%', CX, 890, t, [41.5, 41.8, 42.1, 41.35], { px: 340, wt: 600, align: 'center', color: PAL.accent, start: 41.32 });
    g.restore();
  }
  // accent underline under 40%
  const up = E.seg(t, 42.3, 42.6);
  if (up > 0) {
    g.fillStyle = PAL.accent; g.globalAlpha = up * out;
    E.rr(g, CX - 130, 990, 260 * up, 6, 3); g.fill();
  }
  g.restore();
}

// ═══════════════ SCENE 8: AUTOMATION WINS (43.4–48.8) ═══════════════
function winCanvas(i, t) {
  const [c, g] = E.buf(`win${i}`, 952, 280);
  g.clearRect(0, 0, 952, 280);
  E.panel(g, 0, 0, 952, 280, { r: 20, fill: PAL.surf2, shadow: 0.9 });
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  const titles = ['BIÊN BẢN HỌP — TỰ ĐỘNG TÓM TẮT', 'BÁO CÁO — DỰNG NHANH HƠN', 'DỮ LIỆU — CHECKLIST NGHIỆM THU'];
  g.fillStyle = PAL.dim; g.font = E.font(17, 600, 'mono');
  if (g.letterSpacing !== undefined) g.letterSpacing = '2px';
  g.fillText(titles[i], 28, 42);
  if (g.letterSpacing !== undefined) g.letterSpacing = '0px';
  g.fillStyle = PAL.line; g.fillRect(0, 60, 952, 1);
  if (i === 0) {
    // messy lines left → neat lines right
    const messyOut = E.seg(t, 44.0, 44.8);
    const R = E.mulberry(7);
    for (let l = 0; l < 5; l++) {
      const keep = 1 - E.seg(messyOut, l / 5, (l + 1) / 5);
      if (keep <= 0) continue;
      g.fillStyle = 'rgba(255,255,255,.09)';
      g.fillRect(28, 84 + l * 32, 330 * (0.6 + R() * 0.35) * keep, 11);
    }
    for (let l = 0; l < 3; l++) {
      const lp = E.seg(t, 44.0 + l * 0.25, 44.35 + l * 0.25);
      if (lp <= 0) continue;
      g.fillStyle = 'rgba(185,243,90,.30)';
      g.fillRect(420, 84 + l * 40, 380 * lp, 13);
    }
    const cp = E.back(E.seg(t, 44.6, 44.85), 1.4);
    if (cp > 0) {
      g.save(); g.translate(840, 210); g.scale(cp, cp);
      g.fillStyle = E.rgba(PAL.accent, 0.14); E.rr(g, -92, -21, 184, 42, 21); g.fill();
      g.strokeStyle = E.rgba(PAL.accent, 0.6); g.lineWidth = 1.4; E.rr(g, -92, -21, 184, 42, 21); g.stroke();
      g.fillStyle = PAL.accent; g.font = E.font(17, 700, 'mono'); g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('TÓM TẮT XONG', 0, 1); g.restore();
    }
  } else if (i === 1) {
    const p = E.seg(t, 45.4, 46.8);
    g.fillStyle = 'rgba(255,255,255,.06)'; E.rr(g, 28, 96, 700, 44, 22); g.fill();
    g.fillStyle = PAL.accent; g.shadowColor = E.rgba(PAL.accent, 0.45); g.shadowBlur = 14;
    E.rr(g, 28, 96, Math.max(8, 700 * p), 44, 22); g.fill(); g.shadowColor = 'transparent';
    g.fillStyle = PAL.text; g.font = E.font(24, 600, 'mono'); g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText(`${Math.round(p * 100)}%`, 756, 118);
    const R = E.mulberry(11);
    for (let l = 0; l < 3; l++) {
      const lp = E.seg(t, 45.5 + l * 0.4, 45.9 + l * 0.4);
      if (lp <= 0) continue;
      g.fillStyle = 'rgba(255,255,255,.10)';
      g.fillRect(28, 176 + l * 30, 620 * (0.55 + R() * 0.4) * lp, 11);
    }
    const dp = E.seg(t, 46.85, 47.1);
    if (dp > 0) { g.fillStyle = E.rgba(PAL.accent, dp); g.font = E.font(19, 700, 'mono'); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('SẴN SÀNG · 3 PHÚT', 360, 250); }
  } else {
    const rows = ['Đối chiếu số liệu nguồn', 'Kiểm tra định dạng', 'Rà trùng lặp & sai sót', 'Xác nhận nghiệm thu'];
    rows.forEach((s, k) => {
      const on = t > 47.0 + k * 0.3;
      const yy = 84 + k * 46;
      g.fillStyle = on ? E.rgba(PAL.accent, 0.10) : 'rgba(255,255,255,.04)';
      E.rr(g, 28, yy, 896, 38, 10); g.fill();
      g.strokeStyle = on ? PAL.accent : 'rgba(255,255,255,.18)'; g.lineWidth = 3; g.lineCap = 'round';
      g.strokeRect(42, yy + 8, 22, 22);
      if (on) { const tp = E.seg(t, 47.0 + k * 0.3, 47.16 + k * 0.3); g.beginPath(); g.moveTo(47, yy + 19); g.lineTo(47 + 6 * tp, yy + 25); g.lineTo(47 + 14 * tp, yy + 13 + (1 - tp) * 5); g.stroke(); }
      g.fillStyle = on ? PAL.text : PAL.mute; g.font = E.font(20, on ? 600 : 400); g.textAlign = 'left'; g.textBaseline = 'middle';
      g.fillText(s, 82, yy + 19);
    });
  }
  return c;
}
const winY = [500, 830, 1160];
const winT = [43.8, 45.2, 46.6];
function sceneWins(g, t) {
  // section label
  if (t > 43.9 && t < 52.2) {
    const a = Math.min(E.seg(t, 43.9, 44.2), 1 - E.seg(t, 51.7, 52.1));
    g.save(); g.globalAlpha = a * 0.9;
    g.fillStyle = PAL.dim; g.font = E.font(20, 600, 'mono'); g.textAlign = 'center';
    if (g.letterSpacing !== undefined) g.letterSpacing = '4px';
    g.fillText('BA VIỆC TỰ CHẠY — MỖI TUẦN', CX, 436);
    if (g.letterSpacing !== undefined) g.letterSpacing = '0px';
    g.restore();
  }
  winT.forEach((wt, i) => {
    const gone = [E.seg(t, 48.9, 49.8), E.seg(t, 50.0, 50.9), E.seg(t, 51.2, 52.0)][i];
    if (gone >= 1) return;
    const p = E.back(E.seg(t, wt, wt + 0.3), 1.3);
    if (p <= 0) return;
    const src = winCanvas(i, t);
    const hh = 280, y = winY[i];
    g.save();
    if (gone > 0) { g.translate(CX, y + hh / 2); g.scale(Math.max(0.02, 1 - gone), Math.max(0.02, 1 - E.ss(gone) * 1.1)); g.translate(-CX, -(y + hh / 2)); }
    else { g.translate(CX, y + hh / 2); g.scale(0.85 + 0.15 * p, 0.85 + 0.15 * p); g.translate(-CX, -(y + hh / 2)); }
    g.globalAlpha = p * (1 - gone);
    g.drawImage(src, 64, y);
    g.restore();
  });
}

// ═══════════════ SCENE 9: CLEAN WORKSPACE (52.4–53.9) + VERDICT (54.0–57.0) + CTA ═══════════════
function sceneClean(g, t) {
  const gone = E.seg(t, 53.9, 54.15);
  if (gone >= 1) return;
  const p = E.back(E.seg(t, 52.4, 52.7), 1.25);
  if (p <= 0) return;
  const breathe = 1 + 0.008 * Math.sin(t * 3.1);
  g.save();
  if (gone > 0) { g.translate(CX, 1040); g.scale(Math.max(0.02, 1 - gone), Math.max(0.02, 1 - E.ss(gone) * 1.15)); g.translate(-CX, -1040); }
  else { g.translate(CX, 1040); g.scale(p * breathe, p * breathe); g.translate(-CX, -1040); }
  g.globalAlpha = p * (1 - gone);
  E.glow(g, CX, 1040, 520, PAL.accent, 0.045);
  E.panel(g, 220, 860, 640, 360, { r: 24, fill: PAL.surf2 });
  g.fillStyle = PAL.mute; g.font = E.font(17, 600, 'mono'); g.textAlign = 'center';
  if (g.letterSpacing !== undefined) g.letterSpacing = '3px';
  g.fillText('KHÔNG GIAN LÀM VIỆC SẠCH', CX, 920);
  if (g.letterSpacing !== undefined) g.letterSpacing = '0px';
  g.fillStyle = PAL.text; g.font = E.font(34, 600); g.textAlign = 'left';
  g.fillText('Viết chiến dịch quý 4', 270, 1000);
  E.caret(g, 270 + g.measureText('Viết chiến dịch quý 4').width + 16, 988, 36, { on: (Math.floor(t * 2.4) % 2) === 0 ? 1 : 0.2 });
  g.fillStyle = PAL.dim; g.font = E.font(26, 400);
  g.fillText('Sáng tạo thông điệp chính', 270, 1064);
  g.fillText('Chiến lược — không giấy tờ', 270, 1116);
  g.restore();
}
function verdictCanvas(t) {
  const [c, g] = E.buf('verdict', 952, 330);
  g.clearRect(0, 0, 952, 330);
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.font = E.font(54, 600);
  const l1 = 'Thời gian xử lý giấy tờ';
  const l2a = 'giảm thực tế ';
  const l2b = '50–60%.';
  g.fillStyle = PAL.text;
  g.fillText(l1, 476, 120);
  const w1 = g.measureText(l2a).width, w2 = g.measureText(l2b).width;
  g.fillStyle = PAL.text; g.fillText(l2a, 476 - (w1 + w2) / 2 + w1 / 2, 210);
  g.fillStyle = PAL.accent; g.fillText(l2b, 476 - (w1 + w2) / 2 + w1 + w2 / 2, 210);
  g.fillStyle = E.rgba(PAL.accent, 0.85);
  E.rr(g, 476 - 90, 258, 180, 5, 2.5); g.fill();
  return c;
}
function sceneVerdict(g, t) {
  const out = 1 - E.seg(t, 57.15, 57.38);
  if (out <= 0) return;
  const src = verdictCanvas(t);
  const rp = E.seg(t, 54.0, 55.2);
  g.save(); g.globalAlpha = out;
  E.lightReveal(g, src, 64, 770, 952, 330, rp, { base: 0.06, glint: 0.5, soft: 260 });
  g.restore();
}
function ctaCanvas(t) {
  const [c, g] = E.buf('cta', 952, 400);
  g.clearRect(0, 0, 952, 400);
  E.panel(g, 0, 0, 952, 400, { r: 26, fill: PAL.surf2 });
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.fillStyle = PAL.text; g.font = E.font(40, 500);
  g.fillText('Muốn dùng AI bài bản', 476, 158);
  g.fillText('từ System Prompt đến kiểm chứng chất lượng?', 476, 218);
  g.fillStyle = PAL.mute; g.font = E.font(19, 600, 'mono');
  if (g.letterSpacing !== undefined) g.letterSpacing = '3px';
  g.fillText('PCTPR — QUY TRÌNH · KIỂM CHỨNG · NGHIỆM THU', 476, 306);
  if (g.letterSpacing !== undefined) g.letterSpacing = '0px';
  return c;
}
function sceneCta(g, t) {
  const p = E.back(E.seg(t, 57.4, 57.68), 1.25);
  if (p <= 0) return;
  const sq = E.seg(t, 59.5, 59.75);
  const src = ctaCanvas(t);
  g.save();
  if (sq > 0) {
    const sx = Math.max(0.02, 1 - E.ss(sq)), sy = Math.max(0.02, 1 - E.ss(sq) * 1.15);
    g.translate(CX, 960); g.scale(sx, sy); g.globalAlpha = 1 - sq;
  } else { g.translate(CX, 960); g.scale(0.7 + 0.3 * p, 0.7 + 0.3 * p); g.globalAlpha = p; }
  g.translate(-CX, -960);
  g.drawImage(src, 64, 760);
  g.restore();
  // the caret is the last light on screen
  const on = (Math.floor(t * 2.4) % 2) === 0 ? 1 : 0.25;
  E.caret(g, CX + 190, 990, 42, { on: sq > 0 ? 1 : on, glow: sq > 0 ? 1.6 : 1 });
}

// ═══════════════ CAPTIONS ═══════════════
function drawToast(g, t) {
  for (const c of VO) {
    const w2 = toastWin[c.id]; if (!w2) continue;
    if (t < w2[0] || t > w2[1]) continue;
    const a = Math.min(E.seg(t, w2[0], w2[0] + 0.16), 1 - E.seg(t, w2[1] - 0.18, w2[1]));
    const dense = t < 14 ? 1 : 0;
    const box = E.toast(g, c.sub, a, { y: H - 138, px: 29, dense });
    return box;
  }
}

// ═══════════════ MASTER FRAME ═══════════════
export function frame(t) {
  const g = document.getElementById('gl').getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  // stage ground — chaos has a cooler, more restless light; after the turn it calms
  const chaos = t < 16.8 ? 1 : Math.max(0, 1 - E.seg(t, 16.8, 18.0));
  E.bg(g, { lift: 1 - 0.15 * chaos, cool: 0.4 + 0.6 * chaos, dark: 0 });
  // grid — invisible until the snap promises order; barely-there in chaos
  const gridA = t < 13.3 ? 0.35 : t < 17.6 ? 0.3 + 0.5 * E.seg(t, 14.2, 17.0) : 1;
  const gRot = chaos > 0.5 && t < 13.3 ? Math.sin(t * 0.9) * 0.006 * chaos : 0;
  g.save();
  if (gRot) { g.translate(W / 2, H / 2); g.rotate(gRot); g.translate(-W / 2, -H / 2); }
  E.grid(g, { alpha: gridA * 0.9 });
  g.restore();
  // central light point (echoed at the end)
  const glowA = (t < 2.4 ? 0.10 : 0.04) + (t > 52 ? 0.05 : 0);
  E.glow(g, CX, CY, 500, PAL.accent, glowA * 0.5);

  // scenes
  if (t < 8.62) sceneQuestions(g, t);
  if (t >= 8.6 && t < 16.9) {
    sceneFailure(g, t);
    if (t >= 13.3) { const dz = 0.38 * (1 - E.seg(t, 16.2, 16.7)); g.fillStyle = `rgba(5,6,9,${dz})`; g.fillRect(0, 0, W, H); }
  }
  if (t >= 16.8 && t < 23.0) sceneSystem(g, t);
  if (t >= 23.0 && t < 25.5) sceneCollapse(g, t);
  if (t >= 25.5 && t < 38.3) scenePipeline(g, t);
  if (t >= 38.5 && t < 43.6) sceneNumber(g, t);
  if (t >= 43.6 && t < 52.3) sceneWins(g, t);
  if (t >= 52.3 && t < 54.2) sceneClean(g, t);
  if (t >= 53.9 && t < 57.45) sceneVerdict(g, t);
  if (t >= 57.35) sceneCta(g, t);

  // caption toast above everything
  drawToast(g, t);
  // vignette last
  E.vignette(g, 0.52);
}

// ── on-screen text registry (readcheck) — stable ids per logical text; subtitle-mirroring
//    hero lines & toasts are governed by the .srt hold rules, so they are not reported here ──
export function TEXTS(t) {
  const out = [];
  const push = (id, text, x0, y0, x1, y1) => out.push({ id, text, x0, y0, x1, y1 });
  ST.forEach((s, i) => {
    if (t > 26.1 + i * 0.18 && t < 37.8) {
      push(`st${i}name`, s.name, 130, stY[i] + 40, 950, stY[i] + 90);
      push(`st${i}role`, s.role, 130, stY[i] + 95, 950, stY[i] + 145);
    }
  });
  TILE_TITLES.forEach((tt, i) => { if (t > revT[i] + 0.5 && t < 23.0) { const [tx, ty] = slotPos(i); push(`tile${i}`, tt, tx + 20, ty + 12, tx + GRID.tw - 16, ty + 52); } });
  if (t > 18.5 && t < 22.8) push('gridlabel', 'MỌI THỨ VÀO ĐÚNG LƯỚI CỦA NÓ', 200, 355, 880, 390);
  if (t > 44.2 && t < 51.6) push('winlabel', 'BA VIỆC TỰ CHẠY — MỖI TUẦN', 200, 420, 880, 455);
  const winTitles = ['BIÊN BẢN HỌP — TỰ ĐỘNG TÓM TẮT', 'BÁO CÁO — DỰNG NHANH HƠN', 'DỮ LIỆU — CHECKLIST NGHIỆM THU'];
  winT.forEach((wt, i) => { if (t > wt + 0.35 && t < [48.9, 50.0, 51.2][i]) push(`wintitle${i}`, winTitles[i], 90, winY[i] + 26, 990, winY[i] + 56); });
  if (t > 46.9 && t < 50.0) push('ready', 'SẴN SÀNG · 3 PHÚT', 380, 1150, 720, 1185);
  return out;
}
