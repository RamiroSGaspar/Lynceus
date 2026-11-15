# Lectura

La unidad mínima de la interfaz, como en un instrumento: una cifra con su unidad, una línea, y debajo qué es y cómo se obtuvo. Reemplaza a la oración que decía lo mismo.

```html
<div class="co-lectura co-lectura--heroe">
  <p class="co-lectura__valor">+58 <span class="co-lectura__unidad">µm</span></p>
  <p class="co-lectura__sub">range 47 to 68 µm</p>
  <p class="co-lectura__rotulo">
    <svg class="co-origen" aria-hidden="true"><use href="#o-derived"/></svg><span class="co-oculto">Calculated</span>
    <span>Change since before the flight</span>
  </p>
</div>
```

| Estado | Clase | Cómo se ve y cuándo va |
|---|---|---|
| Héroe | `co-lectura--heroe` | 72 px, trazo fino, centrada. Una por ojo y nada más en la pantalla |
| Grande | `co-lectura--lg` | 48 px. La cifra principal de un velo |
| Normal | (ninguna) | 28 px. Las lecturas de un grupo |
| Chica | `co-lectura--sm` | 22 px. Lecturas de apoyo |
| En palabras | `co-lectura--palabras` | Cuando el valor no es un número: lo que la persona informó, o la razón por la que no hay cifra. Nunca un cero, un guion suelto ni un espacio vacío |

- Orden fijo de arriba abajo: cifra y unidad, segunda línea (rango o referencia), **línea**, rótulo con su signo de origen.
- Sin caja y sin fondo: la lectura se apoya en el negro. Las lecturas de un grupo se alinean por la línea.
- **La cifra se muestra con la precisión que sostiene su rango.** Un cambio con rango de ±10 µm va en micrómetros enteros: «+58», no «+57,5».
- El signo va siempre en un cambio: «+58», «−4». Sin signo es un valor absoluto.
- El rango va en palabras («range 47 to 68 µm»), no con ±: en la investigación sobre cómo comunicar resultados se entendió mejor.
- Toda lectura lleva su signo de origen. Entre lecturas de un grupo, `space-4`; no más de cuatro por grupo.
- Varias lecturas lado a lado van dentro de `co-lecturas`: comparten renglones, así sus líneas quedan a la misma altura aunque una tenga segunda línea y otra no.
- El rótulo dice qué es en dos a cinco palabras, sin verbo.

Los valores de los ejemplos son datos simulados: tripulante ficticio C, día de vuelo 118.
