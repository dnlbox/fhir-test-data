import type { AddressTemplate, RandomFn } from "@/core/types.js";
import { pickRandom, randomInt } from "./rng.js";

export interface GeneratedAddress {
  line: string[];
  city: string;
  state?: string;
  district?: string;
  postalCode: string;
  country: string;
}

/** Generate a single address using the locale's address template. */
export function generateAddress(template: AddressTemplate, rng: RandomFn): GeneratedAddress {
  const city = pickRandom(template.cities, rng);
  const street = pickRandom(template.streets, rng);
  const number = randomInt(1, 9999, rng);
  const postalCode = template.generatePostalCode(rng, city.state);

  const formatLine = template.formatLine ?? ((n: number, s: string): string => `${n} ${s}`);
  const address: GeneratedAddress = {
    line: [formatLine(number, street)],
    city: city.name,
    postalCode,
    country: template.country,
  };

  if (city.state !== undefined) address.state = city.state;
  if (city.district !== undefined) address.district = city.district;

  return address;
}
