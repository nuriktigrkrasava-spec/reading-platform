import { createServerSupabase } from "@/lib/supabase/client";
import { fetchAllRows } from "@/lib/db/paginate";
import { computePartStatus } from "@/lib/progress/partStatus";
import { computeBookProgress, type BookProgress } from "@/lib/progress/bookProgress";
import type { Answer, Part, PartStatus, QuestionScoring } from "@/lib/types";
import type { AnswerRow } from "@/lib/db/rowTypes";

// Только те колонки вопроса, что нужны для статуса и баллов. Текст и варианты
// не запрашиваются: на списке частей они не показываются, а весят больше всего
// остального вместе взятого.
const SCORING_COLUMNS = "id, part_id, type, points, correct_option_index";

export interface ScoringRow {
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

export interface AttemptRef { id: string; part_id: string }

// Вопросы всей платформы в лёгком виде. Фильтр по частям не нужен: экранам
// прогресса нужны вопросы всех книг сразу, а лишние строки ничего не стоят,
// зато запрос перестаёт зависеть от списка частей и уходит в общий пакет.
export function fetchScoringQuestions(): Promise<ScoringRow[]> {
  const db = createServerSupabase();
  return fetchAllRows<ScoringRow>((from, to) =>
    db.from("questions").select(SCORING_COLUMNS).order("id").range(from, to),
  );
}

export function fetchStudentAttempts(studentId: string): Promise<AttemptRef[]> {
  const db = createServerSupabase();
  return fetchAllRows<AttemptRef>((from, to) =>
    db.from("attempts").select("id, part_id")
      .eq("student_id", studentId).order("id").range(from, to),
  );
}

// Собирает PartData из уже загруженных вопросов и попыток, дозапрашивая
// только ответы. Так вопросы и попытки уезжают в общий параллельный пакет
// вместе с книгами и частями, и на страницу остаётся два круга к базе
// вместо пяти — при задержке около секунды на круг это решает всё.
export async function partDataFrom(
  questionRows: ScoringRow[],
  attempts: AttemptRef[],
): Promise<PartData> {
  const questionsByPart = new Map<string, QuestionScoring[]>();
  const answersByPart = new Map<string, Answer[]>();

  for (const r of questionRows) {
    const q = scoringFromRow(r);
    const arr = questionsByPart.get(q.partId);
    if (arr) arr.push(q);
    else questionsByPart.set(q.partId, [q]);
  }

  const partByAttempt = new Map<string, string>();
  for (const a of attempts) partByAttempt.set(a.id, a.part_id);
  const attemptIds = [...partByAttempt.keys()];
  if (attemptIds.length === 0) return { questionsByPart, answersByPart };

  const db = createServerSupabase();
  const arows = await fetchAllRows<AnswerRow>((from, to) =>
    db.from("answers").select("*").in("attempt_id", attemptIds)
      .order("id").range(from, to),
  );
  for (const r of arows) {
    const partId = partByAttempt.get(r.attempt_id);
    if (!partId) continue;
    const ans = answerFromRow(r);
    const arr = answersByPart.get(partId);
    if (arr) arr.push(ans);
    else answersByPart.set(partId, [ans]);
  }

  return { questionsByPart, answersByPart };
}

export async function loadPartData(
  studentId: string,
  partIds: string[],
): Promise<PartData> {
  if (partIds.length === 0) {
    return { questionsByPart: new Map(), answersByPart: new Map() };
  }
  const db = createServerSupabase();
  const [questionRows, attempts] = await Promise.all([
    fetchAllRows<ScoringRow>((from, to) =>
      db.from("questions").select(SCORING_COLUMNS)
        .in("part_id", partIds).order("id").range(from, to),
    ),
    fetchAllRows<AttemptRef>((from, to) =>
      db.from("attempts").select("id, part_id")
        .eq("student_id", studentId).in("part_id", partIds)
        .order("id").range(from, to),
    ),
  ]);
  return partDataFrom(questionRows, attempts);
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
