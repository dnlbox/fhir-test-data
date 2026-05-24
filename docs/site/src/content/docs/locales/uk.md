---
title: United Kingdom (uk)
description: Locale details for the United Kingdom — NHS Number, GMC, GMP, ODS identifiers.
sidebar:
  order: 3
---

## Locale code

`uk`

## Patient identifiers

### NHS Number

- **System:** `https://fhir.nhs.uk/Id/nhs-number`
- **Format:** 10 digits
- **Algorithm:** [Modulus 11](https://www.nhs.uk/using-the-nhs/about-the-nhs/what-is-an-nhs-number/) — nine random digits are generated; the tenth is the Modulus 11 check digit. Any nine-digit sequence that would produce a check digit of 10 (invalid in the algorithm) is discarded and regenerated.

## Practitioner identifiers

### GMC Number

- **System:** `https://fhir.hl7.org.uk/Id/gmc-number`
- **Format:** 7 digits
- **Algorithm:** Format validation only.

The GMC Number is the General Medical Council registration number for doctors in the UK. See [GMC — Registration](https://www.gmc-uk.org/registration-and-licensing).

### GMP Number

- **System:** `https://fhir.nhs.uk/Id/gmp-number`
- **Format:** `G` followed by 7 digits (e.g. `G1234567`)
- **Algorithm:** Format validation only.

The GMP Number is the General Medical Practice registration code assigned by NHS England.

## Organisation identifiers

### ODS Code

- **System:** `https://fhir.nhs.uk/Id/ods-organization-code`
- **Format:** One uppercase letter followed by two digits (e.g. `A12`)
- **Algorithm:** Format validation only (`/^[A-Z]{1,3}\d{1,4}[A-Z0-9]?$/`).

The ODS (Organisation Data Service) code is assigned by NHS England to every NHS provider and commissioner. See [NHS Digital — ODS](https://digital.nhs.uk/services/organisation-data-service).

## Address format

UK postcode format. Country code `GB`.

## Name pool

Common UK given and family names.
