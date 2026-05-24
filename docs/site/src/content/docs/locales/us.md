---
title: United States (us)
description: Locale details for the United States — SSN, MRN, NPI identifiers.
sidebar:
  order: 2
---

## Locale code

`us`

## Patient identifiers

### Social Security Number (SSN)

- **System:** `http://hl7.org/fhir/sid/us-ssn`
- **Format:** `NNN-NN-NNNN` (AAA-GG-SSSS)
- **Generation rules:** Area codes are drawn from the 900–999 range, which the Social Security Administration has never assigned to real people. The IRS reserved range 987-65-43XX is excluded. Group and serial numbers are randomised within valid ranges (non-zero).
- **Algorithm:** Format and range validation only (no check digit).

### Medical Record Number (MRN)

- **System:** `http://hospital.example.org/fhir/mrn`
- **Format:** Two uppercase letters followed by six digits (e.g. `AB123456`)
- **Algorithm:** Format validation only.

Note: This MRN system URI is a placeholder. Real deployments use facility-specific NamingSystem URIs.

## Practitioner identifiers

### National Provider Identifier (NPI)

- **System:** `http://hl7.org/fhir/sid/us-npi`
- **Format:** 10 digits
- **Algorithm:** Luhn — the NPI check digit is computed against the string `80840` prepended to the nine-digit base, per the [CMS NPI standard](https://www.cms.gov/Regulations-and-Guidance/Administrative-Simplification/NationalProvIdentStand).

## Organisation identifiers

NPIs are also used for organisations, using the same system URI and algorithm.

## Address format

Standard US format: street number + street name, city, state abbreviation, five-digit ZIP code. Country code `US`.

## Name pool

Common US given and family names.
