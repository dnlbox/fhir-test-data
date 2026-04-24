import { describe, it, expect } from "vitest";
import { createEncounterBuilder } from "@/core/builders/encounter.js";
import {
  ENCOUNTER_CLASS_CODES,
  ENCOUNTER_TYPE_CODES,
  ENCOUNTER_STATUS_R4,
  ENCOUNTER_STATUS_R5,
} from "@/core/data/encounter-codes.js";

const CLASS_CODES = ENCOUNTER_CLASS_CODES.map((c) => c.code);
const TYPE_CODES  = ENCOUNTER_TYPE_CODES.map((c) => c.code);
const ACT_CODE_SYSTEM = "http://terminology.hl7.org/CodeSystem/v3-ActCode";
const SNOMED_SYSTEM   = "http://snomed.info/sct";

describe("Encounter structure (R4)", () => {
  it("has required top-level fields", () => {
    const [enc] = createEncounterBuilder().seed(1).build();
    expect(enc).toBeDefined();
    if (!enc) return;

    expect(enc["resourceType"]).toBe("Encounter");
    expect(typeof enc["id"]).toBe("string");
    expect(typeof enc["status"]).toBe("string");
    expect(typeof enc["class"]).toBe("object");
    expect(Array.isArray(enc["type"])).toBe(true);
  });

  it("status is from the R4 value set", () => {
    const encounters = createEncounterBuilder().seed(2).count(30).build();
    const validStatuses = new Set<string>([...ENCOUNTER_STATUS_R4]);
    for (const enc of encounters) {
      expect(validStatuses.has(enc["status"] as string)).toBe(true);
    }
  });

  it("class is a Coding with system and code from ActCode", () => {
    const encounters = createEncounterBuilder().seed(3).count(20).build();
    for (const enc of encounters) {
      const cls = enc["class"] as Record<string, unknown>;
      expect(cls["system"]).toBe(ACT_CODE_SYSTEM);
      expect(CLASS_CODES).toContain(cls["code"]);
      expect(typeof cls["display"]).toBe("string");
    }
  });

  it("type is an array with a SNOMED coding", () => {
    const encounters = createEncounterBuilder().seed(4).count(20).build();
    for (const enc of encounters) {
      const types = enc["type"] as Array<Record<string, unknown>>;
      expect(types.length).toBeGreaterThan(0);
      const coding = (types[0]!["coding"] as Array<Record<string, unknown>>)[0]!;
      expect(coding["system"]).toBe(SNOMED_SYSTEM);
      expect(TYPE_CODES).toContain(coding["code"]);
    }
  });

  it("id is a UUID v4 format", () => {
    const [enc] = createEncounterBuilder().seed(5).build();
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    expect(UUID_RE.test(enc!["id"] as string)).toBe(true);
  });

  it("planned encounters have no period", () => {
    const encounters = createEncounterBuilder().seed(6).count(50).build();
    const planned = encounters.filter((e) => e["status"] === "planned");
    expect(planned.length).toBeGreaterThan(0);
    for (const enc of planned) {
      expect(enc["period"]).toBeUndefined();
    }
  });

  it("finished/cancelled encounters have a period with start and end", () => {
    const encounters = createEncounterBuilder().seed(7).count(50).build();
    const closed = encounters.filter((e) =>
      ["finished", "cancelled", "entered-in-error"].includes(e["status"] as string),
    );
    expect(closed.length).toBeGreaterThan(0);
    for (const enc of closed) {
      const period = enc["period"] as Record<string, unknown>;
      expect(period).toBeDefined();
      expect(typeof period["start"]).toBe("string");
      expect(typeof period["end"]).toBe("string");
    }
  });

  it("in-progress/triaged/arrived/onleave encounters have a period with only start", () => {
    const encounters = createEncounterBuilder().seed(8).count(50).build();
    const open = encounters.filter((e) =>
      ["arrived", "triaged", "in-progress", "onleave"].includes(e["status"] as string),
    );
    expect(open.length).toBeGreaterThan(0);
    for (const enc of open) {
      const period = enc["period"] as Record<string, unknown>;
      expect(period).toBeDefined();
      expect(typeof period["start"]).toBe("string");
      expect(period["end"]).toBeUndefined();
    }
  });

  it("uses provided subject reference", () => {
    const [enc] = createEncounterBuilder().seed(9).subject("Patient/my-patient").build();
    const subject = enc!["subject"] as Record<string, unknown>;
    expect(subject["reference"]).toBe("Patient/my-patient");
  });

  it("has no subject by default", () => {
    const [enc] = createEncounterBuilder().seed(10).build();
    expect(enc!["subject"]).toBeUndefined();
  });
});

describe("Encounter structure (R5)", () => {
  it("status is from the R5 value set", () => {
    const encounters = createEncounterBuilder().fhirVersion("R5").seed(20).count(30).build();
    const validStatuses = new Set<string>([...ENCOUNTER_STATUS_R5]);
    for (const enc of encounters) {
      expect(validStatuses.has(enc["status"] as string)).toBe(true);
    }
  });

  it("class is an array of CodeableConcept in R5", () => {
    const [enc] = createEncounterBuilder().fhirVersion("R5").seed(21).build();
    const cls = enc!["class"];
    expect(Array.isArray(cls)).toBe(true);
    const first = (cls as Array<Record<string, unknown>>)[0]!;
    expect(typeof first["coding"]).toBe("object");
    const coding = (first["coding"] as Array<Record<string, unknown>>)[0]!;
    expect(coding["system"]).toBe(ACT_CODE_SYSTEM);
    expect(CLASS_CODES).toContain(coding["code"]);
  });
});

describe("Encounter determinism", () => {
  it("same seed produces identical output", () => {
    const a = createEncounterBuilder().seed(99).count(5).build();
    const b = createEncounterBuilder().seed(99).count(5).build();
    expect(a).toEqual(b);
  });

  it("different seeds produce different output", () => {
    const a = createEncounterBuilder().seed(1).count(5).build();
    const b = createEncounterBuilder().seed(2).count(5).build();
    expect(a).not.toEqual(b);
  });
});
