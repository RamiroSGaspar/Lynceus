"""Lynceus demo video: the result screen of flight day 126, made from the design system's view.

Takes sistema-de-diseno/vistas/resultado.html (the result screen of the "Campo oscuro" system,
drawn for crew member C on flight day 118), keeps its first view (the cockpit and the bottom
navigation) and puts in it the numbers the real engine gave for flight day 126
(../animacion/datos/control-C-d126.json, made by ../datos/generar-control.ts). SIMULATED DATA.

Writes, next to this file:
- resultado-d126.html: the screen, opened by capturar.py.
- img/fondo-C-OD-d126.jpg and img/fondo-C-OS-d126.jpg: the round crop of each fundus image.

Every replaced string must be found exactly once (or the given number of times): if the
view changes, this script stops instead of producing a screen with old numbers.

Usage (python3 with Pillow):  python3 preparar_resultado.py
"""
import json
import math
import os
import sys

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
VIEW = os.path.join(HERE, '..', '..', 'sistema-de-diseno', 'vistas', 'resultado.html')
DATA = os.path.join(HERE, '..', 'animacion', 'datos')
OUT_HTML = os.path.join(HERE, 'resultado-d126.html')
IMG = os.path.join(HERE, 'img')

# Square crop of the fundus image around the nerve opening, fundus pixels: the outer ring
# (1500 µm from the opening) falls at about 43 % of it, as in the design system's sample.
CROP_PX = 950
OCULAR_PX = 720
UM_PER_PX = 5.7  # SLO_SCALE_MM (packages/core/src/constants.ts)
RINGS_UM = (250, 500, 1000, 1500)  # ring limits, packages/core/src/constants.ts RINGS_UM

# The change scale of the result screen: 0 µm at 11.1 %, 55 µm at 72.2 % (the sample's layout).
SCALE_ZERO, SCALE_55 = 11.1, 72.2


def scale_x(um):
    return SCALE_ZERO + um * (SCALE_55 - SCALE_ZERO) / 55


def pct(v):
    return f'{v:.1f}%'


def num(v, d=1):
    s = f'{v:.{d}f}'
    return s.rstrip('0').rstrip('.') if '.' in s else s


def replace(text, old, new, count=1):
    found = text.count(old)
    if found != count:
        sys.exit(f'Expected {count} of {old[:90]!r}, found {found}')
    return text.replace(old, new)


def between(text, start, end, new):
    """Replaces from `start` up to the next `end` (both included)."""
    i = text.find(start)
    if i < 0:
        sys.exit(f'Not found: {start[:90]!r}')
    j = text.find(end, i)
    if j < 0:
        sys.exit(f'Not found after {start[:60]!r}: {end[:60]!r}')
    return text[:i] + new + text[j + len(end):]


def crop_fundus(eye, opening):
    src = os.path.join(DATA, f'fondo-C-{eye}-d126.png')
    cx, cy = opening['centerPx']
    half = CROP_PX / 2
    box = (round(cx - half), round(cy - half), round(cx - half) + CROP_PX, round(cy - half) + CROP_PX)
    im = Image.open(src).convert('L').crop(box).resize((OCULAR_PX, OCULAR_PX), Image.LANCZOS)
    # Simulated-data mark in a corner, outside the round window of the ocular (AGENTS.md rule 8).
    d = ImageDraw.Draw(im)
    d.rectangle((4, OCULAR_PX - 18, 104, OCULAR_PX - 4), fill=0)
    d.text((8, OCULAR_PX - 17), 'SIMULATED DATA', fill=255)
    os.makedirs(IMG, exist_ok=True)
    out = os.path.join(IMG, f'fondo-C-{eye}-d126.jpg')
    im.save(out, quality=92)
    # Opening centre inside the crop, in % of the crop.
    return (cx - box[0]) / CROP_PX * 100, (cy - box[1]) / CROP_PX * 100


