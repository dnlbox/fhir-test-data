import { describe, it, expect } from "vitest";
import { createPractitionerBuilder } from "@/core/builders/practitioner.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getIdentifier(locale: string, seed: number): { system: string; value: string } {
  const [practitioner] = createPractitionerBuilder().locale(locale as never).seed(seed).build();
  const identifiers = practitioner?.["identifier"] as Array<{ system: string; value: string }> | undefined;
  const first = identifiers?.[0];
  if (!first) throw new Error(`No identifier found for locale ${locale} seed ${seed}`);
  return first;
}

// ---------------------------------------------------------------------------
// Canada — CPSO/Provincial Licence (6-digit numeric)
// ---------------------------------------------------------------------------

describe("CA practitioner identifier (CPSO)", () => {
  it("produces an identifier with the correct system", () => {
    const id = getIdentifier("ca", 1);
    expect(id.system).toBe("https://www.cpso.on.ca/");
  });

  it("matches 5–6 digit numeric format", () => {
    for (let seed = 1; seed <= 5; seed++) {
      const id = getIdentifier("ca", seed);
      expect(/^\d{5,6}$/.test(id.value)).toBe(true);
    }
  });

  it("is deterministic", () => {
    const a = getIdentifier("ca", 42);
    const b = getIdentifier("ca", 42);
    expect(a.value).toBe(b.value);
  });
});

// ---------------------------------------------------------------------------
// India — NMC Registration (6-digit numeric)
// ---------------------------------------------------------------------------

describe("IN practitioner identifier (NMC)", () => {
  it("produces an identifier with the correct system", () => {
    const id = getIdentifier("in", 1);
    expect(id.system).toBe("https://www.nmc.org.in/");
  });

  it("matches 6-digit numeric format", () => {
    for (let seed = 1; seed <= 5; seed++) {
      const id = getIdentifier("in", seed);
      expect(/^\d{6}$/.test(id.value)).toBe(true);
    }
  });

  it("is deterministic", () => {
    const a = getIdentifier("in", 42);
    const b = getIdentifier("in", 42);
    expect(a.value).toBe(b.value);
  });
});

// ---------------------------------------------------------------------------
// Japan — JMPC Physician Registration (6-digit numeric)
// ---------------------------------------------------------------------------

describe("JP practitioner identifier (JMPC)", () => {
  it("produces an identifier with the correct system", () => {
    const id = getIdentifier("jp", 1);
    expect(id.system).toBe("http://jpfhir.jp/fhir/core/NamingSystem/jp-doctor-license");
  });

  it("matches 6-digit numeric format", () => {
    for (let seed = 1; seed <= 5; seed++) {
      const id = getIdentifier("jp", seed);
      expect(/^\d{6}$/.test(id.value)).toBe(true);
    }
  });

  it("is deterministic", () => {
    const a = getIdentifier("jp", 42);
    const b = getIdentifier("jp", 42);
    expect(a.value).toBe(b.value);
  });
});

// ---------------------------------------------------------------------------
// South Korea — Medical Licence Number (5-digit numeric)
// ---------------------------------------------------------------------------

describe("KR practitioner identifier (MOHW)", () => {
  it("produces an identifier with the correct system", () => {
    const id = getIdentifier("kr", 1);
    expect(id.system).toBe("http://www.mohw.go.kr/fhir/NamingSystem/doctor-license");
  });

  it("matches 5-digit numeric format", () => {
    for (let seed = 1; seed <= 5; seed++) {
      const id = getIdentifier("kr", seed);
      expect(/^\d{5}$/.test(id.value)).toBe(true);
    }
  });

  it("is deterministic", () => {
    const a = getIdentifier("kr", 42);
    const b = getIdentifier("kr", 42);
    expect(a.value).toBe(b.value);
  });
});

// ---------------------------------------------------------------------------
// Singapore — SMC Registration (M + 5 digits)
// ---------------------------------------------------------------------------

describe("SG practitioner identifier (SMC)", () => {
  it("produces an identifier with the correct system", () => {
    const id = getIdentifier("sg", 1);
    expect(id.system).toBe("http://www.smc.gov.sg/fhir/NamingSystem/smcr");
  });

  it("matches M + 5-digit format", () => {
    for (let seed = 1; seed <= 5; seed++) {
      const id = getIdentifier("sg", seed);
      expect(/^M\d{5}$/.test(id.value)).toBe(true);
    }
  });

  it("is deterministic", () => {
    const a = getIdentifier("sg", 42);
    const b = getIdentifier("sg", 42);
    expect(a.value).toBe(b.value);
  });
});

// ---------------------------------------------------------------------------
// Brazil — CRM (state prefix + hyphen + 5 digits)
// ---------------------------------------------------------------------------

describe("BR practitioner identifier (CRM)", () => {
  it("produces an identifier with the correct system", () => {
    const id = getIdentifier("br", 1);
    expect(id.system).toBe("https://www.cfm.org.br/fhir/NamingSystem/crm");
  });

  it("matches state-prefix hyphen 5-digit format", () => {
    for (let seed = 1; seed <= 5; seed++) {
      const id = getIdentifier("br", seed);
      expect(/^[A-Z]{2}-\d{5}$/.test(id.value)).toBe(true);
    }
  });

  it("uses a recognised Brazilian state code", () => {
    const validStates = new Set(["SP", "RJ", "MG", "RS", "BA", "PR", "PE", "CE", "GO", "MA"]);
    for (let seed = 1; seed <= 5; seed++) {
      const id = getIdentifier("br", seed);
      const state = id.value.split("-")[0];
      expect(validStates.has(state ?? "")).toBe(true);
    }
  });

  it("is deterministic", () => {
    const a = getIdentifier("br", 42);
    const b = getIdentifier("br", 42);
    expect(a.value).toBe(b.value);
  });
});

// ---------------------------------------------------------------------------
// Mexico — Cédula Profesional (7-digit numeric)
// ---------------------------------------------------------------------------

describe("MX practitioner identifier (Cédula Profesional)", () => {
  it("produces an identifier with the correct system", () => {
    const id = getIdentifier("mx", 1);
    expect(id.system).toBe("http://www.sep.gob.mx/fhir/NamingSystem/cedula");
  });

  it("matches 7-digit numeric format", () => {
    for (let seed = 1; seed <= 5; seed++) {
      const id = getIdentifier("mx", seed);
      expect(/^\d{7}$/.test(id.value)).toBe(true);
    }
  });

  it("is deterministic", () => {
    const a = getIdentifier("mx", 42);
    const b = getIdentifier("mx", 42);
    expect(a.value).toBe(b.value);
  });
});

// ---------------------------------------------------------------------------
// South Africa — HPCSA Registration (MP + 6 digits)
// ---------------------------------------------------------------------------

describe("ZA practitioner identifier (HPCSA)", () => {
  it("produces an identifier with the correct system", () => {
    const id = getIdentifier("za", 1);
    expect(id.system).toBe("https://www.hpcsa.co.za/fhir/NamingSystem/hpcsa");
  });

  it("matches MP + 6-digit format", () => {
    for (let seed = 1; seed <= 5; seed++) {
      const id = getIdentifier("za", seed);
      expect(/^MP\d{6}$/.test(id.value)).toBe(true);
    }
  });

  it("is deterministic", () => {
    const a = getIdentifier("za", 42);
    const b = getIdentifier("za", 42);
    expect(a.value).toBe(b.value);
  });
});
