/**
 * Why a capture could not be measured, in plain words, and what to do differently.
 * The first sentence is the core's own text for each reason (`packages/core/src/texts`),
 * so the capture step and the result say the same thing; the advice is ours.
 */
import type { ExamRejection, Locale, ScanRejection } from '@app/core';
import { EN } from '@app/core/texts/en';
import { ES } from '@app/core/texts/es';

export type CaptureReason = ExamRejection | ScanRejection;

export const SCAN_REJECTIONS: readonly ScanRejection[] = ['low-signal', 'signal-dropout', 'truncated', 'surface-not-found', 'bmo-not-found', 'motion'];
export const EXAM_REJECTIONS: readonly ExamRejection[] = [
  'too-few-usable-scans',
  'bmo-fit-failed',
  'bmo-mismatch-with-baseline',
  'insufficient-ring-coverage',
  'decentered',
];

const ADVICE: Readonly<Record<Locale, Readonly<Record<CaptureReason, string>>>> = {
  en: {
    'low-signal': 'Blink a few times to wet the eye, keep it wide open and still, and capture again. If it happens again, check the focus of the instrument.',
    'signal-dropout': 'Blink before the capture, not during it: keep the eye open until the scans finish, and capture again.',
    truncated: 'Adjust the position of the image so the whole retina fits inside the frame, and capture again.',
    'surface-not-found': 'The image was too dark or blurred to find the retina. Blink, keep the eye still and capture again.',
    'bmo-not-found': 'Look at the fixation target so the scans stay centred on the optic nerve, and capture again.',
    motion: 'Keep looking at the fixation target without moving until the capture ends, and capture again.',
    'too-few-usable-scans': 'Keep the eye open and still on the fixation target during the whole capture, and capture again.',
    'bmo-fit-failed': 'Keep the eye still on the fixation target, and capture again.',
    'bmo-mismatch-with-baseline': 'This can come from a poor match with the position of the pre-flight exam. Capture again; if it persists, your flight surgeon will check the images.',
    'insufficient-ring-coverage': 'Part of the image near the optic nerve was lost in several scans. Keep the eye open and still, and capture again.',
    decentered: 'Look straight at the fixation target so the pattern is centred on the optic nerve, and capture again.',
  },
  es: {
    'low-signal': 'Parpadeá unas veces para humedecer el ojo, mantenelo bien abierto y quieto, y capturá de nuevo. Si vuelve a pasar, revisá el foco del equipo.',
    'signal-dropout': 'Parpadeá antes de la captura, no durante: mantené el ojo abierto hasta que terminen los cortes, y capturá de nuevo.',
    truncated: 'Ajustá la posición de la imagen para que la retina entre entera en el cuadro, y capturá de nuevo.',
    'surface-not-found': 'La imagen salió demasiado oscura o borrosa para encontrar la retina. Parpadeá, mantené el ojo quieto y capturá de nuevo.',
    'bmo-not-found': 'Mirá el punto de fijación para que los cortes queden centrados en el nervio óptico, y capturá de nuevo.',
    motion: 'Seguí mirando el punto de fijación sin moverte hasta que termine la captura, y capturá de nuevo.',
    'too-few-usable-scans': 'Mantené el ojo abierto y quieto sobre el punto de fijación durante toda la captura, y capturá de nuevo.',
    'bmo-fit-failed': 'Mantené el ojo quieto sobre el punto de fijación, y capturá de nuevo.',
    'bmo-mismatch-with-baseline': 'Puede venir de una mala coincidencia con la posición del examen de antes del vuelo. Capturá de nuevo; si sigue pasando, tu médico va a revisar las imágenes.',
    'insufficient-ring-coverage': 'En varios cortes se perdió parte de la imagen cerca del nervio óptico. Mantené el ojo abierto y quieto, y capturá de nuevo.',
    decentered: 'Mirá derecho al punto de fijación para que el patrón quede centrado en el nervio óptico, y capturá de nuevo.',
  },
};

const PHRASES = { en: EN, es: ES } as const;

export interface ReasonText {
  /** What went wrong (the core's sentence). */
  why: string;
  /** What to do differently (ours). */
  advice: string;
}

export function reasonText(reason: CaptureReason, locale: Locale): ReasonText {
  return { why: PHRASES[locale].eyeNotMeasuredReason(reason), advice: ADVICE[locale][reason] };
}
