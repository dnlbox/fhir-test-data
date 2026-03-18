import type { AddressTemplate, RandomFn } from "../../core/types.js";
import { pickRandom, randomInt } from "../../core/generators/rng.js";

// Valid postcode area letters (not all 26 are used as area prefixes)
const POSTCODE_AREA_LETTERS = [..."ABCDEFGHIJKLMNOPRSTUVWXY"];
const POSTCODE_INWARD_LETTERS = [..."ABDEFGHJLNPQRSTUVWXYZ"];

export const ukAddressTemplate: AddressTemplate = {
  streets: [
    "High Street", "Church Lane", "Mill Road", "Station Road", "Park Avenue",
    "Victoria Road", "Albert Street", "George Street", "King Street", "Queen Street",
    "Market Place", "Bridge Street", "School Lane", "Manor Road", "Vicarage Lane",
    "The Green", "Chestnut Avenue", "Elm Close", "Beech Road", "Ash Grove",
    "Hollybrook Drive", "Primrose Hill", "Meadow Way", "Oakfield Road",
  ],
  cities: [
    { name: "London", district: "Greater London" },
    { name: "Manchester", district: "Greater Manchester" },
    { name: "Birmingham", district: "West Midlands" },
    { name: "Leeds", district: "West Yorkshire" },
    { name: "Glasgow", district: "City of Glasgow" },
    { name: "Edinburgh", district: "City of Edinburgh" },
    { name: "Bristol", district: "City of Bristol" },
    { name: "Leicester", district: "Leicestershire" },
    { name: "Coventry", district: "West Midlands" },
    { name: "Bradford", district: "West Yorkshire" },
    { name: "Cardiff", district: "Cardiff" },
    { name: "Nottingham", district: "Nottinghamshire" },
  ],
  generatePostalCode(rng: RandomFn, _state?: string): string {
    // Generate a structurally valid UK postcode: AA9 9AA format
    const area1 = pickRandom(POSTCODE_AREA_LETTERS, rng);
    const area2 = pickRandom(POSTCODE_AREA_LETTERS, rng);
    const district = randomInt(1, 99, rng);
    const sector = randomInt(0, 9, rng);
    const unit1 = pickRandom(POSTCODE_INWARD_LETTERS, rng);
    const unit2 = pickRandom(POSTCODE_INWARD_LETTERS, rng);
    return `${area1}${area2}${district} ${sector}${unit1}${unit2}`;
  },
  country: "GB",
};
