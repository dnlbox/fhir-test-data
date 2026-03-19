import { usLocale } from "./us/index.js";
import { ukLocale } from "./uk/index.js";
import { auLocale } from "./au/index.js";
import { caLocale } from "./ca/index.js";
import { deLocale } from "./de/index.js";
import { frLocale } from "./fr/index.js";
import { nlLocale } from "./nl/index.js";
import { inLocale } from "./in/index.js";
import { jpLocale } from "./jp/index.js";
import { krLocale } from "./kr/index.js";
import { sgLocale } from "./sg/index.js";
import { brLocale } from "./br/index.js";
import { mxLocale } from "./mx/index.js";
import { zaLocale } from "./za/index.js";
import type { Locale, LocaleDefinition } from "@/core/types.js";

const LOCALE_MAP: Record<Locale, LocaleDefinition> = {
  us: usLocale,
  uk: ukLocale,
  au: auLocale,
  ca: caLocale,
  de: deLocale,
  fr: frLocale,
  nl: nlLocale,
  in: inLocale,
  jp: jpLocale,
  kr: krLocale,
  sg: sgLocale,
  br: brLocale,
  mx: mxLocale,
  za: zaLocale,
};

export function getLocale(code: Locale): LocaleDefinition {
  return LOCALE_MAP[code];
}

export function getAllLocales(): LocaleDefinition[] {
  return Object.values(LOCALE_MAP);
}
