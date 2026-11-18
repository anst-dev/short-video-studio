"""
Self-contained Two-Resolution Score (Hi-Fi Mallet/Piano/Bass + 8-Bit Chiptune Mascot Voice)
+ Frame-Exact Screencast Foley + Compressed Vietnamese Narration Mixer
for `v8_system_prompt_chung1981` / `Ban_11_System_Prompt_Nguyen_Dang_Chung_1981`.
"""
import json, os, sys
import numpy as np
import soundfile as sf
import soxr
from scipy.ndimage import uniform_filter1d

HERE = os.path.dirname(os.path.abspath(__file__))
# Discover lemo-opuscar root whether running inside lemo-opuscar/films/<name>, projects/<name>, or OUTPUT_VIDEOS/<name>
for cand in [
    os.path.abspath(os.path.join(HERE, "..", "..")),
    os.path.abspath(os.path.join(HERE, "..", "..", "lemo-opuscar")),
    os.path.abspath(os.path.join(HERE, "..", "lemo-opuscar")),
]:
    if os.path.isdir(os.path.join(cand, "core", "audio")):
        LIB = cand
        break
else:
    LIB = os.path.abspath(os.path.join(HERE, "..", ".."))

WORKSPACE = os.path.abspath(os.path.join(LIB, ".."))
sys.path.insert(0, LIB)

from core.audio import sfx

SR = sfx.SR  # 48000

_NOTE_PC = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def note_hz(p: str) -> float:
    p = p.strip()
    pc = _NOTE_PC[p[0].upper()]
    acc = p[1:-1].count("#") - p[1:-1].count("b")
    octv = int(p[-1])
    midi = 12 * (octv + 1) + pc + acc
    return 440.0 * (2.0 ** ((midi - 69.0) / 12.0))


