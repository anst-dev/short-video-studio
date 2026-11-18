// engine.js — Dark Tech Keynote engine, adapted for the 1080x1920 portrait stage of this film.
// Near-black gradient stage + hairline grid + soft light + rounded UI panels + ONE accent (lime #B7F34A);
// light-sweep reveal, scramble digits, snap flight, 2.5D plane transform. All drawing deterministic (seeded).
import { clamp, lerp, seg, ss, eo, ei, back, spring, mulberry, hash, TAU } from '/core/lib.js';
export { clamp, lerp, seg, ss, eo, ei, back, spring, mulberry, hash, TAU };

export const W = 1080, H = 1920;
export const PAL = {
  bg0: '#0A0B0F', bg1: '#151822', surf: '#12151C', surf2: '#1A1E28', surf3: '#222734',
  line: 'rgba(255,255,255,.08)', hi: 'rgba(255,255,255,.10)',
  text: '#E8EAF0', dim: '#8A90A0', mute: '#5C6272',
  accent: '#B7F34A', red: '#FF5A5F', cool: '#3B4CCA',
};
export const FONT = { ui: 'Inter', disp: 'InterTight', mono: 'JBMono' };
export function setAccent(hex) { PAL.accent = hex; }
export const font = (px, wt = 500, fam = 'ui') => `${wt} ${px}px ${FONT[fam] || fam}`;
export function rgba(hex, a) {
  if (hex.startsWith('rgba')) return hex;
  const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
}
export function mix(h1, h2, t) {
  const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16);
  const c = s => Math.round(lerp(a >> s & 255, b >> s & 255, t));
  return `rgb(${c(16)},${c(8)},${c(0)})`;
}

// ── canvas tools ──
const _pool = {};
export function buf(name, w = W, h = H) {
  let c = _pool[name];
  if (!c || c.width !== w || c.height !== h) { c = _pool[name] = document.createElement('canvas'); c.width = Math.max(2, Math.ceil(w)); c.height = Math.max(2, Math.ceil(h)); }
  const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none';
  return [c, g];
}
export function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }

