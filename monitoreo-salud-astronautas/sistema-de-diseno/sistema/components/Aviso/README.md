# Aviso

Algo que hay que saber antes de seguir leyendo: una condición del resultado, un límite, o que hoy no se pudo medir. Una línea a la izquierda, una forma y una oración.

```html
<div class="co-aviso co-aviso--sin-medida" role="status">
  <svg class="co-aviso__forma" aria-hidden="true"><use href="#l-unmeasured"/></svg>
  <p class="co-aviso__titulo">I cannot measure this eye today.</p>
  <p class="co-aviso__texto">Too few usable scans after 3 attempts. It is written in the report.</p>
</div>
```

- Los colores de aviso se usan sólo cuando el aviso **es** de esa clase. Una nota o un límite va en el neutro, con el ícono de información.
- «No puedo medir» tiene su variante: línea gris de trazos y el anillo de trazos. Dice la razón y qué pasa después.
- Sin caja ni fondo. Un título de una línea y, si hace falta, una oración.
- No más de dos avisos seguidos. Si hay tres, el contenido está mal ordenado.

Los valores de los ejemplos son datos simulados: tripulante ficticio C, día de vuelo 118.
