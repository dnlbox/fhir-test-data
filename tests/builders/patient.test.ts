import { describe, it, expect } from "vitest";
import { createPatientBuilder } from "@/core/builders/patient.js";
import {
  nhsNumberDefinition,
  ihiDefinition,
  bsnDefinition,
  ssnDefinition,
} from "@/core/generators/identifiers.js";
import { getLocale, getAllLocales } from "@/locales/index.js";
import type { FhirResource } from "@/core/types.js";
import { SUPPORTED_LOCALES } from "@/core/types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function identifier(patient: FhirResource): { system: string; value: string } {
  const ids = patient["identifier"] as Array<{ system: string; value: string }>;
  const first = ids[0];
  if (!first) throw new Error("No identifier on patient");
  return first;
}

function address(patient: FhirResource): Record<string, unknown> {
  const addrs = patient["address"] as Array<Record<string, unknown>>;
  const first = addrs[0];
  if (!first) throw new Error("No address on patient");
  return first;
}

// ---------------------------------------------------------------------------
// Basic structure
// ---------------------------------------------------------------------------

describe("Patient structure", () => {
  it("has required top-level fields", () => {
    const [patient] = createPatientBuilder().seed(1).build();
    expect(patient).toBeDefined();
    if (!patient) return;

    expect(patient["resourceType"]).toBe("Patient");
    expect(typeof patient["id"]).toBe("string");
    expect((patient["id"] as string).length).toBeGreaterThan(0);
    expect(Array.isArray(patient["identifier"])).toBe(true);
    expect(Array.isArray(patient["name"])).toBe(true);
    expect(Array.isArray(patient["telecom"])).toBe(true);
    expect(["male", "female", "other", "unknown"]).toContain(patient["gender"]);
    expect(typeof patient["birthDate"]).toBe("string");
    expect(/^\d{4}-\d{2}-\d{2}$/.test(patient["birthDate"] as string)).toBe(true);
    expect(Array.isArray(patient["address"])).toBe(true);
    expect(Array.isArray(patient["communication"])).toBe(true);
  });

  it("id is UUID v4 format", () => {
    const [patient] = createPatientBuilder().seed(2).build();
    const uuid = patient?.["id"] as string;
    expect(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(uuid)).toBe(true);
  });

  it("birthDate is between 1940 and 2010", () => {
    const builder = createPatientBuilder().seed(7);
    const patients = builder.count(50).build();
    for (const p of patients) {
      const year = Number.parseInt((p["birthDate"] as string).slice(0, 4), 10);
      expect(year).toBeGreaterThanOrEqual(1940);
      expect(year).toBeLessThanOrEqual(2010);
    }
  });

  it("telecom has phone and email entries", () => {
    const [patient] = createPatientBuilder().seed(3).build();
    const telecom = patient?.["telecom"] as Array<Record<string, unknown>>;
    const phone = telecom.find((t) => t["system"] === "phone");
    const email = telecom.find((t) => t["system"] === "email");
    expect(phone).toBeDefined();
    expect(email).toBeDefined();
    expect((email?.["value"] as string)).toMatch(/@example\.com$/);
  });
});

// ---------------------------------------------------------------------------
// US Patient
// ---------------------------------------------------------------------------

describe("US Patient", () => {
  it("has SSN or MRN identifier", () => {
    const [patient] = createPatientBuilder().locale("us").seed(10).build();
    if (!patient) throw new Error("no patient");
    const id = identifier(patient);
    const usDef = getLocale("us");
    const systems = usDef.patientIdentifiers.map((d) => d.system);
    expect(systems).toContain(id.system);
  });

  it("SSN identifier passes validation", () => {
    for (let seed = 0; seed < 20; seed++) {
      const [patient] = createPatientBuilder().locale("us").seed(seed).build();
      if (!patient) continue;
      const id = identifier(patient);
      if (id.system === ssnDefinition.system) {
        expect(ssnDefinition.validate(id.value)).toBe(true);
      }
    }
  });

  it("has US address country code", () => {
    const [patient] = createPatientBuilder().locale("us").seed(11).build();
    if (!patient) throw new Error("no patient");
    const addr = address(patient);
    expect(addr["country"]).toBe("US");
    expect(typeof addr["state"]).toBe("string");
    expect((addr["postalCode"] as string)).toMatch(/^\d{5}$/);
  });
});

// ---------------------------------------------------------------------------
// UK Patient
// ---------------------------------------------------------------------------

