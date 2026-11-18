"""
Synthesize & Whisper-verify non-overlapping Vietnamese cues with OmniVoice.
Supports 1-click Google Colab GPU Worker acceleration (~40x faster on free Tesla T4!)
with automatic fallback to local GPU / CPU (resume-safe, two-stage OpenMP-safe).
"""
import argparse, base64, gc, glob, json, os, re, urllib.error, urllib.request
import numpy as np
import soundfile as sf
import soxr

os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")

WORKSPACE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
COLAB_CFG = os.path.join(WORKSPACE, ".agents", "cache", "colab_worker.json")


def load_colab_config(explicit_url="", explicit_token=""):
    url = explicit_url or os.environ.get("OMNIVOICE_COLAB_URL", "")
    token = explicit_token or os.environ.get("OMNIVOICE_COLAB_TOKEN", "")
    if not url and os.path.isfile(COLAB_CFG):
        try:
            cfg = json.load(open(COLAB_CFG, encoding="utf-8"))
            if cfg.get("enabled", True):
                url = cfg.get("url", "")
                token = cfg.get("token", "")
        except Exception:
            pass
    return url.rstrip("/"), token


def try_colab_synthesize(missing_cues, out_dir, default_instruct, colab_url, colab_token):
    """Send missing cues to Google Colab T4 GPU worker; returns dict {cid: asr_txt} on success, or None to fallback."""
    if not colab_url:
        return None
    headers = {"Content-Type": "application/json", "X-Api-Token": colab_token, "User-Agent": "VideoStudioClient/1.0"}
    try:
        req_h = urllib.request.Request(f"{colab_url}/health", headers=headers, method="GET")
        with urllib.request.urlopen(req_h, timeout=6) as r:
            hdata = json.loads(r.read().decode("utf-8"))
        print(f"[Colab GPU] Connected to {hdata.get('gpu', 'Remote GPU')} at {colab_url}!", flush=True)
    except Exception as e:
        print(f"[Colab GPU] Endpoint {colab_url} unreachable ({e}) -> falling back to local execution.", flush=True)
        return None

    payload = {
        "items": [
            {
                "id": c["id"],
                "say": c["say"],
                "speed": float(c.get("speed", 1.08)),
                "max_dur": float(c.get("max_dur", 12.0)),
                "instruct": c.get("instruct", default_instruct),
            }
            for c in missing_cues
        ]
    }
    try:
        print(f"[Colab GPU] Synthesizing {len(missing_cues)} cues on remote GPU...", flush=True)
        req = urllib.request.Request(
            f"{colab_url}/synthesize",
            data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
            headers=headers,
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=600) as r:
            resp = json.loads(r.read().decode("utf-8"))
        asr_map = {}
        for item in resp.get("results", []):
            cid = item["id"]
            wav_bytes = base64.b64decode(item["wav_b64"])
            wav_path = os.path.abspath(os.path.join(out_dir, f"{cid}.wav"))
            open(wav_path, "wb").write(wav_bytes)
            asr_map[cid] = item.get("asr", "")
            print(f"  [Colab WAV] {cid}.wav ({item.get('dur', 0):.2f}s) | {asr_map[cid]}", flush=True)
        return asr_map
    except Exception as e:
        print(f"[Colab GPU] Batch synthesis error ({e}) -> falling back to local execution.", flush=True)
        return None


def find_omnivoice_snapshot():
    env_p = os.environ.get("OMNIVOICE_VI_PATH")
    if env_p and os.path.isdir(env_p):
        return env_p
    hub = os.path.expanduser(r"~\.cache\huggingface\hub\models--splendor1811--omnivoice-vietnamese\snapshots")
    snaps = sorted(glob.glob(os.path.join(hub, "*")))
    return snaps[-1] if snaps else "splendor1811/omnivoice-vietnamese"


