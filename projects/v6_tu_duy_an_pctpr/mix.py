"""Auto-scaffolded VCSL + Foley + OmniVoice mixer for `v6_tu_duy_an_pctpr`."""
import json, os, sys
import numpy as np
import soundfile as sf
import soxr
from scipy.ndimage import uniform_filter1d

HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.path.abspath(os.path.join(HERE, "..", ".."))
WORKSPACE = os.path.abspath(os.path.join(LIB, ".."))
sys.path.insert(0, LIB)
from core.audio import sampler as S, sfx

SR = sfx.SR

def fmt_srt(sec):
    ms = int(round(sec * 1000))
    h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

def main():
    vo_p = os.path.join(HERE, "vo", "vo_timeline.json")
    ev_p = os.path.join(HERE, "events.json")
    vo = json.load(open(vo_p, encoding="utf-8")) if os.path.isfile(vo_p) else []
    ev_doc = json.load(open(ev_p, encoding="utf-8")) if os.path.isfile(ev_p) else {"dur": 140.0, "events": []}
    dur = float(ev_doc.get("dur", 140.0))
    events = ev_doc.get("events", [])

    if vo:
        srt_out = os.path.join(WORKSPACE, "OUTPUT_VIDEOS", "Tu_Duy_An_Dang_Sau_Khung_PCTPR.srt")
        os.makedirs(os.path.dirname(srt_out), exist_ok=True)
        blocks = []
        for idx, c in enumerate(vo):
            nxt = vo[idx + 1]["t0"] - 0.10 if idx + 1 < len(vo) else dur - 0.15
            c0 = max(0.05, c["t0"] - 0.06)
            c1 = min(nxt, max(c["t1"] + 0.50, c0 + 1.85))
            blocks.append(f"{idx+1}\n{fmt_srt(c0)} --> {fmt_srt(c1)}\n{c['sub']}")
        open(srt_out, "w", encoding="utf-8").write("\n\n".join(blocks) + "\n")

    n = int(round(dur * SR))
    vo_mono = np.zeros(n, dtype=np.float32)
    mask = np.zeros(n, dtype=np.float32)
    for c in vo:
        w, wsr = sf.read(c["wav"], dtype="float32")
        if w.ndim > 1: w = w.mean(axis=1)
        if wsr != SR: w = soxr.resample(w, wsr, SR)
        w = w * (0.14 / float(np.sqrt(np.mean(w ** 2) + 1e-9)))
        s0 = int(round(c["t0"] * SR)); e0 = min(n, s0 + len(w))
        if e0 > s0:
            vo_mono[s0:e0] += w[:e0 - s0]
            mask[max(0, s0 - int(0.18 * SR)):min(n, e0 + int(0.18 * SR))] = 1.0
    if vo:
        vo_mono = sfx.compress(vo_mono, thr=0.22, ratio=3.4)
    speech_env = uniform_filter1d(mask, size=int(0.28 * SR))

    S.seed(42)
    chords = [("C3", ["G3", "C4", "E4", "G4"]), ("A2", ["E3", "A3", "C4", "E4"]), ("F2", ["C3", "F3", "A3", "C4"]), ("G2", ["D3", "G3", "B3", "D4"])]
    notes = []
    for b in range(int(dur // 2.0)):
        tb = b * 2.0
        if tb > dur - 1.5: break
        bp, tn = chords[b % 4]
        notes += [(tb, "marimba", bp, 0.85, 0.40, -0.18), (tb + 0.5, "vibraphone", tn[1], 1.0, 0.28, 0.2), (tb + 1.0, "marimba", tn[0], 0.8, 0.34, 0.12), (tb + 1.5, "vibraphone", tn[2], 1.0, 0.28, -0.2)]
    music = S.render(notes, dur)
    duck = (1.0 - 0.72 * speech_env) * 0.48
    music[:, 0] *= duck; music[:, 1] *= duck

    sil = np.ones(n, dtype=np.float32)
    for ev in events:
        if ev.get("type") == "silence":
            st, sd = float(ev["t"]), float(ev.get("dur", 0.7))
            sil[max(0, int(st * SR)):min(n, int((st + sd) * SR))] = 0.0
    sil_env = uniform_filter1d(sil, size=int(0.08 * SR))
    music[:, 0] *= sil_env; music[:, 1] *= sil_env

    foley = np.zeros((n, 2), dtype=np.float32)
    for ev in events:
        t, tp = float(ev.get("t", 0)), ev.get("type", "")
        if tp in ("pop", "station_pop"): sfx.add(foley, sfx.pop(0.20), t, gain=0.5)
        elif tp in ("click", "chip_pop", "key_click"): sfx.add(foley, sfx.click(1.2, 0.16), t, gain=0.45)
        elif tp in ("whoosh", "arrow_whoosh"): sfx.add(foley, sfx.whoosh(0.3, 0.18), t, gain=0.45)
        elif tp in ("ding", "stamp_ding", "okr_ding"): sfx.add(foley, sfx.ding(0.24), t, gain=0.55)
    foley *= (1.0 - 0.40 * speech_env)[:, None]

    mix = np.zeros((n, 2), dtype=np.float32)
    mix[:, 0] = sfx.limit(vo_mono * 0.92 + music[:, 0] + foley[:, 0], ceil=0.88)
    mix[:, 1] = sfx.limit(vo_mono * 0.92 + music[:, 1] + foley[:, 1], ceil=0.88)
    os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
    sf.write(os.path.join(HERE, "out", "mix.wav"), mix, SR)
    print(f"[mix.py] Wrote out/mix.wav ({dur:.2f}s)", flush=True)

if __name__ == "__main__":
    main()
