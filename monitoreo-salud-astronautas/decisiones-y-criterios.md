# Decisiones y criterios: Monitoreo de salud para astronautas

> **Etapa:** definición de la idea. La investigación de herramientas de medición está en curso y varios puntos siguen abiertos.

| | |
|---|---|
| **Hackatón** | NASA Space Apps Challenge 2026 — 14 y 15 de noviembre de 2026 |
| **Desafío** | *Create Health Monitoring Software for Astronauts on Space Missions* — [página oficial](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/) |
| **Última actualización** | 14 de noviembre de 2026 |
| **Para qué es** | Dejar por escrito lo que se fue decidiendo y los criterios que se acordaron al discutir la idea, con su justificación, para no perderlos y poder revisarlos. |
| **Qué no es** | No es el diseño de la solución ni una lista de funcionalidades. Los recursos y las reglas de entrega están en [recursos-del-desafio.md](recursos-del-desafio.md). |
| **De dónde sale** | De las conversaciones de trabajo del 14 de noviembre entre Ramiro y los asistentes de IA (Claude y Devin). |

### Cómo leerlo

- **Sección 1:** decisiones sobre el alcance, es decir, de qué trata el proyecto.
- **Sección 2:** criterios para trabajar y para comunicarle datos al astronauta.
- **Sección 3:** lo que todavía no está decidido.
- **Columna "Quién":** quién lo planteó. Lo que planteó Devin figura solo si Ramiro lo aceptó.
- **Columna "Estado":** *Decidido* (lo resolvió Ramiro), *Aceptado* (criterio acordado), *Preferido* (inclinación, no cerrado) o *Abierto*.

---

## 1. Decisiones de alcance

| # | Decisión | Por qué | Quién | Estado |
|---|---|---|---|---|
| D1 | Trabajar el desafío 4, monitoreo de salud para astronautas. | Se eligió después de analizar a fondo los desafíos 4, 5 y 7. | Ramiro | Decidido |
| D2 | Enfocarse en algo específico y no abarcar todo el cuerpo. | El desafío acepta cualquier indicador de salud y no exige cubrir todo. Permite más profundidad y diferencia al proyecto entre 3.023 equipos. | Ramiro | Decidido |
| D3 | El tema es la columna vertebral. | La idea inicial eran las articulaciones, pero juntaban problemas distintos, la NASA no tiene un riesgo propio para ellas y la evidencia en humanos es escasa. La columna tiene más evidencia en humanos y figura en los recursos oficiales. | Ramiro | Decidido |
| D4 | El foco es durante la misión, en el espacio. La vuelta a la Tierra queda afuera. | El desafío busca que el astronauta se autogestione. En la Tierra ya tiene especialistas a disposición. Matiz registrado: llegar a la Luna o a Marte también es misión, y es parte de por qué importa vigilar la columna durante el viaje. | Ramiro | Decidido |
| D5 | El enfoque que más interesa es el deterioro progresivo y silencioso de la columna: músculos que la sostienen, curvatura, movilidad, densidad de las vértebras y alargamiento. | Es progresivo, ocurre durante la misión y se conecta con el ejercicio como contramedida, que está en los recursos oficiales. El dolor de adaptación del inicio del vuelo también entra en el foco, pero interesa menos. | Ramiro | Preferido |
| D6 | La idea de cómo resolver el desafío la define Ramiro, no la IA. | Las reglas prohíben usar IA para generar la idea. La IA se usa para investigar, discutir y acelerar, y su uso se declara en la entrega. | Ramiro | Decidido |

## 2. Criterios de trabajo y de comunicación

