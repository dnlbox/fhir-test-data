import { mxCurpDefinition, cedulaProfesionalDefinition } from "@/core/generators/identifiers.js";
import { mxAddressTemplate } from "./addresses.js";
import { mxNamePool } from "./names.js";
import type { LocaleDefinition } from "@/core/types.js";

export const mxLocale: LocaleDefinition = {
  code: "mx",
  name: "Mexico",
  patientIdentifiers: [mxCurpDefinition],
  practitionerIdentifiers: [cedulaProfesionalDefinition],
  organizationIdentifiers: [],
  address: mxAddressTemplate,
  names: mxNamePool,
};
