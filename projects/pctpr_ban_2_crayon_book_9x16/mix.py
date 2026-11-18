# mix.py — «Cuốn sổ thần kỳ của team» crayon-book · voice (OmniVoice, Whisper-verified) + VCSL & pluck-model score + frame-exact foley
# Output: out/mix.wav · 60.0 s · 48 kHz stereo · music duck ~9.5 dB · digital-zero dramatic silences.
import json, os, sys
import numpy as np, soundfile as sf, soxr

HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio import pluck as P
from core.audio.sfx import (SR, add, limit, click, clack, whoosh, thump, ding, pop, noise,
                            bp, lp, hp, t_, env_exp, norm, compress)

DUR = 60.0
N = int(round(DUR * SR))

VO = [
    ('c00', 0.6), ('c01', 5.2), ('c02', 8.8), ('c03', 16.8), ('c04', 25.5), ('c05', 31.2),
    ('c06', 38.8), ('c07', 43.4), ('c08', 48.8), ('c09', 54.0), ('c10', 57.05),
]
VO_DIR = os.path.join(LIB, 'master_vo_v2')
GATES = [(13.3, 16.6), (23.0, 25.4), (53.3, 53.9)]

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
    rel = int(0.30 * SR)
    for cid, t0 in VO:
        wav = sf.read(os.path.join(VO_DIR, f'{cid}.wav'), dtype='float32')[0]
        d = len(wav) / 24000.0
        i0, i1 = int(t0 * SR), int((t0 + d) * SR)
        e[i0:i1] = 1.0
        e[min(N, i1):min(N, i1 + rel)] = np.minimum(e[min(N, i1):min(N, i1 + rel)], np.linspace(1, 0, min(rel, N - i1)))
    k = int(0.05 * SR)
    return np.convolve(e, np.ones(k, np.float32) / k, 'same')

# ═══════════════ 1. VOICE ═══════════════
voice = np.zeros((N, 2), np.float32)
for cid, t0 in VO:
    w, sr = sf.read(os.path.join(VO_DIR, f'{cid}.wav'), dtype='float32')
    if w.ndim > 1: w = w.mean(1)
    w = soxr.resample(w, 24000, SR).astype(np.float32)
    w = compress(w, thr=0.24, ratio=3.4)
    w = w / max(1e-6, np.abs(w).max()) * 0.62
    add(voice, w, t0, 1.0, 0.0)
vrms = float(np.sqrt((voice ** 2).mean()))
voice *= (0.10 / max(vrms, 1e-6))

# ═══════════════ 2. SCORE — ukulele-lilt (nylon strum) + recorder theme + music box + kalimba + glock (120 BPM) ═══════════════
music = np.zeros((N, 2), np.float32)
def strum(chord, at, vel=0.42, dur=1.7, pan=0.0):
    add(music, P.strum('nylon_guitar', chord, dur, vel=vel, spread=0.028), at, 1.0, pan)
def plucked(preset, pitch, at, dur=None, vel=0.5, pan=0.0, **kw):
    add(music, P.pluck(preset, pitch, dur, vel=vel, **kw), at, 1.0, pan)
def bell(pitch, at, dur=0.8, vel=0.4, pan=0.0):
    add(music, S.note('glockenspiel', pitch, dur, vel=vel), at, 1.0, pan)
def wood(at, vel=0.5, pan=0.0):
    add(music, S.hit('woodblock', 'a', vel=vel), at, 1.0, pan)
def shak(at, vel=0.4, pan=0.0):
    add(music, S.hit('shaker', 'down', vel=vel), at, 1.0, pan)

# — P1 chaos: nylon lilt + clarinet-ish low plucks; shaker dày dần —
for b, at in enumerate(np.arange(0.6, 13.0, 2.0)):
    strum(['G3', 'B3', 'D4', 'G4'] if b % 2 == 0 else ['E3', 'G3', 'B3', 'E4'], float(at), vel=0.34 - 0.02 * b, pan=(-1) ** b * 0.25)
    plucked('nylon_guitar', 'D3' if b % 2 else 'C3', float(at), dur=0.9, vel=0.3)
for k, at in enumerate(np.arange(2.0, 13.0, 0.5)):
    shak(float(at), vel=0.22 + 0.02 * k, pan=(hash(float(k)) - 0.5) * 0.6)
plucked('music_box', 'G5', 5.2, vel=0.4); plucked('music_box', 'E5', 5.55, vel=0.36)
plucked('music_box', 'C5', 6.4, vel=0.34); plucked('music_box', 'D5', 6.75, vel=0.32)
# — crayon nhấc (silence) —
# — P2 system: music box gieo câu hỏi nhỏ + kalimba đếm từng ô —
for k, at in enumerate(np.arange(17.8, 22.6, 0.55)):
    plucked('kalimba', ['G4', 'A4', 'C5', 'A4', 'G4', 'E4', 'G4', 'A4'][k % 8], float(at), vel=0.42, pan=(k % 3 - 1) * 0.35)
for k, at in enumerate([19.6, 20.15, 20.7, 21.25]):
    plucked('music_box', ['C6', 'A5', 'G5', 'E5'][k], float(at), vel=0.4)
