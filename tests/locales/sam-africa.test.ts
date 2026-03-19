import { describe, it, expect } from "vitest";
import { createPatientBuilder } from "@/core/builders/patient.js";
import { brCpfDefinition, mxCurpDefinition, zaIdDefinition } from "@/core/generators/identifiers.js";

describe("BR locale", () => {
  it("generates a valid Patient with BR address", () => {
    const [p] = createPatientBuilder().locale("br").seed(42).build();
    expect(p?.["resourceType"]).toBe("Patient");
    const addr = (p?.["address"] as Array<Record<string, unknown>>)[0];
    expect(addr?.["country"]).toBe("BR");
  });

  it("CPF has format NNN.NNN.NNN-DD", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const value = brCpfDefinition.generate(((): (() => number) => { let s = seed; return (): number => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 4294967296; }; })());
      expect(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(value)).toBe(true);
      expect(brCpfDefinition.validate(value)).toBe(true);
    }
  });

  it("is deterministic", () => {
    const a = createPatientBuilder().locale("br").seed(1).count(3).build();
    const b = createPatientBuilder().locale("br").seed(1).count(3).build();
    expect(a).toEqual(b);
  });
});

describe("MX locale", () => {
  it("generates a valid Patient with MX address", () => {
    const [p] = createPatientBuilder().locale("mx").seed(42).build();
    expect(p?.["resourceType"]).toBe("Patient");
    const addr = (p?.["address"] as Array<Record<string, unknown>>)[0];
    expect(addr?.["country"]).toBe("MX");
  });

  it("CURP has correct format", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const value = mxCurpDefinition.generate(((): (() => number) => { let s = seed; return (): number => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 4294967296; }; })());
      expect(/^[A-Z]{4}\d{6}[HM][A-Z]{2}[BCDFGHJKLMNPQRSTVWXYZ]{3}[0-9A-Z]\d$/.test(value)).toBe(true);
      expect(mxCurpDefinition.validate(value)).toBe(true);
    }
  });

  it("is deterministic", () => {
    const a = createPatientBuilder().locale("mx").seed(42).count(3).build();
    const b = createPatientBuilder().locale("mx").seed(42).count(3).build();
    expect(a).toEqual(b);
  });
});

describe("ZA locale", () => {
  it("generates a valid Patient with ZA address", () => {
    const [p] = createPatientBuilder().locale("za").seed(42).build();
    expect(p?.["resourceType"]).toBe("Patient");
    const addr = (p?.["address"] as Array<Record<string, unknown>>)[0];
    expect(addr?.["country"]).toBe("ZA");
  });

  it("ZA ID is 13 digits with valid Luhn check", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const value = zaIdDefinition.generate(((): (() => number) => { let s = seed; return (): number => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 4294967296; }; })());
      expect(/^\d{13}$/.test(value)).toBe(true);
      expect(zaIdDefinition.validate(value)).toBe(true);
    }
  });

  it("is deterministic", () => {
    const a = createPatientBuilder().locale("za").seed(7).count(3).build();
    const b = createPatientBuilder().locale("za").seed(7).count(3).build();
    expect(a).toEqual(b);
  });
});
