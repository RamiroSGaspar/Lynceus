# Guía personal para entender y defender el proyecto

**Guía para el equipo. Estado: 15 de noviembre de 2026.**
Leela con la demo abierta. Todo ejemplo de astronauta, imagen y resultado de esta
guía es **simulado**. Los números del recorrido son observaciones de la demo,
no mediciones en una persona.

Para presentar en pocos minutos, empezá por las secciones 1, 4 y 9.
Para preguntas del jurado, repasá las secciones 5 a 8.
También tenés dos lecturas cortas: [defensa científica](defensa-cientifica.md)
y [defensa del flujo del programa](defensa-arquitectura.md).

## 1. Qué estás proponiendo

> «Queremos que un astronauta pueda entender una primera lectura de su control
> ocular a bordo: qué cambió respecto de antes del vuelo, cuánto, con qué margen
> y qué seguimiento propone la herramienta. El médico en Tierra recibe un
> informe trazable y conserva la decisión».

El problema que elegimos es SANS: cambios neuro-oculares asociados al vuelo
espacial. Puede haber hallazgos sin síntomas notorios, así que «me siento bien»
no reemplaza el control. El proyecto se concentra en engrosamiento retinal
junto al nervio y pliegues; no pretende medir todos los componentes de SANS.

El aporte de la demo es unir **imagen → medida → comparación → explicación →
seguimiento → informe** en un recorrido que se pueda inspeccionar. El análisis
local es relevante para misiones con comunicación demorada.

## 2. Cuando decís «el modelo», ¿de cuál estás hablando?

| Pieza | Qué hace | Cómo explicarla |
|---|---|---|
| Ojo virtual | Define anatomía y evolución ficticias | «Es el escenario conocido contra el que podemos comprobar una medición» |
| Instrumento virtual | Convierte ese ojo en imágenes con ruido, sombras y fallos | «Hace de tomógrafo simulado y entrega cortes en un archivo de examen» |
| Motor de imágenes | Encuentra bordes y mide los píxeles | «Es un algoritmo determinista de análisis de imágenes» |
| Modelo de error | Estima cuánto podría variar una medida | «Da los márgenes; el que usa la demo sigue siendo provisorio» |
| Reglas | Comparan cambios con umbrales y síntomas | «Transforman medidas en un nivel y un seguimiento propuesto» |
| Asistente de IA | Explica con una base citada | «Ayuda a entender; no mide las imágenes ni decide el nivel» |

El motor principal no es una red neuronal entrenada para diagnosticar. Usa
procesamiento de imágenes y geometría. El modelo experimental de error sí
ajusta coeficientes a datos sintéticos. El asistente es un modelo de lenguaje
preexistente al que se le dan instrucciones, contexto numérico y conocimiento
citado; no entrenamos ese modelo desde cero.

El modelo que usa un agente para escribir el software es otra cosa: que el worker
haya usado Opus no significa que Opus mida el ojo ni que sea el modelo configurado
para responder en el producto.

### Qué significa determinista

Con el mismo pedido, semilla, referencia y versiones, el instrumento y el motor
producen el mismo resultado. Por eso podemos reconstruir una captura.
Cambiar la calidad, el intento, el día o las respuestas del cuestionario cambia
la entrada. Las respuestas del asistente de lenguaje pueden variar.

## 3. Cómo se obtiene una medida

Pensá en OCT como una imagen en corte de las capas del fondo del ojo, obtenida
con luz. No es una resonancia del cerebro. Nuestro instrumento virtual genera
48 cortes radiales que pasan por la región del nervio.

El motor hace este recorrido:

1. Lee imagen, escala y geometría del examen.
2. Busca la **ILM**, la superficie interna de la retina, y la **BM**, membrana
   de Bruch. «Segmentar» es localizar esos bordes en la imagen.
3. Encuentra los extremos de la BM alrededor del nervio: la **BMO**, su abertura.
   Con los puntos de los cortes ajusta una elipse.
4. Comprueba señal, cortes utilizables, centrado y cobertura. Si falla un criterio,
   el examen queda sin medidas utilizables.