def ocular_marks(opening, center):
    cx, cy = center
    a, b, rot = opening['semiMajorPx'], opening['semiMinorPx'], opening['angleDeg']
    p = lambda v: v / CROP_PX * 100
    o = [um / UM_PER_PX for um in RINGS_UM]
    tr = f'transform="rotate({num(rot, 3)} {num(cx)} {num(cy)})"'
    e = lambda cls, rx, ry, extra='': f'<ellipse class="{cls}" cx="{num(cx)}" cy="{num(cy)}" rx="{num(p(rx))}" ry="{num(p(ry))}" {tr}{extra}/>'
    parts = [
        e('co-zona', a + o[0] / 2, b + o[0] / 2, f' stroke-width="{num(p(o[0]))}"'),
        e('co-trazo co-trazo--base', a, b), e('co-trazo', a, b),
        e('co-trazo co-trazo--base', a + o[0], b + o[0]), e('co-trazo co-trazo--trazos', a + o[0], b + o[0]),
        e('co-trazo co-trazo--puntos', a + o[1], b + o[1]),
        e('co-trazo co-trazo--puntos', a + o[2], b + o[2]),
        e('co-trazo co-trazo--puntos', a + o[3], b + o[3]),
    ]
    svg = '<svg class="co-ocular__marcas" viewBox="0 0 100 100" aria-hidden="true">' + ''.join(parts) + '</svg>'
    # The guide starts at the lowest point of the main ring zone and goes down to the reading.
    rx, ry, t = p(a + o[0] / 2), p(b + o[0] / 2), math.radians(rot)
    ext = math.sqrt((rx * math.sin(t)) ** 2 + (ry * math.cos(t)) ** 2)
    gx = cx + (rx * rx - ry * ry) * math.sin(t) * math.cos(t) / ext
    gy = cy + ext
    guide = (f'<svg class="co-ocular__guia" viewBox="0 0 100 100" aria-hidden="true">'
             f'<line class="co-trazo co-trazo--base" x1="{num(gx)}" y1="{num(gy)}" x2="{num(gx)}" y2="99"/>'
             f'<line class="co-trazo" x1="{num(gx)}" y1="{num(gy)}" x2="{num(gx)}" y2="113"/>'
             f'<circle class="co-punto co-punto--lleno" cx="{num(gx)}" cy="{num(gy)}" r="1.4"/></svg>')
    return svg, guide


def polyline(values, step=6):
    """SVG path through (column, row) every `step` columns; a missing value breaks the line."""
    out, pen = [], False
    cols = list(range(0, len(values), step))
    if cols[-1] != len(values) - 1:
        cols.append(len(values) - 1)
    for c in cols:
        v = values[c]
        if v is None:
            pen = False
            continue
        out.append(f'{"L" if pen else "M"}{c} {num(v)}')
        pen = True
    return ''.join(out)


def scan_marks(scan):
    ilm, bm = polyline(scan['ilmPx']), polyline(scan['bmPx'])
    circles = ''.join(f'<circle class="co-punto" cx="{num(p["columnPx"], 3)}" cy="{num(p["rowPx"], 3)}" r="9"/>' for p in scan['bmo'] if p)
    return (f'<svg class="co-corte__marcas" viewBox="0 0 768 496" preserveAspectRatio="none" aria-hidden="true">'
            f'<path class="co-trazo co-trazo--base" d="{ilm}"/><path class="co-trazo" d="{ilm}"/>'
            f'<path class="co-trazo co-trazo--base" d="{bm}"/><path class="co-trazo co-trazo--trazos" d="{bm}"/>{circles}</svg>')


LEVEL = {  # level id -> (css class, level shape, class word, name)
    'no-detectable-change': ('none', 'l-none', 'None', 'No detectable change'),
    'first-sign': ('advisory', 'l-advisory', 'Advisory', 'First sign'),
    'clinically-concerning': ('caution', 'l-caution', 'Caution', 'Clinically concerning'),
}


