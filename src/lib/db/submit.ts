import { createServerSupabase } from "@/lib/supabase/client";
import { listQuestions } from "@/lib/db/questions";

export interface SubmittedAnswer {
  questionId: string;
  selectedOptionIndex: number | null;
  textAnswer: string | null;
}

export async function submitPart(
  studentId: string, partId: string, submitted: SubmittedAnswer[],
): Promise<void> {
  const db = createServerSupabase();

  const { data: existing } = await db.from("attempts")
    .select("id").eq("student_id", studentId).eq("part_id", partId).maybeSingle();
  if (existing) return; // уже отправлено — идемпотентно

  const questions = await listQuestions(partId);
  const typeById = new Map(questions.map((q) => [q.id, q.type]));

  const { data: attempt, error: aerr } = await db.from("attempts")
    .insert({ student_id: studentId, part_id: partId }).select("id").single();
  if (aerr) throw aerr;

  const rows = submitted.map((s) => {
    const isChoice = typeById.get(s.questionId) === "choice";
    return {
      attempt_id: attempt.id,
      question_id: s.questionId,
      selected_option_index: isChoice ? s.selectedOptionIndex : null,
      text_answer: isChoice ? null : s.textAnswer,
      graded: isChoice, // choice автоматически «проверен»
      awarded_points: null,
      teacher_comment: null,
    };
  });
  const { error: anserr } = await db.from("answers").insert(rows);
  if (anserr) throw anserr;
}
