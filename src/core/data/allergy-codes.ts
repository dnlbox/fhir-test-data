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
  // Additional medication allergies
  { system: SNOMED, code: "372687004", display: "Allergy to aspirin", type: "allergy", category: "medication" },
  { system: SNOMED, code: "373270004", display: "Allergy to cephalosporin antibiotic", type: "allergy", category: "medication" },
  { system: SNOMED, code: "372720008", display: "Allergy to codeine", type: "allergy", category: "medication" },
  { system: SNOMED, code: "294506009", display: "Allergy to tetracycline", type: "allergy", category: "medication" },
  // Additional food allergies/intolerances
  { system: SNOMED, code: "782415009", display: "Intolerance to gluten", type: "intolerance", category: "food" },
  { system: SNOMED, code: "402383003", display: "Milk allergy", type: "allergy", category: "food" },
  { system: SNOMED, code: "414285001", display: "Allergy to nut", type: "allergy", category: "food" },
  { system: SNOMED, code: "73882009", display: "Shellfish allergy", type: "allergy", category: "food" },
  { system: SNOMED, code: "91930004", display: "Allergy to eggs", type: "allergy", category: "food" },
  { system: SNOMED, code: "267425008", display: "Allergy to strawberries", type: "allergy", category: "food" },
  { system: SNOMED, code: "6235009", display: "Allergy to seafood", type: "allergy", category: "food" },
  // Additional environmental allergies
  { system: SNOMED, code: "232350006", display: "Allergy to house dust mite", type: "allergy", category: "environment" },
  { system: SNOMED, code: "418290006", display: "Allergy to mold", type: "allergy", category: "environment" },
  { system: SNOMED, code: "419199007", display: "Allergy to cat dander", type: "allergy", category: "environment" },
  { system: SNOMED, code: "232347008", display: "Allergy to dog dander", type: "allergy", category: "environment" },
];
