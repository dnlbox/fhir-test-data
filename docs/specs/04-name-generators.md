# Spec 04 — Name generators

**Status:** complete

## Goal

Implement culturally appropriate name generation for all supported locales. Each locale
provides pools of common first names (male/female) and last names that produce realistic
FHIR HumanName components.

## Dependencies

- Spec 01 (core types) complete — `NamePool`, `RandomFn` types available
- Spec 02 (identifier generators) complete — `createRng`, `pickRandom` utilities available

## Deliverables

| File | Description |
|------|-------------|
| `src/locales/us/names.ts` | US name pools |
| `src/locales/uk/names.ts` | UK name pools |
| `src/locales/au/names.ts` | AU name pools |
| `src/locales/ca/names.ts` | CA name pools (English + French) |
| `src/locales/de/names.ts` | DE name pools |
| `src/locales/fr/names.ts` | FR name pools |
| `src/locales/nl/names.ts` | NL name pools (with surname prefixes) |
| `src/locales/in/names.ts` | IN name pools |
| `src/core/generators/names.ts` | Name generation function using locale data |
| `tests/generators/names.test.ts` | Tests for name generation |

## Key interfaces / signatures

### Name generator (src/core/generators/names.ts)

```typescript
import type { NamePool, RandomFn } from "../types.js";

export interface GeneratedName {
  family: string;
  given: string[];
  prefix?: string;
  /** Surname prefix for Dutch names (e.g., "van", "de") — stored separately in FHIR */
  familyPrefix?: string;
  /** "male" | "female" — used to select given names */
  gender: "male" | "female";
}

/** Generate a single name using the locale's name pool. */
export function generateName(pool: NamePool, gender: "male" | "female", rng: RandomFn): GeneratedName;
```

## Implementation notes

### Name pool sizes
- **Given names:** 30–40 per gender per locale. Common names, not rare or unusual.
- **Family names:** 40–50 per locale. Common surnames for the country.
- **Prefixes:** Where applicable (NL: "van", "de", "van der", "van den").

### Locale-specific conventions

- **US/UK/AU:** Standard Western name structure. Given + Family.
- **CA:** Bilingual pools. English names for most provinces, French names for QC.
  Include common French given names (Jean, Marie, Pierre, Sophie) and surnames
  (Tremblay, Gagnon, Roy, Bouchard) alongside English pools.
- **DE:** German given names (Hans, Klaus, Petra, Sabine) and surnames (Muller, Schmidt,
  Schneider, Fischer). Umlauts in names (use standard ASCII approximations for FHIR
  compatibility: Mueller, Schroeder — or include both forms).
- **FR:** French given names and surnames. Include accented characters where standard
  (Rene, Francois, Helene — FHIR supports UTF-8).
- **NL:** Dutch given names and surnames. Key distinction: surname prefixes like "van",
  "de", "van der", "van den" are stored separately from the family name in Dutch convention.
  In FHIR, these map to the `_family` extension `http://hl7.org/fhir/StructureDefinition/humanname-own-prefix`
  or are prepended to `family`. For v1, include them in `family` with a note.
- **IN:** Indian given names and surnames. Include names from major language groups
  (Hindi, Tamil, Telugu, Bengali, Marathi). Common surnames: Sharma, Patel, Singh, Kumar,
  Reddy, Nair, Iyer, Das, Gupta, Joshi.

### Gender handling
The `gender` parameter selects from male or female given name pools. The builder (spec 05)
will randomly assign genders unless overridden. FHIR Patient.gender uses
`"male" | "female" | "other" | "unknown"` — for name generation purposes, we only need
male/female pools.

### Obviously synthetic
Names should be common and realistic-sounding but the combination of name + identifier +
address makes the overall record obviously synthetic. Do not use celebrity names or names
that could identify a specific individual.

## Acceptance criteria

```bash
pnpm test tests/generators/names.test.ts    # all pass
pnpm typecheck                               # no errors
```

Tests must include:
- Each locale generates names with non-empty `family` and `given`
- NL names include `familyPrefix` for some generated names
- CA generates both English and French names
- Determinism: same seed + same gender produces same name
- Generated names come from the locale's pool (no fabricated strings)

## Do not do

- Do not use external name generation libraries (faker, chance, etc.).
- Do not include names of real public figures, celebrities, or political figures.
- Do not implement name transliteration or script conversion.
- Do not import Node.js APIs.