def trim_silence(wav, sr, thr_db=-42.0, pad_ms=35):
    peak = float(np.max(np.abs(wav)))
    if peak < 1e-6:
        return wav
    thr = peak * (10 ** (thr_db / 20.0))
    win = max(1, int(0.01 * sr))
    env = np.convolve(np.abs(wav), np.ones(win) / win, mode="same")
    idx = np.where(env > thr)[0]
    if len(idx) == 0:
        return wav
    pad = int(pad_ms * sr / 1000)
    out = wav[max(0, idx[0] - pad):min(len(wav), idx[-1] + pad)].copy()
    fade = min(int(0.015 * sr), len(out) // 4)
    if fade > 1:
        out[:fade] *= np.linspace(0, 1, fade, dtype=np.float32)
        out[-fade:] *= np.linspace(1, 0, fade, dtype=np.float32)
    return out


def synth_safe_clauses(model, text, inst, spd, sr):
    words = text.split()
    if len(words) <= 34:
        out = model.generate(text=text, language="vi", instruct=inst, speed=spd, pad_duration=0.02, fade_duration=0.015)
        return trim_silence(out[0].astype(np.float32), sr)
    parts = [p.strip() for p in re.split(r"(?<=[.!?;:])\s+", text) if p.strip()]
    if len(parts) <= 1:
        mid = len(words) // 2
        parts = [" ".join(words[:mid]), " ".join(words[mid:])]
    chunks = []
    pause = np.zeros(int(0.18 * sr), dtype=np.float32)
    for p in parts:
        out = model.generate(text=p, language="vi", instruct=inst, speed=spd, pad_duration=0.02, fade_duration=0.015)
        chunks.append(trim_silence(out[0].astype(np.float32), sr))
        chunks.append(pause)
    return np.concatenate(chunks[:-1])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cues", required=True, help="JSON file: [{id, target_t0, max_dur, speed?, instruct?, sub, say}]")
    ap.add_argument("--out-dir", required=True, help="Output folder for WAVs + vo_timeline.json")
    ap.add_argument("--instruct", default="male, moderate pitch")
    ap.add_argument("--colab-url", default="", help="Optional Google Colab Worker HTTPS URL")
    ap.add_argument("--colab-token", default="", help="Optional Google Colab Worker API token")
    ap.add_argument("--force", action="store_true", help="Regenerate even if WAV already exists")
    args = ap.parse_args()

    os.makedirs(args.out_dir, exist_ok=True)
    cues = json.load(open(args.cues, encoding="utf-8"))

    missing = [
        c for c in cues
        if args.force or not (os.path.isfile(os.path.join(args.out_dir, f"{c['id']}.wav")) and os.path.getsize(os.path.join(args.out_dir, f"{c['id']}.wav")) > 1000)
    ]

    colab_asr_cache = {}
    if missing:
        c_url, c_tok = load_colab_config(args.colab_url, args.colab_token)
        remote_res = try_colab_synthesize(missing, args.out_dir, args.instruct, c_url, c_tok)
        if remote_res is not None:
            colab_asr_cache = remote_res
            missing = [
                c for c in cues
                if not (os.path.isfile(os.path.join(args.out_dir, f"{c['id']}.wav")) and os.path.getsize(os.path.join(args.out_dir, f"{c['id']}.wav")) > 1000)
            ]

    # Local fallback if Colab not connected or any cues remain
    if missing:
        import torch
        logical = os.cpu_count() or 4
        # 16+ logical CPUs on this studio box are hyperthreads. One worker per physical core.
        workers = logical // 2 if logical >= 16 else logical
        torch.set_num_threads(max(1, workers))
        try:
            torch.set_num_interop_threads(1)
        except RuntimeError:
            pass
        dev = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"[OmniVoice Local ({dev})] Synthesizing {len(missing)}/{len(cues)} cues...", flush=True)
        from omnivoice import OmniVoice
        model = OmniVoice.from_pretrained(find_omnivoice_snapshot(), device_map=dev)
        sr = model.sampling_rate
        for c in missing:
            cid = c["id"]
            spd = float(c.get("speed", 1.08))
            max_dur = float(c.get("max_dur", 12.0))
            inst = c.get("instruct", args.instruct)
            for attempt in range(2):
                audio = synth_safe_clauses(model, c["say"], inst, spd, sr)
                dur = len(audio) / sr
                if dur <= max_dur or attempt == 1:
                    break
                spd = min(1.30, spd * (dur / max_dur) * 1.03)
            wav_path = os.path.abspath(os.path.join(args.out_dir, f"{cid}.wav"))
            sf.write(wav_path, audio, sr)
            print(f"  [WAV] {cid}.wav ({len(audio)/sr:.2f}s)", flush=True)
        del model
        gc.collect()

    # Assemble non-overlapping timeline (reusing Colab GPU ASR when available, or running local faster-whisper)
    need_local_asr = any(c["id"] not in colab_asr_cache for c in cues)
    whisper = None
    if need_local_asr:
        print("[Whisper] Verifying ASR & assembling non-overlapping timeline...", flush=True)
        from faster_whisper import WhisperModel
        whisper = WhisperModel("base", device="cpu", compute_type="int8", cpu_threads=4)

    timeline = []
    prev_t1 = 0.0
    for c in cues:
        cid = c["id"]
        wav_path = os.path.abspath(os.path.join(args.out_dir, f"{cid}.wav"))
        audio, sr = sf.read(wav_path, dtype="float32")
        if audio.ndim > 1:
            audio = audio.mean(axis=1)
        if cid in colab_asr_cache:
            asr_txt = colab_asr_cache[cid]
        else:
            segs, _ = whisper.transcribe(soxr.resample(audio, sr, 16000), language="vi")
            asr_txt = " ".join(s.text.strip() for s in segs)
        gap = float(c.get("min_gap", 0.55))
        t0 = round(max(float(c["target_t0"]), prev_t1 + gap), 3)
        t1 = round(t0 + len(audio) / sr, 3)
        prev_t1 = t1
        print(f"  [{cid}] {t0:6.2f}s .. {t1:6.2f}s ({t1-t0:.2f}s) | {asr_txt}", flush=True)
        timeline.append({
            "id": cid,
            "t0": t0,
            "t1": t1,
            "dur": round(t1 - t0, 3),
            "sub": c["sub"],
            "say": c["say"],
            "asr": asr_txt,
            "wav": wav_path,
        })

    tl_path = os.path.join(args.out_dir, "vo_timeline.json")
    json.dump(timeline, open(tl_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"[DONE] Saved {tl_path} (final cue ends at {prev_t1:.2f}s)", flush=True)


if __name__ == "__main__":
    main()
