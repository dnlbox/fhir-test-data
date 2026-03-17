# Research 01 — Country-specific identifier systems and validation algorithms

## Overview

Each country's healthcare system defines its own patient and practitioner identifier systems.
FHIR represents these as `Identifier` elements with a `system` URI and a `value`. The value
must conform to the country's format and — critically — pass its check digit algorithm.

This document catalogs every identifier system fhir-test-data will support in v1, including
the exact validation algorithm and FHIR system URI.

---

## United Kingdom

### NHS Number (Patient)

- **System URI:** `https://fhir.nhs.uk/Id/nhs-number`
- **Format:** 10 digits
- **Algorithm:** Modulus 11 check digit

**Modulus 11 algorithm (NHS):**
1. Take the first 9 digits of the number.
2. Multiply digit 1 by 10, digit 2 by 9, digit 3 by 8, ..., digit 9 by 2.
3. Sum all the products.
4. Divide the sum by 11 and take the remainder.
5. Subtract the remainder from 11 to get the check digit.
6. If the check digit is 11, replace with 0.
7. If the check digit is 10, the number is invalid — discard and generate another.
8. The check digit is the 10th digit.

**Known-valid example:** `9434765919`
- Digits: 9 4 3 4 7 6 5 9 1
- Weights: 10 9 8 7 6 5 4 3 2
- Products: 90 + 36 + 24 + 28 + 42 + 30 + 20 + 27 + 2 = 299
- 299 mod 11 = 2
- 11 - 2 = 9 (check digit)

**Generation strategy:** Generate 9 random digits, compute check digit, discard if check
digit is 10, retry.

### ODS Code (Organization)

- **System URI:** `https://fhir.nhs.uk/Id/ods-organization-code`
- **Format:** Alphanumeric, typically 3–5 characters (e.g., `RBA` for Taunton)
- **No check digit.** Format validation only.

### GMP Number (Practitioner — GP)

- **System URI:** `https://fhir.nhs.uk/Id/gmp-number`
- **Format:** `G` followed by 7 digits (e.g., `G1234567`)

### GMC Number (Practitioner — all doctors)

- **System URI:** `https://fhir.hl7.org.uk/Id/gmc-number`
- **Format:** 7 digits (e.g., `1234567`)

---

## Australia

### Individual Healthcare Identifier (IHI) — Patient

- **System URI:** `http://ns.electronichealth.net.au/id/hi/ihi/1.0`
- **Format:** 16 digits, starting with `800360`
- **Algorithm:** Luhn check digit

**Luhn algorithm:**
1. Starting from the rightmost digit (the check digit) and moving left, double the value
   of every second digit.
2. If doubling results in a number greater than 9, subtract 9.
3. Sum all the digits.
4. The total modulo 10 must equal 0.

**Generation (for producing a valid number):**
1. Generate 15 digits (starting with `800360` prefix, remaining 9 random).
2. Compute Luhn check digit:
   a. From the rightmost of the 15 digits, double every second digit.
   b. Sum all digits (splitting doubled values > 9 into their individual digits, or equivalently subtracting 9).
   c. Multiply the sum by 9.
   d. The check digit is the result modulo 10.
3. Append the check digit as the 16th digit.

**Known-valid example:** `8003608833357361`

### Medicare Number — Patient

- **System URI:** `http://ns.electronichealth.net.au/id/medicare-number`
- **Format:** 10 digits (base) + optional 1-digit issue number (IRN)
- **Algorithm:** Weighted checksum

**Medicare check digit algorithm:**
1. Take digits at positions 1–7 (1-indexed).
2. Multiply by weights: 1, 3, 7, 9, 1, 3, 7.
3. Sum the products.
4. The check digit (8th digit) is the sum modulo 10.

**Known-valid example:** `2953171284` (8th digit = check digit, 9th = ref number, 10th = IRN)

### HPI-I (Practitioner)

- **System URI:** `http://ns.electronichealth.net.au/id/hi/hpii/1.0`
- **Format:** 16 digits, starting with `800361`
- **Algorithm:** Luhn (same as IHI)

---

## India

### Aadhaar Number — Patient

- **System URI:** `https://healthid.ndhm.gov.in/api/v1/auth/aadhaar` (ABDM context)
- **Format:** 12 digits
- **Algorithm:** Verhoeff checksum

**Verhoeff algorithm:**
The Verhoeff algorithm uses three tables: a multiplication table (d), a permutation table (p),
and an inverse table (inv).

