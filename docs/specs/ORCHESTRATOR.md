# ORCHESTRATOR.md — fhir-test-data build guide

## What this is

This file is the entry point for any AI session tasked with building or extending `fhir-test-data`.
Read this first. Then read the spec for the specific deliverable you are implementing.

## Project in one paragraph

`fhir-test-data` is a TypeScript library and CLI for generating valid, realistic FHIR R4/R4B/R5 test
resources with country-aware identifiers, addresses, and names. The core logic is **browser-safe**
so it can be used in Node.js, test suites, and browser-based tools. The CLI is a thin Node.js
adapter on top of that shared core. See `docs/PROJECT.md` for the full project spec. See
`AGENTS.md` for coding conventions.

## Mandatory reading before any session

1. `AGENTS.md` (root) — conventions, constraints, quality bar
2. The spec file for your assigned deliverable (`docs/specs/NN-name.md`)
3. `docs/research/01-country-identifiers.md` if working on identifier generators
4. `docs/research/02-address-formats.md` if working on address generators

---

## Build order and dependency graph

Specs must be executed in order. Each spec lists its own dependencies, but the canonical order is:

### Phase 1 — Foundation

```
00-project-setup              (no dependencies)
       |
01-core-types                 (depends on: 00)
       |
       +---- 02-identifier-generators   (depends on: 01)
       |
       +---- 03-address-generators      (depends on: 01)
       |
       +---- 04-name-generators         (depends on: 01)
       |
       +--------+--------+
                |
       05-patient-builder              (depends on: 01, 02, 03, 04)
```

### Phase 2 — More resources

```
05-patient-builder
       |
       +---- 06-practitioner-builder   (depends on: 01, 02, 03, 04)
       |
       +---- 07-organization-builder   (depends on: 01, 02, 03)
       |
       +---- 08-clinical-builders      (depends on: 01, 05)
       |
       +--------+--------+--------+
                |
       09-bundle-builder               (depends on: 05, 06, 07, 08)
```

### Phase 3 — CLI and publishing

```
09-bundle-builder
       |
       10-cli                          (depends on: 05, 06, 07, 08, 09)
       |
       +---- 11-readme                 (depends on: 10)
       |
       +---- 12-ci                     (depends on: 00)
       |
       13-npm-publish                  (depends on: 10, 11, 12)
```

**Rule:** Do not start a spec until all specs above it in the graph are complete and verified.

**Parallelization guide:**
- Specs 02, 03, and 04 have no dependencies on each other — they can run in parallel after 01.
- Specs 06, 07, and 08 can run in parallel after 05 is complete.
- Spec 12 (CI) can run in parallel with anything after 00.
- Spec 11 (README) should be done after 10 so it can reference the CLI.
- Spec 13 (npm publish) should be done last.

---

## Spec file template

Every spec in `docs/specs/` follows this structure so sessions can parse them reliably:

- **Goal** — what this deliverable produces
- **Dependencies** — what must already exist
- **Deliverables** — exact files to create or modify
- **Key interfaces / signatures** — TypeScript types or function signatures to implement
- **Implementation notes** — constraints, design decisions, locale-specific guidance
- **Acceptance criteria** — verifiable checks (commands to run, output to expect)
- **Do not do** — explicit out-of-scope items

---

## Handoff protocol

### Before starting a session

1. Run `pnpm build` and `pnpm test` — confirm the baseline is clean (or note any pre-existing failures).
2. Read the spec you are implementing top to bottom.
3. Check `git status` — confirm you are starting from a clean working tree.

### During a session

- Implement one spec at a time. Do not combine multiple specs in one session unless they are trivially small.
- Write or update tests alongside the implementation, not after.
- Commit when a meaningful unit of work is complete and tests pass.
- Commit messages: imperative, concise. Example: `add Luhn and Modulus 11 check digit generators`.

### Before ending a session

Run these checks and confirm all pass before stopping:

```bash
pnpm typecheck     # tsc --noEmit
pnpm lint          # eslint
pnpm test          # vitest
pnpm build         # tsup
```

If any check fails, fix it before ending the session. Do not leave failing checks as a known issue
unless it is genuinely blocked by an upstream dependency that hasn't been implemented yet — in that
case, document it explicitly in a `TODO` comment with the blocking spec number.

---

## What "done" means for the whole project (v1)

The project is considered v1-complete when:

- [ ] `pnpm build` succeeds and produces a working CLI binary
- [ ] `pnpm test` passes with coverage of all core modules
- [ ] `fhir-test-data generate patient --locale us --count 5` produces valid FHIR Patient JSON
- [ ] `fhir-test-data generate patient --locale uk --count 5` produces Patients with valid NHS Numbers
- [ ] `fhir-test-data generate bundle --locale au --count 3` produces Bundles with internal references
- [ ] `fhir-test-data generate patient --locale uk --count 5 --seed 42` produces deterministic output
- [ ] All identifier generators pass validation against known-valid examples
- [ ] README accurately describes the tool and includes working examples
- [ ] No TypeScript errors, no lint errors
- [ ] No Node-specific imports in `src/core/` or `src/locales/`
- [ ] No real PHI or PII in any generated data
- [ ] `fhir-test-data generate patient --locale us --fhir-version R5` produces valid R5 Patient JSON

---

## Spec index

### Phase 1 — Foundation

| # | Spec | Key deliverable | Status |
|---|------|-----------------|--------|
| 00 | `00-project-setup.md` | pnpm, typescript, vitest, tsup, eslint, prettier | complete |
| 01 | `01-core-types.md` | FHIR resource types, builder interfaces, locale types | complete |
| 02 | `02-identifier-generators.md` | Check digit algorithms: Luhn, Modulus 11, Verhoeff, 11-proef | complete |
| 03 | `03-address-generators.md` | Country-aware address generation | complete |
| 04 | `04-name-generators.md` | Culturally appropriate names per locale | open |
| 05 | `05-patient-builder.md` | Patient resource builder | open |

### Phase 2 — More resources

| # | Spec | Key deliverable | Status |
|---|------|-----------------|--------|
| 06 | `06-practitioner-builder.md` | Practitioner + PractitionerRole builder | open |
| 07 | `07-organization-builder.md` | Organization builder | open |
| 08 | `08-clinical-builders.md` | Observation, Condition, AllergyIntolerance, MedicationStatement | open |
| 09 | `09-bundle-builder.md` | Bundle builder with internal references | open |

### Phase 3 — CLI and publishing

| # | Spec | Key deliverable | Status |
|---|------|-----------------|--------|
| 10 | `10-cli.md` | CLI generate command | open |
| 11 | `11-readme.md` | Root README.md | open |
| 12 | `12-ci.md` | GitHub Actions: typecheck, lint, test, build | open |
| 13 | `13-npm-publish.md` | npm publishing setup | open |
