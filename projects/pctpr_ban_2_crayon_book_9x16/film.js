// film.js — «Cuốn sổ thần kỳ của team» · crayon-book · 1080x1920 · 60s · 24fps (vẽ bước 12fps)
// 4 trang + bìa; chuyển cảnh = vẽ-tiếp / tô-đè / lật trang; wash hồng-gold DUY NHẤT của phim
// bộc lộ chữ crayon trắng "50–60%" giấu từ 14.4s (wax resist — payoff giấu kín từ frame đầu).
// Composite plan mỗi frame: desk → trang-dưới → bóng → trang-lật → wash → nhân-vật → chữ-in.
import { clamp, lerp, seg, eio, hash, mulberry, vnoise, TAU } from '/core/lib.js';
import { makeComp } from './gl.js';
import { CAM, BOIL, layer, clear, line, fill, dab, text, handCircle, bez, smooth, sx, sy } from './crayon.js';
import { group, clearGroup, part, tube, curve } from './rig.js';
import * as CH from './chars.js';

export const DUR = 60.0;
const W = 1080, H = 1920;
const comp = makeComp(document.getElementById('gl'));

// ── shared VO cues (verbatim from master_vo_v2/vo_timeline.json); '→' → '–' cho chữ in (Patrick Hand) ──
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
  { id: 'c09', t0: 54.0, t1: 56.663, sub: 'Thời gian xử lý giấy tờ giảm thực tế 50-60%.' },
  { id: 'c10', t0: 57.05, t1: 59.607, sub: 'Muốn dùng AI bài bản từ System Prompt đến kiểm chứng chất lượng?', hero: true },
];
const burned = s => s.replace(/→/g, '–');
const SUB_ON = VO.filter(c => !c.hero);

// ── deterministic events (foley cues for mix.py) ──
export const EV = [];
const ev = (t, type, o = {}) => EV.push({ t: +t.toFixed(3), type, ...o });
[2.3, 2.7, 3.1, 3.5, 3.9, 4.3, 4.65].forEach(t => ev(t, 'swish', { v: 0.6, pan: hash(t) - 0.5 }));
[2.6, 3.3, 4.0, 4.6].forEach(t => ev(t, 'plop', { v: 0.5 }));
[2.5, 2.9, 3.4, 3.8, 4.2].forEach((t, i) => ev(t, 'kalimba', { v: 0.7, pan: (i - 2) * 0.3 }));
[3.7, 4.3, 4.9].forEach((t, i) => ev(t, 'pop', { v: 0.45, pan: (i - 1) * 0.5 }));
[2.6, 3.0, 3.4].forEach((t, k) => ev(t, 'swish', { v: 0.5, pan: k === 1 ? 0 : (k - 1) * 0.7 }));
ev(8.9, 'swish', { v: 0.6 }); ev(9.6, 'swish', { v: 0.6, pan: 0.4 }); ev(10.4, 'swish', { v: 0.6, pan: -0.4 });
[10.8, 11.3, 11.8, 12.3, 12.7].forEach(t => ev(t, 'scribf', { v: 0.6, pan: (hash(t * 3) - 0.5) * 0.8 }));
ev(13.25, 'wood', { v: 0.7 });
ev(16.65, 'wood', { v: 0.7 });
ev(14.6, 'wswish', { v: 0.3 });
[[17.0], [25.5], [43.4], [53.9], [57.0]].forEach(([t]) => { ev(t - 0.12, 'lift', { v: 0.6 }); ev(t + 0.1, 'pturn', { v: 0.8 }); ev(t + 0.48, 'flap', { v: 0.7 }); });
[17.9, 18.2, 18.5, 18.8, 19.1, 19.4].forEach((t, i) => ev(t, 'glock', { v: 0.55, pan: i % 2 ? 0.4 : -0.4 }));
[19.6, 20.15, 20.7, 21.25].forEach((t, i) => ev(t, 'tick', { v: 0.7, pan: (i - 1.5) * 0.3 }));
[18.6, 19.1, 19.6, 20.1, 20.6, 21.1].forEach(t => ev(t, 'swish', { v: 0.55 }));
ev(22.4, 'pop', { v: 0.6 });
[26.4, 27.2, 31.7, 32.5].forEach((t, i) => ev(t, 'pop', { v: 0.7, pan: (i - 1.5) * 0.4 }));
[26.5, 27.3, 31.8, 32.6].forEach(t => ev(t, 'musicbox', { v: 0.6 }));
[34.3, 35.1, 35.9].forEach((t, i) => ev(t, 'tick', { v: 0.6, pan: (i - 1) * 0.5 }));
[34.2, 34.9, 35.6].forEach(t => ev(t, 'swish', { v: 0.5, pan: (hash(t) - 0.5) * 0.6 }));
[39.3, 39.8, 40.3, 40.7].forEach(t => { ev(t, 'kalimba', { v: 0.7 }); ev(t, 'swish', { v: 0.5 }); });
ev(41.4, 'swish', { v: 0.6 }); ev(42.0, 'scribf', { v: 0.7 }); ev(42.5, 'musicbox', { v: 0.6 });
[44.3, 44.9].forEach(t => ev(t, 'swish', { v: 0.6 }));
[45.7, 46.1, 46.5].forEach(t => ev(t, 'swish', { v: 0.65, pan: 0.3 }));
[46.9, 47.3, 47.7].forEach((t, i) => ev(t, 'tick', { v: 0.7, pan: (i - 1) * 0.4 }));
[49.3, 49.9, 50.4].forEach(t => ev(t, 'swish', { v: 0.5 }));
[51.0, 51.6].forEach(t => ev(t, 'swish', { v: 0.6, pan: 0.3 }));
[55.0, 55.6, 56.2].forEach((t, i) => ev(t, 'wet', { v: 0.7, pan: (i - 1) * 0.5 }));
[55.35, 55.65, 55.95, 56.25].forEach((t, i) => ev(t, 'glint', { v: 0.7, pan: (i - 1.5) * 0.3 }));
[57.7, 58.1, 58.5, 58.9].forEach((t, i) => ev(t, 'swish', { v: 0.55, pan: i % 2 ? 0.3 : -0.3 }));
ev(59.4, 'glint', { v: 0.6 });
ev(59.5, 'flap', { v: 0.5 });

