// film.js — Dark Tech Keynote: AI Office Workflow Transformation (60.0s @ 24fps, 120 BPM)
import * as E from './engine.js';
const {
  W, H, PAL, font, rgba, mix, buf, rr, bg, glow, grid, vignette,
  panel, litShape, sparklePath, trail, caret, appIcon, badge, notif,
  fileIcon, windowBox, windowContent, storageBar, flyPose, lightReveal, perspective,
  scramble, toast, camera, clamp, lerp, seg, ss, eo, ei, eio, back, spring, mulberry, hash, TAU
} = E;

export const DUR = 60.0;

// ───────────────────────── Procedural Chaos Dataset (26 Office Items) ─────────────────────────
function buildChaosItems() {
  const R = mulberry(20261118);
  const specs = [
    { kind: 'win', wkind: 'sheet', title: 'Bao_cao_tuan_v7_FINAL.xlsx', w: 460, h: 250, x: 310, y: 230, z: -0.06, rot: -0.055, badge: '#REF!' },
    { kind: 'win', wkind: 'inbox', title: 'Hộp thư đến — 47 chưa đọc', w: 440, h: 260, x: 1600, y: 245, z: -0.04, rot: 0.048, badge: '47' },
    { kind: 'win', wkind: 'chat', title: 'Nhóm Dự Án · Tin nhắn dồn dập', w: 410, h: 240, x: 330, y: 810, z: 0.05, rot: 0.042, badge: '19' },
    { kind: 'win', wkind: 'code', title: 'Bien_ban_hop_giao_ban_18trang.docx', w: 450, h: 240, x: 1580, y: 800, z: 0.04, rot: -0.05, badge: '18 TR' },
    { kind: 'notif', app: 4, title: 'KHẨN: Nộp báo cáo tổng hợp trước 17:00', body: 'Còn 3 bảng số liệu chi nhánh chưa khớp', time: 'vừa xong', x: 520, y: 120, z: 0.12, rot: -0.03, bd: '!' },
    { kind: 'notif', app: 0, title: 'Tin nhắn mới · Trưởng phòng Kinh doanh', body: '“Biên bản họp sáng nay xong chưa em ơi?”', time: '1 phút', x: 1410, y: 135, z: 0.14, rot: 0.035, bd: '9+' },
    { kind: 'notif', app: 2, title: 'Cảnh báo công thức · KPI_Thang11.xlsx', body: 'Phát hiện 14 ô lệch tổng tại Sheet Tổng_Hợp', time: '2 phút', x: 540, y: 900, z: 0.11, rot: 0.025, bd: '14' },
    { kind: 'notif', app: 1, title: 'Nhắc lịch họp · Họp rà soát tiến độ tuần', body: 'Chưa có người ghi biên bản & trích Action Items', time: '4 phút', x: 1390, y: 890, z: 0.10, rot: -0.028, bd: '3' },
  ];
  const files = [
    ['Bao_cao_Q4_sua3.xlsx', 'XLS', '#2FA866'], ['Bien_ban_14_11.docx', 'DOC', '#4C8BF5'],
    ['So_lieu_tho_CN1.csv', 'CSV', '#E09F3E'], ['Tong_hop_loi.xlsx', 'XLS', '#FF5A5F'],
    ['Email_khach_hang.eml', 'EML', '#5B7CFA'], ['Ghi_am_hop_90p.m4a', 'WAV', '#8C6CF0'],
    ['KPI_tuan45_nhap.xlsx', 'XLS', '#2FA866'], ['De_xuat_chua_duyet.pdf', 'PDF', '#E05A47'],
    ['Bien_ban_ban_giam_doc.docx', 'DOC', '#4C8BF5'], ['Bang_doi_soat_v9.xlsx', 'XLS', '#FF5A5F'],
    ['Note_hop_nhanh.txt', 'TXT', '#6E7890'], ['Slide_bao_cao_cu.pptx', 'PPT', '#E07A3A'],
    ['Checklist_thieu.xlsx', 'XLS', '#2FA866'], ['Log_tin_nhan_Zalo.txt', 'TXT', '#4C9BE8'],
    ['Du_toan_lech.xlsx', 'XLS', '#FF5A5F'], ['Bien_ban_tuan_truoc.docx', 'DOC', '#4C8BF5'],
    ['Tong_ket_thang.pdf', 'PDF', '#E05A47'], ['phan_cong_viec.xlsx', 'XLS', '#2FA866'],
  ];
  // Snap-grid target positions across the 4 coherent system modules (Scene 4: 16.5s)
  const modCenters = [
    [540, 345],   // Module 0: Dynamic Spreadsheet (XLS/CSV)
    [1380, 345],  // Module 1: KPI Dashboard
    [540, 715],   // Module 2: Acceptance Checklist (DOC/PDF)
    [1380, 715],  // Module 3: Moving Data Stream (EML/CHAT)
  ];
  const trailColors = ['#5EEAD4', '#60A5FA', '#B7F34A', '#A78BFA'];

  const all = [];
  specs.forEach((s, i) => {
    const grp = i % 4;
    all.push({
      ...s, id: i, spawnT: 0.04 + i * 0.065, grp,
      trailColor: trailColors[grp],
      targetX: modCenters[grp][0] + ((i % 3) - 1) * 120,
      targetY: modCenters[grp][1] + (Math.floor(i / 4) - 0.5) * 44,
    });
  });
  files.forEach(([name, ext, tint], k) => {
    const idx = specs.length + k;
    const ang = k * 2.39996 + 0.4;
    const radX = 340 + (k % 5) * 115, radY = 190 + ((k * 3) % 5) * 62;
    const grp = ext === 'XLS' || ext === 'CSV' ? 0 : ext === 'PDF' ? 1 : ext === 'DOC' ? 2 : 3;
    all.push({
      id: idx, kind: 'file', name, ext, tint,
      x: W / 2 + Math.cos(ang) * radX,
      y: H / 2 + Math.sin(ang) * radY,
      z: -0.10 + R() * 0.28,
      rot: (R() - 0.5) * 0.22,
      s: 0.92 + R() * 0.28,
      spawnT: 0.12 + k * 0.042,
      grp,
      trailColor: trailColors[grp],
      targetX: modCenters[grp][0] - 210 + ((k % 6) * 84),
      targetY: modCenters[grp][1] - 40 + (Math.floor(k / 6) * 48),
    });
  });
  return all;
}

// ───────────────────────── Vector Helpers (Zero OS Emojis!) ─────────────────────────
function checkBadge(g, cx, cy, r, p = 1, col = PAL.accent) {
  if (p <= 0) return;
  const s = back(clamp(p), 1.6);
  g.save(); g.translate(cx, cy); g.scale(s, s);
  glow(g, 0, 0, r * 2.2, col, 0.28);
  g.fillStyle = rgba(col, 0.18); g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
  g.strokeStyle = col; g.lineWidth = 1.8; g.stroke();
  g.beginPath(); g.moveTo(-r * 0.42, r * 0.02); g.lineTo(-r * 0.10, r * 0.34); g.lineTo(r * 0.46, -r * 0.30);
  g.lineWidth = Math.max(2, r * 0.2); g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke();
  g.restore();
}

function pillTag(g, x, y, text, col = PAL.accent, o = {}) {
  const { px = 13, align = 'left', fillA = 0.13, strokeA = 0.38 } = o;
  g.save(); g.font = font(px, 600, 'mono');
  if (g.letterSpacing !== undefined) g.letterSpacing = '1.4px';
  const tw = g.measureText(text).width, pw = tw + px * 1.8, ph = px * 2.05;
  const rx = align === 'center' ? x - pw / 2 : align === 'right' ? x - pw : x;
  g.fillStyle = rgba(col, fillA); rr(g, rx, y - ph / 2, pw, ph, ph / 2); g.fill();
  g.strokeStyle = rgba(col, strokeA); g.lineWidth = 1; rr(g, rx + 0.5, y - ph / 2 + 0.5, pw - 1, ph - 1, ph / 2); g.stroke();
  g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, rx + pw / 2, y + 0.5);
  g.restore();
  return pw;
}

function wrapText(g, str, x, y, maxW, lh) {
  const words = str.split(' ');
  let line = '', cy = y;
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + ' ' + words[i] : words[i];
    if (g.measureText(test).width > maxW && line) {
      g.fillText(line, x, cy);
      line = words[i];
      cy += lh;
    } else line = test;
  }
  if (line) g.fillText(line, x, cy);
}

