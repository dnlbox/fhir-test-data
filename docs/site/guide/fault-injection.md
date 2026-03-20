# Fault injection

The `fhir-test-data/faults` subpath export allows generating intentionally invalid FHIR
resources. Use fault injection to test validation pipelines, error handlers, and server
rejection behaviour without manually constructing malformed resources.

## Import

```typescript
import { createPatientBuilder } from "fhir-test-data";
import { withFault } from "fhir-test-data/faults";
```

The `faults` module is a separate export — it is not included in the main `fhir-test-data`
import. This keeps the core library clean and makes fault injection an explicit opt-in.

## Basic usage

```typescript
import { createPatientBuilder } from "fhir-test-data";
import { withFault } from "fhir-test-data/faults";

// Generate a patient missing its resourceType
const [invalidPatient] = withFault(
  createPatientBuilder().locale("uk").seed(42),
  "missing-resource-type"
).build();

// The resourceType field is absent
console.log(invalidPatient.resourceType); // undefined
```

## Available fault types

| Fault | What it removes or corrupts |
|-------|----------------------------|
| `"missing-resource-type"` | Removes `resourceType` entirely |
| `"invalid-id"` | Sets `id` to a value that fails FHIR ID format rules |
| `"missing-identifier"` | Removes all `identifier` entries |
| `"invalid-date"` | Sets `birthDate` to a non-ISO-8601 value |
| `"empty-name"` | Sets `name` to an empty array |
| `"invalid-gender"` | Sets `gender` to a value outside the FHIR gender value set |
| `"missing-subject"` | Removes `subject` from clinical resources |

## Testing a validation pipeline

```typescript
import { createPatientBuilder } from "fhir-test-data";
import { withFault } from "fhir-test-data/faults";
import { validatePatient } from "./your-validation-module";

describe("Patient validation", () => {
  it("rejects a patient with no resourceType", () => {
    const [invalid] = withFault(
      createPatientBuilder().locale("us").seed(1),
      "missing-resource-type"
    ).build();

    const result = validatePatient(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ path: "resourceType" })
    );
  });

  it("rejects a patient with an invalid birthDate format", () => {
    const [invalid] = withFault(
      createPatientBuilder().locale("uk").seed(1),
      "invalid-date"
    ).build();

    const result = validatePatient(invalid);
    expect(result.valid).toBe(false);
  });
});
```

## Combining with fhir-resource-diff

Use fault injection alongside [fhir-resource-diff](https://dnlbox.github.io/fhir-resource-diff/)
to verify that your validation pipeline catches known faults:

```bash
# Generate a valid patient and save it
fhir-test-data generate patient --locale uk --seed 1 > valid.json

# In your test suite, inject a fault and validate
# fhir-resource-diff validate catches structural problems
```

```typescript
import { createPatientBuilder } from "fhir-test-data";
import { withFault } from "fhir-test-data/faults";

// Both valid and invalid from the same seed — good for before/after comparisons
const validBuilder = createPatientBuilder().locale("uk").seed(1);
const invalidBuilder = withFault(validBuilder, "missing-resource-type");

const [valid] = validBuilder.build();
const [invalid] = invalidBuilder.build();

// valid and invalid are identical except for the injected fault
```

## Notes

- Fault injection wraps the builder — all other builder options (locale, seed, overrides)
  are preserved and applied normally
- Faults are applied after generation, so identifier generation and seeding are unaffected
- Multiple faults can be composed by chaining `withFault` calls:

```typescript
const [doubleInvalid] = withFault(
  withFault(createPatientBuilder().seed(1), "missing-resource-type"),
  "invalid-id"
).build();
```
