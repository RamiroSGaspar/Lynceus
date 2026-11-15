# Retomar el prototipo

## Estado vigente: demo reanudada

15 de noviembre de 2026. Ramiro volvió y pidió ir directamente a una demo usable.
La pausa queda levantada. La validación existente se cerró en `validacion`
(`b1969cc`) y se incorpora a `master`, con el modelo provisorio activo.

- **Demo local:** http://127.0.0.1:5178/ — terminal de Orca «Demo local» en `master`.
- **Resultado del recorrido:** http://127.0.0.1:5178/#/result/B/150 .
- **Caso comprobado:** Elena Voss, día 150. Derecho aceptado; izquierdo rechazado
  por parpadeo simulado y aceptado al repetir; resultado, historia e informe.
  Se comprobó la descarga del informe y los textos principales en ambos idiomas.
- Se saltearon cuestionario, agudeza y Amsler para este control breve; la aplicación
  los muestra como no hechos. No se probó la API del asistente ni la impresión.
- Se conservaron las 621 capturas, se comprobó el ajuste publicado y se corrigió
  una prueba cuyo cambio se cancelaba contra la referencia. Núcleo: 340 pruebas;
  web: 310; validación: 21 más una de rendimiento. Compilación y credenciales correctas.
  La prueba corregida y los textos finales se verificaron de forma focalizada.
- No se repitió el experimento largo. La segunda corrida interrumpida no demuestra
  reproducibilidad; el informe conserva los datos de la primera.
- Sesiones comprobadas: `interfaz`, `reglas`, `vision`, `asistente`, `validacion` y
  `construccion` abiertas y esperando; `captura`, `historia` e `investigaciones`
  inactivas. Los archivos de todos los worktrees se conservan.

### Cómo mostrarla rápido

Elegir Elena Voss y día 150 en el inicio. En el navegador de Orca ya está guardado
el control recorrido; se puede abrir el resultado y su informe directamente.
Para mostrar la captura, empezar el control de nuevo desde el flujo de sesión.
Las pruebas de visión se pueden hacer o saltear y quedan registradas según eso.

### Pendientes de entrega

1. README en inglés y español, fuentes y supuestos centrales.
2. Siete diapositivas y texto del formulario a partir de `producto.md`.
3. Clave del asistente y tope de gasto a cargo de Ramiro; luego prueba breve de la API.
4. Publicación cuando Ramiro la autorice y defina el destino.

Sonnet 5.5 High en Devin para tareas directas; Opus 5.5 High para las que lo
requieran. Claude Code solo por indicación de Ramiro. Worktrees nuevos: hijos de
`master`. La demo ya se puede usar sin esperar los pendientes de entrega.

---

## Registro histórico de la pausa (superado por el estado anterior)

Lo que sigue conserva el plan escrito antes de la retoma; sus tareas pendientes
de validación ya están cerradas. El 15 de noviembre de 2026, alrededor de las 10:20,
Ramiro pidió pausar agentes y pruebas hasta su regreso.

El agente de validación quedó en espera. Se detuvieron los procesos de sus
herramientas, incluida la segunda corrida larga de validación y su servidor de
desarrollo; también se detuvo el servidor del coordinador en el puerto 5178.
No se borraron ni revirtieron archivos.

## Dónde está el trabajo

- **Aplicación integrada:** `master`, con la historia medida, la captura, el visor,
  los resultados, el informe, las pruebas de visión y el asistente.
  Último commit antes de esta nota: `c99ba33`.
- **Validación pendiente de integrar:** rama `validacion`, worktree
  `/home/ramiro/orca/workspaces/nasa_hacka/validacion`.
  Commits `0d8e1c8` (protocolo) y `7f3fac8` (matriz y ejecución).
  **Hay cambios importantes sin commit y archivos nuevos en ese worktree.**
  Continuar desde ellos; no empezar de cero, no resetear ni limpiar la carpeta.
- **Nota del propio worker:** `.tmp/PAUSA.md`, dentro de ese worktree. Enumera
  archivos, comprobaciones realizadas y pasos pendientes.
- **Resultado conservado:** 621 capturas, aproximadamente 28 minutos de cálculo.
  El candidato no cumplió sus criterios y el modelo provisorio sigue activo.
  El informe, el modelo experimental y la pantalla que lo explica están escritos.
