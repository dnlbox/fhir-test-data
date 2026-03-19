import type { AddressTemplate, CityDefinition, RandomFn } from "@/core/types.js";
import { randomInt } from "@/core/generators/rng.js";

const BR_CITIES: CityDefinition[] = [
  { name: "São Paulo", state: "SP", district: "Jardins" },
  { name: "Rio de Janeiro", state: "RJ", district: "Copacabana" },
  { name: "Belo Horizonte", state: "MG", district: "Savassi" },
  { name: "Brasília", state: "DF", district: "Asa Sul" },
  { name: "Salvador", state: "BA", district: "Barra" },
  { name: "Fortaleza", state: "CE", district: "Meireles" },
  { name: "Curitiba", state: "PR", district: "Batel" },
  { name: "Manaus", state: "AM", district: "Centro" },
  { name: "Recife", state: "PE", district: "Boa Viagem" },
  { name: "Porto Alegre", state: "RS", district: "Moinhos de Vento" },
];

const BR_CEP_RANGES: Record<string, [number, number]> = {
  "SP": [1000000, 9999999],
  "RJ": [20000000, 28999999],
  "MG": [30000000, 39999999],
  "DF": [70000000, 73999999],
  "BA": [40000000, 48999999],
  "CE": [60000000, 63999999],
  "PR": [80000000, 87999999],
  "AM": [69000000, 69999999],
  "PE": [50000000, 56999999],
  "RS": [90000000, 99999999],
};

export const brAddressTemplate: AddressTemplate = {
  streets: [
    "Avenida Paulista","Rua Augusta","Rua Oscar Freire","Avenida Brigadeiro Faria Lima",
    "Rua das Flores","Avenida Brasil","Rua Direita","Travessa das Palmeiras",
    "Avenida Atlântica","Rua Voluntários da Pátria",
    "Avenida Afonso Pena","Rua da Bahia",
    "Avenida W3 Sul","Avenida das Nações",
  ],
  cities: BR_CITIES,
  generatePostalCode(rng: RandomFn, state?: string): string {
    const range = (state !== undefined ? BR_CEP_RANGES[state] : undefined) ?? [1000000, 9999999];
    const n = randomInt(range[0], range[1], rng);
    const s = n.toString().padStart(8, "0");
    return s.slice(0, 5) + "-" + s.slice(5);
  },
  country: "BR",
};