def fmt_srt_ts(sec: float) -> str:
    ms = int(round(sec * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def write_srt(vo_list, dur, srt_paths):
    blocks = []
    for idx, c in enumerate(vo_list):
        next_t0 = vo_list[idx + 1]["t0"] - 0.10 if idx + 1 < len(vo_list) else dur - 0.15
        c0 = max(0.05, c["t0"] - 0.06)
        c1 = min(next_t0, max(c["t1"] + 0.50, c0 + 1.85))
        blocks.append(f"{idx + 1}\n{fmt_srt_ts(c0)} --> {fmt_srt_ts(c1)}\n{c['sub']}")
    srt_text = "\n\n".join(blocks) + "\n"
    for sp in srt_paths:
        os.makedirs(os.path.dirname(sp), exist_ok=True)
        open(sp, "w", encoding="utf-8").write(srt_text)


def synth_marimba(freq: float, dur: float, vel: float = 0.4) -> np.ndarray:
    t = sfx.t_(dur)
    env1 = np.minimum(1.0, t / 0.004) * np.exp(-t / 0.28)
    env4 = np.minimum(1.0, t / 0.002) * np.exp(-t / 0.065)
    strike = sfx.bp(np.random.default_rng(int(freq * 13)).standard_normal(len(t)), 600, 2400) * np.exp(-t / 0.009) * 0.12
    wave = (np.sin(2 * np.pi * freq * t) * env1 + 0.28 * np.sin(2 * np.pi * (freq * 4.0) * t) * env4 + strike)
    return (wave * vel * 0.45).astype(np.float32)


def synth_vibraphone(freq: float, dur: float, vel: float = 0.35) -> np.ndarray:
    t = sfx.t_(dur)
    trem = 1.0 - 0.18 * (0.5 - 0.5 * np.cos(2 * np.pi * 5.2 * t))
    env1 = np.minimum(1.0, t / 0.008) * np.exp(-t / (dur * 0.72 + 0.35))
    env2 = np.minimum(1.0, t / 0.005) * np.exp(-t / 0.22)
    wave = (np.sin(2 * np.pi * freq * t) * env1 + 0.18 * np.sin(2 * np.pi * freq * 4.0 * t) * env2) * trem
    return (wave * vel * 0.42).astype(np.float32)


def synth_bass(freq: float, dur: float, vel: float = 0.45) -> np.ndarray:
    t = sfx.t_(dur)
    env = np.minimum(1.0, t / 0.007) * np.exp(-t / 0.36)
    wave = (np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 2.0 * t) * np.exp(-t / 0.14)) * env
    return (wave * vel * 0.48).astype(np.float32)


def synth_chip_pulse(freq: float, dur: float, duty: float = 0.25, vel: float = 0.22, slide: float = 1.0) -> np.ndarray:
    t = sfx.t_(dur)
    fr = freq * (slide ** (t / max(1e-4, dur)))
    ph = np.cumsum(fr) / SR
    x = np.zeros(len(t), dtype=np.float32)
    for k in range(1, 16):
        fk = fr * k
        m = fk < 14000.0
        x += (m * (np.sin(np.pi * k * duty) / k) * np.cos(2 * np.pi * k * (ph - duty / 2.0))).astype(np.float32)
    env = np.minimum(1.0, t / 0.003) * np.minimum(1.0, np.maximum(0.0, (dur - t) / 0.035))
    return (x * env * vel * 0.45).astype(np.float32)


def main():
    vo_path = os.path.join(HERE, "vo", "vo_timeline.json")
    ev_path = os.path.join(HERE, "events.json")
    vo = json.load(open(vo_path, encoding="utf-8")) if os.path.isfile(vo_path) else []
    ev_doc = json.load(open(ev_path, encoding="utf-8")) if os.path.isfile(ev_path) else {"dur": 144.0, "events": []}
    default_dur = max(144.0, (vo[-1]["t1"] + 2.5) if vo else 144.0)
    dur = float(ev_doc.get("dur", default_dur))
    events = ev_doc.get("events", ev_doc.get("ev", []))

    srt_targets = [
        os.path.join(HERE, "Ban_11_System_Prompt_Nguyen_Dang_Chung_1981.srt"),
        os.path.join(WORKSPACE, "OUTPUT_VIDEOS", "Ban_11_System_Prompt_Nguyen_Dang_Chung_1981", "Ban_11_System_Prompt_Nguyen_Dang_Chung_1981.srt"),
    ]
    if vo:
        write_srt(vo, dur, srt_targets)

    n_samples = int(round(dur * SR))

    # 1. Voiceover Track (Mono -> RMS Balanced -> Compressed)
    vo_mono = np.zeros(n_samples, dtype=np.float32)
    speech_mask = np.zeros(n_samples, dtype=np.float32)
    for c in vo:
        wav_p = c["wav"]
        if not os.path.isabs(wav_p):
            wav_p = os.path.join(HERE, wav_p)
        if not os.path.isfile(wav_p):
            wav_p = os.path.join(HERE, "vo", f"{c['id']}.wav")
        w, w_sr = sf.read(wav_p, dtype="float32")
        if w.ndim > 1:
            w = w.mean(axis=1)
        if w_sr != SR:
            w = soxr.resample(w, w_sr, SR)
        rms = float(np.sqrt(np.mean(w ** 2) + 1e-9))
        w = w * (0.145 / rms)
        s0 = int(round(c["t0"] * SR))
        e0 = min(n_samples, s0 + len(w))
        if e0 > s0:
            vo_mono[s0:e0] += w[:e0 - s0]
            pad = int(0.18 * SR)
            speech_mask[max(0, s0 - pad):min(n_samples, e0 + pad)] = 1.0

    if vo:
        vo_mono = sfx.compress(vo_mono, thr=0.22, ratio=3.4)
    speech_env = uniform_filter1d(speech_mask, size=int(0.28 * SR))

    # 2. Two-Resolution Score (Hi-Fi Acoustic Layer + 8-Bit Chiptune Mascot Layer @ 120 BPM)
    music = np.zeros((n_samples, 2), dtype=np.float32)
    chords = [
        ("F2", ["F3", "A3", "C4", "E4", "G4"]),
        ("A2", ["E3", "G3", "A3", "C4", "E4"]),
        ("D2", ["F3", "A3", "C4", "D4", "F4"]),
        ("G2", ["D3", "F3", "A3", "B3", "D4"]),
    ]
    bar_dur = 2.0  # 120 BPM (0.5s per beat)
    n_bars = int(dur // bar_dur)
    for b in range(n_bars):
        tb = b * bar_dur
        if tb > dur - 1.2:
            break
        root, tones = chords[b % 4]
        # Hi-Fi Bass & Mallet groove
        sfx.add(music, synth_bass(note_hz(root), 0.75, 0.44), tb, gain=1.0, pan=-0.05)
        sfx.add(music, synth_marimba(note_hz(tones[0]), 0.65, 0.38), tb + 0.5, gain=1.0, pan=-0.22)
        sfx.add(music, synth_vibraphone(note_hz(tones[1]), 1.15, 0.34), tb + 1.0, gain=1.0, pan=0.20)
        sfx.add(music, synth_marimba(note_hz(tones[2]), 0.65, 0.35), tb + 1.5, gain=1.0, pan=-0.15)
        if b % 2 == 1:
            sfx.add(music, synth_vibraphone(note_hz(tones[3]), 0.90, 0.28), tb + 1.75, gain=1.0, pan=0.26)
        # Pixel Mascot 8-bit motif counter-melody every 2 bars
        if b % 2 == 0:
            sfx.add(music, synth_chip_pulse(note_hz(tones[3]) * 2.0, 0.18, 0.25, 0.16), tb + 0.25, gain=1.0, pan=0.32)
            sfx.add(music, synth_chip_pulse(note_hz(tones[4]) * 2.0, 0.22, 0.25, 0.15), tb + 1.25, gain=1.0, pan=0.32)

    # Warm final resolution chord
    t_end = max(0.0, dur - 2.6)
    for j, nt in enumerate(["F3", "A3", "C4", "E4", "G4"]):
        sfx.add(music, synth_vibraphone(note_hz(nt), 2.3, 0.34), t_end + j * 0.04, gain=1.0, pan=-0.25 + j * 0.12)
    sfx.add(music, synth_chip_pulse(note_hz("F5"), 0.45, 0.25, 0.20), t_end + 0.2, gain=1.0, pan=0.2)

    # Duck music under speech (-10.5 dB)
    duck_mus = (1.0 - 0.72 * speech_env) * 0.52
    music[:, 0] *= duck_mus
    music[:, 1] *= duck_mus

    # Gate music cleanly to 0 during planned dramatic silences
    sil_mask = np.ones(n_samples, dtype=np.float32)
    for ev in events:
        if ev.get("type") == "silence":
            st = float(ev["t"])
            sd = float(ev.get("dur", 0.72))
            i0 = max(0, int(round(st * SR)))
            i1 = min(n_samples, int(round((st + sd) * SR)))
            sil_mask[i0:i1] = 0.0
    sil_env = uniform_filter1d(sil_mask, size=int(0.07 * SR))
    music[:, 0] *= sil_env
    music[:, 1] *= sil_env

    # 3. Frame-Exact Mascot Screencast Foley (Keyboard + Mouse + 8-Bit Mascot Jumps/Steps)
    foley = np.zeros((n_samples, 2), dtype=np.float32)
    for ev in events:
        t = float(ev.get("t", 0.0))
        tp = ev.get("type", "")
        if tp in ("key_click", "key"):
            sfx.add(foley, sfx.step(0.10), t, gain=0.42, pan=-0.12)
        elif tp in ("enter_hit", "enter"):
            sfx.add(foley, sfx.clack(1.05, 0.22), t, gain=0.58, pan=0.0)
        elif tp in ("click", "chip_pop"):
            sfx.add(foley, sfx.click(1.25, 0.16), t, gain=0.48, pan=0.10)
        elif tp in ("pop", "station_pop"):
            sfx.add(foley, sfx.pop(0.20), t, gain=0.50, pan=0.0)
        elif tp in ("jump8", "mascot_jump"):
            sfx.add(foley, synth_chip_pulse(420.0, 0.11, 0.25, 0.24, slide=1.85), t, gain=0.55, pan=0.18)
        elif tp in ("land8", "mascot_land"):
            sfx.add(foley, synth_chip_pulse(220.0, 0.08, 0.5, 0.22, slide=0.65), t, gain=0.50, pan=0.18)
        elif tp in ("whoosh", "wipe"):
            sfx.add(foley, sfx.whoosh(0.32, 0.18), t, gain=0.46, pan=0.0)
        elif tp in ("okr_ding", "ding", "stamp_ding"):
            sfx.add(foley, sfx.ding(0.26), t, gain=0.60, pan=0.08)

    duck_fol = 1.0 - 0.42 * speech_env
    foley[:, 0] *= duck_fol
    foley[:, 1] *= duck_fol

    # 4. Sum & Soft-Limit Pre-Master Mix
    mix = np.zeros((n_samples, 2), dtype=np.float32)
    mix[:, 0] = sfx.limit(vo_mono * 0.92 + music[:, 0] + foley[:, 0], ceil=0.88)
    mix[:, 1] = sfx.limit(vo_mono * 0.92 + music[:, 1] + foley[:, 1], ceil=0.88)

    out_dir = os.path.join(HERE, "out")
    os.makedirs(out_dir, exist_ok=True)
    out_wav = os.path.join(out_dir, "mix.wav")
    sf.write(out_wav, mix, SR)
    print(f"[mix.py] Wrote {out_wav} ({dur:.2f}s @ {SR}Hz)", flush=True)


if __name__ == "__main__":
    main()
