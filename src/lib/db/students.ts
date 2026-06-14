import { createServerSupabase } from "@/lib/supabase/client";
import { studentFromRow } from "@/lib/db/mappers";
import type { Student } from "@/lib/types";

export async function listStudents(): Promise<Student[]> {
  const db = createServerSupabase();
  const { data, error } = await db.from("students").select("*").order("created_at");
  if (error) throw error;
  return (data ?? []).map(studentFromRow);
}

export async function listEnrolledBookIds(studentId: string): Promise<string[]> {
  const db = createServerSupabase();
  const { data, error } = await db.from("enrollments")
    .select("book_id").eq("student_id", studentId);
  if (error) throw error;
  return (data ?? []).map((r) => r.book_id as string);
}

export async function enroll(studentId: string, bookId: string): Promise<void> {
  const db = createServerSupabase();
  const { error } = await db.from("enrollments")
    .upsert({ student_id: studentId, book_id: bookId }, { onConflict: "student_id,book_id" });
  if (error) throw error;
}

export async function unenroll(studentId: string, bookId: string): Promise<void> {
  const db = createServerSupabase();
  const { error } = await db.from("enrollments").delete()
    .eq("student_id", studentId).eq("book_id", bookId);
  if (error) throw error;
}