strum(['C3', 'E3', 'G3', 'C4'], 18.0, vel=0.3)
strum(['G3', 'B3', 'D4', 'G4'], 20.0, vel=0.28)
strum(['A3', 'C4', 'E4', 'A4'], 22.0, vel=0.26)
# — lật trang (silence) —
# — P3 pipeline: recorder "hát" chủ đề (câu đầu) + music box mỗi trạm —
theme = [('D5', 26.6, 0.5), ('E5', 27.1, 0.4), ('G5', 27.5, 0.6), ('E5', 28.1, 0.4), ('D5', 28.5, 0.9),
         ('C5', 31.6, 0.5), ('D5', 32.1, 0.4), ('E5', 32.5, 0.6), ('G5', 33.1, 0.4), ('A5', 33.5, 0.9)]
from core.audio.sampler import note as _note
for p, at, d in theme:
    add(music, _note('recorder', p, d, vel=0.3), at, 1.0, 0.0)
for k, at in enumerate([26.5, 27.3, 31.8, 32.6]):
    plucked('music_box', ['G5', 'E5', 'A5', 'C6'][k], float(at), vel=0.42)
strum(['G3', 'B3', 'D4', 'G4'], 26.0, vel=0.3)
strum(['C3', 'E3', 'G3', 'C4'], 28.0, vel=0.28)
strum(['A3', 'C4', 'E4', 'A4'], 32.0, vel=0.26)
strum(['G3', 'B3', 'D4', 'G4'], 34.0, vel=0.3)
strum(['C3', 'E3', 'G3', 'C4'], 36.0, vel=0.26)
for k, at in enumerate([34.3, 35.1, 35.9]):
    plucked('music_box', ['D5', 'E5', 'G5'][k], float(at), vel=0.36)
# — số trên trời: kalimba đếm + music box wind-down —
for k, at in enumerate([39.3, 39.8, 40.3, 40.7]):
    plucked('kalimba', ['C5', 'E5', 'G5', 'C6'][k], float(at), vel=0.5)
strum(['C3', 'E3', 'G3', 'C4'], 39.0, vel=0.28)
plucked('music_box', 'G5', 41.4, vel=0.4)
plucked('music_box', 'F5', 41.8, vel=0.36)
plucked('music_box', 'E5', 42.2, vel=0.34)
plucked('music_box', 'C5', 42.5, vel=0.34, bend=[(0, 0), (0.5, -1.2)])  # wind-down droop
strum(['A3', 'C4', 'E4', 'A4'], 41.2, vel=0.24)
# — lật trang (43.4) —
# — P4 truck + phòng sạch: glock tick mỗi thắng lợi, chủ đề TRỌN (recorder + strum) —
for k, at in enumerate([46.9, 47.18, 47.46, 47.74]):
    bell('A6' if k % 2 else 'C7', float(at), dur=0.5, vel=0.3, pan=(k - 1.5) * 0.3)
theme2 = [('G5', 49.2, 0.6), ('A5', 49.9, 0.5), ('B5', 50.4, 0.5), ('D6', 50.9, 0.7), ('B5', 51.6, 0.5), ('A5', 52.1, 0.5), ('G5', 52.6, 1.0)]
for p, at, d in theme2:
    add(music, _note('recorder', p, d, vel=0.3), at, 1.0, 0.0)
for b, at in enumerate(np.arange(49.0, 53.0, 2.0)):
    strum([['C3', 'E3', 'G3', 'C4'], ['G3', 'B3', 'D4', 'G4']][b % 2], float(at), vel=0.26, pan=0.2)
for k, at in enumerate([51.0, 51.6]):
    bell(['E6', 'G6'][k], float(at), dur=0.6, vel=0.3)
# — breath (silence) —
# — finale: wash + sparkles từng chữ verdict + chủ đề kết —
for k, at in enumerate([55.35, 55.65, 55.95, 56.25, 59.4]):
    bell(['D6', 'F#6', 'A6', 'D7', 'D6'][k], float(at), dur=1.2, vel=0.4, pan=(k - 2) * 0.25)
strum(['D3', 'F#3', 'A3', 'D4'], 54.1, vel=0.36)
strum(['D3', 'F#3', 'A3', 'D4'], 56.1, vel=0.3)
strum(['G3', 'B3', 'D4', 'G4'], 57.3, vel=0.26)
plucked('music_box', 'D5', 57.6, vel=0.3); plucked('music_box', 'E5', 57.95, vel=0.28)
plucked('music_box', 'G5', 58.3, vel=0.28); plucked('music_box', 'A5', 58.65, vel=0.28)
plucked('music_box', 'D6', 59.0, vel=0.3)
mrms = float(np.sqrt((music ** 2).mean()))
music *= (0.055 / max(mrms, 1e-6))

# ═══════════════ 3. FOLEY ═══════════════
foley = np.zeros((N, 2), np.float32)
ev_path = os.path.join(HERE, 'events.json')
EVJ = json.load(open(ev_path, encoding='utf-8'))['ev'] if os.path.isfile(ev_path) else []

