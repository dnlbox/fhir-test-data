import type { FhirResource, FhirVersion, Locale, RandomFn } from "@/core/types.js";
import { createRng, pickRandom } from "@/core/generators/rng.js";
import { generateUuidV4, deepMerge } from "./utils.js";
import { createPractitionerBuilder } from "./practitioner.js";
import { adaptToVersion } from "./version-adapters.js";

// ---------------------------------------------------------------------------
// Role codes
// ---------------------------------------------------------------------------

const ROLE_CODES = [
  { code: "doctor", display: "Doctor", system: "http://terminology.hl7.org/CodeSystem/practitioner-role" },
  { code: "nurse", display: "Nurse", system: "http://terminology.hl7.org/CodeSystem/practitioner-role" },
  { code: "pharmacist", display: "Pharmacist", system: "http://terminology.hl7.org/CodeSystem/practitioner-role" },
  { code: "researcher", display: "Researcher", system: "http://terminology.hl7.org/CodeSystem/practitioner-role" },
] as const;

const SPECIALTY_CODES = [
  { code: "394814009", display: "General practice", system: "http://snomed.info/sct" },
  { code: "394579002", display: "Cardiology", system: "http://snomed.info/sct" },
  { code: "394580004", display: "Clinical genetics", system: "http://snomed.info/sct" },
  { code: "394609007", display: "General surgery", system: "http://snomed.info/sct" },
  { code: "394591006", display: "Neurology", system: "http://snomed.info/sct" },
  { code: "394576009", display: "Accident and Emergency", system: "http://snomed.info/sct" },
] as const;

// ---------------------------------------------------------------------------
// PractitionerRole resource assembly
// ---------------------------------------------------------------------------

function buildPractitionerRole(locale: Locale, fhirVersion: FhirVersion, rng: RandomFn): FhirResource {
  // Generate an internal Practitioner to reference
  const practSeed = Math.floor(rng() * 0x7fffffff);
  const [practitioner] = createPractitionerBuilder()
    .locale(locale)
    .seed(practSeed)
    .fhirVersion(fhirVersion)
    .build();

  if (!practitioner) throw new Error("PractitionerRole: failed to generate Practitioner");

  const practitionerId = practitioner["id"] as string;
  const role = pickRandom(ROLE_CODES, rng);
  const specialty = pickRandom(SPECIALTY_CODES, rng);

  const resource: FhirResource = {
    resourceType: "PractitionerRole",
    id: generateUuidV4(rng),
    active: true,
    practitioner: { reference: `Practitioner/${practitionerId}` },
    code: [
      {
        coding: [{ system: role.system, code: role.code, display: role.display }],
      },
    ],
    specialty: [
      {
        coding: [{ system: specialty.system, code: specialty.code, display: specialty.display }],
      },
    ],
  };

  return adaptToVersion(resource, fhirVersion);
}

// ---------------------------------------------------------------------------
// PractitionerRoleBuilder
// ---------------------------------------------------------------------------

export interface PractitionerRoleBuilder {
  locale(locale: Locale): PractitionerRoleBuilder;
  count(count: number): PractitionerRoleBuilder;
  seed(seed: number): PractitionerRoleBuilder;
  fhirVersion(version: FhirVersion): PractitionerRoleBuilder;
  overrides(overrides: Record<string, unknown>): PractitionerRoleBuilder;
  build(): FhirResource[];
}

interface PractitionerRoleBuilderState {
  locale: Locale;
  count: number;
  seed: number;
  fhirVersion: FhirVersion;
  overrideMap: Record<string, unknown>;
}

function makeBuilder(state: PractitionerRoleBuilderState): PractitionerRoleBuilder {
  return {
    locale(loc: Locale): PractitionerRoleBuilder { return makeBuilder({ ...state, locale: loc }); },
    count(n: number): PractitionerRoleBuilder { return makeBuilder({ ...state, count: n }); },
    seed(s: number): PractitionerRoleBuilder { return makeBuilder({ ...state, seed: s }); },
    fhirVersion(v: FhirVersion): PractitionerRoleBuilder { return makeBuilder({ ...state, fhirVersion: v }); },
    overrides(o: Record<string, unknown>): PractitionerRoleBuilder {
      return makeBuilder({ ...state, overrideMap: o });
    },
    build(): FhirResource[] {
      const rng = createRng(state.seed);
      const hasOverrides = Object.keys(state.overrideMap).length > 0;
      return Array.from({ length: state.count }, () => {
        const role = buildPractitionerRole(state.locale, state.fhirVersion, rng);
        return hasOverrides
          ? deepMerge(role as Record<string, unknown>, state.overrideMap) as FhirResource
          : role;
      });
    },
  };
}

/** Create a new PractitionerRoleBuilder with default options. */
export function createPractitionerRoleBuilder(): PractitionerRoleBuilder {
  return makeBuilder({ locale: "us", count: 1, seed: 0, fhirVersion: "R4", overrideMap: {} });
}
