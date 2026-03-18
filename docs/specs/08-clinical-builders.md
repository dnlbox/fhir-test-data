# Spec 08 — Clinical resource builders

**Status:** complete

## Goal

Implement builders for Observation, Condition, AllergyIntolerance, and MedicationStatement.
These builders produce clinical resources with valid SNOMED CT and LOINC codes, referencing
a Patient subject.

## Dependencies

- Spec 01 (core types) complete
- Spec 05 (patient builder) complete — generated Patients to reference as subjects

## Deliverables

| File | Description |
|------|-------------|
| `src/core/builders/observation.ts` | Observation builder |
| `src/core/builders/condition.ts` | Condition builder |
| `src/core/builders/allergy-intolerance.ts` | AllergyIntolerance builder |
| `src/core/builders/medication-statement.ts` | MedicationStatement builder |
| `src/core/data/loinc-codes.ts` | Common LOINC codes for observations |
| `src/core/data/snomed-codes.ts` | Common SNOMED CT codes for conditions |
| `src/core/data/allergy-codes.ts` | Common allergy codes |
| `src/core/data/medication-codes.ts` | Common medication codes |
| `tests/builders/observation.test.ts` | Observation builder tests |
| `tests/builders/condition.test.ts` | Condition builder tests |
| `tests/builders/allergy-intolerance.test.ts` | AllergyIntolerance builder tests |
| `tests/builders/medication-statement.test.ts` | MedicationStatement builder tests |

## Key interfaces / signatures

### Clinical builder pattern

All clinical builders follow the same pattern:

```typescript
export interface ObservationBuilder {
  locale(locale: Locale): ObservationBuilder;
  count(count: number): ObservationBuilder;
  seed(seed: number): ObservationBuilder;
  subject(patientReference: string): ObservationBuilder;
  category(category: "vital-signs" | "laboratory"): ObservationBuilder;
  overrides(overrides: Record<string, unknown>): ObservationBuilder;
  build(): FhirResource[];
}

export function createObservationBuilder(): ObservationBuilder;
```

### Code data files

```typescript
// src/core/data/loinc-codes.ts
export interface LoincCode {
  code: string;
  display: string;
  unit: string;
  unitCode: string;  // UCUM code
  category: "vital-signs" | "laboratory";
  valueRange: { min: number; max: number };
}

export const COMMON_LOINC_CODES: LoincCode[];
```

## Implementation notes

### Observation structure

```typescript
{
  resourceType: "Observation",
  id: "<uuid>",
  status: "final",
  category: [{
    coding: [{
      system: "http://terminology.hl7.org/CodeSystem/observation-category",
      code: "vital-signs",
      display: "Vital Signs"
    }]
  }],
  code: {
    coding: [{
      system: "http://loinc.org",
      code: "8867-4",
      display: "Heart rate"
    }]
  },
  subject: { reference: "Patient/<id>" },
  effectiveDateTime: "<ISO datetime>",
  valueQuantity: {
    value: 72,
    unit: "beats/minute",
    system: "http://unitsofmeasure.org",
    code: "/min"
  }
}
```

### Common LOINC codes to include (vital signs)

| Code | Display | Unit | UCUM | Range |
|------|---------|------|------|-------|
| 8867-4 | Heart rate | beats/minute | /min | 50–120 |
| 8310-5 | Body temperature | degrees Celsius | Cel | 35.5–39.0 |
| 8480-6 | Systolic blood pressure | mmHg | mm[Hg] | 90–180 |
| 8462-4 | Diastolic blood pressure | mmHg | mm[Hg] | 50–110 |
| 9279-1 | Respiratory rate | breaths/minute | /min | 10–30 |
| 2708-6 | Oxygen saturation | % | % | 88–100 |
| 29463-7 | Body weight | kg | kg | 40–150 |
| 8302-2 | Body height | cm | cm | 140–200 |

### Common LOINC codes (laboratory)

| Code | Display | Unit | UCUM | Range |
|------|---------|------|------|-------|
| 2339-0 | Glucose | mg/dL | mg/dL | 60–200 |
| 718-7 | Hemoglobin | g/dL | g/dL | 8–18 |
| 4548-4 | HbA1c | % | % | 4–14 |
| 2160-0 | Creatinine | mg/dL | mg/dL | 0.5–2.5 |
| 6690-2 | WBC count | 10*3/uL | 10*3/uL | 3–15 |

### Common SNOMED CT codes for conditions

| Code | Display |
|------|---------|
| 73211009 | Diabetes mellitus |
| 38341003 | Hypertension |
| 195967001 | Asthma |
| 44054006 | Type 2 diabetes mellitus |
| 84114007 | Heart failure |
| 13645005 | COPD |
| 56265001 | Heart disease |
| 40055000 | Chronic kidney disease |
| 73430006 | Sleep apnea |
| 414545008 | Ischemic heart disease |

### Common allergy codes

| System | Code | Display |
|--------|------|---------|
| SNOMED CT | 91936005 | Allergy to penicillin |
| SNOMED CT | 91935009 | Allergy to peanuts |
| SNOMED CT | 294505008 | Allergy to amoxicillin |
| SNOMED CT | 418689008 | Allergy to grass pollen |
| SNOMED CT | 419474003 | Allergy to sulfonamide |
| SNOMED CT | 416098002 | Allergy to drug (general) |
| SNOMED CT | 300916003 | Latex allergy |
| SNOMED CT | 235719002 | Food intolerance |

### Common medication codes

| System | Code | Display |
|--------|------|---------|
| SNOMED CT | 27658006 | Amoxicillin |
| SNOMED CT | 387207008 | Ibuprofen |
| SNOMED CT | 372756006 | Atorvastatin |
| SNOMED CT | 386919002 | Metformin |
| SNOMED CT | 387458008 | Aspirin |
| SNOMED CT | 372567009 | Amlodipine |
| SNOMED CT | 116602009 | Lisinopril |
| SNOMED CT | 387471003 | Levothyroxine |

### Subject references
Clinical builders accept a `subject(reference)` method. If no subject is provided,
generate a placeholder reference `Patient/<random-uuid>`. The Bundle builder (spec 09)
will wire up real references.

### Value generation
Use the seeded PRNG to generate values within realistic clinical ranges. Round to
appropriate precision (1 decimal for temperature, 0 decimals for heart rate, etc.).

## Acceptance criteria

```bash
pnpm test tests/builders/observation.test.ts              # all pass
pnpm test tests/builders/condition.test.ts                # all pass
pnpm test tests/builders/allergy-intolerance.test.ts      # all pass
pnpm test tests/builders/medication-statement.test.ts     # all pass
pnpm typecheck                                             # no errors
```

Tests must include:
- Generated Observations have valid LOINC codes from the code list
- Generated Observations have valueQuantity within the expected range
- Generated Conditions have valid SNOMED CT codes
- Generated AllergyIntolerances have valid coding
- All resources have `subject.reference` set
- Determinism: same seed produces same clinical values

## Do not do

- Do not implement terminology server lookups.
- Do not attempt to validate codes against full SNOMED CT or LOINC databases.
- Do not generate complex multi-component observations (panels) in v1.
- Do not add locale-specific clinical code differences in v1 — SNOMED CT and LOINC are international.
- Do not import Node.js APIs.
