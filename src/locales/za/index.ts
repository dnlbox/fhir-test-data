import { zaIdDefinition, hpcsaRegistrationDefinition } from "@/core/generators/identifiers.js";
import { zaAddressTemplate } from "./addresses.js";
import { zaNamePool } from "./names.js";
import type { LocaleDefinition } from "@/core/types.js";

export const zaLocale: LocaleDefinition = {
  code: "za",
  name: "South Africa",
  patientIdentifiers: [zaIdDefinition],
  practitionerIdentifiers: [hpcsaRegistrationDefinition],
  organizationIdentifiers: [],
  address: zaAddressTemplate,
  names: zaNamePool,
};
