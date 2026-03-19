# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **FHIR multi-version support** — all builders now accept a `.fhirVersion("R4" | "R4B" | "R5")`
  method. The default is `"R4"` and existing behaviour is unchanged.
- **CLI `--fhir-version` flag** — `fhir-test-data generate <type> --fhir-version R5` targets
  the specified version. Unknown versions exit 1 with an error message.
- **R5 structural adaptations** — two resources change shape for R5:
  - `MedicationStatement` → `MedicationUsage`: resource type renamed, medication field
    restructured from `medicationCodeableConcept` to `medication.concept`, initial
    status changed to `"recorded"`.
  - `AllergyIntolerance.type`: changed from a plain code string (`"allergy"`) to a
    `CodeableConcept` object with a `coding` array.
- **R4B support** — accepted as a valid version; generates identical structure to R4
  for all resources this library produces (R4B structural differences do not affect
  the fields we generate).
- `src/core/builders/version-adapters.ts` — centralised adapter module. All version
  differences are applied in one place after resource construction, keeping individual
  builders version-agnostic.
