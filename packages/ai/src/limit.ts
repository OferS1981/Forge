/**
 * Client-side rate limiting, because the key is theirs and so is the bill.
 *
 * Section 12 asks for it in one line: a mistyped loop must not be able to burn somebody's credit.
 * A fixed window would let a loop fire the whole allowance the instant the window turned over, so
 * this is a token bucket: a steady refill and a small burst, which is what a person doing real work
 * looks like and what a runaway loop does not.
 */

export interface Limiter {
  /** Take one. Returns 0 when it was allowed, or how long to wait when it was not. */
  take: () => number;
  /** How many are left right now, for the line the panel shows. */
  left: () => number;
}

export interface LimiterOptions {
  /** How many requests a minute, sustained. */
  perMinute: number;
  /** How many may go at once before the refill rate starts to matter. */
  burst: number;
  now: () => number;
}

export function createLimiter({ perMinute, burst, now }: LimiterOptions): Limiter {
  const refillPerMs = perMinute / 60_000;
  let tokens = burst;
  let last = now();

  const fill = (): void => {
    const at = now();
    // A clock that went backwards must not hand out free requests.
    const elapsed = Math.max(0, at - last);
    last = at;
    tokens = Math.min(burst, tokens + elapsed * refillPerMs);
  };

  return {
    take: () => {
      fill();
      if (tokens >= 1) {
        tokens -= 1;
        return 0;
      }
      return Math.ceil((1 - tokens) / refillPerMs);
    },
    left: () => {
      fill();
      return Math.floor(tokens);
    },
  };
}
