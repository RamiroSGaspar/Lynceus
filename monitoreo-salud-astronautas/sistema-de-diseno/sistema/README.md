# Lynceus · Campo oscuro

**v2.0 · 15/11/2026 · identidad y sistema de diseño de Lynceus, para el NASA Space Apps Challenge 2026.** Negro puro, blanco puro y un campo de estrellas; los datos como lecturas de instrumento, sobre líneas finas. Reemplaza los colores y las piezas genéricas con que se construyó la aplicación; no cambia lo que la aplicación calcula ni lo que dice. Reemplaza también a la v1 («Ocular»), que se descartó por gris y por genérica.

## La idea: campo oscuro

En microscopía, el **campo oscuro** es la técnica que deja el fondo en negro y hace brillar sólo lo que se quiere mirar. Es también lo que ve un astronauta por la ventana, y lo que se ve al apoyar la cara en un tomógrafo: negro, y al fondo un disco de luz.

Lynceus se ve así. El fondo es negro de verdad, con estrellas. Lo único que brilla es el dato: la imagen del ojo como un disco en el centro, con lo que el motor midió dibujado encima; cifras blancas, grandes y finas, apoyadas en una línea; y un color sólo cuando el resultado lo pide.

La referencia es el lenguaje de los visores de misión de la NASA: lecturas con su rótulo debajo de una línea, velos pegados al borde, controles circulares con la palabra en mayúsculas, una línea de tiempo con sus marcas. Acá no se copia: cada rasgo tiene una razón que sale de este producto.

## Seis principios

1. **Negro negro, claro claro.** El fondo es `#000000` y lo que se lee es `#ffffff`. No hay grises de relleno ni tarjetas: los límites se dibujan con líneas de un píxel.
2. **Donde se lee, el campo se apaga.** Las estrellas son el lugar, no el contenido. Todo texto va sobre un velo o un halo negro: nunca una estrella detrás de una letra sin apagar.
3. **El color es de los niveles.** Azul, amarillo y rojo significan aviso, precaución y advertencia, como en la norma de pantallas de la NASA, y no aparecen en ningún otro lado. Sobre negro, un aviso no se puede pasar por alto.
4. **El borde es de la interfaz; el centro, de la imagen.** Los velos van a los costados, la franja arriba, la navegación abajo. En el medio queda el ojo, sin nada encima.
5. **Una lectura, no una oración.** Cifra, unidad, línea, rótulo y origen. Lo que se puede mostrar no se escribe.
6. **Continuo es lo que es; de trazos, lo que no es firme.** Datos simulados, un ojo que no se pudo medir, una regla que es nuestra y no de la NASA, un control que todavía no se hizo: todo eso se dice con línea de trazos.

## Cómo se presenta un resultado

Los textos de la aplicación están probados y respaldan cada número; no se recortan. Se reparten en tres capas, según cuánto quiere saber quien mira.

| Capa | Dónde | Qué lleva | Con qué |
|---|---|---|---|
| 1. De un vistazo | El centro de la primera vista | El nivel de cada ojo, su cambio con el rango, la imagen, dónde estamos en la misión | Ocular, Nivel, Lectura héroe, Línea de la misión |
| 2. Al costado | Los dos velos de la primera vista | La respuesta en una oración, los dos primeros pasos, qué tan seguro, la calidad de la captura, el corte | Velo y grupo, Próximo paso, Escala, Certeza, Corte |
| 3. Para quien lo busca | Más abajo, sobre un velo de ancho completo | Todos los pasos con su porqué, las probabilidades, las pruebas de visión, el visor, todas las medidas, los límites | Tabla, Aviso, Lectura |

Cada oración de hoy tiene su lugar nuevo:

