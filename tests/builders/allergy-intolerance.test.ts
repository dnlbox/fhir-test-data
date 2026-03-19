import { describe, it, expect } from "vitest";
import { createAllergyIntoleranceBuilder } from "@/core/builders/allergy-intolerance.js";
import { COMMON_ALLERGY_CODES } from "@/core/data/allergy-codes.js";

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

describe("AllergyIntolerance — R5 type field", () => {
  it("type is a CodeableConcept object for R5", () => {
    const [ai] = createAllergyIntoleranceBuilder().seed(1).fhirVersion("R5").build();
    const type = ai?.["type"];
    expect(typeof type).toBe("object");
    expect(Array.isArray((type as Record<string, unknown>)?.["coding"])).toBe(true);
  });

  it("type coding preserves the original code value", () => {
    const [r4] = createAllergyIntoleranceBuilder().seed(1).fhirVersion("R4").build();
    const [r5] = createAllergyIntoleranceBuilder().seed(1).fhirVersion("R5").build();
    const r4Code = r4?.["type"] as string;
    const r5Type = r5?.["type"] as Record<string, unknown>;
    const r5Coding = (r5Type?.["coding"] as Array<Record<string, unknown>>)[0];
    expect(r5Coding?.["code"]).toBe(r4Code);
  });

  it("type is a plain string for R4", () => {
    const [ai] = createAllergyIntoleranceBuilder().seed(1).fhirVersion("R4").build();
    expect(typeof ai?.["type"]).toBe("string");
  });

  it("R4B type field is same as R4", () => {
    const [r4] = createAllergyIntoleranceBuilder().seed(1).fhirVersion("R4").build();
    const [r4b] = createAllergyIntoleranceBuilder().seed(1).fhirVersion("R4B").build();
    expect(r4).toEqual(r4b);
  });
});

describe("AllergyIntolerance — R5 subject field", () => {
  it("R5 uses 'subject' instead of 'patient'", () => {
    const [ai] = createAllergyIntoleranceBuilder().seed(1).fhirVersion("R5").build();
    expect(ai).not.toHaveProperty("patient");
    expect(typeof ai?.["subject"]).toBe("object");
  });

  it("R5 subject.reference starts with Patient/", () => {
    const [ai] = createAllergyIntoleranceBuilder().seed(2).fhirVersion("R5").build();
    const subject = ai?.["subject"] as Record<string, unknown>;
    expect((subject?.["reference"] as string).startsWith("Patient/")).toBe(true);
  });

  it("R4 still uses 'patient', not 'subject'", () => {
    const [ai] = createAllergyIntoleranceBuilder().seed(1).fhirVersion("R4").build();
    expect(ai).toHaveProperty("patient");
    expect(ai).not.toHaveProperty("subject");
  });

  it("R4B still uses 'patient', not 'subject'", () => {
    const [ai] = createAllergyIntoleranceBuilder().seed(1).fhirVersion("R4B").build();
    expect(ai).toHaveProperty("patient");
    expect(ai).not.toHaveProperty("subject");
  });
});
