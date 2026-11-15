# API de Claude y Vercel — Datos para la arquitectura

| | |
|---|---|
| **Hackatón** | NASA Space Apps Challenge 2026 — 14 y 15 de noviembre de 2026 |
| **Desafío** | *Create Health Monitoring Software for Astronauts on Space Missions* |
| **Fecha** | 14 de noviembre de 2026 (documentación consultada ese día) |
| **Para qué es** | Dar los **datos exactos de la documentación oficial** para armar el asistente (API de Claude, modelo Claude Haiku 5.5, esfuerzo medio) y publicar la aplicación web en Vercel, plan gratuito, sin exponer la clave y con tope de gasto. |
| **Qué no es** | No diseña la solución ni propone qué construir. No usa blogs ni foros: solo documentación de Anthropic y de Vercel. |
| **Fuente** | `platform.claude.com/docs` (a donde hoy redirigen `docs.anthropic.com` y `docs.claude.com`) y `vercel.com/docs`. Lista al final. |

### Cómo leerlo

- **Sección 1:** tabla central "dato → valor → fuente".
- **Secciones siguientes:** detalle (en preparación; este es el primer guardado).

**"No encontrado"** = lo busqué en la documentación oficial y no aparece. **"Por verificar"** = todavía no leí la página. Los precios están en dólares estadounidenses (USD).

**Términos:** *token* = unidad en la que el modelo cuenta el texto (un fragmento de palabra); se paga por token · *MTok* = un millón de tokens · *ventana de contexto* (context window) = máximo de tokens que el modelo puede tener a la vista en un pedido · *esfuerzo* (effort) = cuánto trabajo y razonamiento gasta el modelo en responder · *caché de instrucciones* (prompt caching) = reutilizar la parte fija del pedido para pagarla más barata · *función* (Vercel Function) = código que corre en el servidor de Vercel y no en el navegador · *variable de entorno* (environment variable) = valor de configuración guardado fuera del código, por ejemplo la clave · *cortafuegos* (firewall, WAF) = filtro de pedidos que Vercel aplica antes de que lleguen a la aplicación.

---

## 1. Tabla central

### 1.1 API de Claude

