/**
 * Per-IP limit, in memory: 8 requests per minute and 60 per day. Best effort only:
 * each serverless instance has its own memory and restarts empty. The real cap
 * is the monthly spend limit the owner sets in the Anthropic console.
 */
export const PER_MINUTE = 8;
export const PER_DAY = 60;
const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const MAX_TRACKED_KEYS = 10_000;

export class RateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly perMinute = PER_MINUTE,
    private readonly perDay = PER_DAY,
  ) {}

  /** Records a request and says whether it is allowed. Rejected requests are not counted. */
  take(key: string, nowMs: number): boolean {
    if (this.hits.size > MAX_TRACKED_KEYS) this.prune(nowMs);
    const recent = (this.hits.get(key) ?? []).filter((t) => nowMs - t < DAY_MS);
    const lastMinute = recent.filter((t) => nowMs - t < MINUTE_MS).length;
    if (recent.length >= this.perDay || lastMinute >= this.perMinute) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(nowMs);
    this.hits.set(key, recent);
    return true;
  }

  private prune(nowMs: number): void {
    for (const [key, times] of this.hits) {
      if (times.every((t) => nowMs - t >= DAY_MS)) this.hits.delete(key);
    }
  }
}
