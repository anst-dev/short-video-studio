"""
Compose bright VCSL mallet/chime score + frame-exact Dashi flowchart foley + compressed OmniVoice narration
for `films/v4_khai_niem_ai_coban` -> `out/mix.wav` + `OUTPUT_VIDEOS/Giai_Ma_AI_Co_Ban_Ap_Dung_Cong_Viec.srt`.
"""
import json, os, sys
import numpy as np
import soundfile as sf
import soxr
from scipy.ndimage import uniform_filter1d

HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.path.abspath(os.path.join(HERE, "..", ".."))
WORKSPACE = os.path.abspath(os.path.join(LIB, ".."))
sys.path.insert(0, LIB)

from core.audio import sampler as S
from core.audio import sfx

SR = sfx.SR  # 48000


def fmt_srt_ts(sec: float) -> str:
    ms = int(round(sec * 1000))
    h = ms // 3600000
    ms %= 3600000
    m = ms // 60000
    ms %= 60000
    s = ms // 1000
    ms %= 1000
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def write_srt(vo_list, dur, srt_path):
    os.makedirs(os.path.dirname(srt_path), exist_ok=True)
    blocks = []
    for idx, c in enumerate(vo_list):
        next_t0 = vo_list[idx + 1]["t0"] - 0.10 if idx + 1 < len(vo_list) else dur - 0.15
        c0 = max(0.05, c["t0"] - 0.06)
        c1 = min(next_t0, max(c["t1"] + 0.50, c0 + 1.85))
        blocks.append(f"{idx + 1}\n{fmt_srt_ts(c0)} --> {fmt_srt_ts(c1)}\n{c['sub']}")
    open(srt_path, "w", encoding="utf-8").write("\n\n".join(blocks) + "\n")


