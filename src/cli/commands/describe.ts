import type { Command } from "commander";
import { SUPPORTED_LOCALES } from "@/core/types.js";
import type { Locale } from "@/core/types.js";
import { getLocale } from "@/locales/index.js";

// ---------------------------------------------------------------------------
// Static resource-type descriptions
// ---------------------------------------------------------------------------

type DescribableResourceType =
  | "patient"
  | "practitioner"
  | "practitioner-role"
  | "organization"
  | "observation"
  | "condition"
  | "allergy-intolerance"
  | "medication-statement"
  | "bundle";

interface ResourceDescription {
  resourceType: string;
  description: string;
  fields: Record<string, string>;
}

const RESOURCE_DESCRIPTIONS: Record<DescribableResourceType, ResourceDescription> = {
  patient: {
    resourceType: "Patient",
    description:
      "FHIR Patient with locale-appropriate identifiers, names, address, and communication language",
    fields: {
      id: "UUID v4 — unique resource identifier",
      identifier: "Locale-specific patient identifiers (check-digit validated where applicable)",
      "name[0].use": "FHIR name use — 'official' is the primary legal name for clinical records",
      "name[0].family": "Family (last) name drawn from locale name pool",
      "name[0].given": "Given (first) name drawn from locale name pool",
      "name[0].prefix": "Cultural or professional title prefix (Mr, Mrs, Dr, etc.)",
      "telecom[0]": "Home phone number in locale-appropriate format (FHIR ContactPoint)",
      "telecom[1]": "Email address (FHIR ContactPoint)",
      gender: "FHIR administrative gender: male | female",
      birthDate: "Random date in adult age range — ISO 8601 format (YYYY-MM-DD)",
      "address[0]": "Locale-appropriate street address with city and postal code",
      "communication[0].language.coding[0].code":
        "BCP 47 language tag — primary language for the locale",
    },
  },

  practitioner: {
    resourceType: "Practitioner",
    description:
      "FHIR Practitioner with locale-appropriate identifiers, professional name, and MD qualification",
    fields: {
      id: "UUID v4 — unique resource identifier",
      identifier: "Locale-specific practitioner identifiers (check-digit validated where applicable)",
      "name[0].prefix": "Professional title prefix (Dr, Prof)",
      "name[0].family": "Family name drawn from locale name pool",
      "name[0].given": "Given name drawn from locale name pool",
      "telecom[0]": "Work email address (FHIR ContactPoint)",
      gender: "FHIR administrative gender: male | female",
      "qualification[0].code.coding[0].code":
        "MD — Doctor of Medicine credential code",
      "qualification[0].code.coding[0].system":
        "http://terminology.hl7.org/CodeSystem/v2-0360 — HL7 degree/license/certificate code system",
    },
  },

  "practitioner-role": {
    resourceType: "PractitionerRole",
    description:
      "FHIR PractitionerRole linking a Practitioner to an Organization with a coded role",
    fields: {
      id: "UUID v4 — unique resource identifier",
      active: "Whether this role relationship is currently active",
      practitioner: "Reference to the Practitioner (urn:uuid: format)",
      organization: "Reference to the Organization where this role is performed (urn:uuid: format)",
      "code[0].coding[0].code": "doctor — SNOMED CT code for general practitioner role",
      "code[0].coding[0].system": "SNOMED CT code system (http://snomed.info/sct)",
    },
  },

  organization: {
    resourceType: "Organization",
    description:
      "FHIR Organization (healthcare provider) with locale-appropriate identifiers and address",
    fields: {
      id: "UUID v4 — unique resource identifier",
      identifier: "Locale-specific organization identifiers",
      active: "Whether this organization is currently active — always true for generated resources",
      "type[0].coding[0].code":
        "prov — FHIR organization type code for healthcare provider",
      "type[0].coding[0].system":
        "http://terminology.hl7.org/CodeSystem/organization-type — HL7 organization type code system",
      name: "Locale-appropriate hospital or clinic name",
      "telecom[0]": "Main phone number (FHIR ContactPoint)",
      "address[0]": "Locale-appropriate street address with city and postal code",
    },
  },

  observation: {
    resourceType: "Observation",
    description:
      "FHIR Observation with a real LOINC code, value in a clinically plausible range, and HL7-consistent UCUM units",
    fields: {
      id: "UUID v4 — unique resource identifier",
      status: "FHIR observation status — 'final' indicates a completed, unmodified observation",
      "category[0].coding[0].code":
        "FHIR observation category — vital-signs or laboratory",
      "code.coding[0].code": "LOINC code identifying the observation type (https://loinc.org)",
      "code.coding[0].system":
        "LOINC — Logical Observation Identifiers Names and Codes (https://loinc.org)",
      "code.coding[0].display": "Human-readable LOINC display name",
      subject: "Reference to the Patient this observation belongs to (urn:uuid: format)",
      effectiveDateTime:
        "Date and time the observation was clinically relevant — ISO 8601 format",
      "valueQuantity.value":
        "Numeric measurement in a clinically plausible range for the LOINC code",
      "valueQuantity.unit":
        "Human-readable unit name (e.g., 'mmHg' for blood pressure)",
      "valueQuantity.system":
        "UCUM — Unified Code for Units of Measure (https://ucum.org), required by HL7 FHIR",
      "valueQuantity.code":
        "UCUM code for the unit (e.g., 'mm[Hg]'), machine-readable unit identifier",
    },
  },

  condition: {
    resourceType: "Condition",
    description:
      "FHIR Condition with a real SNOMED CT code, clinical status, and verification status",
    fields: {
      id: "UUID v4 — unique resource identifier",
      "clinicalStatus.coding[0].code":
        "FHIR condition clinical status — 'active' or 'remission'",
      "clinicalStatus.coding[0].system":
        "http://terminology.hl7.org/CodeSystem/condition-clinical",
      "verificationStatus.coding[0].code":
        "FHIR verification status — 'confirmed' indicates clinically verified",
      "code.coding[0].code":
        "SNOMED CT code identifying the clinical condition (https://snomed.info/sct)",
      "code.coding[0].system":
        "SNOMED CT — Systematized Nomenclature of Medicine Clinical Terms",
      "code.coding[0].display": "Human-readable SNOMED CT display name",
      subject: "Reference to the Patient this condition belongs to (urn:uuid: format)",
      onsetDateTime: "Date when the condition was first noted — ISO 8601 format",
    },
  },

  "allergy-intolerance": {
    resourceType: "AllergyIntolerance",
    description:
      "FHIR AllergyIntolerance with SNOMED CT coded substance, type, category, and criticality",
    fields: {
      id: "UUID v4 — unique resource identifier",
      type: "FHIR allergy type — 'allergy' (immune-mediated) or 'intolerance' (non-immune)",
      category: "FHIR allergy category — food | medication | environment | biologic",
      criticality: "Potential severity — low | high | unable-to-assess",
      "code.coding[0].code":
        "SNOMED CT code identifying the substance or reaction",
      "code.coding[0].system":
        "SNOMED CT — Systematized Nomenclature of Medicine Clinical Terms",
      patient: "Reference to the Patient this allergy record belongs to (urn:uuid: format)",
      recordedDate: "Date when this allergy was first recorded — ISO 8601 (YYYY-MM-DD)",
    },
  },

  "medication-statement": {
    resourceType: "MedicationStatement (R4/R4B) | MedicationUsage (R5)",
    description:
      "FHIR MedicationStatement (R4/R4B) or MedicationUsage (R5) with a SNOMED CT or RxNorm coded medication",
    fields: {
      id: "UUID v4 — unique resource identifier",
      status: "FHIR medication status — 'active' or 'stopped'",
      "medicationCodeableConcept.coding[0].code":
        "SNOMED CT or RxNorm code identifying the medication (R4/R4B only)",
      "medication.concept.coding[0].code":
        "SNOMED CT or RxNorm code identifying the medication (R5 MedicationUsage only)",
      subject: "Reference to the Patient this medication record belongs to (urn:uuid: format)",
      "effectivePeriod.start": "Start date of medication use — ISO 8601 format",
      "effectivePeriod.end": "End date of medication use — ISO 8601 format (may be absent for active)",
    },
  },

  bundle: {
    resourceType: "Bundle",
    description:
      "FHIR Bundle composing Patient, Practitioner, PractitionerRole, Organization, and clinical resources with automatic urn:uuid: reference wiring",
    fields: {
      id: "UUID v4 — unique bundle identifier",
      type: "FHIR Bundle type — transaction | collection | searchset | document",
      "entry[*].fullUrl":
        "urn:uuid: URIs used for cross-referencing resources within the bundle",
      "entry[*].resource":
        "Embedded FHIR resource — Patient, Practitioner, Organization, Observation, etc.",
      "entry[*].request":
        "Transaction request metadata — method and URL (transaction bundles only)",
      "entry[*].search":
        "Search mode metadata — match or include (searchset bundles only)",
    },
  },
};

