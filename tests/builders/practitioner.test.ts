import { describe, it, expect } from "vitest";
import { createPractitionerBuilder } from "@/core/builders/practitioner.js";
import {
  npiDefinition,
  gmcNumberDefinition,
  lanrDefinition,
  hpiiDefinition,
  uziNumberDefinition,
  rppsDefinition,
} from "@/core/generators/identifiers.js";
import { SUPPORTED_LOCALES } from "@/core/types.js";
import { getLocale } from "@/locales/index.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function firstIdentifier(
  p: Record<string, unknown>,
): { system: string; value: string } | undefined {
  const ids = p["identifier"] as Array<{ system: string; value: string }>;
  return ids[0];
}

// ---------------------------------------------------------------------------
// Structure
// ---------------------------------------------------------------------------

describe("Practitioner structure", () => {
  it("has required top-level fields", () => {
    const [p] = createPractitionerBuilder().seed(1).build();
    expect(p).toBeDefined();
    if (!p) return;

    expect(p["resourceType"]).toBe("Practitioner");
    expect(typeof p["id"]).toBe("string");
    expect((p["id"] as string).length).toBeGreaterThan(0);
    expect(Array.isArray(p["identifier"])).toBe(true);
    expect(Array.isArray(p["name"])).toBe(true);
    expect(Array.isArray(p["telecom"])).toBe(true);
    expect(["male", "female"]).toContain(p["gender"]);
    expect(Array.isArray(p["qualification"])).toBe(true);
  });

  it("id is UUID v4 format", () => {
    const [p] = createPractitionerBuilder().seed(2).build();
    const uuid = p?.["id"] as string;
    expect(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(uuid),
    ).toBe(true);
  });

  it("email ends with @example-practice.com", () => {
    const [p] = createPractitionerBuilder().seed(3).build();
    const telecom = p?.["telecom"] as Array<Record<string, unknown>>;
    const email = telecom.find((t) => t["system"] === "email");
    expect(email).toBeDefined();
    expect((email?.["value"] as string)).toMatch(/@example-practice\.com$/);
    expect(email?.["use"]).toBe("work");
  });

  it("qualification has MD coding", () => {
    const [p] = createPractitionerBuilder().seed(4).build();
    const qual = (p?.["qualification"] as Array<Record<string, unknown>>)[0];
    const code = qual?.["code"] as Record<string, unknown>;
    const coding = (code?.["coding"] as Array<Record<string, unknown>>)[0];
    expect(coding?.["code"]).toBe("MD");
  });
});

// ---------------------------------------------------------------------------
// US Practitioner
// ---------------------------------------------------------------------------

describe("US Practitioner", () => {
  it("has NPI that passes Luhn validation", () => {
    for (let seed = 0; seed < 20; seed++) {
      const [p] = createPractitionerBuilder().locale("us").seed(seed).build();
      if (!p) continue;
      const id = firstIdentifier(p as Record<string, unknown>);
      if (id?.system === npiDefinition.system) {
        expect(npiDefinition.validate(id.value), `seed ${seed}: ${id.value}`).toBe(true);
      }
    }
  });

  it("name prefix is 'Dr.'", () => {
    const [p] = createPractitionerBuilder().locale("us").seed(5).build();
    const name = (p?.["name"] as Array<Record<string, unknown>>)[0];
    expect((name?.["prefix"] as string[])[0]).toBe("Dr.");
  });
});

// ---------------------------------------------------------------------------
// UK Practitioner
// ---------------------------------------------------------------------------

