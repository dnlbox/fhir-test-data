import type { AddressTemplate, RandomFn } from "../../core/types.js";
import { pickRandom, randomInt } from "../../core/generators/rng.js";

// PLZ ranges roughly map: 0xxxx=East, 1xxxx=Berlin/Brandenburg, 2xxxx=North, etc.
const STATE_PLZ_PREFIXES: Record<string, number[]> = {
  "Berlin": [10, 11, 12, 13, 14],
  "Bayern": [80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97],
  "Nordrhein-Westfalen": [40, 41, 42, 44, 45, 46, 47, 48, 50, 51, 52, 53],
  "Baden-Württemberg": [68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79],
  "Hamburg": [20, 21, 22],
  "Sachsen": [1, 2, 4],
};

const DE_STREET_SUFFIXES = [
  "strasse", "weg", "platz", "allee", "ring", "gasse", "damm", "ufer",
];

const DE_STREET_ROOTS = [
  "Friedrich", "Haupt", "Bahnhof", "Garten", "Schloss", "Schul",
  "Kirch", "Markt", "Wald", "Berg", "See", "Wiesen", "Linden",
  "Kaiser", "König", "Bismarck", "Goethe", "Schiller", "Hegel",
  "Humboldt", "Kant", "Heine", "Brahms",
];

export const deAddressTemplate: AddressTemplate = {
  streets: DE_STREET_ROOTS.flatMap((root) =>
    DE_STREET_SUFFIXES.slice(0, 1).map((suffix) => `${root}${suffix}`),
  ).concat([
    "Friedrichstrasse", "Hauptstrasse", "Bahnhofstrasse", "Gartenweg",
    "Schlossallee", "Schulstrasse", "Kirchgasse", "Marktplatz",
    "Waldweg", "Bergstrasse", "Seestrasse", "Wiesenweg", "Lindenallee",
  ]),
  cities: [
    { name: "Berlin", state: "Berlin" },
    { name: "Hamburg", state: "Hamburg" },
    { name: "München", state: "Bayern" },
    { name: "Köln", state: "Nordrhein-Westfalen" },
    { name: "Frankfurt am Main", state: "Hessen" },
    { name: "Stuttgart", state: "Baden-Württemberg" },
    { name: "Düsseldorf", state: "Nordrhein-Westfalen" },
    { name: "Leipzig", state: "Sachsen" },
    { name: "Dortmund", state: "Nordrhein-Westfalen" },
    { name: "Essen", state: "Nordrhein-Westfalen" },
    { name: "Dresden", state: "Sachsen" },
    { name: "Bremen", state: "Bremen" },
  ],
  generatePostalCode(rng: RandomFn, state?: string): string {
    const prefixes = (state !== undefined ? STATE_PLZ_PREFIXES[state] : undefined)
      ?? [randomInt(1, 99, rng)];
    const prefix = pickRandom(prefixes, rng);
    const suffix = randomInt(0, 999, rng);
    return `${prefix.toString().padStart(2, "0")}${suffix.toString().padStart(3, "0")}`;
  },
  // German address format: "{street} {number}" (number comes after street name)
  formatLine: (number: number, street: string): string => `${street} ${number}`,
  country: "DE",
};