// ── stage / grid / glow ──
export function bg(g, o = {}) {
  const { lift = 1, cool = 1, dark = 0, cx = W * 0.5, cy = H * 0.30 } = o;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = PAL.bg0; g.fillRect(0, 0, W, H);
  let gr = g.createRadialGradient(cx, cy, 0, cx, cy, W * 1.05);
  gr.addColorStop(0, rgba(PAL.bg1, 0.95 * lift)); gr.addColorStop(1, rgba(PAL.bg0, 0));
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (cool > 0) glow(g, W * 0.82, H * 0.10, 900, PAL.cool, 0.08 * cool);
  if (dark > 0) { g.fillStyle = `rgba(4,5,7,${dark})`; g.fillRect(0, 0, W, H); }
  g.restore();
}
export function glow(g, x, y, r, color, a) {
  if (a <= 0 || r <= 0) return;
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, rgba(color, a)); gr.addColorStop(0.45, rgba(color, a * 0.35)); gr.addColorStop(1, rgba(color, 0));
  g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
}
export function grid(g, o = {}) {
  const { ox = 0, oy = 0, scale = 1, module = 48, alpha = 1, major = 4, rect = [0, 0, W, H], color = '255,255,255' } = o;
  const step = module * scale; if (step < 4 || alpha <= 0) return;
  const [rx, ry, rw, rh] = rect;
  g.save(); g.beginPath(); g.rect(rx, ry, rw, rh); g.clip(); g.lineWidth = 1;
  const i0 = Math.floor((rx - ox) / step), i1 = Math.ceil((rx + rw - ox) / step);
  const j0 = Math.floor((ry - oy) / step), j1 = Math.ceil((ry + rh - oy) / step);
  for (let pass = 0; pass < 2; pass++) {
    g.strokeStyle = `rgba(${color},${(pass ? 0.06 : 0.032) * alpha})`; g.beginPath();
    for (let i = i0; i <= i1; i++) { if ((i % major === 0) !== !!pass) continue; const x = Math.round(ox + i * step) + 0.5; g.moveTo(x, ry); g.lineTo(x, ry + rh); }
    for (let j = j0; j <= j1; j++) { if ((j % major === 0) !== !!pass) continue; const y = Math.round(oy + j * step) + 0.5; g.moveTo(rx, y); g.lineTo(rx + rw, y); }
    g.stroke();
  }
  g.restore();
}
export function vignette(g, a = 0.5) {
  const gr = g.createRadialGradient(W / 2, H / 2, W * 0.5, W / 2, H / 2, H * 0.72);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${a})`);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
}

// ── panels ──
export function panel(g, x, y, w, h, o = {}) {
  const { r = 14, fill = PAL.surf, fill2 = null, stroke = PAL.line, shadow = 1, cheap = false, hi = 1, alpha = 1 } = o;
  g.save(); g.globalAlpha *= alpha;
  if (shadow > 0) {
    if (cheap) { g.fillStyle = `rgba(0,0,0,${0.35 * shadow})`; rr(g, x + 2, y + h * 0.06 + 4, w, h, r); g.fill(); }
    else { g.shadowColor = `rgba(0,0,0,${0.55 * shadow})`; g.shadowBlur = Math.min(70, 14 + h * 0.14); g.shadowOffsetY = Math.min(30, 5 + h * 0.05); g.fillStyle = fill; rr(g, x, y, w, h, r); g.fill(); g.shadowColor = 'transparent'; }
  }
  const gr = g.createLinearGradient(0, y, 0, y + h);
  gr.addColorStop(0, fill2 || mix(fill.startsWith('#') ? fill : '#12151C', '#2A3040', 0.25)); gr.addColorStop(Math.min(1, 60 / Math.max(h, 1)), fill); gr.addColorStop(1, fill);
  g.fillStyle = gr; rr(g, x, y, w, h, r); g.fill();
  g.lineWidth = 1; g.strokeStyle = stroke; rr(g, x + 0.5, y + 0.5, w - 1, h - 1, r); g.stroke();
  if (hi > 0) { g.strokeStyle = `rgba(255,255,255,${0.07 * hi})`; g.beginPath(); g.moveTo(x + r, y + 1.5); g.lineTo(x + w - r, y + 1.5); g.stroke(); }
  g.restore();
}

// ── accent caret / spark ──
export function caret(g, x, y, h, o = {}) {
  const { sx: kx = 1, sy = 1, on = 1, glow: gl = 1, color = PAL.accent, alpha = 1, wr = 1 / 14 } = o;
  if (on <= 0.001 || alpha <= 0) return;
  const w = Math.max(2, h * wr) * kx, hh = h * sy;
  g.save(); g.globalAlpha *= alpha * on;
  if (gl > 0) { glow(g, x, y, hh * 0.9 * gl, color, 0.22 * gl); g.shadowColor = rgba(color, 0.9); g.shadowBlur = hh * 0.22 * gl; }
  g.fillStyle = color; rr(g, x - w / 2, y - hh / 2, w, hh, Math.min(w / 2, 4 + h * 0.01)); g.fill();
  g.shadowColor = 'transparent'; g.restore();
}

// ── app glyphs (original vector marks; no OS emoji) ──
const APPS = [
  { c: '#5B7CFA', g: 'bubble' }, { c: '#8C6CF0', g: 'cal' }, { c: '#2FB6A6', g: 'bell' }, { c: '#E0A33A', g: 'star' },
  { c: '#4C9BE8', g: 'mail' }, { c: '#D0668A', g: 'doc' }, { c: '#6E7890', g: 'gear' },
];
export function appIcon(g, x, y, s, k) {
  const a = APPS[((k % APPS.length) + APPS.length) % APPS.length];
  const gr = g.createLinearGradient(0, y, 0, y + s); gr.addColorStop(0, mix(a.c, '#ffffff', 0.15)); gr.addColorStop(1, mix(a.c, '#000000', 0.25));
  g.fillStyle = gr; rr(g, x, y, s, s, s * 0.26); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.92)'; g.fillStyle = 'rgba(255,255,255,.92)'; g.lineWidth = Math.max(1, s * 0.08); g.lineCap = 'round';
  const cx = x + s / 2, cy = y + s / 2, u = s * 0.22;
  g.beginPath();
  switch (a.g) {
    case 'bubble': g.ellipse(cx, cy - u * 0.1, u * 1.2, u * 0.9, 0, 0, TAU); g.fill(); break;
    case 'cal': g.rect(cx - u, cy - u * 0.8, u * 2, u * 1.8); g.stroke(); g.beginPath(); g.moveTo(cx - u, cy - u * 0.2); g.lineTo(cx + u, cy - u * 0.2); g.stroke(); break;
    case 'bell': g.arc(cx, cy, u, Math.PI, 0); g.lineTo(cx + u * 1.2, cy + u * 0.7); g.lineTo(cx - u * 1.2, cy + u * 0.7); g.closePath(); g.fill(); break;
    case 'star': for (let i = 0; i < 10; i++) { const r = i % 2 ? u * 0.5 : u * 1.2, an = -Math.PI / 2 + i * Math.PI / 5; g.lineTo(cx + Math.cos(an) * r, cy + Math.sin(an) * r); } g.closePath(); g.fill(); break;
    case 'mail': g.rect(cx - u * 1.2, cy - u * 0.8, u * 2.4, u * 1.6); g.moveTo(cx - u * 1.2, cy - u * 0.8); g.lineTo(cx, cy + u * 0.1); g.lineTo(cx + u * 1.2, cy - u * 0.8); g.stroke(); break;
    case 'doc': g.rect(cx - u * 0.8, cy - u, u * 1.6, u * 2); g.stroke(); for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(cx - u * 0.45, cy - u * 0.45 + i * u * 0.5); g.lineTo(cx + u * 0.45, cy - u * 0.45 + i * u * 0.5); g.stroke(); } break;
    default: g.arc(cx, cy, u, 0, TAU); g.stroke(); g.beginPath(); g.arc(cx, cy, u * 0.35, 0, TAU); g.fill();
  }
}
export function badge(g, x, y, text, s = 1, o = {}) {
  const { color = PAL.red } = o;
  g.save(); g.font = font(13 * s, 700); const w = Math.max(20 * s, g.measureText(text).width + 12 * s), h = 20 * s;
  g.fillStyle = color; g.shadowColor = rgba(color, 0.5); g.shadowBlur = 8 * s; rr(g, x - w / 2, y - h / 2, w, h, h / 2); g.fill(); g.shadowColor = 'transparent';
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, x, y + 0.5 * s); g.restore();
  return w;
}
export function notif(g, x, y, w, h, o = {}) {
  const { app = 0, title = 'Nhắc nhở', body = 'Bạn có 3 tin nhắn chưa đọc', time = 'bây giờ', cheap = true, bd = null, alpha = 1 } = o;
  g.save(); g.globalAlpha *= alpha;
  panel(g, x, y, w, h, { r: h * 0.24, fill: '#1A1E28', cheap, shadow: 1 });
  const s = h * 0.46; appIcon(g, x + h * 0.22, y + (h - s) / 2, s, app);
  const tx = x + h * 0.22 + s + h * 0.18;
  g.textBaseline = 'alphabetic'; g.fillStyle = PAL.text; g.font = font(h * 0.2, 600); g.fillText(title, tx, y + h * 0.42);
  g.fillStyle = PAL.dim; g.font = font(h * 0.18, 400); g.fillText(body, tx, y + h * 0.7);
  g.fillStyle = PAL.mute; g.font = font(h * 0.15, 500); g.textAlign = 'right'; g.fillText(time, x + w - h * 0.2, y + h * 0.38);
  if (bd) badge(g, x + h * 0.22 + s, y + (h - s) / 2, bd, h / 76);
  g.restore();
}
export function fileIcon(g, x, y, s, o = {}) {
  const { name = 'Tep_moi.txt', ext = 'TXT', tint = '#8A90A0', cheap = true, label = true } = o;
  const w = 44 * s, h = 56 * s, x0 = x - w / 2, y0 = y - h / 2 - 8 * s, f = 12 * s;
  g.save();
  if (cheap) { g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, x0 + 2 * s, y0 + 4 * s, w, h, 5 * s); g.fill(); }
  const gr = g.createLinearGradient(0, y0, 0, y0 + h); gr.addColorStop(0, '#E9ECF3'); gr.addColorStop(1, '#B9BFCC');
  g.fillStyle = gr; g.beginPath(); g.moveTo(x0 + 5 * s, y0); g.lineTo(x0 + w - f, y0); g.lineTo(x0 + w, y0 + f); g.lineTo(x0 + w, y0 + h - 5 * s);
  g.quadraticCurveTo(x0 + w, y0 + h, x0 + w - 5 * s, y0 + h); g.lineTo(x0 + 5 * s, y0 + h); g.quadraticCurveTo(x0, y0 + h, x0, y0 + h - 5 * s); g.lineTo(x0, y0 + 5 * s); g.quadraticCurveTo(x0, y0, x0 + 5 * s, y0); g.fill();
  g.fillStyle = '#9EA5B4'; g.beginPath(); g.moveTo(x0 + w - f, y0); g.lineTo(x0 + w - f, y0 + f); g.lineTo(x0 + w, y0 + f); g.fill();
  g.fillStyle = tint; rr(g, x0 + 5 * s, y0 + h - 19 * s, w - 10 * s, 12 * s, 3 * s); g.fill();
  g.fillStyle = '#fff'; g.font = font(8 * s, 700); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ext, x, y0 + h - 13 * s);
  g.fillStyle = 'rgba(40,46,60,.28)'; for (let i = 0; i < 3; i++) g.fillRect(x0 + 8 * s, y0 + (14 + i * 6) * s, (w - 18 * s) * (i === 2 ? 0.6 : 1), 2 * s);
  if (label) { g.font = font(9 * s, 500, 'mono'); g.fillStyle = PAL.text; g.textBaseline = 'top'; g.textAlign = 'center'; g.fillText(name.length > 18 ? name.slice(0, 17) + '…' : name, x, y0 + h + 5 * s); }
  g.restore();
}
export function windowBox(g, x, y, w, h, o = {}) {
  const { title = 'Không tên', app = 6, cheap = false, alpha = 1, r = 14, bar = 40 } = o;
  g.save(); g.globalAlpha *= alpha;
  panel(g, x, y, w, h, { r, fill: PAL.surf, cheap, shadow: 1 });
  g.fillStyle = 'rgba(255,255,255,.025)'; rr(g, x + 1, y + 1, w - 2, bar, r); g.fill();
  g.fillStyle = PAL.line; g.fillRect(x, y + bar, w, 1);
  appIcon(g, x + 14, y + bar / 2 - 9, 18, app);
  g.fillStyle = PAL.dim; g.font = font(14, 500); g.textBaseline = 'middle'; g.fillText(title, x + 42, y + bar / 2 + 0.5);
  g.restore();
  return [x, y + bar + 1, w, h - bar - 1];
}
export function windowContent(g, rect, kind, o = {}) {
  const [x, y, w, h] = rect, { seed = 1, n = 6, scroll = 0, text = '', unread = 0 } = o;
  const R = mulberry(seed * 131 + 7);
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  if (kind === 'inbox') {
    const rh = 40; const off = scroll % rh;
    for (let i = -1; i < h / rh + 1; i++) {
      const yy = y + i * rh - off + 8, k = i + Math.floor(scroll / rh);
      if (hash(k * 3.1 + seed) < 0.6 || k < unread) { g.fillStyle = '#5B8CFF'; g.beginPath(); g.arc(x + 16, yy + 14, 4, 0, TAU); g.fill(); }
      g.fillStyle = PAL.text; g.font = font(13, 600); g.textBaseline = 'alphabetic';
      g.fillText(['Họp nhóm lúc 15:00', 'Re: Báo cáo tuần', 'Đề xuất ngân sách Q4', 'Biên bản họp 12/10', 'Nhắc hạn chót KPI', 'Phản hồi khách hàng', 'Cập nhật tiến độ', 'Tin nhắn chưa đọc'][(k % 8 + 8) % 8], x + 30, yy + 19);
      g.fillStyle = PAL.mute; g.fillRect(x + 30, yy + 26, w * (0.4 + hash(k * 1.7) * 0.4), 5);
      g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(x + 12, yy + rh - 8, w - 24, 1);
    }
  } else if (kind === 'sheet') {
    const cw = 62, ch = 26; g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 1;
    for (let i = 0; i <= w / cw; i++) { g.beginPath(); g.moveTo(x + i * cw + 0.5, y); g.lineTo(x + i * cw + 0.5, y + h); g.stroke(); }
    for (let j = 0; j <= h / ch; j++) { g.beginPath(); g.moveTo(x, y + j * ch + 0.5); g.lineTo(x + w, y + j * ch + 0.5); g.stroke(); }
    g.fillStyle = PAL.dim; g.font = font(11, 500, 'mono'); g.textBaseline = 'middle';
    for (let j = 0; j < h / ch; j++) for (let i = 0; i < w / cw; i++) if (R() < 0.55) g.fillText(String(Math.floor(R() * 9000 + 100)), x + i * cw + 8, y + j * ch + 13);
  } else if (kind === 'chat') {
    for (let i = 0; i < n; i++) {
      const me = R() < 0.4, bw = w * (0.35 + R() * 0.3), yy = y + 12 + i * 40;
      g.fillStyle = me ? 'rgba(91,124,250,.35)' : 'rgba(255,255,255,.07)'; rr(g, me ? x + w - bw - 14 : x + 14, yy, bw, 30, 14); g.fill();
    }
  } else if (kind === 'code') {
    for (let i = 0; i < h / 20; i++) { const ind = Math.floor(R() * 4) * 16; g.fillStyle = `rgba(255,255,255,${0.05 + R() * 0.08})`; g.fillRect(x + 20 + ind, y + 12 + i * 20, (w - 56 - ind) * (0.2 + R() * 0.7), 8); }
  } else if (kind === 'note') {
    g.fillStyle = 'rgba(255,255,255,.035)'; g.fillRect(x, y, w, h);
    for (let i = 0; i < h / 24 - 1; i++) { g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(x + 20, y + 22 + i * 24, (w - 40) * (0.4 + R() * 0.55), 7); }
  }
  g.restore();
}

// ── snap flight ──
export function flyPose(from, to, p, o = {}) {
  const { over = 1.35 } = o; const q = back(p, over), r = spring(p * 1.2, 9, 0.42);
  return { x: lerp(from.x, to.x, q), y: lerp(from.y, to.y, q), rot: lerp(from.rot || 0, to.rot || 0, clamp(r)), s: lerp(from.s ?? 1, to.s ?? 1, eo(p)), morph: ss(seg(p, 0.15, 0.7)) };
}

// ── light-sweep reveal ──
export function lightReveal(g, src, dx, dy, dw, dh, p, o = {}) {
  const { base = 0.07, angle = 0.62, soft = 220, band = 80, glint = 0.5, keep = 1 } = o;
  if (p >= 1) { g.drawImage(src, dx, dy, dw, dh); return; }
  const [c, t] = buf('reveal', dw, dh);
  const ca = Math.cos(angle), sa = Math.sin(angle);
  const L = Math.abs(dw * ca) + Math.abs(dh * sa);
  const front = -soft + p * (L + soft * 2);
  const cx = dw / 2, cy = dh / 2;
  const p0 = [cx - ca * L / 2, cy - sa * L / 2], at = d => [p0[0] + ca * d, p0[1] + sa * d];
  t.drawImage(src, 0, 0, dw, dh);
  t.globalCompositeOperation = 'destination-in';
  const A = at(front - soft), B = at(front);
  let gr = t.createLinearGradient(A[0], A[1], B[0], B[1]);
  gr.addColorStop(0, `rgba(0,0,0,${keep})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
  t.fillStyle = gr; t.fillRect(0, 0, dw, dh);
  g.save(); g.globalAlpha = base; g.drawImage(src, dx, dy, dw, dh); g.globalAlpha = 1; g.drawImage(c, dx, dy); g.restore();
  if (glint > 0 && p > 0 && p < 1) {
    const [c2, t2] = buf('reveal2', dw, dh);
    t2.drawImage(src, 0, 0, dw, dh); t2.globalCompositeOperation = 'source-in';
    const A2 = at(front - band * 1.6), B2 = at(front + band * 0.4);
    const g2 = t2.createLinearGradient(A2[0], A2[1], B2[0], B2[1]);
    g2.addColorStop(0, 'rgba(255,255,255,0)'); g2.addColorStop(0.7, `rgba(235,240,255,${glint})`); g2.addColorStop(1, 'rgba(255,255,255,0)');
    t2.fillStyle = g2; t2.fillRect(0, 0, dw, dh);
    g.save(); g.globalCompositeOperation = 'lighter'; g.drawImage(c2, dx, dy); g.restore();
  }
}

