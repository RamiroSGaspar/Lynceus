# Certeza y medidor

Qué tan seguro es el resultado: la probabilidad de haber pasado un umbral, con su palabra, y la calidad de la captura contra su límite.

```html
<div class="co-certeza">
  <p class="co-certeza__palabra">Likely <small>69 %</small></p>
  <ul class="co-certeza__tramos" aria-hidden="true"><li></li><li></li><li class="is-activo"></li><li></li></ul>
  <p class="co-rotulo">… that the real change is at or above 55 µm</p>
</div>

<div class="co-medidor" role="img" aria-label="…" style="--valor:57%;--limite:37.5%">
  <span class="co-medidor__valor"></span><span class="co-medidor__limite"></span>
</div>

<div class="co-barras" role="img" aria-label="…" style="--limite:37.5%"><i style="--v:62%"></i>…</div>
```

- Cuatro tramos con el ancho de su intervalo: menos de 10 %, 10 a 50, 50 a 90 y más de 90. Se llena sólo el tramo donde cae la probabilidad.
- **La palabra va pegada al número:** «Likely 69 %». Las cuatro palabras son las de la aplicación: unlikely, possible, likely, very likely.
- Debajo, a qué se refiere: «that the real change is at or above 55 µm». Lleva el signo de estimado.
- Mientras el modelo de error sea provisorio, se dice junto a la certeza, en la nota de fuente del grupo.
- El medidor muestra un valor contra un límite: la línea de trazos es el límite (15 dB) y el relleno es el valor. Las barras, lo mismo corte por corte; lo que falta tomar es una marca baja y gris.
- Sin colores: bajo el límite, lo dice un Aviso.

Los valores de los ejemplos son datos simulados: tripulante ficticio C, día de vuelo 118.
