---
title: Generate and Validate
description: Using fhir-test-data with fhir-resource-diff for generate-validate pipeline loops.
sidebar:
  order: 2
---

## Generate and validate in a pipeline

`fhir-test-data` and [`fhir-resource-diff`](https://www.npmjs.com/package/fhir-resource-diff) are designed to work together. Generate a resource and pipe it directly to the validator:

```sh
fhir-test-data generate patient --locale uk --seed 42 \
  | fhir-resource-diff validate - --fhir-version R4
```

## Validate annotated output

When using `--annotate`, the output shape is `{ resource, notes }` rather than a raw FHIR resource. Extract `.resource` with `jq` before piping to the validator:

```sh
fhir-test-data generate patient --locale au --annotate \
  | jq '.resource' \
  | fhir-resource-diff validate - --fhir-version R4
```

## Validate multiple resources (NDJSON)

Generate several resources in NDJSON format and validate each line:

```sh
fhir-test-data generate patient --locale us --count 10 --format ndjson \
  | while IFS= read -r line; do echo "$line" | fhir-resource-diff validate -; done
```

## Regression fixtures

Generate a bundle and compare against a baseline to detect drift:

```sh
# Generate baseline
fhir-test-data generate bundle --locale us --seed 1 --output ./fixtures/baseline/

# Later: compare against baseline
fhir-resource-diff compare ./fixtures/current/Bundle-001.json \
  ./fixtures/baseline/Bundle-001.json \
  --preset metadata \
  --exit-on-diff
```

## CI fixture workflow

In a CI pipeline, generate fixtures deterministically with a fixed seed and commit them as test data:

```sh
# Generate deterministic fixtures
fhir-test-data generate all --locale uk --seed 42 --output ./tests/fixtures/

# Validate each fixture
for f in ./tests/fixtures/*.json; do
  fhir-resource-diff validate "$f" --fhir-version R4 || exit 1
done
```

With a fixed seed, fixtures are identical across runs. Use `--output` to write files, then commit them. Regenerate when the resource schema changes, re-validate, and commit the diff.
