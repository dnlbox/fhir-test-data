# Ecosystem

`fhir-test-data` is one of two tools in the `dnlbox` FHIR toolchain. They are designed
to complement each other in a typical FHIR development workflow.

---

## dnlbox FHIR toolchain

| Tool | What it does |
|------|-------------|
| **fhir-test-data** (this) | Generate valid FHIR test resources with country-aware identifiers |
| **[fhir-resource-diff](https://dnlbox.github.io/fhir-resource-diff/)** | Diff, validate, and inspect FHIR resources |

### Natural workflow

```bash
# 1. Generate test fixtures
fhir-test-data generate bundle --locale uk --seed 1 --output ./fixtures/

# 2. Validate the generated output
fhir-resource-diff validate ./fixtures/Bundle-0001.json --fhir-version R4

# 3. Compare against a baseline after a library upgrade
fhir-resource-diff compare ./fixtures/Bundle-0001.json ./baseline/Bundle-0001.json
```

---

## TypeScript FHIR ecosystem

How `fhir-test-data` fits relative to other tools in the TypeScript/JavaScript FHIR ecosystem:

| Tool | Purpose | Locale support | Deterministic | TypeScript-native | Browser-safe |
|------|---------|---------------|---------------|-------------------|-------------|
| **fhir-test-data** | Test data generation | 14 locales | Yes (seeded) | Yes | Yes |
| [Synthea](https://github.com/synthetichealth/synthea) | Clinically realistic patient simulation | US only | Partial | No (Java) | No |
| [@types/fhir](https://www.npmjs.com/package/@types/fhir) | FHIR TypeScript types only | — | — | Yes | Yes |
| [@medplum/core](https://www.npmjs.com/package/@medplum/core) | FHIR client + utilities | — | — | Yes | Partial |
| [fhirclient](https://www.npmjs.com/package/fhirclient) | SMART on FHIR client | — | — | Yes | Yes |

### When to use fhir-test-data

- You need **TypeScript-native** test data generation (no Java runtime, no CLI wrapper)
- You need **internationally correct** identifiers (NHS numbers, BSNs, Aadhaar, etc.)
- You need **deterministic** fixtures — the same seed gives the same data across CI runs
- You need a **browser-safe** library for testing in non-Node environments
- You need a **CLI** for generating fixture files without writing code

### When to use Synthea instead

- You need **clinically realistic patient histories** with disease progression over time
- You need **research-grade** synthetic data that models epidemiology and care pathways
- US-only identifiers are acceptable for your use case
- Clinical simulation accuracy matters more than TypeScript integration

---

## HL7 FHIR specification

This library generates resources conformant with:

- **FHIR R4** — https://hl7.org/fhir/R4/
- **FHIR R4B** — https://hl7.org/fhir/R4B/
- **FHIR R5** — https://hl7.org/fhir/R5/

For full schema validation and profile conformance checking, use the
[HL7 FHIR Validator](https://confluence.hl7.org/display/FHIR/Using+the+FHIR+Validator).
`fhir-test-data` generates structurally valid resources; it is not a conformance validator.
