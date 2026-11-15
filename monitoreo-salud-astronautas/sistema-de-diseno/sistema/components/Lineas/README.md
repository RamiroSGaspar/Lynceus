# Líneas y marco

Acá no hay cajas: hay líneas de un píxel. Cada una dice una cosa distinta.

```html
<p class="co-lectura__rotulo">…</p>       <!-- la línea de una lectura -->
<hr class="co-regla">                     <!-- separador que se pierde en los extremos -->
<div class="co-marco">…</div>             <!-- cuatro esquinas: en foco -->
<span class="co-ficha co-ficha--simulado">…</span>   <!-- trazos: simulado, provisorio, ausente -->
```

| Estado | Clase | Cómo se ve y cuándo va |
|---|---|---|
| Línea de lectura | `color-border-strong`, continua | Debajo de cada cifra y arriba de su rótulo. Es el motivo que más se repite |
| Borde de control | `color-border-strong`, continua | Fichas, botones, discos de acción, opciones |
| Separador | `co-regla` / `line-fade-h` | Entre secciones. Se pierde en los extremos |
| Canto de velo | `line-fade-v` | El borde interior de un velo lateral |
| Marco | `co-marco` | Cuatro esquinas alrededor de lo que está en foco: el ojo elegido, la imagen del corte |
| Trazos | `dashed` | Lo simulado, lo que no se pudo medir, la regla propia, lo deshabilitado |

- Las líneas de la interfaz miden un píxel. Las que llevan un dato miden más: 1,5 px el anillo del nivel y las series del gráfico, 2 px el eje de la escala de cambio y el borde de un aviso.
- **Continua es lo que es; de trazos es lo que no es firme**: datos simulados, un ojo sin medir, una regla que es nuestra y no de la NASA, un botón deshabilitado, un control que todavía no se hizo.
- El marco no es un adorno: aparece sólo donde hay foco o selección. Nunca dos marcos en la misma vista, salvo el de la imagen del corte.
- Radio de 2 a 4 px en lo rectangular; círculo perfecto en lo que es un disco. Nada intermedio: no hay píldoras.
- Sin sombras. Lo único que brilla es el disco del ojo y el anillo de su nivel.

Los valores de los ejemplos son datos simulados: tripulante ficticio C, día de vuelo 118.
