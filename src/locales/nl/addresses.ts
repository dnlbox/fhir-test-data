import type { AddressTemplate, RandomFn } from "@/core/types.js";
import { pickRandom, randomInt } from "@/core/generators/rng.js";

// SA, SD, SS are not used as postcode letter pairs
const INVALID_NL_PAIRS = new Set(["SA", "SD", "SS"]);

const NL_LETTERS = [..."ABCDEFGHJKLMNPRSTUVWXYZ"]; // excludes I, O, Q, U

function generateNlPostalCode(rng: RandomFn): string {
  const digits = randomInt(1000, 9999, rng);
  // Pick two letters, avoiding SA/SD/SS combinations
  for (;;) {
    const l1 = pickRandom(NL_LETTERS, rng);
    const l2 = pickRandom(NL_LETTERS, rng);
    const pair = l1 + l2;
    if (!INVALID_NL_PAIRS.has(pair)) {
      return `${digits} ${pair}`;
    }
  }
}

export const nlAddressTemplate: AddressTemplate = {
  streets: [
    "Keizersgracht", "Prinsengracht", "Herengracht", "Singel",
    "Damrak", "Rokin", "Kalverstraat", "Leidsestraat",
    "Vondelstraat", "Overtoom", "Haarlemmerdijk", "Jordaan",
    "Binnenhof", "Lange Voorhout", "Grote Markt", "Hofweg",
    "Binnenweg", "Blaak", "Coolsingel", "Westersingel",
    "Stationsplein", "Catharijnesingel", "Oudegracht", "Vredenburg",
  ],
  cities: [
    { name: "Amsterdam", state: "Noord-Holland" },
    { name: "Rotterdam", state: "Zuid-Holland" },
    { name: "Den Haag", state: "Zuid-Holland" },
    { name: "Utrecht", state: "Utrecht" },
    { name: "Eindhoven", state: "Noord-Brabant" },
    { name: "Groningen", state: "Groningen" },
    { name: "Tilburg", state: "Noord-Brabant" },
    { name: "Almere", state: "Flevoland" },
    { name: "Breda", state: "Noord-Brabant" },
    { name: "Nijmegen", state: "Gelderland" },
    { name: "Arnhem", state: "Gelderland" },
    { name: "Haarlem", state: "Noord-Holland" },
  ],
  generatePostalCode(rng: RandomFn, _state?: string): string {
    return generateNlPostalCode(rng);
  },
  // Dutch: "{street} {number}" order
  formatLine: (number: number, street: string): string => `${street} ${number}`,
  country: "NL",
};
