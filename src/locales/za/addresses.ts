import type { AddressTemplate, CityDefinition, RandomFn } from "@/core/types.js";
import { randomInt } from "@/core/generators/rng.js";

const ZA_CITIES: CityDefinition[] = [
  { name: "Johannesburg", state: "Gauteng", district: "Sandton" },
  { name: "Cape Town", state: "Western Cape", district: "City Bowl" },
  { name: "Durban", state: "KwaZulu-Natal", district: "Berea" },
  { name: "Pretoria", state: "Gauteng", district: "Arcadia" },
  { name: "Port Elizabeth", state: "Eastern Cape", district: "Newton Park" },
  { name: "Bloemfontein", state: "Free State", district: "Westdene" },
  { name: "East London", state: "Eastern Cape", district: "Beacon Bay" },
  { name: "Nelspruit", state: "Mpumalanga", district: "West Acres" },
];

const ZA_POSTAL_RANGES: Record<string, [number, number]> = {
  "Gauteng": [1400, 2199],
  "Western Cape": [7400, 8099],
  "KwaZulu-Natal": [3200, 4699],
  "Eastern Cape": [5000, 6299],
  "Free State": [9300, 9999],
  "Mpumalanga": [1200, 1399],
};

export const zaAddressTemplate: AddressTemplate = {
  streets: [
    "Nelson Mandela Drive","Jan Smuts Avenue","Oxford Road","Rivonia Road",
    "William Nicol Drive","Sandton Drive","Long Street","Adderley Street",
    "Loop Street","Bree Street","Florida Road","Marine Parade",
    "Church Street","Paul Kruger Street",
  ],
  cities: ZA_CITIES,
  generatePostalCode(rng: RandomFn, state?: string): string {
    const range = (state !== undefined ? ZA_POSTAL_RANGES[state] : undefined) ?? [1000, 9999];
    return randomInt(range[0], range[1], rng).toString().padStart(4, "0");
  },
  country: "ZA",
};
