import { describe, it, expect } from "vitest";
import { createOrganizationBuilder } from "../../src/core/builders/organization.js";
import {
  odsCodDefinition,
  npiDefinition,
  hpioDefinition,
} from "../../src/core/generators/identifiers.js";
import { SUPPORTED_LOCALES } from "../../src/core/types.js";
import { getLocale } from "../../src/locales/index.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function firstIdentifier(
  o: Record<string, unknown>,
): { system: string; value: string } | undefined {
  const ids = o["identifier"] as Array<{ system: string; value: string }>;
  return ids[0];
}

// ---------------------------------------------------------------------------
// Structure
// ---------------------------------------------------------------------------

describe("Organization structure", () => {
  it("has required top-level fields", () => {
    const [org] = createOrganizationBuilder().seed(1).build();
    expect(org).toBeDefined();
    if (!org) return;

    expect(org["resourceType"]).toBe("Organization");
    expect(typeof org["id"]).toBe("string");
    expect((org["id"] as string).length).toBeGreaterThan(0);
    expect(org["active"]).toBe(true);
    expect(Array.isArray(org["identifier"])).toBe(true);
    expect(Array.isArray(org["type"])).toBe(true);
    expect(typeof org["name"]).toBe("string");
    expect((org["name"] as string).length).toBeGreaterThan(0);
    expect(Array.isArray(org["telecom"])).toBe(true);
    expect(Array.isArray(org["address"])).toBe(true);
  });

  it("id is UUID v4 format", () => {
    const [org] = createOrganizationBuilder().seed(2).build();
    const uuid = org?.["id"] as string;
    expect(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(uuid),
    ).toBe(true);
  });

  it("type is Healthcare Provider", () => {
    const [org] = createOrganizationBuilder().seed(3).build();
    const type = (org?.["type"] as Array<Record<string, unknown>>)[0];
    const coding = (type?.["coding"] as Array<Record<string, unknown>>)[0];
    expect(coding?.["code"]).toBe("prov");
  });

  it("name is not empty and contains city + org suffix", () => {
    const [org] = createOrganizationBuilder().locale("us").seed(4).build();
    const name = org?.["name"] as string;
    expect(name.length).toBeGreaterThan(0);
    // Should contain one of the org suffixes
    const suffixes = ["Hospital", "Medical Center", "Health System", "Clinic", "Healthcare"];
    expect(suffixes.some((s) => name.includes(s))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// US Organization
// ---------------------------------------------------------------------------

describe("US Organization", () => {
  it("has NPI identifier", () => {
    const [org] = createOrganizationBuilder().locale("us").seed(10).build();
    if (!org) throw new Error("no org");
    const id = firstIdentifier(org as Record<string, unknown>);
    expect(id?.system).toBe(npiDefinition.system);
  });

  it("NPI passes Luhn validation", () => {
    for (let seed = 0; seed < 20; seed++) {
      const [org] = createOrganizationBuilder().locale("us").seed(seed).build();
      if (!org) continue;
      const id = firstIdentifier(org as Record<string, unknown>);
      if (id?.system === npiDefinition.system) {
        expect(npiDefinition.validate(id.value), `seed ${seed}: ${id.value}`).toBe(true);
      }
    }
  });

  it("has address with US country code", () => {
    const [org] = createOrganizationBuilder().locale("us").seed(11).build();
    if (!org) throw new Error("no org");
    const addr = (org["address"] as Array<Record<string, unknown>>)[0];
    expect(addr?.["country"]).toBe("US");
    expect((addr?.["postalCode"] as string)).toMatch(/^\d{5}$/);
  });
});

// ---------------------------------------------------------------------------
// UK Organization
// ---------------------------------------------------------------------------

describe("UK Organization", () => {
  it("has ODS code in correct format", () => {
    for (let seed = 0; seed < 20; seed++) {
      const [org] = createOrganizationBuilder().locale("uk").seed(seed).build();
      if (!org) continue;
      const id = firstIdentifier(org as Record<string, unknown>);
      if (id?.system === odsCodDefinition.system) {
        expect(odsCodDefinition.validate(id.value), `seed ${seed}: ${id.value}`).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// AU Organization
// ---------------------------------------------------------------------------

describe("AU Organization", () => {
  it("has HPI-O starting with 800362 and passing Luhn", () => {
    for (let seed = 0; seed < 10; seed++) {
      const [org] = createOrganizationBuilder().locale("au").seed(seed).build();
      if (!org) continue;
      const id = firstIdentifier(org as Record<string, unknown>);
      if (id?.system === hpioDefinition.system) {
        expect(id.value.startsWith("800362")).toBe(true);
        expect(hpioDefinition.validate(id.value)).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// All locales — 5 organizations each
// ---------------------------------------------------------------------------

describe("All locales — 5 organizations", () => {
  for (const locale of SUPPORTED_LOCALES) {
    it(`${locale}: 5 organizations all have required fields`, () => {
      const orgs = createOrganizationBuilder().locale(locale).seed(42).count(5).build();
      expect(orgs).toHaveLength(5);
      for (const o of orgs) {
        expect(o["resourceType"]).toBe("Organization");
        expect(typeof o["id"]).toBe("string");
        expect(o["active"]).toBe(true);
        expect(typeof o["name"]).toBe("string");
        expect((o["name"] as string).length).toBeGreaterThan(0);
        expect(Array.isArray(o["address"])).toBe(true);
      }
    });
  }

  it("organization names are not all identical", () => {
    const orgs = createOrganizationBuilder().locale("us").seed(1).count(10).build();
    const names = orgs.map((o) => o["name"] as string);
    const unique = new Set(names);
    expect(unique.size).toBeGreaterThan(1);
  });

  it("all org identifiers pass their own validation", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const localeDef = getLocale(locale);
      if (localeDef.organizationIdentifiers.length === 0) continue;
      const orgs = createOrganizationBuilder().locale(locale).seed(77).count(10).build();
      for (const o of orgs) {
        const ids = o["identifier"] as Array<{ system: string; value: string }>;
        for (const id of ids) {
          const def = localeDef.organizationIdentifiers.find((d) => d.system === id.system);
          if (def) {
            expect(def.validate(id.value), `${locale} ${def.name}: ${id.value}`).toBe(true);
          }
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe("Determinism", () => {
  it("same locale + seed produces identical output", () => {
    const a = createOrganizationBuilder().locale("uk").seed(99).count(5).build();
    const b = createOrganizationBuilder().locale("uk").seed(99).count(5).build();
    expect(a).toEqual(b);
  });

  it("different seeds produce different output", () => {
    const a = createOrganizationBuilder().locale("us").seed(1).count(3).build();
    const b = createOrganizationBuilder().locale("us").seed(2).count(3).build();
    expect(a).not.toEqual(b);
  });
});
