# Especificación 07 — Referencias e historia obtenidas del motor

## Objetivo y alcance

La aplicación ya está integrada en `master`, incluida la captura real en un Web
Worker. Sin embargo, `getHistory` todavía crea los exámenes anteriores mediante
tablas y errores inventados en `packages/core/src/dataset/provisional.ts`.
El examen de antes del vuelo también sale de esas tablas. Por eso un resultado
actual medido sobre una imagen se compara con una referencia que nunca se midió.
En B OS se observó una diferencia de aproximadamente 4,5 µm.

Reemplazar ese camino de producción por referencias e historia precalculadas con
el instrumento y el motor existentes. No cambiar anatomía, ruido, umbrales,
segmentación, colores ni reglas para obtener resultados deseados.

Esta tarea NO entrena el modelo de calidad ni estima una nueva incertidumbre.
El modelo de error provisorio continúa identificado como tal. No crear un
`VALIDATION_SUMMARY` ni presentar la generación de historia como validación clínica.

## Lectura inicial

1. `AGENTS.md` y `monitoreo-salud-astronautas/arquitectura.md`.
2. `packages/core/NOTES.md`, especialmente decisiones y limitaciones.
3. `packages/core/src/contract.ts`, `dataset/provisional.ts`,
   `rules/assess.ts`, `rules/errorModel.ts`, `engine/analyze.ts`.
4. `packages/validation/src/accuracy.ts` y sus utilidades: ya generan capturas y
   analizan ojos sin acceder a servicios externos.
5. `apps/web/src/features/oct/runner.ts` y `attempts.ts`: reproducir el pedido y
   los registros de intento que utiliza la captura en vivo.
6. `apps/web/src/app/core.ts`, `screens/SessionScreen.tsx`,
   `screens/ResultScreen.tsx` y `screens/HowScreen.tsx`: consumidores y avisos actuales.
7. Pruebas vecinas de historia, reglas, informes e integración de pantallas.

## Archivos permitidos

- `packages/validation/src/`, `test/`, `out/` y `package.json`.
- `packages/core/src/dataset/`, `index.ts` y las pruebas de historia correspondientes.
- Un módulo puro de escenarios de visión dentro de `packages/core/src/dataset/`
  si hace falta extraer y reutilizar la visión ficticia que ya existe.
- `apps/web/src/app/core.ts`, las pantallas/textos/pruebas que necesiten un ajuste
  mínimo para reconocer la historia medida y conservar los avisos de incertidumbre.
- `monitoreo-salud-astronautas/arquitectura.md`, sección 12, para nuevos supuestos;
  usar `docs/assumptions.md` si al empezar ya existe como registro central.
- `packages/core/NOTES.md`, para documentar el nuevo estado.

No modificar el contrato público, el motor, sus condiciones de rechazo ni las
reglas clínicas. Si surge una necesidad concreta de hacerlo, informar el bloqueo
al coordinador antes de ampliar ese alcance.

## Implementación

1. Agregar un comando explícito y reproducible, por ejemplo
   `pnpm --filter @app/validation history:generate`.
   La generación costosa no debe ejecutarse al arrancar la web, compilarla ni
   correr las pruebas normales.
2. Por cada tripulante y ojo, generar el examen del día 0 con `acquire` y medirlo
   con `analyzeExam`, conservando `summarize`. Usar los mismos pedidos y condiciones
   que la aplicación; no apagar ruido ni fallas para mejorar cifras.
3. Para los controles posteriores, pasar al motor el resumen medido del día 0
   del mismo ojo como `baseline`. Intentos 1 a 3, detenerse en el primero aceptado
   y registrar todos los intentos efectivamente realizados.
   Si ninguno sirve, el ojo queda sin medida. Si no puede obtenerse una referencia
   válida para un ojo, informar el caso y detener la publicación de ese conjunto;
   no reemplazarla silenciosamente por una tabla.
4. Construir `SessionRecord` con las medidas reales, `origin: 'precomputed'`,
   visión ficticia explícita y `assessSession`. Reutilizar los escenarios de visión
   ya existentes: cuestionario, agudeza y Amsler de la historia son simulados y
   no se obtienen de una tomografía.
5. Recorrer el calendario con `assessment.nextOct`, hasta el fin de la misión.
   Respetar el calendario que produzcan las reglas con las nuevas medidas,
   aunque difiera del provisional. Comprobar avance estricto y ausencia de ciclos.
6. Guardar únicamente resúmenes compactos y trazabilidad: pedidos completos,
   intentos, versiones de instrumento/motor/reglas/modelo de error utilizadas
   y versión del conjunto. Nada de `.vol`, píxeles ni arrays de segmentación en git.
   Evitar fechas de generación variables u orden dependiente del paralelismo en
   los artefactos deterministas. Publicar el archivo final solo al completar todo.
7. `getHistory(crewId, beforeFlightDay)` conserva su firma y devuelve solo días
   estrictamente anteriores, ordenados, con día 0 cuando corresponde. El navegador
   lee los resúmenes; no ejecuta el generador. No exponer los objetos globales
   compartidos de forma que un consumidor pueda modificar la siguiente consulta.
8. Mantener `PROVISIONAL_ENGINE_VERSION` o un mecanismo compatible para reconocer
   registros antiguos guardados en el navegador. Los registros viejos no se
   renombran como medidos. No borrar automáticamente datos locales.
9. Habilitar el visor para los controles precalculados medidos usando su pedido
   real, incluido el intento aceptado; no asumir que siempre fue el primero.
   Conservar avisos para registros antiguos y para el modelo de error provisorio.
10. Limitar concurrencia de generación (por defecto hasta dos trabajos). No
    guardar cientos de volúmenes simultáneos. No instalar dependencias nuevas.

## Evidencia para aceptar la entrega

- Ejecutar el generador completo y guardar un informe breve con controles por
  tripulante, rechazos/reintentos, versiones, duración medida y tamaño del artefacto.
- Verificar referencias de los ocho ojos y consistencia de pedidos/identificadores.
  Comparar el baseline de B OS y un control con una ejecución fresca del mismo
  pedido; dentro de un mismo runtime debe coincidir. No usar el valor verdadero
  del ojo como entrada al análisis ni como sustituto de una medición.
- Probar invariantes útiles en archivos de pruebas existentes: filtro estricto
  por día, calendario creciente, referencias del ojo correcto, intentos rechazados
  sin valores inventados, integridad de los resúmenes y ausencia de mutaciones.
- Verificar regeneración determinista del artefacto. Se acepta reutilizar un
  caché de capturas identificado por pedido y versiones; documentar qué se regeneró.
- Mantener fuera de la suite normal la regeneración completa. El generador puede
  tener un modo explícito para contrastar el artefacto contra el motor.
- `pnpm verify` y `pnpm build` deben pasar. Ajustar pruebas dependientes de la
  historia provisional sin perder las garantías que comprobaban.
- Revisar resultado e historia para confirmar que solo desaparecieron los avisos
  que ya no aplican. La incertidumbre sigue siendo provisional.

## Entrega y límites

Commits pequeños con rutas explícitas, en español y sin push, con `pnpm verify`
antes de cada commit. Temporales en `.tmp/` del worktree; no leer credenciales,
claves ni archivos `.env`; no llamar a la API del asistente.

No dedicar rondas repetidas a mejoras ajenas a esta tarea. Informar únicamente
bloqueos reales y la entrega final por Orca. El informe final debe nombrar commits,
comandos ejecutados, evidencia de trazabilidad y determinismo, tamaños y límites.
Si algo no se verificó, declararlo. No delegar ni lanzar otros agentes.
