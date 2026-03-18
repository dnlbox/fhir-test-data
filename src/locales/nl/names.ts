import type { NamePool } from "../../core/types.js";

export const nlNamePool: NamePool = {
  given: {
    male: [
      "Jan", "Pieter", "Hendrik", "Johannes", "Cornelis", "Willem", "Dirk",
      "Gerard", "Theodoor", "Adriaan", "Daan", "Sander", "Lars", "Tim",
      "Bas", "Robin", "Joris", "Thijs", "Bram", "Niels", "Wouter",
      "Jeroen", "Maarten", "Ruben", "Thomas", "Stefan", "Marc",
      "Luca", "Noah", "Finn", "Stef", "Luuk", "Milan", "Roel",
    ],
    female: [
      "Maria", "Anna", "Johanna", "Cornelia", "Wilhelmina", "Petronella",
      "Emma", "Sophia", "Laura", "Nathalie", "Linda", "Sandra", "Anita",
      "Monique", "Nicole", "Anouk", "Femke", "Lotte", "Iris", "Fleur",
      "Naomi", "Merel", "Lisanne", "Roos", "Lisa", "Julia", "Sanne",
      "Nora", "Sara", "Mila", "Zoë", "Manon", "Lynn", "Tessa",
    ],
  },
  family: [
    "de Jong", "Jansen", "de Vries", "van den Berg", "van Dijk",
    "Bakker", "Janssen", "Visser", "Smit", "Meijer",
    "de Boer", "Mulder", "de Groot", "Bos", "Vos",
    "Peters", "Hendriks", "van Leeuwen", "Dekker", "Brouwer",
    "de Wit", "Dijkstra", "Smits", "de Graaf", "van der Berg",
    "van der Meer", "van der Linden", "Kok", "Jacobs", "de Haan",
    "Peeters", "Linden", "van den Bosch", "Groen", "Willems",
    "Schouten", "Prins", "Vermeer", "van Beek", "Lammers",
    "Kuiper", "Postma", "Huisman", "Jonker", "Bosman",
    "Nijs", "van der Heijden", "Broer",
  ],
  // Dutch surname prefixes (tussenvoegsel)
  prefixes: ["van", "de", "van de", "van der", "van den", "den", "ter"],
};
