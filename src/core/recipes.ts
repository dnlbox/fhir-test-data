import type { FhirResource, FhirVersion, Locale, RandomFn } from "@/core/types.js";
import {
  SUPPORTED_FHIR_VERSIONS,
  SUPPORTED_LOCALES,
} from "@/core/types.js";
import { createRng } from "@/core/generators/rng.js";
import { createAllergyIntoleranceBuilder } from "@/core/builders/allergy-intolerance.js";
import { createConditionBuilder } from "@/core/builders/condition.js";
import { createDiagnosticReportBuilder } from "@/core/builders/diagnostic-report.js";
import { createEncounterBuilder } from "@/core/builders/encounter.js";
import { createMedicationStatementBuilder } from "@/core/builders/medication-statement.js";
import { createObservationBuilder } from "@/core/builders/observation.js";
import { createOrganizationBuilder } from "@/core/builders/organization.js";
import { createPatientBuilder } from "@/core/builders/patient.js";
import { createPractitionerBuilder } from "@/core/builders/practitioner.js";
import { createPractitionerRoleBuilder } from "@/core/builders/practitioner-role.js";
import type { BundleType } from "@/core/builders/bundle.js";
import { deepMerge, generateUuidV4 } from "@/core/builders/utils.js";

export const RECIPE_RESOURCE_TYPES = [
  "Patient",
  "Practitioner",
  "PractitionerRole",
  "Organization",
  "Observation",
  "Condition",
  "AllergyIntolerance",
  "MedicationStatement",
  "Encounter",
  "DiagnosticReport",
] as const;

export type RecipeResourceType = (typeof RECIPE_RESOURCE_TYPES)[number];

export interface BundleRecipeResource {
  /** Existing builder resource type to generate. */
  type: RecipeResourceType;
  /** User-facing alias used by other recipe fields to reference this resource. */
  id: string;
  /** Number of resources to generate for this recipe entry. */
  count?: number;
  /** Fields deep-merged into generated resources after builder defaults. */
  fields?: Record<string, unknown>;
}

export interface BundleRecipe {
  /** Human-readable recipe name for diagnostics and documentation. */
  name: string;
  /** Default locale for generated identifiers, names, and addresses. */
  locale?: Locale;
  /** Default FHIR version for generated resources. */
  fhirVersion?: FhirVersion;
  /** Bundle-level generation options. */
  bundle?: {
    type?: BundleType;
  };
  /** Ordered resource recipe entries. Later entries can reference earlier aliases. */
  resources: BundleRecipeResource[];
}

export interface BundleRecipeOptions {
  /** Seed for deterministic generation. Same seed and recipe produce identical output. */
  seed?: number;
  /** Overrides recipe.locale when provided. */
  locale?: Locale;
  /** Overrides recipe.fhirVersion when provided. */
  fhirVersion?: FhirVersion;
  /** Number of Bundles to generate. */
  count?: number;
}

interface RecipeTarget {
  resourceType: string;
  id: string;
  reference: string;
}

interface BuiltRecipeResource {
  resource: FhirResource;
  fields: Record<string, unknown>;
}

interface RecipeReferenceContext {
  registry: Map<string, RecipeTarget[]>;
  field: string;
}

type FieldResolver = (value: unknown, context: RecipeReferenceContext) => unknown;
interface ConfigurableResourceBuilder {
  locale(locale: Locale): ConfigurableResourceBuilder;
  fhirVersion(version: FhirVersion): ConfigurableResourceBuilder;
  count(count: number): ConfigurableResourceBuilder;
  seed(seed: number): ConfigurableResourceBuilder;
  build(): FhirResource[];
}

const BUNDLE_TYPES = ["transaction", "document", "collection", "searchset"] as const;
const SINGLE_REFERENCE_FIELDS = [
  "subject",
  "patient",
  "encounter",
  "managingOrganization",
  "organization",
  "practitioner",
  "recorder",
  "asserter",
  "custodian",
] as const;
const ARRAY_REFERENCE_FIELDS = ["performer", "result", "basedOn", "generalPractitioner"] as const;

