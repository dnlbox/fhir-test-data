---
**Status:** complete
---

# Spec 24 — Expand clinical code pools

## Goal

The current clinical code pools are small and locale-agnostic. Across 20 seeds:
- Condition: 10 unique SNOMED CT codes
- Observation: 12 unique LOINC codes
- AllergyIntolerance: 8 unique SNOMED CT codes
- MedicationStatement: 8 unique SNOMED CT codes (medications)

This is sufficient for basic smoke tests but inadequate for meaningful diversity testing.
More importantly, all locales use the same code pool — there's no locale-aware coding
(e.g. US-specific RxNorm for medications, AU-specific ATCvet or PBS codes, UK SNOMED).

This spec expands the code pools to at least 25 codes per clinical resource and adds
US-specific RxNorm codes for MedicationStatement alongside global SNOMED.

## Dependencies

- Spec 08 (clinical-builders) — complete

## Deliverables

- `src/core/clinical/condition-codes.ts` — expand to ≥25 SNOMED CT condition codes covering
  more disease categories (cardiovascular, respiratory, endocrine, neurological, musculoskeletal,
  infectious, mental health, renal, gastrointestinal, oncology)
- `src/core/clinical/observation-codes.ts` — expand to ≥25 LOINC codes covering vital signs,
  lab panels (CBC, metabolic, lipids), and common diagnostics
- `src/core/clinical/allergy-codes.ts` — expand to ≥20 SNOMED CT allergy/intolerance codes
  (foods, drugs, environmental)
- `src/core/clinical/medication-codes.ts` — expand to ≥25 medications; add RxNorm system
  (`http://www.nlm.nih.gov/research/umls/rxnorm`) as an alternative for `us` locale
- `tests/core/clinical/` — add tests verifying code pool coverage and valid system URIs

## Proposed code additions

### Conditions (SNOMED CT additions beyond existing 10)
Existing covers: COPD, T2DM, ischemic heart, asthma, DM, heart failure, sleep apnea, heart disease, CKD, hypertension

Add: stroke (230690007), depression (35489007), anxiety (197480006), osteoarthritis (396275006),
rheumatoid arthritis (69896004), hypothyroidism (40930008), atrial fibrillation (49436004),
chronic liver disease (109819003), migraine (37796009), Crohn's disease (34000006),
Parkinson's disease (49049000), anemia (271737000), pneumonia (233604007),
urinary tract infection (68566005), obesity (414916001)

### Observations (LOINC additions beyond existing 12)
Existing: diastolic BP, systolic BP, body weight, body height, creatinine, respiratory rate,
heart rate, body temp, hemoglobin, WBC, O2 sat, glucose

Add: sodium (2951-2), potassium (2823-3), calcium (17861-6), albumin (1751-7),
total protein (2885-2), TSH (3016-3), HbA1c (4548-4), total cholesterol (2093-3),
LDL (18262-6), HDL (2085-9), triglycerides (2571-8), ALT (1742-6), AST (1920-8),
bilirubin (1975-2), platelets (777-3), eGFR (62238-1)

### Medications (SNOMED CT + RxNorm for US)
Existing: aspirin, ibuprofen, levothyroxine, atorvastatin, amlodipine, amoxicillin, metformin,
lisinopril

Add SNOMED: omeprazole (372525000), sertraline (372594008), losartan (373567009),
furosemide (387475002), clopidogrel (372768001), pantoprazole (395726003),
albuterol (372694001), prednisone (116601002), gabapentin (386928009)

Add RxNorm (US locale): metoprolol (866419), hydrochlorothiazide (5487),
warfarin (11289), tramadol (41493), cetirizine (203457), azithromycin (18631),
montelukast (41493), rosuvastatin (301542)

## Implementation notes

- RxNorm is US-specific; the `medication-codes.ts` should have a `localeCodeSystem` parameter
  that selects SNOMED for non-US and adds RxNorm as an alternative for `us`
- The `SeededRng` already provides deterministic selection — just expand the arrays
- LOINC panel grouping: vital signs (8xxx, 29xxx) and lab (2xxx, 4xxx, 6xxx, 17xxx) can be
  kept as two sub-pools and selected by the `category` field already present on Observations
- Keep display names correct for all new codes — they will appear in generated data

## Acceptance criteria

```bash
# Condition pool must cover ≥20 unique codes across 30 seeds
for seed in $(seq 1 30); do
  fhir-test-data generate condition --locale us --seed $seed --no-pretty \
    | node -e "const r=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); \
      process.stdout.write(r.code.coding[0].code+'\n')"
done | sort -u | wc -l
# Expected: ≥20

# US locale MedicationStatement should sometimes use RxNorm
fhir-test-data generate medication-statement --locale us --count 20 --seed 1 \
  | node -e "
    const lines=require('fs').readFileSync('/dev/stdin','utf8').trim().split('\n');
    const systems=lines.map(l=>{
      const r=JSON.parse(l);
      return r.medicationCodeableConcept?.coding?.[0]?.system??'unknown';
    });
    const rxnorm=systems.filter(s=>s.includes('rxnorm')).length;
    console.log('RxNorm codes:', rxnorm, '/', systems.length);
  "
# Expected: >0 RxNorm codes

# All generated clinical resources must still validate clean
for resource in observation condition allergy-intolerance medication-statement; do
  fhir-test-data generate $resource --locale us --count 20 --seed 1 \
    | fhir-resource-diff validate -
  # Expected: 20 resources: 20 valid, 0 invalid
done
```

## Do not do

- Do not add ICD-10 codes — out of scope for this spec; would require a new coding-system field
- Do not add locale-specific SNOMED extensions (AU SNOMED, UK SNOMED releases) — global SNOMED only
- Do not change the code system URI for non-US locales — SNOMED remains the default everywhere
- Do not reduce the existing code pool — only expand it
