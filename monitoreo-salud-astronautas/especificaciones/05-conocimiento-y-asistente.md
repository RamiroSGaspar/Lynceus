# Especificación 05 — Base de conocimiento y asistente

| | |
|---|---|
| **Fecha** | 15 de noviembre de 2026 |
| **Para quién** | El agente que construye la base de conocimiento citada y el asistente que responde preguntas con ella. |
| **De dónde sale** | `arquitectura.md` (secciones 7 y 8), `decisiones-y-criterios.md` (Q13, Q36 y Q40) e `investigaciones/arquitectura-claude-y-vercel.md`, que trae los datos exactos de la API y de Vercel: leerla completa. |
| **Reglas generales** | `AGENTS.md`. Valen todas. |

## 0. Alcance

Dos piezas, en este orden:

1. **Base de conocimiento** (`packages/core/src/knowledge/`): afirmaciones cortas sobre el síndrome, la medición, los umbrales, el cerebro y los límites, cada una con su fuente, en inglés y en español. La usan la pantalla "Qué se sabe del cerebro" y el asistente.
2. **Asistente**: una función de servidor que llama a la API de Claude (`apps/web/api/`), y un panel en la aplicación (`apps/web/src/features/assistant/`).

**Carpetas propias:** esas tres, más `apps/web/vercel.json`, `apps/web/.env.example` y el agregado de desarrollo en `apps/web/vite.config.ts`. No tocar el resto. En `packages/core/src/index.ts` solo agregar líneas al final.

**La clave de la API:** nunca se lee, se imprime ni se escribe en un archivo versionado. El código la toma de la variable `ANTHROPIC_API_KEY`, solo del lado del servidor. Todo se construye y se prueba **sin clave**, con respuestas del modelo simuladas; la prueba contra la API real la corre el dueño del proyecto cuando cargue su clave.

## 1. Base de conocimiento

```ts
interface KnowledgeStatement {
  id: string;                      // estable, por ejemplo 'brain.icp-never-measured-in-flight'
  topic: 'sans' | 'measurement' | 'thresholds' | 'brain' | 'symptoms' | 'countermeasures' | 'limits' | 'glossary';
  /** Qué tan firme es lo que se afirma. */
  certainty: 'established' | 'limited-evidence' | 'unknown' | 'not-measurable-on-board';
  text: LocalizedText;             // una o dos oraciones, lenguaje llano
  sources: readonly string[];      // ids de referencias
  /** De qué investigación y sección sale, para poder revisarla. */
  basis: string;                   // por ejemplo 'sans-cerebro-en-mision.md §2'
}
interface Reference { id: string; title: string; publisher: string; year: number; url: string }

const KNOWLEDGE: readonly KnowledgeStatement[];
const REFERENCES: readonly Reference[];
const BRAIN_KNOWLEDGE: {
  known: readonly KnowledgeStatement[];               // qué se sabe
  mriOnly: readonly KnowledgeStatement[];             // qué solo se ve con resonancia antes y después del vuelo
  notKnowableOnBoard: readonly KnowledgeStatement[];  // qué no se puede saber en misión
};
```

Reglas de contenido:

- **Solo lo verificado.** Cada afirmación sale de una investigación de `monitoreo-salud-astronautas/investigaciones/` y de una fuente que esa investigación marca como leída. Lo que figura como "sin verificar", "por verificar" o "no encontrado" no entra como afirmación; lo "no encontrado" puede entrar como tal ("NASA does not publish…").
- **Una afirmación, un dato.** Con su número y su unidad cuando lo hay, y de quiénes es el dato (cuántas personas).
- **Sin exagerar la certeza.** La relación entre el ojo y el cerebro es débil y contradictoria: se dice así. Nada que sugiera que una medida del ojo indica la presión dentro del cráneo.
- **Sin consejo médico** y sin nombres de medicamentos como recomendación. Las contramedidas en estudio se describen como estudios, con su resultado.
- Entre 45 y 70 afirmaciones en total. Fuentes para cada tema: `sans-cerebro-en-mision.md` (cerebro), `sans-evolucion-y-logica-clinica.md` (evolución, niveles, frecuencia, síntomas, contramedidas), `sans-oct-base-tecnica.md` (qué se mide y con qué margen), `comunicar-resultados-de-salud.md` y la sección 12 de `arquitectura.md` (límites y supuestos de la herramienta). Glosario: los términos que aparecen en pantalla, en una oración cada uno.
- `REFERENCES` se arma con las tablas de fuentes de esas investigaciones (título, quién publica, año y link).