5. Mide el grosor entre los bordes en anillos alrededor de la abertura.
   La medida principal es el anillo de **0 a 250 µm desde su borde**.
6. Mide la rugosidad de BM: cuánto ondula después de quitar la inclinación y
   curvatura general. Usa una región de 300 a 1700 µm desde la abertura.
7. Compara con el examen previo al vuelo del mismo ojo y aplica las reglas.

Un micrómetro, **µm**, es una milésima de milímetro. «0–250 µm» describe dónde
se mide alrededor de la abertura; no significa que el grosor deba ser 250 µm.

El visor también muestra **MRW**, distancia mínima entre la abertura y la superficie
retinal, y el área de BMO. Aportan detalle geométrico. El resultado principal se
apoya en el cambio de grosor y de rugosidad, junto con visión y síntomas.

Para conservar comparable la región medida, el motor puede usar la forma de la
abertura de referencia colocada en el centro encontrado hoy. El visor informa
esa procedencia. No equivale a copiar el grosor del examen anterior.

## 4. Cómo explicar cada imagen y gráfico

### Imagen de fondo de ojo y estrella de cortes

Es una vista de orientación. La estrella indica por dónde pasan los cortes.
Los estilos de línea distinguen cortes útiles, no útiles y el que se está tomando.
No es un mapa de probabilidades ni un resultado de diagnóstico.

**Frase para mostrarla:** «Cada radio nos permite mirar una sección del tejido.
Después combinamos esas secciones para medir una región comparable».

### Corte OCT con líneas superpuestas

El gris es la imagen simulada. Las líneas son el resultado del marcado:

- ILM: línea continua.
- BM: línea de trazos.
- BMO: puntos señalados con un círculo y una cruz.
- Límites de los anillos: líneas verticales punteadas.
- Anillo principal: zona sombreada.

La leyenda en pantalla es la referencia para colores y estilos. El brillo de la
imagen no es «más enfermedad». Se mide una distancia entre bordes, no el gris solo.

**Frase:** «Se puede revisar dónde encontró el algoritmo los bordes y de qué
parte de la imagen salió el número».

### Barras de calidad

Cada barra corresponde a un corte; el eje vertical muestra calidad en **dB**.
No son porcentajes. La línea de 15 dB es el límite de señal pobre que usa el
proyecto, apoyado en la escala descrita para el equipo.

Una calidad alta no garantiza una medida correcta: movimiento o problemas de
geometría pueden afectar la medición aun con buena señal. El índice simulado
no está calibrado contra el tomógrafo físico.

**Frase:** «Estas barras explican la calidad de la captura, no la gravedad del ojo».

### Perfil de grosor: hoy contra antes del vuelo

El eje horizontal es **posición dentro del corte, en mm**; el vertical es
**grosor, en µm**. La línea continua representa hoy, la de trazos la referencia
y la zona sombreada su diferencia. No confundas este gráfico con una historia:
acá te movés por el tejido, no por los días.

El perfil es un corte. La cifra principal del resultado resume el anillo a
partir del conjunto de cortes, así que no sale de elegir el punto más alto.

### Escala del resultado

Muestra el **cambio respecto de antes del vuelo**. El cero es «igual a mi referencia»,
no «retina de grosor cero».

- Un valor positivo indica mayor grosor que en la referencia.
- La marca de hoy es la estimación central.
- El segmento con extremos es el rango provisorio.
- Las franjas y líneas ubican los umbrales.
- Los puntos anteriores, identificados por día de vuelo, permiten comparar.

El gráfico resume grosor. El nivel general puede depender también de pliegues o
síntomas; no siempre se deduce de una sola marca.

### Historia

Ahora sí: el eje horizontal son **días de vuelo** y el vertical es **cambio de
grosor en µm**. Círculos: ojo derecho. Cuadrados: izquierdo. Marcas llenas: control
hecho en este navegador. Huecas: control incluido con la aplicación.

Ambos tipos contienen imágenes ficticias: «hecho en este navegador» no significa
«examen de un astronauta real». Los rangos acompañan cada punto. Las líneas unen
controles observados; no demuestran medición continua ni predicción del futuro.
Un control no medido no debe interpretarse como cero.

