export interface MedicationCode {
  system: string;
  code: string;
  display: string;
  /** Typical dose in mg */
  typicalDoseMg: number;
  /** Typical frequency (e.g., "daily", "twice daily") */
  frequency: string;
}

const SNOMED = "http://snomed.info/sct";
const RXNORM = "http://www.nlm.nih.gov/research/umls/rxnorm";

export const COMMON_MEDICATION_CODES: MedicationCode[] = [
  { system: SNOMED, code: "27658006", display: "Amoxicillin", typicalDoseMg: 500, frequency: "three times daily" },
  { system: SNOMED, code: "387207008", display: "Ibuprofen", typicalDoseMg: 400, frequency: "as needed" },
  { system: SNOMED, code: "372756006", display: "Atorvastatin", typicalDoseMg: 40, frequency: "daily" },
  { system: SNOMED, code: "386919002", display: "Metformin", typicalDoseMg: 500, frequency: "twice daily" },
  { system: SNOMED, code: "387458008", display: "Aspirin", typicalDoseMg: 100, frequency: "daily" },
  { system: SNOMED, code: "372567009", display: "Amlodipine", typicalDoseMg: 5, frequency: "daily" },
  { system: SNOMED, code: "116602009", display: "Lisinopril", typicalDoseMg: 10, frequency: "daily" },
  { system: SNOMED, code: "387471003", display: "Levothyroxine", typicalDoseMg: 50, frequency: "daily" },
  // Additional SNOMED medications
  { system: SNOMED, code: "372525000", display: "Omeprazole", typicalDoseMg: 20, frequency: "daily" },
  { system: SNOMED, code: "372594008", display: "Sertraline", typicalDoseMg: 50, frequency: "daily" },
  { system: SNOMED, code: "373567009", display: "Losartan", typicalDoseMg: 50, frequency: "daily" },
  { system: SNOMED, code: "387475002", display: "Furosemide", typicalDoseMg: 40, frequency: "daily" },
  { system: SNOMED, code: "372768001", display: "Clopidogrel", typicalDoseMg: 75, frequency: "daily" },
  { system: SNOMED, code: "395726003", display: "Pantoprazole", typicalDoseMg: 40, frequency: "daily" },
  { system: SNOMED, code: "372694001", display: "Albuterol", typicalDoseMg: 2, frequency: "as needed" },
  { system: SNOMED, code: "116601002", display: "Prednisone", typicalDoseMg: 5, frequency: "daily" },
  { system: SNOMED, code: "386928009", display: "Gabapentin", typicalDoseMg: 300, frequency: "three times daily" },
];

export const US_RXNORM_MEDICATION_CODES: MedicationCode[] = [
  { system: RXNORM, code: "866419", display: "Metoprolol", typicalDoseMg: 50, frequency: "twice daily" },
  { system: RXNORM, code: "5487", display: "Hydrochlorothiazide", typicalDoseMg: 25, frequency: "daily" },
  { system: RXNORM, code: "11289", display: "Warfarin", typicalDoseMg: 5, frequency: "daily" },
  { system: RXNORM, code: "41493", display: "Tramadol", typicalDoseMg: 50, frequency: "as needed" },
  { system: RXNORM, code: "203457", display: "Cetirizine", typicalDoseMg: 10, frequency: "daily" },
  { system: RXNORM, code: "18631", display: "Azithromycin", typicalDoseMg: 500, frequency: "daily" },
  { system: RXNORM, code: "301542", display: "Rosuvastatin", typicalDoseMg: 10, frequency: "daily" },
  { system: RXNORM, code: "723372", display: "Montelukast", typicalDoseMg: 10, frequency: "daily" },
];
