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

export const COMMON_MEDICATION_CODES: MedicationCode[] = [
  { system: SNOMED, code: "27658006", display: "Amoxicillin", typicalDoseMg: 500, frequency: "three times daily" },
  { system: SNOMED, code: "387207008", display: "Ibuprofen", typicalDoseMg: 400, frequency: "as needed" },
  { system: SNOMED, code: "372756006", display: "Atorvastatin", typicalDoseMg: 40, frequency: "daily" },
  { system: SNOMED, code: "386919002", display: "Metformin", typicalDoseMg: 500, frequency: "twice daily" },
  { system: SNOMED, code: "387458008", display: "Aspirin", typicalDoseMg: 100, frequency: "daily" },
  { system: SNOMED, code: "372567009", display: "Amlodipine", typicalDoseMg: 5, frequency: "daily" },
  { system: SNOMED, code: "116602009", display: "Lisinopril", typicalDoseMg: 10, frequency: "daily" },
  { system: SNOMED, code: "387471003", display: "Levothyroxine", typicalDoseMg: 50, frequency: "daily" },
];
