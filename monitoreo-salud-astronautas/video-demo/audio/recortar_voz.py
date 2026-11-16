"""Lynceus demo video: fits the narration into 30 s by shortening its pauses, never its words.

The narration (ElevenLabs, 31.0 s) has 16 spoken stretches, one per phrase of the script
(guion.txt). Each pause longer than its target is shortened from the middle, keeping its
two natural edges (the tail of one word and the breath before the next), joined with a
short crossfade. The voice keeps its speed and pitch.

Usage (ffmpeg and ffprobe on the PATH):
    python3 recortar_voz.py VOZ_ORIGINAL.mp3 VOZ_RECORTADA.wav TIEMPOS.json

TIEMPOS.json says where each phrase starts and ends in the trimmed voice, in seconds:
the animation is timed on it. Deterministic: the same input gives the same output.
"""
import json
import re
import subprocess
import sys

# The 16 phrases, in the order the voice says them.
PHRASES = [
    'Day 126.',
    'You see fine.',
    'But the back of your eye is swelling.',
    "And you can't feel it.",
    'Changes like this show up in seventy percent of astronauts on long missions.',
    'The specialist who can read this scan is on Earth.',
    'Up to forty minutes away.',
    'So Lynceus reads it on board.',
    'What changed.',
    'How much.',
    'How sure.',
    'What to do next.',
    'Your doctor on Earth gets the full report,',
    'and makes the call.',
    'Lynceus.',
    "See what you can't feel.",
]

# Target length of the pause AFTER each phrase, seconds (the last one has none).
# The three dramatic pauses keep more air: after "Day 126.", after "You see fine."
# and before "and makes the call". The rest are cut to 0.28 s; shorter ones stay as they are.
DEFAULT_PAUSE_S = 0.28
PAUSE_AFTER_S = {0: 0.42, 1: 0.36, 12: 0.40, 13: 0.32}

SILENCE_DB = -40
MIN_SILENCE_S = 0.15
CROSSFADE_S = 0.012
SAMPLE_RATE = 48000


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit(r.stderr[-2000:])
    return r.stderr


def duration(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path],
                         capture_output=True, text=True).stdout
    return float(out)


def silences(path):
    log = run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af',
               f'silencedetect=noise={SILENCE_DB}dB:d={MIN_SILENCE_S}', '-f', 'null', '-'])
    starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)]
    ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
    return list(zip(starts, ends))


def main():
    src, out_wav, out_json = sys.argv[1:4]
    total = duration(src)
    gaps = silences(src)
    # A trailing silence that reaches the end of the file is not a pause between phrases.
    trailing = gaps[-1] if gaps and abs(gaps[-1][1] - total) < 0.02 else None
    pauses = [g for g in gaps if g is not trailing and g[0] > 0.05]
    if len(pauses) != len(PHRASES) - 1:
        sys.exit(f'Expected {len(PHRASES) - 1} pauses between phrases, found {len(pauses)}: {pauses}')
    speech_end = trailing[0] if trailing else total

    # Pieces of the original to keep: [a, b] in seconds.
    keep = []
    cursor = 0.0
    for i, (s, e) in enumerate(pauses):
        target = PAUSE_AFTER_S.get(i, DEFAULT_PAUSE_S)
        length = e - s
        if length <= target:
            continue
        half = target / 2
        keep.append((cursor, s + half))
        cursor = e - half
    # The end: the last word and 0.12 s of its natural tail.
    keep.append((cursor, min(total, speech_end + 0.12)))

    # Build the trimmed voice with ffmpeg: one atrim per piece, chained with short crossfades.
    parts = []
    for n, (a, b) in enumerate(keep):
        parts.append(f'[0:a]atrim=start={a:.4f}:end={b:.4f},asetpts=PTS-STARTPTS,aresample={SAMPLE_RATE}[p{n}]')
    chain = '[p0]'
    for n in range(1, len(keep)):
        parts.append(f'{chain}[p{n}]acrossfade=d={CROSSFADE_S}:c1=tri:c2=tri[x{n}]')
        chain = f'[x{n}]'
    graph = ';'.join(parts)
    run(['ffmpeg', '-hide_banner', '-nostats', '-y', '-i', src, '-filter_complex', graph, '-map', chain,
         '-ac', '1', '-ar', str(SAMPLE_RATE), '-c:a', 'pcm_s24le', out_wav])

    # Where each phrase lands in the trimmed voice: map original times through the kept pieces.
    def mapped(t):
        offset = 0.0
        for n, (a, b) in enumerate(keep):
            if t <= b:
                return offset + max(0.0, t - a)
            offset += (b - a) - (CROSSFADE_S if n + 1 < len(keep) else 0.0)
        return offset

    bounds = [0.0] + [x for p in pauses for x in p] + [speech_end]
    first_sound = first_sound_time(src)
    bounds[0] = first_sound
    phrases = []
    for i, text in enumerate(PHRASES):
        start, end = bounds[2 * i], bounds[2 * i + 1]
        phrases.append({'n': i + 1, 'text': text, 'start': round(mapped(start), 3), 'end': round(mapped(end), 3),
                        'originalStart': round(start, 3), 'originalEnd': round(end, 3)})
    trimmed = duration(out_wav)
    result = {
        '_': 'Lynceus demo video: where each phrase starts and ends in the trimmed voice (seconds). Made by recortar_voz.py.',
        'source': src.split('/')[-1],
        'originalDurationS': round(total, 3),
        'trimmedDurationS': round(trimmed, 3),
        'removedS': round(total - trimmed, 3),
        'pauseTargetsS': {'default': DEFAULT_PAUSE_S, 'afterPhrase': {str(k + 1): v for k, v in PAUSE_AFTER_S.items()}},
        'phrases': phrases,
    }
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=1)
        f.write('\n')
    print(f'{src} {total:.3f} s -> {out_wav} {trimmed:.3f} s (removed {total - trimmed:.3f} s); last word ends at {phrases[-1]["end"]:.3f} s')


def first_sound_time(path):
    """Time of the first sample above the silence level (the voice may start a few ms in)."""
    log = run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af',
               f'silencedetect=noise={SILENCE_DB}dB:d=0.005', '-f', 'null', '-'])
    m = re.search(r'silence_start: ([\d.]+)\D+silence_end: ([\d.]+)', log)
    if m and float(m.group(1)) < 0.01:
        return float(m.group(2))
    return 0.0


if __name__ == '__main__':
    main()
