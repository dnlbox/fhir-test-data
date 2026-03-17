# Spec 07 — Organization builder

**Status:** open

## Goal

Implement the Organization resource builder with country-specific organizational identifiers
(ODS for UK, NPI for US, IKNR for DE, etc.).

## Dependencies

- Spec 01 (core types) complete
- Spec 02 (identifier generators) complete — check digit algorithms
- Spec 03 (address generators) complete — locale address templates

## Deliverables

| File | Description |
|------|-------------|
| `src/core/builders/organization.ts` | Organization builder implementation |
| `src/locales/*/identifiers.ts` | Add organization identifiers to each locale (if not already present) |
| `tests/builders/organization.test.ts` | Organization builder tests |

## Key interfaces / signatures

### Organization builder

```typescript
export interface OrganizationBuilder {
  locale(locale: Locale): OrganizationBuilder;
  count(count: number): OrganizationBuilder;
  seed(seed: number): OrganizationBuilder;
  overrides(overrides: Record<string, unknown>): OrganizationBuilder;
  build(): FhirResource[];
}

export function createOrganizationBuilder(): OrganizationBuilder;
```

## Implementation notes

### Generated Organization structure

```typescript
{
  resourceType: "Organization",
  id: "<uuid>",
  identifier: [
    {
      system: "<locale-specific-org-system>",
      value: "<generated-identifier>"
    }
  ],
  active: true,
  type: [
    {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/organization-type",
        code: "prov",
        display: "Healthcare Provider"
      }]
    }
  ],
  name: "<generated-org-name>",
  telecom: [
    {
      system: "phone",
      value: "<generated-phone>",
      use: "work"
    }
  ],
  address: [
    { /* locale-appropriate address */ }
  ]
}
```

### Organization name generation

Generate realistic-sounding but fictional healthcare organization names by combining:
- Prefixes: "St.", "Royal", "General", "University", "Community", "Memorial"
- City name from the locale's address data
- Suffixes: "Hospital", "Medical Center", "Health System", "Clinic", "Healthcare"

Examples: "St. James Hospital", "Springfield Medical Center", "Royal London Healthcare"

### Country-specific organization identifiers

| Locale | Identifier | System URI |
|--------|-----------|------------|
| US | NPI (same algorithm as practitioner NPI) | `http://hl7.org/fhir/sid/us-npi` |
| UK | ODS Code (3–5 alphanumeric) | `https://fhir.nhs.uk/Id/ods-organization-code` |
| AU | HPI-O (16 digits, Luhn, prefix 800362) | `http://ns.electronichealth.net.au/id/hi/hpio/1.0` |
| DE | IKNR (9 digits) | `http://fhir.de/sid/arge-ik/iknr` |
| FR | FINESS (9 digits) | `https://annuaire.sante.fr` |
| NL | AGB Code (8 digits) | `http://fhir.nl/fhir/NamingSystem/agb-z` |
| CA | Organization-specific | Province-specific URI |
| IN | HFR ID | ABDM system URI |

## Acceptance criteria

```bash
pnpm test tests/builders/organization.test.ts    # all pass
pnpm typecheck                                    # no errors
```

Tests must include:
- Generate 1 US Organization — has NPI, address, name
- Generate 1 UK Organization — has ODS code in correct format
- Generate 5 Organizations per locale — all have required fields
- Organization names are generated (not empty, not identical across instances)
- Determinism: same seed produces same output

## Do not do

- Do not add organizational hierarchy (partOf references) in v1.
- Do not add complex type taxonomies beyond basic "Healthcare Provider".
- Do not import Node.js APIs.
