import { createServerSupabase } from "@/lib/supabase/client";
import { partFromRow } from "@/lib/db/mappers";
import type { Part } from "@/lib/types";

export async function listParts(bookId: string): Promise<Part[]> {
  const db = createServerSupabase();
  const { data, error } = await db.from("parts").select("*")
    .eq("book_id", bookId).order("order");
  if (error) throw error;
  return (data ?? []).map(partFromRow);
}

export async function createPart(input: {
  bookId: string; order: number; title: string; readingText: string;
}): Promise<Part> {
  const db = createServerSupabase();
  const { data, error } = await db.from("parts").insert({
    book_id: input.bookId, order: input.order, title: input.title, reading_text: input.readingText,
  }).select("*").single();
  if (error) throw error;
  return partFromRow(data);
}

export async function updatePart(id: string, input: {
  title: string; readingText: string;
}): Promise<void> {
  const db = createServerSupabase();
  const { error } = await db.from("parts")
    .update({ title: input.title, reading_text: input.readingText }).eq("id", id);
  if (error) throw error;
}

export async function deletePart(id: string): Promise<void> {
  const db = createServerSupabase();
  const { error } = await db.from("parts").delete().eq("id", id);
  if (error) throw error;
}

export async function nextPartOrder(bookId: string): Promise<number> {
  const parts = await listParts(bookId);
  return parts.length === 0 ? 1 : Math.max(...parts.map((p) => p.order)) + 1;
}
