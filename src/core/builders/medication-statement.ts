import type { FhirResource, Locale } from "../types.js";
import { createRng, pickRandom } from "../generators/rng.js";
import { generateUuidV4, deepMerge, generateDate } from "./utils.js";
import { COMMON_MEDICATION_CODES } from "../data/medication-codes.js";
import type { RandomFn } from "../types.js";

// ---------------------------------------------------------------------------
// MedicationStatement resource assembly
// ---------------------------------------------------------------------------

function buildMedicationStatement(subject: string, rng: RandomFn): FhirResource {
  const med = pickRandom(COMMON_MEDICATION_CODES, rng);
  const startDate = generateDate(2018, 2024, rng);

  return {
    resourceType: "MedicationStatement",
    id: generateUuidV4(rng),
    status: "active",
    medicationCodeableConcept: {
      coding: [
        {
          system: med.system,
          code: med.code,
          display: med.display,
        },
      ],
    },
    subject: { reference: subject },
    effectivePeriod: {
      start: startDate,
    },
    dosage: [
      {
        text: `${med.typicalDoseMg} mg ${med.frequency}`,
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// MedicationStatementBuilder
// ---------------------------------------------------------------------------

export interface MedicationStatementBuilder {
  locale(locale: Locale): MedicationStatementBuilder;
  count(count: number): MedicationStatementBuilder;
  seed(seed: number): MedicationStatementBuilder;
  subject(patientReference: string): MedicationStatementBuilder;
  overrides(overrides: Record<string, unknown>): MedicationStatementBuilder;
  build(): FhirResource[];
}

interface MedicationStatementBuilderState {
  locale: Locale;
  count: number;
  seed: number;
  subjectRef: string | undefined;
  overrideMap: Record<string, unknown>;
}

function makeBuilder(state: MedicationStatementBuilderState): MedicationStatementBuilder {
  return {
    locale(loc: Locale): MedicationStatementBuilder {
      return makeBuilder({ ...state, locale: loc });
    },
    count(n: number): MedicationStatementBuilder {
      return makeBuilder({ ...state, count: n });
    },
    seed(s: number): MedicationStatementBuilder {
      return makeBuilder({ ...state, seed: s });
    },
    subject(ref: string): MedicationStatementBuilder {
      return makeBuilder({ ...state, subjectRef: ref });
    },
    overrides(o: Record<string, unknown>): MedicationStatementBuilder {
      return makeBuilder({ ...state, overrideMap: o });
    },
    build(): FhirResource[] {
      const rng = createRng(state.seed);
      const results: FhirResource[] = [];
      for (let i = 0; i < state.count; i++) {
        const subjectRef = state.subjectRef ?? `Patient/${generateUuidV4(rng)}`;
        const medStatement = buildMedicationStatement(subjectRef, rng);
        if (Object.keys(state.overrideMap).length > 0) {
          results.push(
            deepMerge(
              medStatement as Record<string, unknown>,
              state.overrideMap,
            ) as FhirResource,
          );
        } else {
          results.push(medStatement);
        }
      }
      return results;
    },
  };
}

/** Create a new MedicationStatementBuilder with default options. */
export function createMedicationStatementBuilder(): MedicationStatementBuilder {
  return makeBuilder({
    locale: "us",
    count: 1,
    seed: 0,
    subjectRef: undefined,
    overrideMap: {},
  });
}
