import { expect, it } from 'vitest';
import type { CrewId, Eye } from '@app/core';
import { accuracyForEye } from '../src/accuracySuite';

/**
 * Spec test 6, for one crew member: on normal captures, the error of the change of the
 * 0–250 µm ring is ≤ 6 µm in at least 95 % of cases and never above 10 µm; the error of
 * the change of roughness ≤ 1.5 µm. The 95 % criterion is over all 32 cases (see the
 * `accuracy` program); per crew member each case is held to 6 µm, which is stricter.
 */
export function accuracyTests(crewId: CrewId): void {
  for (const eye of ['OD', 'OS'] as Eye[]) {
    it(`${crewId} ${eye}: change of the ring within 6 µm (never 10) and of roughness within 1.5 µm`, () => {
      const rows = accuracyForEye(crewId, eye);
      expect(rows.length).toBe(4);
      for (const r of rows) {
        expect(Math.abs(r.errorUm), `day ${r.flightDay}`).toBeLessThanOrEqual(6);
        expect(Math.abs(r.roughnessErrorUm), `day ${r.flightDay}`).toBeLessThanOrEqual(1.5);
      }
    }, 600000);
  }
}
