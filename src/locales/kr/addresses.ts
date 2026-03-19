import type { AddressTemplate, CityDefinition, RandomFn } from "@/core/types.js";
import { randomInt } from "@/core/generators/rng.js";

const KR_CITIES: CityDefinition[] = [
  { name: "Seoul", state: "Seoul", district: "Gangnam-gu" },
  { name: "Busan", state: "Busan", district: "Haeundae-gu" },
  { name: "Incheon", state: "Incheon", district: "Namdong-gu" },
  { name: "Daegu", state: "Daegu", district: "Dalseo-gu" },
  { name: "Daejeon", state: "Daejeon", district: "Yuseong-gu" },
  { name: "Gwangju", state: "Gwangju", district: "Nam-gu" },
  { name: "Suwon", state: "Gyeonggi", district: "Paldal-gu" },
  { name: "Changwon", state: "Gyeongnam", district: "Seongsan-gu" },
];

const KR_POSTAL_RANGES: Record<string, [number, number]> = {
  "Seoul": [2000, 9999],
  "Busan": [46000, 49999],
  "Incheon": [21000, 23999],
  "Daegu": [41000, 43999],
  "Daejeon": [34000, 35999],
  "Gwangju": [61000, 62999],
  "Gyeonggi": [10000, 18999],
  "Gyeongnam": [51000, 53999],
};

export const krAddressTemplate: AddressTemplate = {
  streets: [
    "Teheran-ro","Gangnam-daero","Sinchon-ro","Hongdae-ro","Itaewon-ro",
    "Jongno","Eulji-ro","Sejong-daero","Hangang-ro","Mapo-daero",
    "Haeundae-ro","Gwangbok-ro","Nampo-daero",
    "Dunsan-daero","Expo-ro",
  ],
  cities: KR_CITIES,
  generatePostalCode(rng: RandomFn, state?: string): string {
    const range = (state !== undefined ? KR_POSTAL_RANGES[state] : undefined) ?? [2000, 9999];
    return randomInt(range[0], range[1], rng).toString().padStart(5, "0");
  },
  country: "KR",
};
