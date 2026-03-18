# Spec 03 — Address generators

**Status:** complete

## Goal

Implement country-aware address generation for all supported locales. Each locale provides
street patterns, city/state data, and postal code generators that produce addresses matching
the country's expected format.

## Dependencies

- Spec 01 (core types) complete — `AddressTemplate`, `CityDefinition`, `RandomFn` types available
- Spec 02 (identifier generators) complete — `createRng`, `pickRandom`, `randomInt` utilities available

## Deliverables

| File | Description |
|------|-------------|
| `src/locales/us/addresses.ts` | US address data and postal code generator |
| `src/locales/uk/addresses.ts` | UK address data and postcode generator |
| `src/locales/au/addresses.ts` | AU address data and postal code generator |
| `src/locales/ca/addresses.ts` | CA address data and postal code generator |
| `src/locales/de/addresses.ts` | DE address data and PLZ generator |
| `src/locales/fr/addresses.ts` | FR address data and code postal generator |
| `src/locales/nl/addresses.ts` | NL address data and postcode generator |
| `src/locales/in/addresses.ts` | IN address data and PIN code generator |
| `src/core/generators/addresses.ts` | Address generation function using locale data |
| `tests/generators/addresses.test.ts` | Tests for all locale address generators |

## Key interfaces / signatures

### Address generator (src/core/generators/addresses.ts)

```typescript
import type { AddressTemplate, RandomFn } from "../types.js";

export interface GeneratedAddress {
  line: string[];
  city: string;
  state?: string;
  district?: string;
  postalCode: string;
  country: string;
}

/** Generate a single address using the locale's address template. */
export function generateAddress(template: AddressTemplate, rng: RandomFn): GeneratedAddress;
```

### Locale address data (each locale file)

Each locale file exports an `AddressTemplate` object. Example structure for US:

```typescript
export const usAddressTemplate: AddressTemplate = {
  streets: [
    "Oak Street", "Maple Avenue", "Cedar Lane", "Pine Road",
    "Elm Drive", "Washington Boulevard", "Lincoln Way",
    // ... 20-30 entries
  ],
  cities: [
    { name: "Springfield", state: "IL" },
    { name: "Portland", state: "OR" },
    // ... 10-15 entries
  ],
  generatePostalCode: (rng, state) => { /* 5-digit ZIP */ },
  country: "US",
};
```

## Implementation notes

### Data volume per locale
- **Streets:** 20–30 entries per locale. Use common/generic street names, not real addresses.
- **Cities:** 10–15 entries per locale. Major cities with correct state/province mapping.
- **Postal codes:** Generated algorithmically per locale format rules.

### Country-specific formatting
See `docs/research/02-address-formats.md` for full format specifications.

Key locale-specific rules:
- **US:** `{number} {street}` format. 5-digit ZIP. 2-letter state code.
- **UK:** `{number} {street}` format. `AA9A 9AA` postcode variants. No `state` field. `country: "GB"`.
- **AU:** `{number} {street}` format. 4-digit postcode. State abbreviation (NSW, VIC, etc.). Postcode range must match state.
- **CA:** `{number} {street}` format. `A1A 1A1` postal code. 2-letter province code. First letter of postal code must match province. Letters D, F, I, O, Q, U never used.
- **DE:** `{street} {number}` format (number after street). 5-digit PLZ.
- **FR:** `{number} {type} {name}` format (e.g., "15 Rue de Rivoli"). 5-digit code postal.
- **NL:** `{street} {number}` format. `NNNN LL` postcode. Letters SA, SD, SS not used.
- **IN:** `{number} {street}` format. 6-digit PIN code. District field populated. First digit of PIN matches region.

### Street numbers
Generate random street numbers 1–9999. Avoid 0 and implausibly large numbers.

### Obviously synthetic
All generated addresses must be obviously synthetic. Use real city names (for format
realism) but with random street numbers. Do not attempt to generate real existing addresses.

## Acceptance criteria

```bash
pnpm test tests/generators/addresses.test.ts    # all pass
pnpm typecheck                                   # no errors
```

Tests must include:
- Each locale generates an address with the correct `country` code
- US addresses have 5-digit postal codes and 2-letter state abbreviations
- UK addresses have valid postcode format and `country: "GB"`
- AU addresses have 4-digit postcodes with state-appropriate ranges
- CA addresses have `A1A 1A1` format postal codes with valid letters
- NL addresses have `NNNN LL` format postcodes without SA/SD/SS
- DE addresses have `{street} {number}` order and 5-digit PLZ
- Determinism: same seed produces same address

## Do not do

- Do not use external address generation libraries (faker, etc.).
- Do not attempt to validate against real postal code databases.
- Do not generate addresses that could be mistaken for real addresses of real people.
- Do not import Node.js APIs.
