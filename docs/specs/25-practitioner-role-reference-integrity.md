---
**Status:** open
---

# Spec 25 — PractitionerRole reference integrity and bundle inclusion

## Goal

Two issues discovered during integration testing:

**1. Broken Practitioner reference in `generate all`**
`PractitionerRole.practitioner.reference` points to a different Practitioner ID than the one
actually generated in the same `generate all` session. With seed 42:

```
Practitioner ID:          Practitioner/00000000-327f-4802-a9c5-000000007885
PractitionerRole ref:     Practitioner/00000000-f9a1-4a6b-b0f4-0000000033d3  ← inconsistent
```

This means the multi-resource output has dangling references, which is misleading for
integration tests.

**2. PractitionerRole absent from Bundle**
The `generate bundle` command produces entries for Patient, Organization, Practitioner,
Observation, and MedicationStatement — but not PractitionerRole, even though spec 17 added it
to `generate all`. The bundle builder was never updated.

**3. PractitionerRole has no organization reference**
`PractitionerRole.organization` is unset. In practice, a PractitionerRole always links both a
Practitioner and an Organization. Adding the organization reference makes the resource realistic
and the bundle coherent.

## Dependencies

- Spec 06 (practitioner-builder) — complete
- Spec 09 (bundle-builder) — complete
- Spec 17 (practitioner-role-in-generate-all) — complete

## Deliverables

- `src/cli/commands/generate.ts` — pass the seeded Practitioner and Organization IDs to the
  PractitionerRole builder so references are consistent
- `src/core/builders/practitioner-role.ts` (or equivalent) — add `organization` reference
  field, accept `practitionerId` and `organizationId` as parameters
- `src/core/builders/bundle.ts` — include PractitionerRole in the bundle entry list;
  generate it with the same Practitioner and Organization IDs already in the bundle
- `tests/` — add test confirming that the Practitioner and Organization IDs referenced by
  PractitionerRole match the IDs of Practitioner and Organization in the same session

## Key interfaces / signatures

The PractitionerRole builder should accept explicit resource IDs:

```typescript
function buildPractitionerRole(
  locale: Locale,
  version: FhirVersion,
  rng: SeededRng,
  options: {
    practitionerId: string;   // ID of the Practitioner already built in this session
    organizationId: string;   // ID of the Organization already built in this session
  }
): FhirPractitionerRole
```

In `generate all` and `generate bundle`, build Practitioner and Organization first, capture
their IDs, then pass them to PractitionerRole.

## Implementation notes

- The seeded PRNG must be called in a deterministic order — build Practitioner before
  PractitionerRole so IDs are stable across seeds
- The bundle currently builds resources in this order: Patient, Organization, Practitioner,
  Observation, MedicationStatement. Add PractitionerRole after Practitioner, passing
  the Organization and Practitioner IDs from the same bundle build.
- `generate practitioner-role` as a standalone command (without `generate all`) may use a
  synthetic reference since there is no associated Practitioner in scope — this is acceptable
- The Organization reference in PractitionerRole should use the same Organization ID emitted
  in `generate all` for that seed

## Acceptance criteria

```bash
# References must be consistent in generate all
fhir-test-data generate all --locale us --seed 42 --no-pretty | python3 -c "
import json, sys
resources = [json.loads(l) for l in sys.stdin]
by_type = {r['resourceType']: r for r in resources}
prac_id = 'Practitioner/' + by_type['Practitioner']['id']
org_id  = 'Organization/' + by_type['Organization']['id']
role    = by_type['PractitionerRole']
assert role['practitioner']['reference'] == prac_id, 'Practitioner ref mismatch'
assert role['organization']['reference']  == org_id,  'Organization ref mismatch'
print('References consistent ✓')
"

# Bundle must include PractitionerRole with consistent references
fhir-test-data generate bundle --locale us --seed 42 --no-pretty | python3 -c "
import json, sys
r = json.load(sys.stdin)
types = [e['resource']['resourceType'] for e in r['entry']]
assert 'PractitionerRole' in types, 'PractitionerRole missing from bundle'
print('Bundle types:', types)
"

# generate all must validate completely clean (no reference format warnings)
fhir-test-data generate all --locale us --seed 42 \
  | fhir-resource-diff validate -
# Expected: 9 resources: 9 valid, 0 invalid

# Same for all new locales
for locale in jp kr br za; do
  fhir-test-data generate all --locale $locale --seed 1 \
    | fhir-resource-diff validate -
  # Expected: 9 resources: 9 valid, 0 invalid
done
```

## Do not do

- Do not add PractitionerRole to clinical resources (Observation, Condition subjects stay as Patient refs)
- Do not change `generate practitioner-role` standalone output — synthetic ref is acceptable there
- Do not add HealthcareService references to PractitionerRole — out of scope
