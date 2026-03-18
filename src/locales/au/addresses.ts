import type { AddressTemplate, CityDefinition, RandomFn } from "../../core/types.js";
import { randomInt } from "../../core/generators/rng.js";

// Postcode ranges per state, from research doc
const STATE_POSTCODE_RANGES: Record<string, [number, number]> = {
  NSW: [2000, 2999],
  VIC: [3000, 3999],
  QLD: [4000, 4999],
  SA: [5000, 5999],
  WA: [6000, 6999],
  TAS: [7000, 7999],
  ACT: [2600, 2639],
  NT: [800, 999],
};

const AU_CITIES: CityDefinition[] = [
  { name: "Sydney", state: "NSW" },
  { name: "Melbourne", state: "VIC" },
  { name: "Brisbane", state: "QLD" },
  { name: "Perth", state: "WA" },
  { name: "Adelaide", state: "SA" },
  { name: "Gold Coast", state: "QLD" },
  { name: "Canberra", state: "ACT" },
  { name: "Hobart", state: "TAS" },
  { name: "Darwin", state: "NT" },
  { name: "Newcastle", state: "NSW" },
  { name: "Geelong", state: "VIC" },
  { name: "Wollongong", state: "NSW" },
];

export const auAddressTemplate: AddressTemplate = {
  streets: [
    "George Street", "Pitt Street", "King Street", "Elizabeth Street",
    "William Street", "Market Street", "Hunter Street", "Macquarie Street",
    "Collins Street", "Bourke Street", "Swanston Street", "Flinders Street",
    "Queen Street", "Albert Street", "Ann Street", "Adelaide Street",
    "Hay Street", "Murray Street", "Barrack Street", "St Georges Terrace",
    "Rundle Mall", "Hindley Street", "Currie Street", "Grenfell Street",
  ],
  cities: AU_CITIES,
  generatePostalCode(rng: RandomFn, state?: string): string {
    const range = (state !== undefined ? STATE_POSTCODE_RANGES[state] : undefined)
      ?? STATE_POSTCODE_RANGES["NSW"]
      ?? [2000, 2999];
    return randomInt(range[0], range[1], rng).toString().padStart(4, "0");
  },
  country: "AU",
};
