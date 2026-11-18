# mix.py — «PCTPR» dark-keynote · voice (OmniVoice, Whisper-verified) + VCSL score + frame-exact foley
# Output: out/mix.wav · 60.0 s · 48 kHz stereo · duck 9.5 dB under speech · digital-zero dramatic silences.
import json, os, sys
import numpy as np, soundfile as sf, soxr

HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import (SR, add, limit, click, clack, whoosh, thump, ding, pop, noise,
                            bp, lp, hp, t_, env_exp, norm, compress)

DUR = 60.0
N = int(round(DUR * SR))

# ── shared VO cues (t0/t1/wav from master_vo_v2/vo_timeline.json) ──
VO = [
    ('c00', 0.6), ('c01', 5.2), ('c02', 8.8), ('c03', 16.8), ('c04', 25.5), ('c05', 31.2),
    ('c06', 38.8), ('c07', 43.4), ('c08', 48.8), ('c09', 54.0), ('c10', 57.05),
]
VO_DIR = os.path.join(LIB, 'master_vo_v2')

# ── dramatic silences: every musical/foley track gated to digital zero ──
GATES = [(13.3, 16.6), (23.1, 25.4), (53.3, 53.9)]

def gate_env():
    e = np.ones(N, np.float32)
    ramp = int(0.025 * SR)
    for a, b in GATES:
        i0, i1 = int(a * SR), int(b * SR)
        e[i0:i1] = 0.0
        e[i0 - ramp:i0] *= 0.5 * (1 + np.cos(np.linspace(0, np.pi, ramp)))
        e[i1:i1 + ramp] *= 0.5 * (1 - np.cos(np.linspace(0, np.pi, ramp)))
    return e

def speech_mask():
    e = np.zeros(N, np.float32)
    att, rel = int(0.05 * SR), int(0.30 * SR)
    for cid, t0 in VO:
        wav = sf.read(os.path.join(VO_DIR, f'{cid}.wav'), dtype='float32')[0]
        d = len(wav) / 24000.0
        i0, i1 = int(t0 * SR), int((t0 + d) * SR)
        e[i0:i1] = 1.0
        e[min(N, i1):min(N, i1 + rel)] = np.minimum(e[min(N, i1):min(N, i1 + rel)], np.linspace(1, 0, min(rel, N - i1)))
    # smooth (attack)
    k = int(0.05 * SR)
    ker = np.ones(k, np.float32) / k
    return np.convolve(e, ker, 'same')

# ═══════════════ 1. VOICE ═══════════════
voice = np.zeros((N, 2), np.float32)
for cid, t0 in VO:
    w, sr = sf.read(os.path.join(VO_DIR, f'{cid}.wav'), dtype='float32')
    assert sr == 24000, sr
    if w.ndim > 1: w = w.mean(1)
    w = soxr.resample(w, 24000, SR).astype(np.float32)
    w = compress(w, thr=0.24, ratio=3.4)
    w = w / max(1e-6, np.abs(w).max()) * 0.62
    add(voice, w, t0, 1.0, 0.0)
vrms = float(np.sqrt((voice ** 2).mean()))
voice *= (0.10 / max(vrms, 1e-6))          # voice RMS ≈ -20 dBFS

