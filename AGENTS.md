# Agent guide

On-board first read of Spaceflight-Associated Neuro-ocular Syndrome (SANS) for the
NASA Space Apps Challenge 2026, challenge *Create Health Monitoring Software for
Astronauts on Space Missions*. A virtual instrument produces fictional retinal OCT
exams in the real export format of the tomograph on the ISS; a real analysis engine
measures them, compares them with the astronaut's own pre-flight exam, states the
uncertainty and applies NASA's published thresholds.

Read before working:

- `monitoreo-salud-astronautas/arquitectura.md`: what is being built and why (Spanish).
- `monitoreo-salud-astronautas/especificaciones/`: the specification of each stage (Spanish).
- `monitoreo-salud-astronautas/investigaciones/`: the research every number comes from (Spanish).

## Commands

```
pnpm install      # dependencies, inside the project only
pnpm test         # all unit tests (Vitest)
pnpm typecheck    # TypeScript, all packages
pnpm dev          # web app on http://localhost:5173
pnpm build        # production build of the web app
pnpm verify       # typecheck + tests + credential scan; run before every commit
```

Run a script of one package with `pnpm --filter @app/<name> <script>`, and a
TypeScript file with `pnpm --filter @app/validation exec tsx <file>`.

## Layout

| Path | What it holds |
|---|---|
| `packages/core` | Pure library: `.vol` format, virtual eye, virtual instrument, analysis engine, rules, vision-test scoring, texts. Runs unchanged in the browser, in a Web Worker and in Node |
| `packages/validation` | Development-machine scripts: fictional dataset, engine validation against known ground truth, quality model |
| `apps/web` | The application (Vite + React) and the assistant's serverless function |
| `docs` | Public documentation, English and Spanish |
| `monitoreo-salud-astronautas` | Working documents, research and specifications (Spanish) |

## Rules that are not negotiable

1. **Nothing global, nothing paid.** Use `pnpm` only (never `npm`, `npx`, `yarn`, `pnpm dlx`, `-g`).
   Dependencies must have been published at least 7 days ago; `minimumReleaseAge` in
   `pnpm-workspace.yaml` enforces it and must not be changed. Add a dependency only when
   writing the code yourself would be clearly worse, and say why in the commit.
2. **No secrets.** Never read, print or commit keys or `.env` files. The Anthropic key
   exists only on the server side. A pre-commit hook runs `scripts/check-secrets.mjs`;
   never bypass it.
3. **Nothing leaves this machine.** No `git push`, no remotes, no deploys, no `git config`.
4. **Deterministic.** The same input gives the same output, bit for bit. In `packages/core`
   all randomness comes from the seeded generator; `Math.random`, `Date.now` and
   `new Date()` without arguments are forbidden there.
5. **`packages/core/src` is pure.** No DOM, no Node APIs, no I/O. Its `tsconfig` has no
   ambient types on purpose.
6. **Every number is traceable.** A value shown to the astronaut carries its unit, how it was
   obtained (measured, derived, estimated, self-reported, not measurable on board) and the
   source of any constant it depends on. Constants taken from the research cite the
   document and section in a comment.
7. **Honest about limits.** If a capture is not good enough the engine says it cannot
   measure; it never returns a number it cannot support. Never state or imply a diagnosis,
   never recommend medication, never infer intracranial pressure from the eye.
8. **Simulated data is labelled** in every file, image and report that contains it.
9. **Our own assumptions are listed in one place** (`docs/assumptions.md` once it exists;
   until then, section 12 of `arquitectura.md`). A new assumption is added there in the
   same commit that introduces it.
10. **The product name appears only in `packages/core/src/product.ts`.**

## Conventions

- Code, identifiers and comments in English. Interface texts in English and Spanish,
  kept out of the components. Working documents in Spanish.
- Units in identifiers when a number is not dimensionless: `thicknessUm`, `areaMm2`, `qualityDb`.
- Scratch files go in `.tmp/` at the repository root (ignored), never in `/tmp`.
- Commit often, with explicit paths (`git add <paths>`, never `git add -A`), in Spanish,
  present tense, saying what changes and why: `Agrega el lector del formato .vol`.
- Each agent edits only the directories its specification assigns to it. To change a
  shared contract, ask the coordinator first.
