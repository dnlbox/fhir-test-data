# Research 03 — FHIR profiles by country

## Overview

FHIR profiles constrain base resource types for country-specific use. A Patient resource
conforming to UK Core has different required fields and extensions than one conforming to
US Core. fhir-fixtures needs to know which profiles exist for each locale so it can
generate resources that conform to the correct profile.

This document catalogs the major country-specific FHIR profiles and implementation guides (IGs)
that fhir-fixtures should be aware of. v1 targets structural conformance (required fields,
identifier systems, value sets) rather than full profile validation.

---

## United States

### US Core (v6.1.0+)

- **Publisher:** HL7 US Realm
- **URL:** `http://hl7.org/fhir/us/core`
- **FHIR version:** R4
- **Key Patient constraints:**
  - `identifier` must include system and value
  - `name` must include `family`
  - `gender` is required
  - US Core Race extension (`http://hl7.org/fhir/us/core/StructureDefinition/us-core-race`)
  - US Core Ethnicity extension (`http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity`)
  - US Core Birth Sex extension
- **Key Practitioner constraints:**
  - NPI identifier required
  - `name.family` required
- **Relevant for:** Any US healthcare application, ONC certification

### C-CDA on FHIR

- **Publisher:** HL7
- **URL:** `http://hl7.org/fhir/us/ccda`
- **Purpose:** Maps C-CDA document sections to FHIR resources
- **Relevance:** Bundle generation for document exchange

---

## United Kingdom

### UK Core (STU2)

- **Publisher:** HL7 UK / NHS Digital
- **URL:** `https://simplifier.net/hl7fhirukcorer4`
- **FHIR version:** R4
- **Key Patient constraints:**
  - NHS Number identifier (system: `https://fhir.nhs.uk/Id/nhs-number`)
  - `extension:NHSNumberVerificationStatus` on the NHS Number identifier
  - `extension:EthnicCategory` (UK-specific value set)
  - `extension:birthPlace` (optional)
- **Key Practitioner constraints:**
  - GMP or GMC number
  - SDS User ID (`https://fhir.nhs.uk/Id/sds-user-id`)
- **Key Organization constraints:**
  - ODS code (`https://fhir.nhs.uk/Id/ods-organization-code`)

### GP Connect

- **Publisher:** NHS Digital
- **URL:** `https://digital.nhs.uk/services/gp-connect`
- **Purpose:** GP system interoperability
- **Relevance:** More constrained profiles on top of UK Core for primary care

---

## Australia

### AU Core (v2.0.0)

- **Publisher:** HL7 Australia
- **URL:** `http://hl7.org.au/fhir/core`
- **FHIR version:** R4
- **Key Patient constraints:**
  - IHI identifier (system: `http://ns.electronichealth.net.au/id/hi/ihi/1.0`)
  - Medicare number (system: `http://ns.electronichealth.net.au/id/medicare-number`)
  - DVA number (optional)
  - `extension:indigenousStatus` (Australian-specific)
- **Key Practitioner constraints:**
  - HPI-I identifier
  - Prescriber number

### AU Base

- **Publisher:** HL7 Australia
- **URL:** `http://hl7.org.au/fhir/base`
- **Purpose:** Base profiles that AU Core further constrains
- **Relevance:** Foundation layer; AU Core is the primary target

### My Health Record

- **Publisher:** Australian Digital Health Agency
- **Purpose:** National digital health record profiles
- **Relevance:** Stricter constraints on AU Base for government health records

---

## Canada

### CA Baseline (v1.2.0)

- **Publisher:** HL7 Canada / Infoway
- **URL:** `http://hl7.org/fhir/ca/baseline`
- **FHIR version:** R4
- **Key Patient constraints:**
  - Provincial HCN identifier (system varies by province)
  - `communication.language` for English/French preference
- **Key Practitioner constraints:**
  - Provincial license number
- **Notes:** Less prescriptive than US Core or UK Core; provinces add their own constraints

### PS-CA (Patient Summary — Canada)

- **Publisher:** Infoway
- **URL:** `http://hl7.org/fhir/ca/ps-ca`
- **Purpose:** Canadian Patient Summary, based on IPS
- **Relevance:** Bundle generation for cross-jurisdiction summaries

---

## Germany

### ISiK (Informationstechnische Systeme im Krankenhaus)

- **Publisher:** gematik
- **URL:** `https://simplifier.net/isik`
- **FHIR version:** R4
- **Key Patient constraints:**
  - KVID-10 identifier (GKV insurance number)
  - Patient name with `family` and `given`
  - `birthDate` required