# ═══════════════ 2. SCORE (120 BPM · D dorian · process music) ═══════════════
BEAT, BAR = 0.5, 2.0
music = S.render([
    # — chaos: two phasing marimba voices, detuned & scattered —
    *[(b * BAR + k * BEAT, 'marimba', p, 0.42, 0.30, ((k % 3) - 1) * 0.4)
      for b in range(0, 7) for k, p in enumerate(['D4', 'F4', 'A4', 'C5'])],
    *[(b * BAR + k * BEAT + 0.03 + b * 0.006, 'marimba', S.midi(p) + 0.13, 0.42, 0.24, ((k % 3) - 1) * -0.4)
      for b in range(0, 7) for k, p in enumerate(['D4', 'F4', 'A4', 'C5'])],
    # — additive build into the snap (bar 8 = 16–18 s) —
    (16.6, 'marimba', 'D4', 0.5, 0.5, 0.0),
    (17.6, 'hand_chimes', 'D5', 2.2, 0.42, 0.0), (17.6, 'hand_chimes', 'A5', 2.2, 0.32, 0.2),
    (18.0, 'marimba', 'D4', 0.42, 0.36, -0.25), (18.5, 'marimba', 'A4', 0.42, 0.36, 0.25),
    (19.0, 'marimba', 'F4', 0.42, 0.36, -0.25), (19.5, 'marimba', 'C5', 0.42, 0.36, 0.25),
    (20.0, 'marimba', 'D4', 0.4, 0.34, -0.3), (20.5, 'marimba', 'F4', 0.4, 0.34, 0.3),
    (21.0, 'marimba', 'A4', 0.4, 0.34, -0.3), (21.5, 'marimba', 'C5', 0.2, 0.34, 0.3), (21.75, 'marimba', 'D5', 0.2, 0.3, 0.0),
    (22.0, 'marimba', 'D4', 0.4, 0.3, 0.0),
    (18.0, 'vibraphone', 'A3', 4.6, 0.28, 0.0),
    # — pipeline: bowed-vibraphone pad + steady marimba loop + glockenspiel station bells —
    (25.5, 'vibraphone_bowed', 'D4', 3.5, 0.34, -0.2),
    (29.0, 'vibraphone_bowed', 'F4', 3.5, 0.32, 0.2),
    (32.5, 'vibraphone_bowed', 'A3', 3.6, 0.30, 0.0),
    *[(25.5 + b * BAR + k * BEAT, 'marimba', p, 0.4, 0.30, ((k % 2) - 0.5) * 0.5)
      for b in range(5) for k, p in enumerate(['D4', 'F4', 'A4', 'C5']) if 25.5 + b * BAR + k * BEAT < 36.6],
    (26.2, 'glockenspiel', 'D5', 0.9, 0.30, -0.3), (27.6, 'glockenspiel', 'F5', 0.9, 0.30, 0.3),
    (31.5, 'glockenspiel', 'A5', 0.9, 0.30, -0.3), (33.5, 'glockenspiel', 'C6', 0.9, 0.30, 0.3),
    (34.2, 'glockenspiel', 'D6', 0.7, 0.26, -0.4), (35.0, 'glockenspiel', 'E6', 0.7, 0.26, 0.0), (35.8, 'glockenspiel', 'G5', 0.7, 0.26, 0.4),
    # — the number: landing chord only (digits keep a near-silent stage) —
    (41.3, 'marimba', 'D5', 0.12, 0.42, 0.0), (41.42, 'marimba', 'C5', 0.12, 0.42, 0.0),
    (41.54, 'marimba', 'A4', 0.12, 0.42, 0.0), (41.66, 'marimba', 'F4', 0.12, 0.42, 0.0),
    (42.3, 'marimba', 'D3', 1.4, 0.5, -0.1), (42.3, 'marimba', 'A3', 1.4, 0.44, 0.1),
    (42.3, 'marimba', 'D4', 1.4, 0.44, 0.0), (42.3, 'hand_chimes', 'F#5', 1.8, 0.3, 0.3),
    # — wins: subtractive process (8 → 7 → 6 → 5 notes) —
    *[(43.8 + k * BEAT, 'marimba', p, 0.4, 0.32, ((k % 2) - 0.5) * 0.4) for k, p in enumerate(['D4', 'F4', 'G4', 'A4', 'C5', 'A4', 'G4', 'F4'])],
    *[(45.0 + k * BEAT, 'marimba', p, 0.4, 0.30, ((k % 2) - 0.5) * 0.4) for k, p in enumerate(['D4', 'F4', 'G4', 'A4', 'C5', 'A4', 'G4'])],
    *[(46.2 + k * BEAT, 'marimba', p, 0.4, 0.28, ((k % 2) - 0.5) * 0.4) for k, p in enumerate(['D4', 'F4', 'G4', 'A4', 'C5', 'A4'])],
    *[(47.4 + k * BEAT, 'marimba', p, 0.4, 0.26, ((k % 2) - 0.5) * 0.4) for k, p in enumerate(['D4', 'F4', 'G4', 'A4', 'C5'])],
    (43.4, 'vibraphone', 'D4', 5.6, 0.26, 0.0),
    # — put-away: subtract to one note —
    (48.8, 'marimba', 'D4', 0.4, 0.3, -0.2), (49.3, 'marimba', 'A4', 0.4, 0.28, 0.2),
    (50.0, 'marimba', 'D4', 0.4, 0.26, 0.0),
    (52.0, 'vibraphone', 'D4', 1.5, 0.3, 0.0),
    # — verdict: the one chord everything lands on —
    (54.0, 'hand_chimes', 'D4', 2.8, 0.4, -0.2), (54.0, 'hand_chimes', 'A4', 2.8, 0.36, 0.0),
    (54.0, 'hand_chimes', 'D5', 2.8, 0.36, 0.2), (54.0, 'hand_chimes', 'F#5', 2.8, 0.3, -0.3),
    (54.0, 'hand_chimes', 'C#6', 2.8, 0.24, 0.3),
    # — CTA: quiet pulse + motif —
    (57.0, 'marimba', 'D4', 0.4, 0.3, -0.25), (57.5, 'marimba', 'E4', 0.4, 0.3, 0.0),
    (58.0, 'marimba', 'F4', 0.4, 0.3, 0.25), (58.5, 'marimba', 'A4', 0.5, 0.32, 0.0),
    (59.4, 'hand_chimes', 'D5', 1.0, 0.28, 0.0),
], dur=DUR)
music = S.room(music, size=0.42, mix=0.14)

