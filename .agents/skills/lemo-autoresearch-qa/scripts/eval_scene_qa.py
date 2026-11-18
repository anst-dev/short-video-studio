#!/usr/bin/env python3
"""
Immutable Per-Scene Code + Visual + Reference QA Evaluator (`eval_scene_qa.py` — Beta).
Inspired by Karpathy's `autoresearch/prepare.py` (READ-ONLY ground-truth evaluator).

Instead of rendering an entire 60-240s video to discover defects, this script evaluates ONE scene
(in ~0.8 seconds!) across 3 intra-scene timestamps (start+0.35s, mid, end-0.35s) using:
  1. Static Code Rule Audit (self-hosted fonts, no -apple-system/PingFang, no OS emojis, NOSUB support)
  2. Live Headless Chromium Canvas Text-BBox Spy (intercepts fillText/strokeText transforms & metrics
     to catch EVERY text overlap, out-of-safe-margin overflow, or tiny unreadable font automatically!)
  3. Intra-Scene Motion & Visual Richness Check (verifies non-blank coverage, quadrant balance,
     and visible animation progress within the scene so weak models don't draw static slides!)
  4. Reference Film Comparison (optional `--ref` Carbon film: renders matching timestamps from the
     reference film, computes perceptual layout/color/density alignment, and outputs a 3-panel visual
     comparison strip `[CARBON REF | CANDIDATE | DIFF + BBOX OVERLAY]` for Vision QA inspection!)

Outputs structured JSON + actionable fix prompts and logs to `.agents/autoresearch_qa/logs/qa_feedback_log.jsonl`.
"""
import argparse, datetime, json, math, os, re, subprocess, sys, tempfile
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
WORKSPACE = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
LIB = os.path.join(WORKSPACE, "lemo-opuscar")
LOGS_DIR = os.path.join(WORKSPACE, ".agents", "autoresearch_qa", "logs")


def resolve_film(p):
    if not p:
        return ""
    if os.path.isabs(p) and os.path.isdir(p):
        return p
    for cand in [os.path.join(LIB, "films", p), os.path.join(LIB, p), os.path.join(WORKSPACE, p)]:
        if os.path.isdir(cand):
            return os.path.abspath(cand)
    return os.path.abspath(os.path.join(LIB, "films", p))


def static_code_checks(film_dir):
    defects = []
    penalties = 0.0
    if not os.path.isfile(os.path.join(film_dir, "TREATMENT.md")):
        defects.append({"code": "MISSING_TREATMENT", "severity": "medium", "fix": "Create TREATMENT.md documenting structure, scenes, and >= 2 dramatic silences."})
        penalties += 6.0

    emoji_re = re.compile(r"[\U0001F300-\U0001FAFF]")
    has_nosub = False
    has_font_load = False
    for root, _, files in os.walk(film_dir):
        if any(skip in root for skip in ("stills", "out", "fonts", "autoresearch_qa")):
            continue
        for fn in files:
            if not fn.endswith((".html", ".js", ".mjs")):
                continue
            txt = open(os.path.join(root, fn), encoding="utf-8", errors="ignore").read()
            if "-apple-system" in txt or "PingFang SC" in txt or "Lantinghei SC" in txt:
                defects.append({"code": "BAD_SYSTEM_FONT", "file": fn, "severity": "high",
                                "fix": f"Remove -apple-system / PingFang SC in {fn}; use self-hosted @font-face (BeVietnamPro, Inter, Archivo, JBMono)."})
                penalties += 15.0
            if re.search(r"lemo\s?lab|opus\s*5\.5", txt, re.I):
                defects.append({"code": "WATERMARK_LEAK", "file": fn, "severity": "high",
                                "fix": f"Remove LemoLab / Opus 5.5 demo credit text in {fn}."})
                penalties += 15.0
            em = emoji_re.findall(txt)
            if em:
                defects.append({"code": "OS_EMOJI_USED", "file": fn, "severity": "medium",
                                "fix": f"Replace OS emojis ({''.join(sorted(set(em))[:5])}) in {fn} with vector shapes or clean typographic symbols (✓, ✕, ▸, [?])."})
                penalties += 6.0
            if "nosub" in txt:
                has_nosub = True
            if "document.fonts.load" in txt:
                has_font_load = True

    if not has_nosub:
        defects.append({"code": "NO_NOSUB_SWITCH", "severity": "medium",
                        "fix": "Support `?nosub=1` query switch so clean posters and external SRT exports hide bottom captions."})
        penalties += 5.0
    if not has_font_load:
        defects.append({"code": "NO_FONT_PRELOAD", "severity": "high",
                        "fix": "Preload Vietnamese glyphs with `await document.fonts.load(...)` before setting `window.READY = true`."})
        penalties += 10.0

    return defects, penalties


