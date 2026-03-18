import type { FhirResource, Locale } from "../types.js";
import { createRng, randomInt } from "../generators/rng.js";
import { generateUuidV4 } from "./utils.js";
import { createPatientBuilder } from "./patient.js";
import { createPractitionerBuilder } from "./practitioner.js";
import { createOrganizationBuilder } from "./organization.js";
import { createObservationBuilder } from "./observation.js";
import { createConditionBuilder } from "./condition.js";
import { createAllergyIntoleranceBuilder } from "./allergy-intolerance.js";
import { createMedicationStatementBuilder } from "./medication-statement.js";
import type { RandomFn } from "../types.js";

// ---------------------------------------------------------------------------
// Bundle types
// ---------------------------------------------------------------------------

export type BundleType = "transaction" | "document" | "collection" | "searchset";

// ---------------------------------------------------------------------------
// Entry helpers
// ---------------------------------------------------------------------------

function makeEntry(
  resource: FhirResource,
  bundleType: BundleType,
): Record<string, unknown> {
  const id = resource["id"] as string;
  const resourceType = resource["resourceType"] as string;
  const fullUrl = `urn:uuid:${id}`;
  const entry: Record<string, unknown> = { fullUrl, resource };

  if (bundleType === "transaction") {
    entry["request"] = { method: "POST", url: resourceType };
  } else if (bundleType === "searchset") {
    entry["search"] = { mode: "match" };
  }
  // collection: no extra fields; document: treated as collection in v1

  return entry;
}

// ---------------------------------------------------------------------------
// Derive a numeric seed from the PRNG
// ---------------------------------------------------------------------------

function nextSeed(rng: RandomFn): number {
  return Math.floor(rng() * 0x7fffffff);
}

// ---------------------------------------------------------------------------
// Clinical resource generation
// ---------------------------------------------------------------------------

type ClinicalCategory = "vital-signs" | "laboratory";

const CATEGORIES: ClinicalCategory[] = ["vital-signs", "laboratory"];

function buildClinicalResources(
  count: number | undefined,
  patientRef: string,
  practRef: string,
  rng: RandomFn,
): FhirResource[] {
  const resources: FhirResource[] = [];

  if (count !== undefined) {
    // Generate exactly `count` resources, cycling through types
    const types = ["observation", "observation", "condition", "allergy", "medication"] as const;
    for (let i = 0; i < count; i++) {
      const type = types[i % types.length];
      const seed = nextSeed(rng);
      if (type === "observation") {
        const cat = CATEGORIES[i % CATEGORIES.length];
        const [obs] = createObservationBuilder()
          .subject(patientRef)
          .category(cat ?? "vital-signs")
          .seed(seed)
          .build();
        if (obs) {
          resources.push({ ...obs, performer: [{ reference: practRef }] });
        }
      } else if (type === "condition") {
        const [cond] = createConditionBuilder().subject(patientRef).seed(seed).build();
        if (cond) resources.push(cond);
      } else if (type === "allergy") {
        const [ai] = createAllergyIntoleranceBuilder().subject(patientRef).seed(seed).build();
        if (ai) resources.push(ai);
      } else {
        const [ms] = createMedicationStatementBuilder().subject(patientRef).seed(seed).build();
        if (ms) resources.push(ms);
      }
    }
    return resources;
  }

  // Default: 1-2 observations + random others
  const numObs = randomInt(1, 2, rng);
  for (let i = 0; i < numObs; i++) {
    const cat = CATEGORIES[i % CATEGORIES.length] ?? "vital-signs";
    const [obs] = createObservationBuilder()
      .subject(patientRef)
      .category(cat)
      .seed(nextSeed(rng))
      .build();
    if (obs) {
      resources.push({ ...obs, performer: [{ reference: practRef }] });
    }
  }

  if (rng() < 0.7) {
    const [cond] = createConditionBuilder().subject(patientRef).seed(nextSeed(rng)).build();
    if (cond) resources.push(cond);
  }
  if (rng() < 0.5) {
    const [ai] = createAllergyIntoleranceBuilder().subject(patientRef).seed(nextSeed(rng)).build();
    if (ai) resources.push(ai);
  }
  if (rng() < 0.6) {
    const [ms] = createMedicationStatementBuilder().subject(patientRef).seed(nextSeed(rng)).build();
    if (ms) resources.push(ms);
  }

  return resources;
}

