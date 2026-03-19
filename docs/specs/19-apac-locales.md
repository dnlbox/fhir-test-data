---
**Status:** complete
---

# Spec 19 — APAC locales: Japan, South Korea, Singapore

## Goal

Add locale support for three APAC countries currently not covered by fhir-test-data:

- **`jp`** — Japan
- **`kr`** — South Korea
- **`sg`** — Singapore

Each locale must produce Patient resources with:
- Culturally appropriate names (in romanised form for CLI/JSON output)
- Country-specific addresses
- Country-specific patient identifiers with the correct format/check algorithm

## Dependencies

- Spec 01 (core-types) — complete
- Spec 02 (identifier-generators) — complete
- Spec 03 (address-generators) — complete
- Spec 04 (name-generators) — complete
- Spec 05 (patient-builder) — complete

## Deliverables

- `src/locales/jp/` — `index.ts`, `names.ts`, `addresses.ts`
- `src/locales/kr/` — `index.ts`, `names.ts`, `addresses.ts`
- `src/locales/sg/` — `index.ts`, `names.ts`, `addresses.ts`
- `src/locales/index.ts` — add `jp`, `kr`, `sg` to the `LOCALE_MAP`
- `src/core/types.ts` — add `"jp" | "kr" | "sg"` to the `Locale` union type
- `tests/locales/` — tests for each new locale's identifier format validity
- `README.md` — add new locales to the locale support table

## Identifier schemes

### Japan (`jp`)
- **Patient**: My Number (個人番号) — 12-digit number with a check digit (Verhoeff or modulus-based)
  - Format: 12 numeric digits
  - System URI: `urn:oid:1.2.392.100495.20.3.51.1` (or generic Japanese MRN for testing)
  - Alternative for test data: Hospital MRN (病院番号) — simpler, no public check algorithm
  - Recommended for test data: use a hospital MRN system `http://jpfhir.jp/fhir/core/NamingSystem/jp-hospitalPatientId`

### South Korea (`kr`)
- **Patient**: Resident Registration Number (주민등록번호, RRN) — 13 digits in YYMMDD-XXXXXXX format
  - The 7th digit encodes gender and birth century; last digit is a check digit (weighted sum mod 11)
  - Format: `YYMMDD-NNNNNNN` (with hyphen); gender digit: 1/2 (1900s M/F), 3/4 (2000s M/F)
  - System URI: `urn:oid:2.16.840.1.113883.2.1.3.1` (or `http://www.mohw.go.kr/fhir/NamingSystem/rrn`)
  - Note: Use synthetic numbers only — never use real RRN values

### Singapore (`sg`)
- **Patient**: NRIC/FIN — format `SXXXXXXXC` or `TXXXXXXXC` or `FXXXXXXXC` or `GXXXXXXXC`
  - S/T = citizens/permanent residents; F/G = foreigners
  - Format: letter + 7 digits + check letter
  - Check letter computed via weighted sum with specific weights and lookup table
  - System URI: `http://hl7.org.sg/fhir/NamingSystem/nric-fin`

## Address formats

### Japan
- Prefecture (都道府県) + city (市区町村) + district + building
- Postal code: `〒NNN-NNNN` (7 digits) — use numeric format `NNN-NNNN` in FHIR `postalCode`
- Country code: `JP`

### South Korea
- Province/city (시/도) + district (구/군) + road address
- Postal code: 5-digit numeric
- Country code: `KR`

### Singapore
- Street name + building name + unit number
- Postal code: 6-digit numeric (no spaces)
- Country code: `SG`

## Name datasets

- **Japan**: 20+ family names (田中, Tanaka; 鈴木, Suzuki; etc.) in romanised form. Given names
  gender-split. Keep romanised ASCII form in the FHIR `name` array.
- **South Korea**: 20+ family names (Kim, Lee, Park, Choi, Jung…). Given names gender-split.
- **Singapore**: multi-ethnic mix — Chinese (similar to Singapore population: ~75%), Malay (~15%),
  Indian/Tamil (~10%). Use English names to keep it simple and avoid incorrect romanisation.

## Implementation notes

- Start with the simplest viable identifier scheme that is structurally valid for each country
- For Japan: hospital MRN is preferred over My Number (My Number is sensitive; hospital IDs are standard in FHIR JP)
- For South Korea: RRN synthetic generation must ensure the check digit is correct
- For Singapore: NRIC check letter algorithm is well-documented — implement it
- All three locales must produce `country` codes matching ISO 3166-1 alpha-2 (`JP`, `KR`, `SG`)
- Practitioner and Organization locale data is optional for this spec — Patient is the primary target

## Acceptance criteria

```bash
# All three locales must generate valid resources
for locale in jp kr sg; do
  fhir-test-data generate patient --locale $locale --count 5 --seed 42 \
    | fhir-resource-diff validate -
  # Expected: 5 resources: 5 valid, 0 invalid
done

# Check addresses have correct country codes
fhir-test-data generate patient --locale jp --seed 1 --no-pretty \
  | node -e "const r=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); \
    console.assert(r.address[0].country==='JP','wrong country code')"

# Determinism check
fhir-test-data generate patient --locale kr --count 3 --seed 42 --no-pretty > /tmp/kr1.json
fhir-test-data generate patient --locale kr --count 3 --seed 42 --no-pretty > /tmp/kr2.json
diff /tmp/kr1.json /tmp/kr2.json
# Expected: no diff
```

## Do not do

- Do not add Japan Kanji to the FHIR `name` array — romanised ASCII only for simplicity
- Do not implement My Number check digits for Japan (too complex; use hospital MRN)
- Do not add Practitioner/Organization builders for these locales in this spec
- Do not add APAC-specific FHIR IGs or profile URLs — out of scope