// ═══ page clock ═══
const TURN = { p2: 17.0, p3: 25.5, p4: 43.4, back: 53.9, cover: 57.0 };
const curPage = t => t < 17.0 ? 1 : t < 25.5 ? 2 : t < 43.4 ? 3 : t < 53.9 ? 4 : t < 57.0 ? 1 : 5;
function turnState(t) {
  const defs = [['p2', 17.0, 1, 2], ['p3', 25.5, 2, 3], ['p4', 43.4, 3, 4], ['back', 53.9, 4, 1], ['cover', 57.0, 1, 5]];
  for (const [key, tk, old, next] of defs) {
    const p = seg(t, tk, tk + 0.7);
    if (p > 0 && p < 1) return { old, next, p, dir: key === 'back' ? -1 : 1 };
  }
  return null;
}
const pageFreeze = k => k === 1 ? 17.0 : k === 2 ? TURN.p3 + 0.7 : k === 3 ? TURN.p4 + 0.7 : k === 4 ? TURN.back + 0.7 : 57.7;

// ═══ camera ═══
const CAMK = [
  [0.0, 540, 960, 0.92], [8.2, 540, 960, 0.92], [8.6, 360, 1220, 1.32], [9.2, 540, 860, 1.06],
  [13.3, 540, 860, 1.06], [14.4, 380, 1280, 1.5], [16.8, 380, 1280, 1.5], [17.9, 540, 960, 0.92],
  [23.0, 540, 960, 0.92], [26.3, 540, 900, 0.95], [34.0, 240, 920, 1.26], [36.6, 800, 920, 1.26],
  [37.2, 540, 900, 0.95], [38.8, 540, 900, 0.95], [39.6, 540, 760, 1.08], [43.0, 540, 760, 1.08],
  [44.4, 300, 940, 1.02], [48.2, 780, 940, 1.02], [48.9, 540, 1150, 0.9], [53.9, 540, 1150, 0.9],
  [54.8, 540, 760, 0.9], [56.9, 540, 760, 0.9], [57.9, 540, 1080, 0.7], [60.0, 540, 1120, 0.66],
];
function setCam(t) {
  let a = CAMK[0], b = CAMK[CAMK.length - 1];
  for (let i = 0; i < CAMK.length - 1; i++) if (t >= CAMK[i][0] && t <= CAMK[i + 1][0]) { a = CAMK[i]; b = CAMK[i + 1]; break; }
  const u = eio(seg(t, a[0], b[0]));
  CAM.x = lerp(a[1], b[1], u); CAM.y = lerp(a[2], b[2], u); CAM.s = lerp(a[3], b[3], u);
}

// ═══ groups ═══
const G = { desk: group(), p1: group(), p1c: group(), p2: group(), p3: group(), p4: group(), p4c: group(), cover: group(), sub: group(), shadow: group(), wash: layer() };
function clearAll() { for (const k in G) { const g = G[k]; g.k ? clearGroup(g) : clear(g); } }
const gp = k => k === 1 ? G.p1 : k === 2 ? G.p2 : k === 3 ? G.p3 : k === 4 ? G.p4 : G.cover;

// ═══ helpers ═══
const pageText = (L, str, x, y, o = {}) => text(L, str, sx(x), sy(y), { font: 'Patrick Hand', col: CH.INK, size: 44, p: 0.9, boil: 1, ...o });
function boxOutline(C, x, y, w, h, draw, seed, lw = 6.6) {
  if (draw <= 0) return;
  const pts = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  line(C.l, [...pts, pts[0]], { col: CH.INK, w: lw, p: 0.88, draw, seed });
}
function wrapN(str, maxChars) {
  const words = String(str).split(' '); const lines = []; let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length <= maxChars || !cur) cur = (cur + ' ' + w).trim();
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  if (lines.length >= 2 && lines[lines.length - 1].length < maxChars * 0.3) {
    const last = lines.pop(); const pw = lines[lines.length - 1].split(' ');
    if (pw.length > 2) { const mv = pw.pop(); lines[lines.length - 1] = pw.join(' '); lines.push(mv + ' ' + last); }
  }
  return lines;
}
let shadowUsed = false;
function fillShadow(poly) {
  shadowUsed = true;
  fill(G.shadow.f, poly, { col: CH.VIOLET, p: 0.2, gap: 15, w: 10, over: 3 });
}