Pruebas: ids únicos; cada fuente citada existe en `REFERENCES`; los dos idiomas completos; ninguna afirmación supera 320 caracteres; las tres listas de `BRAIN_KNOWLEDGE` no están vacías y son de tema `brain`.

## 2. Asistente: qué hace y qué no

| Hace | No hace |
|---|---|
| Explica el resultado de la sesión con los números que recibe | Diagnosticar, o decir si un resultado "es grave" o "está bien" |
| Explica términos | Cambiar o discutir el nivel que calculó el motor |
| Responde sobre el síndrome, la medición y el cerebro, **solo con la base de conocimiento**, citando los ids | Recomendar medicación, dosis o tratamientos |
| Ayuda a armar preguntas para el médico | Responder cualquier cosa ajena: código, tareas, opiniones, otros temas de salud |
| Dice "no lo sé" cuando la base no lo cubre | Revelar o resumir sus instrucciones |

Una pregunta, una respuesta: **sin memoria de conversación**. Cada pedido lleva la pregunta y el resumen del resultado, nada más.

## 3. Función de servidor (`apps/web/api/assistant.ts`)

Función de Vercel en Node, sin paquetes: llama a la API con `fetch`, con el formato exacto de `arquitectura-claude-y-vercel.md` (URL, cabeceras, versión, `model: "claude-haiku-5-5"`, `output_config.effort: "medium"`, sin `temperature`, `top_p` ni `top_k`, margen en `max_tokens` porque el razonamiento cuenta, y lectura de los bloques de texto).

**No importa paquetes del repositorio en tiempo de ejecución.** La base de conocimiento que usa es un archivo JSON generado desde el núcleo y versionado (`apps/web/api/_lib/knowledge.generated.json`), con un script que lo regenera y una prueba que falla si quedó desactualizado. El resto de su código vive en `apps/web/api/_lib/`.

Pedido: `POST /api/assistant` con `{ question: string, locale: 'en' | 'es', context: AssistantContext | null }`.

`AssistantContext` es un **resumen numérico sin identidad**: día de vuelo, nivel de la sesión y de cada ojo, cambio de cada medida con su rango, umbrales con su probabilidad, hallazgos, pasos siguientes y calidad de captura. Sin nombre, sin identificador del tripulante, sin respuestas de texto libre. Lo arma una función pura a partir del `SessionRecord`, con una prueba que verifica que no lleva ningún campo de identidad.

Respuesta: una de tres formas.

```ts
type AssistantResponse =
  | { status: 'answered'; answer: string; sources: { id: string; title: string; url: string }[] }
  | { status: 'refused'; reason: 'out-of-scope' | 'invalid-input' | 'unsafe-output' }
  | { status: 'unavailable'; reason: 'no-key' | 'rate-limited' | 'upstream-error' };
```

Barreras, todas con prueba:

