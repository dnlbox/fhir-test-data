---
title: CLI Overview
description: Top-level fhir-test-data CLI commands and global options.
sidebar:
  order: 1
---

## Usage

```
fhir-test-data [options] [command]
```

**Actual `--help` output (v0.1.3):**

```
Usage: fhir-test-data [options] [command]

Generate valid FHIR R4 test resources with country-aware identifiers

Options:
  -V, --version                       Print version number
  -h, --help                          display help for command

Commands:
  generate [options] <resource-type>  Generate FHIR resources. Resource types:
                                      patient, practitioner, practitioner-role,
                                      organization, observation, condition,
                                      allergy-intolerance, medication-statement,
                                      encounter, diagnostic-report, bundle, all
  locales [options]                   List all supported locales with their
                                      identifier systems and check-digit
                                      algorithms
  describe [options] <resource-type>  Describe what a resource type generates.
                                      Types: patient, practitioner,
                                      practitioner-role, organization,
                                      observation, condition,
                                      allergy-intolerance, medication-statement,
                                      bundle
  help [command]                      display help for command
```

## Commands

| Command | Purpose |
|---|---|
| [`generate`](/cli/generate/) | Generate one or more FHIR resources to stdout or a directory |
| [`locales`](/cli/locales/) | List all supported locales with identifier metadata |
| [`describe`](/cli/describe/) | Describe the fields a resource type generates |
