import type { FhirResource, Locale } from "@/core/types.js";
import { createRng, pickRandom } from "@/core/generators/rng.js";
import { generateUuidV4, deepMerge, generateDate } from "./utils.js";
import { COMMON_ALLERGY_CODES } from "@/core/data/allergy-codes.js";
import type { RandomFn } from "@/core/types.js";

// ---------------------------------------------------------------------------
// AllergyIntolerance resource assembly
// ---------------------------------------------------------------------------

const CRITICALITY_VALUES = ["low", "high", "unable-to-assess"] as const;

function buildAllergyIntolerance(patientRef: string, rng: RandomFn): FhirResource {
  const allergy = pickRandom(COMMON_ALLERGY_CODES, rng);
  const criticality = pickRandom(CRITICALITY_VALUES, rng);

  return {
    resourceType: "AllergyIntolerance",
    id: generateUuidV4(rng),
    clinicalStatus: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
          code: "active",
          display: "Active",
        },
      ],
    },
    verificationStatus: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification",
          code: "confirmed",
          display: "Confirmed",
        },
      ],
    },
    type: allergy.type,
    category: [allergy.category],
    criticality,
    code: {
      coding: [
        {
          system: allergy.system,
          code: allergy.code,
          display: allergy.display,
        },
      ],
    },
    patient: { reference: patientRef },
    recordedDate: generateDate(2015, 2024, rng),
  };
}

// ---------------------------------------------------------------------------
// AllergyIntoleranceBuilder
// ---------------------------------------------------------------------------

export interface AllergyIntoleranceBuilder {
  locale(locale: Locale): AllergyIntoleranceBuilder;
  count(count: number): AllergyIntoleranceBuilder;
  seed(seed: number): AllergyIntoleranceBuilder;
  subject(patientReference: string): AllergyIntoleranceBuilder;
  overrides(overrides: Record<string, unknown>): AllergyIntoleranceBuilder;
  build(): FhirResource[];
}

interface AllergyIntoleranceBuilderState {
  locale: Locale;
  count: number;
  seed: number;
  patientRef: string | undefined;
  overrideMap: Record<string, unknown>;
}

function makeBuilder(state: AllergyIntoleranceBuilderState): AllergyIntoleranceBuilder {
  return {
    locale(loc: Locale): AllergyIntoleranceBuilder {
      return makeBuilder({ ...state, locale: loc });
    },
    count(n: number): AllergyIntoleranceBuilder {
      return makeBuilder({ ...state, count: n });
    },
    seed(s: number): AllergyIntoleranceBuilder {
      return makeBuilder({ ...state, seed: s });
    },
    subject(ref: string): AllergyIntoleranceBuilder {
      return makeBuilder({ ...state, patientRef: ref });
    },
    overrides(o: Record<string, unknown>): AllergyIntoleranceBuilder {
      return makeBuilder({ ...state, overrideMap: o });
    },
    build(): FhirResource[] {
      const rng = createRng(state.seed);
      const results: FhirResource[] = [];
      for (let i = 0; i < state.count; i++) {
        const patientRef = state.patientRef ?? `Patient/${generateUuidV4(rng)}`;
        const allergy = buildAllergyIntolerance(patientRef, rng);
        if (Object.keys(state.overrideMap).length > 0) {
          results.push(
            deepMerge(allergy as Record<string, unknown>, state.overrideMap) as FhirResource,
          );
        } else {
          results.push(allergy);
        }
      }
      return results;
    },
  };
}

/** Create a new AllergyIntoleranceBuilder with default options. */
export function createAllergyIntoleranceBuilder(): AllergyIntoleranceBuilder {
  return makeBuilder({
    locale: "us",
    count: 1,
    seed: 0,
    patientRef: undefined,
    overrideMap: {},
  });
}