// ═══════════════ PAGE 1 — hỗn loạn & vòng lặp sai lầm (0–17.0 · 53.9–57.0) ═══════════════
function drawP1(t, skipChars = false) {
  const tp = Math.min(t, 17.0);
  const G1 = G.p1, G1c = G.p1c;
  // desk on the right, Minh sits left of it, feet on the floor
  CH.desk(G1, 640, 1400, 560, 3);
  CH.monitor(G1, 760, 1374, 210, 'tired', 5);
  CH.paperStack(G1, 500, 1374, 6, seg(tp, 3.0, 4.0), 12, 100);
  CH.paperStack(G1, 830, 1374, 5, seg(tp, 4.2, 4.8), 15, 95);
  CH.paperStack(G1, 170, 1735, 9, seg(tp, 2.2, 3.4), 11);
  CH.paperStack(G1, 330, 1735, 10, seg(tp, 3.4, 4.4), 13);
  CH.paperStack(G1, 880, 1745, 40, seg(tp, 2.2, 4.8), 14, 150); // the tower — cao hơn Minh
  // ghế đẩu cho Minh (vẽ trước để thân người đè lên)
  part(G1, [[285, 1448], [375, 1448], [375, 1462], [285, 1462]], { col: CH.OCHRE, p: 0.6, ang: 0.4, gap: 8, w: 8, over: 3 }, { col: CH.INK, w: 5.6, p: 0.85, boil: 0.8 });
  for (const dx of [297, 363]) part(G1, tube([[dx, 1462], [dx, 1560]], 11, 9), { col: CH.BROWN, p: 0.55, ang: 1.2, gap: 7, w: 7, over: 3 }, { col: CH.INK, w: 5, p: 0.85, boil: 0.8 });
  if (!skipChars) {
    [[170, 700, 3.1], [520, 600, 3.5], [900, 680, 3.9]].forEach(([dx, dy, t0], i) => {
      const dp = seg(tp, t0, t0 + 0.4);
      if (dp <= 0) return;
      const bob = Math.sin(tp * 2 + i * 2.1) * 8;
      CH.docFace(G1c, dx, dy + bob, 0.55 + 0.1 * dp, 'worried', 21 + i, 110, 140);
    });
    CH.minh(G1c, 330, 1460, 1.0, tp < 13.5 ? 'sit-worry' : 'sit-up', 2);
  }
  if (tp > 8.7) {
    const p1 = seg(tp, 8.8, 9.5);
    boxOutline(G1, 120, 560, 840, 190, p1, 31);
    if (p1 > 0.2) {
      CH.docFace(G1, 230, 715, 0.42, 'neutral', 33, 90, 120);
      pageText(G1.l, 'viết báo cáo tuần…', 320, 660, { size: 36, reveal: seg(tp, 9.0, 9.6) });
      pageText(G1.l, 'chỉ 6 từ thôi', 320, 715, { size: 30, reveal: seg(tp, 9.5, 9.9), col: CH.BROWN });
    }
    const p2 = seg(tp, 9.6, 10.3);
    boxOutline(G1, 120, 790, 840, 190, p2, 35);
    if (p2 > 0.2) {
      CH.docFace(G1, 230, 945, 0.42, 'worried', 36, 90, 120);
      for (let i = 0; i < 3; i++) line(G1.l, [[330, 860 + i * 30], [330 + 420 * (0.6 + hash(i * 3) * 0.3) * seg(tp, 9.9 + i * 0.12, 10.3), 860 + i * 30]], { col: '#b9bfcc', w: 9, p: 0.35, seed: 40 + i, boil: 0.6 });
      pageText(G1.l, 'sáo rỗng, chung chung…', 800, 950, { size: 30, reveal: seg(tp, 10.1, 10.5), col: CH.BROWN });
    }
    const p3 = seg(tp, 10.4, 11.0);
    boxOutline(G1, 120, 1020, 840, 190, p3, 43);
    if (p3 > 0.2) {
      for (let k = 0; k < 6; k++) {
        const sp = seg(tp, 10.8 + k * 0.4, 11.1 + k * 0.4);
        if (sp <= 0) continue;
        const yy = 1060 + (k % 3) * 46, xx = 160 + hash(k * 7) * 380;
        line(G1.l, [[xx, yy], [xx + 180 * sp, yy + (hash(k) - 0.5) * 14]], { col: CH.RED, w: 7, p: 0.85, seed: 50 + k });
        line(G1.l, [[xx + 10, yy + 12], [xx + 150 * sp, yy + 20]], { col: CH.RED, w: 5, p: 0.7, seed: 57 + k });
      }
      const ccx = 860, ccy = 1115, cp = seg(tp, 10.5, 11.2);
      if (cp > 0) {
        line(G1.l, handCircle(ccx, ccy, 44, 61, 0.12, 22), { col: CH.INK, w: 6, p: 0.85, draw: cp, seed: 62 });
        const spin = 3.4 * Math.pow(seg(tp, 11.2, 13.25), 2.1);
        line(G1.l, [[ccx, ccy], [ccx + Math.cos(-1.1 + spin * TAU) * 30, ccy + Math.sin(-1.1 + spin * TAU) * 30]], { col: CH.RED, w: 6, p: 0.9, seed: 63 });
        line(G1.l, [[ccx, ccy], [ccx + 21, ccy - 21]], { col: CH.INK, w: 5, p: 0.8, seed: 64 });
        pageText(G1.l, '3 giờ 40 phút / tuần', ccx - 200, ccy + 86, { size: 28, reveal: seg(tp, 11.4, 11.8), col: CH.BROWN });
      }
    }
  }
  const q1 = wrapN(VO[0].sub, 36);
  q1.forEach((s, i) => pageText(G1.l, s, 540, 150 + i * 62, { size: 44, align: 'center', reveal: seg(tp, 2.4 + i * 0.5, 3.1 + i * 0.5) }));
  const q2 = wrapN(VO[1].sub, 40);
  q2.forEach((s, i) => pageText(G1.l, s, 540, 372 + i * 58, { size: 40, align: 'center', reveal: seg(tp, 5.2 + i * 0.4, 5.9 + i * 0.4) }));
  // white-crayon secret (wax resist) — invisible until the wash passes
  const wp = seg(tp, 14.4, 15.4);
  if (wp > 0) {
    pageText(G1.l, '50–60%', 850, 130, { size: 64, col: CH.WHITE, p: 0.96, reveal: wp, align: 'center', seed: 71 });
    const swp = seg(tp, 15.2, 15.6);
    if (swp > 0) for (let a = 0; a < 3; a++) {
      const ang = a * Math.PI / 3;
      line(G1.l, [[990 - Math.cos(ang) * 18, 180 - Math.sin(ang) * 18], [990 + Math.cos(ang) * 18, 180 + Math.sin(ang) * 18]], { col: CH.WHITE, w: 7, p: 0.9, draw: swp, seed: 72 + a });
    }
  }
}
function drawP1CharsRevisit() {
  [[170, 700], [520, 600], [900, 680]].forEach(([dx, dy], i) => {
    const bob = Math.sin(16.8 * 2 + i * 2.1) * 8;
    CH.docFace(G.p1c, dx, dy + bob, 0.65, 'happy', 21 + i, 110, 140);
  });
  CH.minh(G.p1c, 330, 1460, 1.0, 'sit-up', 2);
}

