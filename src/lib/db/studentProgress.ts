import { createServerSupabase } from "@/lib/supabase/client";
import { computePartStatus } from "@/lib/progress/partStatus";
import { computeBookProgress, type BookProgress } from "@/lib/progress/bookProgress";
import type { Answer, Part, PartStatus, QuestionScoring } from "@/lib/types";
import type { AnswerRow } from "@/lib/db/rowTypes";

// Только те колонки вопроса, что нужны для статуса и баллов. Текст и варианты
// не запрашиваются: на списке частей они не показываются, а весят больше всего
// остального вместе взятого.
const SCORING_COLUMNS = "id, part_id, type, points, correct_option_index";

interface ScoringRow {
  id: string;
  part_id: string;
  type: "choice" | "open";
  points: number;
  correct_option_index: number | null;
}

function scoringFromRow(r: ScoringRow): QuestionScoring {
  return {
    id: r.id, partId: r.part_id, type: r.type,
    points: r.points, correctOptionIndex: r.correct_option_index,
  };
}

// Всё, что нужно для подсчёта статусов/прогресса одного ученика по набору
// частей. Раньше эти данные грузились по одной части (N+1: для книги из 30
// частей — ~90 последовательных запросов). Здесь — три пакетных запроса
// на любой набор частей: вопросы, попытки ученика, ответы.
export interface PartData {
  questionsByPart: Map<string, QuestionScoring[]>;
  answersByPart: Map<string, Answer[]>;
}

function answerFromRow(r: AnswerRow): Answer {
  return {
    questionId: r.question_id,
    selectedOptionIndex: r.selected_option_index,
    textAnswer: r.text_answer,
    graded: r.graded,
    awardedPoints: r.awarded_points,
    teacherComment: r.teacher_comment,
  };
}

export async function loadPartData(
  studentId: string,
  partIds: string[],
): Promise<PartData> {
  const questionsByPart = new Map<string, QuestionScoring[]>();
  const answersByPart = new Map<string, Answer[]>();
  if (partIds.length === 0) return { questionsByPart, answersByPart };

  const db = createServerSupabase();

  // 1+2. Вопросы частей и попытки ученика друг от друга не зависят —
  // запускаем параллельно (на один сетевой round-trip меньше).
  const [
    { data: qrows, error: qerr },
    { data: attempts, error: aerr },
  ] = await Promise.all([
    db.from("questions").select(SCORING_COLUMNS).in("part_id", partIds),
    db.from("attempts").select("id, part_id")
      .eq("student_id", studentId).in("part_id", partIds),
  ]);
  if (qerr) throw qerr;
  for (const r of (qrows ?? []) as ScoringRow[]) {
    const q = scoringFromRow(r);
    const arr = questionsByPart.get(q.partId);
    if (arr) arr.push(q);
    else questionsByPart.set(q.partId, [q]);
  }

  if (aerr) throw aerr;
  const partByAttempt = new Map<string, string>();
  for (const a of attempts ?? []) partByAttempt.set(a.id, a.part_id);
  const attemptIds = [...partByAttempt.keys()];
  if (attemptIds.length === 0) return { questionsByPart, answersByPart };

  // 3. Ответы по этим попыткам — один запрос.
  const { data: arows, error: anserr } = await db
    .from("answers").select("*").in("attempt_id", attemptIds);
  if (anserr) throw anserr;
  for (const r of (arows ?? []) as AnswerRow[]) {
    const partId = partByAttempt.get(r.attempt_id);
    if (!partId) continue;
    const ans = answerFromRow(r);
    const arr = answersByPart.get(partId);
    if (arr) arr.push(ans);
    else answersByPart.set(partId, [ans]);
  }

  return { questionsByPart, answersByPart };
}

export function statusFor(partId: string, data: PartData): PartStatus {
  return computePartStatus(
    data.questionsByPart.get(partId) ?? [],
    data.answersByPart.get(partId) ?? [],
  );
}

// Баллы за пройденную часть: открытые — выставленные учителем,
// тестовые — points за верный вариант.
function partScore(questions: QuestionScoring[], answers: Answer[]): number {
  return answers.reduce((sum, a) => {
    const q = questions.find((qq) => qq.id === a.questionId);
    if (!q) return sum;
    if (q.type === "open") return sum + (a.awardedPoints ?? 0);
    return sum + (a.selectedOptionIndex === q.correctOptionIndex ? q.points : 0);
  }, 0);
}

export function bookProgressFrom(parts: Part[], data: PartData): BookProgress {
  const completed: { score: number }[] = [];
  for (const part of parts) {
    const questions = data.questionsByPart.get(part.id) ?? [];
    const answers = data.answersByPart.get(part.id) ?? [];
    if (computePartStatus(questions, answers) === "completed") {
      completed.push({ score: partScore(questions, answers) });
    }
  }
  return computeBookProgress(parts.length, completed);
}
