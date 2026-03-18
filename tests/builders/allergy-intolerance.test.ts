import { describe, it, expect } from "vitest";
import { createAllergyIntoleranceBuilder } from "../../src/core/builders/allergy-intolerance.js";
import { COMMON_ALLERGY_CODES } from "../../src/core/data/allergy-codes.js";

const ALLERGY_CODES = COMMON_ALLERGY_CODES.map((c) => c.code);

describe("AllergyIntolerance structure", () => {
  it("has required top-level fields", () => {
    const [ai] = createAllergyIntoleranceBuilder().seed(1).build();
    expect(ai).toBeDefined();
    if (!ai) return;

    expect(ai["resourceType"]).toBe("AllergyIntolerance");
    expect(typeof ai["id"]).toBe("string");
    expect(typeof ai["clinicalStatus"]).toBe("object");
    expect(typeof ai["verificationStatus"]).toBe("object");
    expect(["allergy", "intolerance"]).toContain(ai["type"]);
    expect(Array.isArray(ai["category"])).toBe(true);
    expect(["low", "high", "unable-to-assess"]).toContain(ai["criticality"]);
    expect(typeof ai["code"]).toBe("object");
    expect(typeof ai["patient"]).toBe("object");
    expect(typeof ai["recordedDate"]).toBe("string");
  });

  it("patient.reference starts with Patient/", () => {
    const [ai] = createAllergyIntoleranceBuilder().seed(2).build();
    const patient = ai?.["patient"] as Record<string, unknown>;
    expect((patient?.["reference"] as string).startsWith("Patient/")).toBe(true);
  });

  it("uses provided subject as patient reference", () => {
    const [ai] = createAllergyIntoleranceBuilder().subject("Patient/pt-001").seed(3).build();
    const patient = ai?.["patient"] as Record<string, unknown>;
    expect(patient?.["reference"]).toBe("Patient/pt-001");
  });

  it("allergy code is from known list", () => {
    const allergies = createAllergyIntoleranceBuilder().seed(5).count(30).build();
    for (const ai of allergies) {
      const code = ai["code"] as Record<string, unknown>;
      const coding = (code["coding"] as Array<Record<string, unknown>>)[0];
      expect(ALLERGY_CODES).toContain(coding?.["code"]);
    }
  });

  it("clinicalStatus is active and verificationStatus is confirmed", () => {
    const [ai] = createAllergyIntoleranceBuilder().seed(6).build();
    const clinStatus = ai?.["clinicalStatus"] as Record<string, unknown>;
    const clinCoding = (clinStatus?.["coding"] as Array<Record<string, unknown>>)[0];
    expect(clinCoding?.["code"]).toBe("active");

    const verStatus = ai?.["verificationStatus"] as Record<string, unknown>;
    const verCoding = (verStatus?.["coding"] as Array<Record<string, unknown>>)[0];
    expect(verCoding?.["code"]).toBe("confirmed");
  });

  it("recordedDate is a valid date string", () => {
    const [ai] = createAllergyIntoleranceBuilder().seed(7).build();
    const date = ai?.["recordedDate"] as string;
    expect(/^\d{4}-\d{2}-\d{2}$/.test(date)).toBe(true);
  });
});

describe("AllergyIntolerance determinism", () => {
  it("same seed produces identical output", () => {
    const a = createAllergyIntoleranceBuilder().seed(99).count(5).build();
    const b = createAllergyIntoleranceBuilder().seed(99).count(5).build();
    expect(a).toEqual(b);
  });

  it("different seeds produce different output", () => {
    const a = createAllergyIntoleranceBuilder().seed(1).count(5).build();
    const b = createAllergyIntoleranceBuilder().seed(2).count(5).build();
    expect(a).not.toEqual(b);
  });
});
