# CLI reference

Complete reference for all `fhir-test-data` CLI commands and options.

## Synopsis

```
fhir-test-data generate <resource-type> [options]
```

## Resource types

| Value | FHIR resource type |
|-------|-------------------|
| `patient` | `Patient` |
| `practitioner` | `Practitioner` |
| `organization` | `Organization` |
| `observation` | `Observation` |
| `condition` | `Condition` |
| `allergy-intolerance` | `AllergyIntolerance` |
| `medication-statement` | `MedicationStatement` (R4/R4B), `MedicationUsage` (R5) |
| `bundle` | `Bundle` containing all resource types with wired references |
| `all` | One of each resource type above |

## Options

### `--locale <code>`

**Default:** `us`

Locale code for name pools, address formats, and identifier systems. See [Locales](/guide/locales) for the full list.

```bash
fhir-test-data generate patient --locale uk
fhir-test-data generate bundle --locale nl
```

Valid values: `us` `uk` `au` `ca` `de` `fr` `nl` `in` `jp` `kr` `sg` `br` `mx` `za`

---

### `--count <n>`

**Default:** `1`

Number of resources to generate. Each resource gets its own UUID and seed-derived values.

```bash
fhir-test-data generate patient --locale us --count 100
```

---

### `--seed <n>`

**Default:** `0`

Integer seed for deterministic generation. The same seed + locale + resource type always
produces the same output.

```bash
fhir-test-data generate patient --locale uk --seed 42
```

---

### `--fhir-version <version>`

**Default:** `R4`

FHIR version. Accepted values: `R4` `R4B` `R5`

R4B is structurally identical to R4 for all generated resources. R5 changes
`MedicationStatement` to `MedicationUsage` and restructures `AllergyIntolerance.type`.
See [FHIR versions](/guide/fhir-versions).

```bash
fhir-test-data generate bundle --locale us --fhir-version R5
```

---

### `--output <dir>`

**Default:** stdout

Write each resource to a separate file in the given directory. The directory is created
if it does not exist.

Output filenames follow the pattern `<ResourceType>-<zero-padded-index>.json`:

```
fixtures/
  Patient-0001.json
  Patient-0002.json
  Bundle-0001.json
```

```bash
fhir-test-data generate patient --locale au --count 5 --output ./fixtures/
```

---

### `--format <fmt>`

**Default:** `json`

Output format. Accepted values: `json` `ndjson`

- `json` — one file per resource (with `--output`) or a JSON array to stdout
- `ndjson` — newline-delimited JSON; one resource per line

```bash
fhir-test-data generate patient --locale us --count 1000 --format ndjson --output ./fixtures/
```

---

### `--pretty` / `--no-pretty`

**Default:** `--pretty` for stdout, compact for `--output`

Controls JSON formatting. Pretty-print is the default for stdout; compact is the default
when writing to files.

```bash
# Compact stdout
fhir-test-data generate patient --locale uk --no-pretty

# Pretty-print to files
fhir-test-data generate patient --locale uk --output ./fixtures/ --pretty
```

---

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Invalid option value, unknown locale, or generation error |

---

## Examples

```bash
# 5 UK patients to stdout
fhir-test-data generate patient --locale uk --count 5 --seed 42

# AU bundle to a file
fhir-test-data generate bundle --locale au --seed 1 --output ./fixtures/

# 1000 US patients as NDJSON
fhir-test-data generate patient --locale us --count 1000 --format ndjson --output ./fixtures/

# R5 bundle
fhir-test-data generate bundle --locale us --seed 1 --fhir-version R5

# One of every resource type
fhir-test-data generate all --locale de --seed 99 --output ./fixtures/

# Determinism check
fhir-test-data generate patient --locale nl --seed 42 > a.json
fhir-test-data generate patient --locale nl --seed 42 > b.json
diff a.json b.json  # empty output — identical files
```
