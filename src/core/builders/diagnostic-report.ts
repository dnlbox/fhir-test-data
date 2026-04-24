import type { FhirResource, FhirVersion, Locale } from "@/core/types.js";
import { createRng, pickRandom } from "@/core/generators/rng.js";
import { generateUuidV4, deepMerge, generateDateTime } from "./utils.js";
import {
  DIAGNOSTIC_REPORT_CODES,
  DIAGNOSTIC_REPORT_CATEGORY_CODES,
  DIAGNOSTIC_REPORT_STATUS,
} from "@/core/data/diagnostic-report-codes.js";
import type { RandomFn } from "@/core/types.js";
import { adaptToVersion } from "./version-adapters.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LOINC_SYSTEM    = "http://loinc.org";
const V2_0074_SYSTEM  = "http://terminology.hl7.org/CodeSystem/v2-0074";

// ---------------------------------------------------------------------------
// DiagnosticReport resource assembly
// ---------------------------------------------------------------------------

function buildDiagnosticReport(rng: RandomFn): FhirResource {
  const reportCode = pickRandom(DIAGNOSTIC_REPORT_CODES, rng);
  const status     = pickRandom([...DIAGNOSTIC_REPORT_STATUS], rng);

  // Match category to the selected report code for internal consistency.
  const matchedCategory = DIAGNOSTIC_REPORT_CATEGORY_CODES.find(
    (c) => c.code === reportCode.category,
  ) ?? DIAGNOSTIC_REPORT_CATEGORY_CODES[0]!;

  return {
    resourceType: "DiagnosticReport",
    id: generateUuidV4(rng),
    status,
    category: [
      {
        coding: [
          {
            system: V2_0074_SYSTEM,
            code: matchedCategory.code,
            display: matchedCategory.display,
          },
        ],
      },
    ],
    code: {
      coding: [{ system: LOINC_SYSTEM, code: reportCode.code, display: reportCode.display }],
      text: reportCode.display,
    },
    effectiveDateTime: generateDateTime(2020, 2025, rng),
  };
}

// ---------------------------------------------------------------------------
// DiagnosticReportBuilder
// ---------------------------------------------------------------------------

export interface DiagnosticReportBuilder {
  locale(locale: Locale): DiagnosticReportBuilder;
  count(count: number): DiagnosticReportBuilder;
  seed(seed: number): DiagnosticReportBuilder;
  subject(patientReference: string): DiagnosticReportBuilder;
  fhirVersion(version: FhirVersion): DiagnosticReportBuilder;
  overrides(overrides: Record<string, unknown>): DiagnosticReportBuilder;
  build(): FhirResource[];
}

interface DiagnosticReportBuilderState {
  locale: Locale;
  count: number;
  seed: number;
  fhirVersion: FhirVersion;
  subjectRef: string | undefined;
  overrideMap: Record<string, unknown>;
}

function makeBuilder(state: DiagnosticReportBuilderState): DiagnosticReportBuilder {
  return {
    locale(loc: Locale): DiagnosticReportBuilder {
      return makeBuilder({ ...state, locale: loc });
    },
    count(n: number): DiagnosticReportBuilder {
      return makeBuilder({ ...state, count: n });
    },
    seed(s: number): DiagnosticReportBuilder {
      return makeBuilder({ ...state, seed: s });
    },
    subject(ref: string): DiagnosticReportBuilder {
      return makeBuilder({ ...state, subjectRef: ref });
    },
    fhirVersion(v: FhirVersion): DiagnosticReportBuilder {
      return makeBuilder({ ...state, fhirVersion: v });
    },
    overrides(o: Record<string, unknown>): DiagnosticReportBuilder {
      return makeBuilder({ ...state, overrideMap: o });
    },
    build(): FhirResource[] {
      const rng = createRng(state.seed);
      const results: FhirResource[] = [];
      for (let i = 0; i < state.count; i++) {
        const report = buildDiagnosticReport(rng);
        const withSubject: Record<string, unknown> = {
          ...(report as Record<string, unknown>),
          ...(state.subjectRef !== undefined
            ? { subject: { reference: state.subjectRef } }
            : {}),
        };
        const adapted = adaptToVersion(withSubject as FhirResource, state.fhirVersion);
        if (Object.keys(state.overrideMap).length > 0) {
          results.push(deepMerge(adapted as Record<string, unknown>, state.overrideMap) as FhirResource);
        } else {
          results.push(adapted);
        }
      }
      return results;
    },
  };
}

/** Create a new DiagnosticReportBuilder with default options. */
export function createDiagnosticReportBuilder(): DiagnosticReportBuilder {
  return makeBuilder({
    locale: "us",
    count: 1,
    seed: 0,
    fhirVersion: "R4",
    subjectRef: undefined,
    overrideMap: {},
  });
}
