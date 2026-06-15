import { createServerSupabase } from "@/lib/supabase/client";
import { studentFromRow } from "@/lib/db/mappers";
import type { Student } from "@/lib/types";

export async function listStudents(): Promise<Student[]> {
  const db = createServerSupabase();
  const { data, error } = await db.from("students").select("*").order("created_at");
  if (error) throw error;
  return (data ?? []).map(studentFromRow);
}

export async function getStudent(studentId: string): Promise<Student | null> {
  const db = createServerSupabase();
  const { data, error } = await db.from("students").select("*").eq("id", studentId).maybeSingle();
  if (error) throw error;
  return data ? studentFromRow(data) : null;
}

export async function setStudentGrade(studentId: string, grade: number): Promise<void> {
  const db = createServerSupabase();
  const { error } = await db.from("students").update({ grade }).eq("id", studentId);
  if (error) throw error;
}
