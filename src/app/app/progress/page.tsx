import Link from "next/link";
import { getStudentId } from "@/lib/auth/student";
import { enrolledBooksWithProgress, partsWithStatus } from "@/lib/db/studentRepo";
import { pluralWith } from "@/lib/plural";
import LoadingScreen from "@/components/student/LoadingScreen";
import { ChevronLeft, ChevronRight } from "@/components/student/icons";
import styles from "../app.module.css";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const studentId = await getStudentId();
  if (!studentId) return <LoadingScreen />;

  const enrolled = await enrolledBooksWithProgress(studentId);

  const rows = await Promise.all(
    enrolled.map(async ({ book, progress }) => {
      const parts = await partsWithStatus(studentId, book.id);
      const pendingReview = parts.filter((p) => p.status === "pending_review").length;
      return { book, progress, pendingReview };
    }),
  );

  return (
    <div className={styles.shell}>
      <Link href="/app" className={styles.back}>
        <ChevronLeft />
        Все книги
      </Link>

      <header className={styles.header}>
        <span className={styles.eyebrow}>Статистика</span>
        <h1 className={styles.title}>Мой прогресс</h1>
        <p className={styles.subtitle}>Успехи по всем вашим книгам</p>
      </header>

      {rows.length === 0 ? (
        <div className={styles.notice}>
          <span className={styles.noticeIcon}>📊</span>
          Пока нет данных о прогрессе
        </div>
      ) : (
        <div className={styles.cardList}>
          {rows.map(({ book, progress, pendingReview }) => (
            <Link key={book.id} href={`/app/books/${book.id}`} className={styles.bookCard}>
              <div className={styles.bookTop}>
                <div className={styles.bookTitle}>{book.title}</div>
                <ChevronRight className={styles.chevron} />
              </div>

              <div className={styles.progress}>
                <div className={styles.progressMeta}>
                  <span>
                    Пройдено{" "}
                    {pluralWith(progress.completedParts, "часть", "части", "частей")}
                  </span>
                  <span className={styles.progressPercent}>{progress.percent}%</span>
                </div>
                <div className={styles.bar}>
                  <div className={styles.barFill} style={{ width: `${progress.percent}%` }} />
                </div>
              </div>

              <div className={styles.statRow}>
                <div className={styles.stat}>
                  <span className={styles.statValue}>
                    {progress.averageScore.toFixed(1)}
                  </span>
                  <span className={styles.statLabel}>Средний балл</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{pendingReview}</span>
                  <span className={styles.statLabel}>На проверке</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
