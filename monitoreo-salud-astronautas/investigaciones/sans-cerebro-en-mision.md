# SANS, el lado del cerebro: qué se puede saber durante la misión

| | |
|---|---|
| **Hackatón** | NASA Space Apps Challenge 2026 — 14 y 15 de noviembre de 2026 |
| **Desafío** | *Create Health Monitoring Software for Astronauts on Space Missions* — [página oficial](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/) |
| **Fecha** | 14 de noviembre de 2026 |
| **Para qué es** | Saber **qué señales del lado del cerebro existen de verdad durante la misión** en el síndrome neuro-ocular asociado al vuelo espacial (SANS), para decidir cómo entra el cerebro en el proyecto sin afirmar de más. |
| **Qué no es** | No diseña la solución ni propone qué construir. No repite lo del ojo (tomografía de retina, umbrales), que está en el contexto común. |
| **Fuente** | Los dos informes de la NASA sobre SANS (2022 y 2024) y artículos científicos. Lista con links al final. |
| **Estado** | **Primer commit: tabla central.** Las celdas "por verificar" se completan en el segundo commit. |

### Cómo leerlo

- **Sección 1:** la tabla central, una fila por señal.
- **Sección 2:** síntesis en cuatro grupos.
- Cada dato lleva su fuente entre corchetes (`[E]`); el link está al final.
- **Respaldo**, con estas categorías: *Dato en vuelo* (medido en astronautas, en misión o comparando antes y después) · *Dato en Tierra* (personas en Tierra o en simulaciones) · *Modelo* · *Opinión experta* · *Hipótesis* · *No encontrado*.

**Términos:** **presión dentro del cráneo** (*intracranial pressure*, ICP) · **vaina del nervio óptico** (*optic nerve sheath*): la funda llena de líquido que rodea al nervio que va del ojo al cerebro; su diámetro se abrevia **ONSD** · **ventrículos**: cavidades del cerebro llenas de líquido · **líquido cefalorraquídeo** (*cerebrospinal fluid*, CSF): el líquido que baña el cerebro · **hinchazón del nervio óptico** (*optic disc edema*, ODE) · **grosor total de la retina** (TRT), la medida principal del ojo en SANS.

---

## 1. Tabla central: señales del lado del cerebro

| Señal | Qué mide | Cómo | ¿Rutina, estudio o solo antes y después? | Qué mostró en astronautas | Respaldo | Fuente |
|---|---|---|---|---|---|---|
| **Presión dentro del cráneo, directa** | La presión real del líquido que rodea al cerebro | Punción lumbar (aguja entre dos vértebras) o sensor dentro del cráneo | **Nunca en vuelo.** Solo después, y solo si hubo hinchazón clara del nervio óptico | Menos de 10 tripulantes, todos con hinchazón: **18 a 28,5 cm H2O** después del vuelo. Normal: 6 a 25. Sin dato previo al vuelo ni de tripulantes sin SANS | Dato en vuelo (solo después) | [E] |
| **Presión dentro del cráneo en ingravidez breve** | Lo mismo, durante ~20 segundos de ingravidez en avión | Sensor en pacientes en Tierra que ya tenían un acceso al cráneo | Estudio, **no son astronautas** | Sentados 4 mmHg, acostados 15 mmHg; en ingravidez bajó 3,8 mmHg respecto de acostados. Los autores concluyen que la ingravidez no la lleva a niveles patológicos | Dato en Tierra | [E] |
| **Indicadores no invasivos de presión** (estudio *Fluid Shifts*) | Señales del oído y del ojo que cambian con la presión | Por verificar | **Estudio en vuelo** | Por verificar | Dato en vuelo | Por verificar |
| **Diámetro de la vaina del nervio óptico** (ONSD) | Ancho de la funda del nervio, que en Tierra se ensancha cuando sube la presión | Ecografía del ojo en vuelo; resonancia antes y después | Ecografía del ojo: **rutina** en los controles. La medición del diámetro en sí: reportes de casos | Ensanchada en un astronauta durante y después del vuelo, y en otros después. Por resonancia, **sin cambio** en 10 astronautas tras 6 meses. En 3 astronautas ya estaba ensanchada hasta 3 años antes de volar | Dato en vuelo, resultados contradictorios | [E] |
| **Aplanamiento del ojo y protrusión de la cabeza del nervio** | Deformación de la parte de atrás del ojo | Ecografía del ojo, hecha por la tripulación | **Rutina** en los controles (días 30 y 90, cada 90, y 30 antes de volver) | Aplanamiento en ~25 % de los tripulantes de misiones largas. En vuelo es "menos confiable" que la resonancia | Dato en vuelo | [M] |
| **Flujo en las venas del cuello** | Si la sangre drena bien de la cabeza | Ecografía del cuello | **Estudio en vuelo** | Por verificar | Dato en vuelo | Por verificar |
| **Flujo en las arterias del cerebro** | Velocidad de la sangre en una arteria del cerebro, y una presión estimada | Doppler a través del cráneo + modelo | **Solo antes y después** (11 astronautas) | La velocidad de la sangre aumentó después del vuelo; la presión estimada **no cambió** | Dato en vuelo (antes y después) + Modelo | [E] |
| **Rendimiento mental** | Memoria, atención, velocidad de reacción y otras | Batería *Cognition*: 10 pruebas cortas en computadora | **Estudio de rutina** (Standard Measures): cerca del día 30 y unos 30 días antes de volver; 30 min | Relación con SANS: **no encontrada**. La NASA dice que no se sabe si los cambios del cerebro llevan a cambios cognitivos | Dato en vuelo (la prueba); No encontrado (relación) | [S], [E] |
| **Dolor de cabeza** | Síntoma | Lo reporta el astronauta | Reporte médico; frecuencia por verificar | Por verificar. Los astronautas **no** presentan los dolores de cabeza crónicos típicos de la presión alta dentro del cráneo en Tierra | Dato en vuelo | [E] |
| **Síntomas visuales** | Qué nota el astronauta | Cuestionario ocular, en cada control | **Rutina** | Cuando hay queja, suele ser de visión cercana: 48 % en misiones largas. No aparecen visión doble, oscurecimientos pasajeros ni zumbido pulsátil | Dato en vuelo | [E], [M] |
| **Dióxido de carbono de la cabina** | Gas que dilata las arterias del cerebro | Monitores en las paredes de la estación | **Rutina** (ambiental, no por persona) | Límite: 3 mmHg de promedio en 24 h. No explica SANS: en reposo en cama la hinchazón apareció con y sin dióxido de carbono agregado. No se sabe cuánto respira cada tripulante | Dato en vuelo (nivel); Dato en Tierra (relación) | [E] |
| **Sueño** | Posible efecto sobre la limpieza de líquidos del cerebro | Sensor de muñeca y cuestionarios | Rutina (Standard Measures) | Relación con SANS: sin datos. La NASA lo plantea como posible factor | Hipótesis | [E] |
| **Estructura del cerebro** | Ventrículos, posición del cerebro, espacios de líquido | Resonancia | **Solo antes** (18 a 21 meses) **y después** (~3 días) | Ventrículos **10 a 16 % más grandes** (~1 a 3 ml); cerebro desplazado hacia arriba; seguían agrandados un año después | Dato en vuelo (antes y después) | [E] |
| **Relación cerebro–ojo** | Si quien más cambia en el cerebro más cambia en el ojo | Comparar resonancia con ojo | Solo antes y después | **Contradictoria:** un estudio halló menos cambio de ventrículos en quienes tenían SANS (7 contra 11); otro halló una relación positiva pequeña (19 astronautas) | Dato en vuelo, sin acuerdo | [E] |