/** Error thrown when a user-supplied Bundle recipe is invalid or cannot be resolved. */
export class BundleRecipeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BundleRecipeError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertLocale(locale: unknown, source: string): asserts locale is Locale {
  if (!SUPPORTED_LOCALES.includes(locale as Locale)) {
    throw new BundleRecipeError(`${source} must be one of: ${SUPPORTED_LOCALES.join(", ")}`);
  }
}

function assertFhirVersion(version: unknown, source: string): asserts version is FhirVersion {
  if (!SUPPORTED_FHIR_VERSIONS.includes(version as FhirVersion)) {
    throw new BundleRecipeError(`${source} must be one of: ${SUPPORTED_FHIR_VERSIONS.join(", ")}`);
  }
}

function assertPositiveInteger(value: unknown, source: string): asserts value is number {
  if (!Number.isInteger(value) || (value as number) < 1) {
    throw new BundleRecipeError(`${source} must be a positive integer`);
  }
}

function assertNonEmptyString(value: unknown, source: string): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new BundleRecipeError(`${source} must be a non-empty string`);
  }
}

function assertBundleType(value: unknown): asserts value is BundleType {
  if (!BUNDLE_TYPES.includes(value as BundleType)) {
    throw new BundleRecipeError(`bundle.type must be one of: ${BUNDLE_TYPES.join(", ")}`);
  }
}

function nextSeed(rng: RandomFn): number {
  return Math.floor(rng() * 0x7fffffff);
}

function assertRecipeEnvelope(recipe: BundleRecipe): void {
  if (!isRecord(recipe)) throw new BundleRecipeError("recipe must be an object");
  assertNonEmptyString(recipe.name, "recipe.name");
  if (recipe.locale !== undefined) assertLocale(recipe.locale, "recipe.locale");
  if (recipe.fhirVersion !== undefined) assertFhirVersion(recipe.fhirVersion, "recipe.fhirVersion");
  if (recipe.bundle?.type !== undefined) assertBundleType(recipe.bundle.type);
  if (!Array.isArray(recipe.resources) || recipe.resources.length === 0) {
    throw new BundleRecipeError("recipe.resources must be a non-empty array");
  }
}

function assertRecipeResourceType(type: unknown, source: string): asserts type is RecipeResourceType {
  if (RECIPE_RESOURCE_TYPES.includes(type as RecipeResourceType)) return;
  throw new BundleRecipeError(`${source} must be one of: ${RECIPE_RESOURCE_TYPES.join(", ")}`);
}

function assertUniqueAlias(alias: string, aliases: Set<string>): void {
  if (aliases.has(alias)) throw new BundleRecipeError(`duplicate resource alias: ${alias}`);
  aliases.add(alias);
}

function assertRecipeFields(fields: unknown, source: string): asserts fields is Record<string, unknown> | undefined {
  if (fields === undefined || isRecord(fields)) return;
  throw new BundleRecipeError(`${source} must be an object`);
}

function assertCountDoesNotConflictWithIdOverride(item: BundleRecipeResource, index: number): void {
  if (item.count !== undefined && item.count > 1 && typeof item.fields?.["id"] === "string") {
    throw new BundleRecipeError(`resources[${index}].fields.id cannot be used when count is greater than 1`);
  }
}

function validateRecipeResource(item: BundleRecipeResource, index: number, aliases: Set<string>): void {
  if (!isRecord(item)) throw new BundleRecipeError(`resources[${index}] must be an object`);
  assertRecipeResourceType(item.type, `resources[${index}].type`);
  assertNonEmptyString(item.id, `resources[${index}].id`);
  assertUniqueAlias(item.id, aliases);
  if (item.count !== undefined) assertPositiveInteger(item.count, `resources[${index}].count`);
  assertRecipeFields(item.fields, `resources[${index}].fields`);
  assertCountDoesNotConflictWithIdOverride(item, index);
}