# low sine pulse (numpy synth) — bar starts in chaos + CTA
pulse = np.zeros((N, 2), np.float32)
for bt in list(np.arange(0, 13.0, BAR)) + [57.0, 58.0]:
    d = 0.9
    x = np.sin(2 * np.pi * 73.42 * t_(d)) * env_exp(d, 0.28) * 0.16
    add(pulse, x.astype(np.float32), float(bt), 1.0, 0.0)
sine_pad = np.zeros((N, 2), np.float32)
for st, en, f, amp in [(38.6, 43.2, 73.42, 0.05), (38.6, 43.2, 146.8, 0.03), (54.0, 56.8, 146.8, 0.035)]:
    d = en - st
    a = np.sin(2 * np.pi * f * t_(d)) * amp
    a *= np.minimum(np.linspace(0, 1, len(a)) ** 2 * 4, 1) * np.linspace(1, 0, len(a)) ** 1.2
    add(sine_pad, a.astype(np.float32), st, 1.0, 0.0)
music = music * 0.9 + pulse + sine_pad
mrms = float(np.sqrt((music ** 2).mean()))
music *= (0.052 / max(mrms, 1e-6))          # bed ≈ -26 dBFS before ducking

# ═══════════════ 3. FOLEY (frame-exact from events.json) ═══════════════
foley = np.zeros((N, 2), np.float32)
ev_path = os.path.join(HERE, 'events.json')
EVJ = json.load(open(ev_path, encoding='utf-8'))['ev'] if os.path.isfile(ev_path) else []

def shimmer(d=0.6, v=1.0):
    n = noise(d + 0.2).astype(np.float32)
    x = bp(n, 2600, 9500) * np.minimum(np.linspace(0, 1, len(n)) ** 1.5 * 3, 1) * np.linspace(1, 0, len(n)) ** 1.5
    gl = np.sin(2 * np.pi * np.linspace(800, 2400, len(n)) * np.linspace(0, d, len(n))) * 0.05
    return (x * 0.5 + gl).astype(np.float32) * v * 0.5

def glitch(v=1.0):
    n = bp(noise(0.09), 1800, 3400).astype(np.float32) * env_exp(0.09, 0.02)
    return cat(n * v * 0.8, click(2.4, v * 0.5))

def scrib(v=1.0):
    d = 0.16
    wob = 0.6 + 0.4 * np.sin(np.linspace(0, 40, int(d * SR)))
    n = bp(noise(d), 900, 2600).astype(np.float32) * wob
    return (n * env_exp(d, 0.06) * v * 0.9).astype(np.float32)

def crt(v=1.0):
    d = 0.24
    f = np.linspace(1400, 70, int(d * SR))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, 0.07)
    bl = bp(noise(0.03), 400, 1600).astype(np.float32) * env_exp(0.03, 0.015)
    out = np.zeros(int(d * SR) + len(bl) - int(0.02 * SR), np.float32)
    out[:int(d * SR)] += x
    i = int(d * SR) - int(0.02 * SR)
    out[i:i + len(bl)] += bl * 0.4
    return (out * v).astype(np.float32)

def settle(v=1.0):
    d = 0.5
    f = np.linspace(900, 170, int(d * SR))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.linspace(1, 0, int(d * SR)) ** 1.6
    n = lp(noise(d), 1200).astype(np.float32) * np.linspace(0.4, 0, int(d * SR))
    return ((x * 0.5 + n * 0.3) * v * 0.6).astype(np.float32)

