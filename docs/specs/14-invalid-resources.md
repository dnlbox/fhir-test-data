# Spec 14 — Invalid resource generation

**Status:** pending

## Goal

Add an opt-in `--faults` flag to the `generate` command that produces intentionally
invalid FHIR resources. This enables two things:

1. **Testing fhir-resource-diff** — generate resources with known violations so the
   validator can be exercised against them and its coverage can be measured.

2. **Feedback loop between projects** — fhir-test-data and fhir-resource-diff can
   drive each other's improvement:

   ```bash
   # Generate 20 patients with random faults, validate, report which ones slipped through
   fhir-test-data generate patient --count 20 --faults random \
     | fhir-resource-diff validate - --format json \
     | jq '[.[] | select(.valid == true)] | length'
   ```

   Any resource that passes validation despite having an injected fault is a gap in
   the validator. That's actionable signal for both projects.

## Dependencies

- Spec 10 (CLI) — `generate` command must be complete
- Spec 05 (patient builder) — fault injection targets patient-specific fields

## Deliverables

| File | Description |
|------|-------------|
| `src/core/faults/types.ts` | `FaultType` union, `FaultSpec` type |
| `src/core/faults/inject.ts` | `injectFaults(resource, faults, rng)` — pure function |
| `src/core/faults/registry.ts` | Map of `FaultType` → injection strategy |
| `src/cli/commands/generate.ts` | Add `--faults` option; wire to inject step |
| `tests/faults/inject.test.ts` | Unit tests for each fault type |

## Fault types

```typescript
export type FaultType =
  | "missing-resource-type"   // remove resourceType entirely
  | "invalid-resource-type"   // set resourceType to a non-existent value
  | "missing-id"              // remove id field
  | "invalid-gender"          // set gender to a value not in the FHIR ValueSet
  | "malformed-date"          // set birthDate to a non-ISO-8601 value
  | "empty-name"              // set name to an empty array
  | "wrong-type-on-field"     // set a string field to a number
  | "duplicate-identifier"    // repeat the same identifier system/value twice
  | "invalid-telecom-system"  // set telecom[0].system to an unrecognised value
  | "random";                 // pick one fault uniformly at random
```

`"random"` is a convenience alias — it selects one of the above types (excluding
itself) using the seeded RNG, so results are reproducible.

## Fault injection model

Faults are applied **after** the resource is built. `injectFaults` takes a fully-valid
resource, a list of fault types, and an RNG, and returns a new resource object with
the requested violations introduced. The original resource is not mutated.

```typescript
export function injectFaults(
  resource: FhirResource,
  faults: FaultType[],
  rng: RandomFn,
): FhirResource;
```

Multiple faults can be applied to the same resource:

```bash
fhir-test-data generate patient --faults missing-id,invalid-gender
```

When `"random"` is in the list it is expanded to one random concrete fault before
application. Duplicate fault types in the list are applied once each.

### Per-fault behaviour

| Fault | What changes |
|-------|-------------|
| `missing-resource-type` | Delete the `resourceType` key |
| `invalid-resource-type` | Set `resourceType` to `"InvalidResourceXYZ"` |
| `missing-id` | Delete the `id` key |
| `invalid-gender` | Set `gender` to `"INVALID_GENDER"` (or omit key entirely if no gender present) |
| `malformed-date` | Set `birthDate` to `"not-a-date"` |
| `empty-name` | Set `name` to `[]` |
| `wrong-type-on-field` | Set `birthDate` to `19850315` (integer instead of string) |
| `duplicate-identifier` | Push a copy of `identifier[0]` onto the `identifier` array |
| `invalid-telecom-system` | Set `telecom[0].system` to `"fax-machine"` |
| `random` | Expand to one of the above at RNG-determined choice |

Fields that don't exist on the resource (e.g. `gender` on an Organization) are silently
skipped — the fault is a no-op for that field. This means `--faults invalid-gender` on
an Organization produces a resource unchanged — not an error.