- **Relevance:** Mandatory for German hospital information systems since 2024

### de-basis (German base profiles)

- **Publisher:** HL7 Germany
- **URL:** `http://fhir.de/StructureDefinition`
- **FHIR version:** R4
- **Key Patient constraints:**
  - Identifier profiles for GKV (statutory) and PKV (private) insurance numbers
  - German address extensions (Stadtteil, Postfach)
- **Key Practitioner constraints:**
  - LANR (Lebenslange Arztnummer)
  - EFN (Einheitliche Fortbildungsnummer)
- **Key Organization constraints:**
  - IKNR (Institutionskennzeichen)
  - BSNR (Betriebsstattenummer)

---

## France

### FR Core

- **Publisher:** Interop'Sante / ANS (Agence du Numerique en Sante)
- **URL:** `https://hl7.fr/ig/fhir/core`
- **FHIR version:** R4
- **Key Patient constraints:**
  - INS (Identite Nationale de Sante) — qualified identity
  - NIR identifier (Numero d'Inscription au Repertoire)
  - `birthPlace` extension
- **Key Practitioner constraints:**
  - RPPS number (Repertoire Partage des Professionnels de Sante)
  - ADELI number
- **Key Organization constraints:**
  - FINESS number (Fichier National des Etablissements Sanitaires et Sociaux)

---

## Netherlands

### nictiz nl-core

- **Publisher:** Nictiz
- **URL:** `http://nictiz.nl/fhir`
- **FHIR version:** R4
- **Key Patient constraints:**
  - BSN identifier (system: `http://fhir.nl/fhir/NamingSystem/bsn`)
  - Dutch name conventions (voorvoegsel/prefix for surnames like "van", "de", "van der")
- **Key Practitioner constraints:**
  - UZI number
  - AGB code
  - BIG registration
- **Key Organization constraints:**
  - AGB code
  - URA (UZI Register Abonneenummer)

### zibs (Zorginformatiebouwstenen)

- **Publisher:** Nictiz
- **Purpose:** Clinical building blocks (health information standards)
- **Relevance:** zibs define the clinical model; nl-core profiles implement them in FHIR

---

## India

### ABDM FHIR IG (v6.5)

- **Publisher:** National Resource Centre for EHR Standards (NRCeS) / National Health Authority
- **URL:** `https://nrces.in/ndhm/fhir/r4`
- **FHIR version:** R4
- **Key Patient constraints:**
  - ABHA number (Ayushman Bharat Health Account)
  - Aadhaar number (optional, privacy considerations)
  - `address` with district and state
- **Key Practitioner constraints:**
  - Medical Council registration number
  - HPR (Health Professional Registry) ID
- **Key Organization constraints:**
  - HFR (Health Facility Registry) ID
- **Notes:** Rapidly evolving; the ABDM ecosystem is being built out nationally

---

## International

### IPS (International Patient Summary)

- **Publisher:** HL7 International
- **URL:** `http://hl7.org/fhir/uv/ips`
- **FHIR version:** R4
- **Purpose:** Cross-border patient summary document
- **Key constraints:**
  - Composition-based Bundle
  - Required sections: allergies, medications, conditions
  - CodeableConcept bindings to IPS value sets
- **Relevance:** Bundle generation for cross-border scenarios; useful as a "default" profile
  when no country-specific profile is specified

---

## Profile support strategy for fhir-fixtures

### v1 scope

In v1, fhir-fixtures generates resources that are **structurally conformant** to the
major country profiles. This means:

1. **Correct identifier systems** — the right `system` URI and valid identifier values
2. **Required fields present** — fields marked as 1..1 or 1..* in the profile
3. **Valid value set bindings** — gender, status, and other coded fields use values from
   the correct value set
4. **Country-appropriate extensions** — include the most common required extensions
   (e.g., US Core Race for US, NHSNumberVerificationStatus for UK)

### What v1 does NOT do

- Full profile validation (use a FHIR validator for that)
- Support for every extension in every profile
- Slicing validation
- Terminology server lookups for value set expansion
- CapabilityStatement-driven generation

### Future profile flag

The `--profile` flag is reserved for future use:
```
fhir-fixtures generate patient --locale uk --profile uk-core
```

In v1, the locale alone determines which identifier systems and address formats to use.
Profile-specific constraints (required extensions, slicing, additional must-support fields)
are a Phase 2 concern.
