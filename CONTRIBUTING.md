# Contributing to fhir-test-data

Thank you for your interest in contributing. This document explains what kind of project
this is, what contributions are welcome, and — equally important — what is intentionally
out of scope.

---

## What kind of project this is

Two principles shape every decision in this codebase. Understanding them will save you
time before you write a line of code.

### Functional core, thin adapter

The project is split into two distinct layers:

```
src/core/    browser-safe functional core — no I/O, no side effects
src/locales/ country-specific data — also browser-safe
src/cli/     thin Node.js adapter — file I/O, flags, exit codes only
```

The core has no Node.js APIs. Every function takes data in and returns data out. This
isn't arbitrary constraint — it's what makes the library usable in browsers, Cloudflare
Workers, test harnesses, and AI pipelines without configuration. A contribution that
introduces `fs`, `path`, `process`, or any Node built-in into `src/core/` will be
declined regardless of how useful the feature is, because it breaks the browser-safe
guarantee.

The CLI is intentionally thin. It reads flags, calls core builders, formats output, and
writes files. No generation logic lives there.

### Curated, not complete

This library does not aim to generate every FHIR resource type or every possible field
value. It generates the resources that cover the vast majority of real-world FHIR
developer needs — Patient, Practitioner, Organization, and the most common clinical
resources — with correct, validated identifiers and realistic field values.

**This is a deliberate design decision, not a gap waiting to be filled.** A contribution
that generates technically valid but clinically meaningless data, or that attempts to
cover every field in the FHIR spec, will not be accepted.

---

## What contributions are welcome

### Genuinely welcome

- New locales with accurate name pools, address formats, and check-digit-validated
  identifiers (follow the pattern in `src/locales/us/`)
- Additional check-digit algorithms for existing or new identifier systems
- Bug fixes in identifier validation, builder output, or CLI behaviour
- New CLI flags that serve common testing workflows
- Test coverage for edge cases not currently covered
- Improved error messages for invalid configurations

### Welcome — but open an issue first

- **New resource types** — align on scope before building; a resource type that isn't
  widely used in integration testing is unlikely to be accepted
- **New builder options** — shared builder methods (`.locale()`, `.seed()`, etc.) have
  downstream effects on all resource types
- **Performance improvements** — welcome, but not at the cost of determinism or readability

### Out of scope — will not be accepted

| Contribution | Why |
|---|---|
| StructureDefinition-driven generation | Changes the fundamental character of the project |
| Clinical realism simulation (disease progression, realistic lab ranges over time) | [Synthea](https://github.com/synthetichealth/synthea) is purpose-built for this |
| FHIRPath evaluation | Different problem domain |
| FHIR terminology server integration | Requires live infrastructure |
| XML output | JSON-only by design |
| Non-FHIR data formats | Different domain entirely |

---

## Spec-driven development

Significant features start as a spec file in `docs/specs/` before any code is written.
Specs define the goal, interface design, acceptance criteria, and explicit out-of-scope
items. This lets us align on direction before effort is invested.

**To find open specs:**
```bash
grep -rL "Status.*complete" docs/specs/*.md
```

**Before building a significant feature:** open a GitHub issue with a draft spec. See
[`docs/specs/ORCHESTRATOR.md`](docs/specs/ORCHESTRATOR.md) for the spec format and
current build order.

---

## Locale requirements

All locale implementations must meet minimum pool sizes to produce meaningful variety:

- **Given names**: 30+ per gender (male, female)
- **Family names**: 40+
- **Identifiers**: at least one patient identifier with check-digit validation
- **Addresses**: real street name patterns, correct postal code format

New locales follow the structure in `src/locales/us/`:

```
src/locales/<code>/
  index.ts      # locale metadata: identifier definitions, address template, name pool refs
  names.ts      # given and family name pools
  addresses.ts  # street names, cities, postal code generator
```

---

## Setup

```bash
git clone https://github.com/dnlbox/fhir-test-data.git
cd fhir-test-data
pnpm install
```

Run the CLI from source — no build step needed during development:

```bash
pnpm cli -- generate patient --locale uk --count 3 --seed 42
```

The `--` separator is required so pnpm passes flags to the script rather than consuming
them itself. `tsx` runs the TypeScript source directly.

### Scripts

| Script | Purpose |
|--------|---------|
| `pnpm cli -- <args>` | Run CLI from source |
| `pnpm test` | Run all tests |
| `pnpm test:watch` | Tests in watch mode |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm lint` | ESLint |
| `pnpm build` | Production build |
| `pnpm docs:dev` | VitePress dev server |

### Before submitting

All four checks must pass:

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

Tests in `src/core/` should be pure unit tests — no file I/O, no network, no subprocess
spawning. Pass data directly to functions.

---

## Code style

See [`AGENTS.md`](AGENTS.md) for the full conventions. The key patterns:

**Immutable builders.** Each builder method returns a new instance. Callers should never
need to clone a builder to safely fork a chain.

```typescript
// The builder is safe to reuse — baseBuilder is not mutated
const baseBuilder = createPatientBuilder().locale("uk").seed(42);
const ukPatients = baseBuilder.count(5).build();
const singlePatient = baseBuilder.count(1).build();
```

**Guard clauses over nesting.** Handle edge cases first and return early. The happy path
should be the last thing in the function, at the lowest indentation level.

**Named constants for patterns.** Regex patterns, date formats, and opaque string
literals become named constants before use. The name explains the intent.

**No Node.js imports in `src/core/`.** This constraint is enforced by code review, not
by a build tool. Check your imports before opening a PR.

---

## The project's scope in one test

When in doubt about whether a contribution fits, ask:

> *Does this make the tool more useful for a developer who needs valid, internationally
> correct FHIR test data without copying production records?*

If the answer isn't clearly yes — if it requires a running server, a terminology download,
or clinical simulation — it's probably out of scope.