Multiplication table (d) — Dihedral group D5:
```
d[0] = [0,1,2,3,4,5,6,7,8,9]
d[1] = [1,2,3,4,0,6,7,8,9,5]
d[2] = [2,3,4,0,1,7,8,9,5,6]
d[3] = [3,4,0,1,2,8,9,5,6,7]
d[4] = [4,0,1,2,3,9,5,6,7,8]
d[5] = [5,9,8,7,6,0,4,3,2,1]
d[6] = [6,5,9,8,7,1,0,4,3,2]
d[7] = [7,6,5,9,8,2,1,0,4,3]
d[8] = [8,7,6,5,9,3,2,1,0,4]
d[9] = [9,8,7,6,5,4,3,2,1,0]
```

Permutation table (p):
```
p[0] = [0,1,2,3,4,5,6,7,8,9]
p[1] = [1,5,7,6,2,8,3,0,9,4]
p[2] = [5,8,0,3,7,9,6,1,4,2]
p[3] = [8,9,1,6,0,4,3,5,2,7]
p[4] = [9,4,5,3,1,2,6,8,7,0]
p[5] = [4,2,8,6,5,7,3,9,0,1]
p[6] = [2,7,9,3,8,0,6,4,1,5]
p[7] = [7,0,4,6,9,1,3,2,5,8]
```

Inverse table (inv):
```
inv = [0,4,3,2,1,5,6,7,8,9]
```

**Verification:**
1. Reverse the number.
2. Set c = 0.
3. For each digit at position i (0-indexed): c = d[c][p[i % 8][digit]]
4. If c == 0, the number is valid.

**Generation:**
1. Generate 11 random digits.
2. Compute the Verhoeff check digit:
   a. Append 0 to the 11 digits (placeholder for check digit).
   b. Reverse the resulting 12 digits.
   c. Compute c using the verification algorithm.
   d. The check digit is inv[c].
3. Replace the placeholder with inv[c].

**Known-valid example:** `496107787920`

### ABHA Number (Health ID) — Patient

- **System URI:** `https://healthid.abdm.gov.in/api/v1/abha-number` (per ABDM FHIR IG)
- **Format:** 14 digits, formatted as `XX-XXXX-XXXX-XXXX`
- **No public check digit algorithm** — format validation only for now.

---

## Canada

### Provincial Health Card Numbers (Patient)

Canada does not have a single national health identifier. Each province issues its own
Health Card Number (HCN) with different formats.

**System URI pattern:** `https://fhir.infoway-inforoute.ca/NamingSystem/ca-{XX}-patient-hcn`
where `{XX}` is the province code (ON, BC, AB, QC, etc.)

### Ontario (ON)

- **Format:** 10 digits + 2-letter version code (e.g., `1234567890AB`)
- **No public check digit algorithm** for the health number itself.

### British Columbia (BC)

- **Format:** 10 digits (PHN — Personal Health Number)
- **Algorithm:** Modulus 11 (similar structure to NHS but with different weights)

### Alberta (AB)

- **Format:** 9 digits (PHN)
- **No public check digit algorithm.**

### Quebec (QC)

- **Format:** 4 letters + 8 digits (RAMQ number, e.g., `TREM12345678`)
- First 4 letters derive from name (first 3 of last name + first of first name).

**Generation strategy:** Generate province-appropriate formats. For provinces with known
check digit algorithms (BC), implement them. For others, generate valid format patterns.

---

## Germany

### KVID-10 (Patient — health insurance number)

- **System URI:** `http://fhir.de/sid/gkv/kvid-10`
- **Format:** 10 characters — 1 letter prefix + 9 digits
- **Check digit:** Last digit is a check digit (algorithm defined by GKV-SV).

### KVNR-30 (Patient — extended insurance number)

- **System URI:** `http://fhir.de/sid/gkv/kvnr-30`
- **Format:** 30 characters — structured insurance number.

### IKNR (Organization — institutional identifier)

- **System URI:** `http://fhir.de/sid/arge-ik/iknr`
- **Format:** 9 digits
- **Check digit:** Positions 3–8, modulus algorithm.

### BSNR (Organization — practice identifier)

- **System URI:** `http://fhir.de/sid/kbv/bsnr`
- **Format:** 9 digits

### LANR (Practitioner — physician identifier)

- **System URI:** `http://fhir.de/sid/kbv/lanr`
- **Format:** 9 digits (7 base + 2 suffix)
- **Check digit:** 7th digit is a Modulus 10 check digit over positions 1–6.

---

## France

### INS (Patient — Identite Nationale de Sante)

