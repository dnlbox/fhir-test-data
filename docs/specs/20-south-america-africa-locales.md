---
**Status:** complete
---

# Spec 20 — South America and South Africa locales

## Goal

Add locale support for Brazil, Mexico, and South Africa — the highest-priority markets from the
user's target list for South America and Africa:

- **`br`** — Brazil
- **`mx`** — Mexico
- **`za`** — South Africa

These three cover the largest healthcare markets in their regions and represent sufficient diversity
(Portuguese, Spanish, and multi-language) to validate locale architecture without excessive scope.

## Dependencies

- Spec 01 (core-types) — complete
- Spec 02 (identifier-generators) — complete
- Spec 03 (address-generators) — complete
- Spec 04 (name-generators) — complete
- Spec 05 (patient-builder) — complete

## Deliverables

- `src/locales/br/` — `index.ts`, `names.ts`, `addresses.ts`
- `src/locales/mx/` — `index.ts`, `names.ts`, `addresses.ts`
- `src/locales/za/` — `index.ts`, `names.ts`, `addresses.ts`
- `src/locales/index.ts` — add `br`, `mx`, `za` to `LOCALE_MAP`
- `src/core/types.ts` — add `"br" | "mx" | "za"` to the `Locale` union type
- `tests/locales/` — identifier validity tests for each new locale
- `README.md` — add new locales to the locale support table

## Identifier schemes

### Brazil (`br`)
- **CPF** (Cadastro de Pessoas Físicas) — 11 digits, format `NNN.NNN.NNN-DD`
  - Two check digits computed via weighted descending sums modulo 11
  - System URI: `urn:oid:2.16.840.1.113883.2.1.3.1` or
    `http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf`
  - Well-known algorithm — implement in the identifier generators
- **CNES** for organizations: healthcare establishment code (7 digits)

### Mexico (`mx`)
- **CURP** (Clave Única de Registro de Población) — 18-character alphanumeric
  - Format: 4 letters (derived from name/DOB) + 6-digit DOB (YYMMDD) + 1 gender letter (H/M) +
    2-letter state code + 3 letters (consonants from name) + 1 alphanumeric + 1 check digit
  - The full CURP derivation algorithm is complex — generate a structurally valid synthetic CURP
    that follows the pattern without deriving it from the patient name/DOB
  - System URI: `urn:oid:2.16.840.1.113883.2.1.3.1` or
    `http://www.salud.gob.mx/fhir/NamingSystem/curp`
- **RFC** for tax purposes (organizations)

### South Africa (`za`)
- **SA ID Number** — 13 digits: YYMMDD (DOB) + G (gender: 0–4 female, 5–9 male) + SSS (sequence) +
  C (citizenship: 0=SA) + A (race digit, obsolete, use 8) + Z (check digit, Luhn)
  - System URI: `http://www.rsaidentity.co.za/fhir/NamingSystem/said`
  - Luhn check digit algorithm already implemented (reuse)
  - Gender digit must be consistent with `Patient.gender`

## Address formats

### Brazil
- Street (Rua/Avenida) + number + complement + neighbourhood (bairro) + city + state
- Postal code: CEP format `NNNNN-NNN` (8 digits) — store as `NNNNNNNN` in FHIR
- Country code: `BR`

### Mexico
- Street + exterior number + interior number + colonia + municipality + state
- Postal code: 5 digits
- Country code: `MX`

### South Africa
- Street number + street name + suburb + city + province
- Postal code: 4 digits
- Country code: `ZA`

## Name datasets

- **Brazil**: Portuguese-origin family names (Silva, Santos, Oliveira, Souza…) + given names
- **Mexico**: Spanish family names (García, Martínez, López, González…) — note dual-surname
  convention; keep single family name for simplicity
- **South Africa**: multi-ethnic mix (Zulu, Xhosa, Afrikaans, English surnames);
  use English-style names for simplicity to avoid transliteration issues

## Implementation notes

- CPF check digit algorithm is well-documented and should be fully implemented and tested
- CURP: generate structurally valid synthetic values (correct format, valid check character) without
  deriving from patient attributes — the full derivation is complex and not needed for test data
- SA ID: reuse the existing Luhn algorithm; ensure gender digit matches `Patient.gender`
- All locales must produce `country` values matching ISO 3166-1 alpha-2 (`BR`, `MX`, `ZA`)
- Practitioner and Organization locale data is optional — Patient is the primary target

## Acceptance criteria

```bash
# All three locales must generate valid resources
for locale in br mx za; do
  fhir-test-data generate patient --locale $locale --count 5 --seed 42 \
    | fhir-resource-diff validate -
  # Expected: 5 resources: 5 valid, 0 invalid
done

# Brazil CPF check digits must be valid (structural format check)
fhir-test-data generate patient --locale br --seed 1 --no-pretty \
  | node -e "
    const r = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
    const cpf = r.identifier.find(i => i.system.includes('cpf'))?.value;
    console.assert(cpf && /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf), 'CPF format invalid: '+cpf);
    console.log('CPF:', cpf);
  "

# South Africa gender digit must match Patient.gender
fhir-test-data generate patient --locale za --seed 1 --no-pretty \
  | node -e "
    const r = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
    const id = r.identifier.find(i => i.system.includes('said'))?.value;
    const genderDigit = parseInt(id?.[6]);
    const isFemale = genderDigit >= 0 && genderDigit <= 4;
    const isMale = genderDigit >= 5 && genderDigit <= 9;
    console.assert(
      (r.gender === 'female' && isFemale) || (r.gender === 'male' && isMale),
      'gender mismatch: ' + r.gender + ' vs digit ' + genderDigit
    );
    console.log('gender consistent:', r.gender, 'digit:', genderDigit);
  "
```

## Do not do

- Do not implement full CURP derivation from patient name/DOB — synthetic structurally valid values only
- Do not add Argentina, Colombia, or other South American locales in this spec
- Do not add Practitioner/Organization builders for these locales in this spec
