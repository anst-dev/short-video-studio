"""
Self-contained Vietnamese Neural Voiceover Synthesizer & Faster-Whisper ASR Verifier
for `v8_system_prompt_chung1981` / `Ban_11_System_Prompt_Nguyen_Dang_Chung_1981`.
"""
import asyncio, json, os, subprocess
import numpy as np
import soundfile as sf
import soxr
import edge_tts

os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")

HERE = os.path.dirname(os.path.abspath(__file__))
CUES_PATH = os.path.join(HERE, "cues.json")
VO_DIR = os.path.join(HERE, "vo")
VOICE = "vi-VN-NamMinhNeural"


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


async def _one_tts(text, voice, rate_str, mp3_tmp):
    comm = edge_tts.Communicate(text, voice, rate=rate_str)
    await comm.save(mp3_tmp)


def synth_all(cues):
    import time
    os.makedirs(VO_DIR, exist_ok=True)
    for c in cues:
        cid = c["id"]
        wav_path = os.path.join(VO_DIR, f"{cid}.wav")
        if os.path.isfile(wav_path) and os.path.getsize(wav_path) > 2000:
            audio, sr = sf.read(wav_path, dtype="float32")
            print(f"  [CACHED] {cid}.wav ({len(audio)/sr:.2f}s)", flush=True)
            continue
        mp3_tmp = os.path.join(VO_DIR, f"{cid}.tmp.mp3")
        spd = float(c.get("speed", 1.06))
        pct = int(round((spd - 1.0) * 100))
        rate_str = f"+{pct}%" if pct >= 0 else f"{pct}%"

        for attempt in range(25):
            try:
                if os.path.exists(mp3_tmp):
                    os.remove(mp3_tmp)
                asyncio.run(_one_tts(c["say"], VOICE, rate_str, mp3_tmp))
                if os.path.isfile(mp3_tmp) and os.path.getsize(mp3_tmp) > 500:
                    break
            except Exception as e:
                print(f"    [retry {attempt+1}/25 for {cid}: {e}]", flush=True)
                time.sleep(2.0)

        subprocess.run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-i", mp3_tmp, "-ac", "1", "-ar", "24000", wav_path
        ], check=True)
        if os.path.exists(mp3_tmp):
            os.remove(mp3_tmp)

        audio, sr = sf.read(wav_path, dtype="float32")
        if audio.ndim > 1:
            audio = audio.mean(axis=1)
        audio = trim_silence(audio, sr)
        sf.write(wav_path, audio, sr)
        print(f"  [WAV] {cid}.wav ({len(audio)/sr:.2f}s)", flush=True)
        time.sleep(0.6)


def main():
    cues = json.load(open(CUES_PATH, encoding="utf-8"))
    print(f"[TTS] Synthesizing {len(cues)} Vietnamese cues ({VOICE})...", flush=True)
    synth_all(cues)

    print("[Whisper] Verifying ASR & assembling non-overlapping timeline...", flush=True)
    from faster_whisper import WhisperModel
    whisper = WhisperModel("base", device="cpu", compute_type="int8", cpu_threads=4)

    timeline = []
    prev_t1 = 0.0
    for c in cues:
        cid = c["id"]
        wav_path = os.path.abspath(os.path.join(VO_DIR, f"{cid}.wav"))
        audio, sr = sf.read(wav_path, dtype="float32")
        if audio.ndim > 1:
            audio = audio.mean(axis=1)
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
            "wav": f"vo/{cid}.wav",
        })

    tl_path = os.path.join(VO_DIR, "vo_timeline.json")
    json.dump(timeline, open(tl_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"[DONE] Saved {tl_path} (final cue ends at {prev_t1:.2f}s)", flush=True)


if __name__ == "__main__":
    main()
