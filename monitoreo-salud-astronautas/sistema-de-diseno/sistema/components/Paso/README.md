# Próximo paso

Qué corresponde hacer, de a un paso, con en qué se apoya cada uno y el porqué a un toque.

```html
<ol class="co-pasos">
  <li class="co-paso">
    <p class="co-paso__texto">Repeat the scan of both eyes on flight day 139 (in 21 days).</p>
    <p class="co-base co-base--assumption">This tool’s own rule, not NASA’s</p>
    <details class="co-paso__porque"><summary>Why</summary><p>…</p></details>
  </li>
</ol>
```

- El texto del paso y su porqué salen de `packages/core`, sin cambios. Cambia cuándo se ve el porqué: cerrado por defecto.
- Cada paso dice en qué se apoya: cuadro lleno, práctica de la NASA; cuadro de trazos, regla propia de esta herramienta.
- En el velo de la respuesta van los dos primeros pasos, sin el porqué; la lista completa, más abajo.
- Nunca un paso indica medicación.

Los valores de los ejemplos son datos simulados: tripulante ficticio C, día de vuelo 118.
