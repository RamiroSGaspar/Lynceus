/**
 * The product name lives here and nowhere else, so it can be changed in one edit.
 * Every screen, document generator and export must read it from this module.
 */
export const PRODUCT = {
  name: 'Lynceus',
  tagline: {
    en: 'On-board first read of spaceflight eye changes',
    es: 'Primera lectura a bordo de los cambios del ojo en vuelo',
  },
  /** Shown wherever results or images appear. The data are fictional; the processing is real. */
  simulatedDataNotice: {
    en: 'Simulated data. Not a medical device. Not validated on people.',
    es: 'Datos simulados. No es un dispositivo médico. No está validado con personas.',
  },
} as const;

export type Locale = 'en' | 'es';
