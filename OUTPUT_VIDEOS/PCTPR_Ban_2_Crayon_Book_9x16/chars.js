// chars.js — original characters & props for «Cuốn sổ thần kỳ của team» (crayon-book)
// Minh (office worker), 4 helper robots, a worried document, paper stacks, desk & room props.
// Child-logic: ~2.6 heads tall, dot eyes with white-wax catchlight, mitten hands, tube limbs,
// faces on objects. Substitution acting: a new drawing per pose, on the beat (no in-betweens).
// Layer discipline: colour (dab) → C.f, outline strokes (line) → C.l, occluding parts → part(C,…).
import { clamp, hash } from '/core/lib.js';
import { line, dab, text, handCircle, bez, smooth, xf } from './crayon.js';
import { part, tube, curve } from './rig.js';

export const INK = '#2d3263', YELLOW = '#f5c63c', ORANGE = '#ec8a3c', RED = '#d4483c',
  PINK = '#ee8ea4', PEACH = '#f4c7a4', BROWN = '#7a4b31', OCHRE = '#e7b867',
  GREEN = '#62a24c', SKY = '#79acd9', VIOLET = '#6a5aa6', WHITE = '#fbfaf4';

// ── Minh — pose substitution on the beat ──
export function minh(C, x, y, s, pose, seed = 1) {
  const L = (pts, o) => line(C.l, pts, { seed: seed * 13 + 1, w: 7 * s, p: 0.85, boil: 1, ...o });
  // torso
  const torso = smooth([[x - 26 * s, y - 8 * s], [x - 30 * s, y - 78 * s], [x + 30 * s, y - 78 * s], [x + 26 * s, y - 8 * s]], 6);
  part(C, torso, { col: pose === 'stand-proud' ? YELLOW : PEACH, p: 0.62, ang: 0.9, gap: 11 * s, w: 12 * s, over: 5 * s }, { col: INK, w: 7 * s, p: 0.85, boil: 1 });
  // legs + shoes
  const legs = pose.startsWith('sit')
    ? [[curve([[x - 16 * s, y - 6 * s], [x - 20 * s, y + 34 * s], [x + 6 * s, y + 36 * s]], 5), curve([[x + 16 * s, y - 6 * s], [x + 22 * s, y + 34 * s], [x + 2 * s, y + 36 * s]], 5)]]
    : [[curve([[x - 12 * s, y - 6 * s], [x - 16 * s, y + 52 * s], [x - 14 * s, y + 92 * s]], 5), curve([[x + 12 * s, y - 6 * s], [x + 16 * s, y + 52 * s], [x + 14 * s, y + 92 * s]], 5)]];
  for (const leg of legs) for (const lp of leg) {
    part(C, tube(lp, 17 * s, 13 * s), { col: VIOLET, p: 0.55, ang: 1.2, gap: 9 * s, w: 10 * s, over: 4 * s }, { col: INK, w: 6.4 * s, p: 0.8, boil: 1 });
    const tip = lp[lp.length - 1];
    part(C, xf(handCircle(tip[0] + 8 * s, tip[1] + 4 * s, 13 * s, seed + 4, 0.1, 18), { sx: 1.35 }), { col: RED, p: 0.7, gap: 6 * s, w: 8 * s, over: 3 * s }, { col: INK, w: 6 * s, p: 0.85 });
  }
  // arms + mitten hands
  const arms = [];
  const shL = [x - 26 * s, y - 66 * s], shR = [x + 26 * s, y - 66 * s];
  if (pose === 'sit-worry') {
    arms.push(curve([shL, [x - 46 * s, y - 26 * s], [x - 30 * s, y + 2 * s]], 5));
    arms.push(curve([shR, [x + 46 * s, y - 26 * s], [x + 30 * s, y + 2 * s]], 5));
  } else if (pose === 'sit-type') {
    arms.push(curve([shL, [x - 44 * s, y - 30 * s], [x - 20 * s, y - 12 * s]], 5));
    arms.push(curve([shR, [x + 44 * s, y - 30 * s], [x + 20 * s, y - 12 * s]], 5));
  } else if (pose === 'sit-up' || pose === 'sit-look') {
    arms.push(curve([shL, [x - 48 * s, y - 34 * s], [x - 34 * s, y - 6 * s]], 5));
    arms.push(curve([shR, [x + 48 * s, y - 34 * s], [x + 34 * s, y - 6 * s]], 5));
  } else if (pose === 'sit-point') {
    arms.push(curve([shL, [x - 48 * s, y - 30 * s], [x - 32 * s, y - 4 * s]], 5));
    arms.push(curve([shR, [x + 52 * s, y - 84 * s], [x + 72 * s, y - 118 * s]], 5));
  } else if (pose === 'stand-proud') {
    arms.push(curve([shL, [x - 52 * s, y - 40 * s], [x - 44 * s, y - 8 * s]], 5));
    arms.push(curve([shR, [x + 52 * s, y - 40 * s], [x + 44 * s, y - 8 * s]], 5));
  } else if (pose === 'stand-draw') {
    arms.push(curve([shL, [x - 50 * s, y - 38 * s], [x - 40 * s, y - 8 * s]], 5));
    arms.push(curve([shR, [x + 54 * s, y - 60 * s], [x + 78 * s, y - 52 * s]], 5));
  } else {
    arms.push(curve([shL, [x - 50 * s, y - 36 * s], [x - 46 * s, y - 6 * s]], 5));
    arms.push(curve([shR, [x + 50 * s, y - 36 * s], [x + 46 * s, y - 6 * s]], 5));
  }
  arms.forEach((arm, ai) => {
    part(C, tube(arm, 15 * s, 12 * s), { col: PEACH, p: 0.6, ang: 1.1, gap: 9 * s, w: 9 * s, over: 4 * s }, { col: INK, w: 6.4 * s, p: 0.8, boil: 1 });
    const tip = arm[arm.length - 1], handR = 20 * s;
    part(C, handCircle(tip[0], tip[1], handR, seed + ai, 0.08, 18), { col: PEACH, p: 0.72, gap: 6 * s, w: 8 * s, over: 2 * s }, { col: INK, w: 6 * s, p: 0.85 });
    if (pose === 'sit-point' && ai === 1) L([[tip[0] + handR * 0.6, tip[1] - handR * 0.25], [tip[0] + handR * 1.35, tip[1] - handR * 0.6]], { col: PEACH, w: 9 * s, p: 0.95 });
    if (pose === 'stand-draw' && ai === 1) { // big crayon in the mitten
      const cx = tip[0] + handR * 1.1, cy = tip[1] - handR * 0.3;
      part(C, xf([[-28 * s, -9 * s], [28 * s, -9 * s], [28 * s, 9 * s], [-28 * s, 9 * s]], { x: cx, y: cy, r: -0.35, s: 1 }), { col: ORANGE, p: 0.8, ang: 0.4, gap: 7 * s, w: 8 * s, over: 3 * s }, { col: INK, w: 5.6 * s, p: 0.85 });
    }
  });
  // head last (occludes shoulders)
  const hx = x + (pose === 'sit-point' || pose === 'stand-draw' ? 4 * s : 0);
  const headR = 52 * s;
  const hy = y - 78 * s - headR + 6 * s;
  part(C, handCircle(hx, hy, headR, seed + 9, 0.09, 30), { col: PEACH, p: 0.62, ang: 0.5, gap: 12 * s, w: 12 * s, over: 4 * s }, { col: INK, w: 7 * s, p: 0.9, boil: 1 });
  // bold hair mass — fill only, then outline its OUTER edge (never a band across the forehead)
  const hair = smooth([[hx - headR * 1.02, hy - headR * 0.08], [hx - headR * 0.72, hy - headR * 1.02], [hx + headR * 0.5, hy - headR * 1.1], [hx + headR * 1.02, hy - headR * 0.02]], 6, false);
  part(C, hair, { col: BROWN, p: 0.85, ang: 2.2, gap: 8, w: 10, over: 3, cross: true, crossP: 0.6 }, null);
  L([[hx - headR * 1.04, hy - headR * 0.06], [hx - headR * 0.74, hy - headR * 1.0], [hx + headR * 0.48, hy - headR * 1.08], [hx + headR * 1.04, hy - headR * 0.0]], { col: INK, w: 6.2 * s, p: 0.9 });
  // face: dot eyes + white-wax catchlights, pink cheeks, brows & mouth by mood
  const up = pose.includes('up') || pose === 'sit-point' || pose === 'stand-draw';
  const worry = pose === 'sit-worry';
  const proud = pose === 'stand-proud' || pose === 'stand-draw';
  const ey = hy + 6 * s, edx = 20 * s, er = 6.5 * s;
  const eyOff = up ? -8 * s : 0;
  dab(C.f, hx - edx, ey + eyOff, er, { col: INK, p: 0.95, seed: seed + 21, ang: 0.3, gap: 4 * s, w: 5 * s });
  dab(C.f, hx + edx, ey + eyOff, er, { col: INK, p: 0.95, seed: seed + 22, ang: 0.3, gap: 4 * s, w: 5 * s });
  dab(C.f, hx - edx + 2 * s, ey + eyOff - 2 * s, 2.4 * s, { col: WHITE, p: 0.9, seed: seed + 23, gap: 3 * s, w: 4 * s });
  dab(C.f, hx + edx + 2 * s, ey + eyOff - 2 * s, 2.4 * s, { col: WHITE, p: 0.9, seed: seed + 24, gap: 3 * s, w: 4 * s });
  dab(C.f, hx - 36 * s, ey + 16 * s, 9 * s, { col: PINK, p: 0.55, seed: seed + 25, ang: 0.6, gap: 5 * s, w: 6 * s });
  dab(C.f, hx + 36 * s, ey + 16 * s, 9 * s, { col: PINK, p: 0.55, seed: seed + 26, ang: 0.6, gap: 5 * s, w: 6 * s });
  const byOff = worry ? 14 * s : proud ? 20 * s : 17 * s;
  const tilt = worry ? 5 * s : 0;
  L([[hx - edx - 10 * s, ey - byOff - tilt], [hx - edx + 10 * s, ey - byOff + tilt]], { col: INK, w: 5 * s });
  L([[hx + edx - 10 * s, ey - byOff + tilt], [hx + edx + 10 * s, ey - byOff - tilt]], { col: INK, w: 5 * s });
  if (worry) L(bez([[hx - 16 * s, ey + 30 * s], [hx - 6 * s, ey + 24 * s], [hx + 6 * s, ey + 34 * s], [hx + 16 * s, ey + 28 * s]], 8), { col: INK, w: 5 * s });
  else if (proud) L(bez([[hx - 16 * s, ey + 26 * s], [hx, ey + 40 * s], [hx + 16 * s, ey + 26 * s], [hx + 1 * s, ey + 27 * s]], 8), { col: INK, w: 5 * s });
  else L([[hx - 12 * s, ey + 30 * s], [hx + 12 * s, ey + 30 * s]], { col: INK, w: 5 * s });
}

