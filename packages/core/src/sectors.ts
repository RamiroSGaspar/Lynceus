/**
 * Garway-Heath sectors of the opening edge, relative to the temporal–nasal axis
 * (spec 01, 6.5 [P6]; ignoring the fovea–opening angle is our assumption):
 * temporal 90° centred on 0°, then 40° sectors temporal-superior and nasal-superior,
 * nasal 110° centred on 180°, then nasal-inferior and temporal-inferior.
 * Anatomical angle: 0° temporal, 90° superior, 180° nasal, 270° inferior.
 */
import type { Sector } from './contract';

export const SECTORS: readonly Sector[] = ['T', 'TS', 'NS', 'N', 'NI', 'TI'];

export function sectorOf(thetaDeg: number): Sector {
  const t = ((thetaDeg % 360) + 360) % 360;
  if (t >= 315 || t < 45) return 'T';
  if (t < 85) return 'TS';
  if (t < 125) return 'NS';
  if (t < 235) return 'N';
  if (t < 275) return 'NI';
  return 'TI';
}
