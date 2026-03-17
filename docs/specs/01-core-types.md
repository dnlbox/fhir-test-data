# Spec 01 — Core types

**Status:** open

## Goal

Define all shared TypeScript types and interfaces that every other module depends on.
This is the load-bearing spec — get these right before anything else is implemented.

## Dependencies

- Spec 00 (project setup) complete

## Deliverables

| File | Description |
|------|-------------|
| `src/core/types.ts` | All shared types (see below) |
| `src/core/index.ts` | Re-exports everything public from src/core |

## Key interfaces and types

Design the following types. Exact field names are specified; add JSDoc comments on non-obvious fields.

### Supported resource types

```typescript
export const SUPPORTED_RESOURCE_TYPES = [
  "Patient",
  "Practitioner",
  "PractitionerRole",
  "Organization",
  "Observation",
  "Condition",
  "AllergyIntolerance",
  "MedicationStatement",
  "Bundle",
] as const;

export type SupportedResourceType = (typeof SUPPORTED_RESOURCE_TYPES)[number];
```

### FHIR version

```typescript
export const SUPPORTED_FHIR_VERSIONS = ["R4", "R4B", "R5"] as const;

export type FhirVersion = (typeof SUPPORTED_FHIR_VERSIONS)[number];
```

### Locale

```typescript
export const SUPPORTED_LOCALES = [
  "us", "uk", "au", "ca", "de", "fr", "nl", "in",
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];
```

### FhirResource (minimal shape)

```typescript
export interface FhirResource {
  resourceType: string;
  id?: string;
  meta?: FhirMeta;
  [key: string]: unknown;
}

export interface FhirMeta {
  versionId?: string;
  lastUpdated?: string;
  profile?: string[];
  [key: string]: unknown;
}
```

### Builder interfaces

```typescript
export interface BuilderOptions {
  locale: Locale;
  count: number;
  /** Seed for deterministic random generation. Same seed = same output. */
  seed?: number;
  /** FHIR version to target. Defaults to 'R4'. */
  fhirVersion?: FhirVersion;
  /** Partial overrides to merge into every generated resource. */
  overrides?: Record<string, unknown>;
}

export interface ResourceBuilder<T extends FhirResource> {
  locale(locale: Locale): this;
  count(count: number): this;
  seed(seed: number): this;
  overrides(overrides: Record<string, unknown>): this;
  build(): T[];
}
```

### Identifier types

```typescript
export interface IdentifierDefinition {
  /** FHIR system URI (e.g., "https://fhir.nhs.uk/Id/nhs-number") */
  system: string;
  /** Human-readable name (e.g., "NHS Number") */
  name: string;
  /** Generate a valid identifier value */
  generate: (rng: RandomFn) => string;
  /** Validate an identifier value */
  validate: (value: string) => boolean;
}

/** A deterministic random number generator function. Returns [0, 1). */
export type RandomFn = () => number;
```

### Address types

```typescript
export interface AddressTemplate {
  /** Street name + number patterns */
  streets: string[];
  /** City definitions with matching state/postcode data */
  cities: CityDefinition[];
  /** Generate a valid postal code for the given state/region */
  generatePostalCode: (rng: RandomFn, state?: string) => string;
  /** ISO 3166-1 alpha-2 country code */
  country: string;
}

export interface CityDefinition {
  name: string;
  state?: string;
  district?: string;
}
```

### Name types

```typescript
export interface NamePool {
  given: {
    male: string[];
    female: string[];
  };
  family: string[];
  /** Optional prefixes (e.g., "van", "de" for Dutch names) */
  prefixes?: string[];
}
```

### Locale definition

```typescript
export interface LocaleDefinition {
  code: Locale;
  /** Display name (e.g., "United Kingdom") */
  name: string;
  /** Patient identifier definitions for this locale */
  patientIdentifiers: IdentifierDefinition[];
  /** Practitioner identifier definitions for this locale */
  practitionerIdentifiers: IdentifierDefinition[];
  /** Organization identifier definitions for this locale */
  organizationIdentifiers: IdentifierDefinition[];
  /** Address generation data */
  address: AddressTemplate;
  /** Name pools */
  names: NamePool;
}
```

### Generated resource wrapper

```typescript
export interface GeneratedFixture<T extends FhirResource> {
  resource: T;
  /** Which locale was used to generate this resource */
  locale: Locale;
  /** The seed that produced this resource (for reproducibility) */
  seed: number;
}
```

## Implementation notes

- All types must be plain interfaces or type aliases — no classes.
- No imports from any external package in `types.ts`. Types must have zero runtime cost.
- `FhirResource` uses an index signature `[key: string]: unknown` to allow arbitrary FHIR fields
  without forcing `any`. This is intentional — FHIR resources are open-world objects.
- The `RandomFn` type is central to deterministic generation. All generators accept a `RandomFn`
  instead of calling `Math.random()` directly. A seeded PRNG implementation will be provided
  in a utility module.
- `src/core/index.ts` should re-export all public types. For this spec, it only needs to export types.

## Acceptance criteria

```bash
pnpm typecheck    # passes — no errors in src/core/types.ts
pnpm lint         # passes
```

Manually verify:
- `FhirResource` can be assigned `{ resourceType: "Patient", id: "123", name: [{ text: "John" }] }` without errors.
- `Locale` accepts `"uk"` but rejects `"jp"`.
- `BuilderOptions` requires `locale` and `count`, `seed` is optional.
- `IdentifierDefinition` requires `system`, `name`, `generate`, and `validate`.

## Do not do

- Do not implement any functions yet — only types and interfaces.
- Do not import zod or any runtime library in `types.ts`.
- Do not add FHIR-version-specific types (R4 vs R5 structures) — keep types generic for now.
- Do not define resource-specific interfaces (Patient, Observation, etc.) — those will use
  `FhirResource` with the index signature until we need more specificity.