### Grilla de Amsler y agudeza de cerca

Amsler registra dónde la persona dice ver distorsión, borrosidad o falta de líneas.
No es una imagen de su retina. La agudeza estima la capacidad de reconocer la
orientación de una C, con tamaño de pantalla y distancia calibrados.

En **logMAR**, un número mayor representa peor agudeza. Es una escala distinta
de los micrómetros del OCT. Saltear una prueba significa «no hecha»; el sistema
no debe completar una respuesta sana por ausencia de datos.

## 5. El ejemplo de Elena, día 150

En el recorrido corto comprobado se saltearon visión y síntomas. El ojo derecho
se aceptó de entrada; el izquierdo falló por parpadeo simulado y se aceptó al repetir.

| Resultado redondeado | Ojo derecho | Ojo izquierdo |
|---|---|---|
| Cambio respecto de antes del vuelo | +31 µm | +23 µm |
| Rango provisorio mostrado | +22 a +40 µm | +13 a +33 µm |
| Nivel por ojo en este recorrido | Primer indicio | Primer indicio |

El informe mostró, para el anillo principal derecho, aproximadamente **428 µm
hoy y 397 µm antes del vuelo**: la diferencia redondeada es 31 µm.
La clasificación se calcula con los valores internos, no restando números que
ya fueron redondeados para pantalla.

**Cómo decirlo:** «En este ojo ficticio, la retina cerca del nervio aparece
31 micrómetros más gruesa que en su referencia. Supera el primer umbral; todavía
está por debajo del clínicamente preocupante. El margen que mostramos es
provisorio y el médico debe interpretar el hallazgo».

El punto izquierdo supera 19,4 µm, pero su rango lo cruza. Eso permite explicar
que **el nivel calculado y la incertidumbre no son la misma información**:
la regla usa la estimación; el rango muestra que podría quedar del otro lado.

Con estas entradas, el informe propone la próxima OCT en el día 178 y Amsler
dos veces por semana. Son 28 días desde el control del día 150, según el supuesto
de cuatro semanas del proyecto. Un síntoma agudo puede cambiar la prioridad.

## 6. Umbrales, rangos y probabilidades sin confundirlos

### Tres cifras para recordar

| Cifra | Qué significa | Qué no significa |
|---|---|---|
| > 19,4 µm | Primer umbral de aumento de grosor que usa el prototipo, a partir de la variación publicada | Tamaño total de la retina ni error propio de nuestro motor |
| ≥ 55 µm | Umbral publicado de cambio clínicamente preocupante | Diagnóstico automático ni certeza de pérdida visual |
| > 2,8 µm | Cambio de rugosidad que se usa para indicar pliegues nuevos | Tamaño de un quiste ni presión dentro del cráneo |

NASA también presenta el primer criterio redondeado como ≥ 20 µm. El prototipo
usa la cifra original > 19,4; si te preguntan por esa diferencia, explicá el
redondeo. Las fuentes están en [evidencia](../docs/es/evidence.md).

### De dónde sale hoy el rango

El modelo activo supone un error de grosor por examen de 3 µm con calidad de
27 dB o más, que crece linealmente hasta 6 µm a 15 dB. Combina el error del examen
actual y de la referencia por raíz de suma de cuadrados. Para rugosidad supone
0,8 µm por examen.

Como ejemplo **didáctico, no el cálculo exacto de Elena**, si ambos exámenes
tuvieran un error supuesto de 3 µm:

```text
Error combinado = √(3² + 3²) ≈ 4,24 µm
Semiancho del intervalo nominal = 1,96 × 4,24 ≈ 8,3 µm
```

El rango se construye alrededor del cambio medido con una aproximación normal.
Supone, entre otras cosas, independencia entre errores. No demostramos que ese
intervalo tenga cobertura real del 95 %; «95 %» es nominal bajo el modelo.

### Qué significa el porcentaje

La pregunta matemática es: «Según esta medición y este modelo de error,
¿qué tan probable es que el cambio supere este umbral?».

