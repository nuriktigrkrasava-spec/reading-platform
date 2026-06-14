import { createServerSupabase } from "@/lib/supabase/client";
import { studentFromRow, bookFromRow, questionFromRow } from "@/lib/db/mappers";
import { listParts } from "@/lib/db/parts";
import { listQuestions } from "@/lib/db/questions";
import { computePartStatus } from "@/lib/progress/partStatus";
import { unlockedPartIds } from "@/lib/progress/unlock";
import { studentBookProgress } from "@/lib/db/overview";
import type { Student, Book, Part, PartStatus, Question, Answer } from "@/lib/types";
import type { BookProgress } from "@/lib/progress/bookProgress";

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

export async function enrolledBooksWithProgress(studentId: string): Promise<EnrolledBook[]> {
  const db = createServerSupabase();
  const { data, error } = await db.from("enrollments")
    .select("books!inner(*)").eq("student_id", studentId);
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const books: Book[] = (data ?? []).map((r: any) => bookFromRow(r.books));
  const result: EnrolledBook[] = [];
  for (const book of books) {
    result.push({ book, progress: await studentBookProgress(studentId, book.id) });
  }
  return result;
}

export interface PartWithStatus { part: Part; status: PartStatus; unlocked: boolean; }

export async function studentAnswersForPart(
  studentId: string, partId: string,
): Promise<Answer[]> {
  const db = createServerSupabase();
  const { data: attempt } = await db.from("attempts")
    .select("id").eq("student_id", studentId).eq("part_id", partId).maybeSingle();
  if (!attempt) return [];
  const { data: rows } = await db.from("answers").select("*").eq("attempt_id", attempt.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (rows ?? []).map((r: any) => ({
    questionId: r.question_id,
    selectedOptionIndex: r.selected_option_index,
    textAnswer: r.text_answer,
    graded: r.graded,
    awardedPoints: r.awarded_points,
    teacherComment: r.teacher_comment,
  }));
}

export async function partsWithStatus(
  studentId: string, bookId: string,
): Promise<PartWithStatus[]> {
  const parts = await listParts(bookId);
  const statusById = new Map<string, PartStatus>();
  for (const part of parts) {
    const questions = await listQuestions(part.id);
    const answers = await studentAnswersForPart(studentId, part.id);
    statusById.set(part.id, computePartStatus(questions, answers));
  }
  const unlocked = unlockedPartIds(parts, statusById);
  return parts.map((part) => ({
    part,
    status: statusById.get(part.id) ?? "not_started",
    unlocked: unlocked.has(part.id),
  }));
}

export interface PartDetail {
  part: Part; questions: Question[]; answers: Answer[]; status: PartStatus; unlocked: boolean;
}

export async function partDetail(
  studentId: string, bookId: string, partId: string,
): Promise<PartDetail | null> {
  const all = await partsWithStatus(studentId, bookId);
  const target = all.find((p) => p.part.id === partId);
  if (!target) return null;
  const db = createServerSupabase();
  const { data: qrows } = await db.from("questions").select("*").eq("part_id", partId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const questions = (qrows ?? []).map((r: any) => questionFromRow(r));
  const answers = await studentAnswersForPart(studentId, partId);
  return { part: target.part, questions, answers, status: target.status, unlocked: target.unlocked };
}
