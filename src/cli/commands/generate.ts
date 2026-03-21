import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Command } from "commander";
import { createPatientBuilder } from "@/core/builders/patient.js";
import { createPractitionerBuilder } from "@/core/builders/practitioner.js";
import { createOrganizationBuilder } from "@/core/builders/organization.js";
import { createObservationBuilder } from "@/core/builders/observation.js";
import { createConditionBuilder } from "@/core/builders/condition.js";
import { createAllergyIntoleranceBuilder } from "@/core/builders/allergy-intolerance.js";
import { createMedicationStatementBuilder } from "@/core/builders/medication-statement.js";
import { createPractitionerRoleBuilder } from "@/core/builders/practitioner-role.js";
import { createBundleBuilder } from "@/core/builders/bundle.js";
import { deepMerge } from "@/core/builders/utils.js";
import { SUPPORTED_LOCALES, SUPPORTED_FHIR_VERSIONS } from "@/core/types.js";
import type { FhirVersion, Locale, FhirResource, AnnotatedResource } from "@/core/types.js";
import { injectFaults, FAULT_TYPES } from "@/core/faults/index.js";
import type { FaultType } from "@/core/faults/index.js";
import { createRng } from "@/core/generators/rng.js";
import { annotateResource } from "@/core/annotations/index.js";
import { getLocale } from "@/locales/index.js";

// ---------------------------------------------------------------------------
// Resource type → builder factory (lookup table replaces switch)
// ---------------------------------------------------------------------------

type ResourceType =
  | "patient"
  | "practitioner"
  | "practitioner-role"
  | "organization"
  | "observation"
  | "condition"
  | "allergy-intolerance"
  | "medication-statement"
  | "bundle"
  | "all";

type ConcreteResourceType = Exclude<ResourceType, "all">;

const BUILDER_FACTORIES: Record<
  ConcreteResourceType,
  (locale: Locale, count: number, seed: number, fhirVersion: FhirVersion) => FhirResource[]
> = {
  patient:               (l, c, s, v) => createPatientBuilder().locale(l).count(c).seed(s).fhirVersion(v).build(),
  practitioner:          (l, c, s, v) => createPractitionerBuilder().locale(l).count(c).seed(s).fhirVersion(v).build(),
  "practitioner-role":   (l, c, s, v) => createPractitionerRoleBuilder().locale(l).count(c).seed(s).fhirVersion(v).build(),
  organization:          (l, c, s, v) => createOrganizationBuilder().locale(l).count(c).seed(s).fhirVersion(v).build(),
  observation:           (l, c, s, v) => createObservationBuilder().locale(l).count(c).seed(s).fhirVersion(v).build(),
  condition:             (l, c, s, v) => createConditionBuilder().locale(l).count(c).seed(s).fhirVersion(v).build(),
  "allergy-intolerance": (l, c, s, v) => createAllergyIntoleranceBuilder().locale(l).count(c).seed(s).fhirVersion(v).build(),
  "medication-statement":(l, c, s, v) => createMedicationStatementBuilder().locale(l).count(c).seed(s).fhirVersion(v).build(),
  bundle:                (l, c, s, v) => createBundleBuilder().locale(l).count(c).seed(s).fhirVersion(v).build(),
};

const CONCRETE_RESOURCE_TYPES = Object.keys(BUILDER_FACTORIES) as ConcreteResourceType[];
const ALL_RESOURCE_TYPES: ResourceType[] = [...CONCRETE_RESOURCE_TYPES, "all"];

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

interface GenerateOptions {
  locale: string;
  count: string;
  seed?: string;
  fhirVersion: string;
  output?: string;
  format: string;
  pretty: boolean;
  faults?: string;
  overrides?: string;
  annotate: boolean;
}

// ---------------------------------------------------------------------------
// Fault parsing
// ---------------------------------------------------------------------------

function parseFaults(raw: string): FaultType[] | { error: string } {
  const types = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const invalid = types.filter((t) => !FAULT_TYPES.includes(t as FaultType));
  if (invalid.length > 0) {
    return {
      error: `Unknown fault type(s): ${invalid.join(", ")}. Valid types: ${FAULT_TYPES.join(", ")}`,
    };
  }
  return types as FaultType[];
}

// ---------------------------------------------------------------------------
// stdin overrides
// ---------------------------------------------------------------------------

/**
 * Read stdin to completion and parse as JSON.
 * Returns null if stdin is a TTY (interactive), empty, or not present.
 * Rejects if the data is present but not valid JSON.
 */
async function readStdinOverrides(): Promise<Record<string, unknown> | null> {
  if (process.stdin.isTTY) return null;
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk: string) => {
      data += chunk;
    });
    process.stdin.on("end", () => {
      if (!data.trim()) {
        resolve(null);
        return;
      }
      try {
        const parsed = JSON.parse(data) as Record<string, unknown>;
        resolve(parsed);
      } catch {
        reject(
          new Error(
            `stdin is not valid JSON. Received: ${data.slice(0, 120)}${data.length > 120 ? "…" : ""}`,
          ),
        );
      }
    });
    process.stdin.on("error", reject);
  });
}

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

