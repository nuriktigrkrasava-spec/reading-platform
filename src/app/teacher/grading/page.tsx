import { listPendingOpenAnswers } from "@/lib/db/grading";
import { gradeAction } from "@/app/teacher/actions";
import PageHeader from "@/components/teacher/PageHeader";
import SubmitButton from "@/components/teacher/SubmitButton";
import styles from "./grading.module.css";

export const dynamic = "force-dynamic";

export default async function GradingPage() {
  const pending = await listPendingOpenAnswers();

  return (
    <>
      <PageHeader
        eyebrow="Очередь проверки"
        title="Проверка"
        description="Открытые ответы учеников, ожидающие вашей оценки. Выставьте баллы и при желании оставьте комментарий."
        action={
          pending.length > 0 ? (
            <span className="t-chip t-chip-clay">
              {pending.length} на проверке
            </span>
          ) : undefined
        }
      />

      {pending.length === 0 ? (
        <div className="t-empty">Нет ответов на проверке</div>
      ) : (
        <div className={styles.list}>
          {pending.map((item) => (
            <article key={item.answerId} className={styles.card}>
              <div className={styles.crumbs}>
                <span className={styles.student}>{item.studentName}</span>
                <span className={styles.sep}>·</span>
                <span>{item.bookTitle}</span>
                <span className={styles.sep}>·</span>
                <span>{item.partTitle}</span>
              </div>

              <div className={styles.body}>
                <div>
                  <p className={styles.question}>Вопрос</p>
                  <p className={styles.qText}>{item.questionText}</p>

                  <p className={styles.answerLabel}>Ответ ученика</p>
                  {item.textAnswer ? (
                    <p className={styles.answer}>{item.textAnswer}</p>
                  ) : (
                    <p className={`${styles.answer} ${styles.answerEmpty}`}>
                      Ученик не оставил текста.
                    </p>
                  )}
                </div>

                <form action={gradeAction} className={styles.gradeForm}>
                  <input type="hidden" name="answerId" value={item.answerId} />
                  <div>
                    <label
                      className="t-label"
                      htmlFor={`points-${item.answerId}`}
                    >
                      Баллы
                    </label>
                    <input
                      id={`points-${item.answerId}`}
                      name="awardedPoints"
                      type="number"
                      min={0}
                      max={item.maxPoints}
                      defaultValue={0}
                      required
                      className="t-input"
                    />
                    <p className={styles.maxHint}>
                      Максимум: {item.maxPoints}
                    </p>
                  </div>
                  <div>
                    <label
                      className="t-label"
                      htmlFor={`comment-${item.answerId}`}
                    >
                      Комментарий
                    </label>
                    <textarea
                      id={`comment-${item.answerId}`}
                      name="comment"
                      rows={3}
                      className="t-textarea"
                      placeholder="Необязательно — пояснение к оценке"
                    />
                  </div>
                  <SubmitButton
                    className="t-btn t-btn-primary"
                    pendingText="Сохраняем…"
                  >
                    Оценить ответ
                  </SubmitButton>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
