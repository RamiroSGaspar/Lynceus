# Campo y velo

El fondo de toda pantalla es un cielo: negro puro con estrellas. Y la regla que lo vuelve usable: donde se lee, el campo se apaga.

```html
<body class="co co-campo">                         <!-- el cielo -->
  <aside class="co-velo co-velo--izq">…</aside>     <!-- velo lateral: de arriba abajo, con su canto -->
  <div class="co-halo">…</div>                      <!-- halo: un grupo suelto sobre el campo -->
</body>
```

| Estado | Clase | Cómo se ve y cuándo va |
|---|---|---|
| Campo | `co-campo` | En el `body`. Dos teselas SVG de tamaños distintos (1200 y 1700 px) que no se mueven al desplazar |
| Velo lateral | `co-velo co-velo--izq` / `--der` | Negro al 88 % más desenfoque, con una línea que se pierde en los extremos. De arriba abajo, pegado al borde de la pantalla |
| Halo | `co-halo` | El mismo negro con borde difuso, detrás de un grupo que flota: navegación, línea de la misión, cabeza y pie del ocular |
| Apagado | (sin `co-campo`) | Negro liso. En las pruebas de visión y al imprimir |

- **Ningún texto se lee directamente sobre las estrellas.** Todo texto va sobre un velo o un halo, incluidas las cifras héroe y el nombre de la portada; un botón lleva su propio fondo negro. Lo único que se apoya en el campo abierto es la imagen del ojo y el isotipo.
- **Garantía medida:** con una estrella blanca justo detrás, el texto blanco queda en 16,4:1, el secundario en 9,9:1 y el rojo de advertencia, que es el peor caso, en 6,2:1. Nunca menos de 6:1.
- El campo es **decorativo y se dice**: los archivos de `assets/campo/` lo declaran en su primera línea. No representa un cielo real ni un dato.
- Está generado con semilla: el mismo cielo, siempre. Las estrellas son sólo blancas, de 1 a 2,6 px; unas pocas llevan un halo tenue. Sin colores, sin destellos, sin movimiento.
- Las estrellas nunca quedan detrás de un gráfico: un punto de datos no se puede confundir con una estrella. Los puntos de datos miden 9 px o más y tienen forma.
- No hay tarjetas. Un velo no tiene borde, ni radio, ni sombra: tiene un canto de un píxel.
- Sin desenfoque (`backdrop-filter`), el velo funciona igual: el negro al 88 % alcanza para la garantía. El halo usa negro al 94 %; la franja superior y la navegación, negro pleno.

Los valores de los ejemplos son datos simulados: tripulante ficticio C, día de vuelo 118.
