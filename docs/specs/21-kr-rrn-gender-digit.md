---
**Status:** complete
---

# Spec 21 — Fix Korea RRN gender digit consistency

## Goal

The South Korea RRN (주민등록번호) gender digit (7th character of the 13-digit number, position
index 6) must be consistent with `Patient.gender`. Current test data generates females with
gender digit `1` (male 1900s), making the identifier internally inconsistent.

RRN gender digit rules:
- `1` → male born 1900–1999
- `2` → female born 1900–1999
- `3` → male born 2000–2099
- `4` → female born 2000–2099

All seeds tested (1–6) produce `gdigit=1` for female patients — clearly the gender digit is
not being derived from `Patient.gender` and birth year.

## Dependencies

- Spec 19 (apac-locales) — complete

## Deliverables

- `src/locales/kr/index.ts` (or `identifiers.ts`) — fix RRN generator to derive gender digit
  from `Patient.gender` and birth year
- `tests/locales/kr/` — add gender-consistency tests for males and females across both centuries

## Key interfaces / signatures

The RRN generator receives the patient's gender and birth date (or year) from the builder:

```typescript
function generateKrRrn(
  gender: 'male' | 'female' | 'other' | 'unknown',
  birthYear: number,
  rng: SeededRng
): string {
  const century = birthYear >= 2000 ? 'new' : 'old';
  const genderDigit =
    gender === 'female' && century === 'old' ? 2 :
    gender === 'male'   && century === 'old' ? 1 :
    gender === 'female' && century === 'new' ? 4 :
    gender === 'male'   && century === 'new' ? 3 :
    1; // fallback for 'other'/'unknown' — use 1 (male 1900s) as neutral default

  const dob = formatRrnDob(birthYear, ...); // YYMMDD
  const sequence = rng.intBetween(1000000, 9999999); // 7-digit second part before check
  const raw = dob + String(genderDigit) + String(sequence).slice(1, 6);
  const checkDigit = computeRrnCheckDigit(raw);

  return `${dob}-${genderDigit}${String(sequence).slice(1, 6)}${checkDigit}`;
}
```

The check digit algorithm: weighted sum of all 12 digits × weights `[2,3,4,5,6,7,8,9,2,3,4,5]`,
remainder mod 11, then `(11 - remainder) mod 10`.

## Implementation notes

- The RRN is formatted as `YYMMDD-GSSSSSC` where G=gender digit, S=sequence, C=check digit
- For `other`/`unknown` gender, use `1` as a neutral default — this is test data, not real IDs
- Birth year 2000+ is rare in the existing test data but must be handled if the patient's
  `birthDate` is post-2000
- Re-verify the check digit algorithm — the current implementation may not be computing it
  correctly either (the test data hasn't been validated against the Korean RRN spec)

## Acceptance criteria

```bash
# All 8 seeds must have consistent gender digits
for seed in 1 2 3 4 5 6 7 8; do
  fhir-test-data generate patient --locale kr --seed $seed --no-pretty | \
    node -e "
      const r=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
      const rrn=r.identifier[0].value;
      const gdigit=parseInt(rrn.split('-')[1][0]);
      const isMale   = gdigit===1||gdigit===3;
      const isFemale = gdigit===2||gdigit===4;
      const ok = (r.gender==='male'&&isMale) || (r.gender==='female'&&isFemale) || (r.gender==='other');
      process.exitCode = ok ? 0 : 1;
      console.log('seed=$seed rrn='+rrn+' gender='+r.gender+' digit='+gdigit, ok?'OK':'FAIL');
    " 2>&1 | sed "s/seed=\\\$seed/seed=$seed/"
done

# Round-trip: KR resources must validate clean
fhir-test-data generate patient --locale kr --count 10 --seed 42 \
  | fhir-resource-diff validate -
# Expected: 10 resources: 10 valid, 0 invalid
```

## Do not do

- Do not change the RRN format structure (YYMMDD-NNNNNNN)
- Do not use real RRN values — all identifiers are synthetic
- Do not implement My Number or other Korean IDs in this spec
