"""Lynceus demo video: the background music, synthesised with numpy (no third-party samples).

Same family and method as the TOYP videos' music, with another character: a dark, spacious
pad in D minor that changes colour with each scene, a faint high shimmer, a low pulse from
"So Lynceus reads it" with an accent on each of the four hard cuts, and the chord resolving to
D major on "See what you can't feel". No arpeggio, no sound effects (decisiones.md).

The times come from the voice (tiempos-voz.json) with the same offsets as buildTimeline in
../animacion/lynceus-demo.js. Deterministic: seeded noise, no clock.

Usage (python with numpy):  python musica.py TIEMPOS-VOZ.json SALIDA.wav
"""
import json
import sys
import wave

import numpy as np

SR = 48000
TOTAL = 30.0
VOICE_OFFSET = 0.15
LEAD = 0.15
rng = np.random.default_rng(126)


def db(x):
    return 10 ** (x / 20.0)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)


def fade(n, a=0.0, r=0.0):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    if na > 0:
        e[:na] = 0.5 - 0.5 * np.cos(np.pi * np.arange(na) / na)
    if nr > 0:
        e[-nr:] *= 0.5 + 0.5 * np.cos(np.pi * np.arange(nr) / nr)
    return e


def lowpass_fft(x, hi):
    n = len(x)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    return np.fft.irfft(X * np.clip((hi * 1.4 - f) / (hi * 0.4), 0, 1), n)


def reverb(stereo, rt60=3.2, bright=4500):
    """Convolution with seeded, decaying noise: a large, dark room."""
    n = stereo.shape[0]
    li = int(rt60 * 1.1 * SR)
    size = 1 << int(np.ceil(np.log2(n + li)))
    out = np.zeros_like(stereo)
    t = np.arange(li) / SR
    for c in range(2):
        ir = lowpass_fft(rng.standard_normal(li), bright) * np.exp(-6.91 * t / rt60)
        ir[:int(0.03 * SR)] *= np.linspace(0, 1, int(0.03 * SR))
        ir /= np.sqrt((ir ** 2).sum())
        out[:, c] = np.fft.irfft(np.fft.rfft(stereo[:, c], size) * np.fft.rfft(ir, size), size)[:n]
    return out


def key_times(phrases):
    """The moments the music follows, as in buildTimeline (video seconds)."""
    p = [(s + VOICE_OFFSET, e + VOICE_OFFSET) for s, e in phrases]
    return {
        'eye': p[2][0] - 0.40,          # the camera goes into the eye
        'seventy': p[4][0] + 0.05,
        'distance': p[5][0] - 0.05,
        'reads': p[7][0],               # "So Lynceus reads it on board": the pulse starts
        'cuts': [p[8][0] - LEAD, p[9][0] - LEAD, p[10][0] - LEAD, p[11][0] - LEAD],
        'report': p[12][0] - LEAD,      # the report leaves for the Earth
        'call': p[13][0] - 0.10,        # she presses the talk control
        'brand': p[14][0] - LEAD,
        'resolve': p[15][0],            # "See what you can't feel": D major
    }


# Pad chords (MIDI notes). D minor, with colours that follow the story.
def chord_plan(k):
    return [
        (0.0, [38, 50, 57, 64, 69]),            # D sus2: open, quiet space ("Day 126. You see fine.")
        (k['eye'], [34, 50, 53, 57, 65]),       # Bb add9 colour: the swelling, darker
        (k['seventy'], [31, 50, 53, 57, 62]),   # G minor 9
        (k['distance'], [33, 50, 57, 62, 64]),  # A sus4: distance, unresolved
        (k['reads'], [38, 50, 53, 57, 62]),     # D minor: the instrument at work
        (k['report'], [34, 46, 53, 57, 62]),    # Bb major 7: warmer, the doctor
        (k['call'], [29, 45, 53, 57, 60]),      # F / A: the call
        (k['resolve'], [38, 50, 54, 57, 62]),   # D major: resolution, the brand
    ]


