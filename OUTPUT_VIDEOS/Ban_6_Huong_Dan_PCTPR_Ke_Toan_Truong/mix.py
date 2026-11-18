"""
Compose VCSL office-mallet score + frame-exact spreadsheet foley + compressed OmniVoice narration
for `films/v3_pctpr_ketoan` -> `out/mix.wav` + `OUTPUT_VIDEOS/Huong_Dan_PCTPR_Ke_Toan_Truong.srt`.
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


def blip(freq=880.0, dur=0.045, vol=0.12):
    tt = sfx.t_(dur)
    env = np.sin(np.pi * tt / dur) * np.exp(-tt / 0.025)
    return np.sin(2 * np.pi * freq * tt) * env * vol


def main():
    vo_path = os.path.join(HERE, "vo", "vo_timeline.json")
    ev_path = os.path.join(HERE, "events.json")
    vo = json.load(open(vo_path, encoding="utf-8"))
    ev_doc = json.load(open(ev_path, encoding="utf-8")) if os.path.isfile(ev_path) else {"dur": 228.0, "events": []}
    dur = float(ev_doc.get("dur", max(226.0, vo[-1]["t1"] + 3.5)))
    events = ev_doc.get("events", [])

    # Export clean external SRT file
    srt_out = os.path.join(WORKSPACE, "OUTPUT_VIDEOS", "Huong_Dan_PCTPR_Ke_Toan_Truong.srt")
    write_srt(vo, dur, srt_out)

    n_samples = int(round(dur * SR))

    # 1. Voice track (mono -> compressed -> centered)
    vo_mono = np.zeros(n_samples, dtype=np.float32)
    speech_mask = np.zeros(n_samples, dtype=np.float32)
    for c in vo:
        w, w_sr = sf.read(c["wav"], dtype="float32")
        if w.ndim > 1:
            w = w.mean(axis=1)
        if w_sr != SR:
            w = soxr.resample(w, w_sr, SR)
        # Normalize individual cue RMS gently for consistent narration volume
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

    # 2. Calm 120 BPM VCSL Mallet Score (C major / A minor / F lydian warm progression)
    S.seed(1981)
    chords = [
        ("C3", ["G3", "C4", "E4", "G4"]),
        ("A2", ["E3", "A3", "C4", "E4"]),
        ("F2", ["C3", "F3", "A3", "C4"]),
        ("G2", ["D3", "G3", "B3", "D4"]),
    ]
    notes = []
    bar_dur = 2.0  # 120 BPM, 4/4
    n_bars = int(dur // bar_dur)
    for b in range(n_bars):
        t_bar = b * bar_dur
        if t_bar > dur - 1.5:
            break
        bass_p, tones = chords[b % 4]
        # Warm marimba pulse on beat 1 and beat 3
        notes.append((t_bar, "marimba", bass_p, 0.9, 0.42, -0.18))
        notes.append((t_bar + 1.0, "marimba", tones[0], 0.8, 0.36, 0.16))
        # Gentle eighth/quarter arpeggio on marimba & vibraphone
        notes.append((t_bar + 0.5, "vibraphone", tones[1], 1.1, 0.30, -0.25))
        notes.append((t_bar + 1.5, "vibraphone", tones[2], 1.0, 0.30, 0.25))
        if b % 2 == 1:
            notes.append((t_bar + 1.75, "marimba", tones[3], 0.5, 0.26, 0.10))
        if b % 4 == 0:
            notes.append((t_bar, "glockenspiel", tones[3], 1.4, 0.18, 0.22))
        if b % 8 == 0:
            notes.append((t_bar, "vibraphone_bowed", tones[1], 3.6, 0.20, 0.0))

    # Closing warm cadence chord
    notes.append((max(0.0, dur - 2.8), "vibraphone", "C4", 2.5, 0.38, -0.2))
    notes.append((max(0.0, dur - 2.8), "vibraphone", "E4", 2.5, 0.36, 0.2))
    notes.append((max(0.0, dur - 2.8), "glockenspiel", "G5", 2.4, 0.22, 0.0))

    music = S.render(notes, dur)

    # Carve 300 Hz - 3.5 kHz subtly and duck music under speech (-10.5 dB)
    duck_mus = 1.0 - 0.72 * speech_env
    music[:, 0] *= duck_mus * 0.48
    music[:, 1] *= duck_mus * 0.48

    # Gate music cleanly to 0 during planned dramatic silences!
    sil_mask = np.ones(n_samples, dtype=np.float32)
    for ev in events:
        if ev.get("type") == "silence":
            st = float(ev["t"])
            sd = float(ev.get("dur", 0.70))
            i0 = max(0, int(round(st * SR)))
            i1 = min(n_samples, int(round((st + sd) * SR)))
            sil_mask[i0:i1] = 0.0
    sil_env = uniform_filter1d(sil_mask, size=int(0.08 * SR))
    music[:, 0] *= sil_env
    music[:, 1] *= sil_env

    # 3. Frame-exact Spreadsheet Foley
    foley = np.zeros((n_samples, 2), dtype=np.float32)
    for ev in events:
        t = float(ev.get("t", 0.0))
        tp = ev.get("type", "")
        if tp == "key_click":
            sfx.add(foley, sfx.step(0.11), t, gain=0.45, pan=-0.12)
        elif tp == "enter_hit":
            sfx.add(foley, sfx.clack(1.05, 0.22), t, gain=0.65, pan=0.0)
            sfx.add(foley, sfx.thump(0.15, 78), t, gain=0.45, pan=0.0)
        elif tp == "cell_hop":
            sfx.add(foley, sfx.click(1.25, 0.14), t, gain=0.50, pan=0.1)
        elif tp == "col_ratchet":
            idx = int(ev.get("idx", 0))
            sfx.add(foley, sfx.click(1.0 + idx * 0.07, 0.20), t, gain=0.60, pan=-0.2 + idx * 0.06)
        elif tp == "paint_sweep":
            p = float(ev.get("p", 0.5))
            sfx.add(foley, blip(520 + 480 * p, 0.04, 0.10), t, gain=0.45, pan=-0.25 + 0.5 * p)
        elif tp == "okr_ding":
            sfx.add(foley, sfx.ding(0.24), t, gain=0.60, pan=0.08)
        elif tp == "whoosh":
            sfx.add(foley, sfx.whoosh(0.30, 0.18), t, gain=0.45, pan=0.0)

    duck_fol = 1.0 - 0.42 * speech_env
    foley[:, 0] *= duck_fol
    foley[:, 1] *= duck_fol

    # 4. Sum & soft-limit pre-master mix
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
