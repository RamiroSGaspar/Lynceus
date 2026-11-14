# Ejercicio y columna: cuánto la carga y cuánto la protege

| | |
|---|---|
| **Hackatón** | NASA Space Apps Challenge 2026 — 14 y 15 de noviembre de 2026 |
| **Desafío** | *Create Health Monitoring Software for Astronauts on Space Missions* — [página oficial](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/) |
| **Fecha** | 14 de noviembre de 2026 |
| **Para qué es** | Cerrar dos huecos del enfoque "la columna a través del ejercicio": **qué ejercicios cargan la columna y cuánto** (Parte A) y **cuánto protege el ejercicio a la columna** (Parte B). |
| **Qué no es** | No propone ideas ni soluciones. No cubre quién arma la rutina, equipos de naves futuras, valores para simular datos, comunicación de datos de salud, tratamientos del dolor ni datos abiertos: los ven otras personas del equipo. |
| **Fuente** | Reportes de la NASA, páginas de la ESA y artículos científicos, leídos en texto completo salvo donde se indica. Lista con links en la sección de fuentes. |
| **Estado** | Parte A terminada. La Parte B y la síntesis se agregan en el commit siguiente. |

### Cómo leerlo

- **Parte A:** por dónde entra la carga, cuánta es, qué pasó con las tres afirmaciones "a verificar" y qué se registra.
- Cada dato lleva su **fuente** entre corchetes (`[F8]`); el link está en la sección de fuentes. Un asterisco (`[F13*]`) indica que **no conseguí el texto completo** y la cifra figura solo como resumen.
- **Nivel de respaldo**, con estas categorías:

| Categoría | Significado |
|---|---|
| Dato en vuelo | Medido en astronautas, en misión o comparando antes y después |
| Dato en Tierra | Medido en personas en Tierra o en simulaciones (reposo en cama, etc.) |
| Modelo | Calculado con un modelo, no medido |
| Opinión experta | Recomendación o juicio de un panel o una revisión |
| Hipótesis | Planteado como posibilidad, sin evidencia directa |
| No encontrado | Buscado y no hallado |

**Equipos de la estación:** **ARED** = máquina de fuerza que imita las pesas · **T2** = cinta de correr · **CEVIS** = bicicleta fija.

---

# Parte A — Qué ejercicios cargan la columna y cuánto

## A1. Por dónde entra la carga

"Cargar la columna a lo largo" quiere decir comprimirla de arriba hacia abajo, como hace el peso del cuerpo en la Tierra.

| Equipo y ejercicio | Por dónde entra la carga | ¿Carga la columna a lo largo? | Respaldo |
|---|---|---|---|
| **ARED, sentadilla** | Barra apoyada sobre los hombros. En microgravedad el peso del cuerpo no suma: toda la carga la da la barra [F8] | **Sí.** La carga baja de los hombros a los pies pasando por la espalda [F8, F5] | Modelo y Opinión experta |
| **ARED, peso muerto** | Barra tomada con las manos, desde abajo [F16, F31] | **Sí.** Un modelo calcula la compresión en las vértebras lumbares durante este ejercicio [F16] | Modelo |
| **ARED, elevación de talones** | Se parte de pie con la barra, igual que en la sentadilla [F31] | Probable, por la misma vía. No encontré una fuente que lo mida | No encontrado |
| **ARED, otros** (press de banca, ejercicios con cable) | Barra o cables, según el ejercicio [F31, F4] | No encontrado | No encontrado |
| **Cinta T2** | Arnés en hombros y cadera, tirado hacia la cinta por elásticos [F4, F10] | **En parte.** Solo lo que va a los hombros baja por la columna; lo que va a la cadera no la atraviesa (inferencia mía a partir de la descripción del arnés) | Dato en vuelo para el reparto; inferencia para la columna |
| **Bicicleta CEVIS** | El astronauta se sujeta al cuadro con un cinturón o se toma de los manillares [F4]. No hay nada que reemplace el peso del cuerpo | No encontré medición | No encontrado |

> **Dato clave:** en la cinta se recomienda repartir **70 % en la cadera y 30 % en los hombros**, pero en la prueba hecha en la estación los tripulantes **cargaban más los hombros** que la cadera [F10].

## A2. Cuánta carga es

