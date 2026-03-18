import type { FhirResource, Locale } from "../types.js";
import { createRng, pickRandom, randomInt } from "../generators/rng.js";
import { generateUuidV4, deepMerge, generateDateTime } from "./utils.js";
import { COMMON_LOINC_CODES } from "../data/loinc-codes.js";
import type { LoincCode } from "../data/loinc-codes.js";
import type { RandomFn } from "../types.js";

// ---------------------------------------------------------------------------
// Value generation
// ---------------------------------------------------------------------------

function generateValue(loinc: LoincCode, rng: RandomFn): number {
  const { min, max, decimals } = { ...loinc.valueRange, decimals: loinc.decimals };
  const scale = Math.pow(10, decimals);
  const raw = randomInt(Math.round(min * scale), Math.round(max * scale), rng);
  return raw / scale;
}

// ---------------------------------------------------------------------------
// Category display names
// ---------------------------------------------------------------------------

const CATEGORY_DISPLAY: Record<"vital-signs" | "laboratory", string> = {
  "vital-signs": "Vital Signs",
  laboratory: "Laboratory",
};

// ---------------------------------------------------------------------------
// Observation resource assembly
// ---------------------------------------------------------------------------

function buildObservation(
  category: "vital-signs" | "laboratory" | undefined,
  subject: string,
  rng: RandomFn,
): FhirResource {
  const codes = category
    ? COMMON_LOINC_CODES.filter((c) => c.category === category)
    : COMMON_LOINC_CODES;
  const loinc = pickRandom(codes, rng);
  const effectiveCategory = loinc.category;
  const value = generateValue(loinc, rng);

  return {
    resourceType: "Observation",
    id: generateUuidV4(rng),
    status: "final",
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/observation-category",
            code: effectiveCategory,
            display: CATEGORY_DISPLAY[effectiveCategory],
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: loinc.code,
          display: loinc.display,
        },
      ],
    },
    subject: { reference: subject },
    effectiveDateTime: generateDateTime(2020, 2025, rng),
    valueQuantity: {
      value,
      unit: loinc.unit,
      system: "http://unitsofmeasure.org",
      code: loinc.unitCode,
    },
  };
}

// ---------------------------------------------------------------------------
// ObservationBuilder
// ---------------------------------------------------------------------------

export interface ObservationBuilder {
  locale(locale: Locale): ObservationBuilder;
  count(count: number): ObservationBuilder;
  seed(seed: number): ObservationBuilder;
  subject(patientReference: string): ObservationBuilder;
  category(category: "vital-signs" | "laboratory"): ObservationBuilder;
  overrides(overrides: Record<string, unknown>): ObservationBuilder;
  build(): FhirResource[];
}

interface ObservationBuilderState {
  locale: Locale;
  count: number;
  seed: number;
  subjectRef: string | undefined;
  categoryFilter: "vital-signs" | "laboratory" | undefined;
  overrideMap: Record<string, unknown>;
}

function makeBuilder(state: ObservationBuilderState): ObservationBuilder {
  return {
    locale(loc: Locale): ObservationBuilder {
      return makeBuilder({ ...state, locale: loc });
    },
    count(n: number): ObservationBuilder {
      return makeBuilder({ ...state, count: n });
    },
    seed(s: number): ObservationBuilder {
      return makeBuilder({ ...state, seed: s });
    },
    subject(ref: string): ObservationBuilder {
      return makeBuilder({ ...state, subjectRef: ref });
    },
    category(cat: "vital-signs" | "laboratory"): ObservationBuilder {
      return makeBuilder({ ...state, categoryFilter: cat });
    },
    overrides(o: Record<string, unknown>): ObservationBuilder {
      return makeBuilder({ ...state, overrideMap: o });
    },
    build(): FhirResource[] {
      const rng = createRng(state.seed);
      const results: FhirResource[] = [];
      for (let i = 0; i < state.count; i++) {
        const subjectRef = state.subjectRef ?? `Patient/${generateUuidV4(rng)}`;
        const obs = buildObservation(state.categoryFilter, subjectRef, rng);
        if (Object.keys(state.overrideMap).length > 0) {
          results.push(deepMerge(obs as Record<string, unknown>, state.overrideMap) as FhirResource);
        } else {
          results.push(obs);
        }
      }
      return results;
    },
  };
}

/** Create a new ObservationBuilder with default options. */
export function createObservationBuilder(): ObservationBuilder {
  return makeBuilder({
    locale: "us",
    count: 1,
    seed: 0,
    subjectRef: undefined,
    categoryFilter: undefined,
    overrideMap: {},
  });
}