// ── helper robot ──
export function robot(C, x, y, s, mood, seed = 1, bodyCol = SKY) {
  const w = 150 * s, h = 170 * s;
  part(C, [[x - w / 2, y - h], [x + w / 2, y - h], [x + w / 2, y], [x - w / 2, y]], { col: bodyCol, p: 0.5, ang: 0.7, gap: 12 * s, w: 11 * s, over: 4 * s }, { col: INK, w: 7 * s, p: 0.9, boil: 1 });
  for (const dx of [-w * 0.28, w * 0.28]) {
    part(C, handCircle(x + dx, y + 8 * s, 17 * s, seed + dx, 0.1, 16), { col: INK, p: 0.6, gap: 5 * s, w: 7 * s, over: 2 * s }, { col: INK, w: 5.6 * s, p: 0.9 });
  }
  const ax = x, ay = y - h;
  line(C.l, [[ax, ay], [ax, ay - 34 * s]], { col: INK, w: 6 * s, p: 0.85, seed: seed + 31 });
  part(C, handCircle(ax, ay - 42 * s, 10 * s, seed + 32, 0.1, 14), { col: RED, p: 0.8, gap: 5 * s, w: 6 * s, over: 2 * s }, { col: INK, w: 5.2 * s, p: 0.9 });
  const fy = y - h * 0.62;
  if (mood === 'awake') {
    dab(C.f, x - 26 * s, fy, 12 * s, { col: WHITE, p: 0.95, seed: seed + 41, gap: 5 * s, w: 6 * s });
    dab(C.f, x + 26 * s, fy, 12 * s, { col: WHITE, p: 0.95, seed: seed + 42, gap: 5 * s, w: 6 * s });
    dab(C.f, x - 26 * s, fy + 1 * s, 6.5 * s, { col: INK, p: 0.95, seed: seed + 43, gap: 4 * s, w: 5 * s });
    dab(C.f, x + 26 * s, fy + 1 * s, 6.5 * s, { col: INK, p: 0.95, seed: seed + 44, gap: 4 * s, w: 5 * s });
    line(C.l, bez([[x - 18 * s, fy + 26 * s], [x, fy + 38 * s], [x + 18 * s, fy + 26 * s], [x + 1 * s, fy + 27 * s]], 8), { col: INK, w: 5 * s, p: 0.85, seed: seed + 45 });
  } else {
    line(C.l, [[x - 34 * s, fy], [x - 14 * s, fy]], { col: INK, w: 5 * s, p: 0.85, seed: seed + 46 });
    line(C.l, [[x + 14 * s, fy], [x + 34 * s, fy]], { col: INK, w: 5 * s, p: 0.85, seed: seed + 47 });
    line(C.l, [[x - 10 * s, fy + 30 * s], [x + 10 * s, fy + 30 * s]], { col: INK, w: 5 * s, p: 0.8, seed: seed + 48 });
  }
  for (const side of [-1, 1]) {
    part(C, handCircle(x + side * (w / 2 + 14 * s), y - h * 0.35, 15 * s, seed + side, 0.08, 16), { col: bodyCol, p: 0.65, gap: 6 * s, w: 7 * s, over: 2 * s }, { col: INK, w: 5.6 * s, p: 0.85 });
  }
  part(C, handCircle(x, y - h * 0.2, 8 * s, seed + 61, 0.1, 12), { col: YELLOW, p: 0.8, gap: 4 * s, w: 5 * s, over: 2 * s }, { col: INK, w: 4.6 * s, p: 0.85 });
}