const DESCRIBABLE_RESOURCE_TYPES = Object.keys(
  RESOURCE_DESCRIPTIONS,
) as DescribableResourceType[];

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

interface DescribeOptions {
  locale?: string;
  pretty: boolean;
}

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

function runDescribe(resourceType: string, opts: DescribeOptions): void {
  if (!DESCRIBABLE_RESOURCE_TYPES.includes(resourceType as DescribableResourceType)) {
    process.stderr.write(
      `Error: unknown resource type "${resourceType}". Valid types: ${DESCRIBABLE_RESOURCE_TYPES.join(", ")}\n`,
    );
    process.exit(1);
  }

  if (opts.locale !== undefined && !SUPPORTED_LOCALES.includes(opts.locale as Locale)) {
    process.stderr.write(
      `Error: unknown locale "${opts.locale}". Supported locales: ${SUPPORTED_LOCALES.join(", ")}\n`,
    );
    process.exit(1);
  }

  const description = RESOURCE_DESCRIPTIONS[resourceType as DescribableResourceType];

  const output: Record<string, unknown> = {
    resourceType: description.resourceType,
    description: description.description,
    fields: description.fields,
    supportedLocales: [...SUPPORTED_LOCALES],
  };

  if (opts.locale !== undefined) {
    const locale = getLocale(opts.locale as Locale);
    output["localeDetail"] = {
      code: locale.code,
      name: locale.name,
      patientIdentifiers: locale.patientIdentifiers.map((id) => ({
        name: id.name,
        system: id.system,
        ...(id.algorithm !== undefined ? { algorithm: id.algorithm } : {}),
      })),
      practitionerIdentifiers: locale.practitionerIdentifiers.map((id) => ({
        name: id.name,
        system: id.system,
        ...(id.algorithm !== undefined ? { algorithm: id.algorithm } : {}),
      })),
      organizationIdentifiers: locale.organizationIdentifiers.map((id) => ({
        name: id.name,
        system: id.system,
        ...(id.algorithm !== undefined ? { algorithm: id.algorithm } : {}),
      })),
    };
  }

  const indent = opts.pretty ? 2 : undefined;
  process.stdout.write(JSON.stringify(output, null, indent) + "\n");
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerDescribeCommand(program: Command): void {
  program
    .command("describe <resource-type>")
    .description(
      `Describe what a resource type generates. Types: ${DESCRIBABLE_RESOURCE_TYPES.join(", ")}`,
    )
    .option("--locale <code>", "include locale-specific identifier details for this locale")
    .option("--pretty", "pretty-print JSON (default for stdout)", true)
    .option("--no-pretty", "compact JSON output")
    .action(runDescribe);
}
