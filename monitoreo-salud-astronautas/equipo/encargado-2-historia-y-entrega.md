# Encargado 2: historia y entrega

**Para:** quien arma las diapositivas y carga el formulario de Space Apps.
**Cierre:** domingo 15 de noviembre de 2026, 23:59. La idea es enviar antes de las 22.

El contenido para los jueces está abajo, **en inglés y preparado para adaptar**.
Completá los datos entre corchetes y confirmá la declaración de uso de IA antes de
enviarlo. Tu trabajo es simplificarlo donde haga falta, armarlo con la plantilla
del encargado 1 (diseño) y cargarlo.

## 1. El proyecto en 30 segundos

- **El problema:** en vuelos largos pueden aparecer cambios oculares asociados a
  SANS sin síntomas notorios. Algunos hallazgos se detectan con exámenes como la
  tomografía de retina (OCT).
- **Qué hacemos:** después de cada tomografía, la app le dice al astronauta si su ojo
  cambió respecto de antes del vuelo, cuánto, qué tan seguro es ese resultado y qué
  hacer. Al médico en Tierra le deja un informe, y el médico decide.
- **Qué es real y qué no:** los astronautas y las imágenes son inventados (simulamos el
  tomógrafo de la estación espacial). El análisis de la imagen, las reglas y el informe
  son reales: es código que mide de verdad.
- **Lo que nunca decimos:** que diagnostica, que mide la presión dentro del cráneo, que
  está validado con personas o que es un dispositivo médico.

## 2. Reglas para tocar los textos

1. **Simplificá todo lo que quieras.** Si una frase no se entiende al leerla en voz alta,
   reescribila o sacala: los jueces no son médicos.
2. **No cambies números ni umbrales.** Cada uno sale de una fuente. Podés sacar un número
   entero; para cambiarlo, preguntá antes.
3. **No agregues afirmaciones nuevas** sobre lo que hace el producto o sobre la ciencia
   sin preguntar.
4. **Toda diapositiva con capturas lleva el aviso:**
   *Simulated data. Not a medical device. Not validated on people.*
5. **Máximo 7 diapositivas**, contando la de título. Con 8, el proyecto queda afuera de la
   evaluación global.
6. **Todo en inglés.** Las diapositivas se tienen que entender solas, sin nadie que hable.
7. Lo que está entre corchetes, `[ASÍ]`, lo completás vos.

## 3. Las 7 diapositivas

La plantilla te la pasa el encargado 1 (diseño) y las capturas, el encargado 3. Las fuentes van con
letra chica al pie. *Lynceus* es el nombre provisorio: si el equipo elige otro, se cambia
en todos lados.

### Diapositiva 1: título

```text
LYNCEUS
An on-board first read of spaceflight eye changes

[TEAM NAME] · [All member names]
NASA Space Apps Challenge 2026
Create Health Monitoring Software for Astronauts on Space Missions

Simulated data. Not a medical device. Not validated on people.
```

Imagen: logo y captura de la pantalla de resultado.

### Diapositiva 2: el problema

```text
Astronauts' eyes change in space, usually without symptoms

• About 70% of long-duration crew members show at least one sign of SANS.
  These signs can include swelling near the optic nerve and retinal folds.
  16–18% reach NASA's "clinically concerning" level.
• In one published case, the retina was 232 µm thicker
  on flight day 126, with no symptoms.
• Today, the images are read by specialists on Earth.
  Toward Mars, communication delays grow to 10–40 minutes.

Sources: NASA OCHMO-MTB-001 (2024) · Nguyen et al. (2025) ·
Brunstetter et al. (2024) · Brunstetter, NASA presentation (2022)
```

Imagen: un ojo o un corte de tomografía con el nervio óptico (puede ser del visor de la app).

### Diapositiva 3: qué es

```text
A first read on board, right after the exam

After each retinal scan (OCT), the astronaut sees, for each eye:
1. Did it change since before the flight?
2. By how much?
3. How sure is that?
4. What should I do next?

The flight surgeon on Earth gets the same result as a report,
and has the final word.
```

Imagen: captura del resultado (número, rango, nivel y próximo paso). Con el aviso al pie.

### Diapositiva 4: cómo funciona