PROBE_MJS = r"""
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { EXE, ARGS } from './core/render/browser.mjs';

const [filmDir, refDir, timesCsv, outDir, wStr, hStr] = process.argv.slice(2);
const W = parseInt(wStr, 10) || 1920;
const H = parseInt(hStr, 10) || 1080;
const times = timesCsv.split(',').map(Number);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.ttf': 'font/ttf', '.woff2': 'font/woff2',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml'
};

function startServer(rootLib) {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const u = new URL(req.url, 'http://127.0.0.1');
      const fp = path.join(rootLib, decodeURIComponent(u.pathname));
      if (!fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
        res.writeHead(404); res.end('Not found'); return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream' });
      fs.createReadStream(fp).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, port: srv.address().port }));
  });
}

const SPY_SCRIPT = `
(() => {
  window.__qaBoxes = [];
  window.__qaRecording = false;
  const origFill = CanvasRenderingContext2D.prototype.fillText;
  const origStroke = CanvasRenderingContext2D.prototype.strokeText;
  const origFillRect = CanvasRenderingContext2D.prototype.fillRect;
  const origClearRect = CanvasRenderingContext2D.prototype.clearRect;
  function occludeByRect(ctx, rx, ry, rw, rh, isClear) {
    if (!window.__qaRecording || rw <= 4 || rh <= 4) return;
    if (!isClear && ctx.globalAlpha < 0.82) return;
    const fs = String(ctx.fillStyle || '');
    if (!isClear && fs.startsWith('rgba') && parseFloat((fs.split(',')[3] || '1')) < 0.82) return;
    const tf = ctx.getTransform();
    const p1 = tf.transformPoint({ x: rx, y: ry });
    const p2 = tf.transformPoint({ x: rx + rw, y: ry + rh });
    const ox0 = Math.min(p1.x, p2.x), ox1 = Math.max(p1.x, p2.x);
    const oy0 = Math.min(p1.y, p2.y), oy1 = Math.max(p1.y, p2.y);
    window.__qaBoxes = window.__qaBoxes.filter(b => {
      const iw = Math.min(b.x1, ox1) - Math.max(b.x0, ox0);
      const ih = Math.min(b.y1, oy1) - Math.max(b.y0, oy0);
      if (iw <= 0 || ih <= 0) return true;
      const area = Math.max(1, (b.x1 - b.x0) * (b.y1 - b.y0));
      return (iw * ih) / area < 0.80;
    });
  }
  CanvasRenderingContext2D.prototype.fillRect = function(x, y, w, h) {
    occludeByRect(this, x, y, w, h, false);
    return origFillRect.call(this, x, y, w, h);
  };
  CanvasRenderingContext2D.prototype.clearRect = function(x, y, w, h) {
    occludeByRect(this, x, y, w, h, true);
    return origClearRect.call(this, x, y, w, h);
  };
  function record(ctx, txt, x, y) {
    if (!window.__qaRecording) return;
    const s = String(txt ?? '').trim();
    if (!s || ctx.globalAlpha < 0.08) return;
    const m = ctx.measureText(s);
    const w = m.width || 0;
    if (w < 1) return;
    const pxMatch = String(ctx.font || '').match(/([0-9.]+)px/);
    const fpx = pxMatch ? parseFloat(pxMatch[1]) : 16;
    let lx = x;
    if (ctx.textAlign === 'center') lx = x - w / 2;
    else if (ctx.textAlign === 'right' || ctx.textAlign === 'end') lx = x - w;
    let ly = y - fpx * 0.78;
    if (ctx.textBaseline === 'middle') ly = y - fpx * 0.48;
    else if (ctx.textBaseline === 'top' || ctx.textBaseline === 'hanging') ly = y;
    const tf = ctx.getTransform();
    const p1 = tf.transformPoint({ x: lx, y: ly });
    const p2 = tf.transformPoint({ x: lx + w, y: ly + fpx * 0.96 });
    const x0 = Math.min(p1.x, p2.x), x1 = Math.max(p1.x, p2.x);
    const y0 = Math.min(p1.y, p2.y), y1 = Math.max(p1.y, p2.y);
    if (x1 < 0 || x0 > ${W} || y1 < 0 || y0 > ${H}) {
      // Still record if partially clipped across viewport boundary!
      if (x1 <= -40 || x0 >= ${W + 40} || y1 <= -40 || y0 >= ${H + 40}) return;
    }
    window.__qaBoxes.push({
      text: s,
      x0: +x0.toFixed(1), y0: +y0.toFixed(1),
      x1: +x1.toFixed(1), y1: +y1.toFixed(1),
      h: +(y1 - y0).toFixed(1),
      fill: String(ctx.fillStyle || '')
    });
  }
  CanvasRenderingContext2D.prototype.fillText = function(t, x, y, ...rest) {
    record(this, t, x, y);
    return origFill.call(this, t, x, y, ...rest);
  };
  CanvasRenderingContext2D.prototype.strokeText = function(t, x, y, ...rest) {
    record(this, t, x, y);
    return origStroke.call(this, t, x, y, ...rest);
  };
})();
`;

async function captureFilm(browser, port, absDir, prefix) {
  const rel = path.relative(process.cwd(), absDir).replace(/\\/g, '/');
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.addInitScript(SPY_SCRIPT);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`HTTP ${r.status} ${r.url()}`); });

  await page.goto(`http://127.0.0.1:${port}/${rel}/index.html`, { waitUntil: 'load', timeout: 15000 });
  await page.waitForFunction(() => window.READY === true || window.ready === true, { timeout: 15000 });

  const frames = [];
  for (let i = 0; i < times.length; i++) {
    const t = times[i];
    const boxes = await page.evaluate(({ sec, vw, vh }) => {
      window.__qaBoxes = [];
      window.__qaRecording = true;
      if (typeof window.render === 'function') window.render(sec);
      else if (typeof window.seek === 'function') window.seek(sec);
      window.__qaRecording = false;
      // Also collect visible HTML/SVG leaf text nodes if film uses DOM alongside/instead of Canvas
      for (const el of document.querySelectorAll('body *:not(script):not(style):not(canvas)')) {
        if (el.children.length > 0) continue;
        const txt = (el.textContent || '').trim();
        if (!txt) continue;
        const st = getComputedStyle(el);
        if (st.display === 'none' || st.visibility === 'hidden' || parseFloat(st.opacity || '1') < 0.08) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        if (r.right <= -40 || r.left >= vw + 40 || r.bottom <= -40 || r.top >= vh + 40) continue;
        window.__qaBoxes.push({
          text: txt,
          x0: +r.left.toFixed(1), y0: +r.top.toFixed(1),
          x1: +r.right.toFixed(1), y1: +r.bottom.toFixed(1),
          h: +r.height.toFixed(1),
          fill: st.color || ''
        });
      }
      return window.__qaBoxes;
    }, { sec: t, vw: W, vh: H });
    const imgPath = path.join(outDir, `${prefix}_${i}.png`);
    await page.screenshot({ path: imgPath, type: 'png' });
    frames.push({ t, imgPath, boxes });
  }
  await page.close();
  return { errors, frames };
}

const { srv, port } = await startServer(process.cwd());
const browser = await chromium.launch({ executablePath: EXE, args: ARGS });
try {
  const cand = await captureFilm(browser, port, filmDir, 'cand');
  let ref = null;
  if (refDir && fs.existsSync(path.join(refDir, 'index.html'))) {
    ref = await captureFilm(browser, port, refDir, 'ref');
  }
  fs.writeFileSync(path.join(outDir, 'probe.json'), JSON.stringify({ cand, ref }, null, 2));
} finally {
  await browser.close();
  srv.close();
}
"""


