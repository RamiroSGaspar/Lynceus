/**
 * Lynceus demo video: the flight-day-126 control of simulated crew member C, produced by
 * the virtual instrument and measured by the real analysis engine, exactly as the
 * application does it. SIMULATED DATA: no number here comes from a person.
 *
 * Writes to ../animacion/datos/:
 * - control-C-d126.json: the session assessment, its English explanation and what each
 *   scene draws (engine lines of one scan, scan geometry, per-scan quality).
 * - fondo-C-OD-d126.png: fundus image of the right eye (the instrument stamps it).
 * - corte-C-OD-d126-k0.png and corte-C-OD-d0-k0.png: the horizontal scan through the
 *   nerve today and before the flight, stamped with the simulated-data mark.
 *
 * Run from the repository root:
 *   pnpm --filter @app/validation exec tsx ../../monitoreo-salud-astronautas/video-demo/datos/generar-control.ts
 * Deterministic: the same code gives the same bytes.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  acquire,
  analyzeExam,
  assessSession,
  explainAssessment,
  getHistory,
  toDisplayGray,
  visionScenario,
  CREW,
  PRODUCT,
  ENGINE_VERSION,
  RULES_VERSION,
  SCAN_COLUMNS,
  SCAN_ROWS,
  SLO_SIZE_PX,
  SLO_SCALE_MM,
  SCALE_X_MM,
  SCALE_Z_MM,
  type CrewId,
  type Eye,
  type ExamSource,
  type EyeCaptureResult,
} from '../../../packages/core/src/index';
import { SIMULATED_MARK, textMask } from '../../../packages/core/src/instrument/font';
import { captureEye, measureRequest } from '../../../packages/validation/src/historySuite';
import { encodePng } from '../../../packages/validation/src/png';

const CREW_ID: CrewId = 'C';
const FLIGHT_DAY = 126;
/** The horizontal radial scan, through the centre of the nerve. */
const SCAN_K = 0;

const OUT = fileURLToPath(new URL('../animacion/datos/', import.meta.url));

/** Stamps the simulated-data mark in the lower left corner, white on a black box (AGENTS.md rule 8). */
function stamp(gray: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
  const out = gray.slice();
  const { width: w, height: h, mask } = textMask(SIMULATED_MARK, 2);
  const x0 = 8;
  const y0 = height - h - 8;
  for (let y = -3; y < h + 3; y++) for (let x = -3; x < w + 3; x++) out[(y0 + y) * width + x0 + x] = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y * w + x]) out[(y0 + y) * width + x0 + x] = 255;
  return out;
}

function round(values: ArrayLike<number>, decimals = 2): (number | null)[] {
  const f = 10 ** decimals;
  return Array.from(values, (v) => (Number.isFinite(v) ? Math.round(v * f) / f : null));
}

function acceptedAttempt(capture: EyeCaptureResult): number {
  if (!capture.accepted) throw new Error(`${capture.eye}: the engine could not measure this eye on day ${FLIGHT_DAY}`);
  return capture.attempts[capture.attempts.length - 1]!.attempt;
}

/** What the scene of one scan draws: the image and the two edges the engine found. */
function scanScene(exam: ExamSource, file: string, baseline?: Parameters<typeof analyzeExam>[1]) {
  const analysis = analyzeExam(exam, baseline ?? {});
  const scan = analysis.scans[SCAN_K];
  if (!scan) throw new Error(`Scan ${SCAN_K} was not analysed`);
  const pixels = exam.bscan(SCAN_K).pixels;
  writeFileSync(join(OUT, file), encodePng(SCAN_COLUMNS, SCAN_ROWS, stamp(toDisplayGray(pixels), SCAN_COLUMNS, SCAN_ROWS), 1));
  return {
    file,
    qualityDb: Math.round(scan.qualityDb * 10) / 10,
    usable: scan.usable,
    ilmPx: round(scan.ilmPx),
    bmPx: round(scan.bmPx),
    bmo: scan.bmo.map((p) => (p ? { columnPx: Math.round(p.columnPx * 100) / 100, rowPx: Math.round(p.rowPx * 100) / 100 } : null)),
    analysis,
  };
}

