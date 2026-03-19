import { aadhaarDefinition, abhaNumberDefinition, nmcRegistrationDefinition } from "@/core/generators/identifiers.js";
import { inAddressTemplate } from "./addresses.js";
import { inNamePool } from "./names.js";
import type { LocaleDefinition } from "@/core/types.js";

export const inLocale: LocaleDefinition = {
  code: "in",
  name: "India",
  patientIdentifiers: [aadhaarDefinition, abhaNumberDefinition],
  practitionerIdentifiers: [nmcRegistrationDefinition],
  organizationIdentifiers: [],
  address: inAddressTemplate,
  names: inNamePool,
};
