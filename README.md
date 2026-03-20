# fhir-test-data

Generate valid FHIR R4 / R4B / R5 test resources with country-aware identifiers.

---

## Why this exists

FHIR development requires realistic test data, but building it by hand is tedious and error-prone. Most teams either copy production data (a compliance risk) or write custom generators that hardcode US-centric identifiers like SSNs — useless if your system needs to handle UK NHS numbers, Dutch BSNs, or Indian Aadhaar numbers.

**fhir-test-data** generates structurally valid FHIR R4 resources with locale-appropriate identifiers that pass their country's check-digit algorithm. A generated UK Patient will have an NHS number that passes Modulus 11. A generated NL Patient will have a BSN that passes 11-proef. All outputs are seeded and deterministic — the same seed always produces the same data.

No existing TypeScript-first library combines international identifier correctness, seeded determinism, a fluent builder API, and CLI ergonomics in one package.

---

## Quick start

### Library

```bash
pnpm add fhir-test-data
```

```typescript
import { createPatientBuilder } from "fhir-test-data";

const patients = createPatientBuilder()
  .locale("uk")
  .count(10)
  .seed(42)
  .build();
```

### CLI

```bash
pnpm add -g fhir-test-data

# Generate 5 UK patients to stdout
fhir-test-data generate patient --locale uk --count 5 --seed 42

# Generate a full bundle to a fixtures directory
fhir-test-data generate bundle --locale au --seed 1 --output ./fixtures/
```

---

## Supported locales

| Country | Code | Patient identifiers | Algorithm | Practitioner identifiers |
|---------|------|--------------------|-----------|-----------------------|
| United States | `us` | SSN, MRN | Format validation | NPI (Luhn) |
| United Kingdom | `uk` | NHS Number | Modulus 11 | GMC Number, GMP Number |
| Australia | `au` | IHI, Medicare | Luhn | HPI-I (Luhn) |
| Canada | `ca` | Ontario HCN | Format validation | — |
| Germany | `de` | KVID-10 | Format validation | LANR (Modulus 10) |
| France | `fr` | NIR | Modulus 97 | RPPS (Luhn) |
| Netherlands | `nl` | BSN | 11-proef | UZI Number |
| India | `in` | Aadhaar, ABHA | Verhoeff | — |

---

## API reference

All builders use immutable method chaining. Each method returns a new builder instance.

### Shared builder options

| Method | Default | Description |
|--------|---------|-------------|
| `.locale(code)` | `"us"` | Locale code from the table above |
| `.count(n)` | `1` | Number of resources to generate |
| `.seed(n)` | `0` | Seed for deterministic output |
| `.fhirVersion(v)` | `"R4"` | FHIR version: `"R4"` \| `"R4B"` \| `"R5"` |
| `.overrides(obj)` | `{}` | Deep-merged into every generated resource |

### Patient

```typescript
import { createPatientBuilder } from "fhir-test-data";

const [patient] = createPatientBuilder()
  .locale("nl")
  .seed(99)
  .overrides({ meta: { source: "test-suite" } })
  .build();
```

Generated resources include: `resourceType`, `id` (UUID v4), `identifier` (locale-specific), `name`, `telecom` (phone + email), `gender`, `birthDate`, `address`, `communication`.

### Practitioner

```typescript
import { createPractitionerBuilder } from "fhir-test-data";

const [practitioner] = createPractitionerBuilder().locale("de").seed(1).build();
```

Generated resources include: `resourceType`, `id`, `identifier`, `name` (with locale-appropriate title prefix), `telecom` (work email), `gender`, `qualification` (MD).

### Organization

```typescript
import { createOrganizationBuilder } from "fhir-test-data";

const orgs = createOrganizationBuilder().locale("uk").count(5).seed(10).build();
```

Generated resources include: `resourceType`, `id`, `identifier`, `active: true`, `type`, `name` (e.g., "St. London Hospital"), `telecom`, `address`.

### Clinical builders

```typescript
import {
  createObservationBuilder,
  createConditionBuilder,
  createAllergyIntoleranceBuilder,
  createMedicationStatementBuilder,
} from "fhir-test-data";

const obs = createObservationBuilder()
  .subject("Patient/my-patient-id")
  .category("vital-signs")
  .seed(5)
  .build();

const conditions = createConditionBuilder()
  .subject("Patient/my-patient-id")
  .count(3)
  .seed(6)
  .build();
```

Observations use LOINC codes with `valueQuantity` in realistic clinical ranges. Conditions use SNOMED CT codes. All clinical resources require a `subject` reference — if omitted, a placeholder UUID is generated.

### Bundle builder

The Bundle builder composes all resource types into a single FHIR Bundle with automatic reference wiring.

```typescript
import { createBundleBuilder } from "fhir-test-data";

const [bundle] = createBundleBuilder()
  .locale("us")
  .seed(42)
  .type("transaction")
  .clinicalResourcesPerPatient(5)
  .build();
```

Each bundle contains 1 Patient, 1 Organization, 1 Practitioner, and N clinical resources (default 3–5). All internal references use `urn:uuid:` format and are wired consistently:
- `Patient.managingOrganization` → Organization
- `Observation.subject` → Patient
- `Observation.performer[0]` → Practitioner

Bundle types: `transaction` (entries with `request`), `collection`, `searchset` (entries with `search.mode`), `document` (treated as collection in v1).

---

## CLI reference

