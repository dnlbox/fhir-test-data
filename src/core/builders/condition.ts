import type { FhirResource, FhirVersion, Locale } from "@/core/types.js";
import { createRng, pickRandom } from "@/core/generators/rng.js";
import { generateUuidV4, deepMerge, generateDate } from "./utils.js";
import { COMMON_SNOMED_CONDITIONS } from "@/core/data/snomed-codes.js";
import type { RandomFn } from "@/core/types.js";
import { adaptToVersion } from "./version-adapters.js";

// ---------------------------------------------------------------------------
// Condition resource assembly
// ---------------------------------------------------------------------------

function buildCondition(subject: string, rng: RandomFn): FhirResource {
  const snomed = pickRandom(COMMON_SNOMED_CONDITIONS, rng);

  return {
    resourceType: "Condition",
    id: generateUuidV4(rng),
    clinicalStatus: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
          code: "active",
          display: "Active",
        },
      ],
    },
    verificationStatus: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
          code: "confirmed",
          display: "Confirmed",
        },
      ],
    },
    code: {
      coding: [
        {
          system: "http://snomed.info/sct",
          code: snomed.code,
          display: snomed.display,
        },
      ],
    },
    subject: { reference: subject },
    onsetDateTime: generateDate(2015, 2024, rng),
  };
}

// ---------------------------------------------------------------------------
// ConditionBuilder
// ---------------------------------------------------------------------------

export interface ConditionBuilder {
  locale(locale: Locale): ConditionBuilder;
  count(count: number): ConditionBuilder;
  seed(seed: number): ConditionBuilder;
  subject(patientReference: string): ConditionBuilder;
  fhirVersion(version: FhirVersion): ConditionBuilder;
  overrides(overrides: Record<string, unknown>): ConditionBuilder;
  build(): FhirResource[];
}

interface ConditionBuilderState {
  locale: Locale;
  count: number;
  seed: number;
  fhirVersion: FhirVersion;
  subjectRef: string | undefined;
  overrideMap: Record<string, unknown>;
}

function makeBuilder(state: ConditionBuilderState): ConditionBuilder {
  return {
    locale(loc: Locale): ConditionBuilder {
      return makeBuilder({ ...state, locale: loc });
    },
    count(n: number): ConditionBuilder {
      return makeBuilder({ ...state, count: n });
    },
    seed(s: number): ConditionBuilder {
      return makeBuilder({ ...state, seed: s });
    },
    subject(ref: string): ConditionBuilder {
      return makeBuilder({ ...state, subjectRef: ref });
    },
    fhirVersion(v: FhirVersion): ConditionBuilder {
      return makeBuilder({ ...state, fhirVersion: v });
    },
    overrides(o: Record<string, unknown>): ConditionBuilder {
      return makeBuilder({ ...state, overrideMap: o });
    },
    build(): FhirResource[] {
      const rng = createRng(state.seed);
      const results: FhirResource[] = [];
      for (let i = 0; i < state.count; i++) {
        const subjectRef = state.subjectRef ?? `Patient/${generateUuidV4(rng)}`;
        const condition = adaptToVersion(buildCondition(subjectRef, rng), state.fhirVersion);
        if (Object.keys(state.overrideMap).length > 0) {
          results.push(
            deepMerge(condition as Record<string, unknown>, state.overrideMap) as FhirResource,
          );
        } else {
          results.push(condition);
        }
      }
      return results;
    },
  };
}

/** Create a new ConditionBuilder with default options. */
export function createConditionBuilder(): ConditionBuilder {
  return makeBuilder({
    locale: "us",
    count: 1,
    seed: 0,
    fhirVersion: "R4",
    subjectRef: undefined,
    overrideMap: {},
  });
}