| Lo que hoy es una oración | Pasa a ser |
|---|---|
| «…is 58 µm thicker than before the flight (range 47 to 68)» | Lectura héroe bajo el ocular: `+58 µm`, `range 47 to 68 µm`, unida por una guía al lugar de la imagen donde se midió |
| «That is at or above NASA’s clinically concerning threshold of 55 µm» | La posición del disco en la Escala de cambio, y el Nivel |
| «It is likely (69 %) that the real change is at or above…» | Certeza: `Likely 69 %`, con sus cuatro tramos |
| «The scan indicates new folds…» | Un hallazgo bajo el nivel de ese ojo, y la fila de pliegues en la tabla de «How sure» |
| «Since your previous exam (flight day 90), it is 9 µm thicker» | Los discos huecos de la Escala y la Línea de la misión |
| La palabra «Measured» al lado de cada número | El signo de Origen delante del rótulo, con la leyenda al pie |

La oración completa sigue existiendo: es el `aria-label` de cada gráfico y está entera en la capa 3 y en el informe.

## Color

| Token | Valor | Para qué | Contraste sobre el campo |
|---|---|---|---|
| `color-bg` y `color-surface` | `#000000` | El campo y toda superficie: es el mismo negro | — |
| `color-surface-raised` | `#161616` | El único gris de fondo: lo que está bajo el puntero, la pista de un medidor | — |
| `color-border-strong` | `#a3a3a3` | Borde de controles y la línea de cada lectura | 8,3:1 |
| `color-border` | `#3a3a3a` | Línea que sólo separa | — |
| `color-text` | `#ffffff` | Texto, cifras, íconos | 21:1 |
| `color-text-secondary` | `#c6c9ce` | Rótulos, unidades, rangos, notas | 12,6:1 |
| `color-text-muted` | `#9fa3a9` | Ejes y pie de fuente | 8,2:1 |
| `color-accent` | `#ffffff` | Relleno de lo elegido y del botón principal | 21:1 |
| `level-none` | `#e8e8e8` | Sin cambio detectable | 17,1:1 |
| `level-advisory` | `#6cb6ff` | Aviso: primer indicio | 9,7:1 |
| `level-caution` | `#ffd84d` | Precaución: clínicamente preocupante | 15,1:1 |
| `level-warning` | `#ff756c` | Advertencia: síntoma agudo de visión | 8,0:1 |
| `level-unmeasured` | `#9fa3a9` | No se pudo medir | 8,2:1 |

- La lista completa, con el uso de cada variable y **todos los pares de contraste medidos**, está en `tokens.json`. Se cumple lo que la aplicación ya verifica en `guards.test.ts`: lectura en 10:1 o más, nada por debajo de 6:1.
- **Las cifras son blancas, no turquesa** como en la referencia: la norma reserva el cian para dato faltante o viejo, y el verde para luces indicadoras. «Sin cambio» tampoco es verde: la tabla de colores de pantallas no le asigna color a lo normal.
- **Cambia respecto de lo actual:** los enlaces dejan de ser celestes, porque se confundían con el azul de aviso; las etiquetas de origen dejan el verde, el ocre y el violeta y pasan a signos de forma; el ojo izquierdo deja el rosa y se distingue por trazo y marca; las franjas de color de los gráficos pasan a ser líneas.
- En papel, los mismos nombres pasan a tinta oscura sobre blanco.

## Campo y velo

