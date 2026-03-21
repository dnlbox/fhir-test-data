# CLI usage

The `fhir-test-data` CLI generates FHIR resources to stdout or a directory of files.

## Install

```bash
pnpm add -g fhir-test-data
# or
npm install -g fhir-test-data
```

## generate command

```
fhir-test-data generate <resource-type> [options]
```

### Resource types

| Type | Description |
|------|-------------|
| `patient` | Patient resources |
| `practitioner` | Practitioner resources |
| `organization` | Organization resources |
| `observation` | Observation resources |
| `condition` | Condition resources |
| `allergy-intolerance` | AllergyIntolerance resources |
| `medication-statement` | MedicationStatement resources (MedicationUsage in R5) |
| `bundle` | Bundle with all resource types and wired references |
| `all` | One of each resource type |

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `--locale <code>` | `us` | Locale code — see [Locales](/guide/locales) |
| `--count <n>` | `1` | Number of resources to generate (must be ≥ 1; exits 1 if 0, negative, or non-integer) |
| `--seed <n>` | `0` | Seed for deterministic output |
| `--fhir-version <v>` | `R4` | FHIR version: `R4` \| `R4B` \| `R5` |
| `--output <dir>` | stdout | Write one file per resource to this directory |
| `--format <fmt>` | `json` | Output format: `json` \| `ndjson` |
| `--pretty` | `true` for stdout | Pretty-print JSON |
| `--no-pretty` | — | Compact JSON |
| `--annotate` | off | Wrap each resource in `{ resource, notes }` with plain-language field explanations |

## Examples

### Stdout output

```bash
# UK patient, pretty JSON to stdout
fhir-test-data generate patient --locale uk --count 1 --seed 42

# 5 Dutch practitioners
fhir-test-data generate practitioner --locale nl --count 5 --seed 10

# German organization
fhir-test-data generate organization --locale de --seed 1
```

### File output

```bash
# 10 AU bundles to files
fhir-test-data generate bundle --locale au --count 10 --seed 1 --output ./fixtures/

# One of every resource type
fhir-test-data generate all --locale de --seed 99 --output ./fixtures/
```

Produces files named `<ResourceType>-<zero-padded-index>.json`:

```
fixtures/
  Patient-0001.json
  Practitioner-0001.json
  Organization-0001.json
  Bundle-0001.json through Bundle-0010.json
```

### NDJSON

```bash
# 1000 US patients as NDJSON for bulk loading
fhir-test-data generate patient \
  --locale us \
  --count 1000 \
  --format ndjson \
  --output ./fixtures/
```

Each line in the NDJSON file is a complete, compact JSON resource.

### FHIR version

```bash
# R5 patient
fhir-test-data generate patient --locale uk --fhir-version R5

# R5 bundle — MedicationStatement emitted as MedicationUsage
fhir-test-data generate bundle --locale us --seed 1 --fhir-version R5

# R4B (structurally identical to R4 for all generated resources)
fhir-test-data generate practitioner --locale de --fhir-version R4B
```

### Determinism check

```bash
fhir-test-data generate patient --locale uk --seed 42 > a.json
fhir-test-data generate patient --locale uk --seed 42 > b.json
diff a.json b.json  # empty — identical output
```

### Annotated output

Use `--annotate` to wrap each resource in a `{ resource, notes }` envelope. The `notes`
array contains plain-language explanations for each field — useful for onboarding or
generating human-readable test fixtures.

```bash
fhir-test-data generate patient --seed 1 --annotate
```

> **Piping to validate**: annotated output is not a raw FHIR resource. Extract `.resource`
> first with `jq` before passing to `fhir-resource-diff validate`:
>
> ```bash
> fhir-test-data generate patient --annotate | jq '.resource' | fhir-resource-diff validate -
> ```
>
> When running interactively (TTY), the CLI prints this hint to stderr automatically.

### Count validation

`--count` must be a positive integer (≥ 1). Passing `0`, a negative value, or a non-integer
exits with code 1:

```bash
fhir-test-data generate patient --count 0    # Error: --count must be a positive integer, got 0
fhir-test-data generate patient --count -1   # Error: --count must be a positive integer, got -1
fhir-test-data generate patient --count abc  # Error: --count must be a positive integer, got "abc"
```

## CI usage

```yaml
- name: Generate test fixtures
  run: fhir-test-data generate bundle --locale us --seed 1 --output ./fixtures/

- name: Validate fixtures
  run: |
    for f in fixtures/*.json; do
      fhir-resource-diff validate "$f" --fhir-version R4
    done
```

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Invalid options or generation error |
