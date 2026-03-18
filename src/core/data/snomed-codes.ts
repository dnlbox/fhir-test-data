export interface SnomedCode {
  code: string;
  display: string;
}

export const COMMON_SNOMED_CONDITIONS: SnomedCode[] = [
  { code: "73211009", display: "Diabetes mellitus" },
  { code: "38341003", display: "Hypertension" },
  { code: "195967001", display: "Asthma" },
  { code: "44054006", display: "Type 2 diabetes mellitus" },
  { code: "84114007", display: "Heart failure" },
  { code: "13645005", display: "COPD" },
  { code: "56265001", display: "Heart disease" },
  { code: "40055000", display: "Chronic kidney disease" },
  { code: "73430006", display: "Sleep apnea" },
  { code: "414545008", display: "Ischemic heart disease" },
];
