import { listStudents } from "@/lib/db/students";
import { listBooks } from "@/lib/db/books";
import { setStudentGradeAction } from "@/app/teacher/actions";
import PageHeader from "@/components/teacher/PageHeader";
import SubmitButton from "@/components/teacher/SubmitButton";
import { GRADES, gradeLabel } from "@/lib/options";
import styles from "./students.module.css";

export const dynamic = "force-dynamic";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default async function StudentsPage() {
  const [students, books] = await Promise.all([listStudents(), listBooks()]);
  const booksByGrade = new Map<number, number>();
  for (const b of books) booksByGrade.set(b.grade, (booksByGrade.get(b.grade) ?? 0) + 1);

  return (
    <>
      <PageHeader
        eyebrow="Қауымдастық"
        title="Оқушылар"
        description="Оқушылар қолданбаға құпиясөзбен кіріп, өз аты-жөнін жазады. Мұнда олардың сыныбын өзгертуге болады."
      />

      {students.length === 0 ? (
        <div className="t-empty">
          Әзірге оқушылар жоқ. Олар қолданбаға кіргеннен кейін осында көрінеді.
        </div>
      ) : (
        <div className={styles.grid}>
          {students.map((student) => {
            const booksCount = student.grade != null
              ? booksByGrade.get(student.grade) ?? 0
              : 0;
            return (
              <article key={student.id} className={styles.card}>
                <div className={styles.head}>
                  <span className={styles.avatar}>{initials(student.name)}</span>
                  <div>
                    <h2 className={styles.name}>{student.name}</h2>
                    <div className={styles.tg}>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 2L11 13" />
                        <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                      </svg>
                      {student.telegramId}
                    </div>
                  </div>
                </div>

                <div className={styles.block}>
                  <p className={styles.blockTitle}>Сынып</p>
                  {student.grade != null ? (
                    <p className={styles.emptyEnrolled}>
                      {gradeLabel(student.grade)} · қолжетімді кітап: {booksCount}
                    </p>
                  ) : (
                    <p className={styles.emptyEnrolled}>
                      Оқушы әлі қолданбада сыныбын таңдамаған.
                    </p>
                  )}
                </div>

                <div className={styles.block}>
                  <p className={styles.blockTitle}>Сыныпты өзгерту</p>
                  <form action={setStudentGradeAction} className={styles.enrollForm}>
                    <input type="hidden" name="studentId" value={student.id} />
                    <select
                      name="grade"
                      required
                      className="t-select"
                      defaultValue={student.grade ?? 1}
                    >
                      {GRADES.map((g) => (
                        <option key={g} value={g}>
                          {gradeLabel(g)}
                        </option>
                      ))}
                    </select>
                    <SubmitButton
                      className="t-btn t-btn-primary t-btn-sm"
                      pendingText="…"
                    >
                      Сақтау
                    </SubmitButton>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