describe("UK Practitioner", () => {
  it("has GMC number in correct format", () => {
    for (let seed = 0; seed < 20; seed++) {
      const [p] = createPractitionerBuilder().locale("uk").seed(seed).build();
      if (!p) continue;
      const id = firstIdentifier(p as Record<string, unknown>);
      if (id?.system === gmcNumberDefinition.system) {
        expect(gmcNumberDefinition.validate(id.value), `seed ${seed}: ${id.value}`).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// DE Practitioner
// ---------------------------------------------------------------------------

describe("DE Practitioner", () => {
  it("has LANR with valid Modulus 10 check digit", () => {
    for (let seed = 0; seed < 20; seed++) {
      const [p] = createPractitionerBuilder().locale("de").seed(seed).build();
      if (!p) continue;
      const id = firstIdentifier(p as Record<string, unknown>);
      if (id?.system === lanrDefinition.system) {
        expect(lanrDefinition.validate(id.value), `seed ${seed}: ${id.value}`).toBe(true);
      }
    }
  });

  it("name prefix is 'Dr. med.'", () => {
    const [p] = createPractitionerBuilder().locale("de").seed(6).build();
    const name = (p?.["name"] as Array<Record<string, unknown>>)[0];
    expect((name?.["prefix"] as string[])[0]).toBe("Dr. med.");
  });
});

// ---------------------------------------------------------------------------
// AU Practitioner
// ---------------------------------------------------------------------------

describe("AU Practitioner", () => {
  it("has HPI-I starting with 800361", () => {
    for (let seed = 0; seed < 10; seed++) {
      const [p] = createPractitionerBuilder().locale("au").seed(seed).build();
      if (!p) continue;
      const id = firstIdentifier(p as Record<string, unknown>);
      if (id?.system === hpiiDefinition.system) {
        expect(id.value.startsWith("800361")).toBe(true);
        expect(hpiiDefinition.validate(id.value)).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// All locales — 5 practitioners each
// ---------------------------------------------------------------------------

describe("All locales — 5 practitioners", () => {
  for (const locale of SUPPORTED_LOCALES) {
    it(`${locale}: 5 practitioners all have required fields`, () => {
      const practitioners = createPractitionerBuilder()
        .locale(locale)
        .seed(42)
        .count(5)
        .build();
      expect(practitioners).toHaveLength(5);
      for (const p of practitioners) {
        expect(p["resourceType"]).toBe("Practitioner");
        expect(typeof p["id"]).toBe("string");
        expect(Array.isArray(p["identifier"])).toBe(true);
        expect(Array.isArray(p["name"])).toBe(true);
        expect(Array.isArray(p["telecom"])).toBe(true);
        expect(Array.isArray(p["qualification"])).toBe(true);
      }
    });
  }

  it("all practitioner identifiers pass their own validation function", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const localeDef = getLocale(locale);
      if (localeDef.practitionerIdentifiers.length === 0) continue;
      const practitioners = createPractitionerBuilder()
        .locale(locale)
        .seed(77)
        .count(10)
        .build();
      for (const p of practitioners) {
        const ids = p["identifier"] as Array<{ system: string; value: string }>;
        for (const id of ids) {
          const def = localeDef.practitionerIdentifiers.find((d) => d.system === id.system);
          if (def) {
            expect(def.validate(id.value), `${locale} ${def.name}: ${id.value}`).toBe(true);
          }
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Additional locale-specific identifier checks
// ---------------------------------------------------------------------------

describe("NL and FR practitioner identifiers", () => {
  it("NL UZI number passes validation", () => {
    for (let seed = 0; seed < 10; seed++) {
      const [p] = createPractitionerBuilder().locale("nl").seed(seed).build();
      if (!p) continue;
      const id = firstIdentifier(p as Record<string, unknown>);
      if (id?.system === uziNumberDefinition.system) {
        expect(uziNumberDefinition.validate(id.value)).toBe(true);
      }
    }
  });

  it("FR RPPS passes validation", () => {
    for (let seed = 0; seed < 10; seed++) {
      const [p] = createPractitionerBuilder().locale("fr").seed(seed).build();
      if (!p) continue;
      const id = firstIdentifier(p as Record<string, unknown>);
      if (id?.system === rppsDefinition.system) {
        expect(rppsDefinition.validate(id.value)).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe("Determinism", () => {
  it("same locale + seed produces identical output", () => {
    const a = createPractitionerBuilder().locale("uk").seed(99).count(5).build();
    const b = createPractitionerBuilder().locale("uk").seed(99).count(5).build();
    expect(a).toEqual(b);
  });

  it("different seeds produce different output", () => {
    const a = createPractitionerBuilder().locale("us").seed(1).count(3).build();
    const b = createPractitionerBuilder().locale("us").seed(2).count(3).build();
    expect(a).not.toEqual(b);
  });
});