// ═══════════════ PAGE 2 — hệ thống mạch lạc (17.0–25.5) ═══════════════
function drawP2(t) {
  const tp = Math.min(t, TURN.p3 + 0.7);
  pageText(G.p2.l, 'HỆ THỐNG MỚI', 540, 260, { size: 64, align: 'center', reveal: seg(tp, 17.9, 18.7), seed: 81 });
  const PX = [90, 560], PY = [380, 720, 1060], PW = 420, PH = 300;
  for (let i = 0; i < 6; i++) {
    const x = PX[i % 2], y = PY[Math.floor(i / 2)];
    const od = seg(tp, 17.8 + i * 0.22, 18.25 + i * 0.22);
    if (od <= 0) continue;
    boxOutline(G.p2, x, y, PW, PH, od, 90 + i);
    const cd = seg(tp, 18.4 + i * 0.45, 19.3 + i * 0.45);
    if (i === 0) {
      for (let a = 0; a <= 5; a++) line(G.p2.l, [[x + 30 + a * 72, y + 40], [x + 30 + a * 72, y + 250]], { col: CH.INK, w: 3.2, p: 0.5, draw: cd, seed: 101 + a, boil: 0.6 });
      for (let b = 0; b <= 5; b++) line(G.p2.l, [[x + 30, y + 40 + b * 42], [x + 390, y + 40 + b * 42]], { col: CH.INK, w: 3.2, p: 0.5, draw: cd, seed: 111 + b, boil: 0.6 });
      const hi = seg(tp, 19.6, 20.4);
      if (hi > 0) part(G.p2, [[x + 30, y + 124], [x + 30 + 360 * hi, y + 124], [x + 30 + 360 * hi, y + 166], [x + 30, y + 166]], { col: CH.GREEN, p: 0.4, gap: 12, w: 10, over: 2 }, null);
    } else if (i === 1) {
      [['62%', CH.SKY], ['78%', CH.YELLOW], ['41%', CH.ORANGE]].forEach(([v, col], k) => {
        const bp = seg(tp, 19.0 + k * 0.35, 19.9 + k * 0.35);
        if (bp <= 0) return;
        const yy = y + 70 + k * 76;
        part(G.p2, [[x + 30, yy], [x + 30 + 300 * bp, yy], [x + 30 + 300 * bp, yy + 34], [x + 30, yy + 34]], { col, p: 0.55, gap: 9, w: 9, over: 3 }, { col: CH.INK, w: 5, p: 0.8, boil: 0.7 });
        pageText(G.p2.l, v, x + 360, yy + 28, { size: 30, reveal: seg(bp, 0.8, 1) });
      });
    } else if (i === 2) {
      ['Số liệu khớp nguồn', 'Đúng mẫu quy định', 'Đủ chữ ký duyệt', 'Gửi đúng hạn'].forEach((s, k) => {
        const rp = seg(tp, 19.3 + k * 0.12, 19.9 + k * 0.12);
        if (rp <= 0) return;
        const yy = y + 56 + k * 60;
        pageText(G.p2.l, s, x + 84, yy + 8, { size: 27, reveal: rp });
        line(G.p2.l, [[x + 36, yy - 12], [x + 66, yy - 12], [x + 66, yy + 16], [x + 36, yy + 16], [x + 36, yy - 12]], { col: CH.INK, w: 4.4, p: 0.8, draw: rp, seed: 120 + k });
        const tk = seg(tp, 19.6 + k * 0.55, 19.85 + k * 0.55);
        if (tk > 0) line(G.p2.l, [[x + 40, yy + 2], [x + 47, yy + 9], [x + 60, yy - 8]], { col: CH.GREEN, w: 6, p: 0.95, draw: tk, seed: 130 + k });
      });
    } else if (i === 3) {
      const nodes = [[x + 70, y + 90], [x + 210, y + 90], [x + 210, y + 210], [x + 350, y + 210]];
      nodes.forEach(([nx, ny], k) => {
        const np = seg(tp, 19.2 + k * 0.3, 19.7 + k * 0.3);
        if (np <= 0) return;
        part(G.p2, handCircle(nx, ny, 26, 140 + k, 0.1, 20), { col: CH.WHITE, p: 0.7, gap: 8, w: 8, over: 2 }, { col: CH.INK, w: 5.4, p: 0.9, boil: 0.8 });
      });
      for (let a = 0; a < 3; a++) {
        const ap = seg(tp, 19.4 + a * 0.3, 20.0 + a * 0.3);
        if (ap <= 0) continue;
        const [x1, y1] = nodes[a], [x2, y2] = nodes[a + 1];
        line(G.p2.l, [[x1, y1], [x1 + (x2 - x1) * ap, y1 + (y2 - y1) * ap]], { col: CH.INK, w: 5, p: 0.75, seed: 150 + a, boil: 0.7 });
      }
      if (tp > 20.2) {
        const u = (tp * 0.5) % 1, si = Math.min(2, Math.floor(u * 3)), lu = u * 3 - si;
        const [x1, y1] = nodes[si], [x2, y2] = nodes[si + 1];
        dab(G.p2.f, x1 + (x2 - x1) * lu, y1 + (y2 - y1) * lu, 10, { col: CH.ORANGE, p: 0.85, seed: 155 + Math.floor(tp * 12), gap: 5, w: 6 });
      }
    } else if (i === 4) {
      for (let l = 0; l < 5; l++) {
        const keep = 1 - seg(tp, 21.9 + l * 0.1, 22.3 + l * 0.1);
        if (keep <= 0) continue;
        line(G.p2.l, [[x + 30, y + 50 + l * 28], [x + 30 + 330 * (0.6 + hash(l * 3) * 0.35) * keep, y + 50 + l * 28]], { col: '#b9bfcc', w: 8, p: 0.35, seed: 160 + l, boil: 0.6 });
      }
      for (let l = 0; l < 3; l++) {
        const lp = seg(tp, 22.1 + l * 0.15, 22.5 + l * 0.15);
        if (lp <= 0) continue;
        line(G.p2.l, [[x + 30, y + 50 + l * 40], [x + 30 + 300 * lp, y + 50 + l * 40]], { col: CH.GREEN, w: 8, p: 0.6, seed: 170 + l, boil: 0.7 });
      }
    } else {
      const bp = seg(tp, 20.2, 22.4);
      if (bp > 0) {
        part(G.p2, [[x + 30, y + 90], [x + 30 + 360 * bp, y + 90], [x + 30 + 360 * bp, y + 140], [x + 30, y + 140]], { col: CH.YELLOW, p: 0.6, gap: 10, w: 10, over: 3 }, { col: CH.INK, w: 5.4, p: 0.85, boil: 0.7 });
        pageText(G.p2.l, `${Math.round(bp * 100)}%`, x + 210, y + 220, { size: 44, align: 'center', reveal: seg(bp, 0.85, 1) });
      }
      if (tp > 22.4) CH.star(G.p2, x + 390, y + 60, 34, CH.ORANGE, 180);
    }
  }
  if (tp > 21.5) {
    part(G.p2, [[912, 1608], [988, 1608], [988, 1620], [912, 1620]], { col: CH.OCHRE, p: 0.6, ang: 0.4, gap: 8, w: 8, over: 3 }, { col: CH.INK, w: 5, p: 0.85, boil: 0.8 });
    CH.minh(G.p2, 950, 1620, 0.52, 'sit-point', 7);
  }
  const cu = seg(tp, 23.4, 24.6);
  if (cu > 0) {
    part(G.p2, [[1040, 1920], [1080, 1856 - cu * 24], [1080, 1920]], { col: CH.OCHRE, p: 0.7, gap: 8, w: 8, over: 2 }, { col: CH.INK, w: 5, p: 0.85, boil: 0.6 });
    fillShadow([[1000 + cu * 20, 1920], [1080, 1800 - cu * 30], [1080, 1920]]);
  }
}

