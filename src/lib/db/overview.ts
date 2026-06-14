import type { BookProgress } from "@/lib/progress/bookProgress";
import { createServerSupabase } from "@/lib/supabase/client";
import { listParts } from "@/lib/db/parts";
import { listQuestions } from "@/lib/db/questions";
import { computePartStatus } from "@/lib/progress/partStatus";
import { computeBookProgress } from "@/lib/progress/bookProgress";
import type { Answer } from "@/lib/types";

// Returns progress for one student in one book.
export async function studentBookProgress(studentId: string, bookId: string): Promise<BookProgress> {
  const db = createServerSupabase();
  const parts = await listParts(bookId);
  const completed: { score: number }[] = [];
  for (const part of parts) {
    const questions = await listQuestions(part.id);
    // load this student's attempt for this part + its answers
    const { data: attempt } = await db.from("attempts")
      .select("id").eq("student_id", studentId).eq("part_id", part.id).maybeSingle();
    if (!attempt) continue;
    const { data: rows } = await db.from("answers")
      .select("*").eq("attempt_id", attempt.id);
    const answers: Answer[] = (rows ?? []).map((r) => ({
      questionId: r.question_id,
      selectedOptionIndex: r.selected_option_index,
      textAnswer: r.text_answer,
      graded: r.graded,
      awardedPoints: r.awarded_points,
      teacherComment: r.teacher_comment,
    }));
    if (computePartStatus(questions, answers) === "completed") {
      const score = answers.reduce((sum, a) => {
        const q = questions.find((qq) => qq.id === a.questionId);
        if (!q) return sum;
        if (q.type === "open") return sum + (a.awardedPoints ?? 0);
        return sum + (a.selectedOptionIndex === q.correctOptionIndex ? q.points : 0);
      }, 0);
      completed.push({ score });
    }
  }
  return computeBookProgress(parts.length, completed);
}
