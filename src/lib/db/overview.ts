import type { BookProgress } from "@/lib/progress/bookProgress";
import { listParts } from "@/lib/db/parts";
import { loadPartData, bookProgressFrom } from "@/lib/db/studentProgress";

// Прогресс одного ученика по одной книге. Пакетная загрузка (3 запроса)
// вместо прежних ~3×N по числу частей.
export async function studentBookProgress(
  studentId: string, bookId: string,
): Promise<BookProgress> {
  const parts = await listParts(bookId);
  const data = await loadPartData(studentId, parts.map((p) => p.id));
  return bookProgressFrom(parts, data);
}
