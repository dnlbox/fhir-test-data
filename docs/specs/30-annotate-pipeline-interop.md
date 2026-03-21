---
**Status:** complete (fhir-test-data side)
---

# Spec 30 — `--annotate` pipeline interoperability

## Goal

`--annotate` wraps each resource in `{ resource, notes }` (spec 28). This intentionally breaks
the standard generate→validate pipeline because the output is no longer a raw FHIR resource:

```bash
# Works — raw resource
fhir-test-data generate patient --seed 1 | fhir-resource-diff validate -
# → valid

# Silently broken — annotated wrapper is not a FHIR resource
fhir-test-data generate patient --seed 1 --annotate | fhir-resource-diff validate -
# → Error: stdin input is not valid FHIR JSON: Missing or invalid resourceType
```

The error message "Missing or invalid resourceType" is confusing because the resource type *is*
there — it's just nested inside `result.resource.resourceType`.

There are two parallel fixes: one in each tool.

---

## Part A — `fhir-test-data`: warn about piping `--annotate` output

The `--annotate` help text says nothing about the `{resource, notes}` wrapper or the fact that
piping to `validate` requires extracting `.resource` first.

### Change

Add a note to the `--annotate` help text and, when stdout is a TTY, print a hint after the
output:

```
Note: --annotate wraps each resource. To validate: pipe through jq '.resource' first.
  fhir-test-data generate patient --annotate | jq '.resource' | fhir-resource-diff validate -
```

The hint is printed to **stderr only** — it must not appear when piped.

---

## Part B — `fhir-resource-diff`: recognise the annotate wrapper in validate

When `validate -` receives `{ resource: { resourceType: "..." }, notes: [...] }`, detect the
annotate wrapper and validate `resource` directly instead of rejecting the envelope.

### Detection heuristic

Input is an annotate wrapper when:
- Root object has exactly two keys: `resource` and `notes`
- `resource` is an object with a `resourceType` field
- `notes` is an array

### Behaviour

```bash
fhir-test-data generate patient --seed 1 --annotate | fhir-resource-diff validate -
# → valid   (validates the inner .resource)
# And emits a stderr notice: "Note: detected --annotate wrapper; validating inner resource"
```

The notice keeps the user informed that the envelope was unwrapped automatically.

---

## Deliverables

| Project | File | Change |
|---------|------|--------|
| `fhir-test-data` | `src/cli/commands/generate.ts` | Add stderr hint when `--annotate` + stdout is TTY |
| `fhir-test-data` | `README.md` / command help | Document pipeline limitation and `jq` workaround |
| `fhir-resource-diff` | `src/core/input/` | Add annotate-wrapper detection in the multi-resource parser |
| `fhir-resource-diff` | `tests/cli/validate.test.ts` | Tests for annotate wrapper via stdin |
| Both | `CHANGELOG.md` | Entries under `[Unreleased]` |

## Acceptance criteria

```bash
# Part A — warning on TTY
fhir-test-data generate patient --annotate
# stdout: { "resource": {...}, "notes": [...] }
# stderr: Note: --annotate wraps each resource. To validate, pipe through jq '.resource' first.

# Part A — no warning when piped
fhir-test-data generate patient --annotate | cat
# stdout only: { "resource": {...}, "notes": [...] }

# Part B — validate unwraps annotate wrapper
fhir-test-data generate patient --seed 1 --annotate | fhir-resource-diff validate -
# → valid

# Part B — full fault-injection round-trip through annotate
fhir-test-data generate patient --seed 5 --faults invalid-gender --annotate \
  | fhir-resource-diff validate -
# → valid (with warnings)
#   ⚠ gender: Invalid Patient.gender 'INVALID_GENDER': ...

# Non-wrapper JSON is unaffected
fhir-test-data generate patient --seed 1 | fhir-resource-diff validate -
# → valid  (no change)
```

## Do not do

- Do not change the `--annotate` output shape (spec 28 defines it; other consumers may depend on it)
- Do not emit the TTY hint to stdout — it must be stderr only
- Do not silently unwrap without the stderr notice in `fhir-resource-diff`