// ── document with a face ──
export function docFace(C, x, y, s, mood, seed = 1, w = 120, h = 150) {
  const fold = 26 * s;
  const poly = [[x - w / 2 * s, y - h * s], [x + w / 2 * s - fold, y - h * s], [x + w / 2 * s, y - h * s + fold], [x + w / 2 * s, y], [x - w / 2 * s, y]];
  part(C, poly, { col: WHITE, p: 0.85, ang: 0.6, gap: 10 * s, w: 9 * s, over: 3 * s }, { col: INK, w: 6.4 * s, p: 0.9, boil: 1 });
  line(C.l, [[x + w / 2 * s - fold, y - h * s], [x + w / 2 * s - fold, y - h * s + fold], [x + w / 2 * s, y - h * s + fold]], { col: INK, w: 5 * s, p: 0.8, seed: seed + 3 });
  const ey = y - h * s * 0.62, fy = y - h * s * 0.4;
  dab(C.f, x - 16 * s, ey, 6 * s, { col: INK, p: 0.95, seed: seed + 11, gap: 4 * s, w: 5 * s });
  dab(C.f, x + 16 * s, ey, 6 * s, { col: INK, p: 0.95, seed: seed + 12, gap: 4 * s, w: 5 * s });
  if (mood === 'worried') {
    line(C.l, [[x - 26 * s, ey - 16 * s], [x - 8 * s, ey - 10 * s]], { col: INK, w: 4.4 * s, p: 0.85, seed: seed + 13 });
    line(C.l, [[x + 26 * s, ey - 16 * s], [x + 8 * s, ey - 10 * s]], { col: INK, w: 4.4 * s, p: 0.85, seed: seed + 14 });
    line(C.l, bez([[x - 12 * s, fy], [x, fy - 8 * s], [x + 12 * s, fy], [x + 1 * s, fy - 1 * s]], 8), { col: INK, w: 4.4 * s, p: 0.85, seed: seed + 15 });
  } else if (mood === 'happy') {
    line(C.l, bez([[x - 13 * s, fy - 4 * s], [x, fy + 8 * s], [x + 13 * s, fy - 4 * s], [x + 1 * s, fy - 3 * s]], 8), { col: INK, w: 4.4 * s, p: 0.85, seed: seed + 16 });
    dab(C.f, x - 28 * s, ey + 12 * s, 6 * s, { col: PINK, p: 0.5, seed: seed + 17, gap: 4 * s, w: 5 * s });
    dab(C.f, x + 28 * s, ey + 12 * s, 6 * s, { col: PINK, p: 0.5, seed: seed + 18, gap: 4 * s, w: 5 * s });
  } else {
    line(C.l, [[x - 11 * s, fy], [x + 11 * s, fy]], { col: INK, w: 4.4 * s, p: 0.8, seed: seed + 19 });
  }
  for (let i = 0; i < 3; i++) line(C.l, [[x - w / 2 * s + 14 * s, y - h * s * 0.18 + i * 12 * s], [x + w / 2 * s - 40 * s, y - h * s * 0.18 + i * 12 * s]], { col: INK, w: 3.4 * s, p: 0.5, seed: seed + 20 + i, boil: 0.6 });
}

