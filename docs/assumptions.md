# Supuestos del proyecto / Project assumptions

[Español: inicio](../README.es.md) · [English: home](../README.md)

Este es el registro central. A01–A20 conservan la numeración que antes tenía la
sección 12 de arquitectura. A21–A23 hacen explícitas decisiones ya implementadas;
documentarlas no cambia el comportamiento. No son afirmaciones de NASA.

This is the central register. A01–A20 preserve the former architecture section 12
numbering. A21–A23 make existing implementation choices explicit; documenting them
does not change behavior. They are not NASA claims.

## Decisiones y alcance / Choices and scope

| ID | Español | English |
|---|---|---|
| A01 | Frecuencias extra de seguimiento: primer indicio, OCT a 4 semanas y Amsler dos veces por semana; nivel clínicamente preocupante, OCT a 3 semanas. Se inspiran en publicaciones y decisiones del proyecto; no hay un protocolo público completo de NASA para adoptarlas como regla universal. | Additional follow-up: first sign, OCT after 4 weeks and Amsler twice weekly; clinically concerning level, OCT after 3 weeks. Informed by publications and project choices, not a complete public NASA protocol or universal rule. |
| A02 | Clase de aviso y urgencia de contacto asignadas a cada nivel y hallazgo por el proyecto. No implican aprobación de NASA de esta implementación. | Alert class and contact urgency are assigned to each level and finding by the project; NASA has not approved this implementation. |
| A03 | Palabras según probabilidad de superar un umbral: < 10 % improbable; 10–< 50 % posible; 50–< 90 % probable; ≥ 90 % muy probable. | Threshold-exceedance wording: < 10% unlikely; 10–< 50% possible; 50–< 90% likely; ≥ 90% very likely. |
| A04 | Aproximación de los anillos mediante columnas válidas de los cortes radiales (hasta 96 radios), ponderadas por distancia al centro. NASA interpola un mapa; no se afirma equivalencia exacta. | Ring approximation using valid columns of radial scans (up to 96 radii), weighted by distance from the center. NASA interpolates a map; exact equivalence is not claimed. |
| A05 | Marcado automático de bordes y abertura. El flujo de referencia incluye corrección manual por expertos; el prototipo no la reproduce. | Automatic boundary and opening detection. The reference workflow includes expert manual correction, which the prototype does not reproduce. |
| A06 | Empeoramiento de agudeza de cerca ≥ 0,2 logMAR se trata como cambio relevante. Es un umbral operativo propio, no validado para este uso. El margen ±0,17 logMAR viene de una prueba a otra distancia y su traslado a visión de cerca es una aproximación. | Near-acuity worsening ≥ 0.2 logMAR is treated as meaningful. This is an unvalidated project operating threshold. The ±0.17 logMAR repeatability margin comes from a test at another distance; transfer to near vision is approximate. |
| A07 | Redacción y graduación del cuestionario de síntomas: propias, inspiradas en los temas publicados. No es una reproducción del formulario NASA. | Symptom questionnaire wording and grading are project choices inspired by published topics, not a reproduction of NASA's form. |
| A08 | Cuatro personajes, nombres, misión de 180 días y curvas exactas inventados. Los casos publicados orientan los escenarios, no los convierten en pacientes reales. | Four fictional characters, names, a 180-day mission and exact trajectories. Published cases inform the scenarios; these are not real patients. |
| A09 | Modelo de ruido, sombras, reflectividad y fallos del instrumento virtual. El realismo visual no prueba fidelidad física o clínica. | Noise, shadows, reflectivity and failure models of the virtual instrument. Visual realism does not establish physical or clinical fidelity. |
| A10 | Hasta tres intentos de captura por ojo antes de registrar que no se puede medir. | Up to three capture attempts per eye before recording that it cannot be measured. |
| A11 | Agudeza: función logística en logMAR, pendiente 15/logMAR, 2 % de lapsos; cuatro tamaños iniciales 1,0; 0,7; 0,4; 0,1 logMAR; máximo 1,3 logMAR. No converge fuera de ese máximo o si una prueba de razón de verosimilitud al 5 % no distingue las respuestas del azar. No se leyeron los parámetros internos de FrACT para copiarlos. | Acuity: logistic function in logMAR, slope 15/logMAR, 2% lapses; four initial sizes 1.0, 0.7, 0.4, 0.1 logMAR; maximum 1.3 logMAR. No convergence beyond that maximum or when a 5% likelihood-ratio test cannot distinguish responses from guessing. FrACT's internal parameters were not inspected or copied. |
| A12 | La historia se genera con hasta tres intentos también en las referencias. Si falla una referencia, no se publica ese conjunto. Los controles adicionales se obtienen de las reglas aplicadas al motor. | History generation allows up to three attempts for references too. A failed reference prevents publishing that dataset. Additional controls follow the rules applied to engine results. |
| A13 | Visión y síntomas de controles históricos son escenarios ficticios, no resultados extraídos de OCT. | Historical vision and symptom records are fictional scenarios, not OCT-derived results. |
| A14 | La versión del instrumento identifica cambios de píxeles o cabeceras para un mismo pedido. Antes de introducirla, la historia identificaba formatos y pedidos, no una versión propia del instrumento. | Instrument version identifies changes to pixels or headers for the same request. Earlier history identified formats and requests rather than an instrument-specific version. |
| A15 | Matriz de validación y frecuencia de fallos elegidas para el experimento, no prevalencia en misión. Los fallos explícitos apuntan a 30 dB sin variación entre cortes. La segunda referencia de cada ojo, intento 9 del día 0, incorpora el pequeño error de registro de seguimiento. | Validation matrix and failure frequency are experimental choices, not mission prevalence. Explicit failures target 30 dB without scan-to-scan variation. Each eye's second reference, attempt 9 on day 0, includes the small follow-up registration error. |
| A16 | Anatomía apartada: C. Fallos apartados: borde apagado y combinaciones sobre A, B y D. La prueba de anatomía nueva abarca dos ojos de una sola persona ficticia. | Held-out anatomy: C. Held-out failures: edge fade and combinations on A, B and D. The new-anatomy test contains two eyes from one fictional person. |
| A17 | Candidato: error normal de media cero, sin corrección de sesgo; σ = k·√(s(hoy)²+s(referencia)²), s = exp(β₀+Σβ·z). Siete variables candidatas, selección por validación cruzada dejando un personaje afuera, mejora mínima 2 en log-verosimilitud, hasta tres variables y coeficientes no negativos. k = max(1, q95 de los errores normalizados absolutos / 1,96). Solo se evalúa sobre errores sintéticos. | Candidate: zero-mean normal error, without bias correction; σ = k·√(s(today)²+s(reference)²), s = exp(β₀+Σβ·z). Seven candidate features, leave-one-character-out selection, minimum log-likelihood gain 2, up to three features and nonnegative coefficients. k = max(1, q95 of absolute normalized errors / 1.96). Evaluated only on synthetic errors. |
| A18 | Dominio del candidato: dato no finito o variable peor que el máximo de desarrollo implica «no puedo medir». Del lado mejor se recorta al mínimo de desarrollo. Solo aplica si se elige ese modelo; actualmente no está activo. | Candidate domain: a nonfinite feature or one worse than the development maximum means “cannot measure”. Better values are clipped to the development minimum. Applies only when this model is selected; it is currently inactive. |
| A19 | Activación del candidato: máximo error absoluto por par de TRT ≤ 6 µm y rugosidad ≤ 1,5 µm; cobertura ≥ 90 % y límite inferior de Wilson ≥ 85 %; ≤ 2 % más allá de 3 desvíos; ≥ 50 pares por prueba; ≤ 10 % de capturas limpias fuera del dominio. Deben cumplirse en las pruebas finales correspondientes. Son tolerancias de ingeniería propias. | Candidate activation: maximum absolute paired TRT error ≤ 6 µm and roughness error ≤ 1.5 µm; coverage ≥ 90% and Wilson lower bound ≥ 85%; ≤ 2% beyond 3 standard errors; ≥ 50 pairs per test; ≤ 10% clean captures outside the domain. Required in the corresponding final tests. These are project engineering tolerances. |
| A20 | El índice de calidad de una captura limpia ronda 25 dB según el simulador. No es una calibración validada del equipo real y no se elevó para cumplir la expectativa inicial de 27 dB. | A clean simulated capture is around 25 dB. This is not a validated calibration of the real instrument and was not increased to meet the initial 27 dB expectation. |
| A21 | Modelo provisorio activo: error por examen de TRT de 3 µm a ≥ 27 dB, creciendo linealmente hasta 6 µm a 15 dB; rugosidad 0,8 µm. Combina referencia y control por raíz de suma de cuadrados y usa aproximación normal y ±1,96σ. Supone independencia, sin demostrar calibración ni cobertura. | Active provisional model: per-exam TRT error 3 µm at ≥ 27 dB, increasing linearly to 6 µm at 15 dB; roughness 0.8 µm. Combines reference and current error by root-sum-of-squares and uses a normal approximation and ±1.96σ. Assumes independence without established calibration or coverage. |
| A22 | Reglas funcionales del proyecto: una marca central de Amsler o marcas en ≥ 5 % de la grilla pueden activar el nivel agudo; síntomas visuales agudos actúan aun sin imagen. Son reglas de este prototipo, no un protocolo clínico validado. | Project functional rules: a central Amsler mark or marks covering ≥ 5% of the grid can trigger the acute level; acute visual symptoms act even without an image. These are prototype rules, not a validated clinical protocol. |
| A23 | Aproximaciones internas: posición de columnas, distancia radial, representación óptica de tejidos y vasos, movimiento, suavizado, ajuste de elipse, coberturas y umbrales del segmentador. Se documentan en el anexo técnico enlazado abajo; no equivalen a una calibración del Spectralis ni a lectura clínica experta. | Internal approximations: column positions, radial distance, optical tissue and vessel rendering, motion, smoothing, ellipse fitting, coverage and segmentation thresholds. Detailed in the technical appendix below; they do not establish Spectralis calibration or expert clinical reading. |

