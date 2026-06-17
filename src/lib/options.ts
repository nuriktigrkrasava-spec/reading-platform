// Буквенная маркировка вариантов ответа: 0 → A, 1 → B, 2 → C, 3 → D …
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function optionLetter(index: number): string {
  if (index < 0) return "?";
  if (index < LETTERS.length) return LETTERS[index];
  return String(index + 1); // запасной вариант, если букв не хватит
}

// Доступные классы платформы (1–4).
export const GRADES = [1, 2, 3, 4] as const;
export type Grade = (typeof GRADES)[number];

export function gradeLabel(grade: number): string {
  return `${grade}-сынып`;
}
