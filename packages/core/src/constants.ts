/**
 * Constants of the instrument (Heidelberg Spectralis OCT2) and of the exam
 * protocol. Each one cites the research document and section it comes from.
 * Ids in brackets are those of `sources.ts`.
 */

/** Columns (A-scans) per B-scan, 15° high-resolution scan. sans-oct-base-tecnica.md 1.A [P8, D2]. */
export const SCAN_COLUMNS = 768;
/** Rows (samples per A-scan). sans-oct-base-tecnica.md 1.A [P8]. */
export const SCAN_ROWS = 496;
/** Lateral pixel size, mm. sans-oct-base-tecnica.md 1.A [P8]. */
export const SCALE_X_MM = 0.0057;
/** Axial pixel size, mm. sans-oct-base-tecnica.md 1.A [P8]. */
export const SCALE_Z_MM = 0.00387;
export const SCALE_X_UM = SCALE_X_MM * 1000;
export const SCALE_Z_UM = SCALE_Z_MM * 1000;
/** B-scans in the NASA OCT2 radial pattern. sans-oct-base-tecnica.md 1.B and 2 [P3, P4]. */
export const RADIAL_SCANS = 48;
/** Angle between neighbouring radial scans, degrees (180° / 48). */
export const RADIAL_STEP_DEG = 180 / RADIAL_SCANS;
/** Frames averaged per B-scan (ART) in the NASA OCT2 radial pattern. sans-oct-base-tecnica.md 2 [P4]. */
export const ART_FRAMES = 25;
/** Fundus (SLO) image size, pixels. sans-spectralis-datos.md 1.2 [C1, D2]. */
export const SLO_SIZE_PX = 1536;
/** Fundus pixel size, mm (illustrative value of sans-spectralis-datos.md 1.2) [C1]. */
export const SLO_SCALE_MM = 0.0057;
/** Fundus field of view, degrees. sans-spectralis-datos.md 1.2 [C1]. */
export const SLO_FIELD_DEG = 30;
/** Quality scale of the instrument: 0 to 40 dB. sans-oct-base-tecnica.md 1.A [P13]. */
export const QUALITY_MAX_DB = 40;
/** Below this quality the manual calls the signal poor. sans-oct-base-tecnica.md 1.A [P13]. */
export const QUALITY_POOR_DB = 15;

/**
 * Length of a B-scan in mm. Our convention (not in the format description): the
 * header start and end points are the centres of the first and last columns, so
 * column j sits at start + j/(SIZE_X − 1)·(end − start).
 */
export const SCAN_LENGTH_MM = (SCAN_COLUMNS - 1) * SCALE_X_MM;

/** Thickness rings around the opening, µm. sans-oct-base-tecnica.md 1.B [P1]. */
export const RINGS_UM: readonly (readonly [number, number])[] = [
  [0, 250],
  [250, 500],
  [500, 1000],
  [1000, 1500],
];

/** Cup reference plane: parallel to the opening plane, 200 µm toward the vitreous. sans-oct-base-tecnica.md 1.B [P3]. */
export const CUP_REFERENCE_UM = 200;

/** Decentration limit: 10 % of the scan length. sans-oct-base-tecnica.md 3.4 [P13]. */
export const DECENTRATION_LIMIT_MM = 0.1 * SCAN_COLUMNS * SCALE_X_MM;
