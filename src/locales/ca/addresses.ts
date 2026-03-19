import type { AddressTemplate, CityDefinition, RandomFn } from "@/core/types.js";
import { pickRandom, randomInt } from "@/core/generators/rng.js";

// Letters D, F, I, O, Q, U are never used in Canadian postal codes
// W and Z are never used as the first letter
// Province → first letter mapping
const PROVINCE_FSA_LETTER: Record<string, string> = {
  NL: "A", NS: "B", PE: "C", NB: "E",
  QC: "G", ON: "M", MB: "R", SK: "S",
  AB: "T", BC: "V", NT: "X", YT: "Y",
};

// Valid second-position and alternating letters (no D, F, I, O, Q, U, W, Z per Canada Post rules)
const POSTAL_LETTERS = [..."ABCEGHJKLMNPRSTVY"];

const CA_CITIES: CityDefinition[] = [
  { name: "Toronto", state: "ON" },
  { name: "Montreal", state: "QC" },
  { name: "Vancouver", state: "BC" },
  { name: "Calgary", state: "AB" },
  { name: "Edmonton", state: "AB" },
  { name: "Ottawa", state: "ON" },
  { name: "Winnipeg", state: "MB" },
  { name: "Quebec City", state: "QC" },
  { name: "Halifax", state: "NS" },
  { name: "Saskatoon", state: "SK" },
  { name: "Regina", state: "SK" },
  { name: "Victoria", state: "BC" },
];

export const caAddressTemplate: AddressTemplate = {
  streets: [
    "Maple Street", "Oak Avenue", "Main Street", "Centre Street",
    "Queen Street", "King Street", "Wellington Street", "Dundas Street",
    "Bloor Street", "Yonge Street", "College Street", "Broadview Avenue",
    "Rue Saint-Laurent", "Rue Sainte-Catherine", "Avenue du Parc",
    "Boulevard René-Lévesque", "Chemin de la Côte-des-Neiges",
    "Granville Street", "Robson Street", "Burrard Street", "Jasper Avenue",
    "Portage Avenue", "Barrington Street", "Spring Garden Road",
  ],
  cities: CA_CITIES,
  generatePostalCode(rng: RandomFn, state?: string): string {
    // A1A 1A1 pattern
    const firstLetter = state !== undefined
      ? (PROVINCE_FSA_LETTER[state] ?? pickRandom(Object.values(PROVINCE_FSA_LETTER), rng))
      : pickRandom(Object.values(PROVINCE_FSA_LETTER), rng);
    const d1 = randomInt(0, 9, rng);
    const l1 = pickRandom(POSTAL_LETTERS, rng);
    const d2 = randomInt(0, 9, rng);
    const l2 = pickRandom(POSTAL_LETTERS, rng);
    const d3 = randomInt(0, 9, rng);
    return `${firstLetter}${d1}${l1} ${d2}${l2}${d3}`;
  },
  country: "CA",
};
