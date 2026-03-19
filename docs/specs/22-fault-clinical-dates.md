# Spec 22 — Extend malformed-date fault to clinical resource date fields

**Status:** complete

## Goal

Extend the `malformed-date` fault strategy so it corrupts the primary date field of any supported FHIR resource type, not just `Patient.birthDate`.

## Dependencies

- Spec 14 (fault injection infrastructure)

## Deliverables

- Modified: `src/core/faults/registry.ts` — updated `malformedDate` strategy
- New: `tests/faults/clinical-dates.test.ts` — coverage for all supported resource types

## Key behaviour

1. Look up `PRIMARY_DATE_FIELD[r.resourceType]` to find the primary date field.
2. If that field exists on the resource, set it to `"not-a-date"` and return.
3. Fallback scan: if the primary field is absent, check all keys ending in `Date`/`DateTime`, or any `*Period` key with a `.start` sub-field — corrupt the first match found.
4. If nothing found → silent no-op.

## Primary date field map

| Resource type       | Primary field        |
|---------------------|----------------------|
| Patient             | birthDate            |
| Observation         | effectiveDateTime    |
| Condition           | onsetDateTime        |
| AllergyIntolerance  | recordedDate         |
| MedicationStatement | effectiveDateTime    |
| MedicationUsage     | effectiveDateTime    |
| Immunization        | occurrenceDateTime   |

Note: `MedicationStatement` uses `effectivePeriod` (not `effectiveDateTime`) in the builder, so the fallback scan handles it via `effectivePeriod.start`.

## Acceptance criteria

- `pnpm typecheck && pnpm lint && pnpm test && pnpm build` all pass.
- `tests/faults/clinical-dates.test.ts` passes with 12 tests covering Observation, Condition, AllergyIntolerance, MedicationStatement, Patient, and Organization.
