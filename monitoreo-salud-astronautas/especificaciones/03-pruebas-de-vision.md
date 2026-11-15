# Especificación 03 — Pruebas de visión: cuestionario, agudeza de cerca y grilla de Amsler

| | |
|---|---|
| **Fecha** | 15 de noviembre de 2026 |
| **Para quién** | El agente que construye las pruebas que el astronauta hace en la pantalla. |
| **De dónde sale** | `arquitectura.md` (sección 7) e `investigaciones/pruebas-de-vision-en-pantalla.md`, que es la fuente de cada parámetro: leerla completa antes de empezar. |
| **Reglas generales** | `AGENTS.md`. Valen todas. |

## 0. Alcance

Son las tres pruebas funcionales de la serie de la NASA, y acá son **reales**: las hace la persona frente a la pantalla y se puntúan de verdad.

**Carpetas propias:** `packages/core/src/vision/` (lógica pura y con pruebas: geometría, procedimiento adaptativo, puntaje) y `apps/web/src/features/vision/` (pantallas y sus textos en dos idiomas). No tocar el resto. Los tipos de resultado ya están en `packages/core/src/contract.ts`, sección *Vision tests*: `ScreenCalibration`, `AcuityResult`, `AmslerResult`, `SymptomAnswers`. Esa sección se puede ajustar si la prueba lo necesita, avisando en el informe; las reglas del producto las consume otro agente.

Los tres pasos se integran en la sesión guiada con estas propiedades (sección 6 de `02-interfaz.md`):

```ts
function SymptomsStep(props: { onComplete(answers: SymptomAnswers): void; onSkip(): void }): JSX.Element;
function AcuityStep(props: {
  onComplete(result: { calibration: ScreenCalibration; OD: AcuityResult; OS: AcuityResult }): void;
  onSkip(): void;
}): JSX.Element;
function AmslerStep(props: {
  calibration: ScreenCalibration | null;
  onComplete(result: { OD: AmslerResult; OS: AmslerResult }): void;
  onSkip(): void;
}): JSX.Element;
```

Para probarlas sin el resto de la aplicación, dejar una página de desarrollo (`#/dev/vision`) que las muestre de a una y enseñe el resultado. Usar las piezas de `src/ui`, los textos de `src/i18n` y las variables de `src/styles/tokens.css`; sin librerías nuevas.

## 1. Cuestionario de síntomas

- El formulario de la NASA no es público, pero su contenido está descrito (sección 6.1 de la investigación): pregunta de entrada, temas, tres grados y otros síntomas. El nuestro sigue esos temas con redacción propia, y eso se dice en pantalla.
- **Pregunta de entrada:** si notó algún cambio en la visión desde el lanzamiento o desde el último examen. Si responde que no, igual se preguntan los dos síntomas que no pueden esperar y los otros síntomas; los temas de visión quedan como ausentes.
- **Por síntoma presente:** grado (leve: no afecta las actividades; moderado: tuvo que adaptarse pero completó todo; grave: afectó o impidió actividades) y qué ojo, cuando aplica.
- **Anteojos** que usa de cerca.
- **Dos preguntas aparte, primero:** pérdida brusca de visión y mancha oscura nueva. Si alguna es que sí, la pantalla lo dice en el momento, con la clase de advertencia: que avise al médico ya, sin esperar el resto del control. El control puede continuar.
- **Dolor de cabeza y otros:** se registran sin afirmar relación con el ojo. Texto fijo debajo: en un estudio, 22 de 24 astronautas tuvieron dolor de cabeza en la estación, y no se encontró relación con el síndrome (sección 6.3).
- Lleva menos de dos minutos. Una pregunta por vez o agrupadas de a pocas; botones grandes; todo con teclado.

## 2. Agudeza visual de cerca

Parámetros y fórmulas: secciones 1.A, 1.C y 2 de la investigación.

