import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { estimateTextWidth, type Measure } from './text';

export interface ChartBox<T extends HTMLElement> {
  ref: RefObject<T | null>;
  /** Width available to the drawing, in CSS pixels. */
  width: number;
  /** The label size (`--text-xs`) and the value size (`--text-lg`) of the design tokens, in pixels. */
  fontPx: number;
  valueFontPx: number;
  measure: Measure;
}

/** What is assumed before the browser has been asked: the first paint and the tests. */
const DEFAULT_BOX = { width: 720, fontPx: 15.75, valueFontPx: 24.75 };

function canvasMeasure(fontFamily: string): Measure | null {
  try {
    const context = document.createElement('canvas').getContext('2d');
    if (!context) return null;
    const cache = new Map<string, number>();
    return (text, fontPx, bold = false) => {
      const key = `${bold ? 'b' : 'r'}${fontPx}|${text}`;
      let width = cache.get(key);
      if (width === undefined) {
        context.font = `${bold ? 700 : 400} ${fontPx}px ${fontFamily}`;
        width = context.measureText(text).width;
        cache.set(key, width);
      }
      return width;
    };
  } catch {
    return null;
  }
}

/** Reads a length token such as `1.375rem` in pixels. */
function tokenPx(value: string, rootPx: number, fallback: number): number {
  const text = value.trim();
  const number = Number.parseFloat(text);
  if (!Number.isFinite(number)) return fallback;
  if (text.endsWith('rem')) return number * rootPx;
  if (text.endsWith('px')) return number;
  return fallback;
}

/**
 * Measures the element a chart is drawn in: its width, the sizes of the type
 * tokens and the real width of texts. The charts are drawn at their true pixel
 * size, so the labels keep the size of the type scale on a phone as on a laptop.
 */
export function useChartBox<T extends HTMLElement>(): ChartBox<T> {
  const ref = useRef<T>(null);
  const [box, setBox] = useState(DEFAULT_BOX);
  const [measure, setMeasure] = useState<Measure>(() => estimateTextWidth);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const read = (): void => {
      const width = element.clientWidth;
      // Nothing to measure while the chart is hidden, for example inside a closed section.
      if (width <= 0) return;
      const style = getComputedStyle(element);
      const rootPx = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const fontPx = Number.parseFloat(style.fontSize) || DEFAULT_BOX.fontPx;
      const valueFontPx = tokenPx(style.getPropertyValue('--text-lg'), rootPx, DEFAULT_BOX.valueFontPx);
      setBox((current) =>
        current.width === width && current.fontPx === fontPx && current.valueFontPx === valueFontPx
          ? current
          : { width, fontPx, valueFontPx },
      );
    };
    read();
    const measured = canvasMeasure(getComputedStyle(element).fontFamily);
    if (measured) setMeasure(() => measured);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(read);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, ...box, measure };
}
