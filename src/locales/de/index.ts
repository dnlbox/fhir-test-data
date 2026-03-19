import {
  kvidDefinition,
  lanrDefinition,
  bsnrDefinition,
  iknrDefinition,
} from "@/core/generators/identifiers.js";
import { deAddressTemplate } from "./addresses.js";
import { deNamePool } from "./names.js";
import type { LocaleDefinition } from "@/core/types.js";

export const deLocale: LocaleDefinition = {
  code: "de",
  name: "Germany",
  patientIdentifiers: [kvidDefinition],
  practitionerIdentifiers: [lanrDefinition],
  organizationIdentifiers: [bsnrDefinition, iknrDefinition],
  address: deAddressTemplate,
  names: deNamePool,
};
