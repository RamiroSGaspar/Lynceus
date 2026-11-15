# Decisiones y criterios: Monitoreo de salud para astronautas

> **Etapa:** el tema cambió a ojos y cerebro (SANS). La ronda 1 de decisiones sobre el producto está cerrada (sección 4); la ronda 2 está en curso.

| | |
|---|---|
| **Hackatón** | NASA Space Apps Challenge 2026 — 14 y 15 de noviembre de 2026 |
| **Desafío** | *Create Health Monitoring Software for Astronauts on Space Missions* — [página oficial](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/) |
| **Última actualización** | 14 de noviembre de 2026 |
| **Para qué es** | Dejar por escrito lo que se fue decidiendo y los criterios que se acordaron al discutir la idea, con su justificación, para no perderlos y poder revisarlos. |
| **Qué no es** | No es el diseño de la solución ni una lista de funcionalidades. Los recursos y las reglas de entrega están en [recursos-del-desafio.md](recursos-del-desafio.md). |
| **De dónde sale** | De las conversaciones de trabajo del 14 de noviembre entre el responsable del proyecto y los asistentes de IA (Claude y Devin). |

### Cómo leerlo

- **Sección 1:** decisiones sobre el alcance, es decir, de qué trata el proyecto.
- **Sección 2:** criterios para trabajar y para comunicarle datos al astronauta.
- **Sección 3:** lo que todavía no está decidido.
- **Columna "Quién":** quién lo planteó. Lo que planteó Devin figura solo si el responsable del proyecto lo aceptó.
- **Columna "Estado":** *Decidido* (lo resolvió el responsable del proyecto), *Aceptado* (criterio acordado), *Preferido* (inclinación, no cerrado) o *Abierto*.

---

## 1. Decisiones de alcance

| # | Decisión | Por qué | Quién | Estado |
|---|---|---|---|---|
| D1 | Trabajar el desafío 4, monitoreo de salud para astronautas. | Se eligió después de analizar a fondo los desafíos 4, 5 y 7. | Responsable del proyecto | Decidido |
| D2 | Enfocarse en algo específico y no abarcar todo el cuerpo. | El desafío acepta cualquier indicador de salud y no exige cubrir todo. Permite más profundidad y diferencia al proyecto entre 3.023 equipos. | Responsable del proyecto | Decidido |
| D3 | El tema es la columna vertebral. | La idea inicial eran las articulaciones, pero juntaban problemas distintos, la NASA no tiene un riesgo propio para ellas y la evidencia en humanos es escasa. La columna tiene más evidencia en humanos y figura en los recursos oficiales. | Responsable del proyecto | Reemplazada por D7 (sección 4) |
| D4 | El foco es durante la misión, en el espacio. La vuelta a la Tierra queda afuera. | El desafío busca que el astronauta se autogestione. En la Tierra ya tiene especialistas a disposición. Matiz registrado: llegar a la Luna o a Marte también es misión, y es parte de por qué importa vigilar la columna durante el viaje. | Responsable del proyecto | Decidido |
| D5 | El enfoque que más interesa es el deterioro progresivo y silencioso de la columna: músculos que la sostienen, curvatura, movilidad, densidad de las vértebras y alargamiento. | Es progresivo, ocurre durante la misión y se conecta con el ejercicio como contramedida, que está en los recursos oficiales. El dolor de adaptación del inicio del vuelo también entra en el foco, pero interesa menos. | Responsable del proyecto | Reemplazada por D7 (sección 4) |
| D6 | La idea de cómo resolver el desafío la define el responsable del proyecto, no la IA. | Las reglas prohíben usar IA para generar la idea. La IA se usa para investigar, discutir y acelerar, y su uso se declara en la entrega. | Responsable del proyecto | Decidido |

## 2. Criterios de trabajo y de comunicación

