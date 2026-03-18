import type { AddressTemplate, CityDefinition, RandomFn } from "../../core/types.js";
import { pickRandom, randomInt } from "../../core/generators/rng.js";

// PIN code first digit → region; use plausible ranges per state
const STATE_PIN_RANGES: Record<string, [number, number]> = {
  "Delhi": [110001, 110096],
  "Maharashtra": [400001, 445001],
  "Karnataka": [560001, 591350],
  "Tamil Nadu": [600001, 643253],
  "Telangana": [500001, 509408],
  "West Bengal": [700001, 743513],
  "Uttar Pradesh": [201001, 285001],
  "Rajasthan": [301001, 345031],
  "Gujarat": [360001, 396450],
  "Kerala": [670001, 695615],
};

const IN_CITIES: CityDefinition[] = [
  { name: "Mumbai", state: "Maharashtra", district: "Mumbai" },
  { name: "Delhi", state: "Delhi", district: "New Delhi" },
  { name: "Bengaluru", state: "Karnataka", district: "Bangalore Urban" },
  { name: "Chennai", state: "Tamil Nadu", district: "Chennai" },
  { name: "Hyderabad", state: "Telangana", district: "Hyderabad" },
  { name: "Kolkata", state: "West Bengal", district: "Kolkata" },
  { name: "Pune", state: "Maharashtra", district: "Pune" },
  { name: "Ahmedabad", state: "Gujarat", district: "Ahmedabad" },
  { name: "Jaipur", state: "Rajasthan", district: "Jaipur" },
  { name: "Lucknow", state: "Uttar Pradesh", district: "Lucknow" },
  { name: "Thiruvananthapuram", state: "Kerala", district: "Thiruvananthapuram" },
  { name: "Kochi", state: "Kerala", district: "Ernakulam" },
];

export const inAddressTemplate: AddressTemplate = {
  streets: [
    "MG Road", "Brigade Road", "Residency Road", "Church Street",
    "Linking Road", "Hill Road", "Bandra West", "Juhu Scheme",
    "Anna Salai", "Nungambakkam High Road", "Pondy Bazaar",
    "Rashbehari Avenue", "Park Street", "Elgin Road", "Salt Lake",
    "Mahatma Gandhi Road", "Nehru Street", "Gandhi Nagar",
    "Rajaji Salai", "NSC Bose Road", "Kamarajar Salai",
    "Indira Nagar", "Koramangala", "Jayanagar", "Malleshwaram",
  ],
  cities: IN_CITIES,
  generatePostalCode(rng: RandomFn, state?: string): string {
    const range = (state !== undefined ? STATE_PIN_RANGES[state] : undefined)
      ?? [500001, 500100];
    return randomInt(range[0], range[1], rng).toString();
  },
  country: "IN",
};

/** Indian addresses often include landmarks; generate optional second line. */
export function generateInAddressLine2(rng: RandomFn): string | undefined {
  const landmarks = [
    "Near City Mall", "Opposite Bus Stand", "Behind Railway Station",
    "Next to Post Office", "Near Government Hospital",
  ];
  // 40% chance of including a landmark
  return rng() < 0.4 ? pickRandom(landmarks, rng) : undefined;
}
