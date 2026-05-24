---
title: Australia (au)
description: Locale details for Australia — IHI, Medicare, HPI-I, HPI-O identifiers.
sidebar:
  order: 4
---

## Locale code

`au`

## Patient identifiers

### Individual Healthcare Identifier (IHI)

- **System:** `http://ns.electronichealth.net.au/id/hi/ihi/1.0`
- **Format:** 16 digits, prefix `800360`
- **Algorithm:** [Luhn](https://www.servicesaustralia.gov.au/individual-healthcare-identifiers) — 9 random digits are appended to the `800360` prefix, then a Luhn check digit is computed over all 15 digits.

### Medicare Number

- **System:** `http://ns.electronichealth.net.au/id/medicare-number`
- **Format:** 10 digits
- **Algorithm:** Weighted sum (Mod 10) — positions 1–7 are weighted by `[1,3,7,9,1,3,7]`, sum mod 10 gives the check digit at position 8. Positions 9–10 are reference and IRN digits.

## Practitioner identifiers

### Healthcare Provider Identifier — Individual (HPI-I)

- **System:** `http://ns.electronichealth.net.au/id/hi/hpii/1.0`
- **Format:** 16 digits, prefix `800361`
- **Algorithm:** Luhn — same structure as IHI but with prefix `800361`.

## Organisation identifiers

### Healthcare Provider Identifier — Organisation (HPI-O)

- **System:** `http://ns.electronichealth.net.au/id/hi/hpio/1.0`
- **Format:** 16 digits, prefix `800362`
- **Algorithm:** Luhn — same structure as IHI but with prefix `800362`.

## Address format

Australian suburb/state/postcode format. Country code `AU`.

## Name pool

Common Australian given and family names.
