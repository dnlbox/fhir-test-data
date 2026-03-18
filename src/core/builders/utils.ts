import type { RandomFn } from "../types.js";
import { randomInt } from "../generators/rng.js";

export function generateUuidV4(rng: RandomFn): string {
  const hex = (bits: number): string =>
    Math.floor(rng() * (1 << bits))
      .toString(16)
      .padStart(bits / 4, "0");

  const p1 = hex(32);
  const p2 = hex(16);
  const p3 = "4" + hex(12);
  const variant = (8 + Math.floor(rng() * 4)).toString(16);
  const p4 = variant + hex(12);
  const p5 = hex(32) + hex(16);
  return `${p1}-${p2}-${p3}-${p4}-${p5}`;
}

export function deepMerge(
  base: Record<string, unknown>,
  overrides: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };
  for (const key of Object.keys(overrides)) {
    const overrideVal = overrides[key];
    const baseVal = base[key];
    if (
      overrideVal !== null &&
      typeof overrideVal === "object" &&
      !Array.isArray(overrideVal) &&
      baseVal !== null &&
      typeof baseVal === "object" &&
      !Array.isArray(baseVal)
    ) {
      result[key] = deepMerge(
        baseVal as Record<string, unknown>,
        overrideVal as Record<string, unknown>,
      );
    } else {
      result[key] = overrideVal;
    }
  }
  return result;
}

/** Generate an ISO 8601 date string (YYYY-MM-DD) in the given year range. */
export function generateDate(minYear: number, maxYear: number, rng: RandomFn): string {
  const year = randomInt(minYear, maxYear, rng);
  const month = randomInt(1, 12, rng);
  const daysInMonth = new Date(year, month, 0).getDate();
  const day = randomInt(1, daysInMonth, rng);
  return `${year.toString()}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

/** Generate an ISO 8601 datetime string (YYYY-MM-DDThh:mm:ss+00:00). */
export function generateDateTime(minYear: number, maxYear: number, rng: RandomFn): string {
  const date = generateDate(minYear, maxYear, rng);
  const hour = randomInt(0, 23, rng);
  const min = randomInt(0, 59, rng);
  const sec = randomInt(0, 59, rng);
  return `${date}T${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}+00:00`;
}
