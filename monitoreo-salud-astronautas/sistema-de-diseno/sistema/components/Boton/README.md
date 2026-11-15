# Botón, ficha y segmento

Lo que se toca y lo que rotula. Rectángulos de borde fino, en mayúsculas espaciadas. Se distinguen por forma y relleno, nunca por un tono.

```html
<button type="button" class="co-boton co-boton--principal co-boton--lg">Start today’s control</button>
<a class="co-boton" href="…">History</a>
<span class="co-ficha">FD118</span>
<div class="co-segmento" role="group" aria-label="Eye"><button aria-pressed="true">Right eye</button>…</div>
```

| Estado | Clase | Cómo se ve y cuándo va |
|---|---|---|
| Principal | `co-boton--principal` | Relleno blanco, texto negro. Uno por vista: el paso siguiente |
| Secundario | (ninguna) | Borde fino, sin relleno |
| Deshabilitado | `disabled` | Borde de trazos y texto apagado |
| Ficha | `co-ficha` | No se toca: rotula. Día de vuelo, sigla del ojo |
| Ficha de datos simulados | `co-ficha--simulado` | Borde de trazos |
| Segmento | `co-segmento` | Elegir entre dos o tres: idioma, ojo. Lo elegido, en blanco y subrayado |

- Alto mínimo de 44 px (`target-min`) en todo lo que se toca; 52 px en `--lg`. Una ficha mide 26 px: no se toca.
- El botón secundario tiene fondo negro, no transparente: sobre el campo abierto tapa las estrellas que tendría detrás del texto.
- Radio de 2 px. No hay píldoras.
- Un enlace dentro de un texto va subrayado, en blanco.
- El foco es un anillo blanco de 2 px, separado 3 px. No se quita nunca.
- El texto dice lo que pasa al tocar: «Start today’s control», no «OK».
- En pantalla angosta el texto de un botón pasa a dos líneas; nunca se corta ni ensancha la página.

Los valores de los ejemplos son datos simulados: tripulante ficticio C, día de vuelo 118.
