import { describe, it, expect } from "vitest";
import { createRng } from "@/core/generators/rng.js";
import { generateName } from "@/core/generators/names.js";
import { usNamePool } from "@/locales/us/names.js";
import { ukNamePool } from "@/locales/uk/names.js";
import { auNamePool } from "@/locales/au/names.js";
import { caNamePool } from "@/locales/ca/names.js";
import { deNamePool } from "@/locales/de/names.js";
import { frNamePool } from "@/locales/fr/names.js";
import { nlNamePool } from "@/locales/nl/names.js";
import { inNamePool } from "@/locales/in/names.js";
import type { NamePool } from "@/core/types.js";

const ALL_POOLS: Array<{ name: string; pool: NamePool }> = [
  { name: "US", pool: usNamePool },
  { name: "UK", pool: ukNamePool },
  { name: "AU", pool: auNamePool },
  { name: "CA", pool: caNamePool },
  { name: "DE", pool: deNamePool },
  { name: "FR", pool: frNamePool },
  { name: "NL", pool: nlNamePool },
  { name: "IN", pool: inNamePool },
];

describe("All locales — basic structure", () => {
  for (const { name, pool } of ALL_POOLS) {
    it(`${name}: male name has non-empty family and given`, () => {
      const rng = createRng(1);
      const result = generateName(pool, "male", rng);
      expect(result.family.length).toBeGreaterThan(0);
      expect(result.given.length).toBeGreaterThan(0);
      expect(result.given[0]?.length ?? 0).toBeGreaterThan(0);
      expect(result.gender).toBe("male");
    });

    it(`${name}: female name has non-empty family and given`, () => {
      const rng = createRng(2);
      const result = generateName(pool, "female", rng);
      expect(result.family.length).toBeGreaterThan(0);
      expect(result.given.length).toBeGreaterThan(0);
      expect(result.given[0]?.length ?? 0).toBeGreaterThan(0);
      expect(result.gender).toBe("female");
    });

    it(`${name}: names come from the pool`, () => {
      const rng = createRng(3);
      for (let i = 0; i < 20; i++) {
        const male = generateName(pool, "male", rng);
        const female = generateName(pool, "female", rng);
        expect(pool.family).toContain(male.family);
        expect(pool.given.male).toContain(male.given[0]);
        expect(pool.family).toContain(female.family);
        expect(pool.given.female).toContain(female.given[0]);
      }
    });
  }
});

describe("Dutch names (NL)", () => {
  it("sometimes includes familyPrefix", () => {
    const rng = createRng(42);
    let prefixCount = 0;
    for (let i = 0; i < 100; i++) {
      const name = generateName(nlNamePool, "male", rng);
      if (name.familyPrefix !== undefined) prefixCount++;
    }
    // With 30% probability, we expect roughly 30 out of 100
    expect(prefixCount).toBeGreaterThan(0);
  });

  it("familyPrefix is from the prefixes array when set", () => {
    const rng = createRng(42);
    for (let i = 0; i < 100; i++) {
      const name = generateName(nlNamePool, "female", rng);
      if (name.familyPrefix !== undefined) {
        expect(nlNamePool.prefixes).toContain(name.familyPrefix);
      }
    }
  });

  it("non-NL locales do not produce familyPrefix", () => {
    const rng = createRng(42);
    const pools: NamePool[] = [usNamePool, ukNamePool, auNamePool, deNamePool];
    for (const pool of pools) {
      for (let i = 0; i < 20; i++) {
        const name = generateName(pool, "male", rng);
        expect(name.familyPrefix).toBeUndefined();
      }
    }
  });
});

describe("Canadian names — bilingual", () => {
  it("male pool includes both English and French names", () => {
    // These are names explicitly in the CA pool
    expect(caNamePool.given.male).toContain("Jean");
    expect(caNamePool.given.male).toContain("Liam");
  });

  it("female pool includes both English and French names", () => {
    expect(caNamePool.given.female).toContain("Marie");
    expect(caNamePool.given.female).toContain("Olivia");
  });

  it("family pool includes both English and French surnames", () => {
    expect(caNamePool.family).toContain("Tremblay");
    expect(caNamePool.family).toContain("Smith");
  });
});

describe("Determinism", () => {
  it("same seed + same gender produces same name for each locale", () => {
    for (const { pool } of ALL_POOLS) {
      const rng1 = createRng(99);
      const rng2 = createRng(99);
      const name1 = generateName(pool, "female", rng1);
      const name2 = generateName(pool, "female", rng2);
      expect(name1).toEqual(name2);
    }
  });

  it("different seeds produce different names", () => {
    const rng1 = createRng(1);
    const rng2 = createRng(9999);
    const names1 = Array.from({ length: 10 }, () => generateName(usNamePool, "male", rng1));
    const names2 = Array.from({ length: 10 }, () => generateName(usNamePool, "male", rng2));
    // Not all names should be the same
    const allSame = names1.every((n, i) => n.given[0] === names2[i]?.given[0]);
    expect(allSame).toBe(false);
  });
});

describe("Pool coverage", () => {
  it("all locales have at least 30 male given names", () => {
    for (const { name, pool } of ALL_POOLS) {
      expect(pool.given.male.length, `${name} male pool too small`).toBeGreaterThanOrEqual(30);
    }
  });

  it("all locales have at least 30 female given names", () => {
    for (const { name, pool } of ALL_POOLS) {
      expect(pool.given.female.length, `${name} female pool too small`).toBeGreaterThanOrEqual(30);
    }
  });

  it("all locales have at least 40 family names", () => {
    for (const { name, pool } of ALL_POOLS) {
      expect(pool.family.length, `${name} family pool too small`).toBeGreaterThanOrEqual(40);
    }
  });
});
