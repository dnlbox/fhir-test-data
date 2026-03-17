# Research 02 — Address formats by country

## Overview

FHIR addresses use the `Address` data type with fields: `line[]`, `city`, `district`,
`state`, `postalCode`, `country`, and `use`/`type`. Each country populates these fields
differently. fhir-fixtures must generate addresses that look realistic for each locale
and conform to the expected patterns that FHIR profile validators check.

All addresses must be obviously synthetic — real street names paired with fictional
numbers, or fictional street names entirely.

---

## United States

### Format
- **Postal code:** 5 digits, optionally `+4` (e.g., `90210`, `90210-1234`)
- **State:** 2-letter abbreviation from USPS list (e.g., `CA`, `NY`, `TX`)
- **Address lines:** Number + Street name + Type (e.g., `123 Oak Street`)
- **City:** City name (no county in typical FHIR usage)

### FHIR mapping
```
line[0]: "123 Oak Street"
line[1]: "Apt 4B"  (optional)
city: "Springfield"
state: "IL"
postalCode: "62701"
country: "US"
```

### Generation notes
- ZIP codes should be plausible 5-digit numbers (not 00000 or 99999)
- Use common US city/state combinations for realism
- 50 states + DC + territories (PR, GU, VI, AS, MP)

---

## United Kingdom

### Format
- **Postal code:** Outward code (2–4 chars) + space + inward code (3 chars)
  - Patterns: `A9 9AA`, `A9A 9AA`, `A99 9AA`, `AA9 9AA`, `AA9A 9AA`, `AA99 9AA`
- **No state/province field** in typical UK addresses
- **County:** Optional, increasingly deprecated in Royal Mail usage
- **City:** Town or city name

### FHIR mapping
```
line[0]: "42 Baker Street"
city: "London"
district: "Greater London"  (optional, used for county)
postalCode: "NW1 6XE"
country: "GB"
```

### Generation notes
- Use `country: "GB"` (ISO 3166-1 alpha-2) not `"UK"`
- Postcode validation: first letter must be from `{A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z}`
  but not all combinations are valid areas. For synthetic data, generate structurally valid
  postcodes without checking against the Royal Mail PAF
- No `state` field — UK addresses do not use it
- `district` can hold the county (e.g., "Greater London", "West Yorkshire")

---

## Australia

### Format
- **Postal code:** 4 digits (e.g., `2000` for Sydney CBD)
- **State:** Standard abbreviations: `NSW`, `VIC`, `QLD`, `WA`, `SA`, `TAS`, `ACT`, `NT`
- **Address lines:** Number + Street name + Type (e.g., `10 George Street`)
- **City:** Suburb/locality name

### FHIR mapping
```
line[0]: "10 George Street"
city: "Sydney"
state: "NSW"
postalCode: "2000"
country: "AU"
```

### Generation notes
- Postcode ranges by state: NSW 2000–2999, VIC 3000–3999, QLD 4000–4999,
  SA 5000–5999, WA 6000–6999, TAS 7000–7999, NT 0800–0999, ACT 2600–2639
- Use state/postcode combinations that are consistent
- Street types: Street, Road, Avenue, Drive, Place, Crescent, Court, Lane

---

## India

### Format
- **PIN code:** 6 digits (e.g., `110001` for New Delhi)
- **State:** Full state name (e.g., "Maharashtra", "Karnataka", "Delhi")
- **District:** Used extensively in Indian addresses
- **City:** City/town name

### FHIR mapping
```
line[0]: "42 MG Road"
line[1]: "Near City Mall"  (landmark-based addressing is common)
city: "Bengaluru"
district: "Bangalore Urban"
state: "Karnataka"
postalCode: "560001"
country: "IN"
```

### Generation notes
- PIN code first digit indicates region: 1 = Delhi/Haryana/Punjab, 2 = UP/Uttarakhand,
  3 = Rajasthan/Gujarat, 4 = Maharashtra/Goa, 5 = AP/Telangana/Karnataka,
  6 = Kerala/TN, 7 = West Bengal/NE states, 8 = Bihar/Jharkhand
- Indian addresses often include landmarks ("Near...", "Opposite...")
- Use anglicized city names (Bengaluru, Mumbai, Chennai, Kolkata)
- 28 states + 8 union territories

---

## Germany