function formatIndex(i: number, total: number): string {
  const width = Math.max(3, String(total).length);
  return String(i + 1).padStart(width, "0");
}

type OutputUnit = FhirResource | AnnotatedResource;

function writeToOutput(
  units: OutputUnit[],
  resourceType: ConcreteResourceType,
  outputDir: string,
  format: string,
  annotate: boolean,
): void {
  mkdirSync(outputDir, { recursive: true });

  // Derive file-name prefix from the actual FHIR resourceType when available.
  const firstResource = annotate
    ? (units[0] as AnnotatedResource | undefined)?.resource
    : (units[0] as FhirResource | undefined);
  const fhirType = (firstResource?.["resourceType"] as string | undefined) ?? resourceType;

  if (format === "ndjson") {
    const content = units.map((u) => JSON.stringify(u)).join("\n") + "\n";
    const filePath = join(outputDir, `${fhirType}.ndjson`);
    writeFileSync(filePath, content, "utf8");
  } else {
    for (let i = 0; i < units.length; i++) {
      const idx = formatIndex(i, units.length);
      const filePath = join(outputDir, `${fhirType}-${idx}.json`);
      writeFileSync(filePath, JSON.stringify(units[i], null, 2) + "\n", "utf8");
    }
  }

  process.stderr.write(
    `Generated ${units.length} ${fhirType} resource${units.length === 1 ? "" : "s"} in ${outputDir}\n`,
  );
}

function writeToStdout(
  units: OutputUnit[],
  format: string,
  pretty: boolean,
  forceCompact = false,
): void {
  if (format === "ndjson" || forceCompact) {
    // NDJSON output: always compact (pipe-safe). --pretty is a no-op for NDJSON stdout.
    for (const u of units) {
      process.stdout.write(JSON.stringify(u) + "\n");
    }
  } else if (units.length === 1) {
    const indent = pretty ? 2 : undefined;
    process.stdout.write(JSON.stringify(units[0], null, indent) + "\n");
  } else {
    const indent = pretty ? 2 : undefined;
    process.stdout.write(JSON.stringify(units, null, indent) + "\n");
  }
}

// ---------------------------------------------------------------------------
// Main action
// ---------------------------------------------------------------------------

