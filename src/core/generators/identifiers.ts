/**
 * Pre-built IdentifierDefinition objects for every supported identifier type.
 * Locales import these and include them in their LocaleDefinition.
 * All generators use only the provided RandomFn — no Math.random().
 */
import type { IdentifierContext, IdentifierDefinition, RandomFn } from "@/core/types.js";
import {
  luhnCheckDigit,
  luhnValidate,
  modulus11CheckDigit,
  modulus11Validate,
  verhoeffCheckDigit,
  verhoeffValidate,
  elevenProefCheckDigit,
  elevenProefValidate,
  modulus97Key,
  modulus97Validate,
  modulus10CheckDigit,
  rrnCheckDigit,
  rrnValidate,
  nricCheckLetter,
  nricValidate,
  cpfCheckDigits,
  cpfValidate,
} from "./check-digits.js";
import { randomDigits, randomInt, pickRandom } from "./rng.js";

// ---------------------------------------------------------------------------
// United Kingdom
// ---------------------------------------------------------------------------

export const nhsNumberDefinition: IdentifierDefinition = {
  system: "https://fhir.nhs.uk/Id/nhs-number",
  name: "NHS Number",
  generate(rng: RandomFn): string {
    // Retry until we get a valid check digit (10 is invalid)
    for (;;) {
      const nine = randomDigits(9, rng);
      const check = modulus11CheckDigit(nine);
      if (check !== null) return nine + check;
    }
  },
  validate: modulus11Validate,
};

export const odsCodDefinition: IdentifierDefinition = {
  system: "https://fhir.nhs.uk/Id/ods-organization-code",
  name: "ODS Code",
  generate(rng: RandomFn): string {
    const letters = "ABCDEFGHJKLMNPRSTUVWXY";
    const letter = pickRandom([...letters], rng);
    const digits = randomDigits(2, rng);
    return letter + digits;
  },
  validate(value: string): boolean {
    return /^[A-Z]{1,3}\d{1,4}[A-Z0-9]?$/.test(value);
  },
};

export const gmpNumberDefinition: IdentifierDefinition = {
  system: "https://fhir.nhs.uk/Id/gmp-number",
  name: "GMP Number",
  generate(rng: RandomFn): string {
    return "G" + randomDigits(7, rng);
  },
  validate(value: string): boolean {
    return /^G\d{7}$/.test(value);
  },
};

export const gmcNumberDefinition: IdentifierDefinition = {
  system: "https://fhir.hl7.org.uk/Id/gmc-number",
  name: "GMC Number",
  generate(rng: RandomFn): string {
    return randomDigits(7, rng);
  },
  validate(value: string): boolean {
    return /^\d{7}$/.test(value);
  },
};

// ---------------------------------------------------------------------------
// Australia
// ---------------------------------------------------------------------------

export const ihiDefinition: IdentifierDefinition = {
  system: "http://ns.electronichealth.net.au/id/hi/ihi/1.0",
  name: "Individual Healthcare Identifier (IHI)",
  generate(rng: RandomFn): string {
    // 16 digits: prefix 800360 + 9 random + 1 Luhn check
    const prefix = "800360";
    const body = randomDigits(9, rng);
    const fifteen = prefix + body;
    return fifteen + luhnCheckDigit(fifteen);
  },
  validate(value: string): boolean {
    return /^\d{16}$/.test(value) && value.startsWith("800360") && luhnValidate(value);
  },
};

export const medicareNumberDefinition: IdentifierDefinition = {
  system: "http://ns.electronichealth.net.au/id/medicare-number",
  name: "Medicare Number",
  generate(rng: RandomFn): string {
    // Positions 1-7: random digits. Position 8: weighted check. Position 9: ref. Position 10: IRN.
    const MEDICARE_WEIGHTS = [1, 3, 7, 9, 1, 3, 7] as const;
    const base = randomDigits(7, rng);
    let sum = 0;
    for (let i = 0; i < 7; i++) {
      const w = MEDICARE_WEIGHTS[i] ?? 0;
      sum += Number(base[i]) * w;
    }
    const check = sum % 10;
    const ref = randomDigits(1, rng);
    const irn = randomInt(1, 9, rng).toString();
    return base + check.toString() + ref + irn;
  },
  validate(value: string): boolean {
    if (!/^\d{10}$/.test(value)) return false;
    const weights = [1, 3, 7, 9, 1, 3, 7];
    let sum = 0;
    for (let i = 0; i < 7; i++) {
      const w = weights[i] ?? 0;
      sum += Number(value[i]) * w;
    }
    return sum % 10 === Number(value[7]);
  },
};

