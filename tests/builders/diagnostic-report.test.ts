import { describe, it, expect } from "vitest";
import { createDiagnosticReportBuilder } from "@/core/builders/diagnostic-report.js";
import {
  DIAGNOSTIC_REPORT_CODES,
  DIAGNOSTIC_REPORT_CATEGORY_CODES,
  DIAGNOSTIC_REPORT_STATUS,
} from "@/core/data/diagnostic-report-codes.js";

const LOINC_CODES     = DIAGNOSTIC_REPORT_CODES.map((c) => c.code);
const CATEGORY_CODES  = DIAGNOSTIC_REPORT_CATEGORY_CODES.map((c) => c.code);
const LOINC_SYSTEM    = "http://loinc.org";
const V2_0074_SYSTEM  = "http://terminology.hl7.org/CodeSystem/v2-0074";

describe("DiagnosticReport structure", () => {
  it("has required top-level fields", () => {
    const [rpt] = createDiagnosticReportBuilder().seed(1).build();
    expect(rpt).toBeDefined();
    if (!rpt) return;

    expect(rpt["resourceType"]).toBe("DiagnosticReport");
    expect(typeof rpt["id"]).toBe("string");
    expect(typeof rpt["status"]).toBe("string");
    expect(typeof rpt["code"]).toBe("object");
    expect(Array.isArray(rpt["category"])).toBe(true);
  });

  it("status is from the defined value set", () => {
    const reports = createDiagnosticReportBuilder().seed(2).count(30).build();
    const validStatuses = new Set<string>([...DIAGNOSTIC_REPORT_STATUS]);
    for (const rpt of reports) {
      expect(validStatuses.has(rpt["status"] as string)).toBe(true);
    }
  });

  it("code is a CodeableConcept with a LOINC coding", () => {
    const reports = createDiagnosticReportBuilder().seed(3).count(20).build();
    for (const rpt of reports) {
      const code = rpt["code"] as Record<string, unknown>;
      expect(typeof code["text"]).toBe("string");
      const coding = (code["coding"] as Array<Record<string, unknown>>)[0]!;
      expect(coding["system"]).toBe(LOINC_SYSTEM);
      expect(LOINC_CODES).toContain(coding["code"]);
    }
  });

  it("category is an array with a HL7 v2-0074 coding", () => {
    const reports = createDiagnosticReportBuilder().seed(4).count(20).build();
    for (const rpt of reports) {
      const categories = rpt["category"] as Array<Record<string, unknown>>;
      expect(categories.length).toBeGreaterThan(0);
      const coding = (categories[0]!["coding"] as Array<Record<string, unknown>>)[0]!;
      expect(coding["system"]).toBe(V2_0074_SYSTEM);
      expect(CATEGORY_CODES).toContain(coding["code"]);
    }
  });

  it("category matches the code's expected category", () => {
    const reports = createDiagnosticReportBuilder().seed(5).count(30).build();
    for (const rpt of reports) {
      const codeCoding = ((rpt["code"] as Record<string, unknown>)["coding"] as Array<Record<string, unknown>>)[0]!;
      const loincCode  = DIAGNOSTIC_REPORT_CODES.find((c) => c.code === codeCoding["code"]);
      if (!loincCode) continue;
      const categoryCoding = ((rpt["category"] as Array<Record<string, unknown>>)[0]!["coding"] as Array<Record<string, unknown>>)[0]!;
      expect(categoryCoding["code"]).toBe(loincCode.category);
    }
  });

  it("id is a UUID v4 format", () => {
    const [rpt] = createDiagnosticReportBuilder().seed(6).build();
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    expect(UUID_RE.test(rpt!["id"] as string)).toBe(true);
  });

  it("effectiveDateTime is an ISO 8601 datetime string", () => {
    const reports = createDiagnosticReportBuilder().seed(7).count(10).build();
    const ISO_DT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+00:00$/;
    for (const rpt of reports) {
      expect(ISO_DT_RE.test(rpt["effectiveDateTime"] as string)).toBe(true);
    }
  });

  it("uses provided subject reference", () => {
    const [rpt] = createDiagnosticReportBuilder().seed(8).subject("Patient/abc-123").build();
    const subject = rpt!["subject"] as Record<string, unknown>;
    expect(subject["reference"]).toBe("Patient/abc-123");
  });

  it("has no subject by default", () => {
    const [rpt] = createDiagnosticReportBuilder().seed(9).build();
    expect(rpt!["subject"]).toBeUndefined();
  });
});

describe("DiagnosticReport determinism", () => {
  it("same seed produces identical output", () => {
    const a = createDiagnosticReportBuilder().seed(99).count(5).build();
    const b = createDiagnosticReportBuilder().seed(99).count(5).build();
    expect(a).toEqual(b);
  });

  it("different seeds produce different output", () => {
    const a = createDiagnosticReportBuilder().seed(1).count(5).build();
    const b = createDiagnosticReportBuilder().seed(2).count(5).build();
    expect(a).not.toEqual(b);
  });
});
