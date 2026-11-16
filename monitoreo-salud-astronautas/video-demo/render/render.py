"""Lynceus demo video: renders frames or the whole video (1920 x 1080, 30 fps, H.264).

It serves monitoreo-salud-astronautas/ on 127.0.0.1 (the engine reads JSON and images, which
a file:// page cannot), opens ../animacion/render.html in Chrome and draws each frame with the
engine, as the TOYP videos do.

Usage (python with playwright; ffmpeg on the PATH for the video):
    python render.py --cuadros CARPETA 0 3.2 10.5      PNG of single frames (f_000.00.png …)
    python render.py SALIDA.mp4 [AUDIO.wav]            the whole video, with or without audio
The CRF environment variable changes the quality (14 by default; 18 to 20 for drafts).
"""
import asyncio
import base64
import functools
import http.server
import os
import subprocess
import sys
import threading

from playwright.async_api import async_playwright

FPS = 30
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))  # monitoreo-salud-astronautas/
PAGE = 'video-demo/animacion/render.html'


def serve():
    handler = functools.partial(QuietHandler, directory=ROOT)
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


async def open_page(p, port):
    browser = await p.chromium.launch(channel='chrome', args=['--font-render-hinting=none'])
    page = await browser.new_page(viewport={'width': 1920, 'height': 1080})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.on('response', lambda r: errors.append(f'{r.status} {r.url}') if r.status >= 400 else None)
    await page.goto(f'http://127.0.0.1:{port}/{PAGE}')
    total = await page.evaluate('window.READY')
    if errors:
        sys.exit('Page errors: ' + ' | '.join(errors))
    return browser, page, total, errors


async def frames(folder, times):
    os.makedirs(folder, exist_ok=True)
    server = serve()
    async with async_playwright() as p:
        browser, page, total, errors = await open_page(p, server.server_address[1])
        for t in times:
            png = await page.evaluate('t => window.frame(t)', t)
            with open(os.path.join(folder, f'f_{t:06.2f}.png'), 'wb') as f:
                f.write(base64.b64decode(png))
        if errors:
            sys.exit('Page errors: ' + ' | '.join(errors))
        await browser.close()
    server.shutdown()
    print(f'{len(times)} frames in {folder} (video of {total} s)')


async def video(out, audio):
    server = serve()
    async with async_playwright() as p:
        browser, page, total, errors = await open_page(p, server.server_address[1])
        n = int(round(total * FPS))
        cmd = ['ffmpeg', '-v', 'error', '-y', '-f', 'image2pipe', '-framerate', str(FPS), '-c:v', 'png', '-i', '-']
        if audio:
            cmd += ['-i', audio, '-af', f'aresample=48000,apad=whole_dur={total}', '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '256k', '-ac', '2']
        cmd += ['-vf', 'scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p', '-t', str(total),
                '-c:v', 'libx264', '-preset', 'slow', '-crf', os.environ.get('CRF', '14'), '-profile:v', 'high', '-level', '4.2', '-r', str(FPS),
                '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
                # AGENTS.md rule 8: the file says it carries simulated data, as the picture does
                '-metadata', 'comment=Simulated data. Not a medical device. Not validated on people. Fictional crew member; real analysis engine.',
                '-movflags', '+faststart', out]
        ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        batch = 6
        for s in range(0, n, batch):
            chunk = await page.evaluate("""([s, e, fps]) => { const r = []; for (let i = s; i < e; i++) r.push(window.frame(i / fps)); return r; }""", [s, min(n, s + batch), FPS])
            for png in chunk:
                ff.stdin.write(base64.b64decode(png))
            if s % 150 == 0:
                print(f'frame {s} of {n}', flush=True)
        ff.stdin.close()
        ff.wait()
        if errors:
            sys.exit('Page errors: ' + ' | '.join(errors))
        await browser.close()
    server.shutdown()
    print(f'{out}: {n} frames, {total} s, ffmpeg exit {ff.returncode}')


def main():
    if len(sys.argv) > 1 and sys.argv[1] == '--cuadros':
        asyncio.run(frames(sys.argv[2], [float(x) for x in sys.argv[3:]]))
    elif len(sys.argv) > 1:
        asyncio.run(video(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None))
    else:
        sys.exit(__doc__)


if __name__ == '__main__':
    main()
