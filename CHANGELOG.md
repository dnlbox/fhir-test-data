# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Bundle recipes: `generate bundle --recipe <file>` now accepts user-defined YAML or JSON recipes for deterministic, pipeline-oriented Bundle generation. Recipes define ordered resources, aliases, field overrides, and reference wiring while keeping clinical meaning user-owned.
- Public recipe API: `createBundleFromRecipe(recipe, options)` plus exported recipe types.
- Starter recipe examples under `examples/recipes/` for lab result, condition plus medication, and diagnostic workup bundle shapes.

## [0.2.0] - 2026-06-01

### Added

- Detailed breakdown of resources generated inside a Bundle logged to `stderr` when `--output` is specified, keeping standard output clean and pipe-safe.
- `--version` long flag (alias for `-V`). Matches the `fhir-resource-diff` and `fhir-capability-analyzer` CLIs, which already supported both forms.
- Dev: lefthook pre-commit hooks (typecheck + lint + test in parallel). Brings this repo to parity with `fhir-resource-diff` and `fhir-capability-analyzer`, which already gate local commits the same way.

### Fixed

- `describe encounter` and `describe diagnostic-report` no longer error with "unknown resource type". The `describe` command now lists the same resource types that `generate` supports (encounter and diagnostic-report were added as generators in 0.1.3 but missed in `describe`).

### Changed

- Dev: migrated pnpm config from `package.json` `pnpm.onlyBuiltDependencies` (removed in pnpm 11) to `pnpm-workspace.yaml` `allowBuilds`. `packageManager` and `engines.pnpm` bumped to pnpm 11. No user-facing behaviour change; published package surface is identical.
- **BREAKING**: minimum Node version raised from 20 to 22 (`engines.node >=22.0.0`). Driven by upstream pnpm 11.x dropping Node 20 support (uses `node:sqlite`, available in Node 22.13+ only). `@types/node` bumped to `^24` (LTS line).
- Upgraded CLI framework `commander` 12→14. No user-facing behaviour change expected; `--help`, `--version`, and subcommand signatures (`generate <resource-type>`, `locales`, `describe`) are unchanged. If `--help` output formatting shifts (whitespace), it is upstream cosmetic.
- Dev: bumped typescript 5.9→6 (added tsconfig flags for tsup DTS compatibility). vitest stays at 3.x; vitest 4 deferred across the workspace pending vitepress 2 stable (vitepress 1 pins vite 5; vitest 4 requires vite 6+). No user-facing behaviour change.
- Dev: bumped eslint to 10; removed unused zod dependency. No user-facing behaviour change.

## [0.1.3] - 2026-04-24

### Added

- **Encounter builder** (`createEncounterBuilder`) — generates HL7 FHIR R4/R4B/R5 Encounter resources with status, class (HL7 v3 ActCode), and type (SNOMED CT). Status and period fields are consistent: planned encounters have no period, open encounters have start only, closed encounters have start and end. R5 adapter converts `class` from Coding to CodeableConcept array per spec.
- **DiagnosticReport builder** (`createDiagnosticReportBuilder`) — generates HL7 FHIR R4/R4B/R5 DiagnosticReport resources with status, LOINC report code, and HL7 v2-0074 category. Category is matched to the selected report code for consistency.
- **`missing-status` fault** — removes the `status` field from any clinical resource. Triggers a required-field warning in `fhir-resource-diff validate`.
- **`invalid-status-value` fault** — sets `status` to a value not in any FHIR ValueSet. Triggers a status-value warning in `fhir-resource-diff validate`.
- CLI `generate` command now accepts `encounter` and `diagnostic-report` as resource type arguments.
- `llms.txt` created with full library API, locale table, fault types, and cross-references to `fhir-resource-diff` and `fhir-capability-analyzer`.

### Changed

- README: added "What is FHIR?" section, Encounter and DiagnosticReport in the feature description, ecosystem table with all three sister tools, pipeline integration examples, and Development section.

## [0.1.2] - 2026-03-21

### Fixed

- **Deno compatibility** — tsup/esbuild silently strips the `node:` prefix from
  built-in imports in the bundle output, so `import { createRequire } from "node:module"`
  became `import { createRequire } from "module"` in the dist files, which Deno rejects.
  The real fix eliminates the `createRequire` import entirely: the package version is now
  read from `package.json` at build time in `tsup.config.ts` and injected as
  `__PACKAGE_VERSION__` via esbuild's `define` option. The version becomes a plain inlined
  string in the bundle with no runtime Node.js built-in import.

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

[Unreleased]: https://github.com/dnlbox/fhir-test-data/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/dnlbox/fhir-test-data/compare/v0.1.3...v0.2.0
[0.1.3]: https://github.com/dnlbox/fhir-test-data/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/dnlbox/fhir-test-data/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/dnlbox/fhir-test-data/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/dnlbox/fhir-test-data/releases/tag/v0.1.0