export const hpiiDefinition: IdentifierDefinition = {
  system: "http://ns.electronichealth.net.au/id/hi/hpii/1.0",
  name: "Healthcare Provider Identifier — Individual (HPI-I)",
  generate(rng: RandomFn): string {
    const prefix = "800361";
    const body = randomDigits(9, rng);
    const fifteen = prefix + body;
    return fifteen + luhnCheckDigit(fifteen);
  },
  validate(value: string): boolean {
    return /^\d{16}$/.test(value) && value.startsWith("800361") && luhnValidate(value);
  },
};

export const hpioDefinition: IdentifierDefinition = {
  system: "http://ns.electronichealth.net.au/id/hi/hpio/1.0",
  name: "Healthcare Provider Identifier — Organisation (HPI-O)",
  generate(rng: RandomFn): string {
    const prefix = "800362";
    const body = randomDigits(9, rng);
    const fifteen = prefix + body;
    return fifteen + luhnCheckDigit(fifteen);
  },
  validate(value: string): boolean {
    return /^\d{16}$/.test(value) && value.startsWith("800362") && luhnValidate(value);
  },
};

// ---------------------------------------------------------------------------
// India
// ---------------------------------------------------------------------------

export const aadhaarDefinition: IdentifierDefinition = {
  system: "https://healthid.ndhm.gov.in/api/v1/auth/aadhaar",
  name: "Aadhaar Number",
  generate(rng: RandomFn): string {
    // 12 digits: 11 random + 1 Verhoeff check digit
    const eleven = randomDigits(11, rng);
    return eleven + verhoeffCheckDigit(eleven);
  },
  validate: verhoeffValidate,
};

