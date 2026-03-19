import type { RandomFn } from "@/core/types.js";

/**
 * Mulberry32 PRNG — fast, simple, good distribution for test data generation.
 * Same seed always produces the same sequence.
 */
export function createRng(seed: number): RandomFn {
  let s = seed;
  return (): number => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick a random element from an array. Throws if array is empty. */
export function pickRandom<T>(array: readonly T[], rng: RandomFn): T {
  if (array.length === 0) {
    throw new Error("Cannot pick from empty array");
  }
  const index = Math.floor(rng() * array.length);
  const item = array[index];
  if (item === undefined) {
    throw new Error(`Index ${index} out of bounds for array of length ${array.length}`);
  }
  return item;
}

/** Generate a random integer in [min, max] inclusive. */
export function randomInt(min: number, max: number, rng: RandomFn): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Generate a string of N random digits (0–9). */
export function randomDigits(count: number, rng: RandomFn): string {
  let result = "";
  for (let i = 0; i < count; i++) {
    result += Math.floor(rng() * 10).toString();
  }
  return result;
}