// ═══════════════ PAGE 3 — dây chuyền PCTPR (25.5–43.4) ═══════════════
const ST3 = [
  ['ChatGPT', 'lập kế hoạch', 26.4], ['Claude', 'phân tích tài liệu', 27.2],
  ['Gemini', 'nghiên cứu', 31.7], ['GPTs·Gems', 'trợ lý nhỏ', 32.5],
];
const CHIP3 = [['tóm tắt họp', 34.3], ['kiểm tra lỗi', 35.1], ['kế hoạch tuần', 35.9]];
const docRideX = tp => tp < 33.9 ? 190 : tp > 37.0 ? 880 : lerp(190, 880, seg(tp, 33.9, 37.0));
function drawP3(t) {
  const tp = Math.min(t, TURN.p4 + 0.7);
  const docX = docRideX(tp);
  const railEnd = tp < 33.9 ? seg(tp, 26.3, 26.9) * 880 + 100 : Math.min(980, docX + 120);
  line(G.p3.l, [[100, 980], [100 + (railEnd - 100), 980]], { col: CH.INK, w: 8, p: 0.85, seed: 201, boil: 0.8 });
  line(G.p3.l, [[100, 998], [100 + (railEnd - 100) * 0.96, 998]], { col: CH.BROWN, w: 5, p: 0.5, draw: seg(tp, 26.4, 27.0), seed: 202, boil: 0.7 });
  ST3.forEach(([name, role, t0], i) => {
    const x = 190 + i * 230;
    const dp = seg(tp, t0 - 0.25, t0 + 0.15);
    if (dp <= 0) return;
    CH.robot(G.p3, x, 1060, 0.62, tp >= t0 ? 'awake' : 'sleep', 210 + i, i % 2 ? CH.PEACH : CH.SKY);
    pageText(G.p3.l, name, x, 1128, { size: 32, align: 'center', reveal: seg(tp, t0, t0 + 0.4), seed: 220 + i });
    pageText(G.p3.l, role, x, 1162, { size: 24, align: 'center', reveal: seg(tp, t0 + 0.15, t0 + 0.55), col: CH.BROWN, seed: 230 + i });
  });
  CHIP3.forEach(([s, t0], i) => {
    const cp = seg(tp, t0, t0 + 0.35);
    if (cp <= 0) return;
    const y = 1245 + i * 62;
    part(G.p3, [[690, y - 26], [690 + 330 * cp, y - 26], [690 + 330 * cp, y + 22], [690, y + 22]], { col: CH.WHITE, p: 0.75, gap: 9, w: 8, over: 2 }, { col: CH.INK, w: 5.4, p: 0.85, boil: 0.8 });
    pageText(G.p3.l, s, 720, y + 8, { size: 28, reveal: seg(cp, 0.4, 1), seed: 240 + i });
  });
  if (tp >= 33.9 && tp <= 37.0) CH.docFace(G.p3, docX, 952, 0.42, 'happy', 250, 78, 100);
  if (tp > 38.4) {
    part(G.p3, [[215, 1488], [285, 1488], [285, 1500], [215, 1500]], { col: CH.OCHRE, p: 0.6, ang: 0.4, gap: 8, w: 8, over: 3 }, { col: CH.INK, w: 5, p: 0.85, boil: 0.8 });
    for (const dx of [227, 273]) part(G.p3, tube([[dx, 1500], [dx, 1580]], 10, 8), { col: CH.BROWN, p: 0.55, ang: 1.2, gap: 7, w: 7, over: 3 }, { col: CH.INK, w: 4.6, p: 0.85, boil: 0.8 });
    CH.minh(G.p3, 250, 1500, 0.6, 'sit-point', 8);
  }
  const h100 = seg(tp, 39.2, 40.7);
  if (h100 > 0) pageText(G.p3.l, '100', 430, 380, { size: 210, align: 'center', reveal: h100, seed: 260, p: 0.95, stroke: 3 });
  if (tp > 40.9) line(G.p3.l, bez([[520, 430], [640, 510], [610, 590], [480, 640]], 12), { col: CH.INK, w: 9, p: 0.9, draw: seg(tp, 40.9, 41.6), seed: 262 });
  const h40 = seg(tp, 41.7, 42.4);
  if (h40 > 0) {
    const burst = seg(tp, 42.0, 42.9);
    if (burst > 0) dab(G.p3.f, 480, 640, 120 * burst, { col: CH.ORANGE, p: 0.3, seed: 264, gap: 16, w: 12, ang: 0.9 });
    pageText(G.p3.l, '40', 480, 700, { size: 160, align: 'center', reveal: h40, col: CH.RED, p: 0.95, seed: 266, stroke: 3 });
    if (tp > 42.4) line(G.p3.l, handCircle(480, 640, 150, 268, 0.15, 26), { col: CH.ORANGE, w: 8, p: 0.8, draw: seg(tp, 42.5, 43.2), seed: 268 });
  }
}

