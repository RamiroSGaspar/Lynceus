# Escala de cambio

Dónde cae el cambio de hoy respecto de los dos umbrales de la NASA, con su rango y con los controles anteriores. Una línea reemplaza a tres oraciones.

```html
<div class="co-escala" role="img" aria-label="Right eye: change of 58 micrometres since your pre-flight exam, range 47 to 68. …">
  <span class="co-escala__zona co-escala__zona--none" style="--desde:0%;--hasta:32.7%"><span>… Normal variation</span></span>
  <span class="co-escala__zona co-escala__zona--advisory" style="--desde:32.7%;--hasta:72.2%"><span>… First sign</span></span>
  <span class="co-escala__zona co-escala__zona--caution" style="--desde:72.2%;--hasta:100%"><span>… Clinically concerning</span></span>
  <span class="co-escala__umbral" style="--x:32.7%"><span>19.4 µm</span></span>
  <span class="co-escala__umbral" style="--x:72.2%"><span>55 µm</span></span>
  <span class="co-escala__rango" style="--desde:63.8%;--hasta:86.2%"></span>
  <span class="co-escala__antes" style="--x:64.4%"></span>
  <span class="co-escala__hoy" style="--x:75%"></span>
</div>
```

- Las posiciones se dan en porcentaje del dominio con `--x`, `--desde` y `--hasta`. **Los dos ojos comparten el mismo dominio**, así se comparan de un vistazo.
- El eje es la línea, y cambia de color en cada umbral: blanco, azul, amarillo. Debajo de cada tramo, su forma y su nombre. Sin franjas de fondo.
- Los umbrales (19,4 y 55 µm) son líneas de trazos con su valor arriba. Son de la NASA.
- Hoy es el disco blanco grande, con su rango como barra. Los controles anteriores son discos huecos chicos: lo histórico se distingue de lo actual, como pide la norma.
- El `aria-label` dice lo mismo en una oración, con todos los números.
- En la aplicación la escala sigue siendo el dibujo que ya calcula `ChangeScale` (`<svg role="img" aria-label="…">`): se le aplican estos trazos y estas variables. La muestra está armada con cajas para abrirse sola.
- Si el valor se sale del dominio, el dominio crece; el punto nunca se recorta contra el borde.

Los valores de los ejemplos son datos simulados: tripulante ficticio C, día de vuelo 118.