```
fhir-test-data generate <resource-type> [options]

Resource types:
  patient              Patient resources
  practitioner         Practitioner resources
  organization         Organization resources
  observation          Observation resources
  condition            Condition resources
  allergy-intolerance  AllergyIntolerance resources
  medication-statement MedicationStatement resources
  bundle               Bundle resources (all resource types)
  all                  One of each resource type

Options:
  --locale <code>          Locale code (default: "us")
  --count <n>              Number of resources (default: 1)
  --seed <n>               Deterministic seed
  --fhir-version <version> FHIR version: R4 | R4B | R5 (default: "R4")
  --output <dir>           Output directory (one file per resource)
  --format <fmt>           json | ndjson (default: "json")
  --pretty                 Pretty-print JSON (default for stdout)
  --no-pretty              Compact JSON
```

### FHIR version examples

```bash
# R5 patient (same locale support, same seed behaviour)
fhir-test-data generate patient --locale uk --count 3 --seed 42 --fhir-version R5

# R5 bundle — MedicationStatement is emitted as MedicationUsage
fhir-test-data generate bundle --locale us --seed 1 --fhir-version R5

# Explicit R4B (structurally identical to R4 for all generated resources)
fhir-test-data generate practitioner --locale de --fhir-version R4B
```

### Examples

```bash
# 5 UK patients, pretty JSON to stdout
fhir-test-data generate patient --locale uk --count 5 --seed 42

# AU bundles to files
fhir-test-data generate bundle --locale au --count 10 --seed 1 --output ./fixtures/

# NDJSON for bulk loading
fhir-test-data generate patient --locale us --count 1000 --format ndjson --output ./fixtures/

# One of every resource type
fhir-test-data generate all --locale de --seed 99 --output ./fixtures/

# Determinism check
fhir-test-data generate patient --locale uk --seed 42 > a.json
fhir-test-data generate patient --locale uk --seed 42 > b.json
diff a.json b.json  # empty — identical output
```

---

## Identifier validation algorithms

Each locale's patient identifiers are validated using the country's official check-digit algorithm. Generated values always pass validation.

| Algorithm | Used by | Description |
|-----------|---------|-------------|
| **Luhn** | AU (IHI, HPI-I, HPI-O), FR (RPPS), US (NPI) | Standard credit-card check — weighted sum mod 10 |
| **Modulus 11** | UK (NHS Number) | Weighted sum mod 11; check digit 10 = invalid (retry) |
| **Verhoeff** | IN (Aadhaar) | Dihedral group D5 — detects all single-digit and adjacent transposition errors |
| **11-proef** | NL (BSN) | Variant of Modulus 11 with alternating ±1 weights |
| **Modulus 97** | FR (NIR) | BigInt computation: `97 - (n mod 97)` — used in IBAN and French social security |
| **Modulus 10** | DE (LANR) | Weighted sum mod 10 on the first 6 digits |

---

## Comparison with Synthea

| | fhir-test-data | Synthea |
|---|---|---|
| Language | TypeScript | Java |
| Usage | Library + CLI | Standalone tool |
| International identifiers | Yes (8 locales) | US-only |
| Deterministic output | Yes (seeded PRNG) | Partial |
| TypeScript integration | Native types | JSON only |
| Clinical realism | Basic (LOINC/SNOMED codes) | High (disease progression) |
| Browser-safe core | Yes | No |

Use **fhir-test-data** when you need TypeScript-native, internationally correct, deterministic fixtures for unit tests, integration tests, or FHIR server load testing. Use **Synthea** when you need clinically realistic patient histories for research or simulation.

---

## Architecture

```
src/
  core/           # Browser-safe: types, generators, builders
    types.ts      # Shared interfaces and constants
    generators/   # PRNG, check-digit algorithms, identifiers, addresses, names
    builders/     # Resource builders (Patient, Practitioner, Organization, ...)
    data/         # Clinical code tables (LOINC, SNOMED CT, ...)
  locales/        # Country-specific data
    us/           # names.ts, addresses.ts, index.ts
    uk/           # ...
    ...
  cli/            # Node.js-only CLI adapter
    index.ts
    commands/
      generate.ts
```

The `src/core/` tree has no Node.js API imports — it runs in browsers, Deno, Cloudflare Workers, or any standard JS runtime. The `src/cli/` tree wraps core using `fs`, `path`, and `commander`.

---

## Complementary tools

**[fhir-resource-diff](https://github.com/dnlbox/fhir-resource-diff)** — compare FHIR resources structurally, ignoring irrelevant differences (IDs, timestamps). Natural workflow:

```bash
# Generate test fixtures
fhir-test-data generate bundle --locale uk --seed 1 --output ./fixtures/

# Validate or diff them
fhir-resource-diff compare ./fixtures/Bundle-001.json ./expected/Bundle.json
```

---

## Roadmap

**Phase 1 — Foundation (current)**
- 8 locales with check-digit-validated identifiers
- Patient, Practitioner, Organization, clinical builders
- Bundle builder with automatic reference wiring
- CLI with JSON/NDJSON output

**Phase 2 — Depth**
- ✅ R4B and R5 resource variants
- More clinical code value sets
- IPS (International Patient Summary) structure
- More locales (JP, SE, NZ, BR)

**Phase 3 — Profile-aware generation**
- US Core profile support
- UK Core profile support
- Profile-specific identifier and extension selection
- Structured validation against loaded profiles

---

---

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines and [CHANGELOG.md](CHANGELOG.md) for version history.
