/**
 * Pre-built IdentifierDefinition objects for every supported identifier type.
 * Locales import these and include them in their LocaleDefinition.
 * All generators use only the provided RandomFn — no Math.random().
 */
import type { IdentifierDefinition, RandomFn } from "../types.js";
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
