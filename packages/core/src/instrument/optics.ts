/**
 * How each tissue looks to the instrument (spec 01, 3.7 and 5.2). Simple
 * single-scattering model, column by column:
 *   signal(z) = backscatter(z) · exp(−2 ∫₀ᶻ attenuation) · falloff(row),
 * with a sensitivity fall-off of 4 dB per mm of depth from row 0 (our assumption:
 * the real curve was not found, sans-oct-base-tecnica.md 3.2). Backscatter values
 * are calibrated so a clean scan shows the grey levels of spec 3.7 (our assumption,
 * built on the qualitative description of sans-oct-base-tecnica.md 3.1).
 */
import { SCALE_Z_MM } from '../constants';
import { reflectivityForGray } from '../vol/display';

export const Tissue = {
  Vitreous: 0,
  Rnfl: 1,
  GclIpl: 2,
  Inl: 3,
  Opl: 4,
  Onl: 5,
  Elm: 6,
  Myoid: 7,
  Ellipsoid: 8,
  OuterSegment: 9,
  Interdigitation: 10,
  RpeBm: 11,
  Choroid: 12,
  Sclera: 13,
  Prelaminar: 14,
  Lamina: 15,
  Retrolaminar: 16,
  Vessel: 17,
  Count: 18,
} as const;
export type Tissue = (typeof Tissue)[keyof typeof Tissue];

/** Target grey after the display transform (0 black, 1 white). Midpoints of spec 3.7 unless noted. */
const TARGET_GRAY: Record<number, number> = {
  [Tissue.Rnfl]: 0.66,
  [Tissue.GclIpl]: 0.515,
  [Tissue.Inl]: 0.39,
  [Tissue.Opl]: 0.51,
  [Tissue.Onl]: 0.31,
  [Tissue.Elm]: 0.46,
  // Not in the table: the darker gaps between the three thin outer bands (our choice).
  [Tissue.Myoid]: 0.37,
  [Tissue.Ellipsoid]: 0.73,
  [Tissue.OuterSegment]: 0.42,
  [Tissue.Interdigitation]: 0.62,
  [Tissue.RpeBm]: 0.86,
  [Tissue.Choroid]: 0.5,
  [Tissue.Sclera]: 0.45,
  [Tissue.Prelaminar]: 0.57,
  [Tissue.Lamina]: 0.47,
  // Not in the table: retrolaminar nerve and the retinal vessel wall (our choice).
  [Tissue.Retrolaminar]: 0.22,
  [Tissue.Vessel]: 0.7,
};

/** Grey of the choroidal vessel lumens (spec 3.7: 0.25–0.35). */
export const CHOROID_LUMEN_GRAY = 0.3;

/** Attenuation, 1/mm, single pass. Chosen so deep tissue fades as described (our assumption). */
const ATTENUATION_PER_MM: Record<number, number> = {
  [Tissue.Vitreous]: 0,
  [Tissue.Rnfl]: 1.2,
  [Tissue.GclIpl]: 1.0,
  [Tissue.Inl]: 0.8,
  [Tissue.Opl]: 1.0,
  [Tissue.Onl]: 0.6,
  [Tissue.Elm]: 1.0,
  [Tissue.Myoid]: 1.0,
  [Tissue.Ellipsoid]: 2.0,
  [Tissue.OuterSegment]: 1.0,
  [Tissue.Interdigitation]: 2.0,
  [Tissue.RpeBm]: 12,
  [Tissue.Choroid]: 3,
  [Tissue.Sclera]: 5,
  [Tissue.Prelaminar]: 2.2,
  [Tissue.Lamina]: 4,
  [Tissue.Retrolaminar]: 6,
  [Tissue.Vessel]: 0,
};

/** Split of the photoreceptor band (16 % of the outer retina, spec 3.7) into its thin lines and gaps (our choice). */
export const PHOTORECEPTOR_SPLIT = [
  [Tissue.Elm, 0.1],
  [Tissue.Myoid, 0.22],
  [Tissue.Ellipsoid, 0.24],
  [Tissue.OuterSegment, 0.2],
  [Tissue.Interdigitation, 0.24],
] as const;

/** Sensitivity fall-off with depth: 4 dB per mm from row 0 (our assumption, spec 5.2). */
export const FALLOFF_DB_PER_MM = 4;

/** Grey of the vitreous (noise only). Spec 3.7 gives 0.10–0.16; the low end keeps the quality index near 30 dB. */
export const VITREOUS_GRAY = 0.1;