def main():
    vo_path = os.path.join(HERE, "vo", "vo_timeline.json")
    ev_path = os.path.join(HERE, "events.json")
    vo = json.load(open(vo_path, encoding="utf-8"))
    ev_doc = json.load(open(ev_path, encoding="utf-8")) if os.path.isfile(ev_path) else {"dur": float(np.ceil(vo[-1]["t1"] + 3.0)), "events": []}
    dur = float(ev_doc.get("dur", np.ceil(vo[-1]["t1"] + 3.0)))
    events = ev_doc.get("events", [])

    srt_out = os.path.join(WORKSPACE, "OUTPUT_VIDEOS", "Giai_Ma_AI_Co_Ban_Ap_Dung_Cong_Viec.srt")
    write_srt(vo, dur, srt_out)

    n_samples = int(round(dur * SR))

    # 1. Voice track
    vo_mono = np.zeros(n_samples, dtype=np.float32)
    speech_mask = np.zeros(n_samples, dtype=np.float32)
    for c in vo:
        w, w_sr = sf.read(c["wav"], dtype="float32")
        if w.ndim > 1:
            w = w.mean(axis=1)
        if w_sr != SR:
            w = soxr.resample(w, w_sr, SR)
        rms = float(np.sqrt(np.mean(w ** 2) + 1e-9))
        w = w * (0.14 / rms)
        s0 = int(round(c["t0"] * SR))
        e0 = min(n_samples, s0 + len(w))
        if e0 > s0:
            vo_mono[s0:e0] += w[:e0 - s0]
            pad = int(0.18 * SR)
            speech_mask[max(0, s0 - pad):min(n_samples, e0 + pad)] = 1.0

    vo_mono = sfx.compress(vo_mono, thr=0.22, ratio=3.4)
    speech_env = uniform_filter1d(speech_mask, size=int(0.28 * SR))

    # 2. Warm, curious VCSL explainer score (F major / D minor / Bb lydian / C major, 120 BPM)
    S.seed(2026)
    chords = [
        ("F2", ["C3", "F3", "A3", "C4"]),
        ("D3", ["A3", "D4", "F4", "A4"]),
        ("Bb2", ["F3", "Bb3", "D4", "F4"]),
        ("C3", ["G3", "C4", "E4", "G4"]),
    ]
    notes = []
    bar_dur = 2.0
    for b in range(int(dur // bar_dur)):
        t_bar = b * bar_dur
        if t_bar > dur - 1.5:
            break
        bass_p, tones = chords[b % 4]
        notes.append((t_bar, "marimba", bass_p, 0.85, 0.42, -0.20))
        notes.append((t_bar + 0.5, "xylophone", tones[1], 0.45, 0.24, 0.22))
        notes.append((t_bar + 1.0, "marimba", tones[0], 0.80, 0.36, -0.10))
        notes.append((t_bar + 1.5, "vibraphone", tones[2], 1.10, 0.28, 0.20))
        if b % 4 == 0:
            notes.append((t_bar, "hand_chimes", tones[3], 1.6, 0.18, 0.15))
        if b % 8 == 0:
            notes.append((t_bar, "vibraphone_bowed", tones[1], 3.4, 0.18, 0.0))

    notes.append((max(0.0, dur - 2.6), "vibraphone", "F4", 2.3, 0.38, -0.2))
    notes.append((max(0.0, dur - 2.6), "vibraphone", "A4", 2.3, 0.36, 0.2))
    notes.append((max(0.0, dur - 2.6), "glockenspiel", "C5", 2.2, 0.24, 0.0))

    music = S.render(notes, dur)
    duck_mus = 1.0 - 0.72 * speech_env
    music[:, 0] *= duck_mus * 0.48
    music[:, 1] *= duck_mus * 0.48

    # Gate music to 0 during planned dramatic silences
    sil_mask = np.ones(n_samples, dtype=np.float32)
    for ev in events:
        if ev.get("type") == "silence":
            st = float(ev["t"])
            sd = float(ev.get("dur", 0.75))
            i0 = max(0, int(round(st * SR)))
            i1 = min(n_samples, int(round((st + sd) * SR)))
            sil_mask[i0:i1] = 0.0
    sil_env = uniform_filter1d(sil_mask, size=int(0.08 * SR))
    music[:, 0] *= sil_env
    music[:, 1] *= sil_env

    # 3. Frame-exact Flowchart Foley
    foley = np.zeros((n_samples, 2), dtype=np.float32)
    for ev in events:
        t = float(ev.get("t", 0.0))
        tp = ev.get("type", "")
        if tp == "station_pop":
            sfx.add(foley, sfx.pop(0.22), t, gain=0.55, pan=-0.12)
        elif tp == "chip_pop":
            sfx.add(foley, sfx.click(1.25, 0.16), t, gain=0.50, pan=0.10)
        elif tp == "arrow_whoosh":
            sfx.add(foley, sfx.whoosh(0.32, 0.18), t, gain=0.50, pan=0.0)
        elif tp == "warn_thump":
            sfx.add(foley, sfx.thump(0.22, 68), t, gain=0.65, pan=-0.1)
            sfx.add(foley, sfx.clack(0.9, 0.20), t, gain=0.55, pan=-0.1)
        elif tp == "stamp_ding":
            sfx.add(foley, sfx.ding(0.26), t, gain=0.65, pan=0.05)

    duck_fol = 1.0 - 0.42 * speech_env
    foley[:, 0] *= duck_fol
    foley[:, 1] *= duck_fol

    mix = np.zeros((n_samples, 2), dtype=np.float32)
    mix[:, 0] = vo_mono * 0.92 + music[:, 0] + foley[:, 0]
    mix[:, 1] = vo_mono * 0.92 + music[:, 1] + foley[:, 1]
    mix[:, 0] = sfx.limit(mix[:, 0], ceil=0.88)
    mix[:, 1] = sfx.limit(mix[:, 1], ceil=0.88)

    out_dir = os.path.join(HERE, "out")
    os.makedirs(out_dir, exist_ok=True)
    out_wav = os.path.join(out_dir, "mix.wav")
    sf.write(out_wav, mix, SR)
    print(f"[mix.py] Wrote {out_wav} ({dur:.2f}s @ {SR}Hz) and {srt_out}", flush=True)


if __name__ == "__main__":
    main()