// ═══════════════ PAGE 4 — ba thắng lợi & phòng sạch (43.4–53.9) ═══════════════
function drawP4(t) {
  const tp = Math.min(t, TURN.back + 0.7);
  const VX = [90, 410, 730], VW = 290;
  const titles = ['biên bản gọn', 'báo cáo nhanh', 'đạt nghiệm thu'];
  for (let i = 0; i < 3; i++) {
    const x = VX[i];
    const od = seg(tp, 44.2 + i * 0.3, 44.7 + i * 0.3);
    if (od <= 0) continue;
    boxOutline(G.p4, x, 300, VW, 380, od, 300 + i);
    if (i === 0) {
      const shrink = 1 - seg(tp, 44.6, 45.4);
      if (shrink > 0) {
        const s = 0.5 + 0.55 * shrink;
        const bx = x + VW / 2, by = 430;
        part(G.p4, smooth([[bx - 90 * s, by - 46 * s], [bx - 30 * s, by - 64 * s], [bx + 40 * s, by - 60 * s], [bx + 88 * s, by - 40 * s], [bx + 60 * s, by - 12 * s], [bx, by - 4 * s], [bx - 64 * s, by - 10 * s]], 5, true), { col: CH.WHITE, p: 0.8, gap: 9, w: 8, over: 2 }, { col: CH.INK, w: 5.4, p: 0.85, boil: 0.7 });
        line(G.p4.l, [[bx - 10 * s, by], [bx - 24 * s, by + 26 * s]], { col: CH.INK, w: 4.4, p: 0.8, seed: 310, boil: 0.6 });
      }
      for (let l = 0; l < 3; l++) {
        const lp = seg(tp, 44.9 + l * 0.2, 45.4 + l * 0.2);
        if (lp <= 0) continue;
        line(G.p4.l, [[x + 40, 520 + l * 40], [x + 40 + (VW - 90) * lp, 520 + l * 40]], { col: CH.GREEN, w: 8, p: 0.6, seed: 320 + l, boil: 0.7 });
      }
    } else if (i === 1) {
      part(G.p4, [[x + 60, 380], [x + VW - 50, 380], [x + VW - 50, 600], [x + 60, 600]], { col: CH.WHITE, p: 0.8, gap: 10, w: 9, over: 3 }, { col: CH.INK, w: 5.6, p: 0.9, boil: 0.8 });
      const dp = seg(tp, 45.7, 46.5);
      for (let l = 0; l < 5; l++) {
        const lp = seg(dp, l / 5, (l + 1) / 5);
        if (lp <= 0) continue;
        line(G.p4.l, [[x + 80, 410 + l * 36], [x + 80 + (VW - 130) * lp, 410 + l * 36]], { col: CH.INK, w: 4, p: 0.55, seed: 330 + l, boil: 0.7 });
      }
      for (let s2 = 0; s2 < 3; s2++) {
        const sp = seg(tp, 45.7 + s2 * 0.1, 46.1 + s2 * 0.1);
        if (sp <= 0 || sp >= 1) continue;
        line(G.p4.l, [[x + VW - 40 + s2 * 14, 400 + s2 * 60], [x + VW + 20 + s2 * 14, 400 + s2 * 60]], { col: CH.SKY, w: 5, p: 0.6 * (1 - sp), seed: 340 + s2 });
      }
    } else {
      ['Đối chiếu nguồn', 'Kiểm định dạng', 'Rà lỗi trùng', 'Nghiệm thu'].forEach((s, k) => {
        const rp = seg(tp, 46.9 + k * 0.28, 47.25 + k * 0.28);
        if (rp <= 0) return;
        const yy = 360 + k * 72;
        pageText(G.p4.l, s, x + 80, yy + 8, { size: 28, reveal: rp });
        line(G.p4.l, [[x + 34, yy - 14], [x + 62, yy - 14], [x + 62, yy + 14], [x + 34, yy + 14], [x + 34, yy - 14]], { col: CH.INK, w: 4.4, p: 0.8, draw: rp, seed: 350 + k });
        const tk = seg(tp, 47.05 + k * 0.28, 47.32 + k * 0.28);
        if (tk > 0) line(G.p4.l, [[x + 38, yy], [x + 46, yy + 8], [x + 58, yy - 10]], { col: CH.GREEN, w: 6, p: 0.95, draw: tk, seed: 360 + k });
      });
    }
    pageText(G.p4.l, titles[i], x + VW / 2, 730, { size: 30, align: 'center', reveal: seg(tp, 44.9 + i * 0.5, 45.5 + i * 0.5), col: CH.BROWN, seed: 370 + i });
  }
  if (tp > 48.9) {
    CH.windowSun(G.p4, 190, 560, 220, 190, 21);
    CH.shelf(G.p4, 800, 780, 260, 22);
    CH.plant(G.p4, 1000, 790, 23);
    line(G.p4.l, [[60, 1560], [1020, 1560]], { col: CH.BROWN, w: 7, p: 0.6, draw: seg(tp, 49.0, 49.6), seed: 380, boil: 0.6 });
    CH.minh(G.p4c, 480, 1520, 1.05, 'stand-draw', 9);
    const st = seg(tp, 50.6, 52.2);
    if (st > 0) {
      dab(G.p4c.f, 760, 1260, 130 * st, { col: CH.YELLOW, p: 0.22, seed: 390, gap: 18, w: 12, ang: 0.7 });
      CH.star(G.p4c, 760, 1260, 90 * st, CH.ORANGE, 392);
    }
  }
}