- **El campo** (`co-campo`, en el `body`): dos teselas de estrellas, de 1200 y 1700 px, quietas al desplazar. Están generadas con semilla; son decorativas y lo dicen en su primera línea. Sólo puntos blancos de 1 a 2,6 px. Sin color, sin destellos, sin movimiento.
- **La franja superior** va sobre negro pleno que se disuelve hacia abajo: lo que se desplaza por debajo desaparece.
- **El velo** (`co-velo`): negro al 88 % más un desenfoque corto. De arriba abajo, pegado a un borde, con un canto de un píxel que se pierde en los extremos. Sin radio, sin sombra, sin borde.
- **El halo** (`co-halo`): negro al 94 %, con borde difuso, detrás de un grupo que flota suelto: la línea de la misión, la cabeza y el pie de un ocular, un título sobre el campo. El de la navegación es negro pleno: lo que se desplaza por debajo desaparece.
- **Un botón** lleva su propio fondo negro: sobre el campo abierto tampoco deja una estrella detrás de su texto.
- **Garantía medida:** con una estrella blanca justo detrás, el texto blanco queda en 16,4:1, el secundario en 9,9:1 y el rojo de advertencia, que es el peor caso, en 6,2:1.
- **Campo apagado:** en las pruebas de visión y al imprimir, negro liso. Un gráfico nunca tiene estrellas detrás: un punto de datos no se puede confundir con una estrella.

## Tipografía

Una familia: **Atkinson Hyperlegible Next**, del Braille Institute, hecha para leer con baja visión: el cero lleva barra, la I mayúscula y la l minúscula no se confunden. La visión de cerca es justamente lo que el vuelo deteriora.

| Voz | Clase | Tamaño y peso | Para qué |
|---|---|---|---|
| Lectura héroe | `co-lectura--heroe` | 72 px · 300 | El cambio de cada ojo. Una por ojo |
| Título | `co-titulo` | 36 px · 300 | Título de pantalla y de sección |
| Nivel grande, nombre | `co-nivel--lg`, `co-sujeto__nombre` | 28 px · 400 y 600 | La respuesta; de quién es |
| Subtítulo | `co-subtitulo` | 22 px · 400 | Preguntas, bajadas |
| Texto | `co-texto` | 18 px · 400 | Lectura, hasta 62 caracteres por línea |
| Nota | `co-nota` | 16 px · 400 | Apoyo y aclaraciones |
| Rótulo | `co-rotulo` | 14 px · 500 | Qué es cada lectura. El piso: nada más chico |
| Micro | `co-micro` | 14 px · 500 · mayúsculas espaciadas | Lo que nombra: navegación, botones, fichas, marcas |

Trazo fino sólo de 28 px para arriba: sobre negro se ve nítido y deja de encandilar. Mayúsculas espaciadas para lo que nombra, nunca para una oración. Cifras de ancho fijo en todos lados. Detalle en `components/Tipografia/README.md`.

## Líneas

No hay cajas. Hay líneas, y cada una dice algo: la de una lectura (debajo de la cifra), el borde de un control, el separador que se pierde en los extremos, el canto de un velo, las cuatro esquinas de lo que está en foco, y los trazos de lo que no es firme. Radio de 2 a 4 px en lo rectangular y círculo perfecto en lo que es un disco: no hay píldoras. No hay sombras: lo único que brilla es el disco del ojo y el anillo de su nivel. Detalle en `components/Lineas/README.md`.

## La imagen

- El **Ocular** muestra el fondo de ojo recortado en un disco, con la abertura del nervio, la franja de 0 a 250 µm en el color del nivel y los anillos. Alrededor, separada, la órbita del nivel. Una guía baja desde la franja hasta la cifra. Ojo derecho a la izquierda.
- El **Corte** muestra un corte de la tomografía con la superficie de la retina, la membrana de base y los puntos de la abertura, entre cuatro esquinas.
- La imagen no se retoca. Lo marcado va en blanco con contorno oscuro y se distingue por tipo de trazo, no por color: continuo, de trazos, de puntos. Cada trazo tiene su entrada en la leyenda.
- El disco deja fuera las esquinas de la imagen cuadrada, donde no se mide nada; la imagen completa está en el visor.
- Toda imagen lleva el sello de datos simulados adentro.
- Durante la **captura**, lo que se mueve es el dato: cada uno de los 48 cortes radiales se enciende sobre el ojo cuando llega.

## Composición: la cabina

