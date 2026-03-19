import type { FhirResource, Locale, RandomFn } from "@/core/types.js";
import { createRng, pickRandom } from "@/core/generators/rng.js";
import { generateName } from "@/core/generators/names.js";
import { generateUuidV4, deepMerge } from "./utils.js";
import { getLocale } from "@/locales/index.js";

// ---------------------------------------------------------------------------
// Locale-appropriate title/prefix
// ---------------------------------------------------------------------------

const TITLE_BY_LOCALE: Record<Locale, string> = {
  us: "Dr.",
  uk: "Dr.",
  au: "Dr.",
  ca: "Dr.",
  de: "Dr. med.",
  fr: "Dr",
  nl: "Dr.",
  in: "Dr.",
};

// ---------------------------------------------------------------------------
// Practitioner resource assembly
// ---------------------------------------------------------------------------

function buildPractitioner(locale: Locale, rng: RandomFn): FhirResource {
  const localeDef = getLocale(locale);
  const gender: "male" | "female" = pickRandom(["male", "female"] as const, rng);

  const generatedName = generateName(localeDef.names, gender, rng);
  const givenName = generatedName.given[0] ?? "";
  const familyName = generatedName.family;
  const email = `${givenName.toLowerCase()}.${familyName.toLowerCase()}@example-practice.com`;

  const nameEntry: Record<string, unknown> = {
    use: "official",
    family: familyName,
    given: generatedName.given,
    prefix: [TITLE_BY_LOCALE[locale]],
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

  const identifiers: Array<{ system: string; value: string }> = [];
  if (localeDef.practitionerIdentifiers.length > 0) {
    const def = pickRandom(localeDef.practitionerIdentifiers, rng);
    identifiers.push({ system: def.system, value: def.generate(rng) });
  }

  return {
    resourceType: "Practitioner",
    id: generateUuidV4(rng),
    identifier: identifiers,
    name: [nameEntry],
    telecom: [{ system: "email", value: email, use: "work" }],
    gender,
    qualification: [
      {
        code: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/v2-0360",
              code: "MD",
              display: "Doctor of Medicine",
            },
          ],
        },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// PractitionerBuilder
// ---------------------------------------------------------------------------

export interface PractitionerBuilder {
  locale(locale: Locale): PractitionerBuilder;
  count(count: number): PractitionerBuilder;
  seed(seed: number): PractitionerBuilder;
  overrides(overrides: Record<string, unknown>): PractitionerBuilder;
  build(): FhirResource[];
}

interface PractitionerBuilderState {
  locale: Locale;
  count: number;
  seed: number;
  overrideMap: Record<string, unknown>;
}

function makeBuilder(state: PractitionerBuilderState): PractitionerBuilder {
  return {
    locale(loc: Locale):  PractitionerBuilder { return makeBuilder({ ...state, locale: loc }); },
    count(n: number):     PractitionerBuilder { return makeBuilder({ ...state, count: n }); },
    seed(s: number):      PractitionerBuilder { return makeBuilder({ ...state, seed: s }); },
    overrides(o: Record<string, unknown>): PractitionerBuilder {
      return makeBuilder({ ...state, overrideMap: o });
    },
    build(): FhirResource[] {
      const rng = createRng(state.seed);
      const hasOverrides = Object.keys(state.overrideMap).length > 0;
      return Array.from({ length: state.count }, () => {
        const practitioner = buildPractitioner(state.locale, rng);
        return hasOverrides
          ? deepMerge(practitioner as Record<string, unknown>, state.overrideMap) as FhirResource
          : practitioner;
      });
    },
  };
}

/** Create a new PractitionerBuilder with default options. */
export function createPractitionerBuilder(): PractitionerBuilder {
  return makeBuilder({ locale: "us", count: 1, seed: 0, overrideMap: {} });
}
