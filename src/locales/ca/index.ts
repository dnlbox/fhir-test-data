import { ontarioHcnDefinition } from "@/core/generators/identifiers.js";
import { caAddressTemplate } from "./addresses.js";
import { caNamePool } from "./names.js";
import type { LocaleDefinition } from "@/core/types.js";

export const caLocale: LocaleDefinition = {
  code: "ca",
  name: "Canada",
  patientIdentifiers: [ontarioHcnDefinition],
  practitionerIdentifiers: [],
  organizationIdentifiers: [],
  address: caAddressTemplate,
  names: caNamePool,
};
