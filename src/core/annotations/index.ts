/**
 * Reactive annotation generator.
 *
 * Given a generated FHIR resource and the locale that produced it, returns an
 * array of AnnotationNote objects explaining each field in plain language.
 *
 * Browser-safe: no Node.js imports, no I/O.
 */
import type { FhirResource, AnnotationNote, LocaleDefinition } from "@/core/types.js";
import { COMMON_LOINC_CODES } from "@/core/data/loinc-codes.js";
import { COMMON_SNOMED_CONDITIONS } from "@/core/data/snomed-codes.js";
import { COMMON_ALLERGY_CODES } from "@/core/data/allergy-codes.js";
import { COMMON_MEDICATION_CODES, US_RXNORM_MEDICATION_CODES } from "@/core/data/medication-codes.js";

// ---------------------------------------------------------------------------
// Shared field notes
// ---------------------------------------------------------------------------

const SHARED_NOTES: AnnotationNote[] = [
  {
    path: "id",
    note: "Unique resource identifier (UUID v4)",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function identifierNotes(
  identifiers: Array<{ system?: string; value?: string }> | undefined,
  defs: LocaleDefinition["patientIdentifiers"],
): AnnotationNote[] {
  if (!identifiers) return [];
  const notes: AnnotationNote[] = [];
  identifiers.forEach((id, i) => {
    const def = defs.find((d) => d.system === id.system);
    if (!def) return;
    const algorithmClause = def.algorithm ? `, validated with ${def.algorithm}` : "";
    notes.push({
      path: `identifier[${i}].value`,
      note: `${def.name}${algorithmClause}`,
    });
    notes.push({
      path: `identifier[${i}].system`,
      note: `FHIR NamingSystem URI for ${def.name} (${def.system})`,
    });
  });
  return notes;
}

function nameNotes(
  names: Array<{ prefix?: string[] }> | undefined,
): AnnotationNote[] {
  if (!names) return [];
  return [
    {
      path: "name[0].use",
      note: "FHIR name use — 'official' is the primary legal name used in clinical records",
    },
    {
      path: "name[0].prefix",
      note: "Cultural or professional title prefix (e.g., Mr, Dr, Prof)",
    },
  ];
}

function addressNotes(locale: LocaleDefinition): AnnotationNote[] {
  return [
    {
      path: "address[0].country",
      note: `ISO 3166-1 alpha-2 country code — ${locale.address.country} = ${locale.name}`,
    },
    {
      path: "address[0].postalCode",
      note: `Locale-appropriate postal code format for ${locale.name}`,
    },
  ];
}

// ---------------------------------------------------------------------------
// Per-resource-type annotators
// ---------------------------------------------------------------------------

function annotatePatient(
  resource: FhirResource,
  locale: LocaleDefinition,
): AnnotationNote[] {
  const identifiers = resource["identifier"] as Array<{ system?: string; value?: string }> | undefined;
  const communication = resource["communication"] as
    | Array<{ language?: { coding?: Array<{ code?: string }> } }>
    | undefined;
  const langCode = communication?.[0]?.language?.coding?.[0]?.code;

  return [
    ...SHARED_NOTES,
    ...identifierNotes(identifiers, locale.patientIdentifiers),
    ...nameNotes(resource["name"] as Array<{ prefix?: string[] }> | undefined),
    {
      path: "telecom",
      note: "Home phone number and email address in FHIR ContactPoint format",
    },
    {
      path: "gender",
      note: "FHIR administrative gender code (male | female | other | unknown)",
    },
    {
      path: "birthDate",
      note: "Patient date of birth — ISO 8601 format (YYYY-MM-DD)",
    },
    ...addressNotes(locale),
    ...(langCode
      ? [
          {
            path: "communication[0].language.coding[0].code",
            note: `BCP 47 language tag — ${langCode} identifies the primary language for this locale`,
          },
          {
            path: "communication[0].language.coding[0].system",
            note: "BCP 47 — IETF language tag standard (urn:ietf:bcp:47)",
          },
        ]
      : []),
  ];
}

function annotatePractitioner(
  resource: FhirResource,
  locale: LocaleDefinition,
): AnnotationNote[] {
  const identifiers = resource["identifier"] as Array<{ system?: string; value?: string }> | undefined;
  return [
    ...SHARED_NOTES,
    ...identifierNotes(identifiers, locale.practitionerIdentifiers),
    ...nameNotes(resource["name"] as Array<{ prefix?: string[] }> | undefined),
    {
      path: "name[0].prefix",
      note: "Professional title prefix for practitioners (e.g., Dr, Prof)",
    },
    {
      path: "telecom",
      note: "Work email address in FHIR ContactPoint format",
    },
    {
      path: "gender",
      note: "FHIR administrative gender code (male | female | other | unknown)",
    },
    {
      path: "qualification[0].code.coding[0].code",
      note: "MD — Doctor of Medicine credential code",
    },
    {
      path: "qualification[0].code.coding[0].system",
      note: "http://terminology.hl7.org/CodeSystem/v2-0360 — HL7 degree/license/certificate code system",
    },
  ];
}

function annotatePractitionerRole(
  _resource: FhirResource,
): AnnotationNote[] {
  return [
    ...SHARED_NOTES,
    {
      path: "active",
      note: "Whether this role relationship is currently active",
    },
    {
      path: "practitioner",
      note: "Reference to the Practitioner resource this role belongs to (urn:uuid: format)",
    },
    {
      path: "organization",
      note: "Reference to the Organization where this role is performed (urn:uuid: format)",
    },
    {
      path: "code[0].coding[0].code",
      note: "doctor — SNOMED CT code for general practitioner role",
    },
    {
      path: "code[0].coding[0].system",
      note: "SNOMED CT code system (http://snomed.info/sct)",
    },
  ];
}

function annotateOrganization(
  resource: FhirResource,
  locale: LocaleDefinition,
): AnnotationNote[] {
  const identifiers = resource["identifier"] as Array<{ system?: string; value?: string }> | undefined;
  return [
    ...SHARED_NOTES,
    ...identifierNotes(identifiers, locale.organizationIdentifiers),
    {
      path: "active",
      note: "Whether this organization is currently active — always true for generated resources",
    },
    {
      path: "type[0].coding[0].code",
      note: "prov — FHIR organization type code for healthcare provider",
    },
    {
      path: "type[0].coding[0].system",
      note: "http://terminology.hl7.org/CodeSystem/organization-type — HL7 organization type code system",
    },
    {
      path: "name",
      note: "Locale-appropriate hospital or organization name",
    },
    ...addressNotes(locale),
  ];
}

function annotateObservation(
  resource: FhirResource,
): AnnotationNote[] {
  const coding = (resource["code"] as { coding?: Array<{ code?: string; system?: string }> } | undefined)
    ?.coding;
  const loincCode = coding?.[0]?.code;
  const loinc = loincCode ? COMMON_LOINC_CODES.find((c) => c.code === loincCode) : undefined;

  const vq = resource["valueQuantity"] as
    | { value?: number; unit?: string; system?: string; code?: string }
    | undefined;

  const category = (resource["category"] as Array<{ coding?: Array<{ code?: string }> }> | undefined)
    ?.[0]?.coding?.[0]?.code;

  const notes: AnnotationNote[] = [...SHARED_NOTES];

  if (loinc) {
    notes.push({
      path: "code.coding[0].code",
      note: `LOINC ${loinc.code} — ${loinc.display}`,
    });
    notes.push({
      path: "code.coding[0].system",
      note: "LOINC — Logical Observation Identifiers Names and Codes (https://loinc.org)",
    });
    notes.push({
      path: "code.coding[0].display",
      note: `Clinical display name for LOINC ${loinc.code}`,
    });
  }

  if (category) {
    notes.push({
      path: "category[0].coding[0].code",
      note: `${category} — FHIR observation category; groups this observation for clinical workflows`,
    });
  }

  notes.push({
    path: "status",
    note: "FHIR observation status — 'final' indicates a completed, unmodified observation",
  });

  notes.push({
    path: "effectiveDateTime",
    note: "Date and time the observation was clinically relevant — ISO 8601 format",
  });

  if (vq) {
    if (loinc) {
      notes.push({
        path: "valueQuantity.value",
        note: `${loinc.display} measurement — clinically plausible range: ${loinc.valueRange.min}–${loinc.valueRange.max}`,
      });
      notes.push({
        path: "valueQuantity.unit",
        note: `${loinc.unit} — UCUM code: ${loinc.unitCode}, per HL7 FHIR guidelines for units of measure`,
      });
    } else {
      notes.push({
        path: "valueQuantity.value",
        note: "Observation measurement value",
      });
    }
    notes.push({
      path: "valueQuantity.system",
      note: "UCUM — Unified Code for Units of Measure (https://ucum.org), required by HL7 FHIR guidelines",
    });
  }

  notes.push({
    path: "subject",
    note: "Reference to the Patient this observation belongs to (urn:uuid: format)",
  });

  return notes;
}

function annotateCondition(resource: FhirResource): AnnotationNote[] {
  const coding = (resource["code"] as { coding?: Array<{ code?: string }> } | undefined)?.coding;
  const snomedCode = coding?.[0]?.code;
  const snomed = snomedCode
    ? COMMON_SNOMED_CONDITIONS.find((c) => c.code === snomedCode)
    : undefined;

  const notes: AnnotationNote[] = [...SHARED_NOTES];

  if (snomed) {
    notes.push({
      path: "code.coding[0].code",
      note: `SNOMED CT ${snomed.code} — ${snomed.display}`,
    });
    notes.push({
      path: "code.coding[0].system",
      note: "SNOMED CT — Systematized Nomenclature of Medicine Clinical Terms (http://snomed.info/sct)",
    });
  }

  notes.push({
    path: "clinicalStatus.coding[0].code",
    note: "FHIR condition clinical status — 'active' or 'remission'; indicates current state of the condition",
  });
  notes.push({
    path: "verificationStatus.coding[0].code",
    note: "FHIR verification status — 'confirmed' indicates the condition has been clinically verified",
  });
  notes.push({
    path: "onsetDateTime",
    note: "Date when the condition was first clinically noted — ISO 8601 format",
  });
  notes.push({
    path: "subject",
    note: "Reference to the Patient this condition belongs to (urn:uuid: format)",
  });

  return notes;
}

function annotateAllergyIntolerance(resource: FhirResource): AnnotationNote[] {
  const coding = (resource["code"] as { coding?: Array<{ code?: string; system?: string }> } | undefined)
    ?.coding;
  const code = coding?.[0]?.code;
  const allergy = code ? COMMON_ALLERGY_CODES.find((c) => c.code === code) : undefined;

  const notes: AnnotationNote[] = [...SHARED_NOTES];

  if (allergy) {
    notes.push({
      path: "code.coding[0].code",
      note: `SNOMED CT ${allergy.code} — ${allergy.display}`,
    });
    notes.push({
      path: "code.coding[0].system",
      note: "SNOMED CT — Systematized Nomenclature of Medicine Clinical Terms (http://snomed.info/sct)",
    });
    notes.push({
      path: "category",
      note: `FHIR allergy category — ${allergy.category}: type of substance causing the reaction`,
    });
  }

  notes.push({
    path: "type",
    note: "FHIR allergy type — 'allergy' (immune-mediated) or 'intolerance' (non-immune mechanism)",
  });
  notes.push({
    path: "criticality",
    note: "FHIR allergy criticality — potential severity: low | high | unable-to-assess",
  });
  notes.push({
    path: "patient",
    note: "Reference to the Patient this allergy record belongs to (urn:uuid: format)",
  });
  notes.push({
    path: "recordedDate",
    note: "Date when this allergy was first recorded — ISO 8601 format (YYYY-MM-DD)",
  });

  return notes;
}

function annotateMedicationStatement(resource: FhirResource): AnnotationNote[] {
  // Handles both R4 (medicationCodeableConcept) and R5 (medication.concept)
  const r4Coding = (
    resource["medicationCodeableConcept"] as
      | { coding?: Array<{ code?: string }> }
      | undefined
  )?.coding;
  const r5Coding = (
    (resource["medication"] as { concept?: { coding?: Array<{ code?: string }> } } | undefined)
      ?.concept
  )?.coding;
  const coding = r4Coding ?? r5Coding;
  const code = coding?.[0]?.code;

  const allMeds = [...COMMON_MEDICATION_CODES, ...US_RXNORM_MEDICATION_CODES];
  const med = code ? allMeds.find((m) => m.code === code) : undefined;

  const resourceType = resource["resourceType"] as string;
  const isR5 = resourceType === "MedicationUsage";

  const notes: AnnotationNote[] = [...SHARED_NOTES];

  if (med) {
    const codePath = isR5
      ? "medication.concept.coding[0].code"
      : "medicationCodeableConcept.coding[0].code";
    const systemPath = isR5
      ? "medication.concept.coding[0].system"
      : "medicationCodeableConcept.coding[0].system";

    notes.push({
      path: codePath,
      note: `${med.system.includes("rxnorm") ? "RxNorm" : "SNOMED CT"} ${med.code} — ${med.display}; typical dose: ${med.typicalDoseMg}mg ${med.frequency}`,
    });
    notes.push({
      path: systemPath,
      note: med.system.includes("rxnorm")
        ? "RxNorm — US National Library of Medicine drug terminology (http://www.nlm.nih.gov/research/umls/rxnorm)"
        : "SNOMED CT — Systematized Nomenclature of Medicine Clinical Terms (http://snomed.info/sct)",
    });
  }

  notes.push({
    path: "status",
    note: `FHIR ${isR5 ? "MedicationUsage" : "MedicationStatement"} status — 'active' or 'stopped'`,
  });
  notes.push({
    path: "subject",
    note: "Reference to the Patient this medication record belongs to (urn:uuid: format)",
  });

  return notes;
}

function annotateBundle(resource: FhirResource): AnnotationNote[] {
  const entries = resource["entry"] as Array<{ resource?: FhirResource }> | undefined;
  const resourceTypes = entries
    ? [...new Set(entries.map((e) => e.resource?.resourceType).filter(Boolean))]
    : [];

  return [
    ...SHARED_NOTES,
    {
      path: "type",
      note: "FHIR Bundle type — 'transaction' includes request entries; 'collection' is a plain grouping",
    },
    {
      path: "entry",
      note: `Bundle entries — ${entries?.length ?? 0} resources: ${resourceTypes.join(", ")}`,
    },
    {
      path: "entry[*].fullUrl",
      note: "urn:uuid: format — temporary URIs used for cross-reference within the bundle",
    },
    {
      path: "entry[*].request",
      note: "FHIR transaction request metadata — method (PUT/POST) and URL for server processing",
    },
  ];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate human-readable annotation notes for a FHIR resource.
 *
 * @param resource  The generated FHIR resource.
 * @param locale    The locale used to generate it (provides identifier metadata).
 * @returns         Array of AnnotationNote objects explaining each notable field.
 */
export function annotateResource(
  resource: FhirResource,
  locale: LocaleDefinition,
): AnnotationNote[] {
  switch (resource.resourceType) {
    case "Patient":
      return annotatePatient(resource, locale);
    case "Practitioner":
      return annotatePractitioner(resource, locale);
    case "PractitionerRole":
      return annotatePractitionerRole(resource);
    case "Organization":
      return annotateOrganization(resource, locale);
    case "Observation":
      return annotateObservation(resource);
    case "Condition":
      return annotateCondition(resource);
    case "AllergyIntolerance":
      return annotateAllergyIntolerance(resource);
    case "MedicationStatement":
    case "MedicationUsage":
      return annotateMedicationStatement(resource);
    case "Bundle":
      return annotateBundle(resource);
    default:
      return [...SHARED_NOTES];
  }
}
