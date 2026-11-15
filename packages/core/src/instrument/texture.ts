/**
 * Smooth deterministic noise (value noise on an integer lattice, hashed), for
 * textures that must look the same every time the same tissue is imaged.
 */

function hash3(ix: number, iy: number, iz: number, seed: number): number {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(iz, 2147483647) ^ Math.imul(seed, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function fade(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Smooth noise in [0, 1) with unit lattice spacing. */
export function valueNoise2(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = fade(x - ix);
  const fy = fade(y - iy);
  const a = hash3(ix, iy, 0, seed);
  const b = hash3(ix + 1, iy, 0, seed);
  const c = hash3(ix, iy + 1, 0, seed);
  const d = hash3(ix + 1, iy + 1, 0, seed);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

export function valueNoise3(x: number, y: number, z: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = fade(x - ix);
  const fy = fade(y - iy);
  const fz = fade(z - iz);
  const a0 = hash3(ix, iy, iz, seed);
  const b0 = hash3(ix + 1, iy, iz, seed);
  const c0 = hash3(ix, iy + 1, iz, seed);
  const d0 = hash3(ix + 1, iy + 1, iz, seed);
  const a1 = hash3(ix, iy, iz + 1, seed);
  const b1 = hash3(ix + 1, iy, iz + 1, seed);
  const c1 = hash3(ix, iy + 1, iz + 1, seed);
  const d1 = hash3(ix + 1, iy + 1, iz + 1, seed);
  const p0 = a0 + (b0 - a0) * fx;
  const q0 = c0 + (d0 - c0) * fx;
  const p1 = a1 + (b1 - a1) * fx;
  const q1 = c1 + (d1 - c1) * fx;
  const z0 = p0 + (q0 - p0) * fy;
  const z1 = p1 + (q1 - p1) * fy;
  return z0 + (z1 - z0) * fz;
}

/**
 * Cellular (Worley) noise: distance, in cell units, from (x, y, z) to the nearest of
 * one random point per unit cell. Only the 2 × 2 × 2 cells closest to the point
 * are searched, which is enough for round blobs and four times cheaper.
 */
export function worley3(x: number, y: number, z: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const sx = x - ix < 0.5 ? -1 : 0;
  const sy = y - iy < 0.5 ? -1 : 0;
  const sz = z - iz < 0.5 ? -1 : 0;
  let best = 4;
  for (let dz = sz; dz <= sz + 1; dz++) {
    for (let dy = sy; dy <= sy + 1; dy++) {
      for (let dx = sx; dx <= sx + 1; dx++) {
        const cx = ix + dx;
        const cy = iy + dy;
        const cz = iz + dz;
        const px = cx + hash3(cx, cy, cz, seed) - x;
        const py = cy + hash3(cx, cy, cz, seed + 101) - y;
        const pz = cz + hash3(cx, cy, cz, seed + 202) - z;
        const d2 = px * px + py * py + pz * pz;
        if (d2 < best) best = d2;
      }
    }
  }
  return Math.sqrt(best);
}

/** White noise in [0, 1) for an integer pair: a cheap per-pixel hash. */
export function hashNoise(ix: number, iy: number, seed: number): number {
  return hash3(ix, iy, 7, seed);
}

/** Integer seed from a text key (FNV-1a). */
export function seedOf(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h | 0;
}
