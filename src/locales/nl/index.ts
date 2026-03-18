import { bsnDefinition, uziNumberDefinition } from "../../core/generators/identifiers.js";
import { nlAddressTemplate } from "./addresses.js";
import { nlNamePool } from "./names.js";
import type { LocaleDefinition } from "../../core/types.js";

export const nlLocale: LocaleDefinition = {
  code: "nl",
  name: "Netherlands",
  patientIdentifiers: [bsnDefinition],
  practitionerIdentifiers: [uziNumberDefinition],
  organizationIdentifiers: [],
  address: nlAddressTemplate,
  names: nlNamePool,
};
