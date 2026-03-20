---
layout: home
hero:
  name: fhir-test-data
  tagline: Generate valid FHIR R4/R4B/R5 test resources with country-aware identifiers — pipe-friendly, AI-friendly, and ready for any test workflow.
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/dnlbox/fhir-test-data
features:
  - title: CLI-first, pipe-friendly
    details: Output goes to stdout by default — pipe into jq, validators, FHIR servers, or AI assistants. NDJSON support for streaming bulk workloads. Works wherever JSON does.
  - title: 14 locales, check-digit correct
    details: Every generated identifier passes its country's official check-digit algorithm — Modulus 11 for UK NHS, Verhoeff for Indian Aadhaar, 11-proef for Dutch BSN, Luhn for AU IHI and ZA ID, and more.
  - title: Clinically meaningful codes
    details: Observations use real LOINC codes with values in plausible clinical ranges and HL7-consistent units. Conditions use SNOMED CT codes. Data that makes sense to a clinician, not just a schema validator.
  - title: Seeded and deterministic
    details: The same seed always produces the same output, on any machine, across any Node version. Reliable for snapshot tests, golden file comparison, and regression fixtures.
  - title: Multi-version FHIR support
    details: All builders target R4 (default), R4B, or R5. R5 structural adaptations — MedicationUsage, CodeableConcept AllergyIntolerance type — are applied automatically.
  - title: Browser-safe core
    details: "src/core/ has no Node.js imports. The library runs in browsers, Deno, and Cloudflare Workers with no configuration. The CLI is a thin adapter on top."
---

`fhir-test-data` is a TypeScript library and CLI for generating valid FHIR test resources
— without copying production data or hardcoding US-centric identifiers.

Supports FHIR **R4**, **R4B**, and **R5**. Generates Patient, Practitioner, Organization,
Observation, Condition, AllergyIntolerance, MedicationStatement, and Bundle resources across
**14 locales**.

```bash
# Install
pnpm add fhir-test-data

# Pipe into jq
fhir-test-data generate patient --locale uk --seed 42 | jq '.identifier[0]'

# Generate a full bundle with wired references
fhir-test-data generate bundle --locale au --seed 1 --output ./fixtures/
```

```typescript
import { createPatientBuilder, createBundleBuilder } from "fhir-test-data";

// Deterministic — same seed always produces the same patient
const [patient] = createPatientBuilder().locale("nl").seed(99).build();

// Full bundle with automatic reference wiring
const [bundle] = createBundleBuilder().locale("us").seed(42).type("transaction").build();
```
