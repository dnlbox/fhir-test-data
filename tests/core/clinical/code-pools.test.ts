import { describe, it, expect } from "vitest";
import { createConditionBuilder } from "@/core/builders/condition.js";
import { createObservationBuilder } from "@/core/builders/observation.js";
import { createAllergyIntoleranceBuilder } from "@/core/builders/allergy-intolerance.js";
import { createMedicationStatementBuilder } from "@/core/builders/medication-statement.js";

const SNOMED_SYSTEM = "http://snomed.info/sct";
const RXNORM_SYSTEM = "http://www.nlm.nih.gov/research/umls/rxnorm";

describe("Condition code pool coverage", () => {
  it("produces ≥20 unique SNOMED codes across 100 seeds", () => {
    const uniqueCodes = new Set<string>();
    for (let seed = 1; seed <= 100; seed++) {
      const [condition] = createConditionBuilder().locale("us").seed(seed).build();
      if (!condition) continue;
      const code = condition["code"] as Record<string, unknown>;
      const coding = (code["coding"] as Array<Record<string, unknown>>)[0];
      if (coding?.["code"]) uniqueCodes.add(coding["code"] as string);
    }
    expect(uniqueCodes.size).toBeGreaterThanOrEqual(20);
  });

  it("all generated conditions have SNOMED system URI", () => {
    const conditions = createConditionBuilder().locale("us").seed(1).count(20).build();
    for (const condition of conditions) {
      const code = condition["code"] as Record<string, unknown>;
      const coding = (code["coding"] as Array<Record<string, unknown>>)[0];
      expect(coding?.["system"]).toBe(SNOMED_SYSTEM);
    }
  });

  it("resourceType is Condition", () => {
    const [condition] = createConditionBuilder().seed(1).build();
    expect(condition?.["resourceType"]).toBe("Condition");
  });
});

describe("Observation code pool coverage", () => {
  it("produces ≥20 unique LOINC codes across 100 seeds", () => {
    const uniqueCodes = new Set<string>();
    for (let seed = 1; seed <= 100; seed++) {
      const [obs] = createObservationBuilder().locale("us").seed(seed).build();
      if (!obs) continue;
      const code = obs["code"] as Record<string, unknown>;
      const coding = (code["coding"] as Array<Record<string, unknown>>)[0];
      if (coding?.["code"]) uniqueCodes.add(coding["code"] as string);
    }
    expect(uniqueCodes.size).toBeGreaterThanOrEqual(20);
  });

  it("resourceType is Observation", () => {
    const [obs] = createObservationBuilder().seed(1).build();
    expect(obs?.["resourceType"]).toBe("Observation");
  });
});

describe("Allergy code pool coverage", () => {
  it("all generated allergies have a valid SNOMED system URI", () => {
    const allergies = createAllergyIntoleranceBuilder().locale("us").seed(1).count(20).build();
    for (const allergy of allergies) {
      const code = allergy["code"] as Record<string, unknown>;
      const coding = (code["coding"] as Array<Record<string, unknown>>)[0];
      expect(coding?.["system"]).toBe(SNOMED_SYSTEM);
    }
  });

  it("resourceType is AllergyIntolerance", () => {
    const [allergy] = createAllergyIntoleranceBuilder().seed(1).build();
    expect(allergy?.["resourceType"]).toBe("AllergyIntolerance");
  });
});

describe("Medication code pool — global (non-US) locale", () => {
  it("all generated medication statements use SNOMED system for non-US locale", () => {
    const statements = createMedicationStatementBuilder().locale("de").seed(1).count(20).build();
    for (const ms of statements) {
      const medCode = ms["medicationCodeableConcept"] as Record<string, unknown>;
      const coding = (medCode["coding"] as Array<Record<string, unknown>>)[0];
      expect(coding?.["system"]).toBe(SNOMED_SYSTEM);
    }
  });
});

describe("Medication code pool — US RxNorm", () => {
  it("US locale medication statements include at least some RxNorm codes across 20 resources", () => {
    const statements = createMedicationStatementBuilder().locale("us").seed(1).count(20).build();
    const rxnormCount = statements.filter((ms) => {
      const medCode = ms["medicationCodeableConcept"] as Record<string, unknown>;
      const coding = (medCode["coding"] as Array<Record<string, unknown>>)[0];
      return (coding?.["system"] as string | undefined)?.includes("rxnorm");
    }).length;
    expect(rxnormCount).toBeGreaterThan(0);
  });

  it("US locale medication statements use either SNOMED or RxNorm system", () => {
    const statements = createMedicationStatementBuilder().locale("us").seed(42).count(20).build();
    for (const ms of statements) {
      const medCode = ms["medicationCodeableConcept"] as Record<string, unknown>;
      const coding = (medCode["coding"] as Array<Record<string, unknown>>)[0];
      const system = coding?.["system"] as string;
      expect([SNOMED_SYSTEM, RXNORM_SYSTEM]).toContain(system);
    }
  });
});

describe("No regressions — all generated resources have correct resourceType", () => {
  it("Condition resourceType is correct", () => {
    const resources = createConditionBuilder().seed(10).count(5).build();
    for (const r of resources) expect(r["resourceType"]).toBe("Condition");
  });

  it("Observation resourceType is correct", () => {
    const resources = createObservationBuilder().seed(10).count(5).build();
    for (const r of resources) expect(r["resourceType"]).toBe("Observation");
  });

  it("AllergyIntolerance resourceType is correct", () => {
    const resources = createAllergyIntoleranceBuilder().seed(10).count(5).build();
    for (const r of resources) expect(r["resourceType"]).toBe("AllergyIntolerance");
  });

  it("MedicationStatement resourceType is correct", () => {
    const resources = createMedicationStatementBuilder().seed(10).count(5).build();
    for (const r of resources) expect(r["resourceType"]).toBe("MedicationStatement");
  });
});
