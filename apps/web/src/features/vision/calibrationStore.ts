import type { ScreenCalibration } from '@app/core';
import { makeScreenCalibration } from '@app/core/vision/index';

/** Own key: the calibration belongs to this screen and this browser, not to a session. */
const STORAGE_KEY = 'vision.calibration.v1';

export interface StoredCalibration {
  calibration: ScreenCalibration;
  /** `devicePixelRatio` when it was taken; a different value means the zoom changed. */
  devicePixelRatio: number;
}

export function loadCalibration(): StoredCalibration | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { pxPerMm?: unknown; devicePixelRatio?: unknown };
    if (typeof parsed.pxPerMm !== 'number' || typeof parsed.devicePixelRatio !== 'number') return null;
    if (!(parsed.pxPerMm > 0)) return null;
    return { calibration: makeScreenCalibration(parsed.pxPerMm), devicePixelRatio: parsed.devicePixelRatio };
  } catch {
    return null;
  }
}

export function saveCalibration(pxPerMm: number, devicePixelRatio: number): StoredCalibration {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ pxPerMm, devicePixelRatio }));
  } catch {
    // Without storage the calibration still works for this visit.
  }
  return { calibration: makeScreenCalibration(pxPerMm), devicePixelRatio };
}
