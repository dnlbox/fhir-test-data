---
**Status:** complete
---

# Spec 17 — Include PractitionerRole in `generate all`

## Goal

`PractitionerRole` is a supported resource with a complete builder (spec 06), but it is excluded
from `generate all`. The command currently generates 8 types: Patient, Practitioner, Organization,
Observation, Condition, AllergyIntolerance, MedicationStatement, Bundle. PractitionerRole is missing.

This means `generate all` is not actually generating all supported resource types, which is
misleading and reduces test coverage.

## Dependencies

- Spec 06 (practitioner-builder) — complete
- Spec 10 (cli) — complete

## Deliverables

- `src/cli/commands/generate.ts` — add PractitionerRole to the `all` type expansion
- `tests/cli/` — verify `generate all` produces 9 resources including PractitionerRole

## Key interfaces / signatures

In `generate.ts`, find the `all` resource type expansion and add `practitioner-role`:

```typescript
const ALL_RESOURCE_TYPES = [
  'patient',
  'practitioner',
  'practitioner-role',   // ← add this
  'organization',
  'observation',
  'condition',
  'allergy-intolerance',
  'medication-statement',
  'bundle',
];
```

## Implementation notes

- PractitionerRole requires a reference to a Practitioner — the builder should generate one using
  the seeded PRNG so references are internally consistent within the same seed
- Check whether the bundle builder already includes PractitionerRole in the bundle; if not, that
  is out of scope for this spec
- The output count for `generate all` will increase from 8 to 9

## Acceptance criteria

```bash
# generate all must produce 9 resources
fhir-test-data generate all --locale us --seed 1 --no-pretty \
  | wc -l
# Expected: 9

# PractitionerRole must be among them
fhir-test-data generate all --locale us --seed 1 --no-pretty \
  | node -e "const lines=require('fs').readFileSync('/dev/stdin','utf8').trim().split('\n'); \
    const types=lines.map(l=>JSON.parse(l).resourceType); \
    console.assert(types.includes('PractitionerRole'),'missing PractitionerRole'); \
    console.log(types)"

# Validate all 9 resources — must be valid
fhir-test-data generate all --locale us --seed 1 --no-pretty \
  | fhir-resource-diff validate -
# Expected: 9 resources: 9 valid, 0 invalid
```

## Do not do

- Do not change the structure of existing builders
- Do not add PractitionerRole to the bundle builder (separate concern)
- Do not add other missing resource types (e.g. Coverage, Encounter) — out of scope
