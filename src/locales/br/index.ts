import { brCpfDefinition, crmPractitionerDefinition } from "@/core/generators/identifiers.js";
import { brAddressTemplate } from "./addresses.js";
import { brNamePool } from "./names.js";
import type { LocaleDefinition } from "@/core/types.js";

export const brLocale: LocaleDefinition = {
  code: "br",
  name: "Brazil",
  patientIdentifiers: [brCpfDefinition],
  practitionerIdentifiers: [crmPractitionerDefinition],
  organizationIdentifiers: [],
  address: brAddressTemplate,
  names: brNamePool,
};