- **System URI:** `https://annuaire.sante.fr` (per FR Core IG)
- **Format:** 13 digits (NIR — Numero d'Inscription au Repertoire) + 2-digit key
- **Algorithm:** Modulus 97

**Modulus 97 algorithm (French NIR):**
1. Take the 13-digit NIR as a number.
2. For Corsican departments (2A, 2B): replace A with 0 and B with 0, then subtract
   1000000 for 2A or 2000000 for 2B before computing.
3. Key = 97 - (NIR modulo 97).
4. The key is the 14th and 15th digits.

**Known-valid example:** `1850575419043` with key `28` → `185057541904328`

### RPPS (Practitioner)

- **System URI:** `https://annuaire.sante.fr`
- **Format:** 11 digits
- **Algorithm:** Luhn check digit.

---

## Netherlands

### BSN — Burgerservicenummer (Patient)

- **System URI:** `http://fhir.nl/fhir/NamingSystem/bsn`
- **Format:** 9 digits (can have leading zero)
- **Algorithm:** 11-proef (Eleven test)

**11-proef algorithm:**
1. Take the 9 digits: d1 d2 d3 d4 d5 d6 d7 d8 d9.
2. Compute: (9×d1 + 8×d2 + 7×d3 + 6×d4 + 5×d5 + 4×d6 + 3×d7 + 2×d8 - 1×d9).
3. The result must be divisible by 11.
4. The result must not be 0.

**Generation:**
1. Generate 8 random digits (d1–d8).
2. Compute partial sum: S = 9×d1 + 8×d2 + 7×d3 + 6×d4 + 5×d5 + 4×d6 + 3×d7 + 2×d8.
3. Find d9 such that (S - d9) mod 11 == 0 and d9 is a single digit (0–9).
4. d9 = S mod 11. If d9 > 9 or the total sum is 0, discard and retry.

**Known-valid example:** `999999990`
- 9×9 + 8×9 + 7×9 + 6×9 + 5×9 + 4×9 + 3×9 + 2×9 - 1×0
- = 81 + 72 + 63 + 54 + 45 + 36 + 27 + 18 - 0 = 396
- 396 / 11 = 36 (exactly divisible)

### UZI Number (Practitioner)

- **System URI:** `http://fhir.nl/fhir/NamingSystem/uzi-nr-pers`
- **Format:** Numeric, variable length.
- **No public check digit algorithm.**

### AGB Code (Organization/Practitioner)

- **System URI:** `http://fhir.nl/fhir/NamingSystem/agb-z`
- **Format:** 8 digits
- **No public check digit algorithm.**

---

## United States

### SSN (Social Security Number) — Patient

- **System URI:** `http://hl7.org/fhir/sid/us-ssn`
- **Format:** 9 digits, displayed as `XXX-XX-XXXX`
- **No check digit algorithm.**

**Generation constraints:**
- Area number (first 3 digits): cannot be 000, 666, or 900–999.
- Group number (middle 2 digits): cannot be 00.
- Serial number (last 4 digits): cannot be 0000.
- Do NOT generate numbers in the range 987-65-4320 through 987-65-4329 (IRS reserved).
- Prefix all generated SSNs with 9xx (900–999 range is explicitly not assigned by SSA,
  making it safe for synthetic data — except do not use 987-65-43xx as noted above).

**Note:** For synthetic data, we use the 900–999 area number range which is never assigned
to real individuals, making our generated values obviously synthetic.

### MRN (Medical Record Number) — Patient

- **System URI:** Organization-specific (e.g., `http://hospital.example.org/fhir/mrn`)
- **Format:** Varies by institution. Typically 6–10 alphanumeric characters.
- **No standard check digit.** Generate plausible alphanumeric patterns.

### NPI (National Provider Identifier) — Practitioner/Organization

- **System URI:** `http://hl7.org/fhir/sid/us-npi`
- **Format:** 10 digits
- **Algorithm:** Luhn check digit with prefix 80840

**NPI Luhn validation:**
1. Prepend `80840` to the 10-digit NPI (creating a 15-digit number).
2. Apply the standard Luhn algorithm to all 15 digits.
3. The number is valid if the Luhn check passes.

**Generation:**
1. Generate 9 random digits.
2. Prepend `80840` to get 14 digits.
3. Compute Luhn check digit for the 14-digit number.
4. The check digit becomes the 10th digit of the NPI.

---

## Summary of algorithms to implement

| Algorithm | Used by | Complexity |
|-----------|---------|------------|
| **Luhn** | AU IHI, AU Medicare (variant), AU HPI-I, US NPI, FR RPPS | Standard |
| **Modulus 11** | UK NHS Number, CA BC PHN | Weighted sum mod 11 |
| **Verhoeff** | IN Aadhaar | Dihedral group tables |
| **11-proef** | NL BSN | Weighted sum divisible by 11 |
| **Modulus 97** | FR NIR | Large number mod 97 |
| **Modulus 10** | DE LANR | Simple weighted mod 10 |
| **Format-only** | US SSN, CA HCN (most provinces), DE KVID, AU Medicare | Pattern generation |

Each algorithm must be implemented as a pure function with:
- `generate(): string` — produce a valid identifier value
- `validate(value: string): boolean` — verify an existing value
- Unit tests using known-valid examples from this document
