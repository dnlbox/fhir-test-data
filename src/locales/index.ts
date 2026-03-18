import { usLocale } from "./us/index.js";
import { ukLocale } from "./uk/index.js";
import { auLocale } from "./au/index.js";
import { caLocale } from "./ca/index.js";
import { deLocale } from "./de/index.js";
import { frLocale } from "./fr/index.js";
import { nlLocale } from "./nl/index.js";
import { inLocale } from "./in/index.js";
import type { Locale, LocaleDefinition } from "../core/types.js";

const LOCALE_MAP: Record<Locale, LocaleDefinition> = {
  us: usLocale,
  uk: ukLocale,
  au: auLocale,
  ca: caLocale,
  de: deLocale,
  fr: frLocale,
  nl: nlLocale,
  in: inLocale,
};

export function getLocale(code: Locale): LocaleDefinition {
  return LOCALE_MAP[code];
}

export function getAllLocales(): LocaleDefinition[] {
  return Object.values(LOCALE_MAP);
}