```text
From the scan to the next step, on the device

1. Vision tests: done by the astronaut
2. OCT capture: 48 scans around the optic nerve, in the file format
   of the tomograph used on the ISS
3. Quality check: up to 3 attempts per eye, or "I can't measure this eye today"
4. Measure: retinal thickness around the optic nerve, as NASA defines it
5. Compare: with the same eye before the flight
6. Decide: error range, NASA thresholds, level and next step
7. Report: ready for the flight surgeon

The analysis runs on the device: no connection to Earth needed.
The scans are simulated; the analysis is real code measuring their pixels.
```

Ideal como diagrama de flechas: el diseñador puede convertir la lista en un dibujo.

### Diapositiva 5: la experiencia

```text
A guided check-up, no medical training needed

[Screenshot 1] Vision tests: near acuity and Amsler grid
[Screenshot 2] OCT capture: what the analysis found in the image
[Screenshot 3] Result: change, range, level and next step
[Screenshot 4] History and report: evolution and questions for the surgeon

In English and Spanish.

Simulated data. Not a medical device. Not validated on people.
```

### Diapositiva 6: ciencia y datos de la NASA

```text
Built on NASA's own definitions

• What we measure: retinal thickness around the optic nerve,
  the measure NASA uses for SANS.
• Thresholds: more than 19.4 µm = first sign (NASA rounds it to 20 µm);
  55 µm or more = clinically concerning.
• Schedule: exams on days 30, 90 and 150 of a 180-day mission,
  following NASA's schedule.
• Device: the Spectralis OCT2 tomograph used on the ISS, and its file format.

Honest limits: tested on 621 simulated captures with known true values.
Error ranges are still provisional. Not validated on people.
It does not diagnose and does not estimate intracranial pressure.

Sources: NASA OCHMO-MTB-001 (2024) · NASA SANS Evidence Report (2022) ·
Laurie et al. (2020)
```

### Diapositiva 7: lo que sigue

```text
Toward the Moon and Mars

Farther from Earth, crews will need to understand their own health
with more autonomy.

Next steps:
• Test on real, independent OCT images reviewed by experts
• Calibrate the error ranges
• Test with crew-like users

Try it: [APP LINK]
Code: [REPO LINK]

Source: Brunstetter, NASA presentation (2022)
```

## 4. El formulario de Space Apps

Pestaña **Project** del equipo. Un bloque por campo.

### Project Name

```text
Lynceus
```

### High-Level Project Summary

```text
Lynceus gives astronauts an on-board first read of Spaceflight-Associated
Neuro-ocular Syndrome (SANS), an eye condition that shows up in about 70% of
long-duration crew members and usually causes no symptoms. After each retinal
OCT exam, it tells the crew member whether the back of each eye changed compared
with their own pre-flight exam, by how much, how certain that result is, and
which monitoring step comes next, using NASA's published definitions and
thresholds. The same result is prepared as a report for the flight surgeon on
Earth, who confirms it and decides.

Our prototype simulates the tomograph used on the International Space Station,
producing fictional exams in its real export format, and analyzes them with a
real, deterministic image-analysis engine that runs on the device. As missions
go farther from Earth, communication delays grow and crews will need to
understand their own health with more autonomy. All data in the demo are
simulated; it is not a medical device.
```

### Link to Project Demo

```text
[SLIDES LINK]
```

### Link to Final Project

```text
[APP LINK]
[REPO LINK]
```

### Detailed Project Description

