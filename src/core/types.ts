// All shared types for fhir-test-data. Zero runtime cost — no imports, no classes.

// ---------------------------------------------------------------------------
// Resource types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// FHIR versions
// ---------------------------------------------------------------------------

export const SUPPORTED_FHIR_VERSIONS = ["R4", "R4B", "R5"] as const;

export type FhirVersion = (typeof SUPPORTED_FHIR_VERSIONS)[number];

// ---------------------------------------------------------------------------
// Locales
// ---------------------------------------------------------------------------

export const SUPPORTED_LOCALES = ["us", "uk", "au", "ca", "de", "fr", "nl", "in"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

// ---------------------------------------------------------------------------
// FHIR resource base shapes
// ---------------------------------------------------------------------------

export interface FhirMeta {
  versionId?: string;
  lastUpdated?: string;
  profile?: string[];
  [key: string]: unknown;
}

/** Minimal FHIR resource shape. Index signature allows arbitrary FHIR fields. */
export interface FhirResource {
  resourceType: string;
  id?: string;
  meta?: FhirMeta;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Builder interfaces
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Identifier types
// ---------------------------------------------------------------------------

/** A deterministic random number generator function. Returns [0, 1). */
export type RandomFn = () => number;

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

// ---------------------------------------------------------------------------
// Address types
// ---------------------------------------------------------------------------

export interface CityDefinition {
  name: string;
  state?: string;
  district?: string;
}

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

// ---------------------------------------------------------------------------
// Name types
// ---------------------------------------------------------------------------

export interface NamePool {
  given: {
    male: string[];
    female: string[];
  };
  family: string[];
  /** Optional prefixes (e.g., "van", "de" for Dutch names) */
  prefixes?: string[];
}

// ---------------------------------------------------------------------------
// Locale definition
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Generated resource wrapper
// ---------------------------------------------------------------------------

export interface GeneratedFixture<T extends FhirResource> {
  resource: T;
  /** Which locale was used to generate this resource */
  locale: Locale;
  /** The seed that produced this resource (for reproducibility) */
  seed: number;
}