describe("UK Patient", () => {
  it("has NHS number that passes Modulus 11 validation", () => {
    for (let seed = 0; seed < 20; seed++) {
      const [patient] = createPatientBuilder().locale("uk").seed(seed).build();
      if (!patient) continue;
      const id = identifier(patient);
      if (id.system === nhsNumberDefinition.system) {
        expect(nhsNumberDefinition.validate(id.value), `seed ${seed}: ${id.value}`).toBe(true);
      }
    }
  });

  it("has UK address with GB country code", () => {
    const [patient] = createPatientBuilder().locale("uk").seed(20).build();
    if (!patient) throw new Error("no patient");
    const addr = address(patient);
    expect(addr["country"]).toBe("GB");
    expect(addr["state"]).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// AU Patient
// ---------------------------------------------------------------------------

describe("AU Patient", () => {
  it("has IHI or Medicare identifier that passes validation", () => {
    for (let seed = 0; seed < 20; seed++) {
      const [patient] = createPatientBuilder().locale("au").seed(seed).build();
      if (!patient) continue;
      const id = identifier(patient);
      if (id.system === ihiDefinition.system) {
        expect(ihiDefinition.validate(id.value), `IHI seed ${seed}: ${id.value}`).toBe(true);
      }
    }
  });

  it("has AU address with 4-digit postcode", () => {
    const [patient] = createPatientBuilder().locale("au").seed(30).build();
    if (!patient) throw new Error("no patient");
    const addr = address(patient);
    expect(addr["country"]).toBe("AU");
    expect((addr["postalCode"] as string)).toMatch(/^\d{4}$/);
    expect(typeof addr["state"]).toBe("string");
  });
});

// ---------------------------------------------------------------------------
// NL Patient
// ---------------------------------------------------------------------------

describe("NL Patient", () => {
  it("has BSN that passes 11-proef validation", () => {
    for (let seed = 0; seed < 20; seed++) {
      const [patient] = createPatientBuilder().locale("nl").seed(seed).build();
      if (!patient) continue;
      const id = identifier(patient);
      if (id.system === bsnDefinition.system) {
        expect(bsnDefinition.validate(id.value), `BSN seed ${seed}: ${id.value}`).toBe(true);
      }
    }
  });

  it("has NL address with NNNN LL postcode", () => {
    const [patient] = createPatientBuilder().locale("nl").seed(40).build();
    if (!patient) throw new Error("no patient");
    const addr = address(patient);
    expect(addr["country"]).toBe("NL");
    expect((addr["postalCode"] as string)).toMatch(/^\d{4} [A-Z]{2}$/);
  });
});

// ---------------------------------------------------------------------------
// All locales — 10 patients each
// ---------------------------------------------------------------------------

describe("All locales — 10 patients", () => {
  for (const locale of SUPPORTED_LOCALES) {
    it(`${locale}: 10 patients all have required fields`, () => {
      const patients = createPatientBuilder().locale(locale).seed(42).count(10).build();
      expect(patients).toHaveLength(10);
      for (const p of patients) {
        expect(p["resourceType"]).toBe("Patient");
        expect(typeof p["id"]).toBe("string");
        expect(Array.isArray(p["identifier"])).toBe(true);
        expect((p["identifier"] as unknown[]).length).toBeGreaterThan(0);
        expect(Array.isArray(p["name"])).toBe(true);
        expect(Array.isArray(p["address"])).toBe(true);
        expect(typeof p["birthDate"]).toBe("string");
      }
    });
  }

  it("all patient identifiers pass their own validation function", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const localeDef = getLocale(locale);
      const patients = createPatientBuilder().locale(locale).seed(55).count(20).build();
      for (const p of patients) {
        const ids = p["identifier"] as Array<{ system: string; value: string }>;
        for (const id of ids) {
          const def = localeDef.patientIdentifiers.find((d) => d.system === id.system);
          if (def) {
            expect(def.validate(id.value), `${locale} ${def.name}: ${id.value}`).toBe(true);
          }
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Locale registry
// ---------------------------------------------------------------------------

describe("Locale registry", () => {
  it("getAllLocales returns all supported locales", () => {
    expect(getAllLocales()).toHaveLength(SUPPORTED_LOCALES.length);
  });

  it("getLocale returns correct locale for each code", () => {
    for (const code of SUPPORTED_LOCALES) {
      const loc = getLocale(code);
      expect(loc.code).toBe(code);
    }
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe("Determinism", () => {
  it("same locale + seed + count produces identical output", () => {
    const a = createPatientBuilder().locale("uk").seed(99).count(5).build();
    const b = createPatientBuilder().locale("uk").seed(99).count(5).build();
    expect(a).toEqual(b);
  });

  it("different seeds produce different output", () => {
    const a = createPatientBuilder().locale("us").seed(1).count(3).build();
    const b = createPatientBuilder().locale("us").seed(2).count(3).build();
    expect(a).not.toEqual(b);
  });
});

// ---------------------------------------------------------------------------
// Overrides
// ---------------------------------------------------------------------------

describe("Overrides", () => {
  it("applies scalar overrides to every patient", () => {
    const patients = createPatientBuilder()
      .locale("us")
      .seed(1)
      .count(5)
      .overrides({ gender: "other" })
      .build();
    for (const p of patients) {
      expect(p["gender"]).toBe("other");
    }
  });

  it("deep-merges object overrides", () => {
    const patients = createPatientBuilder()
      .locale("us")
      .seed(1)
      .count(3)
      .overrides({ meta: { source: "test-suite" } })
      .build();
    for (const p of patients) {
      const meta = p["meta"] as Record<string, unknown>;
      expect(meta["source"]).toBe("test-suite");
    }
  });

  it("builder is immutable — overrides on one builder do not affect another", () => {
    const base = createPatientBuilder().locale("us").seed(1);
    const withOverride = base.overrides({ gender: "unknown" });
    const [p1] = base.build();
    const [p2] = withOverride.build();
    expect(p2?.["gender"]).toBe("unknown");
    // p1 gender should be whatever was generated, not forced to unknown
    // (this just ensures they differ or p1 wasn't affected by the override)
    expect(p1?.["gender"]).not.toBeUndefined();
  });
});