def mission_line(controls, today_day, today_level, next_day):
    def x(day):
        return pct(day / 180 * 100)
    items = ['<ol class="co-mision__linea">',
             '<li style="--x:0%"><a class="co-mision__control" href="#" aria-label="Pre-flight exam"><span class="co-mision__marca">Pre-flight</span>'
             '<svg class="co-mision__punto co-mision__punto--none" aria-hidden="true"><use href="#l-none"/></svg></a></li>']
    for c in controls:
        if c['flightDay'] == 0:
            continue
        cls, shape, _, name = LEVEL[c['level']]
        # Flight day 118 is 8 days before today: its day label would sit on today's. The marker stays.
        label = '' if today_day - c['flightDay'] < 12 else f'<span class="co-mision__dia">FD{c["flightDay"]}</span>'
        items.append(f'<li style="--x:{x(c["flightDay"])}"><a class="co-mision__control" href="#" aria-label="Flight day {c["flightDay"]}: {name}">'
                     f'<svg class="co-mision__punto co-mision__punto--{cls}" aria-hidden="true"><use href="#{shape}"/></svg>{label}</a></li>')
    cls, shape, _, name = LEVEL[today_level]
    items.append(f'<li style="--x:{x(today_day)}" aria-current="step"><a class="co-mision__control" href="#" aria-label="Flight day {today_day}, today: {name}">'
                 f'<span class="co-mision__marca">today</span><svg class="co-mision__punto co-mision__punto--{cls}" aria-hidden="true"><use href="#{shape}"/></svg>'
                 f'<span class="co-mision__dia">FD{today_day}</span></a></li>')
    items.append(f'<li style="--x:{x(next_day)}"><a class="co-mision__control" href="#" aria-label="Flight day {next_day}: next scan, not done yet">'
                 f'<svg class="co-mision__punto co-mision__punto--unmeasured" aria-hidden="true"><use href="#l-unmeasured"/></svg>'
                 f'<span class="co-mision__dia">FD{next_day}</span></a></li>')
    items.append('<li style="--x:100%"><a class="co-mision__control" href="#" aria-label="Flight day 180: return"><span class="co-mision__marca">Return</span>'
                 '<span class="co-mision__punto co-mision__punto--tope"></span></a></li>')
    items.append('</ol>')
    return '\n'.join(items)


def scale_block(eye_name, change, controls, eye):
    v = change['value']
    lo, hi = change['interval95']
    earlier = [(c['flightDay'], c['eyes'][eye]['changeUm']) for c in controls if c['flightDay'] > 0 and c['eyes'][eye]['changeUm'] is not None]
    band = 'Clinically concerning” (55 µm or more)' if v >= 55 else ('First sign” (above 19.4 and below 55 µm)' if v > 19.4 else 'Normal variation” (19.4 µm or less)')
    aria = (f'{eye_name}: change of {round(v)} micrometres since your pre-flight exam, range {round(lo)} to {round(hi)}. '
            f'It falls in the band “{band}. NASA’s thresholds are 19.4 and 55 micrometres. Earlier controls: '
            + '; '.join(f'flight day {d}, {round(u)} µm' for d, u in earlier) + '.')
    antes = ''.join(f'<span class="co-escala__antes" style="--x:{pct(scale_x(u))}"></span>' for _, u in earlier)
    return aria, f'<span class="co-escala__rango" style="--desde:{pct(scale_x(lo))};--hasta:{pct(scale_x(hi))}"></span>\n{antes}\n<span class="co-escala__hoy" style="--x:{pct(scale_x(v))}"></span>'


