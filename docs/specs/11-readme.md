# Spec 11 — README

**Status:** open

## Goal

Write a comprehensive README.md that makes the repository look like a serious public
engineering project. The README is the primary entry point for potential users and
contributors.

## Dependencies

- Spec 10 (CLI) complete — need working CLI examples to document

## Deliverables

| File | Description |
|------|-------------|
| `README.md` | Root README |

## Key interfaces / signatures

N/A — this is a documentation spec.

## Implementation notes

### README structure

1. **Title and tagline**
   - "fhir-test-data"
   - "Generate valid FHIR R4 test resources with country-aware identifiers"

2. **Why this exists** (2–3 paragraphs)
   - The test data problem in FHIR development
   - No TypeScript-first solution exists
   - The international identifier gap

3. **Quick start**
   - Install: `pnpm add fhir-test-data` (library) or `pnpm add -g fhir-test-data` (CLI)
   - Library usage: 3-line example generating a UK Patient
   - CLI usage: 2-line example generating fixtures

4. **Supported locales** (table)
   - Country, locale code, patient identifiers, algorithm, practitioner identifiers
   - All 8 locales

5. **API reference**
   - Patient builder
   - Practitioner builder
   - Organization builder
   - Clinical builders (Observation, Condition, AllergyIntolerance, MedicationStatement)
   - Bundle builder
   - Options: locale, count, seed, overrides

6. **CLI reference**
   - Full command syntax
   - All flags
   - Examples for common use cases

7. **Identifier validation algorithms**
   - Brief explanation of each: Luhn, Modulus 11, Verhoeff, 11-proef, Modulus 97
   - Which countries use which algorithm

8. **Comparison with Synthea** (brief table)
   - Language, library vs tool, international support, deterministic, TS integration

9. **Architecture**
   - Two-layer design (core + CLI)
   - Browser-safe core
   - Locale data organization

10. **Complementary tools**
    - fhir-resource-diff for validation and diffing
    - Natural workflow: generate → validate → diff

11. **Roadmap**
    - Phase 1: Foundation (current)
    - Phase 2: More resources, profiles
    - Phase 3: Profile-aware generation, IPS support

12. **Contributing**
    - Brief guidance, link to CONTRIBUTING.md if it exists

13. **License**
    - MIT

### Tone
Professional, technical, concise. No marketing language. Write like a senior engineer
explaining a tool to other senior engineers.

### Code examples
All code examples must be tested against the actual implementation. Do not include
examples that would fail if copy-pasted.

## Acceptance criteria

- README exists at root
- All code examples in the README produce valid output when run
- Supported locales table is complete and accurate
- CLI examples match the actual CLI interface
- No broken links

## Do not do

- Do not include badges until CI is set up (spec 12).
- Do not include npm version badge until published (spec 13).
- Do not overwrite with marketing language — keep it technical.
- Do not include a full API reference — link to generated docs if applicable.
