# Color

Negro puro y blanco puro. El color aparece sólo donde significa algo: los niveles de aviso de la norma de la NASA. Sobre negro, un aviso no se puede pasar por alto.

```html
color: var(--color-text);
background: var(--color-bg);
```

- Los nombres que ya existían en `apps/web/src/styles/tokens.css` se conservan; cambian los valores y se suman los de velo, líneas, resplandor y marcas.
- `color-bg` y `color-surface` son el mismo negro: **los límites se dibujan con líneas, no con grises**. El único gris de fondo es `color-surface-raised`, para lo que está bajo el puntero.
- Texto de lectura: 10:1 o más. Ningún texto baja de 6:1. Las relaciones medidas de cada par están en `tokens.json`, en `contrast`.
- **Azul, amarillo y rojo son de los niveles** y de nada más. Un enlace o un botón nunca es azul.
- **Sin verde.** La norma lo reserva a luces indicadoras; «sin cambio» va en blanco, sin tono. **Sin cian:** la norma lo reserva a dato faltante o viejo. Por eso las cifras son blancas y no turquesa como en la referencia.
- Lo interactivo se marca con forma: relleno blanco (lo elegido, el botón principal), borde fino (lo demás), subrayado (un enlace en un texto).
- Las franjas `level-*-bg` son casi negras: en un gráfico, la zona se dice con la línea del umbral, su nombre y su forma.
- En papel los mismos nombres pasan a tinta oscura sobre blanco (`@media print` de `tokens.css`).

Los valores de los ejemplos son datos simulados: tripulante ficticio C, día de vuelo 118.
