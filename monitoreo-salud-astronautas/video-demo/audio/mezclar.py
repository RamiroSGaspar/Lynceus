"""Lynceus demo video: mixes the voice and the music, as the TOYP videos do.

The music ducks by itself when the voice speaks (sidechain compression) and sits 7 LU under
the voice; the result is levelled to -14 LUFS with a -1.5 dBTP limit, 48 kHz stereo, and lasts
exactly as long as the voice file (30.000 s: the voice already carries its 0.15 s lead-in).

Usage (ffmpeg and ffprobe on the PATH):  python3 mezclar.py VOZ-VIDEO.wav MUSICA.wav SALIDA.wav
"""
import json
import re
import subprocess
import sys

MUSIC_UNDER_VOICE = 7.0
TARGET = 'I=-14:TP=-1.5:LRA=11'


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit(r.stderr[-1500:])
    return r.stderr


def lufs(path):
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128', '-f', 'null', '-']))[-1])


def main():
    voice, music, out = sys.argv[1:4]
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', voice], capture_output=True, text=True).stdout)
    gain = lufs(voice) - MUSIC_UNDER_VOICE - lufs(music)
    graph = ('[0:a]pan=stereo|c0=c0|c1=c0,asplit=2[v1][v2];[1:a]volume=%.2fdB[mu];'
             '[mu][v2]sidechaincompress=threshold=0.035:ratio=6:attack=40:release=500:makeup=1[mud];'
             '[v1][mud]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.95:level=disabled' % gain)
    base = ['ffmpeg', '-hide_banner', '-nostats', '-y', '-i', voice, '-i', music, '-filter_complex']
    s = run(base + [graph + ',loudnorm=%s:print_format=json[o]' % TARGET, '-map', '[o]', '-f', 'null', '-'])
    m = json.loads(re.search(r'\{[^{}]*"input_i"[^{}]*\}', s, re.S).group(0))
    ln = 'loudnorm=%s:measured_I=%s:measured_TP=%s:measured_LRA=%s:measured_thresh=%s:offset=%s:linear=true' % (
        TARGET, m['input_i'], m['input_tp'], m['input_lra'], m['input_thresh'], m['target_offset'])
    run(base + [graph + ',' + ln + '[o]', '-map', '[o]', '-t', '%.3f' % dur, '-ar', '48000', '-c:a', 'pcm_s24le', out])
    print('mix: %s · %.3f s · music %+.1f dB · before levelling %s LUFS' % (out, dur, gain, m['input_i']))


if __name__ == '__main__':
    main()
