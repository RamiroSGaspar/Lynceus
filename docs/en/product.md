# The product

[Español](../es/product.md) · [Home](../../README.md) · [Demo](demo.md)

## The need

On long flights, changes around the optic nerve can develop without noticeable
symptoms. SANS includes several ocular findings; this prototype focuses on
**retinal thickening near the nerve and folds**.

A readable first assessment on board becomes valuable when communication with
Earth is delayed. The aim is to organize information for the crew member and
flight surgeon: what changed, by how much, with what uncertainty, and which
monitoring step the tool proposes. See [evidence](evidence.md) for the scientific
basis and sources.

## The workflow

1. Choose a fictional crew member and mission day.
2. Complete symptoms, near acuity and Amsler, or explicitly skip them.
3. Request an OCT capture of each eye. The virtual instrument draws the image;
   the engine measures it.
4. Repeat a rejected capture, up to three attempts per eye.
5. Read the comparison with the same eye before the flight.
6. Explore the history and prepare a report and questions for the surgeon.

The UI supports English and Spanish. Analysis runs in the browser; the viewer
shows scans, detected boundaries, measured regions and the reference exam.

## Reading the result

| Part | Meaning |
|---|---|
| Thickness change, µm | Today's measurement minus the same eye's baseline |
| Roughness change, µm | Change in Bruch's membrane undulation, used as a folds indicator |
| Range and probability | Estimates from the **provisional** error model, with unvalidated coverage |
| Level | Published thresholds combined with the project's monitoring rules |
| Next step | Proposed monitoring and surgeon contact; additional frequencies are assumptions |
| “Could not measure” | No usable measurement; it does not mean “no change” |

An increase **greater than 19.4 µm** crosses the first-sign threshold used by the
prototype; **55 µm or more** crosses the clinically concerning threshold. Folds
and symptoms can also affect the level. A level name is not a diagnosis.
The [evidence table](evidence.md) separates published values from project choices
and explains NASA's rounded presentation of the first threshold as 20 µm.

If neither eye can be measured and no acute symptom independently determines the
level, the session has no level. An acute symptom can require immediate contact
even when the OCT shows no change.

## Fictional inputs and executed calculations

| Element | Nature |
|---|---|
| Crew, mission and evolution | Invented scenarios informed by scientific references |
| Images and capture failures | Simulated by a virtual instrument |
| Image reading and analysis | Calculations executed on simulated pixels |
| Included history | Simulated exams already processed by the engine |
| Historical vision and symptoms | Invented scenarios, not inferred from OCT |
| Visitor-completed tests | Actual responses in that interaction, within a fictional demo |
| Current uncertainty | Provisional estimate, not demonstrated clinical accuracy |

“Measured” describes how a number was obtained. A measurement can come from a
simulated image; it does not make the crew member a real person.

## Four scenarios

| ID / name | Scenario intent |
|---|---|
| A / Kofi Mensah | Small changes without progression in the scenario |
| B / Elena Voss | Gradual increase crossing the first threshold |
| C / Ravi Anand | Clinically concerning change, asymmetry and folds |
| D / Lucía Ferreyra | Extreme change inspired by a published asymptomatic case |

Exact curves and names are project choices. D does not reproduce an identifiable
astronaut's medical history.

## Assistant and privacy

The assistant explains terms, results, SANS knowledge and questions for the
surgeon, using a fixed cited knowledge base. It does not set the level, prescribe
or estimate intracranial pressure.

Queries require consent and send the question and numerical summary without crew
identity to Anthropic. Images remain on the device. Controls and questions for the
surgeon are saved in the browser and can be deleted from the start screen. There
is no cross-device history synchronization.

## Current scope

The local demo completes the workflow and downloads the report. The 621-capture
evaluation is published; the fitted model remains experimental and the provisional
model remains active. Six real-provider Haiku 5.5 cases and one UI query were
completed in the development environment. Results and a wording observation are
recorded in [development](development.md). A new installation still needs a key.

The tool does not measure intracranial pressure, brain changes, refraction, cysts
or choroidal thickness. It is not validated on patients, real astronauts or the
physical tomograph. The [central assumptions](../assumptions.md) and
[evaluation report](../../packages/validation/out/quality-validation.md) document
these limits.
