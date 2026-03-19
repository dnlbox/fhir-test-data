import { jpHospitalMrnDefinition, jmpDoctorLicenseDefinition } from "@/core/generators/identifiers.js";
import { jpAddressTemplate } from "./addresses.js";
import { jpNamePool } from "./names.js";
import type { LocaleDefinition } from "@/core/types.js";

export const jpLocale: LocaleDefinition = {
  code: "jp",
  name: "Japan",
  patientIdentifiers: [jpHospitalMrnDefinition],
  practitionerIdentifiers: [jmpDoctorLicenseDefinition],
  organizationIdentifiers: [],
  address: jpAddressTemplate,
  names: jpNamePool,
};
