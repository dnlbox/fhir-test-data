import type { FhirResource, FhirVersion, Locale } from "@/core/types.js";
import { createRng, pickRandom } from "@/core/generators/rng.js";
import { generateUuidV4, deepMerge, generateDateTime } from "./utils.js";
import {
  ENCOUNTER_CLASS_CODES,
  ENCOUNTER_TYPE_CODES,
  ENCOUNTER_STATUS_R4,
  ENCOUNTER_STATUS_R5,
} from "@/core/data/encounter-codes.js";
import type { RandomFn } from "@/core/types.js";
import { adaptToVersion } from "./version-adapters.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACT_CODE_SYSTEM = "http://terminology.hl7.org/CodeSystem/v3-ActCode";
const SNOMED_SYSTEM   = "http://snomed.info/sct";

// Statuses that describe a completed or ended encounter.
const CLOSED_STATUSES_R4 = new Set(["finished", "cancelled", "entered-in-error"]);
const CLOSED_STATUSES_R5 = new Set(["discharged", "completed", "cancelled", "discontinued", "entered-in-error"]);

// ---------------------------------------------------------------------------
// Encounter resource assembly
// ---------------------------------------------------------------------------

function buildEncounter(version: FhirVersion, rng: RandomFn): FhirResource {
  const isR5     = version === "R5";
  const statuses = isR5 ? ENCOUNTER_STATUS_R5 : ENCOUNTER_STATUS_R4;
  const status   = pickRandom([...statuses], rng);

  const classEntry = pickRandom(ENCOUNTER_CLASS_CODES, rng);
  const typeEntry  = pickRandom(ENCOUNTER_TYPE_CODES, rng);

  // R4/R4B: class is a Coding. R5: class is an array of CodeableConcept.
  const classField = isR5
    ? [{ coding: [{ system: ACT_CODE_SYSTEM, code: classEntry.code, display: classEntry.display }] }]
    : { system: ACT_CODE_SYSTEM, code: classEntry.code, display: classEntry.display };

  const resource: Record<string, unknown> = {
    resourceType: "Encounter",
    id: generateUuidV4(rng),
    status,
    class: classField,
    type: [
      {
        coding: [{ system: SNOMED_SYSTEM, code: typeEntry.code, display: typeEntry.display }],
        text: typeEntry.display,
      },
    ],
  };

  // Add a period when the encounter has started.
  const closedSet = isR5 ? CLOSED_STATUSES_R5 : CLOSED_STATUSES_R4;
  if (status !== "planned") {
    const startDt = generateDateTime(2020, 2025, rng);
    if (closedSet.has(status)) {
      const endDt = generateDateTime(2020, 2025, rng);
      resource["period"] = { start: startDt, end: endDt };
    } else {
      resource["period"] = { start: startDt };
    }
  }

  return resource as FhirResource;
}

// ---------------------------------------------------------------------------
// EncounterBuilder
// ---------------------------------------------------------------------------

export interface EncounterBuilder {
  locale(locale: Locale): EncounterBuilder;
  count(count: number): EncounterBuilder;
  seed(seed: number): EncounterBuilder;
  subject(patientReference: string): EncounterBuilder;
  fhirVersion(version: FhirVersion): EncounterBuilder;
  overrides(overrides: Record<string, unknown>): EncounterBuilder;
  build(): FhirResource[];
}

interface EncounterBuilderState {
  locale: Locale;
  count: number;
  seed: number;
  fhirVersion: FhirVersion;
  subjectRef: string | undefined;
  overrideMap: Record<string, unknown>;
}

function makeBuilder(state: EncounterBuilderState): EncounterBuilder {
  return {
    locale(loc: Locale): EncounterBuilder {
      return makeBuilder({ ...state, locale: loc });
    },
    count(n: number): EncounterBuilder {
      return makeBuilder({ ...state, count: n });
    },
    seed(s: number): EncounterBuilder {
      return makeBuilder({ ...state, seed: s });
    },
    subject(ref: string): EncounterBuilder {
      return makeBuilder({ ...state, subjectRef: ref });
    },
    fhirVersion(v: FhirVersion): EncounterBuilder {
      return makeBuilder({ ...state, fhirVersion: v });
    },
    overrides(o: Record<string, unknown>): EncounterBuilder {
      return makeBuilder({ ...state, overrideMap: o });
    },
    build(): FhirResource[] {
      const rng = createRng(state.seed);
      const results: FhirResource[] = [];
      for (let i = 0; i < state.count; i++) {
        const encounter = buildEncounter(state.fhirVersion, rng);
        const withSubject: Record<string, unknown> = {
          ...(encounter as Record<string, unknown>),
          ...(state.subjectRef !== undefined
            ? { subject: { reference: state.subjectRef } }
            : {}),
        };
        const adapted = adaptToVersion(withSubject as FhirResource, state.fhirVersion);
        if (Object.keys(state.overrideMap).length > 0) {
          results.push(deepMerge(adapted as Record<string, unknown>, state.overrideMap) as FhirResource);
        } else {
          results.push(adapted);
        }
      }
      return results;
    },
  };
}

/** Create a new EncounterBuilder with default options. */
export function createEncounterBuilder(): EncounterBuilder {
  return makeBuilder({
    locale: "us",
    count: 1,
    seed: 0,
    fhirVersion: "R4",
    subjectRef: undefined,
    overrideMap: {},
  });
}
