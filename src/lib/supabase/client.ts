import { createClient } from "@supabase/supabase-js";
import WS from "ws";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// supabase-js при создании клиента сразу инициализирует Realtime-клиент,
// которому нужен глобальный WebSocket. На Node < 22 его нет, и без этого
// падал бы каждый серверный запрос к базе. Realtime мы не используем, но
// обязаны дать конструктору совместимый транспорт.
export function createServerSupabase() {
  if (!url || !serviceKey) {
    throw new Error("Supabase env vars are not set");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    realtime: { transport: WS as any },
  });
}
