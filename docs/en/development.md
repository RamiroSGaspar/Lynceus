# Development and execution

[Español](../es/development.md) · [Home](../../README.md) · [Demo](demo.md)

## Setup

Requirements: Node.js ≥ 22 and pnpm 10.18.3, specified in `package.json`.
From the repository root:

```sh
pnpm install
pnpm dev
```

Vite prints its URL, normally on port 5173. To use the team's demo port:

```sh
pnpm dev --host 127.0.0.1 --port 5178 --strictPort
```

Use one server per port. Stop it with Ctrl+C in its terminal. Dependencies are
installed inside the repository. `minimumReleaseAge` requires releases to be at
least seven days old; keep that restriction.

## Component map

```text
Virtual eye → virtual instrument → .vol exam → image engine
                                                   ↓
Vision tests + baseline → rules → result / history / report
                                              ↓ consent
                       question + summary → server → Anthropic API
```

| Directory | Responsibility |
|---|---|
| `packages/core` | Pure TypeScript: simulation, format, measurement, rules and text |
| `packages/validation` | Local evaluation tools and saved artifacts |
| `apps/web/src` | React UI, local storage and the OCT Web Worker |
| `apps/web/api` | Assistant function and input/output checks |
| `docs` | Public documentation and central assumptions |
| `monitoreo-salud-astronautas` | Research, specifications and team material |

Core randomness is seeded. Reproduction requires retaining the request, baseline,
versions and rules, not just the crew member's name. Viewer images are reconstructed
when needed; every full volume is not kept in persistent browser storage.

Controls, drafts and questions are saved locally. A loaded application can run the
analysis without an API call. This does not imply an offline installer or that a
reload works without access to the server.

## Configure the assistant

1. Create or edit local `apps/web/.env.local` and set `ANTHROPIC_API_KEY`.
   Do not use a `VITE_` prefix.
2. Configure the Anthropic account spending cap.
3. Restart the development server after setting or changing the key.
4. Check presence and configuration without revealing the value or calling the provider:

```sh
pnpm --filter @app/web assistant:smoke -- --check
```

With the key and spending authorized, run the six-case check:

```sh
pnpm --filter @app/web assistant:smoke
```

It uses a fictional numerical summary and tests result explanations, intracranial
pressure, surgeon questions, medication and instruction hijacking. It stops on a
provider failure. `NO KEY` means **not tested**, even though the process exits 0.
Review answers and citations as well as the exit code. The full 30-case
`assistant:redteam` remains available; it is not part of `verify` and is not needed
for every change.

Only the server loads the key. The browser calls `/api/assistant`; the Vite plugin
mounts the same handler used by the Vercel function. Server logs report sanitized
failure categories, not the key or raw provider error body. Output-review blocks
are distinguished from API failures.

The product model is configured in
[`anthropic.ts`](../../apps/web/api/_lib/anthropic.ts). The model used by a coding
agent to build the project is a separate choice.

## Real-provider check on 15 November 2026

`claude-haiku-5-5` with `medium` effort was tested using fictional context:
**six cases with the expected outcome and one UI query**, seven HTTP 200 calls
in total, without retries or provider errors. It answered the four in-scope
queries and refused the dosage request and code-writing hijack. The UI showed
a Spanish response with three linked sources for Elena Voss, day 118.

The six cases used 2240 input tokens, 13,265 cache-write tokens, 66,325 cache-read
tokens and 2171 output tokens: **approximately USD 0.004** at the researched
rates. This estimate excludes the UI call, whose tokens were not recorded, and
does not replace provider billing.

Wording observation: one UI sentence used “probable” (“likely”) instead of
repeating the level “primer indicio” (“first sign”). Numbers were correct and
the engine's calculated level did not change. Probability and the level's name
should be distinguished when explaining the result. This small check does not
guarantee the behavior of every future answer.

## Vercel deployment

Public demo: **https://lynceus-sans.vercel.app**.
The project is connected to GitHub: changes on `master` deploy to production
and retain that address. Settings:

| Setting | Value |
|---|---|
| Root directory | `apps/web` |
| Framework | Vite |
| Node.js | 22.x |
| Install command | `pnpm install --frozen-lockfile` |
| Build command | `pnpm build` |
| Output directory | `dist` |
| Include files outside the root directory | Yes, for `packages/core` |
| Production secret | `ANTHROPIC_API_KEY`, marked as sensitive |

Access protection applies to previews; production is public. The key is configured
in Vercel, is not uploaded with source files and has no `VITE_` prefix.
Spending limits are managed in Anthropic.

The public UI was checked without signing in, including one question about
Elena's fictional result on day 118. Haiku answered in Spanish with consistent
numbers and three linked sources; the console showed no errors.
This query adds to the seven calls in the earlier check.

## Checks

| Command | Scope |
|---|---|
| `pnpm verify` | Types, tests and credential scan; required before commits |
| `pnpm build` | Production build |
| `pnpm preview` | Serves the static build; does not mount the assistant function |
| `pnpm --filter @app/validation quality:fit -- --check` | Checks report/summary against saved rows |

`quality:run` and `history:generate` explicitly regenerate data. They are not
required to open the demo or substitutes for short checks. Current artifacts are
already versioned.

## Publication and maintenance

The layout targets Vercel with `apps/web` as its root, a Vite build and
`api/assistant.ts` as the function. The key would be a server secret. Publication
requires a chosen destination and authorization; these local commands do not deploy.

Follow [AGENTS.md](../../AGENTS.md): pnpm, explicit paths when committing, no
versioned secrets, and new choices in [assumptions](../assumptions.md).
Knowledge and thresholds need traceability; do not change them to obtain a
favorable demo result.
