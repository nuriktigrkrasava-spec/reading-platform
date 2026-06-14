import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Серверный клиент с сервисным ключом — используется только в серверном коде
// (route handlers, server actions). Никогда не импортировать в клиентские компоненты.
export function createServerSupabase() {
  if (!url || !serviceKey) {
    throw new Error("Supabase env vars are not set");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
