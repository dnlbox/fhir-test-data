export interface LoincCode {
  code: string;
  display: string;
  unit: string;
  /** UCUM code */
  unitCode: string;
  category: "vital-signs" | "laboratory";
  valueRange: { min: number; max: number };
  /** Decimal places to round the generated value to (0 = integer) */
  decimals: number;
}

export const COMMON_LOINC_CODES: LoincCode[] = [
  // Vital signs
  {
    code: "8867-4",
    display: "Heart rate",
    unit: "beats/minute",
    unitCode: "/min",
    category: "vital-signs",
    valueRange: { min: 50, max: 120 },
    decimals: 0,
  },
  {
    code: "8310-5",
    display: "Body temperature",
    unit: "degrees Celsius",
    unitCode: "Cel",
    category: "vital-signs",
    valueRange: { min: 35.5, max: 39.0 },
    decimals: 1,
  },
  {
    code: "8480-6",
    display: "Systolic blood pressure",
    unit: "mmHg",
    unitCode: "mm[Hg]",
    category: "vital-signs",
    valueRange: { min: 90, max: 180 },
    decimals: 0,
  },
  {
    code: "8462-4",
    display: "Diastolic blood pressure",
    unit: "mmHg",
    unitCode: "mm[Hg]",
    category: "vital-signs",
    valueRange: { min: 50, max: 110 },
    decimals: 0,
  },
  {
    code: "9279-1",
    display: "Respiratory rate",
    unit: "breaths/minute",
    unitCode: "/min",
    category: "vital-signs",
    valueRange: { min: 10, max: 30 },
    decimals: 0,
  },
  {
    code: "2708-6",
    display: "Oxygen saturation",
    unit: "%",
    unitCode: "%",
    category: "vital-signs",
    valueRange: { min: 88, max: 100 },
    decimals: 0,
  },
  {
    code: "29463-7",
    display: "Body weight",
    unit: "kg",
    unitCode: "kg",
    category: "vital-signs",
    valueRange: { min: 40, max: 150 },
    decimals: 1,
  },
  {
    code: "8302-2",
    display: "Body height",
    unit: "cm",
    unitCode: "cm",
    category: "vital-signs",
    valueRange: { min: 140, max: 200 },
    decimals: 0,
  },
  // Laboratory
  {
    code: "2339-0",
    display: "Glucose",
    unit: "mg/dL",
    unitCode: "mg/dL",
    category: "laboratory",
    valueRange: { min: 60, max: 200 },
    decimals: 0,
  },
  {
    code: "718-7",
    display: "Hemoglobin",
    unit: "g/dL",
    unitCode: "g/dL",
    category: "laboratory",
    valueRange: { min: 8, max: 18 },
    decimals: 1,
  },
  {
    code: "4548-4",
    display: "HbA1c",
    unit: "%",
    unitCode: "%",
    category: "laboratory",
    valueRange: { min: 4, max: 14 },
    decimals: 1,
  },
  {
    code: "2160-0",
    display: "Creatinine",
    unit: "mg/dL",
    unitCode: "mg/dL",
    category: "laboratory",
    valueRange: { min: 0.5, max: 2.5 },
    decimals: 1,
  },
  {
    code: "6690-2",
    display: "WBC count",
    unit: "10*3/uL",
    unitCode: "10*3/uL",
    category: "laboratory",
    valueRange: { min: 3, max: 15 },
    decimals: 1,
  },
];
