# Video demo de Lynceus

> Datos simulados. No es un dispositivo médico. No está validado con personas.

El video de 30 segundos de la entrega. Las decisiones están en [`decisiones.md`](decisiones.md). Se arma como los videos del TOYP: un motor de animación en canvas que dibuja cada cuadro, Playwright que lo recorre y ffmpeg que arma el MP4.

## Qué hay

```
video-demo/
├─ decisiones.md                 lo acordado, escena por escena, y de dónde sale cada cifra
├─ audio/
│  ├─ guion.txt                  el guion que lee la voz
│  ├─ recortar_voz.py            acorta las pausas largas de la voz (no las palabras)
│  ├─ tiempos-voz.json           dónde empieza y termina cada frase de la voz recortada
│  ├─ musica.py                  la música de fondo, sintética
│  └─ mezclar.py                 voz y música, a −14 LUFS
├─ datos/
│  └─ generar-control.ts         el control del día 126 del tripulante C, con el motor real
├─ pantallas/
│  ├─ preparar_resultado.py      la pantalla de resultado del sistema de diseño, con esos números
│  ├─ resultado-d126.html        esa pantalla (generada)
│  └─ capturar.py                sus capturas para la animación
├─ animacion/
│  ├─ lynceus-demo.js            el motor: buildTimeline y drawFrame
│  ├─ render.html                la página que dibuja
│  └─ datos/control-C-d126.json  lo que dio el motor (generado)
└─ render/
   ├─ render.py                  cuadros sueltos o el video completo
   └─ hoja_storyboard.py         la hoja del storyboard
```

Las imágenes generadas (fondo de ojo, cortes y capturas de pantalla) no se commitean: se rehacen con los pasos de abajo. Los renders van a `.tmp/video/` en la raíz del repositorio.

## Qué hace falta

- El repositorio con `pnpm install` hecho (para el paso 1).
- Python 3 con Pillow (pasos 2 y 6).
- Un entorno de Python con `playwright`, `numpy` y Google Chrome, y `ffmpeg` y `ffprobe` en el PATH (pasos 2 a 7). En la máquina del equipo es el entorno de los videos del TOYP; no hace falta instalar nada global.

## Cómo se rehace todo

Desde la raíz del repositorio:

1. **Datos del motor** (unos 25 s): escribe `animacion/datos/`.
   ```bash
   pnpm --filter @app/validation exec tsx ../../monitoreo-salud-astronautas/video-demo/datos/generar-control.ts
   ```
2. **Pantalla de resultado y sus capturas**: escribe `pantallas/resultado-d126.html`, `pantallas/img/` y `animacion/capturas/`.
   ```bash
   python3 monitoreo-salud-astronautas/video-demo/pantallas/preparar_resultado.py
   ```
   ```bash
   python monitoreo-salud-astronautas/video-demo/pantallas/capturar.py
   ```
3. **Voz**: recorta las pausas y escribe los tiempos de cada frase. Si cambian, se copian a `VOICE` en `animacion/lynceus-demo.js`.
   ```bash
   python3 monitoreo-salud-astronautas/video-demo/audio/recortar_voz.py VOZ.mp3 .tmp/video/audio/voz-recortada.wav monitoreo-salud-astronautas/video-demo/audio/tiempos-voz.json
   ```
4. **La voz con su entrada**: entra a los 0,15 s del video, que dura 30 s.
   ```bash
   ffmpeg -y -i .tmp/video/audio/voz-recortada.wav -af "adelay=150:all=1,apad=whole_dur=30" -t 30 -ar 48000 .tmp/video/audio/voz-video.wav
   ```
5. **Música y mezcla**: la música sale de los mismos tiempos (numpy); la mezcla la baja cuando habla la voz y deja todo en −14 LUFS.
   ```bash
   python monitoreo-salud-astronautas/video-demo/audio/musica.py monitoreo-salud-astronautas/video-demo/audio/tiempos-voz.json .tmp/video/audio/musica.wav
   ```
   ```bash
   python3 monitoreo-salud-astronautas/video-demo/audio/mezclar.py .tmp/video/audio/voz-video.wav .tmp/video/audio/musica.wav .tmp/video/audio/mezcla.wav
   ```
6. **Storyboard**: los cuadros los dibuja el mismo motor; la hoja los junta.
   ```bash
   python monitoreo-salud-astronautas/video-demo/render/render.py --cuadros .tmp/video/storyboard $(python3 monitoreo-salud-astronautas/video-demo/render/hoja_storyboard.py --tiempos)
   ```
   ```bash
   python3 monitoreo-salud-astronautas/video-demo/render/hoja_storyboard.py .tmp/video/storyboard
   ```
7. **Video** (1920 × 1080, 30 cuadros por segundo; `CRF=19` delante da un borrador más liviano).
   ```bash
   python monitoreo-salud-astronautas/video-demo/render/render.py .tmp/video/lynceus-demo.mp4 .tmp/video/audio/mezcla.wav
   ```

`render.py` sirve `monitoreo-salud-astronautas/` en `127.0.0.1` mientras dibuja: el motor lee JSON e imágenes, y una página abierta como archivo no puede.

## Reglas que el motor respeta

- Todo número que se ve sale de `animacion/datos/control-C-d126.json`, o de la investigación citada en `decisiones.md` (70 %, 40 min).
- El nombre del producto y el aviso de datos simulados salen de `packages/core/src/product.ts`, a través de ese JSON.
- Cada escena con datos lleva la ficha `SIMULATED DATA`.
- Determinista: `drawFrame` no guarda estado entre cuadros y no usa azar ni la hora. El mismo código da el mismo video.
