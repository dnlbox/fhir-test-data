import type { FhirResource, RandomFn, FaultType } from "./types.js";
import { FAULT_REGISTRY, CONCRETE_FAULT_TYPES } from "./registry.js";
import { pickRandom } from "@/core/generators/rng.js";

/**
 * Apply a list of fault types to a FHIR resource.
 *
 * - "random" expands to one concrete fault chosen by the seeded RNG.
 * - Duplicate fault types in the list are applied once each (deduped by type).
 * - Faults targeting fields not present on the resource are silent no-ops.
 * - The original resource is never mutated; a new object is returned.
 */
export function injectFaults(
  resource: FhirResource,
  faults: FaultType[],
  rng: RandomFn,
): FhirResource {
  const expanded = faults.map((f) =>
    f === "random" ? pickRandom(CONCRETE_FAULT_TYPES, rng) : f,
  );

  // Deduplicate while preserving first-occurrence order.
  const unique = [...new Set(expanded)];

  return unique.reduce<Record<string, unknown>>(
    (r, fault) => FAULT_REGISTRY[fault](r, rng),
    resource as Record<string, unknown>,
  ) as FhirResource;
}
