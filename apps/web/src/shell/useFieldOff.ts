import { useEffect } from 'react';

/**
 * Turns the field of stars off while something is measured with the eyes: plain black, as
 * the design system asks for the vision tests. A data point, or a stimulus, must never be
 * mistaken for a star.
 */
export function useFieldOff(off: boolean): void {
  useEffect(() => {
    if (!off) return;
    document.body.classList.add('is-apagado');
    return () => document.body.classList.remove('is-apagado');
  }, [off]);
}
