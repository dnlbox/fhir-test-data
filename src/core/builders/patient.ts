import type { FhirResource, Locale, RandomFn } from "@/core/types.js";
import { createRng, pickRandom, randomInt } from "@/core/generators/rng.js";
import { generateAddress } from "@/core/generators/addresses.js";
import { generateName } from "@/core/generators/names.js";
import { generateUuidV4, deepMerge, generateDate } from "./utils.js";
import { getLocale } from "@/locales/index.js";

// ---------------------------------------------------------------------------
// Gender
// ---------------------------------------------------------------------------

type FhirGender = "male" | "female" | "other" | "unknown";

const GENDER_DISTRIBUTION: Array<[FhirGender, number]> = [
  ["male",    0.48],
  ["female",  0.48],
  ["other",   0.03],
  ["unknown", 0.01],
];

function generateGender(rng: RandomFn): FhirGender {
  const roll = rng();
  let cumulative = 0;
  for (const [gender, probability] of GENDER_DISTRIBUTION) {
    cumulative += probability;
    if (roll < cumulative) return gender;
  }
  return "unknown";
}

// ---------------------------------------------------------------------------
// Phone number formats per locale
// ---------------------------------------------------------------------------

type PhoneFormatter = (rng: RandomFn) => string;

const PHONE_FORMATTERS: Record<Locale, PhoneFormatter> = {
  us:  (rng) => `(555) ${randomInt(100, 999, rng)}-${randomInt(1000, 9999, rng)}`,
  ca:  (rng) => `(555) ${randomInt(100, 999, rng)}-${randomInt(1000, 9999, rng)}`,
  uk:  (rng) => `07700 ${randomInt(100000, 999999, rng)}`,
  au:  (rng) => `0400 ${randomInt(100, 999, rng)} ${randomInt(100, 999, rng)}`,
  de:  (rng) => `030 ${randomInt(10000000, 99999999, rng)}`,
  fr:  (rng) => `06 ${randomInt(10, 99, rng)} ${randomInt(10, 99, rng)} ${randomInt(10, 99, rng)} ${randomInt(10, 99, rng)}`,
  nl:  (rng) => `06 ${randomInt(10000000, 99999999, rng)}`,
  in:  (rng) => `09${randomInt(10, 99, rng)} ${randomInt(1000000, 9999999, rng)}`,
};

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
    ...(generatedName.familyPrefix !== undefined && {
      _family: {
        extension: [
          {
            url: "http://hl7.org/fhir/StructureDefinition/humanname-own-prefix",
            valueString: generatedName.familyPrefix,
          },
        ],
      },
    }),
  };

  const addressEntry: Record<string, unknown> = {
    use: "home",
    line: generatedAddress.line,
    city: generatedAddress.city,
    postalCode: generatedAddress.postalCode,
    country: generatedAddress.country,
    ...(generatedAddress.state !== undefined && { state: generatedAddress.state }),
    ...(generatedAddress.district !== undefined && { district: generatedAddress.district }),
  };

  return {
    resourceType: "Patient",
    id: generateUuidV4(rng),
    identifier: [{ system: identifierDef.system, value: identifierValue }],
    name: [nameEntry],
    telecom: [
      { system: "phone", value: PHONE_FORMATTERS[locale](rng), use: "home" },
      { system: "email", value: email, use: "home" },
    ],
    gender,
    birthDate: generateDate(1940, 2010, rng),
    address: [addressEntry],
    communication: [
      {
        language: {
          coding: [{ system: "urn:ietf:bcp:47", code: LOCALE_LANGUAGE[locale] }],
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
    locale(loc: Locale): PatientBuilder { return makeBuilder({ ...state, locale: loc }); },
    count(n: number):    PatientBuilder { return makeBuilder({ ...state, count: n }); },
    seed(s: number):     PatientBuilder { return makeBuilder({ ...state, seed: s }); },
    overrides(o: Record<string, unknown>): PatientBuilder {
      return makeBuilder({ ...state, overrideMap: o });
    },
    build(): FhirResource[] {
      const rng = createRng(state.seed);
      const hasOverrides = Object.keys(state.overrideMap).length > 0;
      return Array.from({ length: state.count }, () => {
        const patient = buildPatient(state.locale, rng);
        return hasOverrides
          ? deepMerge(patient as Record<string, unknown>, state.overrideMap) as FhirResource
          : patient;
      });
    },
  };
}

/** Create a new PatientBuilder with default options. */
export function createPatientBuilder(): PatientBuilder {
  return makeBuilder({ locale: "us", count: 1, seed: 0, overrideMap: {} });
}