```text
WHAT IT DOES
Lynceus guides an astronaut through a complete eye check-up for SANS, alone and
without medical training:
1. Start: choose the crew member and flight day; see which check is due.
2. Vision tests, done by the person in front of the screen: a symptom
   questionnaire, near visual acuity (after calibrating the real screen size
   with a card) and an Amsler grid.
3. OCT capture of each eye. If the image is not good enough, the system asks
   for a retake, up to three times; then it says "I can't measure this eye
   today" instead of guessing.
4. Analysis and result, for each eye: whether it changed since before the
   flight, by how much (with a range), how likely the change is to be real,
   the level and the next monitoring step.
5. History: the evolution of each eye across the mission, with thresholds.
6. Medical conference: a downloadable report for the flight surgeon and the
   questions the astronaut wants to ask.

HOW IT WORKS
- A virtual instrument imitates the Heidelberg Spectralis OCT2 used on the ISS:
  48 radial scans centered on the optic nerve, with noise, shadows and capture
  failures, written in the device's real .vol export format.
- An analysis engine reads that file, checks its quality, finds the retinal
  surface and Bruch's membrane with a graph-search method (Chiu et al., 2010),
  locates the optic nerve opening and measures retinal thickness around it, as
  NASA defines it. It also measures the waviness of Bruch's membrane as an
  indicator of new folds.
- Each measurement is compared with the same eye's pre-flight exam and given an
  error range. NASA's thresholds set the level: more than 19.4 µm is a first
  sign (NASA rounds it to 20 µm) and 55 µm or more is clinically concerning.
  Acute vision symptoms trigger contact with the surgeon regardless of the image.
- Image analysis is deterministic for the same inputs and versions. Measurements
  show their units, provenance and, where applicable, provisional ranges and sources.
- An optional assistant answers questions about the result and SANS from a
  fixed, cited knowledge base. It cannot change the level, diagnose or
  recommend medication.

BENEFITS
- The astronaut understands their own status right after the exam, instead of
  waiting for specialists on Earth.
- The flight surgeon receives a traceable report: what was measured, how well,
  with what uncertainty, and which tests were done or skipped.
- The analysis works without a connection, which matters as communication
  delays grow toward the Moon and Mars.

WHAT IS REAL AND WHAT IS SIMULATED
The four crew members and their images are fictional and labelled as simulated
on every screen and report. The vision tests, the image analysis, the rules and
the report are real. We tested the engine on 621 simulated captures with known
true values; the fitted error model did not meet the criteria we set before the
final test, so the app keeps a provisional error model and says so. It is not a
medical device, is not validated on people, does not diagnose and does not
estimate intracranial pressure.

TOOLS AND LANGUAGES
TypeScript throughout; React and Vite for the web app; Vitest for more than 600
automated tests; our own CSS and charts, with no component library; Vercel for
hosting and one serverless function; the Anthropic API (Claude Haiku 5.5) for
the optional assistant. Interface in English and Spanish.
```

### Use of Super Intelligence (SI)

**Antes de pegarlo:** el responsable del proyecto confirma que esto es exacto. Si el encargado 1 usó imágenes
generadas con IA, se agregan acá. Los jueces no ven este campo, pero tiene que ser verdad.

```text
We used AI assistants throughout the hackathon:
- Development: Claude Code and Devin (Claude and GPT models) wrote most of
  the code and tests, from specifications drafted with the assistants and
  approved by our team, and helped draft the documentation and these texts.
  Every stage was tested before being merged.
- Research: AI assistants helped us find, read and summarize NASA documents and
  scientific papers. Every number in the product links back to its original
  source, kept in the repository.
- In the product: the optional assistant uses Claude Haiku 5.5 through the
  Anthropic API to explain results and terms from a fixed, cited knowledge
  base. It cannot change the result, diagnose or recommend medication.
- The image analysis does not use AI: it is a deterministic image-processing
  algorithm.
- The choice of challenge, health problem and solution approach was made by
  our team.
```

### NASA Data

```text
NASA documents are central to the product: they define what is measured, the
thresholds, the levels, the in-flight exam schedule, and the device and file
format we simulate.

1. NASA OCHMO Medical Technical Brief OCHMO-MTB-001, Spaceflight Associated
   Neuro-ocular Syndrome (2024): thresholds, monitoring table, prevalence.
   https://www.nasa.gov/wp-content/uploads/2024/02/ochmo-mtb-001-sans.pdf
2. NASA Human Research Program, Evidence Report: Risk of Spaceflight Associated
   Neuro-ocular Syndrome (2022): what is known about SANS, symptoms, the brain
   and in-flight imaging.
   https://humanresearchroadmap.nasa.gov/evidence/reports/SANS%20EB%202022%20FINAL_8-15-22.pdf
3. NASA Human Research Program, SANS Evidence Report (2017): published cases and
   in-flight vision tests.
   https://humanresearchroadmap.nasa.gov/evidence/reports/SANS.pdf
4. NASA Human Research Program, Risk of Spaceflight Associated Neuro-ocular
   Syndrome (challenge resource).
   https://www.nasa.gov/reference/risk-of-spaceflight-associated-neuro-ocular-syndrome-sans/
5. NASA-STD-3001, Volume 1 Rev. C and Volume 2 Rev. F: crew health standards and
   display and alert colour conventions.
   https://standards.nasa.gov/sites/default/files/standards/NASA/C//nasa-std-3001-vol-1-rev-c-signature.pdf
   https://standards.nasa.gov/system/files/tmp/NASA-STD-3001%20Vol%202%20Rev%20F.pdf
6. NASA presentations on SANS (NASA Technical Reports Server): in-orbit eye
   imaging and communication delays.
   https://ntrs.nasa.gov/citations/20170009173
   https://ntrs.nasa.gov/citations/20220018416
7. Peer-reviewed studies of NASA crew members, listed in the references:
   baseline values, thresholds and evolution curves behind the fictional crew.
```