// ---------------------------------------------------------------------------
// Single bundle assembly
// ---------------------------------------------------------------------------

function buildSingleBundle(
  locale: Locale,
  bundleType: BundleType,
  clinicalCount: number | undefined,
  overrideMap: Record<string, unknown>,
  rng: RandomFn,
): FhirResource {
  // Generate sub-seeds from the shared RNG
  const bundleIdSeed = nextSeed(rng);
  const patientSeed = nextSeed(rng);
  const orgSeed = nextSeed(rng);
  const practSeed = nextSeed(rng);
  const clinicalRng = createRng(nextSeed(rng));

  // Build component resources
  const [patient] = createPatientBuilder().locale(locale).seed(patientSeed).build();
  const [org] = createOrganizationBuilder().locale(locale).seed(orgSeed).build();
  const [pract] = createPractitionerBuilder().locale(locale).seed(practSeed).build();

  if (!patient || !org || !pract) {
    throw new Error("Bundle: failed to generate component resources");
  }

  const patientId = patient["id"] as string;
  const orgId = org["id"] as string;
  const practId = pract["id"] as string;

  const patientRef = `urn:uuid:${patientId}`;
  const orgRef = `urn:uuid:${orgId}`;
  const practRef = `urn:uuid:${practId}`;

  // Wire patient → organization
  const wiredPatient: FhirResource = {
    ...patient,
    managingOrganization: { reference: orgRef },
  };

  // Generate clinical resources
  const clinicalResources = buildClinicalResources(clinicalCount, patientRef, practRef, clinicalRng);

  // Build bundle entries
  const allResources: FhirResource[] = [wiredPatient, org, pract, ...clinicalResources];
  const entries = allResources.map((r) => makeEntry(r, bundleType));

  const bundleIdRng = createRng(bundleIdSeed);
  const bundle: FhirResource = {
    resourceType: "Bundle",
    id: generateUuidV4(bundleIdRng),
    type: bundleType,
    entry: entries,
  };

  if (Object.keys(overrideMap).length > 0) {
    return { ...bundle, ...overrideMap };
  }
  return bundle;
}

// ---------------------------------------------------------------------------
// BundleBuilder
// ---------------------------------------------------------------------------

export interface BundleBuilder {
  locale(locale: Locale): BundleBuilder;
  count(count: number): BundleBuilder;
  seed(seed: number): BundleBuilder;
  type(bundleType: BundleType): BundleBuilder;
  clinicalResourcesPerPatient(count: number): BundleBuilder;
  overrides(overrides: Record<string, unknown>): BundleBuilder;
  build(): FhirResource[];
}

interface BundleBuilderState {
  locale: Locale;
  count: number;
  seed: number;
  bundleType: BundleType;
  clinicalCount: number | undefined;
  overrideMap: Record<string, unknown>;
}

function makeBuilder(state: BundleBuilderState): BundleBuilder {
  return {
    locale(loc: Locale): BundleBuilder {
      return makeBuilder({ ...state, locale: loc });
    },
    count(n: number): BundleBuilder {
      return makeBuilder({ ...state, count: n });
    },
    seed(s: number): BundleBuilder {
      return makeBuilder({ ...state, seed: s });
    },
    type(t: BundleType): BundleBuilder {
      return makeBuilder({ ...state, bundleType: t });
    },
    clinicalResourcesPerPatient(n: number): BundleBuilder {
      return makeBuilder({ ...state, clinicalCount: n });
    },
    overrides(o: Record<string, unknown>): BundleBuilder {
      return makeBuilder({ ...state, overrideMap: o });
    },
    build(): FhirResource[] {
      const masterRng = createRng(state.seed);
      const results: FhirResource[] = [];
      for (let i = 0; i < state.count; i++) {
        // Use a separate per-bundle seed derived from master RNG
        const bundleSeedRng = createRng(nextSeed(masterRng));
        results.push(
          buildSingleBundle(
            state.locale,
            state.bundleType,
            state.clinicalCount,
            state.overrideMap,
            bundleSeedRng,
          ),
        );
      }
      return results;
    },
  };
}

/** Create a new BundleBuilder with default options. */
export function createBundleBuilder(): BundleBuilder {
  return makeBuilder({
    locale: "us",
    count: 1,
    seed: 0,
    bundleType: "transaction",
    clinicalCount: undefined,
    overrideMap: {},
  });
}
