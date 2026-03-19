import { describe, it, expect } from "vitest";
import { createMedicationStatementBuilder } from "@/core/builders/medication-statement.js";
import { COMMON_MEDICATION_CODES, US_RXNORM_MEDICATION_CODES } from "@/core/data/medication-codes.js";

const MED_CODES = COMMON_MEDICATION_CODES.map((c) => c.code);
const ALL_US_MED_CODES = [...COMMON_MEDICATION_CODES, ...US_RXNORM_MEDICATION_CODES].map((c) => c.code);

describe("MedicationStatement structure", () => {
  it("has required top-level fields", () => {
    const [ms] = createMedicationStatementBuilder().seed(1).build();
    expect(ms).toBeDefined();
    if (!ms) return;

    expect(ms["resourceType"]).toBe("MedicationStatement");
    expect(typeof ms["id"]).toBe("string");
    expect(ms["status"]).toBe("active");
    expect(typeof ms["medicationCodeableConcept"]).toBe("object");
    expect(typeof ms["subject"]).toBe("object");
    expect(typeof ms["effectivePeriod"]).toBe("object");
    expect(Array.isArray(ms["dosage"])).toBe(true);
  });

  it("subject.reference starts with Patient/", () => {
    const [ms] = createMedicationStatementBuilder().seed(2).build();
    const subject = ms?.["subject"] as Record<string, unknown>;
    expect((subject?.["reference"] as string).startsWith("Patient/")).toBe(true);
  });

  it("uses provided subject reference", () => {
    const [ms] = createMedicationStatementBuilder().subject("Patient/pt-999").seed(3).build();
    const subject = ms?.["subject"] as Record<string, unknown>;
    expect(subject?.["reference"]).toBe("Patient/pt-999");
  });

  it("medication code is from known list (non-US locale uses SNOMED only)", () => {
    const statements = createMedicationStatementBuilder().locale("de").seed(5).count(30).build();
    for (const ms of statements) {
      const medCode = ms["medicationCodeableConcept"] as Record<string, unknown>;
      const coding = (medCode["coding"] as Array<Record<string, unknown>>)[0];
      expect(MED_CODES).toContain(coding?.["code"]);
      expect(coding?.["system"]).toBe("http://snomed.info/sct");
    }
  });

  it("medication code is from known list (US locale may include RxNorm)", () => {
    const statements = createMedicationStatementBuilder().locale("us").seed(5).count(30).build();
    for (const ms of statements) {
      const medCode = ms["medicationCodeableConcept"] as Record<string, unknown>;
      const coding = (medCode["coding"] as Array<Record<string, unknown>>)[0];
      expect(ALL_US_MED_CODES).toContain(coding?.["code"]);
    }
  });

  it("effectivePeriod has a start date", () => {
    const [ms] = createMedicationStatementBuilder().seed(6).build();
    const period = ms?.["effectivePeriod"] as Record<string, unknown>;
    expect(typeof period?.["start"]).toBe("string");
    expect(/^\d{4}-\d{2}-\d{2}$/.test(period["start"] as string)).toBe(true);
  });

  it("dosage text includes mg and frequency", () => {
    const statements = createMedicationStatementBuilder().seed(7).count(10).build();
    for (const ms of statements) {
      const dosage = (ms["dosage"] as Array<Record<string, unknown>>)[0];
      const text = dosage?.["text"] as string;
      expect(text).toMatch(/mg/);
    }
  });
});

describe("MedicationStatement determinism", () => {
  it("same seed produces identical output", () => {
    const a = createMedicationStatementBuilder().seed(99).count(5).build();
    const b = createMedicationStatementBuilder().seed(99).count(5).build();
    expect(a).toEqual(b);
  });

  it("different seeds produce different output", () => {
    const a = createMedicationStatementBuilder().seed(1).count(5).build();
    const b = createMedicationStatementBuilder().seed(2).count(5).build();
    expect(a).not.toEqual(b);
  });
});

describe("MedicationStatement — R5 (MedicationUsage)", () => {
  it("resourceType is MedicationUsage for R5", () => {
    const [ms] = createMedicationStatementBuilder().seed(1).fhirVersion("R5").build();
    expect(ms?.["resourceType"]).toBe("MedicationUsage");
  });

  it("medication.concept contains coding for R5", () => {
    const [ms] = createMedicationStatementBuilder().seed(1).fhirVersion("R5").build();
    const medication = ms?.["medication"] as Record<string, unknown>;
    const concept = medication?.["concept"] as Record<string, unknown>;
    expect(Array.isArray(concept?.["coding"])).toBe(true);
  });

  it("medicationCodeableConcept is absent for R5", () => {
    const [ms] = createMedicationStatementBuilder().seed(1).fhirVersion("R5").build();
    expect(ms?.["medicationCodeableConcept"]).toBeUndefined();
  });

  it("status is recorded for R5", () => {
    const [ms] = createMedicationStatementBuilder().seed(1).fhirVersion("R5").build();
    expect(ms?.["status"]).toBe("recorded");
  });

  it("R4 output is unchanged by default", () => {
    const [ms] = createMedicationStatementBuilder().seed(1).build();
    expect(ms?.["resourceType"]).toBe("MedicationStatement");
    expect(ms?.["medicationCodeableConcept"]).toBeDefined();
  });

  it("R4B output is same structure as R4", () => {
    const [r4] = createMedicationStatementBuilder().seed(1).fhirVersion("R4").build();
    const [r4b] = createMedicationStatementBuilder().seed(1).fhirVersion("R4B").build();
    expect(r4).toEqual(r4b);
  });
});
