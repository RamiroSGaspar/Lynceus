# Línea de la misión

Los 180 días de la misión en una línea, de antes del vuelo al regreso, con cada control en su día y su nivel. Sirve para ubicarse y para viajar: tocar un control lo abre.

```html
<div class="co-desliza">
<nav class="co-mision" aria-label="Mission timeline">
  <ol class="co-mision__linea">
    <li style="--x:0%"><a class="co-mision__control" href="…" aria-label="Pre-flight exam">
      <span class="co-mision__marca">Pre-flight</span>
      <svg class="co-mision__punto co-mision__punto--none" aria-hidden="true"><use href="#l-none"/></svg>
    </a></li>
    <li style="--x:65.6%" aria-current="step"><a class="co-mision__control" href="…" aria-label="Flight day 118, today: Clinically concerning">
      <span class="co-mision__marca">today</span>
      <svg class="co-mision__punto co-mision__punto--caution" aria-hidden="true"><use href="#l-caution"/></svg>
      <span class="co-mision__dia">FD118</span>
    </a></li>
  </ol>
</nav>
</div>
```

| Estado | Clase | Cómo se ve y cuándo va |
|---|---|---|
| Control hecho | `co-mision__punto--{nivel}` | La forma y el color de su nivel, sobre la línea |
| Control que falta | `co-mision__punto--unmeasured` | Anillo de trazos gris |
| El que se mira | `aria-current="step"` | Más grande, rótulo en blanco y negrita, y la marca «Today» con su triángulo arriba |
| Día para elegir | `co-mision__punto--dia` | Disco hueco; el elegido, lleno. En Inicio, donde todavía no hay un nivel |
| Extremo | `co-mision__punto--tope` | Una marca corta: el regreso |
| Pegado a su vecino | `is-apretado` | Sin el día a la vista; aparece al enfocar |

- `--x` es el día sobre 180, en porcentaje.
- **Arriba de la línea, las marcas con triángulo: antes del vuelo, hoy, regreso.** Abajo, el día de cada control. Como una línea de tiempo de control de misión.
- Cada control lleva en `aria-label` su día y su nivel («Flight day 118, today: Clinically concerning»): la forma sola no alcanza, y el rótulo visible es una sigla.
- En Inicio la misma línea es el selector del día de misión, y **sigue siendo un grupo de opciones**: cada día de rutina (30, 90 y 150) es un `<label>` con su `<input type="radio" name="mission-day">`, oculto a la vista y con el foco dibujado sobre el punto; antes del vuelo y regreso son marcas, no opciones. La muestra lo dibuja con enlaces.
- Flota sobre el campo con un halo.
- **Dos controles muy juntos no pueden llevar los dos su rótulo** (en la historia real hay controles a 11 días de distancia). Cuando la separación es menor que el ancho de un rótulo, el día queda a la vista sólo en el control que se mira o, si ninguno lo es, en el más reciente; el otro lleva `is-apretado`: su día aparece al enfocarlo o al pasar el puntero, y siempre está en su `aria-label`. La segunda línea de la muestra es ese caso: el control del día 139, a 11 días del de hoy.
- Va dentro de `co-desliza`: por debajo de su ancho mínimo (`--_minimo`, 34 rem) no se achica, se desplaza de lado, con el control actual a la vista.

Los valores de los ejemplos son datos simulados: tripulante ficticio C, día de vuelo 118.
