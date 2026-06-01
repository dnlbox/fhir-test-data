---
title: describe
description: Describe the fields a resource type generates, optionally with locale-specific identifier details.
sidebar:
  order: 4
---

## Synopsis

```
fhir-test-data describe [options] <resource-type>
```

## Resource types

`patient`, `practitioner`, `practitioner-role`, `organization`, `observation`, `condition`, `allergy-intolerance`, `medication-statement`, `encounter`, `diagnostic-report`, `bundle`

## Options

```
Options:
  --locale <code>  include locale-specific identifier details for this locale
  --pretty         pretty-print JSON (default for stdout) (default: true)
  --no-pretty      compact JSON output
  -h, --help       display help for command
```

## Description

Returns a JSON object with:

- `resourceType` — FHIR resource type name
- `description` — plain-language description of what is generated
- `fields` — map of JSONPath-style field paths to descriptions
- `supportedLocales` — array of all locale codes
- `localeDetail` (when `--locale` is supplied) — identifier definitions for that locale

## Examples

Describe the `patient` resource type:

```sh
fhir-test-data describe patient
```

Describe a patient with UK locale detail:

```sh
fhir-test-data describe patient --locale uk
```

Describe a bundle:

```sh
fhir-test-data describe bundle
```
