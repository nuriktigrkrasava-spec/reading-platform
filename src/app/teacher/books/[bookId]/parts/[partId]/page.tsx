import Link from "next/link";
import { notFound } from "next/navigation";
import { listParts } from "@/lib/db/parts";
import { listQuestions } from "@/lib/db/questions";
import { deleteQuestionAction } from "@/app/teacher/actions";
import PageHeader from "@/components/teacher/PageHeader";
import SubmitButton from "@/components/teacher/SubmitButton";
import QuestionBuilder from "@/components/teacher/QuestionBuilder";
import styles from "./part.module.css";

export const dynamic = "force-dynamic";

function pointsLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "балл";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "балла";
  return "баллов";
}

export default async function PartBuilderPage({
  params,
}: {
  params: Promise<{ bookId: string; partId: string }>;
}) {
  const { bookId, partId } = await params;
  const parts = await listParts(bookId);
  const part = parts.find((p) => p.id === partId);
  if (!part) notFound();

  const questions = await listQuestions(partId);

  return (
    <>
      <PageHeader
        eyebrow={`Часть ${part.order} · Конструктор теста`}
        title={part.title}
        description="Соберите тест: вопросы с вариантами проверяются автоматически, открытые — вручную в разделе «Проверка»."
        back={
          <Link
            href={`/teacher/books/${bookId}`}
            className="t-btn t-btn-ghost t-btn-sm"
          >
            ← К частям книги
          </Link>
        }
      />

      <div className={styles.layout}>
        <div className={styles.questions}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTitle}>Вопросы теста</span>
            <span className={styles.count}>Всего: {questions.length}</span>
          </div>

          {questions.length === 0 ? (
            <div className="t-empty">
              В тесте пока нет вопросов. Добавьте первый справа.
            </div>
          ) : (
            questions.map((q) => (
              <article key={q.id} className={styles.q}>
                <div className={styles.qHead}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className={styles.qMeta}>
                      <span
                        className={
                          q.type === "choice"
                            ? "t-chip t-chip-clay"
                            : "t-chip t-chip-gold"
                        }
                      >
                        {q.type === "choice" ? "С вариантами" : "Открытый"}
                      </span>
                      <span className="t-chip">
                        {q.points} {pointsLabel(q.points)}
                      </span>
                    </div>
                    <p className={styles.qText}>{q.text}</p>
                  </div>

                  <form action={deleteQuestionAction}>
                    <input type="hidden" name="bookId" value={bookId} />
                    <input type="hidden" name="partId" value={partId} />
                    <input type="hidden" name="questionId" value={q.id} />
                    <SubmitButton
                      className="t-btn t-btn-danger t-btn-sm"
                      pendingText="Удаление…"
                    >
                      Удалить
                    </SubmitButton>
                  </form>
                </div>

                {q.type === "choice" ? (
                  <div className={styles.options}>
                    {q.options.map((opt, i) => {
                      const correct = i === q.correctOptionIndex;
                      return (
                        <div
                          key={i}
                          className={`${styles.option} ${
                            correct ? styles.optionCorrect : ""
                          }`}
                        >
                          <span className={styles.optMark}>
                            {correct && (
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            )}
                          </span>
                          {opt}
                          {correct && (
                            <span style={{ marginLeft: "auto", fontSize: 12 }}>
                              верный
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className={styles.openHint}>
                    Открытый ответ — баллы выставляет преподаватель при проверке.
                  </p>
                )}
              </article>
            ))
          )}
        </div>

        <aside className={styles.aside}>
          <QuestionBuilder bookId={bookId} partId={partId} />
        </aside>
      </div>
    </>
  );
}
