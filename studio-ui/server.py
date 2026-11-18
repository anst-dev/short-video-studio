"""
Lemo-Opuscar + Dashi-AnimationStyle Studio Web UI Server (`studio-ui/server.py`).
Zero external dependencies beyond Python standard library.
Serves all 107 styles (99 lemo-opuscar + 8 dashi-animationstyle), posters, playable demo videos
(streaming + local dashi MP4s + 1-click offline cache + WebVTT subtitles), STYLE.md / 风格卡.md specs,
OUTPUT_VIDEOS player, Agent CLI Prompt Builder, and 1-click Custom Skill installer (.agents/skills/).
"""
import argparse, glob, http.server, json, mimetypes, os, re, sys, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
WORKSPACE = os.path.abspath(os.path.join(HERE, ".."))
LIB = os.path.join(WORKSPACE, "lemo-opuscar")
DASHI = os.path.join(WORKSPACE, "dashi-animationstyle")
DASHI_CAT_FILE = os.path.join(HERE, "dashi_catalog.json")
DASHI_DEMOS_DIR = os.path.join(HERE, "dashi-demos")
OUT_VIDEOS = os.path.join(WORKSPACE, "OUTPUT_VIDEOS")
SKILLS_DIR = os.path.join(WORKSPACE, ".agents", "skills")
FONTS_CACHE = os.path.join(WORKSPACE, ".agents", "cache", "fonts")
DEMOS_CACHE = os.path.join(WORKSPACE, ".agents", "cache", "demos")

sys.path.insert(0, os.path.join(SKILLS_DIR, "lemo-style-customizer", "scripts"))
from create_style_skill import generate_skill_markdown

CAT_VI = {
    "Edit & Documentary": "Phóng sự & Tư liệu",
    "Painting & Illustration": "Hội họa & Minh họa",
    "Sketch & Board": "Phác thảo & Bảng viết",
    "Traditional Crafts": "Thủ công truyền thống",
    "Print & Printmaking": "In ấn & Khắc bản",
    "Graphic & Type": "Đồ họa & Typography",
    "Line Diagrams": "Sơ đồ & Bản vẽ kỹ thuật",
    "Cartoons": "Hoạt hình Cartoon",
    "Games": "Điện tử & Pixel Game",
    "Film & Tape": "Phim nhựa & Băng từ",
    "Screens & Interfaces": "Màn hình & Giao diện UI",
    "Light & Lines": "Ánh sáng & Đường nét",
    "3D & Miniature": "3D & Mô hình thu nhỏ",
    "Instruments & Evidence": "Thiết bị & Thực chứng",
    "Data & Maps": "Dữ liệu & Bản đồ",
}

CDN_FILMS_BASE = "https://lemomo-ai.github.io/lemo-opuscar-films/"
REL_FILMS_BASE = "https://github.com/lemomo-ai/lemo-opuscar/releases/download/films/"


def load_dashi_items():
    if not os.path.isfile(DASHI_CAT_FILE):
        return []
    return json.load(open(DASHI_CAT_FILE, encoding="utf-8"))


def load_enriched_catalog():
    cat_file = os.path.join(LIB, "styleboard", "catalog.json")
    films_repo_file = os.path.join(LIB, "styleboard", "films_repo.json")
    raw = json.load(open(cat_file, encoding="utf-8"))
    films_meta = {}
    cdn_base = CDN_FILMS_BASE
    if os.path.isfile(films_repo_file):
        try:
            fr = json.load(open(films_repo_file, encoding="utf-8"))
            cdn_base = fr.get("base") or CDN_FILMS_BASE
            films_meta = fr.get("films", {})
        except Exception:
            pass

    out = []
    # 1. 99 Lemo-Opuscar styles
    for item in raw:
        slug = item["slug"]
        sjson_p = os.path.join(LIB, "styles", slug, "style.json")
        srt_p = os.path.join(LIB, "styles", slug, f"{slug}.srt")
        local_demo = os.path.join(DEMOS_CACHE, f"{slug}.mp4")
        is_cached = os.path.isfile(local_demo) and os.path.getsize(local_demo) > 10000

        needs = []
        if os.path.isfile(sjson_p):
            try:
                needs = json.load(open(sjson_p, encoding="utf-8")).get("needs", [])
            except Exception:
                pass
        cat_en = item.get("cat_en", "Other")
        f_bytes = films_meta.get(slug, {}).get("bytes", 0)
        cdn_url = f"{cdn_base.rstrip('/')}/{slug}.mp4"
        out.append({
            **item,
            "source": "lemo",
            "cat_vi": CAT_VI.get(cat_en, cat_en).strip(),
            "needs_image_gen": "image-generation" in needs,
            "poster": f"/posters/{slug}.jpg",
            "demo_video": f"/demo-video/{slug}.mp4" if is_cached else cdn_url,
            "demo_cdn": cdn_url,
            "demo_1080p": f"{REL_FILMS_BASE}{slug}.mp4",
            "demo_cached": is_cached,
            "demo_size_mb": round(f_bytes / (1024 * 1024), 1) if f_bytes else 0,
            "demo_vtt": f"/demo-vtt/{slug}.vtt" if os.path.isfile(srt_p) else "",
        })

    # 2. 8 Dashi-AnimationStyle styles (subtitles are already stylized natively inside Canvas!)
    for d in load_dashi_items():
        slug = d["slug"]
        mp4_p = os.path.join(DASHI_DEMOS_DIR, f"{slug}.mp4")
        has_mp4 = os.path.isfile(mp4_p) and os.path.getsize(mp4_p) > 10000
        mb = round(os.path.getsize(mp4_p) / (1024 * 1024), 1) if has_mp4 else 2.5
        cat_en = d.get("cat_en", "Other")
        out.append({
            **d,
            "source": "dashi",
            "cat_vi": CAT_VI.get(cat_en, cat_en).strip(),
            "needs_image_gen": False,
            "poster": f"/posters/{slug}.jpg",
            "demo_video": f"/demo-video/{slug}.mp4",
            "demo_cdn": f"/demo-video/{slug}.mp4",
            "demo_1080p": f"/demo-video/{slug}.mp4",
            "demo_cached": has_mp4,
            "demo_size_mb": mb,
            "demo_vtt": "",
        })

    return out


