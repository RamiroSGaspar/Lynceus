# Video demo de Lynceus: decisiones

> Datos simulados. No es un dispositivo médico. No está validado con personas.

Fuente: cuatro rondas de preguntas del 15 nov 2026. Es el video de 30 segundos de la entrega (el desafío admite 7 diapositivas o un video de 30 s como máximo: `recursos-del-desafio.md`). Es lo primero que ven los jueces.

## Guion

Lo lee una voz de ElevenLabs, en inglés (`audio/guion.txt`). No cambia.

> Day 126. You see fine. But the back of your eye is swelling. And you can't feel it. Changes like this show up in seventy percent of astronauts on long missions. The specialist who can read this scan is on Earth. Up to forty minutes away. So Lynceus reads it on board. What changed. How much. How sure. What to do next. Your doctor on Earth gets the full report, and makes the call. Lynceus. See what you can't feel.

De dónde sale cada cifra:

| Cifra | Fuente |
|---|---|
| 70 % | Algún signo de SANS en tripulantes de vuelos largos: N2, pág. 3 (71 % en P7). `investigaciones/sans-evolucion-y-logica-clinica.md`, tabla de frecuencia; `problemas-candidatos.md` |
| 40 minutos | Demora de la señal ida y vuelta a la distancia de Marte, de 10 a 40 minutos: N3, `investigaciones/sans-spectralis-datos.md` §9. Coincide con los 10,5 a 21 minutos de ida de `comunicar-resultados-de-salud.md` |
| Día 126 y todo lo que se ve de la tomografía | El motor real, sobre un control simulado del tripulante C (ver «Datos») |

## Formato

- 1920 × 1080, 30 cuadros por segundo, H.264. Dura **30,000 s** exactos.
- Voz en inglés, sin subtítulos. Música de fondo sintética. Sin efectos de sonido.

## Audio

- **Voz:** 31,0 s originales. `audio/recortar_voz.py` acorta las pausas largas a 0,28 s, desde el medio y con sus dos bordes naturales; no toca las palabras, la velocidad ni el tono. Quedan más largas las tres pausas dramáticas: después de «Day 126.» (0,42 s), después de «You see fine.» (0,36 s) y antes de «and makes the call» (0,40 s). Resultado: 29,435 s; la última palabra termina en 29,315 s. Tiempos de cada frase: `audio/tiempos-voz.json`.
- La voz entra a los 0,15 s del video. La última palabra termina a los 29,47 s y el cierre queda quieto hasta los 30,000 s.
- **Música** (`audio/musica.py`): sintética, con numpy, sin muestras de terceros, como la de los videos del TOYP. Colchón oscuro y espacial en re menor, sin arpegio, que cambia de color con cada escena (re sus2, si bemol, sol menor 9, la sus4, re menor, si bemol maj7, fa/la); un brillo agudo y un soplo de aire muy bajos. Un pulso grave entra en «So Lynceus reads it» y marca los cuatro cortes; el acorde se resuelve en re mayor en «See what you can't feel».
- **Mezcla** (`audio/mezclar.py`): la música baja sola cuando habla la voz y queda 7 LU por debajo; nivel final −14 LUFS, pico −1,5 dBTP. Misma receta que los videos del TOYP.

## Historia y lugar

- Una **nave genérica en tránsito a Marte**, no la Estación Espacial: los 40 minutos sólo son ciertos lejos de la Tierra. La Tierra es un punto azul pálido.
- **Plano continuo**, salvo cuatro **cortes secos** en «What changed · How much · How sure · What to do next».
- La imagen cambia 0,15 s antes de cada frase (regla de los videos del TOYP).

| Voz | Imagen |
|---|---|
| Day 126. You see fine. | **Cuadro 0 y miniatura:** el astronauta, sin casco, en el ojo de buey de la nave, mirando la Tierra. Ya se lee `DAY 126` y `SIM-CREW-C` |
| But the back of your eye… can't feel it. | La cámara entra por la pupila de su ojo derecho. El corte horizontal por el nervio óptico: una cortina pasa de antes del vuelo al día 126 y después la superficie de la retina de antes queda como línea de trazos sobre la de hoy (continua). La hinchazón es el espacio entre las dos |
| Seventy percent… | Lectura `70 %` con su rótulo y diez perfiles de astronauta, siete encendidos |
| The specialist… Up to forty minutes away. | La nave y la Tierra, unidas por una línea de trazos. Lectura `40 min` |
| So Lynceus reads it on board. | La cámara entra por una ventanilla de la nave. El fondo de ojo derecho con los 48 cortes radiales que se encienden (la geometría real de la captura), y el disco se acomoda en la pantalla de resultado completa, con la abertura y los anillos que midió el motor. Pantalla completa durante 1,5 s |
| What changed · How much · How sure · What to do next | Cuatro cortes secos sobre piezas de esa pantalla: el nivel del ojo derecho, `+60 µm`, la Certeza y el primer paso |
| Your doctor on Earth gets the full report, and makes the call. | El informe viaja por la línea hasta la Tierra. La médica de vuelo, en su consola y con auriculares, lo lee y aprieta el control para hablar con la nave |
| Lynceus. See what you can't feel. | Tarjeta final: el isotipo se traza, el nombre, la frase, el aviso «Simulated data. Not a medical device. Not validated on people.» y «NASA Space Apps Challenge 2026» en texto chico. Sin logo de la NASA |

