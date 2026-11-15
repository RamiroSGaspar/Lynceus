import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';

/** Current `devicePixelRatio`, updated when the zoom or the screen changes. */
export function useDevicePixelRatio(): number {
  const [ratio, setRatio] = useState(() => window.devicePixelRatio || 1);
  useEffect(() => {
    const query = window.matchMedia(`(resolution: ${ratio}dppx)`);
    const update = () => setRatio(window.devicePixelRatio || 1);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [ratio]);
  return ratio;
}

/** Width in CSS pixels of an element, followed as the layout changes. */
export function useElementWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    setWidth(element.clientWidth);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(Math.floor(entry.contentRect.width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

/**
 * Sizes a canvas for sharp drawing on high-density screens: the backing store has
 * device pixels, the context draws in CSS pixels.
 */
export function prepareCanvas(canvas: HTMLCanvasElement, cssWidth: number, cssHeight: number, dpr: number): CanvasRenderingContext2D | null {
  const width = Math.max(1, Math.round(cssWidth * dpr));
  const height = Math.max(1, Math.round(cssHeight * dpr));
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(width / cssWidth, 0, 0, height / cssHeight, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);
  return ctx;
}

/** Overlay colours come from `oct.css`, which takes them from `tokens.css`. */
export function cssColor(element: Element, name: string): string {
  return getComputedStyle(element).getPropertyValue(name).trim() || '#ffffff';
}

const grayCache = new Map<ArrayBufferLike, HTMLCanvasElement>();
const GRAY_CACHE_SIZE = 4;

/**
 * An image-sized canvas holding grey levels, ready to be scaled with `drawImage`.
 * Only the last few are kept: a 768 × 496 scan takes 1.5 MB as colour pixels.
 */
export function grayCanvas(gray: Uint8Array | Uint8ClampedArray, width: number, height: number): HTMLCanvasElement {
  const cached = grayCache.get(gray.buffer);
  if (cached) {
    grayCache.delete(gray.buffer);
    grayCache.set(gray.buffer, cached);
    return cached;
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const image = ctx.createImageData(width, height);
    const rgba = image.data;
    for (let i = 0, o = 0; i < gray.length; i++, o += 4) {
      const g = gray[i]!;
      rgba[o] = g;
      rgba[o + 1] = g;
      rgba[o + 2] = g;
      rgba[o + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
  }
  grayCache.set(gray.buffer, canvas);
  while (grayCache.size > GRAY_CACHE_SIZE) {
    const oldest = grayCache.keys().next().value;
    if (oldest === undefined) break;
    grayCache.delete(oldest);
  }
  return canvas;
}

/** The simulated-data mark every image carries (AGENTS.md, rule 8). */
export function drawSimulatedMark(ctx: CanvasRenderingContext2D, text: string, width: number, height: number): void {
  ctx.save();
  ctx.font = '600 11px system-ui, sans-serif';
  const pad = 4;
  const w = ctx.measureText(text).width + 2 * pad;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(width - w - 4, height - 20, w, 16);
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width - w - 4 + pad, height - 12);
  ctx.restore();
}
