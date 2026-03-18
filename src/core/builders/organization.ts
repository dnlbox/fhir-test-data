import type { FhirResource, Locale, RandomFn } from "../types.js";
import { createRng, pickRandom, randomInt } from "../generators/rng.js";
import { generateAddress } from "../generators/addresses.js";
import { getLocale } from "../../locales/index.js";

// ---------------------------------------------------------------------------
// UUID v4 from seeded PRNG
// ---------------------------------------------------------------------------

function generateUuidV4(rng: RandomFn): string {
  const hex = (bits: number): string =>
    Math.floor(rng() * (1 << bits))
      .toString(16)
      .padStart(bits / 4, "0");

  const p1 = hex(32);
  const p2 = hex(16);
  const p3 = "4" + hex(12);
  const variant = (8 + Math.floor(rng() * 4)).toString(16);
  const p4 = variant + hex(12);
  const p5 = hex(32) + hex(16);
  return `${p1}-${p2}-${p3}-${p4}-${p5}`;
}

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
// Phone number (work phone, simple format)
// ---------------------------------------------------------------------------

function generateWorkPhone(locale: Locale, rng: RandomFn): string {
  switch (locale) {
    case "us":
    case "ca":
      return `(${randomInt(200, 999, rng)}) ${randomInt(200, 999, rng)}-${randomInt(1000, 9999, rng)}`;
    case "uk":
      return `0${randomInt(100, 999, rng)} ${randomInt(1000, 9999, rng)} ${randomInt(1000, 9999, rng)}`;
    case "au":
      return `0${randomInt(2, 9, rng)} ${randomInt(1000, 9999, rng)} ${randomInt(1000, 9999, rng)}`;
    case "de":
      return `0${randomInt(30, 999, rng)} ${randomInt(10000000, 99999999, rng)}`;
    case "fr":
      return `0${randomInt(1, 9, rng)} ${randomInt(10, 99, rng)} ${randomInt(10, 99, rng)} ${randomInt(10, 99, rng)} ${randomInt(10, 99, rng)}`;
    case "nl":
      return `0${randomInt(10, 99, rng)} ${randomInt(1000000, 9999999, rng)}`;
    case "in":
      return `0${randomInt(11, 99, rng)}-${randomInt(10000000, 99999999, rng)}`;
  }
}

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
  };
  if (generatedAddress.state !== undefined) {
    addressEntry["state"] = generatedAddress.state;
  }
  if (generatedAddress.district !== undefined) {
    addressEntry["district"] = generatedAddress.district;
  }

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
    telecom: [
      {
        system: "phone",
        value: generateWorkPhone(locale, rng),
        use: "work",
      },
    ],
    address: [addressEntry],
  };
}

// ---------------------------------------------------------------------------
// Deep merge
// ---------------------------------------------------------------------------

function deepMerge(
  base: Record<string, unknown>,
  overrides: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };
  for (const key of Object.keys(overrides)) {
    const overrideVal = overrides[key];
    const baseVal = base[key];
    if (
      overrideVal !== null &&
      typeof overrideVal === "object" &&
      !Array.isArray(overrideVal) &&
      baseVal !== null &&
      typeof baseVal === "object" &&
      !Array.isArray(baseVal)
    ) {
      result[key] = deepMerge(
        baseVal as Record<string, unknown>,
        overrideVal as Record<string, unknown>,
      );
    } else {
      result[key] = overrideVal;
    }
  }
  return result;
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
    locale(loc: Locale): OrganizationBuilder {
      return makeBuilder({ ...state, locale: loc });
    },
    count(n: number): OrganizationBuilder {
      return makeBuilder({ ...state, count: n });
    },
    seed(s: number): OrganizationBuilder {
      return makeBuilder({ ...state, seed: s });
    },
    overrides(o: Record<string, unknown>): OrganizationBuilder {
      return makeBuilder({ ...state, overrideMap: o });
    },
    build(): FhirResource[] {
      const rng = createRng(state.seed);
      const results: FhirResource[] = [];
      for (let i = 0; i < state.count; i++) {
        const org = buildOrganization(state.locale, rng);
        if (Object.keys(state.overrideMap).length > 0) {
          results.push(
            deepMerge(org as Record<string, unknown>, state.overrideMap) as FhirResource,
          );
        } else {
          results.push(org);
        }
      }
      return results;
    },
  };
}

/** Create a new OrganizationBuilder with default options. */
export function createOrganizationBuilder(): OrganizationBuilder {
  return makeBuilder({
    locale: "us",
    count: 1,
    seed: 0,
    overrideMap: {},
  });
}