function validateRecipe(recipe: BundleRecipe): void {
  assertRecipeEnvelope(recipe);
  const aliases = new Set<string>();
  recipe.resources.forEach((item, index) => validateRecipeResource(item, index, aliases));
}

function bundleRequestFields(resource: FhirResource, bundleType: BundleType): Record<string, unknown> {
  const resourceType = resource["resourceType"] as string;
  const requestByType: Partial<Record<BundleType, Record<string, unknown>>> = {
    transaction: { request: { method: "POST", url: resourceType } },
    searchset: { search: { mode: "match" } },
  };
  return requestByType[bundleType] ?? {};
}

function makeEntry(resource: FhirResource, bundleType: BundleType): Record<string, unknown> {
  const id = resource["id"] as string;
  return {
    fullUrl: `urn:uuid:${id}`,
    resource,
    ...bundleRequestFields(resource, bundleType),
  };
}

function buildConfiguredResources(
  builder: ConfigurableResourceBuilder,
  locale: Locale,
  fhirVersion: FhirVersion,
  count: number,
  seed: number,
): FhirResource[] {
  return builder.locale(locale).fhirVersion(fhirVersion).count(count).seed(seed).build();
}

const RESOURCE_BUILDERS: Record<RecipeResourceType, () => ConfigurableResourceBuilder> = {
  Patient: createPatientBuilder,
  Practitioner: createPractitionerBuilder,
  PractitionerRole: createPractitionerRoleBuilder,
  Organization: createOrganizationBuilder,
  Observation: createObservationBuilder,
  Condition: createConditionBuilder,
  AllergyIntolerance: createAllergyIntoleranceBuilder,
  MedicationStatement: createMedicationStatementBuilder,
  Encounter: createEncounterBuilder,
  DiagnosticReport: createDiagnosticReportBuilder,
};

function buildResource(
  type: RecipeResourceType,
  locale: Locale,
  fhirVersion: FhirVersion,
  count: number,
  seed: number,
): FhirResource[] {
  return buildConfiguredResources(RESOURCE_BUILDERS[type](), locale, fhirVersion, count, seed);
}

function makeTarget(resource: FhirResource): RecipeTarget {
  const resourceType = resource["resourceType"];
  const id = resource["id"];
  if (typeof resourceType !== "string" || typeof id !== "string") {
    throw new BundleRecipeError("generated recipe resource is missing resourceType or id");
  }
  return {
    resourceType,
    id,
    reference: `${resourceType}/${id}`,
  };
}

function registerAlias(
  registry: Map<string, RecipeTarget[]>,
  alias: string,
  targets: RecipeTarget[],
): void {
  registry.set(alias, targets);
  if (targets.length > 1) {
    for (const [index, target] of targets.entries()) {
      registry.set(`${alias}[${index}]`, [target]);
    }
  }
}

function literalTarget(reference: string): RecipeTarget {
  return { resourceType: "", id: "", reference };
}

function isLiteralReference(value: string): boolean {
  return value.includes("/") || value.startsWith("urn:");
}

function targetsForAlias(registry: Map<string, RecipeTarget[]>, alias: string, field: string): RecipeTarget[] {
  const targets = registry.get(alias);
  if (targets !== undefined) return targets;
  if (isLiteralReference(alias)) return [literalTarget(alias)];
  throw new BundleRecipeError(`unknown reference alias "${alias}" in field "${field}"`);
}

function targetForSingleReference(registry: Map<string, RecipeTarget[]>, alias: string, field: string): RecipeTarget {
  const targets = targetsForAlias(registry, alias, field);
  if (targets.length !== 1) {
    throw new BundleRecipeError(`reference alias "${alias}" in field "${field}" resolves to multiple resources`);
  }
  return targets[0]!;
}

function referenceObject(target: RecipeTarget): Record<string, unknown> {
  return { reference: target.reference };
}

function singleReference(value: unknown, { field, registry }: RecipeReferenceContext): unknown {
  return typeof value === "string"
    ? referenceObject(targetForSingleReference(registry, value, field))
    : resolveRecipeValue(value, registry);
}

