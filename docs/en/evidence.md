# Evidence and limitations

[Español](../es/evidence.md) · [Home](../../README.md) · [Assumptions](../assumptions.md)

## What supports each value

| Value used | Source and scope |
|---|---|
| Thickness change **> 19.4 µm** | Laurie 2020: two standard deviations of between-exam variation (2 × 9.7 µm) in seven astronauts before flying. NASA's brief rounds the criterion to ≥ 20 µm. The prototype retains > 19.4 |
| Thickness change **≥ 55 µm** | Clinically concerning criterion in NASA's brief and monitoring table |
| Roughness change **> 2.8 µm** | Published repeatability for Bruch's membrane, used here as an indicator of new folds. It is not an intracranial-pressure threshold |
| Routine controls on days **30, 90 and 150** | The NASA-described schedule applied to the fictional 180-day mission |
| OCT after **4 weeks**, Amsler **twice weekly** following a first sign | Project assumption inspired by one published case, not a universal NASA protocol |
| Extreme scenario inspired by **+232 µm** | One published case. Crew member D and her curve are fictional, not prevalence evidence or a reproduced patient |

Main sources:

- [NASA, OCHMO-MTB-001, SANS (2024)](https://www.nasa.gov/wp-content/uploads/2024/02/ochmo-mtb-001-sans.pdf).
- [Laurie and colleagues (2020)](https://pmc.ncbi.nlm.nih.gov/articles/PMC6990717/).
- [Ferguson and colleagues (2023), folds](https://pmc.ncbi.nlm.nih.gov/articles/PMC9857718/).
- [Brunstetter and colleagues (2024), additional-follow-up case](https://pmc.ncbi.nlm.nih.gov/articles/PMC11273286/).
- [Nguyen and colleagues (2025), review](https://pmc.ncbi.nlm.nih.gov/articles/PMC12103276/).
- [NASA SANS evidence report (2022)](https://humanresearchroadmap.nasa.gov/evidence/reports/SANS%20EB%202022%20FINAL_8-15-22.pdf).

Measurements and constants are traced in
[`thresholds.ts`](../../packages/core/src/rules/thresholds.ts),
[`sources.ts`](../../packages/core/src/rules/sources.ts), and the Spanish research on
[OCT](../../monitoreo-salud-astronautas/investigaciones/sans-oct-base-tecnica.md),
[evolution](../../monitoreo-salud-astronautas/investigaciones/sans-evolucion-y-logica-clinica.md)
and [the brain](../../monitoreo-salud-astronautas/investigaciones/sans-cerebro-en-mision.md).
These sources support findings and measurements; they do not certify this software.

## What we evaluated

The virtual instrument generates images with known reference values. The engine
analyzes the pixels and its output is compared with those values. The saved
experiment contains **621 captures from four fictional crew members and eight
virtual eyes**; the **16 references are included** in that count.

Development, held-out anatomy (C), and held-out failure families (A, B and D) were
separated. Repeated captures of one eye are not independent people. The protocol
was recorded before fitting.

The candidate model estimates error using observable quality features.
Coefficients are fitted on development data; the final test evaluates rather than
selects them. Metrics include bias, RMSE, maximum error and interval coverage.

## Result: the fitted model stays inactive

| Candidate evaluation | Relevant result |
|---|---|
| Held-out anatomy, thickness change | 78 pairs; RMSE 2.45 µm, maximum error 8.94 µm versus the project's 6 µm tolerance |
| Held-out anatomy, roughness | Maximum error 2.96 µm versus the project's 1.5 µm tolerance |
| Held-out failures, roughness | 24 pairs; observed coverage of the nominal 95% interval: 79.2% |
| Held-out anatomy, clean captures | Approximately 21% outside the candidate's domain |

These numbers describe the experiment's partitions and filtering, not the
accuracy of all demo results or measurements in people. The 6 and 1.5 µm
engineering tolerances differ from the published clinical thresholds.

The application retains `provisional-1`: assumption-based margins and
probabilities. **Its intervals have not been shown to contain the true value
95% of the time.** A nominal probability is not a probability of having SANS.
The distinction is visible in the result, report and “How it works”.

Errors were also found in accepted captures, including mild motion that
artificially increases roughness. Rejecting poor captures reduces a risk;
it does not guarantee that every accepted capture is correct.

## Reproducible material

- [Protocol](../../packages/validation/protocol.md).
- [Capture rows](../../packages/validation/out/quality-rows.json).
- [Full report](../../packages/validation/out/quality-validation.md).
- [Summary used by the UI](../../packages/core/src/dataset/validation-summary.json).
- [Timing and preserved-file hash](../../packages/validation/out/quality-run.md).

`pnpm --filter @app/validation quality:fit -- --check` checks that the summary and
report derive from the saved rows. It does not regenerate captures. The second
long run was interrupted: the preserved file matching the first run does not
prove that the second run completed.

## What remains unproven

The generator and engine share anatomical simplifications, which can favor
synthetic results. Independent images, real variation, expert corrections,
calibrated intervals and real-user utility still need evaluation. Neither the
number of software tests nor the `.vol` format establishes clinical validation
or full interoperability with the physical instrument.

The reviewed sources do not support deriving intracranial pressure from OCT.
Pre-/post-flight brain MRI findings are not measurements available here.
Headache is recorded without attributing it causally to SANS.
