# Spec 05 — Patient builder

**Status:** open

## Goal

Implement the Patient resource builder — the flagship builder that composes identifier
generators, address generators, and name generators into complete, valid FHIR R4 Patient
resources.

## Dependencies

- Spec 01 (core types) complete — `ResourceBuilder`, `BuilderOptions`, `FhirResource`, `Locale` types
- Spec 02 (identifier generators) complete — check digit algorithms, seeded PRNG
- Spec 03 (address generators) complete — locale address templates
- Spec 04 (name generators) complete — locale name pools

## Deliverables

| File | Description |
|------|-------------|
| `src/core/builders/patient.ts` | Patient builder implementation |
| `src/locales/us/index.ts` | US locale definition (assembles identifiers, addresses, names) |
| `src/locales/uk/index.ts` | UK locale definition |
| `src/locales/au/index.ts` | AU locale definition |
| `src/locales/ca/index.ts` | CA locale definition |
| `src/locales/de/index.ts` | DE locale definition |
| `src/locales/fr/index.ts` | FR locale definition |
| `src/locales/nl/index.ts` | NL locale definition |
| `src/locales/in/index.ts` | IN locale definition |
| `src/locales/index.ts` | Locale registry — maps locale codes to definitions |
| `tests/builders/patient.test.ts` | Patient builder tests |

## Key interfaces / signatures

### Patient builder (src/core/builders/patient.ts)

```typescript
import type { FhirResource, Locale, BuilderOptions, RandomFn } from "../types.js";

export interface PatientBuilder {
  locale(locale: Locale): PatientBuilder;
  count(count: number): PatientBuilder;
  seed(seed: number): PatientBuilder;
  overrides(overrides: Record<string, unknown>): PatientBuilder;
  build(): FhirResource[];
}

/** Create a new PatientBuilder with default options. */
export function createPatientBuilder(): PatientBuilder;
```

### Locale registry (src/locales/index.ts)

```typescript
import type { Locale, LocaleDefinition } from "../core/types.js";

export function getLocale(code: Locale): LocaleDefinition;
export function getAllLocales(): LocaleDefinition[];
```

## Implementation notes

### Generated Patient structure

Each generated Patient should include:

```typescript
{
  resourceType: "Patient",
  id: "<uuid-v4>",
  meta: {
    profile: ["<country-specific-profile-url>"]  // optional, include for locales with well-known profiles
  },
  identifier: [
    {
      system: "<locale-specific-system-uri>",
      value: "<generated-valid-identifier>"
    }
  ],
  name: [
    {
      use: "official",
      family: "<generated-family-name>",
      given: ["<generated-given-name>"]
    }
  ],
  telecom: [
    {
      system: "phone",
      value: "<generated-phone-number>",
      use: "home"
    },
    {
      system: "email",
      value: "<generated-email>",
      use: "home"
    }
  ],
  gender: "male" | "female" | "other" | "unknown",
  birthDate: "<YYYY-MM-DD>",
  address: [
    {
      use: "home",
      line: ["<generated-street>"],
      city: "<generated-city>",
      state: "<generated-state>",       // where applicable
      postalCode: "<generated-postal-code>",
      country: "<ISO-country-code>"
    }
  ],
  communication: [
    {
      language: {
        coding: [{
          system: "urn:ietf:bcp:47",
          code: "<locale-appropriate-language>"
        }]
      }
    }
  ]
}
```

### Builder pattern

The builder uses method chaining. Internal state is immutable — each method returns a
new builder instance (or mutates and returns `this`; implementer's choice, but document
which approach).

```typescript
const patients = createPatientBuilder()
  .locale("uk")
  .count(10)
  .seed(42)
  .build();
```

### ID generation
Generate UUIDs for resource `id`. Use the seeded PRNG to generate deterministic UUIDs
(not `crypto.randomUUID()` which is not deterministic). Implement a simple UUID v4
generator that uses the PRNG.

### Birth date generation
Generate birth dates between 1940 and 2010. Use the PRNG for deterministic dates.
Format as `YYYY-MM-DD`.

### Gender distribution
Randomly assign gender with roughly equal distribution: 48% male, 48% female, 3% other,
1% unknown. Use the PRNG.

### Phone and email generation
Generate obviously synthetic contact info:
- Phone: locale-appropriate format with synthetic numbers
- Email: `{given}.{family}@example.com` (example.com is RFC 2606 reserved)

### Overrides
The `overrides` parameter allows partial overrides to be deep-merged into every generated
resource. This lets consumers customize specific fields while keeping the rest generated.

```typescript
const patients = createPatientBuilder()
  .locale("us")
  .count(5)
  .overrides({ meta: { source: "test-suite" } })
  .build();
```

### Locale assembly
Each locale `index.ts` assembles identifiers, addresses, and names into a `LocaleDefinition`.
Example for UK:

```typescript
import { nhsNumberIdentifier, odsCodeIdentifier, gmcNumberIdentifier } from "./identifiers.js";
import { ukAddressTemplate } from "./addresses.js";
import { ukNamePool } from "./names.js";
import type { LocaleDefinition } from "../../core/types.js";

export const ukLocale: LocaleDefinition = {
  code: "uk",
  name: "United Kingdom",
  patientIdentifiers: [nhsNumberIdentifier],
  practitionerIdentifiers: [gmcNumberIdentifier],
  organizationIdentifiers: [odsCodeIdentifier],
  address: ukAddressTemplate,
  names: ukNamePool,
};
```

## Acceptance criteria

```bash
pnpm test tests/builders/patient.test.ts    # all pass
pnpm typecheck                               # no errors
```

Tests must include:
- Generate 1 US Patient — has valid structure, SSN identifier, US address
- Generate 1 UK Patient — has valid NHS Number (passes Modulus 11), UK address with postcode
- Generate 1 AU Patient — has valid IHI (passes Luhn), AU address with 4-digit postcode
- Generate 1 NL Patient — has valid BSN (passes 11-proef), NL address
- Generate 10 Patients for each locale — all have required fields
- Determinism: same locale + seed + count produces identical output
- Overrides are applied correctly
- All patient identifiers pass their own validation function

## Do not do

- Do not implement Practitioner, Organization, or clinical resource builders — those are separate specs.
- Do not validate against full FHIR profiles — structural correctness is sufficient.
- Do not use `Math.random()` or `crypto.randomUUID()`.
- Do not import Node.js APIs.
