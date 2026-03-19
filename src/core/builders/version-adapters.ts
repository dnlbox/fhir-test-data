import type { FhirResource, FhirVersion } from "@/core/types.js";

// ---------------------------------------------------------------------------
// R5 adapter — MedicationStatement → MedicationUsage
// ---------------------------------------------------------------------------

function adaptMedicationStatementToR5(r: FhirResource): FhirResource {
  const medCodeable = r["medicationCodeableConcept"] as Record<string, unknown> | undefined;
  const { medicationCodeableConcept: _dropped, ...rest } = r as Record<string, unknown>;
  return {
    ...rest,
    resourceType: "MedicationUsage",
    medication: medCodeable !== undefined ? { concept: medCodeable } : undefined,
    status: "recorded",
  } as FhirResource;
}

// ---------------------------------------------------------------------------
// R5 adapter — AllergyIntolerance.type: code → CodeableConcept
// ---------------------------------------------------------------------------

const ALLERGY_TYPE_SYSTEM = "http://hl7.org/fhir/allergy-intolerance-type";

function adaptAllergyIntoleranceToR5(r: FhirResource): FhirResource {
  const typeCode = r["type"] as string | undefined;
  const patientRef = r["patient"];

  // Rename patient → subject
  const { patient: _dropped, ...withoutPatient } = r as Record<string, unknown>;
  const adapted: Record<string, unknown> = { ...withoutPatient };
  if (patientRef !== undefined) {
    adapted["subject"] = patientRef;
  }

  // type: string → CodeableConcept
  if (typeCode !== undefined) {
    const display = typeCode.charAt(0).toUpperCase() + typeCode.slice(1);
    adapted["type"] = {
      coding: [{ system: ALLERGY_TYPE_SYSTEM, code: typeCode, display }],
    };
  }

  return adapted as FhirResource;
}

// ---------------------------------------------------------------------------
// R5 dispatcher
// ---------------------------------------------------------------------------

function adaptToR5(resource: FhirResource): FhirResource {
  switch (resource.resourceType) {
    case "MedicationStatement":
      return adaptMedicationStatementToR5(resource);
    case "AllergyIntolerance":
      return adaptAllergyIntoleranceToR5(resource);
    default:
      return resource;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Adapt a resource built against R4 to the target FHIR version.
 * R4 and R4B return the resource unchanged (R4B is structurally identical
 * to R4 for all resources this library generates).
 * R5 applies structural changes: MedicationStatement→MedicationUsage,
 * AllergyIntolerance.type code→CodeableConcept.
 */
export function adaptToVersion(resource: FhirResource, version: FhirVersion): FhirResource {
  if (version === "R5") return adaptToR5(resource);
  return resource;
}
