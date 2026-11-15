# Tipografía

Una sola familia, Atkinson Hyperlegible Next: la diseñó el Braille Institute para personas con baja visión. Las cifras grandes van en trazo fino; lo chico, en mayúsculas espaciadas o en peso medio.

```html
<h1 class="co-titulo">…</h1>
<h2 class="co-subtitulo">…</h2>
<p class="co-texto">…</p>
<p class="co-nota">…</p>
<p class="co-rotulo">…</p>
<p class="co-micro">…</p>
```

- **Peso fino (300) sólo de 28 px para arriba**: cifras y títulos. Blanco sobre negro, el trazo fino se ve nítido y deja de encandilar. De 22 px para abajo, 400 o más.
- Texto de lectura de 18 px o más. El piso es 14 px (`text-xs`): rótulos, unidades, ejes y mayúsculas espaciadas.
- **Mayúsculas espaciadas (`co-micro`) para lo que nombra, no para lo que se lee**: navegación, botones, fichas, marcas de la línea de la misión, cabeza de sección. Nunca una oración.
- Toda cifra va con `font-variant-numeric: tabular-nums` (lo pone `.co`): las columnas alinean y un número que cambia no baila.
- La unidad va pegada a su número, más chica y en `color-text-secondary`. Cero antes del separador decimal.
- El cero lleva barra y la I, la l y el 1 no se confunden: es la razón de esta letra.
- Un párrafo no pasa de `reading-width` (62 caracteres).
- Los dos archivos de `fonts/` (latín y latín extendido, peso variable 200 a 800) se sirven desde el propio sitio: la política de seguridad no admite fuentes de terceros.

Los valores de los ejemplos son datos simulados: tripulante ficticio C, día de vuelo 118.