async function runGenerate(resourceType: string, opts: GenerateOptions): Promise<void> {
  if (!ALL_RESOURCE_TYPES.includes(resourceType as ResourceType)) {
    process.stderr.write(
      `Error: unknown resource type "${resourceType}". Valid types: ${ALL_RESOURCE_TYPES.join(", ")}\n`,
    );
    process.exit(1);
  }

  if (!SUPPORTED_LOCALES.includes(opts.locale as Locale)) {
    process.stderr.write(
      `Error: unknown locale "${opts.locale}". Supported locales: ${SUPPORTED_LOCALES.join(", ")}\n`,
    );
    process.exit(1);
  }

  if (!SUPPORTED_FHIR_VERSIONS.includes(opts.fhirVersion as FhirVersion)) {
    process.stderr.write(
      `Error: unknown FHIR version "${opts.fhirVersion}". Supported versions: ${SUPPORTED_FHIR_VERSIONS.join(", ")}\n`,
    );
    process.exit(1);
  }

  // Parse faults before doing any work.
  let faults: FaultType[] = [];
  if (opts.faults !== undefined) {
    const parsed = parseFaults(opts.faults);
    if ("error" in parsed) {
      process.stderr.write(`Error: ${parsed.error}\n`);
      process.exit(1);
    }
    faults = parsed;
  }

  // ---------------------------------------------------------------------------
  // Resolve overrides: stdin (base) deep-merged with --overrides flag (wins on conflict)
  // ---------------------------------------------------------------------------

  let overridesObj: Record<string, unknown> = {};

  try {
    const stdinOverrides = await readStdinOverrides();
    if (stdinOverrides !== null) {
      overridesObj = stdinOverrides;
    }
  } catch (err: unknown) {
    process.stderr.write(`Error: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  }

  if (opts.overrides !== undefined) {
    try {
      const cliOverrides = JSON.parse(opts.overrides) as Record<string, unknown>;
      overridesObj = deepMerge(overridesObj, cliOverrides) as Record<string, unknown>;
    } catch {
      process.stderr.write(
        `Error: --overrides value is not valid JSON. Received: ${opts.overrides.slice(0, 120)}\n`,
      );
      process.exit(1);
    }
  }

  const hasOverrides = Object.keys(overridesObj).length > 0;

  // ---------------------------------------------------------------------------
  // Build resources
  // ---------------------------------------------------------------------------

  const locale = opts.locale as Locale;
  const fhirVersion = opts.fhirVersion as FhirVersion;
  const count = Number.parseInt(opts.count, 10);

  // Validate --count: must be a positive integer (≥ 1).
  const countRaw = opts.count;
  if (!Number.isInteger(count) || count < 1) {
    // Quote the raw value when it is not a recognisable number (e.g. "abc"); leave numeric
    // values (including negatives like -1 and zero) unquoted so the message matches spec.
    const isNumericLiteral = /^-?\d+$/.test(countRaw);
    const display = isNumericLiteral ? countRaw : `"${countRaw}"`;
    process.stderr.write(`Error: --count must be a positive integer, got ${display}\n`);
    process.exit(1);
  }

  const seed =
    opts.seed !== undefined
      ? Number.parseInt(opts.seed, 10)
      : Math.floor(Math.random() * 0x7fffffff);
  const format = opts.format === "ndjson" ? "ndjson" : "json";
  const localeDefinition = getLocale(locale);

  const typesToGenerate: ConcreteResourceType[] =
    resourceType === "all" ? CONCRETE_RESOURCE_TYPES : [resourceType as ConcreteResourceType];

  // Pre-build Practitioner and Organization when running "generate all" so that
  // PractitionerRole references the exact same IDs already in the output.
  let coordinatedPractId: string | undefined;
  let coordinatedOrgId: string | undefined;
  if (resourceType === "all") {
    const [firstPract] = BUILDER_FACTORIES["practitioner"](locale, count, seed, fhirVersion);
    const [firstOrg] = BUILDER_FACTORIES["organization"](locale, count, seed, fhirVersion);
    coordinatedPractId = firstPract?.["id"] as string | undefined;
    coordinatedOrgId = firstOrg?.["id"] as string | undefined;
  }

  for (const type of typesToGenerate) {
    let resources: FhirResource[];
    if (
      type === "practitioner-role" &&
      coordinatedPractId !== undefined &&
      coordinatedOrgId !== undefined
    ) {
      resources = createPractitionerRoleBuilder()
        .locale(locale)
        .count(count)
        .seed(seed)
        .fhirVersion(fhirVersion)
        .practitionerId(coordinatedPractId)
        .organizationId(coordinatedOrgId)
        .build();
    } else {
      resources = BUILDER_FACTORIES[type](locale, count, seed, fhirVersion);
    }

    if (faults.length > 0) {
      // Use a separate RNG for fault injection so it doesn't affect generation
      // reproducibility. Seed it deterministically from the main seed.
      const faultRng = createRng(seed + 1);
      resources = resources.map((r) => injectFaults(r, faults, faultRng));
    }

    // Apply overrides (stdin + --overrides flag) to every resource.
    if (hasOverrides) {
      resources = resources.map(
        (r) => deepMerge(r as Record<string, unknown>, overridesObj) as FhirResource,
      );
    }

    // Wrap in annotations if requested.
    const units: OutputUnit[] = opts.annotate
      ? resources.map((r) => ({
          resource: r,
          notes: annotateResource(r, localeDefinition),
        }))
      : resources;

    // Emit a TTY hint when --annotate is used and stdout is interactive (not piped).
    // The hint goes to stderr only — it must never appear in piped output.
    if (opts.annotate && process.stdout.isTTY) {
      process.stderr.write(
        "Note: --annotate wraps each resource. To validate, pipe through jq '.resource' first.\n" +
        "  fhir-test-data generate patient --annotate | jq '.resource' | fhir-resource-diff validate -\n",
      );
    }

    if (opts.output !== undefined) {
      try {
        writeToOutput(units, type, opts.output, format, opts.annotate);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        process.stderr.write(`Error writing output: ${message}\n`);
        process.exit(2);
      }
    } else {
      writeToStdout(units, format, opts.pretty, typesToGenerate.length > 1);
    }
  }
}

export function registerGenerateCommand(program: Command): void {
  program
    .command("generate <resource-type>")
    .description(`Generate FHIR resources. Resource types: ${ALL_RESOURCE_TYPES.join(", ")}`)
    .option("--locale <code>", "locale for identifiers and addresses", "us")
    .option("--count <n>", "number of resources to generate", "1")
    .option("--seed <n>", "seed for deterministic output")
    .option(
      "--fhir-version <version>",
      `FHIR version to target: ${SUPPORTED_FHIR_VERSIONS.join(" | ")}`,
      "R4",
    )
    .option("--output <dir>", "output directory (one file per resource)")
    .option("--format <fmt>", "output format: json | ndjson", "json")
    .option("--pretty", "pretty-print JSON (default for stdout)", true)
    .option("--no-pretty", "compact JSON output")
    .option(
      "--faults <types>",
      `comma-separated fault types to inject. Valid: ${FAULT_TYPES.join(", ")}`,
    )
    .option(
      "--overrides <json>",
      "JSON object to deep-merge into every generated resource (also readable from stdin)",
    )
    .option(
      "--annotate",
      "wrap each resource in { resource, notes } — notes explain each field in plain language. " +
      "Piping to fhir-resource-diff validate requires extracting .resource first: " +
      "| jq '.resource' | fhir-resource-diff validate -",
      false,
    )
    .action(runGenerate);
}
