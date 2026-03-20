# Spec 26: stdin overrides + `--overrides` flag

**Status:** in progress

## Goal

Allow field overrides to be supplied to the CLI either by piping JSON on stdin, or via a
`--overrides <json>` inline flag. Both paths use the existing `.overrides()` builder
mechanism (deep merge into every generated resource).

This completes the pipe story: data can flow both *out of* `fhir-test-data` (to `jq`,
validators, AI tools) and *into* it (from scripts, AI-generated payloads, or other
generators).

---

## Interface

```bash
# stdin pipe — JSON object merged into generated resource
echo '{"gender": "female", "birthDate": "1985-03-14"}' | \
  fhir-test-data generate patient --locale nl --seed 1

# inline flag
fhir-test-data generate patient --locale uk --overrides '{"meta": {"source": "test-suite"}}'

# both: stdin first, then --overrides applied on top (flag wins on conflicts)
cat overrides.json | fhir-test-data generate patient --overrides '{"id": "fixed-id"}'
```

---

## Acceptance criteria

- If stdin is not a TTY (`!process.stdin.isTTY`), read stdin to completion and parse
  as a JSON object; treat as base overrides
- If `--overrides <json>` is provided, parse as JSON; deep-merge on top of stdin overrides
  (flag wins on key conflicts)
- Empty stdin (whitespace only) is treated as no overrides — not an error
- Invalid JSON in either source writes a clear error to stderr and exits with code 1
- Overrides are applied to every resource in the batch (consistent with library behaviour)
- Works with all resource types including `generate all`
- Fault injection and seed reproducibility are unaffected
- `--output` + overrides: files contain the overridden resources

---

## Out of scope

- Per-index overrides (different payload per resource in a count > 1 batch)
- FHIRPath expression overrides
- Schema validation of the override object
