# Builders

All builders use immutable method chaining. Each method returns a new builder instance —
the original is never mutated. Chains are safe to fork and reuse.

```typescript
// Safe to reuse — baseBuilder is not modified
const baseBuilder = createPatientBuilder().locale("uk").seed(42);
const fivePatients = baseBuilder.count(5).build();
const singlePatient = baseBuilder.count(1).build();
```

## Shared builder options

All builders expose these methods:

| Method | Default | Description |
|--------|---------|-------------|
| `.locale(code)` | `"us"` | Locale code — see [Locales](/guide/locales) |
| `.count(n)` | `1` | Number of resources to generate |
| `.seed(n)` | `0` | Seed for deterministic output |
| `.fhirVersion(v)` | `"R4"` | `"R4"` \| `"R4B"` \| `"R5"` |
| `.overrides(obj)` | `{}` | Deep-merged into every generated resource |
| `.build()` | — | Returns the array of generated resources |

## Patient

```typescript
import { createPatientBuilder } from "fhir-test-data";

const [patient] = createPatientBuilder()
  .locale("nl")
  .seed(99)
  .overrides({ meta: { source: "test-suite" } })
  .build();
```

**Generated fields:**

- `resourceType: "Patient"`
- `id` — UUID v4
- `identifier` — locale-specific identifier(s) with system URL and check-digit-valid value
- `name` — locale-appropriate given name, family name, prefix
- `telecom` — phone number and email address
- `gender` — `"male"` or `"female"`
- `birthDate` — ISO 8601 date
- `address` — locale-appropriate street, city, postal code, country
- `communication` — BCP 47 language code for the locale

## Practitioner

```typescript
import { createPractitionerBuilder } from "fhir-test-data";

const [practitioner] = createPractitionerBuilder()
  .locale("de")
  .seed(1)
  .build();
```

**Generated fields:**

- `resourceType: "Practitioner"`
- `id` — UUID v4
- `identifier` — locale-specific professional identifier (NPI, GMC, LANR, etc.)
- `name` — with locale-appropriate professional title prefix (Dr., Prof., etc.)
- `telecom` — work email address
- `gender` — `"male"` or `"female"`
- `qualification` — MD qualification with coding

## Organization

```typescript
import { createOrganizationBuilder } from "fhir-test-data";

const orgs = createOrganizationBuilder()
  .locale("uk")
  .count(5)
  .seed(10)
  .build();
```

**Generated fields:**

- `resourceType: "Organization"`
- `id` — UUID v4
- `identifier` — organization identifier with locale-appropriate system
- `active: true`
- `type` — hospital organization type coding
- `name` — locale-appropriate hospital or clinic name
- `telecom` — phone number
- `address` — locale-appropriate address

## Clinical builders

Clinical builders require a `subject` reference. If `.subject()` is not called, a
placeholder `urn:uuid:` reference is generated. In most cases you will want to pass
an actual patient ID from a patient you have already generated.

### Observation

```typescript
import { createObservationBuilder } from "fhir-test-data";

const obs = createObservationBuilder()
  .subject("Patient/abc-123")
  .category("vital-signs")
  .seed(5)
  .build();
```

**Generated fields:**

- `resourceType: "Observation"`
- `id` — UUID v4
- `status: "final"`
- `category` — `vital-signs` or `laboratory` (drawn from seed)
- `code` — LOINC code with display (e.g., `8867-4` Heart rate, `2708-6` Oxygen saturation)
- `subject` — reference to the provided patient ID
- `effectiveDateTime` — ISO 8601 datetime
- `valueQuantity` — realistic clinical value with UCUM units and reference range

### Condition

```typescript
import { createConditionBuilder } from "fhir-test-data";

const conditions = createConditionBuilder()
  .subject("Patient/abc-123")
  .count(3)
  .seed(6)
  .build();
```

**Generated fields:**

- `resourceType: "Condition"`
- `id` — UUID v4
- `clinicalStatus` — FHIR condition clinical status (active, resolved, etc.)
- `verificationStatus` — confirmed
- `code` — SNOMED CT code with display
- `subject` — reference to the provided patient ID
- `onsetDateTime` — ISO 8601 datetime

### AllergyIntolerance

```typescript
import { createAllergyIntoleranceBuilder } from "fhir-test-data";

const allergies = createAllergyIntoleranceBuilder()
  .subject("Patient/abc-123")
  .seed(7)
  .build();
```

**Generated fields:**

- `resourceType: "AllergyIntolerance"`
- `id` — UUID v4
- `clinicalStatus` — active
- `verificationStatus` — confirmed
- `type` — `"allergy"` (R4/R4B) or `CodeableConcept` (R5)
- `category` — `["medication"]` or `["food"]`
- `criticality` — `"high"` or `"low"`
- `code` — SNOMED CT code for the allergen
- `patient` — reference to the provided patient ID
- `reaction` — manifestation coding with SNOMED CT

### MedicationStatement

```typescript
import { createMedicationStatementBuilder } from "fhir-test-data";

const meds = createMedicationStatementBuilder()
  .subject("Patient/abc-123")
  .seed(8)
  .build();
```

**Generated fields (R4/R4B):**

- `resourceType: "MedicationStatement"`
- `id` — UUID v4
- `status: "active"`
- `medicationCodeableConcept` — RxNorm code for the medication
- `subject` — reference to the provided patient ID
- `effectivePeriod` — start and end dates

In R5, the resource type becomes `"MedicationUsage"` and the medication field is
restructured. See [FHIR versions](/guide/fhir-versions).

## The `.overrides()` method

`overrides` is deep-merged into every resource after generation. Use it to pin specific
fields for tests:

```typescript
const [patient] = createPatientBuilder()
  .locale("us")
  .seed(1)
  .overrides({
    meta: { source: "integration-test", versionId: "1" },
    active: true,
    managingOrganization: { reference: "Organization/org-001" },
  })
  .build();
```

Overrides do not affect identifier generation, seed consumption, or locale selection —
they are applied as a final merge step.