| # | Criterio | Por qué | Quién | Estado |
|---|---|---|---|---|
| C1 | Trabajar desde la investigación y los supuestos: una lógica realista sobre un caso investigado, sin afirmar de más. No es solo presentar una idea. | No se puede validar clínicamente en dos días. Decir qué es dato y qué es supuesto es más honesto que aparentar certeza. | Responsable del proyecto | Aceptado |
| C2 | Lo que se le comunica al astronauta tiene que ser claro y responsable. | Es salud. Los astronautas son profesionales, pero en medicina no saben más que lo entrenado. El desafío pide no asumir que saben evaluar su salud. | Responsable del proyecto | Aceptado |
| C3 | Al evaluar un dato se miran tres cosas por separado: qué tan directo se mide, qué tan preciso es el instrumento y qué tan claro es lo que el valor significa para la salud. | Un dato directo no siempre es interpretable: la estatura se mide directo, pero no está claro qué dice sobre la salud. Un dato "blando" puede ser el más útil: el dolor es autorreporte y es el síntoma de columna con más datos reales en vuelo. El riesgo de comunicar mal está sobre todo en el paso del dato a la conclusión. | Devin; el responsable del proyecto lo pensaba así y lo había resumido como "medición directa" | Aceptado |
| C4 | La incertidumbre se dice, no se esconde. Una estimación presentada como estimación es responsable; una medición directa con una conclusión que la evidencia no sostiene no lo es. | Descartar todo lo estimado puede dejar afuera lo que más importa. En columna, lo más relevante (densidad de las vértebras, estado de los músculos) se estudia antes y después del vuelo, no durante. | Devin | Aceptado, con el balance de C5 |
| C5 | Cuánto de lo incierto o estimado se incluye se decide haciendo un balance con el tiempo disponible. | Preferir lo más directo no es elegir el camino fácil ni dejar de lado lo importante. Con dos días, comunicar bien algo muy incierto lleva más trabajo del que quizá haya. | Responsable del proyecto | Aceptado |
| C6 | Lo medido y lo estimado se distinguen siempre. | Si se muestra en misión un valor que en la realidad no se mide en misión, es una estimación y hay que decirlo. | Devin | Aceptado |
| C7 | Los dos errores cuestan: tranquilizar de más y alarmar de más. | Tranquilizar de más puede hacer que se pase un problema. Alarmar de más también hace daño en gente aislada y bajo estrés. | Devin | Aceptado |
| C8 | Parte de la responsabilidad es el límite: definir cuándo la herramienta deja de opinar y deriva a la tripulación o a los médicos en Tierra. | El desafío pide orientar sobre tratamientos y pregunta cuándo un resultado amerita atención de la tripulación o de los médicos. | Devin | Aceptado |
| C9 | Hay un segundo destinatario, los jueces: dejar claro que los datos son simulados y que los valores y umbrales no están validados. | Todos los datos del proyecto van a ser simulados. Presentarlos como validados sería afirmar de más. | Devin | Aceptado |
| C10 | Los datos ficticios tienen que ser plausibles y salir de investigar cómo funcionan los instrumentos que los obtendrían. | Da lógica y justificación al proyecto. Responde a dos preguntas guía del desafío: qué se puede medir en el espacio y por qué. | Responsable del proyecto | Aceptado |
| C11 | Lo más difícil de justificar es el umbral, no el dato. | Simular un valor plausible es más fácil que justificar cuándo ese valor amerita una alerta. | Devin | Aceptado |
| C12 | Pocos indicadores, bien fundamentados. | Investigar cada instrumento lleva tiempo y la entrega es el 15 de noviembre a las 23:59. | Devin | Aceptado |
| C13 | Separar lo que dice la NASA o el desafío de lo que es interpretación de una IA. | Varias lecturas de las sesiones con IA son interpretación y no texto oficial. Si se trabaja desde la investigación, no hay que tomarlas como dichas por el desafío. | Devin y el responsable del proyecto | Aceptado |

## 3. Puntos abiertos

> Los puntos A1 a A4 eran del tema anterior (columna) y quedaron sin efecto. A5, crear el equipo en la web, sigue abierto.

| # | Punto abierto | De qué depende | Estado |
|---|---|---|---|
| A1 | Qué aspectos de la columna entran en el proyecto. | De la investigación sobre herramientas de medición, en curso en la rama `investigaciones`. | Abierto |
| A2 | Dónde queda el balance entre incluir lo incierto y el tiempo disponible (C4 y C5). | De lo que muestre esa investigación sobre cuánto de lo importante solo se puede estimar. | Abierto |
| A3 | Enfoque final. El de D5 es el preferido, pero no está cerrado. | De A1 y A2. | Abierto |
| A4 | Cuánto se construye y qué se muestra en la entrega. | El desafío pide construir un software y la entrega exige un link público al proyecto; falta definir el alcance del prototipo. | Abierto |
| A5 | Confirmar que el equipo está creado en la web de Space Apps. | Sin equipo no se puede entregar. | Abierto |


## 4. Decisiones sobre el producto (ronda 1, 14 de noviembre a la noche)

Las tomó el responsable del proyecto al responder la primera ronda de preguntas. Los criterios C1 a C13 de la sección 2 siguen vigentes.

