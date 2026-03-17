# Spec 09 — Bundle builder

**Status:** open

## Goal

Implement a Bundle builder that composes multiple resource builders and generates Bundles
with internally consistent references. This is the highest-level builder — it orchestrates
Patient, Practitioner, Organization, and clinical resource builders.

## Dependencies

- Spec 05 (patient builder) complete
- Spec 06 (practitioner builder) complete
- Spec 07 (organization builder) complete
- Spec 08 (clinical builders) complete

## Deliverables

| File | Description |
|------|-------------|
| `src/core/builders/bundle.ts` | Bundle builder implementation |
| `tests/builders/bundle.test.ts` | Bundle builder tests |

## Key interfaces / signatures

### Bundle builder

```typescript
export type BundleType = "transaction" | "document" | "collection" | "searchset";

export interface BundleBuilder {
  locale(locale: Locale): BundleBuilder;
  count(count: number): BundleBuilder;
  seed(seed: number): BundleBuilder;
  type(bundleType: BundleType): BundleBuilder;
  /** Number of clinical resources per patient. Default: 3–5 (random). */
  clinicalResourcesPerPatient(count: number): BundleBuilder;
  overrides(overrides: Record<string, unknown>): BundleBuilder;
  build(): FhirResource[];
}

export function createBundleBuilder(): BundleBuilder;
```

## Implementation notes

### Bundle structure

```typescript
{
  resourceType: "Bundle",
  id: "<uuid>",
  type: "transaction",
  entry: [
    {
      fullUrl: "urn:uuid:<patient-uuid>",
      resource: { /* Patient */ },
      request: {   // only for transaction bundles
        method: "POST",
        url: "Patient"
      }
    },
    {
      fullUrl: "urn:uuid:<org-uuid>",
      resource: { /* Organization */ },
      request: { method: "POST", url: "Organization" }
    },
    {
      fullUrl: "urn:uuid:<practitioner-uuid>",
      resource: { /* Practitioner */ },
      request: { method: "POST", url: "Practitioner" }
    },
    {
      fullUrl: "urn:uuid:<observation-uuid>",
      resource: {
        resourceType: "Observation",
        subject: { reference: "urn:uuid:<patient-uuid>" },
        performer: [{ reference: "urn:uuid:<practitioner-uuid>" }],
        /* ... */
      },
      request: { method: "POST", url: "Observation" }
    }
  ]
}
```

### Reference wiring

The key value of the Bundle builder is automatic reference wiring:

1. Generate a Patient (with a known UUID).
2. Generate an Organization (with a known UUID). Set the Patient's
   `managingOrganization.reference` to `urn:uuid:<org-uuid>`.
3. Generate a Practitioner (with a known UUID).
4. Generate clinical resources (Observations, Conditions, etc.) with:
   - `subject.reference` → `urn:uuid:<patient-uuid>`
   - `performer[0].reference` or `recorder.reference` → `urn:uuid:<practitioner-uuid>`
5. All `fullUrl` values use `urn:uuid:<resource-uuid>`.
6. Internal references use matching `urn:uuid:` values.

### Bundle types

- **transaction:** Each entry has a `request` with `method` and `url`. This is the most
  common type for loading test data into a FHIR server.
- **collection:** Entries have no `request`. Just a grouping of resources.
- **document:** First entry must be a Composition resource. Out of scope for v1 —
  accept the type but generate a collection-style bundle with a note.
- **searchset:** Entries have a `search.mode` of "match". Used for simulating search results.

### Default composition per bundle

Each bundle contains:
- 1 Patient
- 1 Organization
- 1 Practitioner
- N clinical resources (default 3–5, configurable)

The `count` parameter controls how many bundles to generate, not how many resources per bundle.

### Clinical resource mix

When generating clinical resources for a bundle, randomly distribute across types:
- 1–2 Observations (vital signs or labs)
- 0–1 Conditions
- 0–1 AllergyIntolerances
- 0–1 MedicationStatements

Use the PRNG for deterministic distribution.

## Acceptance criteria

```bash
pnpm test tests/builders/bundle.test.ts    # all pass
pnpm typecheck                              # no errors
```

Tests must include:
- Generate a transaction bundle — all entries have `request` with method and url
- Generate a collection bundle — no `request` on entries
- Internal references are consistent — every reference points to a `fullUrl` that exists
- Patient has `managingOrganization` reference to the Organization
- Observations have `subject` reference to the Patient
- Bundle `type` field matches the requested type
- Determinism: same seed produces same bundle
- Count parameter generates the correct number of bundles

## Do not do

- Do not implement Composition-based document bundles in v1.
- Do not implement pagination for searchset bundles.
- Do not add more than one Patient per bundle in v1.
- Do not import Node.js APIs.
