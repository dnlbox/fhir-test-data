# Spec 13 — npm publish

**Status:** open

## Goal

Configure the project for npm publishing. Set up package.json fields, publish config,
and a GitHub Actions workflow for automated publishing on version tags.

## Dependencies

- Spec 10 (CLI) complete — binary entry point configured
- Spec 11 (README) complete — README exists for npm page
- Spec 12 (CI) complete — CI validates before publish

## Deliverables

| File | Description |
|------|-------------|
| `package.json` | Updated with publishing fields |
| `.github/workflows/publish.yml` | GitHub Actions publish workflow |
| `.npmignore` or `files` field | Control what gets published |

## Key interfaces / signatures

N/A — this is a publishing/infrastructure spec.

## Implementation notes

### package.json updates

```json
{
  "name": "fhir-test-data",
  "version": "0.1.0",
  "description": "TypeScript library and CLI for generating valid FHIR R4 test resources with country-aware identifiers",
  "license": "MIT",
  "author": "Daniel Veronez",
  "repository": {
    "type": "git",
    "url": "https://github.com/danielveronez/fhir-test-data"
  },
  "keywords": [
    "fhir", "hl7", "healthcare", "test-data", "fixtures", "synthetic-data",
    "identifier", "nhs", "medicare", "aadhaar", "bsn", "npi",
    "typescript", "cli"
  ],
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "engines": {
    "node": ">=20"
  }
}
```

### Publish workflow

```yaml
name: Publish
on:
  push:
    tags: ["v*"]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: https://registry.npmjs.org
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
      - run: pnpm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### npm provenance
Use `--provenance` flag for npm provenance attestation. This requires `id-token: write`
permission in the workflow.

### Publishing checklist (manual steps)
1. Create npm account (if not exists)
2. Create `NPM_TOKEN` secret in GitHub repository settings
3. Create `LICENSE` file (MIT)
4. Tag release: `git tag v0.1.0 && git push --tags`

## Acceptance criteria

- `pnpm pack` produces a tarball with only `dist/`, `README.md`, and `LICENSE`
- Publish workflow exists at `.github/workflows/publish.yml`
- `files` field in package.json limits published content
- `engines.node` is set to `>=20`
- Keywords are relevant for npm search discovery

## Do not do

- Do not publish to npm in this spec — only configure for publishing.
- Do not add changelog automation (changesets, etc.) — manual for now.
- Do not add GitHub Release creation — manual for now.
- Do not commit NPM_TOKEN or any secrets.
