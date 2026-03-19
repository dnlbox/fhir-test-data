import { describe, it, expect } from "vitest";
import { createObservationBuilder } from "@/core/builders/observation.js";
import { COMMON_LOINC_CODES } from "@/core/data/loinc-codes.js";

const LOINC_CODES = COMMON_LOINC_CODES.map((c) => c.code);
const VITAL_SIGN_CODES = COMMON_LOINC_CODES.filter((c) => c.category === "vital-signs").map((c) => c.code);
const LAB_CODES = COMMON_LOINC_CODES.filter((c) => c.category === "laboratory").map((c) => c.code);

describe("Observation structure", () => {
  it("has required top-level fields", () => {
    const [obs] = createObservationBuilder().seed(1).build();
    expect(obs).toBeDefined();
    if (!obs) return;

    expect(obs["resourceType"]).toBe("Observation");
    expect(typeof obs["id"]).toBe("string");
    expect(obs["status"]).toBe("final");
    expect(Array.isArray(obs["category"])).toBe(true);
    expect(typeof obs["code"]).toBe("object");
    expect(typeof obs["subject"]).toBe("object");
    expect(typeof obs["effectiveDateTime"]).toBe("string");
    expect(typeof obs["valueQuantity"]).toBe("object");
  });

  it("subject.reference is set", () => {
    const [obs] = createObservationBuilder().seed(2).build();
    const subject = obs?.["subject"] as Record<string, unknown>;
    expect(typeof subject?.["reference"]).toBe("string");
    expect((subject?.["reference"] as string).startsWith("Patient/")).toBe(true);
  });

  it("subject uses provided reference", () => {
    const [obs] = createObservationBuilder().subject("Patient/abc-123").seed(3).build();
    const subject = obs?.["subject"] as Record<string, unknown>;
    expect(subject?.["reference"]).toBe("Patient/abc-123");
  });

  it("effectiveDateTime is ISO 8601 format", () => {
    const [obs] = createObservationBuilder().seed(4).build();
    const dt = obs?.["effectiveDateTime"] as string;
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dt)).toBe(true);
  });

  it("LOINC code is from the known list", () => {
    const builder = createObservationBuilder().seed(5).count(30);
    const observations = builder.build();
    for (const obs of observations) {
      const code = obs["code"] as Record<string, unknown>;
      const coding = (code["coding"] as Array<Record<string, unknown>>)[0];
      expect(LOINC_CODES).toContain(coding?.["code"]);
      expect(coding?.["system"]).toBe("http://loinc.org");
    }
  });

  it("valueQuantity is within expected range for heart rate", () => {
    // Run many observations until we get a heart rate, check it's in range
    const observations = createObservationBuilder().seed(10).count(100).build();
    const heartRateObs = observations.filter((o) => {
      const code = o["code"] as Record<string, unknown>;
      const coding = (code["coding"] as Array<Record<string, unknown>>)[0];
      return coding?.["code"] === "8867-4";
    });
    expect(heartRateObs.length).toBeGreaterThan(0);
    for (const obs of heartRateObs) {
      const vq = obs["valueQuantity"] as Record<string, unknown>;
      const value = vq["value"] as number;
      expect(value).toBeGreaterThanOrEqual(50);
      expect(value).toBeLessThanOrEqual(120);
    }
  });
});

describe("Observation category filter", () => {
  it("vital-signs category only returns vital-signs codes", () => {
    const observations = createObservationBuilder().seed(7).count(20).category("vital-signs").build();
    for (const obs of observations) {
      const code = obs["code"] as Record<string, unknown>;
      const coding = (code["coding"] as Array<Record<string, unknown>>)[0];
      expect(VITAL_SIGN_CODES).toContain(coding?.["code"]);
      const cat = obs["category"] as Array<Record<string, unknown>>;
      const catCoding = (cat[0]?.["coding"] as Array<Record<string, unknown>>)[0];
      expect(catCoding?.["code"]).toBe("vital-signs");
    }
  });

  it("laboratory category only returns lab codes", () => {
    const observations = createObservationBuilder().seed(8).count(20).category("laboratory").build();
    for (const obs of observations) {
      const code = obs["code"] as Record<string, unknown>;
      const coding = (code["coding"] as Array<Record<string, unknown>>)[0];
      expect(LAB_CODES).toContain(coding?.["code"]);
      const cat = obs["category"] as Array<Record<string, unknown>>;
      const catCoding = (cat[0]?.["coding"] as Array<Record<string, unknown>>)[0];
      expect(catCoding?.["code"]).toBe("laboratory");
    }
  });
});

describe("Observation determinism", () => {
  it("same seed produces identical output", () => {
    const a = createObservationBuilder().seed(99).count(5).build();
    const b = createObservationBuilder().seed(99).count(5).build();
    expect(a).toEqual(b);
  });

  it("different seeds produce different output", () => {
    const a = createObservationBuilder().seed(1).count(5).build();
    const b = createObservationBuilder().seed(2).count(5).build();
    expect(a).not.toEqual(b);
  });
});
