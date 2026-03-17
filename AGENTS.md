# AGENTS.md — fhir-fixtures

## Project overview

A TypeScript-first library **and** CLI for generating valid, realistic FHIR R4 test resources.
Country-aware — generates identifiers that pass real validation algorithms (NHS Modulus 11,
Australian IHI Luhn, Indian Aadhaar Verhoeff, Dutch BSN 11-proef, etc.).

The core logic is designed to be **shared** between the CLI (Node.js) and any consumer
that needs FHIR test data — test suites, build scripts, browser-based tools.

## Architecture (three layers)

```
src/core/        → shared, browser-safe logic (types, builders, generators)
src/locales/     → country-specific data (identifiers, addresses, names)
src/cli/         → Node-only CLI adapter (file I/O, flags, output)
```

**Rule:** All code under `src/core/` and `src/locales/` MUST be browser-safe.
Do not import `node:fs`, `node:path`, `node:process`, or any Node-built-in there.
The CLI adapter is the only place that may use Node-specific APIs.

## Stack

| Tool | Purpose |
|------|---------|
| TypeScript (strict) | Language |
| pnpm | Package manager |
| tsup | Build / bundling |
| vitest | Tests |
| eslint + prettier | Linting / formatting |
| zod | Schema validation where helpful |
| commander | CLI framework |

## Coding conventions

- **No `any`** unless clearly unavoidable and commented with a reason.
- **Explicit return types** on all exported functions.
- **Small, focused modules** — one concept per file.
- **Types-first design** — define the type/interface, then implement.
- **No side effects at import time** — a module should do nothing just by being imported.
- **Pure functions preferred** — especially in `src/core/` and `src/locales/`.
- **Named exports only** — no default exports.
- **Comments** only for non-obvious intent, trade-offs, or constraints. Never narrate what the code does.

## Locale data organization

All country-specific data lives in `src/locales/{country-code}/`:

```
src/locales/
  us/
    identifiers.ts    → SSN, MRN, NPI generators
    addresses.ts      → US address data and postal code generator
    names.ts          → Common US names
    index.ts          → re-exports locale definition
  uk/
    identifiers.ts    → NHS Number (Modulus 11), ODS, GMC/GMP
    addresses.ts      → UK address data and postcode generator
    names.ts          → Common UK names
    index.ts
  au/
    ...
  (etc.)
```

Each locale exports a `LocaleDefinition` object that the builders consume.
No locale should import from another locale. Shared utilities (check digit algorithms)
live in `src/core/generators/check-digits.ts`.

## Quality bar

- Code should look like it was written by a senior engineer for a public open-source utility.
- Prefer **clearer architecture** over more features.
- Prefer **maintainability** over cleverness.
- Every exported function should have at least one corresponding test.
- Every identifier generator must be tested against known-valid examples.
- **No real PHI or PII in test data.** All generated data must be obviously synthetic.
  Use name pools of common names, use invalid-range identifiers where possible
  (e.g., US SSNs in the 900–999 area range which is never assigned to real people).

## Commit and PR discipline

- Small, focused commits — one logical change per commit.
- Commit messages: imperative mood, concise summary line, optional body for "why".
- Do not commit generated files, secrets, or proprietary data.

## Changelog discipline

**Every user-facing change must be recorded in `CHANGELOG.md` under `[Unreleased]`
in the same commit that introduces the change.** This applies to any agent or
contributor, not just humans.

User-facing changes include: new features, new locale support, new resource builders,
CLI changes, identifier algorithm additions, and bug fixes.

Does NOT require a changelog entry: internal refactors with no observable
behaviour change, test-only changes, documentation-only changes, dependency
bumps with no user impact.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## What NOT to do

- Do not add full FHIR profile validation — that is fhir-resource-diff's domain.
- Do not add server integration, API calls, databases, or auth.
- Do not add a web frontend until the core library and CLI are solid.
- Do not create placeholder directories or files with no real implementation.
- Do not use Node-specific APIs in `src/core/` or `src/locales/`.
- Do not include real PHI, PII, or actual patient/practitioner identifiers.
- Do not implement terminology server lookups — use static code lists.
