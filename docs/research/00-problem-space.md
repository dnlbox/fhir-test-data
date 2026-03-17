# Research 00 — Problem space: FHIR test data generation

## Why FHIR test data is hard

FHIR resources are structurally complex. A single Patient resource can contain nested arrays
of identifiers, names, addresses, telecom entries, contacts, and communications — each with
their own sub-structure. Getting the shape right by hand is tedious and error-prone.

### Resource complexity

A minimal Patient for integration testing still needs:
- A valid `resourceType` and `id`
- At least one `identifier` with a `system` and `value` — and the system URI varies by country
- A `name` with `family` and `given` components (not just a flat string)
- An `address` with country-specific formatting (postal code patterns, state/province conventions)
- `gender` from a required value set
- `birthDate` in FHIR date format

A realistic Patient — the kind you need for testing against country-specific profiles like
US Core or UK Core — adds mandatory slices, required extensions, and constrained value sets.

### Cross-referencing

Clinical resources reference each other. An Observation has `subject` pointing to a Patient.
A MedicationStatement has `subject` and `context`. A Bundle containing these must have internally
consistent references — `Patient/123` in the Observation must match an actual Patient entry
in the Bundle with `id: "123"`. Hand-maintaining these references across 10–50 resources is
where most fixture bugs hide.

### Terminology bindings

FHIR profiles bind fields to specific code systems. Observations need LOINC codes for `code`
and UCUM units for `valueQuantity.unit`. Conditions need SNOMED CT codes. These aren't
free-text — they're specific coding systems with real OIDs and URIs that validators check.

### Identifier validation

This is the gap no existing tool addresses. National health identifiers have check digit
algorithms:

| Country | Identifier | Algorithm |
|---------|-----------|-----------|
| UK | NHS Number | Modulus 11 |
| Australia | IHI | Luhn |
| Australia | Medicare | Check digit |
| India | Aadhaar | Verhoeff |
| Netherlands | BSN | 11-proef |
| Canada | Provincial HCN | Varies by province |
| Germany | KVID | Format validation |

If your test fixture has an NHS Number that fails Modulus 11, your downstream validator
will reject it — not because your code is wrong, but because your test data is wrong.
This is a common source of false failures in FHIR integration test suites.

## What exists today

### Synthea (Java)

[Synthea](https://github.com/synthetichealth/synthea) is the gold standard for synthetic
patient data generation. It produces complete patient histories with encounters, conditions,
observations, medications, and more.

Limitations for our use case:
- **Java-only.** Cannot be called from a TypeScript test suite. You run it as a separate
  process and consume the output files.
- **Bulk generation, not a library.** Generates full patient timelines. You cannot say
  "give me a Patient resource with these specific characteristics for this test case."
- **US-focused.** International support exists but is limited. Identifier generation for
  UK, Australia, India, Netherlands, etc. is not a strength.
- **Heavy.** Requires Java runtime, downloads terminology files, takes seconds to minutes
  per run. Not suitable for "generate a fixture in my test setup function."

### fhir-gen (TypeScript, abandoned)

The only TypeScript FHIR data generator that existed. Last meaningful activity years ago.
No country-specific identifier support. No active maintenance.

### Hand-rolled fixtures

This is what most teams actually do:
1. Copy a Patient example from the FHIR specification or a profile IG
2. Manually change the `id`, name, and a few fields
3. Hardcode a known-valid identifier from the spec documentation
4. Hope the structure is correct
5. When a test breaks, debug whether it's the code or the fixture

Problems:
- Fixtures drift from real-world data structures over time
- Same 3–4 example patients get reused across entire test suites
- No variation in demographics, identifiers, or clinical content
- Cross-references are brittle and break when fixtures are modified
- Country-specific identifiers are usually copy-pasted constants, not generated

## The international gap

No existing tool generates identifiers with correct check digits across countries.
This matters because:

1. **Country-specific FHIR profiles are the norm, not the exception.** US Core, UK Core,
   AU Core, CA Baseline, German ISiK, Indian ABDM — each requires specific identifier
   systems with specific validation rules.
2. **Testing against real validators requires valid identifiers.** A UK Core validator
   will flag an NHS Number that doesn't pass Modulus 11. Your test will fail, but not
   because of a bug in your code.
3. **International teams need international test data.** A team building a multi-country
   EHR needs test Patients with valid NHS Numbers, Medicare numbers, and BSN identifiers
   — not just US SSN patterns.

## The growing TypeScript FHIR ecosystem

The TypeScript FHIR ecosystem is real and growing:

| Package | Weekly downloads | Signal |
|---------|-----------------|--------|
| `@types/fhir` | ~95K/week | Type definitions for FHIR resources |
| `@medplum/core` | ~59K/week | Full FHIR platform client |
| FHIR-related GitHub repos | 963+ | Using TypeScript FHIR types |

This is a community that writes FHIR code in TypeScript, has type definitions, has
client libraries — but lacks a test data generation tool. The gap is specific and fillable.

## Where fhir-test-data fits

fhir-test-data fills the specific gap of **programmatic, country-aware FHIR test data
generation in TypeScript**:

- **Library-first**: import it in your test file, call a builder, get a valid FHIR resource
- **Country-aware**: pass a locale, get identifiers with correct check digits
- **Deterministic**: pass a seed, get the same output every time (important for snapshot tests)
- **Composable**: builders for individual resources, plus a Bundle builder that handles
  cross-references
- **CLI included**: generate fixture files for teams that prefer static test data

Together with fhir-resource-diff, this creates a natural workflow:
1. **Generate** test data with fhir-test-data
2. **Validate and diff** resources with fhir-resource-diff
3. Both are TypeScript-first, browser-safe at the core, and designed for the same audience
