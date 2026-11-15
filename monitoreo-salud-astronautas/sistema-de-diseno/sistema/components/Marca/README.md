# Marca

El isotipo son líneas de barrido que dibujan un ojo: las mismas líneas con las que el tomógrafo recorre la retina. Blanco puro sobre negro puro, como en la imagen original. El nombre se compone en tipografía al lado; nunca va dentro de la imagen.

```html
<a class="co-marca" href="/">
  <span class="co-marca__iso"><!-- el SVG de assets/marca/isotipo-mini.svg, en línea --></span>
  <span class="co-marca__nombre">{PRODUCT.name}</span>
</a>
```

| Estado | Clase | Cómo se ve y cuándo va |
|---|---|---|
| Quieta | (ninguna) | En la franja superior y en el informe |
| Trazo | `is-trazando` | Las líneas se dibujan de arriba abajo una sola vez y aparece la pupila. Sólo en Inicio, al abrir |
| Barrido | `is-barriendo` | Una franja de luz baja por las líneas, sin fin. Es la única señal de «estoy trabajando»: evaluación, carga, asistente pensando |

- Tres archivos en `assets/marca/`: `isotipo.svg` (13 líneas, desde 80 px de ancho), `isotipo-mini.svg` (7 líneas, hasta 48 px: el de la franja superior) y `favicon.svg`.
- El isotipo toma `currentColor`: blanco sobre el campo, negro en el informe impreso. Nunca en color de nivel.
- El nombre va en `font-sans` 600, en mayúsculas, con `tracking-brand`; en la portada, más grande, en peso 400 y más abierto. Sale de `packages/core/src/product.ts`: no se escribe en ningún otro archivo de la aplicación.
- Aire mínimo alrededor: el alto de dos líneas del isotipo.
- No se inclina, no se le cambia el número de líneas, no se le pone sombra ni degradado.
- Es un redibujo geométrico de la imagen de referencia, no un calco.

Los valores de los ejemplos son datos simulados: tripulante ficticio C, día de vuelo 118.
