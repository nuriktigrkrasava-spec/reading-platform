import Link from "next/link";
import { listStudents } from "@/lib/db/students";
import { listBooks } from "@/lib/db/books";
import { studentBookProgress } from "@/lib/db/overview";
import { gradeLabel } from "@/lib/options";
import PageHeader from "@/components/teacher/PageHeader";
import styles from "./overview.module.css";

export const dynamic = "force-dynamic";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default async function OverviewPage() {
  const [students, books] = await Promise.all([listStudents(), listBooks()]);

  const rows = await Promise.all(
    students.map(async (student) => {
      const gradeBooks = student.grade != null
        ? books.filter((b) => b.grade === student.grade)
        : [];
      const progress = await Promise.all(
        gradeBooks.map(async (book) => ({
          bookId: book.id,
          title: book.title,
          progress: await studentBookProgress(student.id, book.id),
        })),
      );
      return { student, progress };
    }),
  );

  const activeEnrollments = rows.reduce((s, r) => s + r.progress.length, 0);

  return (
    <>
      <PageHeader
        eyebrow="Мұғалім кабинеті"
        title="Шолу"
        description="Платформа бойынша жиынтық дерек және оқушылардың кітаптары бойынша үлгерімі."
      />

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statValue}>{students.length}</div>
          <div className={styles.statLabel}>Платформадағы оқушылар</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{books.length}</div>
          <div className={styles.statLabel}>Кітапханадағы кітаптар</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{activeEnrollments}</div>
          <div className={styles.statLabel}>Оқушылар оқып жатқан кітаптар</div>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="t-empty">
          Әзірге оқушылар жоқ. Олар оқи бастаған бойда үлгерім осында
          көрінеді.
        </div>
      ) : (
        <div className={styles.students}>
          {rows.map(({ student, progress }) => (
            <section key={student.id} className={styles.student}>
              <div className={styles.studentHead}>
                <span className={styles.avatar}>{initials(student.name)}</span>
                <div>
                  <div className={styles.studentName}>{student.name}</div>
                  <div className={styles.studentMeta}>
                    {student.grade == null
                      ? "Сынып таңдалмаған"
                      : `${gradeLabel(student.grade)} · ${progress.length} кітап оқуда`}
                  </div>
                </div>
              </div>

              {progress.length === 0 ? (
                <p className={styles.noBooks}>
                  {student.grade == null
                    ? "Оқушы әлі қолданбада сыныбын таңдамаған."
                    : `${gradeLabel(student.grade)} үшін әзірге кітап жоқ.`}
                </p>
              ) : (
                <div className={styles.books}>
                  {progress.map(({ bookId, title, progress: p }) => (
                    <div key={bookId} className={styles.bookRow}>
                      <Link
                        href={`/teacher/books/${bookId}`}
                        className={styles.bookTitle}
                      >
                        {title}
                      </Link>
                      <div className={styles.progressWrap}>
                        <div className={styles.track}>
                          <div
                            className={styles.fill}
                            style={{ width: `${p.percent}%` }}
                          />
                        </div>
                        <span className={styles.percent}>{p.percent}%</span>
                      </div>
                      <span className={styles.partsCount}>
                        {p.completedParts} бөлім аяқталды
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </>
  );
}
