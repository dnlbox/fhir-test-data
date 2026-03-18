import type { FhirResource, Locale } from "../types.js";
import { createRng, pickRandom } from "../generators/rng.js";
import { generateName } from "../generators/names.js";
import { getLocale } from "../../locales/index.js";

// ---------------------------------------------------------------------------
// UUID v4 from seeded PRNG (same algorithm as patient builder)
// ---------------------------------------------------------------------------

import type { RandomFn } from "../types.js";

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
    telecom: [
      {
        system: "email",
        value: email,
        use: "work",
      },
    ],
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
// Deep merge (same as patient builder)
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
    locale(loc: Locale): PractitionerBuilder {
      return makeBuilder({ ...state, locale: loc });
    },
    count(n: number): PractitionerBuilder {
      return makeBuilder({ ...state, count: n });
    },
    seed(s: number): PractitionerBuilder {
      return makeBuilder({ ...state, seed: s });
    },
    overrides(o: Record<string, unknown>): PractitionerBuilder {
      return makeBuilder({ ...state, overrideMap: o });
    },
    build(): FhirResource[] {
      const rng = createRng(state.seed);
      const results: FhirResource[] = [];
      for (let i = 0; i < state.count; i++) {
        const practitioner = buildPractitioner(state.locale, rng);
        if (Object.keys(state.overrideMap).length > 0) {
          results.push(
            deepMerge(practitioner as Record<string, unknown>, state.overrideMap) as FhirResource,
          );
        } else {
          results.push(practitioner);
        }
      }
      return results;
    },
  };
}

/** Create a new PractitionerBuilder with default options. */
export function createPractitionerBuilder(): PractitionerBuilder {
  return makeBuilder({
    locale: "us",
    count: 1,
    seed: 0,
    overrideMap: {},
  });
}
