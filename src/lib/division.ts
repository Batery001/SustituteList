export type Division = "junior" | "senior" | "master";

/** Divisiones de edad Play! Pokémon (año de referencia de la temporada). */
export function getDivision(
  birthDate: Date,
  referenceYear = new Date().getFullYear()
): Division {
  const birthYear = birthDate.getUTCFullYear();

  if (birthYear >= referenceYear - 12) return "junior";
  if (birthYear >= referenceYear - 17) return "senior";
  return "master";
}

export function formatDivision(division: Division): string {
  const labels: Record<Division, string> = {
    junior: "Junior",
    senior: "Senior",
    master: "Master",
  };
  return labels[division];
}