## CLI flag design

```
--faults <types>   Comma-separated list of fault types to inject into each generated
                   resource. Applied after generation. Use "random" to pick one fault
                   per resource at random (seeded, reproducible).
                   Example: --faults missing-id,invalid-gender
```

Each resource in the batch gets the same fault list applied independently. With
`"random"`, the choice is made once per resource using the same shared RNG, so
different resources in a batch can receive different fault types.

### Example invocations

```bash
# Single patient with missing resourceType
fhir-test-data generate patient --faults missing-resource-type

# Five patients each with a random fault (reproducible)
fhir-test-data generate patient --count 5 --seed 42 --faults random

# Pipe directly into fhir-resource-diff
fhir-test-data generate patient --count 10 --faults random \
  | fhir-resource-diff validate - --format json

# Check how many pass validation despite having a fault (gap detection)
fhir-test-data generate patient --count 50 --seed 1 --faults random \
  | fhir-resource-diff validate - --format json \
  | jq '[.[] | select(.valid == true)] | length'

# All valid (no faults — original behaviour)
fhir-test-data generate patient --count 5
```

## Output format

Resources with injected faults are output in the same JSON array / NDJSON format as
normal generation. No special marker is added to the output — the resource is simply
malformed in the intended way. Callers that need to know which fault was injected
should use `--format ndjson` and a wrapper script, or use the library API directly.

### Library API

When using `fhir-test-data` as a library, fault injection is a separate step:

```typescript
import { createPatientBuilder } from "fhir-test-data";
import { injectFaults } from "fhir-test-data/faults";

const patients = createPatientBuilder().count(5).seed(42).build();
const withFaults = patients.map((p, i) =>
  injectFaults(p, ["invalid-gender"], () => Math.random())
);
```

`injectFaults` is exported from the package's `faults` sub-path export. It is not
part of the main `core` export to keep the primary API uncluttered.

## Module layout

```
src/core/faults/
  types.ts         — FaultType union, exported
  inject.ts        — injectFaults(), exported
  registry.ts      — Map<FaultType, FaultStrategy>, internal
```

`package.json` exports:

```json
{
  "exports": {
    ".":        "./dist/core/index.js",
    "./faults": "./dist/core/faults/index.js"
  }
}
```

## What this is not

- **Not fuzzing**: faults are deterministic and typed, not random bit-flipping.
- **Not exhaustive**: the fault set covers common FHIR validation failure modes, not
  every possible schema violation.
- **Not resource-specific by default**: faults are defined at the FhirResource level
  (generic field manipulation). Resource-specific faults (e.g. invalid Observation
  status code) are a future extension.

## Acceptance criteria

```bash
pnpm typecheck   # passes
pnpm lint        # passes
pnpm test        # all tests pass including new fault tests
```

### Manual smoke tests

```bash
# missing-resource-type: output should have no resourceType key
fhir-test-data generate patient --faults missing-resource-type \
  | jq '.[0] | has("resourceType")'
# false

# invalid-resource-type: fhir-resource-diff should flag it
fhir-test-data generate patient --faults invalid-resource-type \
  | fhir-resource-diff validate -
# → invalid

# random, seeded: same output every time
fhir-test-data generate patient --count 3 --seed 99 --faults random \
  | jq '[.[].resourceType]'
# same array on every run

# no faults: identical output to before
fhir-test-data generate patient --count 3 --seed 99 \
  | jq '[.[].resourceType]'
# ["Patient","Patient","Patient"]
```

## Tests to write

- `injectFaults` unit test for each concrete fault type
- `"random"` expands to a concrete fault (not "random" itself)
- Multiple faults applied in sequence
- Fault is no-op when target field absent (e.g. `invalid-gender` on Organization)
- CLI: `--faults missing-id` removes id from every resource in batch
- CLI: unknown fault type → validation error, exit 2
- Seeded `--faults random` is reproducible across runs
