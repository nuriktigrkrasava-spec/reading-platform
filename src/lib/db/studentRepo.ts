import { createServerSupabase } from "@/lib/supabase/client";
import { studentFromRow, partFromRow } from "@/lib/db/mappers";
import { listParts } from "@/lib/db/parts";
import { listBooks } from "@/lib/db/books";
import { unlockedPartIds } from "@/lib/progress/unlock";
import { unlockedThroughLevel, isLevelUnlocked } from "@/lib/progress/levelUnlock";
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

export interface LevelEntry {
  book: Book;
  progress: BookProgress;
  unlocked: boolean;
}

// Все книги-уровни по возрастанию с прогрессом ученика и признаком доступа.
// Грузим все части сразу (их десятки, не тысячи): четыре пакетных запроса
// вместо запроса на книгу.
export async function levelsWithProgress(
  studentId: string, startLevel: number,
): Promise<LevelEntry[]> {
  const books = await listBooks();
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

  const statusById = new Map<string, PartStatus>();
  for (const p of parts) statusById.set(p.id, statusFor(p.id, data));

  const through = unlockedThroughLevel(
    books.map((b) => ({
      level: b.level,
      partIds: (partsByBook.get(b.id) ?? []).map((p) => p.id),
    })),
    startLevel,
    statusById,
  );

  return books.map((book) => ({
    book,
    progress: bookProgressFrom(partsByBook.get(book.id) ?? [], data),
    unlocked: isLevelUnlocked(book.level, through),
  }));
}

export async function isBookUnlockedForStudent(
  studentId: string, startLevel: number, bookId: string,
): Promise<boolean> {
  const levels = await levelsWithProgress(studentId, startLevel);
  return levels.some((l) => l.book.id === bookId && l.unlocked);
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