// ═══════════════ PAGE 5 — bìa sách & CTA (57.0–60.0) ═══════════════
function drawCover(t) {
  const tp = Math.min(t, DUR);
  const fp = seg(tp, 57.75, 58.5);
  if (fp <= 0) return;
  part(G.cover, [[0, 0], [1080, 0], [1080, 1920], [0, 1920]], { col: CH.OCHRE, p: 0.75, ang: 0.5, gap: 13, w: 13, over: 5, cross: true, crossP: 0.55, draw: fp }, null);
  part(G.cover, [[0, 0], [96, 0], [96, 1920], [0, 1920]], { col: CH.BROWN, p: 0.6, gap: 11, w: 10, over: 3, draw: seg(tp, 58.2, 58.7) }, { col: CH.INK, w: 6, p: 0.85, boil: 0.6 });
  pageText(G.cover.l, 'PCTPR', 600, 330, { size: 64, align: 'center', reveal: seg(tp, 58.0, 58.5), seed: 401 });
  ['Muốn dùng AI bài bản', 'từ System Prompt', 'đến kiểm chứng chất lượng?'].forEach((s, i) =>
    pageText(G.cover.l, s, 600, 730 + i * 92, { size: 56, align: 'center', reveal: seg(tp, 58.1 + i * 0.45, 58.8 + i * 0.45), seed: 402 + i }));
  if (tp > 59.0) CH.star(G.cover, 600, 1130, 70 * seg(tp, 59.0, 59.5), CH.WHITE, 405);
  if (tp > 58.6) CH.crayonBox(G.cover, 600, 1700, 0.95, 406);
}

// ═══════════════ WASH — the film's only watercolour (rose-gold) ═══════════════
function drawWash(t) {
  if (t < 54.8 || t > 57.3) return false;
  const g = G.wash.g;
  clear(G.wash);
  const REST = [-320, 240, 800, 1360];
  for (let k = 0; k < 4; k++) {
    const p = seg(t, 54.9 + k * 0.22, 56.2 + k * 0.22);
    if (p <= 0) continue;
    const top = lerp(-680, REST[k], eio(p));
    g.beginPath();
    const steps = 26;
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * 1080;
      const wob = (vnoise(i * 0.7 + k * 13) - 0.5) * 46;
      i === 0 ? g.moveTo(x, top + wob) : g.lineTo(x, top + wob);
    }
    for (let i = steps; i >= 0; i--) {
      const x = (i / steps) * 1080;
      const wob = (vnoise(i * 0.7 + k * 13 + 5) - 0.5) * 46;
      g.lineTo(x, top + 620 + wob);
    }
    g.closePath();
    g.fillStyle = 'rgba(255,255,255,0.55)';
    g.fill();
    if (p < 1) { g.fillStyle = 'rgba(255,255,255,0.28)'; g.fillRect(0, top + 560, 1080, 60); }
  }
  const R2 = mulberry(99);
  for (let i = 0; i < 22; i++) {
    const y = R2() * 1920, x = R2() * 900, len = 120 + R2() * 260;
    g.fillStyle = 'rgba(255,255,255,0.16)';
    g.fillRect(x, y, len, 3);
  }
  return true;
}