// ── scramble digits ──
const GLYPH = '0123456789#%/*+=<>?$&@ABCDEFXZ';
export function scramble(g, text, x, y, t, locks, o = {}) {
  const { px = 200, wt = 600, fam = 'disp', color = PAL.text, colorOf = null, align = 'left', tracking = -0.04, start = -1e9, fps = 24 } = o;
  g.save(); g.font = font(px, wt, fam); g.textBaseline = 'alphabetic';
  const tw = [...text].map(c => g.measureText(c).width);
  const adv = tw.map(w => w + tracking * px), total = adv.reduce((a, b) => a + b, 0) - tracking * px;
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const f = Math.floor(t * fps);
  [...text].forEach((ch, i) => {
    const lk = locks[i] ?? locks[locks.length - 1], col = colorOf ? colorOf(i) : color;
    if (t < start) { cx += adv[i]; return; }
    const isDigit = /[0-9%]/.test(ch);
    if (t < lk && isDigit) {
      const gch = GLYPH[Math.floor(hash(f * 13.7 + i * 91.3) * GLYPH.length)];
      g.fillStyle = col;
      for (let k = 0; k < 3; k++) { g.globalAlpha = [0.85, 0.3, 0.14][k]; g.fillText(gch, cx + (tw[i] - g.measureText(gch).width) / 2, y - k * px * 0.09); }
      g.globalAlpha = 1;
    } else if (t >= lk || !isDigit) {
      if (!isDigit && t < lk) { cx += adv[i]; return; }
      const d = t - lk, dy = d < 0.3 ? -px * 0.12 * Math.exp(-d * 14) * Math.cos(d * 40) : 0;
      g.fillStyle = col; g.globalAlpha = clamp(d * 30 + 0.4); g.fillText(ch, cx, y + dy); g.globalAlpha = 1;
    }
    cx += adv[i];
  });
  g.restore();
  return total;
}