def iou_and_overlap(a, b):
    ix0, iy0 = max(a["x0"], b["x0"]), max(a["y0"], b["y0"])
    ix1, iy1 = min(a["x1"], b["x1"]), min(a["y1"], b["y1"])
    iw, ih = ix1 - ix0, iy1 - iy0
    if iw <= 2.0 or ih <= 2.0:
        return 0.0
    inter = iw * ih
    area_min = max(1.0, min((a["x1"] - a["x0"]) * (a["y1"] - a["y0"]), (b["x1"] - b["x0"]) * (b["y1"] - b["y0"])))
    return inter / area_min


def analyze_boxes(boxes, w, h):
    collisions = []
    overflows = []
    tiny = []
    # Deduplicate identical shadow/stroke double-draws at the same spot
    uniq = []
    for bx in boxes:
        if any(bx["text"] == u["text"] and abs(bx["x0"] - u["x0"]) < 10 and abs(bx["y0"] - u["y0"]) < 10 for u in uniq):
            continue
        uniq.append(bx)

    for i, a in enumerate(uniq):
        hard_clip = (a["x0"] < 6 or a["x1"] > w - 6 or a["y0"] < 5 or a["y1"] > h - 5)
        margin_breach = (len(a["text"]) >= 6 and (a["x0"] < 24 or a["x1"] > w - 24 or a["y0"] < 8 or a["y1"] > h - 6))
        if hard_clip or margin_breach:
            overflows.append({
                "text": a["text"][:45],
                "bbox": [a["x0"], a["y0"], a["x1"], a["y1"]],
                "fix": f"Text '{a['text'][:35]}' at x=[{a['x0']}..{a['x1']}], y=[{a['y0']}..{a['y1']}] overflows/clips safe screen margin [40..{w-40}, 24..{h-24}]."
            })
        if a["h"] < 13.5 and len(a["text"]) > 3:
            tiny.append({"text": a["text"][:35], "height_px": a["h"]})
        for j in range(i + 1, len(uniq)):
            b = uniq[j]
            # Ignore adjacent inline highlight segments on exact same baseline
            if abs(a["y0"] - b["y0"]) < 5 and (abs(a["x1"] - b["x0"]) < 8 or abs(b["x1"] - a["x0"]) < 8):
                continue
            ov = iou_and_overlap(a, b)
            if ov > 0.14:
                collisions.append({
                    "a": a["text"][:36],
                    "b": b["text"][:36],
                    "overlap_ratio": round(ov, 2),
                    "bbox_a": [a["x0"], a["y0"], a["x1"], a["y1"]],
                    "bbox_b": [b["x0"], b["y0"], b["x1"], b["y1"]],
                    "fix": f"Text collision ({int(ov*100)}%): '{a['text'][:28]}' { [a['x0'],a['y0'],a['x1'],a['y1']] } overlaps '{b['text'][:28]}' { [b['x0'],b['y0'],b['x1'],b['y1']] }. Separate Y by >= {int(max(a['h'], b['h']) + 12)}px or adjust X/width."
                })
    return uniq, collisions, overflows, tiny