// ── paper stack (sheets draw on one by one; colouring the stack = the mess growing) ──
export function paperStack(C, x, baseY, n, drawP, seed = 1, sheetW = 130) {
  const hS = 16;
  const nShow = clamp(drawP * n);
  for (let i = 0; i < Math.floor(nShow) + (nShow % 1 > 0.05 ? 1 : 0); i++) {
    const yy = baseY - i * (hS + 3);
    const jitter = (hash(seed * 3 + i * 7) - 0.5) * 10;
    const col = i % 3 === 1 ? OCHRE : WHITE;
    const wS = sheetW * (1 - i * 0.01);
    const poly = [[x - wS / 2 + jitter, yy - hS], [x + wS / 2 + jitter, yy - hS], [x + wS / 2 + jitter, yy], [x - wS / 2 + jitter, yy]];
    part(C, poly, { col, p: 0.72, ang: 0.4 + 0.2 * (i % 2), gap: 7, w: 8, over: 3 }, { col: INK, w: 5.4, p: 0.85, boil: 0.8 });
    if (i % 2 === 0) line(C.l, [[x - wS / 2 + 16 + jitter, yy - hS / 2], [x + wS / 2 - 26 + jitter, yy - hS / 2]], { col: INK, w: 3.2, p: 0.45, seed: seed + i, boil: 0.6 });
  }
}

