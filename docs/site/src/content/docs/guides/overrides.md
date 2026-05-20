---
title: Overrides
description: Deep-merge custom field values into every generated resource.
sidebar:
  order: 3
---

## Overview

The `--overrides` flag (CLI) and `.overrides()` builder method (library) deep-merge a JSON object into every generated resource. Fields you supply replace the generated values; fields you omit remain generated.

## CLI: inline JSON

```sh
fhir-test-data generate patient --locale us \
  --overrides '{"meta":{"profile":["http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient"]}}'
```

## CLI: via stdin

Pipe JSON into `generate` as stdin. The `--overrides` flag, if also present, wins on key conflicts.

```sh
echo '{"active": true}' | fhir-test-data generate patient --locale us
```

Combine stdin base with `--overrides` for a two-layer merge:

```sh
cat base-overrides.json | fhir-test-data generate patient \
  --overrides '{"status":"active"}'
```

## Library: `.overrides()` method

```ts
import { createPatientBuilder } from "fhir-test-data";

const patients = createPatientBuilder()
  .locale("us")
  .count(3)
  .seed(42)
  .overrides({
    meta: {
      profile: ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient"],
    },
  })
  .build();
```

## Merge semantics

Deep-merge means nested objects are merged recursively. Arrays are replaced entirely (not concatenated). For example:

- Override `{ "meta": { "profile": ["..."] } }` adds `meta.profile` without removing other `meta` fields.
- Override `{ "identifier": [{ "system": "...", "value": "..." }] }` replaces the entire `identifier` array.
