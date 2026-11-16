"""Lynceus demo video: captures of the day-126 result screen for the animation. SIMULATED DATA.

Opens resultado-d126.html (made by preparar_resultado.py) at 1920 x 1080 and writes to
../animacion/capturas/:
- resultado-d126@2x.png: the whole first view at twice the resolution, with a transparent
  background (no star field): the video draws its own stars underneath, so the field stays
  continuous and the screen's veils darken it as in the application.
- pieza-<name>@4x.png: the pieces the four cuts show, at four times the resolution.
- cajas.json: where each piece is on the screen, in CSS pixels of the 1920 x 1080 view.

Usage (python with playwright and Google Chrome):  python capturar.py
"""
import asyncio
import json
import os
import struct
import zlib

from playwright.async_api import async_playwright

NOTICE = 'SIMULATED DATA. Fictional crew member; not a medical device; not validated on people. Demo video capture.'


def mark_png(path):
    """Writes the simulated-data notice into the PNG as a text chunk (AGENTS.md rule 8), without touching the pixels."""
    data = open(path, 'rb').read()
    body = b'Comment\x00' + NOTICE.encode('latin-1')
    chunk = struct.pack('>I', len(body)) + b'tEXt' + body + struct.pack('>I', zlib.crc32(b'tEXt' + body) & 0xffffffff)
    end_of_ihdr = 8 + 8 + 13 + 4
    with open(path, 'wb') as f:
        f.write(data[:end_of_ihdr] + chunk + data[end_of_ihdr:])

HERE = os.path.dirname(os.path.abspath(__file__))
PAGE = 'file://' + os.path.join(HERE, 'resultado-d126.html')
OUT = os.path.join(HERE, '..', 'animacion', 'capturas')

# Transparent page: the star field and the page colour go; veils and halos keep their own black.
TRANSPARENT = 'html, body { background: transparent !important; } body.co-campo { background-image: none !important; }'

# Marks the pieces with data-video so each one has a plain selector.
MARK = """() => {
  const g = (sel, name) => { const el = document.querySelector(sel); if (!el) throw new Error('missing ' + sel); el.setAttribute('data-video', name); };
  const groupWith = (root, text, name) => {
    const el = [...document.querySelectorAll(root + ' .co-grupo')].find((x) => x.textContent.includes(text));
    if (!el) throw new Error('missing group ' + text); el.setAttribute('data-video', name); return el;
  };
  g('.co-ocular.is-elegido', 'ocular-od');
  g('.co-ocular.is-elegido .co-ocular__lente', 'lente-od');
  g('.co-ocular.is-elegido .co-ocular__cabeza', 'cabeza-od');
  g('.co-ocular.is-elegido .co-ocular__pie', 'lectura-od');
  groupWith('.co-velo--izq', 'Result', 'resultado');
  const pasos = groupWith('.co-velo--izq', 'What to do now', 'pasos');
  pasos.querySelector('.co-paso').setAttribute('data-video', 'paso-1');
  groupWith('aside[data-panel="OD"]', 'How sure', 'seguro');
  g('.co-cabina__mision', 'mision');
  g('.co-nav', 'navegacion');
  g('.co-hud', 'franja');
}"""

PIECES = ['ocular-od', 'resultado', 'pasos', 'seguro']


async def open_page(browser, scale):
    page = await browser.new_page(viewport={'width': 1920, 'height': 1080}, device_scale_factor=scale)
    await page.goto(PAGE)
    await page.add_style_tag(content=TRANSPARENT)
    await page.evaluate('document.fonts.ready')
    await page.evaluate(MARK)
    await page.wait_for_timeout(300)
    return page


async def main():
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel='chrome', args=['--font-render-hinting=none'])
        page = await open_page(browser, 2)
        await page.screenshot(path=os.path.join(OUT, 'resultado-d126@2x.png'), omit_background=True)
        boxes = await page.evaluate("""() => Object.fromEntries([...document.querySelectorAll('[data-video]')].map((el) => {
          const r = el.getBoundingClientRect();
          return [el.getAttribute('data-video'), { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) }];
        }))""")
        page4 = await open_page(browser, 4)
        for name in PIECES:
            await page4.locator(f'[data-video="{name}"]').screenshot(path=os.path.join(OUT, f'pieza-{name}@4x.png'), omit_background=True)
        await browser.close()
    for name in ['resultado-d126@2x'] + [f'pieza-{n}@4x' for n in PIECES]:
        mark_png(os.path.join(OUT, name + '.png'))
    with open(os.path.join(OUT, 'cajas.json'), 'w', encoding='utf-8') as f:
        json.dump({'_': 'SIMULATED DATA. Boxes of the day-126 result screen, CSS pixels of a 1920 x 1080 view. Made by capturar.py.',
                   'view': [1920, 1080], 'boxes': boxes, 'pieces': {n: f'pieza-{n}@4x.png' for n in PIECES}}, f, indent=1)
        f.write('\n')
    print('captures in', os.path.normpath(OUT), '·', ', '.join(sorted(boxes)))


asyncio.run(main())
