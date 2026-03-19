import { describe, it, expect } from "vitest";
import { createPatientBuilder } from "@/core/builders/patient.js";
import { jpHospitalMrnDefinition } from "@/core/generators/identifiers.js";
import { krRrnDefinition } from "@/core/generators/identifiers.js";
import { sgNricDefinition } from "@/core/generators/identifiers.js";

describe("JP locale", () => {
  it("generates a valid Patient with JP address", () => {
    const [p] = createPatientBuilder().locale("jp").seed(42).build();
    expect(p?.["resourceType"]).toBe("Patient");
    const addr = (p?.["address"] as Array<Record<string, unknown>>)[0];
    expect(addr?.["country"]).toBe("JP");
  });

  it("JP hospital MRN is 10 digits", () => {
    const mrn = jpHospitalMrnDefinition.generate(() => 0.5);
    expect(/^\d{10}$/.test(mrn)).toBe(true);
    expect(jpHospitalMrnDefinition.validate(mrn)).toBe(true);
  });

  it("is deterministic", () => {
    const a = createPatientBuilder().locale("jp").seed(1).count(3).build();
    const b = createPatientBuilder().locale("jp").seed(1).count(3).build();
    expect(a).toEqual(b);
  });
});

describe("KR locale", () => {
  it("generates a valid Patient with KR address", () => {
    const [p] = createPatientBuilder().locale("kr").seed(42).build();
    expect(p?.["resourceType"]).toBe("Patient");
    const addr = (p?.["address"] as Array<Record<string, unknown>>)[0];
    expect(addr?.["country"]).toBe("KR");
  });

  it("KR RRN has format YYMMDD-NNNNNNN", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const value = krRrnDefinition.generate(((): (() => number) => { let s = seed; return (): number => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 4294967296; }; })());
      expect(/^\d{6}-\d{7}$/.test(value)).toBe(true);
      expect(krRrnDefinition.validate(value)).toBe(true);
    }
  });

  it("is deterministic", () => {
    const a = createPatientBuilder().locale("kr").seed(42).count(3).build();
    const b = createPatientBuilder().locale("kr").seed(42).count(3).build();
    expect(a).toEqual(b);
  });
});

describe("SG locale", () => {
  it("generates a valid Patient with SG address", () => {
    const [p] = createPatientBuilder().locale("sg").seed(42).build();
    expect(p?.["resourceType"]).toBe("Patient");
    const addr = (p?.["address"] as Array<Record<string, unknown>>)[0];
    expect(addr?.["country"]).toBe("SG");
  });

  it("SG NRIC has correct format", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const value = sgNricDefinition.generate(((): (() => number) => { let s = seed; return (): number => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 4294967296; }; })());
      expect(/^[STFG]\d{7}[A-Z]$/.test(value)).toBe(true);
      expect(sgNricDefinition.validate(value)).toBe(true);
    }
  });

  it("is deterministic", () => {
    const a = createPatientBuilder().locale("sg").seed(7).count(3).build();
    const b = createPatientBuilder().locale("sg").seed(7).count(3).build();
    expect(a).toEqual(b);
  });
});
