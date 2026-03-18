export interface AllergyCode {
  system: string;
  code: string;
  display: string;
  /** FHIR AllergyIntolerance type: "allergy" | "intolerance" */
  type: "allergy" | "intolerance";
  /** FHIR category: "food" | "medication" | "environment" | "biologic" */
  category: "food" | "medication" | "environment" | "biologic";
}

const SNOMED = "http://snomed.info/sct";

export const COMMON_ALLERGY_CODES: AllergyCode[] = [
  { system: SNOMED, code: "91936005", display: "Allergy to penicillin", type: "allergy", category: "medication" },
  { system: SNOMED, code: "91935009", display: "Allergy to peanuts", type: "allergy", category: "food" },
  { system: SNOMED, code: "294505008", display: "Allergy to amoxicillin", type: "allergy", category: "medication" },
  { system: SNOMED, code: "418689008", display: "Allergy to grass pollen", type: "allergy", category: "environment" },
  { system: SNOMED, code: "419474003", display: "Allergy to sulfonamide", type: "allergy", category: "medication" },
  { system: SNOMED, code: "416098002", display: "Allergy to drug", type: "allergy", category: "medication" },
  { system: SNOMED, code: "300916003", display: "Latex allergy", type: "allergy", category: "environment" },
  { system: SNOMED, code: "235719002", display: "Food intolerance", type: "intolerance", category: "food" },
];
