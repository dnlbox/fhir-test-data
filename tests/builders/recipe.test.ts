import { describe, expect, it } from "vitest";
import { BundleRecipeError, createBundleFromRecipe } from "@/core/recipes.js";
import type { BundleRecipe } from "@/core/recipes.js";

function resources(bundle: Record<string, unknown>): Record<string, unknown>[] {
  const entries = bundle["entry"] as Array<Record<string, unknown>>;
  return entries.map((entry) => entry["resource"] as Record<string, unknown>);
}

function byType(bundle: Record<string, unknown>, type: string): Record<string, unknown> {
  const found = resources(bundle).find((resource) => resource["resourceType"] === type);
  if (found === undefined) throw new Error(`missing ${type}`);
  return found;
}

const BASIC_RECIPE: BundleRecipe = {
  name: "lab-result-basic",
  locale: "uk",
  fhirVersion: "R4",
  bundle: { type: "transaction" },
  resources: [
    { type: "Patient", id: "patient" },
    {
      type: "Encounter",
      id: "encounter",
      fields: { subject: "patient" },
    },
    {
      type: "Observation",
      id: "hba1c",
      fields: {
        subject: "patient",
        encounter: "encounter",
        code: {
          coding: [{ system: "http://loinc.org", code: "4548-4", display: "HbA1c" }],
          text: "HbA1c",
        },
        valueQuantity: {
          value: 7.2,
          unit: "%",
          system: "http://unitsofmeasure.org",
          code: "%",
        },
      },
    },
    {
      type: "DiagnosticReport",
      id: "report",
      fields: {
        subject: "patient",
        encounter: "encounter",
        result: ["hba1c"],
      },
    },
  ],
};

describe("createBundleFromRecipe", () => {
  it("is deterministic for the same recipe and seed", () => {
    const [a] = createBundleFromRecipe(BASIC_RECIPE, { seed: 42 });
    const [b] = createBundleFromRecipe(BASIC_RECIPE, { seed: 42 });
    expect(a).toEqual(b);
  });

  it("changes generated defaults when the seed changes", () => {
    const [a] = createBundleFromRecipe(BASIC_RECIPE, { seed: 1 });
    const [b] = createBundleFromRecipe(BASIC_RECIPE, { seed: 2 });
    expect(a).not.toEqual(b);
  });

  it("resolves aliases to FHIR references", () => {
    const [bundle] = createBundleFromRecipe(BASIC_RECIPE, { seed: 42 });
    const patient = byType(bundle as Record<string, unknown>, "Patient");
    const encounter = byType(bundle as Record<string, unknown>, "Encounter");
    const observation = byType(bundle as Record<string, unknown>, "Observation");
    const report = byType(bundle as Record<string, unknown>, "DiagnosticReport");

    expect((encounter["subject"] as Record<string, unknown>)["reference"]).toBe(`Patient/${patient["id"]}`);
    expect((observation["encounter"] as Record<string, unknown>)["reference"]).toBe(`Encounter/${encounter["id"]}`);
    expect((report["result"] as Array<Record<string, unknown>>)[0]?.["reference"]).toBe(`Observation/${observation["id"]}`);
  });

  it("resolves nested reference fields for explicit FHIR backbone shapes", () => {
    const recipe: BundleRecipe = {
      name: "encounter-participant",
      resources: [
        { type: "Patient", id: "patient" },
        { type: "Practitioner", id: "practitioner" },
        {
          type: "Encounter",
          id: "encounter",
          fields: {
            subject: "patient",
            participant: [
              {
                individual: { reference: "practitioner" },
              },
            ],
          },
        },
      ],
    };
    const [bundle] = createBundleFromRecipe(recipe, { seed: 42 });
    const practitioner = byType(bundle as Record<string, unknown>, "Practitioner");
    const encounter = byType(bundle as Record<string, unknown>, "Encounter");
    const participant = (encounter["participant"] as Array<Record<string, unknown>>)[0];
    const individual = participant?.["individual"] as Record<string, unknown>;

    expect(individual["reference"]).toBe(`Practitioner/${practitioner["id"]}`);
  });

  it("deep-merges fields after builder defaults", () => {
    const [bundle] = createBundleFromRecipe(BASIC_RECIPE, { seed: 42 });
    const observation = byType(bundle as Record<string, unknown>, "Observation");
    const code = observation["code"] as Record<string, unknown>;
    const valueQuantity = observation["valueQuantity"] as Record<string, unknown>;

    expect((code["coding"] as Array<Record<string, unknown>>)[0]?.["code"]).toBe("4548-4");
    expect(valueQuantity["value"]).toBe(7.2);
    expect(observation["status"]).toBe("final");
  });

  it("throws for duplicate aliases", () => {
    const recipe: BundleRecipe = {
      name: "duplicate",
      resources: [
        { type: "Patient", id: "patient" },
        { type: "Encounter", id: "patient" },
      ],
    };

    expect(() => createBundleFromRecipe(recipe)).toThrow(BundleRecipeError);
    expect(() => createBundleFromRecipe(recipe)).toThrow("duplicate resource alias");
  });

  it("throws for missing reference aliases", () => {
    const recipe: BundleRecipe = {
      name: "missing-reference",
      resources: [
        {
          type: "Observation",
          id: "obs",
          fields: { subject: "missing-patient" },
        },
      ],
    };

    expect(() => createBundleFromRecipe(recipe)).toThrow(BundleRecipeError);
    expect(() => createBundleFromRecipe(recipe)).toThrow("unknown reference alias");
  });

  it("honors option overrides for locale, fhirVersion, and count", () => {
    const recipe: BundleRecipe = {
      ...BASIC_RECIPE,
      resources: [
        ...BASIC_RECIPE.resources,
        {
          type: "MedicationStatement",
          id: "medication",
          fields: { subject: "patient" },
        },
      ],
    };
    const [first, second] = createBundleFromRecipe(recipe, {
      seed: 42,
      locale: "us",
      fhirVersion: "R5",
      count: 2,
    });

    expect(first?.["resourceType"]).toBe("Bundle");
    expect(second?.["resourceType"]).toBe("Bundle");
    const firstMedicationTypes = resources(first as Record<string, unknown>).map((resource) => resource["resourceType"]);
    expect(firstMedicationTypes).toContain("MedicationUsage");
  });
});