**Densidad.** Relleno de un velo, 32 px; entre grupos, 32 px de aire, sin línea; entre lecturas de un grupo, 16 px; entre secciones, 64 px y un separador. Todo lo que se toca mide 44 px o más.

**El marco de toda pantalla** (`vistas/vistas.css`): la franja superior fija, sin barra; el contenido; y la navegación fija abajo cuando hay un tripulante elegido.

| Ancho | Qué pasa |
|---|---|
| 1280 px o más | Cabina: un velo a cada lado, de arriba abajo, y el campo al centro con los dos oculares y la línea de la misión. El centro queda fijo mientras los velos se desplazan. El ocular sigue el alto de la pantalla para que la primera vista entre completa; en pantallas bajas (menos de 850 px de alto) la leyenda de trazos queda sólo en el visor |
| 640 a 1279 px | Una columna, en orden de lectura: respuesta, los dos oculares lado a lado, línea de la misión, confianza |
| Menos de 640 px | Igual, con un ojo por vez y un selector; la línea de la misión se desplaza de lado; la navegación ocupa el ancho, sobre negro liso |

Por debajo de 1400 px de ancho, la navegación pone la palabra debajo de cada disco para entrar entre los dos velos.

## Anatomía por pantalla

Dibujadas completas en `vistas/`: Resultado, Inicio, Captura e Historia. Las demás, como receta.

**Inicio** (`inicio.html`). Sobre el campo abierto: la marca, que se traza una vez al abrir; el lema; la pregunta de la pantalla; y la Línea de la misión como selector del día. Debajo, sobre un velo: los cuatro tripulantes, cada uno una columna con una línea arriba, el estado de sus dos ojos (Par de ojos), su nivel y un solo botón principal; después «antes de empezar» y lo guardado en el navegador. Sin navegación.

**Sesión.** Velo izquierdo con el sujeto y los Pasos de la sesión; al centro, un solo paso por vez, con su título y un botón principal para seguir.

**Pruebas de visión** (síntomas, agudeza, Amsler). **Campo apagado**: negro liso, sin velos ni navegación. Las preguntas usan Opción. La superficie del estímulo no es de este sistema: la C de Landolt y la grilla conservan su fondo, su contraste y su tamaño calibrado. El sistema viste las instrucciones, el avance y los botones de respuesta, que van debajo o al costado, nunca encima.

**Captura** (`captura.html`). Al centro, el disco del ojo que se está tomando, con los 48 cortes encendiéndose, y debajo la lectura «31 of 48». A la izquierda, los pasos y el ojo ya hecho. A la derecha, el avance del análisis y la calidad de cada corte. No se adelanta el nivel: el resultado va después de los dos ojos. Si la captura no alcanza, un Aviso de trazos con la razón y el botón de repetir; si tres no alcanzan, «I cannot measure this eye today».

**Evaluación.** La marca en `is-barriendo`, grande, al centro, y debajo qué está haciendo el motor. Nada más.

**Resultado** (`resultado.html`). La cabina, y debajo, sobre un velo de ancho completo y en este orden: los pasos con su porqué; qué tan seguro, como tabla; pruebas de visión y síntomas; la tomografía y lo que se midió; medidas e intentos; lo que la herramienta no dice; y el botón para preparar la conferencia médica. Al pie, la leyenda de origen y el aviso completo de datos simulados.

**Historia** (`historia.html`). Velo izquierdo con el último control. Al centro, el Gráfico de historia sobre un halo. Debajo, la tabla de controles, el más reciente arriba, con el Par de ojos y el Nivel de cada uno y la acción que lo abre.

**Informe para el médico.** En pantalla: una columna de ancho de lectura sobre un velo, con lecturas y tablas. Impreso: tinta oscura sobre blanco, el isotipo en negro, sin campo, franja ni navegación, cada grupo sin partirse entre páginas, y el aviso completo de datos simulados al pie de cada página.

