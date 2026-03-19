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
import { SUPPORTED_LOCALES, SUPPORTED_FHIR_VERSIONS } from "@/core/types.js";
import type { FhirVersion, Locale, FhirResource } from "@/core/types.js";
import { injectFaults, FAULT_TYPES } from "@/core/faults/index.js";
import type { FaultType } from "@/core/faults/index.js";
import { createRng } from "@/core/generators/rng.js";

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
// Output helpers
// ---------------------------------------------------------------------------

function formatIndex(i: number, total: number): string {
  const width = Math.max(3, String(total).length);
  return String(i + 1).padStart(width, "0");
}

function writeToOutput(
  resources: FhirResource[],
  resourceType: ConcreteResourceType,
  outputDir: string,
  format: string,
): void {
  mkdirSync(outputDir, { recursive: true });
  const fhirType = (resources[0]?.["resourceType"] as string | undefined) ?? resourceType;

  if (format === "ndjson") {
    const content = resources.map((r) => JSON.stringify(r)).join("\n") + "\n";
    const filePath = join(outputDir, `${fhirType}.ndjson`);
    writeFileSync(filePath, content, "utf8");
  } else {
    for (let i = 0; i < resources.length; i++) {
      const idx = formatIndex(i, resources.length);
      const filePath = join(outputDir, `${fhirType}-${idx}.json`);
      writeFileSync(filePath, JSON.stringify(resources[i], null, 2) + "\n", "utf8");
    }
  }

  process.stderr.write(
    `Generated ${resources.length} ${fhirType} resource${resources.length === 1 ? "" : "s"} in ${outputDir}\n`,
  );
}

function writeToStdout(resources: FhirResource[], format: string, pretty: boolean, forceCompact = false): void {
  if (format === "ndjson" || forceCompact) {
    // NDJSON output: always compact (pipe-safe). --pretty is a no-op for NDJSON stdout.
    for (const r of resources) {
      process.stdout.write(JSON.stringify(r) + "\n");
    }
  } else if (resources.length === 1) {
    const indent = pretty ? 2 : undefined;
    process.stdout.write(JSON.stringify(resources[0], null, indent) + "\n");
  } else {
    const indent = pretty ? 2 : undefined;
    process.stdout.write(JSON.stringify(resources, null, indent) + "\n");
  }
}

// ---------------------------------------------------------------------------
// Main action
// ---------------------------------------------------------------------------

function runGenerate(resourceType: string, opts: GenerateOptions): void {
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

  const locale = opts.locale as Locale;
  const fhirVersion = opts.fhirVersion as FhirVersion;
  const count = Number.parseInt(opts.count, 10);
  const seed =
    opts.seed !== undefined
      ? Number.parseInt(opts.seed, 10)
      : Math.floor(Math.random() * 0x7fffffff);
  const format = opts.format === "ndjson" ? "ndjson" : "json";

  const typesToGenerate: ConcreteResourceType[] =
    resourceType === "all" ? CONCRETE_RESOURCE_TYPES : [resourceType as ConcreteResourceType];

  for (const type of typesToGenerate) {
    let resources = BUILDER_FACTORIES[type](locale, count, seed, fhirVersion);

    if (faults.length > 0) {
      // Use a separate RNG for fault injection so it doesn't affect generation
      // reproducibility. Seed it deterministically from the main seed.
      const faultRng = createRng(seed + 1);
      resources = resources.map((r) => injectFaults(r, faults, faultRng));
    }

    if (opts.output !== undefined) {
      try {
        writeToOutput(resources, type, opts.output, format);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        process.stderr.write(`Error writing output: ${message}\n`);
        process.exit(2);
      }
    } else {
      writeToStdout(resources, format, opts.pretty, typesToGenerate.length > 1);
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
    .action(runGenerate);
}
