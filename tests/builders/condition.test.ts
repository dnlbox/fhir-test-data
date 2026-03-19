import { describe, it, expect } from "vitest";
import { createConditionBuilder } from "@/core/builders/condition.js";
import { COMMON_SNOMED_CONDITIONS } from "@/core/data/snomed-codes.js";

const SNOMED_CODES = COMMON_SNOMED_CONDITIONS.map((c) => c.code);

describe("Condition structure", () => {
  it("has required top-level fields", () => {
    const [cond] = createConditionBuilder().seed(1).build();
    expect(cond).toBeDefined();
    if (!cond) return;

    expect(cond["resourceType"]).toBe("Condition");
    expect(typeof cond["id"]).toBe("string");
    expect(typeof cond["clinicalStatus"]).toBe("object");
    expect(typeof cond["verificationStatus"]).toBe("object");
    expect(typeof cond["code"]).toBe("object");
    expect(typeof cond["subject"]).toBe("object");
    expect(typeof cond["onsetDateTime"]).toBe("string");
  });

  it("clinicalStatus is active", () => {
    const [cond] = createConditionBuilder().seed(2).build();
    const status = cond?.["clinicalStatus"] as Record<string, unknown>;
    const coding = (status?.["coding"] as Array<Record<string, unknown>>)[0];
    expect(coding?.["code"]).toBe("active");
  });

  it("verificationStatus is confirmed", () => {
    const [cond] = createConditionBuilder().seed(3).build();
    const status = cond?.["verificationStatus"] as Record<string, unknown>;
    const coding = (status?.["coding"] as Array<Record<string, unknown>>)[0];
    expect(coding?.["code"]).toBe("confirmed");
  });

  it("SNOMED code is from known list", () => {
    const conditions = createConditionBuilder().seed(5).count(30).build();
    for (const cond of conditions) {
      const code = cond["code"] as Record<string, unknown>;
      const coding = (code["coding"] as Array<Record<string, unknown>>)[0];
      expect(coding?.["system"]).toBe("http://snomed.info/sct");
      expect(SNOMED_CODES).toContain(coding?.["code"]);
    }
  });

  it("subject.reference starts with Patient/", () => {
    const [cond] = createConditionBuilder().seed(6).build();
    const subject = cond?.["subject"] as Record<string, unknown>;
    expect((subject?.["reference"] as string).startsWith("Patient/")).toBe(true);
  });

  it("uses provided subject reference", () => {
    const [cond] = createConditionBuilder().subject("Patient/my-patient-id").seed(7).build();
    const subject = cond?.["subject"] as Record<string, unknown>;
    expect(subject?.["reference"]).toBe("Patient/my-patient-id");
  });

  it("onsetDateTime is a valid date string", () => {
    const [cond] = createConditionBuilder().seed(8).build();
    const onset = cond?.["onsetDateTime"] as string;
    expect(/^\d{4}-\d{2}-\d{2}$/.test(onset)).toBe(true);
  });
});

describe("Condition determinism", () => {
  it("same seed produces identical output", () => {
    const a = createConditionBuilder().seed(99).count(5).build();
    const b = createConditionBuilder().seed(99).count(5).build();
    expect(a).toEqual(b);
  });

  it("different seeds produce different output", () => {
    const a = createConditionBuilder().seed(1).count(5).build();
    const b = createConditionBuilder().seed(2).count(5).build();
    expect(a).not.toEqual(b);
  });
});