| # | Criterio | Por qué | Quién | Estado |
|---|---|---|---|---|
| C1 | Trabajar desde la investigación y los supuestos: una lógica realista sobre un caso investigado, sin afirmar de más. No es solo presentar una idea. | No se puede validar clínicamente en dos días. Decir qué es dato y qué es supuesto es más honesto que aparentar certeza. | Ramiro | Aceptado |
| C2 | Lo que se le comunica al astronauta tiene que ser claro y responsable. | Es salud. Los astronautas son profesionales, pero en medicina no saben más que lo entrenado. El desafío pide no asumir que saben evaluar su salud. | Ramiro | Aceptado |
| C3 | Al evaluar un dato se miran tres cosas por separado: qué tan directo se mide, qué tan preciso es el instrumento y qué tan claro es lo que el valor significa para la salud. | Un dato directo no siempre es interpretable: la estatura se mide directo, pero no está claro qué dice sobre la salud. Un dato "blando" puede ser el más útil: el dolor es autorreporte y es el síntoma de columna con más datos reales en vuelo. El riesgo de comunicar mal está sobre todo en el paso del dato a la conclusión. | Devin; Ramiro lo pensaba así y lo había resumido como "medición directa" | Aceptado |
| C4 | La incertidumbre se dice, no se esconde. Una estimación presentada como estimación es responsable; una medición directa con una conclusión que la evidencia no sostiene no lo es. | Descartar todo lo estimado puede dejar afuera lo que más importa. En columna, lo más relevante (densidad de las vértebras, estado de los músculos) se estudia antes y después del vuelo, no durante. | Devin | Aceptado, con el balance de C5 |
| C5 | Cuánto de lo incierto o estimado se incluye se decide haciendo un balance con el tiempo disponible. | Preferir lo más directo no es elegir el camino fácil ni dejar de lado lo importante. Con dos días, comunicar bien algo muy incierto lleva más trabajo del que quizá haya. | Ramiro | Aceptado |
| C6 | Lo medido y lo estimado se distinguen siempre. | Si se muestra en misión un valor que en la realidad no se mide en misión, es una estimación y hay que decirlo. | Devin | Aceptado |
| C7 | Los dos errores cuestan: tranquilizar de más y alarmar de más. | Tranquilizar de más puede hacer que se pase un problema. Alarmar de más también hace daño en gente aislada y bajo estrés. | Devin | Aceptado |
| C8 | Parte de la responsabilidad es el límite: definir cuándo la herramienta deja de opinar y deriva a la tripulación o a los médicos en Tierra. | El desafío pide orientar sobre tratamientos y pregunta cuándo un resultado amerita atención de la tripulación o de los médicos. | Devin | Aceptado |
| C9 | Hay un segundo destinatario, los jueces: dejar claro que los datos son simulados y que los valores y umbrales no están validados. | Todos los datos del proyecto van a ser simulados. Presentarlos como validados sería afirmar de más. | Devin | Aceptado |
| C10 | Los datos ficticios tienen que ser plausibles y salir de investigar cómo funcionan los instrumentos que los obtendrían. | Da lógica y justificación al proyecto. Responde a dos preguntas guía del desafío: qué se puede medir en el espacio y por qué. | Ramiro | Aceptado |
| C11 | Lo más difícil de justificar es el umbral, no el dato. | Simular un valor plausible es más fácil que justificar cuándo ese valor amerita una alerta. | Devin | Aceptado |
| C12 | Pocos indicadores, bien fundamentados. | Investigar cada instrumento lleva tiempo y la entrega es el 15 de noviembre a las 23:59. | Devin | Aceptado |
| C13 | Separar lo que dice la NASA o el desafío de lo que es interpretación de una IA. | Varias lecturas de las sesiones con IA son interpretación y no texto oficial. Si se trabaja desde la investigación, no hay que tomarlas como dichas por el desafío. | Devin y Ramiro | Aceptado |

## 3. Puntos abiertos

| # | Punto abierto | De qué depende | Estado |
|---|---|---|---|
| A1 | Qué aspectos de la columna entran en el proyecto. | De la investigación sobre herramientas de medición, en curso en la rama `investigaciones`. | Abierto |
| A2 | Dónde queda el balance entre incluir lo incierto y el tiempo disponible (C4 y C5). | De lo que muestre esa investigación sobre cuánto de lo importante solo se puede estimar. | Abierto |
| A3 | Enfoque final. El de D5 es el preferido, pero no está cerrado. | De A1 y A2. | Abierto |
| A4 | Cuánto se construye y qué se muestra en la entrega. | El desafío pide construir un software y la entrega exige un link público al proyecto; falta definir el alcance del prototipo. | Abierto |
| A5 | Confirmar que el equipo está creado en la web de Space Apps. | Sin equipo no se puede entregar. | Abierto |
