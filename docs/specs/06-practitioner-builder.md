# Spec 06 — Practitioner builder

**Status:** complete

## Goal

Implement the Practitioner and PractitionerRole resource builders with country-specific
professional identifiers (NPI for US, GMC for UK, LANR for DE, etc.).

## Dependencies

- Spec 01 (core types) complete
- Spec 02 (identifier generators) complete — check digit algorithms
- Spec 03 (address generators) complete — locale address templates
- Spec 04 (name generators) complete — locale name pools

## Deliverables

| File | Description |
|------|-------------|
| `src/core/builders/practitioner.ts` | Practitioner builder implementation |
| `src/locales/*/identifiers.ts` | Add practitioner identifiers to each locale (if not already present) |
| `tests/builders/practitioner.test.ts` | Practitioner builder tests |

## Key interfaces / signatures

### Practitioner builder

```typescript
export interface PractitionerBuilder {
  locale(locale: Locale): PractitionerBuilder;
  count(count: number): PractitionerBuilder;
  seed(seed: number): PractitionerBuilder;
  overrides(overrides: Record<string, unknown>): PractitionerBuilder;
  build(): FhirResource[];
}

export function createPractitionerBuilder(): PractitionerBuilder;
```

## Implementation notes

### Generated Practitioner structure

```typescript
{
  resourceType: "Practitioner",
  id: "<uuid>",
  identifier: [
    {
      system: "<locale-specific-practitioner-system>",
      value: "<generated-valid-identifier>"
    }
  ],
  name: [
    {
      use: "official",
      family: "<generated-family-name>",
      given: ["<generated-given-name>"],
      prefix: ["Dr."]  // or locale-appropriate prefix
    }
  ],
  telecom: [
    {
      system: "email",
      value: "<given>.<family>@example-practice.com",
      use: "work"
    }
  ],
  gender: "male" | "female",
  qualification: [
    {
      code: {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v2-0360",
          code: "MD",
          display: "Doctor of Medicine"
        }]
      }
    }
  ]
}
```

### Country-specific practitioner identifiers

| Locale | Identifier | System URI |
|--------|-----------|------------|
| US | NPI (10 digits, Luhn with 80840 prefix) | `http://hl7.org/fhir/sid/us-npi` |
| UK | GMC Number (7 digits) | `https://fhir.hl7.org.uk/Id/gmc-number` |
| AU | HPI-I (16 digits, Luhn, prefix 800361) | `http://ns.electronichealth.net.au/id/hi/hpii/1.0` |
| CA | Provincial license number (format varies) | Province-specific URI |
| DE | LANR (9 digits, Modulus 10 check) | `http://fhir.de/sid/kbv/lanr` |
| FR | RPPS (11 digits, Luhn) | `https://annuaire.sante.fr` |
| NL | UZI Number | `http://fhir.nl/fhir/NamingSystem/uzi-nr-pers` |
| IN | HPR ID | ABDM system URI |

### Title/prefix by locale
- US/UK/AU/CA: "Dr."
- DE: "Dr. med."
- FR: "Dr"
- NL: "Dr."
- IN: "Dr."

## Acceptance criteria

```bash
pnpm test tests/builders/practitioner.test.ts    # all pass
pnpm typecheck                                    # no errors
```

Tests must include:
- Generate 1 US Practitioner — has valid NPI (passes Luhn with 80840 prefix)
- Generate 1 UK Practitioner — has GMC number in correct format
- Generate 1 DE Practitioner — has LANR with valid check digit
- Generate 5 Practitioners per locale — all have required fields
- Determinism: same seed produces same output

## Do not do

- Do not implement PractitionerRole as a separate builder in v1 — it can be a method on the
  Practitioner builder that generates a linked PractitionerRole if needed in a future iteration.
- Do not add specialty/qualification value sets beyond a basic "MD" qualification.
- Do not import Node.js APIs.
