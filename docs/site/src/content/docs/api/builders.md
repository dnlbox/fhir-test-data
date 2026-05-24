---
title: Builders
description: Fluent builder API for generating FHIR resources programmatically in TypeScript.
sidebar:
  order: 1
---

## Overview

Each resource type has a corresponding factory function that returns a builder with a fluent, immutable method chain.

```ts
import { createPatientBuilder } from "fhir-test-data";

const patients = createPatientBuilder()
  .locale("uk")
  .count(5)
  .seed(42)
  .fhirVersion("R4")
  .build();
```

All builder methods return a new builder instance. Chains are safe to fork:

```ts
const base = createPatientBuilder().locale("us").seed(1);
const r4   = base.fhirVersion("R4").build();
const r5   = base.fhirVersion("R5").build();
```

## Builder interface

All builders implement `ResourceBuilder<T>`:

```ts
interface ResourceBuilder<T extends FhirResource> {
  locale(locale: Locale): this;
  count(count: number): this;
  seed(seed: number): this;
  overrides(overrides: Record<string, unknown>): this;
  build(): T[];
}
```

`fhirVersion` is a method on each concrete builder (not on the interface directly).

## Factory functions

| Factory | Produces |
|---|---|
| `createPatientBuilder()` | `Patient[]` |
| `createPractitionerBuilder()` | `Practitioner[]` |
| `createPractitionerRoleBuilder()` | `PractitionerRole[]` |
| `createOrganizationBuilder()` | `Organization[]` |
| `createObservationBuilder()` | `Observation[]` |
| `createConditionBuilder()` | `Condition[]` |
| `createAllergyIntoleranceBuilder()` | `AllergyIntolerance[]` |
| `createMedicationStatementBuilder()` | `MedicationStatement[]` or `MedicationUsage[]` (R5) |
| `createEncounterBuilder()` | `Encounter[]` |
| `createDiagnosticReportBuilder()` | `DiagnosticReport[]` |
| `createBundleBuilder()` | `Bundle[]` |

All factory functions are exported from the main entry point:

```ts
import {
  createPatientBuilder,
  createPractitionerBuilder,
  createBundleBuilder,
  // ...
} from "fhir-test-data";
```

## Methods

### `.locale(code)`

Sets the locale. Accepts any `Locale` value: `"us"`, `"uk"`, `"au"`, `"ca"`, `"de"`, `"fr"`, `"nl"`, `"in"`, `"jp"`, `"kr"`, `"sg"`, `"br"`, `"mx"`, `"za"`.

Default: `"us"`.

### `.count(n)`

Number of resources to generate. Must be a positive integer.

Default: `1`.

### `.seed(n)`

Integer seed for the deterministic PRNG. Same seed, same locale, same count, same FHIR version — always produces the same output. Without calling `.seed()`, a random seed is used.

### `.fhirVersion(version)`

Selects the FHIR version. Accepts `"R4"`, `"R4B"`, or `"R5"`.

Default: `"R4"`.

R5 structural differences:
- `MedicationStatement` → `MedicationUsage`; `medicationCodeableConcept` → `medication.concept`
- `AllergyIntolerance.type`: plain code string → `CodeableConcept`

### `.overrides(obj)`

Deep-merges `obj` into every resource produced by `.build()`. Useful for forcing specific field values.

```ts
createPatientBuilder()
  .locale("us")
  .overrides({ meta: { profile: ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient"] } })
  .build();
```

### `.build()`

Executes the builder and returns an array of generated resources.

## PractitionerRole builder extras

`createPractitionerRoleBuilder()` has two additional methods for linking to pre-generated resources:

```ts
createPractitionerRoleBuilder()
  .locale("us")
  .practitionerId("the-practitioner-uuid")
  .organizationId("the-org-uuid")
  .build();
```

When these are not set, placeholder `urn:uuid:` references are generated.
