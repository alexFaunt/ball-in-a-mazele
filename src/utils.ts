/**
 * Get today's seed based on UTC date (YYYY-MM-DD)
 * Returns days since epoch
 */
export function getTodaySeed(): number {
  const today = new Date();
  const utc = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  );
  return Math.floor(utc / 86400000); // Days since epoch
}

/**
 * Seedable RNG using mulberry32 algorithm
 */
export function seedRNG(seed: number) {
  let state = seed;

  return {
    next(): number {
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },

    nextInt(max: number): number {
      return Math.floor(this.next() * max);
    },

    nextFloat(min: number, max: number): number {
      return min + this.next() * (max - min);
    },
  };
}
