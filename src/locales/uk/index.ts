import {
  nhsNumberDefinition,
  gmcNumberDefinition,
  gmpNumberDefinition,
  odsCodDefinition,
} from "@/core/generators/identifiers.js";
import { ukAddressTemplate } from "./addresses.js";
import { ukNamePool } from "./names.js";
import type { LocaleDefinition } from "@/core/types.js";

export const ukLocale: LocaleDefinition = {
  code: "uk",
  name: "United Kingdom",
  patientIdentifiers: [nhsNumberDefinition],
  practitionerIdentifiers: [gmcNumberDefinition, gmpNumberDefinition],
  organizationIdentifiers: [odsCodDefinition],
  address: ukAddressTemplate,
  names: ukNamePool,
};