| # | Dato | Valor | Fuente |
|---|---|---|---|
| 1 | Identificador del modelo en la API | `claude-haiku-5-5` (sin fecha; es una versión fija, no un alias que cambie) | [Claude Haiku 5.5](https://platform.claude.com/docs/en/models/haiku-5-5/overview) · [Models overview](https://platform.claude.com/docs/en/models/overview) |
| 1 | Ventana de contexto | 1M tokens (1 millón) | Ídem |
| 1 | Máximo de salida | 128K tokens (128 000) por pedido, en la API de mensajes | Ídem |
| 1 | Entrada y salida | Texto e imágenes → texto | Ídem |
| 1 | Lanzamiento y retiro | Lanzado el 7 de octubre de 2026. Retiro: no antes del 7 de octubre de 2027 | Ídem |
| 1 | Advertencias del modelo | No enviar `temperature`, `top_p` ni `top_k` ("Omit"). El mismo texto ocupa cerca de 30 % más tokens que en Claude Haiku 4.5 | Ídem |
| 2 | Parámetro de esfuerzo | `output_config.effort`, dentro del pedido a la API de mensajes | [Effort](https://platform.claude.com/docs/en/build-with-claude/effort) |
| 2 | Valores válidos | `low`, `medium`, `high`, `xhigh`, `max` | Ídem |
| 2 | ¿Lo admite Claude Haiku 5.5? | **Sí, los cinco niveles.** `medium` es el valor por defecto en este modelo: enviarlo equivale a no enviar el parámetro | Ídem |
| 2 | Razonamiento (thinking) | Adaptativo, encendido por defecto. Lo que el modelo razona **cuenta dentro de `max_tokens`**: hay que dejar margen | Ídem |
| 3 | Precio de entrada | **USD 0,10 por MTok** (pedidos de hasta 100 000 tokens de entrada) | [Pricing](https://platform.claude.com/docs/en/about-claude/pricing#model-pricing) |
| 3 | Precio de salida | **USD 0,50 por MTok** (pedidos de hasta 100 000 tokens de entrada) | Ídem |
| 3 | Entrada leída de caché | **USD 0,01 por MTok** | Ídem |
| 3 | Entrada escrita en caché | USD 0,125 por MTok (caché de 5 minutos) · USD 0,20 por MTok (caché de 1 hora) | Ídem |
| 3 | Pedidos de más de 100 000 tokens de entrada | Todo cuesta 5 veces más: entrada USD 0,50 · salida USD 2,50 · lectura de caché USD 0,05 · escritura USD 0,625 (5 min) y USD 1 (1 h), por MTok | [Pricing, long context](https://platform.claude.com/docs/en/about-claude/pricing#long-context-pricing) |
| 4 | Límites por minuto, nivel *Start* | 4 000 pedidos · 2 000 000 tokens de entrada · 400 000 tokens de salida | [Rate limits](https://platform.claude.com/docs/en/api/rate-limits) |
| 4 | Límites por minuto, nivel *Build* | 10 000 pedidos · 5 000 000 tokens de entrada · 1 000 000 tokens de salida | Ídem |
| 4 | Límites por minuto, nivel *Scale* | 13 000 pedidos · 10 000 000 tokens de entrada · 2 000 000 tokens de salida | Ídem |
| 4 | Nivel *Evaluation* (cuentas nuevas) | Límites **menores** a los de arriba; la página no publica los números. Se ven en `platform.claude.com/usage/limits` | Ídem |
| 4 | Límites por día | **No encontrado**: la página solo define límites por minuto y un tope de gasto por mes | Ídem |
| 4 | Tope de gasto mensual del nivel | *Start* USD 500 · *Build* USD 1 000 · *Scale* USD 200 000 | Ídem |
| 4 | Cómo poner un tope propio | Consola → `platform.claude.com/settings/spend-limits` → junto a **Monthly spend limit**, **Set limit** o **Adjust limit** → escribir el valor (no puede superar el tope del nivel). Al llegar, la API responde HTTP 400 `invalid_request_error` hasta que se suba o quite el tope | [Rate limits, spend limits](https://platform.claude.com/docs/en/api/rate-limits#setting-your-own-spend-limit) |

### 1.2 Vercel

| # | Dato | Valor | Fuente |
|---|---|---|---|
| 9 | Plan Hobby: precio | Gratis | [Hobby plan](https://vercel.com/docs/plans/hobby) |
| 9 | Incluido por mes | 100 GB de transferencia rápida (Fast Data Transfer) · 10 GB de transferencia al origen · 1 000 000 de pedidos a la red (CDN Requests) · 1 000 000 de invocaciones de funciones · 4 horas de CPU activa · 360 GB-hora de memoria | Ídem |
| 9 | Otros límites | Función: 300 s de duración máxima · 100 publicaciones por día · 200 proyectos · registros de ejecución: 1 hora · reglas propias del cortafuegos: hasta 3 · bloqueos por IP: hasta 10 · control de gasto (Spend Management): no disponible | Ídem |
| 9 | Si se pasa del límite | "En la mayoría de los casos" hay que esperar 30 días para volver a usar esa función. No se cobra | Ídem |
| 9 | Regla de uso no comercial | **No encontrado en `vercel.com/docs`** (por verificar en los términos del servicio, a los que remite la página de uso justo) | [Fair use guidelines](https://vercel.com/docs/limits/fair-use-guidelines) |
| 10 | Funciones en `/api` | Vercel crea una función por cada archivo admitido dentro de la carpeta `api/` de la raíz del proyecto. Admite TypeScript. Recomienda **un solo archivo de entrada** (por ejemplo `api/index.ts`) y no uno por ruta | [Node.js runtime](https://vercel.com/docs/functions/runtimes/node-js) |
| 10 | Compilación y carpeta de salida | Vercel detecta el framework (Vite figura en la lista) y configura solo el comando de compilación y la carpeta de salida. Se pueden fijar con `buildCommand` y `outputDirectory` en `vercel.json`. Valores por defecto para Vite: por verificar | [Configure a build](https://vercel.com/docs/builds/configure-a-build) |
| 10 | Redirección de rutas (aplicación de una sola página) | En `vercel.json`: `"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]` | [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite#using-vite-to-make-spas) |
| 10 | Repositorio con varios paquetes | Un proyecto de Vercel por carpeta a publicar; se elige la **carpeta raíz** (Root Directory) del proyecto. Por defecto la compilación puede leer archivos fuera de esa carpeta. pnpm se detecta por `pnpm-lock.yaml` | [Monorepos](https://vercel.com/docs/monorepos) · [Root Directory](https://vercel.com/docs/builds/configure-a-build#root-directory) |
| 11 | Cómo se cargan las variables | En el panel del proyecto o con `vercel env add`, eligiendo ambiente (Production, Preview, Development) y tipo (**Config** legible o **Secret** de solo escritura). Se guardan cifradas. Un cambio vale solo para publicaciones nuevas | [Environment variables](https://vercel.com/docs/environment-variables) |
| 11 | Cuáles llegan al navegador | Las que el framework expone por su **prefijo**; en Vite, `VITE_`. El resto queda disponible solo durante la compilación y dentro de las funciones | [Framework environment variables](https://vercel.com/docs/environment-variables/framework-environment-variables) · [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite#environment-variables) |
| 12 | Publicar conectando GitHub | Panel → **New Project** → importar el repositorio → elegir framework, carpeta raíz, compilación y variables → **Deploy**. Después publica con cada push. Necesita: cuenta de Vercel, la aplicación de Vercel para GitHub con acceso al repositorio, y ser **dueño** del repositorio si es de una cuenta personal | [Git](https://vercel.com/docs/git#deploying-a-git-repository) · [Vercel for GitHub](https://vercel.com/docs/git/vercel-for-github) |
| 12 | Restricciones de Hobby con GitHub | No se puede publicar desde un repositorio **privado de una organización** de GitHub. El autor del commit tiene que ser el dueño de la cuenta Hobby; si no, la publicación se bloquea | [Git, Hobby teams](https://vercel.com/docs/git#using-hobby-teams) |
| 12 | Publicar con la línea de comandos | `vercel` (la primera publicación de un proyecto nuevo siempre va a producción) o `vercel --prod`. Necesita iniciar sesión con `vercel login` (pide intervención manual) o un token creado en la página de tokens, pasado por la variable `VERCEL_TOKEN` (recomendado) o por `--token` | [CLI](https://vercel.com/docs/cli#using-in-a-cicd-environment) · [Deploying from CLI](https://vercel.com/docs/cli/deploying-from-cli) |
| 13 | Límite de pedidos por visitante | El cortafuegos tiene **límite de pedidos (WAF Rate Limiting) en todos los planes**. En Hobby: **1 regla por proyecto** (dentro del total de 3 reglas propias), clave por **IP** o por huella JA4, ventana fija de 10 s a 10 min, 1 000 000 de pedidos permitidos incluidos. Acción por defecto: responder 429 | [WAF Rate Limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting) |
| 13 | Advertencia | Los contadores van **por región**: un visitante que entra por varias regiones puede superar el límite configurado | Ídem |
| 13 | Alternativas sin otro servicio | Límite desde el código con el paquete `@vercel/firewall` (`checkRateLimit`), que usa una regla creada en el panel · bloqueo por IP (hasta 10) · modo ataque (Attack Mode) · protección contra ataques de denegación de servicio encendida por defecto. Detalle: por verificar | [Rate Limiting SDK](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting-sdk) · [Hobby plan](https://vercel.com/docs/plans/hobby) |

---

## Lo no verificado

- Regla de uso no comercial del plan Hobby: no aparece en `vercel.com/docs`; falta revisar los términos del servicio.
- Valores por defecto de compilación y carpeta de salida para Vite en Vercel.
- Puntos 5 a 8 y 14 del brief: en preparación.

## Fuentes

Todas leídas el 14 de noviembre de 2026 en su versión de texto (la misma ruta terminada en `.md`). Lista completa en el segundo guardado.
