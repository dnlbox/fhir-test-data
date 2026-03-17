# Spec 00 — Project setup

**Status:** open

## Goal

Bootstrap the repository with all tooling configuration so subsequent specs can immediately write
TypeScript, run tests, and build without additional setup.

## Dependencies

None. This is the first spec.

## Deliverables

| File | Description |
|------|-------------|
| `package.json` | pnpm workspace, scripts, dependencies |
| `tsconfig.json` | Strict TypeScript config |
| `tsconfig.build.json` | Build-only config (excludes tests) |
| `eslint.config.mjs` | ESLint flat config (v9+) |
| `.prettierrc` | Prettier config |
| `vitest.config.ts` | Vitest config |
| `tsup.config.ts` | tsup build config |
| `.nvmrc` | Node version pin |

## Key configuration details

### package.json

```json
{
  "name": "fhir-fixtures",
  "version": "0.1.0",
  "description": "TypeScript library and CLI for generating valid FHIR R4 test resources with country-aware identifiers",
  "type": "module",
  "bin": { "fhir-fixtures": "./dist/cli/index.js" },
  "main": "./dist/core/index.js",
  "exports": {
    ".": "./dist/core/index.js"
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src tests",
    "lint:fix": "eslint src tests --fix",
    "format": "prettier --write .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "prepublishOnly": "pnpm build && pnpm typecheck && pnpm test"
  }
}
```

Key dependencies to install (use latest compatible versions):
- **runtime:** `zod`, `commander`
- **devDependencies:** `typescript`, `tsup`, `vitest`, `@vitest/coverage-v8`, `eslint`,
  `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `typescript-eslint`,
  `prettier`, `eslint-config-prettier`

### tsconfig.json

- `target`: `ES2022`
- `module`: `NodeNext`
- `moduleResolution`: `NodeNext`
- `strict`: `true`
- `noUncheckedIndexedAccess`: `true`
- `exactOptionalPropertyTypes`: `true`
- `include`: `["src", "tests"]`

### tsup config

- Entry points: `src/core/index.ts`, `src/cli/index.ts`
- Format: `esm`
- `dts`: true (generate `.d.ts` for library consumers)
- `clean`: true

### vitest.config.ts

- Use `globals: false` — explicit imports preferred
- Coverage provider: `v8`
- Test file pattern: `tests/**/*.test.ts`

## Implementation notes

- Use `"type": "module"` — the whole project is ESM.
- Use ESLint flat config (v9+) with `typescript-eslint` — not the legacy `.eslintrc` format.
- Set `noUncheckedIndexedAccess: true` — this forces explicit handling of array access, which
  matters for generators operating on locale data arrays.
- Pin Node version to 20 LTS in `.nvmrc`.

## Acceptance criteria

```bash
pnpm install          # no errors
pnpm typecheck        # passes with zero errors (src/ is empty stubs at this point)
pnpm lint             # passes
pnpm build            # produces dist/ directory
pnpm test             # passes (0 tests is fine at this stage)
```

## Do not do

- Do not install React, Vite, or any UI framework.
- Do not install any terminal UI library (ink, blessed, etc.).
- Do not create any `src/` implementation files in this spec — only tooling config.
- Do not install FHIR-specific packages (@types/fhir, etc.) — we define our own types.
