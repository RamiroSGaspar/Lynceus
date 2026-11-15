# Nivel

El nivel del resultado, dicho tres veces a la vez: color, forma y palabra. Sin caja: sobre negro, la forma de color se sostiene sola. Es lo primero que se lee.

```html
<span class="co-nivel co-nivel--caution co-nivel--lg">
  <svg class="co-nivel__forma" aria-hidden="true"><use href="#l-caution"/></svg>
  <span class="co-nivel__clase">Caution</span>
  <span class="co-nivel__nombre">Clinically concerning</span>
</span>
```

| Estado | Clase | Cómo se ve y cuándo va |
|---|---|---|
| Sin cambio detectable | `co-nivel--none` | Anillo, blanco, sin clase de aviso |
| Primer indicio | `co-nivel--advisory` | Círculo con «i», azul, «Advisory» |
| Clínicamente preocupante | `co-nivel--caution` | Triángulo, amarillo, «Caution» |
| Síntoma agudo de visión | `co-nivel--warning` | Octágono, rojo, «Warning» |
| No se pudo medir | `co-nivel--unmeasured` | Anillo de trazos, gris; el nombre también en gris |

- Los cuatro niveles, sus umbrales y sus colores son de la NASA; las formas son las que la aplicación ya dibuja.
- La clase de aviso va en mayúsculas espaciadas y en el color del nivel; el nombre del nivel, en blanco. «Sin cambio» y «no se pudo medir» no tienen clase.
- `co-nivel--lg` va una vez por pantalla: en la respuesta. La forma y la clase arriba, el nombre debajo en 28 px.
- `co-nivel--forma` (sólo la forma) va donde la palabra está al lado o en un `aria-label`: línea de la misión, gráfico.
- **Nunca parpadea.** La norma reserva el parpadeo a la emergencia, y este producto no tiene esa clase.
- «Sin cambio detectable» no es verde ni lleva tilde: no es una buena noticia garantizada, es lo que el instrumento alcanza a ver.

Los valores de los ejemplos son datos simulados: tripulante ficticio C, día de vuelo 118.
