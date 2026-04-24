// HL7 FHIR R4 DiagnosticReport code sets.
// Sources:
//   code:     http://loinc.org (clinical report panel codes)
//   category: http://terminology.hl7.org/CodeSystem/v2-0074 (diagnostic service sections)

export interface DiagnosticReportCode {
  code: string;
  display: string;
  category: "LAB" | "RAD" | "PAT" | "CUS" | "MB";
}

export interface DiagnosticReportCategoryCode {
  code: string;
  display: string;
}

/**
 * LOINC codes for common diagnostic report panels and studies.
 * Each entry includes its primary category for Encounter.category wiring.
 */
export const DIAGNOSTIC_REPORT_CODES: DiagnosticReportCode[] = [
  // Laboratory
  { code: "58410-2",  display: "CBC panel - Blood by Automated count",            category: "LAB" },
  { code: "24323-8",  display: "Comprehensive metabolic panel - Serum or Plasma",  category: "LAB" },
  { code: "24357-6",  display: "Urinalysis complete panel - Urine",                category: "LAB" },
  { code: "51990-0",  display: "Basic metabolic panel - Blood",                    category: "LAB" },
  { code: "55231-5",  display: "Lipid panel with direct LDL - Serum or Plasma",    category: "LAB" },
  { code: "30341-2",  display: "Erythrocyte sedimentation rate",                   category: "LAB" },
  { code: "24627-2",  display: "Chest X-ray AP",                                   category: "RAD" },
  // Radiology
  { code: "24558-9",  display: "CT Chest",                                          category: "RAD" },
  { code: "18726-0",  display: "Radiology studies (set)",                           category: "RAD" },
  { code: "24604-0",  display: "MRI Brain with and without contrast",               category: "RAD" },
  { code: "36643-5",  display: "Chest X-ray 2 views",                              category: "RAD" },
  { code: "25056-4",  display: "Abdominal ultrasound",                              category: "RAD" },
  // Pathology
  { code: "60568-3",  display: "Pathology report Cancer",                           category: "PAT" },
  { code: "11529-5",  display: "Surgical pathology report",                         category: "PAT" },
  // Microbiology
  { code: "43409-2",  display: "Bacteria culture and sensitivity panel",            category: "MB"  },
  { code: "41852-5",  display: "Blood culture for bacteria",                        category: "MB"  },
];

/**
 * HL7 v2-0074 diagnostic service section codes — used for DiagnosticReport.category.
 */
export const DIAGNOSTIC_REPORT_CATEGORY_CODES: DiagnosticReportCategoryCode[] = [
  { code: "LAB", display: "Laboratory" },
  { code: "RAD", display: "Radiology" },
  { code: "PAT", display: "Pathology (gross & histopath, not surgical)" },
  { code: "MB",  display: "Microbiology" },
  { code: "CUS", display: "Card. Ultrasound" },
];

/** Valid status codes for DiagnosticReport (R4, R4B, and R5). */
export const DIAGNOSTIC_REPORT_STATUS = [
  "registered",
  "partial",
  "preliminary",
  "final",
  "amended",
  "corrected",
  "appended",
  "cancelled",
] as const;

export type DiagnosticReportStatus = (typeof DIAGNOSTIC_REPORT_STATUS)[number];
