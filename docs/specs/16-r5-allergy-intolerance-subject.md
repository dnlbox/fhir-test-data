---
**Status:** complete
---

# Spec 16 — Fix R5 AllergyIntolerance: `patient` → `subject`

## Goal

In FHIR R5, `AllergyIntolerance.patient` was renamed to `AllergyIntolerance.subject`. The current
version adapter does not handle this field rename. As a result, `generate allergy-intolerance
--fhir-version R5` produces a resource with a `patient` field that the fhir-resource-diff validator
correctly flags as missing the required `subject` field.

## Dependencies

- Spec 08 (clinical-builders) — complete
- Spec 15 (fhir-multi-version) — complete

## Deliverables

- `src/core/builders/version-adapters.ts` — add `patient` → `subject` rename for R5 AllergyIntolerance
- `tests/` — add or extend tests for R5 AllergyIntolerance confirming `subject` is present and `patient` is absent

## Key interfaces / signatures

No new interfaces. Extend the existing R5 adapter in `version-adapters.ts`.

The adapter already handles `AllergyIntolerance.type` (string → CodeableConcept) for R5.
Add the field rename alongside it:

```typescript
// In adaptAllergyIntoleranceToR5 (or equivalent):
if ('patient' in resource) {
  adapted.subject = resource.patient;
  delete adapted.patient;
}
```

## Implementation notes

- In R4 and R4B, the required field is `patient` (must be a Reference to Patient)
- In R5, the required field is `subject` (Reference to Patient or Group)
- The adapter must rename the field, not just copy it — `patient` must not appear in R5 output
- The reference value itself does not change, only the field name
- This follows the same pattern as the MedicationStatement → MedicationUsage rename in R5

## Acceptance criteria

```bash
# R5 AllergyIntolerance must have 'subject', not 'patient'
fhir-test-data generate allergy-intolerance --locale us --seed 1 --no-pretty --fhir-version R5 \
  | node -e "const r=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); \
    console.assert('subject' in r,'missing subject'); \
    console.assert(!('patient' in r),'patient still present')"

# Validator must confirm R5 AllergyIntolerance is valid (no 'subject' warning)
fhir-test-data generate allergy-intolerance --locale us --seed 1 --no-pretty --fhir-version R5 \
  | fhir-resource-diff validate - --fhir-version R5
# Expected: valid (no warnings about 'subject')

# R4 must still use 'patient' (no regression)
fhir-test-data generate allergy-intolerance --locale us --seed 1 --no-pretty --fhir-version R4 \
  | node -e "const r=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); \
    console.assert('patient' in r,'patient missing from R4')"
```

## Do not do

- Do not change R4 or R4B output — `patient` is correct there
- Do not rename `subject` to `patient` in R5 output
- Do not touch the `type` field adapter (already handled)
