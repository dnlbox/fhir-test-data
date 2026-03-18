import type { NamePool, RandomFn } from "../types.js";
import { pickRandom } from "./rng.js";

export interface GeneratedName {
  family: string;
  given: string[];
  prefix?: string;
  /** Surname prefix for Dutch names (e.g., "van", "de") — stored separately in FHIR */
  familyPrefix?: string;
  /** "male" | "female" — used to select given names */
  gender: "male" | "female";
}

/** Generate a single name using the locale's name pool. */
export function generateName(
  pool: NamePool,
  gender: "male" | "female",
  rng: RandomFn,
): GeneratedName {
  const givenPool = gender === "male" ? pool.given.male : pool.given.female;
  const given = pickRandom(givenPool, rng);
  const family = pickRandom(pool.family, rng);

  const name: GeneratedName = {
    family,
    given: [given],
    gender,
  };

  if (pool.prefixes !== undefined && pool.prefixes.length > 0) {
    // ~30% chance of including a surname prefix for locales that have them
    if (rng() < 0.3) {
      name.familyPrefix = pickRandom(pool.prefixes, rng);
    }
  }

  return name;
}
