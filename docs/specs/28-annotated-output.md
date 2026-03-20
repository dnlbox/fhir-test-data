# Spec 28: annotated output mode (`--annotate`)

**Status:** in progress

## Goal

Add `--annotate` to the `generate` command. Each generated resource is wrapped with a
`notes` array that explains the fields in plain language — what each identifier system
means, which algorithm validated it, what LOINC code represents clinically, what UCUM unit
means in HL7 context.

Useful for:
- AI assistants explaining a generated resource to a non-technical user
- Healthcare professionals exploring FHIR without an engineering background
- Training, demos, and onboarding materials

---

## Interface

```bash
fhir-test-data generate patient --locale uk --seed 42 --annotate
fhir-test-data generate observation --locale us --seed 1 --annotate
fhir-test-data generate bundle --locale au --seed 5 --annotate | jq '.notes'
```

---

## Output shape

Instead of the raw FHIR resource, each output unit is:

```json
{
  "resource": { /* unchanged FHIR resource */ },
  "notes": [
    {
      "path": "identifier[0].value",
      "note": "NHS Number — 10-digit UK national patient identifier, validated with Modulus 11 check digit"
    },
    {
      "path": "identifier[0].system",
      "note": "FHIR NamingSystem URI for NHS Numbers (https://fhir.nhs.uk/Id/nhs-number)"
    },
    {
      "path": "id",
      "note": "Unique resource identifier (UUID v4)"
    },
    {
      "path": "gender",
      "note": "FHIR administrative gender code (male | female | other | unknown)"
    },
    {
      "path": "birthDate",
      "note": "Patient date of birth — ISO 8601 format (YYYY-MM-DD)"
    },
    {
      "path": "communication[0].language.coding[0].code",
      "note": "BCP 47 language tag — en-GB = British English"
    }
  ]
}
```

For an Observation:

```json
{
  "resource": { /* Observation */ },
  "notes": [
    {
      "path": "code.coding[0].code",
      "note": "LOINC 8480-6 — Systolic blood pressure"
    },
    {
      "path": "code.coding[0].system",
      "note": "LOINC — Logical Observation Identifiers Names and Codes (https://loinc.org)"
    },
    {
      "path": "valueQuantity.value",
      "note": "Systolic blood pressure measurement — clinically plausible range: 90–180"
    },
    {
      "path": "valueQuantity.unit",
      "note": "mmHg — millimetres of mercury; UCUM code mm[Hg], standard HL7 unit for blood pressure"
    },
    {
      "path": "valueQuantity.system",
      "note": "UCUM — Unified Code for Units of Measure (https://ucum.org), required by HL7 FHIR guidelines"
    },
    {
      "path": "status",
      "note": "FHIR observation status — 'final' indicates a completed, unmodified observation"
    }
  ]
}
```

---

## Annotation coverage by resource type

| Resource | Annotated fields |
|----------|-----------------|
| Patient | id, identifier (name + algorithm), name.prefix, gender, birthDate, address.country, communication language |
| Practitioner | id, identifier (name + algorithm), name.prefix, gender |
| PractitionerRole | id, practitioner ref, organization ref, code system |
| Organization | id, identifier, type coding |
| Observation | id, code (LOINC display + system), valueQuantity (unit + UCUM + range), status, category |
| Condition | id, code (SNOMED display + system), clinicalStatus, subject |
| AllergyIntolerance | id, code (display + system + category), type, patient |
| MedicationStatement | id, medication code (display + system), status, subject |
| Bundle | id, type, entry count, distinct resourceTypes in entries |

---

## Acceptance criteria

- `--annotate` wraps each resource as `{ resource, notes }`
- Notes are generated reactively from the resource content (not hardcoded strings)
- The `resource` field is byte-for-byte identical to what would be output without `--annotate`
- NDJSON + `--annotate`: each line is a compact annotated wrapper
- `--output` + `--annotate`: files contain the annotated wrapper
- `--annotate` + fault injection: notes are derived from the (possibly invalid) resource;
  missing fields produce no note for that path (no crash)
- Annotation generator lives in `src/core/annotations/index.ts` — browser-safe,
  no Node.js imports

---

## Out of scope

- Nested bundle entry annotation (annotate each bundle entry resource separately would
  require a different output shape)
- Multi-language annotation text
- LLM-generated annotations
- Annotations for the `all` resource type (outputs multiple resources — annotated as
  individual wrapped objects)