### Format
- **Postal code (PLZ):** 5 digits (e.g., `10117` for Berlin Mitte)
- **State (Bundesland):** Optional in address, but useful for FHIR
  - 16 states: Baden-Wurttemberg, Bayern, Berlin, Brandenburg, Bremen, Hamburg,
    Hessen, Mecklenburg-Vorpommern, Niedersachsen, Nordrhein-Westfalen,
    Rheinland-Pfalz, Saarland, Sachsen, Sachsen-Anhalt, Schleswig-Holstein, Thuringen
- **Address lines:** Street name + Number (note: number comes AFTER street in German)
- **City:** City name

### FHIR mapping
```
line[0]: "Friedrichstrasse 42"
city: "Berlin"
state: "Berlin"
postalCode: "10117"
country: "DE"
```

### Generation notes
- Street name + number order (opposite of English convention)
- Common street suffixes: -strasse, -weg, -platz, -allee, -ring, -gasse
- PLZ ranges roughly correspond to regions (0xxxx = Sachsen/Thuringen/Sachsen-Anhalt,
  1xxxx = Berlin/Brandenburg, 2xxxx = Hamburg/SH/MV/Bremen, etc.)

---

## France

### Format
- **Postal code (code postal):** 5 digits (e.g., `75001` for Paris 1er)
- **Department:** Implied by first 2 digits of postal code (75 = Paris, 13 = Bouches-du-Rhone)
- **No state field** in typical French addresses
- **Address lines:** Number + Street name (e.g., `15 Rue de Rivoli`)

### FHIR mapping
```
line[0]: "15 Rue de Rivoli"
city: "Paris"
postalCode: "75001"
country: "FR"
```

### Generation notes
- Street type prefixes: Rue, Avenue, Boulevard, Place, Impasse, Passage, Allee, Chemin
- Arrondissement for Paris: 75001–75020
- DOM-TOM postal codes: 97xxx (Guadeloupe 971xx, Martinique 972xx, Guyane 973xx,
  Reunion 974xx, Mayotte 976xx)
- City names in French (no translation)

---

## Netherlands

### Format
- **Postal code:** 4 digits + space + 2 uppercase letters (e.g., `1012 AB`)
- **Province:** Optional, 12 provinces
- **Address lines:** Street name + Number (+ suffix) (e.g., `Keizersgracht 123-H`)

### FHIR mapping
```
line[0]: "Keizersgracht 123"
city: "Amsterdam"
state: "Noord-Holland"
postalCode: "1012 AB"
country: "NL"
```

### Generation notes
- Postal code format: `NNNN LL` where N is digit, L is uppercase letter
- Letters SA, SD, and SS are not used (historical association reasons)
- Common street names: -straat, -gracht, -weg, -laan, -plein, -kade
- Street name + number order (number after street, like German)
- Suffix letters common in Amsterdam (e.g., `-H` for huis, `-I`, `-II` for floor)

---

## Canada

### Format
- **Postal code:** `A1A 1A1` pattern (letter-digit-letter space digit-letter-digit)
- **Province/Territory:** 2-letter codes
  - Provinces: AB, BC, MB, NB, NL, NS, ON, PE, QC, SK
  - Territories: NT, NU, YT
- **Address lines:** Number + Street name (e.g., `123 Maple Street`)
- **Bilingual:** English and French are both official languages

### FHIR mapping
```
line[0]: "123 Maple Street"
city: "Toronto"
state: "ON"
postalCode: "M5V 2T6"
country: "CA"
```

### Generation notes
- First letter of postal code indicates province/region:
  A = NL, B = NS, C = PE, E = NB, G/H/J = QC, K/L/M/N/P = ON,
  R = MB, S = SK, T = AB, V = BC, X = NT/NU, Y = YT
- Letters D, F, I, O, Q, U are NEVER used in Canadian postal codes
- W and Z are never used as the first letter
- For Quebec locale: generate French street names (Rue, Avenue, Boulevard)
- For other provinces: generate English street names
- Some cities are bilingual (Ottawa, Montreal/Montreal)

---

## Address generation strategy

For each locale, the generator needs:

1. **Street name pool** — 20–30 common street names per locale
2. **Street type pool** — common suffixes/prefixes per locale
3. **City pool** — 10–15 major cities per locale with matching state/province/postcode ranges
4. **Postal code generator** — format-aware random generation
5. **State/province list** — complete valid values

All data should be stored in `src/locales/{country-code}/addresses.ts` as plain TypeScript
objects. No external data files, no runtime loading.

### Realism vs. safety

Generated addresses should be **structurally realistic** (valid postal code format, matching
city/state combinations) but **obviously synthetic** (fictional street numbers, no attempt
to generate real existing addresses). The goal is that a validator accepts the format, but
no one mistakes the data for real patient information.
