import type { AddressTemplate, RandomFn } from "../../core/types.js";
import { randomInt } from "../../core/generators/rng.js";

const FR_STREET_TYPES = [
  "Rue", "Avenue", "Boulevard", "Place", "Impasse", "Allée", "Chemin", "Route",
];

const FR_STREET_NAMES = [
  "de la Paix", "du Commerce", "Victor Hugo", "Jean Jaurès", "de la République",
  "des Fleurs", "du Moulin", "de l'Église", "du Château", "des Lilas",
  "Gambetta", "Pasteur", "Foch", "Clemenceau", "de Gaulle",
  "de la Liberté", "du Général Leclerc", "de la Forêt", "de l'Abbaye",
];

export const frAddressTemplate: AddressTemplate = {
  streets: FR_STREET_TYPES.flatMap((type) =>
    FR_STREET_NAMES.slice(0, 3).map((name) => `${type} ${name}`),
  ),
  cities: [
    { name: "Paris" },
    { name: "Marseille" },
    { name: "Lyon" },
    { name: "Toulouse" },
    { name: "Nice" },
    { name: "Nantes" },
    { name: "Strasbourg" },
    { name: "Montpellier" },
    { name: "Bordeaux" },
    { name: "Lille" },
    { name: "Rennes" },
    { name: "Reims" },
  ],
  generatePostalCode(rng: RandomFn, _state?: string): string {
    // 5-digit code postal; first 2 digits = department (01-95, skip 20)
    const dept = randomInt(1, 95, rng);
    const suffix = randomInt(0, 999, rng);
    return `${dept.toString().padStart(2, "0")}${suffix.toString().padStart(3, "0")}`;
  },
  // French address format: "{number} {type} {name}" — number before street type+name
  // The streets array already includes the type+name (e.g., "Rue de la Paix"),
  // so the default "{number} {street}" format works correctly.
  country: "FR",
};
