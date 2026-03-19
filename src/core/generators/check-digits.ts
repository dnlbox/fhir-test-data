/**
 * Pure check digit algorithm implementations.
 * All functions are stateless and browser-safe.
 * Sources: docs/research/01-country-identifiers.md
 */

// ---------------------------------------------------------------------------
// Luhn — AU IHI, AU HPI-I, US NPI, FR RPPS
// ---------------------------------------------------------------------------

/**
 * Compute the Luhn check digit for a string of digits (without the check digit).
 * Returns a single digit string "0"–"9".
 */
export function luhnCheckDigit(digits: string): string {
  let sum = 0;
  for (let i = digits.length - 1; i >= 0; i--) {
    const pos = digits.length - 1 - i; // 0 = rightmost position
    let d = Number(digits[i]);
    if (pos % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return ((10 - (sum % 10)) % 10).toString();
}

/** Validate a full number (including check digit) against the Luhn algorithm. */
export function luhnValidate(value: string): boolean {
  if (!/^\d+$/.test(value) || value.length < 2) return false;
  let sum = 0;
  for (let i = value.length - 1; i >= 0; i--) {
    const pos = value.length - 1 - i;
    let d = Number(value[i]);
    if (pos % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

// ---------------------------------------------------------------------------
// Modulus 11 — UK NHS Number
// ---------------------------------------------------------------------------

const NHS_WEIGHTS = [10, 9, 8, 7, 6, 5, 4, 3, 2];

/**
 * Compute the NHS Modulus 11 check digit for the first 9 digits.
 * Returns null if check digit would be 10 (number must be discarded and regenerated).
 */
export function modulus11CheckDigit(nineDigits: string): string | null {
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const w = NHS_WEIGHTS[i] ?? 0;
    sum += Number(nineDigits[i]) * w;
  }
  const check = 11 - (sum % 11);
  if (check === 11) return "0";
  if (check === 10) return null;
  return check.toString();
}

/** Validate a 10-digit NHS number against the Modulus 11 algorithm. */
export function modulus11Validate(value: string): boolean {
  if (!/^\d{10}$/.test(value)) return false;
  const check = modulus11CheckDigit(value.slice(0, 9));
  return check !== null && check === value[9];
}

// ---------------------------------------------------------------------------
// Verhoeff — IN Aadhaar
// ---------------------------------------------------------------------------

// Dihedral group D5 multiplication table
const VERHOEFF_D: readonly (readonly number[])[] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

// Permutation table
const VERHOEFF_P: readonly (readonly number[])[] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

const VERHOEFF_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

function verhoeffStep(c: number, digit: number, position: number): number {
  const pRow = VERHOEFF_P[position % 8];
  if (pRow === undefined) throw new Error(`Verhoeff P table: row ${position % 8} missing`);
  const pVal = pRow[digit];
  if (pVal === undefined) throw new Error(`Verhoeff P table: col ${digit} missing`);
  const dRow = VERHOEFF_D[c];
  if (dRow === undefined) throw new Error(`Verhoeff D table: row ${c} missing`);
  const result = dRow[pVal];
  if (result === undefined) throw new Error(`Verhoeff D table: col ${pVal} missing`);
  return result;
}

/**
 * Compute Verhoeff check digit for a string of digits.
 * Returns a single digit string "0"–"9".
 */
export function verhoeffCheckDigit(digits: string): string {
  const withPlaceholder = digits + "0";
  const reversed = withPlaceholder.split("").reverse();
  let c = 0;
  for (let i = 0; i < reversed.length; i++) {
    c = verhoeffStep(c, Number(reversed[i]), i);
  }
  const inv = VERHOEFF_INV[c];
  if (inv === undefined) throw new Error(`Verhoeff INV table: index ${c} missing`);
  return inv.toString();
}

/** Validate a number (including check digit) against the Verhoeff algorithm. */
export function verhoeffValidate(value: string): boolean {
  if (!/^\d+$/.test(value) || value.length < 2) return false;
  const reversed = value.split("").reverse();
  let c = 0;
  for (let i = 0; i < reversed.length; i++) {
    c = verhoeffStep(c, Number(reversed[i]), i);
  }
  return c === 0;
}

// ---------------------------------------------------------------------------
// 11-proef — NL BSN
// ---------------------------------------------------------------------------

const BSN_WEIGHTS = [9, 8, 7, 6, 5, 4, 3, 2];
const BSN_VALIDATE_WEIGHTS = [9, 8, 7, 6, 5, 4, 3, 2, -1];

/**
 * Compute the 11-proef check digit (d9) for 8 leading BSN digits.
 * Returns null if no valid single-digit d9 exists (caller must retry).
 */
export function elevenProefCheckDigit(eightDigits: string): string | null {
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    const w = BSN_WEIGHTS[i] ?? 0;
    sum += Number(eightDigits[i]) * w;
  }
  const d9 = sum % 11;
  if (d9 > 9) return null;
  if (sum - d9 === 0) return null;
  return d9.toString();
}

/** Validate a 9-digit BSN against the 11-proef algorithm. */
export function elevenProefValidate(value: string): boolean {
  if (!/^\d{9}$/.test(value)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const w = BSN_VALIDATE_WEIGHTS[i] ?? 0;
    sum += Number(value[i]) * w;
  }
  return sum !== 0 && sum % 11 === 0;
}

// ---------------------------------------------------------------------------
// Modulus 97 — FR NIR
// ---------------------------------------------------------------------------

/**
 * Compute the 2-digit Modulus 97 key for a 13-digit French NIR.
 * Returns a zero-padded 2-digit string.
 */
export function modulus97Key(thirteenDigits: string): string {
  const nir = BigInt(thirteenDigits);
  const key = 97n - (nir % 97n);
  return key.toString().padStart(2, "0");
}

/** Validate a 15-digit French NIR+key (13 NIR digits + 2-digit key). */
export function modulus97Validate(value: string): boolean {
  if (!/^\d{15}$/.test(value)) return false;
  return modulus97Key(value.slice(0, 13)) === value.slice(13, 15);
}

// ---------------------------------------------------------------------------
// Modulus 10 — DE LANR (7th digit check over positions 1–6)
// ---------------------------------------------------------------------------

const LANR_WEIGHTS = [4, 9, 2, 1, 6, 5];

/**
 * Compute the Modulus 10 check digit for the first 6 digits of a LANR.
 * Returns a single digit string "0"–"9".
 */
export function modulus10CheckDigit(sixDigits: string): string {
  let sum = 0;
  for (let i = 0; i < 6; i++) {
    const w = LANR_WEIGHTS[i] ?? 0;
    sum += Number(sixDigits[i]) * w;
  }
  return ((10 - (sum % 10)) % 10).toString();
}

// ---------------------------------------------------------------------------
// Korean RRN — Resident Registration Number
// ---------------------------------------------------------------------------

const RRN_WEIGHTS = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5] as const;

/**
 * Compute the Korean RRN check digit for the first 12 digits.
 * Returns a single digit string "0"–"9".
 */
export function rrnCheckDigit(twelveDigits: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const w = RRN_WEIGHTS[i] ?? 0;
    sum += Number(twelveDigits[i]) * w;
  }
  return ((11 - (sum % 11)) % 10).toString();
}

/** Validate a Korean RRN (13 digits, with or without hyphen). */
export function rrnValidate(value: string): boolean {
  const digits = value.replace(/-/g, "");
  if (!/^\d{13}$/.test(digits)) return false;
  return rrnCheckDigit(digits.slice(0, 12)) === digits[12];
}

// ---------------------------------------------------------------------------
// Singapore NRIC / FIN — National Registration Identity Card
// ---------------------------------------------------------------------------

const NRIC_WEIGHTS = [2, 7, 6, 5, 4, 3, 2] as const;
const NRIC_ST_CHECK_LETTERS = "JZIHGFEDCBA";
const NRIC_FG_CHECK_LETTERS = "XWUTRQPNMLK";

/**
 * Compute the Singapore NRIC check letter.
 * prefix: one of "S" | "T" | "F" | "G"
 * sevenDigits: 7-digit string
 * Returns a single uppercase letter.
 */
export function nricCheckLetter(prefix: string, sevenDigits: string): string {
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const w = NRIC_WEIGHTS[i] ?? 0;
    sum += Number(sevenDigits[i]) * w;
  }
  if (prefix === "T" || prefix === "G") sum += 4;
  const checkLetters = prefix === "F" || prefix === "G" ? NRIC_FG_CHECK_LETTERS : NRIC_ST_CHECK_LETTERS;
  return checkLetters[sum % 11] ?? "A";
}

