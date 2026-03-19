import type { AddressTemplate, CityDefinition, RandomFn } from "@/core/types.js";
import { randomInt } from "@/core/generators/rng.js";

const SG_CITIES: CityDefinition[] = [
  { name: "Singapore", district: "Central" },
  { name: "Singapore", district: "Bedok" },
  { name: "Singapore", district: "Tampines" },
  { name: "Singapore", district: "Woodlands" },
  { name: "Singapore", district: "Jurong West" },
  { name: "Singapore", district: "Ang Mo Kio" },
  { name: "Singapore", district: "Toa Payoh" },
  { name: "Singapore", district: "Punggol" },
];

export const sgAddressTemplate: AddressTemplate = {
  streets: [
    "Orchard Road","Raffles Place","Marina Bay","Buona Vista",
    "Jurong East","Clementi Road","Pasir Panjang Road",
    "Upper Changi Road","Tampines Avenue","Bishan Street",
    "Serangoon Road","Little India","Chinatown Street",
    "Tanjong Pagar Road","Neil Road",
  ],
  cities: SG_CITIES,
  generatePostalCode(rng: RandomFn): string {
    // 6-digit Singapore postal code
    return randomInt(10000, 829999, rng).toString().padStart(6, "0");
  },
  country: "SG",
};
