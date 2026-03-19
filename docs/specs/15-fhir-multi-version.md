# Spec 15 — FHIR multi-version support (R4 / R4B / R5)

**Status:** complete

## Goal

Allow every builder and the CLI to target a specific FHIR version. Generated resources
must be structurally correct for the chosen version — not just labelled with a version
string but actually conformant in field names, value sets, and resource type names.

## Dependencies

- Spec 05 (patient-builder) — builder pattern established
- Spec 08 (clinical-builders) — MedicationStatement and AllergyIntolerance are the
  primary resources with structural differences across versions
- Spec 09 (bundle-builder) — must propagate version to all contained resources
- Spec 10 (CLI) — `--fhir-version` option added here

## Deliverables

| File | Action |
|------|--------|
| `src/core/builders/version-adapters.ts` | New — pure functions that adapt an R4 resource to R4B or R5 |
| `src/core/builders/patient.ts` | Add `fhirVersion()` method |
| `src/core/builders/practitioner.ts` | Add `fhirVersion()` method |
| `src/core/builders/organization.ts` | Add `fhirVersion()` method |
| `src/core/builders/observation.ts` | Add `fhirVersion()` method |
| `src/core/builders/condition.ts` | Add `fhirVersion()` method |
| `src/core/builders/allergy-intolerance.ts` | Add `fhirVersion()` method + R5 adapter |
| `src/core/builders/medication-statement.ts` | Add `fhirVersion()` method + R5 adapter |
| `src/core/builders/bundle.ts` | Add `fhirVersion()` method, propagate to sub-builders |
| `src/cli/commands/generate.ts` | Add `--fhir-version` option, validate and thread through |
| `tests/builders/medication-statement.test.ts` | R5 output tests |
| `tests/builders/allergy-intolerance.test.ts` | R5 output tests |
| `tests/builders/bundle.test.ts` | R5 propagation test |
| `tests/cli/generate.test.ts` | `--fhir-version` acceptance tests |
| `CHANGELOG.md` | Document the feature |
| `README.md` | Document `fhirVersion()` API and `--fhir-version` CLI flag |

## Version differences — what changes

### R4 → R4B

R4B was a "technical correction" release. For the resources we generate, **the output
structure is identical**. We accept `"R4B"` as a valid version value and pass it
through without structural change. Future specs may introduce R4B-specific codings.

### R4 / R4B → R5

R5 has two meaningful structural changes in our resource set:

#### MedicationStatement → MedicationUsage

| Field | R4 / R4B | R5 |
|-------|----------|----|
| `resourceType` | `"MedicationStatement"` | `"MedicationUsage"` |
| Medication field | `medicationCodeableConcept: CodeableConcept` | `medication: { concept: CodeableConcept }` |
| `status` (initial) | `"active"` | `"recorded"` |

R5 `status` values: `recorded \| active \| completed \| entered-in-error \| on-hold \| unknown`

#### AllergyIntolerance.type

| Field | R4 / R4B | R5 |
|-------|----------|----|
| `type` | `"allergy" \| "intolerance"` (code) | `CodeableConcept` |

R5 form:
```json
"type": {
  "coding": [{
    "system": "http://hl7.org/fhir/allergy-intolerance-type",
    "code": "allergy",
    "display": "Allergy"
  }]
}
```

All other resources (Patient, Practitioner, Organization, Observation, Condition, Bundle)
produce structurally identical output across all three versions for the fields we generate.

## Key interfaces / signatures

### Builder method (all builders)

```typescript
fhirVersion(version: FhirVersion): this;
```

### version-adapters.ts

```typescript
import type { FhirResource, FhirVersion } from "@/core/types.js";

/**
 * Adapt a resource built against R4 to the target FHIR version.
 * Returns the original object unchanged for R4 and R4B.
 * For R5, applies structural changes (renamed fields, updated resource types).
 */
export function adaptToVersion(resource: FhirResource, version: FhirVersion): FhirResource;
```

Internal adapter functions (not exported):
- `adaptMedicationStatementToR5(r: FhirResource): FhirResource`
- `adaptAllergyIntoleranceToR5(r: FhirResource): FhirResource`

### Builder state pattern

