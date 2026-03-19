import { describe, it, expect } from "vitest";
import { createObservationBuilder } from "@/core/builders/observation.js";
import { createConditionBuilder } from "@/core/builders/condition.js";
import { createAllergyIntoleranceBuilder } from "@/core/builders/allergy-intolerance.js";
import { createMedicationStatementBuilder } from "@/core/builders/medication-statement.js";
import { createPatientBuilder } from "@/core/builders/patient.js";
import { injectFaults } from "@/core/faults/index.js";
import { createRng } from "@/core/generators/rng.js";
import type { FhirResource } from "@/core/types.js";

const rng = createRng(42);

// ---------------------------------------------------------------------------
// malformed-date on Observation
// ---------------------------------------------------------------------------

describe("malformed-date on Observation", () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    it(`seed ${seed} — corrupts primary date field`, () => {
      const [obs] = createObservationBuilder().seed(seed).build();
      if (!obs) throw new Error("No observation built");

      const result = injectFaults(obs, ["malformed-date"], createRng(seed));

      if ("effectiveDateTime" in obs) {
        // Primary field present: it must be corrupted.
        expect(result["effectiveDateTime"]).toBe("not-a-date");
      } else if ("effectivePeriod" in obs) {
        // Fallback: Period.start must be corrupted.
        const period = result["effectivePeriod"] as Record<string, unknown>;
        expect(period["start"]).toBe("not-a-date");
      } else {
        // At least one date-like field must have been corrupted.
        const json = JSON.stringify(result);
        expect(json).toContain("not-a-date");
      }
    });
  }
});

// ---------------------------------------------------------------------------
// malformed-date on Condition
// ---------------------------------------------------------------------------

describe("malformed-date on Condition", () => {
  it("sets onsetDateTime to not-a-date", () => {
    const [condition] = createConditionBuilder().seed(1).build();
    if (!condition) throw new Error("No condition built");

    const result = injectFaults(condition, ["malformed-date"], rng);
    expect(result["onsetDateTime"]).toBe("not-a-date");
  });

  it("is reproducible with the same seed", () => {
    const [condition] = createConditionBuilder().seed(7).build();
    if (!condition) throw new Error("No condition built");

    const r1 = injectFaults(condition, ["malformed-date"], createRng(99));
    const r2 = injectFaults(condition, ["malformed-date"], createRng(99));
    expect(r1["onsetDateTime"]).toBe("not-a-date");
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });
});

// ---------------------------------------------------------------------------
// malformed-date on AllergyIntolerance
// ---------------------------------------------------------------------------

describe("malformed-date on AllergyIntolerance", () => {
  it("sets recordedDate to not-a-date", () => {
    const [allergy] = createAllergyIntoleranceBuilder().seed(1).build();
    if (!allergy) throw new Error("No allergy built");

    const result = injectFaults(allergy, ["malformed-date"], rng);
    expect(result["recordedDate"]).toBe("not-a-date");
  });
});

// ---------------------------------------------------------------------------
// malformed-date on MedicationStatement (uses effectivePeriod.start, not effectiveDateTime)
// ---------------------------------------------------------------------------

describe("malformed-date on MedicationStatement", () => {
  it("fallback scan corrupts effectivePeriod.start when primary field is absent", () => {
    const [med] = createMedicationStatementBuilder().seed(1).build();
    if (!med) throw new Error("No medication statement built");

    // MedicationStatement has effectivePeriod, not effectiveDateTime.
    // The primary-field map says effectiveDateTime — that field is absent,
    // so the fallback Period scan must pick up effectivePeriod.start.
    expect("effectiveDateTime" in med).toBe(false);
    expect("effectivePeriod" in med).toBe(true);

    const result = injectFaults(med, ["malformed-date"], rng);
    const period = result["effectivePeriod"] as Record<string, unknown>;
    expect(period["start"]).toBe("not-a-date");
  });

  it("leaves all other fields intact", () => {
    const [med] = createMedicationStatementBuilder().seed(2).build();
    if (!med) throw new Error("No medication statement built");

    const result = injectFaults(med, ["malformed-date"], rng);
    expect(result["resourceType"]).toBe("MedicationStatement");
    expect(result["status"]).toBe("active");
  });
});

// ---------------------------------------------------------------------------
// malformed-date on Patient — regression
// ---------------------------------------------------------------------------

describe("malformed-date on Patient", () => {
  it("still sets birthDate to not-a-date", () => {
    const [patient] = createPatientBuilder().seed(1).build();
    if (!patient) throw new Error("No patient built");

    const result = injectFaults(patient, ["malformed-date"], rng);
    expect(result["birthDate"]).toBe("not-a-date");
  });
});

// ---------------------------------------------------------------------------
// malformed-date on Organization — no-op
// ---------------------------------------------------------------------------

describe("malformed-date on Organization", () => {
  it("is a no-op when no date field is present", () => {
    const org: FhirResource = {
      resourceType: "Organization",
      id: "org-1",
      name: "Example Health System",
    };

    const result = injectFaults(org, ["malformed-date"], rng);
    expect(result).toEqual(org);
    expect(JSON.stringify(result)).toBe(JSON.stringify(org));
  });
});