**Qué se sabe del cerebro.** Lectura larga sobre un velo, en tres columnas que bajan a una. Cada afirmación lleva su grado de certeza dicho con forma y palabra (los signos de Origen donde corresponda) y sus fuentes en Nota. Sin colores de nivel: acá nada es un aviso.

**Cómo funciona.** El recorrido del examen como una fila de pasos numerados (el dibujo de Próximo paso), con lo real y lo simulado en dos columnas; la de lo simulado, con línea de trazos. La validación va en Tablas.

**Asistente.** Un velo que entra desde la derecha (Hoja del asistente), abierto desde la navegación.

**No encontrado y errores.** La marca chica, quieta, una oración y un botón para volver.

## Movimiento

| Movimiento | Dónde | Cuánto |
|---|---|---|
| Trazo de la marca | Inicio, al abrir | Una vez: 13 líneas en cascada, 60 ms entre una y otra |
| Los cortes que llegan | Captura | Cada línea aparece cuando llega su corte, y queda |
| Barrido de la marca | Todo «estoy trabajando»: evaluación, carga, asistente | 2,4 s por pasada, mientras dure el trabajo real |
| Respuesta | Lo que la persona toca: un botón, un velo que entra, el cambio de ojo | 120 a 240 ms, con `ease-out`, sin rebote |

**Nada parpadea**: la norma reserva el parpadeo a la emergencia. Las estrellas no se mueven ni titilan. Las cifras no cuentan desde cero: un número de salud aparece ya escrito. Con «reducir movimiento», todo aparece completo y quieto.

## Marca e íconos

- **Isotipo:** líneas horizontales de extremos redondos que llenan un óvalo, con una abertura en forma de ojo y una pupila redonda. Blanco puro sobre negro puro, como en la imagen original. Tres archivos en `assets/marca/`. Reglas en `components/Marca/README.md`.
- **Nombre:** en tipografía, al lado del isotipo, en mayúsculas muy espaciadas. Sale de `product.ts`.
- **Íconos:** de línea, 24 px, trazo de 1,5 px en pantalla. 51 de Lucide y cuatro propios. Uno por grupo de lecturas o por acción, siempre con su palabra.
- **Formas de nivel y signos de origen:** no son íconos; son parte del dato. Están en `assets/iconos/` como `nivel-*.svg` y `origen-*.svg`.

## Escritura

- La respuesta primero y en una oración. Los textos salen de `packages/core` y de `apps/web/src/i18n`, en inglés y en español, sin cambios.
- Un rótulo dice qué es la lectura en dos a cinco palabras, sin verbo: «Mean quality», «Change since before the flight».
- Sin falsa precisión: micrómetros enteros cuando el rango es de ±10; un decimal en decibeles; dos en logMAR.
- El rango, en palabras: «range 47 to 68 µm».
- «I cannot measure this eye today», en primera persona y con la razón. Nunca «error».
- Nunca un diagnóstico, nunca una medicación, nunca la presión dentro del cráneo.
- Un botón dice lo que pasa al tocarlo.

### Textos nuevos

Las muestras usan los textos que la aplicación ya tiene. Estos pocos son nuevos, porque la disposición nueva los pide; van al catálogo de textos, en los dos idiomas:

| Dónde | Inglés | Español |
|---|---|---|
| Navegación | Control · Result · History · Report · Ask | Control · Resultado · Historia · Informe · Preguntar |
| Ficha de la franja superior | Simulated data | Datos simulados |
| Sello dentro de una imagen | Simulated | Simulado |
| Cabeza del grupo de la respuesta | Result | Resultado |
| Acción hacia la lista completa | All {n} steps, and why | Los {n} pasos y por qué |
| Hallazgo bajo el nivel de un ojo | New folds | Pliegues nuevos |
| Leyenda del ocular | Optic nerve opening | Abertura del nervio óptico |
| Línea de la misión | Return | Regreso |
| Gráfico de historia | Next scan | Próxima tomografía |
| Lo guardado, en Inicio | Controls done here · Controls in progress | Controles hechos acá · Controles en curso |
| Encabezados ocultos de la tabla de controles | Both eyes · Level | Los dos ojos · Nivel |
| Encabezado de la tabla de «How sure» | Limit | Límite |
| Segunda línea de una lectura | pre-flight {value} | antes del vuelo {value} |