def image_metrics(imgs):
    arrs = [np.asarray(Image.open(p).convert("RGB"), dtype=np.float32) / 255.0 for p in imgs]
    mid = arrs[len(arrs) // 2]
    H, W, _ = mid.shape

    # Estimate dominant background color from border pixels
    border = np.concatenate([mid[0, :, :], mid[-1, :, :], mid[:, 0, :], mid[:, -1, :]], axis=0)
    bg_col = np.median(border, axis=0)
    fg_mask = np.linalg.norm(mid - bg_col[None, None, :], axis=2) > 0.08
    fg_ratio = float(fg_mask.mean())

    # Quadrant balance (exclude top 110px header & bottom 160px subtitle zone)
    body = fg_mask[110:H - 160, 60:W - 60]
    bh, bw = body.shape
    quads = [
        float(body[:bh // 2, :bw // 2].mean()),
        float(body[:bh // 2, bw // 2:].mean()),
        float(body[bh // 2:, :bw // 2].mean()),
        float(body[bh // 2:, bw // 2:].mean()),
    ]
    active_quads = sum(1 for q in quads if q > 0.035)

    # Intra-scene motion delta (mean absolute pixel change across scene timestamps, excluding bottom caption)
    motion_deltas = []
    for k in range(1, len(arrs)):
        diff = np.abs(arrs[k][:H - 170] - arrs[k - 1][:H - 170]).mean()
        motion_deltas.append(float(diff))
    mean_motion = float(np.mean(motion_deltas)) if motion_deltas else 0.0

    return {
        "fg_coverage": round(fg_ratio, 4),
        "quadrant_fill": [round(q, 4) for q in quads],
        "active_quadrants": active_quads,
        "intra_scene_motion": round(mean_motion, 5),
        "mid_rgb": mid,
    }


def build_comparison_strip(cand_frame, ref_frame, collisions, overflows, out_jpg):
    cand_im = Image.open(cand_frame["imgPath"]).convert("RGB")
    draw = ImageDraw.Draw(cand_im)
    # Draw red boxes on collisions & orange boxes on margin overflows right onto the candidate diagnostic panel!
    for c in collisions:
        x0, y0, x1, y1 = c["bbox_a"]
        draw.rectangle([x0, y0, x1, y1], outline=(235, 30, 30), width=4)
        bx0, by0, bx1, by1 = c["bbox_b"]
        draw.rectangle([bx0, by0, bx1, by1], outline=(235, 30, 30), width=4)
    for o in overflows:
        x0, y0, x1, y1 = o["bbox"]
        draw.rectangle([x0, y0, x1, y1], outline=(245, 140, 0), width=4)

    tw_panel = 640
    th_panel = int(round(tw_panel * cand_im.height / cand_im.width))
    cand_thumb = cand_im.resize((tw_panel, th_panel), Image.Resampling.LANCZOS)

    if ref_frame:
        ref_im = Image.open(ref_frame["imgPath"]).convert("RGB")
        ref_thumb = ref_im.resize((tw_panel, th_panel), Image.Resampling.LANCZOS)
        # Visual absolute difference heatmap amplified 3x
        a_ref = np.asarray(ref_thumb, dtype=np.float32)
        a_cnd = np.asarray(Image.open(cand_frame["imgPath"]).convert("RGB").resize((tw_panel, th_panel), Image.Resampling.LANCZOS), dtype=np.float32)
        diff_arr = np.clip(np.abs(a_ref - a_cnd) * 2.6, 0, 255).astype(np.uint8)
        diff_thumb = Image.fromarray(diff_arr)

        strip = Image.new("RGB", (tw_panel * 3, th_panel + 36), (18, 22, 32))
        strip.paste(ref_thumb, (0, 36))
        strip.paste(cand_thumb, (tw_panel, 36))
        strip.paste(diff_thumb, (tw_panel * 2, 36))
        hdr = ImageDraw.Draw(strip)
        hdr.text((16, 10), f"1. CARBON REFERENCE (t={ref_frame['t']}s)", fill=(183, 243, 74))
        hdr.text((tw_panel + 16, 10), f"2. CANDIDATE + QA BOXES (t={cand_frame['t']}s)", fill=(255, 210, 80))
        hdr.text((tw_panel * 2 + 16, 10), "3. VISUAL DELTA HEATMAP", fill=(160, 200, 255))
    else:
        strip = Image.new("RGB", (tw_panel, th_panel + 36), (18, 22, 32))
        strip.paste(cand_thumb, (0, 36))
        hdr = ImageDraw.Draw(strip)
        hdr.text((16, 10), f"CANDIDATE + QA BBOX OVERLAY (t={cand_frame['t']}s)", fill=(183, 243, 74))

    os.makedirs(os.path.dirname(out_jpg), exist_ok=True)
    strip.save(out_jpg, quality=90)


def main():
    ap = argparse.ArgumentParser(description="Immutable Per-Scene Code + Visual QA Evaluator (Beta)")
    ap.add_argument("--film", required=True, help="Candidate film project folder")
    ap.add_argument("--ref", default="", help="Optional reference film project folder (e.g. Carbon reference)")
    ap.add_argument("--scene", type=int, default=0, help="Scene index label for logging")
    ap.add_argument("--t0", type=float, required=True, help="Scene start time in seconds")
    ap.add_argument("--t1", type=float, required=True, help="Scene end time in seconds")
    ap.add_argument("--size", default="1920x1080")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    film_dir = resolve_film(args.film)
    ref_dir = resolve_film(args.ref) if args.ref else ""
    w_px, h_px = [int(x) for x in args.size.lower().split("x")]

    # Sample 3 strategic timestamps inside this single scene: entry, middle hold, pre-exit
    span = max(0.8, args.t1 - args.t0)
    ts = [
        round(args.t0 + min(0.45, span * 0.15), 2),
        round(args.t0 + span * 0.52, 2),
        round(args.t1 - min(0.35, span * 0.12), 2),
    ]
    times_csv = ",".join(str(x) for x in ts)

    static_defects, static_pen = static_code_checks(film_dir)

    with tempfile.TemporaryDirectory() as td:
        probe_script = os.path.join(LIB, f"_tmp_qa_probe_{os.getpid()}.mjs")
        open(probe_script, "w", encoding="utf-8").write(PROBE_MJS)
        try:
            r = subprocess.run(
                ["node", probe_script, film_dir, ref_dir, times_csv, td, str(w_px), str(h_px)],
                cwd=LIB, capture_output=True, text=True, timeout=45
            )
        finally:
            if os.path.isfile(probe_script):
                try:
                    os.remove(probe_script)
                except OSError:
                    pass

        if r.returncode != 0 or not os.path.isfile(os.path.join(td, "probe.json")):
            err_msg = (r.stderr or r.stdout or "Unknown Playwright crash").strip()[-600:]
            report = {
                "ok": False,
                "crashed": True,
                "scene": args.scene,
                "qa_score": 0.0,
                "val_defect_loss": 100.0,
                "error": err_msg,
                "actionable_fixes": [f"Fix runtime crash in index.html: {err_msg}"],
            }
            print(json.dumps(report, ensure_ascii=False, indent=2))
            sys.exit(1)

        probe = json.load(open(os.path.join(td, "probe.json"), encoding="utf-8"))
        cand = probe["cand"]
        ref = probe.get("ref")

        all_collisions, all_overflows, all_tiny = [], [], []
        mid_boxes = []
        for idx, fr in enumerate(cand["frames"]):
            u, colls, ovs, tny = analyze_boxes(fr["boxes"], w_px, h_px)
            if idx == 1:
                mid_boxes = u
            all_collisions.extend(colls)
            all_overflows.extend(ovs)
            all_tiny.extend(tny)

        # Deduplicate collision/overflow messages across the 3 intra-scene frames
        seen_c = set()
        uniq_collisions = []
        for c in all_collisions:
            k = (c["a"], c["b"])
            if k not in seen_c:
                seen_c.add(k)
                uniq_collisions.append(c)

        seen_o = set()
        uniq_overflows = []
        for o in all_overflows:
            if o["text"] not in seen_o:
                seen_o.add(o["text"])
                uniq_overflows.append(o)

        vis = image_metrics([f["imgPath"] for f in cand["frames"]])

        penalties = static_pen
        fixes = [d["fix"] for d in static_defects]

        if cand["errors"]:
            penalties += 25.0
            fixes.append(f"Fix JS/HTTP console errors: {cand['errors'][:3]}")

        if uniq_collisions:
            penalties += min(42.0, len(uniq_collisions) * 14.0)
            for c in uniq_collisions[:5]:
                fixes.append(c["fix"])

        if uniq_overflows:
            penalties += min(28.0, len(uniq_overflows) * 9.0)
            for o in uniq_overflows[:4]:
                fixes.append(o["fix"])

        if all_tiny:
            penalties += min(10.0, len(all_tiny) * 3.0)
            fixes.append(f"Increase tiny font sizes (< 14px) on labels such as '{all_tiny[0]['text']}'.")

        if vis["fg_coverage"] < 0.04:
            penalties += 22.0
            fixes.append(f"Scene is visually sparse/empty (foreground coverage {vis['fg_coverage']*100:.1f}% < 4%). Add structured cards, icons, connectors, or visual hierarchy.")
        elif vis["active_quadrants"] < 2:
            penalties += 10.0
            fixes.append(f"Unbalanced composition: only {vis['active_quadrants']}/4 screen quadrants have visual content ({vis['quadrant_fill']}). Balance left/right or top/bottom layout.")

        if vis["intra_scene_motion"] < 0.0008:
            penalties += 10.0
            fixes.append(f"Static slide detected (intra-scene motion {vis['intra_scene_motion']:.5f} < 0.0008). Add staggered pop-in, flowing particles, camera drift, or animated progress bars.")

        ref_metrics = None
        if ref and len(ref["frames"]) == len(cand["frames"]):
            ref_vis = image_metrics([f["imgPath"] for f in ref["frames"]])
            ref_u, _, _, _ = analyze_boxes(ref["frames"][1]["boxes"], w_px, h_px)
            cov_gap = abs(vis["fg_coverage"] - ref_vis["fg_coverage"])
            quad_gap = sum(abs(a - b) for a, b in zip(vis["quadrant_fill"], ref_vis["quadrant_fill"])) / 4.0
            # Coarse 32x18 perceptual layout + palette similarity
            c_small = np.asarray(Image.fromarray((vis["mid_rgb"] * 255).astype(np.uint8)).resize((32, 18), Image.Resampling.BOX), dtype=np.float32) / 255.0
            r_small = np.asarray(Image.fromarray((ref_vis["mid_rgb"] * 255).astype(np.uint8)).resize((32, 18), Image.Resampling.BOX), dtype=np.float32) / 255.0
            coarse_l1 = float(np.abs(c_small - r_small).mean())
            ref_align = round(max(0.0, 100.0 * (1.0 - (cov_gap * 1.4 + quad_gap * 1.2 + coarse_l1 * 0.9))), 1)

            if vis["fg_coverage"] < ref_vis["fg_coverage"] * 0.65:
                penalties += 8.0
                fixes.append(f"Candidate visual richness ({vis['fg_coverage']*100:.1f}%) is much thinner than Carbon Reference ({ref_vis['fg_coverage']*100:.1f}%). Match Reference's multi-card/diagram structure.")
            if len(mid_boxes) < max(3, int(len(ref_u) * 0.6)):
                penalties += 6.0
                fixes.append(f"Candidate shows fewer informative labels ({len(mid_boxes)}) than Carbon Reference ({len(ref_u)}). Ensure complete educational content per shot.")
            penalties += max(0.0, (85.0 - ref_align) * 0.22)

            ref_metrics = {
                "ref_fg_coverage": ref_vis["fg_coverage"],
                "ref_quadrant_fill": ref_vis["quadrant_fill"],
                "ref_text_count": len(ref_u),
                "cand_text_count": len(mid_boxes),
                "reference_alignment_score": ref_align,
            }

        qa_score = round(clamp_val := max(0.0, min(100.0, 100.0 - penalties)), 2)
        val_defect_loss = round((100.0 - qa_score) / 100.0, 6)

        qa_dir = os.path.join(film_dir, "autoresearch_qa")
        comp_jpg = os.path.join(qa_dir, f"scene_{args.scene}_compare.jpg")
        build_comparison_strip(
            cand["frames"][1],
            ref["frames"][1] if ref else None,
            uniq_collisions,
            uniq_overflows,
            comp_jpg,
        )

    report = {
        "ok": True,
        "scene": args.scene,
        "t_window": [args.t0, args.t1],
        "sampled_times": ts,
        "qa_score": qa_score,
        "val_defect_loss": val_defect_loss,
        "text_collisions_count": len(uniq_collisions),
        "margin_overflows_count": len(uniq_overflows),
        "js_errors_count": len(cand["errors"]),
        "visual_metrics": {k: v for k, v in vis.items() if k != "mid_rgb"},
        "reference_comparison": ref_metrics,
        "comparison_strip_jpg": comp_jpg,
        "actionable_fixes": fixes if fixes else ["Scene passes all code & visual geometry rules! Inspect comparison_strip_jpg to polish aesthetic details."],
    }

    # Append persistent telemetry log for continuous skill/workflow self-improvement
    os.makedirs(LOGS_DIR, exist_ok=True)
    log_entry = {
        "ts": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "film": os.path.basename(film_dir),
        "ref": os.path.basename(ref_dir) if ref_dir else "",
        "scene": args.scene,
        "qa_score": qa_score,
        "val_defect_loss": val_defect_loss,
        "collisions": len(uniq_collisions),
        "overflows": len(uniq_overflows),
        "fg_coverage": vis["fg_coverage"],
        "motion": vis["intra_scene_motion"],
        "fixes": fixes[:6],
    }
    with open(os.path.join(LOGS_DIR, "qa_feedback_log.jsonl"), "a", encoding="utf-8") as lf:
        lf.write(json.dumps(log_entry, ensure_ascii=False) + "\n")

    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print(f"=== AUTORESEARCH SCENE QA (Scene {args.scene}: {args.t0}s..{args.t1}s) ===")
        print(f"qa_score:          {qa_score:.2f} / 100.0")
        print(f"val_defect_loss:   {val_defect_loss:.6f}  (lower is better, 0.000000 = ideal)")
        print(f"text_collisions:   {len(uniq_collisions)}")
        print(f"margin_overflows:  {len(uniq_overflows)}")
        print(f"fg_coverage:       {vis['fg_coverage']*100:.1f}%  (active_quadrants={vis['active_quadrants']}/4)")
        print(f"intra_motion:      {vis['intra_scene_motion']:.5f}")
        if ref_metrics:
            print(f"ref_alignment:     {ref_metrics['reference_alignment_score']}% vs Carbon Reference")
        print(f"visual_strip:      {comp_jpg}")
        print("actionable_fixes:")
        for fx in report["actionable_fixes"]:
            print(f"  - {fx}")


if __name__ == "__main__":
    main()
