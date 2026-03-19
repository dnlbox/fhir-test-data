/**
 * Spec 21 — KR RRN gender digit consistency.
 *
 * RRN gender digit rules:
 *   1 = male,   born 1900–1999
 *   2 = female, born 1900–1999
 *   3 = male,   born 2000–2099
 *   4 = female, born 2000–2099
 *
 * For 'other' / 'unknown' gender the generator falls back to "1" (neutral).
 */
import { describe, it, expect } from "vitest";
import { createPatientBuilder } from "@/core/builders/patient.js";
import { krRrnDefinition } from "@/core/generators/identifiers.js";
import { createRng } from "@/core/generators/rng.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rrnGenderDigit(rrnValue: string): number {
  // Format: YYMMDD-GSSSSSC — first char after the hyphen is the gender digit
  return Number.parseInt(rrnValue.split("-")[1]?.[0] ?? "0", 10);
}

function isMaleDigit(d: number): boolean {
  return d === 1 || d === 3;
}

function isFemaleDigit(d: number): boolean {
  return d === 2 || d === 4;
}

function is1900sDigit(d: number): boolean {
  return d === 1 || d === 2;
}

function is2000sDigit(d: number): boolean {
  return d === 3 || d === 4;
}

// ---------------------------------------------------------------------------
// Patient-builder integration: gender digit must match Patient.gender
// ---------------------------------------------------------------------------

describe("KR RRN gender digit — patient builder integration", () => {
  it("gender digit is consistent with Patient.gender for seeds 1–8", () => {
    for (let seed = 1; seed <= 8; seed++) {
      const [patient] = createPatientBuilder().locale("kr").seed(seed).build();
      const gender = patient?.["gender"] as string;
      const identifiers = patient?.["identifier"] as Array<{ value: string }>;
      const rrn = identifiers?.[0]?.value ?? "";

      expect(/^\d{6}-\d{7}$/.test(rrn)).toBe(true);
      expect(krRrnDefinition.validate(rrn)).toBe(true);

      const gdigit = rrnGenderDigit(rrn);

      if (gender === "male") {
        expect(isMaleDigit(gdigit)).toBe(true);
      } else if (gender === "female") {
        expect(isFemaleDigit(gdigit)).toBe(true);
      }
      // 'other' / 'unknown' — any digit is acceptable (generator defaults to "1")
    }
  });

  it("birthDate year determines century digit (1900s → 1/2, 2000s → 3/4)", () => {
    // Run many seeds to catch both century cases in the 1940–2010 birth-year range
    let saw1900s = false;
    let saw2000s = false;

    for (let seed = 1; seed <= 50; seed++) {
      const [patient] = createPatientBuilder().locale("kr").seed(seed).build();
      const birthDate = patient?.["birthDate"] as string;
      const year = Number.parseInt(birthDate.slice(0, 4), 10);
      const identifiers = patient?.["identifier"] as Array<{ value: string }>;
      const rrn = identifiers?.[0]?.value ?? "";
      const gdigit = rrnGenderDigit(rrn);
      const gender = patient?.["gender"] as string;

      if (year >= 2000) {
        saw2000s = true;
        if (gender === "male")   { expect(gdigit).toBe(3); expect(is2000sDigit(gdigit)).toBe(true); }
        if (gender === "female") { expect(gdigit).toBe(4); expect(is2000sDigit(gdigit)).toBe(true); }
        // 'other' / 'unknown' born 2000+ use neutral fallback "1" — not a 2000s digit by design
      } else {
        saw1900s = true;
        if (gender === "male")   { expect(gdigit).toBe(1); expect(is1900sDigit(gdigit)).toBe(true); }
        if (gender === "female") { expect(gdigit).toBe(2); expect(is1900sDigit(gdigit)).toBe(true); }
        // 'other' / 'unknown' born 1900s use neutral fallback "1" — valid 1900s digit
      }
    }

    // Sanity: the 1940–2010 birth-year range should produce both centuries
    expect(saw1900s).toBe(true);
    expect(saw2000s).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Standalone identifier API: context-aware path
// ---------------------------------------------------------------------------

describe("KR RRN gender digit — standalone context API", () => {
  it("returns digit 1 for male born 1985", () => {
    const rng = createRng(42);
    const value = krRrnDefinition.generate(rng, { gender: "male", birthYear: 1985 });
    expect(rrnGenderDigit(value)).toBe(1);
    expect(krRrnDefinition.validate(value)).toBe(true);
  });

  it("returns digit 2 for female born 1990", () => {
    const rng = createRng(42);
    const value = krRrnDefinition.generate(rng, { gender: "female", birthYear: 1990 });
    expect(rrnGenderDigit(value)).toBe(2);
    expect(krRrnDefinition.validate(value)).toBe(true);
  });

  it("returns digit 3 for male born 2005", () => {
    const rng = createRng(42);
    const value = krRrnDefinition.generate(rng, { gender: "male", birthYear: 2005 });
    expect(rrnGenderDigit(value)).toBe(3);
    expect(krRrnDefinition.validate(value)).toBe(true);
  });

  it("returns digit 4 for female born 2010", () => {
    const rng = createRng(42);
    const value = krRrnDefinition.generate(rng, { gender: "female", birthYear: 2010 });
    expect(rrnGenderDigit(value)).toBe(4);
    expect(krRrnDefinition.validate(value)).toBe(true);
  });

  it("fallback digit 1 for 'other' gender (neutral default)", () => {
    const rng = createRng(42);
    const value = krRrnDefinition.generate(rng, { gender: "other", birthYear: 1988 });
    expect(rrnGenderDigit(value)).toBe(1);
    expect(krRrnDefinition.validate(value)).toBe(true);
  });

  it("fallback digit 1 for 'unknown' gender (neutral default)", () => {
    const rng = createRng(42);
    const value = krRrnDefinition.generate(rng, { gender: "unknown", birthYear: 1975 });
    expect(rrnGenderDigit(value)).toBe(1);
    expect(krRrnDefinition.validate(value)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Standalone usage without context still produces valid, deterministic RRNs
// ---------------------------------------------------------------------------

describe("KR RRN — standalone usage (no context)", () => {
  it("produces a valid RRN when called without context", () => {
    for (let seed = 1; seed <= 10; seed++) {
      const rng = createRng(seed);
      const value = krRrnDefinition.generate(rng);
      expect(/^\d{6}-\d{7}$/.test(value)).toBe(true);
      expect(krRrnDefinition.validate(value)).toBe(true);
    }
  });

  it("is deterministic without context", () => {
    const a = krRrnDefinition.generate(createRng(7));
    const b = krRrnDefinition.generate(createRng(7));
    expect(a).toBe(b);
  });
});