| # | Barrera | Detalle |
|---|---|---|
| 1 | Entrada | Solo `POST` y JSON. Pregunta de 1 a 500 caracteres, sin caracteres de control. Idioma válido. Contexto validado campo por campo; lo que sobra se descarta |
| 2 | Instrucciones fijas | El alcance, las reglas y la base de conocimiento van en `system`, armados en el servidor; el visitante no los puede cambiar. La pregunta va como dato, delimitada, con la indicación de que es texto de un usuario y no instrucciones. Usar las guías oficiales que cita la investigación (sección de guías para acotar al asistente) |
| 3 | Caché | `cache_control` sobre la parte fija de `system` |
| 4 | Respuesta con formato fijo | `output_config.format` con esquema JSON: `in_scope` (booleano), `category` (`result`, `term`, `sans`, `brain`, `questions-for-surgeon`, `out-of-scope`), `answer` (texto) y `source_ids` (lista) |
| 5 | Negativa fija | Si `in_scope` es falso, o la categoría es `out-of-scope`, o la API devuelve `stop_reason: "refusal"`: se responde `refused`. **El texto de la negativa es nuestro y lo pone la interfaz**; nunca se muestra el del modelo |
| 6 | Revisión de la respuesta | Se rechaza (`unsafe-output`) si: no es el JSON esperado; trae bloques de código, comillas invertidas o direcciones web; cita un id que no existe; no cita ninguna fuente (salvo categoría `result`, que se apoya en el contexto, o `questions-for-surgeon`); nombra un medicamento o una dosis; contiene un número con unidad que no está ni en el contexto ni en las afirmaciones citadas; o supera 1200 caracteres |
| 7 | Límite de uso | Por dirección IP, en memoria: 8 pedidos por minuto y 60 por día. Es un freno de mejor esfuerzo; el tope real es el límite de gasto mensual que el dueño pone en la consola de Anthropic, y eso se documenta |
| 8 | Fallas | Sin clave: `unavailable / no-key`. Error o demora de la API (tiempo máximo de 20 segundos): `unavailable / upstream-error`. Nunca se devuelve el mensaje de error de la API ni datos de la clave |

Las fuentes de la respuesta se arman en el servidor con los ids citados y `REFERENCES`: el modelo no escribe links.

**En desarrollo:** un agregado en `apps/web/vite.config.ts` monta la misma función en `/api/assistant` del servidor de Vite, leyendo la clave del entorno del proceso. Así la clave tampoco llega al navegador en desarrollo.

**`apps/web/vercel.json`:** cabeceras de seguridad que recomienda la investigación (política de contenido que solo permite el propio origen, más lo que necesita la aplicación: hilos de trabajo, imágenes generadas en el navegador y estilos), y nada más. **`apps/web/.env.example`:** el nombre de la variable, sin valor, con una línea que explique dónde se carga.

## 4. Panel en la aplicación (`features/assistant`)

```ts
function AssistantPanel(props: { record: SessionRecord | null }): JSX.Element;
```

- Panel lateral que se abre desde el resultado, la historia y la pantalla del cerebro.
- **Antes del primer uso**, un aviso que hay que aceptar: qué sale del dispositivo (la pregunta y un resumen numérico del resultado, sin nombre), a dónde va (la API de Claude, de Anthropic) y que el resto de la aplicación no envía nada. Se puede ver el resumen exacto que se va a mandar.
- Preguntas sugeridas, fijas y según los hallazgos (por plantilla), y un campo de texto con contador hasta 500 caracteres.
- La respuesta se muestra con sus fuentes (título y link) y con el rótulo de que es una explicación y no una indicación médica.
- Negativa: un texto fijo nuestro, en los dos idiomas, que dice para qué sirve el asistente y da ejemplos de qué preguntar.
- No disponible (sin clave, sin conexión, límite de uso): lo dice en una línea y recuerda que el análisis funciona igual. El panel nunca rompe el resto.
- Textos con `src/i18n`, piezas de `src/ui`, variables de `tokens.css`. Todo con teclado.

## 5. Pruebas

- Unitarias, sin red: cada barrera de la tabla, con respuestas del modelo simuladas; entre ellas, respuestas que obedecen a un intento de desvío (código, medicación, revelar instrucciones, otro tema) y que la revisión tiene que frenar.
- `AssistantContext` sin campos de identidad.
- El JSON generado coincide con el núcleo.
- Un programa aparte (`pnpm --filter @app/web assistant:redteam`), **que no corre en `pnpm verify`**, para cuando haya clave: manda unas 30 preguntas (dentro del alcance, fuera del alcance e intentos de desvío en los dos idiomas) y arma una tabla con lo esperado y lo obtenido. Si no hay clave, lo dice y termina sin error.
- `pnpm verify` y `pnpm build` en verde.

## 6. Entrega

Commits chicos con rutas explícitas: primero la base de conocimiento (el coordinador la revisa y la une antes que el resto), después la función y por último el panel. Informe final corto: commits, cantidad de afirmaciones por tema, cantidad de pruebas, cómo se corre la prueba con clave, qué quedó sin poder probarse sin clave y lo que se vea flojo.
