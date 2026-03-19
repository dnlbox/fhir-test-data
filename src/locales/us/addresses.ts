import type { AddressTemplate, RandomFn } from "@/core/types.js";
import { randomInt } from "@/core/generators/rng.js";

export const usAddressTemplate: AddressTemplate = {
  streets: [
    "Oak Street", "Maple Avenue", "Cedar Lane", "Pine Road", "Elm Drive",
    "Washington Boulevard", "Lincoln Way", "Jefferson Avenue", "Madison Street",
    "Franklin Road", "Adams Lane", "Monroe Drive", "Harrison Court",
    "Willow Creek Road", "Sunset Boulevard", "Riverside Drive", "Hillcrest Avenue",
    "Meadowbrook Lane", "Lakeview Drive", "Greenwood Place",
    "Birchwood Circle", "Foxglove Court", "Stonebridge Road", "Clearwater Lane",
  ],
  cities: [
    { name: "Springfield", state: "IL" },
    { name: "Portland", state: "OR" },
    { name: "Columbus", state: "OH" },
    { name: "Austin", state: "TX" },
    { name: "Phoenix", state: "AZ" },
    { name: "Charlotte", state: "NC" },
    { name: "Indianapolis", state: "IN" },
    { name: "Memphis", state: "TN" },
    { name: "Louisville", state: "KY" },
    { name: "Milwaukee", state: "WI" },
    { name: "Albuquerque", state: "NM" },
    { name: "Tucson", state: "AZ" },
    { name: "Fresno", state: "CA" },
  ],
  generatePostalCode(rng: RandomFn, _state?: string): string {
    // 5-digit ZIP, avoid 00000 and 99999
    const zip = randomInt(10000, 99998, rng);
    return zip.toString().padStart(5, "0");
  },
  country: "US",
};
