import Link from "next/link";
import { getStudentId } from "@/lib/auth/student";
import { partDetail } from "@/lib/db/studentRepo";
import { optionLetter } from "@/lib/options";
import type { Answer, Question } from "@/lib/types";
import LoadingScreen from "@/components/student/LoadingScreen";
import PartTest from "@/components/student/PartTest";
import { ChevronLeft } from "@/components/student/icons";
import styles from "../../../../app.module.css";

export const dynamic = "force-dynamic";

function ChoiceResult({ q, a }: { q: Question; a: Answer | undefined }) {
  const selected = a?.selectedOptionIndex ?? null;
  const correct = q.correctOptionIndex;
  const isCorrect = selected !== null && selected === correct;
  return (
    <div className={styles.resultCard}>
      <div className={styles.qHead}>
        <span className={styles.qText}>{q.text}</span>
      </div>
      <div className={styles.answerLine}>
        <span className={styles.answerLabel}>Ваш ответ</span>
        <span className={styles.answerValue}>
          {selected !== null
            ? `${optionLetter(selected)}. ${q.options[selected] ?? "—"}`
            : "—"}
        </span>
      </div>
      <span
        className={`${styles.verdict} ${isCorrect ? styles.verdictOk : styles.verdictNo}`}
      >
        {isCorrect ? "Верно" : "Неверно"}
      </span>
      {!isCorrect && correct !== null ? (
        <span className={styles.correctNote}>
          Правильный ответ: {optionLetter(correct)}. {q.options[correct] ?? "—"}
        </span>
      ) : null}
    </div>
  );
}

function OpenResult({ q, a }: { q: Question; a: Answer | undefined }) {
  const graded = a?.graded ?? false;
  return (
    <div className={styles.resultCard}>
      <div className={styles.qHead}>
        <span className={styles.qText}>{q.text}</span>
      </div>
      <div className={styles.answerLine}>
        <span className={styles.answerLabel}>Ваш ответ</span>
        <span className={styles.answerValue}>{a?.textAnswer || "—"}</span>
      </div>
      {graded ? (
        <>
          <span className={styles.points}>
            {a?.awardedPoints ?? 0} из {q.points} б.
          </span>
          {a?.teacherComment ? (
            <div className={styles.comment}>{a.teacherComment}</div>
          ) : null}
        </>
      ) : (
        <span className={`${styles.verdict} ${styles.verdictNo}`}>
          На проверке у учителя
        </span>
      )}
    </div>
  );
}

export default async function PartPage({
  params,
}: {
  params: Promise<{ bookId: string; partId: string }>;
}) {
  const { bookId, partId } = await params;
  const studentId = await getStudentId();
  if (!studentId) return <LoadingScreen />;

  const detail = await partDetail(studentId, bookId, partId);

  const backLink = (
    <Link href={`/app/books/${bookId}`} className={styles.back}>
      <ChevronLeft />
      К частям книги
    </Link>
  );

  if (!detail) {
    return (
      <div className={styles.shell}>
        {backLink}
        <div className={styles.notice}>Часть не найдена</div>
      </div>
    );
  }

  if (!detail.unlocked) {
    return (
      <div className={styles.shell}>
        {backLink}
        <div className={styles.notice}>
          <span className={styles.noticeIcon}>🔒</span>
          Эта часть пока закрыта
        </div>
      </div>
    );
  }

  const { part, questions, answers, status } = detail;
  const showTest = status === "not_started" || status === "in_progress";
  const answerByQ = new Map(answers.map((a) => [a.questionId, a]));

  return (
    <div className={styles.shell}>
      {backLink}

      <header className={styles.header}>
        <span className={styles.eyebrow}>Часть {part.order}</span>
        <h1 className={styles.title}>{part.title}</h1>
      </header>

      <span className={styles.sectionLabel}>Текст</span>
      <div className={styles.reading}>{part.readingText}</div>

      {showTest ? (
        <>
          <span className={styles.sectionLabel}>Вопросы</span>
          <PartTest bookId={bookId} partId={partId} questions={questions} />
        </>
      ) : (
        <>
          <span className={styles.sectionLabel}>
            {status === "pending_review" ? "Ваши ответы · на проверке" : "Результат"}
          </span>
          <div className={styles.partList}>
            {questions.map((q) =>
              q.type === "choice" ? (
                <ChoiceResult key={q.id} q={q} a={answerByQ.get(q.id)} />
              ) : (
                <OpenResult key={q.id} q={q} a={answerByQ.get(q.id)} />
              ),
            )}
          </div>
        </>
      )}
    </div>
  );
}