// ═══ subtitles: the book's printed words ═══
function drawSubs(t) {
  let cue = null;
  for (const c of SUB_ON) if (t >= c.t0 - 0.1 && t <= c.t1 + 0.62) { cue = c; break; }
  if (!cue) return;
  const a = Math.min(seg(t, cue.t0 - 0.1, cue.t0 + 0.25), 1 - seg(t, cue.t1 + 0.44, cue.t1 + 0.62));
  if (a <= 0) return;
  const lines = wrapN(burned(cue.sub), 48);
  const y0 = 1790 - (lines.length - 1) * 30;
  const patch = smooth([[50, y0 - 60], [1030, y0 - 64], [1046, y0 + 44 + lines.length * 8], [40, y0 + 50 + lines.length * 8]], 5, true);
  part(G.sub, patch, null, null, { occ: false, kn: true });
  lines.forEach((s, i) => text(G.sub.l, s, 540, y0 + i * 56, { font: 'Patrick Hand', col: CH.INK, size: 44, align: 'center', reveal: seg(t, cue.t0 - 0.05, cue.t0 + 0.32), seed: 600 + i, p: 0.96, boil: 1 }));
}

// ═══════════════ FRAME ═══════════════
export function frame(t) {
  BOIL.step = Math.floor(t * 12 + 1e-6);
  BOIL.amp = (t >= 13.3 && t < 16.8) || (t >= 48.8 && t < 53.9) || t >= 56.5 ? 0.5 : 1;
  shadowUsed = false;
  setCam(t);
  clearAll();
  comp.begin([0.957, 0.937, 0.890], [0, 0]);
  comp.paperCam(CAM.x, CAM.y, 1 / CAM.s);

  const page = curPage(t);
  const turn = turnState(t);
  const plan = [];
  const deskP = seg(t, 56.95, 57.7);
  if (deskP > 0) {
    part(G.desk, [[-400, -300], [1480, -300], [1480, 2280], [-400, 2280]], { col: CH.BROWN, p: 0.4, ang: 0.3, gap: 16, w: 14, over: 4, boil: 0.5, draw: deskP }, null);
    part(G.desk, [[-320, 1760], [1400, 1760], [1400, 2140], [-320, 2140]], { col: CH.OCHRE, p: 0.45, gap: 15, w: 13, over: 4, boil: 0.5, draw: deskP }, { col: CH.INK, w: 6, p: 0.7, boil: 0.5, draw: deskP });
    plan.push(['group', G.desk]);
  }
  if (turn) {
    drawPageNum(turn.next, pageFreeze(turn.next));
    plan.push(['group', gp(turn.next)]);
    const off = turn.dir * turn.p * 130;
    const poly = turn.dir > 0
      ? [[-40 + off * 0.7, 200], [40 + off, 200], [40 + off, 1920], [-40 + off * 0.7, 1920]]
      : [[1040 + off * 0.7, 200], [1120 + off, 200], [1120 + off, 1920], [1040 + off * 0.7, 1920]];
    fillShadow(poly);
    plan.push(['crayonF', G.shadow]);
    CAM.x += off * 0.55; CAM.y -= turn.p * 60; CAM.s *= 1 - 0.05 * turn.p;
    drawPageNum(turn.old, pageFreeze(turn.old));
    CAM.x -= off * 0.55; CAM.y += turn.p * 60; CAM.s /= 1 - 0.05 * turn.p;
    plan.push(['group', gp(turn.old)]);
    if (turn.old === 1 && t > 54.9 && drawWash(t)) plan.push(['wash']);
  } else if (page === 1 && t >= 53.9) {
    drawP1(17.0, true);
    plan.push(['group', G.p1]);
    if (drawWash(t)) plan.push(['wash']);
    drawP1CharsRevisit();
    plan.push(['group', G.p1c]);
  } else {
    drawPageNum(page, t);
    plan.push(['group', gp(page)]);
    if (shadowUsed) plan.push(['crayonF', G.shadow]);
    if (page === 1) plan.push(['group', G.p1c]);
    if (page === 4) plan.push(['group', G.p4c]);
  }
  drawSubs(t);
  plan.push(['group', G.sub]);
  for (const [kind, C] of plan) {
    if (kind === 'group') comp.group(C);
    else if (kind === 'crayonF') comp.crayon(C.f ? C.f.c : C.c);
    else if (kind === 'wash') comp.wash(G.wash.c, { color: [0.99, 0.72, 0.44], resist: 0.93, edge: 1.6, gran: 0.6 });
  }
  const lamp = t >= 57.6 ? [0.55, 0.42, 0.85, seg(t, 57.6, 58.8) * 0.45] : [0.5, 0.5, 1, 0];
  comp.finish({ vig: 0.3, emb: 0.5, poff: [0, 0], lift: 1, lamp });
}
function drawPageNum(k, t) {
  if (k === 1) drawP1(t);
  else if (k === 2) drawP2(t);
  else if (k === 3) drawP3(t);
  else if (k === 4) drawP4(t);
  else drawCover(t);
}

// ── on-screen text registry (readcheck; stable ids; speech-mirroring hero text is SRT-governed) ──
export function TEXTS(t) {
  const out = [];
  const push = (id, s, x0, y0, x1, y1) => out.push({ id, text: s, x0, y0, x1, y1 });
  if (t > 18.7 && t < 25.4) push('p2title', 'HỆ THỐNG MỚI', 340, 200, 740, 280);
  ST3.forEach(([name, role, t0], i) => {
    if (t > t0 + 0.6 && t < 43.0) {
      const x = 190 + i * 230;
      push(`st${i}name`, name, x - 110, 1090, x + 110, 1130);
      push(`st${i}role`, role, x - 110, 1135, x + 110, 1170);
    }
  });
  CHIP3.forEach(([s, t0], i) => { if (t > t0 + 0.4 && t < 43.0) push(`chip${i}`, s, 700, 1215 + i * 62, 1015, 1255 + i * 62); });
  ['biên bản gọn', 'báo cáo nhanh', 'đạt nghiệm thu'].forEach((s, i) => {
    if (t > 45.0 + i * 0.5 && t < 53.3) push(`vt${i}`, s, [90, 410, 730][i], 700, [90, 410, 730][i] + 290, 745);
  });
  return out;
}
