import type { AddressTemplate, CityDefinition, RandomFn } from "@/core/types.js";
import { randomInt } from "@/core/generators/rng.js";

const JP_CITIES: CityDefinition[] = [
  { name: "Tokyo", state: "Tokyo", district: "Shinjuku" },
  { name: "Osaka", state: "Osaka", district: "Namba" },
  { name: "Kyoto", state: "Kyoto", district: "Fushimi" },
  { name: "Yokohama", state: "Kanagawa", district: "Naka" },
  { name: "Nagoya", state: "Aichi", district: "Naka" },
  { name: "Sapporo", state: "Hokkaido", district: "Chuo" },
  { name: "Kobe", state: "Hyogo", district: "Chuo" },
  { name: "Fukuoka", state: "Fukuoka", district: "Hakata" },
  { name: "Hiroshima", state: "Hiroshima", district: "Naka" },
  { name: "Sendai", state: "Miyagi", district: "Aoba" },
];

const JP_POSTAL_RANGES: Record<string, [number, number]> = {
  "Tokyo": [1000001, 1999999],
  "Osaka": [5300001, 5999999],
  "Kyoto": [6000001, 6199999],
  "Kanagawa": [2100001, 2599999],
  "Aichi": [4400001, 4999999],
  "Hokkaido": [600001, 999999],
  "Hyogo": [6500001, 6799999],
  "Fukuoka": [8100001, 8399999],
  "Hiroshima": [7300001, 7399999],
  "Miyagi": [9800001, 9899999],
};

export const jpAddressTemplate: AddressTemplate = {
  streets: [
    "Shinjuku", "Shibuya", "Ginza", "Roppongi", "Akihabara",
    "Harajuku", "Asakusa", "Ueno", "Ikebukuro", "Shimokitazawa",
    "Namba", "Dotonbori", "Umeda", "Shinsaibashi",
    "Gion", "Arashiyama", "Kawaramachi",
    "Minatomachi", "Kitanagasa",
  ],
  cities: JP_CITIES,
  generatePostalCode(rng: RandomFn, state?: string): string {
    const range = (state !== undefined ? JP_POSTAL_RANGES[state] : undefined) ?? [1000001, 1999999];
    const n = randomInt(range[0], range[1], rng);
    const s = n.toString().padStart(7, "0");
    return s.slice(0, 3) + "-" + s.slice(3);
  },
  formatLine(number: number, street: string): string {
    return `${street} ${number}-chome`;
  },
  country: "JP",
};