1. **Calibrar la pantalla** con el método de la tarjeta (85,60 mm de ancho): la persona ajusta un rectángulo hasta que coincide con una tarjeta apoyada en la pantalla. Resultado: píxeles por milímetro. Se guarda y se puede repetir. Se pide no cambiar el zoom después.
2. **Distancia: 40 cm**, la de la estación. Mostrar cómo medirla de forma simple y pedir que se mantenga.
3. **Lo que esta pantalla puede medir:** con la calibración se calcula el valor más fino que se puede dibujar (trazo de medio píxel con suavizado, como acepta FrACT) y se informa antes de empezar. Si la pantalla no alcanza para medir visión normal, se dice, y el resultado queda marcado `atScreenFloor` cuando corresponda.
4. **Figura:** C de Landolt, ocho orientaciones, oscura sobre fondo claro, con la geometría de la norma (alto de cinco trazos, abertura de un trazo). El área de la prueba es clara aunque la aplicación sea oscura. Dibujada con precisión menor a un píxel.
5. **Un ojo por vez**, tapando el otro; primero el derecho. Se pregunta si usa su corrección de cerca.
6. **Respuesta obligada** en ocho direcciones: flechas y teclado numérico, y ocho botones grandes en pantalla para tacto. No hay "no veo".
7. **Procedimiento adaptativo:** *Best PEST*, como FrACT: cada presentación en el umbral estimado hasta ese momento; 18 presentaciones; umbral en el punto medio entre el azar (12,5 %) y 100 %. Azar con semilla para poder probarlo.
8. **Resultado:** logMAR por ojo, con su equivalente en la notación 20/x, cantidad de presentaciones y aciertos. Junto al número, siempre: que la variación normal de esta prueba es de ±0,17 logMAR con 18 presentaciones, así que **una línea de diferencia (0,1) no es un cambio**.
9. Si la prueba no converge (respuestas al azar), `logMar: null` y se ofrece repetir.

## 3. Grilla de Amsler

Parámetros: secciones 1.B y 4 de la investigación.

- **Tamaño real** con la calibración: cuadros de 1° a 40 cm (6,98 mm), 20 × 20 si entra en la pantalla; si no, la mayor grilla par que entre, y se informa el campo cubierto. Punto de fijación en el centro. Líneas claras sobre fondo oscuro o al revés: elegir una y decir por qué.
- **Un ojo por vez**, a 40 cm, mirando siempre el punto central.
- **Primero:** ¿ves las cuatro esquinas mientras mirás el punto? (`cornersSeen`).
- **Marcar** las zonas donde las líneas se ven onduladas, borrosas o faltan: se elige el tipo y se pintan cuadros con el dedo, el mouse o el teclado. Se puede borrar. "No veo nada raro" es una respuesta válida y explícita.
- **Resultado:** cuadros marcados con su tipo, fracción marcada y si hay marcas en los 2° centrales.
- **Texto fijo:** qué es un resultado positivo para la NASA (líneas onduladas, borrosas o faltantes), y que la grilla detecta entre 67 y 78 % de los casos de enfermedad de la mácula en Tierra y se le escapa el resto; para los hallazgos de este síndrome no hay dato. Un resultado limpio no descarta nada.
- La prueba no saca conclusiones: las reglas del producto deciden qué hacer con el resultado.

## 4. Lógica en el núcleo y pruebas

En `packages/core/src/vision/`, sin DOM:

| Función | Prueba |
|---|---|
| Tamaño de la figura en milímetros y en píxeles para un logMAR, una distancia y una calibración | Los ejemplos de la sección 1.A: 0,582 mm de alto y 0,116 mm de trazo para 20/20 a 40 cm |
| Piso de la pantalla (logMAR más fino que se puede dibujar) | 141 píxeles por pulgada da +0,19 con trazo de un píxel |
| Conversión logMAR ↔ 20/x ↔ decimal | Valores conocidos |
| Procedimiento adaptativo | Con un observador simulado de umbral conocido, el resultado queda dentro de ±0,1 logMAR en el 90 % de 200 corridas; con respuestas al azar, no converge |
| Geometría de la grilla: lado del cuadro, campo cubierto, cuadros centrales | Los ejemplos de la sección 1.B |
| Resumen de la grilla: fracción marcada y marca central | Casos a mano |
| Estado inicial y validación de `SymptomAnswers` | Todas las claves presentes |

En la interfaz: cada paso se completa con teclado solo y con tacto solo; se ve bien a 390 px de ancho; los dos idiomas. `pnpm verify` y `pnpm build` en verde.

## 5. Entrega

Commits chicos con rutas explícitas. Informe final corto: commits, cantidad de pruebas, qué mide y qué no cada prueba en una pantalla común, cambios al contrato y lo que se vea flojo.