| # | Tema | Decisión | Estado |
|---|---|---|---|
| D7 | Tema | Síndrome neuro-ocular asociado al vuelo espacial (SANS), ojos y cerebro. Escenario: una estación espacial, durante la misión. Reemplaza a D3 y D5. | Decidido |
| R1 | Promesa | "Después de cada examen, en menos de un minuto: si la parte de atrás de tu ojo cambió respecto de antes del vuelo, cuánto, qué tan seguro es ese resultado y qué corresponde hacer." | Decidido |
| R2 | Qué es real y qué es ficticio | El aparato es uno que existe: el tomógrafo Spectralis OCT2 que está en la estación. Los datos son ficticios pero copian lo que entrega ese equipo (estructura, campos y escalas), según la investigación; no se inventan sin fundamento. Todo el proceso de análisis corre de verdad. Sin gastar dinero en servicios externos. | Decidido |
| R3 | Ojos y cerebro | El sistema mide el ojo, explica su vínculo con el cerebro y dice qué no se puede saber en misión. Suma las señales del lado del cerebro que sí se toman en misión. Además tiene que atender lo difícil que es comunicarse con médicos o especialistas en Tierra cuando el astronauta necesita entender su estado. | Decidido; el detalle se cierra en la ronda 2 |
| R4 | Alcance | Producto dedicado a ojos y cerebro, no un módulo de una herramienta general. | Decidido |
| R5 | Usuario | El astronauta examinado, solo. | Decidido |
| R6 | Relación con Tierra | Primera lectura a bordo; Tierra confirma después y tiene la última palabra. | Decidido |
| R7 | Criterios | Siguen C1 a C13. Se pueden sumar criterios profesionales, consultándolos antes. | Decidido |
| R8 | Imagen | Tomografía de retina (OCT). | Decidido |
| R9 | Pruebas en la herramienta | Cuestionario ocular, agudeza visual y grilla de Amsler, hechas de verdad por el astronauta. La lógica cruza todo. | Decidido |
| R10 | Motor de análisis | Algoritmos de medición como base, más un componente entrenado para hallazgos secundarios. Nada que sea una caja negra. | Decidido |
| R11 | Validación | Completa: el motor se prueba contra ojos ficticios de valor conocido, y ese error medido es la incertidumbre que se comunica. | Decidido |
| R12 | Qué puede indicar | Pasos dentro de la práctica actual de la NASA: repetir la captura, adelantar el control, probar otros anteojos, avisar al médico. Nunca medicación. | Decidido |
| R13 | Asistente | Lleva un asistente que usa la API de Claude (modelo Claude Haiku 5.5, esfuerzo medio, clave administrada por el responsable del proyecto). Estrictamente acotado al producto: no responde pedidos ajenos, como escribir código. | Decidido |
| R14 | Datos ficticios | Generador propio, con valor verdadero conocido. Cada imagen va marcada como simulada. | Decidido |
| R15 | Forma | Sesión guiada paso a paso, que termina en una página personal con el estado de cada ojo y su historia. | Decidido |
| R16 | Incertidumbre | Palabras atadas a un criterio numérico, número con su rango, y etiqueta en cada dato: medido, estimado o no se puede medir a bordo. | Decidido |
| R17 | Idioma de la interfaz | Inglés con opción de español. | Decidido |
| R18 | Plataforma | Aplicación web que corre en el navegador (TypeScript), publicada en Vercel con el plan gratuito. | Decidido |
| R19 | Repositorio | Lo crea el responsable del proyecto cuando haya nombre y una versión presentable, y lo pasa para subir el código. | Decidido |
| R20 | Idioma de la documentación | Español e inglés, sin idioma principal. | Decidido |
| R21 | Equipo en la web | Lo crea el responsable del proyecto más adelante. | Abierto |
| R22 | Equipo | Los otros dos integrantes trabajan junto al responsable del proyecto en la misma sesión. | Decidido |
| R23 | Demo | Diapositivas, hasta 7. Ver [entrega-y-pitch.md](entrega-y-pitch.md). | Decidido |
| R24 | Nombre | Se busca algo artístico, ligado a la identidad del astronauta, la exploración del espacio y la salud y fuerza del explorador. | Abierto |
| R25 | Ritmo | Construir ya, priorizando hacerlo bien. | Decidido |
| R26 | Autonomía y cuidados | El asistente puede crear ramas, hacer commits, instalar dependencias y reorganizar carpetas. Condiciones: todo se instala dentro del proyecto, nada global; nada que no deba publicarse llega a GitHub (clave de Anthropic, cosas personales); avisar con tiempo si el disco se acerca a 2 GB libres; no gastar dinero ni usar herramientas pagas, salvo la API de Claude. | Decidido |
| R27 | Workers | Autorizados, sin pedidos de permiso. Se puede usar Opus 5.5 en xhigh con la cuenta de Claude del responsable del proyecto. Sin límite de cuota. | Decidido |
| R28 | Otras sesiones | Quedan quietas o cerradas; se coordina desde una sola sesión. | Decidido |
| R29 | Material anterior | Columna y ejercicio archivados en `archivo/`; investigaciones integradas a `master`. | Hecho |
| R30 | Puntos de control | Tres: documento de decisiones y arquitectura; primera versión de punta a punta; versión final antes de publicar. | Decidido |
| R31 | Si falta tiempo | Menos cosas, terminadas y probadas. | Decidido |