// ── desk & room props ──
export function desk(C, x, y, w, seed = 1) {
  part(C, [[x - w / 2, y - 26], [x + w / 2, y - 26], [x + w / 2, y], [x - w / 2, y]], { col: OCHRE, p: 0.68, ang: 0.25, gap: 10, w: 10, over: 4 }, { col: INK, w: 6.6, p: 0.9, boil: 0.8 });
  for (const dx of [-w / 2 + 26, w / 2 - 26]) {
    part(C, tube([[x + dx, y], [x + dx, y + 120]], 15, 13), { col: BROWN, p: 0.6, ang: 1.3, gap: 8, w: 8, over: 3 }, { col: INK, w: 5.8, p: 0.85, boil: 0.8 });
  }
}
export function monitor(C, x, y, w, mood, seed = 1) {
  const h = w * 0.68;
  part(C, [[x - w / 2, y - h], [x + w / 2, y - h], [x + w / 2, y], [x - w / 2, y]], { col: WHITE, p: 0.8, ang: 0.5, gap: 9, w: 8, over: 3 }, { col: INK, w: 6.6, p: 0.9 });
  part(C, [[x - 20, y], [x + 20, y], [x + 26, y + 26], [x - 26, y + 26]], { col: SKY, p: 0.5, gap: 7, w: 7, over: 2 }, { col: INK, w: 5.4, p: 0.85, boil: 0.7 });
  const rows = mood === 'tired' ? 5 : 4;
  for (let i = 0; i < rows; i++) {
    const yy = y - h + 24 + i * (h - 40) / rows;
    const len = (w - 40) * (0.5 + hash(seed + i * 3) * 0.45);
    line(C.l, [[x - w / 2 + 20, yy], [x - w / 2 + 20 + len, yy + (hash(seed + i) - 0.5) * 3]], { col: INK, w: 3.2, p: 0.42, seed: seed + 5 + i, boil: 0.6 });
  }
  if (mood === 'tired') {
    line(C.l, [[x - 26, y - h + 14], [x - 10, y - h + 18]], { col: INK, w: 4, p: 0.8, seed: seed + 21 });
    line(C.l, [[x + 26, y - h + 14], [x + 10, y - h + 18]], { col: INK, w: 4, p: 0.8, seed: seed + 22 });
    line(C.l, bez([[x - 10, y - 22], [x, y - 30], [x + 10, y - 22], [x + 1, y - 23]], 6), { col: INK, w: 4, p: 0.8, seed: seed + 23 });
  }
}
export function shelf(C, x, y, w, seed = 1) {
  part(C, [[x - w / 2, y - 10], [x + w / 2, y - 10], [x + w / 2, y], [x - w / 2, y]], { col: OCHRE, p: 0.7, ang: 0.2, gap: 8, w: 9, over: 3 }, { col: INK, w: 6, p: 0.9, boil: 0.7 });
  for (let i = 0; i < 3; i++) {
    const bx = x - w / 2 + 30 + i * 56;
    part(C, [[bx, y - 84], [bx + 40, y - 84], [bx + 40, y - 10], [bx, y - 10]], { col: [SKY, GREEN, YELLOW][i], p: 0.55, ang: 0.6 + i * 0.3, gap: 8, w: 8, over: 3 }, { col: INK, w: 5.4, p: 0.85, boil: 0.7 });
    line(C.l, [[bx + 8, y - 66], [bx + 32, y - 66]], { col: INK, w: 3, p: 0.5, seed: seed + i, boil: 0.5 });
  }
}
export function plant(C, x, y, seed = 1) {
  part(C, [[x - 26, y - 40], [x + 26, y - 40], [x + 20, y], [x - 20, y]], { col: ORANGE, p: 0.6, ang: 0.8, gap: 8, w: 8, over: 3 }, { col: INK, w: 5.8, p: 0.85 });
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.4;
    const tip = [x + Math.cos(a) * 60, y - 40 + Math.sin(a) * 74];
    line(C.l, curve([[x, y - 44], [x + Math.cos(a) * 26, y - 40 + Math.sin(a) * 40], tip], 4), { col: GREEN, w: 8, p: 0.8, seed: seed + i, boil: 0.8 });
    dab(C.f, tip[0], tip[1], 12, { col: GREEN, p: 0.6, seed: seed + 10 + i, ang: 1.2, gap: 6, w: 7 });
  }
}
export function windowSun(C, x, y, w, h, seed = 1) {
  part(C, [[x - w / 2, y - h], [x + w / 2, y - h], [x + w / 2, y], [x - w / 2, y]], { col: SKY, p: 0.35, ang: 0.4, gap: 12, w: 9, over: 2 }, { col: INK, w: 6, p: 0.85, boil: 0.7 });
  line(C.l, [[x, y - h], [x, y]], { col: INK, w: 4.4, p: 0.7, seed: seed + 1, boil: 0.6 });
  part(C, handCircle(x - w / 4, y - h / 2, 20, seed + 2, 0.1, 18), { col: YELLOW, p: 0.8, gap: 6, w: 6, over: 2 }, { col: INK, w: 4.6, p: 0.8, boil: 0.6 });
}
export function crayonBox(C, x, y, s, seed = 1) {
  const w = 150 * s, h = 46 * s;
  part(C, [[x - w / 2, y - h], [x + w / 2, y - h], [x + w / 2, y], [x - w / 2, y]], { col: VIOLET, p: 0.6, ang: 0.5, gap: 9 * s, w: 9 * s, over: 3 * s }, { col: INK, w: 6 * s, p: 0.9, boil: 0.7 });
  for (let i = 0; i < 5; i++) {
    const cx = x - w / 2 + 22 * s + i * (w - 44 * s) / 4;
    part(C, xf([[-6 * s, -20 * s], [6 * s, -20 * s], [6 * s, 14 * s], [-6 * s, 14 * s]], { x: cx, y: y - h - 4 * s, r: (i - 2) * 0.12 }), { col: [RED, YELLOW, GREEN, SKY, ORANGE][i], p: 0.75, gap: 5 * s, w: 6 * s, over: 2 * s }, { col: INK, w: 4.4 * s, p: 0.8, boil: 0.6 });
  }
}
export function star(C, x, y, r, col = ORANGE, seed = 1) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  part(C, smooth(pts, 4, false), { col, p: 0.8, ang: 0.5, gap: 6, w: 7, over: 3 }, { col: INK, w: 5.6, p: 0.9, boil: 0.8 });
}
