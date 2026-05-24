---
title: Types
description: TypeScript types exported from fhir-test-data.
sidebar:
  order: 2
---

All types are exported from the main entry point (`fhir-test-data`).

## Core types

```ts
// FHIR versions
const SUPPORTED_FHIR_VERSIONS = ["R4", "R4B", "R5"] as const;
type FhirVersion = "R4" | "R4B" | "R5";

// Locale codes
const SUPPORTED_LOCALES = [
  "us", "uk", "au", "ca", "de", "fr", "nl",
  "in", "jp", "kr", "sg", "br", "mx", "za"
] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

// Minimal FHIR resource shape
interface FhirResource {
  resourceType: string;
  id?: string;
  meta?: FhirMeta;
  [key: string]: unknown;
}

// Annotation wrapper
interface AnnotatedResource {
  resource: FhirResource;
  notes: AnnotationNote[];
}

interface AnnotationNote {
  path: string;  // JSONPath-style field reference
  note: string;  // Plain-language explanation
}
```

## Identifier types

```ts
interface IdentifierDefinition {
  system: string;      // FHIR system URI
  name: string;        // Human-readable name
  algorithm?: string;  // Check-digit algorithm name, if applicable
  generate: (rng: RandomFn, context?: IdentifierContext) => string;
  validate: (value: string) => boolean;
}

interface IdentifierContext {
  gender?: "male" | "female" | "other" | "unknown";
  birthYear?: number;
}
```

## Locale definition

```ts
interface LocaleDefinition {
  code: Locale;
  name: string;
  patientIdentifiers: IdentifierDefinition[];
  practitionerIdentifiers: IdentifierDefinition[];
  organizationIdentifiers: IdentifierDefinition[];
  address: AddressTemplate;
  names: NamePool;
}
```

## Fault types

Fault types are exported from the `fhir-test-data/faults` subpath:

```ts
import type { FaultType, ConcreteFaultType } from "fhir-test-data/faults";

// All valid fault strings (including "random")
const FAULT_TYPES: FaultType[] = [
  "missing-resource-type",
  "invalid-resource-type",
  "missing-id",
  "invalid-gender",
  "malformed-date",
  "empty-name",
  "wrong-type-on-field",
  "duplicate-identifier",
  "invalid-telecom-system",
  "missing-status",
  "invalid-status-value",
  "random",
];
```

See [Fault injection](/guides/fault-injection/) for usage.