### Space Agency Partner Data and Other References

```text
Scientific studies
- Laurie et al. 2020, optic disc edema and choroid in flight and in bed rest:
  https://pmc.ncbi.nlm.nih.gov/articles/PMC6990717/
- Macias et al. 2020, ocular changes in 11 astronauts:
  https://pmc.ncbi.nlm.nih.gov/articles/PMC7118682/
- Macias et al. 2021, two crew members of a one-year mission:
  https://pmc.ncbi.nlm.nih.gov/articles/PMC8085766/
- Pardon et al. 2022, optic disc edema in 31 crew members:
  https://pmc.ncbi.nlm.nih.gov/articles/PMC9614681/
- Ferguson et al. 2023, folds in 36 crew members:
  https://pmc.ncbi.nlm.nih.gov/articles/PMC9857718/
- Brunstetter et al. 2024, one astronaut followed in flight with extra exams:
  https://pmc.ncbi.nlm.nih.gov/articles/PMC11273286/
- Nguyen et al. 2025, review of SANS:
  https://pmc.ncbi.nlm.nih.gov/articles/PMC12103276/
- Chiu et al. 2010, automatic segmentation of retinal layers (graph search):
  https://pmc.ncbi.nlm.nih.gov/articles/PMC3408910/
- Chauhan et al. 2015, minimum rim width in 246 healthy people:
  https://pmc.ncbi.nlm.nih.gov/articles/PMC4698808/
- Bach et al. 2025, repeatability of the Freiburg acuity test:
  https://pmc.ncbi.nlm.nih.gov/articles/PMC11868300/
- van Oosterhout et al. 2024, headache in astronauts on the station:
  https://pmc.ncbi.nlm.nih.gov/articles/PMC11033988/
- Spectralis studies used for image parameters and artifacts:
  https://pmc.ncbi.nlm.nih.gov/articles/PMC7533739/
  https://pmc.ncbi.nlm.nih.gov/articles/PMC4423408/
  https://pmc.ncbi.nlm.nih.gov/articles/PMC9754118/
  https://pmc.ncbi.nlm.nih.gov/articles/PMC8515962/
  https://pmc.ncbi.nlm.nih.gov/articles/PMC8718257/
  https://pmc.ncbi.nlm.nih.gov/articles/PMC4525789/

File format and image references
- eyepy, open-source reader of the Heidelberg .vol format (reference for the
  file layout): https://github.com/MedVisBonn/eyepy
- heyexReader, open-source .vol reader (reference for the file layout):
  https://github.com/ayl/heyexReader
- Rabbani, optic nerve head OCT dataset captured with Heidelberg Spectralis
  (reference for scan dimensions):
  https://hrabbani.site123.me/available-datasets/onh-based-oct-of-7-healthy-and-7-glaucoma-data-captured-by-heidelberg-spectralis

Software and services
TypeScript, React, Vite, Vitest, Node.js, pnpm, Vercel, Anthropic API
(Claude Haiku 5.5).
```

## 5. Lista para hoy

| Cuándo | Qué |
|---|---|
| Ya | Crear el equipo en spaceappschallenge.org, con todos los integrantes en el mismo evento local, si todavía no existe |
| Ya | Preguntar al organizador local (*Local Lead*) si hay presentación en vivo u horario propio, y avisarle al responsable del proyecto |
| Ya | Confirmar el nombre del proyecto con el equipo |
| ~15:00 | Recibir la plantilla (encargado 1) y las capturas (encargado 3) |
| ~18:00 | Diapositivas armadas. El encargado 3 compara los números con este documento |
| ~19:00 | Formulario cargado como borrador |
| ~21:00 | El responsable del proyecto pasa los links de la app y del repositorio. Exportar las diapositivas a PDF, subirlas a Google Drive con «cualquier persona con el link puede ver» y probar los tres links en una ventana de incógnito, sin sesión iniciada |
| Antes de las 22:00 | Tildar las dos casillas y apretar **Submit for Judging** |

## 6. Si algo no se entiende

Preguntale al responsable del proyecto, que lo consulta con el agente. No hace falta leer el resto de la
documentación. Si querés ver de dónde sale un número, está en `docs/en/evidence.md`.