| Qué | Valor | Tipo | Fuente |
|---|---|---|---|
| Capacidad de ARED | Hasta 272 kg con barra. Permite 2 a 3 veces el peso corporal, lo que se considera necesario para mantener el hueso | Dato del equipo | [F31, F3, F2] |
| Carga usada en ARED (mediana de 46 astronautas) | Sentadilla 181 libras (~82 kg), peso muerto 192 (~87 kg), elevación de talones 239 (~108 kg) | Dato en vuelo | [F4] |
| Sentadilla comparada con la Tierra | Ejemplo: en Tierra, 76 kg de cuerpo + 86 kg de barra = 162 kg. En vuelo la barra tendría que dar los 162 kg; al inicio de la misión se usan menos (122 kg en el ejemplo) | Modelo | [F8] |
| Cómo se ejecuta en vuelo | La sentadilla y el peso muerto se hacen distinto que en Tierra: no se vuelve a quedar erguido del todo y el apoyo se corre hacia la punta del pie. Los autores estiman que eso **reduce la carga sobre el hueso** (4 tripulantes, por video) | Dato en vuelo (movimiento); la carga es estimada | [F9] |
| Arnés de la cinta | Se empieza en 50–60 % del peso corporal y la mayoría queda en **70–80 %**. Casi nadie llega al 100 % por la molestia en hombros y cadera | Dato en vuelo | [F3, F4] |
| Carga real del arnés en movimiento | **15 a 20 % menor** que el valor de tabla que usan los entrenadores (3 tripulantes con datos) | Dato en vuelo | [F10] |
| Fuerza en los pies al caminar en la cinta | 0,89 veces el peso, contra 1,18 en la Tierra (−25 %) | Dato en vuelo (4 tripulantes, misiones anteriores a la cinta actual) | [F11] |
| Fuerza en los pies al correr en la cinta | 1,28 veces el peso, contra 2,36 en la Tierra (**−46 %**) | Dato en vuelo (4 tripulantes, misiones anteriores a la cinta actual) | [F11] |
| Compresión de la vértebra en peso muerto | Relación entre carga y resistencia de la vértebra: hasta 0,45 (la fractura se predice en 1) | Modelo; los autores avisan que puede subestimar | [F16] |
| Bicicleta | Trabaja entre 25 y 350 W. Carga sobre la columna: no encontrada | Dato del equipo | [F3, F4] |

- **Solo resumen, sin verificar [F13*]:** con la cinta T2 (7 astronautas) las fuerzas al correr también fueron menores que en Tierra a igual velocidad, y subían con la velocidad y con la carga del arnés.

## A3. Las tres afirmaciones "a verificar"

| Afirmación del documento de enfoque | Resultado | Qué dicen las fuentes |
|---|---|---|
| **1.** El peso muerto y la sentadilla en ARED cargan la columna | **Confirmada, con un matiz** | La carga entra por los hombros o las manos y pasa por la espalda [F8, F5, F16]. Matiz: no hay una medición de cuánta llega a la columna, y en vuelo se ejecutan de un modo que probablemente la reduce [F9] |
| **2.** La carga del arnés de la cinta (70–80 % del peso) pasa por la columna | **Corregida** | Pasa solo la parte que va a los hombros; el resto va a la cadera. El reparto recomendado deja 30 % en los hombros, pero en la práctica fue más [F10]. Además, la carga real es menor que la nominal y las fuerzas al correr son casi la mitad que en Tierra [F10, F11] |
| **3.** La bicicleta carga poco la columna y sirve más al corazón | **Sin medición que la confirme** | Es coherente con el equipo: no hay arnés ni barra, solo un cinturón al cuadro [F4]. No encontré ninguna fuente que mida o calcule la carga sobre la columna al pedalear. En 20 años de uso no se reportó dolor lumbar por la bicicleta [F1] |

## A4. Fuerzas internas: qué se sabe y qué no

- **No se miden.** No encontré ninguna medición directa de las fuerzas dentro de los huesos o los músculos de la columna durante el ejercicio en microgravedad.
- **Se calculan con modelos.** La NASA tiene modelos del cuerpo para la sentadilla en ARED [F8], y un estudio calculó la compresión lumbar en varias posturas, incluido el peso muerto [F16]. Ese modelo está validado solo para posturas casi quietas.
- **Hay un experimento en curso.** *ARED Kinematics* (Politécnico de Milán, con apoyo de la ESA) busca saber cómo el ejercicio de fuerza afecta la carga en las articulaciones y la activación de los músculos. En julio de 2026 seguía tomando datos [F14]. La NASA menciona un resultado sobre el entrenamiento previo al vuelo, pero no encontré resultados publicados sobre fuerzas internas [F15].
- **En la cinta** la NASA registra las fuerzas contra el piso para calcular después las cargas en articulaciones y músculos; el documento que leí describe el método, sin resultados [F12].
- **Qué sí se midió en vuelo:** fuerza en los pies [F11], reparto de carga del arnés [F10] y forma del movimiento [F9].

## A5. Qué se registra de rutina y cómo se describe la "dosis"

| Equipo | Qué se registra | Cómo | Fuente |
|---|---|---|---|
| Cinta T2 | Tiempo, velocidad, pulso y carga del arnés | Archivos de la máquina, que se bajan una vez por semana. La carga del arnés se mide con el astronauta quieto, con sensores en la superficie de la cinta | [F3, F6] |
| Bicicleta CEVIS | Tiempo, potencia, cadencia y pulso | Archivos de la máquina, igual que la cinta | [F3, F4] |
| ARED | Ejercicio, carga, series y repeticiones | Lo anota el astronauta en una computadora (dato de 2016) | [F3] |

**Cómo describen la dosis las fuentes:**