def pad(k, n):
    out = np.zeros((n, 2))
    plan = chord_plan(k)
    t_all = np.arange(n) / SR
    for i, (t0, notes) in enumerate(plan):
        t1 = plan[i + 1][0] if i + 1 < len(plan) else TOTAL
        a, b = max(0.0, t0 - 0.6), min(TOTAL, t1 + 0.9)       # crossfade into the next chord
        i0, i1 = int(a * SR), int(b * SR)
        m = i1 - i0
        t = t_all[i0:i1]
        env = fade(m, 0.6 if i else 2.4, 0.9 if i + 1 < len(plan) else 0.45)
        seg = np.zeros((m, 2))
        # the chord, plus its upper voices an octave higher and softer: presence on small speakers
        voices = [(nt, 0.7 if j == 0 else 1.0) for j, nt in enumerate(notes)] + [(nt + 12, 0.38) for nt in notes[2:]]
        for j, (note, w) in enumerate(voices):
            f = midi(note)
            vib = 1 + 0.0007 * np.sin(2 * np.pi * (0.09 + 0.02 * j) * t + note)
            for side, det in ((0, 0.9982), (1, 1.0018)):
                ph = 2 * np.pi * np.cumsum(np.full(m, f * det) * vib) / SR
                # soft harmonics, a little brighter on the upper voices
                seg[:, side] += w * sum(np.sin(h * ph) / h ** (2.2 if note < 50 else 1.6) for h in range(1, 7)) / len(notes)
        out[i0:i1] += seg * env[:, None]
    return out


def air(n):
    """A very low wash of high, slowly breathing noise: the sense of open space."""
    x = rng.standard_normal(n)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    band = np.exp(-0.5 * ((np.log(np.maximum(f, 1)) - np.log(4200)) / 0.45) ** 2)
    y = np.fft.irfft(X * band, n)
    y /= np.abs(y).max()
    t = np.arange(n) / SR
    breath = 0.55 + 0.45 * np.sin(2 * np.pi * 0.07 * t - 1.2)
    left = y * breath
    right = np.roll(y, int(0.013 * SR)) * (0.55 + 0.45 * np.sin(2 * np.pi * 0.07 * t + 0.4))
    return np.stack([left, right], 1) * fade(n, 2.5, 0.5)[:, None]


def shimmer(n):
    """A faint high cluster with a slow swell: the space around everything."""
    t = np.arange(n) / SR
    out = np.zeros((n, 2))
    for note, side in ((86, 0), (88, 1), (93, 0), (91, 1)):
        f = midi(note)
        trem = 0.5 + 0.5 * np.sin(2 * np.pi * (0.13 + 0.03 * (note % 5)) * t + note)
        out[:, side] += np.sin(2 * np.pi * f * t) * trem * 0.25
    return out * fade(n, 3.0, 0.5)[:, None]


def pulse(k, n):
    """A low, soft heartbeat from "reads it on board"; accents land on the four hard cuts."""
    out = np.zeros(n)
    m = int(0.42 * SR)
    tm = np.arange(m) / SR
    ph = 2 * np.pi * np.cumsum(np.linspace(78, 41, m)) / SR
    # the second and third harmonics let small speakers hear the beat
    hit = (np.sin(ph) + 0.45 * np.sin(2 * ph) + 0.18 * np.sin(3 * ph)) * np.exp(-tm / 0.11) * fade(m, 0.006, 0.08)
    cuts = k['cuts']
    times = [(k['reads'], 0.55), ((k['reads'] + cuts[0]) / 2, 0.6)]
    times += [(c, 1.0) for c in cuts]
    times += [((cuts[i] + cuts[i + 1]) / 2, 0.45) for i in range(3)]
    times += [((cuts[3] + k['report']) / 2, 0.45), (k['report'], 0.75)]
    for t0, g in times:
        j = int(t0 * SR)
        out[j:j + m] += hit[:n - j] * g
    return out


def music(phrases):
    n = int(TOTAL * SR)
    k = key_times(phrases)
    p = pad(k, n)
    s = shimmer(n)
    a = air(n)
    pu = pulse(k, n)
    dry = p * 1.0 + s * 0.3 + a * 0.035 + pu[:, None] * 0.55
    wet = reverb(p * 0.8 + s * 0.5 + pu[:, None] * 0.15)
    mix = dry + wet * 0.6
    mix *= fade(n, 0.8, 0.35)[:, None]
    return mix / np.abs(mix).max() * db(-6), k


def save(path, stereo):
    data = (np.clip(stereo, -1, 1) * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


if __name__ == '__main__':
    times = json.load(open(sys.argv[1], encoding='utf-8'))
    phrases = [(p['start'], p['end']) for p in times['phrases']]
    mix, k = music(phrases)
    save(sys.argv[2], mix)
    print('music %.1f s: pulse from %.2f s, accents at %s, D major at %.2f s' % (TOTAL, k['reads'], ', '.join('%.2f' % c for c in k['cuts']), k['resolve']))
