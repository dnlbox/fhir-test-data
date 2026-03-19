import { describe, it, expect } from "vitest";
import { createBundleBuilder } from "@/core/builders/bundle.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Entry = Record<string, unknown>;

function entries(bundle: Record<string, unknown>): Entry[] {
  return bundle["entry"] as Entry[];
}

function entryResource(entry: Entry): Record<string, unknown> {
  return entry["resource"] as Record<string, unknown>;
}

function findResourceByType(bundle: Record<string, unknown>, type: string): Record<string, unknown> | undefined {
  return entries(bundle)
    .map(entryResource)
    .find((r) => r["resourceType"] === type);
}

function allResourcesByType(bundle: Record<string, unknown>, type: string): Record<string, unknown>[] {
  return entries(bundle).map(entryResource).filter((r) => r["resourceType"] === type);
}

function allFullUrls(bundle: Record<string, unknown>): string[] {
  return entries(bundle).map((e) => e["fullUrl"] as string);
}

// ---------------------------------------------------------------------------
// Structure
// ---------------------------------------------------------------------------

describe("Bundle structure", () => {
  it("has required top-level fields", () => {
    const [b] = createBundleBuilder().seed(1).build();
    expect(b).toBeDefined();
    if (!b) return;

    expect(b["resourceType"]).toBe("Bundle");
    expect(typeof b["id"]).toBe("string");
    expect(typeof b["type"]).toBe("string");
    expect(Array.isArray(b["entry"])).toBe(true);
  });

  it("id is UUID v4 format", () => {
    const [b] = createBundleBuilder().seed(2).build();
    const uuid = b?.["id"] as string;
    expect(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(uuid),
    ).toBe(true);
  });

  it("contains Patient, Organization, and Practitioner", () => {
    const [b] = createBundleBuilder().seed(3).build();
    const bundle = b as Record<string, unknown>;
    expect(findResourceByType(bundle, "Patient")).toBeDefined();
    expect(findResourceByType(bundle, "Organization")).toBeDefined();
    expect(findResourceByType(bundle, "Practitioner")).toBeDefined();
  });

  it("contains at least one clinical resource", () => {
    const [b] = createBundleBuilder().seed(4).build();
    const bundle = b as Record<string, unknown>;
    const clinicalTypes = ["Observation", "Condition", "AllergyIntolerance", "MedicationStatement"];
    const hasClinical = entries(bundle)
      .map(entryResource)
      .some((r) => clinicalTypes.includes(r["resourceType"] as string));
    expect(hasClinical).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Transaction bundle
// ---------------------------------------------------------------------------

describe("Transaction bundle", () => {
  it("all entries have request with method and url", () => {
    const [b] = createBundleBuilder().seed(10).type("transaction").build();
    const bundle = b as Record<string, unknown>;
    expect(bundle["type"]).toBe("transaction");
    for (const entry of entries(bundle)) {
      const req = entry["request"] as Record<string, unknown>;
      expect(req).toBeDefined();
      expect(typeof req?.["method"]).toBe("string");
      expect(typeof req?.["url"]).toBe("string");
      expect(req?.["method"]).toBe("POST");
    }
  });
});

// ---------------------------------------------------------------------------
// Collection bundle
// ---------------------------------------------------------------------------

describe("Collection bundle", () => {
  it("entries have no request field", () => {
    const [b] = createBundleBuilder().seed(11).type("collection").build();
    const bundle = b as Record<string, unknown>;
    expect(bundle["type"]).toBe("collection");
    for (const entry of entries(bundle)) {
      expect(entry["request"]).toBeUndefined();
    }
  });
});

// ---------------------------------------------------------------------------
// Searchset bundle
// ---------------------------------------------------------------------------

describe("Searchset bundle", () => {
  it("entries have search.mode = match", () => {
    const [b] = createBundleBuilder().seed(12).type("searchset").build();
    const bundle = b as Record<string, unknown>;
    expect(bundle["type"]).toBe("searchset");
    for (const entry of entries(bundle)) {
      const search = entry["search"] as Record<string, unknown>;
      expect(search?.["mode"]).toBe("match");
    }
  });
});

// ---------------------------------------------------------------------------
// Reference wiring
// ---------------------------------------------------------------------------

describe("Reference wiring", () => {
  it("all entry fullUrls use urn:uuid: format", () => {
    const [b] = createBundleBuilder().seed(20).build();
    const bundle = b as Record<string, unknown>;
    for (const fullUrl of allFullUrls(bundle)) {
      expect(fullUrl).toMatch(/^urn:uuid:[0-9a-f-]+$/);
    }
  });

  it("Patient managingOrganization references the Organization fullUrl", () => {
    const [b] = createBundleBuilder().seed(21).build();
    const bundle = b as Record<string, unknown>;

    const patient = findResourceByType(bundle, "Patient");
    const org = findResourceByType(bundle, "Organization");
    expect(patient).toBeDefined();
    expect(org).toBeDefined();

    const orgId = org?.["id"] as string;
    const managingOrg = patient?.["managingOrganization"] as Record<string, unknown>;
    expect(managingOrg?.["reference"]).toBe(`urn:uuid:${orgId}`);
  });

  it("Observations have subject reference pointing to Patient fullUrl", () => {
    const [b] = createBundleBuilder().seed(22).clinicalResourcesPerPatient(3).build();
    const bundle = b as Record<string, unknown>;

    const patient = findResourceByType(bundle, "Patient");
    const observations = allResourcesByType(bundle, "Observation");
    expect(patient).toBeDefined();
    expect(observations.length).toBeGreaterThan(0);

    const patientId = patient?.["id"] as string;
    for (const obs of observations) {
      const subject = obs["subject"] as Record<string, unknown>;
      expect(subject?.["reference"]).toBe(`urn:uuid:${patientId}`);
    }
  });

  it("every reference in resources points to an existing fullUrl", () => {
    const [b] = createBundleBuilder().seed(23).clinicalResourcesPerPatient(4).build();
    const bundle = b as Record<string, unknown>;
    const fullUrls = new Set(allFullUrls(bundle));

    for (const entry of entries(bundle)) {
      const resource = entryResource(entry);
      // Check subject references
      const subject = resource["subject"] as Record<string, unknown> | undefined;
      if (subject?.["reference"]) {
        expect(fullUrls).toContain(subject["reference"]);
      }
      // Check patient references (AllergyIntolerance)
      const patient = resource["patient"] as Record<string, unknown> | undefined;
      if (patient?.["reference"]) {
        expect(fullUrls).toContain(patient["reference"]);
      }
      // Check managingOrganization
      const managingOrg = resource["managingOrganization"] as Record<string, unknown> | undefined;
      if (managingOrg?.["reference"]) {
        expect(fullUrls).toContain(managingOrg["reference"]);
      }
    }
  });

  it("Observations have performer reference pointing to Practitioner fullUrl", () => {
    const [b] = createBundleBuilder().seed(24).clinicalResourcesPerPatient(2).build();
    const bundle = b as Record<string, unknown>;

    const pract = findResourceByType(bundle, "Practitioner");
    const observations = allResourcesByType(bundle, "Observation");
    expect(pract).toBeDefined();
    expect(observations.length).toBeGreaterThan(0);

    const practId = pract?.["id"] as string;
    for (const obs of observations) {
      const performer = obs["performer"] as Array<Record<string, unknown>> | undefined;
      if (performer && performer.length > 0) {
        expect(performer[0]?.["reference"]).toBe(`urn:uuid:${practId}`);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// clinicalResourcesPerPatient
// ---------------------------------------------------------------------------

describe("clinicalResourcesPerPatient", () => {
  it("generates the specified number of clinical resources", () => {
    const [b] = createBundleBuilder().seed(30).clinicalResourcesPerPatient(5).build();
    const bundle = b as Record<string, unknown>;
    const clinicalTypes = ["Observation", "Condition", "AllergyIntolerance", "MedicationStatement"];
    const clinicalResources = entries(bundle)
      .map(entryResource)
      .filter((r) => clinicalTypes.includes(r["resourceType"] as string));
    expect(clinicalResources).toHaveLength(5);
  });
});

// ---------------------------------------------------------------------------
// Count parameter
// ---------------------------------------------------------------------------

describe("Bundle count", () => {
  it("generates the correct number of bundles", () => {
    const bundles = createBundleBuilder().seed(40).count(3).build();
    expect(bundles).toHaveLength(3);
  });

  it("each bundle has unique id", () => {
    const bundles = createBundleBuilder().seed(41).count(5).build();
    const ids = bundles.map((b) => b["id"] as string);
    const unique = new Set(ids);
    expect(unique.size).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe("Determinism", () => {
  it("same locale + seed produces identical bundle", () => {
    const a = createBundleBuilder().locale("uk").seed(99).count(2).build();
    const b = createBundleBuilder().locale("uk").seed(99).count(2).build();
    expect(a).toEqual(b);
  });

  it("different seeds produce different bundles", () => {
    const a = createBundleBuilder().seed(1).build();
    const b = createBundleBuilder().seed(2).build();
    expect(a).not.toEqual(b);
  });
});

// ---------------------------------------------------------------------------
// fhirVersion propagation
// ---------------------------------------------------------------------------

describe("Bundle fhirVersion propagation", () => {
  it("R5 bundle contains no MedicationStatement entries", () => {
    const [b] = createBundleBuilder().seed(50).clinicalResourcesPerPatient(5).fhirVersion("R5").build();
    const bundle = b as Record<string, unknown>;
    const medStatements = allResourcesByType(bundle, "MedicationStatement");
    expect(medStatements).toHaveLength(0);
  });

  it("R5 bundle contains MedicationUsage entries", () => {
    const [b] = createBundleBuilder().seed(50).clinicalResourcesPerPatient(5).fhirVersion("R5").build();
    const bundle = b as Record<string, unknown>;
    const medUsages = allResourcesByType(bundle, "MedicationUsage");
    expect(medUsages.length).toBeGreaterThan(0);
  });

  it("R4 bundle (default) contains MedicationStatement entries", () => {
    const [b] = createBundleBuilder().seed(50).clinicalResourcesPerPatient(5).build();
    const bundle = b as Record<string, unknown>;
    const medStatements = allResourcesByType(bundle, "MedicationStatement");
    expect(medStatements.length).toBeGreaterThan(0);
  });
});