/** Validate a Singapore NRIC (format: SXXXXXXC — prefix + 7 digits + check letter). */
export function nricValidate(value: string): boolean {
  if (!/^[STFG]\d{7}[A-Z]$/.test(value)) return false;
  const prefix = value[0] ?? "";
  const digits = value.slice(1, 8);
  const checkChar = value[8] ?? "";
  return nricCheckLetter(prefix, digits) === checkChar;
}

// ---------------------------------------------------------------------------
// Brazilian CPF — Cadastro de Pessoas Físicas
// ---------------------------------------------------------------------------

/**
 * Compute the two CPF check digits for 9 base digits.
 * Returns a 2-digit string (D1D2).
 * CPF format: NNN.NNN.NNN-DD
 */
export function cpfCheckDigits(nineDigits: string): string {
  // First check digit: weights 10..2
  let sum1 = 0;
  for (let i = 0; i < 9; i++) {
    sum1 += Number(nineDigits[i]) * (10 - i);
  }
  const rem1 = sum1 % 11;
  const d1 = rem1 < 2 ? 0 : 11 - rem1;

  // Second check digit: weights 11..2 (includes d1)
  const tenDigits = nineDigits + d1.toString();
  let sum2 = 0;
  for (let i = 0; i < 10; i++) {
    sum2 += Number(tenDigits[i]) * (11 - i);
  }
  const rem2 = sum2 % 11;
  const d2 = rem2 < 2 ? 0 : 11 - rem2;

  return d1.toString() + d2.toString();
}

/** Validate a CPF string. Accepts formatted (NNN.NNN.NNN-DD) or raw (11 digits). */
export function cpfValidate(value: string): boolean {
  const digits = value.replace(/[.\-]/g, "");
  if (!/^\d{11}$/.test(digits)) return false;
  // Reject all-same-digit CPFs (e.g., "00000000000")
  if (/^(\d)\1{10}$/.test(digits)) return false;
  const check = cpfCheckDigits(digits.slice(0, 9));
  return check === digits.slice(9, 11);
}
