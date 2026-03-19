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
import { createBundleBuilder } from "@/core/builders/bundle.js";
import { SUPPORTED_LOCALES } from "@/core/types.js";
import type { Locale, FhirResource } from "@/core/types.js";

// ---------------------------------------------------------------------------
// Resource type → builder factory
// ---------------------------------------------------------------------------

type ResourceType =
  | "patient"
  | "practitioner"
  | "organization"
  | "observation"
  | "condition"
  | "allergy-intolerance"
  | "medication-statement"
  | "bundle"
  | "all";

const RESOURCE_TYPES: ResourceType[] = [
  "patient",
  "practitioner",
  "organization",
  "observation",
  "condition",
  "allergy-intolerance",
  "medication-statement",
  "bundle",
  "all",
];

interface GenerateOptions {
  locale: string;
  count: string;
  seed?: string;
  output?: string;
  format: string;
  pretty: boolean;
}

function buildResources(
  resourceType: Exclude<ResourceType, "all">,
  locale: Locale,
  count: number,
  seed: number,
): FhirResource[] {
  switch (resourceType) {
    case "patient":
      return createPatientBuilder().locale(locale).count(count).seed(seed).build();
    case "practitioner":
      return createPractitionerBuilder().locale(locale).count(count).seed(seed).build();
    case "organization":
      return createOrganizationBuilder().locale(locale).count(count).seed(seed).build();
    case "observation":
      return createObservationBuilder().locale(locale).count(count).seed(seed).build();
    case "condition":
      return createConditionBuilder().locale(locale).count(count).seed(seed).build();
    case "allergy-intolerance":
      return createAllergyIntoleranceBuilder().locale(locale).count(count).seed(seed).build();
    case "medication-statement":
      return createMedicationStatementBuilder().locale(locale).count(count).seed(seed).build();
    case "bundle":
      return createBundleBuilder().locale(locale).count(count).seed(seed).build();
  }
}

function formatIndex(i: number, total: number): string {
  const width = Math.max(3, String(total).length);
  return String(i + 1).padStart(width, "0");
}

function writeToOutput(
  resources: FhirResource[],
  resourceType: Exclude<ResourceType, "all">,
  outputDir: string,
  format: string,
): void {
  mkdirSync(outputDir, { recursive: true });
  const fhirType = resources[0]?.["resourceType"] as string | undefined ?? resourceType;

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

  process.stderr.write(`Generated ${resources.length} ${fhirType} resource${resources.length === 1 ? "" : "s"} in ${outputDir}\n`);
}

function writeToStdout(resources: FhirResource[], format: string, pretty: boolean): void {
  if (format === "ndjson") {
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

function runGenerate(resourceType: string, opts: GenerateOptions): void {
  // Validate resource type
  if (!RESOURCE_TYPES.includes(resourceType as ResourceType)) {
    process.stderr.write(
      `Error: unknown resource type "${resourceType}". Valid types: ${RESOURCE_TYPES.join(", ")}\n`,
    );
    process.exit(1);
  }

  // Validate locale
  if (!SUPPORTED_LOCALES.includes(opts.locale as Locale)) {
    process.stderr.write(
      `Error: unknown locale "${opts.locale}". Supported locales: ${SUPPORTED_LOCALES.join(", ")}\n`,
    );
    process.exit(1);
  }

  const locale = opts.locale as Locale;
  const count = Number.parseInt(opts.count, 10);
  const seed = opts.seed !== undefined ? Number.parseInt(opts.seed, 10) : Math.floor(Math.random() * 0x7fffffff);
  const format = opts.format === "ndjson" ? "ndjson" : "json";

  const typesToGenerate: Exclude<ResourceType, "all">[] = resourceType === "all"
    ? [
        "patient",
        "practitioner",
        "organization",
        "observation",
        "condition",
        "allergy-intolerance",
        "medication-statement",
        "bundle",
      ]
    : [resourceType as Exclude<ResourceType, "all">];

  for (const type of typesToGenerate) {
    const resources = buildResources(type, locale, count, seed);

    if (opts.output !== undefined) {
      try {
        writeToOutput(resources, type, opts.output, format);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        process.stderr.write(`Error writing output: ${message}\n`);
        process.exit(2);
      }
    } else {
      writeToStdout(resources, format, opts.pretty);
    }
  }
}

export function registerGenerateCommand(program: Command): void {
  program
    .command("generate <resource-type>")
    .description(
      `Generate FHIR resources. Resource types: ${RESOURCE_TYPES.join(", ")}`,
    )
    .option("--locale <code>", "locale for identifiers and addresses", "us")
    .option("--count <n>", "number of resources to generate", "1")
    .option("--seed <n>", "seed for deterministic output")
    .option("--output <dir>", "output directory (one file per resource)")
    .option("--format <fmt>", "output format: json | ndjson", "json")
    .option("--pretty", "pretty-print JSON (default for stdout)", true)
    .option("--no-pretty", "compact JSON output")
    .action(runGenerate);
}
