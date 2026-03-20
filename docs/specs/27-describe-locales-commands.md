# Spec 27: `locales` and `describe` CLI commands

**Status:** in progress

## Goal

Surface structured metadata about what the tool can generate. Useful for:
- AI assistants that need to know the tool's capabilities before generating commands
- Non-technical users exploring FHIR identifier systems
- Scripting and automation that needs to enumerate locales or resource fields

---

## Interface

```bash
# List all supported locales with their identifier systems
fhir-test-data locales

# Describe what a resource type generates
fhir-test-data describe patient
fhir-test-data describe observation

# Describe with locale context — shows which identifiers are generated
fhir-test-data describe patient --locale uk

# Both commands respect --pretty / --no-pretty
fhir-test-data locales --no-pretty
```

---

## Output shapes

### `locales`

JSON array, one entry per supported locale:

```json
[
  {
    "code": "uk",
    "name": "United Kingdom",
    "patientIdentifiers": [
      {
        "name": "NHS Number",
        "system": "https://fhir.nhs.uk/Id/nhs-number",
        "algorithm": "Modulus 11"
      }
    ],
    "practitionerIdentifiers": [
      { "name": "GMC Number", "system": "https://fhir.hl7.org.uk/Id/gmc-number" },
      { "name": "GMP Number", "system": "https://fhir.nhs.uk/Id/gmp-number" }
    ],
    "organizationIdentifiers": [
      { "name": "ODS Code", "system": "https://fhir.nhs.uk/Id/ods-organization-code" }
    ]
  }
]
```

`algorithm` is omitted when the identifier uses only format/range validation (no
check-digit computation).

### `describe <resource-type>` (no locale)

```json
{
  "resourceType": "Patient",
  "description": "FHIR Patient with locale-appropriate identifiers, names, and address",
  "fields": {
    "id": "UUID v4 — unique resource identifier",
    "identifier": "Locale-specific patient identifiers (check-digit validated where applicable)",
    "name": "Given name, family name, and cultural title prefix",
    "telecom": "Home phone number and email address",
    "gender": "FHIR administrative gender: male | female",
    "birthDate": "Random date, adult age range (ISO 8601 YYYY-MM-DD)",
    "address": "Locale-appropriate street address with postal code",
    "communication": "BCP 47 language tag for the locale"
  },
  "supportedLocales": ["us", "uk", "au", "ca", "de", "fr", "nl", "in", "jp", "kr", "sg", "br", "mx", "za"]
}
```

### `describe <resource-type> --locale uk`

Same as above plus a `"localeDetail"` key:

```json
{
  "resourceType": "Patient",
  "description": "...",
  "fields": { ... },
  "supportedLocales": [...],
  "localeDetail": {
    "code": "uk",
    "name": "United Kingdom",
    "patientIdentifiers": [
      { "name": "NHS Number", "system": "...", "algorithm": "Modulus 11" }
    ]
  }
}
```

---

## Acceptance criteria

- `locales` outputs a compact or pretty JSON array (default: pretty to stdout)
- Each identifier entry includes `name`, `system`, and `algorithm` (if applicable)
- `describe` accepts all concrete resource types: patient, practitioner, practitioner-role,
  organization, observation, condition, allergy-intolerance, medication-statement, bundle
- `describe --locale` appends `localeDetail` with the locale's identifier info
- Unknown resource type or locale exits with code 1 and a clear error message
- Both commands write JSON only — no markdown or formatted prose output

---

## Out of scope

- StructureDefinition or profile introspection
- Dynamic field discovery (field list is static per resource type)
- Markdown or human-formatted output
