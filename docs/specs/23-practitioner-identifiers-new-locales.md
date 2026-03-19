---
**Status:** complete
---

# Spec 23 — Practitioner identifiers for new locales

## Goal

Practitioners generated for the six new locales (jp, kr, sg, br, mx, za) — and also for
existing locales ca and in — produce an empty `identifier: []` array. This is structurally
valid FHIR but makes generated practitioners indistinguishable and unrealistic.

Each locale should emit a practitioner with at least one identifier using a real or
widely-recognised national practitioner registry system.

## Dependencies

- Spec 06 (practitioner-builder) — complete
- Spec 19 (apac-locales) — complete
- Spec 20 (south-america-africa-locales) — complete

## Deliverables

- `src/locales/{jp,kr,sg,br,mx,za,ca,in}/index.ts` (or `identifiers.ts`) — add practitioner
  identifier generation for each locale
- `tests/locales/` — add tests confirming practitioner identifiers are present and structurally valid
- `README.md` — update locale support table to note practitioner identifier coverage

## Identifier schemes by locale

| Locale | Scheme | System URI | Format |
|--------|--------|-----------|--------|
| `ca` | CPSO/provincial license number | `https://www.cpso.on.ca/` (ON) | 5–6 digit numeric |
| `in` | NMC registration number | `https://www.nmc.org.in/` | 6-digit numeric |
| `jp` | JMPC physician registration | `http://jpfhir.jp/fhir/core/NamingSystem/jp-doctor-license` | 6-digit numeric |
| `kr` | Medical Licence Number (보건복지부) | `http://www.mohw.go.kr/fhir/NamingSystem/doctor-license` | 5-digit numeric |
| `sg` | Singapore Medical Council reg. | `http://www.smc.gov.sg/fhir/NamingSystem/smcr` | 5-char alphanumeric (e.g. M12345) |
| `br` | CRM (Conselho Regional de Medicina) | `https://www.cfm.org.br/fhir/NamingSystem/crm` | State prefix + 5-digit (e.g. SP-12345) |
| `mx` | CEDULA PROFESIONAL | `http://www.sep.gob.mx/fhir/NamingSystem/cedula` | 7-digit numeric |
| `za` | HPCSA registration number | `https://www.hpcsa.co.za/fhir/NamingSystem/hpcsa` | `MP` + 6-digit (e.g. MP012345) |

## Implementation notes

- All identifier values are synthetic — seeded random numbers in the correct format
- No check digit validation is required for practitioner IDs in this spec — structural format only
- The systems use plausible URIs that follow the pattern of existing locale systems; they do not
  need to resolve to live endpoints
- Qualification codes should remain unchanged — only add/update the `identifier` field
- For `ca`, add an Ontario CPSO number as default (most common province in existing data)
- For `in`, the NMC registration number is 6 digits, no check digit

## Acceptance criteria

```bash
# All 8 locales must now produce practitioners with at least one identifier
for locale in ca in jp kr sg br mx za; do
  id_sys=$(fhir-test-data generate practitioner --locale $locale --seed 1 --no-pretty \
    | node -e "const r=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); \
      const id=r.identifier?.[0]; \
      console.log(id?'present:'+id.system:'MISSING')")
  echo "$locale: $id_sys"
  # Expected: present:http://...
done

# Practitioners must still validate clean
for locale in jp kr sg br mx za; do
  fhir-test-data generate practitioner --locale $locale --count 3 --seed 42 \
    | fhir-resource-diff validate -
  # Expected: N resources: N valid, 0 invalid
done

# generate all must still validate clean (PractitionerRole references practitioner)
for locale in jp br za; do
  fhir-test-data generate all --locale $locale --seed 42 \
    | fhir-resource-diff validate -
  # Expected: 9 resources: 9 valid, 0 invalid
done
```

## Do not do

- Do not add Practitioner identifiers for us, uk, au, de, fr, nl — those already have them
- Do not implement check digit validation for practitioner IDs — patient IDs have it; practitioners don't need it
- Do not add Organization identifiers for new locales — separate concern