### Ronda 2 (15 de noviembre, madrugada)

| # | Tema | Decisión | Estado |
|---|---|---|---|
| R32 | Nombre | **Lynceus**, por el argonauta de vista más aguda, vigía de la nave Argo. | Provisorio |
| R33 | Aparato y datos | Spectralis OCT2. Los exámenes ficticios se generan con el formato `.vol` de ese equipo y el motor lee ese formato. Sin servicios externos. | Decidido |
| R34 | Qué mide el motor | Hinchazón del nervio (definición de la NASA) y pliegues (ondulación de la membrana de base). Quedan afuera la coroides y los quistes. | Decidido |
| R35 | Componente entrenado | Modelo chico y legible que decide si una captura sirve para medir y cuánto error esperar. | Decidido |
| R36 | Cerebro y comunicación con Tierra | Pantalla de qué se sabe y qué no; síntomas de cabeza en el cuestionario, sin afirmar relación; "preparar la conferencia médica" con informe y preguntas. | Decidido |
| R37 | Colores y estilo | Genéricos por ahora; después se aplica un sistema de diseño e identidad. | Decidido |
| R38 | Control ante un primer indicio | Tomografía a las 4 semanas y grilla de Amsler dos veces por semana, declarado como supuesto nuestro. | Decidido |
| R39 | Tripulación ficticia | Cuatro astronautas en una misión de 180 días: sin cambio, primer indicio, nivel clínico con pliegues y caso extremo. | Decidido |
| R40 | Asistente | Alcance, negativa fija, clave fuera del repositorio, tope de gasto y funcionamiento sin conexión, como se propuso. | Decidido |
| R41 | Criterios nuevos | Los seis: rastreable, reproducible, "no puedo medir", datos en el dispositivo, letra y contraste de la NASA, supuestos en un solo lugar. | Decidido |
| R42 | Workers | Devin sin restricción y **una sola** sesión de Claude Code. | Decidido |
| R43 | Repositorio público | Código, documentación en español e inglés e investigaciones. Afuera: `archivo/`, copias locales y claves. | Decidido |

La arquitectura que resulta de estas decisiones está en [arquitectura.md](arquitectura.md), pendiente de aprobación.

## 5. Investigaciones de base sobre SANS

Están en `investigaciones/`. Cada una indica qué leyó completo y qué quedó sin verificar.

| Documento | Para qué sirve | Estado |
|---|---|---|
| `sans-oct-base-tecnica.md` | Geometría de la imagen, definición de cada medida, valores normales, ruido y algoritmos para marcar capas | Completo |
| `sans-spectralis-datos.md` | Qué entrega el Spectralis OCT2: formato de archivo, cabeceras, capas, seguimiento | Completo |
| `sans-evolucion-y-logica-clinica.md` | Evolución por día de vuelo, distribución entre personas, los cuatro niveles de la NASA y qué se hace en cada uno | Completo |
| `sans-cerebro-en-mision.md` | Qué se puede saber del lado del cerebro durante la misión y qué no | Completo |
| `comunicar-resultados-de-salud.md` | Cómo mostrar un resultado incierto: números, rangos, colores, letra, límites del análisis | Completo |
| `arquitectura-claude-y-vercel.md` | Datos de la API de Claude y de Vercel para el asistente y la publicación | Solo la tabla central |
| `pruebas-de-vision-en-pantalla.md` | Fórmulas y medidas para la agudeza visual y la grilla de Amsler en pantalla | Solo la tabla central, con celdas por verificar |
| `problemas-candidatos.md` | Comparación de 12 problemas de salud, de donde salió la elección de SANS | Completo |

## 6. Estado del trabajo (15 de noviembre, 00:45)

- **Hecho:** rondas 1 y 2 respondidas; siete investigaciones sobre SANS; material anterior archivado; guía de entrega y pitch; propuesta de arquitectura.
- **En curso:** aprobación de la arquitectura (punto de control 1).
- **Sigue:** construcción por etapas (A a G en `arquitectura.md`).
- **Investigaciones incompletas:** `arquitectura-claude-y-vercel.md` y `pruebas-de-vision-en-pantalla.md` tienen solo la tabla central.
- **Cuota de Devin:** la cuota semanal se agotó el 14 de noviembre cerca de las 23:10. Desde entonces los workers y subagentes de Devin responden con ese error; solo sigue funcionando la sesión coordinadora.
- **Copias locales de fuentes y briefs:** `~/.cache/nasa_hacka/` (fuera de `/tmp`, que se borra al reiniciar).
