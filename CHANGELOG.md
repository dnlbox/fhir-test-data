# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.2] - 2026-03-21

### Fixed

- **Deno compatibility** — `import { createRequire } from "module"` is now
  `import { createRequire } from "node:module"`. Deno requires the `node:` prefix
  for Node.js built-in modules. Node.js 18+ also accepts the prefix, so this is
  fully backwards-compatible.

## [0.1.1] - 2026-03-21

### Fixed

- **CLI version flag** — the version string passed to Commander was hardcoded as `"0.1.0"`.
  It now uses `createRequire(import.meta.url)` to load the `version` field from `package.json`
  at runtime, so `-V` always reflects the published package version.
- **`--count` validation (spec 29)** — `generate --count 0`, `--count -1`, and `--count abc`
  now exit with code 1 and a clear error message to stderr instead of silently outputting an
  empty array. Numeric values are displayed unquoted; non-numeric strings are quoted.
  Example: `Error: --count must be a positive integer, got 0`
- **`--annotate` pipeline hint (spec 30)** — When `--annotate` is used and stdout is a TTY
  (interactive terminal), a hint is printed to stderr explaining that piping to
  `fhir-resource-diff validate` requires extracting `.resource` first via `jq '.resource'`.
  The hint is suppressed when stdout is piped — it never appears in pipe output.
  The `--annotate` help text now documents the `{ resource, notes }` wrapper shape and the
  required `jq` workaround for pipeline use.

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

[Unreleased]: https://github.com/dnlbox/fhir-test-data/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/dnlbox/fhir-test-data/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/dnlbox/fhir-test-data/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/dnlbox/fhir-test-data/releases/tag/v0.1.0
