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

/** A value of the design tokens, read where it applies: the colours of what is drawn over an image. */
export function cssColor(element: Element, name: string): string {
  return getComputedStyle(element).getPropertyValue(name).trim() || 'white';
}

/** The two colours of every mark over an image: the line, and the dark casing under it. */
export interface OverlayInk {
  line: string;
  casing: string;
  /** Typeface of the interface, for the few words written on an image. */
  font: string;
}

export function overlayInk(element: Element): OverlayInk {
  const style = getComputedStyle(element);
  return {
    line: style.getPropertyValue('--overlay-line').trim() || 'white',
    casing: style.getPropertyValue('--overlay-casing').trim() || 'black',
    font: style.fontFamily || 'sans-serif',
  };
}

/**
 * Strokes the current path the way every mark over an image is drawn: white over a wider
 * dark casing, so it reads on bright and on dark tissue alike. Marks are told apart by
 * their stroke (solid, dashed, dotted), never by colour.
 */
export function strokeMark(ctx: CanvasRenderingContext2D, ink: OverlayInk, width: number, dash: readonly number[] = []): void {
  ctx.save();
  ctx.setLineDash([]);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = ink.casing;
  ctx.lineWidth = width + 3;
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.setLineDash([...dash]);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = ink.line;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.restore();
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

/**
 * The simulated-data mark every image carries (AGENTS.md, rule 8), written into the picture
 * itself so that it also travels with a saved copy: bottom left, as on the instrument's files.
 */
export function drawSimulatedMark(ctx: CanvasRenderingContext2D, text: string, ink: OverlayInk, height: number): void {
  ctx.save();
  ctx.font = `500 11px ${ink.font}`;
  const pad = 5;
  const label = text.toUpperCase();
  const w = ctx.measureText(label).width + 2 * pad;
  ctx.fillStyle = ink.casing;
  ctx.fillRect(4, height - 21, w, 17);
  ctx.fillStyle = ink.line;
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 4 + pad, height - 12);
  ctx.restore();
}
