import { nirDefinition, rppsDefinition } from "../../core/generators/identifiers.js";
import { frAddressTemplate } from "./addresses.js";
import { frNamePool } from "./names.js";
import type { LocaleDefinition } from "../../core/types.js";

export const frLocale: LocaleDefinition = {
  code: "fr",
  name: "France",
  patientIdentifiers: [nirDefinition],
  practitionerIdentifiers: [rppsDefinition],
  organizationIdentifiers: [],
  address: frAddressTemplate,
  names: frNamePool,
};
