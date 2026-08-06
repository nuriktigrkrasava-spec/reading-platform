import { createServerSupabase } from "@/lib/supabase/client";
import { studentFromRow, partFromRow } from "@/lib/db/mappers";
import { listParts } from "@/lib/db/parts";
import { listQuestions } from "@/lib/db/questions";
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
  pendingReview: number; // частей, ждущих проверки учителем
}

interface Ladder {
  books: Book[];
  partsByBook: Map<string, Part[]>;
  data: PartData;
  statusById: Map<string, PartStatus>;
  unlockedThrough: number;
}

// Одна загрузка всего, что нужно экранам ученика: книги, их части, данные
// прогресса и посчитанная граница открытых уровней. Три пакетных запроса
// на страницу.
//
// Раньше страница книги грузила это дважды: сначала чтобы проверить доступ
// к уровню, потом заново ради статусов частей. Теперь загрузка одна, а
// проверка доступа и список частей считаются из общего результата.
async function loadLadder(studentId: string, startLevel: number): Promise<Ladder> {
  const books = await listBooks();
  const empty: Ladder = {
    books, partsByBook: new Map(),
    data: { questionsByPart: new Map(), answersByPart: new Map() },
    statusById: new Map(), unlockedThrough: startLevel,
  };
  if (books.length === 0) return empty;

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

  const unlockedThrough = unlockedThroughLevel(
    books.map((b) => ({
      level: b.level,
      partIds: (partsByBook.get(b.id) ?? []).map((p) => p.id),
    })),
    startLevel,
    statusById,
  );

  return { books, partsByBook, data, statusById, unlockedThrough };
}

export async function levelsWithProgress(
  studentId: string, startLevel: number,
): Promise<LevelEntry[]> {
  const l = await loadLadder(studentId, startLevel);
  return l.books.map((book) => {
    const parts = l.partsByBook.get(book.id) ?? [];
    return {
      book,
      progress: bookProgressFrom(parts, l.data),
      unlocked: isLevelUnlocked(book.level, l.unlockedThrough),
      pendingReview: parts.filter(
        (p) => l.statusById.get(p.id) === "pending_review",
      ).length,
    };
  });
}

export interface BookView { unlocked: boolean; parts: PartWithStatus[]; }

// Доступ к книге и статусы её частей за одну загрузку.
export async function bookView(
  studentId: string, startLevel: number, bookId: string,
): Promise<BookView> {
  const l = await loadLadder(studentId, startLevel);
  const book = l.books.find((b) => b.id === bookId);
  if (!book) return { unlocked: false, parts: [] };
  return {
    unlocked: isLevelUnlocked(book.level, l.unlockedThrough),
    parts: withStatuses(l.partsByBook.get(bookId) ?? [], l.data),
  };
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
  part: Part; questions: Question[]; answers: Answer[]; status: PartStatus;
  unlocked: boolean; bookUnlocked: boolean;
}

// Экран одной части: доступ к книге, статус части и её вопросы целиком.
// Тексты и варианты грузятся только здесь и только для этой части — общая
// загрузка прогресса тянет по вопросам лишь тип и баллы.
export async function partDetail(
  studentId: string, startLevel: number, bookId: string, partId: string,
): Promise<PartDetail | null> {
  const l = await loadLadder(studentId, startLevel);
  const book = l.books.find((b) => b.id === bookId);
  if (!book) return null;

  const all = withStatuses(l.partsByBook.get(bookId) ?? [], l.data);
  const target = all.find((p) => p.part.id === partId);
  if (!target) return null;

  return {
    part: target.part,
    questions: await listQuestions(partId),
    answers: l.data.answersByPart.get(partId) ?? [],
    status: target.status,
    unlocked: target.unlocked,
    bookUnlocked: isLevelUnlocked(book.level, l.unlockedThrough),
  };
}
