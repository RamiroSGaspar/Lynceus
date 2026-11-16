"""Project card for LinkedIn and the Space Apps project page, in the "Campo oscuro" design system.

Builds tarjeta.html (next to this file) from the design system's CSS and the right-eye ocular of
the demo video's day-126 result screen (../video-demo/pantallas/resultado-d126.html, made by
preparar_resultado.py), and captures it in two formats into .tmp/difusion/ at the repository root:
- tarjeta-1200x627.png and tarjeta-1200x627@2x.png: post and link card (1.91:1); also the project image.
- banner-1584x396.png and banner-1584x396@2x.png: LinkedIn profile banner (4:1). The profile photo
  covers its lower left corner, so the left 360 px carry nothing that matters.
The card shows simulated data (the ocular of a fictional crew member): it says so twice.
The product name and the notice come from packages/core/src/product.ts, through the engine's JSON.

Usage (python with playwright and Google Chrome):  python tarjeta.py
"""
import asyncio
import json
import os

from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
SCREEN = os.path.join(HERE, '..', 'video-demo', 'pantallas', 'resultado-d126.html')
DATA = os.path.join(HERE, '..', 'video-demo', 'animacion', 'datos', 'control-C-d126.json')
OUT = os.path.join(ROOT, '.tmp', 'difusion')
FORMATS = {'tarjeta': (1200, 627), 'banner': (1584, 396)}

