import { createServerSupabase } from "@/lib/supabase/client";
import { studentFromRow, partFromRow } from "@/lib/db/mappers";
import { listParts } from "@/lib/db/parts";
import { listBooksForGrade } from "@/lib/db/books";
import { unlockedPartIds } from "@/lib/progress/unlock";
import {
  loadPartData, statusFor, bookProgressFrom, type PartData,
} from "@/lib/db/studentProgress";
import type { Student, Book, Part, PartStatus, Question, Answer } from "@/lib/types";
import type { BookProgress } from "@/lib/progress/bookProgress";
import type { PartRow } from "@/lib/db/rowTypes";

export async function upsertStudentByTelegram(input: {
  telegramId: string; name: string;
}): Promise<Student> {
  const db = createServerSupabase();
  const { data, error } = await db.from("students")
    .upsert({ telegram_id: input.telegramId, name: input.name }, { onConflict: "telegram_id" })
    .select("*").single();
  if (error) throw error;
  return studentFromRow(data);
}

export interface EnrolledBook { book: Book; progress: BookProgress; }

// Книги класса ученика + его прогресс по каждой. Доступ определяется
// выбранным классом (grade), а не ручной записью учителя.
// Раньше тут был N+1 на N+1 (по книге → по части): для класса с 5 книгами по
// 30 частей выходило ~450 последовательных запросов. Теперь — ~4 пакетных:
// книги класса, все их части, и одна пакетная загрузка данных ученика.
export async function booksForGradeWithProgress(
  studentId: string, grade: number,
): Promise<EnrolledBook[]> {
  const books = await listBooksForGrade(grade);
  if (books.length === 0) return [];

  const db = createServerSupabase();
  const { data: partRows, error } = await db.from("parts")
    .select("*").in("book_id", books.map((b) => b.id)).order("order");
  if (error) throw error;
  const parts = ((partRows ?? []) as PartRow[]).map(partFromRow);

  const data = await loadPartData(studentId, parts.map((p) => p.id));

  const partsByBook = new Map<string, Part[]>();
  for (const p of parts) {
    const arr = partsByBook.get(p.bookId);
    if (arr) arr.push(p);
    else partsByBook.set(p.bookId, [p]);
  }

  return books.map((book) => ({
    book,
    progress: bookProgressFrom(partsByBook.get(book.id) ?? [], data),
  }));
}

export interface PartWithStatus { part: Part; status: PartStatus; unlocked: boolean; }

function withStatuses(parts: Part[], data: PartData): PartWithStatus[] {
  const statusById = new Map<string, PartStatus>();
  for (const part of parts) statusById.set(part.id, statusFor(part.id, data));
  const unlocked = unlockedPartIds(parts, statusById);
  return parts.map((part) => ({
    part,
    status: statusById.get(part.id) ?? "not_started",
    unlocked: unlocked.has(part.id),
  }));
}

export async function partsWithStatus(
  studentId: string, bookId: string,
): Promise<PartWithStatus[]> {
  const parts = await listParts(bookId);
  const data = await loadPartData(studentId, parts.map((p) => p.id));
  return withStatuses(parts, data);
}

export interface PartDetail {
  part: Part; questions: Question[]; answers: Answer[]; status: PartStatus; unlocked: boolean;
}

export async function partDetail(
  studentId: string, bookId: string, partId: string,
): Promise<PartDetail | null> {
  const parts = await listParts(bookId);
  const data = await loadPartData(studentId, parts.map((p) => p.id));
  const all = withStatuses(parts, data);
  const target = all.find((p) => p.part.id === partId);
  if (!target) return null;
  return {
    part: target.part,
    questions: data.questionsByPart.get(partId) ?? [],
    answers: data.answersByPart.get(partId) ?? [],
    status: target.status,
    unlocked: target.unlocked,
  };
}