/** Mean noise floor, linear reflectivity, chosen so the vitreous shows `VITREOUS_GRAY`. */
export const NOISE_FLOOR = reflectivityForGray(VITREOUS_GRAY);

export function falloff(row: number): number {
  return Math.pow(10, (-FALLOFF_DB_PER_MM * row * SCALE_Z_MM) / 10);
}

/** Attenuation per row (single pass) of each tissue. */
export const ATTENUATION_PER_ROW = new Float64Array(Tissue.Count);
/** Calibrated backscatter of each tissue. */
export const BACKSCATTER = new Float64Array(Tissue.Count);
export let CHOROID_LUMEN_BACKSCATTER = 0;

/**
 * Calibration: in a reference column (inner surface at row 110, nerve fibre layer
 * 104 µm, outer retina 215 µm, choroid 220 µm; and for the nerve head, tissue
 * starting at row 200 with the lamina 300 µm deeper), each tissue's backscatter is
 * set so that its centre shows the target grey.
 */
function calibrate(): void {
  for (let t = 0; t < Tissue.Count; t++) ATTENUATION_PER_ROW[t] = (ATTENUATION_PER_MM[t] ?? 0) * SCALE_Z_MM;
  const um = 1 / (SCALE_Z_MM * 1000);
  const outer = 215;
  const seq: [Tissue, number][] = [
    [Tissue.Rnfl, 104],
    [Tissue.GclIpl, 0.27 * outer],
    [Tissue.Inl, 0.14 * outer],
    [Tissue.Opl, 0.1 * outer],
    [Tissue.Onl, 0.24 * outer],
    ...PHOTORECEPTOR_SPLIT.map(([t, f]) => [t, f * 0.16 * outer] as [Tissue, number]),
    [Tissue.RpeBm, 0.09 * outer],
    [Tissue.Choroid, 220],
    [Tissue.Sclera, 200],
  ];
  const setFrom = (start: number, layers: [Tissue, number][], probeAt: (t: Tissue) => 'centre' | 'top'): void => {
    let row = start;
    let tau = 0;
    for (const [t, thicknessUm] of layers) {
      const rows = thicknessUm * um;
      const at = probeAt(t) === 'top' ? Math.min(2, rows / 2) : rows / 2;
      const tauAt = tau + ATTENUATION_PER_ROW[t]! * at;
      const signal = reflectivityForGray(TARGET_GRAY[t]!) - NOISE_FLOOR;
      BACKSCATTER[t] = signal / (Math.exp(-2 * tauAt) * falloff(row + at));
      tau += ATTENUATION_PER_ROW[t]! * rows;
      row += rows;
    }
  };
  setFrom(110, seq, (t) => (t === Tissue.Sclera ? 'top' : 'centre'));
  setFrom(
    200,
    [
      [Tissue.Prelaminar, 300],
      [Tissue.Lamina, 250],
      [Tissue.Retrolaminar, 200],
    ],
    (t) => (t === Tissue.Prelaminar ? 'top' : 'centre'),
  );
  // The vessel wall shows its grey at the top of the vessel, under the nerve fibres above it.
  setFrom(110, [[Tissue.Vessel, 20]], () => 'top');
  BACKSCATTER[Tissue.Vessel] = BACKSCATTER[Tissue.Vessel]! * Math.exp(-2 * ATTENUATION_PER_ROW[Tissue.Rnfl]! * 30 * um);
  CHOROID_LUMEN_BACKSCATTER = (BACKSCATTER[Tissue.Choroid]! * (reflectivityForGray(CHOROID_LUMEN_GRAY) - NOISE_FLOOR)) / (reflectivityForGray(TARGET_GRAY[Tissue.Choroid]!) - NOISE_FLOOR);
}

calibrate();

/** Speckle: averaged intensity of N frames ~ Gamma(N_eff), N_eff = 12.5 for ART 25 (our assumption, spec 5.3). */
export const SPECKLE_EFFECTIVE_FRAMES = 12.5;
/** Log-normal with the same mean (1) and variance (1/N_eff) as that gamma. */
export const SPECKLE_SIGMA = Math.sqrt(Math.log(1 + 1 / SPECKLE_EFFECTIVE_FRAMES));

/** System blur: ~7 µm axial and ~14 µm lateral resolution taken as full width at half maximum (spec 5.2). */
export const BLUR_SIGMA_Z_PX = 7 / 2.3548 / (SCALE_Z_MM * 1000);
export const BLUR_SIGMA_X_PX = 14 / 2.3548 / 5.7;