**No es** «¿qué probabilidad tiene esta persona de tener SANS?», ni «¿qué
probabilidad hay de que nuestro programa sea correcto?». Un «99 %» en pantalla
hereda las limitaciones del modelo provisorio.

Si el rango cruza un umbral, explicá la incertidumbre. Si no cruza cero, sigue
sin demostrar por sí solo una enfermedad. Si hay un síntoma agudo, no uses el
gráfico para desestimar el síntoma.

## 7. Qué demuestran las 621 capturas

Son **621 capturas de ocho ojos virtuales de cuatro personajes**, incluidas
16 referencias. No son 621 astronautas ni 621 personas independientes.

Con valores verdaderos conocidos en la simulación, se intentó ajustar un modelo
pequeño que estimara el error según la calidad. Considera señal, cortes no
utilizables, ajuste de la abertura, centrado, cobertura del anillo, movimiento y
columnas sin bordes. El ajuste eligió cobertura y señal para grosor, y movimiento
para rugosidad. Los pesos y transformaciones están publicados.

Se reservaron ojos y tipos de fallo para evaluación. El candidato **no se activó**:
hubo errores máximos fuera de las tolerancias, pocos pares en una partición,
problemas de cobertura y capturas limpias fuera de su dominio.

| Palabra | Lectura sencilla |
|---|---|
| Sesgo | Tendencia media a medir por encima o por debajo |
| RMSE | Tamaño del error que penaliza especialmente los errores grandes; tiene las mismas unidades que la medida |
| Error máximo | Peor error absoluto observado en ese conjunto |
| Cobertura | Fracción de casos cuyo valor verdadero quedó dentro del rango |
| Par | Examen actual comparado con una referencia; varios pares pueden compartir ojo y referencia |
| Fuera del dominio | Combinación de calidad que el candidato no puede respaldar con sus datos de desarrollo |

Ejemplo para defender la decisión: en anatomía apartada hubo RMSE de grosor
**2,45 µm**, pero un error máximo de **8,94 µm**, superior a nuestra tolerancia de
**6 µm**. Una media razonable no elimina un error grande. En fallos apartados,
la cobertura del intervalo nominal del 95 % para rugosidad fue **79,2 %**, en
24 pares. Esas cifras describen el candidato, no los márgenes actuales.

**Frase:** «Publicamos una evaluación exploratoria que encontró límites reales
del prototipo. Como el candidato no cumplió los criterios, dejamos el modelo
provisorio identificado y no lo presentamos como incertidumbre validada».

El simulador y el motor comparten simplificaciones; eso puede facilitar la tarea.
La segunda corrida larga se interrumpió. No afirmes que las 621 capturas se
regeneraron completas dos veces: conservar un archivo con el mismo hash no lo prueba.
La historia medida sí tiene una comprobación de regeneración distinta, documentada
en las notas; no mezcles ambos experimentos.

## 8. Preguntas difíciles y respuestas defendibles

**«¿Esto funciona con un astronauta real?»**
«Demostramos el recorrido con imágenes sintéticas. Falta evaluar imágenes reales
independientes, anotaciones de expertos y uso con personas. No está listo para
decisiones clínicas».

**«¿Por qué datos ficticios?»**
«Permiten construir casos controlados y conocer la referencia para evaluar el
motor. El siguiente paso requiere datos reales y permisos adecuados. La simulación
no representa toda la variabilidad humana».

**«¿Qué tiene de real si simulan la imagen?»**
«La imagen es ficticia, pero el algoritmo ejecuta la búsqueda de bordes, medición
y comparación. No toma el grosor de una tabla de respuestas para mostrarlo».

**«¿NASA aprobó los niveles o el programa?»**
«Usamos criterios publicados y citamos su origen. NASA no aprobó este software.
El seguimiento adicional, la combinación de síntomas y varias decisiones son
supuestos propios».

**«¿Por qué un asistente de IA?»**
«Para explicar términos, resultados y preparar preguntas sobre una base citada.
El resultado del motor y sus reglas existen aunque el asistente esté desconectado».