- **Volumen de fuerza:** carga × repeticiones, sumado en toda la misión y dividido por los días de misión [F4].
- **Volumen aeróbico:** tiempo × carga [F4].
- **Otros:** cantidad de sesiones, carga promedio, carga relativa al peso corporal y tiempo por encima del 70 % y del 90 % del pulso máximo [F4].
- **Estudios más viejos:** minutos por semana en cinta y bicicleta, y sesiones de fuerza por semana, según registros que llenaba el astronauta [F17, F18].
- **Progresión:** la carga de fuerza sube 3 a 5 % por semana, apuntando al 80 % o más de la capacidad máxima de cada uno [F3].

---

## Lo no verificado en la Parte A

- **Tesis del Politécnico de Milán** (Ravizza) [F30*]: el sitio rechazó la consulta. Lo que se le atribuía, que la barra sobre los hombros causa molestia en la espalda, lo dice un documento de la NASA que sí leí: los puntos de presión de la barra y la carga en los hombros, que se traslada a la espalda, obligan a bajar la carga al inicio de la misión [F8].
- **De Witt 2014** [F13*]: artículo de pago; solo el resumen.
- **Elevación de talones y demás ejercicios de ARED:** no encontré por dónde pasa la carga ni cuánta es.
- **Fuerzas en los pies:** los datos medidos son de 4 tripulantes y de la cinta anterior a la actual.
- **Anotación manual en ARED:** el dato es de 2016; no encontré si cambió.

---

## Fuentes

**Texto completo:** *Sí* = conseguido y leído (en documentos largos, las secciones de donde salen las cifras) · *No* = solo el resumen, con el motivo.

| ID | Fuente | Texto completo |
|---|---|---|
| F1 | [NASA 2018 Spine Workshop, informe](https://ntrs.nasa.gov/api/citations/20205004306/downloads/20205004306-TM-20205004306.pdf) | Sí |
| F2 | [NASA, Evidence Report: Risk of Bone Fracture, 2024](https://ntrs.nasa.gov/citations/20240005190) | Sí |
| F3 | [Petersen 2016, el ejercicio en vuelo según la ESA](https://pmc.ncbi.nlm.nih.gov/articles/PMC4971634/) | Sí |
| F4 | [Scott 2023, efectos del ejercicio en vuelo en 46 astronautas](https://www.nature.com/articles/s41526-023-00256-5) | Sí |
| F5 | [Green y Scott 2018, salud de la columna en vuelo](https://pmc.ncbi.nlm.nih.gov/articles/PMC5778142/) | Sí |
| F6 | [NASA, Changes in Exercise Data Management](https://ntrs.nasa.gov/citations/20170009916) | Sí (el documento es un resumen) |
| F8 | [NASA, A Better ARED Squat](https://ntrs.nasa.gov/citations/20140004049) | Sí |
| F9 | [NASA, ISS Squat and Deadlift Kinematics on the ARED](https://ntrs.nasa.gov/citations/20140013188) | Sí |
| F10 | [NASA, Harness SDTO: informe final del arnés de la cinta](https://www1.grc.nasa.gov/wp-content/uploads/PI-Final-Report-3_1_11.pdf) | Sí |
| F11 | [NASA, Foot Reaction Forces during Long Duration Space Flight](https://ntrs.nasa.gov/citations/20080009737) | Sí |
| F12 | [NASA, Biomechanical Analysis of Treadmill Locomotion on the ISS](https://ntrs.nasa.gov/citations/20110023081) | Sí |
| F13* | [De Witt 2014, fuerzas contra el piso al correr en microgravedad](https://doi.org/10.1016/j.jbiomech.2014.04.034) | No: de pago, sin copia abierta |
| F14 | [ESA, Staying strong in orbit with ARED](https://blogs.esa.int/exploration/staying-strong-in-orbit-with-ared/) | Sí |
| F15 | [NASA, Counteracting Bone and Muscle Loss in Microgravity](https://www.nasa.gov/missions/station/iss-research/counteracting-bone-and-muscle-loss-in-microgravity/) | Sí |
| F16 | [Burkhart 2020, resistencia vertebral](https://doi.org/10.1002/jbmr.3881) | Sí, versión enviada a la revista, en la [tesis de la autora](https://dspace.mit.edu/handle/1721.1/122344) |
| F17 | [Burkhart 2019, músculos paraespinales](https://doi.org/10.1097/brs.0000000000002959) | Sí, reimpreso en la [misma tesis](https://dspace.mit.edu/handle/1721.1/122344) |
| F18 | [McNamara 2019, músculos lumbares y pélvicos tras el vuelo](https://doi.org/10.3389/fphys.2019.00627) | Sí |
| F30* | [Ravizza, tesis del Politécnico de Milán](https://www.politesi.polimi.it/bitstream/10589/150121/3/Thesis_Ravizza_Martina.pdf) | No: el sitio rechazó la consulta |
| F31 | [NASA, descripción técnica de ARED, 2006](https://ntrs.nasa.gov/citations/20060028227) | Sí |
