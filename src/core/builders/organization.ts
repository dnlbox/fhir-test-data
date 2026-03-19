import type { FhirResource, Locale, RandomFn } from "@/core/types.js";
import { createRng, pickRandom, randomInt } from "@/core/generators/rng.js";
import { generateAddress } from "@/core/generators/addresses.js";
import { generateUuidV4, deepMerge } from "./utils.js";
import { getLocale } from "@/locales/index.js";

// ---------------------------------------------------------------------------
// Organization name generation
// ---------------------------------------------------------------------------

const ORG_PREFIXES = ["St.", "Royal", "General", "University", "Community", "Memorial"] as const;
const ORG_SUFFIXES = [
  "Hospital",
  "Medical Center",
  "Health System",
  "Clinic",
  "Healthcare",
] as const;

function generateOrgName(locale: Locale, rng: RandomFn): string {
  const localeDef = getLocale(locale);
  const city = pickRandom(localeDef.address.cities, rng);
  const prefix = pickRandom(ORG_PREFIXES, rng);
  const suffix = pickRandom(ORG_SUFFIXES, rng);
  return `${prefix} ${city.name} ${suffix}`;
}

// ---------------------------------------------------------------------------
// Phone number formats per locale
// ---------------------------------------------------------------------------

type PhoneFormatter = (rng: RandomFn) => string;

const WORK_PHONE_FORMATTERS: Record<Locale, PhoneFormatter> = {
  us:  (rng) => `(${randomInt(200, 999, rng)}) ${randomInt(200, 999, rng)}-${randomInt(1000, 9999, rng)}`,
  ca:  (rng) => `(${randomInt(200, 999, rng)}) ${randomInt(200, 999, rng)}-${randomInt(1000, 9999, rng)}`,
  uk:  (rng) => `0${randomInt(100, 999, rng)} ${randomInt(1000, 9999, rng)} ${randomInt(1000, 9999, rng)}`,
  au:  (rng) => `0${randomInt(2, 9, rng)} ${randomInt(1000, 9999, rng)} ${randomInt(1000, 9999, rng)}`,
  de:  (rng) => `0${randomInt(30, 999, rng)} ${randomInt(10000000, 99999999, rng)}`,
  fr:  (rng) => `0${randomInt(1, 9, rng)} ${randomInt(10, 99, rng)} ${randomInt(10, 99, rng)} ${randomInt(10, 99, rng)} ${randomInt(10, 99, rng)}`,
  nl:  (rng) => `0${randomInt(10, 99, rng)} ${randomInt(1000000, 9999999, rng)}`,
  in:  (rng) => `0${randomInt(11, 99, rng)}-${randomInt(10000000, 99999999, rng)}`,
};

// ---------------------------------------------------------------------------
// Organization resource assembly
// ---------------------------------------------------------------------------

function buildOrganization(locale: Locale, rng: RandomFn): FhirResource {
  const localeDef = getLocale(locale);
  const generatedAddress = generateAddress(localeDef.address, rng);

  const identifiers: Array<{ system: string; value: string }> = [];
  if (localeDef.organizationIdentifiers.length > 0) {
    const def = pickRandom(localeDef.organizationIdentifiers, rng);
    identifiers.push({ system: def.system, value: def.generate(rng) });
  }

  const addressEntry: Record<string, unknown> = {
    use: "work",
    line: generatedAddress.line,
    city: generatedAddress.city,
    postalCode: generatedAddress.postalCode,
    country: generatedAddress.country,
    ...(generatedAddress.state !== undefined && { state: generatedAddress.state }),
    ...(generatedAddress.district !== undefined && { district: generatedAddress.district }),
  };

  return {
    resourceType: "Organization",
    id: generateUuidV4(rng),
    identifier: identifiers,
    active: true,
    type: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/organization-type",
            code: "prov",
            display: "Healthcare Provider",
          },
        ],
      },
    ],
    name: generateOrgName(locale, rng),
    telecom: [{ system: "phone", value: WORK_PHONE_FORMATTERS[locale](rng), use: "work" }],
    address: [addressEntry],
  };
}

// ---------------------------------------------------------------------------
// OrganizationBuilder
// ---------------------------------------------------------------------------

export interface OrganizationBuilder {
  locale(locale: Locale): OrganizationBuilder;
  count(count: number): OrganizationBuilder;
  seed(seed: number): OrganizationBuilder;
  overrides(overrides: Record<string, unknown>): OrganizationBuilder;
  build(): FhirResource[];
}

interface OrganizationBuilderState {
  locale: Locale;
  count: number;
  seed: number;
  overrideMap: Record<string, unknown>;
}

function makeBuilder(state: OrganizationBuilderState): OrganizationBuilder {
  return {
    locale(loc: Locale):  OrganizationBuilder { return makeBuilder({ ...state, locale: loc }); },
    count(n: number):     OrganizationBuilder { return makeBuilder({ ...state, count: n }); },
    seed(s: number):      OrganizationBuilder { return makeBuilder({ ...state, seed: s }); },
    overrides(o: Record<string, unknown>): OrganizationBuilder {
      return makeBuilder({ ...state, overrideMap: o });
    },
    build(): FhirResource[] {
      const rng = createRng(state.seed);
      const hasOverrides = Object.keys(state.overrideMap).length > 0;
      return Array.from({ length: state.count }, () => {
        const org = buildOrganization(state.locale, rng);
        return hasOverrides
          ? deepMerge(org as Record<string, unknown>, state.overrideMap) as FhirResource
          : org;
      });
    },
  };
}

/** Create a new OrganizationBuilder with default options. */
export function createOrganizationBuilder(): OrganizationBuilder {
  return makeBuilder({ locale: "us", count: 1, seed: 0, overrideMap: {} });
}