**«¿Cómo evitan que invente?»**
«Acotamos el tema, le damos el contexto y las fuentes, exigimos un formato y
revisamos referencias, números y contenido. Podemos bloquear una salida insegura.
Son barreras, no una garantía de que un modelo de lenguaje nunca se equivoque».

**«¿Dónde quedan los datos?»**
«Los controles se guardan en el navegador. Al aceptar consultar a la IA salen
la pregunta y un resumen numérico sin identidad, a través del servidor, hacia
Anthropic. No mandamos la imagen. Lo que alguien escriba en la pregunta también
sale; no prometemos anonimato absoluto».

**«¿Por qué el caso grave puede no tener síntomas?»**
«Los hallazgos estructurales y lo que la persona nota no son equivalentes.
Un caso publicado motivó el escenario extremo. Eso no permite predecir que
cualquier astronauta con ese cambio vaya a tener el mismo desenlace».

**«¿Qué nos dice del cerebro o de la presión intracraneal?»**
«Este examen no mide esas variables. La pantalla del cerebro organiza información
publicada, incluyendo lo que solo se ve por resonancia antes y después del vuelo,
y lo que no se puede concluir a bordo».

**«¿Qué harían después?»**
«Primero probar el motor con imágenes independientes revisadas por expertos,
medir fallos y calibrar la incertidumbre. Después evaluar comprensión y utilidad
con usuarios. Mantendríamos al médico como responsable de la interpretación».

## 9. Guion de presentación

> «Durante una misión larga pueden aparecer cambios en el ojo que el astronauta
> todavía no nota. Proponemos una primera lectura a bordo que compare cada control
> con su propia referencia y prepare la conversación con Tierra.
>
> Esta es Elena, una tripulante ficticia. El instrumento simula la tomografía y
> el motor analiza sus píxeles. Un ojo se mide; en el otro la primera captura
> falla y se pide repetir. La herramienta registra ese intento.
>
> El resultado explica cuánto cambió y dónde cae frente a los umbrales publicados.
> También muestra que su margen de incertidumbre es provisorio. Podemos abrir
> la imagen, ver los bordes medidos, revisar la historia y descargar el informe.
>
> El asistente ayuda a entender con fuentes, pero la medición y el nivel se calculan
> localmente. El prototipo no diagnostica ni estima presión intracraneal. Lo que
> mostramos hoy es un recorrido completo y trazable sobre datos simulados».

Si el asistente sigue sin clave, mostrá su alcance y consentimiento y explicá que
la respuesta contra la API real está pendiente. La demostración del análisis no
depende de ocultar ese estado.

## 10. Tu repaso antes de mostrarlo

Podés defenderlo si podés explicar, con tus palabras:

1. Por qué importa compararse con el propio examen anterior al vuelo.
2. Qué parte es simulada y cuál se calcula sobre la imagen.
3. La diferencia entre grosor absoluto y cambio de grosor.
4. Qué ejes tiene cada gráfico y qué significan marcas y rangos.
5. Por qué nivel, incertidumbre y diagnóstico son cosas diferentes.
6. Por qué el modelo experimental no está activo.
7. Qué datos salen al consultar al asistente y cuáles permanecen locales.

Si te falta una cifra, abrí la fuente o el informe. Es preferible decir «no lo
medimos todavía» a convertir una estimación en un resultado demostrado.

## Dónde respaldar una respuesta

- [Recorrido de demo](../docs/es/demo.md): botones y reinicio.
- [Evidencia](../docs/es/evidence.md): fuentes científicas y resultados de evaluación.
- [Supuestos](../docs/assumptions.md): decisiones propias, incluidos márgenes y frecuencias.
- [Informe completo de validación](../packages/validation/out/quality-validation.md): particiones, errores y cobertura.
- [Resumen generado](../packages/core/src/dataset/validation-summary.json): pesos y métricas que muestra la interfaz.
- [Notas del núcleo](../packages/core/NOTES.md): decisiones técnicas, reproducibilidad y limitaciones.
- [Reglas y umbrales](../packages/core/src/rules/thresholds.ts): origen y comparación exacta de cada límite.
