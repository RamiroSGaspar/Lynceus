/**
 * Minimum-cost path across an image, left to right (Chiu et al. 2010, sans-oct-base-tecnica.md
 * 6.1 [P7]). Chiu builds a graph with 8 neighbours per pixel and runs Dijkstra; for a boundary
 * that crosses every column once, the same optimum is found column by column (dynamic
 * programming): a step to the next column may change the row by up to `maxStep`, and, when
 * `vertical` is set, the path may also run up or down inside a column paying the cost of every
 * pixel it crosses. That is what lets the inner surface follow the steep walls of the cup.
 * Free start and end rows play the role of Chiu's extra end columns.
 */

export interface PathOptions {
  /** Per column, first and last row allowed (inclusive). */
  lo: Int32Array;
  hi: Int32Array;
  maxStep: number;
  vertical: boolean;
}

/** `cost` is column-major (`cost[j·height + r]`). Returns the row of the path in every column. */
export function minimumPath(cost: Float32Array, width: number, height: number, opts: PathOptions): Int32Array {
  const INF = 1e30;
  const prev = new Float64Array(height).fill(INF);
  const cur = new Float64Array(height).fill(INF);
  const from = new Int32Array(width * height).fill(-1);
  const { lo, hi, maxStep } = opts;
  for (let r = lo[0]!; r <= hi[0]!; r++) prev[r] = cost[r]!;
  for (let j = 1; j < width; j++) {
    const l = lo[j]!;
    const h = hi[j]!;
    const pl = lo[j - 1]!;
    const ph = hi[j - 1]!;
    const col = j * height;
    for (let r = l; r <= h; r++) {
      let best = INF;
      let arg = -1;
      const a = Math.max(pl, r - maxStep);
      const b = Math.min(ph, r + maxStep);
      for (let q = a; q <= b; q++) {
        const v = prev[q]!;
        if (v < best) {
          best = v;
          arg = q;
        }
      }
      if (arg < 0) {
        // No neighbour in reach: enter from the nearest allowed row of the previous column.
        arg = r < pl ? pl : ph;
        best = prev[arg]! + Math.abs(r - arg);
      }
      cur[r] = best + cost[col + r]!;
      from[col + r] = arg;
    }
    if (opts.vertical) {
      for (let r = l + 1; r <= h; r++) {
        const v = cur[r - 1]! + cost[col + r]!;
        if (v < cur[r]!) {
          cur[r] = v;
          from[col + r] = from[col + r - 1]!;
        }
      }
      for (let r = h - 1; r >= l; r--) {
        const v = cur[r + 1]! + cost[col + r]!;
        if (v < cur[r]!) {
          cur[r] = v;
          from[col + r] = from[col + r + 1]!;
        }
      }
    }
    for (let r = pl; r <= ph; r++) prev[r] = INF;
    for (let r = l; r <= h; r++) {
      prev[r] = cur[r]!;
      cur[r] = INF;
    }
  }
  const path = new Int32Array(width);
  let best = INF;
  let arg = lo[width - 1]!;
  for (let r = lo[width - 1]!; r <= hi[width - 1]!; r++) {
    if (prev[r]! < best) {
      best = prev[r]!;
      arg = r;
    }
  }
  path[width - 1] = arg;
  for (let j = width - 1; j > 0; j--) {
    const f = from[j * height + path[j]!]!;
    path[j - 1] = f >= 0 ? f : path[j]!;
  }
  return path;
}
