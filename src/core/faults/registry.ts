import type { ConcreteFaultType, FaultStrategy } from "./types.js";

// ---------------------------------------------------------------------------
// Individual fault strategies
// ---------------------------------------------------------------------------

const missingResourceType: FaultStrategy = (r) => {
  const { resourceType: _dropped, ...rest } = r;
  return rest;
};

const invalidResourceType: FaultStrategy = (r) => ({
  ...r,
  resourceType: "InvalidResourceXYZ",
});

const missingId: FaultStrategy = (r) => {
  const { id: _dropped, ...rest } = r;
  return rest;
};

const invalidGender: FaultStrategy = (r) => {
  if (!("gender" in r)) return r;
  return { ...r, gender: "INVALID_GENDER" };
};

const malformedDate: FaultStrategy = (r) => {
  if (!("birthDate" in r)) return r;
  return { ...r, birthDate: "not-a-date" };
};

const emptyName: FaultStrategy = (r) => {
  if (!("name" in r)) return r;
  return { ...r, name: [] };
};

const wrongTypeOnField: FaultStrategy = (r) => {
  if (!("birthDate" in r)) return r;
  // Integer instead of ISO string — wrong JSON type for FHIR date field.
  return { ...r, birthDate: 19850315 };
};

const duplicateIdentifier: FaultStrategy = (r) => {
  const identifiers = r["identifier"];
  if (!Array.isArray(identifiers) || identifiers.length === 0) return r;
  return { ...r, identifier: [...identifiers, identifiers[0]] };
};

const invalidTelecomSystem: FaultStrategy = (r) => {
  const telecom = r["telecom"];
  if (!Array.isArray(telecom) || telecom.length === 0) return r;
  const first = telecom[0] as Record<string, unknown>;
  return {
    ...r,
    telecom: [{ ...first, system: "fax-machine" }, ...telecom.slice(1)],
  };
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const FAULT_REGISTRY: Record<ConcreteFaultType, FaultStrategy> = {
  "missing-resource-type":  missingResourceType,
  "invalid-resource-type":  invalidResourceType,
  "missing-id":             missingId,
  "invalid-gender":         invalidGender,
  "malformed-date":         malformedDate,
  "empty-name":             emptyName,
  "wrong-type-on-field":    wrongTypeOnField,
  "duplicate-identifier":   duplicateIdentifier,
  "invalid-telecom-system": invalidTelecomSystem,
};

export const CONCRETE_FAULT_TYPES = Object.keys(
  FAULT_REGISTRY,
) as ConcreteFaultType[];
