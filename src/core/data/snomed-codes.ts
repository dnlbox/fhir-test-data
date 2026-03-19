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
  { code: "230690007", display: "Stroke" },
  { code: "35489007", display: "Depressive disorder" },
  { code: "197480006", display: "Anxiety disorder" },
  { code: "396275006", display: "Osteoarthritis" },
  { code: "69896004", display: "Rheumatoid arthritis" },
  { code: "40930008", display: "Hypothyroidism" },
  { code: "49436004", display: "Atrial fibrillation" },
  { code: "109819003", display: "Chronic liver disease" },
  { code: "37796009", display: "Migraine" },
  { code: "34000006", display: "Crohn's disease" },
  { code: "49049000", display: "Parkinson's disease" },
  { code: "271737000", display: "Anemia" },
  { code: "233604007", display: "Pneumonia" },
  { code: "68566005", display: "Urinary tract infection" },
  { code: "414916001", display: "Obesity" },
];
