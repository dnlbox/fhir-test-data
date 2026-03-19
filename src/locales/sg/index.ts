import { sgNricDefinition, smcRegistrationDefinition } from "@/core/generators/identifiers.js";
import { sgAddressTemplate } from "./addresses.js";
import { sgNamePool } from "./names.js";
import type { LocaleDefinition } from "@/core/types.js";

export const sgLocale: LocaleDefinition = {
  code: "sg",
  name: "Singapore",
  patientIdentifiers: [sgNricDefinition],
  practitionerIdentifiers: [smcRegistrationDefinition],
  organizationIdentifiers: [],
  address: sgAddressTemplate,
  names: sgNamePool,
};
