# Navegación y acción

Un disco con su ícono y una palabra en mayúsculas. Así se navega, abajo y al centro, y así se abre algo.

```html
<nav class="co-nav co-nav--fija co-halo" aria-label="Sections">
  <a class="co-accion" href="…"><span class="co-accion__icono">…</span>Control</a>
  <a class="co-accion" href="…" aria-current="page"><span class="co-accion__icono">…</span>Result</a>
  <a class="co-accion" href="…"><span class="co-accion__icono">…</span>History</a>
  <a class="co-accion" href="…"><span class="co-accion__icono">…</span>Report</a>
  <span class="co-nav__separador" aria-hidden="true"></span>
  <button type="button" class="co-accion"><span class="co-accion__icono">…</span>Ask</button>
</nav>
```

| Estado | Clase | Cómo se ve y cuándo va |
|---|---|---|
| Destino | `co-accion` | Disco con borde fino, palabra en gris claro |
| Donde estoy | `aria-current="page"` | Disco lleno, blanco, con el ícono en negro; palabra en blanco y negrita |
| Acción principal | `co-accion--principal` | Igual que «donde estoy»: disco lleno |
| Chica | `co-accion--sm` | Disco de 36 px, dentro de un velo |

- Son enlaces a las rutas que ya existen: no cambia ninguna ruta. Cuatro destinos del tripulante activo y, separado, el asistente.
- Fija abajo, al centro, sobre un halo. Aparece cuando hay un tripulante elegido: en Inicio no hay navegación.
- El disco mide 44 px: es lo que se toca.
- Entre los dos velos no siempre entra a lo ancho: por debajo de 1400 px la palabra va debajo del disco. En teléfono ocupa el ancho de la pantalla, sobre negro liso.
- Durante una prueba de visión se oculta: nada flota sobre el estímulo.
- La misma pieza, suelta, es la acción secundaria de cualquier pantalla: abrir el visor, bajar un archivo. La acción que hace avanzar va como Botón.

Los valores de los ejemplos son datos simulados: tripulante ficticio C, día de vuelo 118.
