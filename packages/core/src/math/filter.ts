/**
 * Separable filters on row-major images (`height × width`, Float32Array).
 * Edges are handled by repeating the border pixel.
 */

/** Normalised Gaussian kernel with radius ceil(truncate·σ). σ ≤ 0 gives the identity. */
export function gaussianKernel(sigma: number, truncate = 3): Float32Array {
  if (!(sigma > 0)) return Float32Array.of(1);
  const radius = Math.max(1, Math.ceil(truncate * sigma));
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
  const taps = kernel.length;
  const k = Float64Array.from(kernel);
  // One padded row at a time (edges repeated), so the inner loop has no branches.
  const buf = new Float64Array(width + 2 * r);
  for (let y = 0; y < height; y++) {
    const off = y * width;
    const first = src[off]!;
    const last = src[off + width - 1]!;
    for (let i = 0; i < r; i++) {
      buf[i] = first;
      buf[r + width + i] = last;
    }
    for (let x = 0; x < width; x++) buf[r + x] = src[off + x]!;
    for (let x = 0; x < width; x++) {
      let s = 0;
      for (let t = 0; t < taps; t++) s += k[t]! * buf[x + t]!;
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
  const taps = kernel.length;
  const k = Float64Array.from(kernel);
  // Row-wise accumulation: each output row is a weighted sum of whole input rows.
  const acc = new Float64Array(width);
  for (let y = 0; y < height; y++) {
    acc.fill(0);
    for (let t = 0; t < taps; t++) {
      let yy = y + t - r;
      if (yy < 0) yy = 0;
      else if (yy >= height) yy = height - 1;
      const w = k[t]!;
      const so = yy * width;
      for (let x = 0; x < width; x++) acc[x] = acc[x]! + w * src[so + x]!;
    }
    const off = y * width;
    for (let x = 0; x < width; x++) dst[off + x] = acc[x]!;
  }
  return dst;
}

/**
 * Binomial [1 4 6 4 1]/16 along rows (σ = 1 px), unrolled; edges repeat the border.
 * Same result as `convolveRows` with that kernel, several times faster.
 */
export function binomial5Rows(src: Float32Array, width: number, height: number, dst = new Float32Array(src.length)): Float32Array {
  for (let y = 0; y < height; y++) {
    const o = y * width;
    const e = o + width - 1;
    for (let x = 0; x < width; x++) {
      const i = o + x;
      const a = src[i - 2 < o ? o : i - 2]!;
      const b = src[i - 1 < o ? o : i - 1]!;
      const d = src[i + 1 > e ? e : i + 1]!;
      const f = src[i + 2 > e ? e : i + 2]!;
      dst[i] = (a + f + 4 * (b + d) + 6 * src[i]!) * 0.0625;
    }
  }
  return dst;
}

/** Binomial [1 4 6 4 1]/16 along columns (σ = 1 px), row-wise; edges repeat the border. */
export function binomial5Columns(src: Float32Array, width: number, height: number, dst = new Float32Array(src.length)): Float32Array {
  for (let y = 0; y < height; y++) {
    const a = Math.max(0, y - 2) * width;
    const b = Math.max(0, y - 1) * width;
    const c = y * width;
    const d = Math.min(height - 1, y + 1) * width;
    const f = Math.min(height - 1, y + 2) * width;
    for (let x = 0; x < width; x++) dst[c + x] = (src[a + x]! + src[f + x]! + 4 * (src[b + x]! + src[d + x]!) + 6 * src[c + x]!) * 0.0625;
  }
  return dst;
}

/** Binomial [1 2 1]/4 along columns (σ = 0.71 px), row-wise; edges repeat the border. */
export function binomial3Columns(src: Float32Array, width: number, height: number, dst = new Float32Array(src.length)): Float32Array {
  for (let y = 0; y < height; y++) {
    const b = Math.max(0, y - 1) * width;
    const c = y * width;
    const d = Math.min(height - 1, y + 1) * width;
    for (let x = 0; x < width; x++) dst[c + x] = (src[b + x]! + src[d + x]! + 2 * src[c + x]!) * 0.25;
  }
  return dst;
}

/** Gaussian blur with separate σ along x and y, in pixels; kernels cut at `truncate`·σ. */
export function gaussianBlur(src: Float32Array, width: number, height: number, sigmaX: number, sigmaY: number, truncate = 3): Float32Array {
  const tmp = convolveRows(src, width, height, gaussianKernel(sigmaX, truncate));
  return convolveColumns(tmp, width, height, gaussianKernel(sigmaY, truncate));
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
