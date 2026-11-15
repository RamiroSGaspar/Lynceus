# Tabla

El detalle completo, para quien lo busca: todas las medidas de hoy contra las de antes del vuelo.

```html
<div class="co-desliza">
  <table class="co-tabla">
    <caption>Vision tests and symptoms of this control and of the pre-flight exam</caption>
    <thead><tr><th scope="col">Test</th><th scope="col" class="es-cifra">This control</th>…</tr></thead>
    <tbody><tr><th scope="row">Near visual acuity, right eye</th><td class="es-cifra">0.19 logMAR …</td>…</tr></tbody>
  </table>
</div>
```

- Sólo líneas horizontales finas. Sin fondo alternado, sin bordes verticales; la fila bajo el puntero sube un escalón de gris.
- Las cifras, a la derecha (`es-cifra`), con ancho fijo: las columnas alinean por el separador decimal.
- Cada cifra con su unidad y su signo de origen; la leyenda de los signos, al pie de la tabla.
- La tabla nunca es la primera vista de un resultado: va más abajo, sobre un velo.
- Va siempre dentro de `co-desliza`: por debajo de su ancho mínimo (`--_minimo`, 40 rem; más en una tabla de muchas columnas) se desplaza dentro de su caja, nunca la página, y nunca aplasta la primera columna.
- Cuando cada fila es un control, su nombre y su nivel van juntos en la primera celda (`co-tabla__control`).

Los valores de los ejemplos son datos simulados: tripulante ficticio C, día de vuelo 118.
