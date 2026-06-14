import Link from "next/link";
import { getStudentId } from "@/lib/auth/student";
import { enrolledBooksWithProgress } from "@/lib/db/studentRepo";
import { pluralWith } from "@/lib/plural";
import LoadingScreen from "@/components/student/LoadingScreen";
import { ChevronRight } from "@/components/student/icons";
import styles from "./app.module.css";

export const dynamic = "force-dynamic";

export default async function StudentHomePage() {
  const studentId = await getStudentId();
  if (!studentId) return <LoadingScreen />;

  const enrolled = await enrolledBooksWithProgress(studentId);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Мои книги</span>
        <h1 className={styles.title}>Читальня</h1>
        <p className={styles.subtitle}>Продолжайте с того места, где остановились</p>
      </header>

      {enrolled.length === 0 ? (
        <div className={styles.notice}>
          <span className={styles.noticeIcon}>📚</span>
          Учитель ещё не открыл вам книги
        </div>
      ) : (
        <div className={styles.cardList}>
          {enrolled.map(({ book, progress }) => (
            <Link key={book.id} href={`/app/books/${book.id}`} className={styles.bookCard}>
              <div className={styles.bookTop}>
                <div>
                  <div className={styles.bookTitle}>{book.title}</div>
                  {book.description ? (
                    <div className={styles.bookDesc}>{book.description}</div>
                  ) : null}
                </div>
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
                  <div
                    className={styles.barFill}
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Link href="/app/progress" className={styles.back} style={{ marginTop: 4 }}>
        Мой прогресс
        <ChevronRight />
      </Link>
    </div>
  );
}
