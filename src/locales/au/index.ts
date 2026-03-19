import {
  ihiDefinition,
  medicareNumberDefinition,
  hpiiDefinition,
  hpioDefinition,
} from "@/core/generators/identifiers.js";
import { auAddressTemplate } from "./addresses.js";
import { auNamePool } from "./names.js";
import type { LocaleDefinition } from "@/core/types.js";

export const auLocale: LocaleDefinition = {
  code: "au",
  name: "Australia",
  patientIdentifiers: [ihiDefinition, medicareNumberDefinition],
  practitionerIdentifiers: [hpiiDefinition],
  organizationIdentifiers: [hpioDefinition],
  address: auAddressTemplate,
  names: auNamePool,
};
