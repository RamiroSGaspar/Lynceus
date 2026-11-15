/**
 * Separable filters on row-major images (`height × width`, Float32Array).
 * Edges are handled by repeating the border pixel.
 */

/** Normalised Gaussian kernel with radius ceil(3σ). σ ≤ 0 gives the identity. */
export function gaussianKernel(sigma: number): Float32Array {
  if (!(sigma > 0)) return Float32Array.of(1);
  const radius = Math.max(1, Math.ceil(3 * sigma));
  const k = new Float32Array(2 * radius + 1);
  let s = 0;
  for (let i = -radius; i <= radius; i++) {
    const v = Math.exp(-(i * i) / (2 * sigma * sigma));
    k[i + radius] = v;
    s += v;
  }
  for (let i = 0; i < k.length; i++) k[i] = k[i]! / s;
  return k;
}

/** Convolves every row (along x) with a symmetric odd-length kernel. */
export function convolveRows(src: Float32Array, width: number, height: number, kernel: Float32Array, dst = new Float32Array(src.length)): Float32Array {
  const r = (kernel.length - 1) >> 1;
  if (r === 0) {
    dst.set(src);
    return dst;
  }
  for (let y = 0; y < height; y++) {
    const off = y * width;
    for (let x = 0; x < width; x++) {
      let s = 0;
      for (let k = -r; k <= r; k++) {
        let xx = x + k;
        if (xx < 0) xx = 0;
        else if (xx >= width) xx = width - 1;
        s += kernel[k + r]! * src[off + xx]!;
      }
      dst[off + x] = s;
    }
  }
  return dst;
}

/** Convolves every column (along y) with a symmetric odd-length kernel. */
export function convolveColumns(src: Float32Array, width: number, height: number, kernel: Float32Array, dst = new Float32Array(src.length)): Float32Array {
  const r = (kernel.length - 1) >> 1;
  if (r === 0) {
    dst.set(src);
    return dst;
  }
  for (let y = 0; y < height; y++) {
    const off = y * width;
    for (let x = 0; x < width; x++) dst[off + x] = 0;
    for (let k = -r; k <= r; k++) {
      let yy = y + k;
      if (yy < 0) yy = 0;
      else if (yy >= height) yy = height - 1;
      const w = kernel[k + r]!;
      const soff = yy * width;
      for (let x = 0; x < width; x++) dst[off + x] = dst[off + x]! + w * src[soff + x]!;
    }
  }
  return dst;
}

/** Gaussian blur with separate σ along x and y, in pixels. */
export function gaussianBlur(src: Float32Array, width: number, height: number, sigmaX: number, sigmaY: number): Float32Array {
  const tmp = convolveRows(src, width, height, gaussianKernel(sigmaX));
  return convolveColumns(tmp, width, height, gaussianKernel(sigmaY));
}

/** 1-D Gaussian smoothing of a signal that may contain NaN (NaN samples are skipped and stay NaN). */
export function smoothNaN(values: Float32Array | Float64Array, sigma: number): Float64Array {
  const n = values.length;
  const out = new Float64Array(n);
  const k = gaussianKernel(sigma);
  const r = (k.length - 1) >> 1;
  for (let i = 0; i < n; i++) {
    const v = values[i]!;
    if (Number.isNaN(v)) {
      out[i] = NaN;
      continue;
    }
    let s = 0;
    let w = 0;
    for (let j = -r; j <= r; j++) {
      const ii = i + j;
      if (ii < 0 || ii >= n) continue;
      const vv = values[ii]!;
      if (Number.isNaN(vv)) continue;
      s += k[j + r]! * vv;
      w += k[j + r]!;
    }
    out[i] = s / w;
  }
  return out;
}
