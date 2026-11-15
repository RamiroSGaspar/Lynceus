# Captura

El momento en que el instrumento toma los 48 cortes. Lo que se mueve es el dato: cada corte que llega se enciende como una línea sobre el ojo, en el lugar donde se tomó.

```html
<figure class="co-ocular">
  <div class="co-ocular__campo">
    <div class="co-ocular__lente">
      <img class="co-ocular__imagen" src="…" alt="…">
      <svg class="co-ocular__marcas" viewBox="0 0 100 100" aria-hidden="true">
        <line class="co-radio is-tomado" … />   <!-- corte ya tomado -->
        <line class="co-radio is-actual" … />   <!-- el que se está tomando -->
        <line class="co-radio" … />             <!-- lo que falta -->
      </svg>
    </div>
  </div>
  <figcaption class="co-ocular__pie co-halo" role="status">lectura: 31 of 48</figcaption>
</figure>
```

| Estado | Clase | Cómo se ve y cuándo va |
|---|---|---|
| Corte que falta | `co-radio` | Línea apenas visible: el patrón completo se ve desde el principio |
| Corte tomado | `co-radio is-tomado` | Línea blanca |
| Corte que no sirve | `co-radio is-malo` | Línea de trazos, más apagada |
| El que se está tomando | `co-radio is-actual` | Línea gruesa |

- **No hay una animación de adorno.** El patrón de la NASA son 48 cortes radiales; cada uno se enciende cuando llega. El avance se ve y es verdad.
- Debajo, la lectura con el número de cortes y el intento (`role="status"`).
- Sin anillo de nivel ni guía: todavía no hay resultado. No se adelanta el nivel antes de tener los dos ojos.
- Sin parpadeo: una línea aparece y queda.
- Para la evaluación, que no tiene imagen propia, se usa la marca en `is-barriendo`: es el único lugar donde algo se mueve sin ser un dato.
- Con «reducir movimiento» activado, la marca queda quieta y el avance se lee en el texto.

Los valores de los ejemplos son datos simulados: tripulante ficticio C, día de vuelo 118.
