# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-03-19

### Added

- **Fluent builder API** — immutable method chaining for all resource types.
  Each builder method returns a new instance; chains are composable and safe to
  reuse across tests.
- **Patient builder** — generates Patient resources with locale-appropriate
  identifiers, names, addresses, telecom, gender, birthDate, and communication
  entries.
- **Practitioner builder** — generates Practitioner resources with locale-appropriate
  professional identifiers, names with title prefixes, work email, and MD qualification.
- **PractitionerRole builder** — links a Practitioner to an Organization with a
  coded role and specialty.
- **Organization builder** — generates Organization resources with locale-appropriate
  identifiers, names, addresses, and telecom.
- **Observation builder** — generates LOINC-coded Observation resources (vital signs
  and lab results) with realistic `valueQuantity` ranges and UCUM units. Requires a
  `subject` reference.
- **Condition builder** — generates SNOMED-CT-coded Condition resources with clinical
  status and onset date. Requires a `subject` reference.
- **AllergyIntolerance builder** — generates SNOMED-CT-coded AllergyIntolerance
  resources with type, category, criticality, and reaction. Requires a `subject`
  reference.
- **MedicationStatement builder** — generates MedicationStatement resources with
  a medication code, status, and effective period. Requires a `subject` reference.
- **Bundle builder** — composes all resource types into a single FHIR Bundle with
  automatic reference wiring. All internal references use `urn:uuid:` format.
  Supports `transaction`, `collection`, and `searchset` bundle types.
- **FHIR multi-version support** — all builders accept `.fhirVersion("R4" | "R4B" | "R5")`.
  Default is `"R4"`. R4B is structurally identical to R4 for all generated resources.
  R5 applies two structural adaptations:
  - `MedicationStatement` → `MedicationUsage`: resource type renamed, medication field
    restructured from `medicationCodeableConcept` to `medication.concept`.
  - `AllergyIntolerance.type`: changed from a plain code string to a `CodeableConcept`
    with a `coding` array.
- **Seeded deterministic generation** — the `.seed(n)` method guarantees that the
  same seed always produces the same output, across runs, machines, and Node versions.
  Built on a seedable PRNG with no Math.random() dependency.
- **14 locales** — country-specific name pools, address formats, and identifier systems
  for: `us`, `uk`, `au`, `ca`, `de`, `fr`, `nl`, `in`, `jp`, `kr`, `sg`, `br`, `mx`, `za`.
- **Check-digit-validated identifiers** — all patient and practitioner identifiers
  pass their country's official check-digit algorithm: Luhn (AU, FR, US), Modulus 11
  (UK NHS), Verhoeff (IN Aadhaar), 11-proef (NL BSN), Modulus 97 (FR NIR),
  Modulus 10 (DE LANR).
- **Fault injection** — the `fhir-test-data/faults` subpath export allows generating
  intentionally invalid resources for testing error paths, validation pipelines, and
  rejection behaviour.
- **CLI `generate` command** — `fhir-test-data generate <type>` produces resources to
  stdout or a file directory. Supports `--locale`, `--count`, `--seed`, `--fhir-version`,
  `--output`, `--format` (json/ndjson), `--pretty` / `--no-pretty`.
- **Browser-safe core** — `src/core/` has no Node.js API imports and runs in browsers,
  Deno, and Cloudflare Workers without configuration.

[Unreleased]: https://github.com/dnlbox/fhir-test-data/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/dnlbox/fhir-test-data/releases/tag/v0.1.0
