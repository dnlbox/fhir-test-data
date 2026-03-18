import type { FhirResource, Locale, RandomFn } from "../types.js";
import { createRng, pickRandom, randomInt } from "../generators/rng.js";
import { generateAddress } from "../generators/addresses.js";
import { generateName } from "../generators/names.js";
import { getLocale } from "../../locales/index.js";

// ---------------------------------------------------------------------------
// UUID v4 from seeded PRNG
// ---------------------------------------------------------------------------

function generateUuidV4(rng: RandomFn): string {
  const hex = (bits: number): string =>
    Math.floor(rng() * (1 << bits))
      .toString(16)
      .padStart(bits / 4, "0");

  // xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  const p1 = hex(32);
  const p2 = hex(16);
  const p3 = "4" + hex(12);
  // variant bits: 10xx → 8, 9, a, b
  const variant = (8 + Math.floor(rng() * 4)).toString(16);
  const p4 = variant + hex(12);
  const p5 = hex(32) + hex(16);
  return `${p1}-${p2}-${p3}-${p4}-${p5}`;
}

// ---------------------------------------------------------------------------
// Birth date
// ---------------------------------------------------------------------------

function generateBirthDate(rng: RandomFn): string {
  const year = randomInt(1940, 2010, rng);
  const month = randomInt(1, 12, rng);
  const daysInMonth = new Date(year, month, 0).getDate();
  const day = randomInt(1, daysInMonth, rng);
  return `${year.toString()}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Gender
// ---------------------------------------------------------------------------

type FhirGender = "male" | "female" | "other" | "unknown";

function generateGender(rng: RandomFn): FhirGender {
  const roll = rng();
  if (roll < 0.48) return "male";
  if (roll < 0.96) return "female";
  if (roll < 0.99) return "other";
  return "unknown";
}

// ---------------------------------------------------------------------------
// Phone number formats per locale
// ---------------------------------------------------------------------------

const PHONE_AREA_CODES: Record<Locale, () => string> = {
  us: () => "555",
  uk: () => "07700",
  au: () => "0400",
  ca: () => "555",
  de: () => "030",
  fr: () => "06",
  nl: () => "06",
  in: () => "09",
};

function generatePhone(locale: Locale, rng: RandomFn): string {
  const area = PHONE_AREA_CODES[locale]();
  switch (locale) {
    case "us":
    case "ca":
      return `(${area}) ${randomInt(100, 999, rng)}-${randomInt(1000, 9999, rng)}`;
    case "uk":
      return `${area} ${randomInt(100000, 999999, rng)}`;
    case "au":
      return `${area} ${randomInt(100, 999, rng)} ${randomInt(100, 999, rng)}`;
    case "de":
      return `${area} ${randomInt(10000000, 99999999, rng)}`;
    case "fr":
      return `${area} ${randomInt(10, 99, rng)} ${randomInt(10, 99, rng)} ${randomInt(10, 99, rng)} ${randomInt(10, 99, rng)}`;
    case "nl":
      return `${area} ${randomInt(10000000, 99999999, rng)}`;
    case "in":
      return `${area}${randomInt(10, 99, rng)} ${randomInt(1000000, 9999999, rng)}`;
  }
}

// ---------------------------------------------------------------------------
// Locale-appropriate language codes
// ---------------------------------------------------------------------------

const LOCALE_LANGUAGE: Record<Locale, string> = {
  us: "en-US",
  uk: "en-GB",
  au: "en-AU",
  ca: "en-CA",
  de: "de",
  fr: "fr",
  nl: "nl",
  in: "hi",
};

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
// Patient resource assembly
// ---------------------------------------------------------------------------

function buildPatient(locale: Locale, rng: RandomFn): FhirResource {
  const localeDef = getLocale(locale);
  const gender = generateGender(rng);
  const nameGender: "male" | "female" = gender === "other" || gender === "unknown"
    ? pickRandom(["male", "female"] as const, rng)
    : gender;

  const generatedName = generateName(localeDef.names, nameGender, rng);
  const generatedAddress = generateAddress(localeDef.address, rng);

  const givenName = generatedName.given[0] ?? "";
  const familyName = generatedName.family;
  const email = `${givenName.toLowerCase()}.${familyName.toLowerCase()}@example.com`;

  const identifierDef = pickRandom(localeDef.patientIdentifiers, rng);
  const identifierValue = identifierDef.generate(rng);

  const nameEntry: Record<string, unknown> = {
    use: "official",
    family: familyName,
    given: generatedName.given,
  };
  if (generatedName.familyPrefix !== undefined) {
    nameEntry["_family"] = {
      extension: [
        {
          url: "http://hl7.org/fhir/StructureDefinition/humanname-own-prefix",
          valueString: generatedName.familyPrefix,
        },
      ],
    };
  }

  const addressEntry: Record<string, unknown> = {
    use: "home",
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
    resourceType: "Patient",
    id: generateUuidV4(rng),
    identifier: [
      {
        system: identifierDef.system,
        value: identifierValue,
      },
    ],
    name: [nameEntry],
    telecom: [
      {
        system: "phone",
        value: generatePhone(locale, rng),
        use: "home",
      },
      {
        system: "email",
        value: email,
        use: "home",
      },
    ],
    gender,
    birthDate: generateBirthDate(rng),
    address: [addressEntry],
    communication: [
      {
        language: {
          coding: [
            {
              system: "urn:ietf:bcp:47",
              code: LOCALE_LANGUAGE[locale],
            },
          ],
        },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// PatientBuilder
// ---------------------------------------------------------------------------

export interface PatientBuilder {
  locale(locale: Locale): PatientBuilder;
  count(count: number): PatientBuilder;
  seed(seed: number): PatientBuilder;
  overrides(overrides: Record<string, unknown>): PatientBuilder;
  build(): FhirResource[];
}

interface PatientBuilderState {
  locale: Locale;
  count: number;
  seed: number;
  overrideMap: Record<string, unknown>;
}

function makeBuilder(state: PatientBuilderState): PatientBuilder {
  return {
    locale(loc: Locale): PatientBuilder {
      return makeBuilder({ ...state, locale: loc });
    },
    count(n: number): PatientBuilder {
      return makeBuilder({ ...state, count: n });
    },
    seed(s: number): PatientBuilder {
      return makeBuilder({ ...state, seed: s });
    },
    overrides(o: Record<string, unknown>): PatientBuilder {
      return makeBuilder({ ...state, overrideMap: o });
    },
    build(): FhirResource[] {
      const rng = createRng(state.seed);
      const results: FhirResource[] = [];
      for (let i = 0; i < state.count; i++) {
        const patient = buildPatient(state.locale, rng);
        if (Object.keys(state.overrideMap).length > 0) {
          results.push(deepMerge(patient as Record<string, unknown>, state.overrideMap) as FhirResource);
        } else {
          results.push(patient);
        }
      }
      return results;
    },
  };
}

/** Create a new PatientBuilder with default options. */
export function createPatientBuilder(): PatientBuilder {
  return makeBuilder({
    locale: "us",
    count: 1,
    seed: 0,
    overrideMap: {},
  });
}
