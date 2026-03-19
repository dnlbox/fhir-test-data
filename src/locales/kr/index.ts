import { krRrnDefinition, mohwDoctorLicenseDefinition } from "@/core/generators/identifiers.js";
import { krAddressTemplate } from "./addresses.js";
import { krNamePool } from "./names.js";
import type { LocaleDefinition } from "@/core/types.js";

export const krLocale: LocaleDefinition = {
  code: "kr",
  name: "South Korea",
  patientIdentifiers: [krRrnDefinition],
  practitionerIdentifiers: [mohwDoctorLicenseDefinition],
  organizationIdentifiers: [],
  address: krAddressTemplate,
  names: krNamePool,
};
