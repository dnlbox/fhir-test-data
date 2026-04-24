import type { FhirResource, RandomFn } from "@/core/types.js";

/**
 * Concrete fault types — each maps to a specific FHIR violation.
 */
export type ConcreteFaultType =
  | "missing-resource-type"   // remove resourceType entirely
  | "invalid-resource-type"   // set resourceType to a non-existent value
  | "missing-id"              // remove id field
  | "invalid-gender"          // set gender to a value not in the FHIR ValueSet
  | "malformed-date"          // set birthDate to a non-ISO-8601 value
  | "empty-name"              // set name to an empty array
  | "wrong-type-on-field"     // set birthDate to an integer instead of a string
  | "duplicate-identifier"    // repeat identifier[0] in the identifier array
  | "invalid-telecom-system"  // set telecom[0].system to an unrecognised value
  | "missing-status"          // remove the status field (applies to any clinical resource)
  | "invalid-status-value";   // set status to a string not in the resource's ValueSet

/**
 * Full fault type including the "random" convenience alias.
 * "random" expands to one concrete fault chosen by the seeded RNG.
 */
export type FaultType = ConcreteFaultType | "random";

/** All valid fault type strings, for CLI validation. */
export const FAULT_TYPES: FaultType[] = [
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

/**
 * A fault strategy receives a resource as a plain object and an RNG,
 * and returns a new object with the fault applied. Never mutates the input.
 */
export type FaultStrategy = (
  resource: Record<string, unknown>,
  rng: RandomFn,
) => Record<string, unknown>;

// Re-export FhirResource so callers only need one import.
export type { FhirResource, RandomFn };
