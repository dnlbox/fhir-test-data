import {
  ssnDefinition,
  mrnDefinition,
  npiDefinition,
} from "../../core/generators/identifiers.js";
import { usAddressTemplate } from "./addresses.js";
import { usNamePool } from "./names.js";
import type { LocaleDefinition } from "../../core/types.js";

export const usLocale: LocaleDefinition = {
  code: "us",
  name: "United States",
  patientIdentifiers: [ssnDefinition, mrnDefinition],
  practitionerIdentifiers: [npiDefinition],
  organizationIdentifiers: [],
  address: usAddressTemplate,
  names: usNamePool,
};
