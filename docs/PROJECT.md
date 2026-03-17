You are helping me design and implement a serious open-source developer tool.

Project goal:
Build a public GitHub repository that showcases strong engineering in healthtech interoperability,
TypeScript architecture, and developer tooling. The tool must be useful, credible, and independent
from any employer or client IP.

Repository name:
fhir-test-data

Primary purpose:
A TypeScript-first library and CLI for generating valid, realistic FHIR R4/R4B/R5 test resources.
Country-aware — generates identifiers that pass real validation algorithms (NHS Modulus 11,
Australian IHI Luhn, Indian Aadhaar Verhoeff, Dutch BSN 11-proef, etc.).

Why it exists:
The FHIR test data problem is real and unsolved in TypeScript.

- **Synthea** is Java-only. It generates bulk synthetic patient records, but it is not a
  library — you cannot call it from a test suite or embed it in a TS project.
- **fhir-gen** (the only TS factory) is abandoned — last commit years ago.
- **Every FHIR developer hand-rolls test fixtures.** Copy-paste from specification examples,
  manually adjust identifiers, hope the structure is valid. This is slow, error-prone, and
  produces fixtures that drift from real-world data.
- **95K weekly @types/fhir downloads** prove the TypeScript FHIR ecosystem is real and growing.
  Medplum alone pulls 59K/week. There are 963+ GitHub repos using FHIR types in TypeScript.
- **No tool generates identifiers with correct check digits per country.** UK NHS Numbers need
  Modulus 11. Australian IHIs need Luhn. Indian Aadhaar needs Verhoeff. Dutch BSN needs 11-proef.
  Developers either skip validation or hardcode known-valid numbers from documentation examples.

Complementary to fhir-resource-diff:
"Generate test data" (fhir-test-data) and "validate/diff resources" (fhir-resource-diff) are a
natural pair. Together they cover the two most common tasks in FHIR integration testing.

Target audience:
- FHIR developers writing integration tests
- QA teams testing healthcare applications
- Demo and sandbox builders who need realistic-looking data
- Developers working with country-specific FHIR profiles (US Core, UK Core, AU Core,
  CA Baseline, German ISiK, Indian ABDM, etc.)
- Teams building CI pipelines that need deterministic test fixtures

API surface sketch (v1):
Builder pattern for generating FHIR resources:
1. Patient — with country-specific identifiers, addresses, and names
2. Practitioner — with professional identifiers (NPI, GMC, LANR, etc.)
3. Organization — with organizational identifiers (ODS, IKNR, etc.)
4. Observation — vital signs, lab results with LOINC codes
5. Condition — common conditions with SNOMED CT codes
6. AllergyIntolerance — common allergies
7. MedicationStatement — common medications
8. Bundle — transaction, document, and searchset bundles with internal references

Locale/country parameter drives identifier systems, address formats, and name pools.

Multi-version support: the builder accepts an optional `fhirVersion` parameter (`'R4' | 'R4B' | 'R5'`).
R4 is the default. R4B and R5 are supported where resource shapes differ between versions.

CLI for generating fixture files:
- `fhir-test-data generate patient --locale uk --count 10 --output ./fixtures/`
- `fhir-test-data generate bundle --locale au --count 5 --output ./fixtures/`
- `fhir-test-data generate all --locale us --count 3 --output ./fixtures/`
- `--seed` flag for deterministic output
- `--format json|ndjson`

Architecture:
Design the codebase as two layers:
1. core library
   - browser-safe generators (no Node.js APIs)
   - FHIR resource builders
   - identifier generators with check digit algorithms
   - address and name generators
   - locale data
   - can be used in Node.js, browsers, test suites, build scripts
2. CLI adapter
   - file I/O
   - flags and command parsing
   - output formatting
   - Node-only code lives here

Repository structure:
/src
  /core
    types.ts
    builders/
      patient.ts
      practitioner.ts
      organization.ts
      observation.ts
      condition.ts
      allergy-intolerance.ts
      medication-statement.ts
      bundle.ts
    generators/
      identifiers.ts
      addresses.ts
      names.ts
      check-digits.ts
  /locales
    us/
    uk/
    au/
    ca/
    de/
    fr/
    nl/
    in/
  /cli
    index.ts
    commands/
/tests
/docs

Key product constraints:
- Must be open source safe and generic
- Must not depend on proprietary schemas or private health data
- All generated data must be obviously synthetic — no real PHI or PII
- Must prioritize clean architecture, maintainability, and developer experience
- Must be written in TypeScript with strict mode
- Must avoid overengineering the first version
- Identifier generators must pass the same validation algorithms that real systems use

Recommended stack:
- TypeScript (strict)
- pnpm
- zod for schema validation where helpful
- commander for CLI
- vitest for tests
- eslint + prettier
- tsup for packaging

Feature scope for v1:
1. Builder pattern for Patient, Practitioner, Organization
2. Clinical resource builders (Observation, Condition, AllergyIntolerance, MedicationStatement)
3. Bundle builder with internal references
4. Country-aware identifier generation with correct check digits
5. Country-aware address generation
6. Culturally appropriate name generation
7. CLI for generating fixture files
8. Deterministic output via seed parameter
9. Good README with examples
10. Good tests verifying identifier algorithms against known-valid values

Architecture note — FHIR version support:
R4 is the default version. R4B and R5 are supported where resource shapes differ between
versions (e.g., field renames, type changes). The `fhirVersion` parameter controls which
version's structure is emitted. Most resources are identical across R4/R4B; R5 introduces
more changes (e.g., `Observation.effective[x]` → `Observation.effective`).

Do not attempt in v1:
- Full FHIR profile validation (use fhir-resource-diff for that)
- Server integration, API calls, databases, or auth
- Web frontend
- AI integration
- Terminology server lookups
- Every FHIR resource type — start with the most common 8

Tone:
Write code and docs like an experienced engineer building a public utility for other engineers.
