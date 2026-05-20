---
title: All Other Locales
description: Identifier details for Canada, Germany, France, Netherlands, India, Japan, South Korea, Singapore, Brazil, Mexico, and South Africa.
sidebar:
  order: 5
---

## Canada (`ca`)

### Patient

| Name | System | Algorithm |
|---|---|---|
| Ontario Health Card Number | `https://fhir.infoway-inforoute.ca/NamingSystem/ca-on-patient-hcn` | Format: 10 digits + 2 uppercase letters |

### Practitioner

| Name | System | Algorithm |
|---|---|---|
| CPSO/Provincial Licence Number | `https://www.cpso.on.ca/` | Format: 5–6 digits |

---

## Germany (`de`)

### Patient

| Name | System | Algorithm |
|---|---|---|
| KVID-10 | `http://fhir.de/sid/gkv/kvid-10` | Format: 1 uppercase letter + 9 digits |

### Practitioner

| Name | System | Algorithm |
|---|---|---|
| Lebenslange Arztnummer (LANR) | `http://fhir.de/sid/kbv/lanr` | Modulus 10 — 6-digit base + check digit + 2-digit specialty suffix |

### Organisation

| Name | System | Algorithm |
|---|---|---|
| Betriebsstättennummer (BSNR) | `http://fhir.de/sid/kbv/bsnr` | Format: 9 digits |
| Institutionskennzeichen (IKNR) | `http://fhir.de/sid/arge-ik/iknr` | Format: 9 digits |

---

## France (`fr`)

### Patient

| Name | System | Algorithm |
|---|---|---|
| NIR (Numéro d'Inscription au Répertoire) | `https://annuaire.sante.fr` | Modulus 97 — 13-digit body + 2-digit key |

The NIR encodes gender (1/2), year, month, department, commune, and order. The 2-digit key is `97 - (body mod 97)`.

### Practitioner

| Name | System | Algorithm |
|---|---|---|
| RPPS Number | `https://annuaire.sante.fr` | Luhn — 10-digit body + 1 check digit |

### Organisation

| Name | System | Algorithm |
|---|---|---|
| FINESS | `https://annuaire.sante.fr/finess` | Format: 2-digit department + 7 digits |

---

## Netherlands (`nl`)

### Patient

| Name | System | Algorithm |
|---|---|---|
| Burgerservicenummer (BSN) | `http://fhir.nl/fhir/NamingSystem/bsn` | 11-proef — weighted position sum must be divisible by 11; last position weight is -1 |

### Practitioner

| Name | System | Algorithm |
|---|---|---|
| UZI Number | `http://fhir.nl/fhir/NamingSystem/uzi-nr-pers` | Format: 6–9 digits |

### Organisation

| Name | System | Algorithm |
|---|---|---|
| AGB-Z Code | `http://fhir.nl/fhir/NamingSystem/agb-z` | Format: 8 digits |

---

## India (`in`)

### Patient

| Name | System | Algorithm |
|---|---|---|
| Aadhaar Number | `https://healthid.ndhm.gov.in/api/v1/auth/aadhaar` | [Verhoeff](https://uidai.gov.in/) — 11 random digits + 1 Verhoeff check digit |
| ABHA Number | `https://healthid.abdm.gov.in/api/v1/abha-number` | Format: `NN-NNNN-NNNN-NNNN` (14 digits) |

The Aadhaar Number is issued by the Unique Identification Authority of India (UIDAI). The Verhoeff algorithm uses a dihedral group D5 multiplication table and provides strong single-digit error detection.

### Practitioner

| Name | System | Algorithm |
|---|---|---|
| NMC Registration Number | `https://www.nmc.org.in/` | Format: 6 digits |

---

## Japan (`jp`)

### Patient

| Name | System | Algorithm |
|---|---|---|
| Japanese Hospital Patient ID | `http://jpfhir.jp/fhir/core/NamingSystem/jp-hospitalPatientId` | Format: 10 digits |

### Practitioner

| Name | System | Algorithm |
|---|---|---|
| JMPC Physician Registration Number | `http://jpfhir.jp/fhir/core/NamingSystem/jp-doctor-license` | Format: 6 digits |

---

## South Korea (`kr`)

### Patient

| Name | System | Algorithm |
|---|---|---|
| Resident Registration Number (RRN) | `http://www.mohw.go.kr/fhir/NamingSystem/rrn` | Weighted sum mod 11 — encodes birth year and gender |

The RRN format is `YYMMDD-GSSSSSC`. The gender digit encodes century (1900s vs 2000s) and sex. When the patient builder supplies demographic context (birth year, gender), the RRN is kept internally consistent with those values.

### Practitioner

| Name | System | Algorithm |
|---|---|---|
| Medical Licence Number (보건복지부) | `http://www.mohw.go.kr/fhir/NamingSystem/doctor-license` | Format: 5 digits |

---

## Singapore (`sg`)

### Patient

| Name | System | Algorithm |
|---|---|---|
| NRIC / FIN | `http://hl7.org.sg/fhir/NamingSystem/nric-fin` | NRIC check letter — prefix (S/T/F/G) + 7 digits + check letter |

Prefixes: `S` and `T` for Singapore citizens and PRs; `F` and `G` for foreign residents.

### Practitioner

| Name | System | Algorithm |
|---|---|---|
| Singapore Medical Council Registration | `http://www.smc.gov.sg/fhir/NamingSystem/smcr` | Format: `M` + 5 digits |

---

## Brazil (`br`)

### Patient

| Name | System | Algorithm |
|---|---|---|
| CPF (Cadastro de Pessoas Físicas) | `http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf` | Modulus 11 two-digit check — formatted as `NNN.NNN.NNN-NN` |

All-same-digit sequences (e.g. `111.111.111-11`) are rejected and regenerated.

### Practitioner

| Name | System | Algorithm |
|---|---|---|
| CRM (Conselho Regional de Medicina) | `https://www.cfm.org.br/fhir/NamingSystem/crm` | Format: `{state}-{5 digits}` (e.g. `SP-12345`) |

---

## Mexico (`mx`)

### Patient

| Name | System | Algorithm |
|---|---|---|
| CURP (Clave Única de Registro de Población) | `http://www.salud.gob.mx/fhir/NamingSystem/curp` | Position-weighted check digit — 18-character alphanumeric |

The CURP encodes initials, date of birth, gender, and state of registration.

### Practitioner

| Name | System | Algorithm |
|---|---|---|
| Cédula Profesional | `http://www.sep.gob.mx/fhir/NamingSystem/cedula` | Format: 7 digits |

---

## South Africa (`za`)

### Patient

| Name | System | Algorithm |
|---|---|---|
| South African ID Number | `http://www.rsaidentity.co.za/fhir/NamingSystem/said` | [Luhn](https://www.gov.za/about-sa/south-african-identity-document) — 13 digits encoding DOB, gender sequence, citizenship, and check digit |

Format: `YYMMDDGSSSCAZ` where G encodes gender (0–4 female, 5–9 male), SSS is a sequence, C is citizenship (0 = SA), A is a legacy race digit (always 8 in generated output), Z is the Luhn check.

### Practitioner

| Name | System | Algorithm |
|---|---|---|
| HPCSA Registration Number | `https://www.hpcsa.co.za/fhir/NamingSystem/hpcsa` | Format: `MP` + 6 digits |