PAGE = """<!-- SIMULATED DATA: the ocular shows a fictional crew member. Made by difusion/tarjeta.py; do not edit by hand. -->
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{name} · project card</title>
<link rel="icon" href="data:,">
<link rel="stylesheet" href="../sistema-de-diseno/sistema/tokens.css">
<link rel="stylesheet" href="../sistema-de-diseno/sistema/components/bundle.css">
<style>
  html, body {{ margin: 0; overflow: hidden; }}
  body {{ width: 1200px; height: 627px; }}
  body.banner {{ width: 1584px; height: 396px; }}
  .tarjeta {{ position: relative; box-sizing: border-box; width: 100%; height: 100%; display: grid; grid-template-columns: 1fr auto; grid-template-rows: minmax(0, 1fr); align-items: center; column-gap: 56px; padding: 44px 72px 40px 64px; }}
  /* Where text is read, the field goes dark: a veil from the left edge. */
  .tarjeta::before {{ content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.9) 48%, rgba(0,0,0,0) 72%); pointer-events: none; }}
  .texto, .visual {{ position: relative; }}
  .texto {{ display: grid; grid-template-rows: auto 1fr auto; height: 100%; }}
  .texto .co-marca__iso {{ width: 44px; }}
  .texto .co-marca__nombre {{ font-size: 18px; }}
  .mensaje {{ align-self: center; }}
  h1 {{ margin: 0 0 18px; font-size: 62px; font-weight: 400; line-height: 1.04; letter-spacing: -0.01em; color: var(--color-text); }}
  .sub {{ margin: 0 0 14px; max-width: 34ch; font-size: 25px; line-height: 1.3; color: var(--color-text-secondary); }}
  .puntos {{ margin: 0; font-size: 17px; line-height: 1.45; color: var(--color-text-muted); }}
  .pie {{ display: grid; gap: 12px; }}
  .pie__linea {{ display: flex; align-items: center; flex-wrap: wrap; gap: 8px 16px; }}
  .evento {{ font-size: 15px; font-weight: 600; letter-spacing: var(--tracking-caps); text-transform: uppercase; color: var(--color-text); }}
  .desafio {{ font-size: 15px; color: var(--color-text-muted); }}
  .visual {{ --ocular-size: 206px; display: grid; justify-items: center; align-self: center; }}
  .visual .co-ocular__cabeza {{ margin-bottom: 26px; }}
  .aviso {{ font-size: 13px; color: var(--color-text-muted); }}

  /* Banner: the photo covers the lower left; disc and reading side by side. */
  .banner .tarjeta {{ grid-template-columns: 1fr auto; padding: 28px 72px 28px 360px; column-gap: 64px; }}
  .banner .tarjeta::before {{ background: linear-gradient(90deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.9) 62%, rgba(0,0,0,0) 80%); }}
  .banner .texto {{ grid-template-rows: 1fr auto; }}
  .banner .texto .co-marca {{ position: absolute; top: 0; left: -296px; }}
  .banner h1 {{ font-size: 52px; margin-bottom: 12px; }}
  .banner .sub {{ font-size: 21px; max-width: none; margin-bottom: 0; }}
  .banner .puntos {{ display: none; }}
  .banner .visual {{ --ocular-size: 210px; }}
  .banner .co-ocular {{ grid-template-columns: auto auto; grid-template-areas: "campo cabeza" "campo pie"; align-items: center; column-gap: 44px; justify-items: start; }}
  .banner .co-ocular__campo {{ grid-area: campo; }}
  .banner .co-ocular__cabeza {{ grid-area: cabeza; margin: 0; justify-items: start; text-align: left; align-self: end; }}
  .banner .co-ocular__pie {{ grid-area: pie; margin: 12px 0 0; justify-items: start; text-align: left; align-self: start; }}
  .banner .co-ocular__guia {{ display: none; }}
  .banner .co-lectura--heroe .co-lectura__valor {{ justify-content: flex-start; font-size: 56px; }}
  .banner .co-lectura--heroe .co-lectura__rotulo {{ justify-content: flex-start; }}
  .banner .pie {{ gap: 8px; }}
</style>
</head>
<body class="co co-campo">
<main class="tarjeta">
  <section class="texto">
    <span class="co-marca"><span class="co-marca__iso" data-co-marca="mini"></span><span class="co-marca__nombre">{name}</span></span>
    <div class="mensaje">
      <h1>See what you can’t feel.</h1>
      <p class="sub">On-board first read of spaceflight eye changes.</p>
      <p class="puntos">Retinal OCT, each astronaut against their own pre-flight exam.<br>NASA thresholds, stated uncertainty, and the flight surgeon decides.</p>
    </div>
    <div class="pie">
      <div class="pie__linea"><span class="evento">NASA Space Apps Challenge 2026</span><span class="desafio">Health monitoring software for astronauts</span></div>
      <div class="pie__linea"><span class="co-ficha co-ficha--simulado"><svg class="co-ic" aria-hidden="true"><use href="#i-flask-conical"/></svg>Simulated<span class="co-ficha__resto">&#160;data</span></span><span class="aviso">{notice}</span></div>
    </div>
  </section>
  <section class="visual">
    {ocular}
  </section>
</main>
<script src="../sistema-de-diseno/sistema/assets/iconos/sprite.js"></script>
<script>if (location.search.includes('banner')) document.body.classList.add('banner');</script>
</body>
</html>
"""


def build():
    screen = open(SCREEN, encoding='utf-8').read()
    start = screen.index('<figure class="co-ocular co-ocular--caution is-elegido">')
    ocular = screen[start:screen.index('</figure>', start) + len('</figure>')]
    # The selection frame belongs to the result screen, not to a card.
    ocular = ocular.replace(' is-elegido', '').replace('src="img/', 'src="../video-demo/pantallas/img/')
    product = json.load(open(DATA, encoding='utf-8'))['product']
    html = PAGE.format(name=product['name'], notice=product['notice'], ocular=ocular)
    path = os.path.join(HERE, 'tarjeta.html')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)
    return path


async def capture(path):
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel='chrome', args=['--font-render-hinting=none'])
        for fmt, (w, h) in FORMATS.items():
            for scale in (1, 2):
                page = await browser.new_page(viewport={'width': w, 'height': h}, device_scale_factor=scale)
                await page.goto('file://' + path + ('?banner' if fmt == 'banner' else ''))
                await page.evaluate('document.fonts.ready')
                await page.wait_for_timeout(400)
                name = f'{fmt}-{w}x{h}' + ('@2x' if scale == 2 else '') + '.png'
                await page.screenshot(path=os.path.join(OUT, name))
                await page.close()
        await browser.close()
    print('cards in', OUT)


if __name__ == '__main__':
    asyncio.run(capture(build()))
