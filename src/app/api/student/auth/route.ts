import { NextResponse, type NextRequest } from "next/server";
import { validateInitData } from "@/lib/telegram/initData";
import { upsertStudentByTelegram } from "@/lib/db/studentRepo";
import { startStudentSession } from "@/lib/auth/student";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { initData } = await req.json();
  const token = process.env.TELEGRAM_BOT_TOKEN ?? "";
  const user = typeof initData === "string" ? validateInitData(initData, token) : null;
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ")
    || user.username || `id${user.id}`;
  const student = await upsertStudentByTelegram({ telegramId: user.id, name });
  await startStudentSession(student.id);
  return NextResponse.json({ ok: true });
}