export const abhaNumberDefinition: IdentifierDefinition = {
  system: "https://healthid.abdm.gov.in/api/v1/abha-number",
  name: "ABHA Number",
  generate(rng: RandomFn): string {
    // 14 digits formatted as XX-XXXX-XXXX-XXXX
    const digits = randomDigits(14, rng);
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}-${digits.slice(10, 14)}`;
  },
  validate(value: string): boolean {
    return /^\d{2}-\d{4}-\d{4}-\d{4}$/.test(value);
  },
};

// ---------------------------------------------------------------------------
// Canada
// ---------------------------------------------------------------------------

export const ontarioHcnDefinition: IdentifierDefinition = {
  system: "https://fhir.infoway-inforoute.ca/NamingSystem/ca-on-patient-hcn",
  name: "Ontario Health Card Number",
  generate(rng: RandomFn): string {
    const digits = randomDigits(10, rng);
    const letters = "ABCDEFGHJKLMNPRSTUVWXY";
    const v1 = pickRandom([...letters], rng);
    const v2 = pickRandom([...letters], rng);
    return digits + v1 + v2;
  },
  validate(value: string): boolean {
    return /^\d{10}[A-Z]{2}$/.test(value);
  },
};

// ---------------------------------------------------------------------------
// Germany
// ---------------------------------------------------------------------------

export const kvidDefinition: IdentifierDefinition = {
  system: "http://fhir.de/sid/gkv/kvid-10",
  name: "KVID-10",
  generate(rng: RandomFn): string {
    // 1 uppercase letter + 9 digits
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const letter = pickRandom([...letters], rng);
    return letter + randomDigits(9, rng);
  },
  validate(value: string): boolean {
    return /^[A-Z]\d{9}$/.test(value);
  },
};

export const iknrDefinition: IdentifierDefinition = {
  system: "http://fhir.de/sid/arge-ik/iknr",
  name: "Institutionskennzeichen (IKNR)",
  generate(rng: RandomFn): string {
    return randomDigits(9, rng);
  },
  validate(value: string): boolean {
    return /^\d{9}$/.test(value);
  },
};

export const lanrDefinition: IdentifierDefinition = {
  system: "http://fhir.de/sid/kbv/lanr",
  name: "Lebenslange Arztnummer (LANR)",
  generate(rng: RandomFn): string {
    // 9 digits: 6 base + 1 modulus-10 check + 2 specialty suffix
    const six = randomDigits(6, rng);
    const check = modulus10CheckDigit(six);
    const suffix = randomDigits(2, rng);
    return six + check + suffix;
  },
  validate(value: string): boolean {
    if (!/^\d{9}$/.test(value)) return false;
    return modulus10CheckDigit(value.slice(0, 6)) === value[6];
  },
};

export const bsnrDefinition: IdentifierDefinition = {
  system: "http://fhir.de/sid/kbv/bsnr",
  name: "Betriebsstättennummer (BSNR)",
  generate(rng: RandomFn): string {
    return randomDigits(9, rng);
  },
  validate(value: string): boolean {
    return /^\d{9}$/.test(value);
  },
};

// ---------------------------------------------------------------------------
// France
// ---------------------------------------------------------------------------

export const nirDefinition: IdentifierDefinition = {
  system: "https://annuaire.sante.fr",
  name: "NIR (Numéro d'Inscription au Répertoire)",
  generate(rng: RandomFn): string {
    // 13 digits + 2-digit Modulus 97 key = 15 chars total
    // gender digit: 1 or 2; year: 00-99; dept: 01-95; etc.
    const gender = pickRandom(["1", "2"], rng);
    const year = randomDigits(2, rng);
    const month = (randomInt(1, 12, rng)).toString().padStart(2, "0");
    const dept = (randomInt(1, 95, rng)).toString().padStart(2, "0");
    const commune = (randomInt(1, 999, rng)).toString().padStart(3, "0");
    const order = (randomInt(1, 999, rng)).toString().padStart(3, "0");
    const thirteen = gender + year + month + dept + commune + order;
    return thirteen + modulus97Key(thirteen);
  },
  validate: modulus97Validate,
};

export const finessDefinition: IdentifierDefinition = {
  system: "https://annuaire.sante.fr/finess",
  name: "FINESS (Fichier national des établissements sanitaires et sociaux)",
  generate(rng: RandomFn): string {
    // 9 digits: 2-digit department + 7 remaining
    const dept = (randomInt(1, 95, rng)).toString().padStart(2, "0");
    return dept + randomDigits(7, rng);
  },
  validate(value: string): boolean {
    return /^\d{9}$/.test(value);
  },
};

export const rppsDefinition: IdentifierDefinition = {
  system: "https://annuaire.sante.fr",
  name: "RPPS Number",
  generate(rng: RandomFn): string {
    // 11 digits with Luhn check
    const ten = randomDigits(10, rng);
    return ten + luhnCheckDigit(ten);
  },
  validate(value: string): boolean {
    return /^\d{11}$/.test(value) && luhnValidate(value);
  },
};

// ---------------------------------------------------------------------------
// Netherlands
// ---------------------------------------------------------------------------

export const bsnDefinition: IdentifierDefinition = {
  system: "http://fhir.nl/fhir/NamingSystem/bsn",
  name: "Burgerservicenummer (BSN)",
  generate(rng: RandomFn): string {
    for (;;) {
      const eight = randomDigits(8, rng);
      const check = elevenProefCheckDigit(eight);
      if (check !== null) return eight + check;
    }
  },
  validate: elevenProefValidate,
};

export const agbCodeDefinition: IdentifierDefinition = {
  system: "http://fhir.nl/fhir/NamingSystem/agb-z",
  name: "AGB-Z Code",
  generate(rng: RandomFn): string {
    return randomDigits(8, rng);
  },
  validate(value: string): boolean {
    return /^\d{8}$/.test(value);
  },
};

export const uziNumberDefinition: IdentifierDefinition = {
  system: "http://fhir.nl/fhir/NamingSystem/uzi-nr-pers",
  name: "UZI Number",
  generate(rng: RandomFn): string {
    return randomDigits(8, rng);
  },
  validate(value: string): boolean {
    return /^\d{6,9}$/.test(value);
  },
};

// ---------------------------------------------------------------------------
// United States
// ---------------------------------------------------------------------------

const IRS_RESERVED_PREFIX = "987654320";

export const ssnDefinition: IdentifierDefinition = {
  system: "http://hl7.org/fhir/sid/us-ssn",
  name: "Social Security Number (SSN)",
  generate(rng: RandomFn): string {
    for (;;) {
      // Area: 900-999 range (never assigned to real people, safe for synthetic data)
      const area = randomInt(900, 998, rng); // exclude 999 which may be reserved
      const group = randomInt(1, 99, rng);
      const serial = randomInt(1, 9999, rng);
      // Avoid IRS reserved range 987-65-43XX
      const candidate =
        area.toString().padStart(3, "0") +
        group.toString().padStart(2, "0") +
        serial.toString().padStart(4, "0");
      if (candidate.startsWith(IRS_RESERVED_PREFIX)) continue;
      const formatted =
        candidate.slice(0, 3) + "-" + candidate.slice(3, 5) + "-" + candidate.slice(5);
      return formatted;
    }
  },
  validate(value: string): boolean {
    if (!/^\d{3}-\d{2}-\d{4}$/.test(value)) return false;
    const digits = value.replace(/-/g, "");
    const area = Number(digits.slice(0, 3));
    const group = Number(digits.slice(3, 5));
    const serial = Number(digits.slice(5));
    return area !== 0 && area !== 666 && group !== 0 && serial !== 0;
  },
};

export const npiDefinition: IdentifierDefinition = {
  system: "http://hl7.org/fhir/sid/us-npi",
  name: "National Provider Identifier (NPI)",
  generate(rng: RandomFn): string {
    // Generate 9 random digits, prepend 80840 for Luhn, use check digit as 10th NPI digit
    const nine = randomDigits(9, rng);
    const forLuhn = "80840" + nine;
    const check = luhnCheckDigit(forLuhn);
    return nine + check;
  },
  validate(value: string): boolean {
    if (!/^\d{10}$/.test(value)) return false;
    return luhnValidate("80840" + value);
  },
};

export const mrnDefinition: IdentifierDefinition = {
  system: "http://hospital.example.org/fhir/mrn",
  name: "Medical Record Number (MRN)",
  generate(rng: RandomFn): string {
    const letters = "ABCDEFGHJKLMNPRSTUVWXYZ";
    const prefix = pickRandom([...letters], rng) + pickRandom([...letters], rng);
    return prefix + randomDigits(6, rng);
  },
  validate(value: string): boolean {
    return /^[A-Z]{2}\d{6}$/.test(value);
  },
};

// ---------------------------------------------------------------------------
// Japan
// ---------------------------------------------------------------------------

export const jpHospitalMrnDefinition: IdentifierDefinition = {
  system: "http://jpfhir.jp/fhir/core/NamingSystem/jp-hospitalPatientId",
  name: "Japanese Hospital Patient ID",
  generate(rng: RandomFn): string {
    return randomDigits(10, rng);
  },
  validate(value: string): boolean {
    return /^\d{10}$/.test(value);
  },
};

// ---------------------------------------------------------------------------
// South Korea
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Korean RRN gender digit rules:
//   1 = male,   1900–1999
//   2 = female, 1900–1999
//   3 = male,   2000–2099
//   4 = female, 2000–2099
// ---------------------------------------------------------------------------

const RRN_GENDER_DIGIT: Record<string, string> = {
  "male-old":    "1",
  "female-old":  "2",
  "male-new":    "3",
  "female-new":  "4",
};

export const krRrnDefinition: IdentifierDefinition = {
  system: "http://www.mohw.go.kr/fhir/NamingSystem/rrn",
  name: "Resident Registration Number (RRN)",
  generate(rng: RandomFn, context?: IdentifierContext): string {
    // Birth year: use builder-supplied value when available, otherwise generate.
    // "Otherwise" preserves the original rng call order for standalone use.
    const hasContext = context?.birthYear !== undefined && context.gender !== undefined;
    const fullYear = hasContext ? (context.birthYear as number) : (randomInt(70, 99, rng) + 1900);
    const yy = (fullYear % 100).toString().padStart(2, "0");

    const month = randomInt(1, 12, rng).toString().padStart(2, "0");
    const day = randomInt(1, 28, rng).toString().padStart(2, "0");

    let genderDigit: string;
    if (hasContext) {
      const century = fullYear >= 2000 ? "new" : "old";
      const gender = context.gender as string;
      // 'other' / 'unknown' fall back to neutral default (male 1900s = "1")
      genderDigit = RRN_GENDER_DIGIT[`${gender}-${century}`] ?? "1";
    } else {
      // Standalone usage: pick randomly so format tests still pass
      genderDigit = pickRandom(["1", "2"], rng);
    }

    const seq = randomDigits(5, rng);
    const twelve = yy + month + day + genderDigit + seq;
    const check = rrnCheckDigit(twelve);
    return `${yy}${month}${day}-${genderDigit}${seq}${check}`;
  },
  validate(value: string): boolean {
    if (!/^\d{6}-\d{7}$/.test(value)) return false;
    return rrnValidate(value);
  },
};

// ---------------------------------------------------------------------------
// Singapore
// ---------------------------------------------------------------------------

const NRIC_PREFIXES = ["S", "S", "S", "T", "T", "F", "G"] as const;

export const sgNricDefinition: IdentifierDefinition = {
  system: "http://hl7.org.sg/fhir/NamingSystem/nric-fin",
  name: "NRIC / FIN",
  generate(rng: RandomFn): string {
    const prefix = pickRandom([...NRIC_PREFIXES], rng);
    const digits = randomDigits(7, rng);
    const check = nricCheckLetter(prefix, digits);
    return `${prefix}${digits}${check}`;
  },
  validate(value: string): boolean {
    return nricValidate(value);
  },
};

// ---------------------------------------------------------------------------
// Brazil
// ---------------------------------------------------------------------------

export const brCpfDefinition: IdentifierDefinition = {
  system: "http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf",
  name: "CPF (Cadastro de Pessoas Físicas)",
  generate(rng: RandomFn): string {
    for (;;) {
      const nine = randomDigits(9, rng);
      // Reject all-same-digit
      if (/^(\d)\1{8}$/.test(nine)) continue;
      const check = cpfCheckDigits(nine);
      const raw = nine + check;
      return raw.slice(0, 3) + "." + raw.slice(3, 6) + "." + raw.slice(6, 9) + "-" + raw.slice(9, 11);
    }
  },
  validate: cpfValidate,
};

// ---------------------------------------------------------------------------
// Mexico
// ---------------------------------------------------------------------------

export const mxCurpDefinition: IdentifierDefinition = {
  system: "http://www.salud.gob.mx/fhir/NamingSystem/curp",
  name: "CURP (Clave Única de Registro de Población)",
  generate(rng: RandomFn): string {
    // Format: 4 letters + 6-digit DOB (YYMMDD) + gender (H/M) + 2-letter state + 3 consonants + 1 alphanum + 1 check
    const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const CONSONANTS = "BCDFGHJKLMNPQRSTVWXYZ";
    const MX_STATES = ["AS","BC","BS","CC","CL","CM","CS","CH","DF","DG","GT","GR","HG","JC","MC","MN","MS","NT","NL","OC","PL","QT","QR","SP","SL","SR","TC","TS","TL","VZ","YN","ZS"];
    const ALPHANUM = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const CURP_CHECK = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    const l1 = pickRandom([...LETTERS], rng);
    const l2 = pickRandom([...LETTERS], rng);
    const l3 = pickRandom([...LETTERS], rng);
    const l4 = pickRandom([...LETTERS], rng);
    const year = randomInt(50, 99, rng).toString().padStart(2, "0");
    const month = randomInt(1, 12, rng).toString().padStart(2, "0");
    const day = randomInt(1, 28, rng).toString().padStart(2, "0");
    const gender = pickRandom(["H", "M"], rng);
    const state = pickRandom(MX_STATES, rng);
    const c1 = pickRandom([...CONSONANTS], rng);
    const c2 = pickRandom([...CONSONANTS], rng);
    const c3 = pickRandom([...CONSONANTS], rng);
    const an = pickRandom([...ALPHANUM], rng);
    // check digit: simple index-based (position 0=A,1=B,...,9=9, etc. using CURP_CHECK)
    const body = l1 + l2 + l3 + l4 + year + month + day + gender + state + c1 + c2 + c3 + an;
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      const idx = CURP_CHECK.indexOf(body[i] ?? "");
      sum += (idx >= 0 ? idx : 0) * (18 - i);
    }
    const checkIdx = (10 - (sum % 10)) % 10;
    return body + checkIdx.toString();
  },
  validate(value: string): boolean {
    return /^[A-Z]{4}\d{6}[HM][A-Z]{2}[BCDFGHJKLMNPQRSTVWXYZ]{3}[0-9A-Z]\d$/.test(value);
  },
};

// ---------------------------------------------------------------------------
// South Africa
// ---------------------------------------------------------------------------

export const zaIdDefinition: IdentifierDefinition = {
  system: "http://www.rsaidentity.co.za/fhir/NamingSystem/said",
  name: "South African ID Number",
  generate(rng: RandomFn): string {
    // Format: YYMMDD + G (gender: 0-4 female, 5-9 male) + SSS + C(0) + A(8) + Z(Luhn)
    const year = randomInt(50, 99, rng).toString().padStart(2, "0");
    const month = randomInt(1, 12, rng).toString().padStart(2, "0");
    const day = randomInt(1, 28, rng).toString().padStart(2, "0");
    const genderDigit = pickRandom([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], rng).toString();
    const seq = randomInt(0, 999, rng).toString().padStart(3, "0");
    const citizenship = "0";
    const race = "8";
    const twelve = year + month + day + genderDigit + seq + citizenship + race;
    const check = luhnCheckDigit(twelve);
    return twelve + check;
  },
  validate(value: string): boolean {
    return /^\d{13}$/.test(value) && luhnValidate(value);
  },
};

// ---------------------------------------------------------------------------
// Practitioner identifiers — Canada
// ---------------------------------------------------------------------------

export const cpsoPractitionerDefinition: IdentifierDefinition = {
  system: "https://www.cpso.on.ca/",
  name: "CPSO/Provincial Licence Number",
  generate(rng: RandomFn): string {
    return randomDigits(6, rng);
  },
  validate(value: string): boolean {
    return /^\d{5,6}$/.test(value);
  },
};

// ---------------------------------------------------------------------------
// Practitioner identifiers — India
// ---------------------------------------------------------------------------

export const nmcRegistrationDefinition: IdentifierDefinition = {
  system: "https://www.nmc.org.in/",
  name: "NMC Registration Number",
  generate(rng: RandomFn): string {
    return randomDigits(6, rng);
  },
  validate(value: string): boolean {
    return /^\d{6}$/.test(value);
  },
};

// ---------------------------------------------------------------------------
// Practitioner identifiers — Japan
// ---------------------------------------------------------------------------

export const jmpDoctorLicenseDefinition: IdentifierDefinition = {
  system: "http://jpfhir.jp/fhir/core/NamingSystem/jp-doctor-license",
  name: "JMPC Physician Registration Number",
  generate(rng: RandomFn): string {
    return randomDigits(6, rng);
  },
  validate(value: string): boolean {
    return /^\d{6}$/.test(value);
  },
};

// ---------------------------------------------------------------------------
// Practitioner identifiers — South Korea
// ---------------------------------------------------------------------------

export const mohwDoctorLicenseDefinition: IdentifierDefinition = {
  system: "http://www.mohw.go.kr/fhir/NamingSystem/doctor-license",
  name: "Medical Licence Number (보건복지부)",
  generate(rng: RandomFn): string {
    return randomDigits(5, rng);
  },
  validate(value: string): boolean {
    return /^\d{5}$/.test(value);
  },
};

// ---------------------------------------------------------------------------
// Practitioner identifiers — Singapore
// ---------------------------------------------------------------------------

export const smcRegistrationDefinition: IdentifierDefinition = {
  system: "http://www.smc.gov.sg/fhir/NamingSystem/smcr",
  name: "Singapore Medical Council Registration",
  generate(rng: RandomFn): string {
    return "M" + randomDigits(5, rng);
  },
  validate(value: string): boolean {
    return /^M\d{5}$/.test(value);
  },
};

// ---------------------------------------------------------------------------
// Practitioner identifiers — Brazil
// ---------------------------------------------------------------------------

const BR_CRM_STATES = ["SP", "RJ", "MG", "RS", "BA", "PR", "PE", "CE", "GO", "MA"] as const;

export const crmPractitionerDefinition: IdentifierDefinition = {
  system: "https://www.cfm.org.br/fhir/NamingSystem/crm",
  name: "CRM (Conselho Regional de Medicina)",
  generate(rng: RandomFn): string {
    const state = pickRandom([...BR_CRM_STATES], rng);
    return `${state}-${randomDigits(5, rng)}`;
  },
  validate(value: string): boolean {
    return /^[A-Z]{2}-\d{5}$/.test(value);
  },
};

// ---------------------------------------------------------------------------
// Practitioner identifiers — Mexico
// ---------------------------------------------------------------------------

export const cedulaProfesionalDefinition: IdentifierDefinition = {
  system: "http://www.sep.gob.mx/fhir/NamingSystem/cedula",
  name: "Cédula Profesional",
  generate(rng: RandomFn): string {
    return randomDigits(7, rng);
  },
  validate(value: string): boolean {
    return /^\d{7}$/.test(value);
  },
};

// ---------------------------------------------------------------------------
// Practitioner identifiers — South Africa
// ---------------------------------------------------------------------------

export const hpcsaRegistrationDefinition: IdentifierDefinition = {
  system: "https://www.hpcsa.co.za/fhir/NamingSystem/hpcsa",
  name: "HPCSA Registration Number",
  generate(rng: RandomFn): string {
    return "MP" + randomDigits(6, rng);
  },
  validate(value: string): boolean {
    return /^MP\d{6}$/.test(value);
  },
};