function main(): void {
  mkdirSync(OUT, { recursive: true });
  const member = CREW.find((c) => c.id === CREW_ID)!;
  // The application's own history: the sessions before today, measured ahead of time by the engine.
  const history = getHistory(CREW_ID, FLIGHT_DAY);
  const preflight = history.find((r) => r.flightDay === 0);
  if (!preflight) throw new Error('No pre-flight session');
  const eyes = {} as Record<Eye, EyeCaptureResult>;
  for (const eye of ['OD', 'OS'] as const) {
    const baseline = preflight.eyes[eye].accepted;
    if (!baseline) throw new Error(`${eye}: no pre-flight reference`);
    eyes[eye] = captureEye(measureRequest, CREW_ID, eye, FLIGHT_DAY, baseline);
  }
  // The script says "You see fine" and "you can't feel it": in this session the crew member answers
  // the questionnaire with no symptom, as anyone can in a live session of the application. The vision
  // tests stay those of the application's own scenario. The tomography does not depend on this.
  const scenario = visionScenario(CREW_ID, FLIGHT_DAY);
  const vision = {
    ...scenario,
    symptoms: {
      ...scenario.symptoms,
      changeNoticed: false,
      answers: Object.fromEntries(Object.keys(scenario.symptoms.answers).map((id) => [id, { present: false }])) as typeof scenario.symptoms.answers,
    },
  };
  const assessment = assessSession({ crewId: CREW_ID, flightDay: FLIGHT_DAY, eyes, vision, history });
  const explanation = explainAssessment(assessment, 'en');

  // Images of both eyes today, and of the right eye (the larger change) before the flight.
  const r1 = (v: number) => Math.round(v * 10) / 10;
  const perEye = {} as Record<Eye, ReturnType<typeof eyeImages>>;
  function eyeImages(eye: Eye) {
    const capture = eyes[eye];
    const today = acquire({ crewId: CREW_ID, eye, flightDay: FLIGHT_DAY, attempt: acceptedAttempt(capture) });
    const fundusFile = `fondo-${CREW_ID}-${eye}-d${FLIGHT_DAY}.png`;
    writeFileSync(join(OUT, fundusFile), encodePng(SLO_SIZE_PX, SLO_SIZE_PX, today.slo, 1));
    const scene = scanScene(today, `corte-${CREW_ID}-${eye}-d${FLIGHT_DAY}-k${SCAN_K}.png`, { baseline: preflight!.eyes[eye].accepted! });
    const scans = Array.from({ length: today.header.numBScans }, (_, k) => {
      const h = today.bscan(k).header;
      const a = scene.analysis.scans[k];
      return {
        k,
        // Ends of the scan line on the fundus image, in fundus pixels.
        fromPx: [r1(h.startXMm / SLO_SCALE_MM - 0.5), r1(h.startYMm / SLO_SCALE_MM - 0.5)],
        toPx: [r1(h.endXMm / SLO_SCALE_MM - 0.5), r1(h.endYMm / SLO_SCALE_MM - 0.5)],
        qualityDb: a ? r1(a.qualityDb) : null,
        usable: a?.usable ?? false,
      };
    });
    const bmo = scene.analysis.bmo;
    const last = capture.attempts[capture.attempts.length - 1]!;
    return {
      fundus: { file: fundusFile, sizePx: SLO_SIZE_PX },
      quality: { attempt: last.attempt, meanQualityDb: r1(last.meanQualityDb), usableScans: last.usableScans, totalScans: today.header.numBScans },
      opening: bmo
        ? {
            centerPx: [r1(bmo.centerXMm / SLO_SCALE_MM - 0.5), r1(bmo.centerYMm / SLO_SCALE_MM - 0.5)],
            semiMajorPx: r1(bmo.semiMajorMm / SLO_SCALE_MM),
            semiMinorPx: r1(bmo.semiMinorMm / SLO_SCALE_MM),
            angleDeg: r1(bmo.angleDeg),
          }
        : null,
      scans,
      scan: { ...scene, analysis: undefined },
    };
  }
  for (const eye of ['OD', 'OS'] as const) perEye[eye] = eyeImages(eye);
  const eye: Eye = 'OD';
  const before = acquire({ crewId: CREW_ID, eye, flightDay: 0, attempt: preflight.eyes[eye].attempts[preflight.eyes[eye].attempts.length - 1]!.attempt });
  const sceneBefore = scanScene(before, `corte-${CREW_ID}-${eye}-d0-k${SCAN_K}.png`);
  // Earlier controls, for the mission line and the change scale of the result screen.
  const controls = history.map((r) => ({
    flightDay: r.flightDay,
    level: r.assessment.level,
    eyes: Object.fromEntries(
      (['OD', 'OS'] as const).map((e) => [e, { level: r.assessment.eyes[e].level, changeUm: r.assessment.eyes[e].change ? r1(r.assessment.eyes[e].change!.trtRingUm.value) : null }]),
    ),
  }));

  const out = {
    simulated: true,
    notice: 'SIMULATED DATA. Fictional crew member, virtual instrument, real analysis engine. Not a medical device; not validated on people.',
    howMade:
      'monitoreo-salud-astronautas/video-demo/datos/generar-control.ts: history from getHistory (measured-history.json), today captured with captureEye(measureRequest) and assessed with assessSession, as the application does.',
    versions: { engine: ENGINE_VERSION, rules: RULES_VERSION, errorModel: assessment.errorModelVersion },
    // The product name and the simulated-data notice come from packages/core/src/product.ts (AGENTS.md rule 10).
    product: { name: PRODUCT.name, notice: PRODUCT.simulatedDataNotice.en },
    crew: { id: member.id, patientId: member.patientId, role: member.role.en },
    flightDay: FLIGHT_DAY,
    historyDays: history.map((r) => r.flightDay),
    controls,
    visionNote: 'Questionnaire answered with no symptom (the script: "You see fine"); vision tests from visionScenario.',
    assessment,
    explanation,
    images: {
      scanK: SCAN_K,
      scale: { sloMmPerPx: SLO_SCALE_MM, scanXMmPerPx: SCALE_X_MM, scanZMmPerPx: SCALE_Z_MM },
      OD: perEye.OD,
      OS: perEye.OS,
      // The right eye's same scan before the flight: the "before" of the swelling scene.
      beforeOD: { ...sceneBefore, analysis: undefined },
    },
  };
  writeFileSync(join(OUT, `control-${CREW_ID}-d${FLIGHT_DAY}.json`), JSON.stringify(out, null, 1) + '\n');
  const od = assessment.eyes.OD;
  console.log(
    `C day ${FLIGHT_DAY}: level ${assessment.level}, contact ${assessment.contact}; OD ${od.change?.trtRingUm.value.toFixed(1)} µm` +
      ` [${od.change?.trtRingUm.interval95?.map((v) => v.toFixed(1)).join(', ')}]; history ${out.historyDays.join(', ')}`,
  );
}

main();