def main():
    d = json.load(open(os.path.join(DATA, 'control-C-d126.json'), encoding='utf-8'))
    a, x, im = d['assessment'], d['explanation'], d['images']
    day = d['flightDay']
    if a['level'] != 'clinically-concerning' or a['eyes']['OD']['level'] != 'clinically-concerning':
        sys.exit('This screen is laid out for a clinically concerning right eye')
    html = open(VIEW, encoding='utf-8').read()

    # Keep the first view: up to the end of the cockpit, then the bottom navigation and the scripts.
    head, rest = html.split('</main>', 1)
    nav = rest[rest.index('<nav class="co-nav'):rest.index('</nav>', rest.index('<nav class="co-nav')) + len('</nav>')]
    scripts = rest[rest.index('<script src='):]
    html = head + '</main>\n' + nav + '\n</div>\n' + scripts

    html = replace(html, '<!-- Muestra con datos simulados: tripulación ficticia. No son datos de una persona. -->',
                   '<!-- SIMULATED DATA. Lynceus demo video: the design system\'s result view with the numbers the real engine gave for '
                   'fictional crew member C on flight day 126 (made by video-demo/pantallas/preparar_resultado.py; do not edit by hand). -->')
    html = html.replace('href="../sistema/', 'href="../../sistema-de-diseno/sistema/').replace('src="../sistema/', 'src="../../sistema-de-diseno/sistema/')
    html = replace(html, '<link rel="stylesheet" href="vistas.css">', '<link rel="stylesheet" href="../../sistema-de-diseno/vistas/vistas.css">')
    html = replace(html, '<title>Result of flight day 118: Ravi Anand</title>', f'<title>Result of flight day {day}: {d["crew"]["patientId"]}</title>')
    # The product name comes from packages/core/src/product.ts, through the engine's JSON (AGENTS.md rule 10).
    html = replace(html, 'aria-label="Lynceus: start"', f'aria-label="{d["product"]["name"]}: start"')
    html = replace(html, '<span class="co-marca__nombre">Lynceus</span>', f'<span class="co-marca__nombre">{d["product"]["name"]}</span>')
    # Flight day 1 is 2026-05-20 (packages/core/src/eye/crew.ts): flight day 126 is Sep 22, 2026.
    html = replace(html, 'Sep 14, 2026</span><span class="co-ficha">FD118</span>', f'Sep 22, 2026</span><span class="co-ficha">FD{day}</span>')
    # Decision of the video: the crew member is shown by the simulated id, not by the fictional name.
    html = replace(html, '<p class="co-sujeto__nombre">Ravi Anand</p>', f'<p class="co-sujeto__nombre">{d["crew"]["patientId"]}</p>')
    html = replace(html, 'The change in your right eye is at NASA’s clinically concerning level.', x['headline'])

    steps = x['nextSteps']
    html = replace(html, 'Tell your flight surgeon about this result without waiting for the routine report.', steps[0]['text'])
    html = replace(html, 'Repeat the scan of both eyes on flight day 139 (in 21 days).', steps[1]['text'])
    html = replace(html, 'All 4 steps, and why', f'All {len(steps)} steps, and why')

    for eye, old_img, old_marks_start, old_guide_start in (
        ('OD', 'simulado-fondo-C-OD-d118.jpg', '<svg class="co-ocular__marcas" viewBox="0 0 100 100" aria-hidden="true"><ellipse class="co-zona" cx="48.8"',
         '<svg class="co-ocular__guia" viewBox="0 0 100 100" aria-hidden="true"><line class="co-trazo co-trazo--base" x1="48.1"'),
        ('OS', 'simulado-fondo-C-OS-d118.jpg', '<svg class="co-ocular__marcas" viewBox="0 0 100 100" aria-hidden="true"><ellipse class="co-zona" cx="51"',
         '<svg class="co-ocular__guia" viewBox="0 0 100 100" aria-hidden="true"><line class="co-trazo co-trazo--base" x1="50.8"'),
    ):
        center = crop_fundus(eye, im[eye]['opening'])
        marks, guide = ocular_marks(im[eye]['opening'], center)
        html = replace(html, f'../../sistema-de-diseno/sistema/assets/img/{old_img}', f'img/fondo-C-{eye}-d{day}.jpg')
        html = between(html, old_marks_start, '</svg>', marks)
        html = between(html, old_guide_start, '</svg>', guide)

    od, os_ = a['eyes']['OD']['change']['trtRingUm'], a['eyes']['OS']['change']['trtRingUm']
    html = replace(html, '<p class="co-lectura__valor">+58 <span', f'<p class="co-lectura__valor">+{round(od["value"])} <span')
    html = replace(html, 'range 47 to 68 µm', f'range {round(od["interval95"][0])} to {round(od["interval95"][1])} µm')
    html = replace(html, '<p class="co-lectura__valor">+33 <span', f'<p class="co-lectura__valor">+{round(os_["value"])} <span')
    html = replace(html, 'range 23 to 43 µm', f'range {round(os_["interval95"][0])} to {round(os_["interval95"][1])} µm')

    html = between(html, '<ol class="co-mision__linea">', '</ol>', mission_line(d['controls'], day, a['level'], a['nextOct']['flightDay']))

    # How sure, both eye panels (the left eye's panel is hidden on the first view).
    for eye, name, change in (('OD', 'Right eye', od), ('OS', 'Left eye', os_)):
        aria, marks = scale_block(name, change, d['controls'], eye)
        html = between(html, f'<div class="co-escala" role="img" aria-label="{name}: change of', '">', f'<div class="co-escala" role="img" aria-label="{aria}">')
        # From this scale's range bar to the end of its "today" disc.
        start = html.index('<span class="co-escala__rango"', html.index(f'aria-label="{aria}"'))
        end = html.index('</span>', html.index('<span class="co-escala__hoy"', start)) + len('</span>')
        html = html[:start] + marks + html[end:]

    th = next(t for t in a['eyes']['OD']['thresholds'] if t['thresholdId'] == 'trt-clinically-concerning')
    if th['word'] != 'likely':
        sys.exit(f'The certainty block is laid out for "likely", the engine says {th["word"]}')
    html = replace(html, 'Likely <small>69 %</small>', f'Likely <small>{round(th["probabilityExceeded"] * 100)} %</small>')

    q = {e: im[e]['quality'] for e in ('OD', 'OS')}
    html = replace(html, '<p class="co-lectura__valor">22.8 <span class="co-lectura__unidad">dB</span>', f'<p class="co-lectura__valor">{q["OD"]["meanQualityDb"]} <span class="co-lectura__unidad">dB</span>')
    html = replace(html, '<p class="co-lectura__valor">24.5 <span class="co-lectura__unidad">dB</span>', f'<p class="co-lectura__valor">{q["OS"]["meanQualityDb"]} <span class="co-lectura__unidad">dB</span>')
    for e in ('OD', 'OS'):
        if q[e]['usableScans'] != 48 or q[e]['totalScans'] != 48:
            sys.exit(f'{e}: the sample reads "48 of 48" usable scans')
    for eye in ('OD', 'OS'):
        html = replace(html, f'../../sistema-de-diseno/sistema/assets/img/simulado-corte-C-{eye}-d118-k0.jpg', f'../animacion/datos/corte-C-{eye}-d{day}-k0.png')
        start = html.find('<svg class="co-corte__marcas"', html.find(f'corte-C-{eye}-d{day}-k0.png'))
        end = html.find('</svg>', start) + len('</svg>')
        html = html[:start] + scan_marks(im[eye]['scan']) + html[end:]

    for stale in ('d118', 'FD118', '+58', '69 %', 'Ravi Anand', 'flight day 139'):
        if stale in html:
            sys.exit(f'A value of the sample is still in the screen: {stale!r}')
    with open(OUT_HTML, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'{OUT_HTML}: OD +{od["value"]:.1f} µm, OS +{os_["value"]:.1f} µm, likely {th["probabilityExceeded"]:.3f}')


if __name__ == '__main__':
    main()