> **Dato clave:** la NASA dice que es razonable suponer que la presión dentro del cráneo está algo elevada en SANS, pero que **"no se midió durante el vuelo, así que no se puede sacar ninguna conclusión definitiva en vuelo"** [M].

---

## 2. Síntesis en cuatro grupos

| Grupo | Señales |
|---|---|
| **Se mide de rutina en misión** | Ecografía del ojo (aplanamiento, protrusión de la cabeza del nervio) · cuestionario ocular y síntomas · dióxido de carbono de la cabina (ambiental) · batería de rendimiento mental y sueño (como parte de un estudio estándar, sin relación establecida con SANS) |
| **Se midió en estudios en misión** | Indicadores no invasivos de presión (*Fluid Shifts*) · flujo en las venas del cuello · diámetro de la vaina del nervio óptico por ecografía |
| **Solo antes y después** | Resonancia del cerebro (ventrículos, desplazamiento, espacios de líquido) · Doppler de las arterias del cerebro con presión estimada · punción lumbar (solo después, y solo en casos con hinchazón clara) |
| **No se puede saber en misión** | La presión real dentro del cráneo · el tamaño de los ventrículos y la posición del cerebro · si los cambios del cerebro afectan el rendimiento mental · si lo del cerebro causa lo del ojo |

---

## Lo no verificado (primer commit)

- Las celdas "por verificar": indicadores no invasivos de presión, venas del cuello y dolor de cabeza. Se completan en el segundo commit.
- Los estudios citados a través del informe de la NASA [E] no los leí uno por uno; las cifras son las que da el informe.

## Fuentes

| ID | Fuente | Texto completo |
|---|---|---|
| E | [NASA, Evidence Report: Risk of Spaceflight Associated Neuro-ocular Syndrome (SANS), 2022](https://humanresearchroadmap.nasa.gov/evidence/reports/SANS%20EB%202022%20FINAL_8-15-22.pdf) | Sí (secciones de presión, estructura del cerebro, dióxido de carbono y comparación con la hipertensión dentro del cráneo) |
| M | [NASA, OCHMO-MTB-001: SANS, 2024](https://www.nasa.gov/wp-content/uploads/2024/02/ochmo-mtb-001-sans.pdf) | Sí |
| S | [Spaceflight Standard Measures, npj Microgravity 2025](https://www.nature.com/articles/s41526-025-00532-6) y su material suplementario | Sí |