Every builder state gains one field:

```typescript
interface XBuilderState {
  // ... existing fields ...
  fhirVersion: FhirVersion;
}
```

Default: `"R4"`.

The `build()` method applies `adaptToVersion(resource, state.fhirVersion)` after
construction and before applying overrides.

### Bundle builder propagation

The bundle builder threads `fhirVersion` into every sub-builder call:

```typescript
createPatientBuilder().locale(l).seed(s).fhirVersion(state.fhirVersion).build()
createMedicationStatementBuilder().subject(ref).seed(s).fhirVersion(state.fhirVersion).build()
// ... etc
```

### CLI option

```
--fhir-version <version>   FHIR version to target: R4 | R4B | R5 (default: "R4")
```

Validated against `SUPPORTED_FHIR_VERSIONS`. Unknown version → `stderr` message, exit 1.

## Implementation notes

- Builders continue to generate R4 structure internally. `adaptToVersion` is the single
  seam where version differences are applied. This keeps build functions simple and
  makes future version additions a one-file change.
- `adaptToVersion` is a no-op for R4 (returns reference unchanged) and R4B (same).
  Only R5 performs structural mutation.
- Overrides are applied **after** version adaptation, so callers can still patch any
  field on the final resource regardless of version.
- The `MedicationStatementBuilder` interface name does not change — it builds the
  "medication activity" concept regardless of what FHIR calls the resource in each
  version. The CLI command name `medication-statement` also stays.

## Acceptance criteria

```bash
pnpm typecheck   # passes
pnpm lint        # passes
pnpm test        # all existing + new tests pass
pnpm build       # succeeds
```

### Functional checks

```bash
# R4 (default) — unchanged behaviour
fhir-test-data generate medication-statement --seed 1 \
  | jq '.[0].resourceType'
# "MedicationStatement"

# R5 — renamed resource and restructured medication field
fhir-test-data generate medication-statement --seed 1 --fhir-version R5 \
  | jq '.[0] | {rt: .resourceType, med: .medication.concept.coding[0].code}'
# { "rt": "MedicationUsage", "med": "<rxnorm-code>" }

# R5 AllergyIntolerance — type is CodeableConcept
fhir-test-data generate allergy-intolerance --seed 1 --fhir-version R5 \
  | jq '.[0].type'
# { "coding": [{ "system": "...", "code": "allergy", "display": "Allergy" }] }

# Unknown version → exit 1
fhir-test-data generate patient --fhir-version R6 2>&1
# Error: unknown FHIR version "R6". Supported versions: R4, R4B, R5

# Bundle R5 — contained MedicationUsage
fhir-test-data generate bundle --seed 1 --fhir-version R5 \
  | jq '[.[0].entry[].resource.resourceType]'
# should contain "MedicationUsage", not "MedicationStatement"

# Same seed, different version — deterministic within each version
fhir-test-data generate patient --locale uk --seed 42 --fhir-version R5 > a.json
fhir-test-data generate patient --locale uk --seed 42 --fhir-version R5 > b.json
diff a.json b.json   # empty
```

## Tests to write

- `medication-statement.test.ts`: R5 — `resourceType === "MedicationUsage"`
- `medication-statement.test.ts`: R5 — `medication.concept` present, `medicationCodeableConcept` absent
- `medication-statement.test.ts`: R5 — `status === "recorded"`
- `allergy-intolerance.test.ts`: R5 — `type` is an object with `coding` array
- `allergy-intolerance.test.ts`: R5 — `type` code value preserved inside coding
- `bundle.test.ts`: R5 — no entry with `resourceType === "MedicationStatement"`
- `generate.test.ts`: `--fhir-version R5` produces `MedicationUsage`
- `generate.test.ts`: unknown version exits 1

## Do not do

- Do not change the `MedicationStatementBuilder` interface name.
- Do not add R4B-specific structural changes — R4B is structurally identical to R4
  for our resource set.
- Do not add `meta.profile` URLs — profile conformance is out of scope for this spec.
- Do not rename the CLI command `medication-statement` to `medication-usage`.
- Do not rewrite builders from scratch — only add the `fhirVersion` field and wire
  the adapter call.