- **Segunda corrida:** interrumpida por la pausa. El archivo actual de filas sigue
  coincidiendo con la copia de la primera corrida:
  `44510818ce6e49bc9545a7bc551faa3abb5d36e76c7e8a616ef1cbc26970b394`.
  Eso confirma que se conservó el archivo; **no prueba que la segunda corrida
  terminara ni que se verificara reproducibilidad mediante esa corrida**.

Antes de pausar, el worker informó tipos correctos, 310 pruebas web y pruebas
focalizadas del núcleo, además de capturas aceptada/rechazada y la explicación en
ambos idiomas en navegador sin ventana. Faltaban el cierre de las pruebas del
ajuste, compilación, control de credenciales y commit final.

## Ruta corta para terminar

### 1. Cerrar la entrega que ya está hecha

1. Leer `.tmp/PAUSA.md` y revisar `git status` en `validacion`.
2. Corregir cualquier frase que dé por terminada la segunda corrida. Conservar
   el informe de la primera; no repetir las 621 capturas ni intentar mejorar
   precisión para aprobar criterios.
3. Verificar los artefactos y el módulo modificado:
   `pnpm --filter @app/validation quality:fit -- --check` y
   `pnpm --filter @app/validation exec vitest run test/quality.test.ts`.
   Si falla algo, corregir solo lo que impida entregar resultados coherentes.
4. Ejecutar `pnpm build` y `pnpm check:secrets`. Reutilizar las comprobaciones
   ya realizadas sobre código que no haya cambiado; no repetir la suite completa.
5. Revisar el temporal `packages/validation/.dbg.ts`: no incluirlo en la entrega.
   Hacer commit de las rutas explícitas del trabajo, integrar a `master` y actualizar
   el estado de `producto.md`.

El candidato queda identificado como experimental y el modelo de error provisorio
conserva su aviso. La demo no necesita otra ronda de investigación para cerrar.

### 2. Una comprobación del recorrido que se mostrará

Arrancar la aplicación y recorrer un caso representativo: tripulante B, día 150,
captura, repetición del ojo que falla, resultado, historia e informe. Revisar los
textos principales en español e inglés y comprobar la descarga del informe.
Corregir bloqueos de uso; dejar mejoras cosméticas para después.

### 3. Preparar una entrega pequeña y completa

- README breve en español e inglés: qué hace, cómo abrirlo, datos simulados,
  límites y fuentes principales.
- Reunir los supuestos del proyecto en el lugar central, enlazando los informes
  existentes en vez de escribir documentos extensos nuevos.
- Preparar las siete diapositivas y una secuencia de demo que se entienda sin voz.
- Completar la descripción del proyecto a partir de `producto.md`.

### 4. Publicación y asistente

- Publicar en Vercel cuando estén listos el repositorio y el proyecto de destino.
  Revisar los archivos que se publicarán; las claves y copias locales quedan fuera.
- Cuando Ramiro configure la clave y el tope de gasto, probar unas pocas preguntas
  representativas y rechazos del asistente. Si la clave sigue pendiente, la
  demostración del análisis local puede usarse con el asistente no disponible.
- Conservar las tareas del equipo: cuenta/equipo en Space Apps, formulario y enlaces
  de la entrega.

## Cómo asignar el trabajo al volver

Sonnet 5.5 **High**, en **Devin**, para cerrar esta integración, documentación y
presentación. Opus 5.5 **High** solo para un bloqueo que requiera razonamiento más
complejo. Claude Code únicamente si Ramiro vuelve a indicarlo.
Worktrees nuevos: hijos de `master`. No lanzar varios workers para este cierre.

## Identificadores para recuperar el contexto

- Run: `run_49122f2e2c67`.
- Tarea de validación: `task_66252cfe8fd4`.
- Dispatch: `ctx_2c2f6e973d2b`.
- Terminal retenida: `term_58e7b8fc-bf8c-4fb1-82a2-2c01893ef3f4`.
- Orca devolvió `stop_unknown` porque esa terminal se había creado por separado.
  Se comprobó directamente que el agente quedó esperando y que los 12 procesos de
  herramientas identificados habían terminado. No interpretar el estado
  administrativo como prueba de que el cálculo sigue corriendo.
