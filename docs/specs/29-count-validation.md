---
**Status:** complete
---

# Spec 29 — `--count` argument validation

## Goal

`generate --count 0` and `generate --count -1` silently output `[]` (an empty JSON array) and
exit 0. This looks like valid output but is always a user error — no resource generation happened.
Both cases should exit with a clear error message.

## Reproduction

```bash
fhir-test-data generate patient --count 0
# → []   (exit 0 — no error, no output)

fhir-test-data generate patient --count -1
# → []   (exit 0 — no error, no output)
```

When piped downstream (e.g. `| fhir-resource-diff validate -`), the result is `0 resources
validated` — a confusing no-op with no indication of what went wrong.

## Desired behaviour

```bash
fhir-test-data generate patient --count 0
# Error: --count must be a positive integer, got 0
# exit 1

fhir-test-data generate patient --count -1
# Error: --count must be a positive integer, got -1
# exit 1

fhir-test-data generate patient --count abc
# Error: --count must be a positive integer, got "abc"
# exit 1
```

## Deliverables

| File | Change |
|------|--------|
| `src/cli/commands/generate.ts` | Validate `--count` after parse: must be a positive integer (≥ 1); exit 1 with message if not |
| `tests/cli/generate.test.ts` | Tests for count 0, negative, non-integer |
| `CHANGELOG.md` | Entry under `[Unreleased]` |

## Implementation note

Commander.js parses `--count` as a string. The current code converts it with `parseInt` or
similar. The validation should run after conversion and before the generation loop.

## Acceptance criteria

```bash
fhir-test-data generate patient --count 0
# exit 1, stderr contains "must be a positive integer"

fhir-test-data generate patient --count -5
# exit 1, stderr contains "must be a positive integer"

fhir-test-data generate patient --count 3
# exit 0, 3 resources output (no change to existing behaviour)
```

## Do not do

- Do not treat count 0 as "generate all types" — that is `generate all`
- Do not silently clamp negative values to 1 — an error is clearer than silent correction
