# Seeded generation

`fhir-test-data` uses a seedable pseudo-random number generator (PRNG). The same seed
always produces the same output — on any machine, across any Node version, with no
dependency on `Math.random()`.

## Why seeding matters for tests

Without seeding, test fixtures drift every time they are regenerated. A patient's name
or birthDate changes between runs, causing snapshot tests to fail for the wrong reason —
not because the logic changed, but because the random data changed.

With seeding, fixtures are stable. A test that checks `patient.identifier[0].value` will
always see the same value for the same seed and locale.

## Setting a seed

```typescript
import { createPatientBuilder } from "fhir-test-data";

// Any integer works as a seed
const [patient] = createPatientBuilder().locale("uk").seed(42).build();
```

Seed `0` is the default. Omitting `.seed()` is the same as `.seed(0)`.

## Verifying determinism

```bash
fhir-test-data generate patient --locale nl --seed 99 > a.json
fhir-test-data generate patient --locale nl --seed 99 > b.json
diff a.json b.json
# (no output — files are identical)
```

## Patterns for test fixtures

### Golden file tests

Generate fixture files once, commit them, and compare on every CI run:

```bash
# Generate baseline fixtures
fhir-test-data generate bundle --locale us --seed 1 --output ./fixtures/baseline/
```

```typescript
// test: fixtures match baseline after a library upgrade
import { readFileSync } from "fs";
import { createBundleBuilder } from "fhir-test-data";

const [bundle] = createBundleBuilder().locale("us").seed(1).build();
const baseline = JSON.parse(readFileSync("./fixtures/baseline/Bundle-0001.json", "utf8"));

// Use fhir-resource-diff or a deep equality check
expect(bundle).toEqual(baseline);
```

### Inline fixture generation

Generate fixtures inline in tests without committed files:

```typescript
describe("Patient validation pipeline", () => {
  // Stable across runs — seed pins all generated values
  const [patient] = createPatientBuilder().locale("nl").seed(42).build();

  it("accepts a valid BSN", () => {
    const result = validatePatient(patient);
    expect(result.valid).toBe(true);
  });

  it("has exactly one identifier", () => {
    expect(patient.identifier).toHaveLength(1);
  });
});
```

### Multiple unique patients

Each call to `.build()` with the same seed and same locale produces the same results.
To generate multiple distinct patients, either vary the seed or use `.count()`:

```typescript
// Different seeds — different patients
const [patientA] = createPatientBuilder().locale("uk").seed(1).build();
const [patientB] = createPatientBuilder().locale("uk").seed(2).build();

// count() — 5 distinct patients, deterministically ordered
const fivePatients = createPatientBuilder().locale("uk").seed(100).count(5).build();
```

### Seed strategy for test suites

A common pattern is to derive seeds from a test-suite constant, so fixtures are isolated
between test files:

```typescript
// tests/patient.test.ts
const SEED = 1000;
const [patient] = createPatientBuilder().locale("us").seed(SEED).build();

// tests/bundle.test.ts
const SEED = 2000;
const [bundle] = createBundleBuilder().locale("uk").seed(SEED).build();
```

## PRNG implementation

The generator uses a seeded PRNG based on a simple linear congruential algorithm with
well-known constants. It produces a deterministic sequence of integers from any initial
seed. `Math.random()` is never called.

The seed is consumed sequentially as resources are generated — names, identifiers,
addresses, and field values each draw from the same sequence. This means:

- The first patient in `.count(5)` always has the same seed-derived values as `.count(1)`
- Adding or removing a field from a builder changes the seed consumption and may shift
  subsequent values — this is expected and is why bumping the major version is
  appropriate for breaking builder changes

## Seed stability across versions

Seed stability is maintained within a minor version. Patch releases may fix bugs in
check-digit generation without guaranteeing identical output for all seeds. Minor
releases add new resource types or locales without changing existing output for
unchanged locales.

If you commit baseline fixture files, regenerate them when upgrading `fhir-test-data`.
