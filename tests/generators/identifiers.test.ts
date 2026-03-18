import { describe, it, expect } from "vitest";
import { createRng } from "../../src/core/generators/rng.js";
import {
  nhsNumberDefinition,
  odsCodDefinition,
  gmpNumberDefinition,
  gmcNumberDefinition,
  ihiDefinition,
  medicareNumberDefinition,
  hpiiDefinition,
  hpioDefinition,
  aadhaarDefinition,
  abhaNumberDefinition,
  ontarioHcnDefinition,
  kvidDefinition,
  iknrDefinition,
  lanrDefinition,
  bsnrDefinition,
  nirDefinition,
  finessDefinition,
  rppsDefinition,
  bsnDefinition,
  agbCodeDefinition,
  uziNumberDefinition,
  ssnDefinition,
  npiDefinition,
  mrnDefinition,
} from "../../src/core/generators/identifiers.js";
import type { IdentifierDefinition } from "../../src/core/types.js";

const ALL_DEFINITIONS: IdentifierDefinition[] = [
  nhsNumberDefinition,
  odsCodDefinition,
  gmpNumberDefinition,
  gmcNumberDefinition,
  ihiDefinition,
  medicareNumberDefinition,
  hpiiDefinition,
  hpioDefinition,
  aadhaarDefinition,
  abhaNumberDefinition,
  ontarioHcnDefinition,
  kvidDefinition,
  iknrDefinition,
  lanrDefinition,
  bsnrDefinition,
  nirDefinition,
  finessDefinition,
  rppsDefinition,
  bsnDefinition,
  agbCodeDefinition,
  uziNumberDefinition,
  ssnDefinition,
  npiDefinition,
  mrnDefinition,
];

describe("All identifier generators — 100 samples each", () => {
  for (const def of ALL_DEFINITIONS) {
    it(`${def.name}: 100 generated values all pass validate()`, () => {
      const rng = createRng(42);
      for (let i = 0; i < 100; i++) {
        const value = def.generate(rng);
        expect(def.validate(value), `Failed for value: ${value}`).toBe(true);
      }
    });
  }
});

describe("Determinism — same seed produces same output", () => {
  for (const def of ALL_DEFINITIONS) {
    it(`${def.name}: same seed yields same sequence`, () => {
      const rng1 = createRng(99);
      const rng2 = createRng(99);
      const results1 = Array.from({ length: 5 }, () => def.generate(rng1));
      const results2 = Array.from({ length: 5 }, () => def.generate(rng2));
      expect(results1).toEqual(results2);
    });
  }

  it("different seeds produce different sequences", () => {
    const rng1 = createRng(1);
    const rng2 = createRng(2);
    const values1 = Array.from({ length: 10 }, () => nhsNumberDefinition.generate(rng1));
    const values2 = Array.from({ length: 10 }, () => nhsNumberDefinition.generate(rng2));
    expect(values1).not.toEqual(values2);
  });
});

describe("Known-valid examples from research docs", () => {
  it("NHS Modulus 11: 9434765919 validates", () => {
    expect(nhsNumberDefinition.validate("9434765919")).toBe(true);
  });

  it("AU IHI Luhn: 8003608833357361 validates", () => {
    expect(ihiDefinition.validate("8003608833357361")).toBe(true);
  });

  it("Aadhaar Verhoeff: 496107787928 validates (research doc had a typo)", () => {
    expect(aadhaarDefinition.validate("496107787928")).toBe(true);
  });

  it("BSN 11-proef: 999999990 validates", () => {
    expect(bsnDefinition.validate("999999990")).toBe(true);
  });

  it("French NIR Modulus 97: 185057541904345 validates (research doc had a typo)", () => {
    expect(nirDefinition.validate("185057541904345")).toBe(true);
  });
});

describe("US SSN constraints", () => {
  it("all generated SSNs are in the 900-998 area range", () => {
    const rng = createRng(7);
    for (let i = 0; i < 100; i++) {
      const ssn = ssnDefinition.generate(rng);
      const area = Number(ssn.split("-")[0]);
      expect(area).toBeGreaterThanOrEqual(900);
      expect(area).toBeLessThanOrEqual(998);
    }
  });

  it("rejects SSN with 000 area", () => {
    expect(ssnDefinition.validate("000-12-3456")).toBe(false);
  });

  it("rejects SSN with 00 group", () => {
    expect(ssnDefinition.validate("900-00-1234")).toBe(false);
  });

  it("rejects SSN with 0000 serial", () => {
    expect(ssnDefinition.validate("900-12-0000")).toBe(false);
  });
});

describe("AU IHI and HPI-I prefixes", () => {
  it("IHI values start with 800360", () => {
    const rng = createRng(13);
    for (let i = 0; i < 20; i++) {
      expect(ihiDefinition.generate(rng).startsWith("800360")).toBe(true);
    }
  });

  it("HPI-I values start with 800361", () => {
    const rng = createRng(14);
    for (let i = 0; i < 20; i++) {
      expect(hpiiDefinition.generate(rng).startsWith("800361")).toBe(true);
    }
  });
});