function drawVectorNodeIcon(g, cx, cy, r, kind, col) {
  g.save(); g.translate(cx, cy);
  g.fillStyle = rgba(col, 0.14); rr(g, -r, -r, r * 2, r * 2, r * 0.5); g.fill();
  g.strokeStyle = rgba(col, 0.5); g.lineWidth = 1.2; rr(g, -r + 0.5, -r + 0.5, r * 2 - 1, r * 2 - 1, r * 0.5); g.stroke();
  g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 2; g.lineCap = 'round'; g.lineJoin = 'round';
  const u = r * 0.48;
  if (kind === 'plan') {
    // hierarchy tree
    g.strokeRect(-u, -u * 0.9, u * 0.8, u * 0.6);
    g.strokeRect(u * 0.2, -u * 0.1, u * 0.85, u * 0.55);
    g.strokeRect(u * 0.2, u * 0.6, u * 0.85, u * 0.55);
    g.beginPath(); g.moveTo(-u * 0.6, -u * 0.3); g.lineTo(-u * 0.6, u * 0.88); g.lineTo(u * 0.2, u * 0.88);
    g.moveTo(-u * 0.6, u * 0.18); g.lineTo(u * 0.2, u * 0.18); g.stroke();
  } else if (kind === 'doc') {
    // document scan
    g.strokeRect(-u * 0.85, -u, u * 1.7, u * 2);
    for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(-u * 0.48, i * u * 0.45); g.lineTo(u * 0.48, i * u * 0.45); g.stroke(); }
  } else if (kind === 'search') {
    // radar / research lens
    g.beginPath(); g.arc(-u * 0.15, -u * 0.15, u * 0.72, 0, TAU); g.stroke();
    g.beginPath(); g.moveTo(u * 0.38, u * 0.38); g.lineTo(u * 0.95, u * 0.95); g.stroke();
  } else {
    // 4-point AI spark
    const sp = sparklePath(0, 0, u * 1.15, 0.22, 0);
    g.fill(sp);
  }
  g.restore();
}

