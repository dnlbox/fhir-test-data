# Bundle builder

The Bundle builder composes all resource types into a single FHIR Bundle with automatic
reference wiring. All internal references use `urn:uuid:` format and are consistent.

## Basic usage

```typescript
import { createBundleBuilder } from "fhir-test-data";

const [bundle] = createBundleBuilder()
  .locale("us")
  .seed(42)
  .type("transaction")
  .build();
```

## What's inside a bundle

Each generated bundle contains:

| Resource | Count | Notes |
|---------|-------|-------|
| Patient | 1 | Locale-appropriate identifiers |
| Organization | 1 | Managing organization |
| Practitioner | 1 | Locale-appropriate professional identifiers |
| PractitionerRole | 1 | Links practitioner to organization |
| Clinical resources | 3–5 | Observations, Conditions, AllergyIntolerance, MedicationStatement |

The number of clinical resources defaults to a range drawn from the seed. Use
`.clinicalResourcesPerPatient(n)` to set an exact count.

## Reference wiring

All internal references are wired automatically using `urn:uuid:` URNs:

```json
{
  "resourceType": "Bundle",
  "entry": [
    {
      "fullUrl": "urn:uuid:patient-id",
      "resource": { "resourceType": "Patient", ... }
    },
    {
      "fullUrl": "urn:uuid:org-id",
      "resource": {
        "resourceType": "Organization",
        ...
      }
    },
    {
      "fullUrl": "urn:uuid:obs-id",
      "resource": {
        "resourceType": "Observation",
        "subject": { "reference": "urn:uuid:patient-id" },
        "performer": [{ "reference": "urn:uuid:practitioner-id" }],
        ...
      }
    }
  ]
}
```

**Wired references:**
- `Patient.managingOrganization` → Organization
- `Observation.subject` → Patient
- `Observation.performer[0]` → Practitioner
- `Condition.subject` → Patient
- `AllergyIntolerance.patient` → Patient
- `MedicationStatement.subject` → Patient
- `PractitionerRole.practitioner` → Practitioner
- `PractitionerRole.organization` → Organization

## Bundle types

```typescript
// Transaction bundle — entries include request.method and request.url
const [txBundle] = createBundleBuilder().type("transaction").build();

// Collection bundle — entries with no request
const [colBundle] = createBundleBuilder().type("collection").build();

// Searchset bundle — entries include search.mode
const [searchBundle] = createBundleBuilder().type("searchset").build();
```

## Controlling clinical resource count

```typescript
const [bundle] = createBundleBuilder()
  .locale("uk")
  .seed(1)
  .clinicalResourcesPerPatient(5)
  .build();
```

## Generating multiple bundles

```typescript
const bundles = createBundleBuilder()
  .locale("au")
  .seed(100)
  .count(10)
  .build();

// Each bundle gets its own patient, organization, practitioner, and clinical resources
// Seeds are incremented internally for each bundle
```

## CLI equivalent

```bash
# 10 AU bundles to files
fhir-test-data generate bundle --locale au --count 10 --seed 1 --output ./fixtures/
```

Produces `fixtures/Bundle-0001.json` through `fixtures/Bundle-0010.json`.
