export type QuestionType = "choice" | "open";

export type PartStatus =
  | "not_started"
  | "in_progress"
  | "pending_review"
  | "completed";

export interface Student {
  id: string;
  telegramId: string;
  name: string;
  startLevel: number; // с какого уровня ученику открыт доступ
}

export interface Book {
  id: string;
  title: string;
  description: string;
  coverUrl: string | null;
  level: number; // уровень книги; уровень — это ровно одна книга
}

export interface Part {
  id: string;
  bookId: string;
  order: number; // 1..N
  title: string;
  readingText: string;
}

export interface Question {
  id: string;
  partId: string;
  type: QuestionType;
  text: string;
  points: number;
  options: string[];
  correctOptionIndex: number | null;
}

export interface Answer {
  questionId: string;
  selectedOptionIndex: number | null;
  textAnswer: string | null;
  graded: boolean;
  awardedPoints: number | null;
  teacherComment: string | null;
}

export interface Attempt {
  id: string;
  studentId: string;
  partId: string;
  answers: Answer[];
}
