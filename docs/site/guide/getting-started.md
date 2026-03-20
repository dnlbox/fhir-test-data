# Getting started

`fhir-test-data` is a TypeScript library and CLI for generating valid FHIR R4/R4B/R5
test resources with country-aware identifiers — no production data copying, no hardcoded
US-only identifiers.

## Try it without installing

Run directly with `npx` — no install needed:

```bash
npx fhir-test-data generate patient --locale uk --count 1 --seed 42
```

## Install

```bash
# Project-local (for library use or CI)
pnpm add -D fhir-test-data

# Global install (for repeated CLI use)
pnpm add -g fhir-test-data
# or
npm install -g fhir-test-data
```

## First commands

### Generate a patient

```bash
fhir-test-data generate patient --locale uk --count 1 --seed 42
```

```json
{
  "resourceType": "Patient",
  "id": "3f2a1b4c-8d9e-4f0a-b1c2-d3e4f5a6b7c8",
  "identifier": [
    { "system": "https://fhir.nhs.uk/Id/nhs-number", "value": "4857326190" }
  ],
  "name": [{ "use": "official", "family": "Whitfield", "given": ["Oliver"] }],
  "gender": "male",
  "birthDate": "1981-07-14"
}
```

The NHS Number passes Modulus 11 — every generated identifier passes its country's
official check-digit algorithm.

### Generate a full bundle

```bash
fhir-test-data generate bundle --locale au --seed 1 --output ./fixtures/
```

Produces a FHIR Bundle with a Patient, Practitioner, Organization, PractitionerRole,
and clinical resources — all with automatically wired references.

### Library quick start

```typescript
import { createPatientBuilder } from "fhir-test-data";

const patients = createPatientBuilder()
  .locale("uk")
  .count(10)
  .seed(42)
  .build();
```

## Quick wins

**Deterministic test fixtures — same seed, same output:**

```bash
fhir-test-data generate patient --locale nl --seed 99 > a.json
fhir-test-data generate patient --locale nl --seed 99 > b.json
diff a.json b.json  # empty — identical output
```

**Multiple locales:**

```bash
for locale in us uk au de fr nl; do
  fhir-test-data generate patient --locale $locale --seed 1
done
```

**NDJSON for bulk loading:**

```bash
fhir-test-data generate patient --locale us --count 1000 --format ndjson --output ./fixtures/
```

**Override fields:**

```typescript
import { createPatientBuilder } from "fhir-test-data";

const [patient] = createPatientBuilder()
  .locale("us")
  .seed(1)
  .overrides({ meta: { source: "test-suite" }, active: true })
  .build();
```

## Run from source (contributors)

No build step needed during development:

```bash
git clone https://github.com/dnlbox/fhir-test-data.git
cd fhir-test-data
pnpm install

pnpm cli -- generate patient --locale uk --count 3 --seed 42
```

The `--` separator after `pnpm cli` is required so pnpm passes flags to the script.

## Next steps

- [Locales](/guide/locales) — supported countries, identifier systems, check-digit algorithms
- [Builders](/guide/builders) — all builder types and API methods
- [Bundle builder](/guide/bundle-builder) — composing complete patient records
- [CLI usage](/guide/cli) — all generate command options
- [Seeded generation](/guide/seeded-generation) — using deterministic output in tests
