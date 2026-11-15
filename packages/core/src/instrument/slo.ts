/**
 * Fundus (infrared SLO) image of the virtual instrument (spec 01, 5.6): mid-grey
 * background with smooth variation and fine texture, a brighter nerve head with a
 * brighter cup, dark vessels from the same tree as the B-scans, slight vignetting,
 * and `SIMULATED DATA` written in its own bitmap font in the lower-left corner,
 * so the mark travels inside the file.
 */
import { SLO_SCALE_MM, SLO_SIZE_PX, CUP_REFERENCE_UM } from '../constants';
import type { EyeState } from '../eye/model';
import type { VesselHit } from '../eye/vessels';
import { smoothstep } from '../math/interp';
import { fundusToAnatomical, type ExamGeometry } from './geometry';
import { SIMULATED_MARK, textMask } from './font';
import { hashNoise, seedOf, valueNoise2 } from './texture';

/** Writes `text` with the bitmap font on a dark box; (x, y) is the top-left of the box. */
export function stampText(img: Uint8Array, width: number, height: number, text: string, x: number, y: number, scale: number): void {
  const m = textMask(text, scale);
  for (let yy = 0; yy < m.height; yy++) {
    for (let xx = 0; xx < m.width; xx++) {
      const px = x + xx;
      const py = y + yy;
      if (px < width && py < height) img[py * width + px] = m.mask[yy * m.width + xx] ? 240 : 16;
    }
  }
}

export function renderSlo(state: EyeState, geometry: ExamGeometry, noiseKey: string): Uint8Array {
  const n = SLO_SIZE_PX;
  const img = new Uint8Array(n * n);
  const model = state.model;
  const eyeSeed = seedOf(`slo/${model.crewId}/${model.eye}`);
  const sensorSeed = seedOf(noiseKey);
  const hit: VesselHit = { distanceUm: 0, radiusUm: 0, artery: false };
  const centre = (n - 1) / 2;
  const maxR2 = 2 * centre * centre;
  const reach = 1.25 * Math.max(model.ellipseAxisH, model.ellipseAxisV) + 200;
  // The fundus → anatomy map is affine: x = ox + ax·px + bx·py (and the same for y).
  const [ox, oy] = fundusToAnatomical(geometry, 0.5 * SLO_SCALE_MM, 0.5 * SLO_SCALE_MM);
  const [x1, y1] = fundusToAnatomical(geometry, 1.5 * SLO_SCALE_MM, 0.5 * SLO_SCALE_MM);
  const [x2, y2] = fundusToAnatomical(geometry, 0.5 * SLO_SCALE_MM, 1.5 * SLO_SCALE_MM);
  const ax = x1 - ox;
  const ay = y1 - oy;
  const bx = x2 - ox;
  const by = y2 - oy;
  // Smooth background variation on a coarse grid (every 16 pixels), interpolated.
  const G = 16;
  const gn = Math.ceil(n / G) + 1;
  const coarse = new Float64Array(gn * gn);
  for (let gy = 0; gy < gn; gy++) {
    for (let gx = 0; gx < gn; gx++) {
      const x = ox + ax * gx * G + bx * gy * G;
      const y = oy + ay * gx * G + by * gy * G;
      coarse[gy * gn + gx] = 104 + 22 * (valueNoise2(x / 1700, y / 1700, eyeSeed) - 0.5) + 12 * (valueNoise2(x / 520, y / 520, eyeSeed + 1) - 0.5);
    }
  }
  for (let py = 0; py < n; py++) {
    const gy = Math.floor(py / G);
    const ty = (py - gy * G) / G;
    for (let px = 0; px < n; px++) {
      const x = ox + ax * px + bx * py;
      const y = oy + ay * px + by * py;
      // Background: smooth variation and fine texture of the fundus, fixed to the anatomy.
      const gx = Math.floor(px / G);
      const tx = (px - gx * G) / G;
      const c00 = coarse[gy * gn + gx]!;
      const c10 = coarse[gy * gn + gx + 1]!;
      const c01 = coarse[(gy + 1) * gn + gx]!;
      const c11 = coarse[(gy + 1) * gn + gx + 1]!;
      let v = c00 + (c10 - c00) * tx + (c01 - c00) * ty + (c00 - c10 - c01 + c11) * tx * ty;
      v += 9 * (valueNoise2(x / 45, y / 45, eyeSeed + 2) - 0.5);
      // Nerve head: brighter, the cup brighter still.
      const r = Math.hypot(x, y);
      if (r < reach) {
        const theta = Math.atan2(y, x);
        const rb = model.bmoRadius(theta);
        const rho = r - rb;
        v += 46 * (1 - smoothstep(-70, 50, rho)) + 10 * (1 - smoothstep(0, 120, rho)) * smoothstep(-40, 0, rho);
        if (rho < 0) {
          const depth = CUP_REFERENCE_UM - state.cupHeightUm(r / rb, theta);
          v += 48 * smoothstep(-80, 220, depth);
        }
      }
      // Vessels: dark lines with soft edges.
      if (model.vessels.query(x, y, hit)) {
        const d = hit.distanceUm / hit.radiusUm;
        const profile = Math.sqrt(Math.max(0, 1 - d * d));
        v *= 1 - (hit.artery ? 0.3 : 0.4) * smoothstep(0, 0.6, profile);
      }
      // Sensor noise and vignetting.
      v += 6 * (hashNoise(px, py, sensorSeed) - 0.5);
      const dx = px - centre;
      const dy = py - centre;
      v *= 1 - 0.28 * ((dx * dx + dy * dy) / maxR2);
      img[py * n + px] = v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
    }
  }
  stampText(img, n, n, SIMULATED_MARK, 24, n - 24 - 7 * 6 - 4 * 6, 6);
  return img;
}