def srt_to_vtt(srt_text: str) -> str:
    body = srt_text.replace("\r\n", "\n").lstrip("\ufeff")
    body = re.sub(r"(\d{2}:\d{2}:\d{2}),(\d{3})", r"\1.\2", body)
    return "WEBVTT\n\n" + body


class StudioHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass

    def send_json(self, data, status=200):
        raw = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(raw)

    def send_text(self, text: str, content_type="text/plain; charset=utf-8", status=200):
        raw = text.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(raw)

    def send_file(self, path, content_type=None, no_cache=False):
        if not os.path.isfile(path):
            self.send_error(404, "File not found")
            return
        ctype = content_type or mimetypes.guess_type(path)[0] or "application/octet-stream"
        size = os.path.getsize(path)
        range_hdr = self.headers.get("Range")
        if range_hdr and range_hdr.startswith("bytes="):
            parts = range_hdr.replace("bytes=", "").split("-")
            start = int(parts[0]) if parts[0] else 0
            end = int(parts[1]) if len(parts) > 1 and parts[1] else size - 1
            end = min(end, size - 1)
            length = max(0, end - start + 1)
            self.send_response(206)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Content-Length", str(length))
            if no_cache:
                self.send_header("Cache-Control", "no-store")
            self.end_headers()
            with open(path, "rb") as f:
                f.seek(start)
                self.wfile.write(f.read(length))
            return

        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Length", str(size))
        if no_cache:
            self.send_header("Cache-Control", "no-store")
        self.end_headers()
        with open(path, "rb") as f:
            self.wfile.write(f.read())

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        p = urllib.parse.unquote(parsed.path)

        if p == "/api/catalog":
            return self.send_json({"styles": load_enriched_catalog(), "workspace": WORKSPACE})

        if p.startswith("/api/style/"):
            slug = os.path.basename(p[len("/api/style/"):])
            dmeta = next((x for x in load_dashi_items() if x["slug"] == slug), None)
            if dmeta:
                card_p = os.path.join(DASHI, "styles", dmeta["dashi_dir"], "风格卡.md")
                if not os.path.isfile(card_p):
                    return self.send_json({"error": "Dashi style card not found"}, 404)
                return self.send_json({
                    "slug": slug,
                    "markdown": open(card_p, encoding="utf-8").read(),
                    "demo_markdown": "",
                })

            md_path = os.path.join(LIB, "styles", slug, "STYLE.md")
            demo_md_path = os.path.join(LIB, "styles", slug, "DEMO.md")
            if not os.path.isfile(md_path):
                return self.send_json({"error": "Style not found"}, 404)
            demo_md = open(demo_md_path, encoding="utf-8").read() if os.path.isfile(demo_md_path) else ""
            return self.send_json({
                "slug": slug,
                "markdown": open(md_path, encoding="utf-8").read(),
                "demo_markdown": demo_md,
            })

        if p.startswith("/demo-vtt/") and p.endswith(".vtt"):
            slug = os.path.basename(p[:-4])
            if slug.startswith("dashi-"):
                srt_p = os.path.join(DASHI, "examples", "token", "字幕.srt")
            else:
                srt_p = os.path.join(LIB, "styles", slug, f"{slug}.srt")
            if not os.path.isfile(srt_p):
                return self.send_error(404)
            return self.send_text(srt_to_vtt(open(srt_p, encoding="utf-8").read()), "text/vtt; charset=utf-8")

        if p.startswith("/demo-video/") and p.endswith(".mp4"):
            slug = os.path.basename(p[:-4])
            if slug.startswith("dashi-"):
                return self.send_file(os.path.join(DASHI_DEMOS_DIR, f"{slug}.mp4"), "video/mp4")
            return self.send_file(os.path.join(DEMOS_CACHE, f"{slug}.mp4"), "video/mp4")

        if p == "/api/outputs":
            vids = []
            if os.path.isdir(OUT_VIDEOS):
                # Scan root level (backward compatible) + one subfolder per video
                # (OUTPUT_VIDEOS/<Ten_Video>/<Ten_Video>.mp4 + Poster_*.jpg + .srt)
                rel_mps = []
                for fn in sorted(os.listdir(OUT_VIDEOS)):
                    fp = os.path.join(OUT_VIDEOS, fn)
                    if os.path.isfile(fp) and fn.lower().endswith(".mp4"):
                        rel_mps.append(fn)
                    elif os.path.isdir(fp):
                        for sub in sorted(os.listdir(fp)):
                            if sub.lower().endswith(".mp4") and ".part." not in sub:
                                rel_mps.append(f"{fn}/{sub}")
                for rel in rel_mps:
                    fp = os.path.join(OUT_VIDEOS, rel.replace("/", os.sep))
                    folder, fname = os.path.split(rel)
                    stem = os.path.splitext(fname)[0]
                    # Poster: derived "Ban_X" -> "Poster_X" in the same folder, else any Poster_*.jpg there
                    poster_fn = stem.replace("Ban_", "Poster_", 1) + ".jpg" if stem.startswith("Ban_") else ""
                    poster_p = os.path.join(OUT_VIDEOS, folder, poster_fn) if poster_fn else ""
                    if not (poster_p and os.path.isfile(poster_p)):
                        cands = glob.glob(os.path.join(OUT_VIDEOS, folder, "Poster_*.jpg"))
                        poster_p = cands[0] if cands else ""
                    poster_url = ""
                    if poster_p and os.path.isfile(poster_p):
                        poster_rel = os.path.relpath(poster_p, OUT_VIDEOS).replace(os.sep, "/")
                        poster_url = f"/outputs/{urllib.parse.quote(poster_rel)}"
                    # Sidecar SRT: same stem first, else the folder's single .srt (served as WebVTT)
                    srt_rel = ""
                    srt_p = os.path.join(OUT_VIDEOS, folder, stem + ".srt")
                    if not os.path.isfile(srt_p):
                        cands = [s for s in glob.glob(os.path.join(OUT_VIDEOS, folder, "*.srt")) if ".part." not in s]
                        srt_p = cands[0] if len(cands) == 1 else ""
                    if srt_p and os.path.isfile(srt_p):
                        srt_rel = os.path.relpath(srt_p, OUT_VIDEOS).replace(os.sep, "/")
                    vids.append({
                        "name": fname,
                        "folder": folder,
                        "url": f"/outputs/{urllib.parse.quote(rel)}",
                        "poster_url": poster_url,
                        "srt_url": f"/outputs-vtt/{urllib.parse.quote(srt_rel)}" if srt_rel else "",
                        "size_mb": round(os.path.getsize(fp) / (1024 * 1024), 2),
                    })
            return self.send_json({"videos": vids})

        if p == "/api/skills":
            skills = []
            if os.path.isdir(SKILLS_DIR):
                for d in sorted(os.listdir(SKILLS_DIR)):
                    md_p = os.path.join(SKILLS_DIR, d, "SKILL.md")
                    if os.path.isfile(md_p):
                        skills.append({"name": d, "path": md_p})
            return self.send_json({"skills": skills})

        if p.startswith("/posters/") and p.endswith(".jpg"):
            slug = os.path.basename(p[:-4])
            dmeta = next((x for x in load_dashi_items() if x["slug"] == slug), None)
            if dmeta:
                return self.send_file(os.path.join(DASHI, dmeta["poster_rel"]), "image/jpeg")
            return self.send_file(os.path.join(LIB, "styles", slug, "poster.jpg"), "image/jpeg")

        if p.startswith("/outputs-vtt/"):
            rel = urllib.parse.unquote(p[len("/outputs-vtt/"):]).replace("/", os.sep)
            fp = os.path.realpath(os.path.join(OUT_VIDEOS, rel))
            base = os.path.realpath(OUT_VIDEOS)
            if not (fp.startswith(base + os.sep) and os.path.isfile(fp) and fp.lower().endswith(".srt")):
                return self.send_error(404, "Subtitle not found")
            return self.send_text(srt_to_vtt(open(fp, encoding="utf-8").read()), "text/vtt; charset=utf-8")

        if p.startswith("/outputs/"):
            rel = urllib.parse.unquote(p[len("/outputs/"):]).replace("/", os.sep)
            fp = os.path.realpath(os.path.join(OUT_VIDEOS, rel))
            base = os.path.realpath(OUT_VIDEOS)
            if not fp.startswith(base + os.sep) or not os.path.isfile(fp):
                return self.send_error(404, "File not found")
            return self.send_file(fp)

        if p.startswith("/fonts/"):
            fn = os.path.basename(p[len("/fonts/"):])
            for candidate in [os.path.join(FONTS_CACHE, fn), os.path.join(LIB, "films", "v2_dark_keynote", "fonts", fn)]:
                if os.path.isfile(candidate):
                    return self.send_file(candidate, "font/ttf")
            return self.send_error(404)

        if p in ("/", "/index.html"):
            return self.send_file(os.path.join(HERE, "index.html"), "text/html; charset=utf-8", no_cache=True)
        if p == "/styles.css":
            return self.send_file(os.path.join(HERE, "styles.css"), "text/css; charset=utf-8", no_cache=True)
        if p == "/app.js":
            return self.send_file(os.path.join(HERE, "app.js"), "application/javascript; charset=utf-8", no_cache=True)

        return self.send_error(404)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/create-skill":
            length = int(self.headers.get("Content-Length", "0"))
            body = json.loads(self.rfile.read(length).decode("utf-8"))
            try:
                sname, md = generate_skill_markdown(
                    slug=body["slug"],
                    skill_name=body.get("skill_name", ""),
                    accent=body.get("accent", ""),
                    aspect=body.get("aspect", "16:9"),
                    voice=body.get("voice", "omnivoice"),
                    lang=body.get("lang", "vi"),
                    extra_rules=body.get("extra_rules", ""),
                )
                save_disk = body.get("save_to_disk", True)
                saved_path = ""
                if save_disk:
                    out_dir = os.path.join(SKILLS_DIR, sname)
                    os.makedirs(out_dir, exist_ok=True)
                    saved_path = os.path.join(out_dir, "SKILL.md")
                    open(saved_path, "w", encoding="utf-8").write(md)
                return self.send_json({"ok": True, "skill_name": sname, "saved_path": saved_path, "markdown": md})
            except Exception as e:
                return self.send_json({"ok": False, "error": str(e)}, 400)

        if parsed.path == "/api/cache-demo":
            length = int(self.headers.get("Content-Length", "0"))
            body = json.loads(self.rfile.read(length).decode("utf-8"))
            slug = re.sub(r"[^a-z0-9\-]", "", body.get("slug", ""))
            if not slug:
                return self.send_json({"ok": False, "error": "Invalid slug"}, 400)
            if slug.startswith("dashi-"):
                local_p = os.path.join(DASHI_DEMOS_DIR, f"{slug}.mp4")
                mb = round(os.path.getsize(local_p) / (1024 * 1024), 1) if os.path.isfile(local_p) else 0
                return self.send_json({"ok": True, "slug": slug, "local_url": f"/demo-video/{slug}.mp4", "size_mb": mb})

            os.makedirs(DEMOS_CACHE, exist_ok=True)
            dst = os.path.join(DEMOS_CACHE, f"{slug}.mp4")
            tmp = dst + ".part"
            url = f"{CDN_FILMS_BASE}{slug}.mp4"
            try:
                if not (os.path.isfile(dst) and os.path.getsize(dst) > 10000):
                    req = urllib.request.Request(url, headers={"User-Agent": "LemoOpuscarStudio/1.0"})
                    with urllib.request.urlopen(req, timeout=60) as r, open(tmp, "wb") as f:
                        while True:
                            chunk = r.read(262144)
                            if not chunk:
                                break
                            f.write(chunk)
                    os.replace(tmp, dst)
                return self.send_json({
                    "ok": True,
                    "slug": slug,
                    "local_url": f"/demo-video/{slug}.mp4",
                    "size_mb": round(os.path.getsize(dst) / (1024 * 1024), 1),
                })
            except Exception as e:
                if os.path.isfile(tmp):
                    try:
                        os.remove(tmp)
                    except OSError:
                        pass
                return self.send_json({"ok": False, "error": str(e)}, 500)

        return self.send_error(404)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument("--host", default="127.0.0.1")
    args = ap.parse_args()
    srv = http.server.ThreadingHTTPServer((args.host, args.port), StudioHandler)
    print(f"Lemo-Opuscar + Dashi Studio UI running at http://{args.host}:{args.port}", flush=True)
    srv.serve_forever()


if __name__ == "__main__":
    main()
