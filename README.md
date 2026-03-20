# fhir-test-data

[![CI](https://github.com/dnlbox/fhir-test-data/actions/workflows/ci.yml/badge.svg)](https://github.com/dnlbox/fhir-test-data/actions/workflows/ci.yml)
[![CodeQL](https://github.com/dnlbox/fhir-test-data/actions/workflows/codeql.yml/badge.svg)](https://github.com/dnlbox/fhir-test-data/actions/workflows/codeql.yml)
[![npm](https://img.shields.io/npm/v/fhir-test-data)](https://www.npmjs.com/package/fhir-test-data)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Generate valid FHIR R4 / R4B / R5 test resources with country-aware identifiers — from the CLI, a TypeScript library, or any tool that reads from a pipe.

---

## Why this exists

FHIR development requires realistic test data, but building it by hand is tedious and error-prone. Most teams either copy production data (a compliance risk) or write custom generators that hardcode US-centric identifiers — useless if your system needs to handle UK NHS numbers, Dutch BSNs, Korean RRNs, or Brazilian CPFs.

**fhir-test-data** generates structurally valid FHIR resources across 14 locales, with identifiers that pass each country's official check-digit algorithm. Clinical resources use real LOINC codes with values in realistic clinical ranges and HL7-consistent units of measurement, and SNOMED CT codes for conditions — so the data makes sense medically, not just structurally. All output is seeded and deterministic — the same seed always produces the same data, anywhere it runs.

---

## Quick start

### CLI

No install required — run directly with `npx`:

```bash
npx fhir-test-data generate patient --locale uk --count 5 --seed 42
```

Or install globally for repeated use:

```bash
pnpm add -g fhir-test-data
# or
npm install -g fhir-test-data

# Generate 5 UK patients to stdout
fhir-test-data generate patient --locale uk --count 5 --seed 42

# Generate a full bundle to a fixtures directory
fhir-test-data generate bundle --locale au --seed 1 --output ./fixtures/
```

### Library

```bash
pnpm add fhir-test-data
```

```typescript
import { createPatientBuilder, createBundleBuilder } from "fhir-test-data";

const [patient] = createPatientBuilder().locale("uk").seed(42).build();

const [bundle] = createBundleBuilder()
  .locale("us")
  .seed(42)
  .type("transaction")
  .clinicalResourcesPerPatient(5)
  .build();
```

---

## CLI-first, pipe-friendly, AI-friendly

The CLI writes to stdout by default — making it a natural fit for shell pipelines, scripting, and AI-assisted workflows. Combine it with `jq`, FHIR validators, load testing tools, or large language models without any glue code.

```bash
# Inspect a generated resource with jq
fhir-test-data generate patient --locale uk --seed 42 | jq '.identifier[0]'

# Stream NDJSON into a validator or ingest tool
fhir-test-data generate patient --count 100 --format ndjson | your-fhir-validator --stream

# POST to a FHIR server
fhir-test-data generate patient --locale nl --seed 1 | \
  curl -s -X POST https://your-fhir-server/Patient \
    -H "Content-Type: application/fhir+json" -d @-

# Ask an AI assistant to explore or explain a generated bundle
fhir-test-data generate bundle --locale kr --seed 5 | \
  llm "summarise the clinical findings in this FHIR bundle"

# Generate NDJSON for bulk load testing
fhir-test-data generate patient --locale us --count 1000 --format ndjson --no-pretty \
  > patients.ndjson

# Loop across locales in a CI step
for locale in us uk au de fr nl; do
  fhir-test-data generate bundle --locale $locale --seed 1 --output "./fixtures/$locale/"
done
```

Because output goes to stdout by default, there is nothing to configure — drop it into any pipeline that reads JSON or NDJSON.

---

## Supported locales

14 locales with check-digit-validated identifiers and locale-appropriate names, addresses, and phone formats:

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
| Japan | `jp` | Hospital MRN | Format validation | Doctor License |
| South Korea | `kr` | RRN | Format + gender encoding | MOHW Doctor License |
| Mexico | `mx` | CURP | Format validation | Cédula Profesional |
| Brazil | `br` | CPF | Modulus 11 variant | CRM |
| Singapore | `sg` | NRIC / FIN | Check letter | SMC Registration |
| South Africa | `za` | SA ID Number | Luhn | HPCSA Registration |

Identifier validation is baked in — generated values always pass the official algorithm for their country. The library also includes tools like [fhir-resource-diff](https://github.com/dnlbox/fhir-resource-diff) for structural comparison and validation of generated fixtures.

---

## Clinical code quality

Observations use real LOINC codes with `valueQuantity` in clinically plausible ranges and HL7-consistent units of measurement (e.g. `mm[Hg]` for blood pressure, `kg/m2` for BMI). Conditions use SNOMED CT codes. AllergyIntolerance resources include coded substances. The goal is data that makes sense to a clinician, not just data that passes a schema validator.

---

## Seeded determinism

The same seed produces identical output on any machine, any Node version, any CI environment:

```bash
fhir-test-data generate patient --locale uk --seed 42 > a.json
fhir-test-data generate patient --locale uk --seed 42 > b.json
diff a.json b.json  # empty — identical output
```

Reliable for snapshot tests, golden file comparison, and regression test fixtures.

---

## Multi-version FHIR support

All builders target R4 (default), R4B, or R5. R5 structural adaptations are applied automatically — `MedicationStatement` becomes `MedicationUsage`, and `AllergyIntolerance.type` becomes a `CodeableConcept`.

```bash
fhir-test-data generate bundle --locale us --seed 1 --fhir-version R5
```

---

## Bundle builder

The Bundle builder composes all resource types into a single FHIR Bundle with automatic reference wiring using `urn:uuid:` format:

```typescript
const [bundle] = createBundleBuilder()
  .locale("uk")
  .seed(1)
  .type("transaction")
  .clinicalResourcesPerPatient(5)
  .build();
```

Each bundle includes: Patient, Organization, Practitioner, PractitionerRole, and N clinical resources (Observations, Conditions, AllergyIntolerance, MedicationStatement). All internal references are consistent — `Observation.subject` → Patient, `Observation.performer[0]` → Practitioner, `Patient.managingOrganization` → Organization.

---

## Fault injection

Generate intentionally invalid resources for testing validation pipelines and error handlers:

```typescript
import { withFault } from "fhir-test-data/faults";

const [invalid] = withFault(
  createPatientBuilder().locale("uk").seed(42),
  "missing-resource-type"
).build();
```

---

## Comparison with Synthea

[Synthea](https://github.com/synthetichealth/synthea) is a fantastic open-source patient generator that produces clinically realistic longitudinal patient histories — disease progression, care pathways, medication histories — and has been hugely valuable for healthcare research and simulation work.

fhir-test-data serves a different need: TypeScript-native, internationally correct, deterministic fixtures for developer testing workflows.

| | fhir-test-data | Synthea |
|---|---|---|
| Language | TypeScript | Java |
| Usage | Library + CLI | Standalone tool |
| International identifiers | 14 locales | US-only |
| Deterministic output | Yes (seeded PRNG) | Partial |
| TypeScript integration | Native types | JSON only |
| Clinical realism | Coded LOINC/SNOMED values | High (disease progression) |
| Browser-safe core | Yes | No |
| Pipe-friendly CLI | Yes | No |

Use **fhir-test-data** when you need TypeScript-native, internationally correct, deterministic fixtures for unit tests, integration tests, CI pipelines, or FHIR server load testing. Use **Synthea** when you need clinically realistic patient histories with disease progression for research or simulation.

---

## Related resources

**[fhir-resource-diff](https://github.com/dnlbox/fhir-resource-diff)** — compare FHIR resources structurally, ignoring irrelevant differences like IDs and timestamps. A natural companion for validating that generated fixtures stay stable across library upgrades:

```bash
# Generate fixtures
fhir-test-data generate bundle --locale uk --seed 1 --output ./fixtures/

# Compare against a committed baseline
fhir-resource-diff compare ./fixtures/Bundle-001.json ./baseline/Bundle-001.json
```

---

## Documentation

Full API reference, locale details, fault injection guide, and VitePress documentation at [dnlbox.github.io/fhir-test-data](https://dnlbox.github.io/fhir-test-data).

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines and [CHANGELOG.md](CHANGELOG.md) for version history.