// ───────────────────────── Main Film Initialiser ─────────────────────────
export function initFilm(canvas, voTimeline) {
  const g = canvas.getContext('2d');
  const CHAOS = buildChaosItems();

  // Default cue timings if vo_timeline.json wasn't fetched yet
  const DEFAULT_VO = [
    { id: 'c00', t0: 0.60, t1: 4.46, sub: 'Team mọi người đã áp dụng AI để giảm được một nửa thời gian làm báo cáo với biên bản họp chưa?' },
    { id: 'c01', t0: 5.20, t1: 7.88, sub: 'Hay vẫn đang dùng AI chỉ để dịch thuật với viết caption?' },
    { id: 'c02', t0: 8.80, t1: 13.12, sub: 'Prompt ngắn → kết quả sáo rỗng → sửa tay liên tục → mất thời gian.' },
    { id: 'c03', t0: 16.80, t1: 22.82, sub: 'Biến hỗn loạn thành hệ thống mạch lạc: bảng tính động, dashboard KPI, checklist và luồng dữ liệu chuyển động.' },
    { id: 'c04', t0: 25.50, t1: 28.80, sub: 'Quy trình mới PCTPR: ChatGPT lập kế hoạch → Claude phân tích tài liệu.' },
    { id: 'c05', t0: 31.20, t1: 36.59, sub: 'Gemini hỗ trợ nghiên cứu → GPTs/Gems tóm tắt họp, kiểm tra lỗi dữ liệu & lập kế hoạch tuần.' },
    { id: 'c06', t0: 38.80, t1: 42.40, sub: 'Khối lượng công việc giảm từ 100% xuống còn 40%.' },
    { id: 'c07', t0: 43.40, t1: 47.70, sub: 'Biên bản họp tự động tóm tắt, báo cáo nhanh hơn, dữ liệu kiểm tra theo checklist nghiệm thu.' },
    { id: 'c08', t0: 48.80, t1: 52.80, sub: 'Không gian làm việc gọn gàng — nhân viên tập trung vào công việc giá trị cao thay vì giấy tờ.' },
    { id: 'c09', t0: 54.00, t1: 56.60, sub: 'Thời gian xử lý giấy tờ giảm thực tế 50-60%.' },
    { id: 'c10', t0: 57.05, t1: 59.65, sub: 'Muốn dùng AI bài bản từ System Prompt đến kiểm chứng chất lượng?' },
  ];
  const VO = (voTimeline && voTimeline.length ? voTimeline : DEFAULT_VO).map((c, idx, arr) => {
    const nextT0 = idx + 1 < arr.length ? arr[idx + 1].t0 - 0.12 : 59.92;
    const c0 = Math.max(0.05, c.t0 - 0.08);
    const c1 = Math.min(nextT0, Math.max(c.t1 + 0.55, c0 + 1.85));
    return { ...c, c0, c1 };
  });

  // ── Deterministic Sound Events (`window.EV`) ──
  const EV = [];
  CHAOS.forEach((it, idx) => EV.push({ t: +it.spawnT.toFixed(3), type: 'chaos_pop', pitch: 0.75 + (idx % 7) * 0.08, pan: (it.x - 960) / 960 * 0.7 }));
  EV.push(
    { t: 0.85, type: 'freeze' },
    { t: 0.92, type: 'sweep' },
    { t: 4.85, type: 'whoosh', dur: 0.28 },
    { t: 5.05, type: 'error_ping' },
    // Scene 3: 4 broken loop hits + keystrokes
    { t: 8.55, type: 'whoosh', dur: 0.30 },
    { t: 8.70, type: 'step_bad', idx: 0 },
    { t: 10.20, type: 'step_bad', idx: 1 },
    { t: 11.80, type: 'step_bad', idx: 2 },
    { t: 13.40, type: 'step_bad', idx: 3 },
    // Silence #1 at 15.80s -> Downbeat Snap Grid at 16.50s
    { t: 15.80, type: 'silence' },
    { t: 16.50, type: 'snap_impact' },
    { t: 16.68, type: 'shimmer' },
    { t: 17.30, type: 'module_lock', idx: 0 },
    { t: 17.55, type: 'module_lock', idx: 1 },
    { t: 17.80, type: 'module_lock', idx: 2 },
    { t: 18.05, type: 'module_lock', idx: 3 },
    // Scene 5: PCTPR 5 tokens + 4 AI engines
    { t: 25.00, type: 'whoosh', dur: 0.34 },
    { t: 25.25, type: 'token_tick', idx: 0 },
    { t: 25.42, type: 'token_tick', idx: 1 },
    { t: 25.59, type: 'token_tick', idx: 2 },
    { t: 25.76, type: 'token_tick', idx: 3 },
    { t: 25.93, type: 'token_tick', idx: 4 },
    { t: 26.40, type: 'ai_lock', idx: 0 },
    { t: 28.60, type: 'ai_lock', idx: 1 },
    { t: 31.30, type: 'ai_lock', idx: 2 },
    { t: 33.80, type: 'ai_lock', idx: 3 },
    // Scene 6: 100% -> 40% scramble + lock
    { t: 38.50, type: 'whoosh', dur: 0.26 },
    { t: 41.20, type: 'verdict_chime' },
    // Scene 7: 3 QA proof panels
    { t: 43.35, type: 'check_ding', idx: 0 },
    { t: 44.85, type: 'check_ding', idx: 1 },
    { t: 46.35, type: 'check_ding', idx: 2 },
    // Scene 8: Put-away + Silence #2 + 50-60% + CTA
    { t: 48.60, type: 'retract', idx: 0 },
    { t: 48.85, type: 'retract', idx: 1 },
    { t: 49.10, type: 'retract', idx: 2 },
    { t: 53.40, type: 'silence' },
    { t: 54.00, type: 'snap_impact' },
    { t: 54.12, type: 'sweep' },
    { t: 56.95, type: 'verdict_chime' },
    { t: 58.50, type: 'cursor_tick' },
    { t: 59.00, type: 'cursor_tick' },
  );
  for (let k = 0; k < 14; k++) EV.push({ t: +(39.0 + k * 0.15).toFixed(3), type: 'digit_grain', idx: k });
  for (let k = 0; k < 10; k++) EV.push({ t: +(8.85 + k * 0.08).toFixed(3), type: 'key_tap' });
  EV.sort((a, b) => a.t - b.t);
  window.DUR = DUR;
  window.EV = EV;

  // ── Draw single chaos item in world space ──
  function drawChaosItem(ctx, it, t, dimAlpha = 1) {
    ctx.save();
    ctx.translate(it.x, it.y);
    ctx.rotate(it.rot);
    ctx.globalAlpha *= dimAlpha;
    if (it.kind === 'win') {
      const r = windowBox(ctx, -it.w / 2, -it.h / 2, it.w, it.h, { title: it.title, app: it.id, cheap: true });
      windowContent(ctx, r, it.wkind, { seed: it.id + 3, scroll: t * 28, unread: 5 });
      if (it.badge) badge(ctx, it.w / 2 - 14, -it.h / 2 + 12, it.badge, 1.05);
    } else if (it.kind === 'notif') {
      notif(ctx, -210, -38, 420, 76, { app: it.app, title: it.title, body: it.body, time: it.time, badge: it.bd, cheap: true });
    } else {
      fileIcon(ctx, 0, 0, it.s * 1.18, { name: it.name, ext: it.ext, tint: it.tint, cheap: true });
    }
    ctx.restore();
  }

  // ───────────────────────── SCENE RENDERERS ─────────────────────────

  // SCENE 1 & 2 (0.0 – 8.5s): Chaos Accumulation -> Freeze Q1 -> Perspective Trivial AI Q2
  function renderChaosAndQuestions(t) {
    const inQ2 = t >= 4.85;
    const q2Morph = eio(seg(t, 4.80, 5.18));

    // 2.5D camera: pulls back in log space from 1.78 -> 0.96, freezes at 0.85s, pushes & shifts at 4.85s
    const tCam = t < 0.85 ? t : 0.85 + (t - 0.85) * 0.06;
    const zoom = lerp(Math.exp(lerp(Math.log(1.75), Math.log(0.95), eo(seg(tCam, 0, 0.85)))), 1.04, q2Morph);
    const dutch = lerp(-0.042 * (1 - 0.35 * seg(t, 0.85, 4.8)), 0.02, q2Morph);
    const cam = camera({
      x: lerp(960, 880, q2Morph),
      y: lerp(540, 520, q2Morph),
      zoom, rot: dutch,
      sx: t < 0.85 ? Math.sin(t * 43) * 3.5 : 0,
      sy: t < 0.85 ? Math.cos(t * 37) * 3.0 : 0,
    });

    bg(g, { lift: 0.95, cool: 0.8, dark: 0 });
    grid(g, { ox: W / 2 - cam.x * cam.zoom, oy: H / 2 - cam.y * cam.zoom, scale: cam.zoom, alpha: 0.95 });
    glow(g, 960, 460, 680, PAL.red, lerp(0.11, 0.14, q2Morph));

    // Depth-sorted 2.5D chaos layer
    const dim = t < 0.85 ? 1 : lerp(1, inQ2 ? 0.16 : 0.26, eo(seg(t, 0.85, 1.25)));
    const sorted = [...CHAOS].sort((a, b) => a.z - b.z);
    for (const it of sorted) {
      if (t < it.spawnT) continue;
      const sp = back(seg(t, it.spawnT, it.spawnT + 0.24), 1.45);
      const freezeT = Math.min(t, 0.88);
      g.save();
      cam.apply(g, it.z);
      g.translate(it.x, it.y);
      g.scale(sp, sp);
      g.translate(-it.x, -it.y);
      drawChaosItem(g, it, freezeT, dim);
      g.restore();
    }
    g.setTransform(1, 0, 0, 1, 0, 0);

    // Dark vignette veil when frozen so foreground Keynote card pops with crystal contrast
    if (t >= 0.82) {
      g.fillStyle = `rgba(7,9,14,${0.56 * eo(seg(t, 0.82, 1.18))})`;
      g.fillRect(0, 0, W, H);
    }

    if (!inQ2) {
      // QUESTION 1: Light-Sweep Reveal Hero Stage
      if (t >= 0.82) {
        const [hc, hg] = buf('q1_hero', 1420, 400);
        panel(hg, 20, 20, 1380, 360, { r: 24, fill: '#11151E', stroke: 'rgba(255,255,255,.13)', shadow: 0.9 });
        pillTag(hg, 710, 84, 'CÂU HỎI CHO CÁC TEAM VĂN PHÒNG', PAL.accent, { align: 'center', px: 14 });

        hg.textAlign = 'center'; hg.textBaseline = 'alphabetic';
        hg.fillStyle = PAL.text; hg.font = font(50, 600, 'disp');
        hg.fillText('Team mọi người đã áp dụng AI để giảm được', 710, 185);

        // Highlighted second line with luminous lime emphasis
        const l2a = 'một nửa thời gian ', l2b = 'làm báo cáo với biên bản họp chưa?';
        hg.font = font(52, 700, 'disp');
        const wa = hg.measureText(l2a).width, wb = hg.measureText(l2b).width;
        const x0 = 710 - (wa + wb) / 2;
        hg.textAlign = 'left';
        hg.fillStyle = PAL.accent; hg.fillText(l2a, x0, 258);
        hg.fillStyle = PAL.text; hg.fillText(l2b, x0 + wa, 258);

        // Crisp underline metric bar under "một nửa thời gian"
        hg.fillStyle = rgba(PAL.accent, 0.85);
        rr(hg, x0, 272, wa - 12, 4, 2); hg.fill();

        // Bottom live counter strip inside hero card
        hg.fillStyle = PAL.mute; hg.font = font(14, 500, 'mono'); hg.textAlign = 'center';
        hg.fillText('26 TỆP TIN ĐANG CHỜ  ·  18 TRANG BIÊN BẢN  ·  47 EMAIL CHƯA ĐỌC  ·  14 LỖI #REF!', 710, 334);

        const sweepP = eo(seg(t, 0.86, 1.95));
        const collapse = 1 - ei(seg(t, 4.58, 4.85));
        g.save();
        g.translate(960, 470);
        g.scale(1, collapse);
        lightReveal(g, hc, -710, -200, 1420, 400, sweepP, { base: 0.14, glint: 0.22, soft: 240 });
        caret(g, 640, 52, 48, { on: Math.sin(t * 7) > -0.2 ? 1 : 0.15 });
        g.restore();
      }
    } else {
      // QUESTION 2: 2.5D Perspective Trivial-Chat Window + Sharp Contrast Headline
      const openP = back(seg(t, 4.86, 5.22), 1.25);

      // Left-side 2.5D rotated window showing superficial AI usage ("dịch thuật" & "viết caption")
      const [wc, wg] = buf('q2_win', 660, 430);
      const r = windowBox(wg, 16, 16, 628, 398, { title: 'Trợ lý AI — Cách dùng bề nổi', app: 0, r: 18 });
      const [rx, ry, rw] = r;
      const prompts = [
        { role: 'USER', txt: '“Dịch giúp đoạn email này sang tiếng Anh”', tag: 'CHỈ DỊCH THUẬT' },
        { role: 'AI', txt: '“Dear team, please find attached the weekly…”', tag: '' },
        { role: 'USER', txt: '“Viết giúp 3 câu caption đăng mạng xã hội”', tag: 'CHỈ VIẾT CAPTION' },
      ];
      prompts.forEach((pr, idx) => {
        const py = ry + 24 + idx * 108;
        panel(wg, rx + 22, py, rw - 44, 88, { r: 12, fill: pr.role === 'USER' ? '#1E2433' : '#151924', shadow: 0 });
        wg.fillStyle = pr.role === 'USER' ? PAL.red : PAL.dim;
        wg.font = font(12, 700, 'mono'); wg.fillText(pr.role, rx + 40, py + 28);
        wg.fillStyle = PAL.text; wg.font = font(18, 500, 'ui'); wg.fillText(pr.txt, rx + 40, py + 60);
        if (pr.tag) pillTag(wg, rx + rw - 40, py + 25, pr.tag, PAL.red, { align: 'right', px: 11 });
      });

      const rotY = lerp(0.32, 0.18, eo(seg(t, 4.86, 8.4)));
      perspective(g, wc, 470, 475, 660 * openP, 430 * openP, rotY);

      // Right-side Keynote Question 2
      const tx = 860, ty = 340;
      g.save();
      g.translate(tx + 420, 470);
      g.scale(openP, openP);
      g.translate(-(tx + 420), -470);

      pillTag(g, tx, ty - 42, 'THỰC TRẠNG ĐÁNG TIẾC', PAL.red, { px: 14 });
      g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      g.fillStyle = PAL.dim; g.font = font(48, 500, 'disp');
      g.fillText('Hay vẫn đang dùng AI', tx, ty + 34);
      g.fillStyle = PAL.text; g.font = font(58, 700, 'disp');
      g.fillText('chỉ để dịch thuật', tx, ty + 108);
      g.fillStyle = PAL.red;
      g.fillText('với viết caption?', tx, ty + 178);

      // Unsolved core work bar below
      storageBar(g, tx, ty + 255, 780, 14, clamp(0.82 + 0.12 * seg(t, 5.2, 8.2)), {
        label: 'Báo cáo & biên bản họp thực tế vẫn làm thủ công',
        value: '0% TỰ ĐỘNG HÓA'
      });
      g.restore();
    }
    vignette(g, 0.52);
  }

  // SCENE 3 (8.5 – 16.5s): Lateral 2.5D Track Across Broken Loop + Freeze at 15.8s
  function renderBrokenLoop(t) {
    const freezeT = Math.min(t, 15.80);
    const frozen = t >= 15.80;
    const sT = freezeT - 8.5;

    // Camera tracks laterally left-to-right across the 4-stage failing pipeline, then settles wide at centre so all 4 stages hold together
    const panU = eio(seg(sT, 0.1, 3.8));
    const wideU = eio(seg(sT, 3.6, 5.1));
    const cam = camera({
      x: lerp(lerp(740, 1180, panU), 960, wideU),
      y: 500,
      zoom: lerp(1.06, 0.96, wideU),
      rot: lerp(-0.012, 0, wideU),
      sx: frozen ? 0 : Math.sin(sT * 34) * (1.5 * seg(sT, 4.5, 7.2)),
    });

    bg(g, { lift: 0.9, cool: 0.5, dark: frozen ? 0.22 : 0 });
    grid(g, { ox: W / 2 - cam.x * cam.zoom, oy: H / 2 - cam.y * cam.zoom, scale: cam.zoom, alpha: 0.9 });
    glow(g, 960, 470, 760, PAL.red, frozen ? 0.20 : 0.13);

    g.save();
    cam.apply(g, 0);

    // Top section header in world space
    pillTag(g, 960, 132, frozen ? 'ĐÓNG BĂNG QUÁ TẢI  ·  100% THỦ CÔNG' : 'VÒNG LẶP SAI LẦM KHI DÙNG AI TỰ PHÁT', PAL.red, { align: 'center', px: 14 });
    g.textAlign = 'center'; g.fillStyle = PAL.text; g.font = font(44, 700, 'disp');
    g.fillText('Prompt ngắn  →  Kết quả sáo rỗng  →  Sửa tay liên tục  →  Mất thời gian', 960, 198);

    const nodes = [
      { step: 'BƯỚC 01', title: 'Prompt ngắn', sub: 'Thiếu vai trò, thiếu dữ liệu gốc', delay: 0.10 },
      { step: 'BƯỚC 02', title: 'Kết quả sáo rỗng', sub: 'Văn mẫu chung chung, sai số liệu', delay: 1.65 },
      { step: 'BƯỚC 03', title: 'Sửa tay liên tục', sub: 'Gạch xóa, đối chiếu lại từ đầu', delay: 3.25 },
      { step: 'BƯỚC 04', title: 'Mất thời gian', sub: 'Tốn gấp đôi công sức làm báo cáo', delay: 4.85 },
    ];

    const cw = 380, ch = 390, gap = 52, x0 = 960 - (4 * cw + 3 * gap) / 2;
    nodes.forEach((nd, i) => {
      const p = back(seg(sT, nd.delay, nd.delay + 0.34), 1.32);
      if (p <= 0) return;
      const nx = x0 + i * (cw + gap), ny = 275;
      const tremble = (!frozen && sT > nd.delay + 0.5) ? Math.sin(sT * 28 + i * 2) * 1.6 : 0;

      g.save();
      g.translate(nx + cw / 2 + tremble, ny + ch / 2);
      g.scale(p, p);
      g.translate(-cw / 2, -ch / 2);

      panel(g, 0, 0, cw, ch, { r: 20, fill: '#151620', stroke: rgba(PAL.red, 0.36), shadow: 0.95 });
      pillTag(g, 26, 36, nd.step, PAL.red, { px: 12 });
      g.fillStyle = PAL.text; g.font = font(30, 700, 'disp'); g.textAlign = 'left';
      g.fillText(nd.title, 26, 90);
      g.fillStyle = PAL.dim; g.font = font(16, 400, 'ui');
      g.fillText(nd.sub, 26, 120);

      // Unique procedural UI inside each broken-loop window
      panel(g, 22, 145, cw - 44, 215, { r: 12, fill: '#0E1017', stroke: 'rgba(255,255,255,.07)', shadow: 0 });
      if (i === 0) {
        const typedLen = Math.floor(clamp((sT - 0.25) / 0.85, 0, 1) * 19);
        const promptStr = '“Tóm tắt họp giúp”'.slice(0, typedLen);
        g.fillStyle = PAL.mute; g.font = font(12, 600, 'mono'); g.fillText('INPUT PROMPT (3 TỪ)', 40, 178);
        g.fillStyle = PAL.text; g.font = font(21, 500, 'mono'); g.fillText(promptStr, 40, 220);
        caret(g, 44 + g.measureText(promptStr).width, 212, 26, { color: PAL.red, on: frozen ? 1 : (Math.floor(sT * 6) % 2) });
        pillTag(g, 40, 315, '0% NGỮ CẢNH  ·  0 RÀNG BUỘC', PAL.red, { px: 11 });
      } else if (i === 1) {
        g.fillStyle = PAL.mute; g.font = font(12, 600, 'mono'); g.fillText('AI OUTPUT · VĂN MẪU RỖNG', 40, 178);
        const hollow = ['“Cuộc họp diễn ra sôi nổi…”', '“Các bên cần cố gắng hơn…”', '“Tăng trưởng nhiều mặt…”'];
        hollow.forEach((hl, rIdx) => {
          g.fillStyle = 'rgba(255,255,255,.45)'; g.font = font(16, 400, 'ui');
          g.fillText(hl, 40, 214 + rIdx * 34);
        });
        pillTag(g, 40, 322, 'THIẾU DEADLINE & NGƯỜI PHỤ TRÁCH', PAL.red, { px: 11 });
      } else if (i === 2) {
        g.fillStyle = PAL.mute; g.font = font(12, 600, 'mono'); g.fillText('ĐỐI SOÁT & SỬA TAY', 40, 178);
        for (let rIdx = 0; rIdx < 4; rIdx++) {
          const ly = 204 + rIdx * 30;
          g.fillStyle = 'rgba(255,255,255,.18)'; rr(g, 40, ly, 250 - (rIdx % 2) * 45, 12, 4); g.fill();
          const cutW = clamp((sT - 3.4 - rIdx * 0.22) / 0.35, 0, 1) * 260;
          g.fillStyle = PAL.red; g.fillRect(36, ly + 5, cutW, 2.5);
        }
        const edits = Math.min(14, Math.max(1, Math.floor((sT - 3.2) * 4.5)));
        pillTag(g, 40, 326, `SỬA LẠI LẦN #${edits}`, PAL.red, { px: 12 });
      } else {
        g.fillStyle = PAL.mute; g.font = font(12, 600, 'mono'); g.fillText('ĐỒNG HỒ HAO PHÍ TUẦN', 40, 178);
        const mins = Math.round(lerp(45, 240, clamp((sT - 4.9) / 1.8, 0, 1)));
        g.fillStyle = PAL.red; g.font = font(64, 700, 'disp');
        g.fillText(`+${mins}p`, 40, 258);
        storageBar(g, 40, 322, cw - 84, 12, 0.98, { label: 'Áp lực giấy tờ', value: '100%' });
      }
      g.restore();

      // Sputtering red connector trail between nodes
      if (i < 3 && sT > nd.delay + 0.55) {
        const tp = eo(seg(sT, nd.delay + 0.55, nd.delay + 1.15));
        const sx = nx + cw + 6, ex = sx + (gap - 12) * tp, my = ny + ch / 2;
        trail(g, [[sx, my], [lerp(sx, ex, 0.5), my - 6], [ex, my]], { color: PAL.red, width: 5, alpha: 0.85 });
      }
    });

    g.restore();
    vignette(g, frozen ? 0.68 : 0.52);
  }

  // SCENE 4 (16.5 – 25.0s): Downbeat Living Caret Strike + THE SNAP GRID -> 4 Coherent System Modules
  function renderSnapSystem(t) {
    const sT = t - 16.5;
    const camZoom = lerp(1.12, 1.0, eo(seg(sT, 0, 0.75)));
    const cam = camera({ x: 960, y: 515, zoom: camZoom, rot: 0 });

    bg(g, { lift: 1.05, cool: 1.0 });
    grid(g, { ox: W / 2 - cam.x * cam.zoom, oy: H / 2 - cam.y * cam.zoom, scale: cam.zoom, alpha: 1.1 });
    glow(g, 960, 480, 760, PAL.accent, 0.10 * eo(seg(sT, 0, 0.8)));

    g.save();
    cam.apply(g, 0);

    // 0.0 – 1.1s: All 26 chaotic items fly along curved category trails into the 4 clean system slots!
    if (sT < 1.35) {
      const fp = clamp(sT / 0.85, 0, 1);
      const fadeOut = 1 - eo(seg(sT, 0.75, 1.25));
      CHAOS.forEach((it, idx) => {
        const delay = (idx % 6) * 0.035;
        const p = clamp((sT - delay) / 0.78, 0, 1);
        const pose = flyPose({ x: it.x, y: it.y, rot: it.rot, s: 1 }, { x: it.targetX, y: it.targetY, rot: 0, s: 0.45 }, p, { over: 1.22 });
        const bend = (idx % 2 ? 1 : -1) * 55 * Math.sin(p * Math.PI);
        if (p > 0.04 && p < 0.96) {
          const pts = [];
          for (let k = 5; k >= 0; k--) {
            const pk = clamp(p - k * 0.045, 0, 1);
            const qk = flyPose({ x: it.x, y: it.y }, { x: it.targetX, y: it.targetY }, pk, { over: 1.22 });
            const bk = (idx % 2 ? 1 : -1) * 55 * Math.sin(pk * Math.PI);
            pts.push([qk.x, qk.y + bk]);
          }
          trail(g, pts, { color: it.trailColor, width: 4, alpha: 0.55 * fadeOut });
        }
        g.save();
        g.globalAlpha = fadeOut;
        g.translate(pose.x, pose.y + bend);
        g.scale(pose.s, pose.s);
        panel(g, -28, -20, 56, 40, { r: 8, fill: PAL.surf3, stroke: rgba(PAL.accent, 0.4), cheap: true, shadow: 0 });
        g.restore();
      });
    }

    // Living Caret strike at centre (16.5s)
    const caretFade = 1 - seg(sT, 0.9, 1.4);
    if (caretFade > 0) {
      const sq = sT < 0.14 ? 1.45 : 1 + 0.25 * Math.exp(-sT * 10) * Math.cos(sT * 32);
      caret(g, 960, 505, 110 / sq, { sx: sq, sy: 1, alpha: caretFade, glow: 1.6 });
    }

    // Top Keynote System Header
    const hp = eo(seg(sT, 0.25, 0.75));
    g.save(); g.globalAlpha = hp;
    pillTag(g, 960, 92, 'HỆ THỐNG LÀM VIỆC MẠCH LẠC', PAL.accent, { align: 'center', px: 13 });
    g.textAlign = 'center'; g.fillStyle = PAL.text; g.font = font(42, 700, 'disp');
    g.fillText('Từ Hỗn Loạn Sang Hệ Thống Tự Động Hóa Chuẩn Chỉnh', 960, 148);
    g.restore();

    // 4 Snap-Grid System Modules
    const mods = [
      { x: 140, y: 185, w: 800, h: 310, t0: 0.45, tag: 'MODULE 01 · DYNAMIC SHEET', title: 'Bảng tính động tự động hóa' },
      { x: 980, y: 185, w: 800, h: 310, t0: 0.65, tag: 'MODULE 02 · KPI DASHBOARD', title: 'Dashboard KPI thời gian thực' },
      { x: 140, y: 520, w: 800, h: 310, t0: 0.85, tag: 'MODULE 03 · QA CHECKLIST', title: 'Checklist kiểm chứng nghiệm thu' },
      { x: 980, y: 520, w: 800, h: 310, t0: 1.05, tag: 'MODULE 04 · DATA PIPELINE', title: 'Sơ đồ quy trình & luồng dữ liệu' },
    ];

    mods.forEach((m, idx) => {
      const mp = back(seg(sT, m.t0, m.t0 + 0.38), 1.18);
      if (mp <= 0) return;
      g.save();
      g.translate(m.x + m.w / 2, m.y + m.h / 2);
      g.scale(mp, mp);
      g.translate(-m.w / 2, -m.h / 2);

      panel(g, 0, 0, m.w, m.h, { r: 20, fill: PAL.surf, stroke: 'rgba(255,255,255,.11)', shadow: 0.9 });
      pillTag(g, 28, 34, m.tag, idx === 0 || idx === 3 ? PAL.accent : '#8A90A0', { px: 11 });
      g.fillStyle = PAL.text; g.font = font(24, 600, 'disp'); g.textAlign = 'left';
      g.fillText(m.title, 28, 76);

      if (idx === 0) {
        // Dynamic spreadsheet rows computing live
        const rows = [
          ['Hạng mục', 'Nguồn vào', 'Thời gian AI', 'Trạng thái'],
          ['Báo cáo tuần Phòng KD', '12 bảng chi nhánh', '0.6 giây', 'ĐỒNG BỘ'],
          ['Biên bản họp giao ban', 'Ghi âm 65 phút', '0.8 giây', 'HOÀN TẤT'],
          ['Đối soát KPI tháng 11', '4,280 dòng dữ liệu', '1.1 giây', 'KHỚP 100%'],
        ];
        rows.forEach((r, ri) => {
          const ry = 102 + ri * 46;
          panel(g, 26, ry, m.w - 52, 38, { r: 8, fill: ri === 0 ? PAL.surf2 : 'rgba(255,255,255,.025)', shadow: 0, stroke: 'rgba(255,255,255,.05)' });
          g.font = ri === 0 ? font(12, 600, 'mono') : font(15, 500, 'ui');
          g.fillStyle = ri === 0 ? PAL.mute : PAL.text;
          g.fillText(r[0], 42, ry + 24);
          g.fillStyle = PAL.dim; g.fillText(r[1], 295, ry + 24);
          g.font = font(13, 600, 'mono'); g.fillStyle = ri === 0 ? PAL.mute : PAL.accent;
          g.fillText(r[2], 515, ry + 24);
          if (ri > 0) checkBadge(g, 650, ry + 19, 10, seg(sT, 1.1 + ri * 0.25, 1.4 + ri * 0.25));
          g.fillText(r[3], ri > 0 ? 670 : 640, ry + 24);
        });
      } else if (idx === 1) {
        // Real-time KPI Dashboard
        panel(g, 26, 98, 285, 186, { r: 14, fill: PAL.surf2, shadow: 0 });
        g.fillStyle = PAL.dim; g.font = font(14, 500, 'ui'); g.fillText('Hiệu suất xử lý báo cáo', 46, 130);
        const kpiVal = Math.round(lerp(100, 280, eo(seg(sT, 1.0, 2.6)))) / 100;
        g.fillStyle = PAL.accent; g.font = font(64, 700, 'disp'); g.fillText(`${kpiVal.toFixed(1)}×`, 46, 204);
        g.fillStyle = PAL.text; g.font = font(14, 500, 'mono'); g.fillText('▲ TIẾT KIỆM 58% GIỜ CÔNG', 46, 254);

        panel(g, 330, 98, 444, 186, { r: 14, fill: PAL.surf2, shadow: 0 });
        g.fillStyle = PAL.dim; g.font = font(13, 600, 'mono'); g.fillText('THROUGHPUT TUẦN (TRƯỚC → SAU AI)', 352, 128);
        for (let b = 0; b < 8; b++) {
          const bx = 356 + b * 50, maxH = 112;
          const targetH = [32, 38, 35, 64, 82, 96, 106, 112][b] * eo(seg(sT, 1.0 + b * 0.12, 1.6 + b * 0.12));
          g.fillStyle = b >= 4 ? PAL.accent : 'rgba(255,255,255,.16)';
          rr(g, bx, 262 - targetH, 30, targetH, 6); g.fill();
        }
      } else if (idx === 2) {
        // Acceptance Checklist
        const checks = [
          'Trích xuất đủ quyết định, người phụ trách & hạn chót',
          'Tự động phát hiện ô trống, công thức sai & số liệu lệch',
          'Chuẩn hóa văn phong báo cáo quản trị chỉ trong 1 bước',
        ];
        checks.forEach((ck, ci) => {
          const cy = 104 + ci * 58;
          panel(g, 26, cy, m.w - 52, 48, { r: 10, fill: PAL.surf2, shadow: 0 });
          checkBadge(g, 54, cy + 24, 12, seg(sT, 1.3 + ci * 0.35, 1.65 + ci * 0.35));
          g.fillStyle = PAL.text; g.font = font(16, 500, 'ui');
          g.fillText(ck, 80, cy + 30);
        });
      } else {
        // Moving Process Diagram & Live Data Streams
        const stg = ['Dữ liệu thô', 'Chuẩn hóa', 'Phân tích AI', 'Nghiệm thu'];
        stg.forEach((sn, si) => {
          const sx = 32 + si * 188, sy = 132;
          panel(g, sx, sy, 156, 118, { r: 14, fill: PAL.surf2, stroke: si === 3 ? rgba(PAL.accent, 0.5) : PAL.line, shadow: 0 });
          g.fillStyle = PAL.mute; g.font = font(11, 700, 'mono'); g.fillText(`0${si + 1}`, sx + 18, sy + 30);
          g.fillStyle = PAL.text; g.font = font(17, 600, 'ui'); g.fillText(sn, sx + 18, sy + 66);
          g.fillStyle = si === 3 ? PAL.accent : PAL.dim; g.font = font(12, 500, 'mono');
          g.fillText(si === 3 ? 'READY ✓' : 'STREAMING', sx + 18, sy + 96);

          if (si < 3) {
            const ax = sx + 158, bx = sx + 186, ay = sy + 59;
            g.strokeStyle = 'rgba(255,255,255,.15)'; g.lineWidth = 2;
            g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, ay); g.stroke();
            const pulse = (sT * 1.8 + si * 0.33) % 1;
            const px = lerp(ax, bx, pulse);
            glow(g, px, ay, 18, PAL.accent, 0.55);
            g.fillStyle = PAL.accent; g.beginPath(); g.arc(px, ay, 4, 0, TAU); g.fill();
          }
        });
      }
      g.restore();
    });

    // Moving luminous data stream connecting left & right columns
    if (sT > 1.3) {
      const u = (sT * 0.85) % 1;
      const pts = [];
      for (let k = 6; k >= 0; k--) {
        const uk = clamp(u - k * 0.03, 0, 1);
        pts.push([lerp(540, 1380, uk), 507 + Math.sin(uk * Math.PI) * -18]);
      }
      trail(g, pts, { color: PAL.accent, width: 5, alpha: 0.75 });
    }

    g.restore();
    vignette(g, 0.50);
  }

  // SCENE 5 (25.0 – 38.5s): 2.5D Perspective PCTPR Spine + 4 Specialized AI Workstations
  function renderPCTPR(t) {
    const sT = t - 25.0;
    bg(g, { lift: 1.05, cool: 1.1 });
    grid(g, { ox: -sT * 14, oy: 0, scale: 1, alpha: 0.95 });
    glow(g, 960, 420, 820, PAL.accent, 0.09);

    // Offscreen stage projected through smooth 2.5D Y-axis perspective rotation
    const [sc, sg] = buf('pctpr_stage', 1780, 820);

    // Top Header + 5 PCTPR Architectural Modules
    pillTag(sg, 890, 34, 'KIẾN TRÚC PROMPT & ĐA MÔ HÌNH', PAL.accent, { align: 'center', px: 13 });
    sg.textAlign = 'center'; sg.fillStyle = PAL.text; sg.font = font(46, 700, 'disp');
    sg.fillText('Quy Trình Mới: PCTPR', 890, 92);

    const pctpr = [
      ['P', 'Persona', 'Vai trò chuyên gia'],
      ['C', 'Context', 'Bối cảnh & dữ liệu'],
      ['T', 'Task', 'Đầu việc cụ thể'],
      ['P', 'Process', 'Các bước xử lý'],
      ['R', 'Result', 'Chuẩn đầu ra'],
    ];
    pctpr.forEach(([letter, word, vn], idx) => {
      const lp = back(seg(sT, 0.18 + idx * 0.16, 0.52 + idx * 0.16), 1.3);
      if (lp <= 0) return;
      const pw = 308, ph = 86, px = 70 + idx * 336, py = 122;
      sg.save(); sg.translate(px + pw / 2, py + ph / 2); sg.scale(lp, lp); sg.translate(-pw / 2, -ph / 2);
      const active = sT > 0.25 + idx * 0.16;
      panel(sg, 0, 0, pw, ph, { r: 16, fill: PAL.surf2, stroke: active ? rgba(PAL.accent, 0.48) : PAL.line, shadow: 0.6 });
      sg.fillStyle = PAL.accent; sg.font = font(34, 700, 'mono'); sg.textAlign = 'left'; sg.textBaseline = 'middle';
      sg.fillText(letter, 22, ph / 2 + 1);
      sg.fillStyle = PAL.text; sg.font = font(20, 700, 'disp'); sg.fillText(word, 64, ph / 2 - 11);
      sg.fillStyle = PAL.dim; sg.font = font(14, 400, 'ui'); sg.fillText(vn, 64, ph / 2 + 15);
      sg.restore();
    });

    // Horizontal trunk line carrying live lime pulses into the 4 AI engines
    if (sT > 1.1) {
      const trunkP = eo(seg(sT, 1.1, 1.8));
      sg.strokeStyle = 'rgba(255,255,255,.14)'; sg.lineWidth = 2;
      sg.beginPath(); sg.moveTo(220, 236); sg.lineTo(220 + 1340 * trunkP, 236); sg.stroke();
      const pulseX = 220 + ((sT * 380) % 1340);
      glow(sg, pulseX, 236, 36, PAL.accent, 0.55);
      sg.fillStyle = PAL.accent; sg.beginPath(); sg.arc(pulseX, 236, 4.5, 0, TAU); sg.fill();
    }

    // 4 Specialized AI Engine Cards
    const engines = [
      {
        name: 'ChatGPT', role: 'LẬP KẾ HOẠCH', kind: 'plan', t0: 1.35,
        desc: 'Phân rã mục tiêu, dựng dàn ý báo cáo & cấu trúc công việc rõ ràng ngay từ đầu.',
        items: ['Khung báo cáo tuần chuẩn 5 mục', 'Phân bổ mục tiêu & mốc kiểm soát', 'Chuẩn hóa đầu vào cho toàn team'],
      },
      {
        name: 'Claude', role: 'PHÂN TÍCH TÀI LIỆU', kind: 'doc', t0: 3.55,
        desc: 'Đọc sâu tài liệu & biên bản dài hàng chục trang, rút trích luận điểm chuẩn xác.',
        items: ['Quét 24 trang tài liệu trong vài giây', 'Đối chiếu chéo các bảng số liệu', 'Giữ nguyên mạch logic & ngữ cảnh'],
      },
      {
        name: 'Gemini', role: 'HỖ TRỢ NGHIÊN CỨU', kind: 'search', t0: 6.20,
        desc: 'Tổng hợp thông tin đa nguồn, tra cứu dữ liệu thị trường & kiểm chứng nguồn tin.',
        items: ['Tổng hợp nhanh tài liệu tham chiếu', 'Mở rộng góc nhìn & dẫn chứng', 'Đính kèm nguồn đối chiếu minh bạch'],
      },
      {
        name: 'GPTs / Gems', role: 'CHUYÊN BIỆT HÓA', kind: 'spark', t0: 8.70,
        desc: 'Bộ trợ lý đóng gói sẵn System Prompt riêng cho từng tác vụ lặp lại hằng tuần:',
        items: ['✓ Tóm tắt biên bản họp tự động', '✓ Kiểm tra lỗi dữ liệu bảng tính', '✓ Lập kế hoạch tuần trong 2 phút'],
      },
    ];

    const cw = 398, ch = 505, gap = 28, x0 = (1780 - (4 * cw + 3 * gap)) / 2;
    engines.forEach((en, idx) => {
      const ep = back(seg(sT, en.t0, en.t0 + 0.45), 1.22);
      if (ep <= 0) return;
      const cx = x0 + idx * (cw + gap), cy = 266;
      const isHero = sT >= en.t0 && (idx === 3 || sT < engines[idx + 1].t0);

      sg.save();
      sg.translate(cx + cw / 2, cy + ch / 2);
      sg.scale(ep, ep);
      sg.translate(-cw / 2, -ch / 2);

      panel(sg, 0, 0, cw, ch, {
        r: 22,
        fill: isHero ? '#171C27' : PAL.surf,
        stroke: isHero ? rgba(PAL.accent, 0.65) : 'rgba(255,255,255,.10)',
        shadow: isHero ? 1.15 : 0.75,
      });
      if (isHero) glow(sg, cw / 2, 70, 210, PAL.accent, 0.14);

      drawVectorNodeIcon(sg, 50, 56, 26, en.kind, isHero ? PAL.accent : '#9BA3B5');
      sg.textAlign = 'left'; sg.textBaseline = 'alphabetic';
      sg.fillStyle = PAL.text; sg.font = font(30, 700, 'disp');
      sg.fillText(en.name, 92, 54);
      pillTag(sg, 92, 78, en.role, isHero ? PAL.accent : '#9BA3B5', { px: 11 });

      sg.fillStyle = PAL.dim; sg.font = font(16, 400, 'ui');
      wrapText(sg, en.desc, 26, 134, cw - 52, 25);

      // Sub-items inside workstation
      en.items.forEach((itTxt, rIdx) => {
        const ry = 236 + rIdx * 74;
        const rp = eo(seg(sT, en.t0 + 0.25 + rIdx * 0.18, en.t0 + 0.60 + rIdx * 0.18));
        sg.save(); sg.globalAlpha = rp;
        panel(sg, 22, ry, cw - 44, 60, { r: 12, fill: '#0F131B', stroke: idx === 3 ? rgba(PAL.accent, 0.28) : 'rgba(255,255,255,.06)', shadow: 0 });
        sg.fillStyle = idx === 3 ? PAL.accent : PAL.text;
        sg.font = font(15.5, idx === 3 ? 600 : 500, 'ui');
        sg.fillText(itTxt, 38, ry + 36);
        sg.restore();
      });

      // Live status footer
      sg.fillStyle = PAL.accent; sg.beginPath(); sg.arc(34, ch - 28, 4.5, 0, TAU); sg.fill();
      sg.fillStyle = PAL.mute; sg.font = font(12, 600, 'mono');
      sg.fillText(`NODE 0${idx + 1}  ·  SYSTEM PROMPT ACTIVE`, 48, ch - 24);
      sg.restore();
    });

    const rotY = lerp(-0.10, 0.08, eio(seg(sT, 0, 13.2)));
    perspective(g, sc, 960, 455, 1780, 820, rotY, { dist: 2.8 });
    vignette(g, 0.50);
  }

  // SCENE 6 & 7 (38.5 – 48.5s): Lone Giant Numeral 100% -> 40% (38.5–43.3s) + 3 Proof Panels (43.3–48.5s)
  function renderWorkloadAndProof(t) {
    bg(g, { lift: 1.0, cool: 0.9 });
    grid(g, { scale: 1, alpha: 0.9 });

    if (t < 43.3) {
      // SHOT 6: Giant Keynote Stat Screen (100% -> 40%)
      const sT = t - 38.5;
      const dropP = eio(seg(sT, 0.55, 2.65));
      const pct = Math.round(lerp(100, 40, dropP));
      glow(g, 960, 445, 760, PAL.accent, lerp(0.06, 0.18, dropP));

      pillTag(g, 960, 155, 'ĐO LƯỜNG KHỐI LƯỢNG XỬ LÝ THỦ CÔNG', PAL.accent, { align: 'center', px: 14 });

      // Giant numeral: smooth countdown + glyph-scramble lock onto "40%" at sT = 2.65s
      if (sT < 2.25) {
        g.textAlign = 'center'; g.textBaseline = 'alphabetic';
        g.font = font(260, 700, 'disp');
        g.fillStyle = mix('#E8EAF0', PAL.accent, dropP);
        g.fillText(`${pct}%`, 960, 505);
      } else {
        scramble(g, '40%', 960, 505, sT, [2.45, 2.62, 2.68], {
          px: 268, wt: 700, fam: 'disp', align: 'center', color: PAL.accent, tracking: -0.04, start: 2.20
        });
      }

      // 20-segment load bar array below the giant number: 12 of 20 bars retract cleanly!
      const totalBars = 20, bw = 46, bgap = 12, bx0 = 960 - (totalBars * bw + (totalBars - 1) * bgap) / 2;
      for (let i = 0; i < totalBars; i++) {
        const active = i < 8; // 8 / 20 = 40%!
        const retract = active ? 1 : 1 - eo(seg(sT, 0.6 + (19 - i) * 0.11, 1.0 + (19 - i) * 0.11));
        const bx = bx0 + i * (bw + bgap), by = 590, bh = 54;
        g.fillStyle = 'rgba(255,255,255,.05)'; rr(g, bx, by, bw, bh, 8); g.fill();
        if (retract > 0.02) {
          const hh = bh * retract;
          g.fillStyle = active ? PAL.accent : 'rgba(232,234,240,.32)';
          if (active && sT > 2.5) { g.shadowColor = rgba(PAL.accent, 0.55); g.shadowBlur = 14; }
          rr(g, bx, by + bh - hh, bw, hh, 8); g.fill();
          g.shadowColor = 'transparent';
        }
      }

      g.textAlign = 'center'; g.fillStyle = PAL.text; g.font = font(30, 600, 'disp');
      g.fillText('Khối lượng công việc giấy tờ giảm từ 100% xuống chỉ còn 40%', 960, 712);
      g.fillStyle = PAL.dim; g.font = font(16, 500, 'mono');
      g.fillText('GIẢI PHÓNG 60% THỜI GIAN CHO PHÂN TÍCH & RA QUYẾT ĐỊNH', 960, 756);
    } else {
      // SHOT 7: 3 Edgar-Wright-style Live Verification Panels (43.3 – 48.5s)
      const sT = t - 43.3;
      glow(g, 960, 460, 760, PAL.accent, 0.11);

      pillTag(g, 960, 108, 'KIỂM CHỨNG ĐẦU RA TRÊN THỰC TẾ', PAL.accent, { align: 'center', px: 13 });
      g.textAlign = 'center'; g.fillStyle = PAL.text; g.font = font(42, 700, 'disp');
      g.fillText('Tự Động Tóm Tắt  ·  Báo Cáo Nhanh Hơn  ·  Chuẩn Checklist Nghiệm Thu', 960, 166);

      const cards = [
        {
          t0: 0.05, tag: '01 · MEETING MINUTES', title: 'Biên bản họp tự động tóm tắt',
          metric: '0.8s', msub: 'từ 60 phút ghi âm',
          rows: ['Quyết định chốt: Chuyển 100% sang PCTPR', 'Đầu việc #1: Chuẩn hóa dữ liệu — Minh (Thứ 4)', 'Đầu việc #2: Kiểm thử Gems QA — Lan (Thứ 6)'],
        },
        {
          t0: 1.45, tag: '02 · FAST REPORTING', title: 'Báo cáo được tạo nhanh hơn',
          metric: '3.2×', msub: 'tốc độ hoàn thành',
          rows: ['Tự động gom số liệu tuần từ 5 bảng nguồn', 'Biểu đồ & nhận định KPI sinh tức thì', 'Xuất bản đúng mẫu quản trị không cần sửa tay'],
        },
        {
          t0: 2.85, tag: '03 · QA CHECKLIST', title: 'Kiểm tra theo checklist nghiệm thu',
          metric: '12/12', msub: 'tiêu chí đạt chuẩn',
          rows: ['✓ Số liệu khớp 100% với bảng gốc', '✓ Không bịa đặt hoặc suy diễn ngoài tài liệu', '✓ Đủ Action Items, người nhận & hạn hoàn thành'],
        },
      ];

      const cw = 528, ch = 590, gap = 34, x0 = (W - (3 * cw + 2 * gap)) / 2;
      cards.forEach((c, idx) => {
        const cp = back(seg(sT, c.t0, c.t0 + 0.42), 1.24);
        if (cp <= 0) return;
        const cx = x0 + idx * (cw + gap), cy = 216;
        g.save();
        g.translate(cx + cw / 2, cy + ch / 2);
        g.scale(cp, cp);
        g.translate(-cw / 2, -ch / 2);

        panel(g, 0, 0, cw, ch, { r: 22, fill: PAL.surf, stroke: rgba(PAL.accent, 0.38), shadow: 0.95 });
        pillTag(g, 28, 38, c.tag, PAL.accent, { px: 11 });
        checkBadge(g, cw - 42, 38, 15, seg(sT, c.t0 + 0.28, c.t0 + 0.65));

        g.textAlign = 'left'; g.fillStyle = PAL.text; g.font = font(27, 700, 'disp');
        g.fillText(c.title, 28, 94);

        // Big stat banner inside proof card
        panel(g, 26, 120, cw - 52, 128, { r: 14, fill: PAL.surf2, shadow: 0 });
        g.fillStyle = PAL.accent; g.font = font(64, 700, 'disp');
        g.fillText(c.metric, 48, 204);
        g.fillStyle = PAL.dim; g.font = font(16, 500, 'mono');
        g.fillText(c.msub.toUpperCase(), 238, 192);

        c.rows.forEach((rwTxt, ri) => {
          const ry = 274 + ri * 92;
          const rp = eo(seg(sT, c.t0 + 0.25 + ri * 0.16, c.t0 + 0.58 + ri * 0.16));
          g.save(); g.globalAlpha = rp;
          panel(g, 26, ry, cw - 52, 74, { r: 12, fill: '#0E121A', stroke: 'rgba(255,255,255,.06)', shadow: 0 });
          g.fillStyle = PAL.text; g.font = font(16.5, 500, 'ui');
          wrapText(g, rwTxt, 44, ry + 32, cw - 88, 22);
          g.restore();
        });
        g.restore();
      });
    }
    vignette(g, 0.50);
  }

  // SCENE 8 (48.5 – 60.0s): Put-Away into Clean Workspace -> Silence -> 50–60% Verdict -> Final CTA
  function renderCleanWorkspaceAndFinale(t) {
    if (t < 53.95) {
      // 48.5 – 53.95s: Put-Away native move -> Serene High-Value Workspace
      const sT = t - 48.5;
      const silenceDim = seg(t, 53.35, 53.92);
      bg(g, { lift: 1.05, cool: 1.0, dark: 0.55 * silenceDim });
      grid(g, { scale: 1, alpha: 0.85 * (1 - 0.5 * silenceDim) });
      glow(g, 960, 440, 740, PAL.accent, 0.10 * (1 - silenceDim));

      // Top 3 paperwork tiles retracting neatly ("Put-away" native move) into slim archived pills
      const archived = ['Biên bản họp · Đã tự động gửi', 'Báo cáo tuần · Đã nghiệm thu', 'Bảng dữ liệu · 0 lỗi'];
      archived.forEach((lb, i) => {
        const rp = eo(seg(sT, 0.1 + i * 0.25, 0.65 + i * 0.25));
        const px = 310 + i * 450, py = lerp(180, 118, rp), ph = lerp(88, 42, rp);
        panel(g, px, py, 400, ph, { r: ph / 2, fill: PAL.surf2, stroke: rgba(PAL.accent, 0.32), shadow: 0.4 });
        checkBadge(g, px + 28, py + ph / 2, 10, rp);
        g.fillStyle = PAL.dim; g.font = font(14, 500, 'mono'); g.textAlign = 'left'; g.textBaseline = 'middle';
        g.fillText(lb, px + 50, py + ph / 2 + 1);
      });

      // Central Calm High-Value Focus Console
      const cp = eo(seg(sT, 0.35, 1.0));
      g.save();
      g.globalAlpha = cp * (1 - 0.65 * silenceDim);
      panel(g, 210, 210, 1500, 590, { r: 28, fill: '#11151E', stroke: 'rgba(255,255,255,.11)', shadow: 1.1 });

      pillTag(g, 960, 276, 'KHÔNG GIAN LÀM VIỆC GỌN GÀNG  ·  ZERO PAPERWORK CLUTTER', PAL.accent, { align: 'center', px: 13 });
      g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      g.fillStyle = PAL.text; g.font = font(50, 700, 'disp');
      g.fillText('Nhân sự tập trung trọn vẹn vào công việc giá trị cao', 960, 352);
      g.fillStyle = PAL.dim; g.font = font(21, 400, 'ui');
      g.fillText('Không còn thức khuya sửa biên bản hay dò từng dòng công thức thủ công', 960, 398);

      const pillars = [
        ['CHIẾN LƯỢC & QUYẾT ĐỊNH', 'Phân tích kịch bản kinh doanh', 'Từ số liệu đã được AI kiểm chứng sạch'],
        ['SÁNG TẠO & KHÁCH HÀNG', 'Tối ưu sản phẩm & dịch vụ', 'Dành thời gian cho con người thay vì giấy tờ'],
        ['VẬN HÀNH BỀN VỮNG', 'Quy trình chuẩn hóa toàn team', 'Ai mới vào cũng chạy đúng chuẩn PCTPR'],
      ];
      pillars.forEach(([tag, h1, h2], idx) => {
        const bx = 266 + idx * 474, by = 452, bw = 440, bh = 285;
        const bp = back(seg(sT, 0.65 + idx * 0.22, 1.15 + idx * 0.22), 1.18);
        g.save(); g.translate(bx + bw / 2, by + bh / 2); g.scale(bp, bp); g.translate(-bw / 2, -bh / 2);
        panel(g, 0, 0, bw, bh, { r: 20, fill: PAL.surf2, stroke: 'rgba(255,255,255,.08)', shadow: 0.5 });
        pillTag(g, 28, 42, tag, PAL.accent, { px: 11 });
        g.textAlign = 'left'; g.fillStyle = PAL.text; g.font = font(26, 700, 'disp');
        g.fillText(h1, 28, 126);
        g.fillStyle = PAL.dim; g.font = font(17, 400, 'ui');
        wrapText(g, h2, 28, 170, bw - 56, 26);
        caret(g, 34, 240, 22, { on: 0.9, glow: 0.5 });
        g.fillStyle = PAL.accent; g.font = font(13, 600, 'mono');
        g.fillText('HIGH-VALUE FOCUS', 50, 245);
        g.restore();
      });
      g.restore();
    } else if (t < 56.92) {
      // 54.0 – 56.92s: FINAL LINE 1 — Light-Sweep Verdict "Thời gian xử lý giấy tờ giảm thực tế 50-60%."
      const sT = t - 53.95;
      bg(g, { lift: 1.0, cool: 1.0 });
      grid(g, { scale: 1, alpha: 0.85 });
      glow(g, 960, 465, 820, PAL.accent, 0.18 * eo(seg(sT, 0, 0.6)));

      const [vc, vg] = buf('verdict_card', 1560, 520);
      panel(vg, 20, 20, 1520, 480, { r: 28, fill: '#11151E', stroke: rgba(PAL.accent, 0.45), shadow: 1.1 });
      pillTag(vg, 780, 88, 'KẾT QUẢ ĐO LƯỜNG THỰC TẾ', PAL.accent, { align: 'center', px: 14 });
      vg.textAlign = 'center'; vg.textBaseline = 'alphabetic';
      vg.fillStyle = PAL.text; vg.font = font(48, 600, 'disp');
      vg.fillText('Thời gian xử lý giấy tờ giảm thực tế', 780, 185);
      vg.fillStyle = PAL.accent; vg.font = font(182, 700, 'disp');
      vg.fillText('50–60%', 780, 385);
      vg.fillStyle = PAL.dim; vg.font = font(16, 500, 'mono');
      vg.fillText('BÁO CÁO TUẦN  ·  BIÊN BẢN HỌP  ·  ĐỐI SOÁT DỮ LIỆU  ·  KẾ HOẠCH TUẦN', 780, 456);

      lightReveal(g, vc, 180, 210, 1560, 520, eo(seg(sT, 0.02, 0.95)), { base: 0.18, glint: 0.22, soft: 260 });
    } else {
      // 56.92 – 60.0s: FINAL LINE 2 — Call To Action with Living Lime Caret
      const sT = t - 56.92;
      const openP = back(seg(sT, 0, 0.42), 1.18);
      bg(g, { lift: 1.05, cool: 1.1 });
      grid(g, { scale: 1, alpha: 0.9 });
      glow(g, 960, 470, 840, PAL.accent, 0.16);

      g.save();
      g.translate(960, 465);
      g.scale(openP, openP);
      g.translate(-960, -465);

      panel(g, 190, 205, 1540, 510, { r: 28, fill: '#11151E', stroke: rgba(PAL.accent, 0.5), shadow: 1.2 });

      // Top summary pill keeping 50-60% visible as context
      pillTag(g, 960, 282, 'GIẢM 50–60% THỜI GIAN GIẤY TỜ  ·  LỘ TRÌNH AI BÀI BẢN', PAL.accent, { align: 'center', px: 14 });

      g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      g.fillStyle = PAL.text; g.font = font(58, 700, 'disp');
      g.fillText('Muốn dùng AI bài bản từ System Prompt', 960, 412);

      const line2 = 'đến kiểm chứng chất lượng?';
      g.fillStyle = PAL.accent; g.font = font(62, 700, 'disp');
      const lw = g.measureText(line2).width;
      g.fillText(line2, 960, 498);
      caret(g, 960 + lw / 2 + 28, 476, 62, { on: Math.floor(t * 2) % 2 === 0 ? 1 : 0.25, glow: 1.4 });

      // 4 architecture stage pills at bottom of CTA card
      const steps = ['01 · SYSTEM PROMPT', '02 · QUY TRÌNH PCTPR', '03 · GPTS & GEMS', '04 · CHECKLIST NGHIỆM THU'];
      steps.forEach((st, idx) => {
        pillTag(g, 335 + idx * 415, 622, st, '#E8EAF0', { align: 'center', px: 12, fillA: 0.06, strokeA: 0.22 });
      });

      g.restore();
    }
    vignette(g, 0.54);
  }

  // ── Master Frame Render ──
  const params = new URLSearchParams(location.search);
  const noSub = params.get('nosub') === '1';

  window.render = function (t) {
    t = clamp(t, 0, DUR);
    if (t < 8.5) renderChaosAndQuestions(t);
    else if (t < 16.5) renderBrokenLoop(t);
    else if (t < 25.0) renderSnapSystem(t);
    else if (t < 38.5) renderPCTPR(t);
    else if (t < 48.5) renderWorkloadAndProof(t);
    else renderCleanWorkspaceAndFinale(t);

    // UI Toast Captions (hidden on the two final full-screen text cards 54.0–60.0s & Q1/Q2 where exact line is already giant hero text, OR shown cleanly in lower toast)
    if (!noSub) {
      const cue = VO.find(c => t >= c.c0 && t < c.c1);
      //STYLE.md §4: "Typed text / lone giant headline is not burned twice when identical" — keep toast on narrative scenes (c02..c08), skip redundant double-text on Q1, Q2, c09, c10!
      if (cue && !['c00', 'c01', 'c09', 'c10'].includes(cue.id)) {
        const aIn = seg(t, cue.c0, cue.c0 + 0.16);
        const aOut = 1 - seg(t, cue.c1 - 0.18, cue.c1);
        toast(g, cue.sub, Math.min(aIn, aOut), { y: H - 34, px: 28, dense: t < 16.5 ? 1 : 0 });
      }
    }
  };

  // Reading-time contract for `core/render/readcheck.mjs`
  window.TEXTS = function (t) {
    const out = [];
    if (t >= 0.9 && t < 4.75) out.push({ id: 'q1', text: 'Team mọi người đã áp dụng AI để giảm được một nửa thời gian làm báo cáo với biên bản họp chưa?', x0: 250, y0: 270, x1: 1670, y1: 670 });
    if (t >= 4.9 && t < 8.45) out.push({ id: 'q2', text: 'Hay vẫn đang dùng AI chỉ để dịch thuật với viết caption?', x0: 860, y0: 290, x1: 1720, y1: 620 });
    if (t >= 8.6 && t < 16.4) out.push({ id: 'loop', text: 'Prompt ngắn → Kết quả sáo rỗng → Sửa tay liên tục → Mất thời gian', x0: 140, y0: 160, x1: 1780, y1: 230 });
    if (t >= 17.1 && t < 24.9) out.push({ id: 'sys', text: 'Bảng tính động · Dashboard KPI · Checklist · Luồng dữ liệu', x0: 140, y0: 185, x1: 1780, y1: 830 });
    if (t >= 25.3 && t < 38.4) out.push({ id: 'pctpr', text: 'Quy trình mới: PCTPR · ChatGPT · Claude · Gemini · GPTs/Gems', x0: 120, y0: 60, x1: 1800, y1: 820 });
    if (t >= 38.6 && t < 43.2) out.push({ id: 'drop', text: '100% → 40%', x0: 600, y0: 240, x1: 1320, y1: 600 });
    if (t >= 43.4 && t < 48.4) out.push({ id: 'proof', text: 'Biên bản họp tự động · Báo cáo nhanh hơn · Checklist nghiệm thu', x0: 120, y0: 130, x1: 1800, y1: 800 });
    if (t >= 48.9 && t < 53.8) out.push({ id: 'clean', text: 'Nhân sự tập trung trọn vẹn vào công việc giá trị cao', x0: 210, y0: 210, x1: 1710, y1: 800 });
    if (t >= 54.0 && t < 56.9) out.push({ id: 'v5060', text: 'Thời gian xử lý giấy tờ giảm thực tế 50-60%.', x0: 180, y0: 210, x1: 1740, y1: 730 });
    if (t >= 56.95 && t <= 60.0) out.push({ id: 'cta', text: 'Muốn dùng AI bài bản từ System Prompt đến kiểm chứng chất lượng?', x0: 190, y0: 205, x1: 1730, y1: 715 });
    return out;
  };
}
