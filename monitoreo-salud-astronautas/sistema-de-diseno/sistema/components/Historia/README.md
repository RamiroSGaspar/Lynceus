# Gráfico de historia

La evolución de los dos ojos a lo largo del vuelo: puntos de luz unidos por líneas, contra los dos umbrales.

```html
<svg class="co-grafico" viewBox="0 0 800 400" role="img" aria-label="…">
  <line class="co-grafico__umbral co-grafico__umbral--caution" … />
  <polyline class="co-grafico__serie co-grafico__serie--od" points="…"/>
  <circle class="co-grafico__marca--od" … />
  <polyline class="co-grafico__serie co-grafico__serie--os" points="…"/>
  <rect class="co-grafico__marca--os" … transform="rotate(45 …)"/>
</svg>
<ul class="co-leyenda">…</ul>
```

- Fondo negro, sin grilla. Las únicas líneas horizontales son el cero y los dos umbrales, cada uno en el color de su nivel, con una bruma que sube desde la línea y se pierde: la zona empieza ahí.
- **Los ojos se distinguen por forma, no por color:** derecho, línea continua y disco lleno; izquierdo, línea de trazos y rombo hueco.
- A la derecha de cada zona, su forma, su nombre y su límite en texto. Nada depende sólo del color.
- Cada punto lleva su barra de rango. El control de hoy es más grande y tiene una línea vertical con la marca «Today» y su triángulo, como en la línea de la misión.
- Lo que falta (la próxima tomografía) se marca sobre el eje con el anillo de trazos.
- Título arriba, rótulo y unidad en cada eje, leyenda debajo: lo que pide la norma para gráficos.
- Va sobre un velo o un halo, nunca sobre las estrellas, con su tabla equivalente debajo y un texto alternativo que cuenta la historia en una oración.
- Las dos casillas de «Eyes shown» (`type="checkbox"`) se conservan, arriba del gráfico, con el dibujo de cada serie al lado del nombre del ojo. La muestra no las dibuja.
- El gráfico es propio, sin librería, como el actual: cambian sus clases y sus variables, no su cálculo. En la aplicación el dibujo se calcula con el ancho de su caja, como hoy; esta muestra es un SVG fijo y en pantalla angosta se desplaza de lado (`co-desliza`).

Los valores de los ejemplos son datos simulados: tripulante ficticio C, día de vuelo 118.
