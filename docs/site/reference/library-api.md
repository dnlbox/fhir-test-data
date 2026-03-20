# Library API

Complete reference for all exports from `fhir-test-data`.

## Main export

```typescript
import {
  createPatientBuilder,
  createPractitionerBuilder,
  createPractitionerRoleBuilder,
  createOrganizationBuilder,
  createObservationBuilder,
  createConditionBuilder,
  createAllergyIntoleranceBuilder,
  createMedicationStatementBuilder,
  createBundleBuilder,
} from "fhir-test-data";
```

## Fault injection export

```typescript
import { withFault } from "fhir-test-data/faults";
```

The faults module is a separate subpath export. It is not included in the main import.

---

## Builder factory functions

All factory functions return a builder with no options set (locale defaults to `"us"`,
seed defaults to `0`, count defaults to `1`, fhirVersion defaults to `"R4"`).

### `createPatientBuilder()`

Returns a `PatientBuilder`. Call `.build()` to get `Patient[]`.

```typescript
const patients = createPatientBuilder()
  .locale("uk")
  .count(5)
  .seed(42)
  .fhirVersion("R5")
  .overrides({ active: true })
  .build();
```

### `createPractitionerBuilder()`

Returns a `PractitionerBuilder`. Call `.build()` to get `Practitioner[]`.

```typescript
const [practitioner] = createPractitionerBuilder().locale("de").seed(1).build();
```

### `createPractitionerRoleBuilder()`

Returns a `PractitionerRoleBuilder`. Requires `.practitionerId()` and `.organizationId()`
to wire references.

```typescript
const [role] = createPractitionerRoleBuilder()
  .practitionerId("Practitioner/abc-123")
  .organizationId("Organization/org-456")
  .seed(1)
  .build();
```

### `createOrganizationBuilder()`

Returns an `OrganizationBuilder`. Call `.build()` to get `Organization[]`.

```typescript
const orgs = createOrganizationBuilder().locale("fr").count(3).seed(10).build();
```

### `createObservationBuilder()`

Returns an `ObservationBuilder`. Call `.subject()` to set the patient reference before
calling `.build()`.

```typescript
const obs = createObservationBuilder()
  .subject("Patient/abc-123")
  .category("vital-signs")
  .count(3)
  .seed(5)
  .build();
```

**Additional method:**

| Method | Description |
|--------|-------------|
| `.subject(ref)` | Patient reference string (`"Patient/id"` or `"urn:uuid:..."`) |
| `.category(cat)` | `"vital-signs"` or `"laboratory"` — defaults to random from seed |

### `createConditionBuilder()`

Returns a `ConditionBuilder`. Call `.subject()` before `.build()`.

```typescript
const conditions = createConditionBuilder()
  .subject("Patient/abc-123")
  .count(2)
  .seed(6)
  .build();
```

### `createAllergyIntoleranceBuilder()`

Returns an `AllergyIntoleranceBuilder`. Call `.subject()` before `.build()`.

```typescript
const [allergy] = createAllergyIntoleranceBuilder()
  .subject("Patient/abc-123")
  .seed(7)
  .build();
```

### `createMedicationStatementBuilder()`

Returns a `MedicationStatementBuilder`. Call `.subject()` before `.build()`.

In R5, the generated resource has `resourceType: "MedicationUsage"`.

```typescript
const [med] = createMedicationStatementBuilder()
  .subject("Patient/abc-123")
  .fhirVersion("R5")
  .seed(8)
  .build();
```

### `createBundleBuilder()`

Returns a `BundleBuilder`. Call `.build()` to get `Bundle[]`. All internal references
are wired automatically.

```typescript
const [bundle] = createBundleBuilder()
  .locale("us")
  .seed(42)
  .type("transaction")
  .clinicalResourcesPerPatient(5)
  .build();
```

**Additional methods:**

| Method | Default | Description |
|--------|---------|-------------|
| `.type(t)` | `"transaction"` | Bundle type: `"transaction"` \| `"collection"` \| `"searchset"` |
| `.clinicalResourcesPerPatient(n)` | 3–5 (from seed) | Exact number of clinical resources per patient |

---

## Shared builder methods

All builders expose these methods:

| Method | Type | Default | Description |
|--------|------|---------|-------------|
| `.locale(code)` | `Locale` | `"us"` | Country locale code |
| `.count(n)` | `number` | `1` | Resources to generate |
| `.seed(n)` | `number` | `0` | Deterministic seed |
| `.fhirVersion(v)` | `FhirVersion` | `"R4"` | `"R4"` \| `"R4B"` \| `"R5"` |
| `.overrides(obj)` | `Partial<T>` | `{}` | Deep-merged into every resource |
| `.build()` | `T[]` | — | Generate and return resources |

---

## Types

```typescript
type Locale =
  | "us" | "uk" | "au" | "ca" | "de" | "fr" | "nl" | "in"
  | "jp" | "kr" | "sg" | "br" | "mx" | "za";

type FhirVersion = "R4" | "R4B" | "R5";

type BundleType = "transaction" | "collection" | "searchset";

type ObservationCategory = "vital-signs" | "laboratory";
```

---

## Fault injection API

```typescript
import { withFault } from "fhir-test-data/faults";

// Wraps any builder with a fault applied after generation
const faultedBuilder = withFault(createPatientBuilder().locale("uk").seed(1), "missing-resource-type");
const [invalid] = faultedBuilder.build();
```

### `withFault(builder, faultType)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `builder` | Any builder | The builder to wrap |
| `faultType` | `FaultType` | The fault to inject |

**Fault types:**

| Value | Effect |
|-------|--------|
| `"missing-resource-type"` | Removes `resourceType` |
| `"invalid-id"` | Sets `id` to an invalid format |
| `"missing-identifier"` | Removes all `identifier` entries |
| `"invalid-date"` | Sets `birthDate` to a non-ISO-8601 value |
| `"empty-name"` | Sets `name` to `[]` |
| `"invalid-gender"` | Sets `gender` to an invalid value |
| `"missing-subject"` | Removes `subject` from clinical resources |
