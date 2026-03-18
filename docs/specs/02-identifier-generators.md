# Spec 02 — Identifier generators

**Status:** complete

## Goal

Implement check digit algorithms and identifier generators for all supported locales.
Each algorithm must be a pure function. Each generator must produce identifiers that pass
real-world validation.

## Dependencies

- Spec 01 (core types) complete — `IdentifierDefinition`, `RandomFn` types available

## Deliverables

| File | Description |
|------|-------------|
| `src/core/generators/check-digits.ts` | Pure check digit algorithm implementations |
| `src/core/generators/identifiers.ts` | Identifier generator factory using check digit functions |
| `src/core/generators/rng.ts` | Seeded PRNG implementation |
| `tests/generators/check-digits.test.ts` | Unit tests for every algorithm |
| `tests/generators/identifiers.test.ts` | Integration tests for identifier generators |

## Key interfaces / signatures

### Check digit algorithms (src/core/generators/check-digits.ts)

```typescript
/** Luhn algorithm — used by AU IHI, AU HPI-I, US NPI, FR RPPS */
export function luhnCheckDigit(digits: string): string;
export function luhnValidate(value: string): boolean;

/** Modulus 11 — used by UK NHS Number */
export function modulus11CheckDigit(nineDigits: string): string | null;
export function modulus11Validate(value: string): boolean;

/** Verhoeff — used by IN Aadhaar */
export function verhoeffCheckDigit(digits: string): string;
export function verhoeffValidate(value: string): boolean;

/** 11-proef — used by NL BSN */
export function elevenProefCheckDigit(eightDigits: string): string | null;
export function elevenProefValidate(value: string): boolean;

/** Modulus 97 — used by FR NIR */
export function modulus97Key(thirteenDigits: string): string;
export function modulus97Validate(value: string): boolean;

/** Modulus 10 — used by DE LANR */
export function modulus10CheckDigit(sixDigits: string): string;
```

### Seeded PRNG (src/core/generators/rng.ts)

```typescript
/** Create a deterministic PRNG from a seed. Uses mulberry32 or similar. */
export function createRng(seed: number): RandomFn;

/** Pick a random element from an array using the RNG. */
export function pickRandom<T>(array: readonly T[], rng: RandomFn): T;

/** Generate a random integer in [min, max] inclusive. */
export function randomInt(min: number, max: number, rng: RandomFn): number;

/** Generate a string of N random digits. */
export function randomDigits(count: number, rng: RandomFn): string;
```

## Implementation notes

### Luhn algorithm
See `docs/research/01-country-identifiers.md` for full algorithm description.
Used by: AU IHI (prefix `800360`), AU HPI-I (prefix `800361`), US NPI (prefix `80840`
prepended for validation), FR RPPS.

### Modulus 11 (NHS)
The check digit can be 10, which means the number is invalid. The generator must retry
when this happens. See research doc for weighted sum calculation.

### Verhoeff
Requires three lookup tables (d, p, inv). Implement these as constant arrays.
See research doc for the complete tables. This is the most complex algorithm — take care
with the table values.

### 11-proef (Dutch BSN)
The check digit d9 can exceed 9, requiring a retry. The total sum must not be 0.
See research doc for the weighted sum formula.

### Modulus 97 (French NIR)
Uses large number modulus. JavaScript can handle this with BigInt for 13-digit numbers,
or by using the standard iterative modulus technique for large numbers.

### Seeded PRNG
Use the mulberry32 algorithm — it is simple, fast, and produces good distribution for
test data generation. Do NOT use `Math.random()` anywhere in generators.

```typescript
function mulberry32(seed: number): RandomFn {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

### US SSN generation
Generate in the 900–999 area range (never assigned to real people). Avoid 987-65-43xx
(IRS reserved). Group number must not be 00. Serial must not be 0000.

### US NPI generation
Prepend `80840` to the first 9 digits, compute Luhn check digit, use as 10th digit.
The `80840` prefix is NOT part of the NPI itself — it is only used for check digit calculation.

## Acceptance criteria

```bash
pnpm test tests/generators/check-digits.test.ts    # all pass
pnpm test tests/generators/identifiers.test.ts     # all pass
pnpm typecheck                                      # no errors
```

Tests must include:
- Luhn validation of known-valid AU IHI: `8003608833357361`
- Modulus 11 validation of known-valid NHS Number: `9434765919`
- Verhoeff validation of known-valid Aadhaar: `496107787920`
- 11-proef validation of known-valid BSN: `999999990`
- Modulus 97 validation of known-valid French NIR + key
- Generate 100 identifiers for each locale, verify all pass their own validate function
- Determinism test: same seed produces same identifier sequence

## Do not do

- Do not use `Math.random()` — always use the seeded PRNG.
- Do not use external random number libraries (faker, chance, etc.).
- Do not import Node.js APIs in these modules.
- Do not implement the full locale definition here — only the identifier generators.
  Locale assembly happens in `src/locales/`.
