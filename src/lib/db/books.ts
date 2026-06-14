import { createServerSupabase } from "@/lib/supabase/client";
import { bookFromRow } from "@/lib/db/mappers";
import type { Book } from "@/lib/types";

export async function listBooks(): Promise<Book[]> {
  const db = createServerSupabase();
  const { data, error } = await db.from("books").select("*").order("created_at");
  if (error) throw error;
  return (data ?? []).map(bookFromRow);
}

export async function createBook(input: { title: string; description: string }): Promise<Book> {
  const db = createServerSupabase();
  const { data, error } = await db.from("books")
    .insert({ title: input.title, description: input.description })
    .select("*").single();
  if (error) throw error;
  return bookFromRow(data);
}

export async function updateBook(id: string, input: { title: string; description: string }): Promise<void> {
  const db = createServerSupabase();
  const { error } = await db.from("books").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteBook(id: string): Promise<void> {
  const db = createServerSupabase();
  const { error } = await db.from("books").delete().eq("id", id);
  if (error) throw error;
}
