---
title: Locales Overview
description: All supported locales with their identifier types, check-digit algorithms, and FHIR system URIs.
sidebar:
  order: 1
---

The `--locale` flag controls three things for every generated resource:

1. Which **identifier systems** are used (e.g. NHS Number, Aadhaar, BSN)
2. Which **address format** is applied (street order, postal code pattern, country code)
3. Which **name pool** is drawn from (culturally appropriate given and family names)

All identifier values pass their country's validation algorithm before being included in output. The `fhir-test-data locales` command returns the same data programmatically.

## Locale table

| Code | Country | Patient identifiers | Practitioner identifiers | Organisation identifiers |
|---|---|---|---|---|
| `us` | United States | SSN, MRN | NPI (Luhn) | NPI (Luhn) |
| `uk` | United Kingdom | NHS Number (Mod 11) | GMC Number, GMP Number | ODS Code |
| `au` | Australia | IHI (Luhn), Medicare Number (Mod 10) | HPI-I (Luhn) | HPI-O (Luhn) |
| `ca` | Canada | Ontario Health Card Number | CPSO/Provincial Licence | — |
| `de` | Germany | KVID-10 | LANR (Mod 10) | BSNR, IKNR |
| `fr` | France | NIR (Mod 97) | RPPS (Luhn) | FINESS |
| `nl` | Netherlands | BSN (11-proef) | UZI Number | AGB-Z Code |
| `in` | India | Aadhaar (Verhoeff), ABHA Number | NMC Registration | — |
| `jp` | Japan | Japanese Hospital Patient ID | JMPC Physician Registration | — |
| `kr` | South Korea | RRN (weighted sum mod 11) | Medical Licence Number | — |
| `sg` | Singapore | NRIC / FIN (NRIC check letter) | SMC Registration | — |
| `br` | Brazil | CPF (Mod 11 two-digit check) | CRM | — |
| `mx` | Mexico | CURP | Cédula Profesional | — |
| `za` | South Africa | SA ID Number (Luhn) | HPCSA Registration | — |

## FHIR system URIs

Each identifier definition includes a `system` URI. These are the URIs embedded in FHIR `Identifier.system` fields in generated resources. See individual locale pages for the full list.

## Check-digit algorithms

Algorithms used across locales:

| Algorithm | Used for |
|---|---|
| Luhn | US NPI, AU IHI, AU HPI-I, AU HPI-O, FR RPPS, ZA ID Number |
| Modulus 11 | UK NHS Number |
| Verhoeff | IN Aadhaar |
| 11-proef (Modulus 11 variant) | NL BSN |
| Modulus 97 | FR NIR |
| Modulus 10 | AU Medicare Number, DE LANR |
| RRN weighted sum mod 11 | KR Resident Registration Number |
| NRIC check letter | SG NRIC / FIN |
| CPF two-digit check | BR CPF |

Check-digit implementations live in `src/core/generators/check-digits.ts`. They are shared across locales and are tested against known-valid examples.