## Figuras

- Dibujo de líneas blancas, como un plano técnico, sobre negro. Hechas en el motor con trazos, sin imágenes.
- **Astronauta:** representa al tripulante simulado C (ingeniero de vuelo, 51 años). En pantalla sólo se lee `SIM-CREW-C`, nunca el nombre ficticio. Mira hacia la derecha, para que el ojo que se ve sea el derecho (OD), el del cambio.
- **Médica de vuelo:** una mujer de mediana edad, con auriculares y anteojos, rótulo «Flight surgeon».
- Movimiento sutil: flotar, parpadear, mover la mano. Nada de gestos de caricatura.

## Sistema Campo oscuro

- Colores, fuente (Atkinson Hyperlegible Next), isotipo, íconos y campo de estrellas del sistema (`sistema-de-diseno/`).
- Las estrellas no se mueven ni titilan: lo único que se mueve es la cámara, con paralaje entre las dos teselas del campo.
- Las cifras aparecen ya escritas (no cuentan desde cero); nada parpadea; ningún texto sobre estrellas sin velo o halo detrás.
- En pantalla sólo lecturas y rótulos del sistema: `DAY 126`, `70 %`, `40 min`, `+60 µm`, `Likely 85 %`, los cuatro rótulos en mayúsculas y la frase final.
- El color es de los niveles. Única excepción, a confirmar en el storyboard: el punto azul pálido de la Tierra.
- Mientras haya datos en pantalla, la ficha `SIMULATED DATA` de línea de trazos, como en la franja de la aplicación.

## Datos

- Todo lo que se ve de la tomografía sale del **motor real**: `datos/generar-control.ts` toma la historia medida de la aplicación (`getHistory`, días 0, 30, 58, 90 y 118 del tripulante C), captura el día 126 con el instrumento virtual (`captureEye`) y lo evalúa con las reglas (`assessSession`), como la aplicación. Salida: `animacion/datos/`.
- Resultado del día 126, ojo derecho: **+60 µm** desde su examen previo al vuelo (rango 51 a 69 µm), **Caution · Clinically concerning**, **Likely 85 %** de estar en el umbral de 55 µm o más, pliegues nuevos. Ojo izquierdo: +34 µm (24 a 45), Advisory · First sign. Primer paso: «Tell your flight surgeon about this result without waiting for the routine report.»
- **Supuesto de este video:** en esta sesión el tripulante responde el cuestionario **sin síntomas** («You see fine», «you can't feel it»), como puede hacer cualquiera en una sesión real. El escenario de la aplicación para el tripulante C trae visión de cerca algo peor desde el día 90; las pruebas de visión quedan las del escenario. La tomografía no depende de esto.
- **Las dos tomografías del corte se alinean** por los dos extremos de la abertura de la membrana de Bruch, que el motor marca en cada una: el instrumento virtual pone cada captura a su propia profundidad e inclinación (unas 50 a 60 filas de diferencia entre estas dos). Sin alinear, ese corrimiento parecía el cambio; alineadas, lo que cambia es la superficie de la retina, que es lo que el motor mide (el grosor sobre esa membrana). La leyenda del cuadro lo dice.
- La pantalla de resultado es la vista `resultado.html` del sistema de diseño con los valores del motor (`pantallas/preparar_resultado.py`) y capturada con `pantallas/capturar.py`. Sólo su primera vista. La línea de la misión no rotula FD118 (queda su marca): está a 8 días de hoy y los rótulos se pisaban.
- El nombre del producto y el aviso de datos simulados de la tarjeta final salen de `packages/core/src/product.ts` (regla 10), a través del JSON del motor. El aviso completo es «Simulated data. Not a medical device. Not validated on people.»

## Cómo se hace

Mismo método que los videos del TOYP:

1. Este documento.
2. Storyboard de cuadros fijos, para aprobar antes de animar.
3. Motor en canvas (`animacion/lynceus-demo.js`: `buildTimeline` y `drawFrame`) y editor de tiempos.
4. Voz recortada, música y mezcla.
5. Render con Playwright y ffmpeg, cuadro por cuadro.

Herramientas: el entorno de Python de los videos del TOYP (ffmpeg, Playwright, numpy), sin instalar nada ni modificarlo. Ver `LEEME.md`.

## Archivos

- Las fuentes van en `monitoreo-salud-astronautas/video-demo/` y se commitean. Las imágenes generadas no: se rehacen con los pasos de `LEEME.md`.
- Los renders y el MP4 quedan en `.tmp/video/`, sin commitear. El MP4 lo sube el equipo para el enlace de la entrega.

## Estado (15 nov 2026)

- **Storyboard v1:** 16 cuadros dibujados por el motor, en `.tmp/video/storyboard/storyboard.png` (y cada cuadro a tamaño completo en la misma carpeta). Para corregir.
- **Borrador v1:** el motor ya anima todo el plano; `.tmp/video/borrador-v1.mp4` lleva la voz y la música mezcladas (30,000 s, −14 LUFS). No es la entrega.
- **Pendiente:** aprobación del storyboard y del borrador, el punto azul pálido de la Tierra (única excepción de color), ajustes que salgan de verlo, editor de tiempos si hace falta y render final.
