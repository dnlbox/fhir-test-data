# Showcase

`fhir-test-data` is a TypeScript library and CLI for generating valid FHIR R4/R4B/R5 test
resources with country-aware identifiers. This showcase demonstrates what it produces across
locales, resource types, bundle wiring, and edge cases.

---

## Generating a UK patient

A United Kingdom patient includes an NHS Number — a 10-digit identifier validated with
Modulus 11. Every generated NHS Number passes the check-digit algorithm:

```bash
fhir-test-data generate patient --locale uk --count 1 --seed 42
```

```json
{
  "resourceType": "Patient",
  "id": "3f2a1b4c-8d9e-4f0a-b1c2-d3e4f5a6b7c8",
  "identifier": [
    {
      "system": "https://fhir.nhs.uk/Id/nhs-number",
      "value": "4857326190"
    }
  ],
  "name": [
    {
      "use": "official",
      "family": "Whitfield",
      "given": ["Oliver"],
      "prefix": ["Mr"]
    }
  ],
  "telecom": [
    { "system": "phone", "value": "+44 20 7946 0932", "use": "home" },
    { "system": "email", "value": "o.whitfield@example.co.uk" }
  ],
  "gender": "male",
  "birthDate": "1981-07-14",
  "address": [
    {
      "use": "home",
      "line": ["42 Pemberton Road"],
      "city": "Manchester",
      "postalCode": "M1 3AX",
      "country": "GB"
    }
  ],
  "communication": [
    { "language": { "coding": [{ "system": "urn:ietf:bcp:47", "code": "en-GB" }] } }
  ]
}
```

The NHS Number `4857326190` passes Modulus 11 — `97 - ((4×10 + 8×9 + 5×8 + 7×7 + 3×6 + 2×5 + 6×4 + 1×3 + 9×2) mod 11) = 0`.

---

## Generating across locales

The same seed with different locales produces locale-correct identifiers, names, and addresses:

```bash
# Dutch patient — BSN passes 11-proef
fhir-test-data generate patient --locale nl --seed 42

# French patient — NIR (social security) with Modulus 97 check key
fhir-test-data generate patient --locale fr --seed 42

# Indian patient — Aadhaar with Verhoeff check digit
fhir-test-data generate patient --locale in --seed 42

# German practitioner — LANR (doctor registration number) with Modulus 10
fhir-test-data generate practitioner --locale de --seed 42
```

All generated identifiers pass the official check-digit algorithm for their country.

---

## Generating a full bundle

The bundle builder composes all resource types into a single FHIR Bundle with automatic
reference wiring. Every internal reference uses `urn:uuid:` format and is consistent:

```bash
fhir-test-data generate bundle --locale au --seed 1 --output ./fixtures/
```

```
fixtures/
  Bundle-0001.json
```

The generated bundle contains:
- 1 Patient (with IHI number, Luhn-validated)
- 1 Organization (hospital)
- 1 Practitioner (with HPI-I number, Luhn-validated)
- 1 PractitionerRole (linking practitioner to organization)
- 3–5 clinical resources (Observations, Conditions, AllergyIntolerance, MedicationStatement)

All references are wired:
- `Patient.managingOrganization` → Organization
- `Observation.subject` → Patient
- `Observation.performer[0]` → Practitioner
- `Condition.subject` → Patient

---

## Seeded determinism

The same seed always produces the same output, regardless of when or where it runs:

```bash
fhir-test-data generate patient --locale uk --seed 42 > a.json
fhir-test-data generate patient --locale uk --seed 42 > b.json
diff a.json b.json
# (no output — files are identical)
```

This makes seeded output reliable for snapshot tests, golden file comparison, and
regression test fixtures. Pair with [fhir-resource-diff](https://github.com/dnlbox/fhir-resource-diff)
to verify that generated fixtures remain stable across library upgrades:

```bash
# Regenerate fixtures
fhir-test-data generate bundle --locale us --seed 1 --output ./fixtures/

# Compare against committed baseline
fhir-resource-diff compare ./fixtures/Bundle-0001.json ./baseline/Bundle-0001.json
```

---

## Library API — generating fixtures in tests

```typescript
import { createPatientBuilder, createBundleBuilder } from "fhir-test-data";

// Deterministic patient for unit test
const [patient] = createPatientBuilder().locale("nl").seed(99).build();
expect(patient.identifier[0].value).toMatch(/^\d{9}$/); // BSN format

// Bundle with deep-merged metadata override
const [bundle] = createBundleBuilder()
  .locale("us")
  .seed(42)
  .type("transaction")
  .clinicalResourcesPerPatient(5)
  .overrides({ meta: { source: "test-suite-v1" } })
  .build();

expect(bundle.resourceType).toBe("Bundle");
expect(bundle.entry.length).toBeGreaterThan(5);
```

---

## FHIR version variants

All builders target any FHIR version. R4 is the default:

```bash
# R5 bundle — MedicationStatement emitted as MedicationUsage
fhir-test-data generate bundle --locale us --seed 1 --fhir-version R5

# R4B (structurally identical to R4 for all generated resources)
fhir-test-data generate patient --locale de --fhir-version R4B
```

In R5, two resources change shape:
- `MedicationStatement` → `MedicationUsage`: type renamed, `medicationCodeableConcept`
  restructured to `medication.concept`
- `AllergyIntolerance.type`: plain code string → `CodeableConcept` with `coding` array

---

## Fault injection

The `fhir-test-data/faults` submodule generates intentionally invalid resources for testing
validation pipelines, error handlers, and rejection behaviour:

```typescript
import { createPatientBuilder } from "fhir-test-data";
import { withFault } from "fhir-test-data/faults";

// Generate a patient with a missing required field
const [invalidPatient] = withFault(
  createPatientBuilder().locale("uk").seed(42),
  "missing-resource-type"
).build();

// Test that your validation pipeline catches it
const result = validate(invalidPatient);
expect(result.valid).toBe(false);
expect(result.errors[0].path).toBe("resourceType");
```

---

## Bulk fixture generation

Generate thousands of records for load testing or seed data:

```bash
# 1000 US patients as NDJSON for bulk loading
fhir-test-data generate patient \
  --locale us \
  --count 1000 \
  --format ndjson \
  --output ./fixtures/

# Mixed locale bundle set
for locale in us uk au de fr nl; do
  fhir-test-data generate bundle \
    --locale $locale \
    --count 10 \
    --seed 1 \
    --output "./fixtures/$locale/"
done
```

---

## CI integration

Generate and validate fixtures in one pipeline step:

```yaml
- name: Regenerate test fixtures
  run: fhir-test-data generate bundle --locale us --seed 1 --output ./fixtures/

- name: Validate generated fixtures
  run: |
    for f in fixtures/*.json; do
      fhir-resource-diff validate "$f" --fhir-version R4
    done
```
