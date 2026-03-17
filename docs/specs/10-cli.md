# Spec 10 — CLI

**Status:** open

## Goal

Implement the CLI adapter that exposes the core library's builders through a `generate`
command. The CLI writes FHIR JSON to stdout or to files.

## Dependencies

- Spec 05 (patient builder) complete
- Spec 06 (practitioner builder) complete
- Spec 07 (organization builder) complete
- Spec 08 (clinical builders) complete
- Spec 09 (bundle builder) complete

## Deliverables

| File | Description |
|------|-------------|
| `src/cli/index.ts` | CLI entry point with commander setup |
| `src/cli/commands/generate.ts` | Generate command implementation |
| `tests/cli/generate.test.ts` | CLI integration tests |

## Key interfaces / signatures

### CLI commands

```
fhir-test-data generate <resource-type> [options]

Resource types:
  patient              Generate Patient resources
  practitioner         Generate Practitioner resources
  organization         Generate Organization resources
  observation          Generate Observation resources
  condition            Generate Condition resources
  allergy-intolerance  Generate AllergyIntolerance resources
  medication-statement Generate MedicationStatement resources
  bundle               Generate Bundle resources (includes all resource types)
  all                  Generate one of each resource type

Options:
  --locale <code>      Locale for identifiers and addresses (default: "us")
  --count <n>          Number of resources to generate (default: 1)
  --seed <n>           Seed for deterministic output
  --output <dir>       Output directory (writes one file per resource). If omitted, prints to stdout.
  --format <fmt>       Output format: json | ndjson (default: "json")
  --pretty             Pretty-print JSON output (default: true for stdout, false for file output)
```

### Examples

```bash
# Generate 5 UK patients to stdout
fhir-test-data generate patient --locale uk --count 5

# Generate 10 AU patients to files
fhir-test-data generate patient --locale au --count 10 --output ./fixtures/

# Generate bundles with deterministic output
fhir-test-data generate bundle --locale us --count 3 --seed 42 --output ./fixtures/

# Generate one of each resource type
fhir-test-data generate all --locale de --output ./fixtures/

# NDJSON format (one resource per line)
fhir-test-data generate patient --locale us --count 100 --format ndjson --output ./fixtures/
```

## Implementation notes

### Entry point (src/cli/index.ts)

```typescript
#!/usr/bin/env node
import { Command } from "commander";
import { registerGenerateCommand } from "./commands/generate.js";

const program = new Command();

program
  .name("fhir-test-data")
  .description("Generate valid FHIR R4 test resources with country-aware identifiers")
  .version("0.1.0");

registerGenerateCommand(program);

program.parse();
```

### File output

When `--output` is specified:
- Create the directory if it doesn't exist.
- For JSON format: write one file per resource, named `{resourceType}-{index}.json`
  (e.g., `Patient-001.json`, `Bundle-001.json`).
- For NDJSON format: write one file per resource type, with one resource per line
  (e.g., `Patient.ndjson`).
- Print a summary to stderr: "Generated 10 Patient resources in ./fixtures/"

### Stdout output

When `--output` is omitted:
- For JSON format with count=1: print the single resource as pretty JSON.
- For JSON format with count>1: print a JSON array of resources.
- For NDJSON format: print one resource per line (compact JSON).
- Pretty-print by default for stdout (human-readable). `--no-pretty` to disable.

### Locale validation
Validate the `--locale` flag against `SUPPORTED_LOCALES`. If invalid, print an error
with the list of supported locales and exit 1.

### Error handling
- Invalid resource type → exit 1 with usage help
- Invalid locale → exit 1 with supported locale list
- Output directory creation failure → exit 1 with error message
- Write failure → exit 1 with error message

### Exit codes
- 0: success
- 1: user error (invalid arguments)
- 2: runtime error (I/O failure)

## Acceptance criteria

```bash
pnpm build                                                    # CLI binary built
pnpm test tests/cli/generate.test.ts                          # all pass
```

Manual verification:
```bash
# These should all produce valid output
node dist/cli/index.js generate patient --locale us
node dist/cli/index.js generate patient --locale uk --count 5
node dist/cli/index.js generate bundle --locale au --seed 42
node dist/cli/index.js generate all --locale de

# Determinism check
node dist/cli/index.js generate patient --locale uk --seed 42 > a.json
node dist/cli/index.js generate patient --locale uk --seed 42 > b.json
diff a.json b.json  # should be empty (identical output)

# File output
node dist/cli/index.js generate patient --locale us --count 3 --output /tmp/fixtures
ls /tmp/fixtures/  # Patient-001.json, Patient-002.json, Patient-003.json
```

## Do not do

- Do not add `validate` or `diff` commands — those belong to fhir-resource-diff.
- Do not add interactive prompts or terminal UI.
- Do not add `--profile` flag implementation — reserve the flag name but do not implement.
- Do not add color output for generated JSON — keep it plain.
- Do not import core library modules from the cli that would break browser-safety of core.