def cat(*xs):
    n = max(len(x) for x in xs)
    out = np.zeros(n, np.float32)
    for x in xs: out[:len(x)] += np.asarray(x, np.float32)
    return out

def swish(v=1.0, d=0.14):
    wob = 0.55 + 0.45 * np.sin(np.linspace(0, 26, int(d * SR)))
    n = bp(noise(d), 700, 2600).astype(np.float32) * wob
    return (n * env_exp(d, 0.05) * v * 0.8).astype(np.float32)

def scribf(v=1.0):
    d = 0.1
    n = bp(noise(d), 1000, 3200).astype(np.float32)
    return (n * env_exp(d, 0.03) * v * 0.9).astype(np.float32)

def plop(v=1.0):
    d = 0.16
    puff = lp(noise(d), 900).astype(np.float32) * env_exp(d, 0.05)
    return cat(puff * v * 0.6, click(0.8, v * 0.4))

def lift(v=1.0):
    d = 0.3
    n = hp(noise(d), 300).astype(np.float32) * np.linspace(0, 1, int(d * SR)) ** 1.4
    return (n * v * 0.35).astype(np.float32)

def pturn(v=1.0):
    return (whoosh(0.34, v) * 0.9).astype(np.float32)

def flap(v=1.0):
    d = 0.12
    n = bp(noise(d), 400, 1400).astype(np.float32) * env_exp(d, 0.025)
    return cat(n * v * 0.9, clack(0.7, v * 0.4))

def wet(v=1.0):
    d = 0.55
    n = lp(noise(d), 620).astype(np.float32)
    sweep = np.sin(np.linspace(0, np.pi, int(d * SR)))
    return (n * sweep * v * 0.5).astype(np.float32)

for e in EVJ:
    tt, ty = e['t'], e.get('type', '')
    v = float(e.get('v', 0.8)); pan = float(e.get('pan', 0.0))
    x = None
    if ty == 'swish': x = swish(v)
    elif ty == 'wswish': x = swish(v * 0.35)
    elif ty == 'scribf': x = scribf(v)
    elif ty == 'plop': x = plop(v)
    elif ty == 'pop': x = pop(v)
    elif ty == 'wood': x = np.asarray(S.hit('woodblock', 'a', vel=v * 0.8), np.float32)
    elif ty == 'lift': x = lift(v)
    elif ty == 'pturn': x = pturn(v)
    elif ty == 'flap': x = flap(v)
    elif ty == 'glock': x = np.asarray(S.note('glockenspiel', 'D6', 0.5, vel=v * 0.8), np.float32)
    elif ty == 'tick': x = clack(1.4, v * 0.8)
    elif ty == 'musicbox': x = np.asarray(P.pluck('music_box', 'E6', 0.5, vel=v * 0.8), np.float32)
    elif ty == 'kalimba': x = np.asarray(P.pluck('kalimba', 'G5', 0.4, vel=v * 0.8), np.float32)
    elif ty == 'wet': x = wet(v)
    elif ty == 'glint': x = np.asarray(S.note('glockenspiel', 'A6', 0.4, vel=v * 0.9), np.float32)
    if x is not None:
        add(foley, np.ascontiguousarray(x, np.float32), tt, 1.0, pan)
frms = float(np.sqrt((foley ** 2).mean()))
foley *= (0.030 / max(frms, 1e-6))

# ═══════════════ 4. AMBIENCE (room tone + crickets rất khẽ khi về phòng sạch) ═══════════════
amb = np.zeros((N, 2), np.float32)
rng = np.random.default_rng(11)
room = lp((rng.standard_normal(N)).astype(np.float32), 420) * 0.5
cricket_env = np.zeros(N, np.float32)
cricket_env[int(48.9 * SR):] = 1.0
crickets = (bp(noise(DUR), 4300, 4700).astype(np.float32) * 0.018
            * (0.6 + 0.4 * np.sin(2 * np.pi * 2.4 * t_(DUR))) * cricket_env).astype(np.float32)
amb[:, 0] = room * 0.5 + crickets
amb[:, 1] = room * 0.5 + crickets * 0.9

# ═══════════════ 5. DUCK · GATE · MIX ═══════════════
mask = speech_mask()
duck_music = (0.335 + 0.665 * (1.0 - mask))[:, None]
duck_foley = (0.63 + 0.37 * (1.0 - mask))[:, None]
gate = gate_env()[:, None]
fade = np.ones(N, np.float32)
f0 = int(59.55 * SR)
fade[f0:] = np.linspace(1, 0, N - f0) ** 1.2

mix = voice + music * duck_music * gate + (foley * duck_foley * gate) + amb * gate * 0.45
mix *= fade[:, None]
mix = limit(mix.astype(np.float32), ceil=0.88)
print(f'[mix] peak={float(np.abs(mix).max()):.3f}  silence check:', end=' ')
for a, b in GATES:
    sg = mix[int(a * SR):int(b * SR)]
    print(f'{a}-{b}s max={float(np.abs(sg).max()):.5f}', end='  ')
print()
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix, SR)
print('[mix] wrote out/mix.wav')
print('\n'.join(S.credits(['glockenspiel', 'recorder', 'shaker', 'woodblock'])))