function referenceString(value: unknown, { field, registry }: RecipeReferenceContext): unknown {
  return typeof value === "string"
    ? targetForSingleReference(registry, value, field).reference
    : resolveRecipeValue(value, registry);
}

function referenceArray(value: unknown, { field, registry }: RecipeReferenceContext): unknown {
  const toReferences = (alias: string): Record<string, unknown>[] =>
    targetsForAlias(registry, alias, field).map(referenceObject);

  if (typeof value === "string") return toReferences(value);
  if (Array.isArray(value)) {
    return value.flatMap((item) =>
      typeof item === "string" ? toReferences(item) : [resolveRecipeValue(item, registry)],
    );
  }
  return resolveRecipeValue(value, registry);
}

const FIELD_RESOLVERS: Record<string, FieldResolver> = Object.fromEntries([
  ...SINGLE_REFERENCE_FIELDS.map((field) => [field, singleReference] as const),
  ...ARRAY_REFERENCE_FIELDS.map((field) => [field, referenceArray] as const),
  ["reference", referenceString],
]);

function resolveRecipeField(field: string, value: unknown, registry: Map<string, RecipeTarget[]>): unknown {
  const resolver = FIELD_RESOLVERS[field];
  return resolver === undefined
    ? resolveRecipeValue(value, registry)
    : resolver(value, { field, registry });
}

function resolveRecipeValue(value: unknown, registry: Map<string, RecipeTarget[]>): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => resolveRecipeValue(item, registry));
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([field, nested]) => [field, resolveRecipeField(field, nested, registry)]),
    );
  }

  return value;
}

function buildSingleBundleFromRecipe(
  recipe: BundleRecipe,
  locale: Locale,
  fhirVersion: FhirVersion,
  bundleType: BundleType,
  seed: number,
): FhirResource {
  const rng = createRng(seed);
  const built: BuiltRecipeResource[] = [];
  const registry = new Map<string, RecipeTarget[]>();

  for (const item of recipe.resources) {
    const count = item.count ?? 1;
    const resources = buildResource(item.type, locale, fhirVersion, count, nextSeed(rng));
    const fields = item.fields ?? {};
    const targets: RecipeTarget[] = [];

    for (const resource of resources) {
      const resourceWithId = typeof fields["id"] === "string"
        ? { ...resource, id: fields["id"] }
        : resource;
      targets.push(makeTarget(resourceWithId));
      built.push({ resource, fields });
    }

    registerAlias(registry, item.id, targets);
  }

  const entries = built.map(({ resource, fields }) => {
    const resolvedFields = resolveRecipeValue(fields, registry);
    const merged = deepMerge(resource as Record<string, unknown>, resolvedFields as Record<string, unknown>) as FhirResource;
    return makeEntry(merged, bundleType);
  });

  return {
    resourceType: "Bundle",
    id: generateUuidV4(rng),
    type: bundleType,
    entry: entries,
  };
}

/** Generate deterministic FHIR Bundle resources from a user-owned bundle recipe. */
export function createBundleFromRecipe(
  recipe: BundleRecipe,
  options: BundleRecipeOptions = {},
): FhirResource[] {
  validateRecipe(recipe);
  if (options.locale !== undefined) assertLocale(options.locale, "options.locale");
  if (options.fhirVersion !== undefined) assertFhirVersion(options.fhirVersion, "options.fhirVersion");
  if (options.count !== undefined) assertPositiveInteger(options.count, "options.count");

  const locale = options.locale ?? recipe.locale ?? "us";
  const fhirVersion = options.fhirVersion ?? recipe.fhirVersion ?? "R4";
  const bundleType = recipe.bundle?.type ?? "transaction";
  const seed = options.seed ?? 0;
  const count = options.count ?? 1;

  return Array.from({ length: count }, (_, index) =>
    buildSingleBundleFromRecipe(recipe, locale, fhirVersion, bundleType, seed + index),
  );
}
