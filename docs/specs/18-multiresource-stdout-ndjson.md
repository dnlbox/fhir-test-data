---
**Status:** complete
---

# Spec 18 — Multi-resource stdout defaults to NDJSON

## Goal

When multiple resources are generated and output goes to stdout, the default pretty-printed format
produces multi-line per-resource JSON with no structural separator between resources. This output
cannot be piped to `fhir-resource-diff validate -` (or any other NDJSON consumer) because the
validator treats each line as a separate JSON token, producing parse errors.

The `generate patient --count 5` path works today because it outputs a JSON array `[...]`, which
the validator correctly auto-detects. But `generate all` and any other multi-resource NDJSON output
(e.g., `--format ndjson`) breaks when pretty-printed.

The fix: when stdout is the destination and the output format is NDJSON (multiple independent
resources, not a JSON array), always emit compact JSON regardless of the `--pretty` flag. The
`--pretty` flag retains meaning only for single-resource output and for file output.

## Dependencies

- Spec 10 (cli) — complete
- Spec 14 (fault injection) — complete

## Deliverables

- `src/cli/commands/generate.ts` — change NDJSON stdout path to always compact
- `README.md` — document the piping workflow explicitly with examples
- `tests/cli/` — add tests confirming that `generate all` stdout is pipe-compatible

## Key interfaces / signatures

In `generate.ts`, when writing to stdout in NDJSON mode:

```typescript
// For NDJSON output to stdout: always compact (pipe-safe)
const line = JSON.stringify(resource);  // never JSON.stringify(resource, null, 2)
process.stdout.write(line + '\n');
```

When `--output <dir>` is specified, respect `--pretty` as before (file output is not piped).

## Implementation notes

- The root issue is that NDJSON, by definition, is one JSON object per line with no internal
  newlines. Pretty-printing a JSON object introduces newlines, breaking the NDJSON contract.
- The `--pretty` flag should be silently ignored for NDJSON stdout (not an error, just a no-op)
  and a note added to the README/help text to explain this
- `generate patient --count 5` outputs a JSON array by default — that path is fine as-is
- `generate all` always outputs NDJSON (multiple resource types, not an array) — this is the
  affected path
- File output with `--output <dir>` writes one file per resource; pretty-printing applies there

## Acceptance criteria

```bash
# generate all must pipe cleanly to fhir-resource-diff validate -
fhir-test-data generate all --locale us --seed 1 \
  | fhir-resource-diff validate -
# Expected: N resources: N valid, 0 invalid (no NDJSON parse warnings)

# --pretty flag must be a no-op for NDJSON stdout (no error, just compact output)
fhir-test-data generate all --locale us --seed 1 --pretty \
  | fhir-resource-diff validate -
# Expected: same clean output as above

# Single resource with --pretty still pretty-prints
fhir-test-data generate patient --locale us --seed 1 --pretty \
  | python3 -m json.tool --no-ensure-ascii > /dev/null
# Expected: valid JSON (no error from python3 -m json.tool)

# faults + generate all still pipe cleanly
fhir-test-data generate patient --locale us --seed 1 --faults malformed-date \
  | fhir-resource-diff validate -
# Expected: 1 resource with fhir-date-format warning
```

## Do not do

- Do not change the JSON array output for `generate patient --count N` — that is already pipe-safe
- Do not remove `--pretty` from the CLI interface — keep it for single resources and file output
- Do not change file output behavior (`--output <dir>`)
