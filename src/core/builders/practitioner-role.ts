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

interface PractitionerRoleOptions {
  /** ID of an already-built Practitioner in the same session. When omitted a
   *  synthetic Practitioner is generated internally (standalone usage). */
  practitionerId?: string;
  /** ID of an already-built Organization in the same session. When omitted the
   *  organization reference is left unset. */
  organizationId?: string;
}

function buildPractitionerRole(
  locale: Locale,
  fhirVersion: FhirVersion,
  rng: RandomFn,
  options: PractitionerRoleOptions = {},
): FhirResource {
  // Use the injected Practitioner ID when available; otherwise generate one
  // so the standalone `generate practitioner-role` command still works.
  let practitionerId = options.practitionerId;
  if (practitionerId === undefined) {
    const practSeed = Math.floor(rng() * 0x7fffffff);
    const [practitioner] = createPractitionerBuilder()
      .locale(locale)
      .seed(practSeed)
      .fhirVersion(fhirVersion)
      .build();
    if (!practitioner) throw new Error("PractitionerRole: failed to generate Practitioner");
    practitionerId = practitioner["id"] as string;
  }

  const role = pickRandom(ROLE_CODES, rng);
  const specialty = pickRandom(SPECIALTY_CODES, rng);

  const resource: FhirResource = {
    resourceType: "PractitionerRole",
    id: generateUuidV4(rng),
    active: true,
    practitioner: { reference: `Practitioner/${practitionerId}` },
    ...(options.organizationId !== undefined && {
      organization: { reference: `Organization/${options.organizationId}` },
    }),
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
  /** Inject the ID of an already-built Practitioner so the reference is consistent. */
  practitionerId(id: string): PractitionerRoleBuilder;
  /** Inject the ID of an already-built Organization so the reference is consistent. */
  organizationId(id: string): PractitionerRoleBuilder;
  overrides(overrides: Record<string, unknown>): PractitionerRoleBuilder;
  build(): FhirResource[];
}

interface PractitionerRoleBuilderState {
  locale: Locale;
  count: number;
  seed: number;
  fhirVersion: FhirVersion;
  injectedPractitionerId: string | undefined;
  injectedOrganizationId: string | undefined;
  overrideMap: Record<string, unknown>;
}

function makeBuilder(state: PractitionerRoleBuilderState): PractitionerRoleBuilder {
  return {
    locale(loc: Locale): PractitionerRoleBuilder { return makeBuilder({ ...state, locale: loc }); },
    count(n: number): PractitionerRoleBuilder { return makeBuilder({ ...state, count: n }); },
    seed(s: number): PractitionerRoleBuilder { return makeBuilder({ ...state, seed: s }); },
    fhirVersion(v: FhirVersion): PractitionerRoleBuilder { return makeBuilder({ ...state, fhirVersion: v }); },
    practitionerId(id: string): PractitionerRoleBuilder {
      return makeBuilder({ ...state, injectedPractitionerId: id });
    },
    organizationId(id: string): PractitionerRoleBuilder {
      return makeBuilder({ ...state, injectedOrganizationId: id });
    },
    overrides(o: Record<string, unknown>): PractitionerRoleBuilder {
      return makeBuilder({ ...state, overrideMap: o });
    },
    build(): FhirResource[] {
      const rng = createRng(state.seed);
      const hasOverrides = Object.keys(state.overrideMap).length > 0;
      const options: PractitionerRoleOptions = {
        ...(state.injectedPractitionerId !== undefined && { practitionerId: state.injectedPractitionerId }),
        ...(state.injectedOrganizationId !== undefined && { organizationId: state.injectedOrganizationId }),
      };
      return Array.from({ length: state.count }, () => {
        const role = buildPractitionerRole(state.locale, state.fhirVersion, rng, options);
        return hasOverrides
          ? deepMerge(role as Record<string, unknown>, state.overrideMap) as FhirResource
          : role;
      });
    },
  };
}

/** Create a new PractitionerRoleBuilder with default options. */
export function createPractitionerRoleBuilder(): PractitionerRoleBuilder {
  return makeBuilder({
    locale: "us",
    count: 1,
    seed: 0,
    fhirVersion: "R4",
    injectedPractitionerId: undefined,
    injectedOrganizationId: undefined,
    overrideMap: {},
  });
}
