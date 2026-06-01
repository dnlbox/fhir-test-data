---
title: Fault Injection
description: Generate intentionally invalid FHIR resources to test validation pipelines and rejection behaviour.
sidebar:
  order: 1
---

## Overview

The `--faults` flag (CLI) and `injectFaults` function (library) produce resources that violate the FHIR specification in specific, predictable ways. Use them to verify that your validation pipeline, error handler, or rejection logic behaves correctly.

Faults are applied after generation, so the base resource is always structurally valid before the fault is injected.

## Available fault types

| Fault type | What it does |
|---|---|
| `missing-resource-type` | Removes the `resourceType` field entirely |
| `invalid-resource-type` | Sets `resourceType` to a string that is not a valid FHIR type |
| `missing-id` | Removes the `id` field |
| `invalid-gender` | Sets `gender` to a value not in the FHIR administrative gender ValueSet |
| `malformed-date` | Sets `birthDate` to a non-ISO-8601 string |
| `empty-name` | Sets `name` to an empty array `[]` |
| `wrong-type-on-field` | Sets `birthDate` to an integer instead of a string |
| `duplicate-identifier` | Repeats `identifier[0]` in the identifier array |
| `invalid-telecom-system` | Sets `telecom[0].system` to an unrecognised value |
| `missing-status` | Removes the `status` field (affects all clinical resources) |
| `invalid-status-value` | Sets `status` to a string not in the resource's ValueSet |
| `random` | Picks one concrete fault at random using the seeded RNG |

## CLI usage

Pass a comma-separated list of fault types to `--faults`:

```sh
# Single fault
fhir-test-data generate patient --locale us --seed 1 --faults missing-id

# Multiple faults (all applied to each resource)
fhir-test-data generate patient --locale us --seed 1 --faults missing-id,invalid-gender

# Random fault (deterministic when --seed is set)
fhir-test-data generate patient --locale us --seed 1 --faults random
```

## Library usage

```ts
import { createPatientBuilder } from "fhir-test-data";
import { injectFaults } from "fhir-test-data/faults";
import { createRng } from "fhir-test-data"; // if needed for manual RNG

const [patient] = createPatientBuilder().locale("us").seed(1).build();

// The RNG used for fault injection is separate from generation — it does not
// affect reproducibility of the base resource.
import { createRng } from "fhir-test-data";
const faultRng = createRng(2);
const faultedPatient = injectFaults(patient, ["missing-id"], faultRng);
```

## Integration: validate faulted resources

Pair with `fhir-resource-diff validate` to confirm that your validator catches the injected fault:

```sh
fhir-test-data generate patient --locale us --seed 42 --faults missing-resource-type \
  | fhir-resource-diff validate - --fhir-version R4
```

For annotated output, extract `.resource` before piping:

```sh
fhir-test-data generate patient --annotate --faults missing-status \
  | jq '.resource' \
  | fhir-resource-diff validate -
```
