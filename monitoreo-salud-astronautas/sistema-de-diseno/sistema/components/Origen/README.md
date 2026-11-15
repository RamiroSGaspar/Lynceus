# Origen

Cómo se obtuvo cada valor, dicho con una forma en vez de con un color y una palabra repetida al lado de cada número.

```html
<svg class="co-origen" aria-hidden="true"><use href="#o-measured"/></svg><span class="co-oculto">Measured</span>
```

| Estado | Clase | Cómo se ve y cuándo va |
|---|---|---|
| ● | `o-measured` | Medido: lo calculó el motor a partir de la imagen de hoy |
| ◐ | `o-derived` | Calculado: una cuenta sobre valores medidos, como el cambio desde antes del vuelo |
| ◌ | `o-estimated` | Estimado: una probabilidad o un error esperado |
| ○ | `o-self-reported` | Informado por la persona: una respuesta o una prueba |
| ◇ | `o-reference` | Referencia: un valor publicado, como un umbral de la NASA |
| — | `o-not-measurable` | No se puede medir a bordo |

- Más relleno, más directo: lleno es medido, medio es calculado, punteado es estimado, hueco es lo que dijo la persona.
- El signo va antes del rótulo de la lectura, no junto a la cifra.
- El signo va `aria-hidden` y lleva al lado el nombre del origen como texto oculto (`co-oculto`): lo lee un lector de pantalla, y lo siguen encontrando las pruebas de pantalla, que buscan «476 µm Measured». Al pasar el puntero, la explicación completa (`origin.*.help`).
- En una leyenda, donde la palabra ya está escrita al lado, el signo va solo.
- **La leyenda con los seis signos está siempre a la vista** en la pantalla que los usa: al pie.
- Sin color: el signo toma `origin-measured`, un gris claro. Los demás tokens `origin-*` se conservan porque la aplicación ya los nombra, y también son grises.

Los valores de los ejemplos son datos simulados: tripulante ficticio C, día de vuelo 118.
