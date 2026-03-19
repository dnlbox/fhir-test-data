import type { AddressTemplate, CityDefinition, RandomFn } from "@/core/types.js";
import { randomInt } from "@/core/generators/rng.js";

const MX_CITIES: CityDefinition[] = [
  { name: "Ciudad de México", state: "CDMX", district: "Benito Juárez" },
  { name: "Guadalajara", state: "JAL", district: "Zapopan" },
  { name: "Monterrey", state: "NL", district: "San Pedro" },
  { name: "Puebla", state: "PUE", district: "Centro" },
  { name: "Tijuana", state: "BC", district: "Zona Centro" },
  { name: "León", state: "GTO", district: "Centro" },
  { name: "Mérida", state: "YUC", district: "Centro Histórico" },
  { name: "Cancún", state: "QR", district: "Zona Hotelera" },
];

const MX_POSTAL_RANGES: Record<string, [number, number]> = {
  "CDMX": [1000, 16999],
  "JAL": [44000, 49999],
  "NL": [64000, 67999],
  "PUE": [72000, 75999],
  "BC": [21000, 22999],
  "GTO": [36000, 38999],
  "YUC": [97000, 97999],
  "QR": [77000, 77999],
};

export const mxAddressTemplate: AddressTemplate = {
  streets: [
    "Paseo de la Reforma","Insurgentes Norte","Insurgentes Sur","Avenida Juárez",
    "Calzada de los Leones","Boulevard Miguel Hidalgo","Avenida Chapultepec",
    "Calle Madero","Avenida Universidad","Calzada del Ejército",
    "Avenida Vallarta","Avenida López Mateos",
  ],
  cities: MX_CITIES,
  generatePostalCode(rng: RandomFn, state?: string): string {
    const range = (state !== undefined ? MX_POSTAL_RANGES[state] : undefined) ?? [1000, 99999];
    return randomInt(range[0], range[1], rng).toString().padStart(5, "0");
  },
  country: "MX",
};