## Accesibilidad

- Contraste: lectura en 10:1 o más; ningún texto bajo 6:1, tampoco con una estrella detrás; bordes de control en 3:1 o más. Medido en `tokens.json`.
- Nada depende sólo del color: los niveles tienen forma y palabra; los ojos, trazo y marca; los orígenes, forma; lo elegido se invierte.
- Cada gráfico tiene un `aria-label` que dice lo mismo en una oración, y su tabla equivalente.
- Foco siempre visible: anillo blanco de 2 px separado 3 px.
- Texto de lectura de 18 px; piso de 14 px.
- Todo se usa con teclado; el orden de foco sigue el orden de lectura: respuesta, ojos, confianza.
- Lo que no entra de ancho se desplaza dentro de su caja (`co-desliza`): la página nunca se desplaza de lado.

## De lo que existe a lo nuevo

| Pieza actual | Componente |
|---|---|
| `LevelBadge` y `AlertIcon` | Nivel |
| `OriginTag` | Origen |
| `QuantityValue` | Lectura |
| `Card` | Grupo, dentro de un velo; o una columna con una línea arriba |
| `Button` y `LinkButton` | Botón; y Acción para lo secundario |
| `SimulatedNotice` y la franja fija | Ficha de datos simulados, en la Franja superior; Sello, dentro de cada imagen |
| `LanguageToggle` | Segmento, en la Franja superior |
| `AppHeader` | Franja superior; el tripulante pasa al Sujeto del velo izquierdo |
| Botones al final de cada pantalla | Navegación |
| `ChangeScale` | Escala de cambio |
| `HistoryChart` | Gráfico de historia |
| `FundusCanvas` | Ocular (en la primera vista y en la captura) y visor (cuadrada y completa) |
| `BScanCanvas` | Corte |
| `QualityBars` | Barras, en la captura y en el visor; Lectura en el resumen |
| Lista de pasos de la sesión | Pasos de la sesión |
| Pasos siguientes y su etiqueta de respaldo | Próximo paso |
| `callout` | Aviso |
| Tarjeta de tripulante | Tripulante, con Par de ojos |

Las marcas que hoy se dibujan sobre `canvas` toman `overlay-line` y `overlay-casing`.

## Lo que rompe la identidad

- Un gris de fondo: una tarjeta, un panel, una caja con relleno. O un negro que no es negro.
- Un texto directamente sobre las estrellas, sin velo ni halo. O estrellas detrás de un gráfico o de una prueba de visión.
- Un color que no sea de nivel: un enlace celeste, un «todo bien» verde, una cifra turquesa, una serie rosa.
- Un color de nivel usado como adorno: un título amarillo, un borde azul porque queda lindo.
- Una píldora, una sombra, un radio grande, un degradado de color.
- Más de una lectura héroe por ojo, o una cifra sin unidad, sin rango o sin origen.
- Párrafos en la primera vista. Si hay que leer para saber qué pasó, falta una lectura.
- La imagen retocada, coloreada o con las marcas en colores. O algo encima del ojo que no sea lo medido y su sello.
- Planetas, nebulosas, cohetes, estrellas de colores o que titilan.
- Algo que parpadea, rebota o cuenta desde cero.
- La ficha de datos simulados escondida, cerrable o fuera de una imagen.

## Datos de las muestras

