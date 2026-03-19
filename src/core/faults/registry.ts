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

// Maps each resource type to its primary date field.
const PRIMARY_DATE_FIELD: Record<string, string> = {
  Patient:             "birthDate",
  Observation:         "effectiveDateTime",
  Condition:           "onsetDateTime",
  AllergyIntolerance:  "recordedDate",
  MedicationStatement: "effectiveDateTime",
  MedicationUsage:     "effectiveDateTime",   // R5 rename of MedicationStatement
  Immunization:        "occurrenceDateTime",
};

const DATE_FIELD_SUFFIX_PATTERN = /(?:Date|DateTime)$/;

const malformedDate: FaultStrategy = (r) => {
  const resourceType = r["resourceType"] as string | undefined;
  const primaryField = resourceType ? PRIMARY_DATE_FIELD[resourceType] : undefined;

  // 1. Primary field lookup: if field exists on the resource, corrupt it.
  if (primaryField !== undefined && primaryField in r) {
    return { ...r, [primaryField]: "not-a-date" };
  }

  // 2. Fallback scan: find first field ending in Date or DateTime and corrupt it.
  for (const key of Object.keys(r)) {
    if (DATE_FIELD_SUFFIX_PATTERN.test(key)) {
      return { ...r, [key]: "not-a-date" };
    }
    // Handle Period fields — corrupt .start if present.
    if (key.endsWith("Period")) {
      const period = r[key] as Record<string, unknown> | null | undefined;
      if (period !== null && typeof period === "object" && "start" in period) {
        return { ...r, [key]: { ...period, start: "not-a-date" } };
      }
    }
  }

  // 3. No recognised date field — silent no-op.
  return r;
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
