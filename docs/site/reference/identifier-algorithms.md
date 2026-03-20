# Identifier algorithms

Every locale's patient and practitioner identifiers are validated using the country's
official check-digit algorithm. Generated values always pass validation.

## Luhn algorithm

**Used by:** AU (IHI, HPI-I, Medicare), FR (RPPS), US (NPI)

The Luhn algorithm is a simple checksum formula used to validate various identification
numbers, including credit card numbers. It detects all single-digit errors and most
transposition errors.

**Algorithm:**
1. Starting from the rightmost digit (excluding the check digit) and moving left, double
   every second digit
2. If doubling results in a number greater than 9, subtract 9
3. Sum all digits (including the check digit)
4. The total must be divisible by 10

**Example (NPI — US National Provider Identifier):**

```
Prefix digits: 1234567890  (10 digits, check digit is last)
Weights: double every other digit from the right
Sum + check digit ≡ 0 (mod 10)
```

**Implementation:** `src/core/generators/check-digits.ts`

---

## Modulus 11 (NHS Number)

**Used by:** UK (NHS Number)

The NHS Number check-digit algorithm uses weighted summation with Modulus 11.

**Algorithm:**
1. Multiply each of the first 9 digits by weights 10, 9, 8, 7, 6, 5, 4, 3, 2
2. Sum the products
3. Divide the sum by 11 and take the remainder
4. Subtract the remainder from 11 to get the check digit
5. If the result is 11, the check digit is 0
6. If the result is 10, the number is invalid — regenerate

```
NHS Number:  4  8  5  7  3  2  6  1  9  [0]
Weights:    10   9   8   7   6   5   4   3   2
Products:   40  72  40  49  18  10  24   3  18 = 274
274 mod 11 = 10  →  11 - 10 = 1   (check digit is 1... regenerate if result is 10)
```

**Specification:** [NHS Digital — NHS Number](https://www.datadictionary.nhs.uk/attributes/nhs_number.html)

---

## Verhoeff algorithm (Aadhaar)

**Used by:** IN (Aadhaar)

The Verhoeff algorithm uses the dihedral group D5 and three lookup tables (multiplication,
permutation, inverse). It detects all single-digit errors and all adjacent transposition
errors.

**Three tables:**
- **d** — multiplication table from dihedral group D5
- **p** — permutation table that cycles digits
- **inv** — multiplicative inverse table

**Algorithm (validation):**
1. Start with `c = 0`
2. For each digit from right to left, with position index `i`:
   - `c = d[c][p[i mod 8][digit]]`
3. The number is valid if `c == 0`

The Verhoeff algorithm is significantly stronger than Luhn — it catches more error
patterns that Luhn misses, including all transpositions of adjacent digits.

**Specification:** [Verhoeff algorithm (Wikipedia)](https://en.wikipedia.org/wiki/Verhoeff_algorithm)

---

## 11-proef (BSN)

**Used by:** NL (BSN — Burgerservicenummer)

The 11-proef is a Modulus 11 variant specific to Dutch identity numbers. It uses
alternating positive and negative weights.

**Algorithm:**
1. Multiply each digit by its weight: `9, 8, 7, 6, 5, 4, 3, 2, -1` (for positions 1–9)
2. Sum the products
3. The sum must be divisible by 11

```
BSN:       1  2  3  4  5  6  7  8  9
Weights:   9  8  7  6  5  4  3  2  -1
Products:  9 16 21 24 25 24 21 16  -9 = 147
147 / 11 = 13 remainder 4  (not valid — this is an example only)
```

The negative weight on the last digit is the key difference from standard Modulus 11.

**Specification:** [Rijksoverheid — BSN](https://www.rijksoverheid.nl/onderwerpen/identiteitsfraude/vraag-en-antwoord/wat-is-een-burgerservicenummer-bsn)

---

## Modulus 97 (NIR)

**Used by:** FR (NIR — Numéro d'Inscription au Répertoire)

The French social security number check key uses Modulus 97, the same algorithm used
in IBAN bank account numbers.

**Algorithm:**
1. Take the first 13 digits of the NIR
2. Compute `97 - (n mod 97)` using BigInt (the number is too large for standard 64-bit float)
3. The result is the 2-digit check key (zero-padded if less than 10)

```
First 13 digits: 1 75 02 75 113 001
Check key = 97 - (175027511300 mod 97) = 97 - 61 = 36
Full NIR: 1 75 02 75 113 001 36
```

BigInt is required because standard JavaScript floating-point arithmetic loses precision
for numbers this large.

---

## Modulus 10 (LANR)

**Used by:** DE (LANR — Lebenslange Arztnummer)

The German doctor registration number uses Modulus 10 on the first 6 digits.

**Algorithm:**
1. Apply alternating weights 2, 1 to the first 6 digits (starting with 2)
2. If a product exceeds 9, sum its digits (subtract 9)
3. Sum all products
4. Check digit = `(10 - (sum mod 10)) mod 10`

This is similar to the Luhn algorithm but applied to only the first 6 digits of the LANR.

---

## Algorithm summary

| Algorithm | Used by | Detects single-digit errors | Detects adjacent transpositions |
|-----------|---------|---------------------------|--------------------------------|
| Luhn | AU, FR, US | Yes | Most |
| Modulus 11 | UK NHS | Yes | Most |
| Verhoeff | IN Aadhaar | Yes | All |
| 11-proef | NL BSN | Yes | Most |
| Modulus 97 | FR NIR | Yes | Most |
| Modulus 10 | DE LANR | Yes | Most |

Verhoeff is the strongest of these algorithms, having been specifically designed to
catch all single-digit and adjacent-transposition errors that Luhn misses.