## Respaldo de las decisiones / Implementation references

- A01–A03, A06, A22: [reglas y constantes / rules and constants](../packages/core/src/rules/)
  y [especificación 04 / specification 04](../monitoreo-salud-astronautas/especificaciones/04-reglas-y-textos.md).
- A04–A05, A09, A20, A23: [anexo técnico del núcleo / core technical appendix](../packages/core/NOTES.md).
- A07, A11: [pruebas de visión / vision tests](../monitoreo-salud-astronautas/especificaciones/03-pruebas-de-vision.md).
- A08, A10, A12–A14: [arquitectura / architecture](../monitoreo-salud-astronautas/arquitectura.md).
- A15–A19: [protocolo / protocol](../packages/validation/protocol.md),
  [informe / report](../packages/validation/out/quality-validation.md),
  [modelo candidato / candidate model](../packages/core/src/rules/simulatedErrorModel.ts).
- A21: [modelo provisorio / provisional model](../packages/core/src/rules/errorModel.ts)
  y [probabilidad / probability](../packages/core/src/rules/probability.ts).

Los umbrales publicados se documentan aparte en [evidencia en español](es/evidence.md)
y [evidence in English](en/evidence.md). Las decisiones nuevas deben agregarse aquí,
con ID estable, en el mismo cambio que las introduce.

Published thresholds are documented separately in the evidence pages. Add new
choices here, with a stable ID, in the same change that introduces them.
