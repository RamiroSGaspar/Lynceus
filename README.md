# Astronaut eye monitoring

[Español](README.es.md)

A web prototype for the NASA Space Apps Challenge 2026 challenge **Create Health
Monitoring Software for Astronauts on Space Missions**. It helps a crew member
understand changes associated with Spaceflight-Associated Neuro-ocular Syndrome
(SANS), compare them with their own pre-flight exam, and prepare a conversation
with the flight surgeon.

**Simulated data. Not a medical device. Not validated on people.**

The virtual instrument generates fictional retinal OCT exams in a `.vol` format
modelled on Spectralis exports. A deterministic image-analysis engine measures
them locally. The result shows changes, provisional uncertainty, published
thresholds and a proposed next monitoring step. An optional, constrained AI
assistant explains results using a cited knowledge base.

## Try the demo

Requires **Node.js 22 or later** and **pnpm 10.18.3**. From the repository root:

```sh
pnpm install
pnpm dev
```

Open the address printed by Vite, normally http://localhost:5173/.
Choose **Elena Voss, flight day 150** and start a control. The left-eye capture
includes a scripted failure followed by a usable retry.

Follow the [short demo guide](docs/en/demo.md). The image analysis, results,
history and report work without an API key. The assistant requires a server-side
Anthropic key and network access; see [development](docs/en/development.md).

## What is implemented

- Four fictional crew members across a 180-day mission.
- Near-vision, Amsler and symptom steps, with explicit records of skipped tests.
- Live simulated OCT capture, quality rejection, retries and an image viewer.
- Measurements against each eye's pre-flight baseline, result and history charts.
- A downloadable medical-conference report and questions for the surgeon.
- English and Spanish UI, cited brain information and an optional assistant.

The synthetic evaluation covers **621 captures of eight virtual eyes**, including
16 reference captures. Its fitted error model did not meet the activation criteria.
The application retains the **provisional error model**. These are not clinical
accuracy results; see [evidence and limitations](docs/en/evidence.md).

At this documentation checkpoint, 15 November 2026, the local demo is available.
Haiku 5.5 passed six real-provider checks and one UI query; see the
[results and wording observation](docs/en/development.md). No public deployment
is claimed. The image engine is deterministic; language-model responses need not be.

## Read more

| Document | Purpose |
|---|---|
| [Product](docs/en/product.md) | Who it helps, the workflow and what the result means |
| [Demo](docs/en/demo.md) | A short reproducible presentation |
| [Evidence](docs/en/evidence.md) | Sources, thresholds, evaluation and limits |
| [Assumptions](docs/assumptions.md) | One bilingual register of project choices |
| [Development](docs/en/development.md) | Setup, architecture, checks and assistant configuration |
| [Personal presentation guide, Spanish](monitoreo-salud-astronautas/guia-para-defender-el-proyecto.md) | How to explain the models, charts and project |

The [Spanish research](monitoreo-salud-astronautas/investigaciones/) and
[stage specifications](monitoreo-salud-astronautas/especificaciones/) preserve the
supporting work. The product name is defined in
[`packages/core/src/product.ts`](packages/core/src/product.ts).

## Data and limits

Control records are stored in the browser. Sending an assistant question requires
consent and sends the question plus a numerical summary without crew identity to
Anthropic through the server. OCT images are not included. Free text can still
contain information the visitor types; the assistant is not an anonymous channel
for real patient data.

The prototype does not diagnose SANS, prescribe medication or infer intracranial
pressure from eye measurements. The flight surgeon retains the decision.
