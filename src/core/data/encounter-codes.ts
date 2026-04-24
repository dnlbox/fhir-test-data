// HL7 FHIR R4 Encounter code sets.
// Sources:
//   class:  http://terminology.hl7.org/CodeSystem/v3-ActCode (ActEncounterCode subset)
//   type:   http://snomed.info/sct (Encounter procedure concepts)

export interface EncounterClassCode {
  code: string;
  display: string;
}

export interface EncounterTypeCode {
  code: string;
  display: string;
}

/** HL7 v3 ActEncounterCode — value set for Encounter.class in R4/R4B. */
export const ENCOUNTER_CLASS_CODES: EncounterClassCode[] = [
  { code: "AMB",    display: "ambulatory" },
  { code: "EMER",   display: "emergency" },
  { code: "IMP",    display: "inpatient encounter" },
  { code: "ACUTE",  display: "inpatient acute" },
  { code: "NONAC",  display: "inpatient non-acute" },
  { code: "OBSENC", display: "observation encounter" },
  { code: "SS",     display: "short stay" },
];

/** SNOMED CT — common encounter type concepts for Encounter.type. */
export const ENCOUNTER_TYPE_CODES: EncounterTypeCode[] = [
  { code: "308335008", display: "Patient encounter procedure" },
  { code: "11429006",  display: "Consultation" },
  { code: "185349003", display: "Encounter for check up" },
  { code: "390906007", display: "Follow-up encounter" },
  { code: "702927004", display: "Encounter for condition" },
  { code: "281036003", display: "Follow-up consultation" },
  { code: "270427003", display: "Patient-initiated encounter" },
  { code: "76464004",  display: "Hospital admission procedure" },
  { code: "182992009", display: "Treatment completed" },
  { code: "305351004", display: "Admission to emergency department" },
];

/** Valid status codes for Encounter in R4 and R4B. */
export const ENCOUNTER_STATUS_R4 = [
  "planned",
  "arrived",
  "triaged",
  "in-progress",
  "onleave",
  "finished",
  "cancelled",
] as const;

/** Valid status codes for Encounter in R5. */
export const ENCOUNTER_STATUS_R5 = [
  "planned",
  "in-progress",
  "on-hold",
  "discharged",
  "completed",
  "cancelled",
  "discontinued",
] as const;

export type EncounterStatusR4 = (typeof ENCOUNTER_STATUS_R4)[number];
export type EncounterStatusR5 = (typeof ENCOUNTER_STATUS_R5)[number];
