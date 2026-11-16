"""Lynceus demo video: the storyboard sheet. SIMULATED DATA.

The storyboard frames are drawn by the engine itself (render.py --cuadros), at the moments
listed in CUADROS; this script lays them out on one sheet with the voice and a note.

Usage (python3 with Pillow):
    python3 hoja_storyboard.py --tiempos                       prints the times, for render.py
    python3 hoja_storyboard.py CARPETA                         CARPETA/storyboard.png, from CARPETA/f_*.png
Both steps:
    python render.py --cuadros CARPETA $(python3 hoja_storyboard.py --tiempos)
    python3 hoja_storyboard.py CARPETA
"""
import os
import sys

# (time in s, voice, what is seen). The time is a moment of the final video.
CUADROS = [
    (0.00, 'Day 126.', 'Cuadro 0 y miniatura. El astronauta (SIM-CREW-C) en el ojo de buey, la Tierra, DAY 126.'),
    (3.05, 'You see fine.', 'Se marca su ojo derecho (OD): el del cambio.'),
    (4.05, 'But the back of your eye…', 'La cámara entra por la pupila: el corte por el nervio óptico.'),
    (6.40, '…is swelling. And you can’t feel it.', 'Día 126 (continua) contra antes del vuelo (trazos), alineados por la membrana. Motor real.'),
    (9.60, '…seventy percent of astronauts…', '70 % con su fuente. Siete de diez perfiles encendidos.'),
    (13.30, 'The specialist… is on Earth.', 'La Tierra y la nave, unidas por una línea de trazos.'),
    (15.40, 'Up to forty minutes away.', '40 min: ida y vuelta de la señal a la distancia de Marte.'),
    (16.55, 'So Lynceus reads it on board.', 'Captura: los 48 cortes radiales sobre el fondo de ojo.'),
    (17.95, '(sigue)', 'La pantalla de resultado completa, con los datos del motor.'),
    (18.90, 'What changed.', 'Corte 1: ojo derecho, Caution · Clinically concerning.'),
    (19.90, 'How much.', 'Corte 2: +60 µm, rango 51 a 69 µm.'),
    (20.90, 'How sure.', 'Corte 3: la escala y Likely 85 %.'),
    (21.95, 'What to do next.', 'Corte 4: avisar al médico de vuelo sin esperar.'),
    (23.20, '…gets the full report,', 'Your doctor on Earth gets the full report: el informe viaja por la línea hasta la Tierra.'),
    (26.45, '…and makes the call.', 'La médica de vuelo lee el informe y aprieta TALK.'),
    (29.60, 'Lynceus. See what you can’t feel.', 'Tarjeta final. Datos simulados; no es un dispositivo médico.'),
]

FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
FONT_B = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'


def wrap(draw, text, font, width):
    words, lines, cur = text.split(), [], ''
    for w in words:
        test = (cur + ' ' + w).strip()
        if draw.textlength(test, font=font) <= width:
            cur = test
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def sheet(folder):
    from PIL import Image, ImageDraw, ImageFont
    cols, tw, th, gap, cap = 4, 600, 338, 24, 118
    rows = (len(CUADROS) + cols - 1) // cols
    W = cols * tw + (cols + 1) * gap
    H = 120 + rows * (th + cap + gap) + gap
    out = Image.new('RGB', (W, H), (14, 14, 14))
    d = ImageDraw.Draw(out)
    f_title, f_b, f_r, f_s = ImageFont.truetype(FONT_B, 34), ImageFont.truetype(FONT_B, 21), ImageFont.truetype(FONT, 19), ImageFont.truetype(FONT, 17)
    d.text((gap, 30), 'Lynceus · video demo de 30 s · storyboard', font=f_title, fill=(255, 255, 255))
    d.text((gap, 76), 'Cuadros dibujados por el motor de animación. DATOS SIMULADOS: tripulante ficticio, instrumento virtual, motor de análisis real.', font=f_r, fill=(198, 201, 206))
    for i, (t, voz, nota) in enumerate(CUADROS):
        path = os.path.join(folder, f'f_{t:06.2f}.png')
        x = gap + (i % cols) * (tw + gap)
        y = 120 + (i // cols) * (th + cap + gap)
        im = Image.open(path).convert('RGB').resize((tw, th), Image.LANCZOS)
        out.paste(im, (x, y))
        d.rectangle((x, y, x + tw - 1, y + th - 1), outline=(58, 58, 58))
        d.text((x, y + th + 10), f'{i + 1:02d} · {t:05.2f} s', font=f_b, fill=(255, 255, 255))
        d.text((x + 150, y + th + 10), voz, font=f_b, fill=(255, 216, 77) if i in (9, 10, 11, 12) else (220, 220, 220))
        for j, ln in enumerate(wrap(d, nota, f_s, tw)[:3]):
            d.text((x, y + th + 42 + j * 22), ln, font=f_s, fill=(159, 163, 169))
    dest = os.path.join(folder, 'storyboard.png')
    out.save(dest, optimize=True)
    print(dest, out.size)


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--tiempos':
        print(' '.join(f'{t:.2f}' for t, _, _ in CUADROS))
    elif len(sys.argv) > 1:
        sheet(sys.argv[1])
    else:
        sys.exit(__doc__)