def cat(*xs):
    n = max(len(x) for x in xs)
    out = np.zeros(n, np.float32)
    for x in xs: out[:len(x)] += np.asarray(x, np.float32)
    return out

for e in EVJ:
    tt, ty = e['t'], e.get('type', '')
    v = float(e.get('v', 0.8)); pan = float(e.get('pan', 0.0)); d = float(e.get('d', 0.3))
    x = None
    if ty == 'plop': x = cat(pop(v) * 0.7, thump(v * 0.5, 130))
    elif ty == 'thump': x = thump(v, 78)
    elif ty == 'whoosh': x = whoosh(d, v)
    elif ty == 'glass': x = ding(v * 0.8)
    elif ty == 'key': x = click(1.3, v)
    elif ty == 'glitch': x = glitch(v)
    elif ty == 'scrib': x = scrib(v)
    elif ty == 'clock': x = clack(1.6, v * 0.8)
    elif ty == 'tick': x = click(1.7, v * 0.8)
    elif ty == 'tickgreen': x = cat(click(2.1, v), ding(v * 0.25) * 0.4)
    elif ty == 'ding': x = ding(v)
    elif ty == 'grain': x = click(2.6, v * 0.45)
    elif ty == 'press': x = cat(thump(v, 95), click(1.2, v * 0.5))
    elif ty == 'crt': x = crt(v)
    elif ty == 'pop': x = pop(v)
    elif ty == 'retick': x = click(1.1, v * 0.6)
    elif ty == 'sweep': x = shimmer(d, v)
    elif ty == 'sweepst': x = shimmer(d, v)
    elif ty == 'chip': x = cat(pop(v * 0.8), click(1.9, v * 0.6))
    elif ty == 'blip': x = click(2.2, v * 0.5)
    elif ty == 'settle': x = settle(v)
    if x is not None:
        add(foley, np.ascontiguousarray(x, np.float32), tt, 1.0, pan)
frms = float(np.sqrt((foley ** 2).mean()))
foley *= (0.030 / max(frms, 1e-6))          # foley ≈ -30 dBFS before ducking

# ═══════════════ 4. AMBIENCE (fan + coil whine, kept out of silences) ═══════════════
amb = np.zeros((N, 2), np.float32)
rng = np.random.default_rng(7)
fan = lp((rng.standard_normal(N)).astype(np.float32), 240)
wob = 0.8 + 0.2 * np.sin(2 * np.pi * 0.7 * t_(DUR))
fan = (fan * wob).astype(np.float32)
fan_env = np.zeros(N, np.float32)
fan_env[:int(13.3 * SR)] = np.linspace(0.05, 0.11, int(13.3 * SR))
fan_env[int(48.8 * SR):int(53.3 * SR)] = 0.04
whine = (bp(noise(DUR), 5200, 6400).astype(np.float32) * 0.5 + np.sin(2 * np.pi * 5600 * t_(DUR)) * 0.12).astype(np.float32)
whine_env = np.zeros(N, np.float32)
i0, i1 = int(9.5 * SR), int(13.25 * SR)
whine_env[i0:i1] = np.linspace(0.0, 0.055, i1 - i0)
amb[:, 0] = (fan * fan_env + whine * whine_env)
amb[:, 1] = (fan * fan_env + whine * whine_env * 0.9)

# ═══════════════ 5. DUCK · GATE · MIX ═══════════════
mask = speech_mask()
duck_music = (0.335 + 0.665 * (1.0 - mask))[:, None]
duck_foley = (0.63 + 0.37 * (1.0 - mask))[:, None]
gate = gate_env()[:, None]
fade = np.ones(N, np.float32)
f0 = int(59.55 * SR)
fade[f0:] = np.linspace(1, 0, N - f0) ** 1.2

mix = voice + music * duck_music * gate + (foley * duck_foley * gate) + amb * gate * 0.5
mix *= fade[:, None]
mix = limit(mix.astype(np.float32), ceil=0.88)
peak = float(np.abs(mix).max())
print(f'[mix] peak={peak:.3f}  RMS={float(np.sqrt((mix**2).mean())):.4f}  silence check:', end=' ')
for a, b in GATES:
    seg = mix[int(a * SR):int(b * SR)]
    print(f'{a}-{b}s max={float(np.abs(seg).max()):.5f}', end='  ')
print()
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix, SR)
print('[mix] wrote out/mix.wav')
print('\n'.join(S.credits(['marimba', 'vibraphone', 'vibraphone_bowed', 'glockenspiel', 'hand_chimes'])))