// ── caption toast (portrait): balanced wrap to ≤2 lines, bottom-centre pill + accent speaking dot ──
export function wrap2(text, maxChars = 52) {
  const t = text.trim();
  if (t.length <= maxChars) return [t];
  const mid = Math.floor(t.length / 2);
  let best = -1, bestD = 1e9;
  for (let i = 0; i < t.length; i++) if (t[i] === ' ') { const d = Math.abs(i - mid); if (d < bestD) { bestD = d; best = i; } }
  const a = t.slice(0, best).trim(), b = t.slice(best + 1).trim();
  if (Math.max(a.length, b.length) <= maxChars + 10) return [a, b];
  // 3 lines fallback (never expected: cues are pre-trimmed)
  const third = Math.floor(t.length / 3);
  let p1 = best = -1; bestD = 1e9;
  for (let i = 0; i < t.length; i++) if (t[i] === ' ' && Math.abs(i - third) < bestD) { bestD = Math.abs(i - third); p1 = i; }
  let p2 = -1; bestD = 1e9;
  for (let i = p1 + 1; i < t.length; i++) if (t[i] === ' ' && Math.abs(i - 2 * third) < bestD) { bestD = Math.abs(i - 2 * third); p2 = i; }
  return [t.slice(0, p1).trim(), t.slice(p1 + 1, p2).trim(), t.slice(p2 + 1).trim()];
}
export function toast(g, text, a, o = {}) {
  if (a <= 0) return;
  const { y = H - 150, px = 30, dense = 0, speaking = true } = o;
  const lines = wrap2(text);
  g.save(); g.font = font(px, 500);
  const lh = px * 1.34;
  const tw = Math.max(...lines.map(s => g.measureText(s).width));
  const h = px * 1.7 + lh * (lines.length - 1), w = tw + px * 2.6, x = W / 2 - w / 2, yy = y - h + (1 - eo(a)) * 12;
  g.globalAlpha = eo(a);
  g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 34; g.shadowOffsetY = 9;
  g.fillStyle = `rgba(12,14,19,${0.72 + 0.16 * dense})`; rr(g, x, yy, w, h, h / 2 > 34 ? 34 : h / 2); g.fill(); g.shadowColor = 'transparent';
  g.strokeStyle = 'rgba(255,255,255,.09)'; g.lineWidth = 1; rr(g, x + 0.5, yy + 0.5, w - 1, h - 1, h / 2 > 34 ? 34 : h / 2); g.stroke();
  const cy = yy + h / 2 - (lines.length - 1) * lh / 2;
  if (speaking) {
    g.fillStyle = PAL.accent; g.shadowColor = rgba(PAL.accent, 0.8); g.shadowBlur = 10;
    g.beginPath(); g.arc(x + px * 0.95, cy + 1, px * 0.14, 0, TAU); g.fill(); g.shadowColor = 'transparent';
  }
  g.fillStyle = PAL.text; g.textBaseline = 'middle'; g.textAlign = 'left';
  lines.forEach((s, i) => g.fillText(s, x + px * 1.5, cy + i * lh + 1));
  g.restore();
  return { x, y: yy, w, h, lines };
}

// ── flat plane camera (stage coords → screen) ──
export function withCam(g, cam, fn) {
  const { x = W / 2, y = H / 2, s = 1, rot = 0, sx: jx = 0, sy: jy = 0 } = cam;
  g.save(); g.translate(W / 2 + jx, H / 2 + jy); g.rotate(rot); g.scale(s, s); g.translate(-x, -y); fn(); g.restore();
}