- **Medido por el motor del proyecto:** tripulante ficticio C, día de vuelo 118, de la historia medida que trae la aplicación. Ojo derecho: +57,5 µm (47,4 a 67,6), mostrado como +58 (47 a 68), igual que lo redondean los textos; nivel clínicamente preocupante; 69 % de probabilidad sobre 55 µm. Ojo izquierdo: +32,8 µm (22,6 a 43,0); primer indicio; 99 % sobre 19,4 µm. Pliegues nuevos en los dos ojos (99 % y 79 %). Calidad 22,8 y 24,5 dB; 48 de 48 cortes. Los controles anteriores, las pruebas de visión, las medidas de la tabla, los próximos pasos y los límites son los de esa misma sesión.
- **Las imágenes** de `assets/img/` se generaron con el instrumento virtual, con el mismo pedido que la historia: el fondo de ojo, recortado a un cuadrado de 5,4 mm centrado en el patrón de cortes, y el primer corte de cada ojo. Las elipses y las líneas de capa salen de lo que marcó el motor. Llevan la marca de datos simulados grabada y «simulado» en el nombre.
- **El último nivel de cada tripulante** en Inicio es el de la historia medida antes del día 150.
- **Ilustrativo, no calculado:** el avance de la captura (corte 31 de 48, 24,1 dB y la calidad de cada corte), el estado de cada tripulante en Inicio, la respuesta de ejemplo del asistente, los dos avisos de captura fallida y la cantidad de controles guardados. En la aplicación, cada uno sale de donde ya sale hoy.
- **El campo de estrellas** no es un dato ni un cielo real: son puntos generados con semilla.
- Las fechas se calcularon con la regla de la aplicación: el día de vuelo 1 es el 20/5/2026.

## Decisiones

Tomadas con el responsable del proyecto el 15/11/2026. Las de la segunda vuelta reemplazan a las de la primera donde chocan.

| Tema | Decisión |
|---|---|
| Alcance | Todas las pantallas. Este entregable es sólo el sistema; lo aplica otro agente |
| Fondo | **Negro puro**, con un campo de estrellas. Sin azulado, sin grises |
| Claro | **Blanco puro** para lo que se lee; líneas finas en vez de superficies |
| Referencia | El lenguaje de los visores de misión de la NASA: lecturas sobre una línea, velo pegado al borde, controles circulares, línea de tiempo con marcas |
| Protagonista | El fondo de ojo al centro y el corte como evidencia secundaria |
| Pantalla | Híbrida: primera vista tipo cabina y detalle más abajo |
| Texto | Los mismos textos, repartidos en capas, y gráficos donde se pueda |
| Color | Monocromo; color sólo en los niveles. Sin cian, por la norma |
| Carácter | Instrumento de vuelo, sobrio y preciso, que no resulte hostil |
| Recorte | Círculo en la primera vista; imagen completa en el visor |
| Nivel | Forma, clase y palabra; marca en la escala; y órbita alrededor del ocular |
| Tipografía | Atkinson Hyperlegible Next, servida desde el sitio |
| Íconos | Lucide copiado como archivos, más los propios |
| Origen | Signos de forma con leyenda |
| Navegación | Abajo y al centro; arriba sólo marca, fecha, día, ficha de datos simulados e idioma |
| Datos simulados | Ficha fija arriba, sello en cada imagen, pie en cada informe |
| Movimiento | Lo que se mueve es el dato; la marca barre mientras el motor trabaja |
| Marca | Nombre y logo definitivos; isotipo redibujado en SVG |

## Cambios

| Versión | Fecha | Qué | Por qué |
|---|---|---|---|
| v2.0 | 15/11/2026 | «Campo oscuro»: negro y blanco puros, campo de estrellas, velos y halos en vez de vidrio, lecturas sobre líneas en vez de paneles, navegación con discos, 29 componentes, cuatro pantallas | La v1 se rechazó: gris en vez de negro, y genérica |
| v1.0 | 15/11/2026 | «Ocular»: negro azulado, vidrio ahumado, paneles redondeados | Primera propuesta. Descartada |
