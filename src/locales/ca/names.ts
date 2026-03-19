import type { NamePool } from "@/core/types.js";

// Canadian name pool — bilingual (English + French)
export const caNamePool: NamePool = {
  given: {
    male: [
      // English names
      "Liam", "Noah", "Oliver", "William", "James", "Benjamin", "Lucas",
      "Henry", "Alexander", "Mason", "Ethan", "Daniel", "Matthew", "Logan",
      // French-Canadian names
      "Jean", "Pierre", "François", "Luc", "Marc", "Maxime", "Alexis",
      "Simon", "Mathieu", "Antoine", "Gabriel", "Samuel", "Félix", "Julien",
      "Etienne", "Philippe", "Nicolas", "Thomas", "David", "Charles",
    ],
    female: [
      // English names
      "Olivia", "Emma", "Charlotte", "Amelia", "Ava", "Sophia", "Isabella",
      "Mia", "Evelyn", "Harper", "Luna", "Camila", "Gianna", "Elizabeth",
      // French-Canadian names
      "Marie", "Sophie", "Chloé", "Emma", "Léa", "Jade", "Laura",
      "Sarah", "Camille", "Manon", "Julie", "Isabelle", "Amélie", "Clara",
      "Maëlle", "Alice", "Lucie", "Margot", "Audrey", "Laurie",
    ],
  },
  family: [
    // English-Canadian surnames
    "Smith", "Brown", "Tremblay", "Martin", "Roy", "Wilson", "Macdonald",
    "Campbell", "Anderson", "Scott", "Jones", "Taylor", "Thompson", "White",
    "Moore", "Jackson", "Harris", "Clark", "Lewis", "Robinson",
    // French-Canadian surnames
    "Gagnon", "Bouchard", "Côté", "Bélanger", "Gauthier", "Morin",
    "Lavoie", "Fortin", "Gagné", "Ouellet", "Pelletier", "Bergeron",
    "Leblanc", "Girard", "Savard", "Villeneuve", "Caron", "Beaulieu",
    "Thibault", "Dubois", "Poirier", "Lacroix", "Auger", "Denis",
    "Lefebvre", "Charbonneau", "Lapierre", "Bolduc",
  ],
};
