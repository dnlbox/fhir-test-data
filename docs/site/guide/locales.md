# Locales

`fhir-test-data` supports 14 locale codes. Each locale provides country-specific name
pools, address formats, and identifier systems with check-digit validation.

## Supported locales

| Country | Code | Patient identifiers | Algorithm | Practitioner identifiers |
|---------|------|--------------------|-----------|-----------------------|
| United States | `us` | SSN, MRN | Format validation | NPI (Luhn) |
| United Kingdom | `uk` | NHS Number | Modulus 11 | GMC Number, GMP Number |
| Australia | `au` | IHI, Medicare | Luhn | HPI-I (Luhn) |
| Canada | `ca` | Ontario HCN | Format validation | — |
| Germany | `de` | KVID-10 | Format validation | LANR (Modulus 10) |
| France | `fr` | NIR | Modulus 97 | RPPS (Luhn) |
| Netherlands | `nl` | BSN | 11-proef | UZI Number |
| India | `in` | Aadhaar, ABHA | Verhoeff | — |
| Japan | `jp` | — | — | — |
| South Korea | `kr` | RRN (gender-aware) | — | — |
| Singapore | `sg` | — | — | — |
| Brazil | `br` | — | — | — |
| Mexico | `mx` | — | — | — |
| South Africa | `za` | — | — | — |

## Selecting a locale

All builders accept a `.locale(code)` method:

```typescript
import {
  createPatientBuilder,
  createPractitionerBuilder,
  createOrganizationBuilder,
} from "fhir-test-data";

const [ukPatient] = createPatientBuilder().locale("uk").seed(1).build();
const [nlPatient] = createPatientBuilder().locale("nl").seed(1).build();
const [dePractitioner] = createPractitionerBuilder().locale("de").seed(1).build();
```

The locale affects:
- **Identifier systems** — which identifier types are generated, with which system URLs
- **Name pools** — given names, family names, and title prefixes appropriate to the country
- **Address format** — street patterns, city names, postal code format, and country code
- **Communication language** — the `Patient.communication` entry uses the locale's BCP 47 tag

## Identifier systems

### United Kingdom (`uk`)

**Patient**: NHS Number

The NHS Number is a 10-digit identifier validated with Modulus 11. The check digit (the
last digit) is computed from the first 9 digits with weights 10–2. A result of 10 means
the number is invalid and must be regenerated — this is handled automatically.

```
System: https://fhir.nhs.uk/Id/nhs-number
Format: DDDD DDDDDD (10 digits)
```

**Practitioner**: GMC Number (General Medical Council) or GMP Number (GP contract).

### Australia (`au`)

**Patient**: IHI (Individual Healthcare Identifier) and Medicare number

Both are Luhn-validated. The IHI is a 16-digit number issued by Services Australia.
The Medicare number is 10 digits with a check character.

```
IHI system:      http://ns.electronichealth.net.au/id/hi/ihi/1.0
Medicare system: http://ns.electronichealth.net.au/id/medicare-number
```

**Practitioner**: HPI-I (Healthcare Provider Identifier — Individual), Luhn-validated.

### Netherlands (`nl`)

**Patient**: BSN (Burgerservicenummer)

The BSN is a 9-digit number validated with 11-proef (a Modulus 11 variant). Weights
9, 8, 7, 6, 5, 4, 3, 2, −1 are applied to digits 1–9. The weighted sum must be
divisible by 11.

```
System: http://fhir.nl/fhir/NamingSystem/bsn
Format: DDDDDDDDD (9 digits)
```

**Practitioner**: UZI Number (healthcare professional registry).

### France (`fr`)

**Patient**: NIR (Numéro d'Inscription au Répertoire — social security number)

The NIR is a 15-digit number. The check key is `97 - (first 13 digits mod 97)`, computed
with BigInt to avoid JavaScript floating-point loss.

```
System: http://terminology.hl7.org/NamingSystem/fr-nia
Format: D DDDDDD DDDDDDD DD (15 digits + 2-digit key)
```

**Practitioner**: RPPS (Répertoire Partagé des Professionnels de Santé), Luhn-validated.

### India (`in`)

**Patient**: Aadhaar and ABHA (Ayushman Bharat Health Account)

The Aadhaar number is 12 digits validated with the Verhoeff algorithm — a dihedral group
D5 algorithm that detects all single-digit errors and all adjacent transposition errors.

```
Aadhaar system: https://uidai.gov.in
Format: DDDD DDDD DDDD (12 digits)
```

### Germany (`de`)

**Patient**: KVID-10 (Krankenversichertennummer)

**Practitioner**: LANR (Lebenslange Arztnummer), validated with Modulus 10 on the first
6 digits.

```
LANR system: https://fhir.de/NamingSystem/lanr
Format: DDDDDDDDD (9 digits)
```

### South Korea (`kr`)

**Patient**: RRN (Resident Registration Number)

The RRN is a 13-digit number. The 7th digit encodes gender and century of birth:
1/2 for 1900s, 3/4 for 2000s, 5/6 for foreign nationals born in 1900s/2000s.

## Name and address generation

Each locale includes pools of:
- **Given names** — 30+ names per gender (male, female), drawn from the locale's cultural background
- **Family names** — 40+ surnames appropriate to the country
- **Prefixes** — locale-appropriate professional or courtesy titles

Address generation uses realistic street name patterns, actual city names, and correctly
formatted postal codes for each country.

All names and addresses are drawn deterministically from the seed — the same seed always
produces the same name for the same locale.
